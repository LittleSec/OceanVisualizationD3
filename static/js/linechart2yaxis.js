var timeTendencyCharts = dc.compositeChart("#time-line-charts");
var timeRangeChart = dc.lineChart("#time-range-chart");
var depthTendencyCharts = dc.compositeChart("#depth-line-charts");
var dateDomain = [new Date(2014, 6, 1), new Date(2017, 8, 30)]; // 月份从0月开始。。。。
var depthDomain = ['0.0m', '8.0m', '15.0m', '30.m', '50.0m'];
var numberFormat = d3.format(".2f");
var dateFormat = d3.time.format("%m/%d/%Y");

// 数据处理
data.forEach(function (e) {
    e.dd = dateFormat.parse(e.date);
});

var ndx = crossfilter(data);
// Dimension by full date
var dateDimension = ndx.dimension(function (d) {
    return d.dd;
});
var depthDimension = ndx.dimension(function (d) {
    return d.depth;
});


// 需要指明高度和宽度，svg宽度与div一致，但高度要预留5出来
function printTime2yChart(depth, attr1, attr2, attr3){
    var y1group = dateDimension.group().reduceSum(function(d){
        if(d.depth == depth){
            return d[attr1];
        }
        else{
            return 0;
        }
    });
    var y2group = dateDimension.group().reduceSum(function(d){
        if(d.depth == depth){
            return d[attr2];
        }
        else{
            return 0;
        }
    });
    var y3group = dateDimension.group().reduceSum(function(d){
        if(d.depth == depth){
            return d[attr3];
        }
        else{
            return 0;
        }
    });

    timeTendencyCharts.width(600)
        .height(300)
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
                .group(y1group, attr1)
                .yAxis().tickFormat(numberFormat),
            dc.lineChart(timeTendencyCharts)
                .group(y2group, attr2)
                .ordinalColors(["orange"])
                .useRightYAxis(true)
                .yAxis().tickFormat(numberFormat)
        ])
        .yAxisLabel(attr1)
        .rightYAxisLabel(attr2);

    timeRangeChart.width(600) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
        .height(40)
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
}

function printDepth2yChart(date, attr1, attr2){
    date = dateFormat.parse(date);
    var y1group = dateDimension.group().reduceSum(function(d){
        if(d.date == date){
            return d[attr1];
        }
        else{
            return 0;
        }
    });
    var y2group = dateDimension.group().reduceSum(function(d){
        if(d.date == date){
            return d[attr2];
        }
        else{
            return 0;
        }
    });

    depthTendencyCharts.width(600)
        .height(300)
        .transitionDuration(100)
        .margins({ top: 30, right: 50, bottom: 25, left: 60 })
        .dimension(dateDimension)
        .mouseZoomable(true)
        .shareTitle(false)
        .x(d3.scale.ordinal().domain(depthDomain))
        .elasticY(true)
        .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
        .brushOn(false)
        .rangeChart(timeRangeChart)
        .compose([
            dc.lineChart(depthTendencyCharts)
                .group(y1group, attr1)
                .yAxis().tickFormat(numberFormat),
            dc.lineChart(depthTendencyCharts)
                .group(y2group, attr2)
                .ordinalColors(["orange"])
                .useRightYAxis(true)
                .yAxis().tickFormat(numberFormat)
        ])
        .yAxisLabel(attr1)
        .rightYAxisLabel(attr2);

    dc.renderAll();
}

d3.selectAll("circle.dot").on('click', function(){
    console.log(this);
});