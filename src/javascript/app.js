Ext.define("TSTimesheet", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    layout: 'border',
    
    items: [
        {xtype:'container', itemId:'selector_box', region: 'north',  layout: { type:'hbox' }, minHeight: 25}
    ],

    integrationHeaders : {
        name : "TSTimesheet"
    },
    
    config: {
        defaultSettings: {
            /* 0=sunday, 6=saturday */
            weekStartsOn: 0 
        }
    },
    
    launch: function() {
        this._addSelectors(this.down('#selector_box'));
    },
    
    _addSelectors: function(container) {
        container.removeAll();
        container.add({xtype:'container',itemId:'button_box'});
        
        container.add({xtype:'container',flex: 1});
        
        var week_starts_on = this.getSetting('weekStartsOn');
        this.logger.log('Week Start:', week_starts_on);
        
        container.add({
            xtype:'tsarroweddate',
            itemId:'date_selector',
            fieldLabel: 'Week Starting',
            listeners: {
                scope: this,
                change: function(dp, new_value) {
                    if ( Ext.isEmpty(new_value) ) { return; }
                    
                    var week_start = TSDateUtils.getBeginningOfWeekForLocalDate(new_value,week_starts_on);
                    if ( week_start !== new_value ) {
                        dp.setValue(week_start);
                    }
                    if ( new_value.getDay() === week_starts_on ) {
                        this.updateData();
                    }
                }
            }
        }).setValue(new Date());
    },
    
    _addButtons: function(container) {
        container.removeAll();
        
        container.add({
            xtype:'rallybutton',
            text: 'Add My Tasks',
            toolTipText: "(in current iteration)", 
            padding: 2,
            disabled: false,
            listeners: {
                scope: this,
                click: this._addCurrentTasks
            }
        });
        
        container.add({
            xtype:'rallybutton',
            text: '+<span class="icon-task"> </span>',
            disabled: false,
            toolTipText: "Search and add Tasks", 
            listeners: {
                scope: this,
                click: this._findAndAddTask
            }
        });
        
        container.add({
            xtype:'rallybutton',
            text: '+<span class="icon-story"> </span>',
            toolTipText: "Search and add User Stories",
            disabled: false,
            listeners: {
                scope: this,
                click: this._findAndAddStory
            }
        });
        
    },
    
    _addCurrentTasks: function() {
        var timetable = this.down('tstimetable');
        if (timetable) {
            this.setLoading("Finding my current tasks...");
            
            var config = {
                model: 'Task',
                context: {
                    project: null
                },
                fetch:  ['ObjectID','Name','FormattedID','WorkProduct','Project'],
                filters: [
                    {property:'Owner.ObjectID',value:this.getContext().getUser().ObjectID},
                    {property:'Iteration.StartDate',operator: '<=', value:Rally.util.DateTime.toIsoString(this.startDate)},
                    {property:'Iteration.EndDate',  operator: '>=', value:Rally.util.DateTime.toIsoString(this.startDate)}
                ]
            };
            
            TSUtilities.loadWsapiRecords(config).then({
                scope: this,
                success: function(tasks) {
                    var new_item_count = tasks.length;
                    var current_count  = timetable.getGrid().getStore().getTotalCount();
                    
                    if ( current_count + new_item_count > 100 ) {
                        Ext.Msg.alert('Problem Adding Items', 'Cannot add items to grid. Limit is 100 lines in the time sheet.');
                        this.setLoading(false);
                    } else {
                        Ext.Array.each(tasks, function(task){
                            timetable.addRowForItem(task);
                        });
                    }
                    
                    this.setLoading(false);
                    
                },
                failure: function(msg) {
                    Ext.Msg.alert("Problem loading current tasks", msg);
                }
            });
        }
    },
    
    _findAndAddTask: function() {
        var timetable = this.down('tstimetable');
        
        var fetch_fields = ['WorkProduct','Feature','Project','Name','FormattedID','ObjectID'];
                
        if (timetable) {
            Ext.create('Rally.technicalservices.ChooserDialog', {
                artifactTypes: ['task'],
                autoShow: true,
                multiple: true,
                title: 'Choose Task(s)',
                filterableFields: [
                    {
                        displayName: 'Formatted ID',
                        attributeName: 'FormattedID'
                    },
                    {
                        displayName: 'Name',
                        attributeName: 'Name'
                    },
                    {
                        displayName:'WorkProduct',
                        attributeName: 'WorkProduct.Name'
                    },
                    {
                        displayName:'Release',
                        attributeName: 'Release.Name'
                    },
                    {
                        displayName:'Iteration',
                        attributeName: 'Iteration.Name'
                    },
                    {
                        displayName:'Project',
                        attributeName: 'Project.Name'
                    },
                    {
                        displayName:'Owner',
                        attributeName: 'Owner'
                    },
                    {
                        displayName: 'State',
                        attributeName: 'State'
                    }
                ],
                columns: [
                    {
                        text: 'ID',
                        dataIndex: 'FormattedID'
                    },
                    'Name',
                    'WorkProduct',
                    'Release',
                    'Project',
                    'Owner',
                    'State'
                ],
                fetchFields: fetch_fields,
                listeners: {
                    artifactchosen: function(dialog, selectedRecords){
                        if ( !Ext.isArray(selectedRecords) ) {
                            selectedRecords = [selectedRecords];
                        }
                        
                        var new_item_count = selectedRecords.length;
                        var current_count  = timetable.getGrid().getStore().getTotalCount();
                        
                        if ( current_count + new_item_count > 100 ) {
                            Ext.Msg.alert('Problem Adding Tasks', 'Cannot add items to grid. Limit is 100 lines in the time sheet.');
                        } else {
                            
                            Ext.Array.each(selectedRecords, function(selectedRecord){
                                timetable.addRowForItem(selectedRecord);
                            });
                        }
                    },
                    scope: this
                }
             });
        }
    },
    
    _findAndAddStory: function() {
        var timetable = this.down('tstimetable');
        if (timetable) {
            Ext.create('Rally.technicalservices.ChooserDialog', {
                artifactTypes: ['hierarchicalrequirement'],
                autoShow: true,
                title: 'Choose Story(ies)',
                multiple: true,
                filterableFields: [
                    {
                        displayName: 'Formatted ID',
                        attributeName: 'FormattedID'
                    },
                    {
                        displayName: 'Name',
                        attributeName: 'Name'
                    },
                    {
                        displayName:'Feature',
                        attributeName: 'Feature.Name'
                    },
                    {
                        displayName: 'Feature Project',
                        attributeName: 'Feature.Project.Name'
                    },
                    {
                        displayName:'Release',
                        attributeName: 'Release.Name'
                    },
                    {
                        displayName:'Project',
                        attributeName: 'Project.Name'
                    },
                    {
                        displayName:'Owner',
                        attributeName: 'Owner'
                    },
                    {
                        displayName:'State',
                        attributeName: 'ScheduleState'
                    }
                ],
                columns: [
                    {
                        text: 'ID',
                        dataIndex: 'FormattedID'
                    },
                    'Name',
                    'WorkProduct',
                    'Release',
                    'Project',
                    'Owner',
                    'ScheduleState'
                ],
        
                fetchFields: ['WorkProduct','Feature','Project','Name','FormattedID','ObjectID','Release'],
                
                listeners: {
                    artifactchosen: function(dialog, selectedRecords){
                        if ( !Ext.isArray(selectedRecords) ) {
                            selectedRecords = [selectedRecords];
                        }
                        
                        var new_item_count = selectedRecords.length;
                        var current_count  = timetable.getGrid().getStore().getTotalCount();
                        
                        if ( current_count + new_item_count > 100 ) {
                            Ext.Msg.alert('Problem Adding Stories', 'Cannot add items to grid. Limit is 100 lines in the time sheet.');
                        } else {
                            Ext.Array.each(selectedRecords, function(selectedRecord){
                                timetable.addRowForItem(selectedRecord);
                            });
                        }
                    },
                    scope: this
                }
             });
        }
    },
    
    updateData: function() {
        var me = this;
        var timetable  = this.down('tstimetable');
        if ( ! Ext.isEmpty(timetable) ) { timetable.destroy(); }
        
        this.startDate = this.down('#date_selector').getValue();
        
        this.logger.log('startDate', this.startDate);
        
        var editable = true;
        
        this.time_table = this.add({ 
            xtype: 'tstimetable',
            region: 'center',
            layout: 'fit',
            margin: 15,
            startDate: this.startDate,
            editable: editable,
            listeners: {
                scope: this,
                gridReady: function() {
                    this._addButtons(this.down('#button_box'));
                }
            }
        });
    },

    getSettingsFields: function() {
        var days_of_week = [
            {Name:'Sunday', Value:0},
            {Name:'Monday', Value:1},
            {Name:'Tuesday', Value:2},
            {Name:'Wednesday', Value:3},
            {Name:'Thursday', Value:4},
            {Name:'Friday', Value:5},
            {Name:'Saturday', Value:6}
        ];
        
        return [{
            name: 'weekStartsOn',
            xtype: 'rallycombobox',
            fieldLabel: 'Week Starts On',
            labelWidth: 100,
            labelAlign: 'left',
            minWidth: 200,
            displayField:'Name',
            valueField: 'Value',
            value: this.getSetting('weekStartsOn'),
            store: Ext.create('Rally.data.custom.Store',{
                data: days_of_week
            }),
            readyEvent: 'ready'
        }];
    },
    
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        // Ext.apply(this, settings);
        this.launch();
    }
});
