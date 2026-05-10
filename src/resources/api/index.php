<?php
header("Content-Type: application/json");

// --- تعديل حسب قاعدة البيانات عندك ---
$dsn = "mysql:host=localhost;dbname=your_db_name;charset=utf8mb4";
$user = "your_db_user";
$pass = "your_db_password";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$action = isset($_GET['action']) ? $_GET['action'] : null;
$resource_id = isset($_GET['resource_id']) ? intval($_GET['resource_id']) : null;

function getJsonInput() {
    return json_decode(file_get_contents('php://input'), true);
}

// --- Comments Handling ---
if ($action === "comments") {
    if ($method === "GET" && $resource_id) {
        $stmt = $pdo->prepare("SELECT * FROM comments_resource WHERE resource_id = ?");
        $stmt->execute([$resource_id]);
        echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } elseif ($method === "POST") {
        $data = getJsonInput();
        $stmt = $pdo->prepare("INSERT INTO comments_resource (resource_id, author, text, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$data['resource_id'], $data['author'], $data['text']]);
        echo json_encode(["success" => true, "data" => ["id" => $pdo->lastInsertId()]]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid comment request"]);
    }
    exit;
}

// --- Resources CRUD ---
if ($method === "GET") {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM resources WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true, "data" => $stmt->fetch(PDO::FETCH_ASSOC)]);
    } else {
        $stmt = $pdo->query("SELECT * FROM resources");
        echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
} elseif ($method === "POST") {
    $data = getJsonInput();
    $stmt = $pdo->prepare("INSERT INTO resources (title, description, link, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$data['title'], $data['description'], $data['link']]);
    echo json_encode(["success" => true, "data" => ["id" => $pdo->lastInsertId()]]);
} elseif ($method === "PUT" && $id) {
    $data = getJsonInput();
    $stmt = $pdo->prepare("UPDATE resources SET title = ?, description = ?, link = ? WHERE id = ?");
    $stmt->execute([$data['title'], $data['description'], $data['link'], $id]);
    echo json_encode(["success" => true, "message" => "Resource updated"]);
} elseif ($method === "DELETE" && $id) {
    $stmt = $pdo->prepare("DELETE FROM resources WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(["success" => true, "message" => "Resource deleted"]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
}
