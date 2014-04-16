require(["dojo/dom", "dojo/on"], function(dom, on) {
	Oxydizr.FrontController.prototype._addEventListener = function(element, name, handler, capture) {
		if ((name === "focus" || name === "blur") && capture) {
			handler.__handle__ = on(dom.byId(element), name === "focus" ? "focusin" : "focusout", handler);
		}
		else {
			handler.__handle__ = on(dom.byId(element), name, handler);
		}
	};

	Oxydizr.FrontController.prototype._removeEventListener = function(element, name, handler, capture) {
		handler.__handle__.remove();
		handler.__handle__ = null;
		delete handler.__handle__;
	};
});