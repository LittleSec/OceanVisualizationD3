var dataInfo = {
    "ssh": {
        "unit": "m", //单位
        "shortname": "ssh",
        "standardname": "sea_surface_height",
        "fileFolder": "ssh",
        "hasDepth": false //是否有深度
    },
    "temp": {
        "unit": "degree",
        "standardname": "sea_water_temperature",
        "shortname": "temp",
        "fileFolder": "temp",
        "hasDepth": true
    },
    "u": {
        "unit": "m/s",
        "shortname": "u",
        "standardname": "eastward_sea_water_velocity",
        "fileFolder": "u",
        "hasDepth": true
    },
    "v": {
        "unit": "m/s",
        "shortname": "v",
        "standardname": "northward_sea_water_velocity",
        "fileFolder": "v",
        "hasDepth": true
    },
    "salinity": {
        "unit": "g/kg",
        "shortname": "salt",
        "standardname": "",
        "fileFolder": "salt",
        "IsDepth": true
    },
    "time": {
        "unit": "month"
    },
    "depth": {
        "unit": "m"
    }
};

var marginTop = 60;
$(".container-fluid.keen-dashboard").css("margin-top", marginTop);

// 设置热力图所在大div的高度
var leftColTopRowHight;
$("div.heatmap").height(
    function () {
        leftColTopRowHight = $(this).children("#heatmap").width() * 1.1;
        return leftColTopRowHight;
    }
);
// 设置热力图容器内所有子元素的高度一致
$("div.heatmap").children().height(leftColTopRowHight);
// 消除colorbar的左padding使得更紧凑
$("div.heatmap").children("#colorbar, #dateselector").css("padding-left", "0")


// 左列上行高度统一
$("div.leftcol-toprow").height(leftColTopRowHight);
// 左列下行高宽1:2.5
$("#parallel-coordinate").height(
    function(){
        return $(this).width() / 2.5;
    }
);

// 设置总container的高度
$(".container-fluid.keen-dashboard").height(
    function () {
        return $("html").height() - marginTop;
    }
);

// 重新设置总行两列同高
$(".first-row-right").height(
    function(){
        return $(".first-row-left").height() - parseFloat($(".keen-dashboard .chart-wrapper").css("margin-bottom"));
        // 在css里，$(".keen-dashboard .chart-wrapper").css("margin-bottom")为10px
    }
);

// 设置右列及其子元素的高度
$(".two-yAxis-charts").height(
    function(){
        h1 = $(".first-row-right").height() - $(".keen-dashboard .chart-wrapper .chart-title").height();
        h2 = h1 - 2*parseFloat($(".keen-dashboard .chart-wrapper").css("margin-bottom")) - parseFloat($(".keen-dashboard .chart-wrapper .chart-stage").css("padding-top"));
        // 在css里，margin-bottom是10px
        return h2;
    }
);
$(".two-yAxis-charts").children().height(
    function () {
        return $(this).parent().height()/3;
    }
);

function numToStr(num) {
    return num.toString().replace('.', 'p');
}

function strToNum(str) {
    return parseFloat(str.replace('p', '.'));
}

var svgSelector = d3.select("#heatmap svg")
var gSelector = svgSelector.append("g");
var colorInterp = chroma.scale("Spectral").domain([1, 0]).padding(0.1);
var requestDataInfo = {
    "attr": "temp",
    "time": "2007-04-16",
    "resulation": '0p2',
    "depth": '5.01m'
};
var projection = drawGeoMap(svgSelector, gSelector);
var colorbarSvg = d3.select("#colorbar svg"); //or false
drawHeatMap(gSelector, projection, requestDataInfo, colorInterp, colorbarSvg);

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