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
20. Performance v3
    * Get the selector drawing to stay above 30 fps
    * [ ] Speed up selector drawing
        * [x] Reduce opacity
        * [x] Experiment with wireframe rectangle to do selecting
        * [x] Draw out other styles that are cheaper to draw
        * [x] Reach out to Cesium devs about opacity performance
        * [ ] Try replacing callbackProperty with static one after shift-click is released
21. Log camera position to service
    * [x] Use custom logging
        * [x] Run node-js-logger
        * [x] Install loglevel
        * [x] Install serverSend (through npm somehow or bower)
        * [x] Send over camera position logs
        * [x] Decide on Heroku or nginx (Heroku)
            * Pro Heroku
              * Same origin so no CORS manipulation needed
              * Can be extended into server that sends latency switch signal
                * Switch file logging to Winston and logging code becomes very small
              * ngrok fixed subdomain costs $6 a month. Otherwise needs config every time.
            * Con Heroku
              * Will take time to set up initially
              * Have to remember to start up instance from sleep during experiment
              * Have to take files off Heroku in case sleeping erases them
              * Stuck with UI latency toggle, which pollutes gaze data
22. Design latency toggle
    * [x] Listen to a websocket for latency change
        * [x] Serve project in current state with an express server
        * [x] Create a websocket on the server and client, and have client listen for hard coded signal
            * https://devcenter.heroku.com/articles/node-websockets
            * http://ditrospecta.com/javascript/react/es6/webpack/heroku/2015/08/08/deploying-react-webpack-heroku.html
        * [x] Create simple admin interface to send latency to client
        * [x] Combine with logging server. On data, log to file/papertrail with Winston.
        * [x] Bump up the style a bit with bootstrap and cards
        * [x] Send POST data async
        * [x] Allow POST to be done before client is connected
            * [x] Fix toastr style not appearing
        * [x] Show if send was successful
        * [x] Have server log file name configured in admin panel
        * [x] Hide before all CSS is loaded
        * [x] When log is enabled, wait for first fps change to hide loading wheel
        * [x] Deploy to Heroku
        * [x] Try reconnecting to disconnected socket
23. Fix minimum zoom bug
    * [x] Have camera.zoomTo respect minimumZoomDistance
    * [x] Fix slow scroll when zooming out from max
24. Add latency to d3 transitions
    * [x] Change with custom easing
    * [x] Have easing correspond with current fps
25. Show temperatures as difference from mean
    * Doesn't show climate change
    * [x] Decide on base period Ex. 1951 - 1980
    * [x] Calculate the difference between temperature in a given month and the baseline average temperature for the same place
26. Add temperature legend on bottom right
    * [x] Add color legend
    * [x] Add text specifying it's Celsius
27. Finalize question segment
    * [x] Replace question 10
    * [ ] Submit to human subjects committee
        * Send an email to Debbie Hart, dahart@calpoly.edu. In the email, state whether or not there have been any
          adverse events/unanticipated problems and also if there will be any modifications to the project, and
          provide any modified documents.
28. Improve timeline
    * [x] Show date popup over cursor
    * [ ] Research Cesium time being on ###9 cutoff instead of round number
        * [ ] Dig in Cesium source
        * [ ] Fix with prototype override if possible
        * [ ] PR if necessary
29. Send latency and timestamp to MiraMetrix
    * [ ] Try through API
    * [ ] Try local script to append info when signal is received
30. Small fixes
    * [x] Reverse legend order
    * [ ] Improve narrow screen culling rules. Height is too short.
    * [ ] Add tutorial script to admin panel
        * Click and drag to turn the earth.
        * Scroll to zoom in or out
        * Holding shift, click and drag to select stations for the histogram
        * Press play to move the time forward
        * Dragging the timeline scrubber moves time forward as well
        * Use the search bar to find any location on the map
31. Combine camera and gaze data
    * [ ] Synchronize feeds
    * [ ] Plot a 3D scatterplot
    * [ ] Separate data by latency levels
    * [ ] Figure out how to get R^2 between 3D scatterplots
32. Gaze data visualization
    * [ ] Map gaze heatmap onto globe
        * Constant size "pixels"
        * Use imagery layer?
33. Rewrite in ES6
    * This will make finding memory leaks much easier and "future proof" the project
    * [ ] Convert into modules.
        * [ ] Make event listeners modules
        * [ ] Have one file with needed variables between all of them. Also create a setter so it can be modified.
    * [ ] Replace var with let
    * [ ] Add onClockTick into setupEventListeners
    * [ ] Use new function declaration syntax