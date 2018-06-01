/* 依赖:
 * 1. linechart2yaxis.js
 * 2. quiver.js
 * 
 */

/* TODO
 * 2. 播放和停止按钮 在init.js
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
        console.log(obj.item.html()); //当前条目的元素对象
    });
}

function changeDateEddy() {
    var requestDataInfo = {
        "time": curdate,
        "depth": curdepth,
    };
    // 更新数据
    updateGlobalDataWithoutDraw(requestDataInfo);

    // quiver
    drawQuiver(requestDataInfo);

    // ssh edd
    drawEddy()

    // depth line chart
    var da = d3.time.day(new Date(curdate));
    dateDimension.filter(da);
    depthTendencyCharts.redraw();
}

// eddy模式下的更新数据，将不会重新绘图，毕竟绘图速度慢
function updateGlobalDataWithoutDraw(dataInfo) {
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
        }
    });
}

function drawEddy() {

}