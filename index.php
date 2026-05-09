<?php
// index.php - Main authentication API handler

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo '{}';
    exit();
}

// Include database connection
require_once __DIR__ . '/includes/db_connect.php';

// Helper function
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// Handle GET requests (session check)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'check') {
        jsonResponse([
            'status' => 'success',
            'logged_in' => isset($_SESSION['user_id']),
            'username' => $_SESSION['user_name'] ?? null,
            'email' => $_SESSION['user_email'] ?? null,
            'is_admin' => $_SESSION['is_admin'] ?? false
        ]);
    }
    jsonResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
}

// Only POST for login
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
}

// Get and decode JSON input
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input) {
    jsonResponse(['status' => 'error', 'message' => 'Invalid JSON'], 400);
}

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Validations
if (empty($email)) {
    jsonResponse(['status' => 'error', 'message' => 'Email is required'], 400);
}

if (empty($password)) {
    jsonResponse(['status' => 'error', 'message' => 'Password is required'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['status' => 'error', 'message' => 'Invalid email format'], 400);
}

if (strlen($password) < 8) {
    jsonResponse(['status' => 'error', 'message' => 'Password must be at least 8 characters long'], 400);
}

// Database query
try {
    $stmt = $pdo->prepare("SELECT id, name, email, password, is_admin FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['status' => 'error', 'message' => 'Invalid email or password'], 401);
    }

    if (!password_verify($password, $user['password'])) {
        jsonResponse(['status' => 'error', 'message' => 'Invalid email or password'], 401);
    }

    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['is_admin'] = (bool)$user['is_admin'];

    // Success response (no password)
    jsonResponse([
        'status' => 'success',
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'is_admin' => (bool)$user['is_admin']
        ]
    ], 200);

} catch (PDOException $e) {
    jsonResponse(['status' => 'error', 'message' => 'Database error'], 500);
} catch (Exception $e) {
    jsonResponse(['status' => 'error', 'message' => 'Server error'], 500);
}
?>