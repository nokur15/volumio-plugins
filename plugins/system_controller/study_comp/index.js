'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var Gpio = require('onoff').Gpio;
var io = require('socket.io-client');
var socket = io.connect('http://localhost:3000');
var actions = ["playPause", "volumeUp", "volumeDown", "previous", "next", "shutdown"];





module.exports = studyComp;
function studyComp(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;
	this.triggers = [];

}



studyComp.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

	this.logger.info("Study Companion initialized");

    return libQ.resolve();
}

studyComp.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();


	// Once the Plugin has successfull started resolve the promise
	this.createTriggers()
		.then (function(result) {
			this.logger.info("Study Companion Started");
			defer.resolve();
		});
	

    return defer.promise;
};

studyComp.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
	this.clearTriggers()
		.then (function(result){
			this.logger.info("Study Companion Stopped");
			defer.resolve()
		});

    return libQ.resolve();
};

studyComp.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

studyComp.prototype.getUIConfig = function() {
    var defer = libQ.defer();
	var self = this;
	
	this.logger.info('Study Comp: Getting UI config')

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
				var i = 0;
				actions.forEach(function(action,index,array){
					//strings for config
					var c1 = action.concat('.enabled');
					var c1 = action.concat('.pin');

					//accessor supposes action and uiconfig itens are in the SAME order
					//this is potentially dangerous: rewrite with a JSON search of "id" value ?
					uiconf.sections[0].context[2*i].value = this.config.get(c1);
					uiconf.sections[0].context[2*i+1].value.value = this.config.get(c2);
					uiconf.sections[0].context[2*i+1].value.label = this.config.get(c2).toString();

					i = i+1;
				});

        defer.resolve(uiconf);
        	})
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};

studyComp.prototype.saveConfig = function(data) {
	var self = this;

	actions.forEach(function(action, index,array){
		//Strings for data fields
		var s1 = action.concat('Enabled');
		var s1 = action.concat('Pin');

		// Strings for config
		var c1 = action.concat('.enabled');
		var c2 = action.concat('.pin');
		var c3 = action.concat('.value');

		this.config.set(c1, data[s1]);
		this.config.set(c2, data[s2]['value']);
		this.config.set(c3, 0);
	});

	this.clearTriggers()
		.then(this.createTriggers());
	
	this.commandRouter.pushToastMessage('success',"Study Comp","Configuration Saved");
}

studyComp.prototype.createTriggers = function() {
	var self = this;

	this.logger.info('Study Comp: Reading config and creating triggers...');

	actions.forEach(function(action, index, array) {
		var c1 = action.concat('.enabled');
		var c2 = action.concat('.pin');

		var enabled = this.config.get(c1);
		var pin = this.config.get(c2);

		if(enabled === true){
			this.logger.info('Study Comp: '+ action + ' on pin ' + pin);
			var j = new Gpio(pin,'in','rising', {debounceTimeout: 250});
			j.watch(this.listener.bind(self,action));
			this.triggers.push(j);
		}
	});
		
	return libQ.resolve();
};

studyComp.prototype.clearTriggers = function () {
	var self = this;
	
	this.triggers.forEach(function(trigger, index, array) {
  		this.logger.info("Study Comp: Destroying trigger " + index);

		trigger.unwatchAll();
		trigger.unexport();		
	});
	
	this.triggers = [];

	return libQ.resolve();	
};

studyComp.prototype.listener = function(action,err,value){
	var self = this;
	
	// we now debounce the button, so no need to check for the value
	this[action]();
};

studyComp.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

studyComp.prototype.onRestart = function () {
	var self = this;
};

studyComp.prototype.onInstall = function () {
	var self = this;
};

studyComp.prototype.onUninstall = function () {
	var self = this;
};

studyComp.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

studyComp.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

studyComp.prototype.getAdditionalConf = function (type, controller, data) {
	var self = this;
};

studyComp.prototype.setAdditionalConf = function () {
	var self = this;
};

studyComp.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};

//Play / Pause
studyComp.prototype.playPause = function() {
	//this.logger.info('GPIO-Buttons: Play/pause button pressed');
	socket.emit('getState','');
	socket.once('pushState', function (state) {
	  if(state.status=='play' && state.service=='webradio'){
		socket.emit('stop');
	  } else if(state.status=='play'){
		socket.emit('pause');
	  } else {
		socket.emit('play');
	  }
	});
  };
  
//next on playlist
studyComp.prototype.next = function() {
	//this.logger.info('GPIO-Buttons: next-button pressed');
	socket.emit('next')
};
  
//previous on playlist
studyComp.prototype.previous = function() {
	//this.logger.info('GPIO-Buttons: previous-button pressed');
	socket.emit('prev')
};
  
//Volume up
studyComp.prototype.volumeUp = function() {
	//this.logger.info('GPIO-Buttons: Vol+ button pressed');
	socket.emit('volume','+');
};
  
  //Volume down
studyComp.prototype.volumeDown = function() {
	//this.logger.info('GPIO-Buttons: Vol- button pressed\n');
	socket.emit('volume','-');
};
  
  //shutdown
studyComp.prototype.shutdown = function() {
	// this.logger.info('GPIO-Buttons: shutdown button pressed\n');
	this.commandRouter.shutdown();
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


//studyComp.prototype.addToBrowseSources = function () {

	// Use this function to add your music service plugin to music sources
    //var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
//    this.commandRouter.volumioAddToBrowseSources(data);
//};

//studyComp.prototype.handleBrowseUri = function (curUri) {
//    var self = this;

    //self.commandRouter.logger.info(curUri);
//    var response;


//    return response;
//};



// Define a method to clear, add, and play an array of tracks
//studyComp.prototype.clearAddPlayTrack = function(track) {
//	var self = this;
//	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'studyComp::clearAddPlayTrack');

//	self.commandRouter.logger.info(JSON.stringify(track));

//	return self.sendSpopCommand('uplay', [track.uri]);
//};

//studyComp.prototype.seek = function (timepos) {
//    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'studyComp::seek to ' + timepos);

//    return this.sendSpopCommand('seek '+timepos, []);
//};

// Stop
//studyComp.prototype.stop = function() {
//	var self = this;
//	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'studyComp::stop');


//};

// Spop pause
//studyComp.prototype.pause = function() {
//	var self = this;
//	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'studyComp::pause');


//};

// Get state
//studyComp.prototype.getState = function() {
//	var self = this;
//	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'studyComp::getState');


//};

//Parse state
//studyComp.prototype.parseState = function(sState) {
//	var self = this;
//	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'studyComp::parseState');

	//Use this method to parse the state and eventually send it with the following function
//};

// Announce updated State
//studyComp.prototype.pushState = function(state) {
//	var self = this;
//	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'studyComp::pushState');

//	return self.commandRouter.servicePushState(state, self.servicename);
//};


//studyComp.prototype.explodeUri = function(uri) {
//	var self = this;
//	var defer=libQ.defer();

	// Mandatory: retrieve all info for a given URI

//	return defer.promise;
//};

//studyComp.prototype.getAlbumArt = function (data, path) {

//	var artist, album;

//	if (data != undefined && data.path != undefined) {
//		path = data.path;
//	}

//	var web;

//	if (data != undefined && data.artist != undefined) {
//		artist = data.artist;
//		if (data.album != undefined)
//			album = data.album;
//		else album = data.artist;

//		web = '?web=' + nodetools.urlEncode(artist) + '/' + nodetools.urlEncode(album) + '/large'
//	}

//	var url = '/albumart';

//	if (web != undefined)
//		url = url + web;

//	if (web != undefined && path != undefined)
//		url = url + '&';
//	else if (path != undefined)
//		url = url + '?';

//	if (path != undefined)
//		url = url + 'path=' + nodetools.urlEncode(path);

//	return url;
//};





//studyComp.prototype.search = function (query) {
//	var self=this;
//	var defer=libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

//	return defer.promise;
//};

//studyComp.prototype._searchArtists = function (results) {

//};

//studyComp.prototype._searchAlbums = function (results) {

//};

//studyComp.prototype._searchPlaylists = function (results) {


//};

//studyComp.prototype._searchTracks = function (results) {

//};
