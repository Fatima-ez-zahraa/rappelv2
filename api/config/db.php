<?php
// config/db.php

class Database
{
    private $host = "127.0.0.1";
    private $username = "root";
    private $password = "";
    private $port = "3307"; 
    public $conn;

    public function getConnection()
    {
        $this->conn = null;
        $this->loadEnv();

        if (empty($this->db_name)) {
             http_response_code(500);
             echo json_encode(["error" => "Configuration de la base de données manquante."]);
             exit();
        }

        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $exception) {
            http_response_code(500);
            echo json_encode(["error" => "Erreur de connexion à la base de données: " . $exception->getMessage()]);
            exit();
        }

        return $this->conn;
    }

    private function loadEnv()
    {
        $envPath = __DIR__ . '/../../.env';
        if (file_exists($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0)
                    continue;
                if (strpos($line, '=') !== false) {
                    list($name, $value) = explode('=', $line, 2);
                    $name = trim($name);
                    $value = trim($value);
                    
                    // Populate $_ENV for other components
                    $_ENV[$name] = $value;

                    if ($name === 'DB_HOST')
                        $this->host = $value;
                    if ($name === 'DB_NAME')
                        $this->db_name = $value;
                    if ($name === 'DB_USER')
                        $this->username = $value;
                    if ($name === 'DB_PASS')
                        $this->password = $value;
                    if ($name === 'DB_PORT')
                        $this->port = $value;
                }
            }
        }
    }
}
?>