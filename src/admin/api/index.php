<?php

session_start();

header('Content-Type: application/json');

require_once __DIR__ . '/../../../includes/db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

/*
|--------------------------------------------------------------------------
| READ JSON INPUT
|--------------------------------------------------------------------------
*/

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    $input = [];
}

/*
|--------------------------------------------------------------------------
| GET USER ID
|--------------------------------------------------------------------------
*/

$id = $_GET['id'] ?? null;

/*
|--------------------------------------------------------------------------
| GET ALL USERS / GET SINGLE USER / SEARCH
|--------------------------------------------------------------------------
*/

if ($method === 'GET') {

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    if (isset($_GET['search'])) {

        $search = '%' . $_GET['search'] . '%';

        $stmt = $pdo->prepare("
            SELECT id, name, email, is_admin
            FROM users
            WHERE name LIKE ?
               OR email LIKE ?
            ORDER BY id
        ");

        $stmt->execute([$search, $search]);

        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $users
        ]);

        exit;
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY ID
    |--------------------------------------------------------------------------
    */

    if ($id) {

        $stmt = $pdo->prepare("
            SELECT id, name, email, is_admin
            FROM users
            WHERE id = ?
        ");

        $stmt->execute([$id]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {

            http_response_code(404);

            echo json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);

            exit;
        }

        echo json_encode([
            'success' => true,
            'data' => $user
        ]);

        exit;
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->query("
        SELECT id, name, email, is_admin
        FROM users
        ORDER BY id
    ");

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $users
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
*/

if ($method === 'POST') {

    /*
    |--------------------------------------------------------------------------
    | CHANGE PASSWORD
    |--------------------------------------------------------------------------
    */

    if (isset($input['current_password'])) {

        $userId = $input['id'] ?? null;

        $currentPassword =
            trim($input['current_password'] ?? '');

        $newPassword =
            trim($input['new_password'] ?? '');

        if (strlen($newPassword) < 8) {

            http_response_code(400);

            echo json_encode([
                'success' => false,
                'message' => 'Password too short'
            ]);

            exit;
        }

        $stmt = $pdo->prepare("
            SELECT password
            FROM users
            WHERE id = ?
        ");

        $stmt->execute([$userId]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (
            !$user ||
            !password_verify($currentPassword, $user['password'])
        ) {

            http_response_code(401);

            echo json_encode([
                'success' => false,
                'message' => 'Wrong password'
            ]);

            exit;
        }

        $hashed =
            password_hash($newPassword, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            UPDATE users
            SET password = ?
            WHERE id = ?
        ");

        $stmt->execute([$hashed, $userId]);

        echo json_encode([
            'success' => true
        ]);

        exit;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE USER
    |--------------------------------------------------------------------------
    */

    $name =
        trim($input['name'] ?? '');

    $email =
        trim($input['email'] ?? '');

    $password =
        trim($input['password'] ?? '');

    $isAdmin =
        (int)($input['is_admin'] ?? 0);

    if (!$name || !$email || !$password) {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Missing fields'
        ]);

        exit;
    }

    if (strlen($password) < 8) {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Password too short'
        ]);

        exit;
    }

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE EMAIL
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT id
        FROM users
        WHERE email = ?
    ");

    $stmt->execute([$email]);

    if ($stmt->fetch()) {

        http_response_code(409);

        echo json_encode([
            'success' => false,
            'message' => 'Email already exists'
        ]);

        exit;
    }

    $hashed =
        password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO users(name, email, password, is_admin)
        VALUES (?, ?, ?, ?)
    ");

    $stmt->execute([
        $name,
        $email,
        $hashed,
        $isAdmin
    ]);

    http_response_code(201);

    echo json_encode([
        'success' => true
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
*/

if ($method === 'PUT') {

    if (!$id) {

        http_response_code(404);

        echo json_encode([
            'success' => false
        ]);

        exit;
    }

    $stmt = $pdo->prepare("
        SELECT id
        FROM users
        WHERE id = ?
    ");

    $stmt->execute([$id]);

    if (!$stmt->fetch()) {

        http_response_code(404);

        echo json_encode([
            'success' => false
        ]);

        exit;
    }

    $name =
        trim($input['name'] ?? '');

    $email =
        trim($input['email'] ?? '');

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE EMAIL
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT id
        FROM users
        WHERE email = ?
          AND id != ?
    ");

    $stmt->execute([$email, $id]);

    if ($stmt->fetch()) {

        http_response_code(409);

        echo json_encode([
            'success' => false
        ]);

        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE users
        SET name = ?, email = ?
        WHERE id = ?
    ");

    $stmt->execute([
        $name,
        $email,
        $id
    ]);

    echo json_encode([
        'success' => true
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/

if ($method === 'DELETE') {

    if (!$id) {

        http_response_code(404);

        echo json_encode([
            'success' => false
        ]);

        exit;
    }

    $stmt = $pdo->prepare("
        SELECT id
        FROM users
        WHERE id = ?
    ");

    $stmt->execute([$id]);

    if (!$stmt->fetch()) {

        http_response_code(404);

        echo json_encode([
            'success' => false
        ]);

        exit;
    }

    $stmt = $pdo->prepare("
        DELETE FROM users
        WHERE id = ?
    ");

    $stmt->execute([$id]);

    echo json_encode([
        'success' => true
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| METHOD NOT ALLOWED
|--------------------------------------------------------------------------
*/

http_response_code(405);

echo json_encode([
    'success' => false,
    'message' => 'Method not allowed'
]);