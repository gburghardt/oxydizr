Oxydizr.FrontController.prototype._addEventListener = function(element, name, handler, capture) {
	if ((name === "focus" || name === "blur") && capture) {
		document.id(element).addEvent(name === "focus" ? "focusin" : "focusout", handler);
	}
	else {
		document.id(element).addEvent(name, handler);
	}
};

Oxydizr.FrontController.prototype._removeEventListener = function(element, name, handler, capture) {
	if ((name === "focus" || name === "blur") && capture) {
		document.id(element).removeEvent(name === "focus" ? "focusin" : "focusout", handler);
	}
	else {
		document.id(element).removeEvent(name, handler);
	}
};