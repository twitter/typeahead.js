[![build status](https://secure.travis-ci.org/twitter/typeahead.js.png?branch=master)](http://travis-ci.org/twitter/typeahead.js)

[typeahead.js][gh-page]
=======================

Inspired by [twitter.com][twitter]'s autocomplete search functionality, typeahead.js is a fast and [fully-featured][features] autocomplete library.

Getting Started
---------------

How you acquire typeahead.js is up to you.

Preferred method:
* Install with [Bower][bower]: `$ bower install typeahead.js`

Other methods:
* [Download zipball of latest release][zipball].
* Download latest *[typeahead.js][typeahead.js]* or *[typeahead.min.js][typeahead.min.js]*.

**Note:** typeahead.js has a dependency on [jQuery][jquery] 1.9+, which must be loaded before *typeahead.js*.

Examples
--------

For some working examples of typeahead.js, visit our [examples page][examples].

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

Turns any `input[type="text"]` element into a typeahead. `datasets` is expected to be a single [dataset][dataset] or an array of datasets.

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

#### jQuery#typeahead('destroy')

Destroys previously initialized typeaheads. This entails reverting DOM modifications and removing event handlers.

```javascript
$('input.typeahead-devs').typeahead({
  name: 'accounts',
  local: ['timtrueman', 'JakeHarding', 'vskarich']
});

$('input.typeahead-devs').typeahead('destroy');
```

#### jQuery#typeahead('setQuery', query)

Sets the current query of the typeahead. This is always preferable to using `$("input.typeahead").val(query)`, which will result in unexpected behavior. To clear the query, simply set it to an empty string.

### Dataset

A dataset is an object that defines a set of data that hydrates suggestions. Typeaheads can be backed by multiple datasets. Given a query, a typeahead instance will inspect its backing datasets and display relevant suggestions to the end-user. 

When defining a dataset, the following options are available:

* `name` – The string used to identify the dataset. Used by typeahead.js to cache intelligently.

* `valueKey` – The key used to access the value of the datum in the datum object. Defaults to `value`.

* `limit` – The max number of suggestions from the dataset to display for a given query. Defaults to `5`.

* `template` – The template used to render suggestions. Can be a string or a precompiled template. If not provided, suggestions will render as their value contained in a `<p>` element (i.e. `<p>value</p>`).

* `engine` – The template engine used to compile/render `template` if it is a string. Any engine can use used as long as it adheres to the [expected API][template-engine-compatibility]. **Required** if `template` is a string.

* `header` – The header rendered before suggestions in the dropdown menu. Can be either a DOM element or HTML.

* `footer` – The footer rendered after suggestions in the dropdown menu. Can be either a DOM element or HTML.

* `local` – An array of [datums][datum].

* `prefetch` – Can be a URL to a JSON file containing an array of datums or, if more configurability is needed, a [prefetch options object][prefetch].

* `remote` – Can be a URL to fetch suggestions from when the data provided by `local` and `prefetch` is insufficient or, if more configurability is needed, a [remote options object][remote].

### Datum

The individual units that compose datasets are called datums. The canonical form of a datum is an object with a `value` property and a `tokens` property. `value` is the string that represents the underlying value of the datum and `tokens` is a collection of strings that aid typeahead.js in matching datums with a given query.

```javascript
{
  value: '@JakeHarding',
  tokens: ['Jake', 'Harding']
}
```

For ease of use, datums can also be represented as a string. Strings found in place of datum objects are implicitly converted to a datum object.

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

### Prefetch

Prefetched data is fetched and processed on initialization. If the browser supports localStorage, the processed data will be cached there to prevent additional network requests on subsequent page loads.

When configuring `prefetch`, the following options are available:

* `url` – A URL to a JSON file containing an array of datums. **Required.**

* `ttl` – The time (in milliseconds) the prefetched data should be cached in localStorage. Defaults to `86400000` (1 day).

* `filter` – A function with the signature `filter(parsedResponse)` that transforms the response body into an array of datums. Expected to return an array of datums.


### Remote

Remote data is only used when the data provided by `local` and `prefetch` is insufficient. In order to prevent an obscene number of requests being made to remote endpoint, typeahead.js rate-limits remote requests.

When configuring `remote`, the following options are available:

* `url` – A URL to make requests to when when the data provided by `local` and `prefetch` is insufficient. **Required.**

* `dataType` – The type of data you're expecting from the server. See the [jQuery.ajax docs][jquery-ajax] for more info. Defaults to `json`.

* `cache` – Determines whether or not the browser will cache responses. See the [jQuery.ajax docs][jquery-ajax] for more info.

* `timeout` – Sets a timeout for requests. See the [jQuery.ajax docs][jquery-ajax] for more info.

* `wildcard` – The pattern in `url` that will be replaced with the user's query when a request is made. Defaults to `%QUERY`.

* `replace` – A function with the signature `replace(url, uriEncodedQuery)` that can be used to override the request URL. Expected to return a valid URL. If set, no wildcard substitution will be performed on `url`.

* `rateLimitFn` – The function used for rate-limiting network requests. Can be either `debounce` or `throttle`. Defaults to `debounce`.

* `rateLimitWait` – The time interval in milliseconds that will be used by `rateLimitFn`. Defaults to `300`.

* `maxParallelRequests` – The max number of parallel requests typeahead.js can have pending. Defaults to `6`.

* `beforeSend` – A pre-request callback with the signature `beforeSend(jqXhr, settings)`. Can be used to set custom headers. See the [jQuery.ajax docs][jquery-ajax] for more info.

* `filter` – A function with the signature `filter(parsedResponse)` that transforms the response body into an array of datums. Expected to return an array of datums.

### Custom Events

typeahead.js triggers the following custom events:

* `typeahead:initialized` – Triggered after initialization. If data needs to be prefetched, this event will not be triggered until after the prefetched data is processed.

* `typeahead:opened` – Triggered when the dropdown menu of a typeahead is opened.

* `typeahead:closed` – Triggered when the dropdown menu of a typeahead is closed.

* `typeahead:selected` – Triggered when a suggestion from the dropdown menu is explicitly selected. The datum for the selected suggestion is passed to the event handler as an argument in addition to the name of the dataset it originated from.

* `typeahead:autocompleted` – Triggered when the query is autocompleted. The datum used for autocompletion is passed to the event handler as an argument in addition to the name of the dataset it originated from.

All custom events are triggered on the element initialized as a typeahead.

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

The styles applied by typeahead.js are for positioning the hint and the dropdown menu, no other styles should be affected. In most cases the styles applied by typeahead.js will work like a charm, but there are edge cases where some custom styles will be necessary. If you're having CSS issues, create an [issue][issues] or tweet [@typeahead][@typeahead] for support.

By default, the dropdown menu created by typeahead.js is going to look ugly and you'll want to style it to ensure it fits into the theme of your web page. Below is a Mustache template describing the DOM structure of a typeahead.js dropdown menu. Note that the `{{{html}}}` tag is the HTML generated by the custom template you provide when defining datasets.

```html
<span class="tt-dropdown-menu">
  {{#dataset}}
    <div class="tt-dataset-{{name}}">
      {{{header}}}
      <span class="tt-suggestions">
        {{#suggestions}}
          <div class="tt-suggestion">{{{html}}}</div>
        {{/suggestions}}
      </span>
      {{{footer}}}
    </div>
  {{/dataset}}
</span>
```

When an end-user mouses or keys over a `.tt-suggestion`, the class `tt-is-under-cursor` will be added to it. You can use this class as a hook for styling the "under cursor" state of suggestions.

Bootstrap Integration
---------------------

For simple autocomplete use cases, the typeahead component [Bootstrap][bootstrap] provides should suffice. However, if you'd prefer to take advantage of some of the advance features typeahead.js provides, here's what you'll need to do to integrate typeahead.js with Bootstrap:

* If you're customizing Bootstrap, exclude the typeahead component. If you're depending on the standard *bootstrap.js*, ensure *typeahead.js* is loaded after it.
* The DOM structure of the dropdown menu used by typeahead.js differs from the DOM structure of the Bootstrap dropdown menu. You'll need to load some [additional CSS][typeahead.js-bootstrap.css] in order to get the typeahead.js dropdown menu to fit the default Bootstrap theme.

Browser Support
---------------

* Chrome
* Firefox 3.5+
* Safari 4+
* Internet Explorer 7+
* Opera 11+

Issues
------

Discovered a bug? Please create an issue here on GitHub!

https://github.com/twitter/typeahead.js/issues

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

In order to build and test typeahead.js, you'll need to install its dev dependencies (`$ npm install`) and have [grunt-cli][grunt-cli] installed (`$ npm install -g grunt-cli`). Below is an overview of the available Grunt tasks that'll be useful in development.

* `grunt build` – Builds *typeahead.js* from source.
* `grunt lint` – Runs source and test files through JSHint.
* `grunt test` – Runs the test suite with PhantomJS.
* `grunt test:browser` – Runs the test suite in your default browser.
* `grunt watch` – Rebuilds *typeahead.js* whenever a source file is modified.
* `grunt server` – Serves files from the root of typeahead.js on localhost:8888. Useful for using *test/playground.html* for debugging/testing.
* `grunt dev` – Runs `grunt watch` and `grunt server` in parallel.

Authors
-------

* **Tim Trueman** ([Twitter](https://twitter.com/timtrueman) / [GitHub](https://github.com/timtrueman))
* **Veljko Skarich** ([Twitter](https://twitter.com/vskarich) / [GitHub](https://github.com/velsgithub))
* **Jake Harding** ([Twitter](https://twitter.com/JakeHarding) / [GitHub](https://github.com/jharding))

Shoutouts!
----------

Thanks for assistance and contributions:

* [@fat](https://github.com/fat)
* [@garann](https://github.com/garann)
* [@paulirish](https://github.com/paulirish)
* [@sindresorhus](https://github.com/sindresorhus)
* [@thisguy](https://twitter.com/thisguy)
* [And many others!][contributors]

License
-------

Copyright 2013 Twitter, Inc.

Licensed under the MIT License

[twitter]: https://twitter.com
[gh-page]: http://twitter.github.com/typeahead.js
[examples]: http://twitter.github.com/typeahead.js/examples
[@typeahead]: https://twitter.com/typeahead

<!-- assets -->
[zipball]: http://twitter.github.com/typeahead.js/releases/latest/typeahead.js.zip
[typeahead.js]: http://twitter.github.com/typeahead.js/releases/latest/typeahead.js
[typeahead.min.js]: http://twitter.github.com/typeahead.js/releases/latest/typeahead.min.js

<!-- github links -->
[contributing-guidelines]: https://github.com/twitter/typeahead.js/blob/master/CONTRIBUTING.md
[compatible-template-engines]: https://github.com/twitter/typeahead/wiki/Compatible-Template-Engines
[contributors]: https://github.com/twitter/typeahead.js/contributors
[issues]: https://github.com/twitter/typeahead.js/issues

<!-- deep links -->
[features]: #features
[transport]: #transport
[dataset]: #dataset
[prefetch]: #prefetch
[remote]: #remote
[datum]: #datum
[template-engine-compatibility]: #template-engine-compatibility

<!-- links to third party projects -->
[jasmine]: http://pivotal.github.com/jasmine/
[grunt-cli]: https://github.com/gruntjs/grunt-cli
[bower]: http://bower.io/
[jQuery]: http://jquery.com/
[jquery-ajax]: http://api.jquery.com/jQuery.ajax/
[hogan.js]: http://twitter.github.com/hogan.js/
[bootstrap]: http://twitter.github.com/bootstrap/
[typeahead.js-bootstrap.css]: https://github.com/jharding/typeahead.js-bootstrap.css
