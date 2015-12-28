var Utils = require('./utilities.js');

module.exports = function Klass(buildSession, classNode) {
	this.id = null;
	this.name = null;
	
	this.buildSession = buildSession;
	this.template = this.buildSession.getTemplate('Detail');
	
	this.discussion = null;
	
	// Init
	this.id = classNode.getAttribute('id');
	this.name = classNode.getAttribute('name');
	
	this.discussion = Utils.childNamedText(classNode, 'discussion');
};

module.exports.prototype = {
	getHTML: function(hostClass) {
		var tools = this.buildSession.textToolsFor(hostClass);
		
		return this.template({
			id: this.id,
			name: this.name,
			discussion: tools.text(this.discussion)
		});
	}
};
