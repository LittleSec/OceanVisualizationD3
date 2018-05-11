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

function numToStr(num) {
    return num.toString().replace('.', 'p');
}

function strToNum(str) {
    return parseFloat(str.replace('p', '.'));
}

$("#year").change(function () {
    var year = $("#year option:selected").html();
    var month = $("#month option:selected").html();
    var fileName = year.toString() + '-' + month.toString() + '-16.csv';
    //console.log(fileName);
    readAndDraw(fileName, 0.12);
});

$("#month").change(function () {
    var year = $("#year option:selected").html();
    var month = $("#month option:selected").html();
    var fileName = year.toString() + '-' + month.toString() + '-16.csv';
    //console.log(fileName);
    readAndDraw(fileName, 0.12);
});

// var svgSelector = d3.select("#heatmap svg")
// var gSelector = svg.append("g");
// var compute = chroma.scale("Spectral").domain([0, 1]).padding(0.1);

//以下：print是真正绘图的，draw是前期准备例如数据然后调用print
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

// todo: 后期再前端确认文件里无NaN值
function drawHeatMap(gSelector, projection, dataInfo, colorInterp, hasColorBarSvg) {
    // hasColorBar要么false，要么是个svg选择集
    // dataInfo["attr"] = 'ssh';
    // dataInfo["time"] = '2001-01-16';
    // dataInfo["depth"] = '5p01m';
    // dataInfo["resulation"] = '0p1';
    var minmax = [],
        data = [];
    $.ajax({
        url: "/api/get_data_heatmap",
        type: 'POST',
        data: JSON.stringify(dataInfo), //必须是字符串序列
        contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
        success: minmax = function (csv, status) {
            // csv: [{lon:, lat:, value:}, {}, {}, ...]
            csv = JSON.parse(csv);
            for (var i = 0; i < csv.length; i++) {
                if (csv[i].value != 'NaN') {
                    data.push([+csv[i].lon, +csv[i].lat, +csv[i].value]);
                }
            }
            minmax = printHeatMap(gSelector, projection, data, colorInterp, strToNum(dataInfo["resulation"]));
            if (hasColorBarSvg) {
                printColorBar(hasColorBarSvg, minmax[0], minmax[1], colorInterp);
            }
        }
    });
}

function printHeatMap(gSelector, projection, data, colorInterp, step) {
    // 返回数据中的最大最小值，一个数组
    var minmax = d3.extent(data, function (d) {
        return d[2];
    });

    var linear = d3.scale.linear()
        .domain([minmax[0], minmax[1]])
        .range([0, 1]);

    var update = gSelector.selectAll("rect").data(data);
    var enter = update.enter();
    var exit = update.exit();

    update.attr("x", function (d) {
            return projection([d[0], d[1]])[0];
        })
        .attr("y", function (d) {
            return projection([d[0], d[1]])[1];
        })
        .attr("width", function (d) {
            var xadd = projection([d[0] + step, d[1]])[0];
            var x = projection([d[0], d[1]])[0];
            return xadd - x;
        })
        .attr("height", function (d) {
            var yadd = projection([d[0], d[1] + step])[1];
            var y = projection([d[0], d[1]])[1];
            return y - yadd;
        })
        .transition() //启动添加元素时的过渡
        .duration(500) //设定过渡时间
        .style("fill", function (d) {
            return colorInterp(linear(d[2]));
        });

    enter.append("rect")
        .attr("x", function (d) {
            return projection([d[0], d[1]])[0];
        })
        .attr("y", function (d) {
            return projection([d[0], d[1]])[1];
        })
        .attr("width", function (d) {
            var xadd = projection([d[0] + step, d[1]])[0];
            var x = projection([d[0], d[1]])[0];
            return xadd - x;
        })
        .attr("height", function (d) {
            var yadd = projection([d[0], d[1] + step])[1];
            var y = projection([d[0], d[1]])[1];
            return y - yadd;
        })
        .on("mouseover", function (d) {
            var width = d3.select(this).attr("width");
            var height = d3.select(this).attr("height");
            d3.select(this).attr({
                "width": width*2,
                "height": height*2
            }).style("stroke", "black");
            //console.log(projection([d[0], d[1]]));
        })
        .on("mouseout", function (d) {
            var width = d3.select(this).attr("width");
            var height = d3.select(this).attr("height");
            d3.select(this).attr({
                "width": width/2,
                "height": height/2
            }).style("stroke", "none");
        })
        .transition() //启动添加元素时的过渡
        .duration(500) //设定过渡时间
        .style("fill", function (d) {
            return colorInterp(linear(d[2]));
        });

    exit.transition() //启动添加元素时的过渡
        .duration(500) //设定过渡时间
        .remove();

    return minmax;
}

function printColorBar(svgSelector, min, max, colorInterp) {
    // 如果使用能指定配字个数的代码，那么传过来的选择集应该是g
    svgSelector.selectAll("g").remove();
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
        .text(max.toFixed(2));

    gSelector.append("text")
        .attr("x", startX)
        .attr("y", startY + colorBarHeigth)
        .attr("dy", "1em")
        .attr("text-anchor", "start")
        .attr("font-size", "1em")
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