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
        'TaskDisplayString','Feature','Project', 'ObjectID', 'Name', 'Release', 'FormattedID'],
        
    config: {
        startDate: null,
        editable: true,
        timesheetUser: null
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
            this._loadTimeEntryValues
        ],this).then({
            scope: this,
            success: function(results) {
                var time_entry_items  = results[0];
                var time_entry_values = results[1];
                
                this.rows = this._createRows(time_entry_items, time_entry_values);
                this._makeGrid(this.rows);
                this.setLoading(false);
            },
            failure: function(msg) {
                Ext.Msg.alert('Problem Loading', msg);
            }
        });
    },
    
    _makeGrid: function(rows) {
        this.removeAll();
        var me = this,
            table_store = Ext.create('Rally.data.custom.Store',{
                groupField: '__SecretKey',
                model: 'CA.techservices.timesheet.TimeRow',
                data: rows,
                pageSize: 100
            });
            
        this.grid = this.add({ 
            xtype:'rallygrid', 
            store: table_store,
            columnCfgs: this._getColumns(),
            showPagingToolbar : false,
            showRowActionsColumn : false,
            sortableColumns: false,
            disableSelection: true,
            enableColumnMove: false,
            enableColumnResize : false,
            features: [{
                ftype: 'summary',
                startCollapsed: false,
                hideGroupedHeader: true,
                groupHeaderTpl: ' ',
                enableGroupingMenu: false
            }],

            viewConfig: {
                listeners: {
                    itemupdate: function(row, row_index) {
                        me.logger.log('itemupdate', row);
                    }
                }
            }
        });
        
        this.fireEvent('gridReady', this, this.grid);
    },
    
    _getColumns: function() {
        var me = this,
            columns = [];
        
        var columns = Ext.Array.push(columns,[
            {
                dataIndex: 'Project',
                text: 'Project',
                flex: 1,
                editor: null,
                renderer: function(value, meta, record) {
                    if ( Ext.isEmpty(value) ) {
                        return '--';
                    }
                    return value._refObjectName;
                }
            },
            {
                dataIndex: 'WorkProduct',
                text: 'Work Item',
                flex: 1,
                editor: null,
                renderer: function(value, meta, record) {
                    if ( Ext.isEmpty(value) ) {
                        return '--';
                    }
                    return Ext.String.format("<a target='_blank' href='{0}'>{1}</a>: {2}",
                        Rally.nav.Manager.getDetailUrl(value),
                        record.get('WorkProduct').FormattedID,
                        record.get('WorkProduct').Name
                    );;
                }
            },
            {
                dataIndex: 'Task',
                text: 'Task',
                flex: 1,
                editor: null,
                renderer: function(value, meta, record) {
                    if ( Ext.isEmpty(value) ) {
                        return '--';
                    }
                    return Ext.String.format("<a target='_blank' href='{0}'>{1}</a>: {2}",
                        Rally.nav.Manager.getDetailUrl(value),
                        record.get('Task').FormattedID,
                        record.get('Task').Name
                    );;
                }
            }
        ]);
        
        Ext.Array.each( CA.techservices.timesheet.TimeRowUtils.getOrderedDaysBasedOnWeekStart(this.weekStart), function(day) {
            columns.push(this._getColumnForDay(day));
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
    
    _getColumnForDay: function(day) {
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
                            
                            console.log('change', day, new_value);
                            record.set(day, new_value);
                            record.save();
                        }
                    }
                })
            });
        };

        var config = {
            dataIndex:day,
            text: CA.techservices.timesheet.TimeRowUtils.dayShortNames[day],
            width: 50, 
            resizable: false,
            align: 'center',
            getEditor: editor_config, 
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
    
    _createRows: function(time_entry_items, time_entry_values) {
        var rows = [],
            me = this;
        
        // in Rally, a time row has to start on Sunday, so we'll have up to two
        // time entry items for every row if the week starts on a different day
        var time_entry_item_sets = this._getTimeEntryItemSets(time_entry_items);
        
        Ext.Array.map(time_entry_item_sets, function(item_set){
            var item_values = [];
            
            Ext.Array.each(item_set, function(time_entry_item) {
                var oid = time_entry_item.get('ObjectID');
                var values_for_time_entry_item =  Ext.Array.filter(time_entry_values, function(time_entry_value){
                    return time_entry_value.get('TimeEntryItem').ObjectID == oid;
                });
                
                item_values = Ext.Array.push(item_values, values_for_time_entry_item);
            });
            
            rows.push(Ext.create('CA.techservices.timesheet.TimeRow',{
                WeekStartDate: me.startDate,
                TimeEntryItemRecords: item_set,
                TimeEntryValueRecords: item_values
            }));
        });
        
        return rows;
    },
    
    addRowForItem: function(item){
        var me = this,
            rows = this.rows;
        
        if ( this._hasRowForItem(item) ) {
            console.log("Has row already:", item);
            return;
        }
        
        console.log('Adding row for ', item);
        
        var item_type = item.get('_type');
        var config = {
            WorkProduct: {
                _ref: item.get('_ref')
            },
            WeekStartDate: TSDateUtils.getBeginningOfWeekISOForLocalDate(me.startDate,true,0),
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
                        console.log('--', operation);
                        row = Ext.create('CA.techservices.timesheet.TimeRow',{
                            WeekStartDate: me.startDate,
                            TimeEntryItemRecords: [result]
                        });
                        
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
            
        var store_count = this.grid.getStore().data.items.length;
        
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
    }
});