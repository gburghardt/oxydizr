Oxydizr.FrontController.prototype._addEventListener = function(element, name, handler, capture) {
	if ((name === "focus" || name === "blur") && capture) {
		Event.attach(name === "focus" ? "focusin" : "focusout", element, handler);
	}
	else {
		Event.attach(name, element, handler);
	}
};

Oxydizr.FrontController.prototype._removeEventListener = function(element, name, handler, capture) {
	if ((name === "focus" || name === "blur") && capture) {
		Event.detach(name === "focus" ? "focusin" : "focusout", element, handler);
	}
	else {
		Event.detach(name, element, handler);
	}
};