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
10) [] Add brushing and linking
      [] Draw a shape to represent the selection
         [x] Draw a rectangle
         [] Find something cheaper than the rectangle mapped to the sphere
      [x] Have shape variable depending on mouse click and drag
      [] Output info about visible stations under the selection shape
      [] Shows a histogram of the temperatures from selected stations
11) [] Improve station colors - look at other visualizations
12) [] Performance v2
      [] Hide entities that are not currently visible.
         [] Use Occluder
      [] Reduce garbage collection
         [] See if entity.show=false makes Cesium allocate a new "node"
         [] Save and analyze a timeline
      [] Improve speed of D3 coloring
         [] Stop outputting strings for color
      [] Try removing unnecessary billboard properties
      [] Analyze all >1000ms processes
12) [] Change viewer clock
      [x] Disable play before data is loaded
      [x] Disable ability to change speedup
      [x] Hide x213879124 since it's distracting
      [x] Prevent changing the scale of the timeline
      [] Show loading wheel while getting files
      [] Prevent timeline from being zoomed in on
13) [] Fix UI hangs on file load
      [] Web worker to load json weather and location files
      [x] Set up GeoJsonDataSource from loaded json object
      [x] * http://stackoverflow.com/questions/19026331/call-multiple-json-data-files-in-one-getjson-request

Build steps
1) npm pack in cesiumjs fork
2) Copy .tgz to webpack project
3) Delete cesium folder in node_modules (TODO: Find way to clear npm cache)
4) Run npm install in webpack project
5) npm run in webpack project
