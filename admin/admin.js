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

//TODO: For one time fields, make button green to show we already submitted.
$('#send-config').on('submit', function () {
  $(this).ajaxSubmit({
    success: function (res) {
      if (res === 'fail') {
        toastr.error('No client connected. Did not send fps.');
      }
      else {
        toastr.success('Sent fps to client.');
      }
    },
    error: function (e) {
      toastr.error('Server Error', e);
    }
  });

  // return false to prevent normal browser submit and page navigation
  return false;
});

$('#send-log-name').on('submit', function () {
  $(this).ajaxSubmit({
    success: function (res) {
      if (res === 'fail') {
        toastr.error('Failed to set log name.');
      }
      else {
        toastr.success('Set log name.');
      }
    },
    error: function (e) {
      toastr.error('Server Error', e);
    }
  });


  // return false to prevent normal browser submit and page navigation
  return false;
});

$('#set-ngrok-port').on('submit', function () {
  $(this).ajaxSubmit({
    success: function () {
      toastr.success('Set port.');
    },
    error: function (e) {
      toastr.error('Server Error', e);
    }
  });


  // return false to prevent normal browser submit and page navigation
  return false;
});

$('#set-experiment-end').on('submit', function () {
  $(this).ajaxSubmit({
    success: function () {
      toastr.success('Experiment ended.');
    },
    error: function (e) {
      toastr.error('Server Error', e);
    }
  });


  // return false to prevent normal browser submit and page navigation
  return false;
});