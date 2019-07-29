window.recallAddIn = window.recallAddIn || {};
window.recallAddIn.myGeotabModule = function(){
    const getDeviceList = function(api, groupArray){
        const getDevicePromise = new Promise((resolve, reject) => {
        api.call('Get', {
            typeName: 'Device',
            groups:groupArray
            },
            function (result) {
            resolve(result);
            },
            function (error) {
            reject(error);
            });
        });
        return getDevicePromise;
    },
    getUserList = function(api, groupArray){
        const getUserPromise = new Promise((resolve, reject) => {
        api.call('Get', {
                typeName: 'User',
                companyGroups: groupArray
            },
            function (result) {
            resolve(result);
            },
            function (e) {
            reject(new Error("Failed to get Users: ", e));
            });
        });
        return getUserPromise;
    },
    decodeVins = function (api, vins) {
      const decodeVinPromise = new Promise((resolve, reject) => {
        api.call('DecodeVins', {
                vins: vins
            },
            function (result) {
              resolve(result);
            },
            function (e) {
              reject(new Error("Failed to decode vins: ", e));
            });
        });
        return decodeVinPromise;
    },
    getVehicleEngineHours = function (api, vehicleId){
     const getVehicleEngineHoursPromise = new Promise((resolve, reject) => {
        let callsArray = [];
        for (let id=0; id<vehicleId.length; id++) {
            console.log(vehicleId);
            console.log(id);
            callsArray.push(['Get', {
                typeName: 'StatusData',
                search:{
                    diagnosticSearch:{
                        id:'DiagnosticEngineHoursAdjustmentId'
                    },
                    deviceSearch:{
                        id: vehicleId[id]
                    },
                    fromDate: new Date().toISOString(),
                    toDate: new Date().toISOString()
                    },
                    resultsLimit:1
                }
            ])
        }  
        api.multiCall(callsArray, function(result) {
            // console.log(result);
            resolve(result);
        },
        function (error) {
        reject(error);});
        });
        return getVehicleEngineHoursPromise;             
    },
    getVehicleOdometer = function (api, vehicleId){
     const getVehicleOdometerPromise = new Promise((resolve, reject) => {
        let callsArray = [];
        for (let id=0; id<vehicleId.length; id++) {
            callsArray.push(['Get', {
                typeName: 'StatusData',
                search:{
                    diagnosticSearch:{
                        id:'DiagnosticOdometerAdjustmentId'
                    },
                    deviceSearch:{
                        id: vehicleId[id]
                    },
                    fromDate: new Date().toISOString(),
                    toDate: new Date().toISOString()
                    },
                    resultsLimit:1
                }
            ])
        }  
        api.multiCall(callsArray, function(result) {
            // console.log(result);
            resolve(result);
        },
        function (error) {
        reject(error);});
        });
        return getVehicleOdometerPromise;
    },
    getReminderRulesList = function (api) {
        const getReminderRulesPromise = new Promise((resolve, reject) => {
           api.call('Get', {
               typeName: 'EventRule',
               },
               function (result) {
               // console.log(result);
               resolve(result);
               },
               function (e) {
               reject(new Error("Failed to get Reminder Rules List: ", e));
               });
           });
           return getReminderRulesPromise;
    },
    getReminderRuleTypesList = function (api) {
     const getReminderRuleTypesPromise = new Promise((resolve, reject) => {
        api.call('Get', {
            typeName: 'EventType',
            },
            function (result) {
            // console.log(result);
            resolve(result);
            },
            function (e) {
            reject(new Error("Failed to get Reminder Rule Types List: ", e));
            });
        });
        return getReminderRuleTypesPromise;
    },
    getEventOccurrenceList = function (api) {
        const getEventOccurrencePromise = new Promise((resolve, reject) => {
           api.call('Get', {
               typeName: 'EventOccurrence',
               },
               function (result) {
               // console.log(result);
               resolve(result);
               },
               function (e) {
               reject(new Error("Failed to get Reminder Rules List: ", e));
               });
           });
           return getEventOccurrencePromise;
    },
    addEventRuleEntity = function (api, entity){
     const addEventRuleEntityPromise = new Promise((resolve, reject) => {
        api.call('Add', {
            typeName: 'EventRule',
            entity: entity
            },
            function (result) {
            resolve(result);
            },
            function (error) {
            reject(error);
            });
        });
        return addEventRuleEntityPromise;
    },
    addEventTypeEntity = function (api, entity){
     const addEventTypeEntityPromise = new Promise((resolve, reject) => {
        api.call('Add', {
            typeName: 'EventType',
            entity: entity
            },
            function (result) {
            resolve(result);
            },
            function (error) {
            reject(error);
            });
        });
        return addEventTypeEntityPromise;
    },
    addEventOccurenceEntity = function (api, entityList){
     const addEventOccurenceEntityPromise = new Promise((resolve, reject) => {
        let callsArray = [];
        for (let i in entityList) {
            callsArray.push(['Add', {
                typeName: 'EventOccurrence',
                entity: entityList[i]
                }
            ])
        }  
        api.multiCall(callsArray, function(result) {
            console.log(result);
            resolve(result);
        },
        function (error) {
        reject(error);});
        });
        return addEventOccurenceEntityPromise;
    };

    return{
        getVehicles : getDeviceList,
        getUsers : getUserList,
        decodeVins : decodeVins,
        getVehicleEngineHours : getVehicleEngineHours,
        getVehicleOdometer: getVehicleOdometer,
        getReminderRuleTypes : getReminderRuleTypesList,
        getReminderRules : getReminderRulesList,
        getEventOccurrences : getEventOccurrenceList,
        addEventRule : addEventRuleEntity,
        addEventType : addEventTypeEntity,
        addVehicleToEventRule : addEventOccurenceEntity
	};
}();