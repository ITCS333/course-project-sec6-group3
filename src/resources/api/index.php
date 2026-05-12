<?php

declare(strict_types=1);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!is_array($data)) {
    $data = [];
}

$action = $_GET['action'] ?? null;

try {
    if ($method === 'GET') {
        if ($action === 'comments') {
            getComments($db);
        } elseif (isset($_GET['id'])) {
            getResourceById($db);
        } else {
            getAllResources($db);
        }
    } elseif ($method === 'POST') {
        if ($action === 'comment') {
            createComment($db, $data);
        } else {
            createResource($db, $data);
        }
    } elseif ($method === 'PUT') {
        updateResource($db, $data);
    } elseif ($method === 'DELETE') {
        if ($action === 'delete_comment') {
            deleteComment($db);
        } else {
            deleteResource($db);
        }
    } else {
        sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (PDOException $e) {
    sendResponse(['success' => false, 'message' => 'Database error'], 500);
}

function getAllResources(PDO $db): void
{
    $sql = 'SELECT id, title, description, link, created_at FROM resources';
    $params = [];

    if (isset($_GET['search']) && trim($_GET['search']) !== '') {
        $sql .= ' WHERE title LIKE :search OR description LIKE :search';
        $params[':search'] = '%' . trim($_GET['search']) . '%';
    }

    $allowedSort = ['title', 'created_at'];
    $sort = $_GET['sort'] ?? 'created_at';

    if (!in_array($sort, $allowedSort, true)) {
        $sort = 'created_at';
    }

    $order = strtolower($_GET['order'] ?? 'desc');

    if (!in_array($order, ['asc', 'desc'], true)) {
        $order = 'desc';
    }

    $sql .= " ORDER BY {$sort} {$order}";

    $stmt = $db->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    $stmt->execute();

    sendResponse([
        'success' => true,
        'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
}

function getResourceById(PDO $db): void
{
    $id = $_GET['id'] ?? null;

    if ($id === null || !is_numeric($id)) {
        sendResponse(['success' => false, 'message' => 'Invalid resource id'], 400);
    }

    $stmt = $db->prepare('SELECT id, title, description, link, created_at FROM resources WHERE id = ?');
    $stmt->execute([$id]);
    $resource = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$resource) {
        sendResponse(['success' => false, 'message' => 'Resource not found'], 404);
    }

    sendResponse([
        'success' => true,
        'data' => $resource
    ]);
}

function createResource(PDO $db, array $data): void
{
    if (!isset($data['title']) || trim((string)$data['title']) === '') {
        sendResponse(['success' => false, 'message' => 'Title is required'], 400);
    }

    if (!isset($data['link']) || trim((string)$data['link']) === '') {
        sendResponse(['success' => false, 'message' => 'Link is required'], 400);
    }

    $title = trim((string)$data['title']);
    $description = isset($data['description']) ? trim((string)$data['description']) : '';
    $link = trim((string)$data['link']);

    if (!filter_var($link, FILTER_VALIDATE_URL)) {
        sendResponse(['success' => false, 'message' => 'Invalid URL'], 400);
    }

    $stmt = $db->prepare('INSERT INTO resources (title, description, link) VALUES (?, ?, ?)');
    $stmt->execute([$title, $description, $link]);

    sendResponse([
        'success' => true,
        'message' => 'Resource created successfully',
        'id' => $db->lastInsertId()
    ], 201);
}

function updateResource(PDO $db, array $data): void
{
    if (!isset($data['id']) || !is_numeric($data['id'])) {
        sendResponse(['success' => false, 'message' => 'Resource id is required'], 400);
    }

    $id = $data['id'];

    $check = $db->prepare('SELECT id FROM resources WHERE id = ?');
    $check->execute([$id]);

    if (!$check->fetch(PDO::FETCH_ASSOC)) {
        sendResponse(['success' => false, 'message' => 'Resource not found'], 404);
    }

    $fields = [];
    $values = [];

    if (array_key_exists('title', $data)) {
        $fields[] = 'title = ?';
        $values[] = trim((string)$data['title']);
    }

    if (array_key_exists('description', $data)) {
        $fields[] = 'description = ?';
        $values[] = trim((string)$data['description']);
    }

    if (array_key_exists('link', $data)) {
        $link = trim((string)$data['link']);

        if (!filter_var($link, FILTER_VALIDATE_URL)) {
            sendResponse(['success' => false, 'message' => 'Invalid URL'], 400);
        }

        $fields[] = 'link = ?';
        $values[] = $link;
    }

    if (count($fields) === 0) {
        sendResponse(['success' => false, 'message' => 'No fields to update'], 400);
    }

    $values[] = $id;

    $sql = 'UPDATE resources SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $db->prepare($sql);
    $stmt->execute($values);

    sendResponse([
        'success' => true,
        'message' => 'Resource updated successfully'
    ]);
}

function deleteResource(PDO $db): void
{
    $id = $_GET['id'] ?? null;

    if ($id === null || !is_numeric($id)) {
        sendResponse(['success' => false, 'message' => 'Invalid resource id'], 400);
    }

    $check = $db->prepare('SELECT id FROM resources WHERE id = ?');
    $check->execute([$id]);

    if (!$check->fetch(PDO::FETCH_ASSOC)) {
        sendResponse(['success' => false, 'message' => 'Resource not found'], 404);
    }

    $stmt = $db->prepare('DELETE FROM resources WHERE id = ?');
    $stmt->execute([$id]);

    sendResponse([
        'success' => true,
        'message' => 'Resource deleted successfully'
    ]);
}

function getComments(PDO $db): void
{
    $resourceId = $_GET['resource_id'] ?? null;

    if ($resourceId === null || !is_numeric($resourceId)) {
        sendResponse(['success' => false, 'message' => 'Invalid resource id'], 400);
    }

    $stmt = $db->prepare(
        'SELECT id, resource_id, author, text, created_at
         FROM comments_resource
         WHERE resource_id = ?
         ORDER BY created_at ASC'
    );

    $stmt->execute([$resourceId]);

    sendResponse([
        'success' => true,
        'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
}

function createComment(PDO $db, array $data): void
{
    if (!isset($data['resource_id']) || !is_numeric($data['resource_id'])) {
        sendResponse(['success' => false, 'message' => 'Resource id is required'], 400);
    }

    if (!isset($data['author']) || trim((string)$data['author']) === '') {
        sendResponse(['success' => false, 'message' => 'Author is required'], 400);
    }

    if (!isset($data['text']) || trim((string)$data['text']) === '') {
        sendResponse(['success' => false, 'message' => 'Text is required'], 400);
    }

    $resourceId = $data['resource_id'];

    $check = $db->prepare('SELECT id FROM resources WHERE id = ?');
    $check->execute([$resourceId]);

    if (!$check->fetch(PDO::FETCH_ASSOC)) {
        sendResponse(['success' => false, 'message' => 'Resource not found'], 404);
    }

    $author = trim((string)$data['author']);
    $text = trim((string)$data['text']);

    $stmt = $db->prepare('INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)');
    $stmt->execute([$resourceId, $author, $text]);

    sendResponse([
        'success' => true,
        'message' => 'Comment created successfully',
        'id' => $db->lastInsertId()
    ], 201);
}

function deleteComment(PDO $db): void
{
    $commentId = $_GET['comment_id'] ?? null;

    if ($commentId === null || !is_numeric($commentId)) {
        sendResponse(['success' => false, 'message' => 'Invalid comment id'], 400);
    }

    $check = $db->prepare('SELECT id FROM comments_resource WHERE id = ?');
    $check->execute([$commentId]);

    if (!$check->fetch(PDO::FETCH_ASSOC)) {
        sendResponse(['success' => false, 'message' => 'Comment not found'], 404);
    }

    $stmt = $db->prepare('DELETE FROM comments_resource WHERE id = ?');
    $stmt->execute([$commentId]);

    sendResponse([
        'success' => true,
        'message' => 'Comment deleted successfully'
    ]);
}

function sendResponse(array $response, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($response);
    exit;
}

?>
