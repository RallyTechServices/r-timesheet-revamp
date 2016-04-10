Ext.define('CA.techservices.timesheet.TimeRowUtils',{
    singleton: true,
    
    getDayOfWeek: function(value, record) {
        var week_start_date =  record.get('WeekStartDate');
        if ( Ext.isEmpty( week_start_date ) ) {
            return 0;
        }
        return week_start_date.getUTCDay();
    }
});

Ext.define('CA.techservices.timesheet.TimeRow',{
    extend: 'Ext.data.Model',
    fields: [
        { name: 'Project',type: 'object', defaultValue: null},
        { name: 'Task', type:'object', defaultValue: null },
        { name: 'User', type:'object', defaultValue: null },
        { name: 'WeekStartDate', type:'date' },
        { name: 'WorkProduct', type: 'object', defaultValue: null},
        // WeekStart: Day of Week (0=Sunday, 6=Saturday)
        { name: 'WeekStart', type: 'int', convert:  CA.techservices.timesheet.TimeRowUtils.getDayOfWeek },
        
        // store the AC records for saving/updating
        { name: 'TimeEntryItemRecords', type:'object', defaultValue: []},
        { name: 'TimeEntryValueRecords', type:'object', defaultValue: []},
        
        //
        { name: 'Sunday', type:'number', defaultValue: 0 },
        { name: 'Monday', type:'number', defaultValue: 0 },
        { name: 'Tuesday', type:'number', defaultValue: 0 },
        { name: 'Wednesday', type:'number', defaultValue: 0 },
        { name: 'Thursday', type:'number', defaultValue: 0 },
        { name: 'Friday', type:'number', defaultValue: 0 },
        { name: 'Saturday', type:'number', defaultValue: 0 }
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
    }
});