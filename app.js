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
var hexColorGenerator = d3.scale.linear().domain([-30, 20, 45]).range(['blue', 'orange', 'red']);
var circle = require('./lib/whiteShapes.png');

var stationColorScale = function stationColorScale(temperature, cesiumColor) {
  var color = hexColorGenerator(temperature);

  cesiumColor.red = parseInt(color.substring(1, 3), 16) / 255;
  cesiumColor.green = parseInt(color.substring(3, 5), 16) / 255;
  cesiumColor.blue = parseInt(color.substring(5, 7), 16) / 255;
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
    image: circle,
    verticalOrigin: Cesium.VerticalOrigin.CENTER,
    scaleByDistance: new Cesium.NearFarScalar(1.5e3, 1.5, 3e7, 0.2)
  });
};

$.getJSON('./climateData/stationTemps.json')
  .done(function loadTemperatures(stationTemperatures) {
    Cesium.GeoJsonDataSource.load('./climateData/stationLocations.json').then(function loadStations(stationLocations) {
      var stationEntity = stationLocations.entities.values;
      var timelineTime = new Cesium.GregorianDate();
      var lastTime = new Cesium.GregorianDate();

      for (var i = 0; i < stationEntity.length; i++) {
        //Setting initial stations properties. These will be quickly overwritten by onClockTick
        stationEntity[i].color = new Cesium.Color(0, 0, 0, 0);
        setStationAppearance(stationEntity[i]);
        stationEntity[i].selectable = false;
      }

      viewer.dataSources.add(stationLocations).then(function () {
        //TODO: ~35% of the time spent here. Optimize!
        viewer.clock.onTick.addEventListener(function onClockTick(clock) {
          if (_.get(viewer, 'selectedEntity.selectable') === false) {
            viewer._selectionIndicator.viewModel.showSelection = false;
            //viewer._infoBox.viewModel.showInfo = false;
          }
          else {
            viewer._selectionIndicator.viewModel.showSelection = true;
            //viewer._infoBox.viewModel.showInfo = true;
          }
          timelineTime = Cesium.JulianDate.toGregorianDate(clock.currentTime, timelineTime);

          if (timelineTime.month !== lastTime.month || timelineTime.year !== lastTime.year) {
            //Deep copy
            lastTime.year = timelineTime.year;
            lastTime.month = timelineTime.month;

            for (var i = 0; i < stationEntity.length; i++) {
              var stationId = stationEntity[i]._properties.stationId;
              var temperature = _.get(stationTemperatures, [stationId, timelineTime.year, timelineTime.month]);

              if (temperature < 999) {
                stationEntity[i].color = stationColorScale(temperature, stationEntity[i].color);
                stationEntity[i]._properties.temperature = temperature;
                stationEntity[i].selectable = true;
              }
              else {
                stationEntity[i].color.alpha = 0;
                stationEntity[i].selectable = false;
              }
            }
          }
        });
      });
    });
  })
  .fail(function (data, textStatus, error) {
    console.log('Failed loading temperatures: ' + textStatus + ' error: ' + error);
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
    Color: require('cesium/Source/Core/Color'),
    CallbackProperty: require('cesium/Source/DataSources/CallbackProperty'),
    VerticalOrigin: require('cesium/Source/Scene/VerticalOrigin'),
    NearFarScalar: require('cesium/Source/Core/NearFarScalar')
  };
}