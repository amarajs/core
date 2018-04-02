## [@amarajs/core](https://github.com/amarajs/core)

Provides feature-based development using an extensible plugin-based targeting system.

> __IMPORTANT!__  
> AmaraJS is an early alpha release.  
> Bug reports and general feedback are welcome.

### Amara in Action

Sample App: https://amarajs.github.io  
jsFiddle: https://jsfiddle.net/04f3v2x4

### Why AmaraJS?

Developers write features. These features are often bundled together into some kind of container, such as a class or a component. There are best practices for object-oriented and functional programming, such as composition, to keep code as decoupled and maintainable as possible. But even following best practices can result in ever-increasing technical debt due to real-world changing requirements.

For example, let's say you implemented a button component. You try to make it as "dumb" as possible, even using pure functions, so that its behavior depends entirely on properties passed to it by a "smarter" consumer. You've just completed coding and delivered your component to other developers. That's when the feature requests start coming in:

 - Can we add theme support?
 - Can we use different themes based on where the button is in the DOM?
 - Can we send click events to Google Analytics automatically?
 - Can we send different values to GA based on where the button is in the DOM?
 - Can we show a loading treatment tied to an asynchronous action?
 - Can we add standard keyboard shortcuts to buttons when they're in dialogs?
 - Can we automatically add ARIA attributes based on all the above features?

There are good design approaches to implement all of these features, but they all require either modifying or wrapping the button's existing DOM structure, event handlers, lifecycle methods, and/or CSS styling. Composition is great, but it shouldn't be the only tool in our toolbox.

### Every single line of code is technical debt.

All code is technical debt, but that's not the code's fault - it's our fault for how we group our code together. Even the best-designed code often ends up tightly coupled over time as new features are weaved into existing functionality.

With that in mind, our goals as developers should be:

1. Write the minimum amount of code required to deliver a feature.
2. Implement one (and only one) feature in each unit of code we deliver.
3. Only change existing code when fixing bugs.

Ideally, we could just write _features_, not classes or components.

### __AmaraJS__ is about writing features.

Developers in AmaraJS write a feature by specifying a target (a DOM node in the case of a web application), the feature output (e.g. a set of CSS classes to apply), and any optional conditions that might affect the feature output (such as whether an asynchronous operation is still in progress).

Whenever an element in the DOM matches the feature's target &mdash; or whenever the inputs to the feature change &mdash; the associated code will be re-evaluated. If the results have changed, they will be applied to the target using the appropriate plugin middleware.

_(If that doesn't make sense now, don't worry &mdash; you'll be an Amara expert soon enough!)_

In other words, features written in AmaraJS assemble themselves automatically. There's no need for a component or a class to group features together. That side-steps many of the potential bugs that come from trying to integrate new features into existing code.

### AmaraJS is platform agnostic

Although primarily intended for web-based application development, `@amarajs/core` is platform agnostic and can run anywhere JavaScript can run, including NodeJS environments.

The responsibility for connecting core Amara functionality to a specific environment is done using  "engine" middleware. All features developed in Amara will have one or more "targets" they apply to, and it's the engine's job to manage targets appropriately for its given platform.

### AmaraJS uses existing standards.

Features in AmaraJS that target web browsers use normal HTML DOM, CSS, and Events under the hood. There's no framework magic you need to understand, no dependency injection, no arcane lifecycles with "gotchas" you have to remember, etc.

That also means AmaraJS can be dropped into any existing website without impacting current frameworks. If you wanted to add keyboard navigation to an existing Angular, Vue, or React component, you could do so without modifying that component's code. Just write your feature to target the component's DOM and AmaraJS will apply the new functionality for you.

### Installation

`npm install --save @amarajs/core`

### Usage

To create a new AmaraJS instance, simply pass an array of middleware to the Amara constructor.

```javascript
import Amara from '@amarajs/core';
const amara = new Amara([/* plugin middleware */]);
```

__NOTE:__ A quick introduction to AmaraJS middleware can be found further down in this document.

Once you have an Amara instance, you can bootstrap it by passing in an initial target. In web environments, this would be the "root" DOM element that will house your application.

```javascript
amara.bootstrap(/* target */));
```

You can even "nest" Amara instances when necessary (like in portal sites) and have different instances handle different features. For example, the parent instance's features would apply to all content, but the child instance's features would only apply to the DOM subtree where it was bootstrapped.

### API

Each `Amara` instance has 3 methods:

method | arguments | description
--- | --- | ----
`add` | `Object` | Registers the specified feature with `@amarajs/core`. The argument should be a valid AmaraJS feature object. The required and optional properties are outlined later in this document. You can call `add` at any time, before or after bootstrap or configuration.
`config` | `String`, `Function` | Registers a configuration method to further control how AmaraJS works with features. The currently configurable options are `"filter"` and `"sorter"`. Examples are below.
`bootstrap` | `any` | Initializes AmaraJS with the given target. The target type to provide depends on which `engine` middleware you provided to the `Amara` constructor. For example, [`@amarajs/plugin-engine-browser`](https://github.com/amarajs/plugin-engine-browser) expects a DOM node.

Each method returns the `Amara` instance to enable chaining:

```javascript
const amara = new Amara([/* middleware */])
    .config('sorter', /* sort function */)
    .config('filter', /* filter function */)
    .add(/* feature 1 */)
    .add(/* feature 2 */)
    .bootstrap(/* target */);
```

#### Configuration Functions

You can further customize your `Amara` instance by providing any number of optional configuration functions, including __filter__ and __sorter__ methods.

Each feature added to your `Amara` instance has 3 required properties (and 1 optional property), but you can also add any number of custom properties to the features you write. Combining custom properties with configuration functions enables you to control how your features are applied at run-time.

```javascript
// sorting features by a custom `priority` property:
amara.config('sorter', (lhs, rhs) => rhs.priority - lhs.priority)
```

```javascript
// filtering out "disabled" features:
amara.config('filter', (feature) => !('enabled' in feature) || feature.enabled)
```

If you specify multiple config functions of each type, they will be invoked in the order they were registered:

```javascript
amara
    // this runs first:
    .config('sorter', (lhs, rhs) => rhs.priority - lhs.priority)
    // and then this runs:
    .config('sorter', (lhs, rhs) => Math.random()) // don't do this
```

### Plugin Middleware

There is a growing list of Amara middleware available for use. Standard middleware includes:

 - [`@amarajs/plugin-engine-browser`](https://github.com/amarajs/plugin-engine-browser)  
 Provides `@amarajs/core` with functionality related to DOM nodes, for use in web-based applications.
 - [`@amarajs/plugin-css`](https://github.com/amarajs/plugin-css)  
 Attach CSS styles and class names to DOM nodes.
 - [`@amarajs/plugin-dom`](https://github.com/amarajs/plugin-dom)  
 Add HTML to DOM nodes.
 - [`@amarajs/plugin-events`](https://github.com/amarajs/plugin-events)  
 Attach event handlers to DOM nodes.
 - [`@amarajs/plugin-redux`](https://github.com/amarajs/plugin-redux)  
 Dispatch actions against a Redux store.
 - [`@amarajs/plugin-router`](https://github.com/amarajs/plugin-router)  
 Dynamic client-side routing, including nested and sibling routes.

### Developing Features

Once you've registered the middleware you want with your Amara instance, you can begin developing features. Features are just object literals. Out of the box, every feature has 3 required properties and 1 optional property:

property | type | required | description | example
--- | --- | --- | --- | ---
type | `String` | `true` | Each middleware specifies the `type` value it handles. | `"css"`<br>`"dom"`<br>`"events"`
targets | `String[]` | `true` | An array of target selector strings. The `engine` plugin you choose determines how these selectors are handled. For example, the [`@amarajs/plugin-engine-browser`](https://github.com/amarajs/plugin-engine-browser) plugin expects CSS selectors. | `["#main"]`<br>`['input[type="button"]']`<br>`['a[href^="#"]']`
apply | `Function` | `true` | A function that returns whatever values the middleware type expects. For example, [`@amarajs/plugin-events`](https://github.com/amarajs/plugin-events) expects a map of event names to handlers. | (see plugin documentation)
args | `Object` | `false` | A map of argument names to selector functions. The value returned by the selector function will be passed to your `apply` function in an object literal, along with any other arguments you specify. | (see example below)

Each feature is also given an `id` number when added that is used internally to ensure features are applied in the order they were added. If you specify your own `id` property, it will be overwritten by Amara.

#### Example #1

```javascript
// conditionally add a loading class to any DOM
// nodes with a `progress` attribute, but only
// when the application state says we are loading
amara.add({
    type: 'class', // from @amarajs/plugin-css
    targets: ['[progress]'],
    args: {
        // NOTE: the `state` param is provided
        // by the `@amarajs/plugin-redux` middleware
        isLoading: ({state}) => state.loading
    },
    apply: function getClassNames({ isLoading }) {
        // the @amarajs/plugin-css middleware tells
        // us what to return, either an array of
        // active class names or an object whose
        // keys are class names and whose boolean
        // values determine if the class is active
        return isLoading ? ['loading'] : [];
        // or:
        return {loading: isLoading};
    }
});
```

#### Example #2

```javascript
// open a help panel anytime a link with a help
// topic is clicked; use event delegation because
// we care about app performance
amara.add({
    type: 'events', // from @amarajs/plugin-events
    targets: ['main'], // use event delegation
    apply: () => ({
        // we can use selectors to ensure our handler
        // only fires for clicks on a DOM node matching
        // the given CSS selector (in this case, any
        // anchor elements with a "help-topic" attribute)
        'click a[help-topic]': function helpWanted(e) {
            const topic = e.target.getAttribute('help-topic');
            // use an action creator to dispatch a
            // router:navigate event targeting the #help
            // container, with whatever help-topic was
            // specified on the link as the route path
            e.dispatch(navigate('#help', `topics/${topic}`));
            // the URL hash will now look like:
            // #!#help://topics/<whatever topic>
            // see the `@amarajs/plugin-router` documentation
            // for details
            e.preventDefault(); // cancel normal anchor behavior
            e.stopPropagation(); // stop bubbling this event
        }
    })
});
```

In the example above, the associated help feature might look like this:

```javascript
// register the #help element as a recipient of
// routes matching the "topics/:topic" pattern
amara.add({
    type: 'route', // from @amarajs/plugin-router
    targets: ['#help'],
    // when route tokens are used, the router plugin
    // will provide a `routeParams` object to your
    // args map selector functions, so you can inspect
    // the value and provide it to your apply functions
    apply: () => ['topics/:topic']
});

// we can hard-code HTML content for when the route
// is "topics/amarajs". this approach might be useful
// in a siloed environment where teams are responsible
// for providing help content for their specific areas
amara.add({
    type: 'dom', // from @amarajs/plugin-dom
    targets: ['#help[route="topics/amarajs"]'],
    apply: () => h('div', `Information about AmaraJS`)
});

// or, we could use the `routeParams` object to make
// our help content a bit more dynamic. to do so, we'll
// provide our content when the help container's route
// attribute starts with "topics/"; we're going to grab
// the desired topic from the routeParams object, and
// then provide that topic to our apply function, so it
// can pull the associated help message from our static
// content map (or else show a default message if no help
// content was found)
import content from 'assets/content/help';
amara.add({
    type: 'dom',
    targets: ['#help[route^="topics/"]'],
    args: {topic: ({routeParams}) => routeParams.topic},
    apply: ({topic}) => content[topic] || 'No help found!'
});
```

Hopefully, you're starting to see the power of the AmaraJS approach. Adding a contextual help system didn't require modifying any existing code. We simply grafted our feature onto the existing site.

We could even have gone further by dynamically adding `[help-topic]` attributes onto specific DOM elements when we had help topics available for those areas -- again, without modifying existing code or changing our current components' HTML.

The same process applies to all development in AmaraJS: implement your new feature using a combination of plugins &mdash; specifying your target selectors and any dynamic inputs &mdash; and everything will be applied for you automatically.

Later on &mdash; once we learn more about how everything works together &mdash; we'll show another example of how to use AmaraJS to code some neat functionality. But first, let's talk about _middleware_.

### Plugin Middleware

Put simply, plugin middleware provides cross-cutting functionality to the features that you write.

If the standard plugin middleware doesn't meet your needs (and if you can't find appropriate middleware already developed by the community) then it's easy to write your own. In fact, we're going to write our own Google Analytics middleware a bit later on.

But first, here's the standard plugin middleware template:

```javascript
export default function MyMiddleware(options) {

    // if you want to let the consumer configure your
    // middleware (e.g. by providing an API key), they
    // should do so using an `options` object. make
    // sure your documentation specifies the available
    // configuration values and their defaults

    return function createHandler(dispatch) {

        // if you want to dispatch actions to other
        // plugin middleware, use the `dispatch`
        // function passed here by `@amarajs/core`

        return function handler(action) {

            // actions dispatched by the user, by
            // AmaraJS, or by other plugins will be
            // sent here for optional handling

            // the one action you will probably want
            // to handle is "core:apply-target-results",
            // which is what links your plugin "type"
            // with a target (provided by the engine)
            // and the return values of any `apply`
            // methods that matched the target. the
            // action payload is an object literal
            // whose keys are plugin types (e.g. "css"
            // or "events") and whose values are of type
            // Map<Target, ApplyResults[]>

            switch(action.type) {
            case 'core:apply-target-results':
                if (MY_PLUGIN_TYPE in action.payload) {
                    action.payload[MY_PLUGIN_TYPE].forEach(
                        function applyResults(results, target) {
                            // ... your code here ...
                        });
                }
                break;
            }

        };

    };

}
```

#### Middleware Actions

Amara dispatches various actions that plugin middleware can listen and respond to.

action.type | action.payload | purpose
--- | --- | ---
`"core:bootstrap"` | `{`<br>&nbsp;&nbsp;`target,`<br>&nbsp;&nbsp;<nobr>`register: (string, fn) => fn`</nobr><br>`}` | Notifies middleware of the bootstrapped target, and provides a method middleware can use to register one (and only one) "argument provider" function for a given key.<p>The provider should accept a single argument, `target`, and should return the value that will be provided to a feature's `args` selector method for the specified key. See `@amarajs/plugin-router`'s [source code](https://github.com/amarajs/plugin-router) for an example.<p>When invoked, the register method returns a function that middleware can invoke to un-register the provider method.
`"core:features-added"` | `Set<feature>` | Notifies middleware that the user has added one or more features to the amara instance.
`"core:change-occurred"` | `string` | Usually dispatched by middleware to notify the AmaraJS instance that it should re-evaluate any features which accessed the specified `args` key. This is usually fired by the same middleware which registered an "argument provider" method during `core:bootstrap`.
<nobr>`"core:populate-feature-targets"`</nobr> | `Map<feature, Set<any>>` | The AmaraJS instance has identified some features which need to be re-applied, and would like the "engine" plugin to add the appropriate targets to the given Set.
`"core:enqueue-apply"` | `Array<{feature, target}>` | Usually fired by "engine" middleware to notify the AmaraJS instance exactly which features and targets need to be re-applied at the end of the current frame.
`"core:apply-target-results"` | `Map<target, any[]>` | Sent to middleware so they can apply the given array of feature `apply` methods results to the specified target. For example, [`@amarajs/plugin-dom`](https://github.com/amarajs/plugin-dom) receives an array of VirtualDOM nodes and will apply them to the target HTML node in order.
`"error"` | `Error` | An error occurred in a middleware handler while dispatching an action. Because middleware may operate as a pipeline, subsequent middleware handlers will _not_ be invoked for the given action.

### Developing Abstractions for AmaraJS

No one likes boilerplate &mdash; writing the same code over and over is tedious. And while each feature object only has 3 required properties, you may find yourself wanting some way to reduce your typing. (Or maybe you just don't want to remember if the `targets` property expects a string or a string array.)

We prefer to leave this kind of abstraction up to the consumers and community. That said, here are 2 approaches we've seen used or considered on various AmaraJS projects.

#### Factory Method

```javascript
// utils.js

const factory = (type) => (targets, args, apply) => ({
    type,
    args: apply ? args : {},
    apply: apply ? apply : args,
    targets: Array.isArray(targets) ? targets: [targets]
});

export const dom = factory('dom');
export const css = factory('class');
export const style = factory('style');
export const events = factory('events');
export const routes = factory('route');
```

This lets you write code like:

```javascript
import { dom, routes } from 'utils';

amara
    .add(routes('#main', () => ['topics/:topic']))
    .add(dom(
        '#main [route^="topics/"]',
        {
            topics: ({state}) => state.topics,
            topic: ({routeParams}) => routeParams.topic
        },
        ({topics, topic}) => topics[topic] || `No topic.`
    ));
```

#### Decorators

Some developers may still prefer to group their features into classes. Class members could integrate with AmaraJS using decorators. Under the hood, those decorators would simply construct the object literals, stitching together the class target selector with optional selectors on plugin decorators.

```javascript
import { targets, connect, routes, dom } from '@amarajs/decorators';

@targets('#main')
export default class Topics {

    @routes()
    function getRoutes() {
        return ['topics/:topic'];
    }

    @connect({
        topics: ({state}) => state.topics,
        topic: ({routeParams}) => routeParams.topic
    })
    @dom('&[route^="topics/"]')
    function getDOM({topics, topic}) {
        return topics[topic];
    }

}
```

__If you implement a decorator library for AmaraJS, let us know and we will link to it here.__

### Best Practices

#### #1: Simplify your `args` selectors.

For performance reasons, AmaraJS monitors each feature's `args` map to determine which middleware-provided parameters are accessed the first time each selector is invoked. This allows Amara to limit feature re-application only to when those specific properties change.

For example, if your feature's `args` map never accesses `routeParams`, but [`@amarajs/plugin-router`](https://github.com/amarajs/plugin-router) notified Amara that the `routeParams` had changed, then Amara won't re-invoke your feature's `apply` method.

Accordingly, your features' `args` maps should be written to avoid conditional access to map properties. For example, code like this should be avoided because it conditionally accesses the `state` property provided by [`@amarajs/plugin-redux`](https://github.com/amarajs/plugin-redux):

```javascript
amara.add({
    type: 'whatever',
    targets: ['something'],
    args: {
        myArg: ({state, routeParams}) => {
            if (routeParams.someKey) {
                return state.propA;
            }
            return null;
        }
    },
    apply: ({myArg}) => {}
});
```

Instead, a better `args` selector eliminates the conditional access:

```javascript
amara.add({
    type: 'whatever',
    targets: ['something'],
    args: {
        myArg: ({state, routeParams}) => {
            const key = routeParams.someKey;
            const prop = state.propA;
            return key ? prop : null;
        }
    },
    apply: ({myArg}) => {}
});
```

That said, an even _better_ approach is to isolate each selector, allowing for composition and re-use through a library like [reselect](https://github.com/reactjs/reselect):

```javascript
import { createSelector: select } from 'reselect';

const prop = ({state}) => state.propA;
const key = ({routeParams}) => routeParams.someKey;

const myArg = select(key, prop, (k, p) => {
    return k ? p : null;
});

amara.add({
    type: 'whatever',
    targets: ['something'],
    args: { myArg },
    apply: ({myArg}) => {}
});
```

#### #2: Export your target selector strings.

This one takes a cue from Redux, where the best practice is to export action types and selector functions. There are obvious benefits to defining your constants once and simply importing them where needed. The same rationale applies to target selector strings in AmaraJS:

```javascript
// targets.js
export const HelpPanel = ['#help'];
export const ProgressIndicators = ['div[progress]'];

// my-feature.js
import { ProgressIndicators } from 'targets';

amara.add({
    type: 'dom',
    targets: ProgressIndicators,
    apply: () => `progress html`
});
```

Where and how you export target selectors is up to you. Some developers prefer a single "targets.js" file where all selectors are defined. Others may prefer to export selectors closer to where their features are coded.

#### #3: Structure your project by feature, not by component.

Modern web applications tend to use component-driven development. Of course, you can do something similar with AmaraJS; however, developing individual features opens up additional options for structuring large projects.

For example, developers in an Agile environment might be assigned user stories representing the features they need to develop for their next release. In that setup, you may want to write each feature in a separate file, perhaps named using the story id number:

    assets/
        svg/
        lang/
    features/
        FEAT-120.js
        FEAT-142.js
        FEAT-153.js
        ...
        FEAT-398.js
        FEAT-402.js

Of course, this approach has tradeoffs. You lose the benefit of meaningful folder and file names. However, you do gain some advantages. The primary benefit of this organization is that loose feature couping is enforced by default (remember developer goal #2?).

It also opens up some interesting _tangential_ possibilities:

 - tighter integration with issue trackers
 - easily identify which features are in your environments
 - implement server-side feature switches on a per-story basis

We're extremely curious to see what kinds of tooling become possible once feature-based coding is more common.

#### #4: "Smart" vs. "dumb" still applies.

In component-driven development, "dumb" components depend only on the properties passed to them while "smart" components also depend on application state. Of course, in AmaraJS, we don't write components &mdash; we write features. But the same principles apply.

A "smart" feature is one with an `args` map, whose selector functions' return values are piped into the `apply` function as inputs. A "dumb" feature has no `args` map; accordingly, its `apply` function takes no inputs.

Not surprisingly, you should follow the industry standard of preferring "dumb" features as much as possible, not just because it encourages re-usability, but also because AmaraJS can optimize features that have no `args` map by caching and reusing the first results returned from the `apply` function.

#### #5: Place cross-cutting business logic in middleware.

In MVC and component-driven development, a controller typically imports shared functionality, either through dependency injection or module imports. In Redux-connected components, they might simply dispatch an action and rely on a reducer or async middleware to handle it.

Each approach bypasses the browser's own built-in event system and so misses out on some neat possibilities.

If you're using [`@amarajs/plugin-events`](https://github.com/amarajs/plugin-events), any DOM event dispatched from your handler will eventually bubble up to the node you used to bootstrap your `Amara` instance. When this happens, the middleware will automatically route that event through `Amara` as an action, enabling your other middleware to respond to that action in turn. For example, [`@amarajs/plugin-redux`](https://github.com/amarajs/plugin-redux) will further route that action to your Redux store, at which point your reducers, saga middleware, or thunks could execute their business logic.

DOM events should be preferred over dependency injection and direct Redux dispatches whenever possible so that any DOM nodes between the dispatching node and the bootstrap node can interact with the event (or cancel it entirely), _before_ it reaches your other AmaraJS middleware.

Doing so opens up some interesting opportunities. For example, features targeting the intervening DOM nodes could:

 - attach contextual information to a logging event
 - cancel Redux actions originating from disabled screen areas
 - open a contextual help panel when an error occurs inside a specific screen area
 - flush tracking data to a server when an e-commerce purchase occurs

Placing your cross-cutting logic in middleware enables DOM event interception, opening up a whole new layer of extension points and context-aware feature enhancements.

But enough talk. Let's code something!

### Amara in Action: Sample Use Case

Remember that hypothetical request for our button component? They wanted to track click events in Google Analytics differently depending on where the button was on the screen. Let's see how we might implement that feature using the best practices we just learned.

First, we're going to place our cross-cutting logic in a new middleware plugin. We could publish this plugin separately, or we could search for one already written by the AmaraJS community, but it's easy enough to write one that meets our basic needs:

```javascript
// middleware/analytics.js

export default function GoogleAnalytics(options) {

    // consider throwing an Error if the account
    // wasn't provided
    const account = options.accountNumber;

    function downloadAnalyticsScript(document) {
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.innerHTML = `
            // <snip> code to download analytics.js
            ga('create', '${account}', 'auto');
            ga('send', 'pageview');
        `
        document.appendChild(script);
    }

    return function createHandler() {

        return function handler(action) {

            switch(action.type) {
            case 'core:bootstrap':
                // create script tag to download analytics.js
                let bootstrapNode = action.payload.target;
                let document = bootstrapNode.documentElement;
                downloadAnalyticsScript(document);
                break;
            case 'tracking-event':
                ga('send', {
                    hitType: 'event',
                    eventCategory: action.payload.category,
                    eventAction: action.payload.action,
                    // Google suggests using "label" to
                    // categorize events, even though they
                    // already have a "category" property   ¯\(°_o)/¯
                    // as you'll see later, we've been using
                    // an array to store our label values,
                    // so we'll join that array together to
                    // get our final label value
                    eventLabel: action.payload.label.join(' > ')
                });
                break;
            }

        };

    };

}
```

Now, let's assume that any DOM element that wants to add contextual tracking data will do so through a new attribute called `tracking-context`. For example:

```html
<section id="help" tracking-context="help panel">
  ...
</section>
```

With this in mind, we'll update our hypothetical "targets.js" file with the new target selector:

```javascript
// targets.js
...
export const TrackingContext = ['[tracking-context]'];
...
```

Now we can begin coding our feature, which is really just 2 separate behaviors:

```javascript
// context-tracking.js

import { amara } from './bootstrap';
import { createAction } from './utils';
import { ButtonComponent, TrackingContext } from './targets';

amara

    // first, we want to dispatch a "tracking-event" custom DOM
    // event whenever our button component is clicked. the event
    // details will include a default "action" and "category"
    // and will use the inner text of our button as the "label"
    .add({
        type: 'events',
        targets: ButtonComponent,
        apply: () => ({
            click: (e) => {
                e.dispatch(createAction('tracking-event', {
                    action: 'click',
                    category: 'button',
                    // we define our "label" value as an array
                    // so we can insert additional context values
                    // as our event bubbles up the DOM
                    label: [e.target.innerText]
                }));
            }
        })
    })

    // now, we will attach an event handler to any node that
    // has our new [tracking-context] attribute; the handler
    // inserts its context at the beginning of the label array
    .add({
        type: 'events',
        targets: TrackingContext,
        apply: () => ({
            'tracking-event': (e) => {
                const node = e.currentTarget;
                const label = node.getAttribute('tracking-context');
                e.detail.payload.label.unshift(label);
            }
        })
    });
```

When the `'tracking-event'` custom event reaches the root node, [`@amarajs/plugin-events`](https://github.com/amarajs/plugin-events) will dispatch it as an action to Amara middleware, including our custom Google Analytics middleware, which joins the label array together and sends the event to GA.

Hopefully, this gives you a better sense of how easy it is to develop features using the AmaraJS framework. We never even touched the existing button component, and yet we've added powerful contextual event tracking to every button instance!

### FAQ

 - __What happens when 2 or more features have the same `type` and `targets` properties? Which `apply` method "wins"?__

    It is the plugin middleware's responsibility to resolve this issue. For example, if the [`@amarajs/plugin-css`](https://github.com/amarajs/plugin-css) middleware receives multiple arrays of class names for the same target, it simply combines all the class names together. The HTML5 `classList` interface ensures uniqueness automatically.
    
    But [`@amarajs/plugin-dom`](https://github.com/amarajs/plugin-dom) appends each DOM collection it receives to the target element in the order it was received. This ensures that no DOM returned by a feature is mysteriously discarded. If the order the results are applied matters, a custom `"sorter"` configuration method can be added to the `amara` instance.
    
    More generally, you should read each middleware plugin's documentation to better understand how it applies multiple results to the same target.

Have you hit a roadblock using AmaraJS? If so, please let us know by opening an issue. If we discover that our users are all confronting similar challenges, we can expand this FAQ with (hopefully) useful answers.

### Contributing

If you have a feature request, please create a new issue so the community can discuss it.

If you find a defect, please submit a bug report that includes a working link to reproduce the problem (for example, using [this fiddle](https://jsfiddle.net/04f3v2x4/)). Of course, pull requests to fix open issues are always welcome!

### License

The MIT License (MIT)

Copyright (c) Dan Barnes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
