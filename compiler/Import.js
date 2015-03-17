var Utils = require('./utilities.js');

module.exports = function Import(buildSession, classNode) {
	this.from = null;
	this.id = null;
	
	this.buildSession = buildSession;
	
	// Init
	var self = this;
	this.from = classNode.getAttribute('from');
	this.id = classNode.getAttribute('id');
};

module.exports.prototype = {
	getHTML: function(hostClass) {
		return this.buildSession.getUnitById(this.from).getExport(this.id).getHTML(hostClass);
	}
};
