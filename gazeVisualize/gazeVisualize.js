require('cesium/Source/Widgets/widgets.css');

var Cesium = getModules();
var csvParser = require('csv-parse');
var config = require('config');

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

//Load in CSV

//Using camera (x, y, z), map each gaze point appropriately. Gaze x is only between 0 and 0.5
fetch(config.gaze)
  .then(function (response) {
    return csvParser(response);
  })
  .then(function (data) {
    console.log('DONE!');
  })
  .catch(function (err) {
    console.log(err)
  });


function getModules() {
  return {
    BuildModuleUrl: require('cesium/Source/Core/buildModuleUrl'),
    BingMapsApi: require('cesium/Source/Core/BingMapsApi'),
    ArcGisMapServerImageryProvider: require('cesium/Source/Scene/ArcGisMapServerImageryProvider'),
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
    CesiumMath: require('cesium/Source/Core/Math'),
    EntityCollection: require('cesium/Source/DataSources/EntityCollection'),
    Timeline: require('cesium/Source/Widgets/Timeline/Timeline'),
    GridMaterialProperty: require('cesium/Source/DataSources/GridMaterialProperty')
  };
}