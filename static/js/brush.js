
//x轴的比例尺
var xScale = d3.scale.linear()
    .domain([0, whm])
    .range([0, whm]);

//y轴的比例尺
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
    var rangeLon = [pos0[0], pos1[0]];
    var rangeLat = [pos1[1], pos0[1]]; // 高纬度在上，低纬度在下
    //console.log();
    parachar = getpara();
    parallelChart.datum(mydata(rangeLon, rangeLat)).call(parachar);
    nv.addGraph(getpara)
    //chart1.updata()
    // console.log(pos0);
    // console.log(pos1);
}