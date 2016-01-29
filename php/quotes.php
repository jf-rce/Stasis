<?php

if ($_SERVER['REQUEST_METHOD'] == 'GET'){


  $symbol = $_GET['symbol'];
 
  if (!is_null($symbol)){
    
    //CORS redirect
    $file_url = 'http://finance.yahoo.com/d/quotes.csv?s=' . $symbol . '&f=sb2b3jk';
    header('Content-Type: application/octet-stream');
    header("Content-Transfer-Encoding: Binary"); 
    header("Content-disposition: attachment; filename=\"" . "quotes.csv" . "\""); 
    //Do the double-download dance
    readfile($file_url);

  }
  else{
  	header("HTTP/1.1 400 Bad Request");
  	print("Format not recognized");
  	exit();
	  
  }



}


?>