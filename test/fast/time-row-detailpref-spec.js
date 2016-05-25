describe("Time Row with Detail Preference", function() {

    var sunday_tev = Ext.create('mockTimeEntryValue',{
        DateVal: sunday_in_utc,
        Hours: 1
    });
    
    it('should show not having open details without a pref', function(){
       
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: sunday_in_utc
        });
        
        expect(row.hasOpenDetails())   .toEqual(false);
    }); 
    
    it('should not show open details when all details have end times', function(){
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
                
        expect(row.hasOpenDetails())   .toEqual(false);
    }); 

    it('should not open details when some details do not have end times', function(){
        var blocks = {
            "Sunday":[{"id":5,"start_hour":21,"start_minute":25,"end_hour":23,"end_minute":null}],
            "Tuesday":[{"id":4,"start_hour":1,"start_minute":5,"end_hour":null,"end_minute":null}]
        };
        
        var detail_pref = Ext.create('mockTimeDetailPreference', {
            Name: 'test',
            Value: Ext.JSON.encode(blocks)
        });
        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{ 
            WeekStartDate: sunday_in_utc,
            DetailPreference: detail_pref
        });
                
        expect(row.hasOpenDetails())   .toEqual(true);
    }); 

});
