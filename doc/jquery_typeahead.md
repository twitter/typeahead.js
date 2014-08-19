jQuery#typeahead
----------------

The UI component of typeahead.js is a available as a jQuery plugin. It's 
responsible for rendering suggestions and handling DOM interactions.

Table of Contents
-----------------

* [Features](#features)
* [Usage](#usage)
  * [API](#api)
  * [Options](#options)
  * [Datasets](#datasets)
  * [Custom Events](#custom-events)
  * [Look and Feel](#look-and-feel)

Features
--------

* Displays suggestions to end-users as they type
* Shows top suggestion as a hint (i.e. background text)
* Supports custom templates to allow for UI flexibility
* Works well with RTL languages and input method editors
* Highlights query matches within the suggestion
* Triggers custom events to encourage extensibility

Usage
-----

### API

#### jQuery#typeahead(options, [\*datasets])

Turns any `input[type="text"]` element into a typeahead. `options` is an 
options hash that's used to configure the typeahead to your liking. Refer to 
[Options](#options) for more info regarding the available configs. Subsequent 
arguments (`*datasets`), are individual option hashes for datasets. For more 
details regarding datasets, refer to [Datasets](#datasets).

```javascript
$('.typeahead').typeahead({
  minLength: 3,
  highlight: true,
},
{
  name: 'my-dataset',
  source: mySource
});
```

#### jQuery#typeahead('isEnabled')

Returns `true` if the typeahead is enabled, `false` if it is disabled. Note that
a typeahead can only be disabled through the usage of 
`jQuery#typeahead('disable')`.

```javascript
var isEnabled = $('.typeahead').typeahead('isEnabled');
```
#### jQuery#typeahead('enable')

Enables the typeahead which means the typeahead can become active. Out of the 
box, typeaheads are enabled.

```javascript
$('.typeahead').typeahead('enable');
```

#### jQuery#typeahead('disable')

Disables the typeahead which means the typeahead **cannot** become active.

```javascript
$('.typeahead').typeahead('disable');
```

#### jQuery#typeahead('activate')

Normally a typehead enters an active state when the end-user focuses on the 
input element. However, if you wanted to acheive this programmatically, this
method will move the typeahead to an active state as long as it is enabled.

Note being active means the typeahead will respond to interactions e.g. query
changes.

```javascript
$('.typeahead').typeahead('activate');
```

#### jQuery#typeahead('deactivate')

Moves the typeahead to an idle state. Normally this happens when the input
loses focus.

```javascript
$('.typeahead').typeahead('deactivate');
```

#### jQuery#typeahead('isOpen')

Returns `true` if the results container is open, `false` if it is closed.

```javascript
var isOpen = $('.typeahead').typeahead('isOpen');
```

#### jQuery#typeahead('open')

Opens the results container.

```javascript
$('.typeahead').typeahead('open');
```

#### jQuery#typeahead('close')

Closes the results container.

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

#### jQuery#typeahead('select', $selectable)

Programmatically selects the `$selectable` element.

```javascript
var $selectable = $('.tt-selectable').first();
$('.typeahead').typeahead('select', $selectable);
```

#### jQuery#typeahead('autocomplete', $selectable)

Programmatically autocompletes to the `$selectable` element.

```javascript
var $selectable = $('.tt-selectable').first();
$('.typeahead').typeahead('autocomplete', $selectable);
```

#### jQuery#typeahead('moveCursor', $selectable)

Programmatically moves the results container cursor to  the `$selectable` 
element.

```javascript
var $selectable = $('.tt-selectable').first();
$('.typeahead').typeahead('moveCursor', $selectable);
```

#### jQuery#typeahead('destroy')

Removes typeahead functionality and reverts the `input` element back to its 
original state.

```javascript
$('.typeahead').typeahead('destroy');
```

#### jQuery.fn.typeahead.noConflict()

Returns a reference to the typeahead plugin and reverts `jQuery.fn.typeahead` 
to its previous value. Can be used to avoid naming collisions. 

```javascript
var typeahead = jQuery.fn.typeahead.noConflict();
jQuery.fn._typeahead = typeahead;
```

### Options

When initializing a typeahead, there are a number of options you can configure.

* `highlight` – If `true`, when suggestions are rendered, pattern matches
  for the current query in text nodes will be wrapped in a `strong` element with
  `tt-highlight` class. Defaults to `false`.

* `hint` – If `false`, the typeahead will not show a hint. Defaults to `true`.

* `minLength` – The minimum character length needed before suggestions start 
  getting rendered. Defaults to `1`.

### Datasets

A typeahead is composed of one or more datasets. When an end-user modifies the
value of a typeahead, each dataset will attempt to render suggestions for the
new value. 

For most use cases, one dataset should suffice. It's only in the scenario where
you want rendered suggestions to be grouped in the dropdown menu based on some 
sort of categorical relationship that you'd need to use multiple datasets. For
example, on twitter.com, the search typeahead groups results into recent 
searches, trends, and accounts – that would be a great use case for using 
multiple datasets.

Datasets can be configured using the following options.

* `source` – The backing data source for suggestions. Expected to be a 
  Bloodhound instance or a function with the signature `(query, asyncResults)`.
  If using the latter, the function should return synchronous suggestions and
  use the `asyncResults` callback function to return suggestions that are 
  gathered asynchronously. **Required**.

* `async` – Lets the dataset know if async suggestions should be expected. If
  not set, this information is inferred from the signature of `source` i.e.
  if the `source` function expects 2 arguments, `async` will be set to `true`.

* `name` – The name of the dataset. This will be appended to `tt-dataset-` to 
  form the class name of the containing DOM element.  Must only consist of 
  underscores, dashes, letters (`a-z`), and numbers. Defaults to a random 
  number.

* `limit` – The max number of suggestions to be displayed. Defaults to `5`.

* `displayKey` – For a given suggestion object, determines the string 
  representation of it. This will be used when setting the value of the input
  control after a suggestion is selected. Can be either a key string or a 
  function that transforms a suggestion object into a string. Defaults to 
  `value`.

* `templates` – A hash of templates to be used when rendering the dataset. Note
  a precompiled template is a function that takes a JavaScript object as its
  first argument and returns a HTML string.

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
  precompiled template. The associated suggestion object will serve as the 
  context. Defaults to the value of `displayKey` wrapped in a `p` tag i.e. 
  `<p>{{value}}</p>`.

### Custom Events

The following events get triggered on the input element during the lifecycle of
a typeahead.

* `typeahead:active` – Fired when the typeahead moves to active state.

* `typeahead:idle` – Fired when the typeahead moves to idle state.

* `typeahead:open` – Fired when the results container is opened.

* `typeahead:close` – Fired when the results container is closed.

* `typeahead:change` – Normalized version of the native [`change` event]. 
  Fired when input loses focus and the value has changed since it originally 
  received focus.

* `typeahead:render` – Fired when suggestions are rendered for a dataset. The
  event handler will be invoked with 4 arguments: the jQuery event object, the
  suggestions that were rendered, a flag indicating whether the suggestions
  were fetched asynchronously, and the name of the dataset the rendering 
  occured in.

* `typeahead:select` – Fired when a suggestion is selected. The event handler 
  will be invoked with 2 arguments: the jQuery event object and the suggestion
  object that was selected.

* `typeahead:autocomplete` – Fired when a autocompletion occurs. The 
  event handler will be invoked with 2 arguments: the jQuery event object and 
  the suggestion object that was used for autocompletion.

* `typeahead:cursorchange` – Fired when the results container cursor moves. The 
  event handler will be invoked with 2 arguments: the jQuery event object and 
  the suggestion object that was moved to.

* `typeahead:asyncrequest` – Fired when an async request for suggestions is 
  sent. The event handler will be invoked with 3 arguments: the jQuery event 
  object, the current query, and the name of the dataset the async request 
  belongs to.

* `typeahead:asynccancel` – Fired when an async request is cancelled. The event 
  handler will be invoked with 3 arguments: the jQuery event object, the current 
  query, and the name of the dataset the async request belonged to.

* `typeahead:asyncreceive` – Fired when an async request completes. The event 
  handler will be invoked with 3 arguments: the jQuery event object, the current 
  query, and the name of the dataset the async request belongs to.

<!-- section links -->

[`change` event]: https://developer.mozilla.org/en-US/docs/Web/Events/change

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
