var Utils = require('./utilities.js');

var MemberGroup = require('./MemberGroup.js');
var Export = require('./Export.js');

module.exports = function Klass(classNode) {
	this.id = null;
	this.name = null;
	this.public = false;
	
	this.discussion = null;
	this.related = null;
	this.placeholderValues = [];
	
	this.exports = {};
	this.memberGroups = [];
	
	// Init
	var self = this;
	
	// // Metadata
	if (classNode.getAttribute('public') === 'true') {
		this.public = true;
	}
	
	var metadata = Utils.childNamed(classNode, 'metadata');
	this.id = Utils.childNamedText(metadata, 'id');
	this.name = Utils.childNamedText(metadata, 'name');
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
			var exportObject = new Export(groupNode);
			self.exports[exportObject.id] = exportObject;
		});
	}
	
	var members = Utils.childNamed(classNode, 'members');
	if (members) {
		Utils.forEachChild(members, function(groupNode) {
			self.memberGroups.push(new MemberGroup(groupNode));
		});
	}
};

module.exports.prototype = {
	template: Utils.getTemplate('Klass'),
	
	getHTML: function(classes) {
		var self = this,
			text = Utils.text.bind(Utils, this);
		
		return this.template({
			name: this.name,
			discussion: text(this.discussion),
			related: text(this.related),
			memberGroups: this.memberGroups.map(function(member) {
				return member.getHTML(classes, self);
			})
		});
	},
	
	getExport: function(id) {
		return this.exports[id];
	}
};
