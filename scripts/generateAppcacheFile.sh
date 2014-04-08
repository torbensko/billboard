#!/bin/bash

cd ../

echo "CACHE MANIFEST" > offline.appcache
echo "" > offline.appcache.tmp

# to do: this doesn't work properly if the file has spaces
for f in `find . | grep -Ev "\./README|\./contents|\./_dev|\.php$|\.ini$|/\.|offline\.appcache" | grep -E "\.[^/]+$"`; do
	echo $f >> offline.appcache
	if [[ `which md5` ]]; then
		echo $(md5 -q $f) >> offline.appcache.tmp
	elif [[ `which md5sum` ]]; then
		echo $(md5sum $f) >> offline.appcache.tmp
	fi
done

# ensures the manifest file changes whenever the content files do (which forces the system to update)
if [[ `which md5` ]]; then
	echo "# SYSTEM: $(md5 -q offline.appcache.tmp)" >> offline.appcache
elif [[ `which md5sum` ]]; then
	echo "# SYSTEM: $(md5sum offline.appcache.tmp)" >> offline.appcache
fi
rm offline.appcache.tmp

# this is required to allow it to syncronise the content data
echo "NETWORK:" >> offline.appcache
echo "*" >> offline.appcache
