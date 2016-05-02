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
    
        
    it('should set ToDo and State if created with a time entry item that is a task', function(){
        var tei = Ext.create('mockTimeEntryItem',{
            WeekStartDate: sunday_in_utc,
            Project:     { Name: 'Test Project', ObjectID: 1 },
            WorkProduct: { Name: 'My Story', FormattedID: 'US1', ObjectID: 2 },
            Task:        { Name: 'My Task', FormattedID:'TA1', ObjectID: 3, ToDo: 18, State: 'Defined' }
        });
        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: monday_in_utc,
            TimeEntryItemRecords: [ tei ]
        });
        
        expect(row.get('Task').ObjectID).toEqual(3);
        expect(row.get('ToDo')).toEqual(18);
        expect(row.get('State')).toEqual('Defined');
    });
    
            
    it('should set Iteration if created with a work product time entry item that has an iteration', function(){
        var iteration = {
            _refObjectName: 'Iteration 1',
            ObjectID: 4 
        };
        
        var tei = Ext.create('mockTimeEntryItem',{
            WeekStartDate: sunday_in_utc,
            Project:     { Name: 'Test Project', ObjectID: 1 },
            WorkProduct: { Name: 'My Story', FormattedID: 'US1', ObjectID: 2, Iteration: iteration },
            Task:        { Name: 'My Task', FormattedID:'TA1', ObjectID: 3, ToDo: 18, Iteration: iteration }
        });
        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: monday_in_utc,
            TimeEntryItemRecords: [ tei ]
        });
        
        expect(row.get('Task').ObjectID).toEqual(3);
        expect(row.get('Iteration')._refObjectName).toEqual('Iteration 1');
    });
    
    it('should set Iteration if created with a task-less work product time entry item that has an iteration', function(){
        var iteration = {
            _refObjectName: 'Iteration 1',
            ObjectID: 4 
        };
        
        var tei = Ext.create('mockTimeEntryItem',{
            WeekStartDate: sunday_in_utc,
            Project:     { Name: 'Test Project', ObjectID: 1 },
            WorkProduct: { Name: 'My Story', FormattedID: 'US1', ObjectID: 2, Iteration: iteration }
        });
        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: monday_in_utc,
            TimeEntryItemRecords: [ tei ]
        });
        
        expect(row.get('Iteration')._refObjectName).toEqual('Iteration 1');
    });
    
    it('should set Iteration if created with a task time entry item that has an iteration', function(){
        var iteration = {
            _refObjectName: 'Iteration 1',
            ObjectID: 4 
        };
        
        var tei = Ext.create('mockTimeEntryItem',{
            WeekStartDate: sunday_in_utc,
            Project:     { Name: 'Test Project', ObjectID: 1 },
            WorkProduct: { Name: 'My Story', FormattedID: 'US1', ObjectID: 2 }, // no real reason why workproduct would be missing it but still we'll test
            Task:        { Name: 'My Task', FormattedID:'TA1', ObjectID: 3, ToDo: 18, Iteration: iteration }
        });
        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: monday_in_utc,
            TimeEntryItemRecords: [ tei ]
        });
        
        expect(row.get('Task').ObjectID).toEqual(3);
        expect(row.get('Iteration')._refObjectName).toEqual('Iteration 1');
    });
    
});
