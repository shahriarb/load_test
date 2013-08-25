// MIT License:
//
// Copyright (c) 2010-2013, Joe Walnes
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/**
 * Smoothie Charts - http://smoothiecharts.org/
 * (c) 2010-2013, Joe Walnes
 *     2013, Drew Noakes
 *
 * v1.0: Main charting library, by Joe Walnes
 * v1.1: Auto scaling of axis, by Neil Dunn
 * v1.2: fps (frames per second) option, by Mathias Petterson
 * v1.3: Fix for divide by zero, by Paul Nikitochkin
 * v1.4: Set minimum, top-scale padding, remove timeseries, add optional timer to reset bounds, by Kelley Reynolds
 * v1.5: Set default frames per second to 50... smoother.
 *       .start(), .stop() methods for conserving CPU, by Dmitry Vyal
 *       options.interpolation = 'bezier' or 'line', by Dmitry Vyal
 *       options.maxValue to fix scale, by Dmitry Vyal
 * v1.6: minValue/maxValue will always get converted to floats, by Przemek Matylla
 * v1.7: options.grid.fillStyle may be a transparent color, by Dmitry A. Shashkin
 *       Smooth rescaling, by Kostas Michalopoulos
 * v1.8: Set max length to customize number of live points in the dataset with options.maxDataSetLength, by Krishna Narni
 * v1.9: Display timestamps along the bottom, by Nick and Stev-io
 *       (https://groups.google.com/forum/?fromgroups#!topic/smoothie-charts/-Ywse8FCpKI%5B1-25%5D)
 *       Refactored by Krishna Narni, to support timestamp formatting function
 * v1.10: Switch to requestAnimationFrame, removed the now obsoleted options.fps, by Gergely Imreh
 * v1.11: options.grid.sharpLines option added, by @drewnoakes
 *        Addressed warning seen in Firefox when seriesOption.fillStyle undefined, by @drewnoakes
 * v1.12: Support for horizontalLines added, by @drewnoakes
 *        Support for yRangeFunction callback added, by @drewnoakes
 * v1.13: Fixed typo (#32), by @alnikitich
 * v1.14: Timer cleared when last TimeSeries removed (#23), by @davidgaleano
 *        Fixed diagonal line on chart at start/end of data stream, by @drewnoakes
 * v1.15: Support for npm package (#18), by @dominictarr
 *        Fixed broken removeTimeSeries function (#24) by @davidgaleano
 *        Minor performance and tidying, by @drewnoakes
 * v1.16: Bug fix introduced in v1.14 relating to timer creation/clearance (#23), by @drewnoakes
 *        TimeSeries.append now deals with out-of-order timestamps, and can merge duplicates, by @zacwitte (#12)
 *        Documentation and some local variable renaming for clarity, by @drewnoakes
 * v1.17: Allow control over font size (#10), by @drewnoakes
 *        Timestamp text won't overlap, by @drewnoakes
 * v1.18: Allow control of max/min label precision, by @drewnoakes
 *        Added 'borderVisible' chart option, by @drewnoakes
 *        Allow drawing series with fill but no stroke (line), by @drewnoakes
 */

;(function(exports) {

  var Util = {
    extend: function() {
      arguments[0] = arguments[0] || {};
      for (var i = 1; i < arguments.length; i++)
      {
        for (var key in arguments[i])
        {
          if (arguments[i].hasOwnProperty(key))
          {
            if (typeof(arguments[i][key]) === 'object') {
              if (arguments[i][key] instanceof Array) {
                arguments[0][key] = arguments[i][key];
              } else {
                arguments[0][key] = Util.extend(arguments[0][key], arguments[i][key]);
              }
            } else {
              arguments[0][key] = arguments[i][key];
            }
          }
        }
      }
      return arguments[0];
    }
  };

  /**
   * Initialises a new <code>TimeSeries</code> with optional data options.
   *
   * Options are of the form (defaults shown):
   *
   * <pre>
   * {
   *   resetBounds: true,        // enables/disables automatic scaling of the y-axis
   *   resetBoundsInterval: 3000 // the period between scaling calculations, in millis
   * }
   * </pre>
   *
   * Presentation options for TimeSeries are specified as an argument to <code>SmoothieChart.addTimeSeries</code>.
   *
   * @constructor
   */

    $(function() {
      var pusher = new Pusher('d22eface52ff2c39fd72');
      var channel = pusher.subscribe('load_test');
      tjenare = channel.bind('success', function(data) {$(".jobs").text(data.message).show();});
    });

  function TimeSeries(options) {
    this.options = Util.extend({}, TimeSeries.defaultOptions, options);
    this.data = [tjenare];
    this.maxValue = Number.NaN; // The maximum value ever seen in this TimeSeries.
    this.minValue = Number.NaN; // The minimum value ever seen in this TimeSeries.
  }

  TimeSeries.defaultOptions = {
    resetBoundsInterval: 3000,
    resetBounds: true
  };

  /**
   * Recalculate the min/max values for this <code>TimeSeries</code> object.
   *
   * This causes the graph to scale itself in the y-axis.
   */
  TimeSeries.prototype.resetBounds = function() {
    if (this.data.length) {
      // Walk through all data points, finding the min/max value
      this.maxValue = this.data[0][1];
      this.minValue = this.data[0][1];
      for (var i = 1; i < this.data.length; i++) {
        var value = this.data[i][1];
        if (value > this.maxValue) {
          this.maxValue = value;
        }
        if (value < this.minValue) {
          this.minValue = value;
        }
      }
    } else {
      // No data exists, so set min/max to NaN
      this.maxValue = Number.NaN;
      this.minValue = Number.NaN;
    }
  };

  /**
   * Adds a new data point to the <code>TimeSeries</code>, preserving chronological order.
   *
   * @param timestamp the position, in time, of this data point
   * @param value the value of this data point
   * @param sumRepeatedTimeStampValues if <code>timestamp</code> has an exact match in the series, this flag controls
   * whether it is replaced, or the values summed (defaults to false.)
   */
  TimeSeries.prototype.append = function(timestamp, value, sumRepeatedTimeStampValues) {
    // Rewind until we hit an older timestamp
    var i = this.data.length - 1;
    while (i > 0 && this.data[i][0] > timestamp) {
      i--;
    }

    if (this.data.length > 0 && this.data[i][0] === timestamp) {
      // Update existing values in the array
      if (sumRepeatedTimeStampValues) {
        // Sum this value into the existing 'bucket'
        this.data[i][1] += value;
        value = this.data[i][1];
      } else {
        // Replace the previous value
        this.data[i][1] = value;
      }
    } else if (i < this.data.length - 1) {
      // Splice into the correct position to keep timestamps in order
      this.data.splice(i + 1, 0, [timestamp, value]);
    } else {
      // Add to the end of the array
      this.data.push([timestamp, value]);
    }

    this.maxValue = isNaN(this.maxValue) ? value : Math.max(this.maxValue, value);
    this.minValue = isNaN(this.minValue) ? value : Math.min(this.minValue, value);
  };

  TimeSeries.prototype.dropOldData = function(oldestValidTime, maxDataSetLength) {
    // We must always keep one expired data point as we need this to draw the
    // line that comes into the chart from the left, but any points prior to that can be removed.
    var removeCount = 0;
    while (this.data.length - removeCount >= maxDataSetLength && this.data[removeCount + 1][0] < oldestValidTime) {
      removeCount++;
    }
    if (removeCount !== 0) {
      this.data.splice(0, removeCount);
    }
  };

  /**
   * Initialises a new <code>SmoothieChart</code>.
   *
   * Options are optional, and should be of the form below. Just specify the values you
   * need and the rest will be given sensible defaults as shown:
   *
   * <pre>
   * {
   *   minValue: undefined,        // specify to clamp the lower y-axis to a given value
   *   maxValue: undefined,        // specify to clamp the upper y-axis to a given value
   *   maxValueScale: 1,           // allows proportional padding to be added above the chart. for 10% padding, specify 1.1.
   *   yRangeFunction: undefined,  // function({min: , max: }) { return {min: , max: }; }
   *   scaleSmoothing: 0.125,      // controls the rate at which y-value zoom animation occurs
   *   millisPerPixel: 20,         // sets the speed at which the chart pans by
   *   maxDataSetLength: 2,
   *   interpolation: 'bezier'     // or 'linear'
   *   timestampFormatter: null,   // Optional function to format time stamps for bottom of chart. You may use SmoothieChart.timeFormatter, or your own: function(date) { return ''; }
   *   horizontalLines: [],        // [ { value: 0, color: '#ffffff', lineWidth: 1 } ],
   *   grid:
   *   {
   *     fillStyle: '#000000',     // the background colour of the chart
   *     lineWidth: 1,             // the pixel width of grid lines
   *     strokeStyle: '#777777',   // colour of grid lines
   *     millisPerLine: 1000,      // distance between vertical grid lines
   *     sharpLines: false,        // controls whether grid lines are 1px sharp, or softened
   *     verticalSections: 2,      // number of vertical sections marked out by horizontal grid lines
   *     borderVisible: true       // whether the grid lines trace the border of the chart or not
   *   },
   *   labels
   *   {
   *     disabled: false,          // enables/disables labels showing the min/max values
   *     fillStyle: '#ffffff',     // colour for text of labels,
   *     fontSize: 15,
   *     fontFamily: 'sans-serif',
   *     precision: 2
   *   },
   * }
   * </pre>
   *
   * @constructor
   */
  function SmoothieChart(options) {
    this.options = Util.extend({}, SmoothieChart.defaultChartOptions, options);
    this.seriesSet = [];
    this.currentValueRange = 1;
    this.currentVisMinValue = 0;
  }

  SmoothieChart.defaultChartOptions = {
    millisPerPixel: 20,
    maxValueScale: 1,
    interpolation: 'bezier',
    scaleSmoothing: 0.125,
    maxDataSetLength: 2,
    grid: {
      fillStyle: '#000000',
      strokeStyle: '#777777',
      lineWidth: 1,
      sharpLines: false,
      millisPerLine: 1000,
      verticalSections: 2,
      borderVisible: true
    },
    labels: {
      fillStyle: '#ffffff',
      disabled: false,
      fontSize: 10,
      fontFamily: 'monospace',
      precision: 2
    },
    horizontalLines: []
  };

  // Based on http://inspirit.github.com/jsfeat/js/compatibility.js
  SmoothieChart.AnimateCompatibility = (function() {
    // TODO this global variable will cause bugs if more than one chart is used and the browser does not support *requestAnimationFrame natively
    var lastTime = 0,
        requestAnimationFrame = function(callback, element) {
          var requestAnimationFrame =
            window.requestAnimationFrame        ||
            window.webkitRequestAnimationFrame  ||
            window.mozRequestAnimationFrame     ||
            window.oRequestAnimationFrame       ||
            window.msRequestAnimationFrame      ||
            function(callback) {
              var currTime = new Date().getTime(),
                  timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                  id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                  }, timeToCall);
              lastTime = currTime + timeToCall;
              return id;
            };
          return requestAnimationFrame.call(window, callback, element);
        },
        cancelAnimationFrame = function(id) {
          var cancelAnimationFrame =
            window.cancelAnimationFrame ||
            function(id) {
              clearTimeout(id);
            };
          return cancelAnimationFrame.call(window, id);
        };

    return {
      requestAnimationFrame: requestAnimationFrame,
      cancelAnimationFrame: cancelAnimationFrame
    };
  })();

  SmoothieChart.defaultSeriesPresentationOptions = {
    lineWidth: 1,
    strokeStyle: '#ffffff'
  };

  /**
   * Adds a <code>TimeSeries</code> to this chart, with optional presentation options.
   *
   * Presentation options should be of the form (defaults shown):
   *
   * <pre>
   * {
   *   lineWidth: 1,
   *   strokeStyle: '#ffffff',
   *   fillStyle: undefined
   * }
   * </pre>
   */
  SmoothieChart.prototype.addTimeSeries = function(timeSeries, options) {
    this.seriesSet.push({timeSeries: timeSeries, options: Util.extend({}, SmoothieChart.defaultSeriesPresentationOptions, options)});
    if (timeSeries.options.resetBounds && timeSeries.options.resetBoundsInterval > 0) {
      timeSeries.resetBoundsTimerId = setInterval(
        function() {
          timeSeries.resetBounds();
        },
        timeSeries.options.resetBoundsInterval
      );
    }
  };

  /**
   * Removes the specified <code>TimeSeries</code> from the chart.
   */
  SmoothieChart.prototype.removeTimeSeries = function(timeSeries) {
    // Find the correct timeseries to remove, and remove it
    var numSeries = this.seriesSet.length;
    for (var i = 0; i < numSeries; i++) {
      if (this.seriesSet[i].timeSeries === timeSeries) {
        this.seriesSet.splice(i, 1);
        break;
      }
    }
    // If a timer was operating for that timeseries, remove it
    if (timeSeries.resetBoundsTimerId) {
      // Stop resetting the bounds, if we were
      clearInterval(timeSeries.resetBoundsTimerId);
    }
  };

  /**
   * Instructs the <code>SmoothieChart</code> to start rendering to the provided canvas, with specified delay.
   *
   * @param canvas the target canvas element
   * @param delayMillis an amount of time to wait before a data point is shown. This can prevent the end of the series
   * from appearing on screen, with new values flashing into view, at the expense of some latency.
   */
  SmoothieChart.prototype.streamTo = function(canvas, delayMillis) {
    this.canvas = canvas;
    this.delay = delayMillis;
    this.start();
  };

  /**
   * Starts the animation of this chart.
   */
  SmoothieChart.prototype.start = function() {
    if (this.frame) {
      // We're already running, so just return
      return;
    }

    // Renders a frame, and queues the next frame for later rendering
    var animate = function() {
      this.frame = SmoothieChart.AnimateCompatibility.requestAnimationFrame(function() {
        this.render();
        animate();
      }.bind(this));
    }.bind(this);

    animate();
  };

  /**
   * Stops the animation of this chart.
   */
  SmoothieChart.prototype.stop = function() {
    if (this.frame) {
      SmoothieChart.AnimateCompatibility.cancelAnimationFrame(this.frame);
      delete this.frame;
    }
  };

  SmoothieChart.prototype.updateValueRange = function() {
    // Calculate the current scale of the chart, from all time series.
    var chartOptions = this.options,
        chartMaxValue = Number.NaN,
        chartMinValue = Number.NaN;

    for (var d = 0; d < this.seriesSet.length; d++) {
      // TODO(ndunn): We could calculate / track these values as they stream in.
      var timeSeries = this.seriesSet[d].timeSeries;
      if (!isNaN(timeSeries.maxValue)) {
        chartMaxValue = !isNaN(chartMaxValue) ? Math.max(chartMaxValue, timeSeries.maxValue) : timeSeries.maxValue;
      }

      if (!isNaN(timeSeries.minValue)) {
        chartMinValue = !isNaN(chartMinValue) ? Math.min(chartMinValue, timeSeries.minValue) : timeSeries.minValue;
      }
    }

    // Scale the chartMaxValue to add padding at the top if required
    if (chartOptions.maxValue != null) {
      chartMaxValue = chartOptions.maxValue;
    } else {
      chartMaxValue *= chartOptions.maxValueScale;
    }

    // Set the minimum if we've specified one
    if (chartOptions.minValue != null) {
      chartMinValue = chartOptions.minValue;
    }

    // If a custom range function is set, call it
    if (this.options.yRangeFunction) {
      var range = this.options.yRangeFunction({min: chartMinValue, max: chartMaxValue});
      chartMinValue = range.min;
      chartMaxValue = range.max;
    }

    if (!isNaN(chartMaxValue) && !isNaN(chartMinValue)) {
      var targetValueRange = chartMaxValue - chartMinValue;
      this.currentValueRange += chartOptions.scaleSmoothing * (targetValueRange - this.currentValueRange);
      this.currentVisMinValue += chartOptions.scaleSmoothing * (chartMinValue - this.currentVisMinValue);
    }

    this.valueRange = { min: chartMinValue, max: chartMaxValue };
  };

  SmoothieChart.prototype.render = function(canvas, time) {
    canvas = canvas || this.canvas;
    time = time || new Date().getTime() - (this.delay || 0);

    // TODO only render if the chart has moved at least 1px since the last rendered frame

    // Round time down to pixel granularity, so motion appears smoother.
    time -= time % this.options.millisPerPixel;

    var context = canvas.getContext('2d'),
        chartOptions = this.options,
        dimensions = { top: 0, left: 0, width: canvas.clientWidth, height: canvas.clientHeight },
        // Calculate the threshold time for the oldest data points.
        oldestValidTime = time - (dimensions.width * chartOptions.millisPerPixel),
        valueToYPixel = function(value) {
          var offset = value - this.currentVisMinValue;
          return this.currentValueRange === 0
            ? dimensions.height
            : dimensions.height - (Math.round((offset / this.currentValueRange) * dimensions.height));
        }.bind(this),
        timeToXPixel = function(t) {
          return Math.round(dimensions.width - ((time - t) / chartOptions.millisPerPixel));
        };

    this.updateValueRange();

    context.font = chartOptions.labels.fontSize + 'px ' + chartOptions.labels.fontFamily;

    // Save the state of the canvas context, any transformations applied in this method
    // will get removed from the stack at the end of this method when .restore() is called.
    context.save();

    // Move the origin.
    context.translate(dimensions.left, dimensions.top);

    // Create a clipped rectangle - anything we draw will be constrained to this rectangle.
    // This prevents the occasional pixels from curves near the edges overrunning and creating
    // screen cheese (that phrase should need no explanation).
    context.beginPath();
    context.rect(0, 0, dimensions.width, dimensions.height);
    context.clip();

    // Clear the working area.
    context.save();
    context.fillStyle = chartOptions.grid.fillStyle;
    context.clearRect(0, 0, dimensions.width, dimensions.height);
    context.fillRect(0, 0, dimensions.width, dimensions.height);
    context.restore();

    // Grid lines...
    context.save();
    context.lineWidth = chartOptions.grid.lineWidth;
    context.strokeStyle = chartOptions.grid.strokeStyle;
    // Vertical (time) dividers.
    if (chartOptions.grid.millisPerLine > 0) {
      var textUntilX = dimensions.width - context.measureText(minValueString).width + 4;
      for (var t = time - (time % chartOptions.grid.millisPerLine);
           t >= oldestValidTime;
           t -= chartOptions.grid.millisPerLine) {
        var gx = timeToXPixel(t);
        if (chartOptions.grid.sharpLines) {
          gx -= 0.5;
        }
        context.beginPath();
        context.moveTo(gx, 0);
        context.lineTo(gx, dimensions.height);
        context.stroke();
        context.closePath();

        // Display timestamp at bottom of this line if requested, and it won't overlap
        if (chartOptions.timestampFormatter && gx < textUntilX) {
          // Formats the timestamp based on user specified formatting function
          // SmoothieChart.timeFormatter function above is one such formatting option
          var tx = new Date(t),
            ts = chartOptions.timestampFormatter(tx),
            tsWidth = context.measureText(ts).width;
          textUntilX = gx - tsWidth - 2;
          context.fillStyle = chartOptions.labels.fillStyle;
          context.fillText(ts, gx - tsWidth, dimensions.height - 2);
        }
      }
    }

    // Horizontal (value) dividers.
    for (var v = 1; v < chartOptions.grid.verticalSections; v++) {
      var gy = Math.round(v * dimensions.height / chartOptions.grid.verticalSections);
      if (chartOptions.grid.sharpLines) {
        gy -= 0.5;
      }
      context.beginPath();
      context.moveTo(0, gy);
      context.lineTo(dimensions.width, gy);
      context.stroke();
      context.closePath();
    }
    // Bounding rectangle.
    if (chartOptions.grid.borderVisible) {
      context.beginPath();
      context.strokeRect(0, 0, dimensions.width, dimensions.height);
      context.closePath();
    }
    context.restore();

    // Draw any horizontal lines...
    if (chartOptions.horizontalLines && chartOptions.horizontalLines.length) {
      for (var hl = 0; hl < chartOptions.horizontalLines.length; hl++) {
        var line = chartOptions.horizontalLines[hl],
            hly = Math.round(valueToYPixel(line.value)) - 0.5;
        context.strokeStyle = line.color || '#ffffff';
        context.lineWidth = line.lineWidth || 1;
        context.beginPath();
        context.moveTo(0, hly);
        context.lineTo(dimensions.width, hly);
        context.stroke();
        context.closePath();
      }
    }

    // For each data set...
    for (var d = 0; d < this.seriesSet.length; d++) {
      context.save();
      var timeSeries = this.seriesSet[d].timeSeries,
          dataSet = timeSeries.data,
          seriesOptions = this.seriesSet[d].options;

      // Delete old data that's moved off the left of the chart.
      timeSeries.dropOldData(oldestValidTime, chartOptions.maxDataSetLength);

      // Set style for this dataSet.
      context.lineWidth = seriesOptions.lineWidth;
      context.strokeStyle = seriesOptions.strokeStyle;
      // Draw the line...
      context.beginPath();
      // Retain lastX, lastY for calculating the control points of bezier curves.
      var firstX = 0, lastX = 0, lastY = 0;
      for (var i = 0; i < dataSet.length && dataSet.length !== 1; i++) {
        var x = timeToXPixel(dataSet[i][0]),
            y = valueToYPixel(dataSet[i][1]);

        if (i === 0) {
          firstX = x;
          context.moveTo(x, y);
        } else {
          switch (chartOptions.interpolation) {
            case "linear":
            case "line": {
              context.lineTo(x,y);
              break;
            }
            case "bezier":
            default: {
              // Great explanation of Bezier curves: http://en.wikipedia.org/wiki/Bezier_curve#Quadratic_curves
              //
              // Assuming A was the last point in the line plotted and B is the new point,
              // we draw a curve with control points P and Q as below.
              //
              // A---P
              //     |
              //     |
              //     |
              //     Q---B
              //
              // Importantly, A and P are at the same y coordinate, as are B and Q. This is
              // so adjacent curves appear to flow as one.
              //
              context.bezierCurveTo( // startPoint (A) is implicit from last iteration of loop
                Math.round((lastX + x) / 2), lastY, // controlPoint1 (P)
                Math.round((lastX + x)) / 2, y, // controlPoint2 (Q)
                x, y); // endPoint (B)
              break;
            }
          }
        }

        lastX = x; lastY = y;
      }

      if (dataSet.length > 1) {
        if (seriesOptions.fillStyle) {
          // Close up the fill region.
          context.lineTo(dimensions.width + seriesOptions.lineWidth + 1, lastY);
          context.lineTo(dimensions.width + seriesOptions.lineWidth + 1, dimensions.height + seriesOptions.lineWidth + 1);
          context.lineTo(firstX, dimensions.height + seriesOptions.lineWidth);
          context.fillStyle = seriesOptions.fillStyle;
          context.fill();
        }

        if (seriesOptions.strokeStyle && seriesOptions.strokeStyle !== 'none') {
          context.stroke();
        }
        context.closePath();
      }
      context.restore();
    }

    // Draw the axis values on the chart.
    if (!chartOptions.labels.disabled && !isNaN(this.valueRange.min) && !isNaN(this.valueRange.max)) {
      var maxValueString = parseFloat(this.valueRange.max).toFixed(chartOptions.labels.precision),
          minValueString = parseFloat(this.valueRange.min).toFixed(chartOptions.labels.precision);
      context.fillStyle = chartOptions.labels.fillStyle;
      context.fillText(maxValueString, dimensions.width - context.measureText(maxValueString).width - 2, chartOptions.labels.fontSize);
      context.fillText(minValueString, dimensions.width - context.measureText(minValueString).width - 2, dimensions.height - 2);
    }

    context.restore(); // See .save() above.
  };

  // Sample timestamp formatting function
  SmoothieChart.timeFormatter = function(date) {
    function pad2(number) { return (number < 10 ? '0' : '') + number }
    return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
  };

  exports.TimeSeries = TimeSeries;
  exports.SmoothieChart = SmoothieChart;

})(typeof exports === 'undefined' ?  this : exports);


/*!
 * Pusher JavaScript Library v2.1.2
 * http://pusherapp.com/
 *
 * Copyright 2013, Pusher
 * Released under the MIT licence.
 */

(function(){function b(a,d){(a===null||a===void 0)&&b.warn("Warning","You must pass your app key when you instantiate Pusher.");var d=d||{},c=this;this.key=a;this.config=b.Util.extend(b.getGlobalConfig(),d.cluster?b.getClusterConfig(d.cluster):{},d);this.channels=new b.Channels;this.global_emitter=new b.EventsDispatcher;this.sessionID=Math.floor(Math.random()*1E9);this.timeline=new b.Timeline(this.key,this.sessionID,{features:b.Util.getClientFeatures(),params:this.config.timelineParams||{},limit:50,
level:b.Timeline.INFO,version:b.VERSION});if(!this.config.disableStats)this.timelineSender=new b.TimelineSender(this.timeline,{host:this.config.statsHost,path:"/timeline"});this.connection=new b.ConnectionManager(this.key,b.Util.extend({getStrategy:function(a){return b.StrategyBuilder.build(b.getDefaultStrategy(c.config),b.Util.extend({},c.config,a))},timeline:this.timeline,activityTimeout:this.config.activity_timeout,pongTimeout:this.config.pong_timeout,unavailableTimeout:this.config.unavailable_timeout},
this.config,{encrypted:this.isEncrypted()}));this.connection.bind("connected",function(){c.subscribeAll();c.timelineSender&&c.timelineSender.send(c.connection.isEncrypted())});this.connection.bind("message",function(a){var d=a.event.indexOf("pusher_internal:")===0;if(a.channel){var b=c.channel(a.channel);b&&b.handleEvent(a.event,a.data)}d||c.global_emitter.emit(a.event,a.data)});this.connection.bind("disconnected",function(){c.channels.disconnect()});this.connection.bind("error",function(a){b.warn("Error",
a)});b.instances.push(this);b.isReady&&c.connect()}var c=b.prototype;b.instances=[];b.isReady=!1;b.debug=function(){b.log&&b.log(b.Util.stringify.apply(this,arguments))};b.warn=function(){var a=b.Util.stringify.apply(this,arguments);window.console&&(window.console.warn?window.console.warn(a):window.console.log&&window.console.log(a));b.log&&b.log(a)};b.ready=function(){b.isReady=!0;for(var a=0,d=b.instances.length;a<d;a++)b.instances[a].connect()};c.channel=function(a){return this.channels.find(a)};
c.connect=function(){this.connection.connect();if(this.timelineSender&&!this.timelineSenderTimer){var a=this.connection.isEncrypted(),d=this.timelineSender;this.timelineSenderTimer=new b.PeriodicTimer(6E4,function(){d.send(a)})}};c.disconnect=function(){this.connection.disconnect();if(this.timelineSenderTimer)this.timelineSenderTimer.ensureAborted(),this.timelineSenderTimer=null};c.bind=function(a,d){this.global_emitter.bind(a,d);return this};c.bind_all=function(a){this.global_emitter.bind_all(a);
return this};c.subscribeAll=function(){for(var a in this.channels.channels)this.channels.channels.hasOwnProperty(a)&&this.subscribe(a)};c.subscribe=function(a){a=this.channels.add(a,this);this.connection.state==="connected"&&a.subscribe();return a};c.unsubscribe=function(a){a=this.channels.remove(a);this.connection.state==="connected"&&a.unsubscribe()};c.send_event=function(a,d,b){return this.connection.send_event(a,d,b)};c.isEncrypted=function(){return b.Util.getDocumentLocation().protocol==="https:"?
!0:Boolean(this.config.encrypted)};this.Pusher=b}).call(this);
(function(){Pusher.Util={now:function(){return Date.now?Date.now():(new Date).valueOf()},extend:function(b){for(var c=1;c<arguments.length;c++){var a=arguments[c],d;for(d in a)b[d]=a[d]&&a[d].constructor&&a[d].constructor===Object?Pusher.Util.extend(b[d]||{},a[d]):a[d]}return b},stringify:function(){for(var b=["Pusher"],c=0;c<arguments.length;c++)typeof arguments[c]==="string"?b.push(arguments[c]):window.JSON===void 0?b.push(arguments[c].toString()):b.push(JSON.stringify(arguments[c]));return b.join(" : ")},
arrayIndexOf:function(b,c){var a=Array.prototype.indexOf;if(b===null)return-1;if(a&&b.indexOf===a)return b.indexOf(c);for(var a=0,d=b.length;a<d;a++)if(b[a]===c)return a;return-1},keys:function(b){var c=[],a;for(a in b)Object.prototype.hasOwnProperty.call(b,a)&&c.push(a);return c},apply:function(b,c){for(var a=0;a<b.length;a++)c(b[a],a,b)},objectApply:function(b,c){for(var a in b)Object.prototype.hasOwnProperty.call(b,a)&&c(b[a],a,b)},map:function(b,c){for(var a=[],d=0;d<b.length;d++)a.push(c(b[d],
d,b,a));return a},mapObject:function(b,c){var a={},d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(a[d]=c(b[d]));return a},filter:function(b,c){for(var c=c||function(a){return!!a},a=[],d=0;d<b.length;d++)c(b[d],d,b,a)&&a.push(b[d]);return a},filterObject:function(b,c){var c=c||function(a){return!!a},a={},d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&c(b[d],d,b,a)&&(a[d]=b[d]);return a},flatten:function(b){var c=[],a;for(a in b)Object.prototype.hasOwnProperty.call(b,a)&&c.push([a,
b[a]]);return c},any:function(b,c){for(var a=0;a<b.length;a++)if(c(b[a],a,b))return!0;return!1},all:function(b,c){for(var a=0;a<b.length;a++)if(!c(b[a],a,b))return!1;return!0},method:function(b){var c=Array.prototype.slice.call(arguments,1);return function(a){return a[b].apply(a,c.concat(arguments))}},getDocument:function(){return document},getDocumentLocation:function(){return Pusher.Util.getDocument().location},getLocalStorage:function(){try{return window.localStorage}catch(b){}},getClientFeatures:function(){return Pusher.Util.keys(Pusher.Util.filterObject({ws:Pusher.WSTransport,
flash:Pusher.FlashTransport},function(b){return b.isSupported()}))}}}).call(this);
(function(){Pusher.VERSION="2.1.2";Pusher.PROTOCOL=6;Pusher.host="ws.pusherapp.com";Pusher.ws_port=80;Pusher.wss_port=443;Pusher.sockjs_host="sockjs.pusher.com";Pusher.sockjs_http_port=80;Pusher.sockjs_https_port=443;Pusher.sockjs_path="/pusher";Pusher.stats_host="stats.pusher.com";Pusher.channel_auth_endpoint="/pusher/auth";Pusher.channel_auth_transport="ajax";Pusher.activity_timeout=12E4;Pusher.pong_timeout=3E4;Pusher.unavailable_timeout=1E4;Pusher.cdn_http="http://js.pusher.com/";Pusher.cdn_https=
"https://d3dy5gmtp8yhk7.cloudfront.net/";Pusher.dependency_suffix=".min";Pusher.getDefaultStrategy=function(b){return[[":def","ws_options",{hostUnencrypted:b.wsHost+":"+b.wsPort,hostEncrypted:b.wsHost+":"+b.wssPort}],[":def","sockjs_options",{hostUnencrypted:b.httpHost+":"+b.httpPort,hostEncrypted:b.httpHost+":"+b.httpsPort}],[":def","timeouts",{loop:!0,timeout:15E3,timeoutLimit:6E4}],[":def","ws_manager",[":transport_manager",{lives:2,minPingDelay:1E4,maxPingDelay:b.activity_timeout}]],[":def_transport",
"ws","ws",3,":ws_options",":ws_manager"],[":def_transport","flash","flash",2,":ws_options",":ws_manager"],[":def_transport","sockjs","sockjs",1,":sockjs_options"],[":def","ws_loop",[":sequential",":timeouts",":ws"]],[":def","flash_loop",[":sequential",":timeouts",":flash"]],[":def","sockjs_loop",[":sequential",":timeouts",":sockjs"]],[":def","strategy",[":cached",18E5,[":first_connected",[":if",[":is_supported",":ws"],[":best_connected_ever",":ws_loop",[":delayed",2E3,[":sockjs_loop"]]],[":if",[":is_supported",
":flash"],[":best_connected_ever",":flash_loop",[":delayed",2E3,[":sockjs_loop"]]],[":sockjs_loop"]]]]]]]}}).call(this);
(function(){Pusher.getGlobalConfig=function(){return{wsHost:Pusher.host,wsPort:Pusher.ws_port,wssPort:Pusher.wss_port,httpHost:Pusher.sockjs_host,httpPort:Pusher.sockjs_http_port,httpsPort:Pusher.sockjs_https_port,httpPath:Pusher.sockjs_path,statsHost:Pusher.stats_host,authEndpoint:Pusher.channel_auth_endpoint,authTransport:Pusher.channel_auth_transport,activity_timeout:Pusher.activity_timeout,pong_timeout:Pusher.pong_timeout,unavailable_timeout:Pusher.unavailable_timeout}};Pusher.getClusterConfig=
function(b){return{wsHost:"ws-"+b+".pusher.com",httpHost:"sockjs-"+b+".pusher.com"}}}).call(this);(function(){function b(b){var a=function(a){Error.call(this,a);this.name=b};Pusher.Util.extend(a.prototype,Error.prototype);return a}Pusher.Errors={UnsupportedTransport:b("UnsupportedTransport"),UnsupportedStrategy:b("UnsupportedStrategy"),TransportPriorityTooLow:b("TransportPriorityTooLow"),TransportClosed:b("TransportClosed")}}).call(this);
(function(){function b(a){this.callbacks=new c;this.global_callbacks=[];this.failThrough=a}function c(){this._callbacks={}}var a=b.prototype;a.bind=function(a,b){this.callbacks.add(a,b);return this};a.bind_all=function(a){this.global_callbacks.push(a);return this};a.unbind=function(a,b){this.callbacks.remove(a,b);return this};a.emit=function(a,b){var c;for(c=0;c<this.global_callbacks.length;c++)this.global_callbacks[c](a,b);var f=this.callbacks.get(a);if(f&&f.length>0)for(c=0;c<f.length;c++)f[c](b);
else this.failThrough&&this.failThrough(a,b);return this};c.prototype.get=function(a){return this._callbacks[this._prefix(a)]};c.prototype.add=function(a,b){var c=this._prefix(a);this._callbacks[c]=this._callbacks[c]||[];this._callbacks[c].push(b)};c.prototype.remove=function(a,b){if(this.get(a)){var c=Pusher.Util.arrayIndexOf(this.get(a),b);if(c!==-1){var f=this._callbacks[this._prefix(a)].slice(0);f.splice(c,1);this._callbacks[this._prefix(a)]=f}}};c.prototype._prefix=function(a){return"_"+a};Pusher.EventsDispatcher=
b}).call(this);
(function(){function b(a){this.options=a;this.loading={};this.loaded={}}function c(a,d){Pusher.Util.getDocument().addEventListener?a.addEventListener("load",d,!1):a.attachEvent("onreadystatechange",function(){(a.readyState==="loaded"||a.readyState==="complete")&&d()})}function a(a,d){var b=Pusher.Util.getDocument(),g=b.getElementsByTagName("head")[0],b=b.createElement("script");b.setAttribute("src",a);b.setAttribute("type","text/javascript");b.setAttribute("async",!0);c(b,function(){setTimeout(d,0)});
g.appendChild(b)}var d=b.prototype;d.load=function(b,d){var c=this;this.loaded[b]?d():this.loading[b]&&this.loading[b].length>0?this.loading[b].push(d):(this.loading[b]=[d],a(this.getPath(b),function(){c.loaded[b]=!0;if(c.loading[b]){for(var a=0;a<c.loading[b].length;a++)c.loading[b][a]();delete c.loading[b]}}))};d.getRoot=function(a){var b=Pusher.Util.getDocumentLocation().protocol;return(a&&a.encrypted||b==="https:"?this.options.cdn_https:this.options.cdn_http).replace(/\/*$/,"")+"/"+this.options.version};
d.getPath=function(a,b){return this.getRoot(b)+"/"+a+this.options.suffix+".js"};Pusher.DependencyLoader=b}).call(this);
(function(){function b(){Pusher.ready()}function c(a){document.body?a():setTimeout(function(){c(a)},0)}function a(){c(b)}Pusher.Dependencies=new Pusher.DependencyLoader({cdn_http:Pusher.cdn_http,cdn_https:Pusher.cdn_https,version:Pusher.VERSION,suffix:Pusher.dependency_suffix});if(!window.WebSocket&&window.MozWebSocket)window.WebSocket=window.MozWebSocket;window.JSON?a():Pusher.Dependencies.load("json2",a)})();
(function(){function b(a,b){var c=this;this.timeout=setTimeout(function(){if(c.timeout!==null)b(),c.timeout=null},a)}var c=b.prototype;c.isRunning=function(){return this.timeout!==null};c.ensureAborted=function(){if(this.timeout)clearTimeout(this.timeout),this.timeout=null};Pusher.Timer=b}).call(this);
(function(){function b(a,b){var c=this;this.interval=setInterval(function(){c.interval!==null&&b()},a)}var c=b.prototype;c.isRunning=function(){return this.interval!==null};c.ensureAborted=function(){if(this.interval)clearInterval(this.interval),this.interval=null};Pusher.PeriodicTimer=b}).call(this);
(function(){for(var b=String.fromCharCode,c=0;c<64;c++)"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(c);var a=function(a){var d=a.charCodeAt(0);return d<128?a:d<2048?b(192|d>>>6)+b(128|d&63):b(224|d>>>12&15)+b(128|d>>>6&63)+b(128|d&63)},d=function(a){var b=[0,2,1][a.length%3],a=a.charCodeAt(0)<<16|(a.length>1?a.charCodeAt(1):0)<<8|(a.length>2?a.charCodeAt(2):0);return["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a>>>18),"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a>>>
12&63),b>=2?"=":"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a>>>6&63),b>=1?"=":"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a&63)].join("")},h=window.btoa||function(a){return a.replace(/[\s\S]{1,3}/g,d)};Pusher.Base64={encode:function(b){return h(b.replace(/[^\x00-\x7F]/g,a))}}}).call(this);
(function(){function b(a){this.options=a}function c(a){return Pusher.Util.mapObject(a,function(a){typeof a==="object"&&(a=JSON.stringify(a));return encodeURIComponent(Pusher.Base64.encode(a.toString()))})}b.send=function(a,b){var c=new Pusher.JSONPRequest({url:a.url,receiver:a.receiverName,tagPrefix:a.tagPrefix}),f=a.receiver.register(function(a,d){c.cleanup();b(a,d)});return c.send(f,a.data,function(b){var c=a.receiver.unregister(f);c&&c(b)})};var a=b.prototype;a.send=function(a,b,e){if(this.script)return!1;
var f=this.options.tagPrefix||"_pusher_jsonp_",b=Pusher.Util.extend({},b,{receiver:this.options.receiver}),b=Pusher.Util.map(Pusher.Util.flatten(c(Pusher.Util.filterObject(b,function(a){return a!==void 0}))),Pusher.Util.method("join","=")).join("&");this.script=document.createElement("script");this.script.id=f+a;this.script.src=this.options.url+"/"+a+"?"+b;this.script.type="text/javascript";this.script.charset="UTF-8";this.script.onerror=this.script.onload=e;if(this.script.async===void 0&&document.attachEvent&&
/opera/i.test(navigator.userAgent))f=this.options.receiver||"Pusher.JSONP.receive",this.errorScript=document.createElement("script"),this.errorScript.text=f+"("+a+", true);",this.script.async=this.errorScript.async=!1;var g=this;this.script.onreadystatechange=function(){g.script&&/loaded|complete/.test(g.script.readyState)&&e(!0)};a=document.getElementsByTagName("head")[0];a.insertBefore(this.script,a.firstChild);this.errorScript&&a.insertBefore(this.errorScript,this.script.nextSibling);return!0};
a.cleanup=function(){if(this.script&&this.script.parentNode)this.script.parentNode.removeChild(this.script),this.script=null;if(this.errorScript&&this.errorScript.parentNode)this.errorScript.parentNode.removeChild(this.errorScript),this.errorScript=null};Pusher.JSONPRequest=b}).call(this);
(function(){function b(){this.lastId=0;this.callbacks={}}var c=b.prototype;c.register=function(a){this.lastId++;var b=this.lastId;this.callbacks[b]=a;return b};c.unregister=function(a){if(this.callbacks[a]){var b=this.callbacks[a];delete this.callbacks[a];return b}else return null};c.receive=function(a,b,c){(a=this.unregister(a))&&a(b,c)};Pusher.JSONPReceiver=b;Pusher.JSONP=new b}).call(this);
(function(){function b(a,b,c){this.key=a;this.session=b;this.events=[];this.options=c||{};this.uniqueID=this.sent=0}var c=b.prototype;b.ERROR=3;b.INFO=6;b.DEBUG=7;c.log=function(a,b){if(this.options.level===void 0||a<=this.options.level)this.events.push(Pusher.Util.extend({},b,{timestamp:Pusher.Util.now(),level:a})),this.options.limit&&this.events.length>this.options.limit&&this.events.shift()};c.error=function(a){this.log(b.ERROR,a)};c.info=function(a){this.log(b.INFO,a)};c.debug=function(a){this.log(b.DEBUG,
a)};c.isEmpty=function(){return this.events.length===0};c.send=function(a,b){var c=this,e={};this.sent===0&&(e=Pusher.Util.extend({key:this.key,features:this.options.features,version:this.options.version},this.options.params||{}));e.session=this.session;e.timeline=this.events;e=Pusher.Util.filterObject(e,function(a){return a!==void 0});this.events=[];a(e,function(a,g){a||c.sent++;b&&b(a,g)});return!0};c.generateUniqueID=function(){this.uniqueID++;return this.uniqueID};Pusher.Timeline=b}).call(this);
(function(){function b(b,a){this.timeline=b;this.options=a||{}}b.prototype.send=function(b,a){if(!this.timeline.isEmpty()){var d=this,h="http"+(b?"s":"")+"://";d.timeline.send(function(a,b){return Pusher.JSONPRequest.send({data:a,url:h+(d.host||d.options.host)+d.options.path,receiver:Pusher.JSONP},function(a,c){if(c.host)d.host=c.host;b&&b(a,c)})},a)}};Pusher.TimelineSender=b}).call(this);
(function(){function b(a){this.strategies=a}function c(a,b,c){var h=Pusher.Util.map(a,function(a,d,h,e){return a.connect(b,c(d,e))});return{abort:function(){Pusher.Util.apply(h,d)},forceMinPriority:function(a){Pusher.Util.apply(h,function(b){b.forceMinPriority(a)})}}}function a(a){return Pusher.Util.all(a,function(a){return Boolean(a.error)})}function d(a){if(!a.error&&!a.aborted)a.abort(),a.aborted=!0}var h=b.prototype;h.isSupported=function(){return Pusher.Util.any(this.strategies,Pusher.Util.method("isSupported"))};
h.connect=function(b,d){return c(this.strategies,b,function(b,c){return function(h,e){(c[b].error=h)?a(c)&&d(!0):(Pusher.Util.apply(c,function(a){a.forceMinPriority(e.transport.priority)}),d(null,e))}})};Pusher.BestConnectedEverStrategy=b}).call(this);
(function(){function b(a,b,c){this.strategy=a;this.transports=b;this.ttl=c.ttl||18E5;this.timeline=c.timeline}function c(){var a=Pusher.Util.getLocalStorage();return a&&a.pusherTransport?JSON.parse(a.pusherTransport):null}var a=b.prototype;a.isSupported=function(){return this.strategy.isSupported()};a.connect=function(a,b){var e=c(),f=[this.strategy];if(e&&e.timestamp+this.ttl>=Pusher.Util.now()){var g=this.transports[e.transport];g&&(this.timeline.info({cached:!0,transport:e.transport}),f.push(new Pusher.SequentialStrategy([g],
{timeout:e.latency*2,failFast:!0})))}var i=Pusher.Util.now(),j=f.pop().connect(a,function k(c,g){if(c){var e=Pusher.Util.getLocalStorage();if(e&&e.pusherTransport)try{delete e.pusherTransport}catch(q){e.pusherTransport=void 0}f.length>0?(i=Pusher.Util.now(),j=f.pop().connect(a,k)):b(c)}else{var e=Pusher.Util.now()-i,p=g.transport.name,o=Pusher.Util.getLocalStorage();if(o)try{o.pusherTransport=JSON.stringify({timestamp:Pusher.Util.now(),transport:p,latency:e})}catch(r){}b(null,g)}});return{abort:function(){j.abort()},
forceMinPriority:function(b){a=b;j&&j.forceMinPriority(b)}}};Pusher.CachedStrategy=b}).call(this);
(function(){function b(a,b){this.strategy=a;this.options={delay:b.delay}}var c=b.prototype;c.isSupported=function(){return this.strategy.isSupported()};c.connect=function(a,b){var c=this.strategy,e,f=new Pusher.Timer(this.options.delay,function(){e=c.connect(a,b)});return{abort:function(){f.ensureAborted();e&&e.abort()},forceMinPriority:function(b){a=b;e&&e.forceMinPriority(b)}}};Pusher.DelayedStrategy=b}).call(this);
(function(){function b(a){this.strategy=a}var c=b.prototype;c.isSupported=function(){return this.strategy.isSupported()};c.connect=function(a,b){var c=this.strategy.connect(a,function(a,f){f&&c.abort();b(a,f)});return c};Pusher.FirstConnectedStrategy=b}).call(this);
(function(){function b(a,b,c){this.test=a;this.trueBranch=b;this.falseBranch=c}var c=b.prototype;c.isSupported=function(){return(this.test()?this.trueBranch:this.falseBranch).isSupported()};c.connect=function(a,b){return(this.test()?this.trueBranch:this.falseBranch).connect(a,b)};Pusher.IfStrategy=b}).call(this);
(function(){function b(a,b){this.strategies=a;this.loop=Boolean(b.loop);this.failFast=Boolean(b.failFast);this.timeout=b.timeout;this.timeoutLimit=b.timeoutLimit}var c=b.prototype;c.isSupported=function(){return Pusher.Util.any(this.strategies,Pusher.Util.method("isSupported"))};c.connect=function(a,b){var c=this,e=this.strategies,f=0,g=this.timeout,i=null,j=function(m,k){k?b(null,k):(f+=1,c.loop&&(f%=e.length),f<e.length?(g&&(g*=2,c.timeoutLimit&&(g=Math.min(g,c.timeoutLimit))),i=c.tryStrategy(e[f],
a,{timeout:g,failFast:c.failFast},j)):b(!0))},i=this.tryStrategy(e[f],a,{timeout:g,failFast:this.failFast},j);return{abort:function(){i.abort()},forceMinPriority:function(b){a=b;i&&i.forceMinPriority(b)}}};c.tryStrategy=function(a,b,c,e){var f=null,g=null,g=a.connect(b,function(a,b){if(!a||!f||!f.isRunning()||c.failFast)f&&f.ensureAborted(),e(a,b)});c.timeout>0&&(f=new Pusher.Timer(c.timeout,function(){g.abort();e(!0)}));return{abort:function(){f&&f.ensureAborted();g.abort()},forceMinPriority:function(a){g.forceMinPriority(a)}}};
Pusher.SequentialStrategy=b}).call(this);
(function(){function b(a,b,c,f){this.name=a;this.priority=b;this.transport=c;this.options=f||{}}function c(a,b){new Pusher.Timer(0,function(){b(a)});return{abort:function(){},forceMinPriority:function(){}}}var a=b.prototype;a.isSupported=function(){return this.transport.isSupported({disableFlash:!!this.options.disableFlash})};a.connect=function(a,b){if(this.transport.isSupported()){if(this.priority<a)return c(new Pusher.Errors.TransportPriorityTooLow,b)}else return c(new Pusher.Errors.UnsupportedStrategy,b);
var e=this,f=!1,g=this.transport.createConnection(this.name,this.priority,this.options.key,this.options),i=null,j=function(){g.unbind("initialized",j);g.connect()},m=function(){i=new Pusher.Handshake(g,function(a){f=!0;n();b(null,a)})},k=function(a){n();b(a)},l=function(){n();b(new Pusher.Errors.TransportClosed(g))},n=function(){g.unbind("initialized",j);g.unbind("open",m);g.unbind("error",k);g.unbind("closed",l)};g.bind("initialized",j);g.bind("open",m);g.bind("error",k);g.bind("closed",l);g.initialize();
return{abort:function(){f||(n(),i?i.close():g.close())},forceMinPriority:function(a){f||e.priority<a&&(i?i.close():g.close())}}};Pusher.TransportStrategy=b}).call(this);
(function(){function b(a,b,c,e){Pusher.EventsDispatcher.call(this);this.name=a;this.priority=b;this.key=c;this.state="new";this.timeline=e.timeline;this.id=this.timeline.generateUniqueID();this.options={encrypted:Boolean(e.encrypted),hostUnencrypted:e.hostUnencrypted,hostEncrypted:e.hostEncrypted}}var c=b.prototype;Pusher.Util.extend(c,Pusher.EventsDispatcher.prototype);b.isSupported=function(){return!1};c.supportsPing=function(){return!1};c.initialize=function(){this.timeline.info(this.buildTimelineMessage({transport:this.name+
(this.options.encrypted?"s":"")}));this.timeline.debug(this.buildTimelineMessage({method:"initialize"}));this.changeState("initialized")};c.connect=function(){var a=this.getURL(this.key,this.options);this.timeline.debug(this.buildTimelineMessage({method:"connect",url:a}));if(this.socket||this.state!=="initialized")return!1;try{this.socket=this.createSocket(a)}catch(b){var c=this;new Pusher.Timer(0,function(){c.onError(b);c.changeState("closed")});return!1}this.bindListeners();Pusher.debug("Connecting",
{transport:this.name,url:a});this.changeState("connecting");return!0};c.close=function(){this.timeline.debug(this.buildTimelineMessage({method:"close"}));return this.socket?(this.socket.close(),!0):!1};c.send=function(a){this.timeline.debug(this.buildTimelineMessage({method:"send",data:a}));if(this.state==="open"){var b=this;setTimeout(function(){b.socket&&b.socket.send(a)},0);return!0}else return!1};c.requestPing=function(){this.emit("ping_request")};c.onOpen=function(){this.changeState("open");
this.socket.onopen=void 0};c.onError=function(a){this.emit("error",{type:"WebSocketError",error:a});this.timeline.error(this.buildTimelineMessage({}))};c.onClose=function(a){a?this.changeState("closed",{code:a.code,reason:a.reason,wasClean:a.wasClean}):this.changeState("closed");this.socket=void 0};c.onMessage=function(a){this.timeline.debug(this.buildTimelineMessage({message:a.data}));this.emit("message",a)};c.bindListeners=function(){var a=this;this.socket.onopen=function(){a.onOpen()};this.socket.onerror=
function(b){a.onError(b)};this.socket.onclose=function(b){a.onClose(b)};this.socket.onmessage=function(b){a.onMessage(b)}};c.createSocket=function(){return null};c.getScheme=function(){return this.options.encrypted?"wss":"ws"};c.getBaseURL=function(){var a;a=this.options.encrypted?this.options.hostEncrypted:this.options.hostUnencrypted;return this.getScheme()+"://"+a};c.getPath=function(){return"/app/"+this.key};c.getQueryString=function(){return"?protocol="+Pusher.PROTOCOL+"&client=js&version="+
Pusher.VERSION};c.getURL=function(){return this.getBaseURL()+this.getPath()+this.getQueryString()};c.changeState=function(a,b){this.state=a;this.timeline.info(this.buildTimelineMessage({state:a,params:b}));this.emit(a,b)};c.buildTimelineMessage=function(a){return Pusher.Util.extend({cid:this.id},a)};Pusher.AbstractTransport=b}).call(this);
(function(){function b(a,b,c,e){Pusher.AbstractTransport.call(this,a,b,c,e)}var c=b.prototype;Pusher.Util.extend(c,Pusher.AbstractTransport.prototype);b.createConnection=function(a,c,h,e){return new b(a,c,h,e)};b.isSupported=function(a){if(a&&a.disableFlash)return!1;try{return Boolean(new ActiveXObject("ShockwaveFlash.ShockwaveFlash"))}catch(b){return Boolean(navigator&&navigator.mimeTypes&&navigator.mimeTypes["application/x-shockwave-flash"]!==void 0)}};c.initialize=function(){var a=this;this.timeline.info(this.buildTimelineMessage({transport:this.name+
(this.options.encrypted?"s":"")}));this.timeline.debug(this.buildTimelineMessage({method:"initialize"}));this.changeState("initializing");if(window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR===void 0)window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR=!0;window.WEB_SOCKET_SWF_LOCATION=Pusher.Dependencies.getRoot()+"/WebSocketMain.swf";Pusher.Dependencies.load("flashfallback",function(){a.changeState("initialized")})};c.createSocket=function(a){return new FlashWebSocket(a)};c.getQueryString=function(){return Pusher.AbstractTransport.prototype.getQueryString.call(this)+
"&flash=true"};Pusher.FlashTransport=b}).call(this);
(function(){function b(a,b,c,e){Pusher.AbstractTransport.call(this,a,b,c,e);this.options.ignoreNullOrigin=e.ignoreNullOrigin}var c=b.prototype;Pusher.Util.extend(c,Pusher.AbstractTransport.prototype);b.createConnection=function(a,c,h,e){return new b(a,c,h,e)};b.isSupported=function(){return!0};c.initialize=function(){var a=this;this.timeline.info(this.buildTimelineMessage({transport:this.name+(this.options.encrypted?"s":"")}));this.timeline.debug(this.buildTimelineMessage({method:"initialize"}));this.changeState("initializing");
Pusher.Dependencies.load("sockjs",function(){a.changeState("initialized")})};c.supportsPing=function(){return!0};c.createSocket=function(a){return new SockJS(a,null,{js_path:Pusher.Dependencies.getPath("sockjs",{encrypted:this.options.encrypted}),ignore_null_origin:this.options.ignoreNullOrigin})};c.getScheme=function(){return this.options.encrypted?"https":"http"};c.getPath=function(){return this.options.httpPath||"/pusher"};c.getQueryString=function(){return""};c.onOpen=function(){this.socket.send(JSON.stringify({path:Pusher.AbstractTransport.prototype.getPath.call(this)+
Pusher.AbstractTransport.prototype.getQueryString.call(this)}));this.changeState("open");this.socket.onopen=void 0};Pusher.SockJSTransport=b}).call(this);
(function(){function b(a,b,c,e){Pusher.AbstractTransport.call(this,a,b,c,e)}var c=b.prototype;Pusher.Util.extend(c,Pusher.AbstractTransport.prototype);b.createConnection=function(a,c,h,e){return new b(a,c,h,e)};b.isSupported=function(){return window.WebSocket!==void 0||window.MozWebSocket!==void 0};c.createSocket=function(a){return new (window.WebSocket||window.MozWebSocket)(a)};c.getQueryString=function(){return Pusher.AbstractTransport.prototype.getQueryString.call(this)+"&flash=false"};Pusher.WSTransport=
b}).call(this);
(function(){function b(a,b,c){this.manager=a;this.transport=b;this.minPingDelay=c.minPingDelay;this.maxPingDelay=c.maxPingDelay;this.pingDelay=null}var c=b.prototype;c.createConnection=function(a,b,c,e){var f=this.transport.createConnection(a,b,c,e),g=this,i=null,j=null,m=function(){f.unbind("open",m);i=Pusher.Util.now();g.pingDelay&&(j=setInterval(function(){j&&f.requestPing()},g.pingDelay));f.bind("closed",k)},k=function(a){f.unbind("closed",k);j&&(clearInterval(j),j=null);if(a.code===1002||a.code===
1003)g.manager.reportDeath();else if(!a.wasClean&&i&&(a=Pusher.Util.now()-i,a<2*g.maxPingDelay))g.manager.reportDeath(),g.pingDelay=Math.max(a/2,g.minPingDelay)};f.bind("open",m);return f};c.isSupported=function(a){return this.manager.isAlive()&&this.transport.isSupported(a)};Pusher.AssistantToTheTransportManager=b}).call(this);
(function(){function b(a){this.options=a||{};this.livesLeft=this.options.lives||Infinity}var c=b.prototype;c.getAssistant=function(a){return new Pusher.AssistantToTheTransportManager(this,a,{minPingDelay:this.options.minPingDelay,maxPingDelay:this.options.maxPingDelay})};c.isAlive=function(){return this.livesLeft>0};c.reportDeath=function(){this.livesLeft-=1};Pusher.TransportManager=b}).call(this);
(function(){function b(a){return function(b){return[a.apply(this,arguments),b]}}function c(a,b){if(a.length===0)return[[],b];var e=d(a[0],b),h=c(a.slice(1),e[1]);return[[e[0]].concat(h[0]),h[1]]}function a(a,b){if(typeof a[0]==="string"&&a[0].charAt(0)===":"){var e=b[a[0].slice(1)];if(a.length>1){if(typeof e!=="function")throw"Calling non-function "+a[0];var h=[Pusher.Util.extend({},b)].concat(Pusher.Util.map(a.slice(1),function(a){return d(a,Pusher.Util.extend({},b))[0]}));return e.apply(this,h)}else return[e,
b]}else return c(a,b)}function d(b,c){if(typeof b==="string"){var d;if(typeof b==="string"&&b.charAt(0)===":"){d=c[b.slice(1)];if(d===void 0)throw"Undefined symbol "+b;d=[d,c]}else d=[b,c];return d}else if(typeof b==="object"&&b instanceof Array&&b.length>0)return a(b,c);return[b,c]}var h={ws:Pusher.WSTransport,flash:Pusher.FlashTransport,sockjs:Pusher.SockJSTransport},e={def:function(a,b,c){if(a[b]!==void 0)throw"Redefining symbol "+b;a[b]=c;return[void 0,a]},def_transport:function(a,b,c,d,e,k){var l=
h[c];if(!l)throw new Pusher.Errors.UnsupportedTransport(c);c=Pusher.Util.extend({},{key:a.key,encrypted:a.encrypted,timeline:a.timeline,disableFlash:a.disableFlash,ignoreNullOrigin:a.ignoreNullOrigin},e);k&&(l=k.getAssistant(l));d=new Pusher.TransportStrategy(b,d,l,c);k=a.def(a,b,d)[1];k.transports=a.transports||{};k.transports[b]=d;return[void 0,k]},transport_manager:b(function(a,b){return new Pusher.TransportManager(b)}),sequential:b(function(a,b){var c=Array.prototype.slice.call(arguments,2);return new Pusher.SequentialStrategy(c,
b)}),cached:b(function(a,b,c){return new Pusher.CachedStrategy(c,a.transports,{ttl:b,timeline:a.timeline})}),first_connected:b(function(a,b){return new Pusher.FirstConnectedStrategy(b)}),best_connected_ever:b(function(){var a=Array.prototype.slice.call(arguments,1);return new Pusher.BestConnectedEverStrategy(a)}),delayed:b(function(a,b,c){return new Pusher.DelayedStrategy(c,{delay:b})}),"if":b(function(a,b,c,d){return new Pusher.IfStrategy(b,c,d)}),is_supported:b(function(a,b){return function(){return b.isSupported()}})};
Pusher.StrategyBuilder={build:function(a,b){var c=Pusher.Util.extend({},e,b);return d(a,c)[1].strategy}}}).call(this);
(function(){Protocol={decodeMessage:function(b){try{var c=JSON.parse(b.data);if(typeof c.data==="string")try{c.data=JSON.parse(c.data)}catch(a){if(!(a instanceof SyntaxError))throw a;}return c}catch(d){throw{type:"MessageParseError",error:d,data:b.data};}},encodeMessage:function(b){return JSON.stringify(b)},processHandshake:function(b){b=this.decodeMessage(b);if(b.event==="pusher:connection_established")return{action:"connected",id:b.data.socket_id};else if(b.event==="pusher:error")return{action:this.getCloseAction(b.data),
error:this.getCloseError(b.data)};else throw"Invalid handshake";},getCloseAction:function(b){return b.code<4E3?b.code>=1002&&b.code<=1004?"backoff":null:b.code===4E3?"ssl_only":b.code<4100?"refused":b.code<4200?"backoff":b.code<4300?"retry":"refused"},getCloseError:function(b){return b.code!==1E3&&b.code!==1001?{type:"PusherError",data:{code:b.code,message:b.reason||b.message}}:null}};Pusher.Protocol=Protocol}).call(this);
(function(){function b(a,b){Pusher.EventsDispatcher.call(this);this.id=a;this.transport=b;this.bindListeners()}var c=b.prototype;Pusher.Util.extend(c,Pusher.EventsDispatcher.prototype);c.supportsPing=function(){return this.transport.supportsPing()};c.send=function(a){return this.transport.send(a)};c.send_event=function(a,b,c){a={event:a,data:b};if(c)a.channel=c;Pusher.debug("Event sent",a);return this.send(Pusher.Protocol.encodeMessage(a))};c.close=function(){this.transport.close()};c.bindListeners=
function(){var a=this,b=function(b){var c;try{c=Pusher.Protocol.decodeMessage(b)}catch(d){a.emit("error",{type:"MessageParseError",error:d,data:b.data})}if(c!==void 0){Pusher.debug("Event recd",c);switch(c.event){case "pusher:error":a.emit("error",{type:"PusherError",data:c.data});break;case "pusher:ping":a.emit("ping");break;case "pusher:pong":a.emit("pong")}a.emit("message",c)}},c=function(){a.emit("ping_request")},e=function(b){a.emit("error",{type:"WebSocketError",error:b})},f=function(g){a.transport.unbind("closed",
f);a.transport.unbind("error",e);a.transport.unbind("ping_request",c);a.transport.unbind("message",b);g&&g.code&&a.handleCloseEvent(g);a.transport=null;a.emit("closed")};a.transport.bind("message",b);a.transport.bind("ping_request",c);a.transport.bind("error",e);a.transport.bind("closed",f)};c.handleCloseEvent=function(a){var b=Pusher.Protocol.getCloseAction(a);(a=Pusher.Protocol.getCloseError(a))&&this.emit("error",a);b&&this.emit(b)};Pusher.Connection=b}).call(this);
(function(){function b(a,b){this.transport=a;this.callback=b;this.bindListeners()}var c=b.prototype;c.close=function(){this.unbindListeners();this.transport.close()};c.bindListeners=function(){var a=this;a.onMessage=function(b){a.unbindListeners();try{var c=Pusher.Protocol.processHandshake(b);c.action==="connected"?a.finish("connected",{connection:new Pusher.Connection(c.id,a.transport)}):(a.finish(c.action,{error:c.error}),a.transport.close())}catch(e){a.finish("error",{error:e}),a.transport.close()}};
a.onClosed=function(b){a.unbindListeners();var c=Pusher.Protocol.getCloseAction(b)||"backoff",b=Pusher.Protocol.getCloseError(b);a.finish(c,{error:b})};a.transport.bind("message",a.onMessage);a.transport.bind("closed",a.onClosed)};c.unbindListeners=function(){this.transport.unbind("message",this.onMessage);this.transport.unbind("closed",this.onClosed)};c.finish=function(a,b){this.callback(Pusher.Util.extend({transport:this.transport,action:a},b))};Pusher.Handshake=b}).call(this);
(function(){function b(a,b){Pusher.EventsDispatcher.call(this);this.key=a;this.options=b||{};this.state="initialized";this.connection=null;this.encrypted=!!b.encrypted;this.timeline=this.options.timeline;this.connectionCallbacks=this.buildConnectionCallbacks();this.errorCallbacks=this.buildErrorCallbacks();this.handshakeCallbacks=this.buildHandshakeCallbacks(this.errorCallbacks);var c=this;Pusher.Network.bind("online",function(){c.timeline.info({netinfo:"online"});c.state==="unavailable"&&c.connect()});
Pusher.Network.bind("offline",function(){c.timeline.info({netinfo:"offline"});c.shouldRetry()&&(c.disconnect(),c.updateState("unavailable"))});this.updateStrategy()}var c=b.prototype;Pusher.Util.extend(c,Pusher.EventsDispatcher.prototype);c.connect=function(){var a=this;if(!a.connection&&a.state!=="connecting")if(a.strategy.isSupported())if(Pusher.Network.isOnline()===!1)a.updateState("unavailable");else{a.updateState("connecting");var b=function(c,e){c?a.runner=a.strategy.connect(0,b):e.action===
"error"?a.timeline.error({handshakeError:e.error}):(a.runner.abort(),a.handshakeCallbacks[e.action](e))};a.runner=a.strategy.connect(0,b);a.setUnavailableTimer()}else a.updateState("failed")};c.send=function(a){return this.connection?this.connection.send(a):!1};c.send_event=function(a,b,c){return this.connection?this.connection.send_event(a,b,c):!1};c.disconnect=function(){this.runner&&this.runner.abort();this.clearRetryTimer();this.clearUnavailableTimer();this.stopActivityCheck();this.updateState("disconnected");
this.connection&&(this.connection.close(),this.abandonConnection())};c.isEncrypted=function(){return this.encrypted};c.updateStrategy=function(){this.strategy=this.options.getStrategy({key:this.key,timeline:this.timeline,encrypted:this.encrypted})};c.retryIn=function(a){var b=this;b.timeline.info({action:"retry",delay:a});a>0&&b.emit("connecting_in",Math.round(a/1E3));b.retryTimer=new Pusher.Timer(a||0,function(){b.disconnect();b.connect()})};c.clearRetryTimer=function(){this.retryTimer&&this.retryTimer.ensureAborted()};
c.setUnavailableTimer=function(){var a=this;a.unavailableTimer=new Pusher.Timer(a.options.unavailableTimeout,function(){a.updateState("unavailable")})};c.clearUnavailableTimer=function(){this.unavailableTimer&&this.unavailableTimer.ensureAborted()};c.resetActivityCheck=function(){this.stopActivityCheck();if(!this.connection.supportsPing()){var a=this;a.activityTimer=new Pusher.Timer(a.options.activityTimeout,function(){a.send_event("pusher:ping",{});a.activityTimer=new Pusher.Timer(a.options.pongTimeout,
function(){a.timeline.error({pong_timed_out:a.options.pongTimeout});a.connection.close()})})}};c.stopActivityCheck=function(){this.activityTimer&&this.activityTimer.ensureAborted()};c.buildConnectionCallbacks=function(){var a=this;return{message:function(b){a.resetActivityCheck();a.emit("message",b)},ping:function(){a.send_event("pusher:pong",{})},ping_request:function(){a.send_event("pusher:ping",{})},error:function(b){a.emit("error",{type:"WebSocketError",error:b})},closed:function(){a.abandonConnection();
a.shouldRetry()&&a.retryIn(1E3)}}};c.buildHandshakeCallbacks=function(a){var b=this;return Pusher.Util.extend({},a,{connected:function(a){b.clearUnavailableTimer();b.setConnection(a.connection);b.socket_id=b.connection.id;b.timeline.info({socket_id:b.socket_id});b.updateState("connected")}})};c.buildErrorCallbacks=function(){function a(a){return function(c){c.error&&b.emit("error",{type:"WebSocketError",error:c.error});a(c)}}var b=this;return{ssl_only:a(function(){b.encrypted=!0;b.updateStrategy();
b.retryIn(0)}),refused:a(function(){b.disconnect()}),backoff:a(function(){b.retryIn(1E3)}),retry:a(function(){b.retryIn(0)})}};c.setConnection=function(a){this.connection=a;for(var b in this.connectionCallbacks)this.connection.bind(b,this.connectionCallbacks[b]);this.resetActivityCheck()};c.abandonConnection=function(){if(this.connection){for(var a in this.connectionCallbacks)this.connection.unbind(a,this.connectionCallbacks[a]);this.connection=null}};c.updateState=function(a,b){var c=this.state;
this.state=a;c!==a&&(Pusher.debug("State changed",c+" -> "+a),this.timeline.info({state:a}),this.emit("state_change",{previous:c,current:a}),this.emit(a,b))};c.shouldRetry=function(){return this.state==="connecting"||this.state==="connected"};Pusher.ConnectionManager=b}).call(this);
(function(){function b(){Pusher.EventsDispatcher.call(this);var b=this;window.addEventListener!==void 0&&(window.addEventListener("online",function(){b.emit("online")},!1),window.addEventListener("offline",function(){b.emit("offline")},!1))}Pusher.Util.extend(b.prototype,Pusher.EventsDispatcher.prototype);b.prototype.isOnline=function(){return window.navigator.onLine===void 0?!0:window.navigator.onLine};Pusher.NetInfo=b;Pusher.Network=new b}).call(this);
(function(){function b(){this.reset()}var c=b.prototype;c.get=function(a){return Object.prototype.hasOwnProperty.call(this.members,a)?{id:a,info:this.members[a]}:null};c.each=function(a){var b=this;Pusher.Util.objectApply(b.members,function(c,e){a(b.get(e))})};c.setMyID=function(a){this.myID=a};c.onSubscription=function(a){this.members=a.presence.hash;this.count=a.presence.count;this.me=this.get(this.myID)};c.addMember=function(a){this.get(a.user_id)===null&&this.count++;this.members[a.user_id]=a.user_info;
return this.get(a.user_id)};c.removeMember=function(a){var b=this.get(a.user_id);b&&(delete this.members[a.user_id],this.count--);return b};c.reset=function(){this.members={};this.count=0;this.me=this.myID=null};Pusher.Members=b}).call(this);
(function(){function b(a,b){Pusher.EventsDispatcher.call(this,function(b){Pusher.debug("No callbacks on "+a+" for "+b)});this.name=a;this.pusher=b;this.subscribed=!1}var c=b.prototype;Pusher.Util.extend(c,Pusher.EventsDispatcher.prototype);c.authorize=function(a,b){return b(!1,{})};c.trigger=function(a,b){return this.pusher.send_event(a,b,this.name)};c.disconnect=function(){this.subscribed=!1};c.handleEvent=function(a,b){if(a.indexOf("pusher_internal:")===0){if(a==="pusher_internal:subscription_succeeded")this.subscribed=
!0,this.emit("pusher:subscription_succeeded",b)}else this.emit(a,b)};c.subscribe=function(){var a=this;a.authorize(a.pusher.connection.socket_id,function(b,c){b?a.handleEvent("pusher:subscription_error",c):a.pusher.send_event("pusher:subscribe",{auth:c.auth,channel_data:c.channel_data,channel:a.name})})};c.unsubscribe=function(){this.pusher.send_event("pusher:unsubscribe",{channel:this.name})};Pusher.Channel=b}).call(this);
(function(){function b(a,b){Pusher.Channel.call(this,a,b)}var c=b.prototype;Pusher.Util.extend(c,Pusher.Channel.prototype);c.authorize=function(a,b){return(new Pusher.Channel.Authorizer(this,this.pusher.config)).authorize(a,b)};Pusher.PrivateChannel=b}).call(this);
(function(){function b(a,b){Pusher.PrivateChannel.call(this,a,b);this.members=new Pusher.Members}var c=b.prototype;Pusher.Util.extend(c,Pusher.PrivateChannel.prototype);c.authorize=function(a,b){var c=this;Pusher.PrivateChannel.prototype.authorize.call(c,a,function(a,f){if(!a){if(f.channel_data===void 0){Pusher.warn("Invalid auth response for channel '"+c.name+"', expected 'channel_data' field");b("Invalid auth response");return}var g=JSON.parse(f.channel_data);c.members.setMyID(g.user_id)}b(a,f)})};
c.handleEvent=function(a,b){switch(a){case "pusher_internal:subscription_succeeded":this.members.onSubscription(b);this.subscribed=!0;this.emit("pusher:subscription_succeeded",this.members);break;case "pusher_internal:member_added":this.emit("pusher:member_added",this.members.addMember(b));break;case "pusher_internal:member_removed":var c=this.members.removeMember(b);c&&this.emit("pusher:member_removed",c);break;default:Pusher.PrivateChannel.prototype.handleEvent.call(this,a,b)}};c.disconnect=function(){this.members.reset();
Pusher.PrivateChannel.prototype.disconnect.call(this)};Pusher.PresenceChannel=b}).call(this);
(function(){function b(){this.channels={}}var c=b.prototype;c.add=function(a,b){this.channels[a]||(this.channels[a]=a.indexOf("private-")===0?new Pusher.PrivateChannel(a,b):a.indexOf("presence-")===0?new Pusher.PresenceChannel(a,b):new Pusher.Channel(a,b));return this.channels[a]};c.find=function(a){return this.channels[a]};c.remove=function(a){var b=this.channels[a];delete this.channels[a];return b};c.disconnect=function(){Pusher.Util.objectApply(this.channels,function(a){a.disconnect()})};Pusher.Channels=
b}).call(this);
(function(){Pusher.Channel.Authorizer=function(b,a){this.channel=b;this.type=a.authTransport;this.options=a;this.authOptions=(a||{}).auth||{}};Pusher.Channel.Authorizer.prototype={composeQuery:function(b){var b="&socket_id="+encodeURIComponent(b)+"&channel_name="+encodeURIComponent(this.channel.name),a;for(a in this.authOptions.params)b+="&"+encodeURIComponent(a)+"="+encodeURIComponent(this.authOptions.params[a]);return b},authorize:function(b,a){return Pusher.authorizers[this.type].call(this,b,a)}};
var b=1;Pusher.auth_callbacks={};Pusher.authorizers={ajax:function(b,a){var d;d=Pusher.XHR?new Pusher.XHR:window.XMLHttpRequest?new window.XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP");d.open("POST",this.options.authEndpoint,!0);d.setRequestHeader("Content-Type","application/x-www-form-urlencoded");for(var h in this.authOptions.headers)d.setRequestHeader(h,this.authOptions.headers[h]);d.onreadystatechange=function(){if(d.readyState==4)if(d.status==200){var b,c=!1;try{b=JSON.parse(d.responseText),
c=!0}catch(g){a(!0,"JSON returned from webapp was invalid, yet status code was 200. Data was: "+d.responseText)}c&&a(!1,b)}else Pusher.warn("Couldn't get auth info from your webapp",d.status),a(!0,d.status)};d.send(this.composeQuery(b));return d},jsonp:function(c,a){this.authOptions.headers!==void 0&&Pusher.warn("Warn","To send headers with the auth request, you must use AJAX, rather than JSONP.");var d=b.toString();b++;var h=Pusher.Util.getDocument(),e=h.createElement("script");Pusher.auth_callbacks[d]=
function(b){a(!1,b)};e.src=this.options.authEndpoint+"?callback="+encodeURIComponent("Pusher.auth_callbacks['"+d+"']")+this.composeQuery(c);d=h.getElementsByTagName("head")[0]||h.documentElement;d.insertBefore(e,d.firstChild)}}}).call(this);
