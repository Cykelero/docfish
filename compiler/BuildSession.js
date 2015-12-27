var Utils = require('./utilities.js');
var xmldom = require('xmldom');
var Handlebars = require('handlebars');
var Highlight = require('highlight.js');
var tidy = require('htmltidy').tidy;

var Klass;

module.exports = function BuildSession(options) {
	this.paths = {
		source: options.sourcePath,
		unitSource: options.sourcePath + 'units/',
		resourcesSource: options.sourcePath + 'resources/',
		build: options.buildPath,
		resourcesBuild: options.buildPath + 'resources/'
	};
	this.extensions = {
		sourceUnit: '.xml',
		template: '.handlebars',
		builtPage: '.html'
	};
	
	this.pageTemplate = this.getTemplate('_Page');
	
	this.productName = options.name;
	this.globalPrefix = options.globalPrefix;
	
	this.units = {};
	this.classes = [];
};

module.exports.prototype = {
	build: function() {
		this.resetBuildFolder();
		this.loadSourceUnits();
		this.buildPages();
		this.copyResources();
	},
	
	// Build steps
	resetBuildFolder: function() {
		Utils.emptyFolder(this.paths.build);
		
		Utils.createFolder(this.paths.build);
		Utils.createFolder(this.paths.resourcesBuild);
	},
	
	loadSourceUnits: function() {
		var self = this;
		
		function recursivelyLoadFromFolder(path) {
			var contents = Utils.getFolderContents(path);
			contents.forEach(function(filename) {
				var filePath = path + filename;
				
				if (Utils.isFolder(filePath)) {
					recursivelyLoadFromFolder(filePath + '/');
				} else if (filename.slice(-self.extensions.sourceUnit.length) === self.extensions.sourceUnit) {
					self.loadSourceUnitFromFile(filePath);
				}
			});
		};
		
		recursivelyLoadFromFolder(this.paths.unitSource);
	},
	
	buildPages: function() {
		for (var unitName in this.units) {
			if (!this.units.hasOwnProperty(unitName)) continue;
			
			var unit = this.units[unitName];
			
			if (unit.public) this.buildUnitPage(unit);
		}
	},
	
	copyResources: function() {
		var self = this;
		
		var resources = Utils.getFolderContents(this.paths.resourcesSource);
		resources.forEach(function(filename) {
			var resourceContents = Utils.readFile(self.paths.resourcesSource + filename);
			Utils.writeFile(self.paths.resourcesBuild + filename, resourceContents);
		});
	},
	
	// Source unit management
	loadSourceUnitFromFile: function(path) {
		var fileContent = Utils.readFile(path);
		
		this.addSourceUnit(fileContent);
	},
	
	addSourceUnit: function(data) {
		var xmlDocument = new xmldom.DOMParser().parseFromString(data),
			xmlRoot = xmlDocument.documentElement,
			unit,
			unitType,
			unitId;
		
		// Find unit type
		unitType = xmlRoot.tagName.toLowerCase();
		
		// Find unit id
		unitId = xmlRoot.getAttribute('id') || null;
		
		// Substitute symbols
		var symbolsNode = Utils.childNamed(xmlRoot, 'symbols');
		if (symbolsNode) {
			var instanceMarkerNodes = Array.prototype.slice.call(xmlRoot.getElementsByTagName('symbol-instance'), 0);
			
			// Replace each instance
			Utils.forEachChild(symbolsNode, function(symbolNode) {
				// Extract symbol info
				var symbolId = symbolNode.getAttribute('id'),
					symbolContent;
				
				Utils.forEachChild(symbolNode, function(childNode) {
					if (!symbolContent) symbolContent = childNode;
				});
				
				// Substitute symbol instances
				instanceMarkerNodes.forEach(function(instanceMarkerNode) {
					if (instanceMarkerNode.getAttribute('id') === symbolId) {
						// Copy symbol
						var symbolInstance = symbolContent.cloneNode(true),
							variableNodes = Array.prototype.slice.call(symbolInstance.getElementsByTagName('symbol-variable'), 0);
						
						variableNodes.forEach(function(variableNode) {
							var variableValue = instanceMarkerNode.getAttribute('variable-' + variableNode.getAttribute('id')) || '',
								variableValueNode = xmlDocument.createTextNode(variableValue);
							
							variableNode.parentNode.insertBefore(variableValueNode, variableNode);
							variableNode.parentNode.removeChild(variableNode);
						});
						
						// Insert symbol copy
						instanceMarkerNode.parentNode.insertBefore(symbolInstance, instanceMarkerNode);
						instanceMarkerNode.parentNode.removeChild(instanceMarkerNode);
					}
				});
			});
			
			// Remove symbol library
			symbolsNode.parentNode.removeChild(symbolsNode);
		}
		
		// Instantiate unit
		if (!Klass) Klass = require('./Klass.js');
		
		switch (unitType) {
			case 'class':
				unit = new Klass(this, xmlRoot);
				break;
		}
		
		// Register unit
		this.units[unitId] = unit;
		switch (unitType) {
			case 'class':
				this.classes.push(unit);
				break;
		}
	},
	
	getUnitById: function(id) {
		return this.units[id];
	},
	
	getObjectByPath: function(id, thisUnit) {
		var idComponents = /^([^#]*)(#(.*))?$/.exec(id),
			unitName = idComponents[1],
			memberName = idComponents[3],
			unit = unitName.length ? this.getUnitById(unitName) : thisUnit;
		
		if (!unit) return null;
		
		if (!memberName) {
			return unit;
		} else {
			var member = unit.getMemberByName(memberName);
			return member || null;
		}
	},
	
	// HTML generation
	buildUnitPage: function(unit) {
		var self = this;
		
		var unitGeneratedHTML = unit.getHTML();
		
		var completeHTML = this.pageTemplate({
			title: unit.name + ' — ' + this.productName,
			pageHTML: unitGeneratedHTML
		});
		
		this.tidyHTML(completeHTML, function(error, tidiedHTML) {
			Utils.writeFile(self.paths.build + unit.name + self.extensions.builtPage, tidiedHTML);
		});
	},
	
	tidyHTML: function(html, callback) {
		tidy(html, {
			'doctype': 'html5',
			'coerce-endtags': false,
			'indent': true,
			'indent-spaces': 4,
			'tab-size': 4,
			'tidy-mark': false,
			'wrap': 0,
			//'preserve-entities': true
		}, function(error, tidiedHTML) {
			if (error) {
				callback(error);
			} else {
				tidiedHTML = tidiedHTML.replace(/( {4})/g, '\t');
				callback(null, tidiedHTML);
			}
		});
	},
	
	textToolsFor: function(klass) {
		var boundTools = {},
			thisObject = {
				klass: klass,
				tools: boundTools,
				buildSession: this,
				getObjectByPath: function(linkTarget) {
					return this.buildSession.getObjectByPath(linkTarget, this.klass);
				}
			};
		
		for (var m in this.textTools) {
			if (!this.textTools.hasOwnProperty(m)) continue;
			
			boundTools[m] = this.textTools[m].bind(thisObject);
		}
		
		return boundTools;
	},
	
	textTools: {
		text: function(text) {
			var self = this;
			
			if (text === undefined || text === null) return text;
			
			// Trim
			text = text.trim();
			
			// Substitute docfish placeholders
			var placeholderPairs = this.klass.placeholderValues.concat([
				{name: '$classname', value: this.klass.name}
			]);
			
			placeholderPairs.forEach(function(placeholderPair) {
				text = text.split('{df:' + placeholderPair.name + '}').join(placeholderPair.value);
			});
			
			text = text.replace(/{df:[^}]*}/, '');
			
			// Substitute docfish tags
			function getShortDescriptionFor(target) {
				var targetObject = self.getObjectByPath(target);
				return self.tools.attribute(targetObject && targetObject.shortDescription);
			};
			
			// // Documentation links
			text = text.replace(/<df-link target="([^"]*)">(.*?)<\/df-link>/g, function(tag, linkTarget, linkText) {
				var linkHref = linkTarget.replace(/^[^#]+/, '$&.html'),
					linkTitle = getShortDescriptionFor(linkTarget) || '';
				return '<a href="' + linkHref + '" title="' + linkTitle + '">' + linkText + '</a>';
			});
			
			text = text.replace(/<df-class>(.*?)<\/df-class>/g, function(tag, className) {
				var linkText = className,
					linkHref = className + '.html',
					linkTitle = getShortDescriptionFor(className) || '';
				return '<a href="' + linkHref + '" title="' + linkTitle + '"><code>' + linkText + '</code></a>';
			});
			
			// // Arguments
			text = text.replace(/<df-arg>/g, '<span class="class-method-argument">');
			text = text.replace(/<\/df-arg>/g, '</span>');
			
			return text;
		},
		
		code: function(text) {
			if (text === undefined || text === null) return text;
			
			return Highlight.highlight('javascript', this.tools.text(text)).value;
		},
		
		attribute: function(text) {
			if (text === undefined || text === null) return text;
			
			return this.tools.text(text).replace(/"/g, '\\"');
		},
		
		type: function(text) {
			var self = this;
			
			return text.replace(/\b\w+\b/g, function(word) {
				var isCapitalized = /[A-Z]/.test(word[0]);
				
				if (isCapitalized || word === 'self') {
					return '<span class="df-kind-' + self.buildSession.typeToKind(word) + '">' + word + '</span>';
				} else {
					return word;
				}
			});
		},
		
		functionSignature: function(text) {
			var self = this;
			
			text = this.tools.text(text);
			
			return text.replace(/((([A-Z]\w*|\[[A-Z]\w*\])\|?)+) (\w+)( = ("[^"]*"|[^ \],]+))?\s*(,?)/g, function(_argumentBlock, argumentType, _lastArgumentSubTypeBlock, _lastArgumentSubType, argumentName, defaultValueBlock, _defaultValue, comma) {
				defaultValueBlock = defaultValueBlock || '';
				return '<span class="class-method-signature-argument-block">'
					+ self.tools.type(argumentType)
					+ ' <span class="class-method-argument">' + argumentName + '</span>'
					+ defaultValueBlock
					+ comma
					+ '</span>';
			});
		}
	},
	
	// Other
	getGlobalPrefix: function() {
		return this.globalPrefix;
	},
	
	typeToKind: function(type) {
		var types = ['string', 'number', 'boolean', 'function', 'undefined', 'null'];
		
		var lowercased = type.toLowerCase();
		if (/\|/.test(type)) {
			return 'multiple';
		} else if (types.indexOf(lowercased) > -1) {
			return lowercased;
		} else {
			return 'object';
		}
	},
	
	getTemplate: function(name) {
		return Handlebars.compile(Utils.readFile(name + this.extensions.template));
	}
};
