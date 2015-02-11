var Utils = require('./utilities.js');

module.exports = function Method(classNode) {
	this.name = null;
	
	this.signatures = [];
	this.arguments = [];
	
	this.returns = null;
	this.shortDescription = null;
	this.discussion = null;
	this.sample = null;
	
	// Init
	var self = this;
	this.name = classNode.getAttribute('name');
	
	Utils.forEachChildWithTagName(classNode, 'signature', function(signatureNode) {
		self.signatures.push(signatureNode.textContent);
	});
	
	Utils.forEachChildWithTagName(classNode, 'argument', function(argumentNode) {
		self.arguments.push({
			name: argumentNode.getAttribute('name'),
			type: argumentNode.getAttribute('type'),
			default: argumentNode.getAttribute('default'),
			description: argumentNode.textContent
		});
	});
	
	this.returns = Utils.childNamedText(classNode, 'returns');
	this.shortDescription = Utils.childNamedText(classNode, 'short-description');
	this.discussion = Utils.childNamedText(classNode, 'discussion'),
	this.sample = Utils.childNamedText(classNode, 'sample');
};

module.exports.prototype = {
	template: Utils.getTemplate('Method'),
	
	getHTML: function(classes, parentClass) {
		var text = Utils.text.bind(Utils, parentClass),
			code = Utils.code.bind(Utils, parentClass),
			colorTypes = Utils.colorTypes.bind(Utils),
			toTypeName = Utils.toTypeName.bind(Utils),
			functionSignature = Utils.functionSignature.bind(Utils);
		
		var typeborderClass = 'df-typeborder-' + (this.returns ? toTypeName(this.returns) : 'undefined'),
			args = this.arguments.map(function(argument) {
					return {
						name: argument.name,
						nameTypeClass: 'df-type-' + toTypeName(text(argument.type)),
						description: text(argument.description),
						'multiline-class': /<br>/.test(argument.description) ? 'multiline' : '',
						default: argument.default
					}
			});
		
		return this.template({
			name: this.name,
			returns: colorTypes(text(this.returns), true),
			'short-description': text(this.shortDescription),
			
			'typeborder-class': typeborderClass,
			
			signatures: this.signatures.map(text).map(functionSignature),
			arguments: args,
			
			discussion: text(this.discussion),
			
			sample: code(this.sample)
		});
	}
};
