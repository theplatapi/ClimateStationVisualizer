require('cesium/Source/Widgets/widgets.css');

var _ = require('lodash');
var csvParser = require('csv-parse');
var d3 = require("d3");
var config = require('config');
var Cesium = getModules();

Cesium.BuildModuleUrl.setBaseUrl('./');
Cesium.BingMapsApi.defaultKey = config.bingMapsKey;

var viewer = new Cesium.Viewer('cesiumContainer', {
  targetFrameRate: 60,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  animation: false,
  timeline: false,
  infoBox: false,
  imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
    url: '//services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
    enablePickFeatures: false
  }),
  //Saves GPU memory
  scene3DOnly: true,
  automaticallyTrackDataSourceClocks: false
});

viewer.scene.debugShowFramesPerSecond = config.debugShowFramesPerSecond;
viewer.scene.screenSpaceCameraController.enableTranslate = false;
viewer.scene.screenSpaceCameraController.enableTilt = false;
viewer.scene.screenSpaceCameraController.enableLook = false;
viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
// viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100100;
// viewer.scene.screenSpaceCameraController.maximumZoomDistance = 160000000;
// viewer.scene.screenSpaceCameraController._minimumZoomRate = 50000;
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

viewer.imageryLayers.get(0).brightness = 0.7;

function mapGazes(gazes) {
  var fov = 1.0471975511965976;
  //TODO: Get aspect ratio
  //aspectRatio = canvas.clientWidth / canvas.clientHeight
  var aspectRatio = 1.5;
  var inRange = 0;
  var outRange = 0;

  _.chain(gazes)
    .filter(function (gaze) {
      return gaze.gazeX <= 0.5;
    })
    // .slice(0, 1000)
    .forEach(function (gaze) {
      //Create a camera with the x, y, and z provided. LookAt should be the same. (Camera rotation?)

      //The camera is defined by a position, orientation, and view frustum.

      var frustumHeight = 2 * gaze.cameraZ * Math.tan(fov * 0.5) / 111111;

      //TODO: More accurate meters->degrees calculation
      var frustum = {
        x: gaze.cameraX,
        y: gaze.cameraY,
        height: frustumHeight,
        width: frustumHeight * aspectRatio
      };

      // Convert gaze coordinates into longitude and latitude
      var gazeXMap = d3.scale.linear()
        .domain([0, 0.5])
        .range([frustum.x - frustum.width / 2, frustum.x + frustum.width / 2]);

      var gazeYMap = d3.scale.linear()
        .domain([0, 1])
        .range([frustum.y - frustum.height / 2, frustum.y + frustum.height / 2]);

      var gazeX = Cesium.CesiumMath.toDegrees(gazeXMap(gaze.gazeX));
      var gazeY = Cesium.CesiumMath.toDegrees(gazeYMap(gaze.gazeY));

      //Only plot if on globe
      if (gazeX >= -180 && gazeX <= 180 && gazeY >= -90 && gazeY <= 90) {
        viewer.entities.add({
          position: new Cesium.ConstantPositionProperty(Cesium.Cartesian3.fromDegrees(gazeX, gazeY)),
          point: new Cesium.PointGraphics({pixelSize: 4})
        });
        inRange++;
      }
      else {
        outRange++;
      }
    })
    .tap(function () {
      console.log("inRange", inRange);
      console.log("outRange", outRange);
    })
    .value();
}

//Load in CSV
//main
(function main() {
  asyncLoadCsv(config.gaze, function (gaze) {
    //Create Cesium elements?
    mapGazes(gaze);
  });
})();

//Using camera (x, y, z), map each gaze point appropriately. Gaze x is only between 0 and 0.5
function asyncLoadCsv(filename, cb) {
  fetch(filename)
    .then(function (response) {
      return response.text();
    })
    .then(function (data) {
      csvParser(data, {columns: true, auto_parse: true}, function (err, csv) {
        if (err) {
          throw err;
        }
        else {
          return cb(csv);
        }
      });
    })
    .catch(function (err) {
      console.log(filename, err)
    });
}

function getModules() {
  return {
    BuildModuleUrl: require('cesium/Source/Core/buildModuleUrl'),
    BingMapsApi: require('cesium/Source/Core/BingMapsApi'),
    ArcGisMapServerImageryProvider: require('cesium/Source/Scene/ArcGisMapServerImageryProvider'),
    Viewer: require('cesium/Source/Widgets/Viewer/Viewer'),
    ConstantPositionProperty: require('cesium/Source/DataSources/ConstantPositionProperty'),
    Cartesian3: require('cesium/Source/Core/Cartesian3'),
    ScreenSpaceEventType: require('cesium/Source/Core/ScreenSpaceEventType'),
    PointGraphics: require('cesium/Source/DataSources/PointGraphics'),
    CesiumMath: require('cesium/Source/Core/Math'),
  };
}
