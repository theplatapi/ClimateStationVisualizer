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
//Disable some unneeded camera operations
viewer.scene.screenSpaceCameraController.enableTranslate = false;
viewer.scene.screenSpaceCameraController.enableTilt = false;
viewer.scene.screenSpaceCameraController.enableLook = false;


//TODO: Base on lowest, highest, and average for 1960s
//TODO: Create a memory friendly version that doesn't rely on strings
var hexColorGenerator = d3.scale.linear().domain([-30, 20, 45]).range(['blue', 'orange', 'red']);
var circle = require('./lib/whiteShapes.png');

var stationColorScale = function stationColorScale(temperature, cesiumColor) {
  var color = hexColorGenerator(temperature);

  cesiumColor.red = parseInt(color.substring(1, 3), 16) / 255;
  cesiumColor.green = parseInt(color.substring(3, 5), 16) / 255;
  cesiumColor.blue = parseInt(color.substring(5, 7), 16) / 255;

  //cesiumColor.red = temperature % 255;
  //cesiumColor.green = Math.random();
  //cesiumColor.blue = Math.random();

  return cesiumColor;
};

var setStationAppearance = function (station) {
  var getColor = new Cesium.CallbackProperty(function getColor(time, result) {
    result.red = station.color.red;
    result.green = station.color.green;
    result.blue = station.color.blue;

    return result;
  }, false);

  _.extend(station.billboard, {
    color: getColor,
    image: circle,
    verticalOrigin: Cesium.VerticalOrigin.CENTER,
    scaleByDistance: new Cesium.NearFarScalar(1.5e3, 1.5, 3e7, 0.2)
  });
};

function populateGlobe(stationTemperatures, stationLocations) {
  var stationEntities = stationLocations.entities.values;
  var stationEntitiesLength = stationEntities.length;
  var timelineTime = new Cesium.GregorianDate(0, 0, 0, 0, 0, 0, 0, false);
  var lastTime = new Cesium.GregorianDate(0, 0, 0, 0, 0, 0, 0, false);
  var $infoBox = $('.cesium-viewer-infoBoxContainer');

  for (var i = 0; i < stationEntitiesLength; i++) {
    //Setting initial stations properties. These will be quickly overwritten by onClockTick
    stationEntities[i].color = new Cesium.Color(1, 1, 1, 1);
    stationEntities[i].selectable = false;
    setStationAppearance(stationEntities[i]);
  }

  viewer.dataSources.add(stationLocations);

  viewer.clock.onTick.addEventListener(function onClockTick(clock) {
    if (_.get(viewer, 'selectedEntity.selectable') === false) {
      $infoBox.fadeOut();
    }
    else {
      $infoBox.fadeIn();
    }
    timelineTime = Cesium.JulianDate.toGregorianDate(clock.currentTime, timelineTime);

    if (timelineTime.month !== lastTime.month || timelineTime.year !== lastTime.year) {
      //Deep copy
      lastTime.year = timelineTime.year;
      lastTime.month = timelineTime.month;

      for (var i = 0; i < stationEntitiesLength; i++) {
        var stationId = stationEntities[i]._properties.stationId;
        var temperature = _.get(stationTemperatures, [stationId, timelineTime.year, timelineTime.month]);

        if (temperature < 999) {
          stationEntities[i].color = stationColorScale(temperature, stationEntities[i].color);
          stationEntities[i]._properties.temperature = temperature;
          stationEntities[i].show = true;
          stationEntities[i].selectable = true;
        }
        else {
          stationEntities[i].selectable = false;
          stationEntities[i].show = false;
        }
      }
    }
  });
}

function setupEventListeners() {
  var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  var rectangleSelector = new Cesium.Rectangle(0, 0, .1, .1);
  var cartesian = new Cesium.Cartesian3();
  var cartographic = new Cesium.Cartographic();
  var firstPoint = new Cesium.Cartographic(-0.1, -0.1);
  var firstPointSet = false;
  var mouseDown = false;

  $(document).on('keydown', function onKeydown(event) {
    if (event.keyCode === 32) {
      viewer.clock.shouldAnimate = !viewer.clock.shouldAnimate;
    }
  });

  handler.setInputAction(function (movement) {
    if (!mouseDown || !movement) {
      return;
    }

    cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid, cartesian);
    cartographic = Cesium.Cartographic.fromCartesian(cartesian, Cesium.Ellipsoid.WGS84, cartographic);

    if (!firstPointSet) {
      Cesium.Cartographic.clone(cartographic, firstPoint);
      firstPointSet = true;
    }
    else {
      rectangleSelector.east = Math.max(cartographic.longitude, firstPoint.longitude);
      rectangleSelector.west = Math.min(cartographic.longitude, firstPoint.longitude);
      rectangleSelector.north = Math.max(cartographic.latitude, firstPoint.latitude);
      rectangleSelector.south = Math.min(cartographic.latitude, firstPoint.latitude);
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);

  handler.setInputAction(function () {
    mouseDown = true;
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);

  handler.setInputAction(function () {
    mouseDown = false;
    firstPointSet = false;
  }, Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.SHIFT);


  var getSelectorLocation = new Cesium.CallbackProperty(function getSelectorLocation(time, result) {
    return Cesium.Rectangle.clone(rectangleSelector, result);
  }, false);


  viewer.entities.add({
    name: 'Selection Region',
    selectable: false,
    rectangle: {
      coordinates: getSelectorLocation,
      material: Cesium.Color.BLACK.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.BLACK
    }
  });
}

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
    NearFarScalar: require('cesium/Source/Core/NearFarScalar'),
    Rectangle: require('cesium/Source/Core/Rectangle'),
    ScreenSpaceEventHandler: require('cesium/Source/Core/ScreenSpaceEventHandler'),
    ScreenSpaceEventType: require('cesium/Source/Core/ScreenSpaceEventType'),
    KeyboardEventModifier: require('cesium/Source/Core/KeyboardEventModifier'),
    Cartesian3: require('cesium/Source/Core/Cartesian3'),
    Cartographic: require('cesium/Source/Core/Cartographic'),
    Ellipsoid: require('cesium/Source/Core/Ellipsoid'),
    Math: require('cesium/Source/Core/Math')
  };
}

//main
(function () {
  $.when($.getJSON('./climateData/stationTemps.json'), $.getJSON('./climateData/stationLocations.json'))
    .done(function (stationTemperatures, stationLocationsGeoJson) {
      Cesium.GeoJsonDataSource.load(stationLocationsGeoJson[0]).then(function loadStations(stationLocations) {
        populateGlobe(stationTemperatures[0], stationLocations);
        setupEventListeners();
      });
    })
    .fail(function (data, textStatus, error) {
      console.log('Failed loading data: ' + textStatus + ' ' + error);
    })
})();