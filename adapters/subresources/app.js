var apigeetool 		= require('apigeetool')
var lib				= require('../../lib')
var async           = require('async')
var lodash         = require('lodash')

var sdk 			= apigeetool.getPromiseSDK()

var adapter = function () {
	this.clean 			= clean
	this.build 			= build
	this.deploy 		= deploy
}

function build(context, resourceName, subResourceName, params, cb) {
	lib.print('meta','building app resources')
	cb()
}

function deploy(context, resourceName, subResourceName, params, cb) {
	lib.print('meta','deploying app resources')

	var config          = context.getConfig(resourceName, subResourceName)

	var items           = lib.filter_items(config.items, params)

	var deploy_info     = context.getDeploymentInfo()

	for (var i=0; i< items.length; i++) {
		lodash.merge(items[i], deploy_info)
		items[i].context = context
	}

	async.each(items, create_app, function(err){
		if(err){
			lib.print('ERROR', err)
			cb()
		} else {
			cb()
		}

	})
}

function create_app(item, callback) {
	var opts 			= item
	var context			= item.context
	delete item.context

	lodash.merge(opts, lib.normalize_data(JSON.parse(item.payload)))


	sdk.createApp(opts)
		.then(function(result){
			//cache create success
			lib.print('info', 'created app ' + item.name)
			if(item.assignResponse && item.assignResponse.length > 0){
				extract_response(context, item.assignResponse, result)
			}
			callback()
		},function(err){
			//cache create failed
			lib.print('error', 'error creating app ' + item.name)
			lib.print('ERROR', err)
			callback()
		}) ;
}

function extract_response(context, collect_info, result) {
    for (var i=0; i<collect_info.length; i++){
        lib.print('info', 'extracting ' + collect_info[i]['from'] + ' from result')
        var pattern = collect_info[i]['from'].split('.')
        var value = result
        for (var j=0; j<pattern.length; j++) {
			value = value[pattern[j]]
        }
        context.setVariable(collect_info[i]['to'], value)
    }
}

function clean(context, resourceName, subResourceName, params, cb) {
	//opts = lib.build_opts(context, resourceName, subResourceName)
	lib.print('meta','cleaning app resources')

	var config          = context.getConfig(resourceName, subResourceName)

    var items           = lib.filter_items(config.items, params)

	var deploy_info     = context.getDeploymentInfo()

	for (var i=0; i< items.length; i++) {
		lodash.merge(items[i], deploy_info)
	}

	async.each(items, delete_app, function(err){
		if(err){
			lib.print('ERROR', err)
			cb()
		} else {
			cb()
		}

	})
}

function delete_app(item, callback) {
	var opts 			= item

	lodash.merge(opts, lib.normalize_data(JSON.parse(item.payload)))

	sdk.deleteApp(opts)
		.then(function(result){
			//cache create success
			lib.print('info', 'deleted app  ' + item.name)
			callback()
		},function(err){
			//cache create failed
			lib.print('error', 'error deleting app ' + item.name)
			lib.print('ERROR', err)
			callback()
		}) ;
}

exports.adapter 			= adapter
