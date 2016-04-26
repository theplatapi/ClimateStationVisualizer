/*

 The MIT License (MIT)

 Copyright (c) 2014 Christer Bystrom

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 A spatial hash. For an explanation, see

 http://www.gamedev.net/page/resources/_/technical/game-programming/spatial-hashing-r2697

 For computational efficiency, the positions are bit-shifted n times. This means
 that they are divided by a factor of power of two. This factor is the
 only argument to the constructor.

 */


//From http://zufallsgenerator.github.io/2014/01/26/visually-comparing-algorithms/
module.exports = (function () {
  'use strict';

  var DEFAULT_POWER_OF_TWO = 4;

  function makeKeysFn(shift) {
    return function (obj) {
      var startX = (obj.x - obj.width / 2) >> shift;
      var startY = (obj.y - obj.height / 2) >> shift;
      var endX = (obj.x + obj.width / 2) >> shift;
      var endY = (obj.y + obj.height / 2) >> shift;
      var x;
      var y;
      var keys = [];

      for (y = startY; y <= endY; y++) {
        for (x = startX; x <= endX; x++) {
          keys.push(x + ":" + y);
        }
      }

      return keys;
    };
  }

  function SpatialHash(power_of_two) {
    if (!power_of_two) {
      power_of_two = DEFAULT_POWER_OF_TWO;
    }

    this.getKeys = makeKeysFn(power_of_two);
    this.hash = {};
    this.list = [];
  }

  SpatialHash.prototype.clear = function () {
    var keys = _.keys(this.hash);
    var i;

    for (i = 0; i < keys.length; i++) {
      var key = keys[i];

      if (this.hash[key].length === 0) {
        delete this.hash[key];
      } else {
        this.hash[key].length = 0;
      }
    }
    this.list.length = 0;
  };

  SpatialHash.prototype.getNumBuckets = function () {
    var key, count = 0;

    for (key in this.hash) {
      if (this.hash.hasOwnProperty(key)) {
        if (this.hash[key].length > 0) {
          count++;
        }
      }
    }
    return count;

  };

  SpatialHash.prototype.insert = function (obj, rect) {
    var keys = this.getKeys(rect || obj), key, i;

    this.list.push(obj);

    for (i = 0; i < keys.length; i++) {
      key = keys[i];

      if (this.hash[key]) {
        this.hash[key].push(obj);
      }
      else {
        this.hash[key] = [obj];
      }
    }
  };

  SpatialHash.prototype.retrieve = function (obj, rect) {
    var ret = [], keys, i, key;

    if (!obj && !rect) {
      return this.list;
    }

    keys = this.getKeys(rect || obj);

    for (i = 0; i < keys.length; i++) {
      key = keys[i];

      if (this.hash[key]) {
        ret = ret.concat(this.hash[key]);
      }
    }

    return ret;
  };

  return SpatialHash;
})();