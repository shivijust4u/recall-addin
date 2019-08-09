window.recallAddIn = window.recallAddIn || {};
window.recallAddIn.timeZoneConversionModule = function(){

    var api,sessionInfo,availableTimeZones,dayLightSavingOffset,userTimeZoneOffset = new Object(),weekday = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");

    const getUserSession = function(apiObject){
        const userTimeZoneOffsetPromise = new Promise((resolve, reject) => {
            console.log("I am here!");
            api = apiObject;
            api.getSession(function(session){sessionInfo = session;});
            console.log("Session Info: ", sessionInfo);
            getTimeZones(resolve, reject);
            });
            return  userTimeZoneOffsetPromise;   
        },
        //Get All Available Time Zones in the Database
        getTimeZones = function(resolve, reject){
            api.call("GetTimeZones", {
            }, function(result) {
                console.log("All System TimeZones: ", result);
                availableTimeZones = result;
                getUserTimeZoneId(resolve, reject);
            }, function(e) {
                console.error("Failed:", e);
                reject(e);
            });    
        },
        //Get the Current User's Time Zone
        getUserTimeZoneId = function (resolve, reject){
            api.call("Get", {
                "typeName": "User",
                "resultsLimit": 10,
                search: {
                    name: sessionInfo.userName
                }
            }, function(result) {
                console.log("User Time Zone: ", result[0].timeZoneId);
                getTimeZoneOffset(result[0].timeZoneId, resolve, reject);
            }, function(e) {
                console.error("Failed:", e);
                reject(e);
            });        
        }, 
        //Calculate the Offset based on User's Time Zone
        getTimeZoneOffset= function (timeZoneId, resolve, reject){
            for(var i=0; i<availableTimeZones.length; i++){
                if(availableTimeZones[i].id == timeZoneId){
                    console.log("found matching time zone");
                    userTimeZoneOffset = availableTimeZones[i];
                    console.log("UserTimeZoneOffset:", userTimeZoneOffset);
                    if(userTimeZoneOffset.isDaylightSavingTimeSupported){
                        getDayLightSavingRules(timeZoneId, resolve, reject);      
                    }
                    else{
                        calculateTotalOffset(resolve);
                    }
                }
            }
        },
        //Get Daylight Saving Rules
        getDayLightSavingRules = function (timeZoneId, resolve, reject){
            api.call("GetDaylightSavingRules", {
                "timeZoneId": timeZoneId
            }, function(result) {
                console.log("DayLightSaving Rule: ", result);
                console.log(result.adjustmentRules[1].daylightTransitionStart.month);
                calculatingAdjustment(result.adjustmentRules, resolve, reject);
            }, function(e) {
                console.error("Failed:", e);
                reject(e);
            });
            
        },
        calculateTotalOffset = function (resolve){
            console.log(dayLightSavingOffset);
            console.log(userTimeZoneOffset);
            // return userTimeZoneOffset;
            let offset = {"hours":0,"minutes":0};
            offset.hours = parseInt(dayLightSavingOffset.split(":",2)[0], 10) + parseInt(userTimeZoneOffset.offsetFromUtc.split(":",2)[0], 10);
            offset.minutes = parseInt(dayLightSavingOffset.split(":",2)[1], 10) + parseInt(userTimeZoneOffset.offsetFromUtc.split(":",2)[1], 10);
            resolve(offset);
        },
        //Calculate the DayLightSaving Adjustment/Offset
        calculatingAdjustment = function (adjustmentRules, resolve, reject){
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
                calculateTotalOffset(resolve);
            })();

        };
    return {
        userTimeZoneOffset: getUserSession
    };
}(); 