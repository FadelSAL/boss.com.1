<?php
require_once __DIR__ . '/server/config.php';
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!file_exists($PROVINCES_FILE)) file_put_contents($PROVINCES_FILE, json_encode([]));
$items = json_decode(file_get_contents($PROVINCES_FILE), true);

function getAdminKey() {
    if (isset($_SERVER['HTTP_X_ADMIN_KEY'])) return $_SERVER['HTTP_X_ADMIN_KEY'];
    if (isset($_GET['key'])) return $_GET['key'];
    return null;
}

switch ($method) {
    case 'GET':
        echo json_encode($items, JSON_UNESCAPED_UNICODE);
        break;

    case 'POST':
        $key = getAdminKey();
        if ($key !== $ADMIN_KEY) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit; }
        $maxId = 0; foreach ($items as $it) if (!empty($it['id']) && $it['id'] > $maxId) $maxId = $it['id'];
        $newId = $maxId + 1;
        $new = [
            'id' => $newId,
            'key' => $data['key'] ?? ('prov_' . time()),
            'name' => $data['name'] ?? '',
            'cost' => isset($data['cost']) ? (int)$data['cost'] : 0
        ];
        array_push($items, $new);
        file_put_contents($PROVINCES_FILE, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['id' => $newId]);
        break;

    case 'PUT':
        $key = getAdminKey();
        if ($key !== $ADMIN_KEY) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit; }
        if ($id === null) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
        $found = false;
        foreach ($items as &$it) {
            if (isset($it['id']) && $it['id'] == $id) {
                $it['key'] = $data['key'] ?? $it['key'];
                $it['name'] = $data['name'] ?? $it['name'];
                $it['cost'] = isset($data['cost']) ? (int)$data['cost'] : $it['cost'];
                $found = true;
                break;
            }
        }
        if (!$found) { http_response_code(404); echo json_encode(['error' => 'Not found']); exit; }
        file_put_contents($PROVINCES_FILE, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        $key = getAdminKey();
        if ($key !== $ADMIN_KEY) { http_response_code(403); echo json_encode(['error' => 'Forbidden']); exit; }
        if ($id === null) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
        $before = count($items);
        $items = array_filter($items, function($it) use ($id) { return !isset($it['id']) || $it['id'] != $id; });
        $after = count($items);
        file_put_contents($PROVINCES_FILE, json_encode(array_values($items), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['deleted' => $before - $after]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}