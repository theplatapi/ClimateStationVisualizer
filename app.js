var _ = require("lodash");
var $ = require("jquery");
var d3 = require("d3");

require('cesium/Source/Widgets/widgets.css');
var BuildModuleUrl = require('cesium/Source/Core/buildModuleUrl');
BuildModuleUrl.setBaseUrl('./');

var BingMapsApi = require('cesium/Source/Core/BingMapsApi');
BingMapsApi.defaultKey = 'Anh2J2QWeD7JxG5eHciCS_h30xZoNrLr_4FPfC9lIdZHrgEdEIYJ9HimBay17BDv';
var Viewer = require('cesium/Source/Widgets/Viewer/Viewer');
var GeoJsonDataSource = require('cesium/Source/DataSources/GeoJsonDataSource');
var Clock = require('cesium/Source/Core/Clock');
var JulianDate = require('cesium/Source/Core/JulianDate');
var ClockRange = require('cesium/Source/Core/ClockRange');
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

GeoJsonDataSource.load('./climateData/stationLocations.json').then(function (stationLocations) {
  var stationColorScale = d3.scale.linear().domain([-10, 20, 60]).range(['blue', 'red']);

  $.getJSON('./climateData/stationTemps.json', function (stationTemperatures) {
    var opaque = new Color(0, 0, 0, 0.1);
    var shapes = require('./lib/whiteShapes.png');

    var setStationColor = function (station) {
      var getColor = new CallbackProperty(function (time, result) {
        return station.color.clone(result);
      }, false);

      var getHeight = new CallbackProperty(function () {
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

    var stations = stationLocations.entities.values;

    for (var i = 0; i < stations.length; i++) {
      stations[i].color = opaque;
      stations[i].height = 25;
      setStationColor(stations[i]);
    }

    viewer.dataSources.add(stationLocations);

    viewer.clock.onTick.addEventListener(function (clock) {
      var timelineTime = JulianDate.toDate(clock.currentTime);

      for (var i = 0; i < stations.length; i++) {
        var stationId = stations[i]._properties.stationId;
        var temperature = _.get(stationTemperatures, [stationId, timelineTime.getFullYear(), timelineTime.getMonth() + 1]);

        if (temperature && temperature < 999) {
          stations[i].color = Color.fromCssColorString(stationColorScale(temperature));
          stations[i].height = 25;
        }
        else {
          stations[i].height = 0;
        }
      }
    });
  });
});