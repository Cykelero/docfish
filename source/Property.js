var Utils = require('./utilities.js');

module.exports = function Property(buildSession, rootNode) {
	this.name = null;
	this.type = null;
	
	this.buildSession = buildSession;
	this.template = this.buildSession.getTemplate('Property');
	
	this.shortDescription = null;
	this.discussion = null;
	this.defaultValue = null;
	this.isReadOnly = null;
	this.samples = [];
	
	// Init
	var self = this;
	this.name = rootNode.getAttribute('name');
	this.type = Utils.childNamedText(rootNode, 'type');
	this.shortDescription = Utils.childNamedText(rootNode, 'short-description');
	this.discussion = Utils.childNamedText(rootNode, 'discussion');
	this.defaultValue = Utils.childNamedText(rootNode, 'default-value');
	this.isReadOnly = !!Utils.childNamed(rootNode, 'read-only');
	
	Utils.forEachChildWithTagName(rootNode, 'sample', function(sampleNode) {
		self.samples.push({
			name: sampleNode.getAttribute('name'),
			content: sampleNode.textContent
		});
	});
};

module.exports.prototype = {
	getHTML: function(hostClass) {
		var tools = this.buildSession.textToolsFor(hostClass);
		
		return this.template({
			name: this.name,
			'short-description': tools.attribute(this.shortDescription),
			type: tools.type(tools.text(this.type)),
			'typeborder-class': 'df-kindborder-' + this.buildSession.typeToKind(this.type),
			discussion: tools.text(this.discussion),
			'default-value': this.defaultValue,
			'is-read-only': this.isReadOnly,
			
			samples: this.samples.map(sample => {
				return {
					name: tools.text(sample.name),
					content: tools.code(sample.content)
				};
			})
		});
	}
};
