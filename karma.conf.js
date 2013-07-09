// Karma configuration
// Generated on Sun Jun 30 2013 00:14:30 GMT-0700 (PDT)


// base path, that will be used to resolve files and exclude
basePath = '';


// list of files / patterns to load in the browser
files = [
  'test/vendor/**/*',
  'src/version.js',
  'src/utils.js',
  'src/html.js',
  'src/css.js',
  'src/lru_cache.js',
  'src/event_emitter.js',
  'src/persistent_storage.js',
  'src/transport.js',
  'src/search_index.js',
  'src/dataset.js',
  'src/section_view.js',
  'src/dropdown_view.js',
  'src/input_view.js',
  'src/typeahead_view.js',
  JASMINE,
  JASMINE_ADAPTER,
  'test/fixtures/**/*',
  'test/helpers/**/*',
  'test/*_spec.js'
];


// list of files to exclude
exclude = [

];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['progress'];


// web server port
port = 9876;


// cli runner port
runnerPort = 9100;


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
