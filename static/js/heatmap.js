/* 依赖:
 * 1. linechart2yaxis.js
 * 
 */

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

// 以下：print是真正绘图的，draw是前期准备例如数据然后调用print
// 其他js文件同理
function drawGeoMap(hmChartg) {
    d3.json("../static/oceanGeo.json", function (error, data) {
        if (error) {
            console.log(error);
        }
        // 定义地理路径生成器
        var geoPathGenerator = d3.geo.path()
            .projection(projection);
        printGeoMap(hmChartg, geoPathGenerator, data);

        // 经纬网
        var lonlat = d3.geo.graticule()
            .extent([
                [109.475, 12.025],
                [131.075, 33.025]
            ]) //经度109.475-131.075, 纬度12.025-33.025
            .step([5, 5]); // 生成网格数据
        printLonLat(hmChartg, geoPathGenerator, lonlat);
    });
}

function printGeoMap(gSelector, geoPathGenerator, geojson) {
    var update = hmChartg.selectAll("path.geopath").data(geojson.geometries);
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

function changeDepthOrDate(dataInfo) {
    // 获取正常属性并绘图，设置各全局变量，平行坐标图和散点图是无论是否选中都要更换的
    drawQuiver(dataInfo);
    // 获取ow的标准差，设置对应的线性比例尺（们）
    $.ajax({
        url: "/api/get_ow_std",
        type: 'POST',
        data: JSON.stringify(dataInfo), //必须是字符串序列
        contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
        success: function (data, status) {
            // data: {std: value}
            // var respond = JSON.parse(data);
            curOWstd = data['std'];
            minmaxWithAttr['ow'] = [-curOWstd, curOWstd];
            linearsOW[0].domain([curOWstd, curOWstd * curOWcoef]);
            linearsOW[1].domain([-curOWstd * curOWcoef, -curOWstd]);
        }
    });
    // 获取ow数据并绘图，一般来说标准差比ow数据早到达前段。
    // 所以其实并没有代码去判断ow的标准差是否更新
    $.ajax({
        url: "/api/get_data_1date1depth",
        type: 'POST',
        data: JSON.stringify(dataInfo), //必须是字符串序列
        contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
        success: function (data, status) {
            // csv: [{lon:, lat:, value:}, {}, {}, ...]
            cur1d1dData = JSON.parse(data);
            // cur1d1dData = data.slice();
            var dimensions = d3.keys(cur1d1dData[0]);
            for (var i = 0; i < dimensions.length; i++) {
                if (dimensions[i] in ['lon', 'lat', 'ow']) {
                    continue;
                }
                var minmax = d3.extent(cur1d1dData, function (d) {
                    return +d[dimensions[i]];
                });
                minmaxWithAttr[dimensions[i]] = minmax;
                linearsWithAttr[dimensions[i]] = d3.scale.linear()
                    .domain(minmax)
                    .range([0, 1]);
            }
            cur1d1dData.forEach(function (d) {
                var xy = projection([d.lon, d.lat]);
                d.x = xy[0];
                d.y = xy[1];
            });
            if (curattr != 'ow') {
                printHeatMap(cur1d1dData);
            }
            else {
                printOWHeatMap(cur1d1dData);
            }
            addTooltip();
            printColorBar();
            // 以下图是即使不是选中常规属性，也是要更换的图
            parallelChart.datum(mydata()).call(parachart);
            ndx1d1dData = crossfilter(cur1d1dData);
            draw2yScatter();
            // 这个监听不能放外面，因为传的是当前的gSelector，是绑定了数据的gSelector
            $('input.attroption').change(function () {
                // 这个option的值肯定不会是ow或sla，因此不需要合理性判断
                curattr = this.value;
                printHeatMap(cur1d1dData);
                printColorBar();
                print2yScatter();
                changeTimeRangeChart();
            });
            $('input.attroption-special').change(function () {
                curattr = this.value;
                printOWHeatMap(cur1d1dData);
                printColorBar();
            });
        }
    });
}

// 画热力图，更换数据集后初次调用
function printHeatMap(data) {
    var linear = linearsWithAttr[curattr];
    var update = hmChartg.selectAll("rect.hm").data(data);
    var enter = update.enter();
    var exit = update.exit();

    update.attr("x", function (d) {
        return d.x;
    })
        .attr("y", function (d) {
            return d.y;
        })
        .attr("width", function (d) {
            var xadd = projection([d.lon + resolution, d.lat])[0];
            return xadd - d.x;
        })
        .attr("height", function (d) {
            var yadd = projection([d.lon, d.lat + resolution])[1];
            return d.y - yadd;
        })
        .transition() //启动添加元素时的过渡
        .duration(2000) //设定过渡时间
        .style("fill", function (d) {
            return colorInterp(linear(d[curattr]));
        });

    enter.append("rect")
        .attr("x", function (d) {
            return d.x;
        })
        .attr("y", function (d) {
            return d.y;
        })
        .attr("width", function (d) {
            var xadd = projection([d.lon + resolution, d.lat])[0];
            return xadd - d.x;
        })
        .attr("height", function (d) {
            var yadd = projection([d.lon, d.lat + resolution])[1];
            return d.y - yadd;
        })
        .attr("class", "hm")
        .transition() //启动添加元素时的过渡
        .duration(2000) //设定过渡时间
        .style("fill", function (d) {
            return colorInterp(linear(d[curattr]));
        });

    exit.remove();
}

// 绑定数据是cur1d1dData才能调用！！
function addTooltip() {
    hmChartg.selectAll("rect.hm")
        .on("click", function (d) {
            curlonlat = [d.lon, d.lat];
            console.log(curlonlat);
            var reqDataInfo = {
                'lon': curlonlat[0],
                'lat': curlonlat[1]
            };
            change1x1y(reqDataInfo);
        })
        .on("mouseover", function (d) {
            d3.select(this)
                .style("stroke", "black")
                .style("stroke-width", "1px");
            d3.select(".hmtooltip").html(
                function () {
                    var t = "";
                    for (var k in d) {
                        if (k == 'x' || k == 'y') {
                            continue;
                        }
                        // console.log(k);
                        t += ("<p>" + k + ":&nbsp" + numberFormat(d[k]) + "&nbsp" + attrInfo[k]['units'] + "</p>");
                    }
                    return t;
                }
            )
                .style("opacity", 1.0);
            // console.log(projection([d.lon, d.lat]));
        })
        .on("mouseout", function (d) {
            d3.select(this).style("stroke", "none");
            // d3.select(".hmtooltip").style("opacity", 0.0);
        });

}

// 画ow热力图，主要是线性尺的不同
function printOWHeatMap(data) {
    var update = hmChartg.selectAll("rect.hm").data(data);
    var enter = update.enter();
    var exit = update.exit();

    update.attr("x", function (d) {
        return d.x;
    })
        .attr("y", function (d) {
            return d.y;
        })
        .attr("width", function (d) {
            var xadd = projection([d.lon + resolution, d.lat])[0];
            return xadd - d.x;
        })
        .attr("height", function (d) {
            var yadd = projection([d.lon, d.lat + resolution])[1];
            return d.y - yadd;
        })
        .transition() //启动添加元素时的过渡
        .duration(2000) //设定过渡时间
        .style("fill", function (d) {
            var threshold = curOWstd * curOWcoef;
            if (d[curattr] <= -curOWstd) {
                return colorInterp(1);
            }
            else if (-curOWstd < d[curattr] && d[curattr] <= -threshold) {
                return colorInterp(linearsOW[1](d[curattr]));
            }
            else if (-threshold < d[curattr] && d[curattr] <= threshold) {
                return colorInterp(0.5);
            }
            else if (threshold < d[curattr] && d[curattr] <= curOWstd) {
                return colorInterp(linearsOW[0](d[curattr]));
            }
            else {
                return colorInterp(0);
            }
        });

    enter.append("rect")
        .attr("x", function (d) {
            return d.x;
        })
        .attr("y", function (d) {
            return d.y;
        })
        .attr("width", function (d) {
            var xadd = projection([d.lon + resolution, d.lat])[0];
            return xadd - d.x;
        })
        .attr("height", function (d) {
            var yadd = projection([d.lon, d.lat + resolution])[1];
            return d.y - yadd;
        })
        .attr("class", "hm")
        .transition() //启动添加元素时的过渡
        .duration(2000) //设定过渡时间
        .style("fill", function (d) {
            var threshold = curOWstd * curOWcoef;
            if (d[curattr] <= -curOWstd) {
                return colorInterp(1);
            }
            else if (-curOWstd < d[curattr] && d[curattr] <= -threshold) {
                return colorInterp(linearsOW[1](d[curattr]));
            }
            else if (-threshold < d[curattr] && d[curattr] <= threshold) {
                return colorInterp(0.5);
            }
            else if (threshold < d[curattr] && d[curattr] <= curOWstd) {
                return colorInterp(linearsOW[0](d[curattr]));
            }
            else {
                return colorInterp(0);
            }
        });

    exit.remove();
}

colorbarSvg.on("click", function () {
    d3.select(".hmtooltip").style("opacity", 0.0);
})

// 每次调用都去除再重画
function printColorBar() {
    // 如果使用能指定配字个数的代码，那么传过来的选择集应该是g
    console.log('colorbar, now is: ' + curattr + ', minmax is: ' + minmaxWithAttr[curattr]);
    var min = minmaxWithAttr[curattr][0];
    var max = minmaxWithAttr[curattr][1];
    if (colorbarSvg.select("g.colorbar")[0][0] == null) {
        colorbarSvg.append("g").attr("class", "colorbar");
    }
    gSelector = colorbarSvg.select("g.colorbar");
    var colorBarWidth = parseFloat(colorbarSvg.style("width")) * 0.3;
    var startX = 0;
    var startY = parseFloat(colorbarSvg.style("height")) - colorBarHeigth - 40; //预留配字，不然碰底了

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

    //画刷子
    var yScale2 = d3.scale.linear()
        .domain(minmaxWithAttr[curattr])
        .range([colorBarHeigth, 0]);
    var axis = d3.svg.axis()
        .scale(yScale2)
        .orient("right")
        .ticks(0);
    if (colorbarSvg.select("g.axisbrush")[0][0] == null) {
        colorbarSvg.append("g").attr("class", "axisbrush axis");
    }
    cbBrushg = colorbarSvg.select("g.axisbrush").attr("transform", ("translate(" + (startX + colorBarWidth / 2) + "," + startY + ")"));
    cbBrushg.call(axis);
    cbBrushg.call(brushCB.y(yScale2));
    cbBrushg.selectAll("rect").attr("x", -8)
        .attr("width", 16).style("stroke", "black")
        .style("fill-opacity", 0.3);

    // 配字
    // 固定只配最高和最低
    colorbarSvg.selectAll("text").remove();
    gSelector.append("text")
        .attr("x", startX)
        .attr("y", startY)
        .attr("dy", "-0.5em")
        .attr("text-anchor", "start")
        .attr("font-size", "1em")
        .transition() //启动添加元素时的过渡
        .duration(1000) //设定过渡时间
        .text(max.toFixed(2) + attrInfo[curattr]['units']);

    gSelector.append("text")
        .attr("x", startX)
        .attr("y", startY + colorBarHeigth)
        .attr("dy", "1em")
        .attr("text-anchor", "start")
        .attr("font-size", "1em")
        .transition() //启动添加元素时的过渡
        .duration(1000) //设定过渡时间
        .text(min.toFixed(2) + attrInfo[curattr]['units']);
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

// 这里是指修改颜色条刷子的定义域和最大小值的文字而已
function changeColorBar() {
    var yScale2 = d3.scale.linear()
        .domain(minmaxWithAttr[curattr])
        .range([0, colorBarHeigth]);
    cbBrushg.call(yScale2.brush = d3.svg.brush().y([0, colorBarHeigth]).on("brush", brush));
    cbBrushg.selectAll("rect").attr("x", -8).attr("width", 16);

}