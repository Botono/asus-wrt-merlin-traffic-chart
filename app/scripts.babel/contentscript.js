'use strict';

var MAX_COLUMNS = 5;
var update_count = 0;
/*
{
  labels: [0,1,2,3,4,5,6],
  data: {
    'Aaron Phone': [],
    'Shannon Phone': [],
  }
}
*/
var Global_Data = {'labels': [], 'data': {}};

function getTRData() {
  var returnObj = {};
  var dataObj = {};
  var rowData;

  $('table.FormTable_NWM tr').not('.traffictable').not('.traffictable_footer').each( function(tr_index, tr_value) {
    rowData = [];
    $(this).children().not('th').each(function(index, value){
      if ($(this).text() !== 'No data in table.') {
        rowData.push($(this).text()); // Raw data from the table.
        dataObj[rowData[0]] = rowData[1];
        $.extend(returnObj, dataObj)
      } else {
        console.log('getTRData() found no data!');
      }
    });
  });

  // {IP: '7 KB', IP: '8 KB'}
  return returnObj;
}

function padData(what, thisManyTimes, where) {
  console.log('PADDING DATA: ' + what + ', '+ thisManyTimes+ ' times, because: '+ where);
  for (var i=0;i<thisManyTimes;i++) {
    Global_Data.data[what].push(0);
  }
}

function updateChartData(currentData, newData, newLabel) {
  var newDataValue;
  var found;
  var newDataSet;
  var itemsUpdated = [];
  var padNumber = 0;
  var howManyLabels = Global_Data.labels.length;

  if (!jQuery.isEmptyObject(newData)) {

    for (var ip in newData) {
      newDataValue = newData[ip];
      found = false;

      for (var item in Global_Data.data) {
        // Found an existing entry, update its data plox
        if (item === ip) {
          console.log('UPDATING: '+ item);
          itemsUpdated.push(item);
          found = true;
          padNumber = howManyLabels-Global_Data.data[item].length;
          padData(item, padNumber, 'Update Existing');

          Global_Data.data[item].push(newDataValue);
        }
      }

      // Entry not found, add it
      if (!found) {
        console.log('ADDING: '+ ip);
        Global_Data.data[ip] = [];
        padData(ip, howManyLabels, 'Add New');

        Global_Data.data[ip].push(newDataValue);
        itemsUpdated.push(ip);
      }

    }

    console.log(itemsUpdated);
    for (var host in Global_Data.data) {
      if ( itemsUpdated.indexOf(host) === -1 ) {
        console.log('NOT MODIFIED: '+ host);
        padNumber = howManyLabels - Global_Data.data[host].length + 1;
        padData(host, padNumber, 'No Update');
      }
    }
  }

  Global_Data.labels.push(newLabel);

  //console.log(Global_Data);
  console.log(Global_Data.labels);
  console.table(Global_Data.data);
  // Update the data object and return it



  update_count++;
  return currentData;
}

$(function() {
  var outputTableContainer = $('#bwm-details-grid');
  var outputTable = $('table.FormTable_NWM');
  var outputTableRows = $('table.FormTable_NWM tr').not('.traffictable').not('.traffictable_footer');
  var theData = {};
  var newData = {};

  var $canvas = $('<canvas>', {id: 'chart-container'});
  var data = {
	  labels : [],
		datasets : []
  };
  var count = 0;

  // Hide the original table cuz it stupid
  // outputTableContainer.hide();

  // Insert chart canvas element
  //outputTableContainer.before($canvas);

  // create an observer instance
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {

      newData = getTRData();

      data = updateChartData(data, newData, count++);

      //console.table([data.labels, data.datasets[0].data]);
      //console.log('Labels: '+ data.labels.length + ' : Data: ' + data.datasets[0].data.length);
      //console.log(data);

    });
  });

  // configuration of the observer:
  var config = { subtree: true, attributes: false, childList: true, characterData: true };

  // pass in the target node, as well as the observer optionsf oooo
  observer.observe(outputTableContainer.get(0), config);

});
