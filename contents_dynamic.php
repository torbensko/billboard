<?php

/*

Billboard - a program for cycling through a mix of user provided content, in
manner that is visually captivating. It is well suited to foyer and marketing
displays.

Copyright (C) 2012 Torben Sko, Henry Gardner

This file is provided under the MIT License. Permission is hereby granted,
free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/


/*
 * Spits the contents out to a variable called XMLdata
 */

define("LF", chr(10));

define("DIR__CONTENTS",	"./contents");

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

