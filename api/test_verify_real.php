<?php
// api/test_verify_real.php
// This script simulates a request to the verify-email endpoint

$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/auth/verify-email';
$_SERVER['SCRIPT_NAME'] = '/api/index.php';

// Mock the body
$body = json_encode([
    'email' => 'fatima@ycndev.com',
    'code' => '731859'
]);


echo "Starting test...\n";

$ch = curl_init("http://localhost/rappel/api/auth/verify-email");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$info = curl_getinfo($ch);

echo "Status Code: " . $info['http_code'] . "\n";
echo "Response body: [" . $response . "]\n";

if (curl_errno($ch)) {
    echo "CURL Error: " . curl_error($ch) . "\n";
}

curl_close($ch);
?>
