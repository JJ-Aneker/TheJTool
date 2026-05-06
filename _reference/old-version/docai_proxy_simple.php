<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'POST requerido']);
    exit;
}

if (!isset($_FILES['files'])) {
    echo json_encode(['error' => 'No hay archivo']);
    exit;
}

$token = $_POST['token'] ?? 'sin token';

echo json_encode([
    'status' => 'ok',
    'message' => 'Proxy funcionando',
    'archivo' => $_FILES['files']['name'],
    'tamaño' => $_FILES['files']['size'],
    'token_recibido' => !empty($token)
]);
?>
