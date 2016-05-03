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
            total = total + hours;
        });
        
        return total;
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
    }
});

Ext.define('CA.techservices.timesheet.TimeRow',{
    extend: 'Ext.data.Model',

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
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task');
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
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct');
            }
        },
        
        { name: 'Iteration', type: 'object', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'WorkProduct.Iteration')
                    || CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task.Iteration');
            }
        },
        
        { name: 'ToDo', type: 'object', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task.ToDo');
            }
        },
        
        { name: 'State', type: 'object', defaultValue: null, convert: 
            function(value,record) {
                return CA.techservices.timesheet.TimeRowUtils.getFieldFromTimeEntryItems(value, record, 'Task.State');
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
            
        var time_entry_value = this._getTimeEntryValue(day);
        
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
            var time_entry_value = me._getTimeEntryValue(day_name);
            
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
                console.log('setting total');
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
    
    _getTimeEntryValue: function(day_name) {
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
            console.log('Could not find time entry item for date', value_date, this.get('TimeEntryItemRecords'));
            this._createTimeEntryItem(value_date, this.get('Project'), this.get('WorkProduct'), this.get('Task') ).then({
                scope: this,
                success: function(result) {
                    return this._createTimeEntryValueWithModel(day_name, value, value_date, result);
                },
                failure: function(msg) {
                    console.log("Problem creating new TEI", msg);
                    deferred.reject(msg);
                }
            });
            return deferred.promise;
        }
        
        return this._createTimeEntryValueWithModel(day_name, value, value_date, time_entry_item);
    },
    
    _createTimeEntryItem: function(value_date, project, workproduct, task) {
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
                            console.log('Operation:',operation);
                            throw 'Problem saving time entry value';
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
    
    isPinned: function() {
        return this.get('Pinned') || false;
    }
});