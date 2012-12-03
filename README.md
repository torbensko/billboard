# Overview

This program cycles through a mix of user provided content (images, video and text), in
manner that is visually captivating. It is well suited to foyer and marketing
displays. For example, the system has been used in a university context to display the following:

*	The work of a *research group* by showing the details of some of the projects undertaken by the group.
*	An *undergraduate course* via examples of students work.
*	A *special interest group*, such as a Computer Science Student Association (CSSA), by showing images from several of the group events.

Some of the key features of the system include:

*	Easy, one-time set up for each display computer.
*	Beyond the set up, the system does not require an internet connection, allowing it to (theoretically) run indefinitely.
*	It only requires the Chrome web-browser, making it easy to set up, free and cross-platform.
*	It includes a script to help set up a computer from scratch. The script allows an operational period to be specified, ensuring each display computer can run unaided.
*	The system automatically determines how best to display the user-provided content. The user need only provide their content.
*	Includes support for text, images, video and [Processing](www.processing.org) artworks.



# Content Organisation

The content displayed by the system is organised into *groups* and *projects*. Each *group* contains one or more *projects*, with all the projects being related to a common, group theme, e.g. the works of a research group. At any given time, a computer will cycle through the *projects* of a chosen *group*. The computer retains the content for all *groups*, thereby allowing it to used to show a different *group* in the future.

For example, all three groups mentioned above (the research group, undergrad course and special interest group) could be loaded onto a display computer, although only one can be displayed a once.

The following explains what kinds of content the system accepts:

*	- *Content Type:* title.txt (or .md)
	- *Allowable within:* group, project
	- *Purpose:* The title for the group and/or project. As with all text within the system, it can be styled using *Markdown* [see here for the documentationn](http://daringfireball.net/projects/markdown/syntax).

*	- *Content Type:* blurb.txt (or .md)
	- *Allowable within:* group, project
	- *Purpose:* Text to explain the group and/or project. Of note, a first level heading in a project blurb will look the same as the project title (title.txt), making it possible to include both the title and blurb in the one file

*	- *Content Type:* contact.txt (or .md)
	- *Allowable within:* group, project
	- *Purpose:* This should contain the contact details for someone an interested viewer can contact in the event they want more information.

*	- *Content Type:* logo.png
	- *Allowable within:* group
	- *Purpose:* A group logo

*	- *Content Type:* image files (e.g. jpg, png)
	- *Allowable within:* project
	- *Purpose:* Images are shown on top of each other, in a photo montage

*	- *Content Type:* video files (e.g. mov, mp4)
	- *Allowable within:* project
	- *Purpose:* Videos are played one at a time, in their entirety

*	- *Content Type:* Processing code (i.e .pde)
	- *Allowable within:* project
	- *Purpose:* Processing pieces run in browser using the Javascript port of Processing (http://processingjs.org). Processing-JS provides complete coverage of the processing API, however external Java libraries are not supported

*	- *Content Type:* symbolic link (to an existing project)
	- *Allowable within:* group
	- *Purpose:* A symbolic link to another group's project can be included, allowing projects to be contained within multiple projects. For example, it is possible to cycle through all the projects by creating a new group and adding a symbolic link for each and every project


The layout of these elements can be seen here:
![An illustration of how each of the content elements are positioned.](https://raw.github.com/torbensko/billboard/master/README_img/layout_elements.png)

The layout of the page will be automatically altered to ensure all the text (titles and blurbs) is visible. If the page contains a lot of text, the remaining content will be reduced in size. It is therefore important to keep the blurbs concise.

It should also be noted that all the content is optional. The following shows how the layout changes depending on what content is provided:
![An illustration of how the system adapts it appearance based on what content is included.](https://raw.github.com/torbensko/billboard/master/README_img/layout_examples.png)

For example, if no text is present (i.e. titles and descriptions) the content will be displayed full screen - in a slide-show manner



# Setting Up

The system involves two components: 

* A *server* for holding a master copy of the user content.
* One or more *display computers*, each with their own copy of the user-content.

Each display computer only needs to connect to the server once in order to fetch the user content. This process involves visiting a specific URL on the *server*. The rest of the process (i.e. syncronising the content and system files) is automatically handled by the *display computer*.


## The Server

The server has been developed in PHP and is designed to run using Apache. The server will serve up the user-provided content from a folder called *contents*. The contents of this folder may look something like the following:

![Example file structure layout.](https://raw.github.com/torbensko/billboard/master/README_img/content_structure.png)

The first level folders are treated as *groups* and the second level as *projects* (see above). All lower level folders are ignored, allowing content to kept alongside a project without it being displayed. If a project folder is called *ignore* it, similarly, will not have its content displayed.

To set up a new server, you will need to the following:

1. 	Install Apache (or similar server). If you are using Ubuntu, the *scripts/setup.sh* script can help you install this.
2.	Clone this repo into your public server directory (typically */var/www/*)
3.	Run the script *_dev/create-manifest.sh*. This will create a manifest file, which will ensure the website functions as an off-line application (this is a HTML5 feature). You need to re-run this script if you edit any of your system files (i.e. non-content files). Re-running the script will ensure the system updates the next time you connect to the server.
4.	Place within the *content* folder your content, following the structure previously outlined.


## Display computer

Each display computer shows the content from a chosen *group*. It is possible to run multiple-screens off a single computer, as explained. Once the server is set up, setting up each display computer is relatively simple.

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


## Other set up tips:

The *_dev* folder may include some additional scripts to help with this process setup and deployment process. Please refer to the instructions in those scripts for details of their purpose and use.

