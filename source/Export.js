var Utils = require('./utilities.js');

var Method = require('./Method.js');
var Property = require('./Property.js');
var Event = require('./Event.js');
var Import = require('./Import.js');

module.exports = function Export(buildSession, rootNode) {
	this.id = null;
	
	this.buildSession = buildSession;
	this.template = this.buildSession.getTemplate('Export');
	
	this.members = [];
	
	// Init
	var self = this;
	this.id = rootNode.getAttribute('id');
	
	// // Members
	Utils.forEachChild(rootNode, function(memberNode) {
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
	},
	
	getMemberByName: function(name) {
		for (var m = 0; m < this.members.length; m++) {
			var member = this.members[m];
			
			if (member.name === name
				|| member instanceof Event && 'on-' + member.name === name) {
				return member;
			} else if (member.getMemberByName) {
				var memberResult = member.getMemberByName(name);
				if (memberResult) return memberResult;
			}
		}
		
		return null;
	}
};
