## [@amarajs/core](https://github.com/amarajs/core)

Provides feature-based development using an extensible plugin-based targeting system.

__IMPORTANT!__  
> AmaraJS is an early alpha release.  
> Bug reports and general feedback are welcome.

Visit the [Homepage](https://amarajs.github.io) to learn more about AmaraJS, including how to develop features and middleware, as well as best practices and sample applications.

> Homepage: https://amarajs.github.io  
> Sample App: https://amarajs.github.io/guide/  
> jsFiddle: https://jsfiddle.net/04f3v2x4

### Installation

```terminal
npm install --save @amarajs/core
```

### Usage

To create a new AmaraJS instance, simply pass an array of middleware to the Amara constructor.

```javascript
import Amara from '@amarajs/core';
const amara = new Amara([/* plugin middleware */]);
```

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

### Contributing

If you have a feature request, please create a new issue so the community can discuss it.

If you find a defect, please submit a bug report that includes a working link to reproduce the problem (for example, using [this fiddle](https://jsfiddle.net/04f3v2x4/)). Of course, pull requests to fix open issues are always welcome!

### License

The MIT License (MIT)

Copyright (c) Dan Barnes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
