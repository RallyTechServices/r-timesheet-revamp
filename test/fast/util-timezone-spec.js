describe("When using timezone utilities", function() {
    // Feb 7, 2016 is a sunday
    var sunday_in_utc = (new Date(Date.UTC(2016, 1, 7, 0, 0, 0)));    
    var sunday_local  = new Date(2016,1,7);
    var sunday_local_DST  = new Date(2016,2,13);

    var monday_in_utc = (new Date(Date.UTC(2016, 1, 8, 0, 0, 0)));    
    var monday_in_utc_DST = (new Date(Date.UTC(2016, 2, 14, 0, 0, 0)));    
    var monday_local  = new Date(2016,1,8);
    var monday_local_DST = new Date(2016,2,14);
    
    var friday_local  = new Date(2016,1,12);
        
    it("given a date in a local timezone, should provide midnight sunday morning for that timezone",function(){
        
        expect(TSDateUtils.getBeginningOfWeekForLocalDate(sunday_local)).toEqual(sunday_local);
        expect(TSDateUtils.getBeginningOfWeekForLocalDate(monday_local)).toEqual(sunday_local);
        expect(TSDateUtils.getBeginningOfWeekForLocalDate(friday_local)).toEqual(sunday_local);
    });
    
    it("given a date in a local timezone, should provide a sunday iso string without timestamp",function(){
        var sunday_iso = '2016-02-07';
        
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(sunday_local)).toEqual(sunday_iso);
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(monday_local)).toEqual(sunday_iso);
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(friday_local)).toEqual(sunday_iso);
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(friday_local, false)).toEqual(sunday_iso);
    });
    
    it("given a date in a local timezone that matches Sunday in UTC, should provide a sunday iso string without timestamp",function(){
        var sunday_iso = '2016-02-07';
        
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(sunday_in_utc)).toEqual(sunday_iso);
    });
    
    it("given a date in a local timezone, should provide a sunday iso string with fake midnight timestamp",function(){
        // Feb 7, 2016 is a sunday
        var sunday_iso = '2016-02-07T00:00:00.0Z';
        
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(sunday_local,true)).toEqual(sunday_iso);
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(monday_local,true)).toEqual(sunday_iso);
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(friday_local,true)).toEqual(sunday_iso);
    });
    
    it("given a date in a local timezone that matches Sunday in UTC, should provide a sunday iso string with fake midnight timestamp",function(){
        var sunday_iso = '2016-02-07T00:00:00.0Z';
        
        expect(TSDateUtils.getBeginningOfWeekISOForLocalDate(sunday_in_utc,true)).toEqual(sunday_iso);
    });
    
    it ( "given a date in local timezone, should provide a javascript date as if at midnight utc but same date", function() {
        expect(TSDateUtils.formatShiftedDate(sunday_in_utc, 'm/d/y')).toEqual('02/07/16');
       
    });
    
    it ("given a date in local timezone, provide the exact same date with a UTC timestamp", function() {
        expect(TSDateUtils.pretendIMeantUTC(monday_local)).toEqual(monday_in_utc);
        expect(TSDateUtils.pretendIMeantUTC(monday_local_DST)).toEqual(monday_in_utc_DST);
    });
    
        
    it ("given a date in local timezone, provide the exact same date as ISO but with a UTC timestamp", function() {
        expect(TSDateUtils.pretendIMeantUTC(monday_local,true)).toEqual("2016-02-08T00:00:00.000Z");
        expect(TSDateUtils.pretendIMeantUTC(monday_local_DST,true)).toEqual("2016-03-14T00:00:00.000Z");
    });
});
