require('cesium/Source/Widgets/widgets.css');

var Cesium = getModules();
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
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

viewer.imageryLayers.get(0).brightness = 0.7;

viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
  url : require('./fps5.png')
}));


function getModules() {
  return {
    BuildModuleUrl: require('cesium/Source/Core/buildModuleUrl'),
    BingMapsApi: require('cesium/Source/Core/BingMapsApi'),
    ArcGisMapServerImageryProvider: require('cesium/Source/Scene/ArcGisMapServerImageryProvider'),
    Viewer: require('cesium/Source/Widgets/Viewer/Viewer'),
    ScreenSpaceEventType: require('cesium/Source/Core/ScreenSpaceEventType'),
    SingleTileImageryProvider: require('cesium/Source/Scene/SingleTileImageryProvider')
  };
}
