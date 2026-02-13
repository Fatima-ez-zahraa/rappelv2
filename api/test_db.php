<?php
// api/test_db.php
require_once 'config/db.php';

echo "Database Setup & Verification\n";
echo "=============================\n";

$host = "localhost";
$port = "3307";
$username = "root";
$password = "";
$dbname = "rappel";

try {
    // 1. Connect to MySQL Server (no DB)
    echo "[1/4] Connecting to MySQL server ($host:$port)... ";
    $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
    $conn = new PDO($dsn, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "OK\n";

    // 2. Check/Create Database
    echo "[2/4] Checking database '$dbname'... ";
    $stmt = $conn->query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = '$dbname'");
    if ($stmt->fetch()) {
        echo "Exists\n";
    } else {
        echo "Missing. Creating... ";
        $conn->exec("CREATE DATABASE `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "Created\n";
    }

    // 3. Connect to Database
    echo "[3/4] Connecting to database '$dbname'... ";
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $db = new PDO($dsn, $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "OK\n";

    // 4. Check Tables & Import Schema
    echo "[4/4] Checking tables... ";
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (count($tables) > 0) {
        echo "Found " . count($tables) . " tables: " . implode(", ", $tables) . "\n";
    } else {
        echo "No tables found. Importing schema... \n";
        $schemaPath = __DIR__ . '/../database/schema.mariadb.sql';
        if (file_exists($schemaPath)) {
            $sql = file_get_contents($schemaPath);

            
            try {
                $db->exec($sql);
                echo "Schema imported successfully.\n";
            } catch (PDOException $e) {
                echo "Error importing schema (trying split mode): " . $e->getMessage() . "\n";
                // Fallback: Split by ; and execute
                 $queries = explode(';', $sql);
                 foreach ($queries as $query) {
                     $query = trim($query);
                     if (!empty($query)) {
                         try {
                            $db->exec($query);
                         } catch (Exception $e2) {
                             // Ignore empty query errors
                             echo "  Warning on query: " . substr($query, 0, 50) . "... -> " . $e2->getMessage() . "\n";
                         }
                     }
                 }
                 echo "Schema import completed (check warnings).\n";
            }
        } else {
            echo "Schema file not found at $schemaPath\n";
        }
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
