var channels = {},
	enabledChannels = [];

// Manage channels
function setup(options) {
	// Add channels
	if (options.channels) {
		for (var c in options.channels) {
			if (options.channels.hasOwnProperty(c)) {
				addChannel(c, options.channels[c]);
			}
		}
	}
	
	// Enable channels
	if (options.enabled) {
		options.enabled.forEach(function(enabledChannel) {
			enabledChannel(enabledChannel);
		});
	}
};

function addChannel(name, definition) {
	channels[name] = definition;
};

function enableChannel(name) {
	enabledChannels.push(name);
};

function enableChannels(names) {
	names.forEach(function(name) {
		enableChannel(name);
	});
};

// Log
function log(channelName, data) {
	if (enabledChannels.indexOf(channelName) !== -1) {
		var message;
		
		if (typeof(data) === "string") {
			data = {'$': data};
		}
		
		// Build message
		message = channels[channelName].text.replace(/\{([^}]+)\}/g, function(token, tokenName) {
			if (data.hasOwnProperty(tokenName)) {
				return data[tokenName];
			} else {
				return token;
			}
		});
		
		// Log
		console.log(message);
	}
};

// Initialize
addChannel('main', {
	text: '{$}'
});
enableChannel('main');

// Expose
module.exports = function(channelName, data) {
	log(channelName, data);
};

module.exports.setup = setup;
module.exports.enableChannel = enableChannel;
module.exports.enableChannels = enableChannels;
