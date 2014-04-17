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

        {
            "dependencies": {
                "oxydizr": "~1.0"
            }
        }

2. Then `bower install`

### From GitHub

Download a fresh copy: https://github.com/gburghardt/oxydizr/archive/master.zip

## Getting Started

Since Oxydizr has no external dependencies, simply include the script files:

    <script type="text/javascript" src="path/to/Oxydizr.js"></script>
    <script type="text/javascript" src="path/to/Oxydizr/FrontController.js"></script>

Next, you'll need to create an instance of Oxydizr.FrontController:

    <script type="text/javascript">
        var frontController = new Oxydizr.FrontController().init(document.documentElement);
    </script>

After that, simply register your controller objects:

    frontController.registerController(controller);

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

    function MyController() {
    }

    MyController.prototype = Object.create(Oxydizr.BaseController.prototype);

    MyController.prototype.foo = function() {};

### Building Your First Controller

There are three main steps to start using Oxydizr:

1. Create your controller classes in JavaScript
2. Instantiate Oxydizr.FrontController and register instances of your controller
   classes.
3. The HTML structure used to bridge DOM events and actions on your controllers

First, let's build our Controller, which implements the `Oxydizr.IController`
interface found in `src/interfaces.js`.

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

Next, we need the HTML in which our controller will handle DOM events, plus some
CSS to style the list items when they get selected. We will create two instances
of SelectionController, so we need two lists:

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

Now, let's create an instance of Oxydizr.FrontController and register our two
instances of SelectionController:

        </ul>

        <script type="text/javascript">
            var frontController = new Oxydizr.FrontController().init(document.documentElement);

            frontController.registerController(new SelectionController("fruits"));
            frontController.registerController(new SelectionController("colors"));
        </script>

    </body>

That's all you need! Now when you click on the `<li>` tags they should toggle a
yellow background color.

If you want to access the two instances of SelectionController that we
registered, use the following code:

    frontController.controllers.fruits
    frontController.controllers.colors

Our SelectionController class will use the Id of its root element as the
`controllerId`. This controllerId is used by Oxydizr to identify that one
controller object, which you can refer to using the `controllers` property.

See `demo/simple.html` for a live example of this code.

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

    <html>
        <body>
            <form data-actions="blogPost.save">
                <p>
                    <a data-actions="slideshow.showFullSizeImage">
                        <img>

An instance of Oxydizr.FrontController was created and initialized like this:

    var frontController = new Oxydizr.FrontController().init(document.documentElement);

We have two hypothetical controllers. The psuedo code for each is below:

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

Then two hypothetical controllers were registered like this:

    frontController.registerController(new BlogPostController());
    frontController.registerController(new SlideshowController());

When the user clicks on the `<img>` tag, this becomes the target of the click
event. The `<img>` is notified first of the mouse click. After those event
handlers have been processed, the `<a>` is notified of the click event, then the
`<p>` and so on until the top of the document tree is reached. Only when the
`<html>` tag is notified by the browser of the click event does Oxysizr respond:

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

        SlideshowController.prototype = {
            ...

            showFullSizeImage: function click(event, element, params) {
                ...
            }
        }

   Notice how the `showFullSizeImage` method is defined with a named function.
   The `function click` part tells Oxydizr that this method should only be
   executed during a click event. Since Oxydizr is currently processing a click
   event and the `Slideshow.prototype.showFullSizeImage.name` property is
   "click", Oxydizr proceeds to invoke this method.
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

## Special Events

### The `enterpress` Event

### The `focus` and `blur` Events

## Controller Best Practices

## Error Handling

### Error Handling at the Application Level

### Error Handling at the Controller Level

## Adapters for Popular JavaScript Frameworks and Libraries

### Creating Your Own Adapters
