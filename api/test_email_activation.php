<?php
// Test script to verify database schema and email configuration
require_once 'config/db.php';
require_once 'utils/Mailer.php';

echo "=== Database Schema Verification ===\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();

    // Check table structure
    $stmt = $db->query('DESCRIBE user_profiles');
    echo "Table structure for 'user_profiles':\n";
    echo str_pad("Field", 25) . str_pad("Type", 20) . str_pad("Null", 10) . "Default\n";
    echo str_repeat("-", 70) . "\n";
    
    $has_verification_code = false;
    $has_is_verified = false;
    
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo str_pad($row['Field'], 25) . 
             str_pad($row['Type'], 20) . 
             str_pad($row['Null'], 10) . 
             ($row['Default'] ?? 'NULL') . "\n";
             
        if ($row['Field'] === 'verification_code') $has_verification_code = true;
        if ($row['Field'] === 'is_verified') $has_is_verified = true;
    }
    
    echo "\n";
    echo "✓ verification_code column: " . ($has_verification_code ? "EXISTS" : "MISSING") . "\n";
    echo "✓ is_verified column: " . ($has_is_verified ? "EXISTS" : "MISSING") . "\n";
    
    if (!$has_verification_code || !$has_is_verified) {
        echo "\n WARNING: Missing columns. Run the migration:\n";
        echo "   php alter_user_profiles.php\n";
    }
    
} catch(PDOException $e) {
    echo " Database Error: " . $e->getMessage() . "\n";
}

echo "\n=== Email Configuration Test ===\n\n";

try {
    $mailer = new Mailer();
    echo "✓ Mailer class loaded successfully\n";
    echo "✓ SMTP configuration loaded from .env\n";
    echo "\n To test email sending, create a test account via the signup endpoint.\n";
} catch(Exception $e) {
    echo " Mailer Error: " . $e->getMessage() . "\n";
}

echo "\n=== API Endpoints ===\n\n";
echo "Available endpoints:\n";
echo "  POST /api/auth/signup           - Create account + send activation email\n";
echo "  POST /api/auth/verify-email     - Verify email with code\n";
echo "  POST /api/auth/resend-activation - Resend activation email\n";
echo "  POST /api/auth/login            - Login (requires verified account)\n";

echo "\n=== Test Complete ===\n";
?>
