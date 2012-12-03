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

// the number of content items to show at once
var SHOW_AT_ONCE = 3;

var DURATION__IMAGE = 2*1000;
var DURATION__PROCESSING = 120*1000;
var DURATION__FULL_SCREEN = 10*1000;
var DURATION__UPDATE_CHECK = 5*1000;

var GET__GROUP = 'group';
var GET__CLEAR_DATA_ON_UPDATE = 'clear_data_on_update';

var FILESYTEM_STORAGE_SIZE_MB = 5000;

// used to denote titles, blurbs, etc pertaining to the group
var CLASS__GROUP = "group-";
// used to denote titles, blurbs, etc pertaining to a project
var CLASS__PROJECT = "project-";
// used to denote a particular piece of project content
var CLASS__CONTENT = "content-";

// Examples:
//
// Project-Group blurb:
//   <div class="group-blurb group-item">...</div>
// Project blurb:
//   <div class="project-1 project-blurb project-item">...</div>
// Project content:
//   <video src="http://.../master.mp4" class="project-6 content-1 project-file project-item" ></video>

var CLASS__ITEM = "item";


$(function() {

	params = getQueryParams();

	// ensure the system is up-to-date
	checkSystemStatus(params[GET__CLEAR_DATA_ON_UPDATE] != undefined, function() {

		getXMLData(function(xmlData) {

			// ensure the content files are up-to-date
			syncContentFiles(xmlData, function() {
			
				$("#system-update").hide();

				if(!params[GET__GROUP]) {
					showConfig(xmlData);
					return;
				}

				var projectData = $("group[name=\""+params[GET__GROUP]+"\"]", xmlData);
				if(projectData.length == 0) {
					z.error("cannot find group data", params[GET__GROUP]);
					return;
				}

				convertGroupXMLToDOM(projectData);
				lazyloadProcessing();
				
				// provide a cheat for cycling through the content
				$("#next").click(function() {
					_cycleContent(true);
				});
				
				// gets the system going
				_cycleContent();
			}); // syncContentFiles
		}); // getXMLData
	}); 
});


/*
 * Fetches the XML describing the contents. If we are online, we fetch it from the
 * server, otherwise we fallback to a local copy.
 */
function getXMLData(callback) {
	if(!window.localStorage) {	
		console.error("cannot find applicationCache - you need to use a different browser");
		return;
	}

	function _getLocalData() {
		contentData = window.localStorage.getItem('contentXML');
		if(contentData == null) {
			console.log("no content XML data exists - please reconnect this system to the internet");
			return;
		}
		callback($(contentData));
	}

	function _success(data) {
		console.log("updatting content XML file");
		window.localStorage.setItem('contentXML', data);
		_getLocalData();
	}

	$.ajax({
		url: './build_xml.php',
		success: _success,
		error: _getLocalData
	});
}


/* The system is capable of working without an internet connection. This is acheived by
 * using the applicationCache - a HTML 5 feature.
 */
 var _progWidth = 0;

function checkSystemStatus(clearDataFirst, proceedCallback) {

	var _notifyUser = function(msg) {
		console.log(msg);
		$("#system-update .message").text(msg);
	}

	if($("html").attr("manifest") == undefined) {
		_notifyUser("Not in an-offline mode")
		proceedCallback();
		return;
	}

	// callback ordering:
	//	 http://www.whatwg.org/specs/web-apps/current-work/multipage/offline.html
	// checking
	// -> found system for the first time
	// 		downloading
	// 		progress
	// 		cached
	// -> found and up to date
	// 		noupdate
	// -> found and out of date
	// 		downloading
	// 		progress
	// 		updateready (then need to swap the cache)
	// -> in the event of an error
	// 		error
	
	var appCache = window.applicationCache;

	if(appCache == undefined) {
		console.error("cannot find applicationCache - you need to use a different browser");
		return;
	}

	$(appCache).bind('checking', function() {
		_notifyUser('Checking for newer version of the system');
	});
	
	$(appCache).bind('obsolete', function() { 
		_notifyUser('The current system is out-dated');
	});
	
	// called when the local version is up-to-date
	$(appCache).bind('noupdate', function() { 
		_notifyUser('The current system is up-to-date and ready for offline use');
		proceedCallback();
	});
		
	$(appCache).bind('downloading', function() {
		_notifyUser('Starting to download the new version of the system');
	});

	$(appCache).bind('progress', function(evt) {
		var progress = $("#system-update .progress");
		_progWidth = (_progWidth + 1) % 100;
		progress.show().children().first().css("width", _progWidth+"%");
	});

	function _clear(cb) {
		if(clearDataFirst)
			clearFileSystem(cb);
		else
			cb();
	}

	// ready for the first time
	$(appCache).bind('cached', function() {
		_notifyUser('The system is ready for offline use');
		$("#system-update .progress").hide();
		_clear(proceedCallback);
	});

	// ready after an update
	$(appCache).bind('updateready', function() {
		appCache.swapCache();
		_clear(reloadWindow);
	});
	
	$(appCache).bind('error', function(e) {
		_notifyUser('Unable to fetch new system due to an error (see logs)');
		checkStorageUsage();
		proceedCallback();
	});
}

function checkStorageUsage(type) {
	if(window.webkitStorageInfo) {
		
		if(type == undefined)
			type = webkitStorageInfo.TEMPORARY; // the type can be either TEMPORARY or PERSISTENT

		window.webkitStorageInfo.queryUsageAndQuota(type, function(used, remaining) {
				console.log(
					"used "+
					Math.round(used/1024/1024)+"MB ("+
					Math.round(100*used/(used+remaining))+"%) of "+
					Math.round((used+remaining)/1024/1024)+"MB");
			}, function(e) {
				console.error('storage error', e); 
			});
	}
}

/**
 * Converts a URL to usable file name.
 * e.g. "http://localhost/~torb/photos/1.png" => "localhost__torb_photos_1.png"
 */
function pathToName(path) {
	var name = path.replace(/^.*?[\/.]\//, '').replace(/[^\w.]/g, '_').replace(/ /g, '-').toLowerCase();
	console.log(path, name);
	return name;
}


function fileSystemErrorHandler(e) {
	switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR:
			console.log("file quota exceeded", e);
			break;
		case FileError.NOT_FOUND_ERR:
			console.log("file not found", e);
			break;
		case FileError.SECURITY_ERR:
			console.log("security error", e);
			break;
		case FileError.INVALID_MODIFICATION_ERR:
			console.log("unable to modify the file", e);
			break;
		case FileError.INVALID_STATE_ERR:
			console.log("invalid state", e);
			break;
		default:
			console.log("unknown file system error", e);
			break;
	};
}

var _filesystem;

// This work is based on:
//	 http://www.html5rocks.com/en/tutorials/file/filesystem/
//	 http://my.safaribooksonline.com/book/web-development/html/9781449311384/working-with-files/i_section4_d1e1414
function syncContentFiles(xmlData, syncCallback) {

	/**
	 * Writes a Blob to the filesystem.
	 *
	 * @param {DirectoryEntry} dir The directory to write the blob into.
	 * @param {Blob} blob The data to write.
	 * @param {string} fileName A name for the file.
	 * @param {function(ProgressEvent)} opt_callback An optional callback.
	 *		 Invoked when the write completes.
	 */

	var writeBlob = function(dir, blob, fileName, opt_callback) {
		dir.getFile(fileName, {create: true, exclusive: true}, function(fileEntry) {

			fileEntry.createWriter(function(writer) {
				if (opt_callback) {
					writer.onwrite = function() { opt_callback(fileEntry) };
				}
				writer.write(blob);
			}, fileSystemErrorHandler);

		}, fileSystemErrorHandler);
	};

	if(!window.webkitStorageInfo) {
		console.error("cannot find webkitStorageInfo - you need to use a webkit browser");
		return;
	}

	getFileSystem(function(fs) {

		/**
		 * Fetches a file by URL and writes it to the filesystem.
		 *
		 * @param url The url the resource resides under.
		 * @param fileName The name to give the file in the FileSystem
		 */
		var fetchFile = function(url, fileName, callback) {
			// see: http://www.html5rocks.com/en/tutorials/file/xhr2/
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.responseType = 'blob';
			
			xhr.onload = function(e) {
				if(this.status == 200) {
					var blob = new Blob([xhr.response]);
					writeBlob(fs.root, blob, fileName, callback);
				}
			};
			xhr.send(null);
		};

		// for each file we:
		//		check whether it locally exists in the fileSystem and fetch missing files
		//		replace the xml path with the local version
		var processXMLFile = function(fileNumber) {
			// have we processed all of them?
			if($("file", xmlData).length == fileNumber) {
				if(syncCallback)
					syncCallback();
				return;
			}

			fileElement = $("file", xmlData).eq(fileNumber);
			remoteURL = fileElement.attr("path");
			localName = pathToName(remoteURL);

			// we keep iteratively calling ourselves back, to ensure we only process one file at time
			var nextCallback = function(fileEntry) {
				fileElement.attr("path", fileEntry.toURL());
				processXMLFile(fileNumber + 1); 
			};

			fs.root.getFile(localName, {create: false}, function(fileEntry) {
				tellTheUserWhichFileIsBeingProcessed('Found', remoteURL);
				nextCallback(fileEntry);

			}, function() {
				console.log("fetching \""+remoteURL+"\"...");
				// inform the user what's currently downloading:
				tellTheUserWhichFileIsBeingProcessed('Downloading', remoteURL);
				fetchFile(remoteURL, localName, nextCallback);
			});
		};

		processXMLFile(0);
	});
}

var _filesystem = undefined;

/* 
 * Returns a reference to the file system
 */
function getFileSystem(callback) {
	if(_filesystem != undefined) {
		callback(_filesystem);
		return;
	}

	// this part may cause Chrome to halt, while the user is asked to give permission
	window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024*FILESYTEM_STORAGE_SIZE_MB, function(grantedBytes) {
		// allowed to take up the requested space
		window.webkitRequestFileSystem(PERSISTENT, 1024*1024*FILESYTEM_STORAGE_SIZE_MB, function(fs) {

			// allow us to easily access the filesystem at a later date
			_filesystem = fs;
			callback(_filesystem);

		}, fileSystemErrorHandler); // requestFileSystem
	}, fileSystemErrorHandler); // requestQuota
}

function tellTheUserWhichFileIsBeingProcessed(actionBeingTaken, url) {
	$("#file-download").show();
	$("#file-download .filename").text(actionBeingTaken+": "+remoteURL);
}

function viewFileSystem() {
	iterateThroughFiles(function(fileEntry) {
		console.log(fileEntry.fullPath);
	});
}

function clearFileSystem(callback) {
	console.log("deleting existing files");
	iterateThroughFiles(function(fileEntry) {
		fileEntry.remove(function() {
			console.log("removed: "+fileEntry.fullPath);
		}, fileSystemErrorHandler);
	}, callback);
}

function iterateThroughFiles(entityCallback, finishedCallback) {

	if(!window.webkitRequestFileSystem) {
		console.error("cannot find webkitRequestFileSystem - you need to use a webkit browser");
		return;
	}

	getFileSystem(function(fs) {
		var dirReader = fs.root.createReader();

		dirReader.readEntries(function(results) {
			$(results).each(function(fileEntry) {
				entityCallback(results[fileEntry]);
				if(finishedCallback && fileEntry == results.length-1) {
					finishedCallback();
				}
			});
			if(!$(results).length) {
				finishedCallback();
			}
		}, fileSystemErrorHandler); // dirReader.readEntries
	}); // getFileSystem
}

function showConfig(xmlData) {
	$("body").children().hide();
	$("#config-screen").show();

	$("group", xmlData).each(function(i, j) {
		var name = $(this).attr("name");
		$("#suggestions-frame").append($("<a>")
			.attr("href", "?"+GET__GROUP+"="+name)
			.text(name)
		)
		.append("<br>");
	});
}

// Takes a URL and converts it to the appropriate file type
function _createFile(fileURL) {

	if(fileURL.match(/\.(pde)$/g)) {
		// <canvas data-processing-sources="anything.pde"></canvas>
		return $("<canvas data-processing-sources=\"" +fileURL+ "\">");
		// cannot use:
		// v = $("<canvas>").data("processing-sources", d);

	} else if(fileURL.match(/\.(png|gif|jpe?g)$/g)) {
		return $("<img>").attr("src", fileURL);

	} else if(fileURL.match(/\.(mov|mp4|m4v|mpe?g|mov|swf)$/g)) {
		//return $("<video>").attr("src", fileURL);
		return $("<div>").addClass("video").data("src", fileURL);
		
	} else {
		console.error("unknown file", fileURL);
		return $("<div>");
	}
}

var _converter = undefined;

function _createText(textElement) {
	if(!_converter)
		_converter = new Showdown.converter();

	text = textElement.text();

	if(textElement.attr("type") == "contact")
		text = "<span class=\"small\">for more information contact:</span> " + text;

	content = $("<div>").append( $(_converter.makeHtml(text)) );

	// convert it to use filesystem URL (starting with "filesystem:")
	$("img", content).each(function(i) {
		var image = $(this);

		// give it unique ID that we can use to later look it up and update its details
		getFileSystem(function(fs) {
			fs.root.getFile(pathToName(image.attr("src")), {create: false}, function(fileEntry) {
				image.attr("src", fileEntry.toURL());
			}, fileSystemErrorHandler);
		});
	});

	return content;
}

// Places an element into the DOM, based on its name.
// e.g. project-blurb, group-title, project-logo
function _placeElement(element, isGroupElement, name, supressError) {
	
	var prefix = isGroupElement == true ? CLASS__GROUP : CLASS__PROJECT;
	var elementClass = prefix+name.replace(/[^\w\d]/g, '-');
	var phTxt = ".placeholder."+elementClass;

	var placeholder = $(phTxt);
	
	if(placeholder.length > 0) {
		placeholder.after(element
			.addClass(elementClass)
			.addClass(prefix+CLASS__ITEM));
		return true;
	} else if(supressError !== true) {
		console.error("missing placeholder", phTxt);
	}

	return false;
}

// Processes a level of the XML data
function convertGroupXMLToDOM(projectXMLData, projectNum) {

	// project text
	projectXMLData.children("text").each(function() {
		_placeElement(_createText($(this)), true, $(this).attr("type"));
	});

	// see if any special project files exist (e.g. logo), otherwise pretend they were in a group
	projectXMLData.children("file").each(function() {
		// try to place it using its more specific name:
		if( !_placeElement(_createFile($(this).attr("path")), true, $(this).attr("name"), true) ) {
			// move it to a new group, so we can pretend each top level file is a group
			projectXMLData.append($("<project>").append($(this)));
		}
	});

	// pre-emptively remove empty projects (we do this first to ensure the pNum value is correct)
	$("project", projectXMLData).each(function() {
		if($(this).children().length == 0)
			$(this).remove();
	});

	$("project", projectXMLData).each(function(pNum) {

		// adds the classes needed for finding and hiding this content
		function markupElement(e) {
			return e
				.addClass(CLASS__PROJECT+(pNum+1))
				.hide();
		};

		// project content (only consists of files right now)
		$(this).children("file").each(function(fNum) {
			var e = markupElement(_createFile($(this).attr("path")))
					.addClass(CLASS__CONTENT+(fNum+1))
					.css("z-index", fNum+1); // ensure later file appears on top of earlier ones

			// allow this to potentially be position somewhere special
			if(!_placeElement(e, false, $(this).attr("name"), true) )
				_placeElement(e, false, "file");
		});

		// project level text
		$(this).children("text").each(function() {
			_placeElement(
				markupElement(_createText($(this))), 
				false, 
				$(this).attr("type"));
		});

		$("#project-markers").append($("<div>").text(pNum+1));
	});

	$(".placeholder").remove();
}


function lazyloadProcessing() {
	// only do so if necessary
	if($("canvas").length > 0) {
		jQuery.getScript("js/vendor/processing-1.4.0.js", function() {
			Processing.reload();
		});
	}
}




_transitionTimeout = undefined;
_currentProject = undefined;
_currentContent = undefined;

// cycle through the contents
var _cycleContent = function(forceNewProject) {
	
	// this might be a forced transition, so we kill the waiting one
	if(_transitionTimeout != undefined)
		clearTimeout(_transitionTimeout);

	// initial state and roll around state
	var nextProject = 1;
	var nextContent = 1;

	if(_currentProject != undefined) {
		// is there another piece of content to show?
		console.log("."+CLASS__PROJECT+_currentProject+"."+CLASS__CONTENT+(_currentContent+1));
		if(forceNewProject !== true && $("."+CLASS__PROJECT+_currentProject+"."+CLASS__CONTENT+(_currentContent+1)).length > 0) {
			nextProject = _currentProject;
			nextContent = _currentContent + 1;

		// is there another project to show?
		} else if($("."+CLASS__PROJECT+(_currentProject+1)+"."+CLASS__CONTENT+1).length > 0) {
			nextProject = _currentProject + 1;
		}
	}
		
	// ensure there is only Processing piece showing at a time
	$("canvas").each(function() {
		if($(this).attr("id"))
			Processing.getInstanceById($(this).attr("id")).noLoop(0);
	});

	_revealNextContent(nextProject, nextContent);
}


function _revealNextContent(nextProject, nextContent) {

	// are we switching project? (includes the first transistion)
	if(nextProject != _currentProject) {
		// change the project marker
		$("#project-markers div").removeClass("selected");
		$("#project-markers div").eq(nextProject-1).addClass("selected");
		
		// an existing project is still showing:
		//	hide the old content before continuing
		if(_currentProject != undefined) {
			$("."+CLASS__PROJECT+_currentProject).fadeOut(500);
			setTimeout(function() {

				//$("video").trigger("pause"); // stop any video from playing
				$("video").remove(); // remove the video, given we recreate it each time

				_currentProject = undefined;
				_revealNextContent(nextProject, nextContent);	
			}, 800);
			return;

		// prior to revealing the new project info, we resize the screen
		} else {
			// select all the non-file-based content and temporarily show it so we can compute the required size
			hiddenContent = $("."+CLASS__PROJECT+nextProject+":not(.project-file)").show();
			// prior to revealing a new project, we resize the left panel to fit the project content
			adaptSize();
			// rehide the content
			hiddenContent.hide();

			setTimeout(function() {
				_currentProject = nextProject;
				_revealNextContent(nextProject, nextContent);	
			}, 500);
			return;
		}
	}

	// at this point: _currentProject == nextProject
	// the prior project content will have been hidden, now we just need to reveal the new stuff

	var toShowName = "."+CLASS__PROJECT+nextProject+"."+CLASS__CONTENT+nextContent;
	var toShow = $(toShowName);
	
	if(toShow.length != 1) {
		console.error("unexpected content", toShowName, toShow);
		return;
	}

	// lazy load the video (this ensures it's initialised and cached)
	if(toShow.hasClass("video") && toShow.is("div")) {
		var tmp = $("<video>")
				.hide()
				.attr("src", toShow.data("src"))
				.attr("class", toShow.attr("class"))
				.prop("autoplay", "1")
				.bind("canplaythrough", function() {
					// we call ourselves back now we have a video element
					showContent(tmp, nextProject, nextContent);
				});
		toShow.before(tmp); //.remove();
		return;
	} else {
		showContent(toShow, nextProject, nextContent);
	}
}

function showContent(toShow, nextProject, nextContent) {
	
	var waitDuration = DURATION__IMAGE;
	var x = -1;
	var y = -1;
	
	// if:
	//	 no non-file-based is being shown (e.g. titles, blurbs, contact)
	//   no group information is being shown (e.g. titles, blurbs, contact)
	// we make the file take up the whole screen
	if($("."+CLASS__PROJECT+nextProject+":not(.project-file), ."+CLASS__GROUP+CLASS__ITEM).length == 0) {
		toShow = prepareForFullscreen(toShow);
		waitDuration = DURATION__FULL_SCREEN;
		
	} else if(toShow.is("video") || toShow.is("canvas")) {
		// center it
		x = (toShow.parent().innerWidth() - toShow.width()) / 2;
		y = (toShow.parent().innerHeight() - toShow.height()) / 2;
	
	} else {
		// randomly position it, for a bit of variation
		x = randInt($("#pane-contents").width() - toShow.width());
		y = randInt($("#pane-contents").height() - toShow.height());
		toShow.css("-webkit-transform", "rotate("+(randInt(6)-3)+"deg)");
	}

	if(x > 0)
		toShow.css("right", x+"px");
	if(y > 0)
		toShow.css("bottom", y+"px");

	// we select it prior to showing our new content to avoid selecting a new full-screen element
	fullscreenHide = $(".full-screen-frame:visible");
	
	// reveal the content (including possibly the project-data):
	$("."+CLASS__PROJECT+nextProject+":not(.project-file)").add(toShow).fadeIn(500);

	setTimeout(function() {
		if(toShow.is("video")) {
			toShow.trigger("play");
			if(!isNaN(toShow.get(0).duration))
				waitDuration = Math.max(parseInt(toShow.get(0).duration*1000)+1000, waitDuration);
		}

		if(toShow.is("canvas")) {
			if(toShow.attr("id"))
				Processing.getInstanceById(toShow.attr("id")).loop(0);
			waitDuration = DURATION__PROCESSING;
		}

		// possibly hide some previous content
		$("."+CLASS__CONTENT+(nextContent-SHOW_AT_ONCE)).fadeOut(500);
		fullscreenHide.hide();
	
		// show the duration at the bottom as loading bar
		$("#progress div").stop().css("width", "0%");
		$("#progress div").animate({width:"100%"}, waitDuration);

		// set up the next transition
		_currentContent = nextContent;
		console.log(_currentContent, nextContent);
		_transitionTimeout = setTimeout(_cycleContent, waitDuration);

	}, 500);
};


// Alters the size of the left-content box (the area that holds the blurb and project title)
// in such a way that all the content is visible without needing to scroll
function adaptSize() {

	$(".resize-to-fit-content").each(function() {

		widthDefault = $(this).data("default-width");
		
		if(widthDefault == undefined) {
			console.error("you need to provide a 'data-default-width' on '.resize-to-fit-content' element");
			return;
		}

		widthDefault = parseInt(widthDefault);

		// we store the previous width as data to ensure it doesn't get munged into a non-percentage representation
		widthCurrent = $(this).data("current-width");
		if(!widthCurrent)
			widthCurrent = widthDefault;
		
		widthProposed = widthDefault;

		// set it to our initial width
		$(this).css("width", widthProposed+"%");

		while(	$("body").height() > $(window).height() && // the body is cut off
				widthProposed < 90) { // we have not exceeded our limit

			widthProposed++;
			$(this).css("width", widthProposed+"%");
		}
		
		$(this).data("current-width", widthProposed);
		// revert to its current width
		$(this).css("width", widthCurrent+"%");
		// transistion to the new size
		$(this).animate({ width: widthProposed+"%" });
	});
}


function prepareForFullscreen(element) {
	if(element.parents(".full-screen-frame").length > 0) {
		element = element.parents(".full-screen-frame").first();
			
	} else {
		element = $("<div>")
			.hide()
			.append(element.show())
			.addClass("full-screen-frame");

		$("body").prepend(element);
	}
	// make sure it is on top
	$(".full-screen-frame").css("z-index", 9);
	element.css("z-index", 10);

	return element;
}


