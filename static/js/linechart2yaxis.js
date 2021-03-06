var wi = $("#time-line-charts").width();
var h1 = $("#time-line-charts").height();
var h2 = $("#time-range-charts").height();

var dateDimension, depthDimension; // 用于外部调用filter

// 更改数据不会修改的图属性
timeTendencyCharts.width(wi).height(h1)
    .margins({ top: 50, right: 30, bottom: 30, left: 20 })
    .mouseZoomable(true)
    .shareTitle(false)
    .round(d3.time.day.round)
    .xUnits(d3.time.days)
    .elasticY(true)
    .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
    .brushOn(false);
timeTendencyCharts.xAxis().ticks(10);

timeRangeChart.width(wi).height(h2)
    .margins({ top: 10, right: 30, bottom: 20, left: 20 })
    .elasticY(false);

depthTendencyCharts.width(wi).height(h1)
    .transitionDuration(100)
    .margins({ top: 50, right: 30, bottom: 30, left: 20 })
    .mouseZoomable(false)
    .shareTitle(false)
    .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
    .brushOn(false)
    .x(d3.scale.linear().domain([-5, 55]))
    .elasticY(true);
depthTendencyCharts.xAxis()
    .tickValues([0, 8, 15, 30, 50])
    .tickFormat(function (d) {
        return d.toFixed(1) + 'm';
    });

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

// 更改主属性后重新绘制框选时间的图
function changeTimeRangeChart() {
    var tmpattr = curattr;
    if ($.inArray(curattr, ['ow']) != -1) {
        tmpattr = 'surl_el';
    }
    var y3group = dateDimension.group().reduceSum(function (d) {
        return +d[tmpattr];
    });
    
    timeRangeChart
        .dimension(dateDimension)
        .group(y3group)
        .x(d3.time.scale().domain(dateDomain))
        .round(d3.time.month.round)
        .xUnits(d3.time.months);
    timeRangeChart.yAxis().ticks(0);
    timeRangeChart.redraw();
}

function redrawLineCharts() {
    var tmpattr = curattr;
    if ($.inArray(curattr, ['ow']) != -1) {
        tmpattr = 'surl_el';
    }
    depthDimension.filter(parseFloat(curdepth));
    var y1group = dateDimension.group().reduceSum(function (d) {
        return +d[y2attr1];
    });
    var y2group = dateDimension.group().reduceSum(function (d) {
        return +d[y2attr2];
    });
    var y3group = dateDimension.group().reduceSum(function (d) {
        return +d[tmpattr];
    });

    timeTendencyCharts
        .transitionDuration(100)
        .dimension(dateDimension)
        .x(d3.time.scale().domain(dateDomain))
        .rangeChart(timeRangeChart)
        .compose([
            nonzero_min(dc.lineChart(timeTendencyCharts)
                .group(y1group, y2attr1))
                .title(function (d) {
                    return ['date: ' + dateFormat(d.key), y2attr1 + ': ' + numberFormat(d.value)].join('\n');
                }),
            nonzero_min(dc.lineChart(timeTendencyCharts)
                .group(y2group, y2attr2)
                .ordinalColors(["orange"])
                .useRightYAxis(true))
                .title(function (d) {
                    return ['date: ' + dateFormat(d.key), y2attr2 + ': ' + numberFormat(d.value)].join('\n');
                })
        ])
        .yAxisLabel(y2attr1)
        .rightYAxisLabel(y2attr2);
    timeTendencyCharts.on("renderlet", function (chart) {
        chart.selectAll("circle.dot").on("click", function (d) {
            var da = d.data.key;
            // console.log(d.data);
            dateDimension.filter(da);
            depthTendencyCharts.redraw();
        });
    });
    timeTendencyCharts.yAxis().tickFormat(numberFormat);

    timeRangeChart
        .dimension(dateDimension)
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
    depthTendencyCharts
        .dimension(depthDimension)
        .compose([
            nonzero_min(dc.lineChart(depthTendencyCharts)
                .dimension(depthDimension)
                .group(y1group2, y2attr1))
                .title(function (d) {
                    return ['depth: ' + d.key + 'm', y2attr1 + ': ' + numberFormat(d.value)].join('\n');
                }),
            nonzero_min(dc.lineChart(depthTendencyCharts)
                .dimension(depthDimension)
                .group(y2group2, y2attr2)
                .ordinalColors(["orange"])
                .useRightYAxis(true))
                .title(function (d) {
                    return ['depth: ' + d.key + 'm', y2attr2 + ': ' + numberFormat(d.value)].join('\n');
                })
        ])
        .yAxisLabel(y2attr1)
        .rightYAxisLabel(y2attr2);
    depthTendencyCharts.yAxis().tickFormat(numberFormat);

    depthTendencyCharts.on("renderlet", function (chart) {
        chart.selectAll("circle.dot").on("click", function (d) {
            var de = d.data.key;
            // console.log(d.data);
            depthDimension.filter(de);
            dc.redrawAll("line-group");
        });
    });
    depthTendencyCharts.render();
}

function change1x1y(dataInfo) {
    $.ajax({
        url: "/api/get_data_bylonlat",
        type: 'POST',
        data: JSON.stringify(dataInfo), //必须是字符串序列
        contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
        success: function (data, status) {
            // csv: [{lon:, lat:, value:}, {}, {}, ...]
            cur1x1yData = JSON.parse(data);
            cur1x1yData.forEach(function (e) {
                e.dd = dateFormat.parse(e.date);
                e.day = d3.time.day(e.dd);
                e.depthnum = parseFloat(e.depth);
            });

            ndx1x1yData = crossfilter(cur1x1yData);
            // monthly index avg fluctuation in percentage
            dateDimension = ndx1x1yData.dimension(function (d) {
                return d.day;
            });
            depthDimension = ndx1x1yData.dimension(function (d) {
                return d.depthnum;
            });
            redrawLineCharts();
            $("h5.depth-title").text(function () {
                var maintitle = 'depth line chart ';
                var lonlattips = '(lon: ' + curlonlat[0] + ', lat: ' + curlonlat[1] + ')';
                return maintitle + lonlattips;
            });
            $("h5.time-title").text(function () {
                var maintitle = 'time line chart ';
                var lonlattips = '(lon: ' + curlonlat[0] + ', lat: ' + curlonlat[1] + ')';
                return maintitle + lonlattips;
            });
        }
    });
}


