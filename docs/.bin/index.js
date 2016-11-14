var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var jsdocParse = require('jsdoc-parse');
var jsdocApi = require('jsdoc-api');
var dmd = require('dmd');

var cliArgs = minimist(process.argv.slice(2), {
	'--': false,
	boolean: ['unified', 'protected', 'private']
});

var SYNTAX = 'SYNTAX: node ' + path.relative(process.cwd(), process.argv[1])
	+ ' [--unified] [--protected|--private] [--overwrite] <output-path>\n';

var outputPath = cliArgs._[0];
var overwrite = cliArgs.overwrite;
var unifiedOutput = cliArgs.unified;
var includeProtected = cliArgs.protected || cliArgs.private;
var includePrivate = cliArgs.private;

var baseOptions = {
	files: path.join(__dirname, '../../lib/*.js')
};

if (includePrivate) {
	baseOptions.private = true;
}

if (!outputPath) {
	process.stderr.write('Missing <output-path>\n' + SYNTAX);
	process.exit(1);
}

main();

function main() {
	var options = Object.assign({}, baseOptions);
	checkOutputPath()
		.then(function(stat) {
			if (!unifiedOutput) {
				if (stat && stat.isDirectory()) {
					return removeOutputDir();
				}
				else if (!stat) {
					return new Promise(function(resolve, reject) {
						fs.mkdir(outputPath, function(err) {
							if (err) {
								err.message = 'Failed to make <output-path> dir -- ' + err.message;
								reject(err);
							}
							else {
								resolve();
							}
						});
					});
				}
			}
		})
		.then(function() {
			return getTemplateData(options)
				.then(filterTemplateData)
				.then(function(templateData) {
					if (unifiedOutput) {
						return buildUnified(templateData, options);
					}
					else {
						return buildSplit(templateData, options);
					}
				});
		}, function(err) {
			process.stderr.write(err.message + '\n' + SYNTAX);
			process.exitCode = 1;
		})
		.catch(function(err) {
			process.stderr.write(err.stack + '\n');
			process.exitCode = 1;
		});
}

function checkOutputPath() {
	return new Promise(function(resolve, reject) {
		fs.stat(outputPath, function(err, stat) {
			if (err) {
				if (err.code === 'ENOENT') {
					resolve(stat);
				}
				else {
					err.message = 'Failed to stat <output-path> -- ' + err.message;
					reject(err);
				}
			}
			else if (!overwrite) {
				reject(new Error('<output-path> already exists'));
			}
			else if (unifiedOutput && !stat.isFile()) {
				reject(new Error('<output-path> exists and is not a file'));
			}
			else if (!unifiedOutput && !stat.isDirectory()) {
				reject(new Error('<output-path> exists and is not a directory'));
			}
			else {
				resolve(stat);
			}
		});
	});
}

function removeOutputDir() {
	return new Promise(function(resolve, reject) {
		fs.readdir(outputPath, function(err, files) {
			if (err) {
				reject(err);
			}
			else {
				resolve(files);
			}
		});
	})
		.then(function(files) {
			return promiseForEach(files, function(file) {
				if (file.match(/^.+\.md$/)) {
					var filePath = path.join(outputPath, file);
					return new Promise(function(resolve, reject) {
						fs.unlink(filePath, function(err) {
							if (err) {
								err.message = 'Failed to unlink ' + JSON.stringify(filePath) + ' -- ' + err.message;
								reject(err);
							}
							else {
								resolve();
							}
						});
					});
				}
			})
		});
}

function filterTemplateData(templateData) {
	return templateData.filter(function(doclet) {
		return (includeProtected || doclet.access !== 'protected')
			&& (includePrivate || doclet.access !== 'private');
	});
}

function buildUnified(templateData, options) {
	return dmd.async(templateData, Object.assign({}, options, {
		data: templateData
	}))
		.then(function(output) {
			return new Promise(function(resolve, reject) {
				fs.writeFile(outputPath, output, function(err) {
					if (err) {
						reject(err);
					}
					else {
						resolve();
					}
				});
			});
		});
}

function buildSplit(templateData, options) {
	var additionalOptions = {
		helper: path.join(__dirname, 'helpers.js'),
		partial: path.join(__dirname, 'partials/*.hbs')
	};

	// Create main README
	return dmd.async(templateData, Object.assign({}, options, additionalOptions, {
		data: templateData,
		template: '{{>main-index}}'
	}))
		.then(function(output) {
			return new Promise(function(resolve, reject) {
				fs.writeFile(path.join(outputPath, 'README.md'), output, function(err) {
					if (err) {
						reject(err);
					}
					else {
						resolve();
					}
				});
			});
		})
		.then(function() {
			// Create individual files for classes, modules, etc
			return promiseForEach(templateData, function(doclet) {
				if (doclet.memberof) {
					return;
				}

				var template;
				var outputName;

				if (doclet.kind === 'class') {
					template = '{{#class name="' + doclet.name + '"}}{{>docs}}{{/class}}';
					outputName = doclet.name;
				}
				else if (doclet.kind === 'module') {
					template = '{{#module name="' + doclet.name + '"}}{{>docs}}{{/module}}';
					outputName = 'module_' + doclet.name.replace(/\//g, '_');
				}
				else if (doclet.kind === 'typedef') {
					template = '{{#typedef name="' + doclet.name + '"}}{{>docs}}{{/typedef}}';
					outputName = doclet.name;
				}
				else {
					throw new Error('Unsupported orphan doclet kind "' + doclet.kind + '": ' + doclet.name);
				}

				return dmd.async(templateData, Object.assign({}, options, additionalOptions, {
					data: templateData,
					template: template
				}))
					.then(function(output) {
						return new Promise(function(resolve, reject) {
							fs.writeFile(path.join(outputPath, outputName + '.md'), output, function(err) {
								if (err) {
									reject(err);
								}
								else {
									resolve();
								}
							});
						});
					});
			});
		});
}

function getNamepaths(options) {
	return getTemplateData(options)
		.then(function(data) {
			var namepaths = {};
			var kinds = [
				'module', 'class', 'constructor', 'mixin', 'member',
				'namespace', 'constant', 'function', 'event', 'typedef', 'external'
			];
			kinds.forEach(function(kind) {
				namepaths[kind] = data
					.filter(function(identifier) {
						return identifier.kind === kind;
					})
					.map(function(identifier) {
						return identifier.longname;
					});
			});
			return namepaths;
		});
}

function getTemplateData(options) {
	options = options || {};
	return getJsdocData(options)
		.then(jsdocParse);
}

function getJsdocData(options) {
	return jsdocApi.explain(Object.assign({}, options));
}

function promiseForEach(arr, fn) {
	var i = 0;
	arr = arr.slice(0);

	function next() {
		if (i >= arr.length) {
			return Promise.resolve();
		}

		return new Promise(function(resolve) {
			resolve(fn(arr[i], i++));
		}).then(next);
	}

	return next();
}