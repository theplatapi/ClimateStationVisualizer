require('cesium/Source/Widgets/widgets.css');
require('./app.css');
require('./serverSend.js');

var _ = require("lodash");
var $ = require("jquery");
var d3 = require("d3");
var legend = require('d3-svg-legend/no-extend');
var ReconnectingWebSocket = require('reconnectingwebsocket');
var ws;
var log = require('loglevel');
var SpatialHash = require('./spatialHash.js');
var config = require('config');
var Cesium = getModules();
var dataLoaded = false;
var firstMessageLoaded = false;

Cesium.BuildModuleUrl.setBaseUrl('./');
Cesium.BingMapsApi.defaultKey = 'Anh2J2QWeD7JxG5eHciCS_h30xZoNrLr_4FPfC9lIdZHrgEdEIYJ9HimBay17BDv';

var viewer = new Cesium.Viewer('cesiumContainer', {
  targetFrameRate: 60,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  clock: new Cesium.Clock({
    startTime: Cesium.JulianDate.fromIso8601('1880-01-01T00:00:00Z'),
    currentTime: Cesium.JulianDate.fromIso8601('1880-01-01T00:00:00Z'),
    stopTime: Cesium.JulianDate.fromIso8601("2013-12-01T00:00:00Z"),
    clockRange: Cesium.ClockRange.CLAMPED,
    canAnimate: false,
    shouldAnimate: false,
    multiplier: 31557600 //Fast forward 1 year a second
  }),
  imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
    url: '//services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
    enablePickFeatures: false
  }),
  //Saves GPU memory
  scene3DOnly: true,
  automaticallyTrackDataSourceClocks: false
});

if (config.server) {
  ws = new ReconnectingWebSocket(location.origin.replace(/^http/, 'ws'));
  ws.onopen = function () {
    loglevelServerSend(log, {websocket: ws, prefix: ''});

    ws.onmessage = function (message) {
      if (dataLoaded && !firstMessageLoaded) {
        enableVisualization();
      }

      viewer.targetFrameRate = parseInt(message.data);
      firstMessageLoaded = true;
    };
  };
}

var selectedStations = new Cesium.EntityCollection();
var inFrustumStations = new Cesium.EntityCollection();
var selector;
var redraw = false;
var rectangleCoordinates = new Cesium.Rectangle();
var updateHistogram;
var updateHistogramThrottled;
var spatialHash;
var cameraMoving = false;

viewer.scene.debugShowFramesPerSecond = config.debugShowFramesPerSecond;
//disable camera movement on start
viewer.scene.screenSpaceCameraController.enableInputs = false;

//Disable some unneeded camera operations
viewer.scene.screenSpaceCameraController.enableTranslate = false;
viewer.scene.screenSpaceCameraController.enableTilt = false;
viewer.scene.screenSpaceCameraController.enableLook = false;
viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100100;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 160000000;
viewer.scene.screenSpaceCameraController._minimumZoomRate = 50000;
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
//Darken the earth so it's easier to see the stations
viewer.imageryLayers.get(0).brightness = 0.7;


//SECTION - source modifications
Cesium.Timeline.prototype.zoomTo = _.noop;
//Speed improvement -
//https://cesiumjs.org/Cesium/Build/Documentation/ArcGisMapServerImageryProvider.html?classFilter=ArcGisMapServerImageryProvider#hasAlphaChannel
Cesium.ArcGisMapServerImageryProvider.prototype.hasAlphaChannel = _.noop;

var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var gregorianDate = new Cesium.GregorianDate(0, 0, 0, 0, 0, 0, 0, false);
var dateFormatter = function (date) {
  gregorianDate = Cesium.JulianDate.toGregorianDate(date, gregorianDate);
  return monthNames[gregorianDate.month - 1] + ' ' + gregorianDate.year;
};

Cesium.Timeline.prototype.makeLabel = dateFormatter;
viewer.animation.viewModel.dateFormatter = dateFormatter;
viewer.animation.viewModel.timeFormatter = _.noop;

//SECTION - Color generation
//Redoes the D3 implementation so it doesn't return a string.
function interpolateHsl(a, b) {
  a = d3.hsl(a);
  b = d3.hsl(b);
  var ah = a.h,
    as = a.s,
    al = a.l,
    bh = b.h - ah,
    bs = b.s - as,
    bl = b.l - al;
  if (isNaN(bs)) bs = 0, as = isNaN(as) ? b.s : as;
  if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah;
  else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360; // shortest path
  return function (t) {
    return d3.hsl(ah + bh * t, as + bs * t, al + bl * t).rgb();
  };
}


var temperatureScale = d3.scale.linear()
  .domain([-40, -16, -4, 10, 25, 32, 40])
  .range(['#2c004d', '#4B0082', '#0000FF', '#FFFFFF', '#FF7F00', '#FF0000', '#990000']);
var hexColorGenerator = temperatureScale.interpolate(interpolateHsl);
var circle = require('./whiteShapes.png');

var stationColorScale = function stationColorScale(temperature, cesiumColor) {
  var color = hexColorGenerator(temperature);

  cesiumColor.red = color.r / 255;
  cesiumColor.green = color.g / 255;
  cesiumColor.blue = color.b / 255;

  return cesiumColor;
};

var setStationAppearance = function setStationAppearance(station) {
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

function populateGlobe(stationTemperatures, stationLocations) {
  var stationEntities = stationLocations.entities.values;
  var stationEntitiesLength = stationEntities.length;
  var timelineTime = new Cesium.GregorianDate(0, 0, 0, 0, 0, 0, 0, false);
  var lastTime = new Cesium.GregorianDate(0, 0, 0, 0, 0, 0, 0, false);
  var stationCartographic = new Cesium.Cartographic();
  var spatialSelector = {x: 0, y: 0, width: 0, height: 0};
  var throttledUpdateStations = _.throttle(updateVisibleStations, 250);
  var $infoBox = $('.cesium-viewer-infoBoxContainer');
  var infoboxHidden = false;

  for (var i = 0; i < stationEntitiesLength; i++) {
    //Setting initial stations properties. These will be quickly overwritten by onClockTick
    stationEntities[i].color = new Cesium.Color(1, 1, 1, 0.6);
    stationEntities[i].show = false;
    stationEntities[i].properties.station = stationEntities[i].properties.name;
    delete stationEntities[i].properties.name;
    setStationAppearance(stationEntities[i]);
  }

  viewer.dataSources.add(stationLocations);

  viewer.clock.onTick.addEventListener(function onClockTick(clock) {
    inFrustumStations.suspendEvents();
    timelineTime = Cesium.JulianDate.toGregorianDate(clock.currentTime, timelineTime);

    if (cameraMoving) {
      throttledUpdateStations(stationLocations, spatialSelector);
    }

    if (_.get(viewer, 'selectedEntity.selectable') === false) {
      $infoBox.hide();
      infoboxHidden = true;
    }
    else if (infoboxHidden) {
      $infoBox.show();
      infoboxHidden = false;
    }

    if (timelineTime.month !== lastTime.month || timelineTime.year !== lastTime.year || redraw) {
      //Deep copy
      lastTime.year = timelineTime.year;
      lastTime.month = timelineTime.month;
      redraw = false;
      //Stop the callbacks since we can be adding and removing a lot of items
      selectedStations.suspendEvents();

      for (var i = 0; i < inFrustumStations.values.length; i++) {
        var stationEntity = inFrustumStations.values[i];
        var stationId = stationEntity.properties.stationId;
        var temperature = stationTemperatures[stationId][timelineTime.year]
          && stationTemperatures[stationId][timelineTime.year][timelineTime.month];
        var wasShowing = stationEntity.show;

        if (temperature < 999) {
          stationEntity.color = stationColorScale(temperature, stationEntity.color);
          stationEntity.properties.temperature = temperature;
          stationEntity.show = true;

          //Add to the selection group if under selector
          if (selector.show && !wasShowing && stationSelected(stationEntity, rectangleCoordinates, stationCartographic)) {
            //Covers case where we zoom out of selection area
            if (!selectedStations.contains(stationEntity)) {
              selectedStations.add(stationEntity);
            }
          }
        }
        else {
          stationEntity.show = false;
          selectedStations.remove(stationEntity);
        }
      }

      //Done updating so we can fire the callbacks again
      selectedStations.resumeEvents();

      //Update the stations in case no entities were added or removed. Call is throttled so can't double call.
      if (selector.show) {
        updateHistogramThrottled(selectedStations);
      }

      //Updated selected temperature
      var selectedId = _.get(viewer, 'selectedEntity.properties.stationId');

      if (selectedId) {
        var selectedTemperature = stationTemperatures[selectedId][timelineTime.year][timelineTime.month];
        $infoBox.find('.cesium-infoBox-iframe').contents().find('tr:last td').text(selectedTemperature);
      }
    }
    inFrustumStations.resumeEvents();
  });
}

function setupEventListeners(stationLocations) {
  var stationEntities = stationLocations.entities.values;
  var stationEntitiesLength = stationEntities.length;
  var screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  var cartesian = new Cesium.Cartesian3();
  var scratchCartographic = new Cesium.Cartographic();
  var scratchJulian = new Cesium.JulianDate();
  var center = new Cesium.Cartographic();
  var firstPoint = new Cesium.Cartographic();
  var firstPointSet = false;
  var mouseDown = false;
  var camera = viewer.camera;

  //SECTION - Build spatial hash
  spatialHash = new SpatialHash(4);

  for (var i = 0; i < stationEntitiesLength; i++) {
    var position = Cesium.Cartographic.fromCartesian(stationEntities[i]._position._value);
    var entry = {
      x: convertLongitude(position.longitude),
      y: convertLatitude(position.latitude),
      width: 30 / 111111, //30 meters
      height: 30 / 111111,
      id: stationEntities[i].id
    };

    spatialHash.insert(entry);
  }

  var spatialSelector = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  //SECTION - keyboard and mouse listeners
  $(document).on('keydown', function onKeydown(event) {
    if (event.keyCode === 32 && event.target.type !== 'search') {
      viewer.clock.shouldAnimate = !viewer.clock.shouldAnimate;
    }
  });

  //Draw the selector while the user drags the mouse while holding shift
  screenSpaceEventHandler.setInputAction(function drawSelector(movement) {
    if (!mouseDown) {
      return;
    }

    cartesian = camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid, cartesian);

    if (cartesian) {
      //mouse cartographic
      scratchCartographic = Cesium.Cartographic.fromCartesian(cartesian, Cesium.Ellipsoid.WGS84, scratchCartographic);

      if (!firstPointSet) {
        Cesium.Cartographic.clone(scratchCartographic, firstPoint);
        firstPointSet = true;
      }
      else {
        rectangleCoordinates.east = Math.max(scratchCartographic.longitude, firstPoint.longitude);
        rectangleCoordinates.west = Math.min(scratchCartographic.longitude, firstPoint.longitude);
        rectangleCoordinates.north = Math.max(scratchCartographic.latitude, firstPoint.latitude);
        rectangleCoordinates.south = Math.min(scratchCartographic.latitude, firstPoint.latitude);

        //Don't draw if rectangle has 0 size. Will cause Cesium to throw an error.
        selector.show = rectangleCoordinates.east !== rectangleCoordinates.west || rectangleCoordinates.north !== rectangleCoordinates.south;
        //Suspending and resuming events during batch update
        selectedStations.suspendEvents();
        selectedStations.removeAll();

        //Get stations under selector
        center = Cesium.Rectangle.center(rectangleCoordinates, center);
        spatialSelector.x = convertLongitude(center.longitude);
        spatialSelector.y = convertLatitude(center.latitude);
        spatialSelector.width = convertLongitude(rectangleCoordinates.width) - 1800;
        spatialSelector.height = convertLatitude(rectangleCoordinates.height) - 900;
        var selectedItems = _.map(spatialHash.retrieve(spatialSelector), 'id');

        for (var i = 0; i < selectedItems.length; i++) {
          var stationEntity = stationLocations.entities.getById(selectedItems[i]);

          if (stationEntity.show && !selectedStations.contains(stationEntity)
            && stationSelected(stationEntity, rectangleCoordinates, scratchCartographic)) {
            selectedStations.add(stationEntity);
          }
        }

        selectedStations.resumeEvents();
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);

  screenSpaceEventHandler.setInputAction(function startClickShift() {
    mouseDown = true;
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.SHIFT);

  screenSpaceEventHandler.setInputAction(function endClickShift() {
    mouseDown = false;
    firstPointSet = false;
  }, Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.SHIFT);

  //Hide the selector by clicking anywhere
  screenSpaceEventHandler.setInputAction(function hideSelector() {
    selector.show = false;
    selectedStations.removeAll();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  var getSelectorLocation = new Cesium.CallbackProperty(function getSelectorLocation(time, result) {
    return Cesium.Rectangle.clone(rectangleCoordinates, result);
  }, false);

  var getSelectorHeight = new Cesium.CallbackProperty(function getSelectorHeight() {
    return Cesium.CesiumMath.clamp(camera._positionCartographic.height - 3500000, 0, 100000);
  }, false);

  var selectorRectangle = {
    coordinates: getSelectorLocation,
    height: getSelectorHeight
  };

  if (config.fancySelector) {
    _.extend(selectorRectangle, {
      material: new Cesium.GridMaterialProperty()
    })
  }
  else {
    _.extend(selectorRectangle, {
      fill: false,
      outline: true,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 3
    })
  }

  selector = viewer.entities.add({
    selectable: false,
    show: false,
    rectangle: selectorRectangle
  });

  updateHistogramThrottled = _.throttle(function (collection) {
    updateHistogram(_.map(collection.values, 'properties.temperature'));
  }, 200);

  //SECTION - bridge between selector and histogram
  //Update histogram of temperatures whenever an item is added or removed from selection
  selectedStations.collectionChanged.addEventListener(function selectedStationsChanged(collection) {
    updateHistogramThrottled(collection);
  });

  var cameraPositionLog;
  var previousLogged;

  //SECTION - camera movement callbacks
  camera.moveStart.addEventListener(function () {
    cameraMoving = true;
    if (config.server) {
      cameraPositionLog = setInterval(function () {
        if (!Cesium.Cartographic.equals(previousLogged, camera.positionCartographic)) {
          log.info(camera.positionCartographic);
          previousLogged = Cesium.Cartographic.clone(camera.positionCartographic, scratchCartographic);
        }
      }, 200);
    }
  });

  camera.moveEnd.addEventListener(function () {
    cameraMoving = false;
    if (config.server) {
      clearInterval(cameraPositionLog);
    }
  });

  //SECTION - timeline callbacks
  $('.cesium-viewer-timelineContainer')
    .on('mousemove', function (e) {
      var timelineX = e.pageX - viewer.timeline._topDiv.getBoundingClientRect().left;
      var hoverSeconds = timelineX * viewer.timeline._timeBarSecondsSpan / viewer.timeline._topDiv.clientWidth;

      $('#timeline-tooltip')
        .fadeIn(200)
        .text(dateFormatter(Cesium.JulianDate.addSeconds(viewer.timeline._startJulian, hoverSeconds, scratchJulian)))
        .css({left: Math.min(e.pageX, viewer.scene.canvas.width - 35) - 35});
    })
    .on('mouseleave', function () {
      $('#timeline-tooltip').fadeOut(200);
    });

  //Initial drawing of points
  updateVisibleStations(stationLocations, spatialSelector);
}

function updateVisibleStations(stationLocations, spatialSelector) {
  inFrustumStations.suspendEvents();
  //Get the frustum height in degrees
  var frustumHeight = 2 * viewer.camera.positionCartographic.height * Math.tan(viewer.camera.frustum.fov * 0.5) / 111111;
  var frustumWidth = frustumHeight * Math.max(viewer.camera.frustum.aspectRatio, 1.5);

  spatialSelector.x = convertLongitude(viewer.camera.positionCartographic.longitude);
  spatialSelector.y = convertLatitude(viewer.camera.positionCartographic.latitude);
  spatialSelector.width = Cesium.CesiumMath.clamp(Math.round(frustumWidth) * 10, 0, 1800);
  spatialSelector.height = Cesium.CesiumMath.clamp(Math.round(frustumHeight) * 10, 0, 900);

  var selectedIds = spatialHash.retrieve(spatialSelector);
  var secondarySelectedIds;

  //Handles frustum crossing anti-meridian
  var remainingLeft = (spatialSelector.width - spatialSelector.x * 2) / 2;
  var remainingRight = (spatialSelector.width - ((3600 - spatialSelector.x) * 2)) / 2;

  if (remainingLeft > 0) {
    spatialSelector.width = remainingLeft;
    spatialSelector.x = 3600 - remainingLeft / 2;
    secondarySelectedIds = spatialHash.retrieve(spatialSelector);
  }
  else if (remainingRight > 0) {
    spatialSelector.width = remainingRight;
    spatialSelector.x = remainingRight / 2;
    secondarySelectedIds = spatialHash.retrieve(spatialSelector);
  }

  inFrustumStations.removeAll();

  //Add visible stations to designated entity collection and hide all other entities
  var inFrustum = _.chain(selectedIds)
    .unionBy(secondarySelectedIds, 'id')
    .map(function (selected) {
      return inFrustumStations.add(stationLocations.entities.getById(selected.id)).id;
    })
    .value();

  _.chain(spatialHash.list)
    .map('id')
    .difference(inFrustum)
    .map(function (id) {
      stationLocations.entities.getById(id).show = false;
    })
    .value();

  inFrustumStations.resumeEvents();
  redraw = true;
}

function convertLongitude(longitude) {
  return Math.round((Cesium.CesiumMath.toDegrees(longitude) + 180) * 10);
}

function convertLatitude(latitude) {
  return Math.round((Cesium.CesiumMath.toDegrees(latitude) + 90) * 10);
}

//TODO: Make updateHistogram closure env smaller
function createHistogram() {
  var margin = {top: 10, right: 30, bottom: 40, left: 55};
  var width = 300 - margin.left - margin.right;
  var height = 200 - margin.top - margin.bottom;
  var transitionSpeed = 150;

  var svg = d3.select("#histogram")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scale.linear()
    .domain([-20, 40])
    .range([0, width]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .ticks(5)
    .orient("bottom");

  //Temporary to create bars
  var histogramFunc = d3.layout.histogram()
    .bins(x.ticks(5));
  var tempHistogram = histogramFunc(d3.range(10).map(d3.random.bates(10)));
  var numBins = tempHistogram.length;

  var toggleFps = function (fps) {
    var ease = d3.ease('linear');
    var latencyMs = 1 / fps;
    var calculatedEase = 0;
    var previousTime = 0;

    return function (t) {
      var delta = t - previousTime;

      if (delta >= latencyMs || t >= 1) {
        calculatedEase = ease(t);
        previousTime = t;
      }

      return calculatedEase;
    };
  };

  //Create elements, but with no data
  svg.selectAll(".bar")
    .data(tempHistogram)
    .enter().append("g")
    .attr("class", "bar")
    .append("rect")
    .attr("x", 1)
    .attr("width", width / numBins - 1);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis");

  svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width / 2 + 40)
    .attr("y", height + margin.bottom - 5)
    .text("Temperature (°C)");

  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -margin.left)
    .attr("x", -height / 10)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Selected Weather Stations");

  updateHistogram = function updateHistogram(temperatures) {
    var histogram = histogramFunc(temperatures);

    var y = d3.scale.linear()
      .domain([0, d3.max(histogram, function getMax(d) {
        return d.y;
      })])
      .range([height, 0]);

    var yAxis = d3.svg.axis()
      .scale(y)
      .ticks(5)
      .outerTickSize(0)
      .orient("left");

    //Update the SVG elements
    svg.selectAll(".bar")
      .data(histogram)
      .transition()
      .duration(transitionSpeed)
      .ease(toggleFps(viewer.targetFrameRate))
      .attr("transform", function transformBar(d) {
        return "translate(" + x(d.x).toFixed(4) + "," + y(d.y) + ")";
      });

    svg.selectAll("rect")
      .data(histogram)
      .transition()
      .duration(transitionSpeed)
      .ease(toggleFps(viewer.targetFrameRate))
      .attr("height", function rectHeight(d) {
        return height - y(d.y);
      });

    svg.select(".y.axis")
      .transition()
      .duration(transitionSpeed)
      .ease(toggleFps(viewer.targetFrameRate))
      .call(yAxis);
  }
}

function createLegend() {
  var margin = {top: 20, right: 10, bottom: 10, left: 10};
  var width = 90 - margin.left - margin.right;
  var height = 140 - margin.top - margin.bottom;

  var svg = d3.select("#legend")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("text")
    .attr("class", "legend label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", -5)
    .text("Temperature (°C)");

  svg.append("g")
    .attr("class", "legendLinear");

  var legendLinear = legend.color()
    .shapeWidth(30)
    .cells([40, 30, 20, 10, 0, -10, -20])
    .scale(temperatureScale);

  svg.select(".legendLinear")
    .call(legendLinear);
}

function stationSelected(station, rectangleSelector, stationCartographic) {
  stationCartographic = Cesium.Cartographic.fromCartesian(station._position._value, Cesium.Ellipsoid.WGS84, stationCartographic);

  return stationCartographic.longitude >= rectangleSelector.west && stationCartographic.longitude <= rectangleSelector.east
    && stationCartographic.latitude <= rectangleSelector.north && stationCartographic.latitude >= rectangleSelector.south;
}

function enableVisualization() {
  $('#loadingData').show().delay(1000).fadeOut();
  $('.cesium-viewer-bottom').show().delay(1000).fadeOut();
  viewer.scene.screenSpaceCameraController.enableInputs = true;
}

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

//main
(function main() {
  asyncLoadJson(config.temperatures, function (stationTemperatures) {
    asyncLoadJson(config.locations, function (stationLocationsGeoJson) {
      Cesium.GeoJsonDataSource.load(stationLocationsGeoJson).then(function loadStations(stationLocations) {
        createHistogram();
        createLegend();
        populateGlobe(stationTemperatures, stationLocations);
        setupEventListeners(stationLocations);
        dataLoaded = true;

        if (firstMessageLoaded || !config.server) {
          enableVisualization();
        }
      });
    });
  });
})();

function asyncLoadJson(filename, cb) {
  fetch(filename)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      return cb(data);
    })
    .catch(function (err) {
      console.log(filename, err)
    });
}