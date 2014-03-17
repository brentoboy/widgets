var wtf = require("./framework.js");
var path = require("path");

var paths = {};
paths.base = wtf.options.root;
paths.site = path.join(paths.base, 'sites', wtf.options.site);
paths.static = path.join(paths.site, 'static');
paths.models = path.join(paths.base, 'models');
paths.actions = path.join(paths.site, 'actions');
paths.widgets = path.join(paths.base, 'widgets');
paths.dataSources = path.join(paths.base, 'dataSources');
paths.wireframes = path.join(paths.site, 'wireframes');
paths.skins = path.join(paths.site, 'skins');

paths.model = function(modelName) {
	return path.join(
		paths.models
		, modelName + ((/\.js$/).test(modelName) ? "" : ".js")
	);
}

paths.action = function(actionName) {
	return path.join(
		paths.actions
		, actionName
	);
}

paths.ux = function(actionName, ux) {
	return path.join(
		paths.actions
		, actionName
		, ux + ".json"
	);
}

paths.widget = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
	);
}

paths.widgetConfig = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "config.json"
	);
}

paths.widgetLogic = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "logic.js"
	);
}

paths.widgetStaticHtml = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "view.html"
	);
}

paths.widgetJsph = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "view.jsph"
	);
}

paths.widgetJade = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "view.jade"
	);
}

paths.widgetLess = function(widgetName, skin) {
	return path.join(
		paths.widgets
		, widgetName
		, "skin" + (skin && skin != 'default' ? "." + skin : "") + ".less"
	);
}

paths.widgetScript = function(widgetName) {
	return path.join(
		paths.widgets
		, widgetName
		, "script.js"
	);
}

paths.wireframeJade = function(wireframeName) {
	return path.join(
		paths.wireframes
		, wireframeName + ".jade"
	);
}

paths.wireframeJsph = function(wireframeName) {
	return path.join(
		paths.wireframes
		, wireframeName + ".jsph"
	);
}

paths.dataSource = function (dataSourceName) {
	return path.join(
		paths.dataSources
		, dataSourceName + ((/\.js$/).test(dataSourceName) ? "" : ".js")
	);
}

paths.cssSkinFolder = function(theme) {
	return path.join(
		paths.skins
		, theme
	);
}

module.exports = paths;