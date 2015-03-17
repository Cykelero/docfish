var Utils = require('./utilities.js');

var Method = require('./Method.js');
var Property = require('./Property.js');
var Event = require('./Event.js');
var Import = require('./Import.js');

module.exports = function Export(buildSession, classNode) {
	this.id = null;
	
	this.buildSession = buildSession;
	this.template = this.buildSession.getTemplate('Export');
	
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
			case 'event': memberClass = Event; break;
			case 'import': memberClass = Import; break;
		}
		
		self.members.push(new memberClass(self.buildSession, memberNode));
	});
};

module.exports.prototype = {
	getHTML: function(hostClass) {
		return this.template({
			members: this.members.map(function(member) {
				return member.getHTML(hostClass);
			})
		});
	}
};
