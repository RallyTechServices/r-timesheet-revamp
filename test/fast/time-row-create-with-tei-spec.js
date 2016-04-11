describe("Time Row Creation By Time Entry Items Tests", function() {

    it("should determine weekstart for CA TEIs if on Sunday", function(){
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ WeekStartDate: sunday_in_utc });
        expect(row.getWeekStartDates()).toEqual([sunday_in_utc]);
    });
    
    it("should determine weekstarts for CA TEIs if not Sunday", function(){
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ WeekStartDate: friday_in_utc });
        expect(row.getWeekStartDates()).toEqual([sunday_in_utc, second_sunday_in_utc]);
    });
    
    it('should create values based on CA TEI if starting on Sunday', function(){
        var tei = Ext.create('mockTimeEntryItem',{
            WeekStartDate: sunday_in_utc,
            Project:     { Name: 'Test Project', ObjectID: 1 },
            WorkProduct: { Name: 'My Story', FormattedID: 'US1', ObjectID: 2 },
            Task:        { Name: 'My Task', FormattedID:'TA1', ObjectID: 3 }
        });
        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: sunday_in_utc,
            TimeEntryItemRecords: [ tei ]
        });
        
        expect(row.get('Project').ObjectID).toEqual(1);
        expect(row.get('WorkProduct').ObjectID).toEqual(2);
        expect(row.get('Task').ObjectID).toEqual(3);

    });
    
    it('should create values based on CA TEIs if starting on Monday', function(){
        var tei = Ext.create('mockTimeEntryItem',{
            WeekStartDate: sunday_in_utc,
            Project:     { Name: 'Test Project', ObjectID: 1 },
            WorkProduct: { Name: 'My Story', FormattedID: 'US1', ObjectID: 2 },
            Task:        { Name: 'My Task', FormattedID:'TA1', ObjectID: 3 }
        });
        
        var tei2 = Ext.create('mockTimeEntryItem',{
            WeekStartDate: second_sunday_in_utc,
            Project:     { Name: 'Test Project', ObjectID: 1 },
            WorkProduct: { Name: 'My Story', FormattedID: 'US1', ObjectID: 2 },
            Task:        { Name: 'My Task', FormattedID:'TA1', ObjectID: 3 }
        });
        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: monday_in_utc,
            TimeEntryItemRecords: [ tei, tei2 ]
        });
        
        expect(row.get('Project').ObjectID).toEqual(1);
        expect(row.get('WorkProduct').ObjectID).toEqual(2);
        expect(row.get('Task').ObjectID).toEqual(3);
    });
    
});
