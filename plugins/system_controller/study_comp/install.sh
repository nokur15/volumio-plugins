#!/bin/bash

echo "Installing study comp Dependencies"
#sudo apt-get update
# Install the required packages via apt-get
#sudo apt-get -y install
# compatibilty with earlier config files due to few commands name change and directory rename
if [ -f /data/configuration/miscellanea/study_comp/config.json ];then
	mv /data/configuration/miscellanea/study_comp /data/configuration/system_controller/study_comp
	sed -i 's/playpause/playPause/g' /data/configuration/system_controller/study_comp/config.json
	sed -i 's/volup/volumeUp/g' /data/configuration/system_controller/study_comp/config.json
	sed -i 's/voldown/volumeDown/g' /data/configuration/system_controller/study_comp/config.json
fi
# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

#requred to end the plugin install
echo "plugininstallend"
