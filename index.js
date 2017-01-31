var gulp                = require('gulp');
var argv                = require('yargs').argv;
var gutil               = require('gulp-util');
var context_builder     = require('./context');
var manager_builder     = require('./manager');
var async               = require('async');
var prompt              = require('gulp-prompt');


// TODO: p3 constants to diff file eg. baasLoadData.js limit=200
// TODO: p2 cache creation with cache properties
// TODO: p2 standardize sequential execution of tasks
// TODO: p2 data source many
// TODO: p2 testing configuration
// TODO: p2 generate load for generating initial report
// TODO: p2 license check
// TODO: p2 deploy individual dependency from its gulp
// TODO: p1 final test
// TODO: p1 deploy stops after app deploy


module.exports = function(gulp){
    var env                 = 'test'
    var config_file         = 'config.yml'
    var context
    var manager
    var strict
    var params              = {}

    if (argv.env)
        env             = argv.env

    if (argv.config)
        config_file     = argv.config

    if(argv.strict)
        strict          = argv.strict

    gulp.task('init', function() {

        print('ENV : ' + env)
        print('CONIG_FILE : ' + config_file)

        context             = context_builder.getContext(config_file, env)
        manager             = manager_builder.getManager()

        // set arguments passed to context
        var  args_passed         = argv
        delete args_passed['_']
        delete args_passed['$0']
        delete args_passed['strict']
        delete args_passed['config']
        delete args_passed['item']

        context.setCmdLineVariables(args_passed)
    });

    gulp.task('clean', ['init'], function (cb) {
        manager.doTask('CLEAN', context, argv.resource, argv.subresource, params, function () {
            cb()
        })
    });

    if(strict){
        gulp.task('build', ['init'], function(cb){
            manager.doTask('BUILD', context, argv.resource ,argv.subresource, params, function () {
                cb()
            })
        });
    } else {
        gulp.task('build',['init','clean'], function(cb){
            manager.doTask('BUILD', context, argv.resource ,argv.subresource, params, function () {
                cb()
            })
        });
    }


    if(strict){
        gulp.task('deploy', ['init'], function(cb){
            manager.doTask('DEPLOY', context, argv.resource ,argv.subresource, params, function () {
                cb()
            })
        });
    } else {
        gulp.task('deploy', ['init','build'], function(cb){
            manager.doTask('DEPLOY', context, argv.resource ,argv.subresource, params, function () {
                cb()
            })
        });
    }

};

function print(msg) {
    gutil.log(gutil.colors.green(msg));
}
