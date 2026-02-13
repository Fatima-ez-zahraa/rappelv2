<?php
// api/test_smtp.php
require_once 'utils/Mailer.php';

$mailer = new Mailer();
$testEmail = 'fatima@ycndev.com'; // User from logs
$testName = 'Test User';
$testCode = '123456';

echo "Attempting to send activation email to $testEmail...\n";
$result = $mailer->sendActivationEmail($testEmail, $testName, $testCode);

if ($result) {
    echo "✓ Email sent successfully!\n";
} else {
    echo " Email sending failed. Check api/logs/php_error.log or your error log.\n";
    // Check if we can capture more info from PHPMailer (I'll add a temporary debug echo in Mailer if needed)
}
?>
