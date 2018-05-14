/* 这是flask与ajax的示例模板
var data = {
        "name": "hjx",
        "isOk": "true"
    };
$.ajax({
    url: "/api/test",
    type: 'POST',
    data: JSON.stringify(data), //必须是字符串序列
    contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
    success: function (data, status) {
        console.log(typeof(data));
        console.log(JSON.parse(data)); //data只能是string和json
    }
});*/

var curdata;

// 以下：print是真正绘图的，draw是前期准备例如数据然后调用print
// 其他js文件同理
function drawGeoMap(svgSelector, gSelector) {
    // 返回一个地图投影
    // 如果是更换地图，那么请先在调用函数前把原有的地图remove掉
    var width = parseFloat(svgSelector.style("width")); //这里不能用+代替，+字符串转数字是针对是字符串全是数字，这里的字符串带有单位
    var height = parseFloat(svgSelector.style("height"));
    // 定义地图的投影
    var projection = d3.geo.mercator()
        .center([120.275, 22.525]) //必须指定中心，否则无法显示 //[109.475, 131.075], [12.025, 33.025]
        .scale(width * 2.5)
        .translate([width / 2, height / 2]);

    d3.json("../static/oceanGeo.json", function (error, data) {
        if (error) {
            console.log(error);
        }
        // 定义地理路径生成器
        var geoPathGenerator = d3.geo.path()
            .projection(projection);
        printGeoMap(gSelector, geoPathGenerator, data);

        // 经纬网
        var lonlat = d3.geo.graticule()
            .extent([
                [109.475, 12.025],
                [131.075, 33.025]
            ]) //经度109.475-131.075, 纬度12.025-33.025
            .step([5, 5]); // 生成网格数据
        printLonLat(gSelector, geoPathGenerator, lonlat);
    });
    return projection;
}

function printGeoMap(gSelector, geoPathGenerator, geojson) {
    var update = gSelector.selectAll("path").data(geojson.geometries);
    var enter = update.enter();
    var exit = update.exit();

    update.attr("d", geoPathGenerator);
    enter.append("path")
        .attr("class", "geopath")
        .attr("d", geoPathGenerator);
    exit.remove();
}

function printLonLat(gSelector, geoPathGenerator, lonlat) {
    gSelector.append("path")
        .datum(lonlat)
        .attr("class", "latlon")
        .attr("d", geoPathGenerator);
}

// 以下全局变量在drawHeatMap()赋值并更新，只要改变数据集，调用drawHeatMap()即可更新
var linearsWithAttr = {}; // 存放当前时刻和深度数据中各个属性的值的线性比例尺，用于着色
var minmaxWithAttr = {}; // 存放各个属性的最大最小值

// todo: 后期在前端确认文件里无NaN值
function drawHeatMap(gSelector, projection, dataInfo, colorInterp, hasColorBarSvg) {
    // hasColorBar要么false，要么是个svg选择集
    // dataInfo["attr"] = 'ssh';
    // dataInfo["time"] = '2016-01-16';
    // dataInfo["depth"] = '0.0m';
    $.ajax({
        url: "/api/get_data_1date1depth",
        type: 'POST',
        data: JSON.stringify(dataInfo), //必须是字符串序列
        contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
        success: function (data, status) {
            // csv: [{lon:, lat:, value:}, {}, {}, ...]
            data = JSON.parse(data);
            var curdata = data.slice();
            var dimensions = d3.keys(data[0]);
            for (var i = 0; i < dimensions.length; i++) {
                var minmax = d3.extent(data, function (d) {
                    return +d[dimensions[i]];
                });
                minmaxWithAttr[dimensions[i]] = minmax;
                linearsWithAttr[dimensions[i]] = d3.scale.linear()
                    .domain(minmax)
                    .range([0, 1]);
            }
            data.forEach(function (d) {
                var xy = projection([d.lon, d.lat]);
                d.x = xy[0];
                d.y = xy[1];
            });
            printHeatMap(gSelector, projection, data, colorInterp, dataInfo["attr"]);
            if (hasColorBarSvg) {
                printColorBar(hasColorBarSvg, minmaxWithAttr[dataInfo["attr"]], colorInterp);
            }
            // 这个监听不能放外面，因为传的是当前的gSelector，是绑定了数据的gSelector
            $('input[type=radio][name=optionsRadios]').change(function () {
                changeAttrHeatMap(this.value, gSelector, colorInterp, colorbarSvg)
            });
            function mydata() {
                var data = [];
                for (var i in curdata) {
                    data.push({ "values": curdata[i] })
                }
                console.log(data);
                return data;
                // return [
                //     {
                //         values: {
                //             "P1": "13",
                //             "P2": "8",
                //             "P3": "360",
                //             "P4": "175",
                //             "P5": "3821",
                //             "P6": "11",
                //             "P7": "73"
                //         },
                //     }
                // ];
            }
            nv.addGraph(function () {

                var dim = dimensions1();
                chart = nv.models.parallelCoordinatesChart()
                    .dimensionData(dim)
                    .displayBrush(false)
                    .lineTension(0.85);
            
            
                var data = mydata();
                d3.select('#parallel')
                    .datum(data)
                    .call(chart);
                nv.utils.windowResize(chart.update);
            
            
                chart.dispatch.on('brushEnd', function (e) {
                    d3.select("#resetBrushButton").style("visibility", "visible");
                });
            
            
                chart.dispatch.on('dimensionsOrder', function (e, b) {
                    if (b) {
                        d3.select("#resetSortingButton").style("visibility", "visible");
                    }
                });
            
                return chart;
            });
        }
    });
}

function resetBrush() {
    chart.filters([]);
    chart.active([]);
    chart.displayBrush(true);
    d3.select("#resetBrushButton").style("visibility", "hidden");
    chart.update();
}

function resetSorting() {
    var dim = chart.dimensionData();
    dim.map(function (d) { return d.currentPosition = d.originalPosition; });
    dim.sort(function (a, b) { return a.originalPosition - b.originalPosition; });
    chart.dimensionData(dim);
    d3.select("#resetSortingButton").style("visibility", "hidden");
    chart.update();
}





function dimensions1() {
    return [
        {
            key: "lon",
            format: d3.format("0.2f"),
            tooltip: "lon",
        },
        {
            key: "lat",
            format: d3.format("0.2f"),
            tooltip: "lat",
        },
        {
            key: "surf_el",
            format: d3.format("0.6f"),
            tooltip: "surf_el",
        },
        {
            key: "salinity",
            format: d3.format("0.6f"),
            tooltip: "salinity",
        },
        {
            key: "water_temp",
            format: d3.format("0.6f"),
            tooltip: "water_temp",
        },
        {
            key: "water_u",
            format: d3.format("0.6f"),
            tooltip: "water_u",
        },
        {
            key: "water_v",
            format: d3.format("0.6f"),
            tooltip: "water_v",
        }
    ];
}



// 画热力图，更换数据集后初次调用
function printHeatMap(gSelector, projection, data, colorInterp, attr) {
    var step = 0.09; // 2/25 + exp，以免有间隙
    var linear = linearsWithAttr[attr];

    var update = gSelector.selectAll("rect").data(data);
    var enter = update.enter();
    var exit = update.exit();

    update.attr("x", function (d) {
        return d.x;
    })
        .attr("y", function (d) {
            return d.y;
        })
        .attr("width", function (d) {
            var xadd = projection([d.lon + step, d.lat])[0];
            return xadd - d.x;
        })
        .attr("height", function (d) {
            var yadd = projection([d.lon, d.lat + step])[1];
            return d.y - yadd;
        })
        .transition() //启动添加元素时的过渡
        .duration(2000) //设定过渡时间
        .style("fill", function (d) {
            return colorInterp(linear(d[attr]));
        });

    enter.append("rect")
        .attr("x", function (d) {
            return d.x;
        })
        .attr("y", function (d) {
            return d.y;
        })
        .attr("width", function (d) {
            var xadd = projection([d.lon + step, d.lat])[0];
            return xadd - d.x;
        })
        .attr("height", function (d) {
            var yadd = projection([d.lon, d.lat + step])[1];
            return d.y - yadd;
        })
        .on("mouseover", function (d) {
            console.log(d);
            var width = d3.select(this).attr("width");
            var height = d3.select(this).attr("height");
            d3.select(this).attr({
                "width": width * 2,
                "height": height * 2
            }).style("stroke", "black");
            d3.select(".hmtooltip").html(
                function () {
                    var t = "";
                    for (var k in d) {
                        t += (k + ": " + d[k].toFixed(2) + "</br>");
                    }
                    return t;
                }
            )
                .style("left", (d.x + "px"))
                .style("top", (d.y + "px"))
                .style("opacity", 1.0);
            //console.log(projection([d.lon, d.lat]));
        })
        .on("mouseout", function (d) {
            var width = d3.select(this).attr("width");
            var height = d3.select(this).attr("height");
            d3.select(this).attr({
                "width": width / 2,
                "height": height / 2
            }).style("stroke", "none");
            d3.select(".hmtooltip").style("opacity", 0.0);
        })
        .transition() //启动添加元素时的过渡
        .duration(2000) //设定过渡时间
        .style("fill", function (d) {
            return colorInterp(linear(d[attr]));
        });

    exit.remove();
}

// 画热力图，仅改变属性时直接调用
function changeAttrHeatMap(attr, gSelector, colorInterp, hasColorBarSvg) {
    var linear = linearsWithAttr[attr];

    gSelector.selectAll("rect")
        .transition() //启动添加元素时的过渡
        .duration(2000) //设定过渡时间
        .style("fill", function () {
            var p = d3.select(this)[0][0].__data__;
            return colorInterp(linear(p[attr]));
        });
    if (hasColorBarSvg) {
        printColorBar(hasColorBarSvg, minmaxWithAttr[attr], colorInterp);
    }
}

// 画颜色条
function printColorBar(svgSelector, minmax, colorInterp) {
    // 如果使用能指定配字个数的代码，那么传过来的选择集应该是g
    var min = minmax[0];
    var max = minmax[1];
    if (svgSelector.select("g")[0][0] == null) {
        svgSelector.append("g")
    }
    gSelector = svgSelector.append("g");
    var colorBarWidth = parseFloat(svgSelector.style("width")) * 0.3;
    var colorBarHeigth = 200; //也意味着共画几个矩形，一个矩形固定高度为1px
    var startX = 0;
    var startY = parseFloat(svgSelector.style("height")) - colorBarHeigth - 40; //预留配字，不然碰底了

    var linear = d3.scale.linear()
        .domain([0, colorBarHeigth])
        .range([1, 0]);
    var data = d3.range(0, colorBarHeigth);
    var update = gSelector.selectAll("rect").data(data);
    var enter = update.enter();
    var exit = update.exit();
    update.attr("x", startX)
        .attr("y", function (d) {
            return startY + d;
        })
        .attr("width", colorBarWidth)
        .attr("height", "1px")
        .style("fill", function (d) {
            return colorInterp(linear(d));
        });

    enter.append("rect")
        .attr("x", startX)
        .attr("y", function (d) {
            return startY + d;
        })
        .attr("width", colorBarWidth)
        .attr("height", "1px")
        .style("fill", function (d) {
            return colorInterp(linear(d));
        });

    exit.remove();

    // 配字
    // 固定只配最高和最低
    svgSelector.selectAll("text").remove();
    gSelector.append("text")
        .attr("x", startX)
        .attr("y", startY)
        .attr("dy", "-0.5em")
        .attr("text-anchor", "start")
        .attr("font-size", "1em")
        .transition() //启动添加元素时的过渡
        .duration(1000) //设定过渡时间
        .text(max.toFixed(2));

    gSelector.append("text")
        .attr("x", startX)
        .attr("y", startY + colorBarHeigth)
        .attr("dy", "1em")
        .attr("text-anchor", "start")
        .attr("font-size", "1em")
        .transition() //启动添加元素时的过渡
        .duration(1000) //设定过渡时间
        .text(min.toFixed(2));
    /* 以下版本是允许设置配字个数的，使用D3思想
    var num = 3; //配字个数
    var index = d3.range(0, num).map(function (d) {
        return d / (num - 1);
    }); //num = 3, 则index = [0, 0.5, 1]
    linear.domain([0, index[index.length - 1]]); //更改定义域
    linear.range([min, max]); //更改值域
    var text = {};
    for (var i = 0; i < num; i++) {
        text[index[i]] = linear(index[i]).toFixed(2);
    } //索引是0，1的某个值，值是对应的min到max的值

    update = selector.selectAll("text").data(index); //不是传text，text是个字典，不好绑定
    enter = update.enter();
    exit = update.exit();

    update.attr("x", startX + colorBarWidth)
        .attr("y", function (d) {
            return startY + colorBarHeigth * d;
        })
        .attr("dx", 2).attr("dy", "1em")
        //.attr("dy", "1.2em")
        .attr("text-anchor", "start")
        .attr("font-size", "0.7em")
        .text(function (d) {
            return text[d];
        });

    enter.append("text")
        .attr("x", startX + colorBarWidth)
        .attr("y", function (d) {
            return startY + colorBarHeigth * d;
        })
        .attr("dx", 2).attr("dy", "0.5em")
        //.attr("dy", "1.2em")
        .attr("text-anchor", "start")
        .attr("font-size", "0.7em")
        .text(function (d) {
            return text[d];
        });

    exit.remove();
    */
}