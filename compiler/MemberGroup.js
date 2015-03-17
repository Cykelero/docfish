var Utils = require('./utilities.js');

var Method = require('./Method.js');
var Property = require('./Property.js');
var Event = require('./Event.js');
var Import = require('./Import.js');

module.exports = function MemberGroup(buildSession, classNode) {
	this.name = null;
	
	this.buildSession = buildSession;
	this.template = this.buildSession.getTemplate('MemberGroup');
	
	this.members = [];
	
	// Init
	var self = this;
	this.name = classNode.getAttribute('name');
	
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
			name: this.name,
			members: this.members.map(function(member) {
				return member.getHTML(hostClass);
			})
		});
	}
};
