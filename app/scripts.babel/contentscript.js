'use strict';

var MAX_COLUMNS = 20;
/*
{
  labels: [0,1,2,3,4,5,6],
  data: {
    'Aaron Phone': [],
    'Shannon Phone': [],
  }
}
*/
var Global_Data = {};
Global_Data.labels = [];
Global_Data.data = {};

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
        //console.log('getTRData() found no data!');
      }
    });
  });

  // {IP: '7 KB', IP: '8 KB'}
  return returnObj;
}

function padData(what, thisManyTimes, where) {
  //console.log('PADDING DATA: ' + what + ', '+ thisManyTimes+ ' times, because: '+ where);
  for (var i=0;i<thisManyTimes;i++) {
    Global_Data.data[what].push(0);
  }
}

function updateDataObj(data) {
  // data = {
	//   labels : [],
	// 	datasets : []
  // }
  var found;
  var updatedItems = [];

  data.labels = Global_Data.labels.slice(MAX_COLUMNS*-1);

  for (var item in Global_Data.data) {
    found = false;
    for (var i=0;data.datasets[i];i++) {
      if (data.datasets[i].label === item) {
        found = true;
        updatedItems.push(item);
        data.datasets[i].data = Global_Data.data[item].slice(MAX_COLUMNS*-1);
      }
    }

    if (!found) {
      updatedItems.push(item);
      data.datasets.push({label: item, data: Global_Data.data[item].slice(MAX_COLUMNS*-1) })
    }
  }

  return data;
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
      newDataValue = newData[ip].split(' ')[0];
      found = false;
      ip = ip.trim();
      for (var item in Global_Data.data) {
        // Found an existing entry, update its data plox
        item = item.trim();
        if (item === ip) {
          //console.log('UPDATING: '+ item);
          itemsUpdated.push(item);
          found = true;
          padNumber = howManyLabels-Global_Data.data[item].length;
          padData(item, padNumber, 'Update Existing');

          Global_Data.data[item].push(newDataValue);
        }
      }

      // Entry not found, add it
      if (!found) {
        //console.log('ADDING: '+ ip);
        Global_Data.data[ip] = [];
        padData(ip, howManyLabels, 'Add New');

        Global_Data.data[ip].push(newDataValue);
        itemsUpdated.push(ip);
      }

    }

    //console.log(itemsUpdated);
    // Pad any existing hosts which were not otherwise updated this pass
    for (var host in Global_Data.data) {
      if ( itemsUpdated.indexOf(host) === -1 ) {
        //console.log('NOT MODIFIED: '+ host);
        padNumber = howManyLabels - Global_Data.data[host].length + 1;
        padData(host, padNumber, 'No Update');
      }
    }
  }

  Global_Data.labels.push(newLabel);
  //console.log(Global_Data);

  currentData = updateDataObj(currentData);
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
  var ctx;
  var myChart;
  var count = 0;
  var chartOptions = {
    spanGaps: true,
    animation: false,
    backgroundColor: 'rgb(10,10,10)',
  };

  // Insert chart canvas element
  outputTableContainer.before($canvas);

  ctx = $('#chart-container').get(0).getContext('2d');

  myChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: chartOptions
  });

  // Hide the original table cuz it stupid
  outputTableContainer.hide();

  // create an observer instance
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {

      newData = getTRData();

      data = updateChartData(data, newData, count++);

      myChart.update();

    });
  });

  // configuration of the observer:
  var config = { subtree: true, attributes: false, childList: true, characterData: true };

  // pass in the target node, as well as the observer optionsf oooo
  observer.observe(outputTableContainer.get(0), config);

});
