var Utils = require('./utilities.js');

module.exports = function Event(buildSession, classNode) {
	this.name = null;
	
	this.buildSession = buildSession;
	this.template = this.buildSession.getTemplate('Event');
	
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
	getHTML: function(hostClass) {
		var self = this,
			tools = this.buildSession.textToolsFor(hostClass);
		
		var callbackArgumentValues = this.callbackArgumentValues &&
				this.callbackArgumentValues.map(function(value) {
						return {
							name: value.name,
							nameTypeClass: 'df-kind-' + self.buildSession.typeToKind(tools.text(value.type)),
							description: tools.text(value.description)
						}
				});
		
		return this.template({
			name: this.name,
			'short-description': tools.attribute(this.shortDescription),
			
			callbackArgumentValues: callbackArgumentValues,
			
			discussion: tools.text(this.discussion),
			
			sample: tools.code(this.sample)
		});
	}
};
