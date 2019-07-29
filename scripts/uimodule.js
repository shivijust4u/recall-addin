window.recallAddIn = window.recallAddIn || {};
window.recallAddIn.uiModule = function(){
let _createRecallRow = function(searchable,recallInformation){
		let row = document.createElement("tr"),
			cell = document.createElement("td"),
			cellDiv = document.createElement("div"),
			cellHTML = "";

			if(recallInformation.cleared){
				cellDiv.setAttribute("class","g-row checkmateListBuilderRow checkmateListBuilderRowInactive");
			}else{
				cellDiv.setAttribute("class","g-row checkmateListBuilderRow");
			}
			row.setAttribute("id","recall-"+ decodeHTMLEntities(recallInformation.id));	
			cellHTML = '<button class="geotabButton emptyButton recallInfoButton" id="recallInfoButtonRow" data-recallid="' + decodeHTMLEntities(recallInformation.id) + '" data-vehicleKey="' + decodeHTMLEntities(recallInformation.vehicle) + '" data-reminderrule="' + decodeHTMLEntities(recallInformation.reminderRule) + '" onclick="recallAddIn.uiModule.openRecallInfo(this)" title="Show recall details"><a class="g-main xs-col activeElement sm-part-9 md-part-10" href="javascript:void(0)"><div class="g-name" title="Recall Component"><span class="ellipsis recallComponent">'
			cellHTML += decodeHTMLEntities(recallInformation.component);
			cellHTML += '</span></div> <div class="g-sub-main devicesSubInfo"> <div class="g-group devicesInfo sm-part-8"> <div class="g-item usualData ellipsis recallVehicle" title="Vehicle Type">'
			cellHTML += decodeHTMLEntities(recallInformation.vehicle.replace(/,/g , " ")) + " (" + recallAddIn.myGeotabCache.vehicles[recallInformation.vehicle].length + " Vehicle";
			if(recallAddIn.myGeotabCache.vehicles[recallInformation.vehicle].length > 1){
				cellHTML += "s";
			}

			cellHTML += ')</div> <div class="g-item secondaryData hidden-xs recallId" title="Recall Id">';
			cellHTML += decodeHTMLEntities(recallInformation.id);
			// cellHTML += '</div> </div> </div> </a> <div class="g-ctrl"></button>' <button class="geotabButton emptyButton recallInfoButton" data-recallid="' + decodeHTMLEntities(recallInformation.id) + '" data-vehicleKey="' + decodeHTMLEntities(recallInformation.vehicle) + '" data-reminderrule="' + decodeHTMLEntities(recallInformation.reminderRule) + '" onclick="recallAddIn.uiModule.openRecallInfo(this)" title="Show recall details"> <span class="geotabButtonIcons">+</span> </div></button>'
			
			cellDiv.innerHTML = cellHTML;
			cell.appendChild(cellDiv);
			row.appendChild(cell);
			row.setAttribute("data-vehiclecount", recallAddIn.myGeotabCache.vehicles[recallInformation.vehicle].length);
		if(searchable){
			row.setAttribute("data-index", decodeHTMLEntities(recallInformation.component).toLowerCase() + " " + decodeHTMLEntities(recallInformation.vehicle).replace(/,/g , " ").toLowerCase() + " " + decodeHTMLEntities(recallInformation.id).toLowerCase());			
			row.setAttribute("class","searchableRow");
		}
		return row;
	},
	createRecallTable = function(args){
		if(typeof(args) === "undefined" || args == "?"){
        	console.log("This method takes in one args parameter. It is a synchronous method.");
        	console.log("args = {tableRows: Rows x Columns array, searchable: true/false} - method will fail if parentNode and tableRows not provided.");        
        	console.log("This method does not return any values, it will append the newly created table to the DOM.");
        }else{
			if(typeof(args.parentNode) === "undefined" || typeof(args.tableRows) === "undefined"){
        		console.log("You must provide the parentNode as well as the table contents");
        		console.log("Example: args = {parentNode:DOMElement,tableRows:Rows x Columns content array}");
        	}else{
				let table = document.createElement("table"),
					tbody = document.createElement("tbody");

				table.setAttribute("class", "checkmateListTable");
				for(let i = 0; i < args.tableRows.length; i++){
					tbody.appendChild(_createRecallRow(args.searchable,args.tableRows[i]));
				}
				table.appendChild(tbody);
				if(args.tableRows.length > 0){
					args.parentNode.innerHTML = "";
					args.parentNode.appendChild(table);
				}			
			}
		}
	},
	decodeHTMLEntities = function (str) {
		let a = document.createElement("a");
		if (str && typeof str === "string") {
			str = str.replace(/&amp;nbsp;/g, "");
		}
		a.innerHTML = str;
		return a.textContent;
	},
	updateStatus = function(elementId,statusText,isError){
		// const statusSpan = document.getElementById(elementId);
		// statusSpan.textContent = decodeHTMLEntities(statusText);
		// if(isError){
		// 	statusSpan.classList.add("errorMessage");
		// }else{
		// 	statusSpan.classList.remove("errorMessage");
		// }
		const statusSpan = document.getElementById(elementId);
		statusSpan.textContent = decodeHTMLEntities(statusText);
		statusSpan.className = "show";
		if(isError){
			statusSpan.classList.add("errorMessage");
		}else{
			statusSpan.classList.remove("errorMessage");
		}
		if(elementId == "snackbar"){
			setTimeout(function(){ statusSpan.className = statusSpan.className.replace("show", ""); }, 3000);
		}
	},
	assignFunctionToButtonOnEvent = function(elementArray, functionToAssign, eventType){
		for (let i = 0; i < elementArray.length; i++) {
			elementArray[i].addEventListener(eventType, function(event) {
				event.preventDefault();
				functionToAssign(this);
			});
		}
	},
	openRecallInfo =  function(recallSelected){
		let recallId = recallSelected.getAttribute("data-recallid"),
			recallRow = document.getElementById("recall-"+recallId),
			vehicleKey = recallSelected.getAttribute("data-vehicleKey"),
			maintenanceKey = recallSelected.getAttribute("data-reminderRule");
		
		console.log(recallSelected);
		console.log(vehicleKey);	
		//if new recall, clear text
		if(document.getElementById("recallInfoTable-id").textContent != recallId){
			_clearRecallInfo();
			document.getElementById("recallInfoTable-id").innerHTML = decodeHTMLEntities(recallId);
			document.getElementById("recallInfoTable-vehicle").innerHTML = decodeHTMLEntities(recallRow.getElementsByClassName("recallVehicle")[0].textContent).substring(0,decodeHTMLEntities(recallRow.getElementsByClassName("recallVehicle")[0].textContent).indexOf("(")-1);
			document.getElementById("recallInfoTable-component").innerHTML = decodeHTMLEntities(recallRow.getElementsByClassName("recallComponent")[0].textContent);
			document.getElementById("recallClearButton").setAttribute("data-vehiclekey",decodeHTMLEntities(vehicleKey));
			document.getElementById("recallClearButton").setAttribute("data-recallid",decodeHTMLEntities(recallId));
			document.getElementById("recallDownloadCSV").setAttribute("data-vehiclekey",decodeHTMLEntities(vehicleKey));
			document.getElementById("recallDownloadCSV").setAttribute("data-recallid",decodeHTMLEntities(recallId));
			document.getElementById("recallPrintPDF").setAttribute("data-vehiclekey",decodeHTMLEntities(vehicleKey));
			document.getElementById("recallPrintPDF").setAttribute("data-recallid",decodeHTMLEntities(recallId));
			document.getElementById("addAllReminders").setAttribute("data-vehiclekey",decodeHTMLEntities(vehicleKey));
			document.getElementById("addAllReminders").setAttribute("data-recallid",decodeHTMLEntities(recallId));
			
		}
		_clearVehicleInfo();
		document.getElementById("recallInfoContainer").classList.remove("hiddenElement");
		
		recallAddIn.nhtsaModule.getRecallInformationById(recallId);
		updateStatus("maintenanceStatus","Pulling vehicle information..",false);
		//get vehicle information to populate..may separate into its own function somewhere
		const vehicleArray = recallAddIn.myGeotabCache.vehicles[vehicleKey],
				vehicleInformation = [];
		for(let i = 0; i < vehicleArray.length; i++){
			const vehicle = recallAddIn.myGeotabCache.devices[vehicleArray[i]];
			vehicleInformation.push({"id":vehicleArray[i],"name":vehicle.name,"vin":vehicle.vin});
		}
		
		
		console.log(vehicleArray);
		console.log(vehicleInformation);
		if(vehicleArray.length == 1){
			document.getElementById("reminderButton").style.display ='none';
		}
		else{
			document.getElementById("reminderButton").style.display ='block';
			document.getElementById("addAllReminders").disabled = false;
		}
		populateVehicleInfo({"vehicles":vehicleInformation});

		//Get all Reminder Rules, Reminder Types
		async function getDevicesWithMaintenanceEnabled(){
			const api = window.api,
				reminderRules =  await recallAddIn.myGeotabModule.getReminderRules(api),
				reminderRuleTypes = await recallAddIn.myGeotabModule.getReminderRuleTypes(api);
			let selectedReminderRulesList = [], deviceList = [],selectedReminderRuleType;

			console.log(reminderRules);	
			console.log(reminderRuleTypes);	
			console.log((recallRow.getElementsByClassName("recallComponent")[0].textContent).substring(0,50).trim());
			//Short list current rule by name
			for(let i=0; i<reminderRules.length;i++){
				if(reminderRules[i].name == (recallRow.getElementsByClassName("recallComponent")[0].textContent).substring(0,50).trim() ){
					console.log(reminderRules[i]);
					for(let j=0; j<reminderRuleTypes.length;j++){
						//Find a rule that matches type
						if(typeof reminderRuleTypes[j] != "string"){
							if(reminderRuleTypes[j].id == reminderRules[i].eventType.id && reminderRuleTypes[j].name  == decodeHTMLEntities(recallId)){
								//Store the Rule id
								console.log( reminderRuleTypes[j].id, "exists!");
								selectedReminderRulesList.push(reminderRules[i]);
								selectedReminderRuleType = reminderRuleTypes[j];
							}      
						}
					}
				}	
			}	
			console.log(selectedReminderRulesList);
			//Get Event Occurance
			//Search for all occurances with matching event rule id
			if(selectedReminderRulesList && selectedReminderRuleType){
				console.log("helloo");
				const eventOccurrences = await recallAddIn.myGeotabModule.getEventOccurrences(api);
				for(let i=0; i<eventOccurrences.length;i++){
					for(let j=0;j<selectedReminderRulesList.length;j++){
						if(eventOccurrences[i].eventRule.id == selectedReminderRulesList[j].id){
							console.log(eventOccurrences[i]);
							deviceList.push(eventOccurrences[i].device.id);	
						}
					}
				}
			}	
			// console.log(deviceList);	
			return deviceList;
		}
		//Obtain list of devices that are on/off for this reminder rule
		//Toggle device Reminder button accordingly
		let devicesWithMaintenanceEnabled;	
		// console.log(devicesWithMaintenanceEnabled);
		(async () => {
			devicesWithMaintenanceEnabled = await getDevicesWithMaintenanceEnabled();
			console.log(devicesWithMaintenanceEnabled);
			for(let i =0; i<devicesWithMaintenanceEnabled.length;i++){
				document.getElementById(devicesWithMaintenanceEnabled[i]).disabled = true;
			}
			console.log(devicesWithMaintenanceEnabled);
			if(vehicleArray.length != devicesWithMaintenanceEnabled.length){
				console.log(vehicleArray);
				console.log(devicesWithMaintenanceEnabled);
				console.log("Switch ON Bulk add");
				document.getElementById("addAllReminders").disabled = false;
			}
			else{
				let recalledDevices = (vehicleArray.slice()).sort(),
				enabledDevices = (devicesWithMaintenanceEnabled.slice()).sort();
				for(let i=0; i < recalledDevices.length; i++){
					if(recalledDevices[i] != enabledDevices[i]){
						console.log("Switch ON Bulk add");
						document.getElementById("addAllReminders").disabled = false;
					}
				}
				console.log("Switch OFF Bulk add");
				document.getElementById("addAllReminders").disabled = true;
			}
		})();
	},
	closeRecallInfo = function(){
		document.getElementById("recallInfoContainer").classList.add("hiddenElement");
		_clearVehicleInfo();
	},
	_clearRecallInfo = function(){
		document.getElementById("recallInfoTable").classList.add("preNHTSA");
		document.getElementById("recallInfoTable-id").innerHTML = "";
		document.getElementById("recallInfoTable-vehicle").innerHTML = "";
		document.getElementById("recallInfoTable-component").innerHTML = "";
		document.getElementById("recallInfoTable-manufacturer").innerHTML = "";
		document.getElementById("recallInfoTable-summary").innerHTML = "";
		document.getElementById("recallInfoTable-consequences").innerHTML = "";
		document.getElementById("recallInfoTable-remedy").innerHTML = "";
		document.getElementById("NHTSAStatus").innerHTML = "...";
		document.getElementById("recallClearButton").setAttribute("data-vehiclekey","");
		document.getElementById("recallClearButton").setAttribute("data-recallid","");
		document.getElementById("recallDownloadCSV").setAttribute("data-vehiclekey","");
		document.getElementById("recallDownloadCSV").setAttribute("data-recallid","");
	},
	_clearVehicleInfo = function(){
		const tablerows = document.getElementById("vehicleInfoTable").rows;
		document.getElementById("maintenanceStatus").innerHTML = "...";
		for(let i = 1; tablerows.length > 1; ){
			document.getElementById("vehicleInfoTable").deleteRow(i);
		}
	},
	populateRecallInfo = function(args){
		console.log(args);
		if(args.type == "new"){
			_clearRecallInfo();
		}
		for(let i = 0; i < args.fields.length; i++){
			document.getElementById(args.fields[i].field).innerHTML = args.fields[i].value;
		}
	},
	populateVehicleInfo = function(args){
		let counter = 0, page = 1, maxPerPage = 5;
		_clearVehicleInfo();
		for(let i = 0; i < args.vehicles.length; i++){
			let vehicleObject = args.vehicles[i],
				hideRow = false;
			vehicleObject.allPage = page;
			console.log(vehicleObject);
			console.log(counter);	
			if( i > maxPerPage-1){
				hideRow = true;
			}
			_addVehicleInfoRow(vehicleObject, hideRow);		
			counter++;
			if(counter == maxPerPage){
				page++;
				counter = 0;
			}
		}
		let vehiclePager = document.getElementById("recallInfoPaginationDiv"),
			vehiclePagerHTML = "";
		if(page>1){
			vehiclePagerHTML += '<a href="javascript:void(0)" onclick="recallAddIn.uiModule.changeVehiclePage(this)" title="First Page" data-pager="'+1+'">'+"<< "+'</a>';
		}
		for(let j = 1; j <= page; j++){
			if(j>1){
				vehiclePagerHTML += " - "
			}
		
		
			if(j==1){
				vehiclePagerHTML += '<a href="javascript:void(0)" onclick="recallAddIn.uiModule.changeVehiclePage(this)" data-pager="'+j+'" style="color:darkblue; font-weight:bold;">'+j+'</a>';
				// border-style:outset;
			}
			else{
				vehiclePagerHTML += '<a href="javascript:void(0)" onclick="recallAddIn.uiModule.changeVehiclePage(this)" data-pager="'+j+'">'+j+'</a>';
			}
		}
		
		if(page>1){
			vehiclePagerHTML += '<a href="javascript:void(0)" onclick="recallAddIn.uiModule.changeVehiclePage(this)" title="Last Page" data-pager="'+page+'">'+" >>"+'</a>';
		}

		vehiclePager.innerHTML = vehiclePagerHTML;
		updateStatus("maintenanceStatus","Vehicle information retrieved",false);
	},
	openMaintenance = function(maintenance, bulk){
		//console.log(maintenance.getAttribute("data-vehicleVin"));
		let vehicleNameDiv = document.getElementById("reminderRuleVehicle"),
			vehicleVinDiv = document.getElementById("reminderRuleVin"), 
			reminderTypeDiv = document.getElementById("reminderRuleType"),
			reminderDescriptionDiv = document.getElementById("reminderRuleDescription");		
		if(bulk){
			vehicleNameDiv.setAttribute("placeholder","Multiple");
			vehicleNameDiv.setAttribute("data-vehicleId","Multiple");
			vehicleVinDiv.setAttribute("placeholder","Multiple");
		}
		else{
			vehicleNameDiv.setAttribute("placeholder",maintenance.getAttribute("data-vehicleName"));
			vehicleNameDiv.setAttribute("data-vehicleId",maintenance.getAttribute("data-vehicleId"));
			vehicleVinDiv.setAttribute("placeholder",maintenance.getAttribute("data-vehicleVin"));
		}
		reminderDescriptionDiv.setAttribute("placeholder",document.getElementById("recallInfoTable-component").innerText);
		reminderTypeDiv.setAttribute("placeholder",document.getElementById("recallInfoTable-id").innerText);
		
		document.getElementById('reminderModal').style.display='block';
	
	},
	_addVehicleInfoRow = function(vehicleInformation, hideRow){
		console.log(vehicleInformation);
		console.log(hideRow);
		let row = document.createElement("tr"),
			cell = document.createElement("td"),
			vehicleDiv = document.createElement("div"),
			maintenanceDiv = document.createElement("div"),
			vehicleHTML = "",
			maintenanceHTML = "",
			vehicleIndex = vehicleInformation.allPage;
			// vehicleIndex = vehicleInformation.name.toLowerCase() + " " + vehicleInformation.vin.toLowerCase() + " all" + vehicleInformation.allPage;
						
			row.setAttribute("class","vehicleInfoRow " + decodeHTMLEntities(vehicleInformation.status) + "RecallRow");
			row.setAttribute("id","vehicle-"+ decodeHTMLEntities(vehicleInformation.id));
			row.setAttribute("data-vehicleIndex", decodeHTMLEntities(vehicleIndex));
			row.setAttribute("class","searchableVehicleRow");
			if(hideRow){
				row.style.display = "none";
			}

			vehicleDiv.setAttribute("class","g-row checkmateListBuilderRow");
			maintenanceDiv.setAttribute("class","g-row maintenanceEditContainer");

			vehicleHTML = '<a class="g-main xs-col activeElement sm-part-9 md-part-10" href="javascript:void(0)"><div class="g-name" title="Vehicle Name"><span class="ellipsis">';
			vehicleHTML += decodeHTMLEntities(vehicleInformation.name);
			vehicleHTML += '</span></div> <div class="g-sub-main devicesSubInfo"> <div class="g-group devicesInfo sm-part-8"> <div class="g-item usualData ellipsis" title="VIN">';
			vehicleHTML += decodeHTMLEntities(vehicleInformation.vin);
			vehicleHTML += '</div></div> <div class="g-item secondaryData hidden-xs" title="Status">';
			vehicleHTML += '<div class="g-ctrl"> <button class="geotabButton positiveButton maintenanceButton1" onclick="recallAddIn.uiModule.openMaintenance(this,0)" data-vehicleId="' + decodeHTMLEntities(vehicleInformation.id) + '" data-vehicleName="' + decodeHTMLEntities(vehicleInformation.name) + '" data-vehicleVin="' + decodeHTMLEntities(vehicleInformation.vin) + '" data-reminderType="' + decodeHTMLEntities(vehicleInformation.vin) + '" id="' + decodeHTMLEntities(vehicleInformation.id) + '" title="Add Maintenance Reminder"> Add Reminder </button></div>';
			
			// maintenanceHTML = '<div class="maintenanceInfoContainer"><label class="maintenanceInfoLabel">Last Edit: <span class="maintenanceDate"></span> - <span class="maintenanceUser"></span><div class="horizontalButtonSet"><button class="geotabButton" data-action="new"  data-vehicleId="' + decodeHTMLEntities(vehicleInformation.id) + '" onclick="recallAddIn.uiModule.editMaintenance(this)">RESET</button><button class="geotabButton" data-action="ignored"  data-vehicleId="' + decodeHTMLEntities(vehicleInformation.id) + '" onclick="recallAddIn.uiModule.editMaintenance(this)">IGNORE</button><button class="geotabButton" data-action="open"  data-vehicleId="' + decodeHTMLEntities(vehicleInformation.id) + '" onclick="recallAddIn.uiModule.editMaintenance(this)">OPEN</button><button class="geotabButton" data-action="fixed"  data-vehicleId="' + decodeHTMLEntities(vehicleInformation.id) + '" onclick="recallAddIn.uiModule.editMaintenance(this)">FIX</button></div></div>';
			vehicleHTML += '';
			vehicleHTML += '</div></div></a>';
			vehicleDiv.innerHTML = vehicleHTML;
			// maintenanceDiv.innerHTML = maintenanceHTML;
			cell.appendChild(vehicleDiv);
			// cell.appendChild(maintenanceDiv);
			row.appendChild(cell);
			document.getElementById("vehicleInfoTable").appendChild(row);
		return true;
	},
	changeVehiclePage = function(pageSelected){
		let pageShifters = document.querySelectorAll("a[data-pager]");
		// pageSelected.setAttribute("style", "color:blue; font-weight: bold;")
		for(let i=0;i<pageShifters.length;i++){
			pageShifters.item(i).setAttribute("style", "color:blue; font-weight: normal;")
		}
		if(pageSelected.innerText.trim() != "<<" && pageSelected.innerText.trim() != ">>" ){
			let pp =pageSelected.setAttribute("style", "color:darkblue; font-weight: bold;");			
		}else{
			if(pageSelected.innerText.trim() == "<<"){
				pageShifters.item(1).setAttribute("style", "color:darkblue; font-weight: bold;");			
			}
			else{
				pageShifters.item(pageShifters.length-2).setAttribute("style", "color:darkblue; font-weight: bold;");
			}
		}
		const pager = pageSelected.getAttribute("data-pager"),
			vehicleRows = document.getElementsByClassName('searchableVehicleRow');
		for(let j=0; j<vehicleRows.length; j++){
			if(vehicleRows.item(j).getAttribute('data-vehicleindex') == pager){
				 vehicleRows.item(j).style.display = 'table-row';
			}
			else{
				vehicleRows.item(j).style.display = 'none';
			}
		}
	},
    toggleLoading = function(flag, loadText){
        if(flag){
            document.getElementById("recallLoaderContainer").classList.remove("hiddenElement");
            if(loadText !== undefined && loadText !== null){
                document.getElementById("recallLoaderText").innerHTML = decodeHTMLEntities(loadText);
            }
        }else{
            document.getElementById("recallLoaderContainer").classList.add("hiddenElement");
            document.getElementById("recallLoaderText").innerHTML = "Loading...";
        }
	},
	sortRecallTable = function(sortButton){
		let table = document.getElementById("recallsListBuilder").querySelector(".checkmateListTable"), 
			rows = table.getElementsByTagName("TR"), 
			switching = true, 
			x, y, i,
			shouldSwitch = false;

		while (switching) {
			switching = false;
			for (i = 0; i < (rows.length - 1); i++) {
				shouldSwitch = false;
				x = rows[i].getAttribute("data-vehiclecount");
				y = rows[i + 1].getAttribute("data-vehiclecount");			
				if (x < y) {				
					shouldSwitch = true;
					break;
				}
			}
			if (shouldSwitch) {
				rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
				switching = true;
			}
		}
		sortButton.disabled = true;
	};
return{
        bindEventFunction : assignFunctionToButtonOnEvent,
		toggleLoading: toggleLoading,
		createRecallTable: createRecallTable,
		decodeHTMLEntities: decodeHTMLEntities,
		closeRecallInfo: closeRecallInfo,
		populateRecallInfo: populateRecallInfo,
		openRecallInfo: openRecallInfo,
		changeVehiclePage: changeVehiclePage,
		updateStatus: updateStatus,
		sortRecallTable: sortRecallTable,
		openMaintenance: openMaintenance
	};
}(); 