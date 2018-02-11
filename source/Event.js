var Utils = require('./utilities.js');

module.exports = function Event(buildSession, rootNode) {
	this.name = null;
	
	this.buildSession = buildSession;
	this.template = this.buildSession.getTemplate('Event');
	
	this.callbackArgumentValues = null;
	
	this.shortDescription = null;
	this.discussion = null;
	this.sample = null;
	
	// Init
	var self = this;
	this.name = rootNode.getAttribute('name');
	
	var callbackArgumentNode = Utils.childNamed(rootNode, 'callback-argument');
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
	
	this.shortDescription = Utils.childNamedText(rootNode, 'short-description');
	this.discussion = Utils.childNamedText(rootNode, 'discussion'),
	this.sample = Utils.childNamedText(rootNode, 'sample');
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
