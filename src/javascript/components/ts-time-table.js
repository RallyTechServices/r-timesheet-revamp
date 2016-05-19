Ext.override(Rally.ui.grid.plugin.Validation,{
    _onBeforeEdit: function(editor, object, eOpts) {
        // clear this because it won't let us do the getEditor on cells
    }
});

Ext.define('CA.techservices.TimeTable', {
    extend: 'Ext.Container',
    alias:  'widget.tstimetable',
    
    logger: new Rally.technicalservices.Logger(),
    
    rows: [],
    cls: 'tstimetable',
    
    time_entry_item_fetch: ['WeekStartDate','WorkProductDisplayString','WorkProduct','Task',
        'TaskDisplayString','Feature','Project', 'ObjectID', 'Name', 'Release', 'FormattedID',
        'Iteration','ToDo','State'],
        
    config: {
        startDate: null,
        editable: true,
        timesheetUser: null,
        pinKey: 'CA.techservices.timesheet.pin',
        showEditTimeDetailsMenuItem: false
    },
    
    constructor: function (config) {
        this.mergeConfig(config);
        
        if (Ext.isEmpty(config.startDate) || !Ext.isDate(config.startDate)) {
            throw "CA.techservices.TimeTable requires startDate parameter (JavaScript Date)";
        }
        
        this.weekStart = CA.techservices.timesheet.TimeRowUtils.getDayOfWeekFromDate(this.startDate) || 0;
        
        this.callParent([this.config]);
    },
    
    initComponent: function() {
        var me = this;
        
        this.callParent(arguments);
        
        this.addEvents(
            /**
             * @event
             * Fires when the grid has been rendered
             * @param {CA.techservices.TimeTable } this
             * @param {Rally.ui.grid.Grid} grid
             */
            'gridReady'
        );
        
                
        if ( Ext.isEmpty(this.timesheetUser) ) {
            this.timesheetUser = Rally.getApp().getContext().getUser();
        }
        // shift start date
        this.startDate = TSDateUtils.pretendIMeantUTC(this.startDate);
        
        this._updateData();
    },
    
    _updateData: function() {
        this.setLoading('Loading time...');
        var me = this;
        
        
        Deft.Chain.sequence([
            this._loadTimeEntryItems,
            this._loadTimeEntryValues,
            this._loadTimeDetailPreferences,
            this._loadDefaultSettings
        ],this).then({
            scope: this,
            success: function(results) {
                var time_entry_items  = results[0];
                var time_entry_values = results[1];
                var time_detail_prefs = results[2];
                this.time_entry_defaults = results[3];
                
                this.logger.log('table with defaults', this.time_entry_defaults);
                this.rows = this._createRows(time_entry_items, time_entry_values,time_detail_prefs);
                this._makeGrid(this.rows);
                this.setLoading(false);
            },
            failure: function(msg) {
                Ext.Msg.alert('Problem Loading', msg);
            }
        });
    },
    
    _loadDefaultSettings: function() {
        var deferred = Ext.create('Deft.Deferred');
        
        Rally.data.PreferenceManager.load({
            filterByUser: true,
            additionalFilters: [{property:'Name', operator:'contains', value: this.pinKey}],
            
            success: function(prefs) {
                //process prefs
                //console.log('prefs', prefs);
                var defaults = {};
                Ext.Object.each(prefs, function(key,pref){
                    var value = Ext.JSON.decode(pref);
                    Ext.apply(defaults, value);
                });
                
                deferred.resolve(defaults);
            }
        });
        return deferred.promise;
    },
    
    _makeGrid: function(rows) {
        this.removeAll();
        console.log('rows: ', rows);
        var me = this,
            table_store = Ext.create('Rally.data.custom.Store',{
                groupField: '__SecretKey',
                model: 'CA.techservices.timesheet.TimeRow',
                data: rows,
                pageSize: 100
            });
            
        console.log('store:', table_store);
        
        this.grid = this.add({ 
            xtype:'rallygrid', 
            store: table_store,
            columnCfgs: this._getColumns(),
            showPagingToolbar : false,
            showRowActionsColumn : false,
            disableSelection: true,
            enableColumnMove: false,
            enableColumnResize : false,
            features: [{
                ftype: 'summary'
            }],
            
            viewConfig: {
                listeners: {
                    itemupdate: function(row, row_index) {
                        me.logger.log('itemupdate', row);
                    }
                }
            }
        });

        console.log('grid:', this.grid);
        
        this.fireEvent('gridReady', this, this.grid);
    },
    
    _getRowActions: function(record) {
        // 
        var me = this;
        
        var actions = [
            {   
                xtype: 'rallyrecordmenuitem',
                text: 'Set as Default',
                predicate: function() {
                    return !this.record.isPinned();
                },
                handler: function(menu,evt) {
                    me._pinRecord(menu.record);
                },
                record: record
            },
            {
                xtype: 'rallyrecordmenuitem',
                text: 'Unset Default',
                predicate: function() {
                    return this.record.isPinned();
                },
                handler: function(menu,evt) {
                    me._unpinRecord(menu.record);
                },
                record: record
            },
            {
                xtype: 'rallyrecordmenuitem',
                text: 'Clear',
                record: record,
                handler: function(menu,evt) {
                    var row = menu.record;
                    Ext.Array.remove(me.rows, row);
                    row.clearAndRemove();
                    
                }
            }
        ];
                
        me.logger.log(me,me.showEditTimeDetailsMenuItem);
        if ( me.showEditTimeDetailsMenuItem ) { 
            actions.push({
                xtype: 'rallyrecordmenuitem',
                text: 'Edit Time',
                record: record,
                handler: function(menu,evt) {
                    var row = menu.record;
                    me._launchTimeDetailsDialog(row);
                }
            });
        }
        return actions;
        
    },
    
    _getColumns: function() {
        var me = this;
        
        var columns = [
            {
                xtype:'rallyrowactioncolumn',
                sortable: false,
                scope: me,
                rowActionsFn: function (record) {
                    return me._getRowActions(record);
                }
            },
            {
                dataIndex: 'Project',
                text: 'Project',
                flex: 1,
                editor: null,
                sortable: false,
                renderer: function(value, meta, record) {
                    if ( Ext.isEmpty(value) ) {
                        return '--';
                    }
                    return value._refObjectName;
                }
            },
            {
                dataIndex: 'WorkProductOID',
                text: 'Work Item',
                flex: 1,
                editor: null,
                sortable: true,
                renderer: function(value, meta, record) {
                    if ( value < 0 ) {
                        return '--';
                    }
                    return Ext.String.format("<a target='_blank' href='{0}'>{1}</a>: {2}",
                        Rally.nav.Manager.getDetailUrl(record.get('WorkProduct')),
                        record.get('WorkProduct').FormattedID,
                        record.get('WorkProduct').Name
                    );;
                }
            },
            {
                dataIndex: 'Iteration',
                text: 'Iteration',
                editor: null,
                sortable: false,
                renderer: function(value,meta,record){
                    if ( Ext.isEmpty(value) ){
                        return "--";
                    }
                    return value._refObjectName;
                }
            },
            {
                dataIndex: 'TaskOID',
                text: 'Task',
                sortable: true,
                flex: 1,
                editor: null,
                renderer: function(value, meta, record) {
                    if ( value < 0 ) {
                        return '--';
                    }
                    return Ext.String.format("<a target='_blank' href='{0}'>{1}</a>: {2}",
                        Rally.nav.Manager.getDetailUrl(record.get('Task')),
                        record.get('Task').FormattedID,
                        record.get('Task').Name
                    );;
                }
            }
        ];
        
        var state_config = {
            dataIndex: 'State',
            text: 'State',
            resizable: false,
            align: 'center',
            field: 'test',
            sortable: true,
            getEditor: function(record,df) {
                if ( Ext.isEmpty(record.get('Task') ) ) {
                    return false;
                }
                var minValue = 0;
                return Ext.create('Ext.grid.CellEditor', {
                    field: Ext.create('Rally.ui.combobox.FieldValueComboBox', {
                        xtype:'rallyfieldvaluecombobox',
                        model: 'Task',
                        field: 'State',
                        listeners: {
                            change: function(field, new_value, old_value) {
                                if ( Ext.isEmpty(new_value) ) {
                                   return;
                                }
                                
                                //console.log('saving state', new_value);
                                record.set('State', new_value);
                                record.save();
                            }
                        }
                    })
                });
            }
        };
        
        columns.push(state_config);

        var todo_config = {
            dataIndex: 'ToDo',
            text: 'To Do',
            width: 50, 
            resizable: false,
            align: 'center',
            field: 'test',
            sortable: true,
            getEditor: function(record,df) {
                if ( Ext.isEmpty(record.get('Task') ) ) {
                    return false;
                }
                var minValue = 0;
                return Ext.create('Ext.grid.CellEditor', {
                    field: Ext.create('Rally.ui.NumberField', {
                        xtype:'rallynumberfield',
                        minValue: minValue,
                        selectOnFocus: true,
                        listeners: {
                            change: function(field, new_value, old_value) {
                                if ( Ext.isEmpty(new_value) ) {
                                    field.setValue(0);
                                }
                                
                                record.set('ToDo', new_value);
                                record.save();
                            }
                        }
                    })
                });
            },
            renderer: function(value,meta,record){
                meta.tdCls = "ts-right-border";
                return value;
            }
        };
        
        columns.push(todo_config);
        
        Ext.Array.each( CA.techservices.timesheet.TimeRowUtils.getOrderedDaysBasedOnWeekStart(this.weekStart), function(day,idx) {
            columns.push(this._getColumnForDay(day,idx));
        },this);
        
        var total_renderer = function(value, meta, record) {
            meta.tdCls = "ts-total-cell";
            return value;
        }; 
        
        columns.push({
            dataIndex:'Total',
            text:'Total', 
            width: 50, 
            resizable: false, 
            align: 'center',
            editor: null,
            summaryType: 'sum',
//            summaryRenderer: function(value,meta,record) {
//                if ( value < 40 ) {
//                    meta.style = 'background: #fec6cd;';
//                }
//                return value;
//            },
            renderer: total_renderer
        });
            
        return columns;
    },
    
    _getItemOIDFromRow: function(record) {
        var record_item = record.get('Task') || record.get('WorkProduct');
        var oid = record_item.ObjectID;
        return oid;
    },
    
    _unpinRecord: function(record) {
        record.set('Pinned',false);
        var oid = this._getItemOIDFromRow(record);
        var key = Ext.String.format("{0}.{1}",
            this.pinKey,
            oid
        );
        
        var settings = {};
        var value = {};
        value[oid] = false;
        
        settings[key] = Ext.JSON.encode( value );

        Rally.data.PreferenceManager.update({
            user: Rally.getApp().getContext().getUser().ObjectID,
            filterByUser: true,
            settings: settings,
            success: function(updatedRecords, notUpdatedRecords) {
                //yay!
            }
        });
        
    },
    
    _pinRecord: function(record) {
        record.set('Pinned',true);
        var record_item = record.get('Task') || record.get('WorkProduct');
        var oid = this._getItemOIDFromRow(record);
        var key = Ext.String.format("{0}.{1}",
            this.pinKey,
            oid
        );
        
        var settings = {};
        var value = {};
        value[oid] = record_item._type;
        
        settings[key] = Ext.JSON.encode( value );

        Rally.data.PreferenceManager.update({
            user: Rally.getApp().getContext().getUser().ObjectID,
            filterByUser: true,
            settings: settings,
            success: function(updatedRecords, notUpdatedRecords) {
                //yay!
            }
        });
    },
    
    _getColumnForDay: function(day,idx) {
        var disabled = false;
        
        var editor_config = function(record,df) {
            var minValue = 0;
            return Ext.create('Ext.grid.CellEditor', {
                field: Ext.create('Rally.ui.NumberField', {
                    xtype:'rallynumberfield',
                    minValue: minValue,
                    maxValue: 24,
                    disabled: disabled,
                    selectOnFocus: true,
                    listeners: {
                        change: function(field, new_value, old_value) {
                            if ( Ext.isEmpty(new_value) ) {
                                field.setValue(0);
                            }
                            
                            //console.log('change', day, new_value);
                            record.set(day, new_value);
                            record.save();
                        }
                    }
                })
            });
        };

        var header_text = Ext.String.format("{0}<br/>{1}",
            CA.techservices.timesheet.TimeRowUtils.dayShortNames[day],
            moment( Rally.util.DateTime.add(this.startDate,'day',idx) ).utc().format('D MMM')
        );
        
        var config = {
            dataIndex:day,
            html: header_text,
            width: 50, 
            resizable: false,
            sortable: true,
            align: 'center',
            getEditor: editor_config, 
            field: 'test',
            summaryType: 'sum',
            renderer: function(value,meta,record) {
                if ( value === 0 ) {
                    return "";
                } 
                return value;
            }
        };
        
        if ( day == "Saturday" || day == "Sunday" ) {
            config.renderer = function(value, meta, record) {
                meta.tdCls = "ts-weekend-cell";
                if ( value === 0 ) {
                    return "";
                }
                return value;
            };
        }
        
        return config;
    },
    
    _getTimeEntryItemSets: function(time_entry_items) {
        var time_entry_item_sets = {};
        Ext.Array.each(time_entry_items, function(item){
            var oid = item.get('Task') && item.get('Task').ObjectID;
            if ( Ext.isEmpty(oid) ) {
                oid = item.get('WorkProduct') && item.get('WorkProduct').ObjectID;
            }
            if ( Ext.isEmpty(oid) ) {
                oid = item.get('Project') && item.get('Project').ObjectID;
            }
            
            if ( Ext.isEmpty(time_entry_item_sets[oid]) ) {
                time_entry_item_sets[oid] = [];
            }
            time_entry_item_sets[oid].push(item);
        });
        
        return Ext.Object.getValues(time_entry_item_sets);
    },
    
    _createRows: function(time_entry_items, time_entry_values, time_detail_prefs) {
        var rows = [],
            me = this;
        
        // in Rally, a time row has to start on Sunday, so we'll have up to two
        // time entry items for every row if the week starts on a different day
        var time_entry_item_sets = this._getTimeEntryItemSets(time_entry_items);
        console.log('--', time_detail_prefs);
        
        Ext.Array.each(time_entry_item_sets, function(item_set){
            var item_values = [];
            
            Ext.Array.each(item_set, function(time_entry_item) {
                var oid = time_entry_item.get('ObjectID');
                var values_for_time_entry_item =  Ext.Array.filter(time_entry_values, function(time_entry_value){
                    return time_entry_value.get('TimeEntryItem').ObjectID == oid;
                });
                
                item_values = Ext.Array.push(item_values, values_for_time_entry_item);
            });
            
            var item_oid = CA.techservices.timesheet.TimeRowUtils.getItemOIDFromTimeEntryItem(item_set[0]);
            var detail_preference = null;
            Ext.Array.each(time_detail_prefs, function(pref) {
                var name_array = pref.get('Name').split('.');
                if ( "" + item_oid == name_array[name_array.length-1] ) {
                    detail_preference = pref;
                }
            });
            
            var config = {
                WeekStartDate: me.startDate,
                TimeEntryItemRecords: item_set,
                TimeEntryValueRecords: item_values
            };
            
            if ( !Ext.isEmpty(detail_preference) ) {
                config.DetailPreference = detail_preference;
            }
            if ( me.time_entry_defaults[item_oid] && me.time_entry_defaults[item_oid] !== false ) {
                config.Pinned = true;
            }

            var row = Ext.create('CA.techservices.timesheet.TimeRow',config);
            rows.push(row);
        });
        
        console.log('--');
        return rows;
    },
    
    addRowForItem: function(item){
        var me = this,
            rows = this.rows;
        
        if ( this._hasRowForItem(item) ) {
            this.logger.log("Has row already:", item, item.get('ObjectID') );
            return;
        }
        
        this.logger.log('Adding row for ', item, item.get('ObjectID'));
        
        var item_type = item.get('_type');
        
        var sunday_start = TSDateUtils.getBeginningOfWeekISOForLocalDate(me.startDate);
        
        var config = {
            WorkProduct: {
                _ref: item.get('_ref')
            },
            WeekStartDate: sunday_start,
            User: {
                _ref: '/usr/' + this.timesheetUser.ObjectID
            }
        };
        
        if ( item.get('Project') ) {
            config.Project = item.get("Project");
        }
        
        if ( item_type == "task" ) {
            config.Task = { _ref: item.get('_ref') };
            config.WorkProduct = { _ref: item.get('WorkProduct')._ref };
        }
        
        Rally.data.ModelFactory.getModel({
            type: 'TimeEntryItem',
            scope: this,
            success: function(model) {
                var tei = Ext.create(model,config);
                tei.save({
                    fetch: me.time_entry_item_fetch,
                    callback: function(result, operation) {
                        row = Ext.create('CA.techservices.timesheet.TimeRow',{
                            WeekStartDate: me.startDate,
                            TimeEntryItemRecords: [result],
                            TimeEntryValueRecords: []
                        });
                        
                        var item_oid = me._getItemOIDFromRow(row);
                        if ( me.time_entry_defaults[item_oid] && me.time_entry_defaults[item_oid] !== false ) {
                            row.set('Pinned',true);
                        }
                        me.grid.getStore().loadRecords([row], { addRecords: true });
                        me.rows.push(row);
                    }
                });
            }
        });
    },
    
    getGrid: function() {
        return this.grid;
    },
    
    _hasRowForItem: function(item) {
        var me = this,
            rows = this.rows,
            hasRow = false,
            item_type = item.get('_type');
            
        Ext.Array.each(rows, function(row) {
            if ( row ) {
                if ( item_type == 'task' ) {
                    if ( row.get('Task') && row.get('Task')._ref == item.get('_ref') ) {
                        hasRow = true;
                    }
                } else {
                    if ( Ext.isEmpty(row.get('Task')) && row.get('WorkProduct') && row.get('WorkProduct')._ref == item.get('_ref') ) {
                        hasRow = true;
                    }
                }
            }
        });
        
        return hasRow;
    },
    
    _launchTimeDetailsDialog: function(row) {
        Ext.create('CA.technicalservices.TimeDetailsDialog',{
            row: row
        });
    },
    
    _loadTimeEntryItems: function() {
        this.setLoading('Loading time entry items...');
        
        var filters = [{property:'User.ObjectID',value:this.timesheetUser.ObjectID}];
        
        if ( this.weekStart === 0 ) {
            filters.push({property:'WeekStartDate',value:this.startDate});
        } else {
            filters.push({property:'WeekStartDate', operator: '>=', value:Rally.util.DateTime.add(this.startDate, 'day', -6)});
            filters.push({property:'WeekStartDate', operator: '<=', value:Rally.util.DateTime.add(this.startDate,'day',6)});
        }
        
        var config = {
            model: 'TimeEntryItem',
            context: {
                project: null
            },
            fetch: this.time_entry_item_fetch,
            filters: filters
        };
        
        return TSUtilities.loadWsapiRecords(config);
    },
    
    _loadTimeEntryValues: function() {
        this.setLoading('Loading time entry values...');

        var filters = [{property:'TimeEntryItem.User.ObjectID',value:this.timesheetUser.ObjectID}];
        
        if ( this.weekStart === 0 ) {
            filters.push({property:'TimeEntryItem.WeekStartDate',value:this.startDate});
        } else {
            filters.push({property:'TimeEntryItem.WeekStartDate', operator: '>=', value:Rally.util.DateTime.add(this.startDate, 'day', -6)});
            filters.push({property:'TimeEntryItem.WeekStartDate', operator: '<=', value:Rally.util.DateTime.add(this.startDate,'day',6)});
        }
        
        var config = {
            model: 'TimeEntryValue',
            context: {
                project: null
            },
            fetch: ['DateVal','Hours','TimeEntryItem','ObjectID'],
            filters: filters
        };
        
        return TSUtilities.loadWsapiRecords(config);        
    },
    
    _loadTimeDetailPreferences: function() {
        this.setLoading('Loading time entry details...');
        
        var filters = [{property:'Name',operator:'contains',value:CA.techservices.timesheet.TimeRowUtils.getDetailPrefix(this.startDate)}];
        
        var config = {
            model: 'Preference',
            fetch: ['Name','Value'],
            filters: filters
        };
        
        return TSUtilities.loadWsapiRecords(config);
    }
});