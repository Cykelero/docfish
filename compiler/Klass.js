var Utils = require('./utilities.js');

var MemberGroup = require('./MemberGroup.js');
var Export = require('./Export.js');

module.exports = function Klass(buildSession, classNode) {
	this.id = null;
	this.name = null;
	this.public = false;
	
	this.buildSession = buildSession;
	this.template = this.buildSession.getTemplate('Klass');
	
	this.shortDescription = null;
	this.discussion = null;
	this.related = null;
	this.placeholderValues = [];
	
	this.exports = {};
	this.memberGroups = [];
	
	// Init
	var self = this;
	
	// // Metadata
	this.id = classNode.getAttribute('id');
	if (classNode.getAttribute('public') === 'true') {
		this.public = true;
	}
	
	var metadata = Utils.childNamed(classNode, 'metadata');
	this.name = Utils.childNamedText(metadata, 'name');
	this.shortDescription = Utils.childNamedText(metadata, 'short-description');
	this.discussion = Utils.childNamedText(metadata, 'discussion');
	this.related = Utils.childNamedText(metadata, 'related');
	
	var placeholderValues = Utils.childNamed(metadata, 'placeholder-values');
	if (placeholderValues) {
		Utils.forEachChild(placeholderValues, function(placeholderNode) {
			self.placeholderValues.push({
				name: placeholderNode.getAttribute('name'),
				value: placeholderNode.textContent
			});
		});
	}
	
	// // Exports and members
	var exports = Utils.childNamed(classNode, 'exports');
	if (exports) {
		Utils.forEachChild(exports, function(groupNode) {
			var exportObject = new Export(self.buildSession, groupNode);
			self.exports[exportObject.id] = exportObject;
		});
	}
	
	var members = Utils.childNamed(classNode, 'members');
	if (members) {
		Utils.forEachChild(members, function(groupNode) {
			self.memberGroups.push(new MemberGroup(self.buildSession, groupNode));
		});
	}
};

module.exports.prototype = {
	getHTML: function() {
		var self = this,
			tools = this.buildSession.textToolsFor(this);
		
		return this.template({
			name: this.name,
			discussion: tools.text(this.discussion),
			related: tools.text(this.related),
			memberGroups: this.memberGroups.map(function(member) {
				return member.getHTML(self);
			})
		});
	},
	
	getExport: function(id) {
		return this.exports[id];
	},
	
	getMemberByName: function(name) {
		for (var g = 0; g < this.memberGroups.length; g++) {
			var memberResult = this.memberGroups[g].getMemberByName(name);
			if (memberResult) return memberResult;
		}
		
		return null;
	}
};
