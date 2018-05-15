var requestDataInfo = {
    "time": "2016-05-16",
    "depth": '0.0m',
};
curattr = "surf_el";
drawGeoMap(hmChartg);
// var colorbarSvg = d3.select("#colorbar svg"); //or false
drawHeatMap(requestDataInfo);
drawQuiver(requestDataInfo);
hmChartsvg.call(brush);

/*
svgSelector = d3.select(".one-graph svg") // 实际上指选择了第一个
var twoRequestDataInfo = {
    "resulation": '0p2',
    "file1":{
        "attr": 'temp',
        "time": "2001-06-16",
        "depth": "5.01m"
    },
    "file2":{
        "attr": 'v',
        "time": "2001-06-16",
        "depth": "5.01m"
    }
};
drawScatter(svgSelector, twoRequestDataInfo, 'red');

var attrsRequest = {
    "resulation": "0p2",
    "time": "2001-01-16",
    "depth": "5.01m",
    "attrs": ["ssh","salt","temp","u","v"] // 注意可以控制顺序 //返回最多6个
};
svgSelector = d3.select("#parallel-coordinate svg");
drawParaller(svgSelector, attrsRequest);
*/

/* 用svg画时间轴，目前弃用，等待最后确认弃用后删除
var svg = d3.select("#depthselector svg");
var width = $("#depthselector svg").width(); // svg.style("width")得到是px单位的字符串，attr得到是100%字符串
var height = $("#depthselector svg").height();
var depth = 150;
var depthList = [5.05, 10.34, 30.1, 57, 78, 101];
var padding = {
    top: 30,
    right: 5
};
var innerTickSize = 4;
var scale = d3.scale.linear()
    .domain([0, depth])
    .range([0, height - padding.top * 2]);
var axisLeft = d3.svg.axis()
    .scale(scale)
    .orient("left")
    .tickValues(depthList)
    .innerTickSize(innerTickSize)
    .outerTickSize(0);
var gAxis = svg.append("g").attr("class", "axis").attr("transform",
    "translate(" + (width - 1) + "," + padding.top + ")"); //记得加括号，不然先进行字符串拼接后减就是NaN了
axisLeft(gAxis);
var circle = svg.selectAll("circle").data(depthList).enter()
    .append('circle')
    .attr('cx', width - 1)
    .attr('cy', function (d) {
        return padding.top + scale(d);
    })
    .attr('r', innerTickSize);

// svg = d3.select("#dateselector svg");
// width = $("#dateselector svg").width();
// height = $("#dateselector svg").height();
// padding.top = 10;
// scale.domain([0,13]).range([0, height - padding.top * 2]); // 多出来是为了延长
// monthList = d3.range(1,13) // 12个月
// var axisRight = d3.svg.axis()
//     .scale(scale)
//     .orient("right")
//     .tickValues(monthList)
//     .innerTickSize(innerTickSize)
//     .outerTickSize(0);

// gAxis = svg.append("g").attr("class", "axis").attr("transform", "translate("+ 1 + "," + padding.top + ")");
// axisRight(gAxis);
// circle = svg.selectAll("circle").data(monthList).enter()
//     .append('circle')
//     .attr('cx', 1)
//     .attr('cy', function(d){return padding.top+scale(d);})
//     .attr('r', innerTickSize);
*/