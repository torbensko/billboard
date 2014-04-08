# Overview

The billboard program is a HTML 5 webapp designed to continually cycle through a mix of user provided content, including images, video, text and [Processing](www.processing.org) pieces. The system is well suited to public displays, such as foyer displays.

A demo of the piece can be found on my [website](http://local.torbensko.com/downloads/billboard).

## Features

*	Runs on Chrome making it a cross-platform solution
*	Automatically downloads and caches all files making it possible to use the system without an internet connection
*	Includes a script to configure a Ubuntu box into a completely automated billboard
*	Dynamically changes it appearance based on the content including a full-screen image mode.





# Setting Up

The system involves the following components: 

-	The display content
-	A *server*, which holds the primary copy of the display content
-	One or more *display computers*, each with their own copy of the user-content.

Each display computer only needs to connect to the server once in order to fetch the user content. This process involves visiting a specific URL on the *server*. The rest of the process (i.e. syncronising the content and system files) is automatically handled by the *display computer*.


## Display content

The content to be displayed resides in the `contents` folder (an example is included). The content displayed by the system is organised into *groups*, which contains one or more *projects*. Each display computer will cycle through the *projects* of a chosen *group*.

The group/project structure is defined by the folder structure of the contents directory. For example:

![Example file structure layout.](https://raw.github.com/torbensko/billboard/master/README_img/content_structure.png)

Within each group and project folder the following files are allowed:

- 	title.txt/md
	
	Allowable within both group and project folders
	

-	blurb.txt/md

	Allowable within both group and project folders

-	contact.txt/md

	Allowable within both group and project folders

-	logo.png
	
	Allowable within group folders

-	images (e.g. jpg, png), videos (e.g. mov, mp4), Processing code (i.e .pde)
	
	Allowable within project folders

	Images are shown as a slide-show (fullscreen when no other content exists), while the videos and Processing pieces are shown one at a time. The layout of these elements can be seen here:

	![An illustration of how the system adapts it appearance based on what content is included.](https://raw.github.com/torbensko/billboard/master/README_img/layout_examples.png)

- 	Symbolic link
	
	Allowable within the group folders

	This allows a project to appear across multiple groups.


The layout of these elements can be seen below. The pages dynamically resizes itself to ensure all text is visible, making it important to keep the blurbs concise.

![An illustration of how each of the content elements are positioned.](https://raw.github.com/torbensko/billboard/master/README_img/layout_elements.png)



## The Server

The server can either be setup as a simple file server or as a more responsive PHP server. Both are detailed below.

### File/static server

A simple Node based file server is included. While simpler to run, this approach requires you manually update an XML file whenever altering the display content. 

The included file server can be started using the command:

	node simpleServer.js

You can then access the system via

	http://localhost:8080

If you update your display content, you will need to regenerate the XML describing your display content. This can be done by running the command:

	php contents_dynamic.php > contents_static.xml

You will also need to update the `offline.appcache` file. This can be done be done by running:

	cd scripts 
	./generateAppcacheFile.sh


## Dynamic server

A set of PHP scripts are included that avoid the need to regenerate the display content XML file. dynamically create the XML file. 

To set up a new server, you will need to the following:

1. 	Install Apache (or similar server). If you are using Ubuntu, the *scripts/setup.sh* script can help you install this.
2.	Clone this repo into your public server directory (typically */var/www/*)
3.	Run the script *_dev/create-manifest.sh*. This will create a manifest file, which will ensure the website functions as an off-line application (this is a HTML5 feature). You need to re-run this script if you edit any of your system files (i.e. non-content files). Re-running the script will ensure the system updates the next time you connect to the server.
4.	Place within the *content* folder your content, following the structure previously outlined.


## Display computer

Each display computer shows the content from a chosen *group*. The instructions below explain how to set up a machine to work as dedicated billboard machine.


### The quick set up: (single screen, auto-start)

1.	Install Chrome
2.	Visit the server via the appropriate URL, e.g. *http://[SERVER_IP]/billboard/*. This will cause the system to download to your browser.
3.	Using the menu now displayed in your browser, choose the *group* you wish to view.
4.	Set the current URL as your homepage.
	*	Open the settings (the wrench)
	*	Under the *On Startup* option, choose *Open a specific page...*, click *Set pages* and click *Use current pages*
5.	You can now restart your browser and, regardless of whether you are connected to the internet, the system will appear and start playing.
6.	Add Chrome to your start up items to have the system automatically on start-up. For Ubuntu, this can be done by:
	*	Under the Ubuntu system menu (the cog icon at the top right of the screen), choose "Startup Application"
	*	Add an entry with the following:
	
			google-chrome --kiosk


### To set up from scratch: (multi-screen, auto-start/stop)

The repository also includes a script to help you set up a display system so that it displays across multiple screens (with each screen displaying a *group*) and it automatically starts-up and shuts down. This script is written for Ubuntu (tested with version 12.04). 

1.	Install Ubuntu. During the install, ensure you choose to install the third-party software.
2.	Download from this repository *scripts/setup.sh*. If you already have the server set up:
	*	Navigate to the system URL, e.g. *http://[SERVER_IP]/billboard/*
	*	On the home page will be a link to the script
3.	Run the script. This should guide you through the rest of the set up process, including:
	*	Fetch the required software, including *Google Chrome* and a tool that ensures the cursor remains hidden
	*	Guide you through through the process of setting up multiple screens. The outcome of this process is written to a file located within the same folder as the script. If you wish to later change the configuration, you can directly alter this file
	*	Set up a cron job responsible for ensuring that Chrome is open, correctly sized and showing the correct content. This cron job executes the same script file (i.e. *setup.sh*) so it is important that this file is not moved once run 
	*	Modify some of the Ubuntu settings to ensure the BIOS clock does not get set to the wrong time by Ubuntu (by default, it likes to use UTC time, which means that our scheduled time to start up will be quite a bit different to what we expect)
4.	The system should now automatically run. After about a minute a Chrome window(s) should open. Tell it not to set itself as the default browser - you will only need to do this once. After about another minute, the Chrome window(s) should automatically reposition and resize themselves.
5.	Once you are happy the system is working, shutdown the computer and reboot into its BIOS (check the loading screen to see what key needs to be held to enter this mode)
6.	Set the machine to boot up at an appropriate time (this functionality may not be available on all computers).


## Development

To clear the appcache in Chrome visit:
	
	chrome://appcache-internals/

