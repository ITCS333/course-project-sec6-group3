<?php
// src/admin/manage_users.php
// Admin API for user management

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Include database connection
require_once __DIR__ . '/../../includes/db_connect.php';

// Helper function to send JSON response
function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function sendError($message, $statusCode = 400) {
    sendJson(['status' => 'error', 'message' => $message], $statusCode);
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    sendError('Unauthorized: Please login first', 401);
}

// Verify admin status from database
$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || $user['is_admin'] != 1) {
    sendError('Forbidden: Admin access required', 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// ============================================
// GET: List users or get single user
// ============================================
if ($method === 'GET') {
    // Get single user by ID
    if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $id = (int)$_GET['id'];
        $stmt = $pdo->prepare("SELECT id, name, email, is_admin, created_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('User not found', 404);
        }
        
        sendJson(['status' => 'success', 'user' => $user]);
    }
    
    // Get all users (with optional search)
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    
    if ($search !== '') {
        $stmt = $pdo->prepare("SELECT id, name, email, is_admin, created_at FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY id");
        $stmt->execute(["%$search%", "%$search%"]);
    } else {
        $stmt = $pdo->query("SELECT id, name, email, is_admin, created_at FROM users ORDER BY id");
    }
    
    $users = $stmt->fetchAll();
    sendJson(['status' => 'success', 'users' => $users]);
}

// ============================================
// POST: Create user or Change password
// ============================================
if ($method === 'POST') {
    // Check if this is a password change request
    if (isset($_GET['action']) && $_GET['action'] === 'change_password') {
        $currentPassword = isset($input['current_password']) ? $input['current_password'] : '';
        $newPassword = isset($input['new_password']) ? $input['new_password'] : '';
        
        if (empty($currentPassword) || empty($newPassword)) {
            sendError('Current password and new password are required', 400);
        }
        
        if (strlen($newPassword) < 8) {
            sendError('New password must be at least 8 characters', 400);
        }
        
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($currentPassword, $user['password'])) {
            sendError('Current password is incorrect', 401);
        }
        
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$newHash, $_SESSION['user_id']]);
        
        sendJson(['status' => 'success', 'message' => 'Password changed successfully']);
    }
    
    // Create new user
    $name = isset($input['name']) ? trim($input['name']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    $is_admin = isset($input['is_admin']) ? (int)$input['is_admin'] : 0;
    
    // Validation
    if (empty($name)) {
        sendError('Name is required', 400);
    }
    
    if (empty($email)) {
        sendError('Email is required', 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('Invalid email format', 400);
    }
    
    if (strlen($password) < 8) {
        sendError('Password must be at least 8 characters', 400);
    }
    
    // Check for duplicate email
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendError('Email already exists', 409);
    }
    
    // Create user
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword, $is_admin]);
    $newId = $pdo->lastInsertId();
    
    sendJson([
        'status' => 'success',
        'message' => 'User created successfully',
        'user' => [
            'id' => $newId,
            'name' => $name,
            'email' => $email,
            'is_admin' => $is_admin === 1
        ]
    ], 201);
}

// ============================================
// PUT: Update user
// ============================================
if ($method === 'PUT') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if ($id <= 0) {
        sendError('User ID required', 400);
    }
    
    $name = isset($input['name']) ? trim($input['name']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $is_admin = isset($input['is_admin']) ? (int)$input['is_admin'] : 0;
    
    if (empty($name)) {
        sendError('Name is required', 400);
    }
    
    if (empty($email)) {
        sendError('Email is required', 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('Invalid email format', 400);
    }
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        sendError('User not found', 404);
    }
    
    // Check for duplicate email (excluding current user)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $id]);
    if ($stmt->fetch()) {
        sendError('Email already exists', 409);
    }
    
    // Update user
    $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, is_admin = ? WHERE id = ?");
    $stmt->execute([$name, $email, $is_admin, $id]);
    
    sendJson(['status' => 'success', 'message' => 'User updated successfully']);
}

// ============================================
// DELETE: Delete user
// ============================================
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if ($id <= 0) {
        sendError('User ID required', 400);
    }
    
    // Don't allow admin to delete themselves
    if ($id == $_SESSION['user_id']) {
        sendError('Cannot delete your own account', 400);
    }
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        sendError('User not found', 404);
    }
    
    // Delete user
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);
    
    sendJson(['status' => 'success', 'message' => 'User deleted successfully']);
}

// Method not allowed
sendError('Method not allowed', 405);
?>