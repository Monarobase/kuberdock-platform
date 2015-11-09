requirejs.config({
    baseUrl: "/static/js",
    urlArgs: "bust=" + (new Date()).getTime(),
    paths: {
        jquery                 : "lib/jquery",
        underscore             : "lib/underscore-min",
        backbone               : "lib/backbone",
        marionette             : "lib/backbone.marionette.min",
        bootstrap              : "lib/bootstrap",
        "backbone-paginator"   : "lib/backbone.paginator",
        text                   : "lib/text",
        tpl                    : "lib/underscore-tpl",
        "jquery-spin"          : "lib/jquery.spin",
        spin                   : "lib/spin.min",
        "bootstrap-editable"   : "lib/bootstrap-editable.min",
        jqplot                 : "lib/jquery.jqplot.min",
        "jqplot-axis-renderer" : "lib/jqplot.dateAxisRenderer.min",
        notify                 : "lib/notify.min",
        moment                 : "lib/moment.min",
        "moment-timezone"      : "lib/moment-timezone-with-data.min",
        selectpicker           : 'lib/bootstrap-select.min'
    },
    shim: {
        jquery: {
            exports: "$"
        },
        underscore: {
            exports: "_"
        },
        backbone: {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        'backbone-paginator' : ['backbone'],
        marionette: ['backbone'],
        'bootstrap-editable': ['bootstrap'],
        'jquery-spin': ['spin'],
        tpl: ['text'],
        'jqplot-axis-renderer': ['jqplot'],
        selectpicker: {
            deps: ['jquery', 'bootstrap']
        },
        notify: {
            deps: ["jquery"],
            exports: 'jQuery.fn.notify'
        }
    }
});

require(['predefined_app/app', 'notify'], function(Apps, notify){
    Apps.start();
});