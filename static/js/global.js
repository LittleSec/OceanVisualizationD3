/* 当前文件依赖项：
 * d3.js
 * resize.js
 */

// 各图表选择集
var hmChartsvg = d3.select("#heatmap svg");
var hmChartg = hmChartsvg.append("g");
var hmBrushg = hmChartsvg.append("g").attr("class", "hmbrush");
var quiverChart = hmChartsvg.append("g");
var eddyChart = hmChartsvg.append("g").attr("class", "eddysG");
var colorbarSvg = d3.select("#colorbar svg");
var twoYScatterChart = dc.compositeChart("#scatter");
var parallelChart = d3.select("#parallel");
var timeTendencyCharts = dc.compositeChart("#time-line-charts", "line-group");
var timeRangeChart = dc.lineChart("#time-range-charts", "line-group");
var depthTendencyCharts = dc.compositeChart("#depth-line-charts");

// 当前状态
var curdepth = '0.0m', 
    curdate = '2016-07-03', 
    curattr = 'surf_el';
var cur1d1dData, cur1x1yData, 
    ndx1d1dData, ndx1x1yData,
    curlonlat = [128.24, 24.4];
var curlonrange = [124.72, 126.48],
    curlatrange = [22.0, 23.84];
var curOWdata, curOWstd, curOWcoef = 0.1;

// 系统固定参数
var dateDomain = [new Date(2014, 6, 1), new Date(2017, 8, 30)]; // 月份从0月开始。。。。
var depthDomain = ['0.0m', '8.0m', '15.0m', '30.m', '50.0m'];
var numberFormat = d3.format(".2f");
var dateFormat = d3.time.format("%Y-%m-%d");
var resolution = 0.09; // 2/25 + exp，以免有间隙

// 热力图参数
var colorInterp = chroma.scale("Spectral").domain([1, 0]).padding(0.1);
var whm = parseFloat(hmChartsvg.style("width")); //这里不能用+代替，+字符串转数字是针对是字符串全是数字，这里的字符串带有单位
var hhm = parseFloat(hmChartsvg.style("height"));

var projection = d3.geo.mercator() // 定义地图的投影
    .center([120.275, 22.525]) //必须指定中心，否则无法显示 //[109.475, 131.075], [12.025, 33.025]
    .scale(whm * 2.5)
    .translate([whm / 2, hhm / 2]);
var linearsWithAttr = {}; // 存放当前时刻和深度数据中各个属性的值的线性比例尺，用于着色
var minmaxWithAttr = {}; // 存放各个属性的最大最小值
var colorBarHeigth = 200; //也意味着共画几个矩形，一个矩形固定高度为1px
var linearsOW = [d3.scale.linear().range([0, 0.5]), d3.scale.linear().range([0.5, 1])]; // ow专属线性尺（们）

// 双Y轴图参数
var y2attr1 = 'salinity', y2attr2 = 'water_temp';

var attrInfo = {
    'lon': {
        'units': '°E'
    },
    'lat': {
        'units': '°N'        
    },
    'surf_el': {
        'units': 'm'
    },
    'water_temp': {
        'units': '°C'
    },
    'salinity': {
        'units': 'psu'
    },
    'velocity': {
        'units': 'm'
    },
    'water_u': {
        'units': 'm/s'
    },
    'water_v': {
        'units': 'm/s'
    },
    'sla': {
        'units': 'm'
    },
    'ow': {
        'units': 's^-2'
    }
};