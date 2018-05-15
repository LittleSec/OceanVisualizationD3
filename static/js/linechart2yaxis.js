// dc.js:3248 Uncaught TypeError: Cannot read property 'domain' of undefined

d3.json("./static/js/lonlat.json", function (error, data) {
    data.forEach(function (e) {
        e.dd = dateFormat.parse(e.date);
        e.day = d3.time.day(e.dd); // pre-calculate month for better performance
    });

    var ndx = crossfilter(data);
    // monthly index avg fluctuation in percentage
    var dateDimension = ndx.dimension(function (d) {
        return d.day;
    });
    var depthDimension = ndx.dimension(function (d) {
        return d.depth;
    });
    depthDimension.filter(curdepth);
    var y1group = dateDimension.group().reduceSum(function (d) {
        return d[y2attr1];
    });
    var y2group = dateDimension.group().reduceSum(function (d) {
        return d[y2attr2];
    });
    var y3group = dateDimension.group().reduceSum(function (d) {
        return d[curattr];
    });
    timeTendencyCharts
        .transitionDuration(100)
        .margins({ top: 30, right: 50, bottom: 25, left: 60 })
        .dimension(dateDimension)
        .mouseZoomable(true)
        .shareTitle(false)
        .x(d3.time.scale().domain(dateDomain))
        .round(d3.time.day.round)
        .xUnits(d3.time.days)
        .elasticY(true)
        .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
        .brushOn(false)
        .rangeChart(timeRangeChart)
        .compose([
            dc.lineChart(timeTendencyCharts)
                .group(y1group, y2attr1),
            dc.lineChart(timeTendencyCharts)
                .group(y2group, y2attr2)
                .ordinalColors(["orange"])
                .useRightYAxis(true)
        ])
        .yAxisLabel(y2attr1)
        .rightYAxisLabel(y2attr2);
    // timeTendencyCharts.yAxis().tickFormat(numberFormat);

    // volumeChart.width(600)
    //     .height(50)
    //     .margins({ top: 0, right: 50, bottom: 25, left: 60 })
    //     .dimension(dateDimension)
    //     .x(d3.time.scale().domain([new Date(1985, 0, 1), new Date(2012, 11, 31)]))
    //     .round(d3.time.day.round)
    //     .xUnits(d3.time.days)
    //     .compose([
    //         dc.lineChart(volumeChart)
    //             .group(y2group),
    //         dc.lineChart(volumeChart)
    //             .group(y1group)
    //             .ordinalColors(["orange"])
    //             .useRightYAxis(true)
    //     ]);

    timeRangeChart /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
        .margins({ top: 0, right: 50, bottom: 20, left: 60 })
        .dimension(dateDimension)
        .group(y3group)
        .x(d3.time.scale().domain(dateDomain))
        .round(d3.time.month.round)
        .xUnits(d3.time.months)
        // .centerBar(true)
        // .gap(0)
        // .alwaysUseRounding(true)
        ;
        timeRangeChart.yAxis().ticks(0);

    dc.renderAll();
});

/*
d3.json('./static/js/lonlat.json', function (err, data) {
    data.forEach(function (e) {
        e.dd = dateFormat.parse(e.date);
        e.day = d3.time.day(e.dd); // pre-calculate month for better performance
    });

    var ndx = crossfilter(data);
    // monthly index avg fluctuation in percentage
    var dateDimension = ndx.dimension(function (d) {
        return d.day;
    });
    var depthDimension = ndx.dimension(function (d) {
        return d.depth;
    });
    depthDimension.filter(curdepth);
    var y1group = dateDimension.group().reduceSum(function (d) {
        return d[y2attr1];
    });
    var y2group = dateDimension.group().reduceSum(function (d) {
        return d[y2attr2];
    });
    var y3group = dateDimension.group().reduceSum(function (d) {
        return d[curattr];
    });
    timeTendencyCharts
        .transitionDuration(100)
        .margins({ top: 30, right: 50, bottom: 25, left: 60 })
        .dimension(dateDimension)
        .mouseZoomable(true)
        .shareTitle(false)
        .x(d3.time.scale().domain(dateDomain))
        .round(d3.time.day.round)
        .xUnits(d3.time.days)
        .elasticY(true)
        .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
        .brushOn(false)
        .rangeChart(timeRangeChart)
        .compose([
            dc.lineChart(timeTendencyCharts)
                .group(y1group, y2attr1),
            dc.lineChart(timeTendencyCharts)
                .group(y2group, y2attr2)
                .ordinalColors(["orange"])
                .useRightYAxis(true)
        ])
        .yAxisLabel(y2attr1)
        .rightYAxisLabel(y2attr2);
    // timeTendencyCharts.yAxis().tickFormat(numberFormat);

    timeRangeChart 
        .margins({ top: 0, right: 50, bottom: 20, left: 60 })
        .dimension(dateDimension)
        .group(y3group)
        .x(d3.time.scale().domain(dateDomain))
        .round(d3.time.month.round)
        .xUnits(d3.time.months)
        // .centerBar(true)
        // .gap(0)
        // .alwaysUseRounding(true)
        ;
    timeRangeChart.yAxis().ticks(0);

    dc.renderAll();



    // date = dateFormat.parse(curdate);
    // var y1group = dateDimension.group().reduceSum(function (d) {
    //     if (d.date == curdepth) {
    //         return d[y2attr1];
    //     }
    //     else {
    //         return 0;
    //     }
    // });
    // var y2group = dateDimension.group().reduceSum(function (d) {
    //     if (d.date == curdate) {
    //         return d[y2attr2];
    //     }
    //     else {
    //         return 0;
    //     }
    // });

    // depthTendencyCharts
    //     .transitionDuration(100)
    //     .margins({ top: 30, right: 50, bottom: 25, left: 60 })
    //     .dimension(dateDimension)
    //     .mouseZoomable(true)
    //     .shareTitle(false)
    //     .x(d3.scale.ordinal().domain(depthDomain))
    //     .elasticY(true)
    //     .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
    //     .brushOn(false)
    //     .rangeChart(timeRangeChart)
    //     .compose([
    //         dc.lineChart(depthTendencyCharts)
    //             .group(y1group, y2attr1),
    //         dc.lineChart(depthTendencyCharts)
    //             .group(y2group, y2attr2)
    //             .ordinalColors(["orange"])
    //             .useRightYAxis(true)
    //     ])
    //     .yAxisLabel(y2attr1)
    //     .rightYAxisLabel(y2attr2);
    // depthTendencyCharts.yAxis().tickFormat(numberFormat)
    // // dc.renderAll();


    // dc.renderAll();
    // d3.selectAll("circle.dot").on('click', function () {
    //     console.log(this);
    // });

})
*/