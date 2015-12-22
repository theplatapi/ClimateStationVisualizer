var _ = require("lodash");
var $ = require("jquery");
var d3 = require("d3");

require('cesium/Source/Widgets/widgets.css');
require('./app.css');
var BuildModuleUrl = require('cesium/Source/Core/buildModuleUrl');
BuildModuleUrl.setBaseUrl('./');

//TODO: Make a helper function to return these as part of a Cesium object.
var BingMapsApi = require('cesium/Source/Core/BingMapsApi');
BingMapsApi.defaultKey = 'Anh2J2QWeD7JxG5eHciCS_h30xZoNrLr_4FPfC9lIdZHrgEdEIYJ9HimBay17BDv';
var Viewer = require('cesium/Source/Widgets/Viewer/Viewer');
var GeoJsonDataSource = require('cesium/Source/DataSources/GeoJsonDataSource');
var Clock = require('cesium/Source/Core/Clock');
var JulianDate = require('cesium/Source/Core/JulianDate');
var ClockRange = require('cesium/Source/Core/ClockRange');
//TODO: Fix warnings that this causes.
var ClockStep = require('cesium/Source/core/ClockStep');
var EntityCollection = require('cesium/Source/DataSources/EntityCollection');
var Color = require('cesium/Source/Core/Color');
var CallbackProperty = require('cesium/Source/DataSources/CallbackProperty');
var BoundingRectangle = require('cesium/Source/Core/BoundingRectangle');
var HorizontalOrigin = require('cesium/Source/Scene/HorizontalOrigin');
var VerticalOrigin = require('cesium/Source/Scene/VerticalOrigin');
var HeightReference = require('cesium/Source/Scene/HeightReference');
var NearFarScalar = require('cesium/Source/Core/NearFarScalar');

var viewer = new Viewer('cesiumContainer', {
  targetFrameRate: 60,
  homeButton: false,
  infoBox: true,
  sceneModePicker: false,
  navigationHelpButton: false,
  geocoder: false,
  baseLayerPicker: false,
  clock: new Clock({
    startTime: JulianDate.fromIso8601('1880-01-01'),
    currentTime: JulianDate.fromIso8601('1880-01-01'),
    stopTime: JulianDate.fromIso8601("2013-12-01"),
    clockRange: ClockRange.CLAMPED,
    canAnimate: false,
    shouldAnimate: false,
    clockStep: ClockStep.SYSTEM_CLOCK_MULTIPLIER,
    multiplier: 41472000
  })
});

viewer.scene.debugShowFramesPerSecond = true;
//TODO: Base on lowest, highest, and average for 1960s
var hexColorGenerator = d3.scale.linear().domain([-30, 20, 80]).range(['blue', 'red']);
var shapes = require('./lib/whiteShapes.png');

var stationColorScale = function stationColorScale(temperature) {
  var color = hexColorGenerator(temperature);
  var red = parseInt(color.substring(1, 3), 16);
  var green = parseInt(color.substring(3, 5), 16);
  var blue = parseInt(color.substring(5, 7), 16);

  return Color.fromBytes(red, green, blue);
};

var setStationAppearance = function (station) {
  var getColor = new CallbackProperty(function getColor(time, result) {
    return station.color.clone(result);
  }, false);

  var getHeight = new CallbackProperty(function getHeight() {
    return station.height;
  }, false);

  _.extend(station.billboard, {
    color: getColor,
    image: shapes,
    imageSubRegion: new BoundingRectangle(0, 0, 27, 27),
    horizontalOrigin: HorizontalOrigin.CENTER,
    verticalOrigin: VerticalOrigin.CENTER,
    height: getHeight,
    scaleByDistance: new NearFarScalar(1.5e3, 1.5, 3e7, 0.2)
  });
};

//TODO: Test if managing the billboard collection manually can improve things.
//If most billboards in a collection need to be updated, it may be more efficient to clear the collection with
//BillboardCollection#removeAll and add new billboards instead of modifying each one.

$.getJSON('./climateData/stationTemps.json', function loadTemperatures(stationTemperatures) {
  GeoJsonDataSource.load('./climateData/stationLocations.json').then(function loadStations(stationLocations) {
    var stations = stationLocations.entities.values;
    //Setting this to an arbitrary date so it can be compared in onClockTick on first pass
    var lastTime = new Date();

    for (var i = 0; i < stations.length; i++) {
      //Setting initial stations properties. These will be quickly overwritten bu onClockTick
      stations[i].color = Color.ALICEBLUE;
      stations[i].height = 0;
      setStationAppearance(stations[i]);
    }

    viewer.dataSources.add(stationLocations);

    //TODO: ~35% of the time spent here. Optimize!
    viewer.clock.onTick.addEventListener(function onClockTick(clock) {
      var timelineTime = JulianDate.toDate(clock.currentTime);

      if (timelineTime.getMonth() !== lastTime.getMonth() || timelineTime.getFullYear() !== lastTime.getFullYear()) {
        lastTime = timelineTime;

        for (var i = 0; i < stations.length; i++) {
          var stationId = stations[i]._properties.stationId;
          var temperature = _.get(stationTemperatures, [stationId, timelineTime.getFullYear(), timelineTime.getMonth() + 1]);

          if (temperature < 999) {
            stations[i].color = stationColorScale(temperature);
            stations[i].height = 25;
          }
          else {
            stations[i].height = 0;
          }
        }
      }
    });
  });
});