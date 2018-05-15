/* 依赖项：
 * parallel-new.js
 * scatter2y.js
 * 
 */

var xScale = d3.scale.linear()
    .domain([0, whm])
    .range([0, whm]);

var yScale = d3.scale.linear()
    .domain([0, hhm])
    .range([0, hhm]);

var brush = d3.svg.brush()
    .x(xScale)
    .y(yScale)
    .extent([[0, 0], [0, 0]])
    .on("brush", brushed);

function brushed() {
    var extent = brush.extent();
    var pos0 = projection.invert(extent[0]);
    var pos1 = projection.invert(extent[1]);
    // 下面range数组都保证[0]<[1]
    curlonrange = [pos0[0], pos1[0]];
    curlatrange = [pos1[1], pos0[1]]; // 高纬度在上，低纬度在下
    // 重绘平行坐标图
    parallelChart.datum(mydata()).call(parachart);
    // nv.addGraph(parachart);

    // 重绘双y轴散点图
    ndxlondim.filterRange(curlonrange);
    ndxlatdim.filterRange(curlatrange);
    twoYScatterChart.redraw();
}