<?php
// api/index.php

// Disable error display to prevent JSON corruption
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

try {
    require_once __DIR__ . '/config/db.php';
    require_once __DIR__ . '/controllers/AuthController.php';
    require_once __DIR__ . '/controllers/LeadsController.php';
    require_once __DIR__ . '/controllers/CompanyController.php';
    require_once __DIR__ . '/utils/JwtUtils.php';

    // Get the request path
    $request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $script_name = $_SERVER['SCRIPT_NAME']; // e.g. /rappel/api/index.php
    $script_dir = dirname($script_name);    // e.g. /rappel/api

    // Cross-platform directory separator cleanup
    $script_dir = str_replace('\\', '/', $script_dir);

    // Remove script path from request URI to get the relative path
    if ($script_dir !== '/' && strpos($request_uri, $script_dir) === 0) {
        $path = substr($request_uri, strlen($script_dir));
    } else {
        $path = $request_uri;
    }

    // Remove trailing slashes and split
    $path = trim($path, '/');
    $parts = explode('/', $path);

    // Filter empty parts (in case of double slashes or leading/trailing slashes)
    $parts = array_values(array_filter($parts, function($val) {
        return $val !== '';
    }));

    // Handle optional /api prefix if it's still there (e.g. from frontend proxy or .env config)
    if (!empty($parts) && $parts[0] === 'api') {
        array_shift($parts);
    }

    $controller = $parts[0] ?? '';
    $action = $parts[1] ?? '';
    $id = $parts[2] ?? '';

    switch ($controller) {
        case 'auth':
            $auth = new AuthController();
            if ($action == 'signup') {
                $auth->signup();
            } elseif ($action == 'login') {
                $auth->login();
            } elseif ($action == 'verify' || $action == 'verify-email') {
                $auth->verifyEmail();
            } elseif ($action == 'resend-activation') {
                $auth->resendActivationEmail();
            } elseif ($action == 'profile') {
                $auth->getProfile();
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found (auth action)']);
            }
            break;

        case 'verify-email':
        case 'verify':
            $auth = new AuthController();
            $auth->verifyEmail();
            break;

        case 'resend-activation':
            $auth = new AuthController();
            $auth->resendActivationEmail();
            break;

        case 'profile':
            $auth = new AuthController();
            if ($_SERVER['REQUEST_METHOD'] == 'PATCH') {
                $auth->updateProfile();
            } else {
                $auth->getProfile();
            }
            break;

        case 'leads':
            $leads = new LeadsController();
            // Map $action to $id if it looks like a UUID or if it's not a known action
            $leadId = $id;
            if (empty($leadId) && !empty($action) && $action !== 'manual') {
                $leadId = $action;
            }

            if ($_SERVER['REQUEST_METHOD'] == 'GET') {
                if ($leadId) {
                    $leads->get($leadId);
                } else {
                    $leads->getAll();
                }
            } elseif ($_SERVER['REQUEST_METHOD'] == 'POST') {
                if ($action == 'manual') {
                    $leads->createManual();
                } else {
                    $leads->create();
                }
            } elseif ($_SERVER['REQUEST_METHOD'] == 'PATCH' && $leadId) {
                $leads->update($leadId);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found (leads)', 'path' => $path, 'method' => $_SERVER['REQUEST_METHOD']]);
            }
            break;

        case 'quotes':
            $company = new CompanyController();
            if ($_SERVER['REQUEST_METHOD'] == 'GET') {
                $company->getQuotes();
            } elseif ($_SERVER['REQUEST_METHOD'] == 'POST') {
                $company->createQuote();
            } elseif ($_SERVER['REQUEST_METHOD'] == 'PATCH' && !empty($action)) {
                $company->updateQuote($action);
            } elseif ($_SERVER['REQUEST_METHOD'] == 'DELETE' && !empty($action)) {
                $company->deleteQuote($action);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found']);
            }
            break;

        case 'stats':
            $company = new CompanyController();
            $company->getStats();
            break;

        case 'payments':
            $company = new CompanyController();
            if ($action == 'create-checkout-session') {
                $company->createCheckout();
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found']);
            }
            break;

        case 'admin':
            $company = new CompanyController();
            if ($action == 'leads') {
                $company->getAdminLeads();
            } elseif ($action == 'users') {
                if ($_SERVER['REQUEST_METHOD'] == 'GET') {
                    $company->getAdminUsers();
                } elseif ($_SERVER['REQUEST_METHOD'] == 'POST' && $id == 'role') {
                    $company->updateUserRole($parts[2]);
                }
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found']);
            }
            break;

        case 'activity':
            $company = new CompanyController();
            $company->getActivity();
            break;

        case 'company':
            $company = new CompanyController();
            if ($action == 'lookup') {
                $company->lookupCompany();
            } elseif ($action == 'legal-forms') {
                $company->getLegalForms();
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found']);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} catch (Throwable $e) {
    $errorMsg = date('[Y-m-d H:i:s] ') . "API Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine() . "\n";
    file_put_contents(__DIR__ . '/api_errors.log', $errorMsg, FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error: ' . $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
}
?>
