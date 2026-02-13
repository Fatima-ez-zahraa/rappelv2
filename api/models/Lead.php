<?php
// models/Lead.php
class Lead
{
    private $conn;
    private $table_name = "leads";

    public $id;
    public $name;
    public $email;
    public $phone;
    public $address;
    public $sector;
    public $need;
    public $budget;
    public $time_slot;
    public $status;
    public $created_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function read()
    {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    id = :id,
                    name = :name,
                    email = :email,
                    phone = :phone,
                    address = :address,
                    sector = :sector,
                    need = :need,
                    budget = :budget,
                    time_slot = :time_slot,
                    status = :status";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->need = htmlspecialchars(strip_tags($this->need));

        // Bind
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':sector', $this->sector);
        $stmt->bindParam(':need', $this->need);
        $stmt->bindParam(':budget', $this->budget);
        $stmt->bindParam(':time_slot', $this->time_slot);
        $stmt->bindParam(':status', $this->status);

        if ($stmt->execute()) {
            return true;
        }
        error_log("Lead Create Failed: " . print_r($stmt->errorInfo(), true));
        return false;
    }
    // Lire les leads assignés à un prestataire
    public function readByProvider($provider_id)
    {
        $query = "SELECT l.* FROM " . $this->table_name . " l
                INNER JOIN lead_assignments la ON l.id = la.lead_id
                WHERE la.provider_id = ?
                ORDER BY l.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $provider_id);
        $stmt->execute();
        return $stmt;
    }

    // Lire les leads récents assignés à un prestataire
    public function readRecentByProvider($provider_id, $limit = 5)
    {
        $query = "SELECT l.* FROM " . $this->table_name . " l
                INNER JOIN lead_assignments la ON l.id = la.lead_id
                WHERE la.provider_id = ?
                ORDER BY l.created_at DESC
                LIMIT 0, " . (int)$limit;

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $provider_id);
        $stmt->execute();
        return $stmt;
    }

    // Créer une assignment (lier un lead à un prestataire)
    public function createAssignment($lead_id, $provider_id)
    {
        $query = "INSERT INTO lead_assignments (id, lead_id, provider_id) VALUES (:id, :lead_id, :provider_id)";
        $stmt = $this->conn->prepare($query);

        // Generate UUID for assignment
        $assignment_id = sprintf(
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

        $stmt->bindParam(':id', $assignment_id);
        $stmt->bindParam(':lead_id', $lead_id);
        $stmt->bindParam(':provider_id', $provider_id);

        if ($stmt->execute()) {
            return true;
        }
        error_log("Lead Assignment Create Failed: " . print_r($stmt->errorInfo(), true));
        return false;
    }
}
?>
