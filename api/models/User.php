<?php
// models/User.php

class User
{
    private $conn;
    private $table_name = "user_profiles";

    public $id;
    public $email;
    public $password;
    public $first_name;
    public $last_name;
    public $siret;
    public $company_name;
    public $role;
    public $creation_year;
    public $address;
    public $zip;
    public $city;
    public $phone;
    public $sectors;
    public $legal_form;
    public $verification_code;
    public $is_verified;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Créer un utilisateur
    public function create()
    {
        // Query (avec UUID() de MariaDB si version récente, sinon générer en PHP)
        // Ici on suppose qu'on génère l'UUID en PHP avant
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    id = :id,
                    email = :email,
                    password = :password,
                    first_name = :first_name,
                    last_name = :last_name,
                    siret = :siret,
                    company_name = :company_name,
                    role = :role,
                    creation_year = :creation_year,
                    address = :address,
                    zip = :zip,
                    city = :city,
                    phone = :phone,
                    sectors = :sectors,
                    legal_form = :legal_form,
                    verification_code = :verification_code,
                    is_verified = :is_verified";

        $stmt = $this->conn->prepare($query);

        // Nettoyage
        $this->email = htmlspecialchars(strip_tags($this->email));
        // ... autres champs

        // Bind
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':siret', $this->siret);
        $stmt->bindParam(':company_name', $this->company_name);
        $stmt->bindParam(':role', $this->role);

        // Champs optionnels (à gérer mieux dans une vraie implémentation)
        // Pour l'exemple rapide, on suppose qu'ils sont set dans l'objet
        $stmt->bindParam(':creation_year', $this->creation_year);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':zip', $this->zip);
        $stmt->bindParam(':city', $this->city);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':sectors', $this->sectors); // JSON string
        $stmt->bindParam(':legal_form', $this->legal_form);
        $stmt->bindParam(':verification_code', $this->verification_code);
        $stmt->bindParam(':is_verified', $this->is_verified);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Vérifier si email existe
    public function emailExists()
    {
        $query = "SELECT id, password, first_name, last_name, role, is_verified FROM " . $this->table_name . " WHERE email = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->password = $row['password'];
            $this->first_name = $row['first_name'];
            $this->last_name = $row['last_name'];
            $this->role = $row['role'];
            $this->is_verified = $row['is_verified'];
            return true;
        }
        return false;
    }

    // Vérifier le code d'activation et activer le compte
    public function verifyEmail($code)
    {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = ? AND verification_code = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->bindParam(2, $code);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            // Code valide, activer le compte
            $update_query = "UPDATE " . $this->table_name . " SET is_verified = 1, verification_code = NULL WHERE email = ?";
            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->bindParam(1, $this->email);
            return $update_stmt->execute();
        }
        return false;
    }

    // Mettre à jour le code de vérification
    public function updateVerificationCode($code)
    {
        $query = "UPDATE " . $this->table_name . " SET verification_code = ? WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $code);
        $stmt->bindParam(2, $this->email);
        return $stmt->execute();
    }

    // Lire les infos d'un utilisateur par ID
    public function readOne()
    {
        $query = "SELECT id, email, first_name, last_name, siret, company_name, role, creation_year, address, zip, city, phone, legal_form, is_verified 
                FROM " . $this->table_name . " 
                WHERE id = ? LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            $this->email = $row['email'];
            $this->first_name = $row['first_name'];
            $this->last_name = $row['last_name'];
            $this->siret = $row['siret'];
            $this->company_name = $row['company_name'];
            $this->role = $row['role'];
            $this->creation_year = $row['creation_year'];
            $this->address = $row['address'];
            $this->zip = $row['zip'];
            $this->city = $row['city'];
            $this->phone = $row['phone'];
            $this->legal_form = $row['legal_form'];
            $this->is_verified = $row['is_verified'];

            return true;
        }

        return false;
    }

    // Mettre à jour les infos d'un utilisateur
    public function update($data)
    {
        if (empty($data)) return true;

        $fields = [];
        $values = [];
        $allowedFields = [
            'first_name', 'last_name', 'company_name', 'siret', 'legal_form', 
            'creation_year', 'address', 'zip', 'city', 'phone', 'sectors', 'description', 'zone'
        ];

        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $fields[] = "$key = :$key";
                $values[":$key"] = $value;
            }
        }

        if (empty($fields)) return true;

        $query = "UPDATE " . $this->table_name . " SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        $values[':id'] = $this->id;

        return $stmt->execute($values);
    }
}
?>