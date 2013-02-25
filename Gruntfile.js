var semver = require('semver'),
    f = require('util').format,
    jsFiles = [
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
      ' * typeahead.js <%= pkg.version %>',
      ' * https://github.com/twitter/typeahead',
      ' * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT',
      ' */\n\n'
    ].join('\n'),

    less: {
      css: {
        src: 'src/css/typeahead.css',
        dest: '<%= buildDir %>/typeahead.css'
      },
      cssmin: {
        options: { yuicompress: true },
        src: 'src/css/typeahead.css',
        dest: '<%= buildDir %>/typeahead.min.css'
      }
    },

    concat: {
      css: {
        options: {
          banner: '<%= banner %>',
          stripBanners: true
        },
        src: '<%= less.css.dest %>',
        dest: '<%= less.css.dest %>'
      },
      cssmin: {
        options: {
          banner: '<%= banner %>',
          stripBanners: true
        },
        src: '<%= less.cssmin.dest %>',
        dest: '<%= less.cssmin.dest %>'
      },
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
      },
      css: {
        files: '<%= less.css.src %>',
        tasks: 'build:css'
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
      git_fail_if_dirty: {
        cmd: 'test -z "$(git status --porcelain)"'
      },
      git_add: {
        cmd: 'git add .'
      },
      git_commit: {
        cmd: function(m) { return f('git commit -m "%s"', m); }
      },
      git_tag: {
        cmd: function(v) { return f('git tag v%s -am "%s"', v, v); }
      },
      git_push: {
        cmd: 'git push && git push --tags'
      },
      publish_assets: {
        cmd: [
          'cp -r <%= buildDir %> typeahead.js',
          'zip -r typeahead.js/typeahead.js.zip typeahead.js',
          'git checkout gh-pages',
          'rm -rf releases/latest',
          'cp -r typeahead.js releases/<%= pkg.version %>',
          'cp -r typeahead.js releases/latest',
          'git add releases/<%= pkg.version %> releases/latest',
          'sed -E -i "" \'s/v[0-9]+\\.[0-9]+\\.[0-9]+/v<%= pkg.version %>/\' index.html',
          'git add index.html',
          'git commit -m "Add assets for <%= pkg.version %>."',
          'git push',
          'git checkout -',
          'rm -rf typeahead.js'
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

  grunt.registerTask('release', 'Ship it.', function(version) {
    var pkg = grunt.file.readJSON('package.json');

    version = semver.inc(pkg.version, version) || version;

    if (!semver.valid(version) || semver.lte(version, pkg.version)) {
      grunt.fatal('invalid version dummy');
    }

    grunt.task.run([
      'exec:git_fail_if_dirty',
      'lint',
      'test',
      'manifests:' + version,
      'build',
      'exec:git_add',
      'exec:git_commit:' + version,
      'exec:git_tag:' + version,
      'exec:git_push',
      'exec:publish_assets'
    ]);
  });

  grunt.registerTask('manifests', 'Update manifests.', function(version) {
    var _ = grunt.util._,
        pkg = grunt.file.readJSON('package.json'),
        component = grunt.file.readJSON('component.json'),
        jqueryPlugin = grunt.file.readJSON('typeahead.js.jquery.json');

    component = JSON.stringify(_.extend(component, {
      name: pkg.name,
      version: version
    }), null, 2);

    jqueryPlugin = JSON.stringify(_.extend(jqueryPlugin, {
      name: pkg.name,
      title: pkg.name,
      version: version,
      author: pkg.author,
      description: pkg.description,
      keywords: pkg.keywords,
      homepage: pkg.homepage,
      bugs: pkg.bugs,
      maintainers: pkg.contributors
    }), null, 2);

    pkg = JSON.stringify(_.extend(pkg, {
      version: version
    }), null, 2);

    grunt.file.write('package.json', pkg);
    grunt.file.write('component.json', component);
    grunt.file.write('typeahead.js.jquery.json', jqueryPlugin);
  });

  // aliases
  // -------

  grunt.registerTask('default', 'build');
  grunt.registerTask('build', ['build:js', 'build:css']);
  grunt.registerTask('build:js', ['concat:js', 'concat:jsmin', 'sed:version', 'uglify']);
  grunt.registerTask('build:css', ['less', 'concat:css', 'concat:cssmin']);
  grunt.registerTask('server', 'connect:server');
  grunt.registerTask('lint', 'jshint');
  grunt.registerTask('test', 'jasmine:js');
  grunt.registerTask('test:browser', ['jasmine:js:build', 'exec:open_spec_runner']);

  // load tasks
  // ----------

  grunt.loadNpmTasks('grunt-sed');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
};
