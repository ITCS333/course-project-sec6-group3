<?php

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

/* FIXED PATH */
require_once __DIR__ . '/../../../includes/db_connect.php';

if (!isset($_SESSION['user_id'])) {

    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized'
    ]);

    exit;
}

if (!isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {

    echo json_encode([
        'status' => 'error',
        'message' => 'Admin access required'
    ]);

    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':

        $stmt = $pdo->query("
            SELECT id, name, email, is_admin
            FROM users
            ORDER BY id
        ");

        $users = $stmt->fetchAll();

        echo json_encode([
            'status' => 'success',
            'users' => $users
        ]);

        break;

    case 'POST':

        $input = json_decode(file_get_contents('php://input'), true);

        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');
        $is_admin = (int)($input['is_admin'] ?? 0);

        if (!$name || !$email || !$password) {

            echo json_encode([
                'status' => 'error',
                'message' => 'Missing fields'
            ]);

            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            INSERT INTO users(name, email, password, is_admin)
            VALUES (?, ?, ?, ?)
        ");

        $stmt->execute([
            $name,
            $email,
            $hashedPassword,
            $is_admin
        ]);

        echo json_encode([
            'status' => 'success'
        ]);

        break;

    default:

        echo json_encode([
            'status' => 'error',
            'message' => 'Unsupported request'
        ]);
}