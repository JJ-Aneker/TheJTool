<?php
/**
 * DocAI Proxy - Reenvía archivos a canon.docai.es sin CORS
 */

// Headers para respuestas JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Responder a OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Método no permitido', 'method' => $_SERVER['REQUEST_METHOD']]));
}

try {
    // Validar que hay archivo
    if (!isset($_FILES['files']) || $_FILES['files']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        $error = $_FILES['files']['error'] ?? 'Desconocido';
        die(json_encode(['error' => 'No se recibió archivo válido', 'upload_error' => $error]));
    }

    $file = $_FILES['files'];
    $token = $_POST['token'] ?? null;

    if (!$token) {
        http_response_code(401);
        die(json_encode(['error' => 'Token requerido en $_POST[token]']));
    }

    // Limpiar prefijo "Bearer " si existe
    $token = str_replace('Bearer ', '', trim($token));

    // URL destino
    $docaiUrl = 'https://canon.docai.es/DocAI/v1/extract/82245b92-2820-89f3-403d-3a1fd56d28e7/82b6a2d6-aed2-3fff-e35f-3a1fd57e63f6';

    // Preparar multipart/form-data
    $boundary = '----WebKitFormBoundary' . uniqid();
    $eol = "\r\n";

    // Leer contenido del archivo
    $fileContent = file_get_contents($file['tmp_name']);
    if ($fileContent === false) {
        http_response_code(500);
        die(json_encode(['error' => 'No se pudo leer el archivo']));
    }

    $fileName = $file['name'];
    $fileMime = $file['type'] ?: 'application/octet-stream';

    // Construir body multipart
    $body = '';
    $body .= '--' . $boundary . $eol;
    $body .= 'Content-Disposition: form-data; name=files; filename="' . $fileName . '"; filename*=utf-8\'\'' . rawurlencode($fileName) . $eol;
    $body .= 'Content-Type: ' . $fileMime . $eol;
    $body .= $eol;
    $body .= $fileContent;
    $body .= $eol . '--' . $boundary . '--' . $eol;

    // Inicializar cURL
    if (!function_exists('curl_init')) {
        http_response_code(500);
        die(json_encode(['error' => 'cURL no está habilitado en el servidor']));
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $docaiUrl,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Content-Type: multipart/form-data; boundary=' . $boundary,
            'Content-Length: ' . strlen($body)
        ],
        CURLOPT_TIMEOUT => 60,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0
    ]);

    // Ejecutar petición
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    // Manejar errores cURL
    if ($curlError) {
        http_response_code(500);
        die(json_encode(['error' => 'Error cURL', 'details' => $curlError]));
    }

    if ($response === false) {
        http_response_code(500);
        die(json_encode(['error' => 'No se recibió respuesta de DocAI']));
    }

    // Devolver respuesta de DocAI
    http_response_code($httpCode);
    echo $response;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Exception', 'message' => $e->getMessage()]);
}
?>

