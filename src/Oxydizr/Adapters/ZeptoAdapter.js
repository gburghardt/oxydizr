Oxydizr.FrontController.prototype._addEventListener = function(element, name, handler, capture) {
	if ((name === "focus" || name === "blur") && capture) {
		$(element).bind(name === "focus" ? "focusin" : "focusout", handler);
	}
	else {
		$(element).bind(name, handler);
	}
};

Oxydizr.FrontController.prototype._removeEventListener = function(element, name, handler, capture) {
	if ((name === "focus" || name === "blur") && capture) {
		$(element).unbind(name === "focus" ? "focusin" : "focusout", handler);
	}
	else {
		$(element).unbind(name, handler);
	}
};
