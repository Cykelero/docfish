var Utils = require('./utilities.js');

module.exports = function Import(classNode) {
	this.from = null;
	this.id = null;
	
	// Init
	var self = this;
	this.from = classNode.getAttribute('from');
	this.id = classNode.getAttribute('id');
};

module.exports.prototype = {
	getHTML: function(classes, parentClass) {
		return classes[this.from].getExport(this.id).getHTML(classes, parentClass);
	}
};
