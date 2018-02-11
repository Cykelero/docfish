var Utils = require('./utilities.js');

module.exports = function Import(buildSession, rootNode) {
	this.from = null;
	this.id = null;
	
	this.buildSession = buildSession;
	
	// Init
	var self = this;
	this.from = rootNode.getAttribute('from');
	this.id = rootNode.getAttribute('id');
};

module.exports.prototype = {
	getHTML: function(hostClass) {
		return this.buildSession.getUnitById(this.from).getExport(this.id).getHTML(hostClass);
	},
	
	getMemberByName: function(name) {
		return this.buildSession.getUnitById(this.from).getExport(this.id).getMemberByName(name);
	}
};
