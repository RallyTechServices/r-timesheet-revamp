describe("Time Row Creation with Detail Preference", function() {

    var sunday_tev = Ext.create('mockTimeEntryValue',{
        DateVal: sunday_in_utc,
        Hours: 1
    });
    
    it('should be ok with missing detail preference on create', function(){
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: sunday_in_utc
        });
        
        expect(row.get('Sunday'))   .toEqual(0);
        expect(row.getTimeBlocks('Sunday')) .toEqual([]);
        expect(row.getTimeBlock('Sunday',5)) .toEqual(null);
    });
    
    it('should be ok with empty detail preference on create', function(){
        var empty_pref = Ext.create('mockTimeDetailPreference', {
            Name: 'test',
            Value: ' '
        });
        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: sunday_in_utc,
            DetailPreference: empty_pref
        });
        
        expect(row.get('Sunday'))   .toEqual(0);
        expect(row.getTimeBlocks('Sunday')) .toEqual([]);
        expect(row.getTimeBlock('Sunday',5)) .toEqual(null);
    }); 
    
    it('should read in simple block detail preference on create', function(){
        var blocks = {
            "Sunday":[{"id":5,"start_hour":21,"start_minute":25,"end_hour":23,"end_minute":null}],
            "Tuesday":[{"id":4,"start_hour":1,"start_minute":2,"end_hour":3,"end_minute":4}]
        };
        
        var detail_pref = Ext.create('mockTimeDetailPreference', {
            Name: 'test',
            Value: Ext.JSON.encode(blocks)
        });
        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: sunday_in_utc,
            DetailPreference: detail_pref
        });
                
        expect(row.get('_DetailBlocks')). toEqual(blocks);
        
        expect(row.get('Sunday'))   .toEqual(0);
        expect(row.getTimeBlocks('Sunday')) .toEqual(blocks.Sunday);
        expect(row.getTimeBlocks('Tuesday')) .toEqual(blocks.Tuesday);
        expect(row.getTimeBlock('Sunday',5)) .toEqual({"id":5,"start_hour":21,"start_minute":25,"end_hour":23,"end_minute":null});
        expect(row.getTimeBlock('Tuesday',5)) .toEqual(null);
        expect(row.getTimeBlock('Wednesday',5)) .toEqual(null);
        
    }); 
    
    it('should read in simple block detail preference on create when supplying tei/tev', function(){
        var blocks = {
            "Sunday":[{"id":5,"start_hour":21,"start_minute":25,"end_hour":23,"end_minute":null}],
            "Tuesday":[{"id":4,"start_hour":1,"start_minute":2,"end_hour":3,"end_minute":4}]
        };
        
        var detail_pref = Ext.create('mockTimeDetailPreference', {
            Name: 'test',
            Value: Ext.JSON.encode(blocks)
        });
        
         var tei = Ext.create('mockTimeEntryItem',{
            WeekStartDate: sunday_in_utc,
            Project:     { Name: 'Test Project', ObjectID: 1 },
            WorkProduct: { Name: 'My Story', FormattedID: 'US1', ObjectID: 2 },
            Task:        { Name: 'My Task', FormattedID:'TA1', ObjectID: 3 }
        });
        
        var sunday_tev = Ext.create('mockTimeEntryValue',{
            DateVal: sunday_in_utc,
            Hours: 1
        });

    
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: sunday_in_utc,
            TimeEntryItemRecords: [ tei ],
            TimeEntryValueRecords: [ sunday_tev ],
            DetailPreference: detail_pref
        });
                
        expect(row.get('_DetailBlocks')). toEqual(blocks);
        
        expect(row.get('Sunday'))   .toEqual(1);
        expect(row.getTimeBlocks('Sunday')) .toEqual(blocks.Sunday);
        expect(row.getTimeBlocks('Tuesday')) .toEqual(blocks.Tuesday);
        expect(row.getTimeBlock('Sunday',5)) .toEqual({"id":5,"start_hour":21,"start_minute":25,"end_hour":23,"end_minute":null});
        expect(row.getTimeBlock('Tuesday',5)) .toEqual(null);
        expect(row.getTimeBlock('Wednesday',5)) .toEqual(null);
        
    }); 
   
});
