#! /usr/bin/env node

// Requires
var Utils = require('./utilities.js');
var BuildSession = require('./BuildSession.js');
var Watch = require('node-watch');

// Init
var buildOptions = {
	name: 'Candybox Reference',
	sourcePath: '../source/',
	buildPath: '../build/',
	
	globalPrefix: 'cx.'
};

function build() {
	process.stdout.write('Building…');
	
	var session = new BuildSession(buildOptions);
	
	session.build();
	
	process.stdout.write(' done!\n');
}

Watch([buildOptions.sourcePath], build);

build();