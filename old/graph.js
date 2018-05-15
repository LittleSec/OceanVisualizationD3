function drawScatter(svgSelector, twoDataInfo, color) {
    //key in twoDataInfo: resulation, file1 {attr, time, (option)depth}, file2
    var center = [];
    $.ajax({
        url: "/api/get_data_scatter",
        type: 'POST',
        data: JSON.stringify(twoDataInfo), //必须是字符串序列
        contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
        success: function (data, status) {
            // data无NaN
            data = JSON.parse(data);
            for (var i = 0; i < data.length; i++) {
                center.push([+data[i].x, +data[i].y]);
            } //也可以先分别设置dataX，dataY再一个for循环组合center，这样下面的语句就可以省掉

            var width = parseFloat(svgSelector.style("width")); //SVG绘制区域的宽度
            var height = parseFloat(svgSelector.style("height")); //SVG绘制区域的高度
            var xAxisWidth = width * 0.85; //x轴宽度
            var yAxisWidth = height * 0.85; //y轴宽度（高度）

            //x轴比例尺
            var xScale = d3.scale.linear()
                .domain(d3.extent(center, function (d) {
                    return d[0];
                }))
                .range([0, xAxisWidth]);

            //y轴比例尺
            var yScale = d3.scale.linear()
                .domain(d3.extent(center, function (d) {
                    return d[1];
                }))
                .range([0, yAxisWidth]);
            printCircle(svgSelector, center, xScale, yScale, color);
            printAxis(svgSelector, xScale, yScale, twoDataInfo["file1"]["attr"], twoDataInfo["file2"]["attr"]);
        }
    });
}

function printCircle(svgSelector, center, xScale, yScale, color) {
    var width = parseFloat(svgSelector.style("width")); //SVG绘制区域的宽度
    var height = parseFloat(svgSelector.style("height")); //SVG绘制区域的高度
    //外边框
    var padding = {
        top: height * 0.07,
        right: width * 0.07,
        bottom: height * 0.1,
        left: width * 0.1
    };

    var circleUpdate = svgSelector.selectAll("circle").data(center); //绑定数据
    var circleEnter = circleUpdate.enter();
    var circleExit = circleUpdate.exit();

    circleUpdate.transition() //更新数据时启动过渡
        .duration(500)
        .attr("cx", function (d) { //新的x坐标
            return padding.left + xScale(d[0]);
        })
        .attr("cy", function (d) { //新的y坐标
            return height - padding.bottom - yScale(d[1]);
        });

    circleEnter.append("circle") //添加元素
        .attr("fill", color)
        .style("opacity", 0.2)
        .attr("cx", padding.left) //过渡前的x坐标
        .attr("cy", height - padding.bottom) //过渡前的y坐标
        .attr("r", "0.2em")
        .transition() //启动添加元素时的过渡
        .duration(500) //设定过渡时间
        .attr("cx", function (d) { //过渡后的x坐标
            return padding.left + xScale(d[0]);
        })
        .attr("cy", function (d) { //过渡后的y坐标
            return height - padding.bottom - yScale(d[1]);
        });

    circleExit.transition() //删除数据时启动过渡
        .duration(500) //时间为500ms
        .attr("fill", "white") //设定过渡目标
        .remove();
}

function printAxis(svgSelector, xScale, yScale, xattr, yattr) {
    var width = parseFloat(svgSelector.style("width")); //SVG绘制区域的宽度
    var height = parseFloat(svgSelector.style("height")); //SVG绘制区域的高度
    // var xAxisWidth = width * 0.85; //x轴宽度
    var yAxisWidth = height * 0.85; //y轴宽度（高度）
    //外边框
    var padding = {
        top: height * 0.07,
        right: width * 0.07,
        bottom: height * 0.1,
        left: width * 0.1
    };
    svgSelector.selectAll("g.axis").remove(); // 移除原有的坐标轴

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(5)
        .innerTickSize(3)
        .outerTickSize(0)
        .tickFormat(d3.format("g"));

    yScale.range([yAxisWidth, 0]);

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5)
        .innerTickSize(3)
        .outerTickSize(0)
        .tickFormat(d3.format("g"));

    svgSelector.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + padding.left + "," + (height - padding.bottom) + ")")
        .call(xAxis);

    svgSelector.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + padding.left + "," + (height - padding.bottom - yAxisWidth) + ")")
        .call(yAxis);

    // 添加坐标轴说明
    svgSelector.append("text")
        .attr("x", width - padding.right)
        .attr("y", height - padding.bottom)
        .attr("dx", "0.5em")
        .attr("dy", "-0.5em")
        .attr("text-anchor", "end")
        .text(dataInfo[xattr].shortname + "(" + dataInfo[xattr].unit + ")");
    svgSelector.append("text")
        .attr("transform", "translate(" + padding.left + "," + (height - padding.bottom - yAxisWidth) + ")")
        .attr("text-anchor", "start")
        .text(dataInfo[yattr].shortname + "(" + dataInfo[yattr].unit + ")");

    yScale.range([0, yAxisWidth]);
}