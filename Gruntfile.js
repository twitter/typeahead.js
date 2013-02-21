// release tasks
// 1. grunt build
// 2. grunt bump
// 3. grunt component
// 4. grunt publish_assets

var jsFiles = [
      'src/js/version.js',
      'src/js/utils.js',
      'src/js/event_target.js',
      'src/js/persistent_storage.js',
      'src/js/request_cache.js',
      'src/js/transport.js',
      'src/js/dataset.js',
      'src/js/input_view.js',
      'src/js/dropdown_view.js',
      'src/js/typeahead_view.js',
      'src/js/typeahead.js'
    ];

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    buildDir: 'dist',

    banner: [
      '/*!',
      ' * Twitter Typeahead <%= pkg.version %>',
      ' * https://github.com/twitter/typeahead',
      ' * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT',
      ' */\n\n'
    ].join('\n'),

    concat: {
      js: {
        src: ['src/js/intro.js', jsFiles, 'src/js/outro.js'],
        dest: '<%= buildDir %>/typeahead.js'
      },
      jsmin: {
        src: ['src/js/intro.js', jsFiles, 'src/js/outro.js'],
        dest: '<%= buildDir %>/typeahead.min.js'
      }
    },

    sed: {
      version: {
        pattern: '%VERSION%',
        replacement: '<%= pkg.version %>',
        path: ['<%= concat.js.dest %>', '<%= concat.jsmin.dest %>']
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      js: {
        options: {
          mangle: false,
          beautify: true,
          compress: false
        },
        src: '<%= concat.js.dest %>',
        dest: '<%= concat.js.dest %>'
      },
      jsmin: {
        options: {
          mangle: true,
          compress: true
        },
        src: '<%= concat.jsmin.dest %>',
        dest: '<%= concat.jsmin.dest %>'
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      src: jsFiles,
      tests: ['test/*.js'],
      gruntfile: ['Gruntfile.js']
    },

    watch: {
      js: {
        files: jsFiles,
        tasks: 'build:js'
      }
    },

    jasmine: {
      js: {
        src: jsFiles,
        options: {
          specs: 'test/*_spec.js',
          helpers: 'test/helpers/*',
          vendor: 'test/vendor/*'
        }
      }
    },

    exec: {
      open_spec_runner: {
        cmd: 'open _SpecRunner.html'
      },
      bump: {
        cmd: function(v) {
          return [
            'npm version ' + v,
            'git push',
            'git push --tags'
          ].join(' && ');
        }
      },
      publish_assets: {
        cmd: [
          'zip -r <%= buildDir %>/typeahead.js.zip <%= buildDir %>',
          'git checkout gh-pages',
          'rm -rf releases/latest',
          'cp -r <%= buildDir %> releases/<%= pkg.version %>',
          'cp -rf <%= buildDir %> releases/latest',
          'git add releases/<%= pkg.version %> releases/latest',
          'git commit -m "Add assets for <%= pkg.version %>."',
          'git push',
          'git checkout -'
        ].join(' && ')
      }
    },

    clean: {
      dist: 'dist'
    },

    connect: {
      server: {
        options: {
          port: 8888, keepalive: true
        }
      }
    }
  });

  grunt.registerTask('component', 'Updates component.json', function() {
    var _ = grunt.util._,
        component = grunt.file.readJSON('component.json'),
        pkg = grunt.file.readJSON('package.json');

    _(component).extend(_(pkg).pick('name', 'version'));
    grunt.file.write('component.json', JSON.stringify(component, null, 2));
  });

  // aliases
  // -------

  grunt.registerTask('default', 'build');
  grunt.registerTask('build', ['concat:js', 'concat:jsmin', 'sed:version', 'uglify']);
  grunt.registerTask('server', 'connect:server');
  grunt.registerTask('lint', 'jshint');
  grunt.registerTask('test', 'jasmine:js');
  grunt.registerTask('test:browser', ['jasmine:js:build', 'exec:open_spec_runner']);

  // load tasks
  // ----------

  grunt.loadNpmTasks('grunt-sed');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
};
