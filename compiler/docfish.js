#! /usr/bin/env node

// Requires
var Utils = require('./utilities.js');
var Builder = require('./builder.js');

// Init
Builder.emptyBuildFolder();

Builder.setTitleBase('Candybox Reference');

Builder.copyResources();

Builder.loadClasses(['Color', 'ObjectPrimitive', 'SetMethod']);
Builder.buildClassPage('Color');
