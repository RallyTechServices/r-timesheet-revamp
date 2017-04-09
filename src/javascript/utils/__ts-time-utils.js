Ext.define('TSDateUtils', {
    singleton: true,
    
    getBeginningOfWeekForLocalDate: function(week_date,weekStartDay) {
        if ( Ext.isEmpty(weekStartDay) ) { weekStartDay = 0; }
        
        var dayInWeek = week_date.getDay();
        if ( week_date.getUTCHours() === 0 ) {
            // already in UTC
            dayInWeek = week_date.getUTCDay();
        }
        var delta = weekStartDay - dayInWeek;
        if ( dayInWeek < weekStartDay ) {
            delta = weekStartDay - dayInWeek - 7;
        }
                
        var start_of_week_here = Ext.Date.add(week_date, Ext.Date.DAY, delta);
        return start_of_week_here;
    },
    
    getBeginningOfWeekISOForLocalDate: function(week_date,showShiftedTimeStamp,weekStartDay) {
        if ( Ext.isEmpty(weekStartDay) ) {
            weekStartDay = 0;
        }
        
        var local_beginning = TSDateUtils.getBeginningOfWeekForLocalDate(week_date,weekStartDay);
        
        if (showShiftedTimeStamp) {
            return Rally.util.DateTime.toIsoString(local_beginning).replace(/T.*$/,'T00:00:00.0Z');
        }

        if ( local_beginning.getUTCHours() === 0 ) {
            return Rally.util.DateTime.toIsoString(local_beginning,true).replace(/T.*$/,'');
        }
        return Rally.util.DateTime.toIsoString(local_beginning,false).replace(/T.*$/,'');
    },
    
    formatShiftedDate: function(jsdate,format) {
        var offset = jsdate.getTimezoneOffset();  // 480 is pacific, -330 is india

        if ( offset > 0 ) {
            jsdate = Rally.util.DateTime.add(jsdate,'minute',offset);
        }

        return Ext.util.Format.date(jsdate,format);
    },
    
    pretendIMeantUTC: function(jsdate,asUTC) {
        var offset = jsdate.getTimezoneOffset();
        
        if ( asUTC ) {
            return Rally.util.DateTime.toIsoString(jsdate).replace(/T.*$/,'T00:00:00.000Z');
        }
        var shiftedDate = Rally.util.DateTime.add(jsdate,'minute',-1 * offset);
        
        return shiftedDate;
    },
    
    // returns a promise, fulfills with a boolean
    isApproved: function(week_start_iso, user_oid) {
        var deferred = Ext.create('Deft.Deferred');
        
        var short_iso_date = week_start_iso;
        var key_user_oid = user_oid || Rally.getApp().getContext().getUser().ObjectID;
        
        var key = Ext.String.format("{0}.{1}.{2}", 
            TSUtilities.approvalKeyPrefix,
            short_iso_date,
            key_user_oid
        );
        
        this._loadWeekStatusPreference(key).then({
            success: function(preference) {
                if (preference.length === 0) { 
                    deferred.resolve(false);
                    return;
                }
                var value = preference[0].get('Value');
                if ( /{/.test(value) ) {
                    var status_object = Ext.JSON.decode(value);
                    if ( status_object.status == "Approved" ) { 
                        deferred.resolve(true);
                        return;
                    }
                }
                
                deferred.resolve(false);
            },
            failure: function(msg) {
                deferred.reject(msg);
            }
        });
        
        return deferred.promise;
    },
    
    _loadWeekStatusPreference: function(key) {
        
        var config = {
            model:'Preference',
            limit: 1,
            pageSize: 1,
            filters: [
                {property:'Name',operator: 'contains', value:key},
                {property:'Name',operator:'!contains',value: TSUtilities.archiveSuffix}
            ],
            fetch: ['Name','Value'],
            sorters: [{property:'CreationDate', direction: 'DESC'}]
        };
        
        return TSUtilities.loadWsapiRecords(config);
    }
});
