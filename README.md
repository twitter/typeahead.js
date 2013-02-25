[![build status](https://secure.travis-ci.org/twitter/typeahead.js.png?branch=master)](http://travis-ci.org/twitter/typeahead.js)

[typeahead.js][gh-page]
=======================

Inspired by [twitter.com][twitter]'s autocomplete search functionality, typeahead.js is a fast and [fully-featured][features] autocomplete library.

Getting Started
---------------

typeahead.js consists of *typeahead.js* and *typeahead.css*. How you acquire those files is up to you.

Preferred method:
* Install with [Bower][bower]: `$ bower install typeahead.js`

Manual methods:
* [Download zipball of latest release][zipball].
* Download latest [typeahead.js][typeahead.js] and [typeahead.css][typeahead.css] individually.

**Note:** typeahead.js has a dependency on [jQuery][jQuery] 1.9+, it must be loaded before *typeahead.js*.

Features
--------

* Displays suggestions to end-users as they type
* Shows top suggestion as a hint (i.e. background text)
* Works with hardcoded data as well as remote data
* Rate-limits network requests to lighten the load
* Allows for suggestions to be drawn from multiple datasets
* Supports customized templates for suggestions
* Plays nice with RTL languages and input method editors

Why not use X?
--------------

At the time Twitter was looking to implement a typeahead, there wasn't a solution that allowed for prefetching data, searching that data on the client, and then falling back to the server. It's optimized for quickly indexing and searching large datasets on the client. That allows for sites without datacenters on every continent to provide a consistent level of performance for all their users. It plays nicely with Right-To-Left (RTL) languages and Input Method Editors (IMEs). We also needed something instrumented for comprehensive analytics in order to optimize relevance through A/B testing. Although logging and analytics are not currently included, it's something we may add in the future.

Usage
-----

### API

#### jQuery#typeahead(datasets)

Turns any `input[type="text"]` element into a typeahead. `datasets` is expected to be a single [dataset][datasets] or an array of datasets.

```javascript
// single dataset
$('input.typeahead-devs').typeahead({
  name: 'accounts',
  local: ['timtrueman', 'JakeHarding', 'vskarich']
});

// multiple datasets
$('input.twitter-search').typeahead([
  {
    name: 'accounts',
    prefetch: 'https://twitter.com/network.json',
    remote: 'https://twitter.com/accounts?q=%QUERY'
  },
  {
    name: 'trends',
    prefetch: 'https://twitter.com/trends.json'
  }
]);
```

#### jQuery.fn.typeahead.configureTransport(options)

Configures the transport component that will be used by typeaheads initialized with the `remote` property set. Once `jQuery#typeahead` is called, this function will not be accessible. Refer to [Transport][transport] for an overview of the transport component along with the details of the configurable options.

```javascript
$.fn.typeahead.configureTransport({
  debounce: true,
  maxConcurrentRequests: 6
});
```

### Datasets

Datasets are objects which define the sets of data that hydrate suggestions. Given a query, a typeahead instance will inspect its backing datasets and display relevant suggestions to the end-user. Below are the options available for configuring a dataset.

* `name` - The string used to identify the dataset.

* `limit` - The max number of suggestions from the dataset to display for a given query. Defaults to `5`.

* `template` - The template used to render suggestions. If not provided, suggestions will render as their value contained in a `<p>` element (i.e. `<p>value</p>`).

* `engine` - The template engine used to compile/render `template`. Any engine can use used as long as it adheres to the [expected API][template-engine-compatibility]. **Required** if `template` is set.

* `local` - An array of [datums][datums].

* `prefetch` - A URL to a JSON file containing an array of datums.

* `remote` - A URL to fetch suggestions from when the data provided by `local` and `prefetch` is insufficient for a given query. If the URL contains the wildcard configurable through the [transport options][transport], said wildcard will be replaced with the end-user's query before the request is made.

### Datums

Datums are the individual units that compose datasets. The canonical form of a datum is an object with a `value` property and a `tokens` property. `value` is the string that represents the underlying value of the datum and `tokens` is a collection of strings that aid typeahead.js in matching datums with a given query.

```javascript
{
  value: '@JakeHarding',
  tokens: ['Jake', 'Harding']
}
```

For ease of use, datums can also be represented as a string. Strings found in place of datum objects are converted to a datum object whose value is the found string and with tokens equal to the value split by whitespace.

When datums are rendered as suggestions, the datum object is the context passed to the template engine. This means if you include any arbitrary properties in datum objects, those properties will be available to the template used to render suggestions.

```html
<img src="{{profileImageUrl}}">
<p><strong>{{name}}</strong>&nbsp;{{value}}</p>
```

```javascript
{
  value: '@JakeHarding',
  tokens: ['Jake', 'Harding'],
  name: 'Jake Harding',
  profileImageUrl: 'https://twitter.com/JakeHaridng/profile_img'
}
```

### Transport

The transport component is a singleton used by all typeaheads initialized with the `remote` property set. Its primary purpose is to rate-limit network requests and to manage the number of concurrent requests. Below are the options available for configuring the transport component.

* `rateLimitFn` - The function that will be used for rate-limiting network requests. Can be either `debounce` or `throttle`. Defaults to `debounce`.

* `wait` - The time interval in milliseconds that will be used by `rateLimitFn`. Defaults to `300`.

* `wildcard` - The pattern in the `remote` URL that will be replaced with the user's query when a request is made. Defaults to `%QUERY`.

* `maxConcurrentRequests` - The max number of AJAX requests typeahead.js can have pending. Defaults to `6`.


### Template Engine Compatibility

Any template engine will work with typeahead.js as long as it adheres to the following API:

```javascript
// engine has a compile function that returns a compiled template
var compiledTemplate = ENGINE.compile(template);

// compiled template has a render function that returns the rendered template
// render function expects the context to be first argument passed to it
var html = compiledTemplate.render(context);
```

Check out [Hogan.js][hogan.js] if you're looking for a compatible mustache templating engine.

### Look and Feel

The purpose of the CSS file required by typeahead.js (i.e. *typeahead.css*) is to position the hint and dropdown menu components of typeaheads. It should not alter the appearance of the `input[type="text"]` it is called on.

By default, the dropdown menu created by typeahead.js is going to look ugly and you'll want to style it to ensure it fits into the theme of your web page. Below is a Mustache template describing the DOM structure of a typeahead.js dropdown menu. Note that the `{{{html}}}` tag is the HTML generated by the custom template you provide when defining datasets.

```html
<ol class="tt-dropdown-menu">
  {{#dataset}}
    <li class="tt-dataset-{{name}}">
      <ol class="tt-suggestions">
        {{#suggestions}}
          <li class="tt-suggestion">{{{html}}}<li>
        {{/suggestions}}
      </ol>
  {{/dataset}}
</ol>
```

When an end-user mouses or keys over a `.tt-suggestion`, the class `tt-is-under-cursor` will be added to it. You can use this class as a hook for styling the "under cursor" state of suggestions.

Bootstrap Integration
---------------------

For simple autocomplete use cases, the typeahead component [Bootstrap][bootstrap] provides should suffice. However, if you'd prefer to take advantage of some of the advance features typeahead.js provides, here's what you'll need to do to integrate typeahead.js with Bootstrap:

* If you're customizing Bootstrap, exclude the typeahead component. If you're depending on the standard *bootstrap.js*, ensure *typeahead.js* is loaded after it.
* The DOM structure of the dropdown menu used by typeahead.js differs from the DOM structure of the Bootstrap dropdown menu. You'll need to load some [additional CSS][typeahead.js-bootstrap.css] in order to get the typeahead.js dropdown menu to fit the default Bootstrap theme.

Possible Future Work
--------------------

* Mobile support
* Benchmarking tool
* Logging and analytics hooks
* Backend component

Issues
------

Have a bug? Please create an issue here on GitHub!

https://github.com/twitter/typeahead/issues

Versioning
----------

For transparency and insight into our release cycle, releases will be numbered with the follow format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backwards compatibility bumps the major
* New additions without breaking backwards compatibility bumps the minor
* Bug fixes and misc changes bump the patch

For more information on semantic versioning, please visit http://semver.org/.

Testing
-------

Tests are written using [Jasmine][jasmine]. To run the test suite with PhantomJS, run `$ grunt test`. To run the test suite in your default browser, run `$ grunt test:browser`.

Developers
----------

If you plan on contributing to typeahead.js, be sure to read the [contributing guidelines][contributing-guidelines].

In order to build and test typeahead.js, you'll need to install its devDependencies (`$ npm install`) and have [grunt-cli][grunt-cli] installed (`$ npm install -g grunt-cli`). Below is an overview of the available Grunt tasks that'll be useful in development.

* `grunt build` - Builds *typeahead.js* and *typeahead.css* from source.
* `grunt build:js` - Builds *typeahead.js* from source.
* `grunt build:css` - Builds *typeahead.css* from source.
* `grunt lint` - Runs source and test files through JSHint.
* `grunt test` - Runs the test suite with PhantomJS.
* `grunt test:browser` - Runs the test suite in your default browser.
* `grunt watch` - Rebuilds *typeahead.js* whenever a source file is modified.
* `grunt server` - Serves files from the root of typeahead.js on localhost:8888. Useful for using *test/playground.html* for debugging/testing.

Authors
-------

* **Tim Trueman** ([Twitter](https://twitter.com/timtrueman) / [GitHub](https://github.com/timtrueman))
* **Veljko Skarich** ([Twitter](https://twitter.com/vskarich) / [GitHub](https://github.com/velsgithub))
* **Jake Harding** ([Twitter](https://twitter.com/JakeHarding) / [GitHub](https://github.com/jharding))

Shoutouts!
----------

Thanks for assistance and contributions:

+ [@fat](https://github.com/fat)
+ [@garann](https://github.com/garann)
+ [@paulirish](https://github.com/paulirish)
+ [@sindresorhus](https://github.com/sindresorhus)
+ [@thisguy](https://twitter.com/thisguy)
+ [And many others!](contributors)

License
-------

Copyright 2013 Twitter, Inc.

Licensed under the MIT License

[gh-page]: http://twitter.github.com/typeahead.js
[twitter]: https://twitter.com

<!-- assets -->
[zipball]: http://twitter.github.com/typeahead.js/releases/latest/typeahead.js.zip
[typeahead.js]: http://twitter.github.com/typeahead.js/releases/latest/typeahead.js
[typeahead.css]: http://twitter.github.com/typeahead.js/releases/latest/typeahead.css

<!-- github links -->
[contributing-guidelines]: https://github.com/jharding/ghostwriter/blob/master/CONTRIBUTING.md
[compatible-template-engines]: https://github.com/twitter/typeahead/wiki/Compatible-Template-Engines
[contributors]: https://github.com/twitter/typeahead.js/contributors

<!-- deep links -->
[features]: #features
[transport]: #transport
[datasets]: #datasets
[datums]: #datums
[template-engine-compatibility]: #template-engine-compatibility

<!-- links to third party projects -->
[jasmine]: http://pivotal.github.com/jasmine/
[grunt-cli]: https://github.com/gruntjs/grunt-cli
[bower]: http://twitter.github.com/bower/
[jQuery]: http://jquery.com/
[hogan.js]: http://twitter.github.com/hogan.js/
[bootstrap]: http://twitter.github.com/bootstrap/
[typeahead.js-bootstrap.css]: https://github.com/jharding/typeahead.js-bootstrap.css
