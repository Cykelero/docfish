#! /usr/bin/env node

// Requires
var Utils = require('./utilities.js');
var Builder = require('./builder.js');
var Watch = require('node-watch');

// Init
Builder.setTitleBase('Candybox Reference');
Builder.setGlobalPrefix('cx.');

function build() {
	process.stdout.write('Building…');
	Builder.emptyBuildFolder();
	
	Builder.copyResources();
	Builder.loadClasses();
	Builder.buildClassPages();
	process.stdout.write(' done!\n');
}

Watch([Builder.classSourcePath, Builder.resourcesSourcePath], build);

build();