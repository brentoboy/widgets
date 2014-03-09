var wtf = require('../src/widgets.js');
var assert = require('assert');

var testSite = {
	root: __dirname + "/root",
	site: "www.test.com",
	config: "test",
	watchr: false,
};

wtf.init(testSite);

function pathsMatch(path1, path2) {
	return (path1.replace(/\\/g, "/") == path2.replace("{root}", testSite.root).replace(/\\/g, "/"));
}

function assertError(fn) {
	try{
		fn();
	}
	catch(err) {
		return;
	}
	throw "Error was expected, but none occured";
}

function assertNoError(fn) {
	fn();
}

describe("Widgets, the Framework", function() {
	describe("paths", function() {
		var paths = wtf.paths;

		it("should have the right base path", function(done) {
			assert(pathsMatch(paths.base, "{root}"));
			return done();
		})
		it("should have the right site path", function(done) {
			assert(pathsMatch(paths.site, "{root}/sites/www.test.com"));
			return done();
		})
		it("should have the right site specific static files folder", function(done) {
			assert(pathsMatch(paths.static, "{root}/sites/www.test.com/static"));
			return done();
		})
		it("should have the right models base folder", function(done) {
			assert(pathsMatch(paths.models, "{root}/models"));
			return done();
		})
		it("should have the right actions base folder", function(done) {
			assert(pathsMatch(paths.actions, "{root}/sites/www.test.com/actions"));
			return done();
		})
		it("should have the right widgets base folder", function(done) {
			assert(pathsMatch(paths.widgets, "{root}/widgets"));
			return done();
		})
		it("should have the right wireframes folder", function(done) {
			assert(pathsMatch(paths.wireframes, "{root}/sites/www.test.com/wireframes"));
			return done();
		})
		it("should have the right dataSources folder", function(done) {
			assert(pathsMatch(paths.dataSources, "{root}/dataSources"));
			return done();
		})
		it("should have the right site specific CSS folder", function(done) {
			assert(pathsMatch(paths.skins, "{root}/sites/www.test.com/skins"));
			return done();
		})
		it("should compute expected path for a model (without .js at end)", function(done) {
			assert(pathsMatch(paths.model("test"), "{root}/models/test.js"));
			return done();
		})
		it("should compute expected path for a model (with .js at end)'", function(done) {
			assert(pathsMatch(paths.model("xyz/test"), "{root}/models/xyz/test.js"));
			return done();
		})
		it("should compute expected path for a model deeper in the dir tree", function(done) {
			assert(pathsMatch(paths.model("xyz/test"), "{root}/models/xyz/test.js"));
			return done();
		})
		it("should compute expected path for a widget", function(done) {
			assert(pathsMatch(paths.widget("abc/widget"), "{root}/widgets/abc/widget"));
			return done();
		})
		it("should compute expected path for a widget deeper in the dir tree", function(done) {
			assert(pathsMatch(paths.widget("widget/one"), "{root}/widgets/widget/one"));
			return done();
		})
		it("should compute expected path for widget logic file", function(done) {
			assert(pathsMatch(paths.widgetLogic("widget1"), "{root}/widgets/widget1/logic.js"));
			return done();
		})
		it("should compute expected path for widget jade file", function(done) {
			assert(pathsMatch(paths.widgetJade("wid/get/xyz"), "{root}/widgets/wid/get/xyz/view.jade"));
			return done();
		})
		it("should compute expected path for widget jsph file", function(done) {
			assert(pathsMatch(paths.widgetJsph("wid/get/xyz"), "{root}/widgets/wid/get/xyz/view.jsph"));
			return done();
		})
		it("should compute expected path for widget static html file", function(done) {
			assert(pathsMatch(paths.widgetStaticHtml("123"), "{root}/widgets/123/view.html"));
			return done();
		})
		it("should compute expected path for widget less file (with no skin specified)", function(done) {
			assert(pathsMatch(paths.widgetLess("myWidget"), "{root}/widgets/myWidget/skin.default.less"));
			return done();
		})
		it("should compute expected path for widget less file (for a specific skin)", function(done) {
			assert(pathsMatch(paths.widgetLess("myWidget", "dark"), "{root}/widgets/myWidget/skin.dark.less"));
			return done();
		})
		it("should compute expected path for widget config file", function(done) {
			assert(pathsMatch(paths.widgetConfig("1/big/ugly"), "{root}/widgets/1/big/ugly/config.json"));
			return done();
		})
		it("should compute expected path for widget script file", function(done) {
			assert(pathsMatch(paths.widgetScript("js/jQuery/1.10.2"), "{root}/widgets/js/jQuery/1.10.2/script.js"));
			return done();
		})
		it("should compute expected path for action folder", function(done) {
			assert(pathsMatch(paths.action("actionName"), "{root}/sites/www.test.com/actions/actionName"));
			return done();
		})
		it("should compute expected path for nested action folder", function(done) {
			assert(pathsMatch(paths.action("act/shun"), "{root}/sites/www.test.com/actions/act/shun"));
			return done();
		})
		it("should compute expected path for default ux file", function(done) {
			assert(pathsMatch(paths.ux("homepage", 123), "{root}/sites/www.test.com/actions/homepage/123.json"));
			return done();
		})
		it("should compute expected path for specific ux file", function(done) {
			assert(pathsMatch(paths.ux("act/tion", 1), "{root}/sites/www.test.com/actions/act/tion/1.json"));
			return done();
		})
		it("should compute expected path for wireframe jade file", function(done) {
			assert(pathsMatch(paths.wireframeJade("tallSkinny"), "{root}/sites/www.test.com/wireframes/tallSkinny.jade"));
			return done();
		})
		it("should compute expected path for nested wireframe jade file", function(done) {
			assert(pathsMatch(paths.wireframeJade("short/fat"), "{root}/sites/www.test.com/wireframes/short/fat.jade"));
			return done();
		})
		it("should compute expected path for wireframe jsph file", function(done) {
			assert(pathsMatch(paths.wireframeJsph("tallSkinny"), "{root}/sites/www.test.com/wireframes/tallSkinny.jsph"));
			return done();
		})
		it("should compute expected path for nested wireframe jsph file", function(done) {
			assert(pathsMatch(paths.wireframeJsph("short/fat"), "{root}/sites/www.test.com/wireframes/short/fat.jsph"));
			return done();
		})
		it("should compute expected path for a dataSource file (if .js is not specified)", function(done) {
			assert(pathsMatch(paths.dataSource("random-database"), "{root}/dataSources/random-database.js"));
			return done();
		})
		it("should compute expected path for a dataSource file (even if .js is specified)", function(done) {
			assert(pathsMatch(paths.dataSource("games/data.js"), "{root}/dataSources/games/data.js"));
			return done();
		})
	})
	describe("routes", function() {
		it("should have a working homePage route", function (done) {
			var route = wtf.routes.homePage;
			assert(route);
			assert(route.pattern == "/");
			assert(route.action == "homePage");
			assert(typeof route.regex == "object"); //regex
			assert(typeof route.getUrl == "function");
			assert(typeof route.scrape == "function");
			assert(route.regex.test("/"));
			assert(route.getUrl() == "/");
			assert(route.getUrl({}) == "/");
			assert(route.getUrl({junk:"stuff"}) == "/");
			assert(wtf.findRoute("/") === route);
			return done();
		})
		it("should have the magical js route", function (done) {
			var route = wtf.routes.jsRoute;
			assert(route);
			assert(route.pattern == "/js/(string:ux).js");
			assert(route.action == "_js");
			assert(typeof route.regex == "object"); //regex
			assert(typeof route.getUrl == "function");
			assert(typeof route.scrape == "function");
			assert(route.regex.test("/js/pqopmwfepiomad239jmlkqndcadfASDF.js"));
//TODO: make getUrl smart enough to put junk in like "undefined" and "0"
			//assert(route.getUrl() == "/js/undefined.js"); //this should probably be fixed
			//assert(route.getUrl({}) == "/js/undefined.js");
			//assert(route.getUrl({junk:"stuff"}) == "/js/undefined.js");
			assert(route.getUrl({ux:"bla-bla-bla"}) == "/js/bla-bla-bla.js");
			assert(wtf.findRoute("/js/abc-123.js") === route);
			return done();
		})
		it("should have the magical css route", function (done) {
			var route = wtf.routes.cssRoute;
			assert(route);
			assert(route.pattern == "/css/(string:ux).css");
			assert(route.action == "_css");
			assert(typeof route.regex == "object"); //regex
			assert(typeof route.getUrl == "function");
			assert(typeof route.scrape == "function");
			assert(route.regex.test("/css/pqopmwfepiomad239jmlkqacmjjaoijfecacedndcadfASDF.css"));
			//assert(route.getUrl() == "/css/undefined.css"); //this should probably be fixed
			//assert(route.getUrl({}) == "/css/undefined.css");
			//assert(route.getUrl({junk:"stuff"}) == "/css/undefined.css");
			assert(route.getUrl({ux:"bla-bla-bla"}) == "/css/bla-bla-bla.css");
			assert(wtf.findRoute("/css/abc-123.css") === route);
			return done();
		})
		it("should have a 404 route", function(done) {
			var route = wtf.routes._404;
			assert(wtf.findRoute("") === route);
			assert(wtf.findRoute(null) === route);
			assert(wtf.findRoute(".html") === route);
			assert(wtf.findRoute(503034) === route);
			assert(wtf.findRoute("/some/random/1/path/on-the-server.php") === route);
			return done();
		})
	})
	describe("loadWidgetConfig", function() {
		it("should load sample widget", function(done) {
			wtf.loadWidgetConfig("sample", function(err, config) {
				assert(!err);

				assert(config.name == "sample");
				assert(config.description == "Used by unit testing to make sure things work");
				assert(config.configs.length == 3);

				assert(config.configs[0].name == 'heading');
				assert(config.configs[0].description == 'has a description');
				assert(config.configs[0].default == 'This is a sample');

				assert(config.configs[1].name == 'footing');
				assert(!config.configs[1].description);
				assert(!config.configs[1].default);

				assert(config.configs[2].name == 'content');
				assert(!config.configs[2].description);
				assert(!config.configs[2].default);
				return done();
			});
		})
		it("should create minimalistic stub for widget with no config", function(done) {
			wtf.loadWidgetConfig("testConfig/hasNoConfig", function(err, config) {
				assert(!err)
				assert(config.name == "testConfig/hasNoConfig")
				assert(!config.description)
				assert(!config.configs.length)

				return done()
			})
		})
		it("should error out loading an invalid config.json", function(done) {
			wtf.loadWidgetConfig("testConfig/hasInvalidConfig", function(err, config) {
				assert(err);
				assert(!config);
				return done();
			})
		})
		it("should error out loading a completely non-existant widget", function(done) {
			wtf.loadWidgetConfig("non-existant-widget", function(err, config) {
				assert(err);
				assert(!config);
				return done()
			})
		})
	})
	describe("mergeConfigs", function() {
		var defaultConfigs = [
			{
				"name":"heading",
				"description":"has a description",
				"default":"This is a sample"
			},
			{
				"name":"footing",
				"description":"",
				"default":""
			},
			{
				"name":"content",
			},
		]

		it("should have combined inputs from all three sources", function(done) {
			var uxConfigs = { content: "val" };
			var requestParams = { footing: "foot" };
			var result = wtf.mergeConfigs(defaultConfigs, uxConfigs, requestParams);
			assert(result.heading == "This is a sample");
			assert(result.footing == "foot");
			assert(result.content == "val");
			return done();
		})
		it("should complain if uxConfigs defines values not defined in defaultConfigs", function(done) {
			var uxConfigs = { newConfig: "x" };
			assertError(function() { wtf.mergeConfigs(defaultConfigs, uxConfigs, {}); });
			return done();
		})
		it("should not complain if requestParams has values not definded in defaultConfigs", function(done) {
			var requestParams = { newConfig: "x" };
			assertNoError(function() { wtf.mergeConfigs(defaultConfigs, {}, requestParams); });
			return done();
		})
		it("should NOT include things from requestParams that are not in the defaultConfigs", function(done) {
			var requestParams = { newConfig: "x" };
			var results = wtf.mergeConfigs(defaultConfigs, {}, requestParams);
			assert(! ('newConfig' in results));
			return done();
		})
		it("should overwrite defaults even when override is a falsy value", function(done) {
			var falsyThings = [ false, 0, "", null, undefined, NaN ]
			for (i in falsyThings) {
				var uxConfigs = { heading: falsyThings[i] };
				var results = wtf.mergeConfigs(defaultConfigs, uxConfigs, {});
				assert('heading' in results);
				assert(!results.heading);
				results = wtf.mergeConfigs(defaultConfigs, {}, uxConfigs);
				assert('heading' in results);
				assert(!results.heading);
			}
			return done();
		})
		it("should favor requestParams over all else", function(done) {
			var uxConfigs = { heading: "ux" };
			var requestParams = { heading: "param" };
			var result = wtf.mergeConfigs(defaultConfigs, uxConfigs, requestParams);
			assert(result.heading == "param");
			return done();
		})
		it("should favor uxConfigs over default configs", function(done) {
			var uxConfigs = { heading: "ux" };
			var requestParams = {};
			var result = wtf.mergeConfigs(defaultConfigs, uxConfigs, {});
			assert(result.heading == "ux");
			return done();
		})
		it("should have default configs when nothing else overrides them", function(done) {
			var uxConfigs = { footing: "foot" };
			var requestParams = { content: "stuff" };
			var result = wtf.mergeConfigs(defaultConfigs, uxConfigs, {});
			assert(result.heading == "This is a sample");
			return done();
		})
		it("should complain about non-empty, non-object inputs", function(done) {
			var goodDefaultConfigs = defaultConfigs;
			var goodUxConfigs = { footing: "foot" };
			var goodRequestParams = { content: "stuff" };
			var badDefaultConfigs = "hi";
			var badUxConfigs = 012;
			var badRequestParams = function(){};

			assertError(function() { wtf.mergeConfigs(badDefaultConfigs, goodUxConfigs, goodRequestParams) });
			assertError(function() { wtf.mergeConfigs(goodDefaultConfigs, badUxConfigs, goodRequestParams) });
			assertError(function() { wtf.mergeConfigs(goodDefaultConfigs, goodUxConfigs, badRequestParams) });
			assertError(function() { wtf.mergeConfigs(badDefaultConfigs, badUxConfigs, goodRequestParams) });
			assertError(function() { wtf.mergeConfigs(badDefaultConfigs, goodUxConfigs, badRequestParams) });
			assertError(function() { wtf.mergeConfigs(badDefaultConfigs, badUxConfigs, badRequestParams) });

			return done();
		})
		it("should not complain about empty or null params", function(done) {
			var goodDefaultConfigs = defaultConfigs;
			var goodUxConfigs = { footing: "foot" };
			var goodRequestParams = { content: "stuff" };

			assertNoError(function() { wtf.mergeConfigs({}, {}, goodRequestParams) });
			assertNoError(function() { wtf.mergeConfigs(goodDefaultConfigs, null, goodRequestParams) });
			assertNoError(function() { wtf.mergeConfigs(goodDefaultConfigs, goodUxConfigs, "") });
			assertNoError(function() { wtf.mergeConfigs(undefined, {}, goodRequestParams) });
			assertNoError(function() { wtf.mergeConfigs(null, "", {}) });
			assertNoError(function() { wtf.mergeConfigs("", false, 0) });

			return done();
		})
		it("should be an empty object when all inputs are empty or null", function(done) {
			results = wtf.mergeConfigs("", [], null);
			assert(JSON.stringify(results) == "{}");
			return done();
		})
	})
	describe("runLogic", function() {
		it("should run logic if there is a logic file", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'sample');
			wtf.loadWidgetConfig(widget.name, function(err, config) {
				widget.configs = config.configs;
				widget.configs.footing = "stuff";

				wtf.runLogic(widget, function() {
					assert(widget.configs.heading = 'This is a sample');
					assert(widget.configs.footing = 'stuff');
					assert(widget.configs.content == 'Here is the content you requested.');
					assert(widget.configs.touchedByLogic);
					return done();
				})
			})
		})
		it("should change nothing if there is no logic file", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, "hasNoLogic");
			widget.configs = {
				heading: 'This is a sample',
				footing: '',
				content: 'request content',
				emptyDefault: 'yay data',
				undefinedDefault: undefined,
				name: 'some-slug',
				id: 50,
			}

			wtf.runLogic(widget, function(err) {
				assert(!err)

				assert(widget.configs.heading == 'This is a sample')
				assert(!widget.configs.footing)
				assert(widget.configs.content == 'request content')
				assert(widget.configs.emptyDefault == 'yay data')
				assert(!widget.configs.undefinedDefault)
				assert(widget.configs.name == 'some-slug')
				assert(widget.configs.id == 50)

				return done();
			})
		})
	})
	describe('render', function() {
		it("should render render.jsph if it is available", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testRender/hasJsphJadeAndHtml');
			widget.configs.content = "stuff";
			wtf.render(widget, function(err) {
				assert(!err);
				assert(widget.html == '<h1 class="jsph">stuff</h1>');
				return done();
			})
		})
		it("should render render.jade if it is available (and jsph is not)", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testRender/hasJadeAndHtml');
			widget.configs.content = "stuff";
			wtf.render(widget, function(err) {
				assert(!err);
				assert(widget.html == '\n<h1 class="jade">stuff</h1>');
				return done();
			})
		})
		it("should render render.html if it is available (and jsph and jade are not)", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testRender/hasHtmlTemplateOnly');
			wtf.render(widget, function(err) {
				assert(!err);
				assert(widget.html == '<h1>stuff</h1>');
				return done();
			})
		})
		it("should return empty string if no template is available", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testRender/hasNoTemplate');
			wtf.render(widget, function(err) {
				assert(!err);
				assert(widget.html === '');
				return done();
			})
		})
		it("should return empty string if noRender flag is set", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testRender/hasJsphJadeAndHtml');
			widget.configs.content = "stuff";
			widget.noRender = true;
			wtf.render(widget, function(err) {
				assert(!err);
				assert(widget.html === '');
				return done();
			})
		})
	})
	describe('findScripts', function() {
		it("should find a script file for a widget", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testScript/hasScriptNoDependency');
			wtf.findScripts(widget, function(err) {
				assert(!err)
				assert(widget.scripts.length == 1)
				assert(widget.scripts[0].widget == 'testScript/hasScriptNoDependency')
				return done()
			})
		})
		it("should find no script file if a widget has no script", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testScript/hasNoScript');
			wtf.findScripts(widget, function(err) {
				assert(!err);
				assert(!widget.scripts || widget.scripts.length == 0);
				return done();
			})
		})
		it("should find a dependency script and a widgets script file - dependency first", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testScript/hasScriptWithDependency');
			wtf.findScripts(widget, function(err) {
				assert(!err);
				assert(widget.scripts.length == 2);
				assert(widget.scripts[0].widget == 'testScript/hasScriptNoDependency');
				assert(widget.scripts[1].widget == 'testScript/hasScriptWithDependency');
				return done();
			})
		})
		it("should find a dependency script even if a widget has no script of its own", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testScript/hasDependencyButNoScript');
			wtf.findScripts(widget, function(err) {
				assert(!err);
				assert(widget.scripts.length == 1);
				assert(widget.scripts[0].widget == 'testScript/hasScriptNoDependency');
				return done();
			})
		})
		it("should find multiple dependencies", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testScript/hasMultipleDependencies');
			wtf.findScripts(widget, function(err) {
				assert(!err);
				assert(widget.scripts.length == 3);
				assert(widget.scripts[0].widget == 'sample');
				assert(widget.scripts[1].widget == 'testScript/hasScriptNoDependency');
				assert(widget.scripts[2].widget == 'testScript/hasMultipleDependencies')
				return done();
			})
		})
		it("should find dependencies of dependencies", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, 'testScript/hasDependenciesWithDependencies');
			wtf.findScripts(widget, function(err) {
				assert(!err);
				assert(widget.scripts.length == 4);
				assert(widget.scripts[0].widget == 'sample');
				assert(widget.scripts[1].widget == 'testScript/hasScriptNoDependency');
				assert(widget.scripts[2].widget == 'testScript/hasMultipleDependencies');
				assert(widget.scripts[3].widget == 'testScript/hasDependenciesWithDependencies');
				return done();
			})
		})
		it("should not find any scripts if noRender flag is set", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, "sample");
			widget.noRender = true;
			wtf.findScripts(widget, function(err) {
				assert(!err);
				assert(widget.scripts.length == 0);
				return done();
			})
		})
	})
	describe('findStyles', function() {
		it("should add a widget if it has a .less file", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, "sample")
			wtf.findStyles(widget, function(err) {
				assert(!err);
				assert(widget.styles.length == 1);
				assert(widget.styles[0].widget == widget.name);
				assert(widget.styles[0].time);
				return done();
			})
		});
		it("should not add a widget if it doesn't have a .less file", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, "testStyles/hasNoStyles")
			wtf.findStyles(widget, function(err) {
				assert(!err);
				assert(widget.styles.length == 0);
				return done();
			})
		});
		it("should not add a widget if noRender flag is set", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, "sample")
			widget.noRender = true;
			wtf.findStyles(widget, function(err) {
				assert(!err);
				assert(widget.styles.length == 0);
				return done();
			})
		});
		it("should add a widget if a skinned .less file exists for the current skin, even if default styles arent provided.", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, "testStyles/hasSkinnedStylesOnly")
			context.skin = "nifty";
			wtf.findStyles(widget, function(err) {
				assert(!err);
				assert(widget.styles.length == 1);
				assert(widget.styles[0].widget == widget.name);
				assert(widget.styles[0].time);
				return done();
			})
		})
		it("should add a widget if a skinned .less file doesnt exist for the current skin ... if default styles are provided.", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, "testStyles/hasDefaultStylesOnly")
			context.skin = "nifty";
			wtf.findStyles(widget, function(err) {
				assert(!err);
				assert(widget.styles.length == 1);
				assert(widget.styles[0].widget == widget.name);
				assert(widget.styles[0].time);
				return done();
			})
		})
		it("It should not add a widget that has another skin .less file if neither the current skin nor the default skin are provided.", function(done) {
			var context = wtf.newContext();
			var widget = wtf.newWidget(context, "testStyles/hasSkinnedStylesOnly")
			context.skin = "non-existant-skin";
			wtf.findStyles(widget, function(err) {
				assert(!err);
				assert(widget.styles.length == 0);
				return done();
			})
		})
	})
	describe('prepareWidget', function() {
		it("should work", function(done) {
			var context = wtf.newContext();
			context.skin = "nifty";
			context.requestParams = {
				id: 1,
				name: 'brent',
				content: 'content from request param',
			}
			var widget = wtf.newWidget(context, "sample");
			widget.uxConfigs = { //from action-ux config file
				heading: 'Hello Rubix.js',
				content: 'content from ux config file',
			}
			wtf.prepareWidget(widget, function(err) {
				assert(!err);
				assert(!widget.errors || widget.errors.length == 0);

				assert(!widget.configs.id);
				assert(!widget.configs.name);
				assert(widget.configs.content == 'content from request param');
				assert(widget.configs.heading == 'Hello Rubix.js');
				assert(!widget.configs.footing);
				assert(widget.configs.touchedByLogic);

				assert(!widget.noRender);

				assert(widget.scripts.length == 1);
				assert(widget.scripts[0].widget == 'sample');
				assert(widget.styles[0].time > 1);

				assert(widget.styles.length == 1);
				assert(widget.styles[0].widget == widget.name);
				assert(widget.styles[0].time);

				return done();
			})
		})
	})
	describe('planResponse', function() {
		it("should handle magic js route, and populate context.scripts", function(done) {
			var context = wtf.newContext();
			context.route = { action: "_js" };
			context.ux = "WyJzb21lL3dpZGdldCIsImFub3RoZXIvd2lkZ2V0Iiwid2lkZ2V0LzMiXQ%3D%3D";
			wtf.planResponse(context, function(err) {
				assert(!err);
				assert(context.responseType == "js");
				assert(context.requiredScripts.length == 3);
				assert(context.requiredScripts[0] == "some/widget");
				assert(context.requiredScripts[1] == "another/widget");
				assert(context.requiredScripts[2] == "widget/3");
				return done();
			});
		})
		it("should handle magic css route, and populate skin and widgets", function(done) {
			var context = wtf.newContext();
			context.route = { action: "_css" };
			context.ux = "eyJ0IjoieXVtbXkiLCJ3IjpbInNhbXBsZTEiLCJhbm90aGVyL3dpZGdldCJdfQ%3D%3D";
			wtf.planResponse(context, function(err) {
				assert(!err);
				assert(context.skin == "yummy");
				assert(context.requiredStyles.length == 2);
				assert(context.requiredStyles[0] == 'sample1');
				assert(context.requiredStyles[1] == 'another/widget');
				return done();
			})
		})
		it("should find homePage route, and load default ux settings", function(done) {
			var context = wtf.newContext();
			context.route = { action: "homePage" };
			wtf.planResponse(context, function(err) {
				assert(!err);
				assert(context.responseType == "html");
				assert(context.pageTitle == "home page");
				assert(context.widgetBlocks.head.length == 0);
				assert(context.widgetBlocks.left.length == 0);
				assert(context.widgetBlocks.center.length == 1);
				assert(context.widgetBlocks.footer.length == 0);
				assert(context.widgetBlocks.center[0].id == "firstContent");
				return done();
			});
		})
		it("should find homePage route, and load specified ux settings", function(done) {
			var context = wtf.newContext();
			context.route = { action: "homePage" };
			context.ux = 'special';
			wtf.planResponse(context, function(err) {
				assert(!err);
				assert(context.responseType == "html");
				assert(context.pageTitle == "special home page");
				assert(context.widgetBlocks.head.length == 0);
				assert(context.widgetBlocks.left.length == 0);
				assert(context.widgetBlocks.center.length == 1);
				assert(context.widgetBlocks.footer.length == 0);
				assert(context.widgetBlocks.center[0].id == "firstContent");
				return done();
			});
		})
	})
	describe('extractJsListFromUrl', function() {
		it('should do its thing without errors', function(done) {
			var context = wtf.newContext();
			context.ux = "WyJzb21lL3dpZGdldCIsImFub3RoZXIvd2lkZ2V0Iiwid2lkZ2V0LzMiXQ%3D%3D";
			var jsList = wtf.extractJsListFromUrl(context);
			assert(jsList.length == 3);
			assert(jsList[0] == "some/widget");
			assert(jsList[1] == "another/widget");
			assert(jsList[2] == "widget/3");
			return done();
		})
	})
	describe('extractCssListFromUrl', function() {
		it('should do its thing without errors', function(done) {
			var context = wtf.newContext();
			// context.skin = "yummy";
			// context.requiredStyles = [
			// 	{ widget: "sample1", time: 1512 },
			// 	{ widget: "another/widget", time: 1902923 },
			// ]
			// var cssFileUrl = wtf.buildCssFileUrl(context);
			context.ux = "eyJ0IjoieXVtbXkiLCJ3IjpbInNhbXBsZTEiLCJhbm90aGVyL3dpZGdldCJdfQ%3D%3D";
			var requestedStyles = wtf.extractCssListFromUrl(context);
			assert(requestedStyles.t == 'yummy');
			assert(requestedStyles.w.length == 2);
			assert(requestedStyles.w[0] == "sample1");
			assert(requestedStyles.w[1] == "another/widget");
			return done();
		})
	})
	describe('loadScript', function() {
		it("should load a widget's script if it is available", function(done) {
			var context = wtf.newContext();
			wtf.loadScript(context, 'sample', function(err, script) {
				assert(!err);
				assert(script == "// this is a sample script.js");
				return done();
			})
		})
		it("should gracefully return no script (and an err) if no script is available", function(done) {
			var context = wtf.newContext();
			wtf.loadScript(context, 'testScript/hasNoScript', function(err, script) {
				assert(err);
				assert(!script);
				return done();
			})
		})
	})
	describe('loadStyle', function() {
		it("should load a widgets style for the current skin if available", function(done) {
			var context = wtf.newContext();
			context.skin = "nifty";
			wtf.loadStyle(context, 'sample', function(err, style) {
				assert(!err);
				assert(style == ".sample {\r\n\tcolor: yellow;\r\n\tbackground-color: black;\r\n\th2 { font-weight: bold; }\r\n}");
				return done();
			})
		})
		it("should load a widgets default style if one for the current skin isnt available", function(done) {
			var context = wtf.newContext();
			context.skin = "nifty";
			wtf.loadStyle(context, 'testStyles/hasDefaultStylesOnly', function(err, style) {
				assert(!err);
				assert(style == "/* contents of testStyles/hasDefaultStylesOnly/styles.default.less */");
				return done();
			})
		})
		it("should gracefully return no styles (and an err) if neither stlye is available", function(done) {
			var context = wtf.newContext();
			context.skin = "non-existant-skin";
			wtf.loadStyle(context, 'testStyles/hasSkinnedStylesOnly', function(err, style) {
				assert(err);
				assert(!style);
				return done();
			})
		})
	})
	describe('buildJsFileUrl', function() {
		it("should build the list in context.requiredScripts, if its already there", function(done) {
			var context = wtf.newContext();
			context.requiredScripts = [
				{ widget: "some/widget", time: 123 },
				{ widget: "another/widget", time: 1234 },
				{ widget: "widget/3", time: 12356 },
			]
			var jsUrl = wtf.buildJsFileUrl(context);
			assert(jsUrl == "/js/WyJzb21lL3dpZGdldCIsImFub3RoZXIvd2lkZ2V0Iiwid2lkZ2V0LzMiXQ%3D%3D.js?ver=12356");
			return done();
		})
		it("should build context.requiredScripts from widgets[].scrits if it isnt there", function(done) {
			var context = wtf.newContext();
			context.widgets = {
				widget1: {
					name: "some/widget",
					scripts: [
						{ widget: "some/widget", time: 123 },
						{ widget: "another/widget", time: 1234 },
					],
				},
				widget2: {
					name: "widget/3",
					scripts: [
						{ widget: "widget/3", time: 12356 },
					],
				},
				widgetx: {
					name: "widgetX",
					// conveniently has no scriptss
				}
			}
			var jsUrl = wtf.buildJsFileUrl(context);
			assert(jsUrl == "/js/WyJzb21lL3dpZGdldCIsImFub3RoZXIvd2lkZ2V0Iiwid2lkZ2V0LzMiXQ%3D%3D.js?ver=12356");
			return done();
		})
		it("should return falsy if there are no required scripts", function(done) {
			var context = wtf.newContext();
			context.widgets = {
				widget1: {
					name: "some/widget",
					scripts: [],
				},
				widget2: { name: "widget/3" },
			}
			var jsUrl = wtf.buildJsFileUrl(context);
			assert(!jsUrl);
			return done();
		})
	})
	describe('buildCssFileUrl', function() {
		it("should build the list in context.requiredStyles, if its already there", function(done) {
			var context = wtf.newContext();
			context.requiredStyles = [
				{ widget: "some/widget", time: 123 },
				{ widget: "another/widget", time: 1234 },
				{ widget: "widget/3", time: 12356 },
			]
			var url = wtf.buildCssFileUrl(context);
			assert(url == "/css/eyJ0IjoiZGVmYXVsdCIsInciOlsic29tZS93aWRnZXQiLCJhbm90aGVyL3dpZGdldCIsIndpZGdldC8zIl19.css?ver=12356");
			return done();
		})
		it("should build context.requiredStyles from widgets[].styles if it isnt there", function(done) {
			var context = wtf.newContext();
			context.widgets = {
				widget1: {
					name: "some/widget",
					styles: [
						{ widget: "some/widget", time: 123 },
						{ widget: "another/widget", time: 1234 },
					],
				},
				widget2: {
					name: "widget/3",
					styles: [
						{ widget: "widget/3", time: 12356 },
					],
				},
				widgetx: {
					name: "widgetX",
					// conveniently has no styles
				}
			}
			var url = wtf.buildCssFileUrl(context);
			assert(url == "/css/eyJ0IjoiZGVmYXVsdCIsInciOlsic29tZS93aWRnZXQiLCJhbm90aGVyL3dpZGdldCIsIndpZGdldC8zIl19.css?ver=12356");
			return done();
		})
		it("should return falsy if there are no required scripts", function(done) {
			var context = wtf.newContext();
			context.widgets = {
				widget1: {
					name: "some/widget",
					scripts: [],
				},
				widget2: { name: "widget/3" },
			}
			var jsUrl = wtf.buildJsFileUrl(context);
			assert(!jsUrl);
			return done();
		})
	})
	describe('buildResponse', function() {
		it('should build homePage default UX', function(done) {
			var context = wtf.newContext();
			context.route = { action: "homePage" };
			wtf.planResponse(context, function(err) {
				assert(!err);
				wtf.buildResponse(context, function(err) {
					assert(!err);
					assert(context.responseType == 'html');
					assert(context.responseStatusCode == 200);
					assert(context.pageTitle == 'home page');
					assert(context.jsFileUrl.search(/^\/js\/WyJzYW1wbGUiXQ\%3D\%3D\.js\?ver=\d+$/) != -1);
					assert(context.cssFileUrl.search(/^\/css\/eyJ3IjpbInNhbXBsZSJdfQ\%3D\%3D\.css\?ver=\d+$/) != -1);
					assert(context.responseBody == "<!DOCTYPE html>\n<html>\n  <head>\n    <title></title>\n    <link rel=\"stylesheet/less\" type=\"text/css\" href=\"/css/eyJ3IjpbInNhbXBsZSJdfQ%3D%3D.css?ver=1394021710000\">\n  </head>\n  <body>\n    <div class=\"pageContainer\">\n      <div class=\"pageMiddle\">\n        <div class=\"pageCenter\"><div class=\"widget sample jsph\">\r\n\r\n\t<h2 class=\"widgetHeader\">This is a sample\r\n\r\n\t<div class=\"widgetContent\">Here is the content you requested.</div>\r\n\n        </div>\n      </div>\n    </div>\n    <script src=\"/js/WyJzYW1wbGUiXQ%3D%3D.js?ver=1394022199000\"></script>\n  </body>\n</html>");
					return done();
				})
			})
		})
		it("should build a fairly complex js response in the right order", function(done) {
			var context = wtf.newContext();
			context.route = { action: "_js" };
			context.responseType = "js";
			context.requiredScripts = ['sample', 'testScript/hasScriptNoDependency'];
			wtf.buildResponse(context, function(err) {
				assert(!err);
				assert(context.responseType == 'js');
				assert(context.responseStatusCode == 200);
				assert(context.responseBody == '// this is a sample script.js\n\n// HasScriptNoDependency\r\n');
				return done();
			})
		})
		it("should build a css (compiled from less) file with stuff in main folder and overrides on individual widgets and all that", function(done) {
			var context = wtf.newContext();
			context.route = { action: "_css" };
			context.responseType = "css";
			context.skin = "nifty";
			context.requiredStyles = ['sample', 'testStyles/hasDefaultStylesOnly'];
			wtf.buildResponse(context, function(err) {
				assert(!err);
				assert(context.responseBody == ".defaultAndNifty.fromNifty h2 {\n  line-height: 3;\n}\n.onlyInDefault {\n  color: blue;\n}\n.onlyInDefault h4 {\n  color: black;\n}\n.onlyInNifty {\n  color: blue;\n}\n.onlyInNifty h4 {\n  color: black;\n}\n.sample {\n  color: yellow;\n  background-color: black;\n}\n.sample h2 {\n  font-weight: bold;\n}\n/* contents of testStyles/hasDefaultStylesOnly/styles.default.less */\n");
				return done();
			})
		})
	})
})




// wtf.newContext()


// var less = require('less');

// less.render('.class { width: (1 + 1) }', function (e, css) {
//   console.log(css);
// });