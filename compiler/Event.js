var Utils = require('./utilities.js');

module.exports = function Event(classNode) {
	this.name = null;
	
	this.arguments = [];
	
	this.shortDescription = null;
	this.discussion = null;
	this.sample = null;
	
	// Init
	var self = this;
	this.name = classNode.getAttribute('name');
	
	Utils.forEachChildWithTagName(classNode, 'argument', function(argumentNode) {
		self.arguments.push({
			name: argumentNode.getAttribute('name'),
			type: argumentNode.getAttribute('type'),
			description: argumentNode.textContent
		});
	});
	
	this.shortDescription = Utils.childNamedText(classNode, 'short-description');
	this.discussion = Utils.childNamedText(classNode, 'discussion'),
	this.sample = Utils.childNamedText(classNode, 'sample');
};

module.exports.prototype = {
	template: Utils.getTemplate('Event'),
	
	getHTML: function(classes, parentClass) {
		var text = Utils.text.bind(Utils, parentClass),
			toTypeName = Utils.toTypeName.bind(Utils),
			code = Utils.code.bind(Utils, parentClass);
		
		var args = this.arguments.map(function(argument) {
					return {
						name: argument.name,
						nameTypeClass: 'df-type-' + toTypeName(text(argument.type)),
						description: text(argument.description)
					}
			});
		
		return this.template({
			name: this.name,
			'short-description': text(this.shortDescription),
			
			arguments: args,
			
			discussion: text(this.discussion),
			
			sample: code(this.sample)
		});
	}
};
