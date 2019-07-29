window.recallAddIn = window.recallAddIn || {};
window.recallAddIn.myGeotabCache = {devices: {}, reminderRules: {}, vehicles: {}, eventOccurrences:{},masterTable:{}};
/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.testAddIn = function (api, state) {
  'use strict';
  const _initializeAddin = function(){
    const   searchStyle = document.getElementById('recallTextSearchStyle'),
            statusStyle = document.getElementById('recallStatusSearchStyle');
    
    document.getElementById("filterField").addEventListener("keyup", function(event){
        let rawValue = this.value.replace(/\W+/g," ").toLowerCase();
        if (!rawValue) {
            searchStyle.innerHTML = "";
            return;
        }
        let rawValueList = rawValue.split(" ");
        searchStyle.innerHTML = ".searchableRow{ display: none; }";
        for(let i = 0; i < rawValueList.length; i++){	
            searchStyle.innerHTML = searchStyle.innerHTML + ".searchableRow[data-index*=\"" + rawValueList[i] + "\"]{ display: table-row !important; }";
        }
    });
    document.getElementById('toggleRecalls').addEventListener("click", function(event){
        let currentStatus = this.getAttribute("data-showstatus"),
            inactiveRecalls = document.getElementById("recallsListBuilder").getElementsByClassName("checkmateListBuilderRowInactive").length,
            totalRecalls = document.getElementById("recallsListBuilder").getElementsByClassName("searchableRow").length;
        if(currentStatus == "showAll"){
            this.setAttribute("data-showstatus", "showActive");
            document.getElementById("recallShowing").textContent = "Active";
            statusStyle.innerHTML = "#recallsListBuilder .checkmateListBuilderRowInactive{ display: none;}";
            document.getElementById("outstandingRecalls").textContent = totalRecalls - inactiveRecalls;
        }else{
            this.setAttribute("data-showstatus", "showAll");
            document.getElementById("recallShowing").textContent = "All";
            statusStyle.innerHTML = "";
            document.getElementById("outstandingRecalls").textContent = totalRecalls;
        }
    });
  },
  _loadVehicles = async function (api, groupsArray){
    recallAddIn.uiModule.toggleLoading(true, "Getting vehicles & local recalls...");
    try{
      const deviceList = await recallAddIn.myGeotabModule.getVehicles(api,groupsArray), listOfVins = [], vinIdMapping = {};  

      recallAddIn.myGeotabCache.vehicles = {};
      console.log("Device list:",deviceList);
      for(let i = 0; i < deviceList.length; i++){
        if(deviceList[i].vehicleIdentificationNumber !== ""){
          recallAddIn.myGeotabCache.devices[deviceList[i].id] = {name: deviceList[i].name, vin: deviceList[i].vehicleIdentificationNumber, make: "", model: "", year: 0};
          listOfVins.push(deviceList[i].vehicleIdentificationNumber);
          vinIdMapping[deviceList[i].vehicleIdentificationNumber.trim()] = deviceList[i].id;
        }else{
          console.log("Vehicle: " + deviceList[i].name + "(ID:"+ deviceList[i].id+") does not have a VIN assigned.");
        }
      }
      let vinList = [], decodedList = [];
      for(let j = 0; j < listOfVins.length; j+=500){
        vinList = listOfVins.slice(j,Math.min(listOfVins.length,499+j));
        decodedList = await recallAddIn.myGeotabModule.decodeVins(api, vinList);
        console.log("Decoded Vin List",decodedList);
        for(let x = 0; x < decodedList.length; x++){
          if((decodedList[x].error).toLowerCase() == "none" || (decodedList[x].error).toLowerCase() == "checkdigiterror"){
            if(decodedList[x].make && decodedList[x].model && decodedList[x].model){
              console.log("recallAddIn.myGeotabCache.devices before",  recallAddIn.myGeotabCache.devices);
              recallAddIn.myGeotabCache.devices[vinIdMapping[decodedList[x].vin]].make = decodedList[x].make;
              recallAddIn.myGeotabCache.devices[vinIdMapping[decodedList[x].vin]].model = decodedList[x].model;
              recallAddIn.myGeotabCache.devices[vinIdMapping[decodedList[x].vin]].year = decodedList[x].year;
              console.log("recallAddIn.myGeotabCache.vehicles",  recallAddIn.myGeotabCache.vehicles);
              if(recallAddIn.myGeotabCache.vehicles[decodedList[x].make + "," + decodedList[x].model + "," + decodedList[x].year] === undefined){
                recallAddIn.myGeotabCache.vehicles[decodedList[x].make + "," + decodedList[x].model + "," + decodedList[x].year] = [];
              }
              recallAddIn.myGeotabCache.vehicles[decodedList[x].make + "," + decodedList[x].model + "," + decodedList[x].year].push(vinIdMapping[decodedList[x].vin]);
            }
            else{
              console.log("Unable to decode VIN: " + decodedList[x]);
            }
          }
          else{
            console.log("Unable to decode VIN: " + decodedList[x]);
          }
        }
      }
      recallAddIn.uiModule.toggleLoading(true, "Building Master Table...");
      return true;
    }
    catch(err){
      console.log("ERROR HAPPENED?");
      console.log(err);
      return false;
    }
  },
  _loadFromDatabase = async function(api, groupsArray){
    const vehicleList = [],
          getRecallPromise = [],
          recallList = [],
          noInfoList = [];
          
    let recallCounter = 0, masterList = {},  recallResults = [], databaseResults = []; 
    console.log("recallAddIn.databaseModule.recallMasterTableId:", recallAddIn.databaseModule.recallMasterTableId);
    databaseResults = await Promise.all([recallAddIn.databaseModule.getTable(api,recallAddIn.databaseModule.recallMasterTableId),_loadVehicles(api,groupsArray)]);
    console.log("Database Results:", databaseResults);

    recallAddIn.uiModule.toggleLoading(false);
    if(!databaseResults[0]){
      console.log("Master Table does not exist!");
      for(let vehicle in recallAddIn.myGeotabCache.vehicles){
        vehicleList.push(vehicle);
      }
      databaseResults[0] = await recallAddIn.databaseModule.updateMasterTable(api,vehicleList);
    }    
   
    console.log("Master Table exists!")
    recallAddIn.myGeotabCache.masterTable = JSON.parse(databaseResults[0].data);
    masterList = recallAddIn.myGeotabCache.masterTable.masterList[0];

    if(Object.keys(masterList).length === 0){
        alert("There is no Recall Information Available. Please Request New Recalls.");
    }else if(!databaseResults[1]){
        alert("Issues getting Vehicle list. Refresh page.");
    }else{
      for(let vehicle in recallAddIn.myGeotabCache.vehicles){ 
          if(masterList.hasOwnProperty(vehicle)){
              getRecallPromise.push(recallAddIn.databaseModule.getTable(api,masterList[vehicle].id));
              vehicleList.push(vehicle);  
          }else{
            noInfoList.push(vehicle + " : " + recallAddIn.myGeotabCache.vehicles[vehicle]);
          }                              
      }
      if(noInfoList.length > 0){
        console.log("Vehicles not in Master List:");
        console.log(noInfoList);
        recallAddIn.uiModule.updateStatus("recallStatusMessage",noInfoList.length + " vehicle types you have access to have never been reviewed.",false);
      }
      
      recallResults = await Promise.all(getRecallPromise);
      console.log(recallResults);
      if(vehicleList.length !== recallResults.length){
        recallAddin.uiModule.updateStatus("recallStatusMessage","Something went wrong getting Recalls from Database",true);
      }else{
        for(let i = 0; i < recallResults.length; i++){
          const recallInformation = JSON.parse(recallResults[i].data).recalls[0];
          for(let recallId in recallInformation){
              if(!recallInformation[recallId].cleared){
                recallCounter++;
              }                        
              recallList.push({"component": recallInformation[recallId].component, vehicle: vehicleList[i], cleared: recallInformation[recallId].cleared, id: recallId, reminderRule: recallInformation[recallId].reminderRule});
          }                
        }
        document.getElementById("outstandingRecalls").textContent = recallCounter;
      }
      recallAddIn.uiModule.createRecallTable({"parentNode":document.getElementById("recallsListBuilder"),"tableRows":recallList,"searchable":true});
    }
    
    return true;
  },
  _updateMasterTableCache = async function(api){
    try{
      const currentMasterTable = await recallAddIn.databaseModule.getTable(api, recallAddIn.databaseModule.recallMasterTableId),
          currentVersion = JSON.parse(currentMasterTable.data).version;
    if(currentVersion != recallAddIn.myGeotabCache.masterTable.version){
      recallAddIn.myGeotabCache.masterTable = JSON.parse(currentMasterTable.data);                      
    }
    return true;
    }catch(err){
      console.log(err);
      return false;
    }
  },
  _requestNewRecalls = async function(api, groupsArray){
    ///Checking Time Since Last Pull///
    console.log(api);
    console.log(groupsArray);
    const vehicleTypes = Object.keys(recallAddIn.myGeotabCache.vehicles);
    console.log(vehicleTypes);
    let eligibleVehicleTypes = [];  
    if(typeof(recallAddIn.myGeotabCache.masterTable.version) === "undefined"){
      console.log("MasterTable not defined.");
    }else{
      console.log(recallAddIn.myGeotabCache.masterTable);
      await _updateMasterTableCache(api);
      console.log(recallAddIn.myGeotabCache.masterTable.masterList[0]);
     
      for (let type in vehicleTypes){
        console.log(vehicleTypes[type]);
        if(recallAddIn.myGeotabCache.masterTable.masterList[0][vehicleTypes[type]]){
          console.log(recallAddIn.myGeotabCache.masterTable.masterList[0][vehicleTypes[type]].lastPullDate);
          let diff = 24*60*60*1000;
          let curDate = new Date();
          let lastPullDate = new Date(recallAddIn.myGeotabCache.masterTable.masterList[0][vehicleTypes[type]].lastPullDate);
          if((curDate.getTime()-lastPullDate.getTime()) > diff){
            // console.log(vehicleTypes[type]);
            eligibleVehicleTypes.push(vehicleTypes[type]);
          }
        }
        else{
          eligibleVehicleTypes.push(vehicleTypes[type]);
        }
      }
      console.log(eligibleVehicleTypes);
    }    
   
    let updateMaster = await recallAddIn.databaseModule.updateMasterTable(api, vehicleTypes);
    console.log(updateMaster);
    console.log(eligibleVehicleTypes);
    if(updateMaster){
      await _updateMasterTableCache(api);
      console.log(recallAddIn.myGeotabCache.masterTable);
      //Fetching Recalls only if there are any eligibleVehicleTypes
      if(eligibleVehicleTypes.length > 0){
        //Get Recalls From NHTSA
        recallAddIn.uiModule.updateStatus("recallStatusMessage","Requesting Recall History from NHTSA...",false);
        let recallObject = await recallAddIn.nhtsaModule.getRecallsForFleet(api,eligibleVehicleTypes);
        console.log(recallObject);
        recallAddIn.uiModule.updateStatus("recallStatusMessage","Recall History Request Completed.",false);
        
        //Update database with new Recalls      
        recallAddIn.uiModule.updateStatus("recallStatusMessage","Updating database with new Recalls...",false);
        let updateRecallTables = [];
        for(let i = 0; i < recallObject.vehicleList.length; i++){
          console.log(recallAddIn.myGeotabCache.masterTable.masterList[0][recallObject.vehicleList[i]].id,recallObject.recallList[i],recallObject.vehicleList[i]);
          updateRecallTables.push(recallAddIn.databaseModule.updateRecallTable(api,recallAddIn.myGeotabCache.masterTable.masterList[0][recallObject.vehicleList[i]].id,recallObject.recallList[i],recallObject.vehicleList[i]));
          console.log(updateRecallTables);
        }
        try{
          const recallTablesUpdated = await Promise.all(updateRecallTables);      
          recallAddIn.uiModule.updateStatus("recallStatusMessage","Finished updating Recall Tables.",false);
          recallAddIn.uiModule.updateStatus("recallStatusMessage","Reloading Recall List",false);
          await _loadFromDatabase(api, groupsArray);
          recallAddIn.uiModule.updateStatus("recallStatusMessage","All Done",false);
        }catch(err){
          recallAddIn.uiModule.updateStatus("recallStatusMessage","Failed to update Recall Tables..",true);
          console.log(err);
          console.log(recallObject);
        }
      }
      // else if(eligibleVehicleTypes.length == (Object.keys(recallAddIn.myGeotabCache.vehicles)).length ){
      // }
      else{
        recallAddIn.uiModule.updateStatus("recallStatusMessage","Recall Info was Pulled in last 24 hours.  Please wait for 24 hours before Requesting New Recalls! ",false);
      }    
    }else{
      console.log("Failed to Update Master Table. Operation Aborted");
    }
  },
  _clearRecall = async function(api,clearButton){
      const recallId = clearButton.getAttribute("data-recallid"),
            vehicleKey = clearButton.getAttribute("data-vehiclekey"),
            recallTableId = recallAddIn.myGeotabCache.masterTable.masterList[0][vehicleKey].id;

      let dbclear = await recallAddIn.databaseModule.clearRecall(api,recallTableId,recallId);

      if(dbclear){
        document.getElementById("recall-"+recallId).querySelector(".checkmateListBuilderRow").classList.add("checkmateListBuilderRowInactive");
        recallAddIn.uiModule.closeRecallInfo();
        recallAddin.uiModule.updateStatus("recallStatusMessage","Successfully cleared Recall ID: " + recallId,true);
      }else{
        alert("Error clearing recall: " + recallId);        
      }
  },
  _saveReminderRule = async function(api, saveReminderRuleButton){
    const reminderRuleTypes = await recallAddIn.myGeotabModule.getReminderRuleTypes(api),
    reminderRules =  await recallAddIn.myGeotabModule.getReminderRules(api),
    vehicleName = document.getElementById("reminderRuleVehicle").placeholder,
    vehicleId =  document.getElementById("reminderRuleVehicle").getAttribute("data-vehicleid"),
    reminderType = document.getElementById("reminderRuleType").placeholder,
    reminderDescription = document.getElementById("reminderRuleDescription").placeholder,
    //TODO:
    //Modify reminderDate to include Offsets
    reminderDate = document.getElementById("reminderRuleDate").value,
    vehicleKey = document.getElementById("addAllReminders").getAttribute('data-vehiclekey');
      
    let eventRuleEntity,eventRuleId,eventTypeId,addVehicleToEventRuleId, eventOccurenceEntity, reminderButton, vehicleArray=[], selectedReminderRuleType = "", selectedReminderRule = "", ruleExists = false;

    console.log(api);
    console.log(reminderRuleTypes);
    console.log(reminderRules);
    console.log(vehicleName,vehicleId,reminderType,reminderDescription,reminderDate);

    for(let i=0; i<reminderRuleTypes.length;i++){
      if(typeof reminderRuleTypes[i] != "string"){
        if( reminderRuleTypes[i].name  == reminderType){
          console.log(reminderRuleTypes[i], "exists!");
          selectedReminderRuleType = reminderRuleTypes[i];            
        }      
      }
    }

    if(selectedReminderRuleType){
      console.log("Rule type exits! Add reminder rule now!");
      console.log(reminderRules);
      console.log(reminderDescription);
      eventRuleEntity = {"name":reminderDescription.substring(0,50).trim(),"eventType":{"id":selectedReminderRuleType.id},"eventDate": new Date(reminderDate).toISOString()};
      console.log(eventRuleEntity);   

      for(let i=0; i<reminderRules.length; i++){
        if(reminderRules[i].name == reminderDescription && selectedReminderRuleType.id == reminderRules[i].eventType.id){
          console.log(reminderRules[i]);  
          console.log("Rule Already exists!");
          ruleExists = true;
          selectedReminderRule = reminderRules[i];
        }
      }
         
    }
    else{
      console.log("Rule Type does not exist!");
      eventTypeId = await recallAddIn.myGeotabModule.addEventType(api,  {"name":reminderType});
      console.log(eventTypeId);
      eventRuleEntity = {"name":reminderDescription.substring(0,50).trim(),"eventType":{"id":eventTypeId},"eventDate": new Date(reminderDate).toISOString()};
      console.log(eventRuleEntity);     
    }

    if(!ruleExists){
      eventRuleId = await recallAddIn.myGeotabModule.addEventRule(api,eventRuleEntity);
      console.log(eventRuleId);
    } 
    else{
      eventRuleId = selectedReminderRule.id ;
      console.log(eventRuleId);
    }

    if(vehicleId == "Multiple"){
      console.log("In Bulk Add");
      vehicleArray = Object.create(recallAddIn.myGeotabCache.vehicles[vehicleKey]);
      console.log(vehicleKey);        
      console.log(vehicleArray);
      console.log(recallAddIn.myGeotabCache.vehicles[vehicleKey]);
      
      // Remove vehicles that already have maintenance enabled
      let countOfDisabled = 0;
      for(let i =0; i<recallAddIn.myGeotabCache.vehicles[vehicleKey].length;i++){
        console.log(recallAddIn.myGeotabCache.vehicles[vehicleKey][i]);
        console.log(document.getElementById(recallAddIn.myGeotabCache.vehicles[vehicleKey][i]).disabled);
        if(document.getElementById(recallAddIn.myGeotabCache.vehicles[vehicleKey][i]).disabled){
          vehicleArray.splice(i-countOfDisabled,1);
          countOfDisabled ++;
        }
      }
      console.log(vehicleArray);
      console.log(recallAddIn.myGeotabCache.vehicles[vehicleKey]);
      reminderButton = document.getElementById("addAllReminders");
      
    }
    else{
      // vehicleArray = [];
      console.log("In Single Add");
      vehicleArray.push(vehicleId);
      reminderButton = document.getElementById(vehicleId);
    }
    console.log(vehicleArray);
    let enginehoursList = await recallAddIn.myGeotabModule.getVehicleEngineHours(api,vehicleArray);
    console.log(enginehoursList[0]);

    let odometerList = await recallAddIn.myGeotabModule.getVehicleOdometer(api,vehicleArray);
    console.log(odometerList[0]);

    if(odometerList.length == 1){
      odometerList = [odometerList];
    }
    if(enginehoursList.length == 1){
      enginehoursList = [enginehoursList];
    }

    let entityList = [];
    for(let i = 0; i < vehicleArray.length; i++){
      const vehicle = recallAddIn.myGeotabCache.devices[vehicleArray[i]];
      // vehicleInformation.push({id:vehicleArray[i],name:vehicle.name});
      for(let j = 0; j < odometerList.length; j++){
        // console.log(odometerList[j][0].device.id);
        if (vehicleArray[i] == odometerList[j][0].device.id){
          for(let k = 0; k < enginehoursList.length; k++){
            if (vehicleArray[i] == enginehoursList[k][0].device.id){
              entityList.push({device:{id:vehicleArray[i],name:vehicle.name},eventRule:{id:eventRuleId,name:reminderDescription.substring(0,50).trim()},eventDate: new Date(reminderDate).toISOString(),currentOdometer:recallAddIn.utilitiesModule.padHex(Math.round(odometerList[j][0].data).toString(16)),adjustedOdometer:recallAddIn.utilitiesModule.padHex(Math.round(odometerList[j][0].data).toString(16)),currentEngineHours:recallAddIn.utilitiesModule.convertSecondsToHhMm(enginehoursList[k][0].data),adjustedEngineHours:recallAddIn.utilitiesModule.convertSecondsToHhMm(enginehoursList[k][0].data),active:true});
              break;
            }
          }
          break;
        }
      }
    }
    console.log(entityList);
    try{
      addVehicleToEventRuleId = await recallAddIn.myGeotabModule.addVehicleToEventRule(api,entityList);
      console.log(addVehicleToEventRuleId);
      document.getElementById("reminderRuleDate").value = "";
      document.getElementById("reminderModal").style.display = "none";
      reminderButton.disabled = true;
      if(vehicleId == "Multiple"){
        console.log("In Bulk Add");  
        for(let i =0; i<vehicleArray.length;i++){
          document.getElementById(vehicleArray[i]).disabled = true;
        }
      }
      else{
        console.log(vehicleKey);
        console.log(vehicleArray);
        let count = 0;
        for(let i =0; i<recallAddIn.myGeotabCache.vehicles[vehicleKey].length;i++){
          // console.log(recallAddIn.myGeotabCache.vehicles[vehicleKey][i]);
          // console.log(document.getElementById(recallAddIn.myGeotabCache.vehicles[vehicleKey][i]).disabled);
          if(document.getElementById(recallAddIn.myGeotabCache.vehicles[vehicleKey][i]).disabled == false){
            count++;
            break;
          }
          
        }
        // console.log(count);
        if (!count){
          document.getElementById("addAllReminders").disabled = true;
        }
      }
      //Notification for Add Success  
      let x = document.getElementById("snackbar");
      x.className = "show";
      x.innerText = "Reminder was added Successfully";
      setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);

    }catch(err){
      //Notification for Add failure  
      let x = document.getElementById("snackbar");
      x.className = "show";
      x.innerText = "Failed to Add Reminder";
      setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
      console.log(err);
    }
  };
  return {
    initialize: function (api, state, addInReady) {      
      _initializeAddin();
      window.api = api;
      addInReady();
    },
    focus: function (api, state) {
      const groupsArray = state.getGroupFilter();
      if(groupsArray[0].id == "GroupCompanyId"){
        _loadFromDatabase(api, groupsArray).then(result =>{
          document.getElementById("requestRecalls").addEventListener("click",function(){
              _requestNewRecalls(api, groupsArray);          
          });
          
          document.getElementById("recallClearButton").addEventListener("click",function(){
            _clearRecall(api,this);
         }); 

          document.getElementById("datetimeTesting").addEventListener("click",function(){
            console.log("Testing DateTime");
            // var test = await  recallAddIn.userTimeZoneOffsetModule.getUserTimeZoneOffset(api);
          }); 

          document.getElementById("recallPrintPDF").addEventListener("click",function(){            
             recallAddIn.utilitiesModule.printToPDF(this.getAttribute("data-vehiclekey"), this.getAttribute("data-recallid"));
          }); 
          
          document.getElementById("recallDownloadCSV").addEventListener("click",function(){            
            recallAddIn.utilitiesModule.recallToCSV(this.getAttribute("data-vehiclekey"), this.getAttribute("data-recallid"));
          }); 

          document.getElementById("addAllReminders").addEventListener("click",function(){            
            recallAddIn.uiModule.openMaintenance(this,1);
          }); 

          document.getElementById("recallSubmitReminder").addEventListener("click",function(){
            //_clearRecall(api,this);
            if(document.getElementById("reminderRuleDate").value != ""){
              //TODO: Check Date Object Validity
              console.log("Save is working");
              _saveReminderRule(api,this);
            }
            else{
              console.log("inelse");              
               // const timezonetesting = await recallAddIn.userTimeZoneOffsetModule.getUserTimeZoneOffset(api);
              // console.log(timezonetesting);    
              
              //TODO: Alert to Correct User input
              // recallAddIn.uiModule.updateStatus("recallStatusMessage","Description and Date fields cannot be empty",true);
            }
          }); 
        });
      }else{
        alert("Unfortunately, Fleet Recalls Beta requires access to Entire Organization.");
        console.log("Current Users Access: " . groupsArray);
      }
      //Next Steps: (order of priority)
      // Implement Date/Time check to only allow 1 NHTSA pull every 24 hours per vehicle type - Done
      // Implement Download Recall Information into CSV/Excel - Done
      // Implement Reminder Rule creation and Vehicle assignment - Done
      // Implement Maintenance Event from Recalls Page - Done
      // Implement PHP Security  
      // Implement "NEXT" Table logic - Done
      // Implement Progress Bar
      // Implement Audit Log

    },
    blur: function (api, state) {
    }
  };
};