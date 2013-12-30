[![build status](https://secure.travis-ci.org/twitter/typeahead.js.png?branch=master)](http://travis-ci.org/twitter/typeahead.js)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)


[typeahead.js][gh-page]
=======================

Inspired by [twitter.com]'s autocomplete search functionality, typeahead.js is 
a flexible JavaScript library that provides a strong foundation for building 
robust typeaheads.

The typeahead.js library consists of 2 components: the suggestion engine, 
[Bloodhound](#bloodhound), and the UI view, [Typeahead](#typeahead). 
The suggestion engine is responsible for computing suggestions for a given 
query. The UI view is responsible for rendering suggestions and handling DOM 
interactions. Both components can be used separately, but when used together, 
they can provided a rich typeahead experience.

<!-- section links -->

[gh-page]: http://twitter.github.io/typeahead.js/
[twitter.com]: https://twitter.com

Getting Started
---------------

How you acquire typeahead.js is up to you.

Preferred method:
* Install with [Bower]: `$ bower install typeahead.js`

Other methods:
* [Download zipball of latest release][zipball].
* Download the latest dist files individually:
  * *[bloodhound.js]* (standalone suggestion engine)
  * *[typeahead.js]* (standalone UI view)
  * *[typeahead.bundle.js]* (*bloodhound.js* + *typeahead.js*)
  * *[typeahead.bundle.min.js]*

**Note:** both *bloodhound.js* and *typeahead.js* have a dependency on 
[jQuery] 1.9+.

<!-- section links -->

[Bower]: http://bower.io/
[zipball]: http://twitter.github.com/typeahead.js/releases/latest/typeahead.js.zip
[bloodhound.js]: http://twitter.github.com/typeahead.js/releases/latest/bloodhound.js
[typeahead.js]: http://twitter.github.com/typeahead.js/releases/latest/typeahead.js
[typeahead.bundle.js]: http://twitter.github.com/typeahead.js/releases/latest/typeahead.bundle.js
[typeahead.bundle.min.js]: http://twitter.github.com/typeahead.js/releases/latest/typeahead.bundle.min.js
[jQuery]: http://jquery.com/

Table of Contents
-----------------

* [Features](#features)
* [Examples](#examples)
* [Typeahead](#typeahead)
  * [API](#typeahead-api)
  * [Options](#typeahead-options)
  * [Datasets](#datasets)
  * [Custom Events](#custom-events)
  * [Look and Feel](#look-and-feel)
* [Bloodhound](#bloodhound)
  * [API](#bloodhound-api)
  * [Options](#bloodhound-options)
  * [Prefetch](#prefetch)
  * [Remote](#remote)
  * [Tokens](#tokens)
* [Datum](#datum)
* [Browser Support](#broswer-support)
* [Customer Support](#customer-support)
* [Issues](#issues)
* [Versioning](#versioning)
* [Testing](#testing)
* [Developers](#developers)
* [Authors](#authors)
* [License](#license)

Features
--------

**Typeahead**

* Displays suggestions to end-users as they type
* Shows top suggestion as a hint (i.e. background text)
* Supports custom templates to allow for UI flexibility
* Works well with RTL languages and input method editors
* Highlights query matches within the suggestion
* Triggers custom events

**Bloodhound**

* Works with hardcoded data
* Prefetches data on initialization to reduce suggestion latency
* Uses local storage intelligently to cut down on network requests
* Backfills suggestions from a remote source
* Rate-limits and caches network requests to remote sources to lighten the load

Examples
--------

For some working examples of typeahead.js, visit the [examples page].

<!-- section links -->

[examples page]: http://twitter.github.io/typeahead.js/examples

Typeahead
---------

The typeahead component is a jQuery plugin for adding typeahead functionality
to `input` elements. It deals with rendering suggestions and handling DOM
interactions. 

### Typeahead API

#### jQuery#typeahead(options, [\*datasets])

Turns any `input[type="text"]` element into a typeahead. `options` is an 
options hash that's used to configure the typeahead to your liking.
[Typeahead Options](#typeahead-options) goes over the available configs. 
Subsequent arguments (`*datasets`), are individual option hashes for datasets. 
For more details regarding datasets, refer to [Datasets](#datasets).

```javascript
$('.typeahead').typeahead({
  minLength: 3,
  hightlight: true,
},
{
  name: 'hanson-brothers',
  source: {
    local: ['Jeff', 'Steve', 'Jack']
  }
});
```

#### jQuery#typeahead('destroy')

Removes typeahead functionality and reverts the `input` element back to its 
original state.

```javascript
$('.typeahead').typeahead('destroy');
```

#### jQuery#typeahead('open')

Opens the dropdown menu of typeahead. Note that being open does not mean that
the menu is visible. The menu is only visible when it is open and has content.

```javascript
$('.typeahead').typeahead('open');
```

#### jQuery#typeahead('close')

Closes the dropdown menu of typeahead.

```javascript
$('.typeahead').typeahead('close');
```

#### jQuery#typeahead('val')

Returns the current value of the typeahead. The value is the text the user has 
entered into the `input` element.

```javascript
var myVal = $('.typeahead').typeahead('val');
```

#### jQuery#typeahead('val', val)

Sets the value of the typeahead. This should be used in place of `jQuery#val`.

```javascript
$('.typeahead').typeahead('val', myVal);
```

### Typeahead Options

When initializing a typeahead, there are a number of options you can configure.

* `autoselect` – If `true`, defaults the suggestion selection to the top 
  suggestion when the user keys enter while the dropdown menu is open. Defaults
  to `false`.

* `highlight` – If `true`, when suggestions are rendered, pattern matches
  for the current query in text nodes will be wrapped in a `strong` element. 
  Defaults to `false`.

* `hint` – If `false`, the typeahead will not show a hint. Defaults to `true`.

* `minLength` – The minimum character length needed before suggestions start 
  getting rendered. Defaults to `1`.

### Datasets

A typeahead is composed of one or more datasets. For simple use cases, one 
dataset will usually suffice. If however you wanted to build something like
the search typeahead on twitter.com, you'd need multiple datasets.

Datasets can be configured using the following options.

* `name` – The name of the dataset. This will be prepended to `tt-dataset-` to 
  form the class name of the containing DOM element. Defaults to a random 
  number.

* `source` – The backing data source that provides suggestions. Expected to be 
  either an [options hash for a bloodhound](#bloodhound-options), a Bloodhound
  instance, or a function with the signature `(query, cb)`. If the last option 
  is used, it is expected that the function will compute the suggestion set for
  `query`, convert the suggestions to an array of [datums](#datums), and then 
  invoke `cb` with that array as the first and only argument. **Required**.

* `templates` – A hash of templates to be used when rendering the dataset.

  * `empty` – Rendered when `0` suggestions are available for the given query. 
  Can be either a HTML string or a precompiled template. If it's a precompiled
  template, the passed in context will contain `query`.

  * `footer`– Rendered at the bottom of the dataset. Can be either a HTML 
  string or a precompiled template. If it's a precompiled template, the passed 
  in context will contain `query` and `isEmpty`.

  * `header` – Rendered at the top of the dataset. Can be either a HTML string 
  or a precompiled template. If it's a precompiled template, the passed in 
  context will contain `query` and `isEmpty`.

  * `suggestion` – Used to render a single suggestion. If set, this has to be a 
  precompiled template. The associated datum object will serves as the context. 
  Defaults to the value of the datum wrapped in a `p` tag i.e. 
  `<p>{{query}}</p>`.

### Custom Events

The typeahead component triggers the following custom events.

* `typeahead:initialized` – Triggered after the source of each dataset has
  been initialized. Note, for non-bloodhound sources, initialization cannot
  be detected so those sources are ignored i.e. if you use all non-bloodhound
  sources, this event will be triggered right away.

* `typeahead:opened` – Triggered when the dropdown menu of a typeahead is 
  opened.

* `typeahead:closed` – Triggered when the dropdown menu of a typeahead is 
  closed.

* `typeahead:cursorchanged` – Triggered when the dropdown menu cursor is moved
  to a different suggestion. The datum for the suggestion that the cursor was
  moved to is passed to the event handler as an argument in addition to the name 
  of the dataset it belongs to.

* `typeahead:selected` – Triggered when a suggestion from the dropdown menu is 
  selected. The datum for the selected suggestion is passed to the event handler 
  as an argument in addition to the name of the dataset it belongs to.

* `typeahead:autocompleted` – Triggered when the query is autocompleted. 
  Autocompleted means the query was changed to the hint. The datum used for 
  autocompletion is passed to the event handler as an argument in addition to 
  the name of the dataset it belongs to.

All custom events are triggered on the element initialized as a typeahead.

### Look and Feel

Below is a faux mustache template describing the DOM structure of a typeahead 
dropdown menu. Keep in mind that `header`, `footer`, `suggestion`, and `empty` 
come from the provided templates detailed [here](#datasets). 

```html
<span class="tt-dropdown-menu">
  {{#datasets}}
    <div class="tt-dataset-{{name}}">
      {{{header}}}
      <span class="tt-suggestions">
        {{#suggestions}}
          <div class="tt-suggestion">{{{suggestion}}}</div>
        {{/suggestions}}
        {{^suggestions}}
          {{{empty}}}
        {{/suggestions}}
      </span>
      {{{footer}}}
    </div>
  {{/datasets}}
</span>
```

When an end-user mouses or keys over a `.tt-suggestion`, the class `tt-cursor` 
will be added to it. You can use this class as a hook for styling the "under 
cursor" state of suggestions.

Bloodhound
----------

Bloodhounds are the data components responsible for computing a set of
suggestions for a given query. They're robust, flexible, and offer advanced 
functionality such as prefetching, intelligent caching, fast lookups, and 
backfilling with remote data.

### Bloodhound API

#### Constructor

The constructor function. It takes an [options hash](#bloodhound-options).

```javascript
var bloodhound = new Bloodhound({
  name: 'animals',
  local: ['dog', 'pig', 'moose'],
  remote: 'http://example.com/animals?q=%QUERY'
});
```

#### Bloodhound#initialize()

Kicks off the initialization of the bloodhound. This includes processing the 
data provided through `local` and fetching and processing the data provided by 
`prefetch`. `Bloodhound#get` will be useless until the bloodhound has been
intialized. Returns a [jQuery promise] which is resolved when the fetching and 
processing has finished.

```javascript
bloodhound.initialize();
```

<!-- section links -->

[jQuery promise]: http://api.jquery.com/Types/#Promise

#### Bloodhound#get(query, cb)

Retrieves suggestions for `query` and invokes `cb` with them. `cb` will always 
be called at least once with the mixed results from `local` and `prefetch`. If 
those results are insufficent, `cb` will be called again later with the mixed 
results from `local`, `prefetch`, **and** `remote`.

```javascript
bloodhound.get(myQuery, function(suggestions) {
  suggestions.each(function(suggestion) {
    console.log(suggestion.value);
  });
});
```

### Bloodhound Options

When initializing a Bloodhound, there are a number of options you can 
configure.

* `valueKey` – The key used to access the value of the datum in the datum 
  object. Defaults to `value`.

* `limit` – The max number of suggestions to return from `Bloodhound#get`. If 
  not reached, the data source will attempt to backfill the suggestions from 
  `remote`.

* `tokenizer` – A function with the signature `(str)` that returns an array of
  tokens. The default implementation of `tokenizer` splits `str` on whitespace.

* `dupDetector` – This is used for making sure no duplicate suggestions are 
  introduced from `remote`. Expected to be either `true`, `false`, or a 
  function with the signature `(datum1, datum2)` that returns `true` if the 
  datums are duplicates or `false` otherwise. If set to `true`, a function that 
  compares value properties will be used. If set to `false`, duplicate 
  detection will not be performed.

* `sorter` – A [compare function] used to sort matched datums for a given query.

* `local` – An array of [datums](#datum).

* `prefetch` – Can be a URL to a JSON file containing an array of datums or, if 
  more configurability is needed, a [prefetch options hash](#prefetch).

* `remote` – Can be a URL to fetch suggestions from when the data provided by 
  `local` and `prefetch` is insufficient or, if more configurability is needed, 
  a [remote options hash](#remote).

<!-- section links -->

[compare function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort

### Prefetch

Prefetched data is fetched and processed on initialization. If the browser 
supports local storage, the processed data will be cached there to 
prevent additional network requests on subsequent page loads.

When configuring `prefetch`, the following options are available.

* `url` – A URL to a JSON file containing an array of datums. **Required.**

* `cacheKey` – The key that data will be stored in local storage under. 
  Defaults to `url`.

* `ttl` – The time (in milliseconds) the prefetched data should be cached in 
  local storage. Defaults to `86400000` (1 day).

* `thumbprint` – A string used for thumbprinting prefetched data. If this
  doesn't match what's stored in local storage, the data will be refetched.

* `filter` – A function with the signature `filter(parsedResponse)` that 
  transforms the response body into an array of datums. Expected to return an 
  array of datums.

* `ajax` – The [ajax settings object] passed to `jQuery.ajax`.

<!-- section links -->

[ajax settings object]:http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings

### Remote

Remote data is only used when the data provided by `local` and `prefetch` is 
insufficient. In order to prevent an obscene number of requests being made to
the remote endpoint, typeahead.js rate-limits remote requests.

When configuring `remote`, the following options are available.

* `url` – A URL to make requests to when when the data provided by `local` and 
  `prefetch` is insufficient. **Required.**

* `wildcard` – The pattern in `url` that will be replaced with the user's query 
  when a request is made. Defaults to `%QUERY`.

* `replace` – A function with the signature `replace(url, query)` that can be 
  used to override the request URL. Expected to return a valid URL. If set, no 
  `wildcard` substitution will be performed on `url`.

* `rateLimitBy` – The method used to rate-limit network requests. Can be either 
  `debounce` or `throttle`. Defaults to `debounce`.

* `rateLimitWait` – The time interval in milliseconds that will be used by 
  `rateLimitBy`. Defaults to `300`.

* `filter` – A function with the signature `filter(parsedResponse)` that 
  transforms the response body into an array of datums. Expected to return an 
  array of datums.

* `ajax` – The [ajax settings object] passed to `jQuery.ajax`.

<!-- section links -->

[ajax settings object]: http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings

### Tokens

The algorithm used by bloodhounds for providing suggestions for a given query 
is token-based. When `Bloodhound#get` is called, it tokenizes `query` using 
`tokenizer` and then invokes `cb` with all of the datums that contain those 
tokens.

By default, a bloodhound will generate tokens for a datum by tokenizing its 
value with `tokenizer`. However, it is possible to explicitly set the tokens 
for a datum by including a `tokens` property.

```javascript
{
  value: 'typeahead.js'
  tokens: ['typeahead.js', 'typeahead', 'autocomlete', 'javascript'];
}
```

The above datum would be a valid suggestion for queries such as:

* `typehead`
* `typehead.js`
* `autoco`
* `java type`

Datum
-----

The data representation of a suggestion is referred to as a datum. A datum is
an object that can contain arbitrary properties. When a suggestion is 
rendered, its datum will be the context passed the precompiled suggestion 
template.

Datums are expected to contain a value property – when a suggestion is 
selected, this will be what the value of the `input` is set to. By default,
it's expected the name of this property will be `value`, but it's configurable.
See [Bloodhound Options](#bloodhound-options) for more details.

For ease of use, datums can also be represented as a string. Strings found in 
place of datum objects are implicitly converted to an object with its value
property set to the string.

Here's a datum in its simplest form.

```javascript
{
  value: "monkey"
}
```

Here's a more complex datum that would be used for a Twitter account 
typeahead. The value property here is `handle` and the datum contains additional
properties to make it possible to render richer suggestions. This datum also
explicitly sets its [tokens](#tokens).

```javascript
{
  name: 'Jake Harding',
  handle: '@JakeHarding',
  tokens: ['jake', 'harding', 'jakeharding', '@jakeharding'],
  profileImageUrl: 'https://twitter.com/JakeHaridng/path/to/img'
}
```

Browser Support
---------------

* Chrome
* Firefox 3.5+
* Safari 4+
* Internet Explorer 7+
* Opera 11+

Customer Support
----------------

For general questions about typeahead.js, tweet at [@typeahead].

For technical questions, you should post a question on [Stack Overflow] and tag 
it with [typeahead.js][so tag].

<!-- section links -->

[Stack Overflow]: http://stackoverflow.com/
[@typeahead]: https://twitter.com/typeahead
[so tag]: http://stackoverflow.com/questions/tagged/typeahead.js

Issues
------

Discovered a bug? Please create an issue here on GitHub!

https://github.com/twitter/typeahead.js/issues

Versioning
----------

For transparency and insight into our release cycle, releases will be numbered 
with the follow format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backwards compatibility bumps the major
* New additions without breaking backwards compatibility bumps the minor
* Bug fixes and misc changes bump the patch

For more information on semantic versioning, please visit http://semver.org/.

Testing
-------

Tests are written using [Jasmine] and ran with [Karma]. To run
the test suite with PhantomJS, run `$ npm test`.

<!-- section links -->

[Jasmine]: http://pivotal.github.com/jasmine/
[Karma]: http://karma-runner.github.io/

Developers
----------

If you plan on contributing to typeahead.js, be sure to read the 
[contributing guidelines].

In order to build and test typeahead.js, you'll need to install its dev 
dependencies (`$ npm install`) and have [grunt-cli] 
installed (`$ npm install -g grunt-cli`). Below is an overview of the available 
Grunt tasks that'll be useful in development.

* `grunt build` – Builds *typeahead.js* from source.
* `grunt lint` – Runs source and test files through JSHint.
* `grunt watch` – Rebuilds *typeahead.js* whenever a source file is modified.
* `grunt server` – Serves files from the root of typeahead.js on localhost:8888. 
  Useful for using *test/playground.html* for debugging/testing.
* `grunt dev` – Runs `grunt watch` and `grunt server` in parallel.

<!-- section links -->

[contributing guidelines]: https://github.com/twitter/typeahead.js/blob/master/CONTRIBUTING.md
[grunt-cli]: https://github.com/gruntjs/grunt-cli

Authors
-------

* **Jake Harding** 
  * [@JakeHarding](https://twitter.com/JakeHarding) 
  * [GitHub](https://github.com/jharding)

* **Veljko Skarich**
  * [@vskarich](https://twitter.com/vskarich) 
  * [GitHub](https://github.com/velsgithub)

* **Tim Trueman**
  * [@timtrueman](https://twitter.com/timtrueman) 
  * [GitHub](https://github.com/timtrueman)

License
-------

Copyright 2013 Twitter, Inc.

Licensed under the MIT License
