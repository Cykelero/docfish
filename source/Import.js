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
		return this._getExport().getHTML(hostClass);
	},
	
	getMemberByName: function(name) {
		return this._getExport().getMemberByName(name);
	},
	
	_getExport() {
		const unit = this.buildSession.getUnitById(this.from);
		if (!unit) throw new Error(`Unit “${this.from}” does not exist.`);
		return unit.getExport(this.id);
	}
};
