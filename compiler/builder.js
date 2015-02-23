var Utils = require('./utilities.js');
var fs = require('fs');
var rimraf = require('rimraf');

var xmldom = require('xmldom');
var tidy = require('htmltidy').tidy;

var Klass = require('./Klass.js');

var classes = [];

module.exports = {
	// Constants
	buildPath: '../build/',
	buildExtension: '.html',
	
	classSourcePath: '../source/classes/',
	classSourceExtension: '.xml',
	
	resourcesSourcePath: '../resources/',
	resourcesDestinationPath: '../build/resources/',
	
	pageTemplate: Utils.getTemplate('_Page'),
	
	// Variables
	titleBase: null,
	globalPrefix: null,
	
	// Build init
	emptyBuildFolder: function() {
		rimraf.sync(this.buildPath);
		fs.mkdirSync(this.buildPath);
		fs.mkdirSync(this.resourcesDestinationPath);
	},
	
	copyResources: function() {
		var filenames = fs.readdirSync(this.resourcesSourcePath);
		filenames.forEach(function(filename) {
			Utils.write(this.resourcesDestinationPath + filename, Utils.read(this.resourcesSourcePath + filename));
		}, this);
	},
	
	// Class management
	loadClass: function(className) {
		var xmlContents = Utils.read(this.classSourcePath + className + this.classSourceExtension);
			xmlDocument = new xmldom.DOMParser().parseFromString(xmlContents);
		
		// Substitute symbols
		var symbolsNode = Utils.childNamed(xmlDocument.documentElement, 'symbols');
		if (symbolsNode) {
			var instanceNodes = Array.prototype.slice.call(xmlDocument.documentElement.getElementsByTagName('symbol-instance'), 0);
			
			Utils.forEachChild(symbolsNode, function(symbolNode) {
				// Extract symbol info
				var symbolId = symbolNode.getAttribute('id'),
					symbolContent;
				
				Utils.forEachChild(symbolNode, function(childNode) {
					if (!symbolContent) symbolContent = childNode;
				});
				
				// Substitute symbol instances
				instanceNodes.forEach(function(instanceNode) {
					if (instanceNode.getAttribute('id') == symbolId) {
						instanceNode.parentNode.insertBefore(symbolContent.cloneNode(true), instanceNode);
						instanceNode.parentNode.removeChild(instanceNode);
					}
				});
			});
			
			symbolsNode.parentNode.removeChild((symbolsNode));
		}
		
		// Instantiate class
		classes[className] = new Klass(xmlDocument.documentElement);
	},
	
	loadClasses: function(classes) {
		var filenames = fs.readdirSync(this.classSourcePath);
		filenames.forEach(function(filename) {
			if (filename.slice(-4) == ".xml") {
				this.loadClass(filename.slice(0, -this.classSourceExtension.length));
			}
		}, this);
	},
	
	// Building
	buildClassPage: function(className) {
		var self = this;
		
		var html = classes[className].getHTML(classes);
		html = this.pageTemplate({
			title: this.makeTitle(className),
			pageHTML: html
		});
		
		tidy(html, {
			'doctype': 'html5',
			'coerce-endtags': false,
			'indent': true,
			'indent-spaces': 4,
			'tab-size': 4,
			'tidy-mark': false,
			//'preserve-entities': true
		}, function(error, html) {
			html = html.replace(/( {4})/g, '\t');
			Utils.write(self.buildPath + className + self.buildExtension, html);
		});
	},
	
	buildClassPages: function() {
		for (var className in classes) {
			if (!classes.hasOwnProperty(className)) continue;
			
			var classObject = classes[className];
			if (classObject.public) this.buildClassPage(className);
		}
	},
	
	// Other
	setTitleBase: function(titleBase) {
		this.titleBase = titleBase;
		process.title = 'docfish (' + titleBase + ')';
	},
	
	setGlobalPrefix: function(globalPrefix) {
		this.globalPrefix = globalPrefix;
	},
	
	makeTitle: function(pageName) {
		return pageName ? pageName + ' — ' + this.titleBase : this.titleBase;
	}
};
