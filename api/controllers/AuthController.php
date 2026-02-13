<?php
// controllers/AuthController.php

require_once 'config/db.php';
require_once 'models/User.php';
require_once 'utils/JwtUtils.php';
require_once 'utils/Mailer.php';

class AuthController
{
    private $db;
    private $user;
    private $jwt;
    private $mailer;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->user = new User($this->db);
        $this->jwt = new JwtUtils();
        $this->mailer = new Mailer();
    }

    public function signup()
    {
        // Récupérer les données brutes POST
        $data = json_decode(file_get_contents("php://input"));

        if (
            !empty($data->email) &&
            !empty($data->password)
        ) {
            // Vérifier existance
            $this->user->email = $data->email;
            if ($this->user->emailExists()) {
                http_response_code(400);
                echo json_encode(["error" => "Email déjà utilisé."]);
                return;
            }

            // Générer UUID (méthode simple v4)
            $this->user->id = sprintf(
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

            $this->user->password = password_hash($data->password, PASSWORD_BCRYPT);
            $this->user->first_name = $data->firstName ?? '';
            $this->user->last_name = $data->lastName ?? '';
            $this->user->siret = $data->siret ?? null;
            $this->user->company_name = $data->companyName ?? null;
            $this->user->role = 'provider'; // Par défaut

            // Autres champs
            $this->user->creation_year = $data->creationYear ?? null;
            $this->user->address = $data->address ?? null;
            $this->user->zip = $data->zip ?? null;
            $this->user->city = $data->city ?? null;
            $this->user->phone = $data->phone ?? null;
            $this->user->legal_form = $data->legalForm ?? null;

            // JSON Encode sectors
            $this->user->sectors = isset($data->sectors) ? json_encode($data->sectors) : json_encode([]);

            // Générer le code de vérification (6 chiffres)
            $verification_code = sprintf("%06d", mt_rand(0, 999999));
            $this->user->verification_code = $verification_code;
            $this->user->is_verified = 0;

            if ($this->user->create()) {
                http_response_code(201);

                $token_payload = [
                    "id" => $this->user->id,
                    "email" => $this->user->email,
                    "role" => $this->user->role,
                    "exp" => time() + (60 * 60 * 24) // 24h
                ];
                $token = $this->jwt->generate($token_payload);

                // Envoyer l'email d'activation
                $email_sent = $this->mailer->sendActivationEmail(
                    $this->user->email,
                    $this->user->first_name . ' ' . $this->user->last_name,
                    $verification_code
                );

                if ($email_sent) {
                    echo json_encode([
                        "message" => "Utilisateur créé. Un email d'activation a été envoyé.",
                        "user" => [
                            "id" => $this->user->id,
                            "email" => $this->user->email,
                            "first_name" => $this->user->first_name,
                            "last_name" => $this->user->last_name,
                            "role" => $this->user->role
                        ],
                        "session" => [
                            "access_token" => $token
                        ]
                    ]);
                } else {
                    http_response_code(201); // User created but email failed
                    echo json_encode([
                        "message" => "Utilisateur créé, mais l'envoi de l'email d'activation a échoué. Veuillez contacter le support ou demander un renvoi de code.",
                        "emailError" => true,
                        "user" => [
                            "id" => $this->user->id,
                            "email" => $this->user->email
                        ],
                        "session" => [
                            "access_token" => $token
                        ]
                    ]);
                }
            } else {
                http_response_code(503);
                echo json_encode(["error" => "Impossible de créer l'utilisateur."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Données incomplètes."]);
        }
    }

    public function login()
    {
        $data = json_decode(file_get_contents("php://input"));

        $this->user->email = $data->email ?? '';

        if ($this->user->emailExists()) {
            // Vérifier si le compte est activé
            if (!$this->user->is_verified) {
                http_response_code(403);
                echo json_encode([
                    "error" => "Compte non vérifié. Veuillez vérifier votre email.",
                    "requiresVerification" => true
                ]);
                return;
            }

            if (password_verify($data->password, $this->user->password)) {
                $token_payload = [
                    "id" => $this->user->id,
                    "email" => $this->user->email,
                    "role" => $this->user->role,
                    "exp" => time() + (60 * 60 * 24)
                ];
                $token = $this->jwt->generate($token_payload);

                http_response_code(200);
                echo json_encode([
                    "user" => [
                        "id" => $this->user->id,
                        "email" => $this->user->email,
                        "first_name" => $this->user->first_name,
                        "last_name" => $this->user->last_name,
                        "role" => $this->user->role,
                        "is_verified" => (bool)$this->user->is_verified
                    ],
                    "session" => [
                        "access_token" => $token
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["error" => "Mot de passe incorrect."]);
            }
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Email introuvable."]);
        }
    }

    public function verify()
    {
        $this->verifyEmail();
    }

    public function verifyEmail()
    {
        try {
            $data = json_decode(file_get_contents("php://input"));

            if (empty($data->email) || empty($data->code)) {
                http_response_code(400);
                echo json_encode(["error" => "Email et code requis."]);
                return;
            }

            $this->user->email = $data->email;

            if ($this->user->verifyEmail($data->code)) {
                // Code valide, compte activé
                // Récupérer les données de l'utilisateur
                if ($this->user->emailExists()) {
                    $token_payload = [
                        "id" => $this->user->id,
                        "email" => $this->user->email,
                        "role" => $this->user->role,
                        "exp" => time() + (60 * 60 * 24)
                    ];
                    $token = $this->jwt->generate($token_payload);

                    http_response_code(200);
                    echo json_encode([
                        "message" => "Votre compte a été activé avec succès.",
                        "user" => [
                            "id" => $this->user->id,
                            "email" => $this->user->email,
                            "first_name" => $this->user->first_name,
                            "last_name" => $this->user->last_name,
                            "role" => $this->user->role,
                            "is_verified" => true
                        ],
                        "session" => [
                            "access_token" => $token
                        ]
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Email introuvable après activation."]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Code de vérification invalide."]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erreur interne: " . $e->getMessage()]);
        }
    }

    public function resendActivationEmail()
    {
        try {
            $data = json_decode(file_get_contents("php://input"));

            if (empty($data->email)) {
                http_response_code(400);
                echo json_encode(["error" => "Email requis."]);
                return;
            }

            $this->user->email = $data->email;

            if ($this->user->emailExists()) {
                // Vérifier si déjà vérifié
                if ($this->user->is_verified) {
                    http_response_code(400);
                    echo json_encode(["error" => "Compte déjà activé."]);
                    return;
                }

                // Générer un nouveau code
                $verification_code = sprintf("%06d", mt_rand(0, 999999));
                
                if ($this->user->updateVerificationCode($verification_code)) {
                    // Envoyer l'email
                    $email_sent = $this->mailer->sendActivationEmail(
                        $this->user->email,
                        $this->user->first_name . ' ' . $this->user->last_name,
                        $verification_code
                    );

                    if ($email_sent) {
                        http_response_code(200);
                        echo json_encode(["message" => "Email de vérification renvoyé."]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["error" => "Erreur lors de l'envoi de l'email."]);
                    }
                } else {
                    http_response_code(503);
                    echo json_encode(["error" => "Erreur lors de la mise à jour du code."]);
                }
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Email introuvable."]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erreur interne: " . $e->getMessage()]);
        }
    }

    public function getProfile()
    {
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_AUTHORISATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORISATION'] ?? '';

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $payload = $this->jwt->validate($token);
            if ($payload) {
                $payload = (array)$payload;
                $this->user->id = $payload['id'];
                if ($this->user->readOne()) {
                    http_response_code(200);
                    echo json_encode([
                        "user" => [
                            "id" => $this->user->id,
                            "email" => $this->user->email,
                            "first_name" => $this->user->first_name,
                            "last_name" => $this->user->last_name,
                            "role" => $this->user->role,
                            "company_name" => $this->user->company_name,
                            "siret" => $this->user->siret,
                            "is_verified" => (bool)$this->user->is_verified,
                            "phone" => $this->user->phone,
                            "address" => $this->user->address,
                            "city" => $this->user->city,
                            "zip" => $this->user->zip,
                            "creation_year" => $this->user->creation_year,
                            "legal_form" => $this->user->legal_form
                        ]
                    ]);
                    return;
                }
            }
        }

        http_response_code(401);
        echo json_encode(["error" => "Non autorisé"]);
    }

    public function updateProfile()
    {
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_AUTHORISATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORISATION'] ?? '';

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $payload = $this->jwt->validate($token);
            if ($payload) {
                $payload = (array)$payload;
                $this->user->id = $payload['id'];
                $data = json_decode(file_get_contents("php://input"), true);
                
                if ($this->user->update($data)) {
                    if ($this->user->readOne()) {
                        http_response_code(200);
                        echo json_encode([
                            "message" => "Profil mis à jour.",
                            "user" => [
                                "id" => $this->user->id,
                                "email" => $this->user->email,
                                "first_name" => $this->user->first_name,
                                "last_name" => $this->user->last_name,
                                "role" => $this->user->role,
                                "company_name" => $this->user->company_name,
                                "siret" => $this->user->siret,
                                "is_verified" => (bool)$this->user->is_verified,
                                "phone" => $this->user->phone,
                                "address" => $this->user->address,
                                "city" => $this->user->city,
                                "zip" => $this->user->zip,
                                "creation_year" => $this->user->creation_year,
                                "legal_form" => $this->user->legal_form
                            ]
                        ]);
                    } else {
                        http_response_code(200);
                        echo json_encode(["message" => "Profil mis à jour."]);
                    }
                } else {
                    http_response_code(503);
                    echo json_encode(["error" => "Erreur lors de la mise à jour."]);
                }
                return;
            }
        }

        http_response_code(401);
        echo json_encode(["error" => "Non autorisé"]);
    }
}
?>