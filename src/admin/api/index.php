<?php

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Include database connection
require_once __DIR__ . '/../../includes/db_connect.php';

// Helper function to check if user is admin
function isAdmin() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}

// Helper function to send JSON response
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Helper function to send error response
function sendError($message, $statusCode = 400) {
    sendResponse(['status' => 'error', 'message' => $message], $statusCode);
}

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id'])) {
    sendError('Unauthorized: Please login first', 401);
}

if (!isAdmin()) {
    sendError('Forbidden: Admin access required', 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$action = end($pathParts);

// Get input data
$input = json_decode(file_get_contents('php://input'), true);
$userId = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    switch ($method) {
        // =============================================
        // GET: List all users or get single user
        // =============================================
        case 'GET':
            if ($userId) {
                // Get single user by ID
                if ($action === 'get_user' || $userId) {
                    $stmt = $pdo->prepare("SELECT id, name, email, is_admin, created_at FROM users WHERE id = ?");
                    $stmt->execute([$userId]);
                    $user = $stmt->fetch();
                    
                    if (!$user) {
                        sendError('User not found', 404);
                    }
                    
                    sendResponse(['status' => 'success', 'user' => $user]);
                }
            } else {
                // Get all users
                $search = isset($_GET['search']) ? trim($_GET['search']) : '';
                
                if ($search !== '') {
                    // Search users by name or email
                    $stmt = $pdo->prepare("SELECT id, name, email, is_admin, created_at FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY id");
                    $stmt->execute(["%$search%", "%$search%"]);
                } else {
                    // Get all users
                    $stmt = $pdo->query("SELECT id, name, email, is_admin, created_at FROM users ORDER BY id");
                }
                
                $users = $stmt->fetchAll();
                sendResponse(['status' => 'success', 'users' => $users]);
            }
            break;
        
        // =============================================
        // POST: Create new user
        // =============================================
        case 'POST':
            if ($action === 'change_password') {
                // Change password for current user
                $currentPassword = $input['current_password'] ?? '';
                $newPassword = $input['new_password'] ?? '';
                $userId = $_SESSION['user_id'];
                
                // Validate new password length
                if (strlen($newPassword) < 8) {
                    sendError('New password must be at least 8 characters', 400);
                }
                
                // Get current user's password hash
                $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
                
                if (!$user || !password_verify($currentPassword, $user['password'])) {
                    sendError('Current password is incorrect', 401);
                }
                
                // Update password
                $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
                $stmt->execute([$newHash, $userId]);
                
                sendResponse(['status' => 'success', 'message' => 'Password changed successfully']);
            } else {
                // Create new user
                $name = trim($input['name'] ?? '');
                $email = trim($input['email'] ?? '');
                $password = $input['password'] ?? '';
                $is_admin = isset($input['is_admin']) ? (int)$input['is_admin'] : 0;
                
                // Validate required fields
                if (empty($name)) {
                    sendError('Name is required', 400);
                }
                
                if (empty($email)) {
                    sendError('Email is required', 400);
                }
                
                // Validate email format
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    sendError('Invalid email format', 400);
                }
                
                // Validate password length
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
                
                sendResponse([
                    'status' => 'success',
                    'message' => 'User created successfully',
                    'user' => [
                        'id' => $newId,
                        'name' => $name,
                        'email' => $email,
                        'is_admin' => (bool)$is_admin
                    ]
                ], 201);
            }
            break;
        
        // =============================================
        // PUT: Update user
        // =============================================
        case 'PUT':
            if (!$userId) {
                sendError('User ID required', 400);
            }
            
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $is_admin = isset($input['is_admin']) ? (int)$input['is_admin'] : 0;
            
            // Validate required fields
            if (empty($name)) {
                sendError('Name is required', 400);
            }
            
            if (empty($email)) {
                sendError('Email is required', 400);
            }
            
            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendError('Invalid email format', 400);
            }
            
            // Check if user exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            if (!$stmt->fetch()) {
                sendError('User not found', 404);
            }
            
            // Check for duplicate email (excluding current user)
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$email, $userId]);
            if ($stmt->fetch()) {
                sendError('Email already exists', 409);
            }
            
            // Update user
            $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, is_admin = ? WHERE id = ?");
            $stmt->execute([$name, $email, $is_admin, $userId]);
            
            sendResponse([
                'status' => 'success',
                'message' => 'User updated successfully'
            ]);
            break;
        
        // =============================================
        // DELETE: Delete user
        // =============================================
        case 'DELETE':
            if (!$userId) {
                sendError('User ID required', 400);
            }
            
            // Don't allow admin to delete themselves
            if ($userId == $_SESSION['user_id']) {
                sendError('Cannot delete your own account', 400);
            }
            
            // Check if user exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            if (!$stmt->fetch()) {
                sendError('User not found', 404);
            }
            
            // Delete user
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            
            sendResponse([
                'status' => 'success',
                'message' => 'User deleted successfully'
            ]);
            break;
        
        // =============================================
        // Unsupported method
        // =============================================
        default:
            sendError('Method not allowed', 405);
            break;
    }
} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}
?>