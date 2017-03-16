describe("When using timezone utilities", function() {

    it ( "given a date in local timezone, should provide a javascript date as if at midnight utc but same date", function() {
        expect(TSDateUtils.formatShiftedDate(sunday_in_utc, 'm/d/y')).toEqual('02/07/16');
        expect(TSDateUtils.formatShiftedDate(monday_local_DST, 'm/d/y')).toEqual('03/13/17');
        expect(TSDateUtils.formatShiftedDate(sunday_local_DST_in_utc, 'm/d/y')).toEqual('03/12/17');
        expect(TSDateUtils.formatShiftedDate(monday_local_DST_in_utc, 'm/d/y')).toEqual('03/13/17');
        expect(TSDateUtils.formatShiftedDate(monday_local_DST_in_utc, 'Y-m-d')).toEqual('2017-03-13');
    });
    
    it ("given a date in local timezone, provide the exact same date with a UTC timestamp", function() {
        expect(TSDateUtils.pretendIMeantUTC(monday_local)).toEqual(monday_in_utc);
        expect(TSDateUtils.pretendIMeantUTC(monday_local_DST)).toEqual(monday_in_utc_DST);
    });
    
    it ("given a date in local timezone, provide the exact same date as ISO but with a UTC timestamp", function() {
        expect(TSDateUtils.pretendIMeantUTC(monday_local,true)).toEqual("2016-02-08T00:00:00.000Z");
        expect(TSDateUtils.pretendIMeantUTC(monday_local_DST,true)).toEqual("2017-03-13T00:00:00.000Z");
    });
});
