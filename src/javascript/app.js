Ext.define("TSTimesheet", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    layout: 'border',

    items: [
        {xtype:'container', itemId:'selector_box', region: 'north',  layout: { type:'hbox' }, minHeight: 25}
    ],

    pickableColumns: null,
    portfolioItemTypes: [],
    stateful: true,
    stateEvents: ['columnschosen','columnmoved','columnresize'],
    stateId: 'CA.technicalservices.timesheet.Settings.1',

    config: {
        defaultSettings: {
            /* 0=sunday, 6=saturday */
            weekStartsOn: 0,
            showAddMyStoriesButton: false,
            showEditTimeDetailsMenuItem: false,
            showTaskStateFilter: true
        }
    },

    getState: function() {
        var me = this,
            state = null;

        state = {
            pickableColumns: this.pickableColumns
        };

        this.logger.log('getting state', state);
        return state;
    },

    launch: function() {
        TSUtilities.fetchPortfolioItemTypes().then({
            success: function(types) {
                this.logger.saveForLater = true;
                this.portfolioItemTypes = types;
                this._addSelectors(this.down('#selector_box'));
            },
            failure: function(msg) {
                Ext.Msg.alert('Problem Initiating TimeSheet App', msg);
            },
            scope: this
        });
    },

    _getLowestLevelPIName: function() {
        return this.portfolioItemTypes[0].get('Name');
    },

    _addSelectors: function(container) {
        container.removeAll();
        container.add({xtype:'container',itemId:'add_button_box'});

        container.add({xtype:'container',flex: 1});

        container.add({xtype:'container',itemId:'other_button_box'});

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

    _addAddButtons: function(container) {
        container.removeAll();

        container.add({
            xtype:'rallybutton',
            text: 'Add My Tasks',
            toolTipText: "(in current iteration + defaults)",
            padding: 2,
            disabled: false,
            listeners: {
                scope: this,
                click: this._addCurrentTasksAndDefaults
            }
        });

        if (this.getSetting('showAddMyStoriesButton')) {
            container.add({
                xtype:'rallybutton',
                text: '+ my <span class="icon-story"> </span>',
                toolTipText: "(add my stories)",
                padding: 2,
                disabled: false,
                listeners: {
                    scope: this,
                    click: this._addCurrentStories
                }
            });
        }

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

        if ( this.getSetting('showTaskStateFilter') ) {
            container.add({
                xtype: 'rallyfieldvaluecombobox',
                model: 'Task',
                field: 'State',
                fieldLabel: 'State:',
                labelAlign: 'right',
                stateful: true,
                stateId:'task-state-filter-combo',
                multiSelect:true,
                value: ["Defined", "In-Progress", "Completed"],
                listeners: {
                    scope: this,
                    change: this._filterState
                }
            });
        }
    },

    _filterState: function(stateChange){
        var timetable = this.down('tstimetable');

        var stateFilter = new Ext.util.Filter({
            filterFn: function(item) {
                return  Ext.Array.contains(stateChange.value,item.get('State')) ||  !item.get('State');
            }
        });

        if(stateChange.value.length > 0){
            timetable.grid.filter(stateFilter);
        }else{
            timetable.grid.filter(null, true);
        }
    },

    _addConfigButtons: function(container) {
        this.pickableColumns = this.time_table.getPickableColumns();
        container.removeAll();

        container.add({
            xtype:'tscolumnpickerbutton',
            pickableColumns: this.pickableColumns,
            listeners: {
                scope: this,
                columnschosen: function(button,columns) {
                    var timetable = this.down('tstimetable');
                    this.pickableColumns = columns;

                    timetable.setPickableColumns(columns);
                    this.fireEvent('columnschosen');
                }
            }
        });
    },

    // my workproducts are stories I own and stories that have tasks I own
    _addCurrentStories: function() {
        var me = this;
        var timetable = this.down('tstimetable');
        if ( !timetable ) { return; }

        this.setLoading("Finding my current stories...");

        var my_filters = Rally.data.wsapi.Filter.or([
            {property:'Owner.ObjectID',value:this.getContext().getUser().ObjectID},
            {property:'Tasks.Owner.ObjectID',value:this.getContext().getUser().ObjectID}
        ]);

        var current_filters = Rally.data.wsapi.Filter.and([
            {property:'Iteration.StartDate',operator: '<=', value:Rally.util.DateTime.toIsoString(this.startDate)},
            {property:'Iteration.EndDate',  operator: '>=', value:Rally.util.DateTime.toIsoString(this.startDate)}
        ]);

        var config = {
            model: 'HierarchicalRequirement',
            context: {
                project: null
            },
            fetch:  ['ObjectID','Name','FormattedID','WorkProduct','Project'],
            filters: current_filters.and(my_filters)
        };

        TSUtilities.loadWsapiRecords(config).then({
            scope: this,
            success: function(items) {
                var new_item_count = items.length;
                var current_count  = timetable.getGrid().getStore().getTotalCount();

                if ( current_count + new_item_count > me.getSetting('maxRows') ) {
                    Ext.Msg.alert('Problem Adding Items', 'Cannot add items to grid. Limit is ' + me.getSetting('maxRows') + ' lines in the time sheet.');
                    this.setLoading(false);
                } else {
                    Ext.Array.each(items, function(item){
                        timetable.addRowForItem(item);
                    });
                }

                this.setLoading(false);
            },
            failure: function(msg) {
                Ext.Msg.alert('Problem with my stories', msg);
            }
        });
    },

    _addCurrentTasksAndDefaults: function() {
        var me = this;
        this.logger.log('_addCurrentTasksAndDefaults');

        Deft.Chain.sequence([
            this._addCurrentTasks,
            this._addDefaults
        ],this).then({
            failure: function(msg) {
                Ext.Alert.msg('Problem adding current items', msg);
            }
        }).always(function() { me.setLoading(false); });
    },

    _addDefaults: function() {
        var timetable = this.down('tstimetable'),
            me = this;
        if ( !timetable ) { return; }

        var defaults = timetable.time_entry_defaults;

        var promises = [];
        this.setLoading('Finding my defaults...');

        this.logger.log('finding defaults: ');

        Ext.Object.each(defaults, function(oid,type){
            me.logger.log('  ', oid, type);

            if ( type == false ) {
                return;
            }

            promises.push(function() {
                var deferred = Ext.create('Deft.Deferred');

                var config = {
                    model: type,
                    context: {
                        project: null
                    },
                    fetch:  ['ObjectID','Name','FormattedID','WorkProduct','Project'],
                    filters: [
                        {property:'ObjectID', value: oid}
                    ]
                };

                TSUtilities.loadWsapiRecords(config).then({
                    scope: this,
                    success: function(items) {
                        var new_item_count = items.length;
                        var current_count  = timetable.getGrid().getStore().getTotalCount();

                        if ( current_count + new_item_count > me.getSetting('maxRows') ) {
                            Ext.Msg.alert('Problem Adding Items', 'Cannot add items to grid. Limit is '+me.getSetting('maxRows')+' lines in the time sheet.');
                            me.setLoading(false);
                        } else {
                            Ext.Array.each(items, function(task){
                                timetable.addRowForItem(task);
                            });
                        }

                        me.logger.log('Found ', items.length, type, ' items');
                        me.setLoading(false);
                        deferred.resolve(items);
                    },
                    failure: function(msg) {
                        deferred.reject(msg);
                    }
                });

                return deferred.promise;
            });
        });

        return Deft.Chain.sequence(promises);
    },

    _addCurrentTasks: function() {
        var me = this;
        var deferred = Ext.create('Deft.Deferred');

        var timetable = this.down('tstimetable');
        if ( !timetable ) { return; }

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

                if ( current_count + new_item_count > me.getSetting('maxRows') ) {
                    Ext.Msg.alert('Problem Adding Items', 'Cannot add items to grid. Limit is '+me.getSetting('maxRows')+' lines in the time sheet.');
                    this.setLoading(false);
                } else {
                    Ext.Array.each(tasks, function(task){
                        timetable.addRowForItem(task);
                    });
                }

                this.logger.log('Found ', tasks.length, ' tasks in current iterations');

                this.setLoading(false);
                deferred.resolve(tasks);
            },
            failure: function(msg) {
                deferred.reject(msg);
            }
        });

        return deferred.promise;
    },

    _findAndAddTask: function() {
        var me = this;
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
                        attributeName: 'Release'
                    },
                    {
                        displayName:'Iteration',
                        attributeName: 'Iteration'
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
                    'Iteration',
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

                        if ( current_count + new_item_count > me.getSetting('maxRows') ) {
                            Ext.Msg.alert('Problem Adding Tasks', 'Cannot add items to grid. Limit is '+me.getSetting('maxRows')+' lines in the time sheet.');
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
        var me = this;
        var timetable = this.down('tstimetable');
        if (timetable) {
            Ext.create('Rally.technicalservices.ChooserDialog', {
                artifactTypes: ['hierarchicalrequirement','defect'],
                autoShow: true,
                title: 'Choose Work Product(s)',
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
                        displayName:'Iteration',
                        attributeName: 'Iteration'
                    },
                    {
                        displayName:'Release',
                        attributeName: 'Release'
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
                    'Iteration',
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

                        if ( current_count + new_item_count > me.getSetting('maxRows') ) {
                            Ext.Msg.alert('Problem Adding Stories', 'Cannot add items to grid. Limit is '+me.getSetting('maxRows')+' lines in the time sheet.');
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
            pickableColumns: this.pickableColumns,
            lowestLevelPIName: this._getLowestLevelPIName(),
            startDate: this.startDate,
            editable: editable,
            logger: me.logger,
            maxRows: me.getSetting('maxRows'),
            showEditTimeDetailsMenuItem: me.getSetting('showEditTimeDetailsMenuItem'),
            listeners: {
                scope: this,
                gridReady: function() {
                    this._addAddButtons(this.down('#add_button_box'));
                    this._addConfigButtons(this.down('#other_button_box'));
                }
            }
        });
    },

    getSettingsFields: function() {
        var check_box_margins = '5 0 5 0';

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
        },
        {
            name: 'showTaskStateFilter',
            xtype: 'rallycheckboxfield',
            boxLabelAlign: 'after',
            fieldLabel: '',
            margin: check_box_margins,
            boxLabel: 'Show the Task State Filter<br/><span style="color:#999999;"><i>User can limit display of tasks to ones in particular states (does not affect other object types).</i></span>'
        },
        {
            name: 'showAddMyStoriesButton',
            xtype: 'rallycheckboxfield',
            boxLabelAlign: 'after',
            fieldLabel: '',
            margin: check_box_margins,
            boxLabel: 'Show the Add My Stories Button<br/><span style="color:#999999;"><i>User can add stories in a current sprint that they own or that have tasks they own (does not look for default items).</i></span>'
        },
        {
            name: 'showEditTimeDetailsMenuItem',
            xtype: 'rallycheckboxfield',
            boxLabelAlign: 'after',
            fieldLabel: '',
            margin: check_box_margins,
            boxLabel: 'Include Time Details Option in Menu (Experimental)<br/><span style="color:#999999;"><i>User can enter time ranges during the day to calculate time entry. </i></span>'

        },
        {
            xtype: 'rallynumberfield',
            name: 'maxRows',
            labelWidth: 100,
            labelAlign: 'left',
            width: 200,
            maxValue: 1000,
            minValue:10,
            fieldLabel: 'Maximum number of rows',
            value: this.getSetting('maxRows') || 100,
        }
        ];
    },

    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            },
            {
                text: 'Show Log',
                handler: this._showLog,
                scope: this
            }
        ];
    },

    _showLog: function() {
        var text = this.logger.getLogText();

        this.popup = Ext.create('Rally.ui.dialog.Dialog', {
            width      : Ext.getBody().getWidth() - 20,
            height     : Ext.getBody().getHeight() - 20,
            closable   : true,
            title      : 'Log',
            autoShow   : true,
            layout     : 'border',
            defaults   : {
                layout : 'fit',
                width  : '50%',
                border : false
            },
            items: [{
                region : 'center',
                xtype: 'rallyrichtexteditor',
                value: text,
                height: Ext.getBody().getHeight() - 20
            }]
        });
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
