#! /usr/bin/env node

// Requires
var Utils = require('./utilities.js');
var Feedback = require('./feedback.js');
var BuildSession = require('./BuildSession.js');
var Watch = require('node-watch');
var Args = require('./args.js');

// Init
Args.describe({
	watch: {
		type: 'boolean',
		description: 'Whether to watch for changes in the buildPath and rebuild the documentation every time one occurs.'
	},
	check: {
		type: 'boolean',
		description: 'Whether to check for broken links'
	}
});

Feedback.setup({
	channels: {
		'broken-link': {
			text: 'Broken link: `{target}` in {context}'
		}
	},
});

if (Args.values.check) Feedback.enableChannel('broken-link');

var buildOptions = {
	name: 'Candybox Reference',
	sourcePath: '../source/',
	buildPath: '../build/',
	
	globalPrefix: 'cx.'
};

function build() {
	Feedback('main', 'Building…');
	
	var session = new BuildSession(buildOptions);
	
	session.build();
	
	Feedback('main', 'Done!');
}

if (Args.values.watch) {
	Watch([buildOptions.sourcePath], build);
}

build();