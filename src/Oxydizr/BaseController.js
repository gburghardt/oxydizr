Oxydizr.BaseController = function BaseController() {};

Oxydizr.BaseController.prototype = {

	controllerId: null,

	constructor: Oxydizr.BaseController,

	onControllerRegistered: function(frontController, controllerId) {
		// register events
	},

	onControllerunRegistered: function(frontController) {
		// do some cleanup work
	}

};