var fs = require('fs');
var path = require('path');
var urlPatterns = require('url-patterns');
var jsph = require('jsph');
var jade = require('jade');
var async = require('async');
var watchr = require('watchr');
var less = require('less');
var static = require('node-static');
var staticFiles; // = new static.Server(wtf.paths.static, siteConfig.staticOptions)
var urlParser = require('url');
var querystring = require('querystring')
var colors = require('cli-color');

var wtf = {
	createWidget: function(widgetName) {
		return  {
			name: widgetName,
			configs: {},
			errors: [],
			noRender: false,
		};
	},

	init: function(options, done) {
		var paths = {};
		var siteName = options.site;
		var basePath = options.root;
		wtf.options = options;

		if (!basePath) {
			basePath = path.dirname(require.main.filename)
		}

		if (!siteName) {
			siteName = process.argv.length > 2 ? process.argv[2].toString() : "unknown-site"
		}

		paths.base = basePath
		paths.site = path.join(paths.base, 'sites', siteName)
		paths.static = path.join(paths.site, 'static')
		paths.models = path.join(paths.base, 'models')
		paths.actions = path.join(paths.site, 'actions')
		paths.widgets = path.join(paths.base, 'widgets')
		paths.dataSources = path.join(paths.base, 'dataSources')
		paths.wireframes = path.join(paths.site, 'wireframes')
		paths.skins = path.join(paths.site, 'skins')

		paths.model = function(modelName) {
			return path.join(
				paths.models
				, modelName + ((/\.js$/).test(modelName) ? "" : ".js")
			)
		}

		paths.action = function(actionName) {
			return path.join(
				paths.actions
				, actionName
			)
		}

		paths.ux = function(actionName, ux) {
			return path.join(
				paths.actions
				, actionName
				, ux + ".json"
			)
		}

		paths.widget = function(widgetName) {
			return path.join(
				paths.widgets
				, widgetName
			)
		}

		paths.widgetConfig = function(widgetName) {
			return path.join(
				paths.widgets
				, widgetName
				, "config.json"
			)
		}

		paths.widgetLogic = function(widgetName) {
			return path.join(
				paths.widgets
				, widgetName
				, "logic.js"
			)
		}

		paths.widgetStaticHtml = function(widgetName) {
			return path.join(
				paths.widgets
				, widgetName
				, "view.html"
			)
		}

		paths.widgetJsph = function(widgetName) {
			return path.join(
				paths.widgets
				, widgetName
				, "view.jsph"
			)
		}

		paths.widgetJade = function(widgetName) {
			return path.join(
				paths.widgets
				, widgetName
				, "view.jade"
			)
		}

		paths.widgetLess = function(widgetName, skin) {
			return path.join(
				paths.widgets
				, widgetName
				, "skin" + (skin && skin != 'default' ? "." + skin : "") + ".less"
			)
		}

		paths.widgetScript = function(widgetName) {
			return path.join(
				paths.widgets
				, widgetName
				, "script.js"
			)
		}

		paths.wireframeJade = function(wireframeName) {
			return path.join(
				paths.wireframes
				, wireframeName + ".jade"
			)
		}

		paths.wireframeJsph = function(wireframeName) {
			return path.join(
				paths.wireframes
				, wireframeName + ".jsph"
			)
		}

		paths.dataSource = function (dataSourceName) {
			return path.join(
				paths.dataSources
				, dataSourceName + ((/\.js$/).test(dataSourceName) ? "" : ".js")
			)
		}

		paths.cssSkinFolder = function(theme) {
			return path.join(
				paths.skins
				, theme)
		}

		wtf.paths = paths;
		wtf.loadRoutes();

		staticFiles = new static.Server(wtf.paths.static, options.staticOptions)

		if (options.watchr === undefined || options.watchr !== false) {
			startWatchr();
		}

		wtf.fsCache.init(done);
	},
	loadRoutes: function() {
		var routePath = path.join(wtf.paths.site, "routes.js");
		var routes = require(routePath);

		if (!routes.cssRoute) {
			routes.cssRoute = {
				pattern: "/css/(string:ux).css",
				action: "_css",
			}
		}
		if (!routes.jsRoute) {
			routes.jsRoute = {
				pattern: "/js/(string:ux).js",
				action: "_js",
			}
		}

		for(routeKey in routes) {
			var route = routes[routeKey]

			// if they defined a pattern instead of a regex, make a regex out of it
			if (route.pattern && !route.regex) {
				route.regex = urlPatterns.createRegex(route.pattern)
			}

			// if a route has no getUrl function create one for it
			if (route.pattern && !route.getUrl) {
				route.getUrl = urlPatterns.createBuilder(route.pattern)
			}

			if (route.pattern && !route.scrape) {
				route.scrape = urlPatterns.createScraper(route.pattern)
			}
		}

		if (!routes._404) {
			routes._404 = {
				regex: null,
				action: "404",
				getUrl: function() {},
				scrape: function() {},
			}
		}

		wtf.routes = routes;
		return wtf.routes;
	},

	fsCache: {
		init: function(done) {
			wtf.fsCache.existsCache = {};
			wtf.fsCache.contentCache = {};
			wtf.fsCache.statCache = {};
			cacheStuff(wtf.options.root, done);
		},
		readFile: function(filename, options, callback) {
			//filename = require.resolve(filename);
			callback = callback || options;
			if (typeof options == "function") {
				callback = options;
				options = null;
			}
			if (filename in wtf.fsCache.contentCache) {
				//console.log("Already Loaded:", filename);
				return callback(null, wtf.fsCache.contentCache[filename]);
			}
			else {
				options = options || "Utf8";
				fs.readFile(filename, options, function(err, data) {
					if (!data) data = null;
					wtf.fsCache.contentCache[filename] = data;
					//console.log("Loaded:", filename);
					return callback(null, wtf.fsCache.contentCache[filename]);
				});
				return;
			}
		},
		stat: function(filename, callback) {
			//filename = require.resolve(filename);
			if (filename in wtf.fsCache.statCache) {
				return callback(null, wtf.fsCache.statCache[filename]);
			}
			else {
				fs.stat(filename, function(err, data) {
					if (!data) data = null;
					wtf.fsCache.statCache[filename] = data;
					return callback(null, wtf.fsCache.statCache[filename]);
				});
				return;
			}
		},
		exists: function(filename, callback) {
			//filename = require.resolve(filename);
			if(filename in wtf.fsCache.existsCache) {
				return callback(wtf.fsCache.existsCache[filename]);
			}
			else {
				fs.exists(filename, function(data) {
					wtf.fsCache.existsCache[filename] = data || false;
					return callback(wtf.fsCache.existsCache[filename]);
				});
				return;
			}
		},
	},

	findRoute: function(requestedPath) {
		requestedPath = '' + requestedPath;
		for (routeKey in wtf.routes) {
			if (wtf.routes[routeKey].regex
				&& requestedPath.match(wtf.routes[routeKey].regex))
			{
				return wtf.routes[routeKey];
			}
		}
		return wtf.routes._404;
	},

	// responder: function(request, response, next) {
	// 	var context = wtf.newContext();
	// 	staticFiles.serve(request, response, function(err, result) {
	// 		// error means there was no static file to serve up
	// 		if (err) {
	// 			context.session = request.session;
	// 			//console.log(context.session.uid())  this is your session id

	// 			var parsedUrl = urlParser.parse(request.url, true);
	// 			context.requestPath = parsedUrl.pathname;
	// 			context.requestParams = parsedUrl.query;
	// 			if (!context.requestParams) {
	// 				context.requestParams = {};
	// 			}

	// 			context.route = wtf.findRoute(context.requestPath);

	// 			if (!context.route || !context.route.action) {
	// 				//return error404(context, response, "no route found for " + request.url)
	// 				return next();
	// 			}
	// 			context.action = context.route.action;

	// 			// add pretty params
	// 			var prettyParams = context.route.scrape(context.requestPath)
	// 			for(key in prettyParams) {
	// 				context.requestParams[key] = prettyParams[key];
	// 			}

	// 			var postParams = request.body;
	// 			if (postParams) {
	// 				for (key in postParams) {
	// 					context.requestParams[key] = postParams[key];
	// 				}
	// 			}

	// 			context.ux = context.requestParams['ux'] || 'default';

	// 			wtf.planResponse(context, function(err) {
	// 				if (err) {
	// 					console.log("Error planning Response:", err);
	// 					return next();
	// 				}
	// 				wtf.buildResponse(context, function(err) {
	// 					if (!context.responseStatusCode) {
	// 						context.responseStatusCode = 200;
	// 					}
	// 					if (!context.responseStatusReason) {
	// 						context.responseStatusReason = "OK";
	// 					}
	// 					if (typeof context.responseBody != "string") {
	// 						context.responseBody = "" + context.responseBody;
	// 					}
	// 					if (!context.responseheaders) {
	// 						context.responseHeaders = {
	// 							"Content-Type": "text/html",
	// 							'Content-Length': context.responseBody.length,
	// 							"Cache-Control": "max-age=0",
	// 						};
	// 					}

	// 					// send the response
	// 					context.ttfb = process.hrtime(context.startedAt)
	// 					console.log("status", context.responseStatusCode);
	// 					console.log("reason", context.responseStatusReason);
	// 					console.log("headers", context.responseHeaders);
	// 					response.writeHead(context.responseStatusCode, context.responseStatusReason, context.responseHeaders);
	// 					response.end(context.responseBody);
	// 					context.ttlb = process.hrtime(context.startedAt);

	// 					// print out a report of how we did
	// 					context.ttfb = Math.round((context.ttfb[0] * 1000) + (context.ttfb[1] / 1000000));
	// 					context.ttlb = Math.round((context.ttlb[0] * 1000) + (context.ttlb[1] / 1000000));
	// 					console.log("action: %s \tttfb: %d\tttlb: %d", context.route.action, context.ttfb, context.ttlb);
	// 				})
	// 			})
	// 		}
	// 	})
	// },

	buildJsFileUrl: function(request) {
		if (!request.requiredScripts) {
			request.requiredScripts = [];
			for (var i in request.widgets) {
				var widget = request.widgets[i];
				for (var j in widget.scripts) {
					request.requiredScripts[widget.scripts[j].widget] = widget.scripts[j];
				}
			}
		}

		var list = []
		var max = 0;
		for(var i in request.requiredScripts) {
			var widgetName = request.requiredScripts[i].widget;
			if (list.indexOf(widgetName) == -1) {
				list[list.length] = widgetName;
				max = Math.max(max, request.requiredScripts[i].time);
			}
		}

		if (!list.length) {
			return null;
		}

		var bigOleString = JSON.stringify(list);
		bigOleString = (new Buffer(bigOleString)).toString('base64');
		return wtf.routes.jsRoute.getUrl({ ux: bigOleString }) + "?ver=" + max;
		//return "/js/" + encodeURIComponent(bigOleString) + ".js?ver=" + max;
	},

	buildCssFileUrl: function(request) {
		if(!request.requiredStyles) {
			request.requiredStyles = [];
			for (var i in request.widgets) {
				var widget = request.widgets[i];
				for (var j in widget.styles) {
					request.requiredStyles[widget.styles[j].widget] = widget.styles[j];
				}
			}
		}
		var max = 0;
		var list = {
			t: request.skin || "default",
			w: [],
		}
		for (var i in request.requiredStyles) {
			var widgetName = request.requiredStyles[i].widget;
			if (list.w.indexOf(widgetName) == -1) {
				list.w[list.w.length] = widgetName;
				max = Math.max(max, request.requiredStyles[i].time);
			}
		}
		var bigOleString = JSON.stringify(list);
		bigOleString = (new Buffer(bigOleString)).toString('base64');
		return wtf.routes.cssRoute.getUrl({ ux: bigOleString }) + "?ver=" + max;
		//return "/css/" + encodeURIComponent(bigOleString) + ".css?ver=" + max;
	},

	// extractJsListFromUrl: function(request) {
	// 	return JSON.parse(new Buffer(decodeURIComponent(request.ux), "base64"));
	// },

	// extractCssListFromUrl: function(request) {
	// 	return JSON.parse(new Buffer(decodeURIComponent(request.ux), "base64"));
	// },

	// planResponse: function(context, callback) {
	// 	if (!context.ux || context.ux == -1) {
	// 		context.ux = "default";
	// 	}

	// 	context.action = context.action || context.route.action;
	// 	switch(context.action) {
	// 		case "_css": { // special route for dynamic css
	// 			cssList = wtf.extractCssListFromUrl(context);
	// 			context.responseType = "css";
	// 			context.skin = cssList.t; //t is short for theme
	// 			context.requiredStyles = cssList.w; //w is short for widgets
	// 			return callback();
	// 		}
	// 		case "_js": { // special action for dynamic scripts
	// 			jsList = wtf.extractJsListFromUrl(context);
	// 			context.responseType = "js";
	// 			context.requiredScripts = jsList;
	// 			return callback();
	// 		}
	// 		default: { // assume actions in site/action folder
	// 			var updateContext = function(uxJson) {
	// 				var uxConfigs = null;
	// 				try {
	// 					uxConfigs = eval("(" + uxJson + ")");
	// 				}
	// 				catch (err) {
	// 					return callback(err);
	// 				}
	// 				if (!uxConfigs) uxConfigs = {};
	// 				context.responseType = uxConfigs.type ? uxConfigs.type : "html";
	// 				context.wireframe = uxConfigs.wireframe ? uxConfigs.wireframe : "default";
	// 				context.widgetBlocks = uxConfigs.widgetBlocks ? uxConfigs.widgetBlocks : {};
	// 				context.skin = uxConfigs.skin ? uxConfigs.sking : "default";
	// 				context.responseHeaders = uxConfigs.httpHeaders ? uxConfigs.httpHeaders : null;
	// 				context.pageTitle = uxConfigs.title ? uxConfigs.title : "";
	// 				return callback();
	// 			}

	// 			var uxFile = wtf.paths.ux(context.action, context.ux);
	// 			var defaultUxFile = wtf.paths.ux(context.action);
	// 			wtf.fsCache.readFile(uxFile, "utf8", function(err, fileContents) {
	// 				if (err && err.code == 'ENOENT') {
	// 					wtf.fsCache.readFile(defaultUxFile, "utf8", function(err, fileContents) {
	// 						if (err && err.code == 'ENOENT') {
	// 							updateContext("{}");
	// 						}
	// 						else if (err) {
	// 							callback(err);
	// 						}
	// 						else {
	// 							return updateContext(fileContents);
	// 						}
	// 					})
	// 				}
	// 				else if(err) {
	// 					return callback(err);
	// 				}
	// 				else {
	// 					return updateContext(fileContents);
	// 				}
	// 			})
	// 		}
	// 	}
	// },

	// buildResponse: function(context, callback) {
	// 	switch (context.responseType)
	// 	{
	// 		case 'js': return wtf.buildJsResponse(context, callback);
	// 		case 'css': return wtf.buildCssResponse(context, callback);
	// 		case 'html': return wtf.buildHtmlResponse(context, callback);
	// 		default: return callback("unrecognized response type: '" + context.responseType + "'");
	// 	}
	// },

	// buildJsResponse: function(request, callback) {
	// 	// planResponse already put the list of requested scripts in request.requiredScripts
	// 	var loadScripts = [];

	// 	// make a list of functions to load the scripts
	// 	for (widgetName in request.requiredScripts) {
	// 		loadScripts[loadScripts.length] = (function(widget) {
	// 			return function(cb) {
	// 				var scriptPath = wtf.paths.widgetScript(widget);
	// 				wtf.fsCache.readFile(scriptPath, "utf8" ,function(err, data) {
	// 					if (err) {
	// 						console.log(err);
	// 					}
	// 					return cb(null, data);
	// 				})
	// 			}
	// 		})(request.requiredScripts[widgetName]);
	// 	}

	// 	// load the scripts in parallel
	// 	async.parallel(loadScripts, function(err, results) {
	// 		// TODO: are there any headers we need to set?

	// 		// assemble all of the scripts into one script as the response body
	// 		if (results) {
	// 			request.responseBody = results.join("\n\n");
	// 		}
	// 		else {
	// 			request.responseBody = err;
	// 		}

	// 		// stick it all on the request and return
	// 		return callback();
	// 	})
	// },

	// buildCssResponse: function(request, callback) {
	// },

	// buildHtmlResponse: function(context, callback) {
	// 	var loadWidgets = {};
	// 	var renderWidgets = {};

	// 	for (var blockIndex in context.widgetBlocks) {
	// 		var block = context.widgetBlocks[blockIndex];
	// 		for (var widgetIndex in block) {
	// 			var widgetConfigs = block[widgetIndex];
	// 			var newWidget = wtf.newWidget(widgetConfigs.widget);

	// 			if (!widgetConfigs.id) {
	// 				widgetConfigs.id = blockIndex + "-" + widgetIndex;
	// 			}
	// 			newWidget.id = widgetConfigs.id;
	// 			newWidget.uxConfigs = widgetConfigs.configs;

	// 			loadWidgets[newWidget.id] = [];
	// 			renderWidgets[newWidget.id] = [];

	// 			if (widgetConfigs.runAfter) {
	// 				newWidget.runAfter = widgetConfigs.runAfter;
	// 				loadWidgets[newWidget.id].push(widgetConfigs.runAfter);
	// 			}

	// 			context.widgets[newWidget.id] = newWidget;

	// 			loadWidgets[widgetConfigs.id].push(
	// 				(function(widget) {
	// 					return function(cb) {
	// 						wtf.prepareWidget(widget, cb);
	// 					}
	// 				})(newWidget)
	// 			);
	// 			renderWidgets[widgetConfigs.id].push(
	// 				(function(widget) {
	// 					return function(cb) {
	// 						wtf.render(widget, cb);
	// 					}
	// 				})(newWidget)
	// 			);
	// 		}
	// 	}

	// 	async.auto(loadWidgets, function(err) {
	// 		async.auto(renderWidgets, function(err) {
	// 			context.cssFileUrl = wtf.buildCssFileUrl(context);
	// 			context.jsFileUrl = wtf.buildJsFileUrl(context);

	// 			var jsphWireframe = wtf.paths.wireframeJsph(context.wireframe);
	// 			var jadeWireframe = wtf.paths.wireframeJade(context.wireframe);

	// 			// response Code...  how does it get determined
	// 			context.responseStatusCode = context.responseStatusCode || 200;
	// 			context.responseType = context.responseType || 'text/html';

	// 			jsph.renderFile(jsphWireframe, context, function(err, html) {
	// 				if (!err && html) {
	// 					context.responseBody = html
	// 					return callback(null, context);
	// 				}

	// 				context.pretty = true;
	// 				jade.renderFile(jadeWireframe, context, function(err, html) {
	// 					context.responseBody = html
	// 					return callback(err, context);
	// 				})
	// 			})

	// 		})
	// 	})
	// },

	loadWidgetConfig: function(widgetName, callback) {
		if (!widgetName) {
			return callback("Widget Not Found 'undefined'");
		}

		var config;

		var emptyConfig = {
			name: widgetName,
			configs: [],
			requires: [],
		};

		var widgetConfigPath = wtf.paths.widgetConfig(widgetName);

		wtf.fsCache.readFile(widgetConfigPath, "utf8", function(err, fileContent) {
			if (!fileContent) {
				wtf.fsCache.exists(wtf.paths.widget(widgetName), function(widgetFolderExists) {
					if (!widgetFolderExists) {
					// folder not found, complain about non existant widget
						return callback("Widget Not Found '" + widgetName + "'");
					}
					else {
					// file not found -> create minimalistic stub
						return callback(null, config || emptyConfig);
					}
				})
				return;
			}
			else {
				try {
					config = eval("(" + fileContent + ")") || emptyConfig;
				}
				catch (err) {
					return callback(err, config || emptyConfig);
				}
			}

			// TODO:  should we complain if the config tried to change this?
			config.name = widgetName;

			// add defaults for missing fields
			if (!config.configs) {
				config.configs = [];
			}
			if (!config.requires) {
				config.requires = [];
			}

			// TODO:  what other fields are there?
			return callback(null, config || emptyConfig);
		})
	},

	mergeConfigs: function(defaultConfigs, uxConfigs, requestParams) {
		if (!defaultConfigs) defaultConfigs = [];
		if (!uxConfigs) uxConfigs = {};
		if (!requestParams) requestParams = {};
		if (typeof defaultConfigs != "object") throw "invalid value for defaultConfigs";
		if (typeof uxConfigs != "object") throw "invalid value for uxConfigs";
		if (typeof requestParams != "object") throw "invalid value for requestParams";

		var configs = {};

		// get the defaults out of the widget config file
		for (var i in defaultConfigs) {
			if (defaultConfigs[i].default === undefined) {
				configs[defaultConfigs[i].name] = null;
			}
			else {
				configs[defaultConfigs[i].name] = defaultConfigs[i].default;
			}
		}

		// override the existing values based on the configs defined in the action/ux file
		for (key in uxConfigs) {
			if (key in configs) {
				configs[key] = uxConfigs[key];
			}
			//else { // this should be logged as a warning, not an error
			//	throw "uxConfigs contains a value for '" + key + "' which is not in the widget's config options.";
			//}
		}

		// clone the GET params
		for (key in requestParams) {
			if (key in configs) {
				configs[key] = requestParams[key];
			}
		}
		return configs;
	},

	runLogic: function(widget, callback) {
		var logicFile = wtf.paths.widgetLogic(widget.name)
		wtf.fsCache.exists(logicFile, function(logicFileExists) {
			if (logicFileExists) {
				try {
					var widgetLogic = require(logicFile)
					widgetLogic.prepare(widget, function() {
						return callback(null, widget)
					})
				}
				catch (err) {
					widget.errors.push(err)
					return callback(err, widget)
				}
			}
			else {
				return callback(null, widget)
			}
		})
	},

	render: function(widget, callback) {
		if (widget.noRender) {
			widget.html = "";
			return callback(null, widget);
		}

		var jsphFile = wtf.paths.widgetJsph(widget.name);
		wtf.fsCache.exists(jsphFile, function(jsphFileExists) {
			if (jsphFileExists) {
				jsph.renderFileCached(jsphFile, widget.configs, function(err, html) {
					if (err) {
						widget.errors.push(err);
					}
					widget.html = html;
					return callback(err, widget);
				})
			}
			else {
				var jadeFile = wtf.paths.widgetJade(widget.name)
				wtf.fsCache.exists(jadeFile, function(jadeFileExists) {
					if (jadeFileExists) {
						widget.configs.pretty = true
						jade.renderFileCached(jadeFile, widget.configs, function(err, html) {
							if (err) {
								widget.errors.push(err)
							}
							widget.html = html
							return callback(null, widget)
						})
					}
					else {
						var htmlFile = wtf.paths.widgetStaticHtml(widget.name)
						wtf.fsCache.exists(htmlFile, function(htmlFileExists) {
							if (htmlFileExists) {
								wtf.fsCache.readFile(htmlFile, "utf8", function(err, html) {
									if (err) {
										widget.errors.push(err)
									}
									widget.html = html
									return callback(null, widget)
								})
							}
							else {
								widget.html = ""
								return callback(null, widget)
							}
						})
					}
				})
			}
		})
	},

	findScripts: function(widget, callback) {
		widget.scripts = [];


		if (widget.noRender) {
			return callback(null, widget)
		}

		// surf the dependency tree
		var addWidget = function(widgetName, cb) {
			widget.scripts.push(widgetName)
			wtf.loadWidgetConfig(widgetName, function(err, config) {
				if (err) {
					console.log(err);
					return cb(err);
				}
				if (config.requires.length) {
					for(var i = 0; i < config.requires.length; i++) {
						addWidget(config.requires[i], cb)
					}
				}
				return cb(null)
			})
		}

		var scriptExists = function(widgetName, cb) {
			wtf.fsCache.exists(wtf.paths.widgetScript(widgetName), function(fileExists) {
				return cb(fileExists);
			})
		}

		var count = 0;
		addWidget(widget.name, function(err) {
			count++;

			// when count = length, we have surfed to the end of the tree
			if (count == widget.scripts.length) {
				async.map(widget.scripts, function(x, cb) {
					var scriptjs = wtf.paths.widgetScript(x);
					wtf.fsCache.stat(scriptjs, function(err, stats) {
						if (err || !stats) {
							return cb(null, 0);
						}
						else {
							return cb(null, { widget: x, time: stats.mtime.getTime() });
						}
					})
				}, function(err, results) {
					if (err) {
						widget.errors.push(err);
						widget.scripts = [];
						return callback();
					}
					else {
						widget.scripts = results.filter(function(x) {
							return x != 0;
						});
						widget.scripts.reverse();
						return callback();
					}
				})
			}
		})
	},

	findStyles: function(widget, callback) {
		widget.styles = [];
		if (widget.noRender) {
			return callback(null, widget);
		}

		var skinLess = wtf.paths.widgetLess(widget.name, widget.skin);
		var defaultLess = wtf.paths.widgetLess(widget.name);

		wtf.fsCache.stat(skinLess, function(err, stats) {
			if (stats) {
				widget.styles.push({ widget: widget.name , time: stats.mtime.getTime() });
				return callback();
			}
			//else
			wtf.fsCache.stat(defaultLess, function(err, stats) {
				if (stats) {
					widget.styles.push({ widget: widget.name , time: stats.mtime.getTime() });
				}
				return callback();
			})
		})
	},

	loadScript: function(widgetName, callback) {
		var scriptName = wtf.paths.widgetScript(widgetName)
		return wtf.fsCache.readFile(scriptName, "utf8", callback);
	},

	loadStyle: function(widgetName, skin, callback) {
		var styleFiles = [
			wtf.paths.widgetLess(widgetName, skin),
			wtf.paths.widgetLess(widgetName),
		]

		async.detectSeries(styleFiles, wtf.fsCache.exists, function(foundFile) {
			if (foundFile) {
				return wtf.fsCache.readFile(foundFile, "utf8", callback)
			}
			else {
				return callback("Style '" + skin + "' not found for widget '" + widgetName + "'", "")
			}
		})
	},

	prepareWidget: function(widget, reqParams, callback) {
		wtf.loadWidgetConfig(widget.name, function (err, config) {
			if (err) {
				widget.noRender = true;
				widget.errors.push(err);
				console.log(err);
				return callback();
			}

			widget.configs = wtf.mergeConfigs(config.configs, widget.uxConfigs, reqParams);
			wtf.runLogic(widget, function(err) {
				if (err) console.log(err);
				wtf.findStyles(widget, function(err) {
					if (err) console.log(err);
					wtf.findScripts(widget, function(err) {
						if (err) console.log(err);
						callback(null);
					})
				})
				// async.parallel([s
				// 	function(cb) { findStyles(context, widget, cb) },
				// 	function(cb) { findScripts(context, widget, cb) },
				// 	function(cb) { render(context, widget, cb) },
				// ], callback(err))
			})
		})
	},


	initLogs: function(request, response, next) {
		request.startedAt = process.hrtime();
		request.logs = [];
		request.logError = function(message) {
			// gimme some stack trace goodness
			try{ throw new Error("boom!"); }
			catch(e) {
				var stack = e.stack.match(/[^\r\n]+/g).slice(2,6);
				message += "\n" + stack.join("\n");
			}
			request.logs.push({
				type: "error",
				message: message,
				time: process.hrtime(),
			})
		}
		request.logWarning = function(message) {
			// gimme some stack trace goodness
			try{ throw new Error("boom!"); }
			catch(e) {
				var stack = e.stack.match(/[^\r\n]+/g).slice(2,5);
				message += "\n" + stack.join("\n");
			}
			request.logs.push({
				type: "warning",
				message: message,
				time: process.hrtime(),
			})
		}
		request.logInfo = function(message) {
			request.logs.push({
				type: "info",
				message: message,
				time: process.hrtime(),
			})
		}
		request.startTimer = function(name, message) {
			request.logs.push({
				timerName: name,
				type: "timer",
				message: message,
				time: process.hrtime(),
				endTime: null,
			})
		}
		request.endTimer = function(name) {
			var matchingTimer = request.logs.filter(function(x) { return x.timerName == name });
			if (matchingTimer && matchingTimer[0]) {
				matchingTimer[0].endTime = process.hrtime();
			}
			else {
				request.logError("Attempt was made to end timer named '" + name + "', which was never started");
			}
		}
		request.getErrors = function() {
			return request.logs.filter(function(x) { return x.type == "error" });
		}
		request.getWarnings = function() {
			return request.logs.filter(function(x) { return x.type == "warning" });
		}
		request.getInfos = function() {
			return request.logs.filter(function(x) { return x.type == "info" });
		}
		request.getTimers = function() {
			return request.logs.filter(function(x) { return x.type == "timer" });
		}
		request.onTimeout = setTimeout(function(){
			request.timedOut = true;
			request.logError("request timed out");
			wtf.logRequest(request, response, function(){})
		}, /* wtf.maxRequestMs || */ 5000);
		request.clearTimeout = function() {
			if (request.onTimeout) {
				clearTimeout(request.onTimeout);
				request.onTimeout = null;
			}
		}
		return next();
	},
	// cookies
	// session
	// auth
	// static-files
	chooseRoute: function(request, response, next) {
		request.logInfo("chooseRoute");
		request.path = urlParser.parse(request.url || '', true).pathname;
		request.route = wtf.findRoute(request.path);
		if (request.route == wtf.routes._404) {
			request.logInfo("no route found for query '" + request.path + "'")
		}
		return next();
	},

	extractParams: function(request, response, next) {
		request.logInfo("extractParams");
		var parsedUrl = urlParser.parse(request.url, true);
		// start with pretty pars
		request.params = (request.route)
			? request.route.scrape(parsedUrl.pathname)
			: {};
		// then apply "get" params
		for(key in parsedUrl.query) {
			request.params[key] = parsedUrl.query[key];
		}
		// then apply "post" params
		// NOTE ... this expects some other middleware to have set up "request.body"
		if (request.method == "POST" && request.body) {
			var post = querystring.parse(request.body);
			for (key in post) {
				request.params[key] = post[key];
			}
		}

		return next();
	},

	dynamicCss: function(request, response, next) {
		request.logInfo("dynamicCss");
		if (!request.action && request.route) {
			request.action = request.route.action;
		}
		if (request.action != "_css") {
			return next();
		}

		var styleInfo = JSON.parse(new Buffer(decodeURIComponent(request.ux), "base64"));
		request.skin = styleInfo.t; // "t" was for "theme"
		request.requiredStyles = styleInfo.w; //w is short for widgets
		request.responseHeaders['Content-Type'] = "text/css";

		var defaultSkin = wtf.paths.cssSkinFolder("default");
		var themedSkin = wtf.paths.cssSkinFolder(request.skin);
		var loadFiles = [];
		fs.readdir(defaultSkin, function(err, files) {
			if (err) {
				request.logError(err);
				return next();
			}
			fs.readdir(themedSkin, function(err, themedFiles) {
				if (themedFiles && files) {
					for(var i in themedFiles) {
						if (files.indexOf(themedFiles[i]) == -1) {
							files.push(themedFiles[i]);
						}
					}
				}
				files.sort();
				for (i in files) {
					loadFiles[loadFiles.length] = (function(file) {
						return function(cb) {
							var themedFile = path.join(themedSkin, file);
							var defaultFile = path.join(defaultSkin, file);
							wtf.fsCache.readFile(themedFile, "utf8", function(err, data) {
								if (data !== null) {
									return cb(null, data);
								}
								wtf.fsCache.readFile(defaultFile, "utf8", function(err, data) {
									return cb(null, data);
								})
							})
						}
					})(files[i]);
				}
				for (i in request.requiredStyles) {
					loadFiles[loadFiles.length] = (function(widgetName) {
						return function(cb) {
							var defaultLess = wtf.paths.widgetLess(widgetName);
							var skinLess = wtf.paths.widgetLess(widgetName, request.skin);
							wtf.fsCache.readFile(skinLess, "utf8", function(err, data) {
								if (data !== null) {
									return cb(null, data);
								}
								wtf.fsCache.readFile(defaultLess, "utf8", function(err,data) {
									return cb(null, data);
								})
							})
						}
					})(request.requiredStyles[i]);
				}
				// load the contents of all of those files
				async.parallel(loadFiles, function(err, results) {
					// TODO: are there any headers we need to set?
					// assemble all of the scripts into one script as the response body
					if (results) {
						var lessData = results.join("\n\n");
						less.render(lessData, function(err, compiledCss) {
							request.responseBody = compiledCss;
							return next();
						})
					}
					else {
						request.responseBody = err;
						request.logError(err);
						return next();
					}
				})
			})
		})
	},

	dynamicJs: function(request, response, next) {
		request.logInfo("dynamicJs");
		if (!request.action && request.route) {
			request.action = request.route.action;
		}
		if (request.action != "_js") {
			return next();
		}

		request.requiredScripts = JSON.parse(new Buffer(decodeURIComponent(request.ux), "base64"));
		for(var i in request.requiredScripts) {
			request.logInfo("\t" + request.requiredScripts[i]);
		}
		var loadScripts = [];

		// make a list of functions to load the scripts
		for (widgetName in request.requiredScripts) {
			loadScripts[loadScripts.length] = (function(widget) {
				return function(cb) {
					var scriptPath = wtf.paths.widgetScript(widget);
					wtf.fsCache.readFile(scriptPath, "utf8" ,function(err, data) {
						if (err) {
							request.logError(err);
						}
						return cb(null, data);
					})
				}
			})(request.requiredScripts[widgetName]);
		}

		// load the scripts in parallel
		async.parallel(loadScripts, function(err, results) {
			// TODO: are there any headers we need to set?
			request.responseHeaders['Content-Type'] = "application/javascript";
			// assemble all of the scripts into one script as the response body
			if (results) {
				request.responseBody = results.join("\n\n");
			}
			else {
				if (err) {
					request.logError(err);
				}
				request.responseBody = err;
			}

			// stick it all on the request and return
			return next();
		})
	},

	chooseActionUx: function(request, response, next) {
		request.logInfo("chooseActionUx");
		switch(request.action) {
			case "_css":  // special route for dynamic css
			case "_js":   // special action for dynamic scripts
				return next();
		}

		if (!request.action && !request.route) {
			request.logError("Unable to run rules, request.action not set, and request.route not available as fallback.");
			request.route = wtf.routes._404;
		}
		request.action = request.action || request.route.action;
		request.ux = request.ux || (request.params?request.params.ux:"default") || "default";
		return next();

		// TODO: should actually run rules
	},

	prepareResponse: function(request, response, next) {
		request.logInfo("prepareResponse");
		// dont even do this function for the special routes
		switch(request.action) {
			case "_css":  // special route for dynamic css
			case "_js":   // special action for dynamic scripts
				return next();
		}

		var uxJson;
		var loadWidgets = {};
		var renderWidgets = {};

		async.series([
			// load the action/ux config file
			function(done) {
				request.logInfo("load Action/Ux config");
				var uxFile = wtf.paths.ux(request.action, request.ux);
				var defaultUxFile = wtf.paths.ux(request.action);
				wtf.fsCache.readFile(uxFile, "utf8", function(err, data) {
					if (err) { request.logError(err); }
					if (data) {
						uxJson = data;
						return done();
					}
					wtf.fsCache.readFile(defaultUxFile, "utf8", function(err, data) {
						if (err) { request.logError(err); }
						uxJson = data;
						return done();
					})
				})
			},

			// copy details of action/ux to request object
			function(done) {
				request.logInfo("copy details to request");
				var uxConfigs = null;
				if (uxJson) {
					try {
						uxConfigs = eval("(" + uxJson + ")");
					}
					catch (err) {
						request.logError(err);
					}
				}
				if (!uxConfigs) uxConfigs = {};
				request.wireframe = uxConfigs.wireframe ? uxConfigs.wireframe : "default";
				request.pageTitle = uxConfigs.title ? uxConfigs.title : "";
				request.skin = uxConfigs.skin ? uxConfigs.skin : "default";
				request.widgetBlocks = uxConfigs.widgetBlocks ? uxConfigs.widgetBlocks : {};
				request.widgets = {};
				return done();
			},

			// create the widgets, and create functions that will prepare each one
			function(done) {
				request.logInfo("create widgets");
				for (var blockIndex in request.widgetBlocks) {
					var block = request.widgetBlocks[blockIndex];
					for (var widgetIndex in block) {
						var widgetConfigs = block[widgetIndex];
						var newWidget = wtf.createWidget(widgetConfigs.widget);

						if (!widgetConfigs.id) {
							widgetConfigs.id = blockIndex + "-" + widgetIndex;
						}
						newWidget.id = widgetConfigs.id;
						newWidget.uxConfigs = widgetConfigs.configs;
						newWidget.skin = widgetConfigs.skin || request.skin || "default";

						loadWidgets[newWidget.id] = [];
						renderWidgets[newWidget.id] = [];

						if (widgetConfigs.runAfter) {
							newWidget.runAfter = widgetConfigs.runAfter;
							loadWidgets[newWidget.id].push(widgetConfigs.runAfter);
						}

						request.widgets[newWidget.id] = newWidget;

						loadWidgets[widgetConfigs.id].push(
							(function(widget) {
								return function(cb) {
									wtf.prepareWidget(widget, request.params, cb);
								}
							})(newWidget)
						);
						renderWidgets[widgetConfigs.id].push(
							(function(widget) {
								return function(cb) {
									wtf.render(widget, cb);
								}
							})(newWidget)
						);
					}
				}
				return done();
			},

			// actually load them up now
			function(done) {
				request.logInfo("load widgets");
				async.auto(loadWidgets, done);
			},

			// render them all
			function(done) {
				request.logInfo("render Widgets")
				async.auto(renderWidgets, done);
			},

			// render the page itself
			function(done) {
				request.logInfo("render Wireframe");
				request.cssFileUrl = wtf.buildCssFileUrl(request);
				request.jsFileUrl = wtf.buildJsFileUrl(request);

				var jsphWireframe = wtf.paths.wireframeJsph(request.wireframe);
				var jadeWireframe = wtf.paths.wireframeJade(request.wireframe);

				// response Code...  how does it get determined
				request.responseStatusCode = request.responseStatusCode || 200;
				request.responseType = request.responseType || 'text/html';

				jsph.renderFileCached(jsphWireframe, request, function(err, html) {
					if (err) { request.logError(err); }
					if (!err && html) {
						request.responseBody = html
						return done();
					}

					request.pretty = true;
					jade.renderFileCached(jadeWireframe, request, function(err, html) {
						if (err) { request.logError(err); }
						request.responseBody = html
						return done();
					})
				})
			},

			function(done) {
				request.logInfo("done building response");
				next();
				return done();
			}
		])
	},

	sendResponse: function(request, response, next) {
		request.logInfo("sendResponse - start");
		request.responseStatusCode = request.responseStatusCode || 200;
		request.responseHeaders = request.responseHeaders || {};
		request.responseHeaders['Content-Type'] = request.responseHeaders['Content-Type'] || 'text/html';
		request.responseHeaders['Cache-Control'] = request.responseHeaders['Cache-Control'] || 'max-age=0'
		//response.sendDate = true;
		request.ttfb = process.hrtime(request.startedAt);
		response.writeHead(request.responseStatusCode, request.responseHeaders);
		response.write(request.responseBody || "");
		request.ttlb = process.hrtime(request.startedAt);
		//convert timestamp to ms
		request.ttfb = +Math.round((request.ttfb[0] * 1000) + (request.ttfb[1] / 1000000));
		request.ttlb = +Math.round((request.ttlb[0] * 1000) + (request.ttlb[1] / 1000000));
		response.end();
		return next();
	},

	logRequest: function(request, response, next) {
		request.logInfo("logRequest");
		request.clearTimeout();
		if (wtf.options && wtf.options.logToConsole) {
			console.log();
			console.log(colors.whiteBright(request.method  + "  " + request.url));
			console.log(colors.white("action:   ") + colors.yellow(request.action || "?") + colors.magenta(" : ") + colors.yellow(request.ux || "?"));
			console.log(colors.white("ttfb:     ") +
				(request.ttfb < 250 ? colors.green(request.ttfb)
				: (request.ttfb < 500 ? colors.magenta(request.ttfb)
				: (request.ttfb < 1000 ? colors.redBright(request.ttfb)
				: colors.magentaBright(request.ttfb)))
			) + colors.blackBright("ms"));

			for (var i in request.logs) {
				lines = request.logs[i].message.match(/[^\r\n]+/g);
				firstLine = lines[0];
				theRest = lines.slice(1).join("\n");

				switch(request.logs[i].type) {
					case "info":
						console.log(colors.blackBright(firstLine));
						if (theRest) console.log(colors.blackBright(theRest));
						break;
					case "warning":
						console.log(colors.cyanBright(firstLine));
						if (theRest) console.log(colors.blackBright(theRest));
						break;
					default:
					case "error":
						console.log(colors.yellowBright(firstLine));
						if (theRest) console.log(colors.blackBright(theRest));
						break;
				}
			}

			for (var i in request.widgets) {
				if (request.widgets[i].errors.length > 0) {
					console.log(colors.redBright("Widget Errors:" + i + " (" + request.widgets[i].name + ")"));
					for (var x in request.widgets[i].errors) {
						console.log("\t" + request.widgets[i].errors[x]);
					}
				}
			}
		}
		return next();
	},
};

module.exports = wtf;


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
function cacheStuff(dir, done) {
	walk(dir, function(err, list) {
		async.each(list, function(file, next) {
			var callNext = function() { next() };
			if ((/logic\.js$/i).test(file)) {
				require(file);
				callNext();
			}
			else if ((/script\.js$/i).test(file)) {
				wtf.fsCache.readFile(file, callNext);
			}
			else if ((/\.json$/i).test(file)) {
				wtf.fsCache.readFile(file, callNext);
			}
			else if ((/\.jade$/i).test(file)) {
				wtf.fsCache.readFile(file, callNext);
				//jade.cache[file] = jade.compile(file, {pretty:true}, doNothing);
			}
			else if ((/\.jsph$/i).test(file)) {
				wtf.fsCache.readFile(file, callNext);
				//jsph.cache[file] = jsph.compileFileSync(file);
			}
			else if ((/\.html$/i).test(file)) {
				wtf.fsCache.readFile(file, callNext);
			}
			else if ((/\.less$/i).test(file)) {
				wtf.fsCache.readFile(file, callNext);
			}
			else {
				callNext();
			}
		},
		done);
	})
}


function doNothing(){}
function walk1(dir, done) {
	list = fs.readdirSync(dir);
	list.forEach(function(element, index) {
		if (element && element.substr(0,1) != ".") {
			file = path.join(dir, element);
			stat = fs.statSync(file);

			if (stat.isDirectory() && element != 'node_modules') {
				walk(file);
			}
			else if ((/logic\.js$/i).test(element)) {
				require(file);
			}
			else if ((/script\.js$/i).test(element)) {
				wtf.fsCache.readFile(file, doNothing);
			}
			else if ((/\.json$/i).test(element)) {
				wtf.fsCache.readFile(file, doNothing);
			}
			else if ((/\.jade$/i).test(element)) {
				wtf.fsCache.readFile(file, doNothing);
//				jade.cache[file] = jade.compile(file, {pretty:true}, doNothing);
			}
			else if ((/\.jsph$/i).test(element)) {
				wtf.fsCache.readFile(file, doNothing);
				jsph.cache[file] = jsph.compileFileSync(file);
			}
			else if ((/\.html$/i).test(element)) {
				wtf.fsCache.readFile(file, doNothing);
			}
			else if ((/\.less$/i).test(element)) {
				wtf.fsCache.readFile(file, doNothing);
			}
			else {
				// its safe to just ignore it
			}
		}
	})
}

var fileWatchers;
function startWatchr() {
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
								wtf.loadRoutes();
							}
						}
						if (filePath in wtf.fsCache.contentCache) {
							console.log("Reloading content", filePath);
							try {
								wtf.fsCache.contentCache[filePath] = fs.readFileSync(filePath, "utf8");
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
						if (filePath in wtf.fsCache.statCache) {
							console.log("Reloading stats", filePath);
							try {
								wtf.fsCache.statCache[filePath] = fs.statSync(filePath);
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
						if (filePath in wtf.fsCache.existsCache) {
							wtf.fsCache.existsCache[filePath] = true;
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
						if (filePath in wtf.fsCache.existsCache) {
							wtf.fsCache.existsCache[filePath] = false;
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
			if (fileWatchers == "x") {
				fileWatchers = watchers;
				stopWatch();
			}
			else {
				fileWatchers = watchers;
			}
		}
	});
}

function stopWatchr() {
	if (!fileWatchers) {
		fileWatchers = "x";
	}
	else {
		for (var i in fileWatchers) {
			fileWatchers[i].close();
		}
		fileWatchers = null;
	}
}

jsph.cache = jsph.cache || {};
jsph.renderFileCached = function(filename, paramObject, callback) {
	callback = callback || paramObject;
	if (typeof options == "function") {
		callback = paramObject;
		paramObject = null;
	}

	if(! (filename in  jsph.cache)) {
		wtf.fsCache.readFile(filename, function(err, data) {
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

jade.cache = jade.cache || {};
jade.renderFileCached = function(filename, paramObject, callback) {
	callback = callback || paramObject;
	if (typeof options == "function") {
		callback = paramObject;
		paramObject = null;
	}

	if(! (filename in  jade.cache)) {
		wtf.fsCache.readFile(filename, function(err, data) {
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
