# Climate Station Visualizer

## Information
This is developed as part of my Master's thesis to test the effects of latency on user comprehension. See the full work
[here](http://digitalcommons.calpoly.edu/theses/1557).

## How to install
1. Install node.js. For a Mac with Homebrew just run `brew install node`.
2. Create a keys.js file in the `/keys` folder. Fill in a Bing Maps key

 ```javascript
 module.exports = {
   bingMapsKey: 'ADD KEY'
 };
 ```

3. Type `npm install`. If using Windows make sure that git bash is installed to run the postinstall script.
4. Type `npm run debug`
5. Go to `localhost:8080` in your browser to see the project. `http://localhost:8080/webpack-dev-server/` will
   automatically recompile when code changes.

## How to deploy
* This assumes you were able to get it running locally.
1. `npm run build`
2. The `/public` directory has everything needed to run the site. Now find a server or service to deliver these files.
   Recommended setup is using AWS S3. Just copy the folder's contents into a bucket and configure it as a HTTP server.
   More information available [here](http://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html).

## How to navigate
* Click and hold to turn the earth.
* Scroll to zoom in or out
* Holding shift, click and drag to select stations for the histogram
* Press play to move the time forward
* Spacebar also plays and pauses the animation
* Dragging the timeline scrubber moves time forward as well
