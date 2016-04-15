Ext.define('CA.techservices.timesheet.TimeRowUtils',{
    singleton: true,
    
    daysInOrder: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    
    dayShortNames: {'Sunday':'Sun','Monday':'Mon','Tuesday':'Tues','Wednesday':'Wed','Thursday':'Thur','Friday':'Fri','Saturday':'Sat'},
    
    getDayOfWeek: function(value, record) {
        var week_start_date =  record.get('WeekStartDate');
        if ( Ext.isEmpty( week_start_date ) ) {
            return 0;
        }
        return week_start_date.getUTCDay();
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
        
        return teis[0].get(field_name);
    },
    
    getDayValueFromTimeEntryValues: function(value, record, day_name) {
        // if we're modifying this directly, don't take it from the TimeEntryValueRecords
        if ( !Ext.isEmpty(value) ) { return value; }
        
        var index = Ext.Array.indexOf(CA.techservices.timesheet.TimeRowUtils.daysInOrder, day_name);
        var week_start_date =  record.get('WeekStartDate');
        var time_entry_values = record.get('TimeEntryValueRecords');
        
        var day_value = 0;
        Ext.Array.each(time_entry_values, function(time_entry_value){
            var tev_day = time_entry_value.get('DateVal').getUTCDay();
            if ( tev_day == index && time_entry_value.get('DateVal') >= week_start_date ) {
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
    }
});

Ext.define('CA.techservices.timesheet.TimeRow',{
    extend: 'Ext.data.Model',

    fields: [
        { name: '__SecretKey', type:'string' },
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
        // WeekStart: Day of Week (0=Sunday, 6=Saturday)
        { name: 'WeekStart', type: 'int', convert:  CA.techservices.timesheet.TimeRowUtils.getDayOfWeek },
        
        // store the AC records for saving/updating
        { name: 'TimeEntryItemRecords', type:'object', defaultValue: []},
        { name: 'TimeEntryValueRecords', type:'object', defaultValue: []},
        
        //
        { name: 'Sunday', type:'number', persist: true, convert: 
            function(value,record) {
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
        
        console.log('--', this, v, changes);
        var promises = [];
        Ext.Object.each(changes, function(field, value) {
            if ( Ext.Array.contains(CA.techservices.timesheet.TimeRowUtils.daysInOrder, field) ) {
                return me._changeDayValue(field,value);
            }
        });
        
        return Deft.Chain.sequence(promises,this);
        //return deferred.promise;
    },
    
    _changeDayValue: function(day, value) {
        var deferred = Ext.create('Deft.Deferred');
        var time_entry_value = this._getTimeEntryValue(day);
        
        if ( Ext.isEmpty(time_entry_value) ) {
            return;
        }
        
        time_entry_value.set('Hours',value);
        time_entry_value.save({
            callback: function(results, operation, success) {
                deferred.resolve(results);
            }
        });
        
        return deferred.promise;
    },
    
    _getTimeEntryValue: function(day_name) {
        var index = Ext.Array.indexOf(CA.techservices.timesheet.TimeRowUtils.daysInOrder, day_name);
        var week_start_date =  this.get('WeekStartDate');
        var time_entry_values = this.get('TimeEntryValueRecords');
        
        console.log('looking for', day_name, index, week_start_date, time_entry_values);
        
        var day_value = null;
        Ext.Array.each(time_entry_values, function(time_entry_value){
            var tev_day = time_entry_value.get('DateVal').getUTCDay();
            if ( tev_day == index && time_entry_value.get('DateVal') >= week_start_date ) {
                day_value = time_entry_value;
            }
        });
        
        return day_value;
    }
});