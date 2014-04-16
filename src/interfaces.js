/**
 * interface Oxydizr.IController
 *
 * The basic interface that controllers must implement in order to the Oxydizr
 * FrontController.
 **/
Oxydizr.IController = {
	/**
	 * Oxydizr.IController#controllerId -> String
	 *
	 * The Id unique within the FrontController identifying a controller object.
	 **/
	controllerId: null,

	/**
	 * Oxydizr.IController#onControllerRegistered(delegator, controllerId)
	 * - delegator (Oxydizr.FrontController): The front controller which just registered this controller
	 * - controllerId (String): The Id given to this controller
	 *
	 * The callback invoked when a controller object is registered with an
	 * instance of Oxydizr.FrontController.
	 **/
	onControllerRegistered: function(delegator, controllerId) {},

	/**
	 * Oxydizr.IController#onControllerRegistered(delegator, controllerId)
	 * - delegator (Oxydizr.FrontController): The front controller which just unregistered this controller
	 *
	 * The callback invoked when an instance of Oxydizr.FrontController has
	 * unregistered this controller.
	 **/
	onControllerUnregistered: function(delegator) {}
};

/**
 * interface Oxydizr.IFrontController
 *
 * The interface that front controllers must implement in order to use
 * implementations of Oxydizr.IController. The Oxydizr.FrontController class
 * implements this interface.
 **/
Oxydizr.IFrontController = {
	/**
	 * Oxydizr.IFrontController#catchErrors -> Boolean
	 *
	 * Whether or not this front controller should catch JavaScript errors
	 * thrown during the execution of an action on a controller.
	 **/
	catchErrors: false,

	/**
	 * Oxydizr.IFrontController#element -> HTMLElement
	 *
	 * The root element for this front controller. DOM events are attached here.
	 **/
	element: null,

	/**
	 * Oxydizr.IFrontController#errorHandler -> Oxydizr.IErrorHandler
	 *
	 * An object implementing the Oxydizr.IErrorHandler interface, which handles
	 * errors thrown during the execution of a controller action.
	 **/
	errorHandler: null,

	/**
	 * Oxydizr.IFrontController#destructor()
	 *
	 * Remove all DOM events and ready this front controller for natural garbage
	 * collection by the browser.
	 **/
	destructor: function() {},

	/**
	 * Oxydizr.IFrontController#init([element]) -> Oxydizr.IFrontController
	 * - element (HTMLElement): The root element for this front controller
	 *
	 * Initialize this front controller and ready it for use.
	 **/
	init: function(element) {},

	/**
	 * Oxydizr.IFrontController#registerController(controller) -> String
	 * - controller (Oxydizr.IController): The controller to register
	 *
	 * Register a controller with this front controller. Returns the controller
	 * Id used to register the controller.
	 **/
	registerController: function(controller) {},

	/**
	 * Oxydizr.IFrontController#registerController(controller) -> Boolean
	 * - controller (Oxydizr.IController): The controller to unregister
	 *
	 * Unregister a controller with this front controller. Returns true if the
	 * controller was unregistered.
	 **/
	unregisterController: function(controller) {}
};

/**
 * interface Oxydizr.IErrorHandler
 *
 * The interface used for any object that wants to handle errors thrown during
 * the execution of a controller action. This is usually an application object.
 **/
Oxydizr.IErrorHandler = {
	/**
	 * Oxydizr.IErrorHandler#handleActionError(error, event, element, params, action, controller, controllerId) -> Boolean
	 * - error (Error): The error thrown
	 * - event (Event): The browser event in which the error was thrown
	 * - element (HTMLElement): The DOM node that was the focus of the controller action
	 * - params (Object): The params passed into the controller action
	 * - action (String): The name of the action being executed
	 * - controller (Oxydizr.IController): The controller that threw this error
	 * - controllerId (String): The Id of the controller registered in the front controller
	 *
	 * Handle an error thrown in a controller action. If true is returned, the
	 * front controller assumes the error has been handled. If false is
	 * returned, the front controller will rethrow the error.
	 **/
	handleActionError: function(error, event, element, params, action, controller, controllerId) {}
};

/**
 * interface Oxydizr.IControllerErrorHandler
 *
 * The interface used for any controller that wants to handle errors thrown
 * during the execution of its own actions.
 **/
Oxydizr.IControllerErrorHandler = {
	/**
	 * Oxydizr.IControllerErrorHandler#handleActionError(error, controller, event, element, params, action, controllerId) -> Boolean
	 * - error (Error): The error thrown
	 * - controller (Oxydizr.IController): The controller that threw this error
	 * - event (Event): The browser event in which the error was thrown
	 * - element (HTMLElement): The DOM node that was the focus of the controller action
	 * - params (Object): The params passed into the controller action
	 * - action (String): The name of the action being executed
	 * - controllerId (String): The Id of the controller registered in the front controller
	 *
	 * Handle an error this controller threw during the executing of one of its
	 * own actions. Returning true means this method handled the error
	 * gracefully. If returning false, the front controller will rethrow the
	 * error.
	 **/
	handleActionError: function(error, controller, event, element, params, action, controllerId) {}
};
