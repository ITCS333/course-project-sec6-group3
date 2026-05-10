<?php

session_start();

header('Content-Type: application/json');

require_once __DIR__ . '/../../../includes/db_connect.php';

/*
|--------------------------------------------------------------------------
| ONLY POST REQUESTS ALLOWED
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| READ INPUT
|--------------------------------------------------------------------------
*/

$input = json_decode(file_get_contents('php://input'), true);

$email = trim($input['email'] ?? '');
$password = trim($input['password'] ?? '');

/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

if ($email === '') {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Email is required'
    ]);

    exit;
}

if ($password === '') {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Password is required'
    ]);

    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format'
    ]);

    exit;
}

if (strlen($password) < 6) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Password too short'
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| FIND USER
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare("
    SELECT id, name, email, password, is_admin
    FROM users
    WHERE email = ?
");

$stmt->execute([$email]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

/*
|--------------------------------------------------------------------------
| INVALID USER
|--------------------------------------------------------------------------
*/

if (!$user) {

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'User not found'
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| WRONG PASSWORD
|--------------------------------------------------------------------------
*/

if (!password_verify($password, $user['password'])) {

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Incorrect password'
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| SESSION
|--------------------------------------------------------------------------
*/

$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['is_admin'] = (bool)$user['is_admin'];

/*
|--------------------------------------------------------------------------
| SUCCESS RESPONSE
|--------------------------------------------------------------------------
*/

unset($user['password']);

echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'is_admin' => (bool)$user['is_admin']
    ]
]);