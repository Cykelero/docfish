var fs = require('fs');
var Handlebars = require('handlebars');
var Highlight = require('highlight.js').highlight;

module.exports = {
	// XML
	childNamed: function(parent, name) {
		var children = parent.childNodes;
		for (var c = 0; c < children.length; c++) {
			var child = children[c];
			if (child.nodeName === name) {
				return child;
			}
		}
		
		return null;
	},
	
	childNamedText: function(parent, name) {
		var child = this.childNamed(parent, name);
		return child ? child.textContent : null;
	},
	
	forEachChild: function(node, callback, callbackThis) {
		for (var c = 0; c < node.childNodes.length; c++) {
			var child = node.childNodes[c];
			if (child.nodeType === 1) {
				callback.call(callbackThis, child);
			}
		}
	},
	
	forEachChildWithTagName: function(node, tagName, callback, callbackThis) {
		for (var c = 0; c < node.childNodes.length; c++) {
			var child = node.childNodes[c];
			if (child.nodeType === 1 && child.nodeName === tagName) {
				callback.call(callbackThis, child);
			}
		}
	},
	
	// Files
	read: function(filename) {
		return fs.readFileSync(filename, {encoding: 'utf-8'})
	},
	
	write: fs.writeFileSync,
	
	getTemplate: function(filename) {
		return Handlebars.compile(this.read(filename + '.handlebars'));
	},
	
	// Text
	text: function(klass, text) {
		if (text === undefined || text === null) return text;
		
		text = text.trim();
		
		// Placeholders
		klass.placeholderValues.concat([
			{name: '$classname', value: klass.name}
		]).forEach(function(placeholder) {
			text = text.split('{df:' + placeholder.name + '}').join(placeholder.value);
		});
		
		// Documentation links
		text = text.replace(/<df-link target="([^"]*)">(.*?)<\/df-link>/g, function(tag, linkTarget, linkText) {
			linkTarget = linkTarget.replace(/(#.*)?$/, '.html$1');
			return '<a href="' + linkTarget + '">' + linkText + '</a>';
		});
		
		return text;
	},
	
	code: function(klass, text) {
		if (text === undefined || text === null) return text;
		
		return Highlight('javascript', this.text(klass, text)).value;
	},
	
	colorTypes: function(text, assumeObject) {
		var self = this;
		
		return text.replace(/\b\w+\b/g, function(word) {
			var isCapitalized = /[A-Z]/.test(word[0]);
			
			if (isCapitalized || assumeObject) {
				return '<span class="df-type-' + self.toTypeName(word) + '">' + word + '</span>';
			} else {
				return word;
			}
		});
	},
	
	// Other
	toTypeName: function(type) {
		var types = ['string', 'number', 'boolean', 'function', 'regexp', 'undefined', 'null'];
		
		var lowercased = type.toLowerCase();
		if (types.indexOf(lowercased) > -1) {
			return lowercased;
		} else {
			return 'object';
		}
	}
};
