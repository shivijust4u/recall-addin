window.recallAddIn = window.recallAddIn || {};
window.recallAddIn.databaseModule = function(){
    const recallAddInId = "axiXYeFO_FUaC8eVVXaARYQ", 
          recallMasterTableId = "aedbb15d-851b-2b95-c2aw",
    _createTable = function(api, tableEntity){
        let createTablePromise = new Promise((resolve, reject) => {
        api.call('Add', {
                typeName: 'AddInData',
                entity: tableEntity
            },
                function (result) {
                resolve(result);
            },
                function (error) {
                reject(error);
            });
        });        
        return createTablePromise;
    },
    createRecallTable = async function(api){
        const   tableEntity = {"addInId":recallAddInId, "groups":[]};
        let data = JSON.stringify({"next":null,"recalls":[],"version":1});
        
        tableEntity.data = data;
        
        return await _createTable(api, tableEntity);
    },
    createMasterTable = async function(api){
        const   tableEntity = {"addInId":recallAddInId, "id":recallMasterTableId, "groups":[]};
        let data = JSON.stringify({"next":null,"masterList":[{}],"version":1, "ruleTypeId": null});
        
        tableEntity.data = data;
        
        return await _createTable(api, tableEntity);
    },
    // vehicleList is an array with each entry being "make,model,year"
    updateMasterTable = async function(api, vehicleList){
        const   createRecallTables = [],
                newVehicleList = [];
        let masterTable = await getTable(api, recallMasterTableId);
        if(!masterTable){
            console.log("Master Table did not exist. Creating and Continuing...");
            masterTable = await createMasterTable(api);
            return await getTable(api, recallMasterTableId);
        }
        console.log(masterTable.data);
        let masterData = JSON.parse(masterTable.data),
            masterDataTable = masterData.masterList[0],
            masterVersion = masterData.version;
        masterData.version++;
        if(masterTable.data.length > 9500){
            console.log("These guys have lots of different vehicles. Need new table");
        }
        for(let i = 0; i < vehicleList.length; i++){
            if(!masterDataTable.hasOwnProperty(vehicleList[i])){
                newVehicleList.push(vehicleList[i]);
                createRecallTables.push(createRecallTable(api));
            }else{
                masterDataTable[vehicleList[i]].lastPullDate = new Date().toISOString();
            }
        }        
        const newRecallTables = await Promise.all(createRecallTables);
        if(newVehicleList.length !== newRecallTables.length){
            console.log("Length mismatch?");
        }else{
            for(let j = 0; j < newVehicleList.length; j++){
                masterDataTable[newVehicleList[j]] =  {"id": newRecallTables[j], "lastPullDate": new Date().toISOString()};
            }
            
            const masterTablecheck = await getTable(api, recallMasterTableId);
            if(JSON.parse(masterTablecheck.data).version == masterVersion){
                masterData.masterList[0] = masterDataTable;
                masterData.version++;
                masterTable.data = JSON.stringify(masterData);
                try{
                    let updateMaster = await setTable(api,masterTable);
                    console.log("Updated Master Table:");
                    console.log(masterTable);
                    return true;
                }catch(err){
                    console.log("Error updating Master:");
                    console.log(err);
                    return false;
                }

            }else{
                alert("Someone else has updated the Master Table! Operation Aborted.");
                console.log("Orphaned Add-In Tables:");
                console.log(newRecallTables);
                return false;
            }
        }
    },
    clearRecall = async function(api,recallTableId,recallId){
        const  recallTable = await getTable(api, recallTableId);
        let recallTableData = JSON.parse(recallTable.data);
        if(recallTableData.recalls[0].hasOwnProperty(recallId)){
            recallTableData.recalls[0][recallId].cleared = true;
            recallTableData.version++;
            recallTable.data = JSON.stringify(recallTableData);
            try{
                let updateRecallTable = await setTable(api,recallTable);
                console.log("Cleared Recall: " + recallId);
                return true;
            }catch(err){
                console.log("Error clearing Recall:" + recallId);
                console.log(recallId);
                console.log(err);
                return false;
            }
        }else{
            console.log("ERROR: Can't Find Recall: " + recallId)
            return false;
        }        
    },
    updateRecallTable = async function(api,recallTableId,recallList,vehicle){
        let recallArray = [];
        const  recallTable = await getTable(api, recallTableId);
        let recallTableData = JSON.parse(recallTable.data),
            newRecallList = {};        
        if(recallTableData.recalls.length == 0){
            recallTableData.recalls[0] = {};
        }
        //add data length check...if > 9500 need to create a new table
        for(let i = 0; i < recallList.length; i++){
            const id = recallList[i].NHTSACampaignNumber;
            if(!((recallTableData.recalls[0]).hasOwnProperty(id))){
                //create reminder Rule get back ID and add it in next line
                newRecallList[id] = {"cleared":false,"component":recallList[i].Component,"reminderRuleId": null};
            }            
        }
        const newRecalls = !(Object.keys(newRecallList).length === 0 && newRecallList.constructor === Object)
        const recallTablecheck = await getTable(api, recallTableId);
        if(JSON.parse(recallTablecheck.data).version == recallTableData.version){
            if(newRecalls){
                recallTableData.recalls[0] = newRecallList;
                recallTableData.version++;
                recallTable.data = JSON.stringify(recallTableData);            
                try{
                    let updateRecallTable = await setTable(api,recallTable);
                    console.log("Updated Recall Table For Vehicle " + vehicle +" :");
                    console.log(updateRecallTable);
                    return true;
                }catch(err){
                    console.log("Error updating Recall:" + recallTableId);
                    console.log(vehicle);
                    console.log(err);
                    return false;
                }
            }else{
                console.log("No new recalls for: " + vehicle);
            }
        }else{
            alert("Someone else has updated the Recall Table: " + recallTableId);
            return false;
        }
    },
    setTable = function(api,addInObject){
        return new Promise(function(resolve,reject){
            api.call("Set", {
                    "typeName": "AddInData",
                    "entity": addInObject
                },function(result){
                    resolve(true);
                },function(error){
                    console.log("Failed to Get Table: " + tableId + " within AddIn Storage: " + recallAddInId);
                    reject(error);                    
                }
            );
        });
    },
    getTable = function(api, tableId){
        return new Promise(function(resolve,reject){
            console.log("recallAddInId:", recallAddInId);
            console.log("tableId:",tableId);
            api.call("Get", {
                    "typeName": "AddInData",
                    "search": {
                        "addInId": recallAddInId,
                        "id": tableId
                    }
                },function(result){
                    console.log(result);                    
                    if(result.length > 0){
                        resolve(result[0]);
                    }else{
                        resolve(false);
                    }
                },function(error){
                    console.log("Failed to Get Table: " + tableId + " within AddIn Storage: " + recallAddInId);
                    reject(error);                    
                }
            );
        });
    };
    return {
        getTable: getTable,        
        createMasterTable : createMasterTable,
        updateMasterTable: updateMasterTable,
        updateRecallTable: updateRecallTable,
        recallAddInId : recallAddInId, 
        recallMasterTableId : recallMasterTableId,
        clearRecall: clearRecall
    };
}(); 