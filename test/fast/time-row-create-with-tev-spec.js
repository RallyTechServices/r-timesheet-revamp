describe("Time Row Creation By Time Entry Values Tests", function() {

    var sunday_tev = Ext.create('mockTimeEntryValue',{
        DateVal: sunday_in_utc,
        Hours: 1
    });

    var tuesday_tev = Ext.create('mockTimeEntryValue',{
        DateVal: Rally.util.DateTime.add(sunday_in_utc,'day',2),
        Hours: 2
    });

    var thursday_tev = Ext.create('mockTimeEntryValue',{
        DateVal: Rally.util.DateTime.add(sunday_in_utc,'day',4),
        Hours: 3
    });
    
    var saturday_tev = Ext.create('mockTimeEntryValue',{
        DateVal: Rally.util.DateTime.add(sunday_in_utc,'day',6),
        Hours: 4
    });
    
    var following_sunday_tev = Ext.create('mockTimeEntryValue',{
        DateVal: Rally.util.DateTime.add(sunday_in_utc,'day',7),
        Hours: 6
    });

    var following_tuesday_tev = Ext.create('mockTimeEntryValue',{
        DateVal: Rally.util.DateTime.add(sunday_in_utc,'day',9),
        Hours: 8
    });
    
    var following_thursday_tev = Ext.create('mockTimeEntryValue',{
        DateVal: Rally.util.DateTime.add(sunday_in_utc,'day',11),
        Hours: 10
    });
    
    
    it('should create values based on CA TEV if starting on Sunday', function(){
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: sunday_in_utc,
            TimeEntryValueRecords: [ sunday_tev, tuesday_tev, thursday_tev, saturday_tev ]
        });
        
        expect(row.get('Sunday'))   .toEqual(1);
        expect(row.get('Monday'))   .toEqual(0);
        expect(row.get('Tuesday'))  .toEqual(2);
        expect(row.get('Wednesday')).toEqual(0);
        expect(row.get('Thursday')) .toEqual(3);
        expect(row.get('Friday'))   .toEqual(0);
        expect(row.get('Saturday')) .toEqual(4);
        expect(row.get('Total'))    .toEqual(10);
    });
    
    it('should create values based on CA TEV if starting on Tuesday', function(){
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: Rally.util.DateTime.add(sunday_in_utc, 'day', 2),
            TimeEntryValueRecords: [ sunday_tev, tuesday_tev, thursday_tev, saturday_tev, following_sunday_tev, following_tuesday_tev ]
        });
        
        // ignore the first week's Sunday, Tuesday and the second week's Thursday
        expect(row.get('Sunday'))   .toEqual(6);
        expect(row.get('Monday'))   .toEqual(0);
        expect(row.get('Tuesday'))  .toEqual(8);
        expect(row.get('Wednesday')).toEqual(0);
        expect(row.get('Thursday')) .toEqual(3);
        expect(row.get('Friday'))   .toEqual(0);
        expect(row.get('Saturday')) .toEqual(4);
        expect(row.get('Total'))    .toEqual(21);
    });
    
});
