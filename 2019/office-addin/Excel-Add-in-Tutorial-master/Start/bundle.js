/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	/*
	 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
	 * See LICENSE in the project root for license information.
	 */

	// refer:https://docs.microsoft.com/en-us/office/dev/add-ins/tutorials/excel-tutorial

	'use strict';

	(function () {

	    Office.onReady().then(function () {
	        $(document).ready(function () {

	            //  Determine if the user's version of Office supports all the
	            //  Office.js APIs that are used in the tutorial.
	            if (!Office.context.requirements.isSetSupported('ExcelApi', '1.7')) {
	                console.log('Sorry. The tutorial add-in uses Excel.js APIs that are not available in your version of Office.');
	            }

	            //  Assign event handlers and other initialization logic.
	            $('#create-table').click(createTable);
	        });
	    });

	    // Add handlers and business logic functions here.
	    // This logic does not execute immediately. Instead, it is added to a queue of pending commands.
	    function createTable() {
	        Excel.run(function (context) {

	            // TODO4: Queue table creation logic here.

	            // creates a table by using add method of a worksheet's table collection,
	            //  which always exists even if it is empty. 
	            // This is the standard way that Excel.js objects are created. 
	            // There are no class constructor APIs, and you never use a new operator to create an Excel object.
	            //  Instead, you add to a parent collection object.

	            var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

	            // The first parameter of the add method is the range of only the top row of the table,
	            //  not the entire range the table will ultimately use. 
	            //  This is because when the add-in populates the data rows (in the next step),
	            //   it will add new rows to the table instead of writing values to the cells of existing rows.
	            //  This is a more common pattern because the number of rows that a table will have 
	            //    is often not known when the table is created
	            var expensesTable = currentWorksheet.tables.add("A1:D1", true /*hasHeaders*/);
	            expensesTable.name = "ExpensesTable";

	            // Queue commands to populate the table with data.

	            // The cell values of a range are set with an array of arrays.
	            expensesTable.getHeaderRowRange().values = [["Date", "Merchant", "Category", "Amount"]];

	            // New rows are created in a table by calling the add method of the table's row collection.
	            //  You can add multiple rows in a single call of add by including multiple cell value arrays
	            //   in the parent array that is passed as the second parameter.

	            expensesTable.rows.add(null /*add at the end*/, [["1/1/2017", "The Telephone Company", "Communications", "120"], ["1/2/2017", "Northwind Electric Cars", "Transportation", "142.33"], ["1/5/2017", "Best For You Organics Company", "Groceries", "27.9"], ["1/10/2017", "Coho Vineyard", "Restaurant", "33"], ["1/11/2017", "Bellows College", "Education", "350.1"], ["1/15/2017", "Trey Research", "Other", "135"], ["1/15/2017", "Best For You Organics Company", "Groceries", "97.88"]]);

	            // TODO6: Queue commands to format the table.
	            // gets a reference to the Amount column by passing its zero-based index to the getItemAt method of the table's column collection.
	            //  formats the range of the Amount column as USD to the second decimal.
	            expensesTable.columns.getItemAt(3 /* Amount column */).getRange().numberFormat = [['$#,##0.00']];
	            // ensures that the width of the columns and height of the rows is big enough to fit the longest (or tallest)
	            //  data item. 
	            // Notice that the code must get Range objects to format. 
	            // TableColumn and TableRow objects do not have format properties.
	            expensesTable.getRange().format.autofitColumns();
	            expensesTable.getRange().format.autofitRows();

	            return context.sync();
	        }).catch(function (error) {
	            console.log("Error: " + error);
	            if (error instanceof OfficeExtension.Error) {
	                console.log("Debug info: " + JSON.stringify(error.debugInfo));
	            }
	        });
	    }
	})();

/***/ }
/******/ ]);