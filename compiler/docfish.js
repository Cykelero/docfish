#! /usr/bin/env node

// Requires
var Utils = require('./utilities.js');
var BuildSession = require('./BuildSession.js');
var Watch = require('node-watch');
var Args = require('./args.js');

// Init
Args.describe({
	watch: {
		type: 'boolean',
		description: 'Whether to watch for changes in the buildPath and rebuild the documentation every time one occurs.'
	}
});

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

if (Args.values.watch) {
	Watch([buildOptions.sourcePath], build);
}

build();