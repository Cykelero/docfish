var Utils = require('./utilities.js');

module.exports = function Property(classNode) {
	this.name = null;
	this.type = null;
	this.shortDescription = null;
	this.discussion = null;
	this.defaultValue = null;
	this.sample = null;
	
	// Init
	var self = this;
	this.name = classNode.getAttribute('name');
	this.type = Utils.childNamedText(classNode, 'type');
	this.shortDescription = Utils.childNamedText(classNode, 'short-description');
	this.discussion = Utils.childNamedText(classNode, 'discussion');
	this.defaultValue = Utils.childNamedText(classNode, 'default-value');
	this.sample = Utils.childNamedText(classNode, 'sample');
};

module.exports.prototype = {
	template: Utils.getTemplate('Property'),
	
	getHTML: function(classes, parentClass) {
		var text = Utils.text.bind(Utils, parentClass),
			code = Utils.code.bind(Utils, parentClass),
			colorTypes = Utils.colorTypes.bind(Utils),
			toTypeName = Utils.toTypeName.bind(Utils);
		
		return this.template({
			name: this.name,
			type: colorTypes(text(this.type, true)),
			'short-description': text(this.shortDescription),
			'typeborder-class': 'df-typeborder-' + toTypeName(this.type),
			discussion: text(this.discussion),
			'default-value': this.defaultValue,
			sample: code(this.sample)
		});
	}
};
