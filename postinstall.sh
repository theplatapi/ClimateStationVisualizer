#!/bin/bash

rm -rf public
mkdir public
cp -r ./node_modules/cesium/Build/Cesium/* ./public
cp -r ./climateData/ ./public/climateData/