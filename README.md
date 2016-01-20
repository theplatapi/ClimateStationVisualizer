#Climate Station Visualizer

##Tasks to complete
1) [x] Get Cesium with webpack set up.
      [x] Use minimized builds and compare
2) [x] Get conversation from Julian -> Gregorian time working
3) [x] Have colors change on scale depending on temperature
      * Only show items that are currently visible
      * Change colors on blue to red scale
4) [x] Have time range set to full width on default
5) [x] Get temperatures showing for all months
6) [] Skip by month
      * [x] Make time speed optimal to see changes in data
      * [] Change to better skybox that isn't so dizzy
7) [x] Use circles for stations to speed up adding/removing
8) [x] Performance v1
      [x] Profile while time is marching
      [x] Profile while visualization is paused
      [x] Optimize station modification times
      [x] Test removing and re-adding billboards on property changes.
9) [] Add selection data
      [x] Current temperature
      [x] City
      [x] Country
      [] Station Name
      [x] Hide info box title
      [x] Improve look of side panel from colors to animation
      [x] Disable selection of invisible stations
      [] Fix new stations sometimes not appearing
         * If timeline is started from pause, and then scrubbed no new stations
            become visible
      [] Add location info for stations missing it
         [x] Rerun geolocator to generate file of missing stations
         [] Add 100+ missing stations
10) [x] Add brushing and linking
      [x] Draw a shape to represent the selection
         [x] Draw a rectangle
      [x] Have shape variable depending on mouse click and drag
      [x] Output info about visible stations under the selection shape
         [x] 1st impl: Loop through all points checking for visibility
         [x] Incrementally update selected set while time is ticking
         [x] Show a sample histogram
         [x] Profile it
         [x] Entity collection of non-culled stations
      [x] Show a histogram of the temperatures from selected stations
      [x] Update the histogram as time progresses
11) [] Add a spatial data structure
       [x] Add a spatial hash, and query it with the view frustum.
       [] Spatial hash
           * https://github.com/timohausmann/quadtree-js/
           [x] Convert cartographic with one decimal place to positive x, y
               * Longitude (x) -180.0 to 180.0. ((x + 180) * 10)
               * Latitude (y) -90.0 to 90.0.    ((y + 90) * 10)
           [] Figure out what to do at "end" of grid. Area near Japan/Alaska where 120 longitude is. 2 queries?
              [x] Handle crossing to left
              [] Handle crossing to right
       [] Query it as the camera moves
          [] Don't do it every frame. Figure out good move delta to do queries.
          [] Initialize delta high so it does initial render
       [] Use spatial hash for selector
12) [] Find memory leak
        [] Test cesium no additions, running
        [] Test cesium no additions, running at our speed
        [] Slowly add features on and see when the memory leak starts

        Ideas:
        [] See if SVG time element is cause for node leaks
        [] See if entity.show=false makes Cesium allocate a new "node"
        [] See if D3 color strings are the cause
13) [] Improve station colors
        [] Find out actual domain of temperatures
        [] Get an accurate range of colors climate visualizations use
14) [] Improve histogram selector
        [] Make drag shape a fixed rectangle that can draw much easier
        [] Disable its selection, so nothing appears when clicked on exiting
12) [] Change viewer clock
      [x] Disable play before data is loaded
      [x] Disable ability to change speedup
      [x] Hide x213879124 since it's distracting
      [x] Prevent changing the scale of the timeline
      [x] Remove day from date display
      [x] Remove time display
      [] Prevent time display flashing - add it earlier?
      [] Show loading wheel while getting files
      [] Prevent timeline from being zoomed in on
13) [] Fix UI hangs on file load
      [x] Set up GeoJsonDataSource from loaded json object
      [x] * http://stackoverflow.com/questions/19026331/call-multiple-json-data-files-in-one-getjson-request
      [] Web worker to load json weather and location files
14) [] Rewrite in ES6 to future proof it
       [] Convert into modules. Especially all of the event listeners
       [] Replace var with let

Build steps
1) npm pack in cesiumjs fork
2) Copy .tgz to webpack project
3) Delete cesium folder in node_modules
4) Run npm install in webpack project
5) npm run in webpack project
