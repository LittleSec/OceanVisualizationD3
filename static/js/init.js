laydate.render({
    elem: "#date-pick",
    min: "2014-07-01",
    max: "2017-09-30",
    value: "2014-07-01",
    btns: ['confirm'],
    done: function (value, date, endDate) {
        changeDate(value);
        // console.log(value); //得到日期生成的值，如：2017-08-18
        // console.log(date); //得到日期时间对象：{year: 2017, month: 8, date: 18, hours: 0, minutes: 0, seconds: 0}
        // console.log(endDate); //得结束的日期时间对象，开启范围选择（range: true）才会返回。对象成员同上。
    }
})

var requestDataInfo = {
    "time": "2016-05-16",
    "depth": '0.0m',
};
curattr = "surf_el";
drawGeoMap(hmChartg);
// var colorbarSvg = d3.select("#colorbar svg"); //or false
drawHeatMap(requestDataInfo);
drawQuiver(requestDataInfo);
hmBrushg.call(brushHM);

function redrawGroup1() {
    requestDataInfo = {
        "time": curdate,
        "depth": curdepth
    };
    drawHeatMap(requestDataInfo);
    drawQuiver(requestDataInfo);
}

function changeDate(date) {
    curdate = date;
    redrawGroup1();
}

$("input.depthoption").change(function () {
    curdepth = this.value;
    redrawGroup1();
})

var sliderwidth = $(".attr-selector").width() * 0.9;
$('#ow-slider').jRange({
    from: 0.1,
    to: 1.0,
    step: 0.1,
    scale: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    format: '%s',
    theme: "theme-blue",
    width: sliderwidth,
    showLabels: true,
    snap: true,
    onstatechange: function(value){
        console.log(value);
    }
});
$('#ow-slider').jRange('disable');
$('#ow-slider').jRange('enable');

$('#sla-slider').jRange({
    from: 3,
    to: 10,
    step: 1,
    scale: [3, 4, 5, 6, 7, 8, 9, 10],
    format: '%s',
    width: sliderwidth,
    theme: "theme-blue",
    showLabels: true,
    snap: true
});

$('#ssh-slider').jRange({
    from: 40,
    to: 160,
    step: 20,
    scale: [40, 60, 80, 100, 120, 140, 160],
    format: '%s',
    theme: "theme-blue",
    width: sliderwidth,
    showLabels: true,
    snap: true
});

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