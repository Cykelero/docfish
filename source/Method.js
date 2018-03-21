var Utils = require('./utilities.js');

module.exports = function Method(buildSession, rootNode) {
	this.name = null;
	
	this.buildSession = buildSession;
	this.template = this.buildSession.getTemplate('Method');
	
	this.signatures = [];
	this.arguments = [];
	
	this.returns = null;
	this.shortDescription = null;
	this.discussion = null;
	this.samples = [];
	
	// Init
	var self = this;
	this.name = rootNode.getAttribute('name');
	
	Utils.forEachChildWithTagName(rootNode, 'signature', function(signatureNode) {
		self.signatures.push(signatureNode.textContent);
	});
	
	Utils.forEachChildWithTagName(rootNode, 'argument', function(argumentNode) {
		self.arguments.push({
			name: argumentNode.getAttribute('name'),
			type: argumentNode.getAttribute('type'),
			defaultValue: argumentNode.getAttribute('default'),
			description: argumentNode.textContent
		});
	});
	
	this.returns = Utils.childNamedText(rootNode, 'returns');
	this.shortDescription = Utils.childNamedText(rootNode, 'short-description');
	this.discussion = Utils.childNamedText(rootNode, 'discussion'),
	
	Utils.forEachChildWithTagName(rootNode, 'sample', function(sampleNode) {
		self.samples.push({
			name: sampleNode.getAttribute('name'),
			content: sampleNode.textContent
		});
	});
};

module.exports.prototype = {
	getHTML: function(hostClass) {
		var self = this,
			tools = this.buildSession.textToolsFor(hostClass),
			globalPrefix = this.buildSession.getGlobalPrefix();
		
		var kindborderClass,
			args,
			formattedName;
		
		kindborderClass = 'df-kindborder-' + (this.returns ? this.buildSession.typeToKind(this.returns) : 'undefined');
		args = this.arguments.map(function(argument) {
			return {
				name: argument.name,
				kindClass: 'df-kind-' + self.buildSession.typeToKind(tools.text(argument.type)),
				description: tools.text(argument.description),
				'multiline-class': /<br>/.test(argument.description) ? 'multiline' : '',
				'default-value': argument.defaultValue
			};
		});
		
		if (globalPrefix && this.name.indexOf(globalPrefix) === 0) {
			formattedName = '<strong class="global-prefix">'
				+ globalPrefix
				+ '</strong>'
				+ this.name.slice(globalPrefix.length);
		} else {
			formattedName = this.name;
		}
		
		return this.template({
			name: this.name,
			'short-description': tools.attribute(this.shortDescription),
			formattedName: formattedName,
			returns: tools.type(tools.text(this.returns)),
			
			'kindborder-class': kindborderClass,
			
			signatures: this.signatures.map(tools.functionSignature),
			arguments: args,
			
			discussion: tools.text(this.discussion),
			
			samples: this.samples.map(sample => {
				return {
					name: tools.text(sample.name),
					content: tools.code(sample.content)
				};
			})
		});
	}
};
