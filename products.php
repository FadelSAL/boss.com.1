<?php
require_once __DIR__ . '/server/config.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!file_exists($PRODUCTS_FILE)) file_put_contents($PRODUCTS_FILE, json_encode([]));
$items = json_decode(file_get_contents($PRODUCTS_FILE), true);

// helper to get admin key either from header or query param
function getAdminKey() {
    if (isset($_SERVER['HTTP_X_ADMIN_KEY'])) return $_SERVER['HTTP_X_ADMIN_KEY'];
    if (isset($_GET['key'])) return $_GET['key'];
    return null;
}

switch ($method) {
    case 'GET':
        if ($id !== null) {
            foreach ($items as $it) {
                if (isset($it['id']) && $it['id'] == $id) {
                    echo json_encode($it, JSON_UNESCAPED_UNICODE);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
            exit;
        }
        echo json_encode($items, JSON_UNESCAPED_UNICODE);
        break;

    case 'POST':
        $key = getAdminKey();
        if ($key !== $ADMIN_KEY) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit; }
        $maxId = 0; foreach ($items as $it) if (!empty($it['id']) && $it['id'] > $maxId) $maxId = $it['id'];
        $newId = $maxId + 1;
        $new = [
            'id' => $newId,
            'name' => $data['name'] ?? '',
            'description' => $data['description'] ?? '',
            'price' => isset($data['price']) ? (int)$data['price'] : 0,
            'imageUrl' => $data['imageUrl'] ?? ($data['image'] ?? ''),
            'category' => $data['category'] ?? ''
        ];
        array_unshift($items, $new);
        file_put_contents($PRODUCTS_FILE, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['id' => $newId]);
        break;

    case 'PUT':
        $key = getAdminKey();
        if ($key !== $ADMIN_KEY) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit; }
        if ($id === null) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
        $found = false;
        foreach ($items as &$it) {
            if (isset($it['id']) && $it['id'] == $id) {
                $it['name'] = $data['name'] ?? $it['name'];
                $it['description'] = $data['description'] ?? $it['description'];
                $it['price'] = isset($data['price']) ? (int)$data['price'] : $it['price'];
                $it['imageUrl'] = $data['imageUrl'] ?? ($data['image'] ?? $it['imageUrl'] ?? '');
                $it['category'] = $data['category'] ?? $it['category'];
                $found = true;
                break;
            }
        }
        if (!$found) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
        file_put_contents($PRODUCTS_FILE, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        $key = getAdminKey();
        if ($key !== $ADMIN_KEY) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit; }
        if ($id === null) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
        $before = count($items);
        $items = array_filter($items, function($it) use ($id) { return !isset($it['id']) || $it['id'] != $id; });
        $after = count($items);
        file_put_contents($PRODUCTS_FILE, json_encode(array_values($items), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['deleted' => $before - $after]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
