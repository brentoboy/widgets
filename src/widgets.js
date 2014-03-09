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
//var querystring = require('querystring')


var fileWatchers;
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
								console.log("Unable to load new version of", filePath);
								console.log(err);
								console.log("reverting to previously usable version of file");
								require.cache[filePath] = tmp; // arent you glad we saved this
							}
							if (/\/routes\.js$/.test(filePath)) {
								wtf.loadRoutes();
							}
						}
						break;
					}
					case "create": {
						break;
					}
					case "delete": {
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
var stopWatchr = function() {
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


var wtf = {
	newContext: function() {
		return { // this really should probably be a class ... hmm
			startedAt: process.hrtime(),
			wtf: wtf,
			action: "404",
			ux: "default",
			skin: "default",
			route: wtf._404,
			uxConfigs: {},
			widgetBlocks: {},  // should be in the format of {head: ["id1", "idOfWidget2", "widget3" ], left: [], right: [] }
			widgets: {}, // should be in the format of { "widgetId": {...}, }
			requestPath: null,
			requestParams: {},
			responseType: null,
			responseStatusCode: 404,
			responseStatusReason: "not found",
			responseHeaders: {},
			responseBody: null,
			requiredScripts: null,
			requiredStyles: null,
			pageTitle: null,
			jsFileUrl: null,
			cssFileUrl: null,
		};
	},

	newWidget: function(context, widgetName) { //, uxConfigs) {
		return {
			context: context,
			name: widgetName,
			configs: {},
			errors: [],
			noRender: false,
			startedAt: process.hrtime(),
		}
	},

	init: function(options) {
		var paths = {};
		var siteName = options.site;
		var basePath = options.root;

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
				, "skin." + (skin ? skin : "default") + ".less"
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

	responder: function(request, response, next) {
		var context = wtf.newContext();
		staticFiles.serve(request, response, function(err, result) {
			// error means there was no static file to serve up
			if (err) {
				context.session = request.session;
				//console.log(context.session.uid())  this is your session id

				var parsedUrl = urlParser.parse(request.url, true);
				context.requestPath = parsedUrl.pathname;
				context.requestParams = parsedUrl.query;
				if (!context.requestParams) {
					context.requestParams = {};
				}

				context.route = wtf.findRoute(context.requestPath);

				if (!context.route || !context.route.action) {
					//return error404(context, response, "no route found for " + request.url)
					return next();
				}
				context.action = context.route.action;

				// add pretty params
				var prettyParams = context.route.scrape(context.requestPath)
				for(key in prettyParams) {
					context.requestParams[key] = prettyParams[key];
				}

				var postParams = request.body;
				if (postParams) {
					for (key in postParams) {
						context.requestParams[key] = postParams[key];
					}
				}

				context.ux = context.requestParams['ux'] || 'default';

				wtf.planResponse(context, function(err) {
					if (err) {
						console.log("Error planning Response:", err);
						return next();
					}
					wtf.buildResponse(context, function(err) {
						if (!context.responseStatusCode) {
							context.responseStatusCode = 200;
						}
						if (!context.responseStatusReason) {
							context.responseStatusReason = "OK";
						}
						if (typeof context.responseBody == "string") {
							context.responseBody = "" + context.responseBody;
						}
						if (!context.responseheaders) {
							context.responseHeaders = {
								"Content-Type": "text/html",
								'Content-Length': context.responseBody.length,
								"Cache-Control": "max-age=0",
							};
						}

						// send the response
						context.ttfb = process.hrtime(context.startedAt)
						console.log("status", context.responseStatusCode);
						console.log("reason", context.responseStatusReason);
						console.log("headers", context.responseHeaders);
						response.writeHead(context.responseStatusCode, context.responseStatusReason, context.responseHeaders);
						response.end(context.responseBody);
						context.ttlb = process.hrtime(context.startedAt);

						// print out a report of how we did
						context.ttfb = Math.round((context.ttfb[0] * 1000) + (context.ttfb[1] / 1000000));
						context.ttlb = Math.round((context.ttlb[0] * 1000) + (context.ttlb[1] / 1000000));
						console.log("action: %s \tttfb: %d\tttlb: %d", context.route.action, context.ttfb, context.ttlb);
					})
				})
			}
		})
	},

	buildJsFileUrl: function(context) {
		if (!context.requiredScripts) {
			context.requiredScripts = [];
			for (var i in context.widgets) {
				var widget = context.widgets[i];
				for (var j in widget.scripts) {
					context.requiredScripts[widget.scripts[j].widget] = widget.scripts[j];
				}
			}
		}

		var list = []
		var max = 0;
		for(var i in context.requiredScripts) {
			var widgetName = context.requiredScripts[i].widget;
			if (list.indexOf(widgetName) == -1) {
				list[list.length] = widgetName;
				max = Math.max(max, context.requiredScripts[i].time);
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

	buildCssFileUrl: function(context) {
		if(!context.requiredStyles) {
			context.requiredStyles = [];
			for (var i in context.widgets) {
				var widget = context.widgets[i];
				for (var j in widget.styles) {
					context.requiredStyles[widget.styles[j].widget] = widget.styles[j];
				}
			}
		}
		var max = 0;
		var list = {
			t: context.skin,
			w: [],
		}
		for (var i in context.requiredStyles) {
			var widgetName = context.requiredStyles[i].widget;
			if (list.w.indexOf(widgetName) == -1) {
				list.w[list.w.length] = widgetName;
				max = Math.max(max, context.requiredStyles[i].time);
			}
		}
		var bigOleString = JSON.stringify(list);
		bigOleString = (new Buffer(bigOleString)).toString('base64');
		return wtf.routes.cssRoute.getUrl({ ux: bigOleString }) + "?ver=" + max;
		//return "/css/" + encodeURIComponent(bigOleString) + ".css?ver=" + max;
	},

	extractJsListFromUrl: function(context) {
		return JSON.parse(new Buffer(decodeURIComponent(context.ux), "base64"));
	},

	extractCssListFromUrl: function(context) {
		return JSON.parse(new Buffer(decodeURIComponent(context.ux), "base64"));
	},

	planResponse: function(context, callback) {
		if (!context.ux || context.ux == -1) {
			context.ux = "default";
		}

		switch(context.action) {
			case "_css": { // special route for dynamic css
				cssList = wtf.extractCssListFromUrl(context);
				context.responseType = "css";
				context.skin = cssList.t; //t is short for theme
				context.requiredStyles = cssList.w; //w is short for widgets
				return callback();
			}
			case "_js": { // special action for dynamic scripts
				jsList = wtf.extractJsListFromUrl(context);
				context.responseType = "js";
				context.requiredScripts = jsList;
				return callback();
			}
			default: { // assume actions in site/action folder
				var updateContext = function(uxJson) {
					var uxConfigs = null;
					try {
						uxConfigs = eval("(" + uxJson + ")");
					}
					catch (err) {
						return callback(err);
					}
					if (!uxConfigs) uxConfigs = {};
					context.responseType = uxConfigs.type ? uxConfigs.type : "html";
					context.wireframe = uxConfigs.wireframe ? uxConfigs.wireframe : "default";
					context.widgetBlocks = uxConfigs.widgetBlocks ? uxConfigs.widgetBlocks : {};
					context.skin = uxConfigs.skin ? uxConfigs.sking : "default";
					context.responseHeaders = uxConfigs.httpHeaders ? uxConfigs.httpHeaders : null;
					context.pageTitle = uxConfigs.title ? uxConfigs.title : "";
					return callback();
				}

				var uxFile = wtf.paths.ux(context.action, context.ux);
				var defaultUxFile = wtf.paths.ux(context.action);
				fs.readFile(uxFile, "utf8", function(err, fileContents) {
					if (err && err.code == 'ENOENT') {
						fs.readFile(defaultUxFile, "utf8", function(err, fileContents) {
							if (err && err.code == 'ENOENT') {
								updateContext("{}");
							}
							else if (err) {
								callback(err);
							}
							else {
								return updateContext(fileContents);
							}
						})
					}
					else if(err) {
						return callback(err);
					}
					else {
						return updateContext(fileContents);
					}
				})
			}
		}
	},

	buildResponse: function(context, callback) {
		switch (context.responseType)
		{
			case 'js': return wtf.buildJsResponse(context, callback);
			case 'css': return wtf.buildCssResponse(context, callback);
			case 'html': return wtf.buildHtmlResponse(context, callback);
			default: return callback("unrecognized response type: '" + context.responseType + "'");
		}
	},

	buildJsResponse: function(context, callback) {
		// planResponse already put the list of requested scripts in context.requiredScripts
		var loadScripts = [];

		// make a list of functions to load the scripts
		for (widgetName in context.requiredScripts) {
			loadScripts[loadScripts.length] = (function(widget) {
				return function(cb) {
					var scriptPath = wtf.paths.widgetScript(widget);
					fs.readFile(scriptPath, "utf8" ,function(err, data) {
						if (err) {
							console.log(err);
						}
						return cb(null, data);
					})
				}
			})(context.requiredScripts[widgetName]);
		}

		// load the scripts in parallel
		async.parallel(loadScripts, function(err, results) {
			// TODO: are there any headers we need to set?

			// assemble all of the scripts into one script as the response body
			if (results) {
				context.responseBody = results.join("\n\n");
			}
			else {
				context.responseBody = err;
			}

			// stick it all on the context and return
			return callback(null, context);
		})
	},

	buildCssResponse: function(context, callback) {
		var loadFiles = [];
		// load the theme from the site folder
		var defaultSkin = wtf.paths.cssSkinFolder("default");
		var themedSkin = wtf.paths.cssSkinFolder(context.skin);
		fs.readdir(defaultSkin, function(err, files) {
			if (err) {
				console.log(err);
				return callback(err, context);
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
							fs.readFile(themedFile, "utf8", function(err, data) {
								if (!err) {
									return cb(null, data);
								}
								fs.readFile(defaultFile, "utf8", function(err, data) {
									if (err) {
										console.log(err);
									}
									return cb(null, data);
								})
							})
						}
					})(files[i]);
				}
				for (i in context.requiredStyles) {
					loadFiles[loadFiles.length] = (function(widgetName) {
						return function(cb) {
							var defaultLess = wtf.paths.widgetLess(widgetName);
							var skinLess = wtf.paths.widgetLess(widgetName, context.skin);
							fs.readFile(skinLess, "utf8", function(err, data) {
								if (!err) {
									return cb(null, data);
								}
								fs.readFile(defaultLess, "utf8", function(err,data) {
									return cb(null, data);
								})
							})
						}
					})(context.requiredStyles[i]);
				}
				// load the contents of all of those files
				async.parallel(loadFiles, function(err, results) {
					// TODO: are there any headers we need to set?
					// assemble all of the scripts into one script as the response body
					if (results) {
						var lessData = results.join("\n\n");
						less.render(lessData, function(err, compiledCss) {
							context.responseBody = compiledCss;
							return callback();
						})
					}
					else {
						context.responseBody = err;
						return callback();
					}
				})
			})
		})
	},

	buildHtmlResponse: function(context, callback) {
		var loadWidgets = {};
		var renderWidgets = {};

		for (var blockIndex in context.widgetBlocks) {
			var block = context.widgetBlocks[blockIndex];
			for (var widgetIndex in block) {
				var widgetConfigs = block[widgetIndex];
				var newWidget = wtf.newWidget(context, widgetConfigs.widget);

				if (!widgetConfigs.id) {
					widgetConfigs.id = blockIndex + "-" + widgetIndex;
				}
				newWidget.id = widgetConfigs.id;
				newWidget.uxConfigs = widgetConfigs.configs;

				loadWidgets[newWidget.id] = [];
				renderWidgets[newWidget.id] = [];

				if (widgetConfigs.runAfter) {
					newWidget.runAfter = widgetConfigs.runAfter;
					loadWidgets[newWidget.id].push(widgetConfigs.runAfter);
				}

				context.widgets[newWidget.id] = newWidget;

				loadWidgets[widgetConfigs.id].push(
					(function(widget) {
						return function(cb) {
							wtf.prepareWidget(widget, cb);
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

		async.auto(loadWidgets, function(err) {
			async.auto(renderWidgets, function(err) {
				context.cssFileUrl = wtf.buildCssFileUrl(context);
				context.jsFileUrl = wtf.buildJsFileUrl(context);

				var jsphWireframe = wtf.paths.wireframeJsph(context.wireframe);
				var jadeWireframe = wtf.paths.wireframeJade(context.wireframe);

				jsph.renderFile(jsphWireframe, context, function(err, html) {
					if (!err && html) {
						context.responseBody = html
						return callback(null, context);
					}

					context.pretty = true;
					jade.renderFile(jadeWireframe, context, function(err, html) {
						context.responseBody = html
						return callback(err, context);
					})
				})

			})
		})
	},

	sendResponse: function(context, req, res, callback) {
		if (!context.responseStatusCode) {
			context.responseStatusCode = 200;
		}

		context.ttfb = process.hrtime(context.startAt);
		res.writeHead(context.responseStatusCode, context.responseHeaders);
		res.end(context.responseBody);
		context.ttlb = process.hrtime(context.startAt);
		return callback(null, context);
	},

	loadWidgetConfig: function(widgetName, callback) {
		var config;
		if (!widgetName) {
			return callback("Widget Not Found 'undefined'");
		}
		var widgetConfigPath = wtf.paths.widgetConfig(widgetName);

		fs.readFile(widgetConfigPath, "utf8", function(err, fileContent) {
			if (err) {
				// file not found -> create minimalistic stub
				if (err.code == 'ENOENT') {
					fs.exists(wtf.paths.widget(widgetName), function(widgetFolderExists) {
						if (!widgetFolderExists) {
							return callback("Widget Not Found '" + widgetName + "'");
						}
						else {
							config = {
								name: widgetName,
								description: '',
								configs: [],
								requires: [],
							}
							return callback(null, config);
						}
					})
					return; // do not process the rest of the function
				}
				// other errors are noteworthy
				else {
					return callback(err);
				}
			}
			else {
				try {
					config = eval("(" + fileContent + ")");
				}
				catch (err) {
					return callback(err);
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
			return callback(null, config);
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
			else {
				throw "uxConfigs contains a value for '" + key + "' which is not in the widget's config options.";
			}
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
		fs.exists(logicFile, function(logicFileExists) {
			if (logicFileExists) {
				try {
					var widgetLogic = require(logicFile)
					widgetLogic.prepare(widget, function() {
						return callback(null, widget)
					})
				}
				catch (err) {s
					widget.errors.push(err)
					return callback(err, widget)
				}
			}
			else {
				widget.vars = widget.factors
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
		fs.exists(jsphFile, function(jsphFileExists) {
			if (jsphFileExists) {
				widget.configs.context = widget.context;
				jsph.renderFile(jsphFile, widget.configs, function(err, html) {
					if (err) {
						widget.errors.push(err);
					}
					widget.html = html;
					return callback(err, widget);
				})
			}
			else {
				var jadeFile = wtf.paths.widgetJade(widget.name)
				fs.exists(jadeFile, function(jadeFileExists) {
					if (jadeFileExists) {
						widget.configs.pretty = true
						widget.configs.context = context
						jade.renderFile(jadeFile, widget.configs, function(err, html) {
							if (err) {
								widget.errors.push(err)
							}
							widget.html = html
							return callback(null, widget)
						})
					}
					else {
						var htmlFile = wtf.paths.widgetStaticHtml(widget.name)
						fs.exists(htmlFile, function(htmlFileExists) {
							if (htmlFileExists) {
								fs.readFile(htmlFile, "utf8", function(err, html) {
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
			fs.exists(wtf.paths.widgetScript(widgetName), function(fileExists) {
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
					fs.stat(scriptjs, function(err, stats) {
						if (err) {
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

		var skinLess = wtf.paths.widgetLess(widget.name, widget.context.skin);
		var defaultLess = wtf.paths.widgetLess(widget.name);

		fs.stat(skinLess, function(err, stats) {
			if (err && err.code == "ENOENT" && defaultLess != skinLess) {
				fs.stat(defaultLess, function(err, stats) {
					if (err){
						if (err.code == "ENOENT") {
							return callback();
						}
						else {
							return callback(err);
						}
					}
					else {
						widget.styles.push({ widget: widget.name , time: stats.mtime.getTime() });
						return callback();
					}
				})
			}
			else if (err){
				if (err.code == "ENOENT") {
					return callback();
				}
				else {
					return callback(err);
				}
			}
			else {
				widget.styles.push({ widget: widget.name , time: stats.mtime.getTime() });
				return callback();
			}
		})
	},

	loadScript: function(context, widgetName, callback) {
		var scriptName = wtf.paths.widgetScript(widgetName)
		return fs.readFile(scriptName, "utf8", callback);
	},

	loadStyle: function(context, widgetName, callback) {
		var styleFiles = [
			wtf.paths.widgetLess(widgetName, context.skin),
			wtf.paths.widgetLess(widgetName),
		]

		async.detectSeries(styleFiles, fs.exists, function(foundFile) {
			if (foundFile) {
				return fs.readFile(foundFile, "utf8", callback)
			}
			else {
				return callback("Style '" + context.skin + "' not found for widget '" + widgetName + "'", "")
			}
		})
	},

	prepareWidget: function(widget, callback) {
		wtf.loadWidgetConfig(widget.name, function (err, config) {
			if (err) {
				widget.noRender = true;
				widget.errors.push(err);
				return callback(err);
			}

			widget.configs = wtf.mergeConfigs(config.configs, widget.uxConfigs, widget.context.requestParams);
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
};

module.exports = wtf;


