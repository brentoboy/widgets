var watchr = require('watchr');
var jsph = require('jsph');
var jade = require('jade');
var fs = require('fs');
var path = require('path');
var async = require('async');

FsCache = function(done) {
	var _this = this;
	var wtf = require("./framework.js");
	var existsCache = this.existsCache = {};
	var contentCache = this.contentCache = {};
	var statCache = this.siteCache = {};
	jsph.cache = jsph.cache || {};
	jade.cache = jade.cache || {};

	jsph.renderFileCached = function(filename, paramObject, callback) {
		callback = callback || paramObject;
		if (typeof options == "function") {
			callback = paramObject;
			paramObject = null;
		}

		if(! (filename in  jsph.cache)) {
			_this.readFile(filename, function(err, data) {
				if (data) {
					jsph.cache[filename] = jsph.compile(data);
				}
				else {
					jsph.cache[filename] = null;
				}
				return jsph.renderFileCached(filename, paramObject, callback);
			})
			return;
		}

		var renderTemplate = jsph.cache[filename];
		var result = null;
		if (typeof renderTemplate == "function") {
			result = renderTemplate(paramObject);
		}
		return callback(null, result);
	}

	jade.renderFileCached = function(filename, paramObject, callback) {
		callback = callback || paramObject;
		if (typeof options == "function") {
			callback = paramObject;
			paramObject = null;
		}

		if(! (filename in  jade.cache)) {
			_this.readFile(filename, function(err, data) {
				if (data) {
					jade.cache[filename] = jade.compile(data, paramObject);
				}
				else {
					jade.cache[filename] = null;
				}
				return jade.renderFileCached(filename, paramObject, callback);
			})
			return;
		}

		var renderTemplate = jade.cache[filename];
		var result = null;
		if (typeof renderTemplate == "function") {
			result = renderTemplate(paramObject);
		}
		return callback(null, result);
	}

	this.readFile = function(filename, options, callback) {
		//filename = require.resolve(filename);
		callback = callback || options;
		if (typeof options == "function") {
			callback = options;
			options = null;
		}
		if (filename in contentCache) {
			//console.log("Already Loaded:", filename);
			return callback(null, contentCache[filename]);
		}
		else {
			options = options || "Utf8";
			fs.readFile(filename, options, function(err, data) {
				if (!data) data = null;
				contentCache[filename] = data;
				//console.log("Loaded:", filename);
				return callback(null, contentCache[filename]);
			});
			return;
		}
	}

	this.stat = function(filename, callback) {
		//filename = require.resolve(filename);
		if (filename in statCache) {
			return callback(null, statCache[filename]);
		}
		else {
			fs.stat(filename, function(err, data) {
				if (!data) data = null;
				statCache[filename] = data;
				return callback(null, statCache[filename]);
			});
			return;
		}
	}

	this.exists = function(filename, callback) {
		//filename = require.resolve(filename);
		if(filename in existsCache) {
			return callback(existsCache[filename]);
		}
		else {
			fs.exists(filename, function(data) {
				existsCache[filename] = data || false;
				return callback(existsCache[filename]);
			});
			return;
		}
	}

	var walk = function(dir, done) {
		var results = [];
		fs.readdir(dir, function(err, list) {
			if (err) return done(err);
			var pending = list.length;
			if (!pending) return done(null, results);
			list.forEach(function(element) {
				var file = path.join(dir, element);
				if (element.substr(0,1) == ".") {
					if (!--pending) {
						done(null, results);
					}
				}
				else {
					fs.stat(file, function(err, stat) {
						if (stat && stat.isDirectory()) {
							walk(file, function(err, res) {
								results = results.concat(res);
								if (!--pending) {
									done(null, results);
								}
							});
						}
						else {
							results.push(file);
							if (!--pending) {
								done(null, results);
							}
						}
					});
				}
			});
		});
	};
	var cacheStuff = function(dir, done) {
		walk(dir, function(err, list) {
			async.each(list, function(file, next) {
				var callNext = function() { next() };
				if ((/logic\.js$/i).test(file)) {
					require(file);
					callNext();
				}
				else if ((/script\.js$/i).test(file)) {
					_this.readFile(file, callNext);
				}
				else if ((/\.json$/i).test(file)) {
					_this.readFile(file, callNext);
				}
				else if ((/\.jade$/i).test(file)) {
					_this.readFile(file, callNext);
					//jade.cache[file] = jade.compile(file, {pretty:true}, doNothing);
				}
				else if ((/\.jsph$/i).test(file)) {
					_this.readFile(file, callNext);
					//jsph.cache[file] = jsph.compileFileSync(file);
				}
				else if ((/\.html$/i).test(file)) {
					_this.readFile(file, callNext);
				}
				else if ((/\.less$/i).test(file)) {
					_this.readFile(file, callNext);
				}
				else {
					callNext();
				}
			},
			done);
		})
	}

	//var fileWatchers;
	var startWatchr = function() {
		watchr.watch({
			paths: [wtf.paths.base],
			ignoreHiddenFiles: true,
			ignoreCommonPatterns: true,
			listeners: {
				error: function(err){
					console.log('File Watchr error:', err);
				},
				change: function(changeType,filePath,fileCurrentStat,filePreviousStat){
					switch(changeType) {
						case "update": {
							if (filePath in require.cache) {
								console.log("Reloading", filePath);
								var tmp = require.cache[filePath];
								delete require.cache[filePath];
								try {
									require(filePath);
								}
								catch (err) {
									console.log(colors.redBright("Unable to load new version of " + filePath));
									console.log(err);
									console.log("reverting to previously usable version of file");
									require.cache[filePath] = tmp; // arent you glad we saved this
								}
								if (/\/routes\.js$/.test(filePath)) {
									wtf._loadRoutes();
								}
							}
							if (filePath in contentCache) {
								console.log("Reloading content", filePath);
								try {
									contentCache[filePath] = fs.readFileSync(filePath, "utf8");
								}
								catch (err) {
									console.log(colors.redBright("Unable to load new version of " + filePath));
									console.log(err);
									console.log("reverting to previously usable version of file");
								}
								// Jade Cache
								if (filePath in jade.cache) {
									jade.cache[filePath] = jade.compile(fsCache.contentCache[filePath]);
								}
								//jsph cache
								if (filePath in jsph.cache) {
									jsph.cache[filePath] = jsph.compile(fsCache.contentCache[filePath]);
								}
							}
							if (filePath in statCache) {
								console.log("Reloading stats", filePath);
								try {
									statCache[filePath] = fs.statSync(filePath);
								}
								catch (err) {
									console.log(colors.redBright("Unable to load new version of " + filePath));
									console.log(err);
									console.log("reverting to previously usable version of file");
								}
							}
							break;
						}
						case "create": {
							if (filePath in existsCache) {
								existsCache[filePath] = true;
							}
							if (filePath in jade.cache) {
								delete jade.cache[filePath];
							}
							if (filePath in jsph.cache) {
								delete jsph.cache[filePath];
							}
							break;
						}
						case "delete": {
							if (filePath in existsCache) {
								existsCache[filePath] = false;
							}
							if (filePath in jade.cache) {
								jade.cache[filePath] = null;
							}
							if (filePath in jsph.cache) {
								jsph.cache[filePath] = null;
							}
							break;
						}
					}
				}
			},
			next: function(err, watchers) {
				if (err) {
					console.log("Failed to load Watchr:", err);
				}
				// if we were unloaded before we ever finished loading, then dump it
				// if (fileWatchers == "x") {
				// 	fileWatchers = watchers;
				// 	stopWatch();
				// }
				// else {
				// 	fileWatchers = watchers;
				// }
			}
		});

	}

	// function stopWatchr() {
	// 	if (!fileWatchers) {
	// 		fileWatchers = "x";
	// 	}
	// 	else {
	// 		for (var i in fileWatchers) {
	// 			fileWatchers[i].close();
	// 		}
	// 		fileWatchers = null;
	// 	}
	// }

	if (wtf.options.watchr === undefined || wtf.options.watchr !== false) {
		startWatchr();
	}

	cacheStuff(wtf.options.root, done);
}




module.exports = FsCache;