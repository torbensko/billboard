#!/bin/bash

# Billboard - a program for cycling through a mix of user provided content, in
# manner that is visually captivating. It is well suited to foyer and marketing
# displays.

# Copyright (C) 2012 Torben Sko, Henry Gardner

# This file is provided under the MIT License. Permission is hereby granted,
# free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without
# restriction, including without limitation the rights to use, copy, modify,
# merge, publish, distribute, sublicense, and/or sell copies of the Software,
# and to permit persons to whom the Software is furnished to do so, subject to
# the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

config=config.ini
bootSettings=/etc/default/rcS


# ensures we are in the right directory:
cd "$( dirname $0 )"

# the CRON stuff:
if [[ $1 == "cron" ]]; then

	# needed to make it work from a cron script
	export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games
	export DISPLAY=:0


	# the following was provided by Hugh Fisher, in a file originally called: no-screen-saver.sh
	#
	# Possible to change config setttings, but this is easier
	killall gnome-screensaver
	# And tell X server not to interfere
	xset s off
	xset -dpms
	echo "screen saver and power management turned off"

	# other attempts to sort out the screen saver stuff:
	# 	src: http://askubuntu.com/questions/67355/how-do-i-completely-turn-off-screensaver-and-power-management
	#gsettings set org.gnome.settings-daemon.plugins.power active false
	#gsettings set org.gnome.desktop.screensaver idle-activation-enabled false
	# 	src: http://stackoverflow.com/questions/5560703/disable-ubuntu-10-10-screensaver-using-command
	#gconftool-2 -s /apps/gnome-power-manager/ac_sleep_display --type=int 0
	#gconftool-2 -s /apps/gnome-screensaver/idle_activation_enabled --type=bool false


	# start a process that will hide the cursor for us
	if [[ $(ps | grep unclutter | wc -l) -eq 0 ]]; then
		unclutter &
	fi

	source $config

	function setupMonitor {

		if [[ $(wmctrl -l | grep $1) == "" ]]; then
			google-chrome --no-default-browser-check --user-data-dir=$2 ${server}?group=$1 &
		else
			wmctrl -r $1 -e 0,$3,0,1280,1024
			wmctrl -r $1 -b add,fullscreen
		fi
	}
	for (( i=1; $i <= ${#group[@]}; i=$[$i+1] )) do
		setupMonitor ${group[$i]} "$( cd ~ && pwd )/chrome-${i}" ${xoffset[$i]}
	done
	exit
fi




# some quick helper functions:
function toConf {
	echo $1 >> $config
}

function chechCommand {
	if [[ $(which $1 | wc -c) -eq 0 ]]; then
		echo "$1 is needed, installing..."
		sudo apt-get install $1
	fi
}

echo
echo "Please note:"
echo " 1. This script is only designed for the Ubuntu operating system."
echo " 2. Once you have run this script, this file SHOULD NOT be moved."
echo
echo "Do you wish to continue? (y/n)"
read -n 1
echo
if [[ $REPLY != "y" ]]; then
	exit
fi

echo "Do you want to set this machine up as the server? (y/n)"
read -n 1
echo 
if [[ $REPLY == "y" ]]; then
	echo
	echo "Setting up/updating the local copy of the server..."
	echo
	chechCommand "apache2"
	chechCommand "php5"

	echo "Please copy the contents of this repository into the folder '/var/www'"
	echo "To also set this machine up as display unit, please run this script again"
	echo
	exit
fi

# check and install the required command line tools
chechCommand "wmctrl"
# http://manpages.ubuntu.com/manpages/hardy/man1/unclutter.1.html
chechCommand "unclutter"
# for looking up the project-group names
chechCommand "lynx"
# for displaying the system
echo "Do you want to install Chrome? (y/n)"
read -n 1
echo 
if [[ $REPLY == "y" ]]; then
	wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
	sudo bash -c "echo \"deb http://dl.google.com/linux/chrome/deb/ stable main\" > /etc/apt/sources.list.d/google.list"
	sudo apt-get update
	chechCommand "google-chrome-stable"
fi


mkCnf=1
if [[ -e $config ]]; then
	echo
	echo "This computer is already configured. Do you wish to reconfigure it? (y/N)"
	read -n 1
	echo 
	if [[ $REPLY == "y" ]]; then
		mkCnf=1
	else
		mkCnf=0
	fi
fi

if [[ $mkCnf -eq 1 ]]; then
	# record how many displays to show and what to show
	echo "#!/bin/bash" > $config
	
	echo
	echo "What is the URL of the showcase system? (default: localhost/billboard)"
	read
	server=${REPLY:-localhost/billboard}
	toConf "server=$server"

	echo "The following project-groups are available at that URL:"
	lynx -dump $server/list_groups.php

	echo "How many monitors does this computer have? (1)"
	read
	screens=${REPLY:-1}

	for (( i=1; $i <= $screens; i=$[$i+1] )) do
		echo "What project-group should be shown on screen $i?"
		read
		toConf "group[${i}]=$REPLY"

		REPLY=0
		if [[ $i -eq 2 ]]; then
			echo "What is the width of the first screen, in pixels?"
			read
		elif [[ $i -gt 2 ]]; then
			echo "What is the width of the first $[$i-1] screens, in pixels?"
			read
		fi
		toConf "xoffset[${i}]=$[${REPLY:-0}+20]"
	done
fi

echo
echo "Installing..."
crontmp=.cron-tmp.txt

this=$( cd "$( dirname $0 )" && pwd )/`basename $0`
# grab the current crontab, removing lines that we have added before
crontab -l | grep -vE "($this|shutdown)" > $crontmp

# *     *     *   *    *        command to be executed
# -     -     -   -    -
# |     |     |   |    |
# |     |     |   |    +----- day of week (0 - 6) (Sunday=0) e.g. 1-5 = weekdays
# |     |     |   +------- month (1 - 12)
# |     |     +--------- day of the month (1 - 31)
# |     +----------- hour (0 - 23)
# +------------- min (0 - 59)

# check that it is running properly every five minutes
echo "*/5 *  *  *  * $this cron" >> $crontmp

# add in the shutdown
echo
echo "When should this computer shutdown? The default is 9pm (21)"
read
echo "0 ${REPLY:-21} * * * /sbin/shutdown -h now" >> $crontmp
crontab $crontmp
rm $crontmp

# http://linux.byexamples.com/archives/315/how-to-shutdown-and-reboot-without-sudo-password/
echo
echo "To allow the computer to be shutdown automatically, the 'shutdown' script needs to be modified so that anyone can run it."
echo "Please enter your password to make this change"
sudo chmod u+s /sbin/shutdown


if [[ -e /etc/default/rcS ]]; then
	echo
	echo "To help with the automatic booting, the bios should use local time, whereas Ubuntu likes it to use UTC by default."
	echo "Please enter your password to make this change"
	sudo cp $bootSettings $bootSettings.bak
	sudo bash -c "cat ${bootSettings}.bak | sed s/UTC=yes/UTC=no/g > ${bootSettings}"
fi

echo
echo "Finished!"
echo


