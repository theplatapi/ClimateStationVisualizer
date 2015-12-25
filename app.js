require('cesium/Source/Widgets/widgets.css');
require('./app.css');

var _ = require("lodash");
var $ = require("jquery");
var d3 = require("d3");
var Cesium = getModules();

Cesium.BuildModuleUrl.setBaseUrl('./');
Cesium.BingMapsApi.defaultKey = 'Anh2J2QWeD7JxG5eHciCS_h30xZoNrLr_4FPfC9lIdZHrgEdEIYJ9HimBay17BDv';

var viewer = new Cesium.Viewer('cesiumContainer', {
  targetFrameRate: 60,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  baseLayerPicker: false,
  clock: new Cesium.Clock({
    startTime: Cesium.JulianDate.fromIso8601('1880-01-01'),
    currentTime: Cesium.JulianDate.fromIso8601('1880-01-01'),
    stopTime: Cesium.JulianDate.fromIso8601("2013-12-01"),
    clockRange: Cesium.ClockRange.CLAMPED,
    canAnimate: false,
    shouldAnimate: false,
    multiplier: 41472000
  })
});

viewer.scene.debugShowFramesPerSecond = true;
//TODO: Base on lowest, highest, and average for 1960s
var hexColorGenerator = d3.scale.linear().domain([-30, 20, 80]).range(['blue', 'red']);
var shapes = require('./lib/whiteShapes.png');

var stationColorScale = function stationColorScale(temperature, cesiumColor) {
  var color = hexColorGenerator(temperature);
  var red = parseInt(color.substring(1, 3), 16) / 255;
  var green = parseInt(color.substring(3, 5), 16) / 255;
  var blue = parseInt(color.substring(5, 7), 16) / 255;

  cesiumColor.red = red;
  cesiumColor.green = green;
  cesiumColor.blue = blue;
  cesiumColor.alpha = 1;

  return cesiumColor;
};

var setStationAppearance = function (station) {
  var getColor = new Cesium.CallbackProperty(function getColor(time, result) {
    result.red = station.color.red;
    result.green = station.color.green;
    result.blue = station.color.blue;
    result.alpha = station.color.alpha;

    return result;
  }, false);

  _.extend(station.billboard, {
    color: getColor,
    image: shapes,
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    verticalOrigin: Cesium.VerticalOrigin.CENTER,
    scaleByDistance: new Cesium.NearFarScalar(1.5e3, 1.5, 3e7, 0.2)
  });
};

$.getJSON('./climateData/stationTemps.json')
  .done(function loadTemperatures(stationTemperatures) {
    Cesium.GeoJsonDataSource.load('./climateData/stationLocations.json').then(function loadStations(stationLocations) {
      var stations = stationLocations.entities.values;
      //Setting this to an arbitrary date so it can be compared in onClockTick on first pass
      var timelineTime = new Cesium.GregorianDate();
      var lastTime = new Cesium.GregorianDate();

      for (var i = 0; i < stations.length; i++) {
        //Setting initial stations properties. These will be quickly overwritten by onClockTick
        stations[i].color = new Cesium.Color(0, 0, 0, 0);
        setStationAppearance(stations[i]);
      }

      viewer.dataSources.add(stationLocations);

      //TODO: ~35% of the time spent here. Optimize!
      viewer.clock.onTick.addEventListener(function onClockTick(clock) {
        timelineTime = Cesium.JulianDate.toGregorianDate(clock.currentTime, timelineTime);

        if (timelineTime.month !== lastTime.month || timelineTime.year !== lastTime.year) {
          //Deep copy
          lastTime.year = timelineTime.year;
          lastTime.month = timelineTime.month;

          for (var i = 0; i < stations.length; i++) {
            var stationId = stations[i]._properties.stationId;
            var temperature = _.get(stationTemperatures, [stationId, timelineTime.year, timelineTime.month]);

            if (temperature < 999) {
              stations[i].color = stationColorScale(temperature, stations[i].color);
            }
            else {
              stations[i].color.alpha = 0;
            }
          }
        }
      });
    });
  })
  .fail(function (data, textStatus, error) {
    console.log('Failed loading temperatures: ' + textStatus + ' error: ' +  error);
  });

//plays/pauses the animation on spacebar press
$(document).keydown(function onKeydown(event) {
  if (event.keyCode === 32) {
    viewer.clock.shouldAnimate = !viewer.clock.shouldAnimate;
  }
});

function getModules() {
  return {
    BuildModuleUrl: require('cesium/Source/Core/buildModuleUrl'),
    BingMapsApi: require('cesium/Source/Core/BingMapsApi'),
    Viewer: require('cesium/Source/Widgets/Viewer/Viewer'),
    GeoJsonDataSource: require('cesium/Source/DataSources/GeoJsonDataSource'),
    Clock: require('cesium/Source/Core/Clock'),
    JulianDate: require('cesium/Source/Core/JulianDate'),
    GregorianDate: require('cesium/Source/Core/GregorianDate'),
    ClockRange: require('cesium/Source/Core/ClockRange'),
    EntityCollection: require('cesium/Source/DataSources/EntityCollection'),
    Color: require('cesium/Source/Core/Color'),
    CallbackProperty: require('cesium/Source/DataSources/CallbackProperty'),
    BoundingRectangle: require('cesium/Source/Core/BoundingRectangle'),
    HorizontalOrigin: require('cesium/Source/Scene/HorizontalOrigin'),
    VerticalOrigin: require('cesium/Source/Scene/VerticalOrigin'),
    NearFarScalar: require('cesium/Source/Core/NearFarScalar')
  };
}