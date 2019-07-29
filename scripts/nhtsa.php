<?php
	header('Access-Control-Allow-Origin: *');
	header('Content-type: application/json;charset=utf-8');
	//Add domain security to Access-Control-Allow-Origin: function that will create an array of my0-my500.geotab.com
	//Referer check can be added as well: https://my112.geotab.com/

	$make       = $_REQUEST['make'];
	$model      = $_REQUEST['model'];
	$year       = $_REQUEST['year'];
	$recallId   = $_REQUEST['id'];
	$referer = $_SERVER["HTTP_REFERER"];
	$file = "nhtsa.txt";

	if(isset($_REQUEST['id'])){
		$requestURL = 'https://one.nhtsa.gov/webapi/api/Recalls/vehicle/CampaignNumber/' . rawurlencode($recallId) . '?format=json';
		file_put_contents($file, "\r\nV3 Request ID:". $recallId ." URL: " . $requestURL . " Referer: " . $referer, FILE_APPEND | LOCK_EX);
	}else{
		$requestURL = 'https://one.nhtsa.gov/webapi/api/Recalls/vehicle/modelyear/' . rawurlencode($year) . '/make/' . rawurlencode($make) . '/model/' . rawurlencode($model) . '?format=json';
		file_put_contents($file, "\r\nV3 Recalls For: ". $make . " " . $model . " " . $year . " URL: " . $requestURL . " Referer: " . $referer, FILE_APPEND | LOCK_EX);
	}	
	$curl       = curl_init($requestURL);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 2);
	curl_setopt($curl,CURLOPT_HTTPHEADER,$headers);
	$curl_response = curl_exec($curl);
	curl_close($curl);
	if ($curl_response === false) {
		$info = curl_getinfo($curl);
		echo $info;
	} else {		
		echo $curl_response;
	}
?>