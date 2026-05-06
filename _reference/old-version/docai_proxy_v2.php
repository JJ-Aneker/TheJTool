<?php
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD']!=='POST'){die(json_encode(['error'=>'POST required']));}
if(!isset($_FILES['files'])){die(json_encode(['error'=>'No file']));}
if(!isset($_POST['token'])){die(json_encode(['error'=>'No token']));}
$file=$_FILES['files'];
$token=$_POST['token'];
echo json_encode(['status'=>'recibido','archivo'=>$file['name'],'tamaño'=>$file['size'],'token_ok'=>true]);
?>
