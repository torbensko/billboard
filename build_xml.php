<?php

/*
 * Spits the contents out to a variable called XMLdata
 */

require_once("globals.php");

// folders that are not included in the XML
define("IGNORE_FOLDERS", "/(ignore(d)?|private|src)\/?$/");

// files that are not included in the XML
define("IGNORE_FILES", "/^\\.|\\.(psd|pdf)$/");

// files which will be placed in their own XML element e.g. <logo src="blah" />
define("SPECIAL_FILES", "/^(logo\\.)/");

// Removes "../" from a path
function resolvePath($path) {
	$p = "";
	$path = preg_replace("%\\./\\.\\./%", "../", $path);
	do {
		$p = $path;
		$path = preg_replace("%[^/]+/\\.\\./%", "", $p);
	} while(strlen($path) != strlen($p));
	return $path;
}

// If we are in the root level, we treat all the files we find as a project
function scanDirectory($dir, &$xmlStructure) {
	
	if(!is_dir($dir))
		return;

	foreach(scandir($dir) as $f) {
		if(!preg_match(IGNORE_FILES, $f)) {
			_processFile($dir, $f, $xmlStructure);
		}
	}
}

function _processFile($dir, $f, &$xmlStructure) {
	$filepath = "$dir/$f";
	// $fileURL = "http://".$_SERVER[SERVER_NAME].dirname($_SERVER[SCRIPT_NAME]).substr($dir, 1)."/$f";

	// what level are we at?
	$depth = strlen(preg_replace("/[^\/]/", "", $dir));

	// for directories (including symbolic links)
	if(is_link($filepath) || is_dir($filepath)) {

		// we don't examine some certain folders
		if(preg_match(IGNORE_FOLDERS, $filepath))
			return;
		
		$name = "subfolder";
		switch($depth) {
			case 1: $name = "group";	break;
			case 2:	$name = "project";	break;
		}

		$subnode = $xmlStructure->addChild($name);
		$subnode->addAttribute("name", $f);
		$subnode->addAttribute("depth", $depth);
		$subnode->addAttribute("path", $filepath);

		// resolve the link
		if(is_link($filepath))
			$filepath = resolvePath("$dir/".readlink($filepath));
			
		scanDirectory($filepath, $subnode);
	
	// for text contents, e.g. contact
 	} else if(preg_match("/\.(txt|md)$/", $f)) {
 		if(is_readable($filepath)) {
			$text = trim(file_get_contents($filepath));
			if(strlen($text)) {
				$subnode = $xmlStructure->addChild("text", htmlentities($text));
				$subnode->addAttribute("type", preg_replace("/\\.(txt|md)/", "", $f));
			}
		}
	
	// content files
	} else {
		$subnode = $xmlStructure->addChild("file");
		$subnode->addAttribute("path", $filepath);
		$subnode->addAttribute("name", preg_replace("/\\.[^.]+$/", "", $f));
	}
}

// creating object of SimpleXMLElement
$xml = new SimpleXMLElement("<?xml version=\"1.0\" encoding=\"UTF8\" ?><contents></contents>");
$contents = scanDirectory(DIR__CONTENTS, $xml);

echo $xml->asXML();

?>

