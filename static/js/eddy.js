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
    dateIns.reload({ index: 0 }); // 重新设置滚动条

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
    drawEddyBoundaryAndCenter(requestDataInfo);
}

function changeDateEddy() {
    var requestDataInfo = {
        "time": curdate,
        "depth": curdepth,
        "scale": curScale
    };
    changeDepthOrDate(requestDataInfo)
    
    // quiver
    drawQuiver(requestDataInfo);

    // ssh edd
    drawEddyBoundaryAndCenter(requestDataInfo);

    // depth line chart
    var da = d3.time.day(new Date(curdate));
    dateDimension.filter(da);
    depthTendencyCharts.redraw();
}

// eddy模式下的非播放模式的绘图，只更新平行坐标图和散点图
function UpDateRedrawScaAndPara() {
    parallelChart.datum(mydata()).call(parachart);
    ndx1d1dData = crossfilter(cur1d1dData);
    draw2yScatter();
    // 这个监听不能放外面，因为传的是当前的gSelector，是绑定了数据的gSelector
    $('input.attroption').change(function () {
        // 这个option的值肯定不会是ow，因此不需要合理性判断
        curattr = this.value;
        printHeatMap(cur1d1dData);
        printColorBar();
        print2yScatter();
        changeTimeRangeChart();
    });
    $('input.attroption-special').change(function () {
        curattr = this.value;
        printHeatMap(cur1d1dData);
        printColorBar();
    });
}

// 绘边界和中心
function printEddyBoundaryAndCenter(data) {
    // 边界
    var update = eddyBoundaryChart.selectAll("path.eddy-line").data(data);
    var enter = update.enter();
    var exit = update.exit();

    update.attr("d", function (d) {
        return eddyBoundaryPath(d['boundaryProj']);
    }).attr("class", function (d) {
        if (d['type'] == 'warm') {
            return 'eddy-line warm-eddy';
        }
        else {
            return 'eddy-line cold-eddy';
        }
    });
    enter.append("path")
        .attr("d", function (d) {
            return eddyBoundaryPath(d['boundaryProj']);
        }).attr("class", function (d) {
            if (d['type'] == 'warm') {
                return 'eddy-line warm-eddy';
            }
            else {
                return 'eddy-line cold-eddy';
            }
        });

    exit.remove();

    // 中心
    update = eddyBoundaryChart.selectAll("rect.eddyhm").data(data);
    enter = update.enter();
    exit = update.exit();

    update.attr("x", function (d) {
        return d['centerProj'][0];
    })
        .attr("y", function (d) {
            return d['centerProj'][1];
        })
        .attr("width", function (d) {
            var xadd = projection([d['center'][0] + resolution, d['center'][1]])[0];
            return xadd - d['centerProj'][0];
        })
        .attr("height", function (d) {
            var yadd = projection([d['center'][0], d['center'][1] + resolution])[1];
            return d['centerProj'][1] - yadd;
        })
        .attr("class", function (d) {
            if (d['type'] == 'warm') {
                return 'eddyhm warm-center';
            }
            else {
                return 'eddyhm cold-center';
            }
        });

    enter.append("rect")
        .attr("x", function (d) {
            return d['centerProj'][0];
        })
        .attr("y", function (d) {
            return d['centerProj'][1];
        })
        .attr("width", function (d) {
            var xadd = projection([d['center'][0] + resolution, d['center'][1]])[0];
            return xadd - d['centerProj'][0];
        })
        .attr("height", function (d) {
            var yadd = projection([d['center'][0], d['center'][1] + resolution])[1];
            return d['centerProj'][1] - yadd;
        })
        .attr("class", function (d) {
            if (d['type'] == 'warm') {
                return 'eddyhm warm-center';
            }
            else {
                return 'eddyhm cold-center';
            }
        });

    exit.remove();
}

function drawEddyBoundaryAndCenter(dataInfo) {
    $.ajax({
        url: "/api/get_data_eddy",
        type: 'POST',
        data: JSON.stringify(dataInfo), //必须是字符串序列
        contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
        success: function (data, status) {
            curEddyData = data;
            curEddyData.forEach(function (d) {
                d['centerProj'] = projection(d['center']);
                pointsProj = [];
                d['points'].forEach(function (dd) {
                    pointsProj.push(projection(dd));
                });
                d['boundaryProj'] = pointsProj;
            });
            printEddyBoundaryAndCenter(curEddyData);
        }
    });
}



