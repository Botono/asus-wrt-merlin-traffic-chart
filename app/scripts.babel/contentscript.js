'use strict';

// GLOBALS
var MAX_COLUMNS = 20;
var color_palette = palette('tol', 12).reverse(); // Reverse because pop()
var host_counter = 0;
var current_scale = 'KB';
var scale_multipliers = {
  'KB': 1,
  'MB': 1000,
  'GB': 1000000
};

var Global_Data = {};
Global_Data.labels = [];
Global_Data.hosts = {};
// END GLOBALS

function hexToRGB(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function isAllZeros(data) {
  for (var idx in data) {
    if (data[idx] > 0) {
      return false;
    }
  }
  return true;
}

function getTRData() {
  var returnObj = {};
  var dataObj = {};
  var rowData;

  current_scale = $('#scale option:selected').text();

  $('table.FormTable_NWM tr').not('.traffictable').not('.traffictable_footer').each(function(tr_index, tr_value) {
    rowData = [];
    $(this).children().not('th').each(function(index, value) {
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
  for (var i = 0; i < thisManyTimes; i++) {
    Global_Data.hosts[what].data.push(0);
  }
}

function updateChartData(data) {
  // data = {
  //   labels : [],
  // 	datasets : []
  // }
  var found;
  var hostData;
  var removeThisHost = false;
  var myPalette;
  var paletteRGB;
  var paletteRGBAplha;

  data.labels = Global_Data.labels.slice(MAX_COLUMNS * -1);

  for (var item in Global_Data.hosts) {
    found = false;
    hostData = Global_Data.hosts[item].data.slice(MAX_COLUMNS * -1);

    if (isAllZeros(hostData)) {
      // If a host has zeros in all places in current view,
      // it should be removed from the chart.
      removeThisHost = true;
    }

    for (var i = 0; data.datasets[i]; i++) {
      if (data.datasets[i].label === item) {
        found = true;

        if (removeThisHost) {
          // Host needs to be removed. Put its color back in the palette array

          color_palette.push(Global_Data.hosts[item].color);
          Global_Data.hosts[item].color = '';
          data.datasets.splice(i, 1);
          // console.warn('Removing '+ item);
          // console.log('Palette:');
          // console.log(color_palette)
          // console.log('Datasets:');
          // console.log(data.datasets);
        } else {
          data.datasets[i].data = hostData;
        }
      }
    }

    if (!found && !removeThisHost) {

      Global_Data.hosts[item].color = color_palette.pop();
      myPalette = hexToRGB(Global_Data.hosts[item].color);
      paletteRGB = 'rgba(' + myPalette.r + ',' + myPalette.g + ',' + myPalette.b + ',1)';
      paletteRGBAplha = 'rgba(' + myPalette.r + ',' + myPalette.g + ',' + myPalette.b + ',0.5)';

      data.datasets.push({
        backgroundColor: paletteRGBAplha,
        borderColor: paletteRGB,
        pointBorderColor: paletteRGB,
        pointStrokeColor: '#fff',
        label: item,
        data: Global_Data.hosts[item].data.slice(MAX_COLUMNS * -1),
      });
      // console.warn('Adding '+ item);
      // console.log('Palette:');
      // console.log(color_palette)
      // console.log('Datasets:');
      // console.log(data.datasets);
    }
  }

  return data;
}

function updateGlobalData(currentData, newData, newLabel) {
  var newDataValue;
  var found;
  var newDataSet;
  var itemsUpdated = [];
  var padNumber = 0;
  var howManyLabels = Global_Data.labels.length;

  if (!jQuery.isEmptyObject(newData)) {

    for (var ip in newData) {
      newDataValue = (parseFloat(newData[ip].split(' ')[0].replace(',', ''))) * scale_multipliers[current_scale];

      found = false;
      ip = ip.trim();
      for (var item in Global_Data.hosts) {
        // Found an existing entry, update its data plox
        item = item.trim();
        if (item === ip) {
          //console.log('UPDATING: '+ item);
          itemsUpdated.push(item);
          found = true;
          padNumber = howManyLabels - Global_Data.hosts[item].data.length;
          padData(item, padNumber, 'Update Existing');

          Global_Data.hosts[item].data.push(newDataValue);
        }
      }

      // Entry not found, add it
      if (!found) {
        //console.log('ADDING: '+ ip);
        Global_Data.hosts[ip] = {
          'data': [],
          'color': ''
        };

        padData(ip, howManyLabels, 'Add New');

        Global_Data.hosts[ip].data.push(newDataValue);
        itemsUpdated.push(ip);
      }

    }

    //console.log(itemsUpdated);
    // Pad any existing hosts which were not otherwise updated this pass
    for (var host in Global_Data.hosts) {
      if (itemsUpdated.indexOf(host) === -1) {
        //console.log('NOT MODIFIED: '+ host);
        padNumber = howManyLabels - Global_Data.hosts[host].data.length + 1;
        padData(host, padNumber, 'No Update');
      }
    }
  } else {
    // Empty object, pad all existing entries with 0
    for (var host in Global_Data.hosts) {
      padData(host, 1, 'No Data');
    }
  }

  Global_Data.labels.push(newLabel);
  //console.log(Global_Data);

  currentData = updateChartData(currentData);
  return currentData;
}



$(function() {
  var outputTableContainer = $('#bwm-details-grid');
  var outputTable = $('table.FormTable_NWM');
  var outputTableRows = $('table.FormTable_NWM tr').not('.traffictable').not('.traffictable_footer');

  current_scale = $('#scale option:selected').text();
  var theData = {};
  var newData = {};

  var $canvas = $('<canvas>', {
    id: 'chart-container',
    class: 'chart-container'
  });
  var data = {
    labels: [],
    datasets: []
  };
  var ctx;
  var myChart;
  var count = 0;
  var chartOptions = {
    spanGaps: true,
    animation: false,
    title: {
      display: true,
      text: 'Data Transferred Per IP in KB'
    },
    scales: {
      yAxes: [{
        ticks: {
          callback: function(label, index, labels) {
            if (label.toString().length > 6) {
              return label.toFixed(2) +'KB';
            } else {
              return label +'KB';
            }
          }
        },
      }],
      xAxes: [{
        type: 'time',
        unit: 'second',
        unitStepSize: 6,
        minUnit: 'second',
      }]
    }
  };

  // Insert chart canvas element
  outputTableContainer.before($canvas);
  $('#chart-container').css('background-color', 'white');

  ctx = $('#chart-container').get(0).getContext('2d');

  myChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: chartOptions
  });

  // Hide the original table cuz it stupid
  //outputTableContainer.hide();

  // create an observer instance
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {

      newData = getTRData();

      data = updateGlobalData(data, newData, Date.now());

      myChart.update();

    });
  });

  // configuration of the observer:
  var config = {
    subtree: true,
    attributes: false,
    childList: true,
    characterData: true
  };

  // pass in the target node, as well as the observer optionsf oooo
  observer.observe(outputTableContainer.get(0), config);

});
