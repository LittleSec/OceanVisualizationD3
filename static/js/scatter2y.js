/* 依赖项：
 * heatmap.js
 * 
 */

var xdim, xLeftdim, xRightdim, xLgroup, xRgroup;
var ndxlondim, ndxlatdim;

function draw2yScatter() {
    ndx1d1dData = crossfilter(cur1d1dData);
    ndxlondim = ndx1d1dData.dimension(function (d) {
        return +d.lon;
    });
    ndxlatdim = ndx1d1dData.dimension(function (d) {
        return +d.lat;
    });
    twoYScatterChart.margins({ top: 30, right: 30, bottom: 30, left: 30 })
        .shareTitle(false).elasticY(true)
        .legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
        .brushOn(false).xAxis().ticks(5);
    twoYScatterChart.yAxis().ticks(5);
    print2yScatter();
}

function print2yScatter() {
    var tmpattr = curattr;
    if(curattr in ['ow']){
        tmpattr = 'surl_el';
    }
    xdim = ndx1d1dData.dimension(function (d) {
        return +d[tmpattr];
    });
    xLeftdim = ndx1d1dData.dimension(function (d) {
        return [+d[tmpattr], +d[y2attr1]];
    });
    xRightdim = ndx1d1dData.dimension(function (d) {
        return [+d[tmpattr], +d[y2attr2]];
    });
    xLgroup = xLeftdim.group();
    xRgroup = xRightdim.group();
    var xllabel = tmpattr + ' -- ' + y2attr1;
    console.log('y2attr1: ' + y2attr1);
    var xrlabel = tmpattr + ' -- ' + y2attr2;
    twoYScatterChart
        .transitionDuration(1000)
        .dimension(xdim)
        .x(d3.scale.linear().domain(minmaxWithAttr[tmpattr]))
        .compose([
            dc.scatterPlot(twoYScatterChart)
                .dimension(xLeftdim)
                .group(xLgroup, xllabel) //字符串是用来设置图标的
                .nonemptyOpacity(0.1)
                .title(function (d) {
                    return [tmpattr + ': ' + d[0], y2attr1 + ': ' + d[1]].join('\n');
                }),
            dc.scatterPlot(twoYScatterChart)
                .dimension(xRightdim)
                .group(xRgroup, xrlabel)
                .nonemptyOpacity(0.1)
                .ordinalColors(["orange"])
                .useRightYAxis(true)
                .title(function (d) {
                    return [tmpattr + ': ' + d[0], y2attr2 + ': ' + d[1]].join('\n');
                })
        ])
        .xAxisLabel(tmpattr).yAxisLabel(y2attr1).rightYAxisLabel(y2attr2);
    twoYScatterChart.render();
}