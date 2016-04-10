// Feb 7, 2016 is a sunday
var sunday_in_utc = (new Date(Date.UTC(2016, 1, 7, 0, 0, 0)));    
var sunday_local  = new Date(2016,1,7);
var sunday_local_DST  = new Date(2016,2,13);

var monday_in_utc = (new Date(Date.UTC(2016, 1, 8, 0, 0, 0)));    
var monday_in_utc_DST = (new Date(Date.UTC(2016, 2, 14, 0, 0, 0)));    
var monday_local  = new Date(2016,1,8);
var monday_local_DST = new Date(2016,2,14);

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
