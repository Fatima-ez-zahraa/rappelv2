<?php
// controllers/LeadsController.php

require_once 'config/db.php';
require_once 'models/Lead.php';
require_once 'utils/JwtUtils.php';
require_once 'utils/Mailer.php';

class LeadsController
{
    private $db;
    private $lead;
    private $jwt;
    private $table_name = "leads";

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->lead = new Lead($this->db);
        $this->jwt = new JwtUtils();
    }

    // Middleware simple pour vérifier le token
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

        if (preg_match('/Bearer\\s(\\S+)/', $authHeader, $matches)) {
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

    public function getAll()
    {
        $auth = $this->authenticate();
        
        // If provider, only show their leads. If admin, show all?
        // Let's assume this controller is for the provider dashboard.
        $stmt = $this->lead->readByProvider($auth['id']);
        $num = $stmt->rowCount();

        if ($num > 0) {
            $leads_arr = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $leads_arr[] = $row;
            }
            echo json_encode($leads_arr);
        } else {
            echo json_encode([]);
        }
    }

    public function create($returnResult = false)
    {
        $data = json_decode(file_get_contents("php://input"));
        // For internal calls (manual creation), data might be passed directly
        if (!$data && property_exists($this, 'tempData')) {
            $data = $this->tempData;
        }

        if (!empty($data->name) && !empty($data->phone)) {
            // UUID v4
            $this->lead->id = sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0xffff)
            );

            $this->lead->name = $data->name;
            $this->lead->phone = $data->phone;
            $this->lead->email = $data->email ?? null;
            $this->lead->sector = $data->sector ?? 'Général';
            $this->lead->need = $data->need ?? '';
            $this->lead->time_slot = $data->time_slot ?? 'Non spécifié';
            $this->lead->budget = $data->budget ?? 0;
            $this->lead->status = 'pending';
            $this->lead->address = $data->address ?? '';

            if ($this->lead->create()) {
                if ($returnResult) return $this->lead->id;

                http_response_code(201);
                 
                // Send Email
                $mailer = new Mailer();
                if ($this->lead->email) {
                    $mailer->sendConfirmation($this->lead->email, $this->lead->name, [
                        'need' => $this->lead->need,
                        'time_slot' => $this->lead->time_slot,
                        'phone' => $this->lead->phone
                    ]);
                }

                echo json_encode(["message" => "Lead créé.", "id" => $this->lead->id]);
            } else {
                if ($returnResult) return false;
                http_response_code(503);
                echo json_encode(["error" => "Impossible de créer le lead."]);
            }
        } else {
            if ($returnResult) return false;
            http_response_code(400);
            echo json_encode(["error" => "Données incomplètes (nom et téléphone requis)."]);
        }
    }

    public function get($id)
    {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($row);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Lead non trouvé."]);
        }
    }

    public function createManual()
    {
        $auth = $this->authenticate();
        $leadId = $this->create(true); 

        if ($leadId) {
            if ($this->lead->createAssignment($leadId, $auth['id'])) {
                http_response_code(201);
                echo json_encode(["message" => "Lead manuel créé et assigné.", "id" => $leadId]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Lead créé mais échec de l'assignation."]);
            }
        } else {
            // Error response already handled by create(true) if it had echoed, 
            // but we need to ensure some response if it returned false.
            if (http_response_code() == 200) { // Default
                http_response_code(400);
                echo json_encode(["error" => "Échec de la création du lead manuel."]);
            }
        }
    }

    public function update($id)
    {
        $this->authenticate();
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data)) {
            http_response_code(400);
            echo json_encode(["error" => "Données manquantes."]);
            return;
        }

        $fields = [];
        $values = [];
        foreach ($data as $key => $value) {
            // Filter allowed keys for security
            if (in_array($key, ['name', 'email', 'phone', 'address', 'sector', 'need', 'budget', 'status', 'time_slot'])) {
                $fields[] = "$key = ?";
                $values[] = $value;
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(["error" => "Aucun champ valide à mettre à jour."]);
            return;
        }

        $values[] = $id;
        $query = "UPDATE " . $this->table_name . " SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $this->db->prepare($query);

        if ($stmt->execute($values)) {
            echo json_encode(["message" => "Lead mis à jour."]);
        } else {
            http_response_code(503);
            echo json_encode(["error" => "Échec de la mise à jour."]);
        }
    }
}
?>