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
		
		// Cast and filter value
		if (rawArgValue !== undefined) {
			argValue = castRawArgumentValue(rawArgValue, argDefinition);
			
			if (argDefinition.parse) {
				argValue = argDefinition.parse(argValue);
			}
		}
		
		values[argName] = argValue;
	});
}

function castRawArgumentValue(rawArgValue, argDefinition) {
	switch (argDefinition.type) {
		case 'boolean':
			if (typeof(rawArgValue) === 'boolean' || typeof(rawArgValue) === 'undefined') {
				return !!rawArgValue;
			} else {
				switch (rawArgValue) {
					case '':
					case 'false':
					case '0':
					case 'no':
					case 'nay':
						return false;
					default:
						return true;
				}
			}
		case 'string':
			return String(rawArgValue);
		case 'number':
			return Number(rawArgValue);
		default:
			return rawArgValue;
	}
}

// Expose
module.exports = {
	rawValues: rawValues,
	values: values,
	describe: describe
};
