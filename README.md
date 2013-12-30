[![build status](https://secure.travis-ci.org/twitter/typeahead.js.png?branch=master)](http://travis-ci.org/twitter/typeahead.js)

[typeahead.js][gh-page] (Fork: Svakinn)
=======================

Inspired by [twitter.com][twitter]'s autocomplete search functionality, typeahead.js is a fast and [fully-featured][features] autocomplete library.      
This fork is from [Twitter/typeahead.js](). The aim is to provide bug fixes and necessary missing features in that version.  
Hopefully the next version of typeahead.js will render this fork obsolete.   
Knockout binding handler is also included here.  
New features are marked in this document as **>>New<<**.

Getting Started
---------------

How you acquire typeahead.js is up to you.

* [Download zipball of latest release][zipball].
* Download latest *[typeahead.js][typeahead.js]*.

**Note:** typeahead.js has a dependency on [jQuery][jquery] 1.9+, which must be loaded before *typeahead.js*.

New features
------------
Se [this doc](New.md) for the new features in the latest update of this fork.

Examples
--------

For some working examples of typeahead.js, visit the [typeahead examples page][examples].  I am still working on examples for this fork but the [Knockout examples](Knockout.md) are ready.

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
    

#### jQuery#typeahead('setQuery', query) 
Sets the current query of the typeahead. This is equivalent to using `$("input.typeahead").val(query)`.  
 ***>>New<<** *In earlier versions of typeahead, if were using `remote` or `prefetch` data, this method was necessary to initialize the data in the control.  This fork solved this problem so initialization of data no longer requires any tricks.  You can use any method you like to set the data in the input box and do it whenever you like.* 

 
**Example:**  
    
    $('#MyInputBoxId').typeahead('setQuery','hello');
    
#### jQuery#typeahead('setDatum', datum) **>>New<<**

Sets the selected datum object of the typeahead.  This method is preferred for initialization over the `setQuery` method in case you have actual data record for the selected option.  In case you have no record but want to initialize the text, then use the setQuery instead.
 
**Example:**  
    
    $('#MyInputBoxId').typeahead('setDatum', myDatum);
    
#### jQuery#typeahead('getDatum')  **>>New<<**
Returns the datum object from the last selected or autocompleted data in the control.  
    
**Example:** 
    
    var myDatum = $('#MyInputBoxId').typeahead('getDatum');
        
#### jQuery#typeahead('getQuery')  **>>New<<**
Returns the current input control value.      
**Example:** 
    
    var myText = $('#MyInputBoxId').typeahead('getQuery');
    Still the same value can be acceived via:
    var myText = $('#MyInputBoxId').val();
    
#### jQuery#typeahead('clearCache') **>>New<<**

Clears the current cache of the typeahead.  In most cases this is not needed.  However if you are reusing the page with different data and cache keys (for instance in SPA application), it may be preferable to clear the cache to reduce the memory footprint of the application.  This method may also be used instead of using varying `cacheKey`'s for remote data.  
The cache cleared is both the remote and the prefetched cache.
 
**Example:** 
    
    $('#MyInputBoxId').typeahead('clearCache');
    
    
#### jQuery#typeahead('reload') **>>New<<**

Reloads all suggestion data in the control.  This includes `local`, `prefetch` and `remote` data.  This function is mostly handy when the html page containing the control is reused, for example when used in SPA applications.  In that case the Initialize method is not executed automatically but we may still require refresh on the control.   
When `cacheKey` is used as function or local data is data bound using data binding library (such as `Knockout`) we may want to update the suggestion data manually when underlying data (i.e. `local`) is changed.
The refresh method returnes JQuery deferred object that resolves when all data is reloaded.  New event is also raised: `typeahead:refreshed`
 
**Example:** 
    
    $('#MyInputBoxId').typeahead('refresh');
    
#### jQuery#typeahead('openDropdown') **>>New<<**
Opens the dropdown on the relevant element (only if it has suggestions)  
  
**Example:**  
    
    $('#MyInputBoxId').typeahead('openDropdown');
    
#### jQuery#typeahead('closeDropdown') **>>New<<**
Closes the dropdown on the relevant element.  

**Example:**  
    
    $('#MyInputBoxId').typeahead('closeDropdown');
    
### Dataset

A dataset is an object that defines a set of data that hydrates suggestions. Typeaheads can be backed by multiple datasets. Given a query, a typeahead instance will inspect its backing datasets and display relevant suggestions to the end-user. 

When defining a dataset, the following options are available:

* `name` – The string used to identify the dataset. Used by typeahead.js to cache intelligently.

* `valueKey` – The key used to access the value of the datum in the datum object. Defaults to `value`.  

* `nameKey` **>>New<<** – If the input display name should be other than the unique value, then this is the name of the datum in the datum object. Defaults to `value` or the value of the `valueKey` .

* `limit` – The max number of suggestions from the dataset to display for a given query. Defaults to `5`.

* `minLength` – The minimum number characters entered in the input box before the typeahead fires up. Defaults to `1`.  
**>>New<<**: Setting this value to 0 fires up typeahead on empty input box with all suggestions up to the `limit` value.

* `template` – The template used to render suggestions. Can be a string or a precompiled template. If not provided, suggestions will render as their value contained in a `<p>` element (i.e. `<p>value</p>`).

* `engine` – The template engine used to compile/render `template` if it is a string. Any engine can use used as long as it adheres to the [expected API][template-engine-compatibility].  
**Required** if `template` is a string.

* `restrictInputToDatum` **>>New<<** – This option will make sure the user can only leave the input box with empty text or text corresponding to the internal `selectedDatum`.  The `selectedDatum` is set by `autocomplete` or `selection` events, or programmatically by invoking the typeahead `setDatum` method.   
When user leaves the input box one of these following things will happen:  
*If the string is empty the internal `selectedDatum` retrieved by the `getDatum` method will be set to null.  The event `noSelect` will be raised.  
If the string matches the internal `selectedDatum` nothing happens.
If we have the internal `selectedDatum` set, the text will be set to that datums name.  No events will be raised*.
    
* `header` – The header rendered before suggestions in the dropdown menu. Can be either a DOM element or HTML.

* `footer` – The footer rendered after suggestions in the dropdown menu. Can be either a DOM element or HTML.

* `local` – An array of [datums][datum].

* `matcher` **>>New<<** - Function with the signature function(query,dataset) to override the normal suggestion getter for the local and prefetched data. It returns list of search items (suggestions) on the form {name: `<display name>`, value: `<key value>`, tokens: `<List of search tokens>`, datum: `<the datum object>`}.  The query parameter is the current search query and the dataset the typeahead dataset object.  
***Be warned:** it requires knowledge of the internals of typeahead's dataset to create function of this complexity.

* `prefetch` – Can be a URL to a JSON file containing an array of datums or function handling datum population or, if more configurability is needed, a [prefetch options object][prefetch].

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

Prefetched data is fetched and processed on initialization. If the browser supports local storage, the processed data will be cached there to prevent additional network requests on subsequent page loads.

When configuring `prefetch`, the following options are available:

* `url` – A URL to a JSON file containing an array of datums. **url or handler Required.**

* `prefetcHandler` **>>New<<** - Custom function with the signature `function()`, returning array of datums, to take control of the prefetched data retrieval.  This can be both used to handle local synchronous data or to fetch asynchronous data from remote source using the **promise pattern**.    
In case this function is used for asynchronous data fetch it must return  the data array wraped in`promise` (i.e. `return $.Deferred().resolve(data);`), but it should return the data arrey  for synchronous operations.  Both [JQuery promises](http://api.jquery.com/promise/ "JQuery promises") and [Q promises](http://documentup.com/kriskowal/q/#introduction) are supported.

* `ttl` – The time (in milliseconds) the prefetched data should be cached in local storage. Defaults to `86400000` (1 day).  Setting this value to 0 will prevent caching.

* `filter` – A function with the signature `filter(parsedResponse)` that transforms the response body into an array of datums. Expected to return an array of datums.

* `cacheKey` **>>New<<** – String or function returning string, to control the name used for caching of the prefetched values.  Using function for cachekey can be useful when using the typeahead reload method.

* `skipCache` **>>New<<** – If set to true, stops typeahead from caching prefetched values in browsers local store. Setting `ttl` to 0 has the same effect.


### Remote

Remote data is only used when the data provided by `local` and `prefetch` is insufficient. In order to prevent an obscene number of requests being made to remote endpoint, typeahead.js rate-limits remote requests.

When configuring `remote`, the following options are available:

* `url` – A URL to make requests to when  the data provided by `local` and `prefetch` is insufficient.  **`url` or `handler` options are required for remote lookups.**

* `handler` **>>New<<** - Custom function with the signature `function(query, data)` to take control of the typeahead data retrieval.  This can be both used to handle local synchronous data or to fetch asynchronous data from remote source using the **promise pattern**.    
In case this function is used for asynchronous data fetch it must return `promise`, but it should return `true` for synchronous operations.  Both [JQuery promises](http://api.jquery.com/promise/ "JQuery promises") and [Q promises](http://documentup.com/kriskowal/q/#introduction) are supported.  
When `handler` option is used for data retrieval the options `beforeSend`, `replace`, `wildcard`, `dataType` and  `cache` do not apply.  However the throttling options are used and the cache control is also in play.
See [this page](New.md) for details on the handler usage.

* `dataType` – The type of data you're expecting from the server. See the [jQuery.ajax docs][jquery-ajax] for more info. Defaults to `Json`.  This applies only in conjunction with the `url` option.

* `cache` – Determines whether or not JQuery will cache responses. See the [jQuery.ajax docs][jquery-ajax] for more info.  This applies only for the `url` option, by default all remote responses are cached for each query.

* `skipCache` **>>New<<** – Orders remote queries not to use local cache but always go remote for data lookup on each keystroke.  This can be useful for mutating remote data.

* `cacheKey` **>>New<<** –  By default all remote lookups are cached per string combination entered in the typeahead control. This option can be used to control caching which may be necessary if more than one typeahead control is used in the application. By default this value is set to the url value for `url` requests and the `name` value for `handler` requests.  
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

* `typeahead:noSelect` **>>New<<** – Triggered when user exists the input without text matching any name in the suggestion data.  This is also triggered if the input value is empty.

* `typeahead:reloaded` **>>New<<** – Triggered when dataset has been reloaded using the typeahead method `reload`.  

* `typeahead:busyUpdate` **>>New<<** – Triggered when the typeahead starts or stops lookup work -> is busy processing or looking up data.  This applies also to `prefetch` data.  This event can be used to manage loaders or busy indicators for the control. Your worker functon should have the following signature:  `function myFunction(element,isBusy)`  where isBusy is the boolean busy indication value.

All custom events are triggered on the element initialized as a typeahead.

You can use JQuery to hook the custom events to your handling functions.  
  
**Example:**  
    
    $(´#yourElementIdWithHash´.on('typeahead:selected', yourSelectedEventHanlerFunction); 
    
where the handler function has this format:
    
    function yourSelectedEventHanlerFunction(element,datum) { 
		//your implementation here
    }
  
Above the **datum** parameter contains the data for the suggestion you selected.   
**Element** is the input box **Dom** element.

### Template Engine Compatibility

Any template engine will work with typeahead.js as long as it adheres to the following API:
    
    // engine has a compile function that returns a compiled template
    var compiledTemplate = ENGINE.compile(template);
    
    // compiled template has a render function that returns the rendered template
    // render function expects the context to be first argument passed to it
    var html = compiledTemplate.render(context);
    

Check out [Hogan.js][hogan.js] if you're looking for a compatible mustache templating engine.

### Look and Feel

The styles applied by typeahead.js are for positioning the hint and the dropdown menu, no other styles should be affected. In most cases the styles applied by typeahead.js will work like a charm, but there are edge cases where some custom styles will be necessary. If you're having CSS issues, create an [issue](https://github.com/Svakinn/typeahead.js/issues) for support.

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

Typeahead also works on mobile browsers.

Issues
------

Discovered a bug? Please create an issue here on GitHub!

[https://github.com/Svakinn/typeahead.js/issues](https://github.com/Svakinn/typeahead.js/issues)


Original Authors
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

For this fork thanks to:  

* [@nathankoop](https://github.com/nathankoop) for the IE11 Bugfix  
* [@zhigang1992](https://github.com/zhigang1992) for the restrictInputToDatum option  
* [@ryanpitts](https://github.com/ryanpitts) for the nameKey idea and  implementation 

Contributing
-------
Unlike the original project there is no requirement of setting up build and test environment.
Just issue a pull request on the files you would like updated.

License
-------

Copyright 2013 Twitter, Inc. and other contributors

Licensed under the MIT License

[twitter]: https://twitter.com
[gh-page]: http://twitter.github.com/typeahead.js
[examples]: http://twitter.github.com/typeahead.js/examples
[@typeahead]: https://twitter.com/typeahead

<!-- assets -->
[zipball]: https://github.com/Svakinn/typeahead.js/archive/typeaheadSimple.zip
[typeahead.js]: https://raw.github.com/Svakinn/typeahead.js/typeaheadSimple/dist/typeahead.js

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
