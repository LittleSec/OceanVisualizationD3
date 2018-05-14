function drawQuiver(svgSelector, projection, dataInfo) {
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
            printQuiver(svgSelector, data);
        }
    });
}

function printQuiver(svgSelector, data) {
    var linear = d3.scale.linear()
        .domain(d3.extent(data, function (d) { return d.scalar; }))
        .range([0.3, 0.9]); // 线条的宽度，决定了箭头的大小
    var update = svgSelector.selectAll("line.arrow").data(data);
    var enter = update.enter();
    var exit = update.exit();

    enter.attr("x1", function (d) { return d.x1; })
        .attr("y1", function (d) { return d.y1; })
        .attr("x2", function (d) { return d.x2; })
        .attr("y2", function (d) { return d.y2; })
        .attr("stroke-width", function (d) { return linear(d.scalar); });
        //.attr("marker-end", "url(#arrow)");
        //.attr("class", "arrow");

    enter.append("line")
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

/*
d3.csv('../static/test.csv', function (err, data) {
    // var defs = svgSelector.append("defs");
    // var arrowMarker = defs.append("marker")
    //     .attr("id", "arrow")
    //     .attr("markerUnits", "strokeWidth")
    //     .attr("markerWidth", "6")
    //     .attr("markerHeight", "6")
    //     .attr("viewBox", "0 0 6 6")
    //     .attr("refX", "3")
    //     .attr("refY", "3")
    //     .attr("orient", "auto");
    // var arrow_path = "M3,1 L6,3 L3,5 L4,3 L3,1";
    // arrowMarker.append("path").attr("d", arrow_path)
    //     //.attr("fill", "none")
    //     .attr("stroke",'black')
    //     .attr("stroke-width", 0.8);
    data.forEach(function (e) {
        loc1 = projection([e.lon, e.lat]);
        loc2 = projection([e.lon1, e.lat1]);
        e.x1 = loc1[0];
        e.y1 = loc1[1];
        e.x2 = loc2[0];
        e.y2 = loc2[1];
    });
    var linear = d3.scale.linear().domain(d3.extent(data, function (d) { return d.scalar; })).range([0.3, 0.9]);
    svgSelector.selectAll("line").data(data).enter().append("line")
        .attr("x1", function (d) { return d.x1; })
        .attr("y1", function (d) { return d.y1; })
        .attr("x2", function (d) { return d.x2; })
        .attr("y2", function (d) { return d.y2; })
        .attr("stroke-width", function (d) { return linear(d.scalar); })
        .attr("marker-end", "url(#arrow)")
        .attr("class", "arrow");
});
*/