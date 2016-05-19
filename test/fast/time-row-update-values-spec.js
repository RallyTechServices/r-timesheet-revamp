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
        Hours: 1
    });
    
    var saturday_tev = Ext.create('mockTimeEntryValue',{
        DateVal: Rally.util.DateTime.add(sunday_in_utc,'day',6),
        Hours: 9
    });
    
    it('should create values based on CA TEV if starting on Sunday', function(){
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: sunday_in_utc,
            TimeEntryValueRecords: [ sunday_tev, tuesday_tev ]
        });
        
        expect(row.get('Sunday'))   .toEqual(1);
        expect(row.get('Monday'))   .toEqual(0);
        expect(row.get('Tuesday'))  .toEqual(2);
        expect(row.get('Wednesday')).toEqual(0);
        expect(row.get('Thursday')) .toEqual(0);
        expect(row.get('Friday'))   .toEqual(0);
        expect(row.get('Saturday')) .toEqual(0);
        expect(row.get('Total'))    .toEqual(3);
    });
    
    it('should create values based on CA TEV if starting on Sunday', function(){
        tuesday_tev.set('Hours', 23.27);
        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: sunday_in_utc,
            TimeEntryValueRecords: [ sunday_tev, tuesday_tev, thursday_tev, saturday_tev ]
        });
        
        expect(row.get('Sunday'))   .toEqual(1);
        expect(row.get('Monday'))   .toEqual(0);
        expect(row.get('Tuesday'))  .toEqual(23.27);
        expect(row.get('Wednesday')).toEqual(0);
        expect(row.get('Thursday')) .toEqual(1);
        expect(row.get('Friday'))   .toEqual(0);
        expect(row.get('Saturday')) .toEqual(9);
        expect(row.get('Total'))    .toEqual(34.27);
    });
    

        
});
