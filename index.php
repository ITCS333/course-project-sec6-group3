<?php
// index.php - Main authentication API handler

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once __DIR__ . '/includes/db_connect.php';

// Helper function to send JSON response
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Helper function to send error response
function sendError($message, $statusCode = 400) {
    sendJsonResponse(['status' => 'error', 'message' => $message], $statusCode);
}

// Check if this is a login request
$requestUri = $_SERVER['REQUEST_URI'];
$isLoginRequest = (strpos($requestUri, 'action=login') !== false) || 
                  (strpos($requestUri, '/login') !== false) ||
                  ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_GET['action']));

// For non-POST requests (GET, etc.) - only allow check action
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // Allow check action for GET requests
    if (isset($_GET['action']) && $_GET['action'] === 'check') {
        sendJsonResponse([
            'status' => 'success',
            'logged_in' => isset($_SESSION['user_id']),
            'username' => $_SESSION['user_name'] ?? null,
            'email' => $_SESSION['user_email'] ?? null,
            'is_admin' => isset($_SESSION['is_admin']) ? (bool)$_SESSION['is_admin'] : false
        ]);
    }
    
    // For any other non-POST request, return method not allowed
    sendError('Method not allowed. Use POST for login.', 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Extract email and password
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Check if email is provided
if (empty($email)) {
    sendError('Email is required', 400);
}

// Check if password is provided
if (empty($password)) {
    sendError('Password is required', 400);
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email format', 400);
}

// Validate password length (minimum 8 characters)
if (strlen($password) < 8) {
    sendError('Password must be at least 8 characters long', 400);
}

try {
    // Query user by email
    $stmt = $pdo->prepare("SELECT id, name, email, password, is_admin FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Check if user exists
    if (!$user) {
        sendError('Invalid email or password', 401);
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        sendError('Invalid email or password', 401);
    }

    // Set session variables
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['is_admin'] = (bool)$user['is_admin'];

    // Ensure session cookie is set
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }

    // Return success response without password
    sendJsonResponse([
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
    sendError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}
?>