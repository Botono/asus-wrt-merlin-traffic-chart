'use strict';

console.log('Dis is my content scrip');

function getTRData() {
  var returnObj = {};

  $('table.FormTable_NWM tr').not('.traffictable').not('.traffictable_footer').children().not('th').each(function(){
    console.log($(this).text()); // YES
  });
}

$(function() {
  var outputTableContainer = $('#bwm-details-grid').get(0);
  var outputTable = $('table.FormTable_NWM');
  var outputTableRows = $('table.FormTable_NWM tr').not('.traffictable').not('.traffictable_footer');
  var theData = {};


  // create an observer instance
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      getTRData();
    });
  });

  // configuration of the observer:
  var config = { subtree: true, attributes: false, childList: true, characterData: true };

  // pass in the target node, as well as the observer optionsf oooo
  observer.observe(outputTableContainer, config);

});
