var exec = require("child_process").exec,
    distFiles = [
      "lib/browser-index.js",
      "lib/vttcue.js",
      "lib/vttregion.js",
      "lib/vtt.js"
    ],
    banner = "/* <%= pkg.name %> - v<%= pkg.version %> (<%= pkg.homepage %>) " +
             "built on <%= grunt.template.today('dd-mm-yyyy') %> */\n"

module.exports = function( grunt ) {
  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),

    jshint: {
      options: {
        esnext: true,
        indent: 2,
        expr: true,
        camelcase: true,
        curly: true,
        eqeqeq: true,
        newcap: true,
        unused: true,
        trailing: true,
        browser: true,
        node: true
      },
      files: [ "lib/*", "tests/**/*.js" ]
    },

    bump: {
      options: {
        files: [ "package.json", "bower.json" ],
        updateConfigs: [],
        commit: true,
        commitMessage: "Release v%VERSION%",
        commitFiles: [ "package.json", "bower.json", distFiles ],
        createTag: true,
        tagName: "v%VERSION%",
        tagMessage: "Version %VERSION%",
        push: true,
        pushTo: "git@github.com:videojs/vtt.js.git",
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: "spec",
          slow: "15000",
          timeout: "120000"
        },
        src: [ "tests/**/*.js" ]
      }
    }

  });

  function execCmd(cmd, onExecuted) {
    exec( cmd, function(error, stdout, stderr) {
      error && console.error(error);
      stderr && console.error(stderr);
      stdout && console.log(stdout);
      onExecuted();
    });
  }

  grunt.loadNpmTasks( "grunt-contrib-jshint" );
  grunt.loadNpmTasks( "grunt-bump" );
  grunt.loadNpmTasks( "grunt-mocha-test" );

  grunt.registerTask( "test", [ "mochaTest" ]);
  grunt.registerTask( "default", [ "jshint", "mochaTest" ]);

  grunt.registerTask( "reload-pkg", "Reload the package.json config.", function() {
    grunt.config( "pkg", grunt.file.readJSON( "package.json" ) );
  });

  grunt.registerTask( "release", "Build the distributables and bump the version.", function(arg) {
    grunt.task.run( "bump-only:" + arg, "reload-pkg", "bump-commit" );
  });

  grunt.registerTask( "cue2json", "Run cue2json.", function(path, opts) {
    execCmd( "./bin/cue2json.js -v " + path + (opts && " -" + opts || ""), this.async() );
  });

  grunt.registerTask( "run", "Build dev-build and run cue2json.", function(path, opts) {
    grunt.task.run( "dev-build", "cue2json:" + path + ":" + opts );
  });

};
