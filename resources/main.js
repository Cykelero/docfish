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
	this.contentNode.style.height = "0px";
	this.node.style.transitionProperty = "none";
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
			clearTimeout(this.foldEndTimeout);
			this.foldEndTimeout = null;
		}
		
		// Set folded
		if (fold != this.folded) {
			this.folded = fold;
			
			var startHeight,
				targetHeight;
			
			// Start by disabling transitions
			this.contentNode.style.transitionProperty = "none";
			
			// Measure start/target heights
			startHeight = this.contentNode.offsetHeight;
			
			if (fold) {
				targetHeight = 0;
			} else {
				this.contentNode.style.height = "";
				targetHeight = this.contentNode.offsetHeight;
			}
			
			// Setup transition
			this.contentNode.style.height = startHeight + "px";
			
			requestAnimationFrame(function() {
				// Start content transition
				self.contentNode.style.transitionProperty = "";
				self.contentNode.style.height = targetHeight + "px";
			
				// Start container transition
				self.node.style.transitionProperty = "";
				self.node.classList.toggle("folded", fold);
				
				// Set foldEndTimeout
				self.foldEndTimeout = setTimeout(function() {
					if (targetHeight != 0) {
						self.contentNode.style.transitionProperty = "none";
						self.contentNode.style.height = "";
						
						self.node.style.transitionProperty = "none";
						
						self.foldEndTimeout = null;
					}
				}, .3 * 1000); // value from CSS
			});
		}
		
		// If opening, scroll to reveal
		if (!fold && scrollToReveal) {
			var nodeDimensions = this.node.getBoundingClientRect(),
				titleNodeDimensions = this.titleNode.getBoundingClientRect(),
				nodeTop = nodeDimensions.top + window.scrollY,
				nodeBottom = nodeTop + targetHeight + titleNodeDimensions.height + 27,
				minScroll = nodeBottom - window.innerHeight,
				maxScroll = nodeTop - 5;
			
			minScroll = Math.min(minScroll, maxScroll); // maxScroll has the priority
			
			if (window.scrollY > maxScroll) {
				// Animate scroll
				animateScroll(+new Date(), .2 * 1000, maxScroll);
			} else if (window.scrollY < minScroll) {
				// Animate scroll
				animateScroll(+new Date(), .2 * 1000, minScroll);
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
});

window.addEventListener("hashchange", function() {
	var hash = location.hash.slice(1);
	getMemberById(hash).setFolded(false, true);
});
