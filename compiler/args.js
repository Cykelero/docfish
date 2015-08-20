var rawValues = {},
	values = {};

// Extract arguments
for (var a = 0; a < process.argv.length; a++) {
	var currentArg = process.argv[a];
	if (currentArg.slice(0, 2) === '--') {
		// Longhand argument
		var argumentPieces = /--([^=]+)(=?)(.*)/.exec(currentArg);
		
		if (!argumentPieces) continue;
		
		var argumentName = argumentPieces[1],
			argumentValue = argumentPieces[2].length ? argumentPieces[3] : true;
		
		rawValues[argumentName] = argumentValue;
	}
}

// Parse arguments
function describe(definitions) {
	Object.keys(definitions).forEach(function(argName) {
		var argDefinition = definitions[argName],
			rawArgValue = rawValues[argName];
		
		var argValue;
		
		// Cast type
		switch (argDefinition.type) {
			case 'boolean':
				if (typeof(rawArgValue) === 'boolean' || typeof(rawArgValue) === 'undefined') {
					argValue = !!rawArgValue;
				} else {
					switch (rawArgValue) {
						case '':
						case 'false':
						case '0':
						case 'no':
						case 'nay':
							argValue = false;
							break;
						default:
							argValue = true;
					}
				}
				break;
			case 'string':
				argValue = String(rawArgValue);
				break;
			case 'number':
				argValue = Number(rawArgValue);
				break;
			default:
				argValue = rawArgValue;
		}
		
		// Apply filter
		if (argDefinition.parse) {
			argValue = argDefinition.parse(argValue);
		}
		
		values[argName] = argValue;
	});
}

// Expose
module.exports = {
	rawValues: rawValues,
	values: values,
	describe: describe
};
