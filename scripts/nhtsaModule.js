window.recallAddIn = window.recallAddIn || {};
window.recallAddIn.nhtsaModule = function(){
    let _HttpClient = function () {
    this.get = function (params, aCallback) {
      let sessionInfo;
      api.getSession(function(session){sessionInfo = session;});
      console.log(window.location.hostname);
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          aCallback(xhttp.responseText);
          console.log(xhttp);
        }
      };
      // xhttp.open('POST', 'https://localhost/nhtsa.php?',true);
      xhttp.open('POST', 'https://www.geotab.com/mygeotab/addin/recall/v2/scripts/nhtsaV2.php?',true);
      xhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
      
      xhttp.send(params+"&database="+sessionInfo.database+"&userName="+sessionInfo.userName+"&sessionId="+sessionInfo.sessionId+"&hostName="+window.location.hostname);
    };
  },
  _callNHTSA = function (args) {
    const callNHTSAPromise = new Promise((resolve, reject) => {
      const client = new _HttpClient();
      let postParams = '';

      if(typeof(args) === "undefined" || args == "?"){
        	console.log("This method takes in one args parameter. It is an asynchronous method.");
        	console.log("args = {type: byId or byVehicle, recallId: id, make: make, model: model, year: year}");        
          console.log("If succesful this method returns Recall Information from NHTSA in JSON Format");
          reject("Error: Check Console for more details");
      }else{
        if(args.type == "byId"){
          postParams += 'id=' + args.recallId;
        }else if(args.type == "byVehicle"){
          postParams += 'make=' + args.make + '&model=' + args.model + '&year=' + args.year;
        }else{
          reject(new Error("Undefined Argument Type : " + args.type));
        }

        client.get(postParams,
          function (response) {
            try {
                let jsonResponse = JSON.parse(response);
                if(typeof(jsonResponse) === "undefined" || typeof(jsonResponse.Message) === "undefined"){
                    reject(new Error("Unable to retrieve recall from NHTSA."));
                }else{
                  if(jsonResponse.Message == "Results returned successfully" || jsonResponse.Message ==  "No results found for this request"){
                    if(args.type == "byId"){
                    resolve(jsonResponse.Results[0]);
                    }else{
                    resolve(jsonResponse.Results);
                    }
                  }else{
                    reject(new Error("Unable to retrieve recall from NHTSA."));
                  }
                }
            } catch (err) {
            reject(new Error(err));
          }
        });
      }
    });
    return callNHTSAPromise;
  },
  _getRecallInformationByVehicle = async function(make, model, year){
    const recallInformation = await _callNHTSA({"type":"byVehicle","make":make,"model":model,"year":year});
    return recallInformation     
  },
  getRecallInformationById = function (recallId) {
    recallAddIn.uiModule.updateStatus("NHTSAStatus","Pulling information from NHTSA...",false);
     _callNHTSA({"type":"byId","recallId":recallId}).then(recallInformation => {
         //{type: new/update, fields:[{field:XYZ,value:ABC},...]}
        let recallFields = {"type":"update","fields":[{"field": "recallInfoTable-manufacturer","value":recallInformation.Manufacturer},{"field": "recallInfoTable-summary","value":recallInformation.Summary},{"field": "recallInfoTable-consequences","value":recallInformation.Conequence},{"field": "recallInfoTable-remedy","value":recallInformation.Remedy}]}
        recallAddIn.uiModule.populateRecallInfo(recallFields);
        recallAddIn.uiModule.updateStatus("NHTSAStatus","Success",false);
        document.getElementById("recallInfoTable").classList.remove("preNHTSA");
      }).catch(error =>{
        recallAddIn.uiModule.updateStatus("NHTSAStatus","Error getting NHTSA information!",true);
      });
  },
  getRecallsForFleet = async function(api, vehicleTypes){
    // const vehicleTypes = Object.keys(recallAddIn.myGeotabCache.vehicles),
    const getRecallPromises = [],
          goodVehicleList = [];
    let counter = 0, nhtsaRecalls = [];
    for(let i = 0; i < vehicleTypes.length; i++){
        let currentVehicle = vehicleTypes[i].split(",");
        counter++;
        if(currentVehicle.length == 3){
          getRecallPromises.push(_getRecallInformationByVehicle(currentVehicle[0],currentVehicle[1],currentVehicle[2]));
          goodVehicleList.push(vehicleTypes[i]);
        }else{
          console.log("Wrong Vehicle Type Length: " + currentVehicle.length);
          console.log(currentVehicle);
        }
        if(counter > 10){
          const tempNhtsaRecalls = await Promise.all(getRecallPromises);
          nhtsaRecalls.push(...tempNhtsaRecalls);
          await recallAddIn.utilitiesModule.sleep(3000);
          getRecallPromises.length = 0;
          counter = 0;
        }
    }
    const tempNhtsaRecalls = await Promise.all(getRecallPromises);          
    nhtsaRecalls.push(...tempNhtsaRecalls);
    return {
      vehicleList: goodVehicleList,
      recallList: nhtsaRecalls
    };
  };

  return{
        getRecallInformationById : getRecallInformationById,
        getRecallsForFleet: getRecallsForFleet
	};
}();