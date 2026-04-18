<?php
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD']!=='POST'){die(json_encode(['error'=>'POST required']));}
if(!isset($_FILES['files'])||!isset($_POST['token'])){die(json_encode(['error'=>'Missing data']));}
$f=$_FILES['files'];
$t=$_POST['token'];
$u='https://canon.docai.es/DocAI/v1/extract/82245b92-2820-89f3-403d-3a1fd56d28e7/82b6a2d6-aed2-3fff-e35f-3a1fd57e63f6';
$fc=file_get_contents($f['tmp_name']);
if($fc===false){http_response_code(500);die(json_encode(['error'=>'Cannot read file']));}
$b='----'.uniqid()."\r\n".'Content-Disposition: form-data; name=files; filename="'.$f['name'].'"'."\r\n".'Content-Type: '.$f['type']."\r\n\r\n".$fc."\r\n".'----'.uniqid().'--'."\r\n";
$c=curl_init($u);
if(!$c){http_response_code(500);die(json_encode(['error'=>'curl_init failed']));}
curl_setopt($c,CURLOPT_POST,1);
curl_setopt($c,CURLOPT_POSTFIELDS,$b);
curl_setopt($c,CURLOPT_RETURNTRANSFER,1);
curl_setopt($c,CURLOPT_HTTPHEADER,['Authorization: Bearer '.$t,'Content-Type: multipart/form-data']);
curl_setopt($c,CURLOPT_TIMEOUT,60);
curl_setopt($c,CURLOPT_SSL_VERIFYPEER,0);
$r=curl_exec($c);
$cd=curl_getinfo($c,CURLINFO_HTTP_CODE);
curl_close($c);
http_response_code($cd);
echo $r;
?>
