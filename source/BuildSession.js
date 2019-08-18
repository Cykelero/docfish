const childProcess = require('child_process');
const path = require('path');

const xmldom = require('xmldom');
const Handlebars = require('handlebars');
const Highlight = require('highlight.js');

const Utils = require('./utilities.js');
const Feedback = require('./feedback.js');

var Klass;

module.exports = function BuildSession(options) {
	this.paths = {
		unitSource: options.sourcePath,
		resourcesSource: __dirname + '/resources/',
		build: options.buildPath,
		resourcesBuild: options.buildPath + 'resources/'
	};
	this.extensions = {
		sourceUnit: '.xml',
		template: '.handlebars',
		builtPage: '.html'
	};
	
	this.pageTemplate = this.getTemplate('_Page');
	
	this.options = options;
	this.logoFileName = this.options.logoPath ? path.basename(this.options.logoPath) : null;
	
	this.units = {};
	this.classes = [];
};

module.exports.prototype = {
	build: async function() {
		this.resetBuildFolder();
		
		this.copyResources();
		this.loadSourceUnits();
		await this.buildPages();
	},
	
	// Build steps
	resetBuildFolder: function() {
		Utils.emptyFolder(this.paths.build);
		
		Utils.createFolder(this.paths.build, true);
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
	
	buildPages: async function() {
		let pagePrettifyPromises = [];
		
		// Build pages
		for (var unitName in this.units) {
			if (!this.units.hasOwnProperty(unitName)) continue;
			
			var unit = this.units[unitName];
			
			if (unit.public) {
				const pagePrettifyPromise = this.buildUnitPage(unit);
				pagePrettifyPromises.push(pagePrettifyPromise);
			}
		}

		const pageCount = pagePrettifyPromises.length;
		const s = pageCount > 1 ? 's' : '';
		Feedback('main', `Built ${pageCount} page${s}.`);
		
		// Wait for prettification
		const pagePrettifyResults = await Promise.all(pagePrettifyPromises);
		
		const prettifiedPageCount = pagePrettifyResults.filter(a => a).length;
		if (prettifiedPageCount === pageCount) {
			Feedback('main', `Prettified ${pageCount} page${s}.`);
		} else {
			Feedback('main', `Prettified ${prettifiedPageCount}/${pageCount} page${s}.`);
		}
	},
	
	copyResources: function() {
		// Docfish resources
		const resources = Utils.getFolderContents(this.paths.resourcesSource);
		resources.forEach(filename => {
			Utils.copyFile(
				this.paths.resourcesSource + filename,
				this.paths.resourcesBuild + filename
			);
		});
		
		// Docset resources
		if (this.options.logoPath) {
			Utils.copyFile(
				this.paths.unitSource + this.options.logoPath,
				this.paths.resourcesBuild + this.logoFileName
			);
		}
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
		const unitHTML = unit.getHTML();
		
		const pageHTML = this.pageTemplate({
			productName: this.options.name,
			productVersion: this.options.version,
			productThemeColor: this.options.themeColor,
			productLogoPath: 'resources/' + this.logoFileName,
			pageName: unit.name,
			pageHTML: unitHTML
		});
		
		const pageBuildPath = this.paths.build + unit.id + this.extensions.builtPage;
		
		// Prettify and write page
		const prettifyPromise = this.prettify(pageHTML)
			.then(prettyPageHTML => {
				Utils.writeFile(pageBuildPath, prettyPageHTML);
				return true;
			}, prettificationError => {
				console.warn(`An error occurred prettifying ${unit.name}:`);
				console.warn(prettificationError);
				console.warn('The page has been generated but not prettified.\n');
				return false;
			});
		
		// Write non-pretty page in the meantime
		Utils.writeFile(pageBuildPath, pageHTML);
		
		return prettifyPromise;
	},
	
	prettify: function(source, callback) {
		return new Promise((resolve, reject) => {
			const prettifyProcess = childProcess.fork(__dirname + '/prettify.js');
			prettifyProcess.send(source);
		
			prettifyProcess.on('message', function({error, result}) {
				prettifyProcess.kill();
				
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			});
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
			
			function checkLink(target) {
				var targetObject = self.getObjectByPath(target),
					targetObjectClass = self.getObjectByPath(/^[^#]*/.exec(target));
				
				if (!targetObject || !targetObjectClass.public) {
					Feedback('broken-link', {'target': target, 'context': self.klass.name});
				}
			};
			
			// // Documentation links
			text = text.replace(/<df-link target="([^"]*)">(.*?)<\/df-link>/g, function(tag, linkTarget, linkText) {
				var linkHref = linkTarget.replace(/^[^#]+/, '$&.html'),
					linkTitle = getShortDescriptionFor(linkTarget) || '';
				
				checkLink(linkTarget);
				
				return '<a href="' + linkHref + '" title="' + linkTitle + '">' + linkText + '</a>';
			});
			
			text = text.replace(/<df-class>(.*?)<\/df-class>/g, function(tag, classId) {
				var linkText = classId,
					linkHref = classId + '.html',
					linkTitle = getShortDescriptionFor(classId) || '';
				
				checkLink(classId);
				
				return '<a href="' + linkHref + '" title="' + linkTitle + '"><code>' + linkText + '</code></a>';
			});
			
			// // Sample blocks
			text = text.replace(/<df-sample(\s+name="([^"]+)")?>((.|\n)*?)<\/df-sample>/g, function(tag, nameProperty, name, code) {
				let generatedHTML = '';
				
				const highlightedCode = self.tools.code(code);
				
				if (name) {
					const processedName = self.tools.text(name);
					generatedHTML += `<h5><span class="caption">sample</span> ${processedName}</h5>`;
				}
				generatedHTML += `<pre class="sample free-sample hljs"><code>${highlightedCode}</code></pre>`;
				
				return generatedHTML;
			});
			
			// // Arguments
			text = text.replace(/<df-arg>/g, '<span class="class-method-argument">');
			text = text.replace(/<\/df-arg>/g, '</span>');
			
			return text;
		},
		
		code: function(text) {
			if (text === undefined || text === null) return text;
			
			const processedText = this.tools.text(text);
			
			// Highlight header lines separately 
			const headerParts = /^((#.*|\s*)\n)*/.exec(processedText);
			const header = headerParts ? headerParts[0] : '';
			const rest = processedText.slice(header.length);
			
			const result =
				Highlight.highlight('javascript', header).value
				+ Highlight.highlight('javascript', rest).value;
			
			return result;
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
		return this.options.globalPrefix;
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
		var templateString = Utils.readFile(__dirname + '/' + name + this.extensions.template);
		return Handlebars.compile(templateString);
	}
};
