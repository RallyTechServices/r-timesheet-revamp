describe("Time Row Creation Tests", function() {
    // Feb 7, 2016 is a sunday
    var sunday_in_utc = (new Date(Date.UTC(2016, 1, 7, 0, 0, 0)));    
    var sunday_local  = new Date(2016,1,7);
    var sunday_local_DST  = new Date(2016,2,13);

    var monday_in_utc = (new Date(Date.UTC(2016, 1, 8, 0, 0, 0)));    
    var monday_in_utc_DST = (new Date(Date.UTC(2016, 2, 14, 0, 0, 0)));    
    var monday_local  = new Date(2016,1,8);
    var monday_local_DST = new Date(2016,2,14);

    var friday_in_utc = (new Date(Date.UTC(2016, 1, 12, 0, 0, 0)));    

    
    it("should have default values set",function(){        
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{
            
        });
        
        expect(row.get('WeekStart')).toEqual(0);
    });
    
    it("should set week start to 1 if WeekStartDate is a monday",function(){
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{
            WeekStartDate: monday_in_utc
        });
        
        expect(row.get('WeekStart')).toEqual(1);
    });
    
        
    it("should set week start to 5 if WeekStartDate is a friday",function(){
        var row = Ext.create('CA.techservices.timesheet.TimeRow',{
            WeekStartDate: friday_in_utc
        });
        
        expect(row.get('WeekStart')).toEqual(5);
    });
    
});
