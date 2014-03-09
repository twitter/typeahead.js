Bloodhound
==========

Bloodhound is the typeahead.js suggestion engine. Bloodhound is robust, 
flexible, and offers advanced functionalities such as prefetching, intelligent
caching, fast lookups, and backfilling with remote data.

Table of Contents
-----------------

* [Features](#features)
* [Usage](#usage)
  * [API](#api)
  * [Options](#options)
  * [Prefetch](#prefetch)
  * [Remote](#remote)
  * [Datums](#datums)
  * [Tokens](#tokens)

Features
--------

* Works with hardcoded data
* Prefetches data on initialization to reduce suggestion latency
* Uses local storage intelligently to cut down on network requests
* Backfills suggestions from a remote source
* Rate-limits and caches network requests to remote sources to lighten the load

Usage
-----

### API

#### new Bloodhound(options)

The constructor function. It takes an [options hash](#options) as its only 
argument.

```javascript
var engine = new Bloodhound({
  name: 'animals',
  local: [{ val: 'dog' }, { val: 'pig' }, { val: 'moose' }],
  remote: 'http://example.com/animals?q=%QUERY',
  datumTokenizer: function(d) { 
      return Bloodhound.tokenizers.whitespace(d.val); 
  },
  queryTokenizer: Bloodhound.tokenizers.whitespace
});
```

#### Bloodhound#initialize(reinitialize)

Kicks off the initialization of the suggestion engine. This includes processing 
the data provided through `local` and fetching/processing the data provided 
through `prefetch`. Until initialized, all other methods will behave as no-ops.
Returns a [jQuery promise] which is resolved when engine has been initialized.

```javascript
var promise = engine.initialize();

promise
.done(function() { console.log('success!'); })
.fail(function() { console.log('err!'); });
```

After the initial call of `initialize`, how subsequent invocations of the method
behave depends on the `reinitialize` argument. If `reinitialize` is falsy, the
method will not execute the initialization logic and will just return the same 
jQuery promise returned by the initial invocation. If `reinitialize` is truthy,
the method will behave as if it were being called for the first time.

```javascript
var promise1 = engine.initialize();
var promise2 = engine.initialize();
var promise3 = engine.initialize(true);

promise1 === promise2;
promise3 !== promise1 && promise3 !== promise2;
```

#### Bloodhound#add(datums)

Takes one argument, `datums`, which is expected to be an array of 
[datums](#datums). The passed in datums will get added to the search index that
powers the suggestion engine.

```javascript
engine.add([{ val: 'one' }, { val: 'two' }]);
```

#### Bloodhound#clear()

Removes all suggestions from the search index.

```javascript
engine.clear();
```

#### Bloodhound#clearPrefetchCache()

If you're using `prefetch`, data gets cached in local storage in an effort to
cut down on unnecessary network requests. `clearPrefetchCache` offers a way to
programmatically clear said cache.

```javascript
engine.clearPrefetchCache();
```

#### Bloodhound#clearRemoteCache()

If you're using `remote`, Bloodhound will cache the 10 most recent responses
in an effort to provide a better user experience. `clearRemoteCache` offers a 
way to programmatically clear said cache.

```javascript
engine.clearRemoteCache();
```

#### Bloodhound.noConflict()

Returns a reference to the Bloodhound constructor and reverts 
`window.Bloodhound` to its previous value. Can be used to avoid naming 
collisions. 

```javascript
var Dachshund = Bloodhound.noConflict();
```


<!-- section links -->

[jQuery promise]: http://api.jquery.com/Types/#Promise

#### Bloodhound#get(query, cb)

Computes a set of suggestions for `query`. `cb` will be invoked with an array
of datums that represent said set. `cb` will always be invoked once 
synchronously with suggestions that were available on the client. If those
suggestions are insufficient (# of suggestions is less than `limit`) and `remote` was configured, `cb` may also be 
invoked asynchronously with the suggestions available on the client mixed with
suggestions from the `remote` source.

```javascript
bloodhound.get(myQuery, function(suggestions) {
  suggestions.each(function(suggestion) { console.log(suggestion); });
});
```

### Options

When instantiating a Bloodhound suggestion engine, there are a number of 
options you can configure.

* `datumTokenizer` – A function with the signature `(datum)` that transforms a
  datum into an array of string tokens. **Required**.

* `queryTokenizer` – A function with the signature `(query)` that transforms a
  query into an array of string tokens. **Required**.

* `limit` – The max number of suggestions to return from `Bloodhound#get`. If 
  not reached, the data source will attempt to backfill the suggestions from 
  `remote`.

* `dupDetector` – If set, this is expected to be a function with the signature 
  `(remoteMatch, localMatch)` that returns `true` if the datums are duplicates or 
  `false` otherwise. If not set, duplicate detection will not be performed.

* `sorter` – A [compare function] used to sort matched datums for a given query.

* `local` – An array of [datums](#datum) or a function that returns an array of
  datums.

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
  Defaults to value of `url`.

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
the remote endpoint, requests are rate-limited.

When configuring `remote`, the following options are available.

* `url` – A URL to make requests to when when the data provided by `local` and 
  `prefetch` is insufficient. **Required.**

* `wildcard` - The pattern in `url` that will be replaced with the user's query 
  when a request is made. Defaults to `%QUERY`. 

* `replace` – A function with the signature `replace(url, query)` that can be 
  used to override the request URL. Expected to return a valid URL. If set, no 
  wildcard substitution will be performed on `url`.

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

### Datums

Datums are JavaScript objects the hydrate the pool of possible suggestions.
Bloodhound doesn't expect datums to contain any specific properties as any
operations performed on datums are done using functions defined by the user i.e.
`datumTokenizer`, `dupDetector`, and `sorter`.

### Tokens

The algorithm used by bloodhounds for providing suggestions for a given query 
is token-based. When `Bloodhound#get` is called, it tokenizes `query` using 
`queryTokenizer` and then invokes `cb` with all of the datums that contain those 
tokens.

For a quick example, if a datum was tokenized into the following set of 
tokens...

```javascript
['typeahead.js', 'typeahead', 'autocomplete', 'javascript'];
```

...it would be a valid match for queries such as:

* `typehead`
* `typehead.js`
* `autoco`
* `java type`
