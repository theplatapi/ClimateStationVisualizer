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

//Gives bounds for a point being on the facing side of the globe. Points go outside when user is looking at 
//space around the globe.
function getGlobeLimits(gaze) {
  //Linear translate into positive space, with smallest coordinate being (0, 0) rather than (-180, -90)
  var cameraTranslated = {x: gaze.camera.x + 180, y: gaze.camera.y + 90};
  var leftLimit = (cameraTranslated.x - 90) % 360;
  var rightLimit = (cameraTranslated.x + 90) % 360;
  var topLimit = (cameraTranslated.y + 45) % 180;
  var bottomLimit = (cameraTranslated.y - 45) % 180;

  //Translate back into cartographic space
  return {
    xMin: Math.min(leftLimit, rightLimit) - 180,
    xMax: Math.max(leftLimit, rightLimit) - 180,
    yMin: Math.min(topLimit, bottomLimit) - 90,
    yMax: Math.max(topLimit, bottomLimit) - 90
  }
}

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
    .map(function (gaze) {
      var frustumHeight = 2 * gaze.cameraZ * Math.tan(fov * 0.5) / 111111;

      //TODO: More accurate meters->degrees calculation
      var frustum = {
        x: gaze.cameraX,
        y: gaze.cameraY,
        height: frustumHeight,
        width: frustumHeight * aspectRatio
      };

      var gazeXMap = d3.scale.linear()
        .domain([0, 0.5])
        .range([frustum.x - frustum.width / 2, frustum.x + frustum.width / 2]);

      var gazeYMap = d3.scale.linear()
        .domain([0, 1])
        .range([frustum.y - frustum.height / 2, frustum.y + frustum.height / 2]);

      var gazeX = Cesium.CesiumMath.toDegrees(gazeXMap(gaze.gazeX));
      var gazeY = Cesium.CesiumMath.toDegrees(gazeYMap(gaze.gazeY));

      return {
        x: gazeX,
        y: gazeY,
        camera: {
          x: Cesium.CesiumMath.toDegrees(gaze.cameraX),
          y: Cesium.CesiumMath.toDegrees(gaze.cameraY),
          z: gaze.cameraZ
        }
      };
    })
    .filter(function (gaze) {
      var limits = getGlobeLimits(gaze);
      return gaze.x >= limits.xMin && gaze.x <= limits.xMax && gaze.y >= limits.yMin && gaze.y <= limits.yMax;
    })
    // .slice(100, 200)
    .forEach(function (gaze) {
      viewer.entities.add({
        position: new Cesium.ConstantPositionProperty(Cesium.Cartesian3.fromDegrees(gaze.x, gaze.y)),
        point: new Cesium.PointGraphics({pixelSize: 5})
      });

      viewer.entities.add({
        position: new Cesium.ConstantPositionProperty(Cesium.Cartesian3.fromDegrees(gaze.camera.x, gaze.camera.y, gaze.camera.z)),
        point: new Cesium.PointGraphics({pixelSize: 10})
      });

      // console.log('gaze', gaze);
    })
    // .throttle(10)
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
