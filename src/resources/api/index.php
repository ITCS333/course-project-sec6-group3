<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "./config/Database.php";

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER["REQUEST_METHOD"];

$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true);

if (!is_array($data)) {
    $data = [];
}

$action = isset($_GET["action"]) ? $_GET["action"] : null;
$id = isset($_GET["id"]) ? $_GET["id"] : null;
$resource_id = isset($_GET["resource_id"]) ? $_GET["resource_id"] : null;
$comment_id = isset($_GET["comment_id"]) ? $_GET["comment_id"] : null;

function getAllResources($db) {
    $sql = "SELECT id, title, description, link, created_at FROM resources";
    $params = [];

    if (isset($_GET["search"]) && trim($_GET["search"]) !== "") {
        $sql .= " WHERE title LIKE :search OR description LIKE :search";
        $params[":search"] = "%" . trim($_GET["search"]) . "%";
    }

    $allowedSort = ["title", "created_at"];
    $sort = isset($_GET["sort"]) && in_array($_GET["sort"], $allowedSort)
        ? $_GET["sort"]
        : "created_at";

    $allowedOrder = ["asc", "desc"];
    $order = isset($_GET["order"]) && in_array(strtolower($_GET["order"]), $allowedOrder)
        ? strtolower($_GET["order"])
        : "desc";

    $sql .= " ORDER BY $sort $order";

    $stmt = $db->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    $stmt->execute();
    $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse([
        "success" => true,
        "data" => $resources
    ]);
}

function getResourceById($db, $resourceId) {
    if (!$resourceId || !is_numeric($resourceId)) {
        sendResponse([
            "success" => false,
            "message" => "Invalid resource id."
        ], 400);
    }

    $stmt = $db->prepare("SELECT id, title, description, link, created_at FROM resources WHERE id = ?");
    $stmt->execute([$resourceId]);

    $resource = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($resource) {
        sendResponse([
            "success" => true,
            "data" => $resource
        ]);
    }

    sendResponse([
        "success" => false,
        "message" => "Resource not found."
    ], 404);
}

function createResource($db, $data) {
    $validation = validateRequiredFields($data, ["title", "link"]);

    if (!$validation["valid"]) {
        sendResponse([
            "success" => false,
            "message" => "Missing required fields: " . implode(", ", $validation["missing"])
        ], 400);
    }

    $title = sanitizeInput($data["title"]);
    $description = isset($data["description"]) ? sanitizeInput($data["description"]) : "";
    $link = sanitizeInput($data["link"]);

    if (!validateUrl($link)) {
        sendResponse([
            "success" => false,
            "message" => "Invalid URL."
        ], 400);
    }

    $stmt = $db->prepare("INSERT INTO resources (title, description, link) VALUES (?, ?, ?)");
    $stmt->execute([$title, $description, $link]);

    if ($stmt->rowCount() > 0) {
        $newId = $db->lastInsertId();

        sendResponse([
            "success" => true,
            "message" => "Resource created successfully.",
            "id" => $newId,
            "data" => [
                "id" => $newId,
                "title" => $title,
                "description" => $description,
                "link" => $link
            ]
        ], 201);
    }

    sendResponse([
        "success" => false,
        "message" => "Failed to create resource."
    ], 500);
}

function updateResource($db, $data) {
    $resourceId = null;

    if (isset($data["id"])) {
        $resourceId = $data["id"];
    } elseif (isset($_GET["id"])) {
        $resourceId = $_GET["id"];
    }

    if (!$resourceId || !is_numeric($resourceId)) {
        sendResponse([
            "success" => false,
            "message" => "Resource id is required."
        ], 400);
    }

    $checkStmt = $db->prepare("SELECT id FROM resources WHERE id = ?");
    $checkStmt->execute([$resourceId]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        sendResponse([
            "success" => false,
            "message" => "Resource not found."
        ], 404);
    }

    $fields = [];
    $values = [];

    if (array_key_exists("title", $data)) {
        $fields[] = "title = ?";
        $values[] = sanitizeInput($data["title"]);
    }

    if (array_key_exists("description", $data)) {
        $fields[] = "description = ?";
        $values[] = sanitizeInput($data["description"]);
    }

    if (array_key_exists("link", $data)) {
        $link = sanitizeInput($data["link"]);

        if (!validateUrl($link)) {
            sendResponse([
                "success" => false,
                "message" => "Invalid URL."
            ], 400);
        }

        $fields[] = "link = ?";
        $values[] = $link;
    }

    if (count($fields) === 0) {
        sendResponse([
            "success" => false,
            "message" => "No fields to update."
        ], 400);
    }

    $values[] = $resourceId;

    $sql = "UPDATE resources SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    sendResponse([
        "success" => true,
        "message" => "Resource updated successfully."
    ]);
}

function deleteResource($db, $resourceId) {
    if (!$resourceId || !is_numeric($resourceId)) {
        sendResponse([
            "success" => false,
            "message" => "Invalid resource id."
        ], 400);
    }

    $checkStmt = $db->prepare("SELECT id FROM resources WHERE id = ?");
    $checkStmt->execute([$resourceId]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        sendResponse([
            "success" => false,
            "message" => "Resource not found."
        ], 404);
    }

    $stmt = $db->prepare("DELETE FROM resources WHERE id = ?");
    $stmt->execute([$resourceId]);

    if ($stmt->rowCount() > 0) {
        sendResponse([
            "success" => true,
            "message" => "Resource deleted successfully."
        ]);
    }

    sendResponse([
        "success" => false,
        "message" => "Failed to delete resource."
    ], 500);
}

function getCommentsByResourceId($db, $resourceId) {
    if (!$resourceId || !is_numeric($resourceId)) {
        sendResponse([
            "success" => false,
            "message" => "Invalid resource id."
        ], 400);
    }

    $stmt = $db->prepare(
        "SELECT id, resource_id, author, text, created_at
         FROM comments_resource
         WHERE resource_id = ?
         ORDER BY created_at ASC"
    );

    $stmt->execute([$resourceId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse([
        "success" => true,
        "data" => $comments
    ]);
}

function createComment($db, $data) {
    $validation = validateRequiredFields($data, ["resource_id", "author", "text"]);

    if (!$validation["valid"]) {
        sendResponse([
            "success" => false,
            "message" => "Missing required fields: " . implode(", ", $validation["missing"])
        ], 400);
    }

    if (!is_numeric($data["resource_id"])) {
        sendResponse([
            "success" => false,
            "message" => "Invalid resource id."
        ], 400);
    }

    $resourceId = $data["resource_id"];

    $checkStmt = $db->prepare("SELECT id FROM resources WHERE id = ?");
    $checkStmt->execute([$resourceId]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        sendResponse([
            "success" => false,
            "message" => "Resource not found."
        ], 404);
    }

    $author = sanitizeInput($data["author"]);
    $text = sanitizeInput($data["text"]);

    $stmt = $db->prepare("INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)");
    $stmt->execute([$resourceId, $author, $text]);

    if ($stmt->rowCount() > 0) {
        $newId = $db->lastInsertId();

        sendResponse([
            "success" => true,
            "message" => "Comment created successfully.",
            "id" => $newId,
            "data" => [
                "id" => $newId,
                "resource_id" => $resourceId,
                "author" => $author,
                "text" => $text
            ]
        ], 201);
    }

    sendResponse([
        "success" => false,
        "message" => "Failed to create comment."
    ], 500);
}

function deleteComment($db, $commentId) {
    if (!$commentId || !is_numeric($commentId)) {
        sendResponse([
            "success" => false,
            "message" => "Invalid comment id."
        ], 400);
    }

    $checkStmt = $db->prepare("SELECT id FROM comments_resource WHERE id = ?");
    $checkStmt->execute([$commentId]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        sendResponse([
            "success" => false,
            "message" => "Comment not found."
        ], 404);
    }

    $stmt = $db->prepare("DELETE FROM comments_resource WHERE id = ?");
    $stmt->execute([$commentId]);

    if ($stmt->rowCount() > 0) {
        sendResponse([
            "success" => true,
            "message" => "Comment deleted successfully."
        ]);
    }

    sendResponse([
        "success" => false,
        "message" => "Failed to delete comment."
    ], 500);
}

try {
    if ($method === "GET") {
        if ($action === "comments") {
            getCommentsByResourceId($db, $resource_id);
        } elseif ($id) {
            getResourceById($db, $id);
        } else {
            getAllResources($db);
        }
    } elseif ($method === "POST") {
        if ($action === "comment") {
            createComment($db, $data);
        } else {
            createResource($db, $data);
        }
    } elseif ($method === "PUT") {
        updateResource($db, $data);
    } elseif ($method === "DELETE") {
        if ($action === "delete_comment") {
            deleteComment($db, $comment_id);
        } else {
            deleteResource($db, $id);
        }
    } else {
        sendResponse([
            "success" => false,
            "message" => "Method not allowed."
        ], 405);
    }
} catch (PDOException $e) {
    error_log($e->getMessage());

    sendResponse([
        "success" => false,
        "message" => "Database error."
    ], 500);
} catch (Exception $e) {
    error_log($e->getMessage());

    sendResponse([
        "success" => false,
        "message" => "Server error."
    ], 500);
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);

    if (!is_array($data)) {
        $data = ["success" => false, "message" => $data];
    }

    echo json_encode($data);
    exit;
}

function validateUrl($url) {
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, "UTF-8");
}

function validateRequiredFields($data, $requiredFields) {
    $missing = [];

    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim((string)$data[$field]) === "") {
            $missing[] = $field;
        }
    }

    return [
        "valid" => count($missing) === 0,
        "missing" => $missing
    ];
}

?>
