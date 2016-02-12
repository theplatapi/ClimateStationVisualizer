#Climate Station Visualizer

##How to install
1. Install node.js. For a Mac with Homebrew just run `brew install node`.
2. Run `npm install`. If using Windows make sure that git bash is installed to run the postinstall script.
3. Run `npm start`
4. Go to `localhost:8080` in your browser to see the project. `http://localhost:8080/webpack-dev-server/` will
   automatically recompile when code changes.

##How to deploy
* This assumes you were able to get it running locally.
1. `npm run deploy`
2. The `/public` directory has everything needed to run the site. Now find a server or service to deliver these files.
   Recommended setup is using AWS S3. Just copy the folder's contents into a bucket and configure it.

##How to navigate
* Click and hold to turn the earth.
* Scroll to zoom in or out
* Holding shift, click and drag to select stations for the histogram
* Press play to move the time forward
* Spacebar also plays and pauses the animation
* Dragging the timeline scrubber moves time forward as well

##Questions
* You can find the draft questions [here](https://docs.google.com/document/d/13_lcb0zYgEuUez09SDnoml5vgUxmCBTs_YBi7ZZVoD0/edit?usp=sharing).
  The answers are at the bottom so don't scroll down too far.

##Below are my internal notes
###Visualization
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
        * If timeline is started from pause, and then scrubbed no new stations become visible
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
12. Research aggregating data into a heatmap
    * Note: I added opacity to the points so they blend together. This is a future work section.
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
    * [x] Cull out points for histogram selector
    * [x] Pass clicks on histogram through to Cesium
    * [x] Update temperature in infobox
    * [x] See if we can dynamically change the frame rate
16. Change viewer clock
    * [x] Disable play before data is loaded
    * [x] Disable ability to change speedup
    * [x] Hide x213879124 since it's distracting
    * [x] Prevent changing the scale of the timeline
    * [x] Remove day from date display
    * [x] Remove time display
    * [x] Prevent time display flashing - add callback fixes earlier
    * [x] Have timeline ticks only display month and year
    * [x] Show loading wheel while getting files
    * [x] Prevent timeline from being zoomed in on
17. Limit camera controls
    * [ ] Limit zoom
        * [ ] Regular mouse zoom
            * [ ] Zoom in
                * Weird slowing down occurs
            * [x] Zoom out
        * [ ] Zoom after search
            * Not possible to configure without source modifications
    * [ ] Prevent tilting too high or low (y axis changes)
18. Fix UI hangs on file load
    * [x] Set up GeoJsonDataSource from loaded json object
    * [x] * http://stackoverflow.com/questions/19026331/call-multiple-json-data-files-in-one-getjson-request
    * [x] Have the JSON loading and parsing done in anync.
        * http://azimi.me/2015/07/30/non-blocking-async-json-parse.html
19. Small tweaks
    * [x] Prevent spaces in search from play/pause control
    * [x] Make frustum width wide enough on all aspect ratios
        * It's too narrow when window is taller than it is wide
    * [x] Add station names to stations without city or country
    * [x] Center loading wheel
    * [ ] Add latency to D3 transitions
        * Too difficult with little reward
20. Performance v3
    * Get the selector drawing to stay above 30 fps
    * [ ] Speed up selector drawing
        * [x] Reduce opacity
        * [x] Experiment with wireframe rectangle to do selecting
        * [x] Draw out other styles that are cheaper to draw
        * [ ] Reach out to Cesium devs
21. Design latency toggle
    * Change with viewer.targetFrameRate = x;
    * Test out a question toggle in place of fps counter
    * Test out listening on a websocket
    * Test out responding to Google forms or another service (don't write one)
22. Fix minimum zoom bug
    * Have camera.zoomTo respect minimumZoomDistance
    * Match scrolling behavior to default minimumZoomDistance
23. Rewrite in ES6
    * This will make finding the memory leak much easier and "future proof" the project
    * [ ] Convert into modules.
        * [ ] Make event listeners modules
        * [ ] Have one file with needed variables between all of them. Also create a setter so it can be modified.
    * [ ] Replace var with let
    * [ ] Add onClockTick into setupEventListeners
24. Find memory leak
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




###Gaze Tracker
1. Decide if we will operate it remotely
    * Pros
      * Easier to operate
      * More to write about in thesis
      * Possible to include extra variables in output with API
    * Cons
      * Difficult to figure out how to open port on school PC
      * Have to write controller program
2. Plan how to get zoom and pan information from visualization
    * Too expensive to store all in memory.
    * Idea: Send out in chunks to localhost server. Frees up browser memory. The server can stream contents to disk.
      * Con - We potentially have 2 localhosts running
    * Figure out how to integrate with gaze data stream with ENABLE_SEND_GPI
      * Con - No idea how flag works. Need more research


###Experiment
1. Plan out how question and latency order is determined
    * We want each question to appear in the latency buckets evenly, yet randomization so there aren't any co-variables
2. Plan out how latency will be switched
    * Have app listen on websocket and send commands from my PC
      * Con - requires a separate server running
      * Con - Timing will be different between trials.
      * Pro - User less likely to suspect that latency is being toggled
    * Have user click button on screen to indicate which question they're on
      * Pro - Timing will be more exact since user will press it when question is answered
      * Con - Latency changing in response to button press may be obvious
    * Have question form send out ping to app when question is answered
      * Con - not sure if this is possible with an existing product
      * Pro - timing exact and user less likely to suspect latency is being intentionally changed


###Questions
1. What computer will this run on?
2. Are frame rate choices appropriate? (30, 20, 10, 5)
    * Yes
    * Like 3 questions per frame rate set
    * People can be subject to just 2 different frame rates