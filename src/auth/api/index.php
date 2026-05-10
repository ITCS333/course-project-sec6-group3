<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

/* FIXED PATH */
require_once __DIR__ . '/../../../includes/db_connect.php';

$action = $_REQUEST['action'] ?? '';

switch ($action) {

    case 'login':

        $input = json_decode(file_get_contents('php://input'), true);

        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (!$email || !$password) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Missing credentials'
            ]);
            exit;
        }

        $stmt = $pdo->prepare("
            SELECT id, name, email, password, is_admin
            FROM users
            WHERE email = ?
        ");

        $stmt->execute([$email]);

        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['is_admin'] = (bool)$user['is_admin'];

            echo json_encode([
                'status' => 'success',
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'is_admin' => (bool)$user['is_admin']
                ]
            ]);

        } else {

            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid email or password'
            ]);
        }

        break;

    case 'logout':

        session_destroy();

        echo json_encode([
            'status' => 'success'
        ]);

        break;

    default:

        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid action'
        ]);
}