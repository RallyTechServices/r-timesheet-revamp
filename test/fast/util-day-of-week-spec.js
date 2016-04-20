describe("When using utilities for finding day of week", function() {
    
    it("given a week with a sunday start, find date for each day in week",function(){
        var utils = CA.techservices.timesheet.TimeRowUtils;
        expect(utils.getValueFromDayOfWeek(sunday_in_utc, 0, "Sunday"))   .toEqual(sunday_in_utc);
        expect(utils.getValueFromDayOfWeek(sunday_in_utc, 0, "Monday"))   .toEqual(Rally.util.DateTime.add(sunday_in_utc,'day',1));
        expect(utils.getValueFromDayOfWeek(sunday_in_utc, 0, "Tuesday"))  .toEqual(Rally.util.DateTime.add(sunday_in_utc,'day',2));
        expect(utils.getValueFromDayOfWeek(sunday_in_utc, 0, "Wednesday")).toEqual(Rally.util.DateTime.add(sunday_in_utc,'day',3));
        expect(utils.getValueFromDayOfWeek(sunday_in_utc, 0, "Thursday")) .toEqual(Rally.util.DateTime.add(sunday_in_utc,'day',4));
        expect(utils.getValueFromDayOfWeek(sunday_in_utc, 0, "Friday"))   .toEqual(Rally.util.DateTime.add(sunday_in_utc,'day',5));
        expect(utils.getValueFromDayOfWeek(sunday_in_utc, 0, "Saturday")) .toEqual(Rally.util.DateTime.add(sunday_in_utc,'day',6));
    });
    
    
    it("given a week with a tuesday start, find date for each day in week",function(){
        
        var start = Rally.util.DateTime.add(sunday_in_utc,'day',2);
        
        var utils = CA.techservices.timesheet.TimeRowUtils;
        expect(utils.getValueFromDayOfWeek(start, 2, "Sunday"))   .toEqual(Rally.util.DateTime.add(start,'day',5));
        expect(utils.getValueFromDayOfWeek(start, 2, "Monday"))   .toEqual(Rally.util.DateTime.add(start,'day',6));
        expect(utils.getValueFromDayOfWeek(start, 2, "Tuesday"))  .toEqual(start);
        expect(utils.getValueFromDayOfWeek(start, 2, "Wednesday")).toEqual(Rally.util.DateTime.add(start,'day',1));
        expect(utils.getValueFromDayOfWeek(start, 2, "Thursday")) .toEqual(Rally.util.DateTime.add(start,'day',2));
        expect(utils.getValueFromDayOfWeek(start, 2, "Friday"))   .toEqual(Rally.util.DateTime.add(start,'day',3));
        expect(utils.getValueFromDayOfWeek(start, 2, "Saturday")) .toEqual(Rally.util.DateTime.add(start,'day',4));
    });
});
