#! /usr/bin/env node

// Requires
var Utils = require('./utilities.js');
var Builder = require('./builder.js');

// Init
Builder.emptyBuildFolder();

Builder.setTitleBase('Candybox Reference');
Builder.setGlobalPrefix('cx.');

Builder.copyResources();

Builder.loadClasses();
Builder.buildClassPages();
