exports.prepare = function(widget, done) {

	if (!widget.configs.content) {
		widget.configs.content = "Here is the content you requested."
	}

	widget.configs.touchedByLogic = true; // nice for testing

	return done();
}
