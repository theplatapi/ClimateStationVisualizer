var $ = global.jQuery = require("jquery");

//Fix FOUC
$(document).ready(function () {
  $('body').show();
});

require('bootstrap-webpack');
require('./admin.css');
require("jquery-form");
require("toastr/build/toastr.min.css");
var toastr = require('toastr');

toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": true,
  "progressBar": false,
  "positionClass": "toast-top-right",
  "preventDuplicates": false,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
};

$('#send-config').on('submit', function () {
  $(this).ajaxSubmit(function (res) {
    if (res === 'fail') {
      toastr.error('No client connected. Did not send fps.');
    }
    else {
      toastr.success('Sent fps to client.');
    }
  });

  // return false to prevent normal browser submit and page navigation
  return false;
});