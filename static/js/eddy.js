/* 依赖:
 * 1. linechart2yaxis.js
 * 2. quiver.js
 * 
 */
Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

// 根据当前选定的时间和日期间隔获取日期数组，用于播放
function getDateList(startDate, stopDate, steps) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(dateFormat(new Date(currentDate)));
        if (steps == 30) {
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        else {
            currentDate = currentDate.addDays(steps);
        }
    }
    return dateArray;
}

function setCarouselItem() {
    var startDate = new Date($('#date-pick').val());
    var stopDate = dateDomain[1];
    var steps = $('input.date-space-option:checked').val();
    var dateArray = getDateList(startDate, stopDate, +steps);

    var update = d3.select('div#date-carousel div').selectAll('div').data(dateArray);
    var enter = update.enter();
    var exit = update.exit();

    update.text(function (d) { return d; });
    enter.append('div').text(function (d) { return d; });
    exit.remove();
    dateIns.reload(); // 重新设置滚动条

    //监听轮播切换事件
    carousel.on('change(date-carousel)', function (obj) { //date-carousel来源于对应HTML容器的 lay-filter="date-carousel" 属性值
        curdate = obj.item.html();
        // console.log(obj.item.html()); //当前条目的元素对象
        // 更改当前日期选择器中日期
        laydate.render({
            elem: '#date-pick',
            value: curdate
        });
        changeDateEddy();
    });
}

// 改变滑条，默认非播放模式才能滑动
function changeSSHextScale(value) {
    curScale = +value;
    // console.log(scale);
    var requestDataInfo = {
        "time": curdate,
        "scale": curScale
    };
    drawEddy(requestDataInfo);
}

function changeDateEddy() {
    var requestDataInfo = {
        "time": curdate,
        "depth": curdepth,
        "scale": curScale
    };
    // 更新数据，因为请求数据后前端也需要处理
    if(! isAutoPlay){
        UpDateRedrawScaAndPara(requestDataInfo);
    }

    // quiver
    drawQuiver(requestDataInfo);

    // ssh edd
    drawEddy(requestDataInfo);

    // depth line chart
    var da = d3.time.day(new Date(curdate));
    dateDimension.filter(da);
    depthTendencyCharts.redraw();
}

// eddy模式下的非播放模式的绘图，只更新平行坐标图和散点图
function UpDateRedrawScaAndPara(dataInfo) {
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
                if ($.inArray(dimensions[i], ['lat', 'lon', 'ow']) != -1) {
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
            ndx1d1dData = crossfilter(cur1d1dData);
            parallelChart.datum(mydata()).call(parachart);
            ndx1d1dData = crossfilter(cur1d1dData);
            draw2yScatter();
            // 这个监听不能放外面，因为传的是当前的gSelector，是绑定了数据的gSelector
            $('input.attroption').change(function () {
                // 这个option的值肯定不会是ow，因此不需要合理性判断
                curattr = this.value;
                print2yScatter();
                changeTimeRangeChart();
            });
            $('input.attroption-special').change(function () {
                curattr = this.value;
            });
        }
    });
}

function printEddy(data) {
    var linear = linearsWithAttr['surf_el'];
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
        .duration(1500) //设定过渡时间
        .style("fill", function (d) {
            return colorInterp(linear(d['surf_el']));
        })
        .attr("class", function (d) {
            if (d['eddy'] == WARMEDDYCENTER) {
                return 'hm warm-center';
            }
            else if (d['eddy'] == WARMEDDYSCALE) {
                return 'hm warm-eddy';
            }
            else if (d['eddy'] == COLDEDDYCENTER) {
                return 'hm cold-center';
            }
            else if (d['eddy'] == COLDEDDYSCALE) {
                return 'hm cold-eddy';
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
        .transition() //启动添加元素时的过渡
        .duration(1500) //设定过渡时间
        .style("fill", function (d) {
            return colorInterp(linear(d['surf_el']));
        })
        .attr("class", function (d) {
            if (d['eddy'] == WARMEDDYCENTER) {
                return 'hm warm-center';
            }
            else if (d['eddy'] == WARMEDDYSCALE) {
                return 'hm warm-eddy';
            }
            else if (d['eddy'] == COLDEDDYCENTER) {
                return 'hm cold-center';
            }
            else if (d['eddy'] == COLDEDDYSCALE) {
                return 'hm cold-eddy';
            }
        });

    exit.transition() //启动添加元素时的过渡
        .duration(1500) //设定过渡时间
        .remove();
}

function drawEddy(dataInfo) {
    $.ajax({
        url: "/api/get_data_eddy",
        type: 'POST',
        data: JSON.stringify(dataInfo), //必须是字符串序列
        contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
        success: function (data, status) {
            curEddyData = JSON.parse(data);
            var minmax = d3.extent(curEddyData, function (d) {
                return +d['surf_el'];
            });
            minmaxWithAttr['surf_el'] = minmax;
            linearsWithAttr['surf_el'] = d3.scale.linear()
                .domain(minmax)
                .range([0, 1]);
            curEddyData.forEach(function (d) {
                var xy = projection([d.lon, d.lat]);
                d.x = xy[0];
                d.y = xy[1];
            });
            printColorBar();
            printEddy(curEddyData);
        }
    });
}