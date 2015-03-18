var Utils = require('./utilities.js');

module.exports = function Property(buildSession, classNode) {
	this.name = null;
	this.type = null;
	
	this.buildSession = buildSession;
	this.template = this.buildSession.getTemplate('Property');
	
	this.shortDescription = null;
	this.discussion = null;
	this.defaultValue = null;
	this.isReadOnly = null;
	this.sample = null;
	
	// Init
	var self = this;
	this.name = classNode.getAttribute('name');
	this.type = Utils.childNamedText(classNode, 'type');
	this.shortDescription = Utils.childNamedText(classNode, 'short-description');
	this.discussion = Utils.childNamedText(classNode, 'discussion');
	this.defaultValue = Utils.childNamedText(classNode, 'default-value');
	this.isReadOnly = !!Utils.childNamed(classNode, 'read-only');
	this.sample = Utils.childNamedText(classNode, 'sample');
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
			sample: tools.code(this.sample)
		});
	}
};
