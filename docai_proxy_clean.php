<?php
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD']!=='POST'){die(json_encode(['error'=>'POST required']));}
if(!isset($_FILES['files'])||!isset($_POST['token'])){die(json_encode(['error'=>'Missing files or token']));}
$file=$_FILES['files'];
$token=$_POST['token'];
$url='https://canon.docai.es/DocAI/v1/extract/82245b92-2820-89f3-403d-3a1fd56d28e7/82b6a2d6-aed2-3fff-e35f-3a1fd57e63f6';
$boundary='----'.uniqid();
$body='--'.$boundary."\r\n".'Content-Disposition: form-data; name=files; filename="'.$file['name'].'"'."\r\n".'Content-Type: '.$file['type']."\r\n\r\n".file_get_contents($file['tmp_name'])."\r\n".'--'.$boundary.'--'."\r\n";
$ch=curl_init($url);
curl_setopt_array($ch,[CURLOPT_POST=>1,CURLOPT_POSTFIELDS=>$body,CURLOPT_RETURNTRANSFER=>1,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token,'Content-Type: multipart/form-data; boundary='.$boundary],CURLOPT_TIMEOUT=>60,CURLOPT_SSL_VERIFYPEER=>0]);
$response=curl_exec($ch);
http_response_code(curl_getinfo($ch,CURLINFO_HTTP_CODE));
curl_close($ch);
echo $response;
?>
