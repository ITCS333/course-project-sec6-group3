<?php
// src/auth/api.php
// Handles: login, logout, check session, admin user management

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Include database connection
require_once __DIR__ . '/../../includes/db_connect.php';

$action = $_REQUEST['action'] ?? '';

try {
    switch ($action) {
        // =============================================
        // CHECK LOGIN STATUS
        // =============================================
        case 'check':
            echo json_encode([
                'status' => 'success',
                'logged_in' => isset($_SESSION['user_id']),
                'username' => $_SESSION['user_name'] ?? null,
                'email' => $_SESSION['user_email'] ?? null,
                'is_admin' => $_SESSION['is_admin'] ?? false
            ]);
            break;

        // =============================================
        // LOGIN
        // =============================================
        case 'login':
            $input = json_decode(file_get_contents('php://input'), true);
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';

            if (empty($email) || empty($password)) {
                echo json_encode(['status' => 'error', 'message' => 'Email and password are required']);
                break;
            }

            $stmt = $pdo->prepare("SELECT id, name, email, password, is_admin FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['is_admin'] = (bool)$user['is_admin'];

                echo json_encode([
                    'status' => 'success',
                    'message' => 'Login successful',
                    'user' => [
                        'id' => $user['id'],
                        'name' => $user['name'],
                        'email' => $user['email'],
                        'is_admin' => (bool)$user['is_admin']
                    ]
                ]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Invalid email or password']);
            }
            break;

        // =============================================
        // LOGOUT
        // =============================================
        case 'logout':
            session_destroy();
            echo json_encode(['status' => 'success', 'message' => 'Logged out successfully']);
            break;

        // =============================================
        // ADMIN: GET ALL USERS
        // =============================================
        case 'admin_list_users':
            if (!isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
                echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
                break;
            }

            $stmt = $pdo->query("SELECT id, name, email, is_admin, created_at FROM users ORDER BY id");
            $users = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'users' => $users]);
            break;

        // =============================================
        // ADMIN: CREATE USER
        // =============================================
        case 'admin_create_user':
            if (!isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
                echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
                break;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '';
            $is_admin = isset($input['is_admin']) ? (int)$input['is_admin'] : 0;

            if (empty($name) || empty($email) || empty($password)) {
                echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
                break;
            }

            // Check if email exists
            $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $check->execute([$email]);
            if ($check->fetch()) {
                echo json_encode(['status' => 'error', 'message' => 'Email already exists']);
                break;
            }

            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $email, $hashedPassword, $is_admin]);

            echo json_encode(['status' => 'success', 'message' => 'User created successfully']);
            break;

        // =============================================
        // ADMIN: UPDATE USER
        // =============================================
        case 'admin_update_user':
            if (!isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
                echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
                break;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $userId = $input['id'] ?? 0;
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $is_admin = isset($input['is_admin']) ? (int)$input['is_admin'] : 0;

            if (!$userId || empty($name) || empty($email)) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
                break;
            }

            $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, is_admin = ? WHERE id = ?");
            $stmt->execute([$name, $email, $is_admin, $userId]);

            echo json_encode(['status' => 'success', 'message' => 'User updated successfully']);
            break;

        // =============================================
        // ADMIN: DELETE USER
        // =============================================
        case 'admin_delete_user':
            if (!isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
                echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
                break;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $userId = $input['id'] ?? 0;

            if (!$userId) {
                echo json_encode(['status' => 'error', 'message' => 'User ID required']);
                break;
            }

            // Don't allow admin to delete themselves
            if ($userId == $_SESSION['user_id']) {
                echo json_encode(['status' => 'error', 'message' => 'Cannot delete your own account']);
                break;
            }

            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);

            echo json_encode(['status' => 'success', 'message' => 'User deleted successfully']);
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}