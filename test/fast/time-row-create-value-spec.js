describe("Time Row Creation By Value Tests", function() {

    it("should have default values set",function(){        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{        });
        
        expect(row.get('WeekStart')).toEqual(0);
        expect(row.get('Project')).toEqual(null);
        expect(row.get('Task')).toEqual('');
        expect(row.get('WorkProduct')).toEqual('');
        expect(row.get('User')).toEqual(null);
        expect(row.get('TimeEntryItemRecords')).toEqual([]);
        expect(row.get('TimeEntryValueRecords')).toEqual([]);
        expect(row.get('Sunday')).toEqual(0);
        expect(row.get('Monday')).toEqual(0);
        expect(row.get('Tuesday')).toEqual(0);
        expect(row.get('Wednesday')).toEqual(0);
        expect(row.get('Thursday')).toEqual(0);
        expect(row.get('Friday')).toEqual(0);
        expect(row.get('Saturday')).toEqual(0);
    });
    
    it("should set week start to 1 if WeekStartDate is a monday",function(){
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ WeekStartDate: monday_in_utc  });
        expect(row.get('WeekStart')).toEqual(1);
    });
    
    it("should set week start to 5 if WeekStartDate is a friday",function(){
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ WeekStartDate: friday_in_utc });
        expect(row.get('WeekStart')).toEqual(5);
    });
});
