Oxydizr.FrontController = function FrontController() {
	this.events = {};
	this.controllers = {};
	this.handleEvent = this.handleEvent.bind(this);
	this.handleEnterpress = this.handleEnterpress.bind(this);
}

Oxydizr.FrontController.prototype = {

	catchErrors: false,

	controllers: null,

	element: null,

	errorHandler: {
		handleError: function(error, controller, event, element, params, action, controllerId) {
			console.error(error);

			console.log({
				controller: controller,
				event: event,
				element: element,
				params: params,
				action: action,
				controllerId: controllerId
			});

			return true;
		}
	},

	events: null,

	constructor: Oxydizr.FrontController,

	destructor: function() {
		if (this.controllers) {
			for (var controllerId in this.controllers) {
				if (this.controllers.hasOwnProperty(controllerId)) {
					this.unregisterController(this.controllers[controllerId]);
					this.controllers[controllerId] = null;
				}
			}

			this.controllers = null;
		}

		if (this.events) {
			for (var eventName in this.events) {
				if (this.events.hasOwnProperty(eventName)) {
					this._removeEvent(this.element, eventName, this.events[eventName]);
				}
			}

			this.events = null;
		}

		this.element = null;
	},

	init: function(element) {
		if (element) {
			this.element = element;
		}

		if (!this.element) {
			throw new Error("Missing required argument: element");
		}

		return this;
	},

	_addEvent: function(element, eventName, eventInfo) {
		if (!this.events[eventName]) {
			this.events[eventName] = eventInfo;
			this._addEventListener(element, eventInfo.name, eventInfo.handler, eventInfo.capture);
		}
	},

	_addEventListener: function(element, name, handler, capture) {
		element.addEventListener(name, handler, capture);
	},

	_createDelegateId: function() {
		var index = 1000;

		return function() {
			return String(++index);
		};
	}(),

	_getActions: function(element) {
		var actionsAttr = element.getAttribute("data-actions");

		if (!actionsAttr || /^\s*$/.test(actionsAttr)) {
			return [];
		}
		else {
			return actionsAttr
				.replace(/^\s+|\s+$/g, "")
				.split(/[.\s+]/g);
		}
	},

	_getMethodFromAction: function(controller, action, event) {
		var method = null;

		if (controller[action] && (!controller[action].name || controller[action].name === event.type)) {
			method = action;
		}
		else if (controller.handleAction) {
			method = "handleAction";
		}

		return method;
	},

	_getParams: function(event, element) {
		var attr = element.getAttribute("data-action-params");

		return (attr) ? JSON.parse(attr) : {};
	},

	handleEnterpress: function(event) {
		if (event.keyCode === 13) {
			this.handleEvent(event);
		}
	},

	_handleError: function(error, controller, controllerId, action, event, element, params) {
		if (controller && controller.handleActionError) {
			return controller.handleActionError(error, event, element, params, action, controller, controllerId);
		}
		else if (this.errorHandler) {
			return this.errorHandler.handleActionError(error, controller, event, element, params, action, controllerId);
		}

		return false;
	},

	handleEvent: function(event) {
		this._patchEvent(event);
		this._propagateEvent(event.target, event);
		this._unpatchEvent(event);
	},

	_invokeAction: function(controllerId, action, event, element, params) {
		var controller = this.controllers[controllerId] || null,
		    method = null;

		if (!controller) {
			event.stop();
			throw new Error("No controller registered for " + controllerId);
		}
		else if (method = this._getMethodFromAction(controller, action, event)) {
			if (this.catchErrors) {
				try {
					controller[method](event, element, params, action);
				}
				catch (error) {
					event.stop();

					if (!this._handleError(error, controller, controllerId, action, event, element, params)) {
						throw error;
					}
				}
			}
			else {
				controller[method](event, element, params, action);
			}
		}
	},

	_patchEvent: function(event) {
		event.__isStopped = false;
		event.__stopPropagation = event.stopPropagation;
		event.stopPropagation = function() {
			event.__stopPropagation();
			this.__isStopped = true;
		};
		event.__stop = event.stop || null;
		event.stop = function() {
			if (this.__stop) {
				this.__stop();
			}

			this.preventDefault();
			this.stopPropagation();
		};
	},

	_propagateEvent: function(element, event) {
		var actions = this._getActions(element),
		    params = this._getParams(event, element),
		    controllerId, action, actionParams;

		for (var i = 0, length = actions.length; i < length; i += 2) {
			controllerId = actions[i];
			action = actions[i + 1];
			actionParams = params[controllerId + "." + action] || {};
			this._invokeAction(controllerId, action, event, element, actionParams);

			if (event.__isStopped) {
				break;
			}
		}

		if (event.__isStopped || element === this.element) {
			// do nothing
		}
		else if (element.parentNode) {
			this._propagateEvent(element.parentNode, event);
		}
	},

	_registerEvent: function(eventName) {
		var eventInfo = {
			name: eventName,
			handler: this.handleEvent,
			capture: false
		};

		if (eventName === "enterpress") {
			eventInfo.name = "keypress";
			eventInfo.handler = this.handleEnterpress;
		}
		else if (eventName === "focus" || eventName === "blur") {
			eventInfo.capture = true;
		}

		this._addEvent(this.element, eventName, eventInfo);
	},

	registerEvents: function() {
		for (var i = 0, length = arguments.length; i < length; i++) {
			this._registerEvent(arguments[i]);
		}

		return this;
	},

	registerController: function(controller) {
		var controllerId = controller.controllerId || (controller.controllerId = this._createDelegateId());

		if (this.controllers[controllerId]) {
			throw new Error("Cannot register duplicate delegate Id: " + controllerId);
		}

		this.controllers[controllerId] = controller;

		controller.onControllerRegistered(this, controllerId);

		return controllerId;
	},

	_removeEvent: function(element, eventName, eventInfo) {
		if (this.events[eventName]) {
			this._removeEventListener(element, eventInfo.name, eventInfo.handler, eventInfo.capture);
			this.events[eventName] = this.events[eventName].handler = null;
		}
	},

	_removeEventListener: function(element, name, handler, capture) {
		element.removeEventListener(name, handler, capture);
	},

	_unpatchEvent: function(event) {
		event.stopPropagation = event.__stopPropagation;
		event.stop = event.__stop || null;
		event.__stop = event.__stopPropagation = event.__isStopped = null;
	},

	unregisterController: function(controller) {
		var controllerId = controller.controllerId;

		if (!controllerId || !this.controllers[controller.controllerId]) {
			return false;
		}
		else {
			this.controllers[controller.controllerId] = null;
			controller.onUnregisterController(this);
			return true;
		}
	}

};