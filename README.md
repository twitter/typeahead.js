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
    

#### jQuery#typeahead('destroy')

Destroys previously initialized typeaheads. This entails reverting DOM modifications and removing event handlers.

    
    $('input.typeahead-devs').typeahead({
      name: 'accounts',
      local: ['timtrueman', 'JakeHarding', 'vskarich']
    });
    $('input.typeahead-devs').typeahead('destroy');
    

#### jQuery#typeahead('setQuery', query) **>New<**

Sets the current query of the typeahead. This is always preferable to using `$("input.typeahead").val(query)`, which will result in unexpected behavior. To clear the query, simply set it to an empty string.  
 *If you are using `remote` data and want to initialize the typeahead value with some value, you need to call this method.*  
 
**Example:**  
    
    $('#MyInputBoxId').typeahead('setQuery','hello');
    
#### jQuery#typeahead('setDatum', datum) **>New<**

Sets the selected datum object of the typeahead. *If you are using `remote` data and want to initialize the typeahead value with some datum, you need to call this method.*  This method is preferred for initialization over the ` setQuery ` method, especially if the `restrictInputToDatum` option is used.  
 
**Example:**  
    
    $('#MyInputBoxId').typeahead('setDatum', myDatum);
    
#### jQuery#typeahead('getDatum')  **>New<**
Returns the datum object from the last selected or autocompleted data in the control.  
    
**Example:** 
    
    var myDatum = $('#MyInputBoxId').typeahead('getDatum');
        
#### jQuery#typeahead('getQuery')  **>New<**
Returns the current input control value.      
**Example:** 
    
    var myText = $('#MyInputBoxId').typeahead('getQuery');
    Still the same value can be acceived via:
    var myText = $('#MyInputBoxId').val();
    
#### jQuery#typeahead('clearCache') **>New<**

Clears the current cache of the typeahead.  In most cases this is not needed.  However if you are reusing the page with different data and cache keys (for instance in SPA application), it may be preferable to clear the cache to reduce the memory footprint of the application.  This method may also be used instead of using varying `cacheKey`'s for remote data. 
 
**Example:** 
    
    $('#MyInputBoxId').typeahead('clearCache');
    
#### jQuery#typeahead('openDropdown') **>New<**
Opens the dropdown on the relevant element (only if it has suggestions)  
  
**Example:**  
    
    $('#MyInputBoxId').typeahead('openDropdown');
    
#### jQuery#typeahead('closeDropdown') **>New<**
Closes the dropdown on the relevant element.  

**Example:**  
    
    $('#MyInputBoxId').typeahead('closeDropdown');
    
### Dataset

A dataset is an object that defines a set of data that hydrates suggestions. Typeaheads can be backed by multiple datasets. Given a query, a typeahead instance will inspect its backing datasets and display relevant suggestions to the end-user. 

When defining a dataset, the following options are available:

* `name` – The string used to identify the dataset. Used by typeahead.js to cache intelligently.

* `valueKey` – The key used to access the value of the datum in the datum object. Defaults to `value`.  

* `nameKey` **>New<** – If the input display name should be other than the unique value, then this is the name of the datum in the datum object. Defaults to `value` or the value of the `valueKey` .

* `limit` – The max number of suggestions from the dataset to display for a given query. Defaults to `5`.

* `minLength` – The minimum number characters entered in the input box before the typeahead fires up. Defaults to `1`.

* `template` – The template used to render suggestions. Can be a string or a precompiled template. If not provided, suggestions will render as their value contained in a `<p>` element (i.e. `<p>value</p>`).

* `engine` – The template engine used to compile/render `template` if it is a string. Any engine can use used as long as it adheres to the [expected API][template-engine-compatibility].  
**Required** if `template` is a string.

* `restrictInputToDatum` **>New<** – This option will make sure the user can only leave the input box with empty text or text corresponding to the internal `selectedDatum`.  The `selectedDatum` is set by `autocomplete` or `selection` events, or programmatically by invoking the typeahead `setDatum` method.   
When user leaves the input box one of these following things will happen:  
*If the string is empty the internal `selectedDatum` retrieved by the `getDatum` method will be set to null.  The event `noSelect` will be raised.  
If the string matches the internal `selectedDatum` nothing happens.
If we have the internal `selectedDatum` set, the text will be set to that datums name.  No events will be raised*.
    
* `header` – The header rendered before suggestions in the dropdown menu. Can be either a DOM element or HTML.

* `footer` – The footer rendered after suggestions in the dropdown menu. Can be either a DOM element or HTML.

* `local` – An array of [datums][datum].

* `localSearcher` **>New<** - Function with the signature function(query,dataset) to override the normal suggestion getter for the local and prefetched data. It returns list of search items (suggestions) on the form {name: `<display name>`, value: `<key value>`, tokens: `<List of search tokens>`, datum: `<the datum object>`}.  The query parameter is the current search query and the dataset the typeahead dataset object.  
***Be warned:** it requires of knowledge of the internals of typeahead to create function of this complexity.*

* `prefetch` – Can be a URL to a JSON file containing an array of datums or, if more configurability is needed, a [prefetch options object][prefetch].

* `remote` – Can be a URL or handler function to fetch suggestions from when the data provided by `local` and `prefetch` is insufficient or, if more configurability is needed. See [remote options object][remote] for details.


### Datum

The individual units that compose datasets are called datums. The canonical form of a datum is an object with a `value` property and a `tokens` property. `value` is the string that represents the underlying value of the datum and `tokens` is a collection of **single-word** strings that aid typeahead.js in matching datums with a given query.
    
    {
      value: '@JakeHarding',
      name: 'Jake Harding',
      tokens: ['Jake', 'Harding']
    }
    

For ease of use, datums can also be represented as a string. Strings found in place of datum objects are implicitly converted to a datum object.

When datums are rendered as suggestions, the datum object is the context passed to the template engine. This means if you include any arbitrary properties in datum objects, those properties will be available to the template used to render suggestions.
    
    <img src="{{profileImageUrl}}">
    <p><strong>{{name}}</strong>&nbsp;{{value}}</p>   
    
    {
        value: '@JakeHarding',
        tokens: ['Jake', 'Harding'],
        name: 'Jake Harding',
        profileImageUrl: 'https://twitter.com/JakeHaridng/profile_img'
    }


### Prefetch

Prefetched data is fetched and processed on initialization. If the browser supports localStorage, the processed data will be cached there to prevent additional network requests on subsequent page loads.

When configuring `prefetch`, the following options are available:

* `url` – A URL to a JSON file containing an array of datums. **Required.**

* `ttl` – The time (in milliseconds) the prefetched data should be cached in localStorage. Defaults to `86400000` (1 day).

* `filter` – A function with the signature `filter(parsedResponse)` that transforms the response body into an array of datums. Expected to return an array of datums.


### Remote

Remote data is only used when the data provided by `local` and `prefetch` is insufficient. In order to prevent an obscene number of requests being made to remote endpoint, typeahead.js rate-limits remote requests.

When configuring `remote`, the following options are available:

* `url` – A URL to make requests to when  the data provided by `local` and `prefetch` is insufficient.  **`url` or `handler` options are required for remote lookups.**

* `handler` **>New<** - Custom function with the signature `function(query, data)` to take control of the typeahead data retrieval.  This can be both used to handle local synchronous data or to fetch asynchronous data from remote source using the **promise pattern**.    
In case this function is used for asynchronous data fetch it must return `promise`, but it should return `true` for synchronous operations.  Both [JQuery promises](http://api.jquery.com/promise/ "JQuery promises") and [Q promises](http://documentup.com/kriskowal/q/#introduction) are supported.  
When `handler` option is used for data retrieval the options `beforeSend`, `replace`, `wildcard`, `dataType` and  `cache` do not apply.  However the throttling options are used and the cache control is also in play.
See [this page](Computed.md) for details on the handler usage.

* `dataType` – The type of data you're expecting from the server. See the [jQuery.ajax docs][jquery-ajax] for more info. Defaults to `Json`.  This applies only in conjunction with the `url` option.

* `cache` – Determines whether or not JQuery will cache responses. See the [jQuery.ajax docs][jquery-ajax] for more info.  This applies only for the `url` option, by default all remote responses are cached for each query.

* `skipCache` **>New<** – Orders remote queries not to use local cache but always go remote for data lookup on each keystroke.  This can be useful for mutating remote data.

* `cacheKey` **>New<** –  By default all remote lookups are cached per string combination entered in the typeahead control. This option can be used to control caching which may be necessary if more than one typeahead control is used in the application. By default this value is set to the url value for `url` requests and the `name` value for `handler` requests.  
This option value may also be set to function with the signature `function(query)`.  It must then return cache key including the query value.  This function method may be particularly helpful when using handler functions for remote lookup where results may be varying on different contexts.  

**Example:**  
    
    cacheKey: function(query) { return 'admin1_#' + vm.country + '_%' + query;}
    
* `timeout` – Sets a timeout for requests. See the [jQuery.ajax docs][jquery-ajax] for more info.  This applies only in conjunction with the `url` option.

* `wildcard` – The pattern in `url` that will be replaced with the user's query when a request is made. Defaults to `%QUERY`.  This applies only in conjunction with the `url` option.

* `replace` – A function with the signature `replace(url, uriEncodedQuery)` that can be used to override the request URL. Expected to return a valid URL. If set, no wildcard substitution will be performed on `url`.  This applies only in conjunction with the `url` option.

* `rateLimitFn` – The function used for rate-limiting network requests. Can be either `debounce` or `throttle`. Defaults to `debounce`.

* `rateLimitWait` – The time interval in milliseconds that will be used by `rateLimitFn`. Defaults to `300`.

* `maxParallelRequests` – The max number of parallel requests typeahead.js can have pending. Defaults to `6`.

* `beforeSend` – A pre-request callback with the signature `beforeSend(jqXhr, settings)`. Can be used to set custom headers. See the [jQuery.ajax docs][jquery-ajax] for more info.  This applies only in conjunction with the `url` option.

* `filter` – A function with the signature `filter(parsedResponse)` that transforms the response body into an array of datums. Expected to return an array of datums.


### Custom Events

typeahead.js triggers the following custom events:

* `typeahead:initialized` – Triggered after initialization. If data needs to be prefetched, this event will not be triggered until after the prefetched data is processed.

* `typeahead:opened` – Triggered when the dropdown menu of a typeahead is opened.

* `typeahead:closed` – Triggered when the dropdown menu of a typeahead is closed.

* `typeahead:selected` – Triggered when a suggestion from the dropdown menu is explicitly selected. The datum for the selected suggestion is passed to the event handler as an argument in addition to the name of the dataset it originated from.

* `typeahead:autocompleted` – Triggered when the query is autocompleted. The datum used for auto completion is passed to the event handler as an argument in addition to the name of the dataset it originated from.

* `typeahead:noSelect` **>New<** – Triggered when user exists the input without text matching any name in the suggestion data.  This is also triggered if the input value is empty.

All custom events are triggered on the element initialized as a typeahead.

You can use JQuery to hook the custom events to your handling functions.  
  
**Example:**  
    
    $(´#yourElementIdWithHash´.on('typeahead:selected', yourSelectedEfentHanlerFunction); 
    
where the handler function has this format:
    
    function yourSelectedEventHanlerFunction(element,datum) { 
       Datum contains here the info about the cell you selected.   
       Element is the input box element.
    }
  

### Template Engine Compatibility

Any template engine will work with typeahead.js as long as it adheres to the following API:
    
    // engine has a compile function that returns a compiled template
    var compiledTemplate = ENGINE.compile(template);
    
    // compiled template has a render function that returns the rendered template
    // render function expects the context to be first argument passed to it
    var html = compiledTemplate.render(context);
    

Check out [Hogan.js][hogan.js] if you're looking for a compatible mustache templating engine.

### Look and Feel

The styles applied by typeahead.js are for positioning the hint and the dropdown menu, no other styles should be affected. In most cases the styles applied by typeahead.js will work like a charm, but there are edge cases where some custom styles will be necessary. If you're having CSS issues, create an [issue][issues] or tweet [@typeahead][@typeahead] for support.

By default, the dropdown menu created by typeahead.js is going to look ugly and you'll want to style it to ensure it fits into the theme of your web page. Below is a Mustache template describing the DOM structure of a typeahead.js dropdown menu. Note that the `{{{html}}}` tag is the HTML generated by the custom template you provide when defining datasets.
    
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
    

When an end-user mouses or keys over a `.tt-suggestion`, the class `tt-is-under-cursor` will be added to it. You can use this class as a hook for styling the "under cursor" state of suggestions.

Bootstrap Integration
---------------------  

For simple autocomplete use cases, the typeahead component [Bootstrap][bootstrap] provides should suffice. However, if you'd prefer to take advantage of some of the advance features typeahead.js provides, here's what you'll need to do to integrate typeahead.js with Bootstrap:

* If you're customizing Bootstrap, exclude the typeahead component. If you're depending on the standard *bootstrap.js*, ensure *typeahead.js* is loaded after it.
* The DOM structure of the dropdown menu used by typeahead.js differs from the DOM structure of the Bootstrap dropdown menu. You'll need to load some [additional CSS][typeahead.js-bootstrap.css] in order to get the typeahead.js dropdown menu to fit the default Bootstrap theme.

Knockout Integration
---------------------
Knockout binding handler for this library is provided.  
See [this page](Knockout.md) for details.

Side Effects
---------------
The input box background styling is overwritten by the control.

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
[typeahead.js-bootstrap.css]: https://github.com/jharding/typeahead.js-bootstrap.css.
