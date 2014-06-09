# Oxydizr

Oxydizr is a simple event delegation library for JavaScript that requires no
dependencies. It can be used with any of the popular JavaScript libraries and
frameworks.

## Features

- Utilizes the [Front Controller pattern](http://www.martinfowler.com/eaaCatalog/frontController.html)
  to delegate user actions to methods on one or more "Controller" objects in
  JavaScript
- Only one front controller is required per page, reducing the memory footprint
- Controllers are Object oriented, allowing you to easily use the `this`
  variable without binding it at runtime
- Supports custom param objects passed to the action handlers
- Map JavaScript methods to DOM events based on a convention
- Adapters for the most common libraries, like jQuery, allows Oxydizr to use
  them for event handling instead of native DOM methods.
- Controller objects in JavaScript need only support the `Oxydizr.IController`
  interface defined in `src/interfaces.js`. Otherwise controllers are just
  Plain Old JavaScript Objects. No special parent class is needed.

## Downloading Oxydizr

You can get Oxydizr in one of two ways:

### Using Bower

1. Add Oxydizr to your `bower.json` file:

  ```javascript
  {
      "dependencies": {
          "oxydizr": "~1.0"
      }
  }
  ```

2. Then `bower install`

### From GitHub

Download a fresh copy: https://github.com/gburghardt/oxydizr/archive/master.zip

## Getting Started

Since Oxydizr has no external dependencies, simply include the script files:

```html
<script type="text/javascript" src="path/to/Oxydizr.js"></script>
<script type="text/javascript" src="path/to/Oxydizr/FrontController.js"></script>
```

Next, you'll need to create an instance of Oxydizr.FrontController:

```html
<script type="text/javascript">
    var frontController = new Oxydizr.FrontController().init(document.documentElement);
</script>
```

After that, simply register your controller objects:

```javascript
frontController.registerController(controller);
```

### Controller Objects

Controllers must implement the `Oxydizr.IController` interface in order to be
used with Oxydizr. This interface can be found in `interfaces.js` in this
repository.

To implement the `Oxydizr.IController` interface, your JavaScript class needs to
support the following methods and properties:

- `onControllerRegistered(frontController, controllerId)`: This method is
  invoked by Oxydizr.FrontController when you register a controller object. Use
  this method to tell the front controller which DOM events you want to
  subscribe to.
- `onControllerUnregistered(frontController)`: This method is invoked by
  Oxydizr.FrontController when a controller is unregistered.
- `controllerId` (String): The Id of this controller when registered by
  Oxydizr.FrontController. If this is null, the front controller will generate
  one for this controller.

See `src/Oxydizr/BaseController.js` for a base implementation of this interface.

#### Using Oxydizr.BaseController

You can easily sub class Oxydizr.BaseController:

```javascript
function MyController() {
}

MyController.prototype = Object.create(Oxydizr.BaseController.prototype);

MyController.prototype.foo = function() {};
```

### Building Your First Controller

There are three main steps to start using Oxydizr:

1. Create your controller classes in JavaScript
2. Instantiate Oxydizr.FrontController and register instances of your controller
   classes.
3. The HTML structure used to bridge DOM events and actions on your controllers

First, let's build our Controller, which implements the `Oxydizr.IController`
interface found in `src/interfaces.js`.

```javascript
function SelectionController(element, controllerId) {
    this.element = typeof element === "string" ? document.getElementById(element) : element;
    this.controllerId = controllerId || this.element.id || null;
}

SelectionController.prototype = {

    controllerId: null,

    constructor: SelectionController,

    onControllerRegistered: function(frontController, controllerId) {
        frontController.registerEvents("click");
    },

    onControllerUnregistered: function(frontController) {
        // this controller has been unregistered
    },

    toggleSelection: function click(event, element, params) {
        if (element.classList.contains("selected")) {
            element.classList.remove("selected");
        }
        else {
            element.classList.add("selected");
        }
    }
};
```

Next, we need the HTML in which our controller will handle DOM events, plus some
CSS to style the list items when they get selected. We will create two instances
of SelectionController, so we need two lists:

```html
<head>
    ...

    <style type="text/css">
        .selected {
            background-color: #ffc;
        }
    </style>
</head>
<body>
    <ol id="fruits">
        <li data-actions="fruits.toggleSelection">Apples</li>
        <li data-actions="fruits.toggleSelection">Oranges</li>
    </ol>

    <ul id="colors">
        <li data-actions="colors.toggleSelection">Red</li>
        <li data-actions="colors.toggleSelection">Green</li>
    </ul>
</body>
```

Now, let's create an instance of Oxydizr.FrontController and register our two
instances of SelectionController:

```html
    </ul>

    <script type="text/javascript">
        var frontController = new Oxydizr.FrontController().init(document.documentElement);

        frontController.registerController(new SelectionController("fruits"));
        frontController.registerController(new SelectionController("colors"));
    </script>

</body>
```

That's all you need! Now when you click on the `<li>` tags they should toggle a
yellow background color.

If you want to access the two instances of SelectionController that we
registered, use the following code:

```javascript
frontController.controllers.fruits
frontController.controllers.colors
```

Our SelectionController class will use the Id of its root element as the
`controllerId`. This controllerId is used by Oxydizr to identify that one
controller object, which you can refer to using the `controllers` property.

See `demo/simple.html` for a live example of this code.

### What's Next?

Clone the [repository](https://github.com/gburghardt/oxydizr) and check out the
demos (`demo/index.html`).

## How Event Delegation Works

They key to Oxydizr is Event Delegation. The root element of
Oxydizr.FrontController is where all event handlers are attached. Most events
bubble up the document tree from the target element to the front controller's
root element where Oxydizr takes control. By convention, the
`document.documentElement` object is used as the root element, which is the
`<html>` tag. This object is available from the moment JavaScript begins
executing, so you can instantiate and initialize Oxydizr.FrontController right
away. It also works perfect for event delegation because all HTML tags on the
page are contained in the `<html>` element.

Let's take a "click" event as an example.

### Walkthrough of Delegating a Click Event

The user clicks an image contained inside a link. The document object model tree
for this bubbling event is shown below:

```html
<html>
    <body>
        <form data-actions="blogPost.save">
            <p>
                <a data-actions="slideshow.showFullSizeImage">
                    <img>
```

An instance of Oxydizr.FrontController was created and initialized like this:

```javascript
var frontController = new Oxydizr.FrontController().init(document.documentElement);
```

We have two hypothetical controllers. The psuedo code for each is below:

```javascript
function BlogPostController() {}

BlogPostController.prototype = {
    controllerId: "blogPost",

    constructor: BlogPostController,

    onControllerRegistered: function(frontController, controllerId) {
        frontController.registerEvents("submit");
    },

    save: function submit(event, element, params) {
        // Save the blog post
    }
};

function SlideshowController() {}

SlideshowController.prototype = {
    controllerId: "slideshow",

    constructor: SlideshowController,

    onControllerRegistered: function(frontController, controllerId) {
        frontController.registerEvents("click");
    },

    showFullSizeImage: function click(event, element, params) {
        window.open(element.href, "_blank");
    }
};
```

Then two hypothetical controllers were registered like this:

```javascript
frontController.registerController(new BlogPostController());
frontController.registerController(new SlideshowController());
```

When the user clicks on the `<img>` tag, this becomes the target of the click
event. The `<img>` is notified first of the mouse click. After those event
handlers have been processed, the `<a>` is notified of the click event, then the
`<p>` and so on until the top of the document tree is reached. Only when the
`<html>` tag is notified by the browser of the click event does Oxydizr respond:

1. Oxydizr patches the browser event object, adding a method called `stop()`
   that calls `stopPropagation()` and `preventDefault()`. This is just a
   convenience method which is later removed after Oxydizr has finished
   processing the event.
2. Oxydizr starts at the `event.target` element, which in this case is the
   `<img>` tag. It looks for a `data-actions` attribute. No attribute is found,
   so it goes to `event.target.parentNode`, which is the `<a>` tag.
3. The `<a>` tag is checked for a `data-actions` attribute, and a value is
   found. The value of this attribute is assumed to be a space separated list of
   controller actions to execute. In this scenario, Oxydizr only finds the
   `slideshow.showFullSizeImage` controller action.
4. Given the controller action `slideshow.showFullSizeImage`, Oxydizr assumes
   that `slideshow` is the Id of a registered controller. It finds the
   instance of SlideshowController we registered earlier.
5. Given the controller action `slideshow.showFullSizeImage`, Oxydizr assumes
   that `showFullSizeImage` is the name of a method on SlideshowController.
   Oxydizr then inspects the `name` property on that method to see if matches
   the event type. **This is the critical part.**

  ```javascript
  SlideshowController.prototype = {
      ...
  
      showFullSizeImage: function click(event, element, params) {
          ...
      }
  }
  ```

   Notice how the `showFullSizeImage` method is defined with a named function.
   The `function click` part tells Oxydizr that this method should only be
   executed during a click event. Since Oxydizr is currently processing a click
   event and the `SlideshowController.prototype.showFullSizeImage.name` property
   is "click", Oxydizr proceeds to invoke this method.
6. Oxydizr attempts to extract the `params` for this controller action by
   looking for a `data-action-params` attribute on the `<a>` tag. It finds none,
   so the `params` object passed into `SlideshowController#showFullSizeImage`
   defaults to an empty Object.
7. The `SlideshowController#showFullSizeImage` method is invoked with the
   following arguments:
   - `event`: The browser event currently being processed
   - `element`: The element with the `data-actions` attribute on it. In this
     case, an `<a>` tag.
   - `params`: Arbitrary data parsed from the `data-action-params` attribute on
     the `<a>` tag. Since it does not have this attribute, an empty Object is
     passed instead.
8. If `event.stopPropagation` is not called, Oxydizr then proceeds up the
   document tree from the `<a>` tag, looking for `data-actions` attributes.
9. It comes across the `<form>` tag, which has a `data-actions` attribute value
   of "blogPost.save". Oxydizr finds our instance of BlogPostController that we
   registered using "blogPost" as the `controllerId`. It finds a method on this
   controller called "save".
10. Oxydizr inspects the `BlogPostController#save` method and finds that its
    `name` property is "submit". The event type is "click", so Oxydizr does not
    invoke this controller action.
11. Oxydizr proceeds up the document tree until it reaches the top and stops
    processing the "click" event.

## Action Params

Action Params are passed to each controller method when an action is executed.
Params are just a plain old JavaScript object, which is taken from the
`data-action-params` attribute on the HTML tag that has the `data-actions`
attribute. The `data-action-params` contains a JSON string passed to
`JSON.parse`. If this attribute is missing, then an empty Object is passed to
the controller action method.

The `data-action-params` must be structured in the following way:

```javascript
{
    "controllerId1.methodName": {
        ...
    },
    "controllerId2.methodName": {
        ...
    }
}
```

Since every HTML element can have multiple controller actions associated with
it, the params passed to each controller method should be namespaced to the
`controllerId` followed by a dot and the name of the method. Let's say we have
this HTML tag:

```html
<button
    data-actions="blogPost.save slideshow.save"
    data-action-params='{
        "blogPost.save": {
            id: 85
        },
        "slideshow.save": {
            blogPostId: 85,
            id: 482
        }
    }'
>Save</button>
```

The "Save" button executes two controller actions on two different controllers.

The `params` passed to the `save` method on the "blogPost" controller is the
value of the "blogPost.save" property. The `save` method on the "slideshow"
controller is the "slideshow.save" property. Let's look at the pseudo JavaScript
code for each controller:

```javascript
function BlogPostController() {}

BlogPostController.prototype = {
    controllerId: "blogPost",

    constructor: BlogPostController,

    save: function click(event, element, params) {
        console.log(params);
    }
};

function SlideshowController() {}

SlideshowController.prototype = {
    controllerId: "blogPost",

    constructor: SlideshowController,

    save: function click(event, element, params) {
        console.log(params);
    }
};
```

Clicking the "Save" button will pass the following values to
`BlogPostController#save`:

- event = The browser "click" event object
- element = `<button>`
- params = `{ id: 85 }`

The following values get passed to `SlideshowController#save`:

- event = The browser "click" event object
- element = `<button>`
- params = `{ id: 482, blogPostId: 85 }`

## Special Events

Most DOM events bubble, like "click" and "keypress". There are two events that
must be treated differently either because the event does not bubble, or because
a DOM event needs to be filtered in a common way.

### The `enterpress` Event

If we disconnect from JavaScript for a moment and think of how forms in HTML can
be submitted, you'll see that there are two ways a user submits a form:

- Clicking a "Submit" button
- Pressing the ENTER key while focus is on a text box

Responding to the "submit" event is easy. If you do not have a `<form>`, then no
submit event will ever be triggered, even if the user presses the ENTER key
while focus is on a text field. The special "enterpress" event in Oxydizr was
created to handle this situation.

The `enterpress` event is really just another `keypress` event listener, but it
uses a different event handler function on Oxydizr.FrontController. This event
handler inspects the `event.keyCode` property, and if it is `13` then Oxydizr
proceeds to execute actions found in the `data-actions` attribute.

### The `focus` and `blur` Events

These two events do not bubble up the document tree. In order to respond to a
`focus` event, you must bind an event handler directly to the element that emits
this event. This breaks the Event Delegation of Oxydizr. The `focusin` event is
a bubbling form of the focus event, and focusout is the bubbling form of the
blur event. Browser support is spotty for these events, so Oxydizr patches this
behavior by attaching a focus or blur event handler as a capturing event.

## Adapters for Popular JavaScript Frameworks and Libraries

Even though Oxydizr does not require outside dependencies, frameworks like
jQuery patch many browser inconsistencies with how events are processed. As a
result, we've created Adapters that allow the event handling in Oxydizr to be
done through many of the popular libraries out there.

For example, if you are using jQuery and would like Oxydizr to use jQuery for
event handling, add these script files to your document:

```html
<script type="text/javascript" src="path/to/Oxydizr.js"></script>
<script type="text/javascript" src="path/to/Oxydizr/FrontController.js"></script>
<script type="text/javascript" src="path/to/Oxydizr/Adapters/jQueryAdapter.js"></script>
```

That's all you need to do. Now the `event` object that gets passed into your
controller actions will have been patched by jQuery.

### Creating Your Own Adapters

If you do not see an Adapter that fits your needs, use this boiler plate code
to create your own:

```javascript
Oxydizr.FrontController.prototype._addEventListener: function(element, name, handler, capture) {
    if ((name === "focus" || name === "blur") && capture) {
        // listen for focus or blur events
    }
    else {
        // listen for other events
    }
};

Oxydizr.FrontController.prototype._removeEventListener = function(element, name, handler, capture) {
    if ((name === "focus" || name === "blur") && capture) {
        // unbind from focus or blur events
    }
    else {
        // unbind other events
    }
};
```

Save your Adapter in a separate JavaScript file and include it after
FontController.js.

## Controller Best Practices

When creating controllers for use with Oxydizr, consider these best practices:

- Controllers should have a constructor that takes no arguments
- Controllers should only care about a small section of the web page, and have
  access to a root element, which may not be the same as the root element of the
  Front Controller
- All controllers should specify their own `controllerId`'s. If you need more
  than one instance of a particular controller on the page, consider setting the
  `controllerId` based on the Id of the controller's root element.

## Error Handling

Oxydizr gives you finer grained control over error handling when processing DOM
events. By default, error handling is turned off. If a controller action throws
an error, it is allowed to bubble up and the DOM event is not canceled. By
setting the `catchErrors` property on Oxydizr.FrontController to `true`, you
will have access to two levels of error handling.

```javascript
var frontController = new Oxydizr.FrontController().init(document.documentElement);

// Handle errors thrown when executing controller actions
frontController.catchErrors = true;
```

### Error Handling at the Application Level

You can designate one Object in your application to handle all errors thrown
while executing controller actions. This is the `errorHandler` property, which
is any object that supports the Oxydizr.IErrorHandler interface in
`src/interfaces.js`. The object must support a single method called
`handleActionError`, which takes the following arguments:

1. error (Error): The error thrown
2. event (Event): The browser event in which the error was thrown
3. element (HTMLElement): The DOM node that was the focus of the controller action
4. params (Object): The params passed into the controller action
5. action (String): The name of the action being executed
6. controller (Oxydizr.IController): The controller that threw this error
7. controllerId (String): The Id of the controller registered in the front controller

This gives you a central location to handle all errors. By default, Oxydizr
comes with a global error handler that just logs the arguments to the browser's
console.

If this method returns `true` then Oxydizr assumes the error has been handled.
If `false` is returned, Oxydizr will rethrow the error;

### Error Handling at the Controller Level

If you want to do error handling specific to a controller, make sure your
controller objects support the Oxydizr.IControllerErrorHandler interface in
`src/interfaces.js`. Your controller must implement a method called
`handleActionError` which takes the following arguments:

1. error (Error): The error thrown
2. controller (Oxydizr.IController): The controller that threw this error
3. event (Event): The browser event in which the error was thrown
4. element (HTMLElement): The DOM node that was the focus of the controller action
5. params (Object): The params passed into the controller action
6. action (String): The name of the action being executed
7. controllerId (String): The Id of the controller registered in the front controller

If this method returns `true` then Oxydizr assumes the error has been handled.
If `false` is returned, Oxydizr will rethrow the error;

## Browser Support

Without an Adapter, Oxydizr supports these browsers:

- Internet Explorer 9+
- Firefox
- Chrome
- Safari

The only real limitation is browser support for the `addEventListener` and
`removeEventListener` methods on DOM nodes.

If you choose an Adapter, for instance the jQuery Adapter, then Oxydizr supports
any browser that jQuery supports.

## Notes About JavaScript Minification

There is a known issue with some JavaScript minifiers that will cause
controllers defined in minified code to stop responding to DOM events. If you
recall from earlier, Oxydizr looks at a controller method's name to know if the
method should be invoked for a certain event type. If a JavaScript minifier
takes this code:

```javascript
var someFunction = function foo() {};
```

And turns it into:

```javascript
var a = function() {};
```

The `function foo()` part is what gives that Function object its name, and
removing that essentially changes runtime data in JavaScript. Oxydizr will fail
in this scenario. This is an issue that needs to be addressed in the JavaScript
minifier.

## Contributing

1. Fork the repository at GitHub: https://github.com/gburghardt/oxydizr
2. Clone your fork
3. Create a feature branch in Git
4. Commit your changes and push your branch
5. Submit a [pull request](https://github.com/gburghardt/oxydizr/pulls)
