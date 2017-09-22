﻿InteractiveDataDisplay.Chart = function (div, master) {
    if (!div) return;

    if (master !== undefined)
        throw "Chart cannot be a dependent plot";

    var gridLines = $("<div data-idd-plot='grid' data-idd-placement='center'></div>").prependTo(div);

    var leftAxis = $('<div data-idd-axis="numeric" data-idd-placement="left"></div>').prependTo(div);
    var bottomAxis = $('<div data-idd-axis="numeric" data-idd-placement="bottom"></div>').prependTo(div);

    this.base = InteractiveDataDisplay.Figure;
    this.base(div, master);
    var that = this;

    //var leftAxis = that.addAxis("left", "numeric");
    //var bottomAxis = that.addAxis("bottom", "numeric");

    var grid = this.get(gridLines[0]);
    bottomAxis.axis = grid.xAxis = this.get(bottomAxis[0]);
    leftAxis.axis = grid.yAxis = this.get(leftAxis[0]);

    var legendDiv = $("<div></div>").prependTo(this.centralPart); 
    var _legend = new InteractiveDataDisplay.Legend(this, legendDiv, true);
    legendDiv.css("float", "right");
    Object.defineProperty(this, "legend", { get: function () { return _legend; }, configurable: false });

    //Stop event propagation
    InteractiveDataDisplay.Gestures.FullEventList.forEach(function (eventName) {
        legendDiv[0].addEventListener(eventName, function (e) {
            e.stopPropagation();
        }, false);
    });

    var data = {};
    InteractiveDataDisplay.Utils.readStyle(div, data);
    var visible = data.isLegendVisible;
    if (visible) {
        if (visible == "true")
            _legend.isVisible = true;
        else if (visible == "false")
            _legend.isVisible = false;
    }
    var setDefaultGestureSource = function () {
        var gestureSource = InteractiveDataDisplay.Gestures.getGesturesStream(that.centralPart);
        var bottomAxisGestures = InteractiveDataDisplay.Gestures.applyHorizontalBehavior(InteractiveDataDisplay.Gestures.getGesturesStream(bottomAxis));
        var leftAxisGestures = InteractiveDataDisplay.Gestures.applyVerticalBehavior(InteractiveDataDisplay.Gestures.getGesturesStream(leftAxis));

        that.navigation.gestureSource = gestureSource.merge(bottomAxisGestures.merge(leftAxisGestures));
    }

    this.onDataTranformChangedCore = function (arg) {
        if (arg == "y") {
            var newAxisType = InteractiveDataDisplay.TicksRenderer.getAxisType(that.yDataTransform);
            if (leftAxis.axis.host.attr("data-idd-axis") == newAxisType) {
                if (newAxisType != "log") {
                    leftAxis.axis.dataTransform = that.yDataTransform;
                }
            } else {
                var oldAxis = leftAxis;
                leftAxis = that.addAxis("left", newAxisType, true, leftAxis[0]);
                that.removeDiv(oldAxis[0]);
                oldAxis.axis.destroy();
                grid.yAxis = this.get(leftAxis[0]);

                setDefaultGestureSource();
            }

            that.enumAll(that, function (plot) {
                if (plot != that) {
                    plot.yDataTransform = that.yDataTransform;
                }
            });
        }
        else if (arg == "x") { 
            var newAxisType = InteractiveDataDisplay.TicksRenderer.getAxisType(that.xDataTransform);
            if (bottomAxis.axis.host.attr("data-idd-axis") == newAxisType) {
                if (newAxisType != "log") {
                    bottomAxis.axis.dataTransform = that.xDataTransform;
                }
            } else {
                var oldAxis = bottomAxis;
                bottomAxis = that.addAxis("bottom", newAxisType, true, bottomAxis[0]);
                that.removeDiv(oldAxis[0]);
                oldAxis.axis.destroy();
                grid.xAxis = this.get(bottomAxis[0]);

                setDefaultGestureSource();
            }

            that.enumAll(that, function (plot) {
                if (plot != that) {
                    plot.xDataTransform = that.xDataTransform;
                }
            });
        }
    }
    this.fireChildrenChanged = function (propertyName) {
        if (propertyName.type == "add") {
            if (that.xDataTransform) {
                propertyName.plot.xDataTransform = that.xDataTransform;
            }
            if (that.yDataTransform) {
                propertyName.plot.yDataTransform = that.yDataTransform;
            }
        }
        this.host.trigger(InteractiveDataDisplay.Event.childrenChanged, propertyName);
    };

    _legend.div = legendDiv;
    this.exportToSvg = function (plotRect, screenSize, svg) {
        if (!SVG.supported) throw "SVG is not supported";

        var screenSize = this.screenSize;
        var plotRect = this.coordinateTransform.getPlotRect({ x: 0, y: 0, width: screenSize.width, height: screenSize.height });

        var svgHost = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        var svg = SVG(svgHost).size(div.width(), div.height());      
        var chart_g = svg.group();
        this.exportContentToSvg(plotRect, screenSize, chart_g);
        var legend_g = svg.group();
        var shift = div.width() + 20;

        if (_legend.isVisible) {
            legend_g.add(this.exportLegendToSvg(legendDiv[0])).translate(shift, 20);
            svg.size(200 + shift, div.height());
        }
        return svg;
    };

    setDefaultGestureSource();
};



InteractiveDataDisplay.Chart.prototype = new InteractiveDataDisplay.Figure;