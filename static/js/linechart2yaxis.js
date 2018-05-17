var wi = $("#time-line-charts").width();
var h1 = $("#time-line-charts").height();
var h2 = $("#time-range-charts").height();

// bug: https://github.com/dc-js/dc.js/issues/667
function nonzero_min(chart) {
    dc.override(chart, 'yAxisMin', function () {
        var min = d3.min(chart.data(), function (layer) {
            return d3.min(layer.values, function (p) {
                return p.y + p.y0;
            });
        });
        return dc.utils.subtract(min, chart.yAxisPadding());
    });
    return chart;
}

d3.json('./static/js/lonlat.json', function (err, data) {
    data.forEach(function (e) {
        e.dd = dateFormat.parse(e.date);
        e.day = d3.time.day(e.dd);
        e.depthnum = parseFloat(e.depth);
    });

    var ndx = crossfilter(data);
    // monthly index avg fluctuation in percentage
    var dateDimension = ndx.dimension(function (d) {
        return d.day;
    });
    var depthDimension = ndx.dimension(function (d) {
        return d.depthnum;
    });
    depthDimension.filter(parseFloat(curdepth));
    var y1group = dateDimension.group().reduceSum(function (d) {
        return +d[y2attr1];
    });
    var y2group = dateDimension.group().reduceSum(function (d) {
        return +d[y2attr2];
    });
    var y3group = dateDimension.group().reduceSum(function (d) {
        return +d[curattr];
    });

    timeTendencyCharts.width(wi).height(h1)
        .transitionDuration(100)
        .margins({ top: 50, right: 20, bottom: 30, left: 20 })
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
            nonzero_min(dc.lineChart(timeTendencyCharts)
                .group(y1group, y2attr1)),
            nonzero_min(dc.lineChart(timeTendencyCharts)
                .group(y2group, y2attr2)
                .ordinalColors(["orange"])
                .useRightYAxis(true))
        ])
        .yAxisLabel(y2attr1)
        .rightYAxisLabel(y2attr2);
    timeTendencyCharts.xAxis().ticks(10);
    timeTendencyCharts.on("renderlet", function (chart) {
        chart.selectAll("circle.dot").on("click", function (d) {
            var da = d.data.key;
            console.log(d.data);
            dateDimension.filter(da);
            depthTendencyCharts.redraw();
        });
    });
    // timeTendencyCharts.yAxis().tickFormat(numberFormat);

    timeRangeChart.width(wi).height(h2)
        .margins({ top: 10, right: 20, bottom: 20, left: 20 })
        .dimension(dateDimension)
        .elasticY(false)
        .group(y3group)
        .x(d3.time.scale().domain(dateDomain))
        .round(d3.time.month.round)
        .xUnits(d3.time.months);
    timeRangeChart.yAxis().ticks(0);

    dc.renderAll("line-group");

    var curday = d3.time.day(dateFormat.parse(curdate));
    dateDimension.filter(curday);
    var y1group2 = depthDimension.group().reduceSum(function (d) {
        return +d[y2attr1];
    });
    var y2group2 = depthDimension.group().reduceSum(function (d) {
        return +d[y2attr2];
    });
    // 该dc版本的ordinal的x轴不允许显式声明定义域，但是复合图必须指定明确的带有定义域的x轴。
    // 既然深度本质上也是一个数字，那么可以转化为线性比例尺。
    depthTendencyCharts.width(wi).height(h1)
        .transitionDuration(100)
        .margins({ top: 50, right: 20, bottom: 30, left: 20 })
        .dimension(depthDimension)
        .mouseZoomable(false)
        .shareTitle(false)
        .x(d3.scale.linear().domain([-5, 55]))
        .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
        .brushOn(false)
        .elasticY(true)
        .compose([
            nonzero_min(dc.lineChart(depthTendencyCharts)
                .dimension(depthDimension)
                .group(y1group2, y2attr1)),
            nonzero_min(dc.lineChart(depthTendencyCharts)
                .dimension(depthDimension)
                .group(y2group2, y2attr2)
                .ordinalColors(["orange"])
                .useRightYAxis(true))
        ])
        .yAxisLabel(y2attr1)
        .rightYAxisLabel(y2attr2);
    depthTendencyCharts.xAxis()
        .tickValues([0, 8, 15, 30, 50])
        .tickFormat(function (d) {
            return d.toFixed(1) + 'm';
        });
    depthTendencyCharts.on("renderlet", function (chart) {
        chart.selectAll("circle.dot").on("click", function (d) {
            var de = d.data.key;
            console.log(d.data);
            depthDimension.filter(de);
            dc.redrawAll("line-group");
        });
    });
    depthTendencyCharts.render();
});

