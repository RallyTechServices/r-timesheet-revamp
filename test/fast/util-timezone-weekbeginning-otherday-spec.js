describe("When using timezone utilities for week beginning with a non-sunday day", function() {
    var monday_iso = '2016-02-08';
    var previous_monday_iso = '2016-02-01';
    var monday_iso_full = '2016-02-08T00:00:00.0Z';
    var previous_monday_iso_full = '2016-02-01T00:00:00.0Z';
    
    it("given a date in a local timezone, should provide midnight monday morning for that timezone",function(){
        expect(TSDateUtils.getBeginningOfWeekForLocalDate(sunday_local,1)).toEqual(previous_monday_local);
        expect(TSDateUtils.getBeginningOfWeekForLocalDate(monday_local,1)).toEqual(monday_local);
        expect(TSDateUtils.getBeginningOfWeekForLocalDate(friday_local,1)).toEqual(monday_local);
    });
    
    it("given a date in a local timezone, should provide a monday iso string without timestamp",function(){        
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(sunday_local,false,1)).toEqual(previous_monday_iso);
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(monday_local,false,1)).toEqual(monday_iso);
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(friday_local,false,1)).toEqual(monday_iso);
    });
    
    it("given a date in a local timezone that matches Monday in UTC, should provide a monday iso string without timestamp",function(){
        
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(monday_in_utc, false, 1)).toEqual(monday_iso);
    });
    
    it("given a date in a local timezone, should provide a Monday iso string with fake midnight timestamp",function(){
        
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(sunday_local,true,1)).toEqual(previous_monday_iso_full);
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(monday_local,true,1)).toEqual(monday_iso_full);
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(friday_local,true,1)).toEqual(monday_iso_full);
    });
    
    it("given a date in a local timezone that matches Monday in UTC, should provide a Monday iso string with fake midnight timestamp",function(){
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(monday_in_utc,true,1)).toEqual(monday_iso_full);
    });

});
