var Utils = require('./utilities.js');

module.exports = function Event(classNode) {
	this.name = null;
	
	this.callbackArgumentValues = null;
	
	this.shortDescription = null;
	this.discussion = null;
	this.sample = null;
	
	// Init
	var self = this;
	this.name = classNode.getAttribute('name');
	
	var callbackArgumentNode = Utils.childNamed(classNode, 'callback-argument');
	if (callbackArgumentNode) {
		this.callbackArgumentValues = [];
		Utils.forEachChildWithTagName(callbackArgumentNode, 'value', function(valueNode) {
			self.callbackArgumentValues.push({
				name: valueNode.getAttribute('name'),
				type: valueNode.getAttribute('type'),
				description: valueNode.textContent
			});
		});
	}
	
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
		
		var callbackArgumentValues = this.callbackArgumentValues &&
				this.callbackArgumentValues.map(function(value) {
						return {
							name: value.name,
							nameTypeClass: 'df-type-' + toTypeName(text(value.type)),
							description: text(value.description)
						}
				});
		
		return this.template({
			name: this.name,
			'short-description': text(this.shortDescription),
			
			callbackArgumentValues: callbackArgumentValues,
			
			discussion: text(this.discussion),
			
			sample: code(this.sample)
		});
	}
};
