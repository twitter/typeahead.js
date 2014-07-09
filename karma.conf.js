// Karma configuration
// Generated on Sun Jun 30 2013 00:14:30 GMT-0700 (PDT)


// base path, that will be used to resolve files and exclude
basePath = '';

preprocessors = {
'src/**/*.js': 'coverage'
};

// list of files / patterns to load in the browser
files = [
  'bower_components/jquery/jquery.js',
  'src/common/utils.js',
  'src/bloodhound/version.js',
  'src/bloodhound/tokenizers.js',
  'src/bloodhound/lru_cache.js',
  'src/bloodhound/persistent_storage.js',
  'src/bloodhound/transport.js',
  'src/bloodhound/search_index.js',
  'src/bloodhound/options_parser.js',
  'src/bloodhound/bloodhound.js',
  'src/typeahead/html.js',
  'src/typeahead/css.js',
  'src/typeahead/event_bus.js',
  'src/typeahead/event_emitter.js',
  'src/typeahead/highlight.js',
  'src/typeahead/input.js',
  'src/typeahead/dataset.js',
  'src/typeahead/dropdown.js',
  'src/typeahead/typeahead.js',
  'src/typeahead/plugin.js',
  JASMINE,
  JASMINE_ADAPTER,
  'test/fixtures/**/*',
  'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
  'bower_components/jasmine-ajax/lib/mock-ajax.js',
  'test/helpers/**/*',
  'test/*_spec.js'
];


// list of files to exclude
exclude = [

];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['progress', 'coverage'];


// web server port
port = 9876;


// cli runner port
runnerPort = 9100;

// code coverage configs
coverageReporter = {
  type : 'html',
  dir : 'test/coverage/'
}

// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['Chrome'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;
