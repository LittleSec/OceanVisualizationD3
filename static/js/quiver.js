function drawQuiver(dataInfo) {
    // dataInfo['time'] = '2014-06-01'
    // dataInfo['depth'] = '0.0m'
    $.ajax({
        url: "/api/get_data_quiver",
        type: 'POST',
        data: JSON.stringify(dataInfo),
        contentType: 'application/json; charset=UTF-8',
        success: minmax = function (data, status) {
            data = JSON.parse(data);
            data.forEach(function (e) {
                loc1 = projection([+e.lon, +e.lat]);
                loc2 = projection([+e.lon1, +e.lat1]);
                e.x1 = loc1[0];
                e.y1 = loc1[1];
                e.x2 = loc2[0];
                e.y2 = loc2[1];
            });
            printQuiver(data);
            $("input[type=checkbox][value=quiver]").change(function(){
                if($(this).is(':checked')){
                    d3.selectAll("line.arrow").style("opacity", 1.0);
                }else{
                    d3.selectAll("line.arrow").style("opacity", 0.0);
                }
            });
        }
    });
}

function printQuiver(data) {
    var linear = d3.scale.linear()
        .domain(d3.extent(data, function (d) { return d.scalar; }))
        .range([0.5, 0.9]); // 线条的宽度，决定了箭头的大小
    var update = quiverChart.selectAll("line.arrow").data(data);
    var enter = update.enter();
    var exit = update.exit();

    update.transition().duration(2000)
        .attr("x1", function (d) { return d.x1; })
        .attr("y1", function (d) { return d.y1; })
        .attr("x2", function (d) { return d.x2; })
        .attr("y2", function (d) { return d.y2; })
        .attr("stroke-width", function (d) { return linear(d.scalar); });
        //.attr("marker-end", "url(#arrow)");
        //.attr("class", "arrow");

    enter.append("line").transition().duration(2000)
        .attr("x1", function (d) { return d.x1; })
        .attr("y1", function (d) { return d.y1; })
        .attr("x2", function (d) { return d.x2; })
        .attr("y2", function (d) { return d.y2; })
        .attr("stroke-width", function (d) { return linear(d.scalar); })
        .attr("marker-end", "url(#arrow)")
        .attr("class", "arrow");

    exit.transition() //启动添加元素时的过渡
        .duration(100) //设定过渡时间
        .remove();
}