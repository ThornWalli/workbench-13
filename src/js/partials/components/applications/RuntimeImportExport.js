"use strict";

var ApplicationController = require('../../../base/ApplicationController');
var workbenchConfig = require('../../../services/workbenchConfig');

module.exports = ApplicationController.extend({

    viewControl: null,

    modelConstructor: ApplicationController.prototype.modelConstructor.extend({
        session: {
            applicationName: {
                type:'string',
                required:true,
                default: 'RuntimeImportExport'
            }
        }
    }),

    events: {
        'click [data-hook="import"]': onClickImport,
        'click [data-hook="export"]': onClickExport
    },


    initialize: function() {
        ApplicationController.prototype.initialize.apply(this, arguments);
        if (this.view) {
            this.viewControl = this.view.viewControl;
            this.model.on('Application:unregister', function() {
                if (this.view) {
                    this.viewControl.itemControl.items.off(null, null, this);
                    this.viewControl.views.off(null, null, this);
                    this.applicationControl.off(null,null, this);
                }
                workbenchConfig.off(null, null, this);
            }, this);
            this.applicationControl.on('register', onRefresh, this);
            this.applicationControl.on('unregister', onRefresh, this);
            this.viewControl.views.on('add', onRefresh, this);
            this.viewControl.views.on('remove', onRefresh, this);
            workbenchConfig.on('change', onRefresh, this);
            onRefresh.bind(this)();
        }
        fileReaderSetup(this);

        this.fileEl = this.queryByHook('import').querySelector('[type="file"]');
        this.fileEl.addEventListener('change', onFileChange.bind(this));
    }

});

function onRefresh() {
    console.log('refresh');
    this.queryByHook('applications').innerHTML = this.applicationControl.applications.length;
    this.queryByHook('views').innerHTML = this.viewControl.views.length;
}

function onClickImport() {}

function onClickExport() {
    generateExport(this);
}

function onFileChange() {
    var scope = this;
    scope.reader.readAsText(scope.fileEl.files.item(0), "UTF-8");
}

function generateExport(scope) {
    var data = {};
    // config
    data.config = workbenchConfig.data;
    // icons
    data.icons = [];
    scope.viewControl.itemControl.items.forEach(function(itemModel) {
        data.icons.push(itemModel.toJSON());
        // data.views.push({
        //     url: viewModel.url,
        //     options: {
        //         scroll: viewModel.scroll,
        //         bounds: {
        //             min: {
        //                 x: viewModel.bounds.min.x,
        //                 y: viewModel.bounds.min.y
        //             },
        //             max: {
        //                 x: viewModel.bounds.max.x,
        //                 y: viewModel.bounds.max.y
        //             }
        //         }
        //     }
        // });
    });
    // views
    data.views = [];
    scope.viewControl.views.forEach(function(viewModel) {
        // ignore view with itemControl (Folder)
        if (!viewModel.itemControl) {
            data.views.push({
                url: viewModel.url,
                options: {
                    scroll: viewModel.scroll,
                    bounds: {
                        min: {
                            x: viewModel.bounds.min.x,
                            y: viewModel.bounds.min.y
                        },
                        max: {
                            x: viewModel.bounds.max.x,
                            y: viewModel.bounds.max.y
                        }
                    }
                }
            });
        }
    });
    data = JSON.stringify(data);
    var url = 'data:application/json;charset=utf8,' + encodeURIComponent(data);
    window.open(url, '_blank');
    window.focus();
    console.log(data);
}

function fileReaderSetup(scope) {
    scope.reader = new FileReader();
    scope.reader.addEventListener('load', function(evt) {
        var data = {
            views: [],
            icons: []
        };
        try {
            data = JSON.parse(evt.target.result);
        } catch (e) {
            console.error('can\'t parse json file');
        }
        workbenchConfig.set(data.config);
        console.log('data.icons', data.icons);
        scope.viewControl.itemControl.items.add(data.icons);
        data.views.forEach(function(viewModel) {
            var options = viewModel.options;
            options.dimension = {
                x: options.bounds.max.x - options.bounds.min.x,
                y: options.bounds.max.y - options.bounds.min.y
            };
            scope.viewControl.openView(viewModel.url, options);
        });
        scope.fileEl.value = null;

    });
    scope.reader.addEventListener('error', function() {
        console.log("error reading file");
    });
}
