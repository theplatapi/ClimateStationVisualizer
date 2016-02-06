#!/bin/bash

rm -r public && mkdir public
cd node_modules/cesium
npm install
gulp buildApps
cd ../../
cp -r ./node_modules/cesium/Build/Cesium/* ./public
cp -r ./climateData/ ./public/climateData/
cp -r ./lib/ ./public/lib/
