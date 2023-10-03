module.exports = function(grunt) {

   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),

      uglify: {
         options: {
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
         },
         build: {
            files: {
               'dist/<%= pkg.version %>/<%= pkg.name %>-min.js':      'dist/<%= pkg.version %>/<%= pkg.name %>.js',
               'dist/<%= pkg.version %>/<%= pkg.name %>-all-min.js':  'dist/<%= pkg.version %>/<%= pkg.name %>-all.js'
            }
         }
      },

      copy: {
         main: {
            files: [
               {expand: false, src: ['src/promise.js'], dest: 'dist/<%= pkg.version %>/<%= pkg.name %>.js'}
            ]
         }
      },

      requirejs: {
         compile: {
            options: {
               out: './dist/<%= pkg.version %>/<%= pkg.name %>-all.js',
               name: 'promise',
               baseUrl: 'src/',
               optimize: 'none',
               paths: {
                  'subscribable': '../node_modules/subscribable/src/subscribable'
               }
            }
         }
      }
   });

   grunt.loadNpmTasks('grunt-contrib-requirejs');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-contrib-copy');

   // Default task(s).
   grunt.registerTask('default', ['copy', 'requirejs', 'uglify']);

};
