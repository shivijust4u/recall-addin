/***Get User Time Zone Offset and Daylight Saving Adjustment***/

window.recallAddIn = window.recallAddIn || {};
window.recallAddIn.userTimeZoneOffsetModule = function(){
const getUserTimeZoneOffset = function (api){
    console.log("hello");
    const getUserTimeZoneOffsetPromise = new Promise((resolve, reject) => { 
        console.log("hello");
        var sessionInfo,availableTimeZones,dayLightSavingOffset,userTimeZoneOffset = new Object(),weekday = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
        
        function calculateTotalOffset(){
            console.log(dayLightSavingOffset);
            console.log(userTimeZoneOffset);
            resolve();
        }

        //Calculate the DayLightSaving Adjustment/Offset
        function calculatingAdjustment(adjustmentRules){
            var curDate = new Date();
            //Changing Date to UTC to handle calculations   
            curDate.setDate(curDate.getUTCDate());
            curDate.setMonth(curDate.getUTCMonth());
            curDate.setFullYear(curDate.getUTCFullYear());
            curDate.setHours(curDate.getUTCHours());
            curDate.setMinutes(curDate.getUTCMinutes());
            curDate.setSeconds(curDate.getUTCSeconds());
            
            console.log(curDate);
            console.log("Date: ",curDate.getDate());
            
            //Calculates when to apply the Daylight Adjustment based on the Daylight Saving Adjustment Rules
            (function findTransitionDate(){
                console.log(curDate.getMonth());
                
                //If curDate Month is between Daylight Transition Start & Transition End
                if(curDate.getMonth()+1 > adjustmentRules[1].daylightTransitionStart.month & curDate.getMonth()+1 < adjustmentRules[1].daylightTransitionEnd.month){
                    console.log("This is october");
                    dayLightSavingOffset = adjustmentRules[1].daylightDelta;
                    console.log(dayLightSavingOffset);
                } 
                //If curDate month is equal to Daylight Transition Start Month
                else if(curDate.getMonth()+1 == adjustmentRules[1].daylightTransitionStart.month ){
                    var startWeekNumber = adjustmentRules[1].daylightTransitionStart.week; 
                    var startWeekDay = adjustmentRules[1].daylightTransitionStart.dayOfWeek;
                    var firstOfStartMonth = new Date(curDate);
                    firstOfStartMonth.setDate(1);
                    console.log("in March", firstOfStartMonth);
                    console.log(startWeekDay);
                    console.log(weekday[firstOfStartMonth.getDay()]);
                    var weekcount = 0;
                    for(var i = 0; i<30; i++){
                        console.log("in For loop");
                        if(weekday[firstOfStartMonth.getDay()] == startWeekDay){
                            console.log("Found a Matching day");
                            weekcount++;
                            console.log("WeekCount", weekcount);
                            console.log("i", i);
                            if(weekcount == startWeekNumber){
                                console.log(firstOfStartMonth);
                                console.log(curDate);
                                var dateOfTransitionStart = new Date(firstOfStartMonth);
                                dateOfTransitionStart.setHours(0);
                                dateOfTransitionStart.setMinutes(0);
                                dateOfTransitionStart.setSeconds(0);
                                if(curDate.getTime() > dateOfTransitionStart.getTime()){
                                    dayLightSavingOffset = adjustmentRules[1].daylightDelta;
                                    console.log(dayLightSavingOffset);
                                }
                                else {
                                    dayLightSavingOffset = "00:00:00";
                                    console.log(dayLightSavingOffset);
                                }
                                console.log(dateOfTransitionStart); 
                                break;
                            }
                        }
                        firstOfStartMonth = new Date(firstOfStartMonth.setDate(firstOfStartMonth.getDate()+1));
                    }
                }
                //If curDate month is equal to Daylight Transition End Month
                else if(curDate.getMonth()+1 == adjustmentRules[1].daylightTransitionEnd.month){
                    var endWeekNumber = adjustmentRules[1].daylightTransitionEnd.week; 
                    var endWeekDay = adjustmentRules[1].daylightTransitionEnd.dayOfWeek;
                    var firstOfEndMonth = new Date(curDate);
                    firstOfEndMonth.setDate(1);
                    console.log("in Nov", firstOfEndMonth);
                    console.log(endWeekDay);
                    console.log(weekday[firstOfEndMonth.getDay()]);
                    var weekcount = 0;
                    for(var i = 0; i<30; i++){
                        console.log("in For loop");
                        if(weekday[firstOfEndMonth.getDay()] == endWeekDay){
                            console.log("Found a Matching day");
                            weekcount++;
                            console.log("WeekCount", weekcount);
                            console.log("i", i);
                            if(weekcount == endWeekNumber){
                                console.log(firstOfEndMonth);
                                console.log(curDate);
                                var dateOfTransitionEnd = new Date(firstOfEndMonth);
                                dateOfTransitionEnd.setHours(0);
                                dateOfTransitionEnd.setMinutes(0);
                                dateOfTransitionEnd.setSeconds(0);
                                if(curDate.getTime() < dateOfTransitionEnd.getTime()){
                                    dayLightSavingOffset = adjustmentRules[1].daylightDelta;
                                    console.log(dayLightSavingOffset);
                                }
                                else {
                                    dayLightSavingOffset = "00:00:00";
                                    console.log(dayLightSavingOffset);
                                }
                                console.log(dateOfTransitionEnd); 
                                break;
                            }
                        }
                        firstOfEndMonth = new Date(firstOfEndMonth.setDate(firstOfEndMonth.getDate()+1));
                    }
                }
                //If curDate Month is not between Daylight Transition Start & Transition End
                else {
                    dayLightSavingOffset = "00:00:00";
                    console.log(dayLightSavingOffset);
                }
                calculateTotalOffset();
            })();

        }

        //Get Daylight Saving Rules
        function getDayLightSavingRules(timeZoneId){
            api.call("GetDaylightSavingRules", {
                "timeZoneId": timeZoneId
            }, function(result) {
                console.log("DayLightSaving Rule: ", result);
                console.log(result.adjustmentRules[1].daylightTransitionStart.month);
                calculatingAdjustment(result.adjustmentRules);
                //getReportSchedules();            
            }, function(e) {
                console.error("Failed:", e);
                reject();
            });
            
        }

        //Calculate the Offset based on User's Time Zone
        function getTimeZoneOffset(timeZoneId){
            for(var i=0; i<availableTimeZones.length; i++){
                if(availableTimeZones[i].id == timeZoneId){
                    console.log("found matching time zone");
                    userTimeZoneOffset = availableTimeZones[i];
                    console.log("UserTimeZoneOffset:", userTimeZoneOffset);
                    if(userTimeZoneOffset.isDaylightSavingTimeSupported){
                        getDayLightSavingRules(timeZoneId);      
                    }
                    else{
                        calculateTotalOffset();
                    }
                }
            }
        }

        //Get the Current User's Time Zone
        function getUserTimeZoneId(){
            api.call("Get", {
                "typeName": "User",
                "resultsLimit": 10,
                search: {
                    name: sessionInfo.userName
                }
            }, function(result) {
                console.log("User Time Zone: ", result[0].timeZoneId);
                getTimeZoneOffset(result[0].timeZoneId);
            }, function(e) {
                console.error("Failed:", e);
                reject();
            });        
        } 

        //Get All Available Time Zones in the Database
       function getTimeZones(){
            api.call("GetTimeZones", {
            }, function(result) {
                console.log("All System TimeZones: ", result);
                availableTimeZones = result;
                getUserTimeZoneId();
            }, function(e) {
                console.error("Failed:", e);
                reject();
            });    
       } 

        api.getSession(function(session){sessionInfo = session;});
        console.log("Session Info: ", sessionInfo);
        getTimeZones();

    });
    return getUserTimeZoneOffsetPromise;
};
return{
    getUserTimeZoneOffset: getUserTimeZoneOffset
	};
}(); 