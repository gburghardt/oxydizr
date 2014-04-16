Oxydizr.FrontController.prototype._addEventListener = function(element, name, handler, capture) {
	if ((name === "focus" || name === "blur") && capture) {
		$(element).listen(name === "focus" ? "focusin" : "focusout", handler);
	}
	else {
		$(element).listen(name, handler);
	}
};

Oxydizr.FrontController.prototype._removeEventListener = function(element, name, handler, capture) {
	if ((name === "focus" || name === "blur") && capture) {
		$(element).stopListening(name === "focus" ? "focusin" : "focusout", handler);
	}
	else {
		$(element).stopListening(name, handler);
	}
};