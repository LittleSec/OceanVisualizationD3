/*
attrsRequest = {
    "resulation": "0p1",
    "time": "2001-01-16",
    "depth": "5.01m",
    "attrs": ["ssh","salt",...] // 注意可以控制顺序 //返回最多6个
};
*/


function drawParaller(svgSelector, attrsRequest) {
    // 不对requests合法性进行检查
    var padding = {
        top: 30,
        left: 10,
        bottom: 10,
        right: 10
    };

    var width = parseFloat(svgSelector.style("width"));
    var height = parseFloat(svgSelector.style("height"));

    var gw = width - padding.left - padding.right,
        gh = height - padding.top - padding.bottom;

    // x，y坐标的比例尺，属性数组
    var x = d3.scale.ordinal().rangePoints([0, gw], .5),
        dimensions,
        y = {};

    var line = d3.svg.line(); //线段生成器，不是比例尺。。。。

    var axis = d3.svg.axis()
        .orient("left")
        .ticks(8)
        .innerTickSize(3)
        .outerTickSize(3)
        .tickFormat(d3.format("g"));
    var background, foreground;

    //注意，这个svg实际上是g选择集
    var svg = svgSelector
        .append("g")
        .attr("transform", "translate(" + padding.left + "," + padding.top + ")");

    $.ajax({
        url: "/api/get_data_paraller",
        type: 'POST',
        data: JSON.stringify(attrsRequest), //必须是字符串序列
        contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
        success: function (data, status) {
            // data最多6个属性
            printParaller(JSON.parse(data));
        }
    });

    function printParaller(attrsdata) {
        // Extract the list of dimensions and create a scale for each.
        dimensions = d3.keys(attrsdata[0]);
        console.log(dimensions);
        // console.log(typeof(dimensions)); //竟然是个object!!
        x.domain(dimensions);
        for (var i = 0; i < dimensions.length; i++) {
            y[dimensions[i]] = d3.scale.linear()
                .domain(d3.extent(attrsdata, function (p) {
                    return +p[dimensions[i]];
                }))
                .range([gh, 0]);
        }

        // Add grey background lines for context.
        background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(attrsdata)
            .enter().append("path")
            .attr("d", path);

        // Add blue foreground lines for focus.
        foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(attrsdata)
            .enter().append("path")
            .attr("d", path);

        // Add a group element for each dimension.
        var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (d) {
                return "translate(" + x(d) + ")";
            });

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(axis.scale(y[d]));
            })
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", -9)
            .text(String);

        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function (d) {
                d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
    }

    // Returns the path for a given data point.
    function path(d) {
        return line(dimensions.map(function (p) {
            return [x(p), y[p](d[p])];
        }));
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        var actives = dimensions.filter(function (p) {
                return !y[p].brush.empty();
            }),
            extents = actives.map(function (p) {
                return y[p].brush.extent();
            });
        foreground.style("display", function (d) {
            return actives.every(function (p, i) {
                return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            }) ? null : "none";
        });
    }
}