<?php

require_once("globals.php");

// build a list of project-groups:
$projectGrps = array();
foreach(scandir(DIR__CONTENTS) as $f) {
	if(!preg_match("/^\\./", $f) && is_dir(DIR__CONTENTS."/$f"))
		array_push($projectGrps, $f);
} 

?>

<html>
	<head>
	</head>
	<body>
		<?php
		foreach($projectGrps as $p)
			echo "$p<br>";
		?>
	</body>
</html>
