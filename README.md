#Climate Station Visualizer

##Tasks to complete
1. Get Cesium with webpack set up.
   * [x] Use minimized builds and compare
2. Get conversation from Julian -> Gregorian time working
3. Have colors change on scale depending on temperature
      * Only show items that are currently visible
      * Change colors on blue to red scale
4. Have time range set to full width on default
5. Get temperatures showing for all months
6. Skip by month
      * [x] Make time speed optimal to see changes in data
      * [ ] Change to better skybox that isn't so dizzy
7. Use circles for stations to speed up adding/removing
8. Performance v1
      * [x] Profile while time is marching
      * [x] Profile while visualization is paused
      * [x] Optimize station modification times
      * [x] Test removing and re-adding billboards on property changes.
9. Add selection data
      * [x] Current temperature
      * [x] City
      * [x] Country
      * [x] Hide info box title
      * [x] Improve look of side panel from colors to animation
      * [x] Disable selection of invisible stations
      * [x] Fix new stations sometimes not appearing
         * If timeline is started from pause, and then scrubbed no new stations
            become visible
      * [x] Add location info for stations missing it
         * [x] Rerun geolocator to generate file of missing stations
      * [ ] Add station name to all entities without a location
10. Add brushing and linking
      * [x] Draw a shape to represent the selection
         * [x] Draw a rectangle
      * [x] Have shape variable depending on mouse click and drag
      * [x] Output info about visible stations under the selection shape
         * [x] 1st impl: Loop through all points checking for visibility
         * [x] Incrementally update selected set while time is ticking
         * [x] Show a sample histogram
         * [x] Profile it
         * [x] Entity collection of non-culled stations
      * [x] Show a histogram of the temperatures from selected stations
      * [x] Update the histogram as time progresses
11. Add a spatial data structure
       * [x] Add a spatial hash, and query it with the view frustum.
       * [x] Spatial hash
           * https://github.com/timohausmann/quadtree-js/
           * [x] Convert cartographic with one decimal place to positive x, y
               * Longitude (x) -180.0 to 180.0. ((x + 180) * 10)
               * Latitude (y) -90.0 to 90.0.    ((y + 90) * 10)
           * [x] Fix anti-meridian queries
              * [x] Handle crossing to left
              * [x] Handle crossing to right
       * [x] Query it as the camera moves
       * [x] Use spatial hash for selector
       * [ ] Return the whole entity so we can chain a loop together
          * [x] Research if loop chaining is actually faster
12. Research aggregating data into a heatmap
       * Precomputed
         1. [ ] Figure out if tile can be switched depending on time. Create a demo.
         2. [ ] Create a level 1 heatmap in Python for each year/month. Convert to one layer image in Web Mercator.
         3. [ ] Create a few more levels and allow Cesium to query between them.
         4. [ ] Change histogram to account for new temperatures. Need to load in new data so an interpolated range will still show something
       * Live
         * [ ] Use heatmap.js, but with values instead of positions?
            * [ ] When adding a position, add it T times, where T is the current temperature.
               * Bad, since highest temperature currently is the most red
       * [ ] Possible to pre-render map coloring like SolarGIS?
          * http://solargis.info/imaps/#tl=GeoModel:t_yr_avg&loc=-29.180941,113.181152&c=24.65512,-51.350784
13. Improve station colors
       * [x] Find out actual domain of temperatures
       * [x] Get an accurate range of colors climate visualizations use
14. Improve histogram
       * [x] Improve first draw time
       * [x] Fix gap in middle
       * [x] Disable selector picking - Empty infobox appears when clicked
            * No support in Cesium yet. If it's really bad we'll re-add logic to deselect things
15. Design questions and determine future tools
       * [x] Pick a cesium imagery provider with names for countries
       * [ ] Update temperature in infobox
       * [x] Cull out points for histogram selector
       * [x] Pass clicks on histogram through to Cesium
                  -- or --
       * [ ] Always show histogram and just highlight parts if subsection is chosen
            * http://vis.stanford.edu/projects/immens/demo/brightkite/
       * [ ] Second query if looking over north or south pole
       * [ ] Widen frustum query height when zoomed out on earth
16. Change viewer clock
        * [x] Disable play before data is loaded
        * [x] Disable ability to change speedup
        * [x] Hide x213879124 since it's distracting
        * [x] Prevent changing the scale of the timeline
        * [x] Remove day from date display
        * [x] Remove time display
        * [ ] Prevent time display flashing - add callback fixes earlier
        * [ ] Show loading wheel while getting files
        * [x] Prevent timeline from being zoomed in on
        * [ ] Have timeline ticks only display month and year
17. Limit camera controls
       * [ ] Limit zoom
          * [ ] Regular mouse zoom
          * [ ] Zoom after search
       * [ ] Limit speed
       * [ ] Prevent tilting too high or low (y axis changes)
18. Performance v3
       * Goal is to 1) Have above 30 fps with animation and selector and 2) no memory leaks
       * [ ] Replace color with SampledProperty. All of the color generation logic can be done beforehand.
       * [ ] Research using primitive instead of entity for disablePick and cull=false
       * [ ] Use referenceProperty for station billboards
19. Rewrite in ES6 to future proof it
       * [ ] Convert into modules.
          * [ ] Make event listeners modules
          * [ ] Have one file with needed variables between all of them. Also create a setter so it can be modified.
       * [ ] Replace var with let
20. Find memory leak
      * Currently, only 1 major GC event for an entire run. Can get worse though when we load tiles on zoom
      * [ ] For each step, run timeline to see if memory has upwards trend. if p is problem step, take heap snapshot of
         p - 1 step and compare to p step to see differences.
      * [ ] Test cesium no additions, running at our speed.
      * [ ] Add entities all white
      * [ ] Add randomly changing color entities
      * [ ] Add color depending on temperature
      * [ ] Show/hide entities if no temperature

      * Ideas:
        * [ ] See if entity.show=false makes Cesium allocate a new "node"
        * [x] See if D3 color strings are the cause
21. Fix UI hangs on file load
      * [x] Set up GeoJsonDataSource from loaded json object
      * [x] * http://stackoverflow.com/questions/19026331/call-multiple-json-data-files-in-one-getjson-request
      * [ ] Have the JSON parsing done in anync. The loading is already done asynchronously
            * [ ] http://azimi.me/2015/07/30/non-blocking-async-json-parse.html
            * [ ] https://www.npmjs.com/package/JSONStream
            * [ ] Web worker to load json weather and location files
                  * May not work since we need to stringify the result

##Build steps
1. npm pack in cesiumjs fork
2. Copy .tgz to webpack project
3. Delete cesium folder in node_modules
4. Run npm install in webpack project
5. npm run in webpack project
