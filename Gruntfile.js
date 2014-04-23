var semver = require('semver'),
    f = require('util').format,
    files = {
      intro: [
      'src/common/intro.js'
      ],
      outro: [
      'src/common/outro.js'
      ],
      common: [
      'src/common/utils.js'
      ],
      bloodhound: [
      'src/bloodhound/version.js',
      'src/bloodhound/tokenizers.js',
      'src/bloodhound/lru_cache.js',
      'src/bloodhound/persistent_storage.js',
      'src/bloodhound/transport.js',
      'src/bloodhound/search_index.js',
      'src/bloodhound/options_parser.js',
      'src/bloodhound/bloodhound.js'
      ],
      typeahead: [
      'src/typeahead/html.js',
      'src/typeahead/css.js',
      'src/typeahead/event_bus.js',
      'src/typeahead/event_emitter.js',
      'src/typeahead/highlight.js',
      'src/typeahead/input.js',
      'src/typeahead/dataset.js',
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
      ' * Copyright 2013-<%= grunt.template.today("yyyy") %> Twitter, Inc. and other contributors; Licensed MIT',
      ' */\n\n'
    ].join('\n'),

    concat: {
      bloodhound: {
        src: [].concat(files.intro, files.common, files.bloodhound, files.outro),
        dest: '<%= buildDir %>/bloodhound.js'
      },
      typeahead: {
        src: [].concat(files.intro, files.common, files.typeahead, files.outro),
        dest: '<%= buildDir %>/typeahead.jquery.js'
      },
      bundle: {
        src: [].concat(files.intro, files.common, files.bloodhound, files.typeahead, files.outro),
        dest: '<%= buildDir %>/typeahead.bundle.js'
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      bloodhound: {
        options: {
          mangle: false,
          beautify: true,
          compress: false
        },
        src: '<%= buildDir %>/bloodhound.js',
        dest: '<%= buildDir %>/bloodhound.js'
      },
      bloodhoundMin: {
        options: {
          mangle: true,
          compress: true
        },
        src: '<%= buildDir %>/bloodhound.js',
        dest: '<%= buildDir %>/bloodhound.min.js'
      },
      typeahead: {
        options: {
          mangle: false,
          beautify: true,
          compress: false
        },
        src: '<%= buildDir %>/typeahead.jquery.js',
        dest: '<%= buildDir %>/typeahead.jquery.js'

      },
      typeaheadMin: {
        options: {
          mangle: true,
          compress: true
        },
        src: '<%= buildDir %>/typeahead.jquery.js',
        dest: '<%= buildDir %>/typeahead.jquery.min.js'

      },
      bundle: {
        options: {
          mangle: false,
          beautify: true,
          compress: false
        },
        src: '<%= buildDir %>/typeahead.bundle.js',
        dest: '<%= buildDir %>/typeahead.bundle.js'

      },
      bundleMin: {
        options: {
          mangle: true,
          compress: true
        },
        src: '<%= buildDir %>/typeahead.bundle.js',
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
        jshintrc: '.jshintrc',
        ignores: ['src/common/intro.js', 'src/common/outro.js']
      },
      src: 'src/**/*.js',
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
      npm_publish: 'npm publish',
      git_is_clean: 'test -z "$(git status --porcelain)"',
      git_on_master: 'test $(git symbolic-ref --short -q HEAD) = master',
      git_add: 'git add .',
      git_push: 'git push && git push --tags',
      git_commit: {
        cmd: function(m) { return f('git commit -m "%s"', m); }
      },
      git_tag: {
        cmd: function(v) { return f('git tag v%s -am "%s"', v, v); }
      },
      publish_assets: [
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
    },

    step: {
      options: {
        option: false
      }
    }
  });

  grunt.registerTask('release', '#shipit', function(version) {
    var curVersion = grunt.config.get('version');

    version = semver.inc(curVersion, version) || version;

    if (!semver.valid(version) || semver.lte(version, curVersion)) {
      grunt.fatal('hey dummy, that version is no good!');
    }

    grunt.config.set('version', version);

    grunt.task.run([
      'exec:git_on_master',
      'exec:git_is_clean',
      f('step:Update to version %s?', version),
      f('manifests:%s', version),
      'build',
      'exec:git_add',
      f('exec:git_commit:%s', version),
      f('exec:git_tag:%s', version),
      'step:Push changes?',
      'exec:git_push',
      'step:Publish to npm?',
      'exec:npm_publish',
      'step:Publish assets?',
      'exec:publish_assets'
    ]);
  });

  grunt.registerTask('manifests', 'Update manifests.', function(version) {
    var _ = grunt.util._,
        pkg = grunt.file.readJSON('package.json'),
        bower = grunt.file.readJSON('bower.json'),
        jqueryPlugin = grunt.file.readJSON('typeahead.js.jquery.json');

    bower = JSON.stringify(_.extend(bower, {
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
    grunt.file.write('bower.json', bower);
    grunt.file.write('typeahead.js.jquery.json', jqueryPlugin);
  });

  // aliases
  // -------

  grunt.registerTask('default', 'build');
  grunt.registerTask('build', ['concat', 'uglify', 'sed:version']);
  grunt.registerTask('server', 'connect:server');
  grunt.registerTask('lint', 'jshint');
  grunt.registerTask('dev', 'parallel:dev');

  // load tasks
  // ----------

  grunt.loadNpmTasks('grunt-sed');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-step');
  grunt.loadNpmTasks('grunt-parallel');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
};
