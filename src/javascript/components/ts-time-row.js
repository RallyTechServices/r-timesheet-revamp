Ext.define('CA.techservices.timesheet.TimeRowUtils',{
    singleton: true,
    
    daysInOrder: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    
    dayShortNames: {'Sunday':'Sun','Monday':'Mon','Tuesday':'Tues','Wednesday':'Wed','Thursday':'Thur','Friday':'Fri','Saturday':'Sat'},
    
    getDayOfWeekFromDate: function(jsdate) {
        if ( jsdate.getUTCHours() === 0 ) {
            return jsdate.getUTCDay();
        }
        return jsdate.getDay();
    },
    
    detailKeyPrefix: 'ca.technicalservices.timesheet.details',
    
    getDetailPrefix: function(start_date){
        if ( Ext.isDate(start_date) ) {
            start_date = Rally.util.DateTime.toIsoString(start_date).replace(/T.*$/,'');
        }
        return Ext.String.format("{0}.{1}",
            CA.techservices.timesheet.TimeRowUtils.detailKeyPrefix,
            start_date
        );
    },

    getDayOfWeek: function(value, record) {
        var week_start_date =  record.get('WeekStartDate');
        if ( Ext.isEmpty( week_start_date ) ) {
            return 0;
        }
        return CA.techservices.timesheet.TimeRowUtils.getDayOfWeekFromDate(week_start_date);
    },
    
    getFieldFromTimeEntryItems: function(value,record,field_name){
        if ( !Ext.isEmpty(value) ) { return value; }
        
        var teis = record.get('TimeEntryItemRecords');
        if ( Ext.isEmpty(teis) ) {
            return value;
        }
        
        if ( !Ext.isArray(teis) || teis.length === 0 ) {
            return value;
        }
        
        if (/\./.test(field_name)) {
            var field_array = field_name.split('.');
            var field = field_array.shift();
            if ( field_array.length == 1 ) {
                if ( Ext.isEmpty(teis[0].get(field)) ) {
                    return null;
                }
                return teis[0].get(field)[field_array[0]];
            }
            if ( field_array.length == 2 ) {
                if ( Ext.isEmpty(teis[0].get(field)) || Ext.isEmpty(teis[0].get(field)[field_array[0]]) ) {
                    return null;
                }
                return teis[0].get(field)[field_array[0]][field_array[1]];
            }
            
            console.log("Field Array Too Long", field_array);
            
        }
        return teis[0].get(field_name);
    },
    
    getDayValueFromTimeEntryValues: function(value, record, day_name) {
        // if we're modifying this directly, don't take it from the TimeEntryValueRecords
        if ( !Ext.isEmpty(value) ) { return value; }
        
        var index = Ext.Array.indexOf(CA.techservices.timesheet.TimeRowUtils.daysInOrder, day_name);
        var week_start_date =  record.get('WeekStartDate');
        if ( Ext.isEmpty(week_start_date) ) { return 0; }
        
        var week_end_date = Rally.util.DateTime.add(week_start_date, 'week', 1);
        
        var time_entry_values = record.get('TimeEntryValueRecords');
        
        var day_value = 0;
        Ext.Array.each(time_entry_values, function(time_entry_value){
            var tev_day = time_entry_value.get('DateVal').getUTCDay();
            var tev_date = time_entry_value.get('DateVal');
            
            if ( tev_day == index && tev_date >= week_start_date && tev_date < week_end_date ) {
                day_value = time_entry_value.get('Hours');
            }
        });
        
        return day_value || 0;
    },
        
    getTotalFromDayValues: function(value, record) {
        var total = 0;
        Ext.Array.each(CA.techservices.timesheet.TimeRowUtils.daysInOrder, function(day) {
            var hours = record.get(day) || 0;
            total = ( 100 * hours ) + total;
        });
        
        return Math.round( total ) / 100;
    },
    
    getOrderedDaysBasedOnWeekStart: function(week_start_day) {
        if ( week_start_day === 0 ) { return CA.techservices.timesheet.TimeRowUtils.daysInOrder; }
        
        var standard_days = CA.techservices.timesheet.TimeRowUtils.daysInOrder;
        
        var first_days = Ext.Array.slice(standard_days, week_start_day, 7);
        var second_days = Ext.Array.slice(standard_days, 0, week_start_day);
                
        return Ext.Array.push(first_days, second_days);
    },
    
    getValueFromDayOfWeek: function(week_start_date, week_start_day, day_name) {
        var days_in_order = CA.techservices.timesheet.TimeRowUtils.getOrderedDaysBasedOnWeekStart(week_start_day);
        var index = Ext.Array.indexOf(days_in_order, day_name);
        
        return Rally.util.DateTime.add(week_start_date,'day',index);
    },
    
    getBlocksFromDetailPreference: function(value,record){
        if ( !Ext.isEmpty(value) ) { return value; }
        
        var pref = record.get('DetailPreference');
        if ( Ext.isEmpty(pref) ) { return {}; }
        
        var pref_value = pref.get('Value');
        
        if ( Ext.isEmpty(pref_value) ) { return {}; }
        if ( !/{/.test(pref_value) ) { return {}; }
        
        return Ext.JSON.decode(pref_value);
    },

    getItemOIDFromTimeEntryItem: function(record) {
        var item_oid = -1;
        var workproduct = record.get('WorkProduct');
        var task = record.get('Task');
        
        if ( !Ext.isEmpty(workproduct) ) {
            item_oid = workproduct.ObjectID;
        }
        
        if ( !Ext.isEmpty(task) ) {
            item_oid = task.ObjectID;
        }

        
        return item_oid;
    },
    
    getDetailPreference: function(record) {
        
        return Deft.Chain.sequence([
            function() {
                var deferred = Ext.create('Deft.Deferred');
                if ( !Ext.isEmpty(record.get('DetailPreference')) ) {
                    return [ record.get('DetailPreference') ];
                }
                
                    
                var oid = record.get('TaskOID');
                if ( oid < 0 ) {
                    oid = record.get('WorkProductOID');
                }
                var key_start = CA.techservices.timesheet.TimeRowUtils.getDetailPrefix(record.get('WeekStartDate'));
                
                var key = Ext.String.format("{0}.{1}",
                    key_start,
                    oid
                );
                                
                Rally.data.ModelFactory.getModel({
                    type: 'Preference',
                    success: function(model) {
                        var pref = Ext.create(model, {
                            Name: key,
                            Value: "{}",
                            User: Rally.getApp().getContext().getUser()._ref,
                            Project: null
                        });
                        
                        pref.save({
                            callback: function(preference, operation) {
                                if(operation.wasSuccessful()) {
                                    record.set('DetailPreference', preference);
                                    deferred.resolve(preference);
                                }
                            }
                        });
                    }
                });

                return deferred.promise;
            }
        ]);
    },
    
    loadWsapiRecords: function(config,returnOperation){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        
        var default_config = {
            model: 'Preference',
            fetch: ['ObjectID']
        };
        Ext.create('Rally.data.wsapi.Store', Ext.Object.merge(default_config,config)).load({
            callback : function(records, operation, successful) {
                if (successful){
                    if ( returnOperation ) {
                        deferred.resolve(operation);
                    } else {
                        deferred.resolve(records);
                    }
                } else {
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    }
    
});

Ext.define('CA.techservices.timesheet.TimeRow',{
    extend: 'Ext.data.Model',

    createTEVProcess: {},
    
    fields: [
        { name: '__SecretKey', type:'string' },
        { name: 'Pinned', type: 'boolean', defaultValue: false },
        
        { name: 'Project',type: 'object', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Project');
            }
        },
        
        { name: 'Task', type:'object', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task')
                    || "";
            }
        },
        { name: 'TaskOID', type: 'number', defaultValue: null, convert: 
            function(value,record) {
                var item = CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task');
                
                if ( Ext.isEmpty(item) ) { return -1; }
                return item.ObjectID || -1;
            }
        },
        { name: 'TaskFID', type: 'string', defaultValue: null, convert: 
            function(value,record) {
                var item = CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task');
                
                if ( Ext.isEmpty(item) ) { return -1; }
                return item.FormattedID || -1;
            }
        },
        { name: 'TaskName', type: 'string', defaultValue: null, convert: 
            function(value,record) {
                var item = CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task');
                
                if ( Ext.isEmpty(item) ) { return ''; }
                return item.Name || '';
            }
        },
        { name: 'User', type:'object', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'User');
            }
        },
        { name: 'WeekStartDate', type:'date' },
        { name: 'WorkProduct', type: 'object', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct')
                    || "";
            }
        },
        { name: 'WorkProductOID', type: 'number', defaultValue: null, convert: 
            function(value,record) {
                var item = CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct');
                
                if ( Ext.isEmpty(item) ) { return -1; }
                return item.ObjectID || -1;
            }
        },
        { name: 'WorkProductFID', type: 'string', defaultValue: null, convert: 
            function(value,record) {
                var item = CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct');
                
                if ( Ext.isEmpty(item) ) { return '' }
                return item.FormattedID || '';
            }
        },
        { name: 'WorkProductName', type: 'string', defaultValue: null, convert: 
            function(value,record) {
                var item = CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct');
                
                if ( Ext.isEmpty(item) ) { return ''; }
                return item.Name || '';
            }
        },
        { name: 'PortfolioItem', type: 'object', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct.PortfolioItem')
                    || "";
            }
        },
        { name: 'PortfolioItemOID', type: 'number', defaultValue: null, convert: 
            function(value,record) {
                var item = CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct.PortfolioItem');
                
                if ( Ext.isEmpty(item) ) { return -1; }
                return item.ObjectID || -1;
            }
        },
        { name: 'PortfolioItemFID', type: 'string', defaultValue: null, convert: 
            function(value,record) {
                var item = CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct.PortfolioItem');
                
                if ( Ext.isEmpty(item) ) { return '' }
                return item.FormattedID || '';
            }
        },
        { name: 'PortfolioItemName', type: 'string', defaultValue: null, convert: 
            function(value,record) {
                var item = CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct.PortfolioItem');
                
                if ( Ext.isEmpty(item) ) { return ''; }
                return item.Name || '';
            }
        },
        
        { name: 'Iteration', type: 'object', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct.Iteration')
                    || CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task.Iteration')
                    || "";
            }
        },
        
        { name: 'ToDo', type: 'number', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task.ToDo');
            }
        },
        
        { name: 'State', type: 'object', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task.State') || "";
            },
            sortType : function (value) {
                var allowed_order = ['Defined','In-Progress','Completed'];
                return Ext.Array.indexOf(allowed_order,value);
            }
        },
        // WeekStart: Day of Week (0=Sunday, 6=Saturday)
        { name: 'WeekStart', type: 'int', convert:  CA.techservices.timesheet.TimeRowUtils.getDayOfWeek },
        
        // store the AC records for saving/updating
        { name: 'TimeEntryItemRecords', type:'object', defaultValue: []},
        { name: 'TimeEntryValueRecords', type:'object', defaultValue: []},
        
        //
        { name: 'Sunday', type:'number', persist: true, 
            convert: function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getDayValueFromTimeEntryValues(value, record, 'Sunday');
            }
        },
        { name: 'Monday', type:'number', convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getDayValueFromTimeEntryValues(value, record, 'Monday');
            }
        },
        { name: 'Tuesday', type:'number', convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getDayValueFromTimeEntryValues(value, record, 'Tuesday');
            }
        },
        { name: 'Wednesday', type:'number', convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getDayValueFromTimeEntryValues(value, record, 'Wednesday');
            }
        },
        { name: 'Thursday', type:'number', convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getDayValueFromTimeEntryValues(value, record, 'Thursday');
            }
        },
        { name: 'Friday', type:'number', convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getDayValueFromTimeEntryValues(value, record, 'Friday');
            }
        },
        { name: 'Saturday', type:'number', convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getDayValueFromTimeEntryValues(value, record, 'Saturday');
            }
        },
        { name: 'Total', type: 'number', defaultValue: 0, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getTotalFromDayValues(value, record);
            }
        },
        {
            name: 'DetailPreference', type:'object', defaultValue: null
        },
        {
            name: '_DetailBlocks', type:'object', 
            convert:  function(value,record){
                return CA.techservices.timesheet.TimeRowUtils.getBlocksFromDetailPreference(value, record);
            }
        }
    ],
    
    getWeekStartDates: function() {
        var day_of_week = this.get('WeekStart');
        var date_of_week = this.get('WeekStartDate');
        
        
        if (day_of_week === 0 ) {
            return [date_of_week];
        }
        
        var date1 = Rally.util.DateTime.add(date_of_week, 'day', -1 * day_of_week);
        var date2 = Rally.util.DateTime.add(date1, 'day', 7);
        
        return [date1, date2];
    },
    
    save: function(v) {
        var deferred = Ext.create('Deft.Deferred'),
            me = this,
            changes = this.getChanges();
        
        var promises = [];
        Ext.Object.each(changes, function(field, value) {            
            if ( Ext.Array.contains(CA.techservices.timesheet.TimeRowUtils.daysInOrder, field) ) {
                promises.push( function() { return me._changeDayValue(field,value); });
            } 
            
            if ( field == "ToDo" ) {
                promises.push(function() { return me._changeToDoValue(value); });
            }
            
            if ( field == "State" ) {
                promises.push(function() { return me._changeStateValue(value); });
            }
            
            if ( field == "_DetailBlocks" ) {
                promises.push(function() { return me._changeDetailPreference(value); });
            }
        });
        
        return Deft.Chain.sequence(promises,this);
    },
    
    _changeToDoValue: function(value) {
        return this._changeTaskFieldValue('ToDo',value);
    },
    
    _changeStateValue: function(value) {
        if ( value == "Completed" ) { this.set('ToDo', 0); }
        
        return this._changeTaskFieldValue('State',value);
    },
    
    _changeTaskFieldValue: function(field, value) {
        var deferred = Ext.create('Deft.Deferred'),
            me = this;
        var task = this.get("Task");
                
        if ( Ext.isEmpty(task) ) {
            return;
        }
        
        Rally.data.ModelFactory.getModel({
            type: 'Task',
            scope: this,
            success: function(model) {
                model.load(task.ObjectID,{
                    fetch: ['Name', 'State', 'Iteration','ToDo','WorkProduct'],
                    callback: function(result, operation) {
                        if(operation.wasSuccessful()) {
                            result.set(field,value);
                            result.save({
                                callback: function(new_task, operation) {
                                    me.set('Task', new_task.getData());
                                    deferred.resolve(new_task);
                                }
                            });
                            
                        } else {
                            deferred.reject('Problem saving Task');
                        }
                    }
                });
            }
        });
        return deferred;
    },
    
    _changeDayValue: function(day, value) {
        var deferred = Ext.create('Deft.Deferred'),
            me = this;
            
        var time_entry_value = this.getTimeEntryValue(day);
        
        if ( Ext.isEmpty(time_entry_value) ) {            
            return this._createTimeEntryValue(day,value);
        }
        
        time_entry_value.set('Hours',value);
        // recalculate total
        this.set('Total', 0);
        
        time_entry_value.save({
            callback: function(result) {
                deferred.resolve(result);
            }
        });
        
        return deferred.promise;
    },
    
    clearAndRemove: function() {
        var me = this,
            promises = [];
            
        Rally.getApp().setLoading("Clearing...");
        
        Ext.Array.each(CA.techservices.timesheet.TimeRowUtils.daysInOrder, function(day_name) {
            var time_entry_value = me.getTimeEntryValue(day_name);
            
            if (!Ext.isEmpty(time_entry_value)){
                promises.push(function(){
                    var deferred = Ext.create('Deft.Deferred');
                    me.set(day_name, 0);
                    time_entry_value.destroy({
                        callback: function(result, operation) {
                            deferred.resolve();
                        }
                    });
                    return deferred.promise;
                });
            }
        });
        
        Deft.Chain.sequence(promises).then({
            scope: this,
            success: function(results) {
                this.set('TimeEntryValueRecords',[]);
                this.set('Total', 0);
                
                var time_entry_items = this.get('TimeEntryItemRecords');
                var promises = Ext.Array.map(time_entry_items, function(time_entry_item){
                    return function() { return me._removeTimeEntryItem(time_entry_item); }
                });
                
                Deft.Chain.sequence(promises).then({
                    scope: this,
                    success: function() {
                        Rally.getApp().setLoading(false);
                        me.destroy();
                    },
                    failure: function(msg) {
                        console.log("cannot remove all the time entry items because they're used elsewhere",msg);
                    }
                }).always(function() { Rally.getApp().setLoading(false); });
            }
        });
        
    },
    
    _removeTimeEntryItem: function(time_entry_value){
        var deferred = Ext.create('Deft.Deferred');
        time_entry_value.destroy({
            callback: function(result, operation) {
                if ( operation.wasSuccessful() ) {
                    deferred.resolve();
                } else {
                    deferred.reject(operation.error.errors[0]);
                }
            }
        });
        return deferred.promise;
    },
    
    getTimeEntryValue: function(day_name) {
        var index = Ext.Array.indexOf(CA.techservices.timesheet.TimeRowUtils.daysInOrder, day_name);
        var week_start_date =  this.get('WeekStartDate');
        var time_entry_values = this.get('TimeEntryValueRecords');
                
        var day_value = null;
        var value_date = CA.techservices.timesheet.TimeRowUtils.getValueFromDayOfWeek(this.get('WeekStartDate'), this.get('WeekStart'), day_name);
        
        Ext.Array.each(time_entry_values, function(time_entry_value){
            var delta = Rally.util.DateTime.getDifference(time_entry_value.get('DateVal'), value_date, 'day');
            
            if (delta === 0 ) {
                day_value = time_entry_value;
            }
        });
        
        return day_value;
    },
    
    _createTimeEntryValue: function(day_name, value) {
        var deferred = Ext.create('Deft.Deferred'),
            me = this;
        
        var value_date = CA.techservices.timesheet.TimeRowUtils.getValueFromDayOfWeek(this.get('WeekStartDate'), this.get('WeekStart'), day_name);
        var time_entry_item = null;
        Ext.Array.each(this.get('TimeEntryItemRecords'), function(item){
            var delta = Rally.util.DateTime.getDifference(value_date, item.get('WeekStartDate'), 'day');
            if ( value_date >= item.get('WeekStartDate') && delta < 7 ) {
                time_entry_item = item;
            }
        });
        
        if ( Ext.isEmpty(time_entry_item) ) {
            console.log('No Time Entry Item');
            
            this._createTimeEntryItem(value_date, this.get('Project'), this.get('WorkProduct'), this.get('Task') ).then({
                scope: this,
                success: function(result) {
                    console.log('Created Time Entry Item');
                    if ( this.createTEVProcess[day_name] && this.createTEVProcess[day_name].getState() === 'pending' ) {
                        console.log('..Save is already in process');
                        deferred.resolve();
                    } else {
                        this.createTEVProcess[day_name] = this._createTimeEntryValueWithModel(day_name, value, value_date, result);
                        return this.createTEVProcess[day_name];
                    }
                },
                failure: function(msg) {
                    console.log("Problem creating new TEI", msg);
                    deferred.reject(msg);
                }
            });
            return deferred.promise;
        }
        
        if ( this.createTEVProcess[day_name] && this.createTEVProcess[day_name].getState() === 'pending' ) {
            console.log('...Save is already in process');
            return;
        } else {
            this.createTEVProcess[day_name] = this._createTimeEntryValueWithModel(day_name, value, value_date, time_entry_item);
            return this.createTEVProcess[day_name];            
        }
    },
    
    _createTimeEntryItem: function(value_date, project, workproduct, task) {
        Rally.getApp().setLoading('Creating Time Entry Item...');

        var deferred = Ext.create('Deft.Deferred'),
            me = this;
        
        var sunday_start = TSDateUtils.getBeginningOfWeekISOForLocalDate(value_date);
        console.log("Creating TEI for week starting:", sunday_start, " (", value_date, ")");
        
        var config = {
            WeekStartDate: sunday_start,
            Project: { _ref: project._ref }
        };
        
        if ( !Ext.isEmpty(task) ) {
            config.Task = { _ref: task._ref };
        }
        
        if ( !Ext.isEmpty(workproduct) ) {
            config.WorkProduct = { _ref: workproduct._ref };
        }
        
        Rally.data.ModelFactory.getModel({
            type: 'TimeEntryItem',
            scope: this,
            success: function(model) {
                var tei = Ext.create(model,config);
                tei.save({
                    callback: function(result, operation) {
                        var records = me.get('TimeEntryItemRecords') || [];
                        records.push(result);
                        me.set('TimeEntryItemRecords', records);
                        Rally.getApp().setLoading(false);
                        deferred.resolve(result);
                    }
                });
            }
        });
        return deferred.promise;
    },
    
    _createTimeEntryValueWithModel: function(day_name, value, value_date, time_entry_item) {
        var deferred = Ext.create('Deft.Deferred'),
            me = this;
        
        console.log("Creating Time Entry Value", day_name, value, value_date, time_entry_item);
        
        Rally.data.ModelFactory.getModel({
            type: 'TimeEntryValue',
            scope: this,
            success: function(model) {
                this._changeFieldRights(model);
                
                var tev = Ext.create(model,{
                    Hours: value,
                    TimeEntryItem: { _ref: time_entry_item.get('_ref') },
                    DateVal: TSDateUtils.formatShiftedDate(value_date,'Y-m-d') + 'T00:00:00.000Z'
                });
                
                tev.save({
                    callback: function(result, operation) {
                        if(operation.wasSuccessful()) {
                            this.set(day_name, value);
                            
                            var records = me.get('TimeEntryValueRecords') || [];
                            records.push(result);
                            me.set('TimeEntryValueRecords', records);
                            
                            me.set('Total', 0); // updates the total automatically
                            deferred.resolve(result);    
                        } else {
                            me.set(day_name, 0);
                            console.log('Problem saving Time Entry Value:',day_name, operation);
                            //throw 'Problem saving time entry value';
                            deferred.reject(operation.error && operation.error.errors.join('.'));
                        }
                    }
                });
                
            }
        });
        return deferred.promise;
    },
    
    _changeFieldRights: function(model) {
        var fields = model.getFields();
        Ext.Array.each(fields, function(field,idx) {
            if ( field.name == "TimeEntryItem" ) {
                field.readOnly = false;
                field.persist = true;
                field.type = 'string';                        
            }
            if ( field.name == "DateVal" ) {
                // override field definition so that we can write to the 
                // field AND pass it a string for midnight at Z instead of
                // the local timestamp
                fields[idx] = Ext.create('Rally.data.wsapi.Field',{
                    type:'string',
                    readOnly: false,
                    persist: true,
                    name: 'DateVal',
                    custom: false,
                    hidden: false,
                    useNull: false
                });
            }
        });
        
        return model;
    },
    
    _changeDetailPreference: function(value) {
        var me = this;
        var json_value = Ext.JSON.encode(value);
        
        if ( this.process && this.process.getState() === 'pending') {
            return;
        }
        
        this.process = Deft.Chain.sequence([
            function() { 
                return CA.techservices.timesheet.TimeRowUtils.getDetailPreference(me);
            }
        ],this).then({
            success: function(preferences){
                preferences = Ext.Array.flatten(preferences);
                if ( preferences.length === 0 ) {
                   return;
                }
                var preference = preferences[0];
                
                preference.set('Value', json_value);
                preference.save();
            },
            failure: function(msg){
                Ext.Msg.alert("Problem saving detail", msg);
            }
        });
    },
    
    addTimeBlock: function(day, time_object){
        var block_set = this.get('_DetailBlocks');
        if ( Ext.isEmpty(block_set) && ! Ext.isEmpty(this.get('DetailPreference')) ){
            console.log('there is a detail pref', this.get('DetailPreference'));
            block_set = Ext.JSON.decode(this.get('DetailPreference').get('Value'));
            this.set('_DetailBlocks', block_set);
        }
        
        var blocks = this.getTimeBlocks(day);
        
        var block = this.getTimeBlock(day,time_object.id);
        if ( Ext.isEmpty(block) ) {
            blocks.push(time_object);
            //block_set[day] = blocks;
        } else {   
            Ext.Object.merge(block, time_object);
        }

        block_set[day] = blocks;
                
        this.set('_DetailBlocks', block_set); 
        this.set('_SecretKey',new Date());
        this.setDirty();// TODO: why is set() not setting the record as dirty and the field as changed?
    },
    
    removeTimeBlock: function(day, block_id){
        var block_set = this.get('_DetailBlocks');
        if ( Ext.isEmpty(block_set) && ! Ext.isEmpty(this.get('DetailPreference')) ){
            block_set = Ext.JSON.decode(this.get('DetailPreference').get('Value'));
            this.set('_DetailBlocks', block_set);
        }
        
        var blocks = this.getTimeBlocks(day);
        
        var new_blocks = Ext.Array.filter(blocks, function(block){
            return ( block_id != block.id );
        });
        
        block_set[day] = new_blocks;
                
        this.set('_DetailBlocks', block_set); 
        this.set('_SecretKey',new Date());
        this.setDirty();// TODO: why is set() not setting the record as dirty and the field as changed?
    },
    
    getTimeBlock: function(day, id) {
        var blocks = this.getTimeBlocks(day);
        var block = null;
        Ext.Array.each(blocks, function(b){
            if ( b.id == id ) {
                block = b;
            }
        });
        
        return block;
    },
    
    getTimeBlocks: function(day) {
        var blocks = this.get('_DetailBlocks');
        
        if ( blocks && blocks[day] ) {
            return blocks[day];
        }
        return [];
    },
    
    isPinned: function() {
        return this.get('Pinned') || false;
    },
    
    hasOpenDetails: function() {
        var has_open = false;
        var blocks = this.get('_DetailBlocks');
        
        Ext.Object.each(blocks, function(day,day_blocks){
            Ext.Array.each(day_blocks, function(block){
                if ( Ext.isEmpty(block.end_hour) ) {
                    has_open = true;
                }
            });
        });
        
        return has_open;
    }
});
