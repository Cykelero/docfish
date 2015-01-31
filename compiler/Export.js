var Utils = require('./utilities.js');

var Method = require('./Method.js');
var Property = require('./Property.js');
var Import = require('./Import.js');

module.exports = function Export(classNode) {
	this.id = null;
	
	this.members = [];
	
	// Init
	var self = this;
	this.id = classNode.getAttribute('id');
	
	// // Members
	Utils.forEachChild(classNode, function(memberNode) {
		var memberClass;
		
		switch (memberNode.nodeName) {
			case 'method': memberClass = Method; break;
			case 'property': memberClass = Property; break;
			case 'import': memberClass = Import; break;
		}
		
		self.members.push(new memberClass(memberNode));
	});
};

module.exports.prototype = {
	template: Utils.getTemplate('Export'),
	
	getHTML: function(classes, importingClass) {
		return this.template({
			members: this.members.map(function(member) {
				return member.getHTML(classes, importingClass);
			})
		});
	}
};
