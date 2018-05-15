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

// todo: 后期在前端确认文件里无NaN值
function drawHeatMap(dataInfo) {
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
            cur1d1dData = data.slice();
            var dimensions = d3.keys(data[0]);
            for (var i = 0; i < dimensions.length; i++) {
                if(dimensions[i] in ['lon', 'lat']){
                    continue;
                }
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
            printHeatMap(data);
            printColorBar();
            // 这个监听不能放外面，因为传的是当前的gSelector，是绑定了数据的gSelector
            $('input[type=radio][name=optionsRadios]').change(function () {
                curattr = this.value;
                changeAttrHeatMap()
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
        .on("mouseenter", function (d) {
            d3.select(this)
                .style("transform", "scale(3,3)")
                .style("stroke", "black")
                .style("stroke-width","2px");
            d3.select(".hmtooltip").html(
                function () {
                    var t = "";
                    for (var k in d) {
                        if(k == 'x' || k == 'y'){
                            continue;
                        }
                        t += (k + ": " + d[k].toFixed(2) + "</br>");
                    }
                    return t;
                }
            )
                .style("opacity", 1.0);
            //console.log(projection([d.lon, d.lat]));
        })
        .on("mouseleave", function (d) {
            d3.select(this).style("transform", "scale(1, 1)").style("stroke", "none");
            // d3.select(".hmtooltip").style("opacity", 0.0);
        })
        .transition() //启动添加元素时的过渡
        .duration(2000) //设定过渡时间
        .style("fill", function (d) {
            return colorInterp(linear(d[curattr]));
        });

    exit.remove();
}

// 画热力图，仅改变属性时直接调用
function changeAttrHeatMap() {
    var linear = linearsWithAttr[curattr];

    hmChartg.selectAll("rect")
        .transition() //启动添加元素时的过渡
        .duration(2000) //设定过渡时间
        .style("fill", function () {
            var p = d3.select(this)[0][0].__data__;
            return colorInterp(linear(p[curattr]));
        });
    printColorBar();
}

colorbarSvg.on("click", function(){
    d3.select(".hmtooltip").style("opacity", 0.0);
})

// 画颜色条
function printColorBar() {
    // 如果使用能指定配字个数的代码，那么传过来的选择集应该是g
    var min = minmaxWithAttr[curattr][0];
    var max = minmaxWithAttr[curattr][1];
    if (colorbarSvg.select("g")[0][0] == null) {
        colorbarSvg.append("g")
    }
    gSelector = colorbarSvg.append("g");
    var colorBarWidth = parseFloat(colorbarSvg.style("width")) * 0.3;
    var colorBarHeigth = 200; //也意味着共画几个矩形，一个矩形固定高度为1px
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