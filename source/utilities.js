var fs = require('fs');
var rimraf = require('rimraf');

module.exports = {
	// XML
	childNamed: function(parent, name) {
		var children = parent.childNodes;
		for (var c = 0; c < children.length; c++) {
			var child = children[c];
			if (child.nodeName === name) {
				return child;
			}
		}
		
		return null;
	},
	
	childNamedText: function(parent, name) {
		var child = this.childNamed(parent, name);
		return child ? child.textContent : null;
	},
	
	forEachChild: function(node, callback, callbackThis) {
		for (var c = 0; c < node.childNodes.length; c++) {
			var child = node.childNodes[c];
			if (child.nodeType === 1) {
				callback.call(callbackThis, child);
			}
		}
	},
	
	forEachChildWithTagName: function(node, tagName, callback, callbackThis) {
		for (var c = 0; c < node.childNodes.length; c++) {
			var child = node.childNodes[c];
			if (child.nodeType === 1 && child.nodeName === tagName) {
				callback.call(callbackThis, child);
			}
		}
	},
	
	// Files
	readFile: function(filename) {
		return fs.readFileSync(filename, {encoding: 'utf-8'})
	},
	
	writeFile: fs.writeFileSync,
	
	copyFile: fs.copyFileSync,
	
	emptyFolder: function(path) {
		rimraf.sync(path);
	},
	
	createFolder: function(path) {
		fs.mkdirSync(path);
	},
	
	getFolderContents: function(path) {
		return fs.readdirSync(path);
	},
	
	isFolder: function(path) {
		return fs.lstatSync(path).isDirectory();
	}
};
