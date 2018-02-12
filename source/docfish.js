#! /usr/bin/env node

var path = require('path');

var Utils = require('./utilities.js');
var Feedback = require('./feedback.js');
var BuildSession = require('./BuildSession.js');
var Watch = require('node-watch');
var Args = require('./args.js');

// Init
Args.describe({
	source: {
		type: 'string',
		description: 'The path to the folder to build'
	},
	destination: {
		type: 'string',
		description: 'The path where to save the build product'
	},
	watch: {
		type: 'boolean',
		description: 'Whether to watch for changes in the buildPath and rebuild the documentation every time one occurs'
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

// Setup options
if (Args.values.check) Feedback.enableChannel('broken-link');

if (!Args.values.source || !Args.values.destination) {
	console.error('Please specify both a source and a destination.');
	process.exit(1);
}

Args.values.source = path.join(Args.values.source, '/');
Args.values.destination = path.join(Args.values.destination, '/');

var metadata = require(Args.values.source + 'meta.json');

var buildOptions = {
	name: metadata.name || 'Documentation',
	globalPrefix: metadata.globalPrefix || null,
	sourcePath: Args.values.source,
	buildPath: Args.values.destination,
};

function build() {
	Feedback('main', 'Building…');
	
	var session = new BuildSession(buildOptions);
	
	session.build();
	
	Feedback('main', 'Done!');
}

// Watch if requested
if (Args.values.watch) {
	Watch([buildOptions.sourcePath], build);
}

// Perform (first) build
build();
