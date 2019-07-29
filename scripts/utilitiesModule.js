window.recallAddIn = window.recallAddIn || {};
window.recallAddIn.utilitiesModule = function(){
	const exportToCSV = function(vehicleKey, recallId){
		let recallContent = document.getElementById("recallInfoTable").getElementsByTagName("TD");
		let rowsArray = [];
		for(let i=0;i<recallContent.length-1;i++){
			let row = [];
			if(i == 0){
				var splitContent = ((recallContent[i].innerText).split(":"));
				row.push(splitContent[0].trim(),splitContent[1].trim());
				rowsArray.push(row);
			}
			else if (i%2){
				row.push((recallContent[i].innerText.split(":")[0].trim()),recallContent[i+1].innerText);
				rowsArray.push(row);
			}
			else{
				continue;
			}
		}
		//***Continue from here
		console.log(rowsArray);
		let csvContent = "data:text/csv;charset=utf-8,";
		rowsArray.forEach(function(rowArray){
		   let row = rowArray.join(",");
		   csvContent += row + "\r\n";
		}); 
		console.log(csvContent);
		var encodedUri = encodeURI(csvContent);
		var link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", "my_data.csv");
		document.body.appendChild(link); // Required for FF
		
		link.click(); // This will download the data file named "my_data.csv".
	},
	printToPDF = function(vehicleKey,recallId){
		let mywindow = window.open('', 'PRINT', 'height=800,width=600');
		mywindow.document.write('<html><head><title>Recall ID' + recallId  + '</title>');
		//mywindow.document.write('<link rel="stylesheet" href="https://my112.geotab.com/geotab/checkmate/app.less?skin=geotab">');
  		//mywindow.document.write('<link rel="stylesheet" href="styles/main.css">');
		mywindow.document.write('</head><body >');
	
		mywindow.document.write(document.getElementById("recallInfoDiv").innerHTML);
		var vehicleListRow = mywindow.document.getElementById("vehicleInfoTable");
		vehicleListRow.parentNode.removeChild(vehicleListRow);
		var bottomInfoRow = mywindow.document.getElementById("recallInfoBottomRow");
		bottomInfoRow.parentNode.removeChild(bottomInfoRow);
		//console.log(document.getElementById("recallInfoDiv").innerHTML);
		mywindow.document.write('<p><b>List of Vehicles:</b></p>')
		let vehicleList = document.getElementsByClassName('searchableVehicleRow');
		for(let i=0;i<vehicleList.length;i++){
			mywindow.document.write(vehicleList.item(i).innerHTML);
			mywindow.document.write('<br/>');
		}
		let buttonElements = mywindow.document.getElementsByTagName("Button");
		console.log(mywindow.document);
		console.log(mywindow.document.getElementsByTagName("Button").item(0));
		while(buttonElements.item(0)){
			buttonElements.item(0).parentNode.removeChild(buttonElements.item(0));	
		}
		
		mywindow.document.write('</body></html>');
		console.log(mywindow);
		mywindow.document.close(); // necessary for IE >= 10
		mywindow.focus(); // necessary for IE >= 10*/

		mywindow.print();
		mywindow.close();

		return true;
	},
	exportToXLSX = (vehicleKey,recallId, printButton) => {
			let Workbook = () => {
					if (!(printButton instanceof Workbook)) return new Workbook();
					printButton.SheetNames = [];
					printButton.Sheets = {};
				},
				s2ab = s => {
					var buf = new ArrayBuffer(s.length);
					var view = new Uint8Array(buf);
					for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
					return buf;
				},
				workbook = new Workbook(),
                recallWorksheetName = "Recall",
                //vehiclesWorksheetName = "Vehicle List",
				recallWorksheet = {},
				recallRange = {
					s: {
						c: 0,
						r: 0
					},
					e: {
						c: 1,
						r: 65536
					}
				},
				headerRows = 4,
				alignLeft = {
					horizontal: "left"
				},
				alignRight = {
					horizontal: "right"
				},
				cellFills = [{
					fgColor: "ffffff"
				}],
				cellStyles = [{
						applyFill: "1",
						applyBorder: "1",
						borderId: "0",
						fillId: "2",
						fontId: "1",
						numFmtId: 0,
						xfId: "0",
						applyAlignment: "1",
						alignment: alignLeft
					},
					{
						applyFill: "1",
						applyBorder: "1",
						borderId: "0",
						fillId: "2",
						fontId: "2",
						numFmtId: 0,
						xfId: "0"
					},
					{
						applyFill: "1",
						applyBorder: "1",
						borderId: "0",
						fillId: "2",
						fontId: "2",
						numFmtId: 0,
						xfId: "0",
						applyAlignment: "1",
						alignment: alignRight
					},
					{
						applyFill: "1",
						applyBorder: "1",
						borderId: "0",
						fillId: "2",
						fontId: "1",
						numFmtId: "15",
						xfId: "0",
						applyAlignment: "1",
						alignment: alignLeft
					},
					{
						applyFill: "1",
						applyBorder: "1",
						borderId: "0",
						fillId: "2",
						fontId: "1",
						numFmtId: "25",
						xfId: "0",
						alignment: alignLeft
					}
				],

				wbout,
				i = 1,
				recallContent, row;

			recallWorksheet["!cols"] = [{
					wch: 35
				},
				{
					wch: 25
				},
				{
					wch: 20
				}
			];
			// Range and frozen cells
			recallWorksheet["!ref"] = XLSX.utils.encode_range(recallRange);
			recallWorksheet["!frozen"] = headerRows;

			// Created date
			recallWorksheet.A1 = {
				v: "Created",
				s: 2
			};
			recallWorksheet.B1 = {
				v: new Date(),
				s: 3,
				t: "d"
			};

			// Total count
			recallWorksheet.A2 = {
				v: "Total",
				s: 2
			};
			recallWorksheet.B2 = {
				v: "",
				f: "1",
				t: "n"
			};

			// Grid header
			recallWorksheet.A4 = {
				v: "Recall ID",
				s: 1
			};
			recallWorksheet.B4 = {
				v: recallId,
				s: 1
			};


			recallContent = document.getElementById("recallInfoTable").getElementsByTagName("TD");

            while(i < recallContent.length){
                row = XLSX.utils.encode_row(headerRows + i);
                recallWorksheet["A" + row] = {
					v: recallContent[i]
				};
				recallWorksheet["B" + row] = {
					v: recallContent[i+1]
                };
                i += 2;
            }
			/* add worksheet to workbook */
			workbook.SheetNames.push(recallWorksheetName);
            workbook.Sheets[recallWorksheetName] = recallWorksheet;
            
            //workbook.SheetNames.push(vehiclesWorksheetName);
            //workbook.Sheets[vehiclesWorksheetName] = vehicleWorksheet;

			wbout = XLSX.write(workbook, {
				bookType: "xlsx",
				bookSST: true,
				type: "binary",
				cellXfs: cellStyles,
				fills: cellFills
			});

			saveAs(new Blob([s2ab(wbout)], {
				type: "application/octet-stream"
			}), "RecallReport.xlsx");
        },
	sleep = function(miliseconds){return new Promise(resolve => setTimeout(resolve,miliseconds));
	},
	padHex = function(hexNumber){
		var str = '' + hexNumber;
		while (str.length < 16) {
			str = '0' + str;
		}
		return str;
	},
	convertSecondsToHhMm = function(totalSeconds){
		let hours = Math.floor(totalSeconds/3600);
		totalSeconds %= 3600;
		let minutes = Math.floor(totalSeconds/60);
		let seconds = Math.floor(totalSeconds%60);
		if(seconds >= 30){
			minutes ++;
		}
		// To add leading zeroes:
		minutes = String(minutes).padStart(2, "0");
		hours = String(hours).padStart(2, "0");
		return hours + ":" + minutes;
	};

    return {
		recallToExcel: exportToCSV,
		recallToCSV: exportToCSV,
		printToPDF:printToPDF,
		sleep: sleep,
		padHex : padHex,
		convertSecondsToHhMm : convertSecondsToHhMm
    }
}();