describe("When using time row utils", function() {
    
    it("given a week start day, provide days in order", function() {
        expect(CA.techservices.timesheet.TimeRowUtils.getOrderedDaysBasedOnWeekStart(0))
            .toEqual(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']);
        expect(CA.techservices.timesheet.TimeRowUtils.getOrderedDaysBasedOnWeekStart(2))
            .toEqual(['Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Monday']);
        expect(CA.techservices.timesheet.TimeRowUtils.getOrderedDaysBasedOnWeekStart(4))
            .toEqual(['Thursday','Friday','Saturday','Sunday','Monday','Tuesday','Wednesday']);
    });
    
    it("given a date, provide the number of the day of the week",function(){
        var utils = CA.techservices.timesheet.TimeRowUtils;
        expect( utils.getDayOfWeekFromDate(sunday_in_utc) ).toEqual(0);
        expect( utils.getDayOfWeekFromDate(sunday_local) ).toEqual(0);

        expect( utils.getDayOfWeekFromDate(monday_in_utc) ).toEqual(1);
        expect( utils.getDayOfWeekFromDate(monday_local) ).toEqual(1);
    });
});