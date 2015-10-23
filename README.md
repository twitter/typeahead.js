[![Build Status](https://travis-ci.org/corejavascript/typeahead.js.svg?branch=master)](https://travis-ci.org/corejavascript/typeahead.js)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/corejavascript/typeahead.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![bitHound Score](https://www.bithound.io/github/corejavascript/typeahead.js/badges/score.svg)](https://www.bithound.io/github/corejavascript/typeahead.js)
[![bitHound Dependencies](https://www.bithound.io/github/corejavascript/typeahead.js/badges/dependencies.svg)](https://www.bithound.io/github/corejavascript/typeahead.js/master/dependencies/npm)
[![License](http://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/iron/iron/master/LICENSE)

# [corejs-typeahead](https://typeahead.js.org/)

This is a maintained fork of [twitter.com](https://twitter.com)'s autocomplete search library, [typeahead.js](https://github.com/twitter/typeahead.js).

The typeahead.js library consists of 2 components: the suggestion engine,
[Bloodhound](https://github.com/corejavascript/typeahead.js/blob/master/doc/bloodhound.md), and the UI view, [Typeahead](https://github.com/corejavascript/typeahead.js/blob/master/doc/jquery_typeahead.md).
The suggestion engine is responsible for computing suggestions for a given
query. The UI view is responsible for rendering suggestions and handling DOM
interactions. Both components can be used separately, but when used together,
they can provide a rich typeahead experience.

## Getting Started

How you acquire typeahead.js is up to you:

* Install with [Bower](https://bower.io/): `$ bower install corejs-typeahead`

* Install with [npm](https://www.npmjs.com): `$ npm install corejs-typeahead`

* [Download zipball of latest release](https://typeahead.js.org/releases/latest/typeahead.js.zip)

* Download the latest dist files individually:
  * [bloodhound.js](https://typeahead.js.org/releases/latest/bloodhound.js) (standalone suggestion engine)
  * [typeahead.jquery.js](https://typeahead.js.org/typeahead.js/releases/latest/typeahead.jquery.js) (standalone UI view)
  * [typeahead.bundle.js](https://typeahead.js.org/typeahead.js/releases/latest/typeahead.bundle.js) (*bloodhound.js* + *typeahead.jquery.js*)
  * [typeahead.bundle.min.js](https://typeahead.js.org/typeahead.js/releases/latest/typeahead.bundle.min.js)

**Note:** both *bloodhound.js* and *typeahead.jquery.js* have a dependency on
[jQuery](http://jquery.com/) 1.9+.

## Documentation

* [Typeahead Docs](https://github.com/corejavascript/typeahead.js/blob/master/doc/jquery_typeahead.md)
* [Bloodhound Docs](https://github.com/corejavascript/typeahead.js/blob/master/doc/bloodhound.md)

## Examples

For some working examples of typeahead.js, visit the [examples page](https://typeahead.js.org/examples).

## Browser Support

* Chrome
* Firefox 3.5+
* Safari 4+
* Internet Explorer 8+
* Opera 11+

**NOTE:** typeahead.js is not tested on mobile browsers.

## Customer Support

For general questions about typeahead.js, tweet at [@typeahead](https://twitter.com/typeahead).

For technical questions, you should post a question on [Stack Overflow](http://stackoverflow.com/) and tag
it with [typeahead.js](http://stackoverflow.com/questions/tagged/typeahead.js).

## Issues

Discovered a bug? Please create an issue here on GitHub!

[github.com/corejavascript/typeahead.js/issues](https://github.com/corejavascript/typeahead.js/issues)

## Versioning

For transparency and insight into our release cycle, releases will be numbered
with the following format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backwards compatibility bumps the major
* New additions without breaking backwards compatibility bumps the minor
* Bug fixes and misc changes bump the patch

For more information on semantic versioning, please visit [semver.org](http://semver.org/).

## Testing

Tests are written using [Jasmine](http://jasmine.github.io/) and ran with [Karma](http://karma-runner.github.io/). To run
the test suite with PhantomJS, run `$ npm test`.

## Developers

If you plan on contributing to typeahead.js, be sure to read the
[contributing guidelines](https://github.com/corejavascript/typeahead.js/blob/master/CONTRIBUTING.md). A good starting place for new contributors are issues
labeled with [entry-level](https://github.com/corejavascript/typeahead.js/issues?&labels=entry-level&state=open). Entry-level issues tend to require minor changes
and provide developers a chance to get more familiar with typeahead.js before
taking on more challenging work.

In order to build and test typeahead.js, you'll need to install its dev
dependencies (`$ npm install`) and have [grunt-cli](https://github.com/gruntjs/grunt-cli)
installed (`$ npm install -g grunt-cli`). Below is an overview of the available
Grunt tasks that'll be useful in development.

* `grunt build` – Builds *typeahead.js* from source.
* `grunt lint` – Runs source and test files through JSHint.
* `grunt watch` – Rebuilds *typeahead.js* whenever a source file is modified.
* `grunt server` – Serves files from the root of typeahead.js on localhost:8888.
  Useful for using *test/playground.html* for debugging/testing.
* `grunt dev` – Runs `grunt watch` and `grunt server` in parallel.

## Maintainers

* **Jake Harding**
  * [@JakeHarding](https://twitter.com/JakeHarding)
  * [GitHub](https://github.com/jharding)

* **You?**

## Authors

* **Jake Harding**
  * [@JakeHarding](https://twitter.com/JakeHarding)
  * [GitHub](https://github.com/jharding)

* **Veljko Skarich**
  * [@vskarich](https://twitter.com/vskarich)
  * [GitHub](https://github.com/vskarich)

* **Tim Trueman**
  * [@timtrueman](https://twitter.com/timtrueman)
  * [GitHub](https://github.com/timtrueman)

## License

Copyright 2013 Twitter, Inc.

Licensed under the MIT License
