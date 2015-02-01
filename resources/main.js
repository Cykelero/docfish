// Constants
var animationDuration;

// Variables
var members = [];

// Classes, functions
function Member(node) {
	this.node = node;
	this.titleNode = node.querySelector("h4");
	this.contentNode = node.querySelector(".class-member-content");
	
	this.id = this.node.id;
	
	// Init
	// // Events
	this.titleNode.addEventListener("click", this.onTitleClick.bind(this));
	this.titleNode.addEventListener("mousedown", this.startTitleClickTracking.bind(this));
	
	// // Start closed
	this.contentNode.style.display = "none";
	this.node.classList.add("folded");
};

Member.prototype = {
	folded: true,
	preventNextToggle: false,
	foldEndTimeout: null,
	
	titleClickStartPosition: null,
	boundEndTrackingFunction: null,
	
	
	toggleFolded: function(scrollToReveal) {
		this.setFolded(!this.folded, scrollToReveal);
	},
	
	setFolded: function(fold, scrollToReveal) {
		var self = this;
		
		if (this.foldEndTimeout) {
			this.foldEndTimeout.triggerNow();
		}
		
		// Set folded
		if (fold != this.folded) {
			this.folded = fold;
			
			var startHeight,
				endHeight,
				offset,
				startBottomPadding,
				endBottomPadding;
			
			// Measure current dimensions
			startHeight = this.node.offsetHeight;
			startBottomPadding = parseInt(getComputedStyle(this.node).paddingBottom);
			
			// Fold/unfold, measure new dimensions
			this.contentNode.style.display = fold ? "none" : "";
			this.contentNode.style.opacity = fold ? "1" : "0";
			this.node.classList.toggle("folded", fold);
			
			endHeight = this.node.offsetHeight;
			endBottomPadding = parseInt(getComputedStyle(this.node).paddingBottom);
			offset = startHeight - endHeight;
			
			this.contentNode.style.display = "";
			
			// Create white mask
			var maskTopMargin = fold ? -(Math.abs(offset)) : -startBottomPadding,
				maskBottomMargin = fold ? (startBottomPadding - endBottomPadding) - (Math.abs(offset)) : (startBottomPadding) - (Math.abs(offset));
			
			var maskNode = document.createElement("div");
			maskNode.style.display = "block";
			maskNode.style.background = "white";
			maskNode.style.width = "100%";
			maskNode.style.height = Math.abs(offset) + "px";
			maskNode.style.marginTop = maskTopMargin + "px";
			maskNode.style.marginBottom = maskBottomMargin + "px";
			
			this.node.parentNode.insertBefore(maskNode, this.node.nextSibling);
			
			// Move subsequent nodes back to their original position
			var nodesToShift = this.getFollowingNodes(true);
			
			nodesToShift.forEach(function(nodeToPush) {
				nodeToPush.style.transitionProperty = "none";
				nodeToPush.style.transform = 
				nodeToPush.style.webkitTransform = "translate(0, " + offset + "px)";
			});
			
			setTimeout(function() {
				// Animate subsequent nodes to their natural position
				nodesToShift.forEach(function(nodeToPush) {
					nodeToPush.style.transitionProperty = "transform";
					nodeToPush.style.transitionProperty = "-webkit-transform";
					nodeToPush.style.transform = 
					nodeToPush.style.webkitTransform = "";
				});
				
				// Animate content opacity
				self.contentNode.style.transitionProperty = "opacity";
				self.contentNode.style.opacity = fold ? "0" : "1";
				
				// When animation is finished, clean up
				this.foldEndTimeout = new Timeout(function() {
					if (fold) {
						self.contentNode.style.display = "none";
					} else {
						self.contentNode.style.display = "";
					}
					
					maskNode.parentNode.removeChild(maskNode);
				}, animationDuration);
			}, 0);
		}
		
		// If opening, scroll to reveal
		if (!fold && scrollToReveal) {
			var nodeDimensions = this.node.getBoundingClientRect(),
				titleNodeDimensions = this.titleNode.getBoundingClientRect(),
				nodeTop = nodeDimensions.top + window.scrollY,
				nodeBottom = nodeTop + endHeight,
				minScroll = nodeBottom - window.innerHeight,
				maxScroll = nodeTop - 5;
			
			minScroll = Math.min(minScroll, maxScroll); // maxScroll has the priority
			
			if (window.scrollY > maxScroll) {
				// Animate scroll
				animateScroll(+new Date(), animationDuration, maxScroll);
			} else if (window.scrollY < minScroll) {
				// Animate scroll
				animateScroll(+new Date(), animationDuration, minScroll);
			}
		}
	},
	
	onTitleClick: function(event) {
		if (this.preventNextToggle) {
			this.preventNextToggle = false;
			return;
		}
		
		if (window.getSelection) {
			window.getSelection().removeAllRanges();
		} else {
			document.selection.empty();
		}
		
		this.toggleFolded(true);
	},
	
	startTitleClickTracking: function(event) {
		this.titleClickStartPosition = {
			x: event.pageX,
			y: event.scrollY
		};
		
		this.boundEndTrackingFunction = this.endTitleClickTracking.bind(this);
		window.addEventListener("mouseup", this.boundEndTrackingFunction);
	},
	
	endTitleClickTracking: function(event) {
		var self = this;
		
		var titleClickEndPosition = {
			x: event.pageX,
			y: event.scrollY
		};
		
		var xDistance = Math.abs(this.titleClickStartPosition.x - titleClickEndPosition.x);
		
		if (xDistance > 3) {
			this.preventNextToggle = true;
			setTimeout(function() {
				self.preventNextToggle = false;
			}, 1);
		}
		
		window.removeEventListener("mouseup", this.boundEndTrackingFunction);
		delete this.titleClickStartPosition;
		delete this.boundEndTrackingFunction;
		
	},
	
	getFollowingNodes: function(excludeTextNodes) {
		var result = [];
		
		var currentNode = this.node;
		while (true) {
			// Find next node
			if (currentNode.nextSibling) {
				currentNode = currentNode.nextSibling;
			} else {
				currentNode = currentNode.parentNode;
				if (currentNode == document.body) break;
				continue;
			}
			if (currentNode.nodeType == 1) result.push(currentNode);
		};
		
		return result;
	}
};

Timeout = function(callback, delay) {
	this.callback = callback;
	this.hasTriggered = false;
	
	// Init
	setTimeout(this.triggerNow.bind(this), delay);
};

Timeout.prototype = {
	triggerNow: function() {
		if (!this.hasTriggered) {
			this.hasTriggered = true;
			this.callback();
		}
	},
	
	cancel: function() {
		this.hasTriggered = true;
	}
};

function animateScroll(startDate, duration, endScroll) {
	var endDate = startDate + duration,
		startScroll = window.scrollY;
	
	var lastScroll = startScroll;
	
	function updateScroll() {
		if (window.scrollY != lastScroll){
			// User overrided the scroll animation
			return;
		}
		
		var progress = (new Date() - startDate) / duration;
		progress = Math.sin(progress * Math.PI / 2);
		
		var interpolatedValue =  progress * (endScroll - startScroll) + startScroll;
		scrollTo(0, interpolatedValue);
		
		lastScroll = window.scrollY;
		
		if (new Date() < endDate) {
			requestAnimationFrame(updateScroll);
		}
	}
	
	requestAnimationFrame(updateScroll);
};

function getMemberById(id) {
	var result = null;
	
	members.forEach(function(member) {
		if (member.id == id) {
			result = member;
		}
	});
	
	return result
};

// Initialization
document.addEventListener("DOMContentLoaded", function() {
	// Retrieve default animation duration
	animationDuration = parseFloat(getComputedStyle(document.body).transitionDuration) * 1000;
	
	// Create Member objects
	var memberNodes = document.getElementsByClassName("class-member");
	for (var m = 0; m < memberNodes.length; m++) {
		var member = new Member(memberNodes[m]);
		members.push(member);
	}
	
	// Install link click handler
	var documentName = location.href.match(/([^\/#]*)(#|$)/)[1];
	var aNodes = document.getElementsByTagName("a");
	for (var a = 0; a < aNodes.length; a++) {
		var aNode = aNodes[a],
			nodeTargetComponents = (aNode.getAttribute("href") || "").match(/([^#]*)(#.*)?$/);
		
		if (documentName == nodeTargetComponents[1]) {
			var nodeTargetId = nodeTargetComponents[2].slice(1);
			if (nodeTargetId.length) {
				aNode.addEventListener("click", function(event) {
					event.preventDefault();
					
					var currentURLWithoutHash = location.href.match(/([^#]+)(#|$)/)[1];
					history.pushState(nodeTargetId, null, currentURLWithoutHash + "#" + nodeTargetId);
					
					var member = getMemberById(nodeTargetId);
					if (member) member.setFolded(false, true);
				});
			}
		}
	}
	
	// If a hash is specified, reveal the corresponding member
	var hash = location.hash.slice(1);
	setTimeout(function() {
		getMemberById(hash).setFolded(false, true);
	}, 100);
});

window.addEventListener("hashchange", function() {
	var hash = location.hash.slice(1);
	getMemberById(hash).setFolded(false, true);
});
