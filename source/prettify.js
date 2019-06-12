const prettier = require('prettier');

process.on('message', function(source) {
	try {
		const prettierHTML = prettier.format(source, {
			parser: 'html',
			printWidth: Number.POSITIVE_INFINITY,
			useTabs: true
		});
		process.send({error: null, result: prettierHTML});
	} catch (error) {
		process.send({error: error, result: html});
	}
});
