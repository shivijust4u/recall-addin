<?php
	header('Access-Control-Allow-Origin: *');
	header('Content-type: application/json;charset=utf-8');

	$make       = $_REQUEST['make'];
	$model      = $_REQUEST['model'];
	$year       = $_REQUEST['year'];
    $recallId   = $_REQUEST['id'];
    $database   = $_REQUEST['database'];
    $userName   = $_REQUEST['userName'];
    $sessionId  = $_REQUEST['sessionId'];
    $hostName   = $_REQUEST['hostName'];
    $referer = $_SERVER["HTTP_REFERER"];
	$file = "nhtsa.txt";
    // echo $database .$userName .$sessionId;
    $url = 'https://'+$hostName+'/apiv1';
    $url = 'https://my237.geotab.com/apiv1';
    $ch = curl_init($url);
    //setup request to send json via POST
    $data = array(
        "database"  => $database,
        "userName"  => $userName,
        "sessionId" => $sessionId
    );
    $payload = json_encode(array("method"=>"GetCountOf","params"=>array("typeName" => "Device","credentials" => $data)));
   
    $payload = json_encode(array("method"=>"GetVersionInformation"));
    // echo "<br>".$payload;
    //attach encoded JSON string to the POST fields
    curl_setopt($ch, CURLOPT_POST, 1);    
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    // Verbose for Debugging
    // $verbose = fopen('php://temp', 'w+');
    // curl_setopt($ch, CURLOPT_STDERR, $verbose);
    
    $response = curl_exec($ch);
    // Verbose for Debugging
    // rewind($verbose);
    // $verboseLog = stream_get_contents($verbose);
    // echo "Verbose information:\n<pre>", htmlspecialchars($verboseLog), "</pre>\n";
    curl_close($ch);
    if ($response === false) {
        $info = curl_getinfo($ch);
        echo strip_tags($info);
    } else {		
        // echo ("RESPONSE IS TRUE!");
        // echo strip_tags($response);
        $obj = json_decode($response);
        if(array_key_exists('error',$obj)){
            echo "Error exits! Aborting NHTSA Request";
        }
        else{
            // echo "No errors! Response Successful";
            if(isset($_REQUEST['id'])){
                $requestURL = 'https://one.nhtsa.gov/webapi/api/Recalls/vehicle/CampaignNumber/' . rawurlencode($recallId) . '?format=json';
                file_put_contents($file, "\r\nV3 Request ID:". $recallId ." URL: " . $requestURL . " Referer: " . $referer, FILE_APPEND | LOCK_EX);
            }else{
                $requestURL = 'https://one.nhtsa.gov/webapi/api/Recalls/vehicle/modelyear/' . rawurlencode($year) . '/make/' . rawurlencode($make) . '/model/' . rawurlencode($model) . '?format=json';
                file_put_contents($file, "\r\nV3 Recalls For: ". $make . " " . $model . " " . $year . " URL: " . $requestURL . " Referer: " . $referer, FILE_APPEND | LOCK_EX);
            }	
            $curl = curl_init($requestURL);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 2);
            curl_setopt($curl,CURLOPT_HTTPHEADER,$headers);
            $curl_response = curl_exec($curl);
            curl_close($curl);
            if ($curl_response === false) {
                $info = curl_getinfo($curl);
                echo strip_tags($info);
            } else {		
                echo strip_tags($curl_response);
            }
        }
    }
?>