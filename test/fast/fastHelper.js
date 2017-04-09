// Feb 7, 2016 is a sunday
var previous_sunday_in_utc = (new Date(Date.UTC(2016, 0, 31, 0, 0, 0)));    
var previous_sunday_local  = new Date(2016,0, 31);
var previous_sunday_local_DST  = new Date(2016,2,6);

var previous_monday_in_utc = (new Date(Date.UTC(2016, 1, 1, 0, 0, 0)));    
var previous_monday_in_utc_DST = (new Date(Date.UTC(2016, 2, 7, 0, 0, 0)));    
var previous_monday_local  = new Date(2016,1,1);
var previous_monday_local_DST = new Date(2016,2,7);

var sunday_in_utc = (new Date(Date.UTC(2016, 1, 7, 0, 0, 0)));    
var sunday_local  = new Date(2016,1,7);
var sunday_local_DST  = new Date(2017,2,12);
var sunday_local_DST_in_utc  = new Date(Date.UTC(2017,2,12));
var sunday_local_end_DST_in_utc  = new Date(Date.UTC(2017,10,5));

var monday_in_utc = (new Date(Date.UTC(2016, 1, 8, 0, 0, 0)));    
var monday_in_utc_DST = (new Date(Date.UTC(2017, 2, 13, 0, 0, 0)));    
var monday_local  = new Date(2016,1,8);
var monday_local_DST = new Date(2017,2,13);
var monday_local_DST_in_utc  = new Date(Date.UTC(2017,2,13));
var monday_local_end_DST_in_utc  = new Date(Date.UTC(2017,10,6));

var friday_in_utc = (new Date(Date.UTC(2016, 1, 12, 0, 0, 0)));    
var friday_local  = new Date(2016,1,12);

var second_sunday_in_utc = (new Date(Date.UTC(2016, 1, 14, 0, 0, 0)));    
var third_sunday_in_utc = (new Date(Date.UTC(2016, 1, 21, 0, 0, 0)));    



var useObjectID = function(value,record) {
    if ( record.get('ObjectID') ) {
        return record.get('ObjectID');
    } 
    return 0;
};

var shiftDayBeginningToEnd = function(day) {
    return Rally.util.DateTime.add(Rally.util.DateTime.add(Rally.util.DateTime.add(day,'hour',23), 'minute',59),'second',59);
};

Ext.define('mockStory',{
    extend: 'Ext.data.Model',
    fields: [
        {name:'ObjectID', type: 'int'},
        {name:'Name',type:'string'},
        {name:'PlanEstimate',type:'int'},
        {name:'id',type:'int',convert:useObjectID},
        {name:'ScheduleState',type:'string',defaultValue:'Defined'}
    ]
});


Ext.define('mockTimeEntryItem',{
    extend: 'Ext.data.Model',
    fields: [
        {name:'ObjectID', type: 'int', defaultValue: 75},
        {name:'CreationDate', type:'string', defaultValue: Rally.util.DateTime.toIsoString(new Date())},
        {name:'Project', type:'object' },
        {name:'ProjectDisplayString', type:'string' },
        {name:'Task', type:'object' },
        {name:'TaskDisplayString', type:'string' },
        {name:'WeekStartDate', type:'auto' },
        {name:'WorkProduct', type:'object'},
        {name:'WorkProductString', type:'string' }
    ]
});

Ext.define('mockTimeEntryValue',{
    extend: 'Ext.data.Model',
    fields: [
        {name:'ObjectID', type: 'int', defaultValue: 75},
        {name:'CreationDate', type:'string', defaultValue: Rally.util.DateTime.toIsoString(new Date())},
        {name:'DateVal', type:'auto'},
        {name:'Hours', type:'number'},
        {name:'TimeEntryItem', type:'object'}
    ]
});

Ext.define('mockTimeDetailPreference', {
    extend: 'Ext.data.Model',
    fields: [
        {name:'ObjectID', type: 'int', defaultValue: 85},
        {name:'Name', type:'string', defaultValue: Rally.util.DateTime.toIsoString(new Date())},
        {name:'Value',type:'string' }
    ]
});

