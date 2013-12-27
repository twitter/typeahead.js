var semver = require('semver'),
    f = require('util').format,
    files = {
      common: [
      'src/common/utils.js'
      ],
      dataset: [
      'src/dataset/version.js',
      'src/dataset/lru_cache.js',
      'src/dataset/persistent_storage.js',
      'src/dataset/transport.js',
      'src/dataset/search_index.js',
      'src/dataset/dataset.js',
      'src/dataset/tt_factory.js'
      ],
      typeahead: [
      'src/typeahead/html.js',
      'src/typeahead/css.js',
      'src/typeahead/event_bus.js',
      'src/typeahead/event_emitter.js',
      'src/typeahead/highlight.js',
      'src/typeahead/input.js',
      'src/typeahead/section.js',
      'src/typeahead/dropdown.js',
      'src/typeahead/typeahead.js',
      'src/typeahead/plugin.js'
      ]
    };

module.exports = function(grunt) {
  grunt.initConfig({
    version: grunt.file.readJSON('package.json').version,

    buildDir: 'dist',

    banner: [
      '/*!',
      ' * typeahead.js <%= version %>',
      ' * https://github.com/twitter/typeahead.js',
      ' * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT',
      ' */\n\n'
    ].join('\n'),

    uglify: {
      options: {
        banner: '<%= banner %>',
        enclose: { 'window.jQuery': '$' }
      },
      dataset: {
        options: {
          mangle: false,
          beautify: true,
          compress: false
        },
        src: files.common.concat(files.dataset),
        dest: '<%= buildDir %>/dataset.js'
      },
      typeahead: {
        options: {
          mangle: false,
          beautify: true,
          compress: false
        },
        src: files.common.concat(files.typeahead),
        dest: '<%= buildDir %>/typeahead.js'

      },
      bundle: {
        options: {
          mangle: false,
          beautify: true,
          compress: false
        },
        src: files.common.concat(files.dataset, files.typeahead),
        dest: '<%= buildDir %>/typeahead.bundle.js'

      },
      bundlemin: {
        options: {
          mangle: true,
          compress: true
        },
        src: files.common.concat(files.dataset, files.typeahead),
        dest: '<%= buildDir %>/typeahead.bundle.min.js'
      }
    },

    sed: {
      version: {
        pattern: '%VERSION%',
        replacement: '<%= version %>',
        recursive: true,
        path: '<%= buildDir %>'
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      src: 'src/**/*',
      test: ['test/*_spec.js'],
      gruntfile: ['Gruntfile.js']
    },

    watch: {
      js: {
        files: 'src/**/*',
        tasks: 'build'
      }
    },

    exec: {
      git_is_clean: {
        cmd: 'test -z "$(git status --porcelain)"'
      },
      git_on_master: {
        cmd: 'test $(git symbolic-ref --short -q HEAD) = master'
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
          'cp -r typeahead.js releases/<%= version %>',
          'cp -r typeahead.js releases/latest',
          'git add releases/<%= version %> releases/latest',
          'sed -E -i "" \'s/v[0-9]+\\.[0-9]+\\.[0-9]+/v<%= version %>/\' index.html',
          'git add index.html',
          'git commit -m "Add assets for <%= version %>."',
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
    },

    parallel: {
      dev: [
        { grunt: true, args: ['server'] },
        { grunt: true, args: ['watch'] }
      ]
    }
  });

  grunt.registerTask('release', 'Ship it.', function(version) {
    var curVersion = grunt.config.get('version');

    version = semver.inc(curVersion, version) || version;

    if (!semver.valid(version) || semver.lte(version, curVersion)) {
      grunt.fatal('invalid version dummy');
    }

    grunt.config.set('version', version);

    grunt.task.run([
      'exec:git_on_master',
      'exec:git_is_clean',
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
  grunt.registerTask('build', ['uglify', 'sed:version']);
  grunt.registerTask('server', 'connect:server');
  grunt.registerTask('lint', 'jshint');
  grunt.registerTask('dev', 'parallel:dev');

  // load tasks
  // ----------

  grunt.loadNpmTasks('grunt-sed');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-parallel');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
};
