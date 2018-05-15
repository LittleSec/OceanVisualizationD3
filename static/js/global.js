/* 当前文件依赖项：
 * d3.js
 * resize.js
 */

// 各图表选择集
var hmChartsvg = d3.select("#heatmap svg");
var hmChartg = hmChartsvg.append("g");
var quiverChart = hmChartsvg.append("g")
var colorbarSvg = d3.select("#colorbar svg");
var twoYScatterChart = dc.compositeChart("#scatter");
var parallelChart = d3.select("#parallel");
var timeTendencyCharts = dc.compositeChart("#time-line-charts");
var timeRangeChart = dc.lineChart("#time-range-charts");
var depthTendencyCharts = dc.compositeChart("#depth-line-charts");

// 当前状态
var curdepth = '0.0m', 
    curdate = '2014-07-01', 
    curattr = 'surf_el';
var cur1d1dData, cur1x1yData, 
    ndx1d1dData, ndx1x1yData,
    curlonlat = [125.76, 22.88];
var curlonrange = [124.72, 126.48],
    curlatrange = [22.0, 23.84];

// 系统固定参数
var dateDomain = [new Date(2016, 4, 1), new Date(2017, 8, 30)]; // 月份从0月开始。。。。
var depthDomain = ['0.0m', '8.0m', '15.0m', '30.m', '50.0m'];
var numberFormat = d3.format(".6f");
var dateFormat = d3.time.format("%Y-%m-%d");
var resolution = 0.09; // 2/25 + exp，以免有间隙

// 热力图参数
var colorInterp = chroma.scale("Spectral").domain([1, 0]).padding(0.1);
var whm = parseFloat(hmChartsvg.style("width")); //这里不能用+代替，+字符串转数字是针对是字符串全是数字，这里的字符串带有单位
var hhm = parseFloat(hmChartsvg.style("height"));
// 定义地图的投影
var projection = d3.geo.mercator()
    .center([120.275, 22.525]) //必须指定中心，否则无法显示 //[109.475, 131.075], [12.025, 33.025]
    .scale(whm * 2.5)
    .translate([whm / 2, hhm / 2]);
var linearsWithAttr = {}; // 存放当前时刻和深度数据中各个属性的值的线性比例尺，用于着色
var minmaxWithAttr = {}; // 存放各个属性的最大最小值


// 双Y轴图参数
var y2attr1 = 'water_temp', y2attr2 = 'salinity';

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