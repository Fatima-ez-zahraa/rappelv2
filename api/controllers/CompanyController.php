<?php
require_once 'config/db.php';
require_once 'models/Lead.php';
require_once 'models/Quote.php';
require_once 'models/User.php';
require_once 'utils/JwtUtils.php';

class CompanyController {
    
    private $db;
    private $lead;
    private $quote;
    private $user;
    private $jwt;
    private $cacheFile = __DIR__ . '/../cache/legal_forms.json';
    private $cacheExpiry = 86400; // 24 hours
    
    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->lead = new Lead($this->db);
        $this->quote = new Quote($this->db);
        $this->user = new User($this->db);
        $this->jwt = new JwtUtils();
    }

    /**
     * Middleware simple pour vérifier le token
     */
    private function authenticate()
    {
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
        $authHeader = $headers['Authorization'] ?? 
                      $headers['authorization'] ?? 
                      $_SERVER['HTTP_AUTHORIZATION'] ?? 
                      $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 
                      $_SERVER['HTTP_AUTHORISATION'] ?? 
                      $_SERVER['REDIRECT_HTTP_AUTHORISATION'] ?? 
                      '';
        

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $payload = $this->jwt->validate($token);
            if ($payload) {
                return (array)$payload;
            }
        }

        http_response_code(401);
        echo json_encode(["error" => "Non autorisé"]);
        throw new Exception("Unauthorized");
    }

    /**
     * Get quotes for the authenticated provider
     */
    public function getQuotes() {
        $auth = $this->authenticate();
        $stmt = $this->quote->readByProvider($auth['id']);
        $quotes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($quotes);
    }

    /**
     * Create a new quote
     */
    public function createQuote() {
        $auth = $this->authenticate();
        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->client_name) || empty($data->amount)) {
            http_response_code(400);
            echo json_encode(["error" => "Données incomplètes"]);
            return;
        }

        $this->quote->id = $this->generateUuid();
        $this->quote->provider_id = $auth['id'];
        $this->quote->client_name = $data->client_name;
        $this->quote->project_name = $data->project_name ?? 'Nouveau Projet';
        $this->quote->amount = $data->amount;
        $this->quote->items_count = $data->items_count ?? 1;
        $this->quote->status = 'attente_client';

        if ($this->quote->create()) {
            http_response_code(201);
            echo json_encode(["message" => "Devis créé", "id" => $this->quote->id]);
        } else {
            http_response_code(503);
            echo json_encode(["error" => "Erreur lors de la création du devis"]);
        }
    }

    public function updateQuote($id)
    {
        $auth = $this->authenticate();
        $data = json_decode(file_get_contents("php://input"));

        if (!$data) {
            http_response_code(400);
            echo json_encode(["error" => "Données manquantes"]);
            return;
        }

        $this->quote->id = $id;
        $this->quote->provider_id = $auth['id'];

        if (!$this->quote->readOne()) {
            http_response_code(404);
            echo json_encode(["error" => "Devis non trouvé ou non autorisé"]);
            return;
        }

        $this->quote->client_name = $data->client_name ?? $this->quote->client_name;
        $this->quote->project_name = $data->project_name ?? $this->quote->project_name;
        $this->quote->amount = $data->amount ?? $this->quote->amount;
        $this->quote->items_count = $data->items_count ?? $this->quote->items_count;
        $this->quote->status = $data->status ?? $this->quote->status;

        if ($this->quote->update()) {
            echo json_encode(["message" => "Devis mis à jour"]);
        } else {
            http_response_code(503);
            echo json_encode(["error" => "Erreur lors de la mise à jour du devis"]);
        }
    }

    public function deleteQuote($id)
    {
        $auth = $this->authenticate();
        $this->quote->id = $id;
        $this->quote->provider_id = $auth['id'];

        if ($this->quote->delete()) {
            echo json_encode(["message" => "Devis supprimé"]);
        } else {
            http_response_code(503);
            echo json_encode(["error" => "Erreur lors de la suppression du devis"]);
        }
    }

    /**
     * Get statistics for the dashboard
     */
    public function getStats() {
        $auth = $this->authenticate();
        
        // Basic stats: count leads, count quotes, total quotes amount
        $leadsStmt = $this->lead->readByProvider($auth['id']);
        $leadsCount = $leadsStmt->rowCount();

        $quotesStmt = $this->quote->readByProvider($auth['id']);
        $quotesData = $quotesStmt->fetchAll(PDO::FETCH_ASSOC);
        $quotesCount = count($quotesData);
        $totalAmount = array_reduce($quotesData, function($carry, $item) {
            return $carry + $item['amount'];
        }, 0);

        $pendingLeadsCount = array_reduce($leadsStmt->fetchAll(PDO::FETCH_ASSOC), function($carry, $item) {
            return $carry + ($item['status'] === 'pending' ? 1 : 0);
        }, 0);

        echo json_encode([
            "totalLeads" => $leadsCount,
            "totalQuotes" => $quotesCount,
            "totalAmount" => $totalAmount,
            "totalRevenue" => $totalAmount, // Map to frontend expectation
            "pendingLeads" => $pendingLeadsCount,
            "revenueGrowth" => 0,          // Placeholder (needs history)
            "conversionRate" => $leadsCount > 0 ? round(($quotesCount / $leadsCount) * 100, 1) : 0,
            "weeklyData" => [],
            "monthlyData" => [],
            "annualData" => []
        ]);
    }

    /**
     * Get recent activity
     */
    public function getActivity() {
        $auth = $this->authenticate();
        
        // Fetch recent leads and recent quotes to merge into an activity feed
        $recentLeadsStmt = $this->lead->readRecentByProvider($auth['id'], 5);
        $recentLeads = $recentLeadsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $recentQuotesStmt = $this->quote->readByProvider($auth['id']); // already ordered by date
        $recentQuotes = array_slice($recentQuotesStmt->fetchAll(PDO::FETCH_ASSOC), 0, 5);

        $activity = [];
        foreach ($recentLeads as $l) {
            $activity[] = [
                "id" => $l['id'],
                "type" => "lead",
                "title" => "Nouveau Lead: " . $l['name'],
                "date" => $l['created_at'],
                "subtitle" => "Secteur: " . $l['sector']
            ];
        }
        foreach ($recentQuotes as $q) {
            $activity[] = [
                "id" => $q['id'],
                "type" => "quote",
                "title" => "Devis créé pour " . $q['client_name'],
                "date" => $q['created_at'],
                "subtitle" => "Montant: " . $q['amount'] . "€ (" . $q['status'] . ")"
            ];
        }

        // Sort combined activity by date DESC
        usort($activity, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        echo json_encode(array_slice($activity, 0, 10));
    }

    /**
     * Admin: Get all leads
     */
    public function getAdminLeads() {
        $auth = $this->authenticate();
        if ($auth['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["error" => "Accès refusé"]);
            return;
        }

        $stmt = $this->lead->read();
        $leads = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($leads);
    }

    /**
     * Admin: Get all users
     */
    public function getAdminUsers() {
        $auth = $this->authenticate();
        if ($auth['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["error" => "Accès refusé"]);
            return;
        }

        $query = "SELECT id, email, first_name, last_name, role, company_name, is_verified, created_at FROM user_profiles ORDER BY created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($users);
    }

    /**
     * Admin: Update user role
     */
    public function updateUserRole($userId) {
        $auth = $this->authenticate();
        if ($auth['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["error" => "Accès refusé"]);
            return;
        }

        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->role)) {
            http_response_code(400);
            echo json_encode(["error" => "Rôle manquant"]);
            return;
        }

        $query = "UPDATE user_profiles SET role = ? WHERE id = ?";
        $stmt = $this->db->prepare($query);
        if ($stmt->execute([$data->role, $userId])) {
            echo json_encode(["message" => "Rôle mis à jour"]);
        } else {
            http_response_code(503);
            echo json_encode(["error" => "Échec de la mise à jour"]);
        }
    }

    /**
     * Stripe Checkout Session Placeholder
     */
    public function createCheckout() {
        $this->authenticate();
        // Placeholder implementation
        echo json_encode([
            "id" => "cs_test_" . uniqid(),
            "url" => "https://checkout.stripe.com/pay/placeholder"
        ]);
    }

    private function generateUuid() {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    /**
     * Lookup company by SIRET/SIREN with Kipoced API
     */
    public function lookupCompany() {
        $input = $_GET['siret'] ?? $_GET['siren'] ?? '';
        $input = preg_replace('/\s+/', '', $input);
        
        // Extract SIREN (first 9 digits) to use with Kipoced identity endpoint
        $siren = substr($input, 0, 9);
        
        if (!preg_match('/^\d{9}$/', $siren)) {
            http_response_code(400);
            echo json_encode(["error" => "Format SIREN (9 chiffres) ou SIRET (14 chiffres) invalide"]);
            return;
        }

        $companyData = $this->callKipocedApi($siren);
        
        if (!$companyData || empty($companyData['identite'])) {
            http_response_code(404);
            echo json_encode(["error" => "Entreprise non trouvée"]);
            return;
        }

        $identite = $companyData['identite'];

        // Extract year from dcren (usually YYYY-MM-DD)
        $creationYear = null;
        if (isset($identite['dcren'])) {
            if (preg_match('/^(\d{4})/', $identite['dcren'], $matches)) {
                $creationYear = $matches[1];
            }
        }

        // Mapping
        $mappedData = [
            'nomen_long' => $identite['nomen_long'] ?? '',
            'dcren' => $creationYear,
            'codpos' => $identite['codpos'] ?? '',
            'geo_adresse' => $identite['geo_adresse'] ?? '',
            'ville' => $identite['libcom'] ?? '',
            'cj' => $identite['cj'] ?? null,
            'siret' => $identite['siret'] ?? $input,
            'siren' => $identite['siren'] ?? $siren,
        ];

        echo json_encode($mappedData);
    }

    /**
     * Helper to call the Kipoced API
     */
    private function callKipocedApi($siren) {
        $apiKey = "wa05ila67f2003a40c02f0flv43ax3a1";
        $url = "https://api.kipoced.com/v1/identite?siren=" . urlencode($siren) . "&api_key=" . $apiKey;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0");
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        curl_close($ch);

        if ($response === FALSE) return null;

        $data = json_decode($response, true);
        if ($data && $data['success'] && isset($data['result'])) {
            return $data['result'];
        }
        
        return null;
    }
    
    /**
     * Get legal forms list (cached from Kipoced API)
     */
    public function getLegalForms() {
        // Check if we have a valid cache
        if (file_exists($this->cacheFile)) {
            $cacheAge = time() - filemtime($this->cacheFile);
            if ($cacheAge < $this->cacheExpiry) {
                // Return cached data
                $cached = file_get_contents($this->cacheFile);
                header('Content-Type: application/json');
                echo $cached;
                return;
            }
        }
        
        // Fetch from Kipoced API
        $url = "https://api.kipoced.com/v1/listeEven?&api_key=wa05ila67f2003a40c02f0flv43ax3a1";
        
        $opts = [
            "http" => [
                "method" => "GET",
                "header" => "User-Agent: Rappel-App/1.0\r\n"
            ]
        ];
        $context = stream_context_create($opts);

        $response = @file_get_contents($url, false, $context);

        if ($response === FALSE) {
            // If API fails, return minimal hardcoded list
            $fallback = [
                ['code' => '5710', 'libelle' => 'SAS'],
                ['code' => '5720', 'libelle' => 'SASU'],
                ['code' => '5499', 'libelle' => 'SARL'],
                ['code' => '1000', 'libelle' => 'EI']
            ];
            echo json_encode(['cj' => $fallback]);
            return;
        }

        $data = json_decode($response, true);
        
        // Extract and format legal forms
        $legalForms = [];
        if (isset($data['cj']) && is_array($data['cj'])) {
            $legalForms = $data['cj'];
        }
        
        $result = ['cj' => $legalForms];
        $resultJson = json_encode($result);
        
        // Cache the result
        $cacheDir = dirname($this->cacheFile);
        if (!file_exists($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }
        file_put_contents($this->cacheFile, $resultJson);
        
        header('Content-Type: application/json');
        echo $resultJson;
    }
}
?>
