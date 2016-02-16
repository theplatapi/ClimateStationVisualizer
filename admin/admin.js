global.jQuery = require("jquery");
require('bootstrap-webpack');
require("jquery-form");
require('./admin.css');

var $ = global.jQuery;

$('#send-config').on('submit', function () {
  $(this).ajaxSubmit();

  // return false to prevent normal browser submit and page navigation
  return false;
});