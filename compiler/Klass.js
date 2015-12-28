var Utils = require('./utilities.js');

var Detail = require('./Detail.js');
var MemberGroup = require('./MemberGroup.js');
var Export = require('./Export.js');

module.exports = function Klass(buildSession, rootNode) {
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
	this.details = [];
	this.memberGroups = [];
	
	// Init
	var self = this,
		tools = this.buildSession.textToolsFor(this);
	
	// // Metadata
	this.id = rootNode.getAttribute('id');
	if (rootNode.getAttribute('public') === 'true') {
		this.public = true;
	}
	
	var metadata = Utils.childNamed(rootNode, 'metadata');
	this.name = Utils.childNamedText(metadata, 'name');
	this.shortDescription = Utils.childNamedText(metadata, 'short-description');
	this.discussion = Utils.childNamedText(metadata, 'discussion');
	this.related = Utils.childNamedText(metadata, 'related');
	
	var placeholderValues = Utils.childNamed(metadata, 'placeholder-values');
	if (placeholderValues) {
		Utils.forEachChild(placeholderValues, function(placeholderNode) {
			self.placeholderValues.push({
				name: placeholderNode.getAttribute('name'),
				value: tools.text(placeholderNode.textContent)
			});
		});
	}
	
	// // Exports, details and members
	var exports = Utils.childNamed(rootNode, 'exports');
	if (exports) {
		Utils.forEachChild(exports, function(groupNode) {
			var exportObject = new Export(self.buildSession, groupNode);
			self.exports[exportObject.id] = exportObject;
		});
	}
	
	var details = Utils.childNamed(rootNode, 'details');
	if (details) {
		Utils.forEachChild(details, function(detailNode) {
			self.details.push(new Detail(self.buildSession, detailNode));
		});
	}
	
	var members = Utils.childNamed(rootNode, 'members');
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
			details: this.details.map(function(detail) {
				return detail.getHTML(self);
			}),
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
