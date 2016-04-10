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
        { name: 'Project',type: 'object' },
        { name: 'Task', type:'object' },
        { name: 'User', type:'object' },
        { name: 'WeekStartDate', type:'date' },
        { name: 'WorkProduct', type: 'object' },
        // WeekStart: Day of Week (0=Sunday, 6=Saturday)
        { name: 'WeekStart', type: 'int', convert:  CA.techservices.timesheet.TimeRowUtils.getDayOfWeek },
        
        // store the AC records for saving/updatingqaaaaaaa
        { name: 'TimeEntryItemRecords', type:'object'},
        { name: 'TimeEntryValueRecords', type:'object'}
    ]
});