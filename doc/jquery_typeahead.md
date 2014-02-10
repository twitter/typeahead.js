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
* [Bloodhound Integration](#bloodhound-integration)

Features
--------

* Displays suggestions to end-users as they type
* Shows top suggestion as a hint (i.e. background text)
* Supports custom templates to allow for UI flexibility
* Works well with RTL languages and input method editors
* Highlights query matches within the suggestion
* Triggers custom events

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

#### jQuery.fn.typeahead.noConflict()

Returns a reference to the typeahead plugin and reverts `jQuery.fn.typeahead` 
to its previous value. Can be used to avoid naming collisions. 

```javascript
var typeahead = jQuery.fn.typeahead.noConflict();
jQuery.fn._typeahead = typeahead;
```

### Options

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

* `source` – The backing data source for suggestions. Expected to be a function 
  with the signature `(query, cb)`. It is expected that the function will 
  compute the suggestion set (i.e. an array of JavaScript objects) for `query` 
  and then invoke `cb` with said set. `cb` can be invoked synchronously or 
  asynchronously. A Bloodhound suggestion engine can be used here, to learn 
  how, see [Bloodhound Integration](#bloodhound-integration). **Required**.

* `name` – The name of the dataset. This will be appended to `tt-dataset-` to 
  form the class name of the containing DOM element.  Must only consist of 
  underscores, dashes, letters (`a-z`), and numbers. Defaults to a random 
  number.

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

The typeahead component triggers the following custom events.

* `typeahead:opened` – Triggered when the dropdown menu of a typeahead is 
  opened.

* `typeahead:closed` – Triggered when the dropdown menu of a typeahead is 
  closed.

* `typeahead:cursorchanged` – Triggered when the dropdown menu cursor is moved
  to a different suggestion. The event handler will be invoked with 3 
  arguments: the jQuery event object, the suggestion object, and the name of 
  the dataset the suggestion belongs to.

* `typeahead:selected` – Triggered when a suggestion from the dropdown menu is 
  selected. The event handler will be invoked with 3 arguments: the jQuery 
  event object, the suggestion object, and the name of the dataset the 
  suggestion belongs to.

* `typeahead:autocompleted` – Triggered when the query is autocompleted. 
  Autocompleted means the query was changed to the hint. The event handler will 
  be invoked with 3 arguments: the jQuery event object, the suggestion object, 
  and the name of the dataset the suggestion belongs to. 

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

Bloodhound Integration
----------------------

Because datasets expect their `source` to be a function, you cannot directly
pass a Bloodhound suggestion engine in as `source`. Rather, you'll need to 
pass the suggestion engine's typeahead adapter:

```javascript
var engine = new Bloodhound({ /* options */ });

engine.initialize();

$('.typeahead').typeahead(null, {
  source: engine.ttAdapter()
});
```
