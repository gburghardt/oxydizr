describe("FrontController", function() {

	function MockController() {}
	MockController.prototype.controllerId = null;
	MockController.prototype.onControllerRegistered = function() {};
	MockController.prototype.onControllerUnregistered = function() {};

	var controller,
	    event,
	    delegator,
	    element,
	    params,
	    controllerId;

	describe("destructor", function() {

		beforeEach(function() {
			element = document.createElement("div");
			delegator = new Oxydizr.FrontController().init(element);
		});

		it("nullifies the reference to the root element", function() {
			delegator.destructor();
			expect(delegator.element).toBe(null);
		});

		it("unregisters controllers", function() {
			var c1 = new MockController(),
			    c2 = new MockController();

			spyOn(c1, "onControllerUnregistered");
			spyOn(c2, "onControllerUnregistered");

			delegator.registerController(c1);
			delegator.registerController(c2);

			delegator.destructor();

			expect(c1.onControllerUnregistered).toHaveBeenCalledWith(delegator);
			expect(c2.onControllerUnregistered).toHaveBeenCalledWith(delegator);

			expect(delegator.controllers).toBe(null);
		});

		it("removes events", function() {
			spyOn(element, "removeEventListener");
			spyOn(element, "addEventListener");
			delegator.registerEvents("click", "submit");

			delegator.destructor();

			expect(element.removeEventListener).toHaveBeenCalledWith("click", delegator.handleEvent, false);
			expect(element.removeEventListener).toHaveBeenCalledWith("submit", delegator.handleEvent, false);
			expect(delegator.events).toBe(null);
		});

	});

	describe("init", function() {

		beforeEach(function() {
			element = document.createElement("div");
			delegator = new Oxydizr.FrontController();
		});

		it("receives the root element", function() {
			expect(delegator.init(element)).toBe(delegator);
			expect(delegator.element).toBe(element);
		});

		it("throws an error if the element is omitted", function() {
			expect(function() {
				delegator.init();
			}).toThrowError("Missing required argument: element");
		});

	});

	describe("_addEvent", function() {

		beforeEach(function() {
			element = document.createElement("div");
			spyOn(element, "addEventListener");
			delegator = new Oxydizr.FrontController();
		});

		it("adds an event listener", function() {
			var handler = function() {},
			    eventInfo = { name: "click", handler: handler, capture: false };

			delegator._addEvent(element, "click", eventInfo);

			expect(element.addEventListener).toHaveBeenCalledWith("click", handler, false);
			expect(delegator.events.click).toEqual(eventInfo);
		});

		it("does not add duplicate listeners", function() {
			var handler = function() {},
			    eventInfo = { name: "click", handler: handler, capture: false };

			delegator._addEvent(element, "click", eventInfo);
			delegator._addEvent(element, "click", eventInfo);

			expect(element.addEventListener.calls.count()).toBe(1);
		});

	});

	describe("_getActions", function() {

		beforeEach(function() {
			element = document.createElement("div");
			delegator = new Oxydizr.FrontController();
		});

		all("empty values for the data-actions attribute returns an empty array", [ "", "   " ], function(value) {
			element.setAttribute("data-actions", value);
			expect(delegator._getActions(element)).toEqual([]);
		});

		it("returns an empty array for a null data-actions attribute", function() {
			expect(delegator._getActions(element)).toEqual([]);
		});

		it("returns an array of controllerId's and action names", function() {
			element.setAttribute("data-actions", "foo.bar your-face.something");

			var actions = delegator._getActions(element);

			expect(actions).toEqual(["foo", "bar", "your-face", "something"]);
		});

	});

	describe("_getMethodFromAction", function() {

		beforeEach(function() {
			controller = {};
			delegator = new Oxydizr.FrontController();
		});

		it("returns null if the controller has a method matching the action whose name property does not match the event type", function() {
			controller.foo = function() {};

			expect(delegator._getMethodFromAction(controller, "foo", new Oxydizr.MockEvent()))
				.toBe(null);
		});

		it("returns the action if the controller has a method matching the action whose name property matches the event type", function() {
			controller.foo = function click() {};
			event = new Oxydizr.MockEvent("click");

			expect(delegator._getMethodFromAction(controller, "foo", event))
				.toBe("foo");
		});

		it("returns null if the controller has a method matching the action, but whose name property does not match the event type", function() {
			controller.foo = function click() {};
			event = new Oxydizr.MockEvent("keypress");

			expect(delegator._getMethodFromAction(controller, "foo", event))
				.toBe(null);
		});

		it("returns null if the controller does not have a method matching the action, or a method named 'handleAction'", function() {
			expect(delegator._getMethodFromAction(controller, "foo", new Oxydizr.MockEvent("click")))
				.toBe(null);
		});

		it("returns 'handleAction' if the controller supports that method and has a method matching the action whose name property does not match the event type", function() {
			controller.foo = function click() {};
			controller.handleAction = function() {};
			event = new Oxydizr.MockEvent("keypress");

			expect(delegator._getMethodFromAction(controller, "foo", event))
				.toBe("handleAction");
		});

		it("return 'handleAction' if the controller supports that method", function() {
			controller.handleAction = function() {};
			event = new Oxydizr.MockEvent("keypress");

			expect(delegator._getMethodFromAction(controller, "foo", event))
				.toBe("handleAction");
		});

	});

	describe("_invokeAction", function() {

		beforeEach(function() {
			delegator = new Oxydizr.FrontController();
			controller = new MockController();
			controllerId = delegator.registerController(controller);
			element = document.createElement("div");
			event = new Oxydizr.MockEvent("click", element);
			delegator._patchEvent(event);
			params = {};
		});

		it("throws an error if the controllerId does not refer to a registered controller", function() {
			expect(function() {
				delegator._invokeAction("test", "foo", event, element, params);
			}).toThrowError("No controller registered for test");
		});

		it("does not throw an error if the controller method is null", function() {
			expect(function() {
				delegator._invokeAction(controllerId, "foo", event, element, params);
			}).not.toThrowError();
		});

		it("does not call the controller method if the method's name property does not match the event type", function() {
			controller.foo = function() {};
			spyOn(controller, "foo");

			delegator._invokeAction(controllerId, "foo", event, element, params);

			expect(controller.foo).not.toHaveBeenCalled();
		});

		describe("when 'catchErrors' is true", function() {

			var error;

			beforeEach(function() {
				error = new Error("Fake error");
				delegator.catchErrors = true;
				delegator.errorHandler = {
					handleActionError: function() { return true; }
				};
				controller.foo = function click() {
					throw error;
				};
			});

			it("calls an error handler if one exists", function() {
				spyOn(delegator.errorHandler, "handleActionError").and.callThrough();

				delegator._invokeAction(controllerId, "foo", event, element, params);

				expect(delegator.errorHandler.handleActionError)
					.toHaveBeenCalledWith(error, controller, event, element, params, "foo", controllerId);
			});

			it("calls the 'handleActionError' method on the controller if one exists", function() {
				controller.handleActionError = function() { return true; };
				spyOn(controller, "handleActionError").and.callThrough();

				delegator._invokeAction(controllerId, "foo", event, element, params);

				expect(controller.handleActionError)
					.toHaveBeenCalledWith(error, event, element, params, "foo", controller, controllerId);
			});

			it("throws the error if the error handler returns false", function() {
				spyOn(delegator.errorHandler, "handleActionError").and.returnValue(false);

				expect(function() {
					delegator._invokeAction(controllerId, "foo", event, element, params);
				}).toThrow(error);
			});

			it("throws the error if controller.handleActionError returns false", function() {
				controller.handleActionError = function() { return false; };
				spyOn(controller, "handleActionError").and.callThrough();

				expect(function() {
					delegator._invokeAction(controllerId, "foo", event, element, params);
				}).toThrow(error);

				expect(controller.handleActionError).toHaveBeenCalled();
			});

		});

	});

	describe("_patchEvent", function() {

		beforeEach(function() {
			delegator = new Oxydizr.FrontController();
			event = new Oxydizr.MockEvent("click", document.createElement("div"));
		});

		it("overrides the stopPropagation method", function() {
			delegator._patchEvent(event);

			expect(event.stopPropagation)
				.not.toBe(Oxydizr.MockEvent.prototype.stopPropagation);

			spyOn(event, "__stopPropagation").and.callThrough();

			event.stopPropagation();

			expect(event.__isStopped).toBe(true);
			expect(event.__stopPropagation).toHaveBeenCalled();
		});

		it("overrides the stop method if one exists", function() {
			var stop = function() {};
			event.stop = stop;

			delegator._patchEvent(event);

			expect(event.stop).not.toBe(stop);

			spyOn(event, "__stop");
			spyOn(event, "stopPropagation").and.callThrough();
			spyOn(event, "preventDefault");

			event.stop();

			expect(event.__isStopped).toBe(true);
			expect(event.stopPropagation).toHaveBeenCalled();
			expect(event.preventDefault).toHaveBeenCalled();
			expect(event.__stop).toHaveBeenCalled();
		});

	});

	describe("_propagateEvent", function() {

		var target;

		beforeEach(function() {
			element = document.createElement("div");
			target = document.createElement("div");
			delegator = new Oxydizr.FrontController().init(element);
			event = new Oxydizr.MockEvent("click", target);
			delegator._patchEvent(event);
			controller = new MockController();
			controllerId = delegator.registerController(controller);
		});

		it("does not invoke an action when there are none", function() {
			spyOn(delegator, "_invokeAction");
			delegator._propagateEvent(event.target, element);

			expect(delegator._invokeAction.calls.count()).toBe(0);
		});

		describe("invoking actions", function() {

			beforeEach(function() {
				spyOn(delegator, "_invokeAction").and.callThrough();
			});

			it("invokes a single action", function() {
				var spy = jasmine.createSpy();

				controller.foo = function click(event, element, params, action) {
					spy(event, element, params, action);
				};

				target.setAttribute("data-actions", controllerId + ".foo");

				delegator._propagateEvent(target, event);

				expect(spy).toHaveBeenCalledWith(event, target, {}, "foo");
			});

			it("invokes multiple actions on the same element", function() {
				var spy1 = jasmine.createSpy();
				var spy2 = jasmine.createSpy();
				controller.foo = function click(event, element, params, action) { spy1(event, element, params, action); };
				controller.bar = function click(event, element, params, action) { spy2(event, element, params, action); };
				target.setAttribute("data-actions", controllerId + ".foo " + controllerId + ".bar");
				delegator._propagateEvent(target, event);

				expect(spy1).toHaveBeenCalledWith(event, target, {}, "foo");
				expect(spy2).toHaveBeenCalledWith(event, target, {}, "bar");
			});

			it("stops invoking actions if the event is stopped", function() {
				var spy1 = jasmine.createSpy();
				var spy2 = jasmine.createSpy();
				controller.foo = function click(event, element, params, action) { event.stop(); spy1(event, element, params, action); };
				controller.bar = function click(event, element, params, action) { spy2(event, element, params, action); };
				target.setAttribute("data-actions", controllerId + ".foo " + controllerId + ".bar");
				delegator._propagateEvent(target, event);

				expect(spy1).toHaveBeenCalledWith(event, target, {}, "foo");
				expect(spy2).not.toHaveBeenCalled();
			});

		});

		describe("climbs the document tree", function() {

			var ul, li, a;

			beforeEach(function() {
				var tags = ["ul", "li", "a"],
				    tag, child, parent = target;

				while (tag = tags.shift()) {
					child = document.createElement(tag);
					parent.appendChild(child);
					parent = child;
				}

				element.appendChild(target);
				ul = target.firstChild;
				li = ul.firstChild;
				a = li.firstChild;

				spyOn(delegator, "_propagateEvent").and.callThrough();
			});

			it("until delegator.element is reached", function() {
				delegator._propagateEvent(a, event);

				var calls = delegator._propagateEvent.calls.all();

				expect(calls.length).toBe(5);

				expect(calls[0].args[0]).toBe(a);
				expect(calls[0].args[1]).toBe(event);

				expect(calls[1].args[0]).toBe(li);
				expect(calls[1].args[1]).toBe(event);

				expect(calls[2].args[0]).toBe(ul);
				expect(calls[2].args[1]).toBe(event);

				expect(calls[3].args[0]).toBe(target);
				expect(calls[3].args[1]).toBe(event);

				expect(calls[4].args[0]).toBe(element);
				expect(calls[4].args[1]).toBe(event);
			});

			it("until the event is stopped via stopPropagation()", function() {
				a.setAttribute("data-actions", controllerId + ".foo");
				li.setAttribute("data-actions",
					controllerId + ".bar " + controllerId + ".baz");
				ul.setAttribute("data-actions", controllerId + ".foobar");

				var spy1 = jasmine.createSpy(),
				    spy2 = jasmine.createSpy(),
				    spy3 = jasmine.createSpy(),
				    spy4 = jasmine.createSpy();

				controller.foo = function click(event, element, params, action) {
					spy1(event, element, params, action);
				};
				controller.bar = function click(event, element, params, action) {
					event.stopPropagation();
					spy2(event, element, params, action);
				};
				controller.baz = function click(event, element, params, action) {
					spy3(event, element, params, action);
				};
				controller.foobar = function click(event, element, params, action) {
					spy4(event, element, params, action);
				};

				var params = {};
				params[controllerId + ".foo"] = {};
				params[controllerId + ".bar"] = {};

				spyOn(delegator, "_getParams").and.returnValue(params);
				spyOn(delegator, "_invokeAction").and.callThrough();

				delegator._propagateEvent(a, event);

				expect(spy1).toHaveBeenCalledWith(event, a, params[controllerId + ".foo"], "foo");
				expect(spy2).toHaveBeenCalledWith(event, li, params[controllerId + ".bar"], "bar");
				expect(spy3).not.toHaveBeenCalled();
				expect(spy4).not.toHaveBeenCalled();
				expect(event.__isStopped).toBe(true);
			});

		});

		describe("action params", function() {

			beforeEach(function() {
				spyOn(delegator, "_invokeAction");
				target.setAttribute("data-actions", controllerId + ".test");
			});

			it("defaults to an empty object if the data-action-params attribute is missing", function() {
				delegator._propagateEvent(target, event);

				expect(delegator._invokeAction)
					.toHaveBeenCalledWith(controllerId, "test", event, target, {});
			});

			it("is parsed as JSON from data-action-params namespaced to the controllerId and action", function() {
				target.setAttribute("data-action-params",
					'{ "' + controllerId + '.test": { "id": 123 } }');

				delegator._propagateEvent(target, event);

				expect(delegator._invokeAction)
					.toHaveBeenCalledWith(controllerId, "test", event, target, { id: 123 });
			});

		});

	});

	describe("_registerEvent", function() {

		beforeEach(function() {
			element = document.createElement("div");
			delegator = new Oxydizr.FrontController().init(element);
			spyOn(delegator, "_addEvent");
		});

		all("bubbling events are supported",
			[
				"click",
				"keypress",
				"keydown",
				"keyup",
				"mousedown",
				"mouseup",
				"submit"
			],
			function(eventName) {
				delegator._registerEvent(eventName);

				expect(delegator._addEvent).toHaveBeenCalledWith(element, eventName, {
					name: eventName,
					handler: delegator.handleEvent,
					capture: false
				});
			}
		);

		it("detects when the enter key has been pressed using the enterpress event", function() {
			delegator._registerEvent("enterpress");

			expect(delegator._addEvent).toHaveBeenCalledWith(element, "enterpress", {
				name: "keypress",
				handler: delegator.handleEnterpress,
				capture: false
			});
		});

		all("focus and blur events bind to the capturing phase",
			[
				"focus",
				"blur"
			],
			function(eventName) {
				delegator._registerEvent(eventName);

				expect(delegator._addEvent).toHaveBeenCalledWith(element, eventName, {
					name: eventName,
					handler: delegator.handleEvent,
					capture: true
				}
			);
		});

	});

	describe("registerController", function() {

		beforeEach(function() {
			delegator = new Oxydizr.FrontController();
			controller = new MockController();
			spyOn(controller, "onControllerRegistered");
		});

		it("uses the controllerId already on the controller", function() {
			controller.controllerId = "test";

			expect(delegator.registerController(controller)).toBe("test");
			expect(controller.controllerId).toBe("test");
			expect(delegator.controllers.test).toBe(controller);
			expect(controller.onControllerRegistered).toHaveBeenCalledWith(delegator, "test");
		});

		it("generates a controllerId for the controller", function() {
			var controllerId = "1000";
			spyOn(delegator, "_createDelegateId").and.returnValue(controllerId);

			expect(delegator.registerController(controller)).toBe(controllerId);
			expect(controller.controllerId).toBe(controllerId);
			expect(delegator.controllers[controllerId]).toBe(controller);
			expect(controller.onControllerRegistered).toHaveBeenCalledWith(delegator, controllerId);
		});

		it("throws an error if a controller is already registered with that Id", function() {
			controller.controllerId = "test";
			delegator.registerController(controller);

			var controller2 = new MockController();
			controller2.controllerId = "test";

			expect(function() {
				delegator.registerController(controller2);
			}).toThrowError("Cannot register duplicate delegate Id: test");
		});

	});

	describe("_removeEvent", function() {

		beforeEach(function() {
			element = document.createElement("div");
			spyOn(element, "removeEventListener");
			delegator = new Oxydizr.FrontController().init(element);
		});

		it("does not remove the DOM event if it has not been registered", function() {
			delegator._removeEvent(element, "click", {
				name: "click",
				handler: function() {},
				capture: false
			});

			expect(element.removeEventListener).not.toHaveBeenCalled();
		});

		it("removes the DOM event if it has been registered", function() {
			var handler = function() {},
				eventInfo = {
					name: "click",
					handler: handler,
					capture: false
				};

			delegator.events.click = eventInfo;
			delegator._removeEvent(element, "click", eventInfo);

			expect(element.removeEventListener)
				.toHaveBeenCalledWith(eventInfo.name, handler, eventInfo.capture);
			expect(eventInfo.handler).toBe(null);
			expect(delegator.events.click).toBe(null);
		});

	});

	describe("_unpatchEvent", function() {

		beforeEach(function() {
			delegator = new Oxydizr.FrontController();
			event = new Oxydizr.MockEvent("click", document.createElement("div"));
		});

		it("removes the stop method, unwraps the stopPropagation method, and removes __isStopped", function() {
			delegator._patchEvent(event);
			delegator._unpatchEvent(event);

			expect(event.stop).toBe(null);
			expect(event.__stopPropagation).toBe(null);
			expect(event.__stop).toBe(null);
			expect(event.stopPropagation)
				.toBe(Oxydizr.MockEvent.prototype.stopPropagation);
		});

		it("restores the original stop method if one existed", function() {
			var stop = event.stop = function() {};
			delegator._patchEvent(event);
			delegator._unpatchEvent(event);

			expect(event.stop).toBe(stop);
			expect(event.__stop).toBe(null);
		});

	});

	describe("unregisterController", function() {

		beforeEach(function() {
			delegator = new Oxydizr.FrontController();
			controller = new MockController();
			spyOn(controller, "onControllerUnregistered");
		});

		it("returns false if the controllerId is not registered", function() {
			controller.controllerId = "test";

			expect(delegator.unregisterController(controller)).toBe(false);
			expect(controller.onControllerUnregistered).not.toHaveBeenCalled();
		});

		it("returns false if the controllerId is missing", function() {
			expect(delegator.unregisterController(controller)).toBe(false);
			expect(controller.onControllerUnregistered).not.toHaveBeenCalled();
		});

		it("returns true for a registered controller", function() {
			controller.controllerId = "test";
			delegator.registerController(controller);

			expect(delegator.unregisterController(controller)).toBe(true);
			expect(controller.onControllerUnregistered).toHaveBeenCalledWith(delegator);
		});
	});

});
