<?php
// Simple config for PHP endpoints
$ADMIN_KEY = 'boss123';
$PRODUCTS_FILE = __DIR__ . '/../products.json';
$PROVINCES_FILE = __DIR__ . '/../provinces.json';

// Basic CORS headers to allow requests from the same origin
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    http_response_code(200);
    exit;
}
