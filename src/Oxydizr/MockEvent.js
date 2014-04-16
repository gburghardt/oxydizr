Oxydizr.MockEvent = function MockEvent(type, target) {
	this.type = type;
	this.target = target;
};

Oxydizr.MockEvent.prototype = {
	target: null,
	type: null,
	constructor: Oxydizr.MockEvent,
	preventDefault: function() {},
	stopPropagation: function() {}
};