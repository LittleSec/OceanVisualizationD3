/* 依赖项：
 * parallel-new.js
 * scatter2y.js
 * 
 */

var xScale = d3.scale.linear()
    .domain([0, whm])
    .range([0, whm]);

var yScale1 = d3.scale.linear()
    .domain([0, hhm])
    .range([0, hhm]);

var brushHM = d3.svg.brush()
    .x(xScale)
    .y(yScale1)
    .extent([[0, 0], [0, 0]])
    .on("brush", brushed1);

// 热力图上的范围选择brush
function brushed1() {
    var extent = brushHM.extent();
    var pos0 = projection.invert(extent[0]);
    var pos1 = projection.invert(extent[1]);
    console.log(pos0);
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

var brushCB = d3.svg.brush()
    //.y(yScale2)
    .extent([0, 0])
    .on("brush", brushed2)

function brushed2(){
    var extent = brushCB.extent();
    console.log(extent);
}