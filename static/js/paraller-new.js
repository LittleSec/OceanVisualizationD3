
function getpara() {

    var dim = dimensions();
    chart = nv.models.parallelCoordinatesChart()
        .dimensionData(dim)
        .displayBrush(false)
        .lineTension(0.85);


    // var data = mydata([0,0],[0,0]);
    // parallelChart
    //     .datum(data)
    //     .call(chart);

    nv.utils.windowResize(chart.update);


    chart.dispatch.on('brushEnd', function (e) {
        d3.select("#resetBrushButton").style("visibility", "visible");
    });


    chart.dispatch.on('dimensionsOrder', function (e, b) {
        if (b) {
            d3.select("#resetSortingButton").style("visibility", "visible");
        }
    });
    console.log(chart);

    return chart;
}

function resetBrush() {
    chart.filters([]);
    chart.active([]);
    chart.displayBrush(true);
    d3.select("#resetBrushButton").style("visibility", "hidden");
    chart.update();
}

function resetSorting() {
    var dim = chart.dimensionData();
    dim.map(function (d) { return d.currentPosition = d.originalPosition; });
    dim.sort(function (a, b) { return a.originalPosition - b.originalPosition; });
    chart.dimensionData(dim);
    d3.select("#resetSortingButton").style("visibility", "hidden");
    chart.update();
}

function mydata(rangeLon, rangeLat) {
    var data = [];
    for (var i in cur1d1dData) {
        if (cur1d1dData[i]['lon'] < rangeLon[0] ||
            cur1d1dData[i]['lon'] > rangeLon[1] ||
            cur1d1dData[i]['lat'] < rangeLat[0] ||
            cur1d1dData[i]['lat'] > rangeLat[1]
        ) {
            continue;
        }
        data.push({ "values": cur1d1dData[i] })
    }
    console.log(data);
    return data;
    // return [
    //     {
    //         values: {
    //             "P1": "13",
    //             "P2": "8",
    //             "P3": "360",
    //             "P4": "175",
    //             "P5": "3821",
    //             "P6": "11",
    //             "P7": "73"
    //         },
    //     }
    // ];
}

function dimensions() {
    return [
        {
            key: "lon",
            format: d3.format("0.2f"),
            tooltip: "lon",
        },
        {
            key: "lat",
            format: d3.format("0.2f"),
            tooltip: "lat",
        },
        {
            key: "surf_el",
            format: d3.format("0.6f"),
            tooltip: "surf_el",
        },
        {
            key: "salinity",
            format: d3.format("0.6f"),
            tooltip: "salinity",
        },
        {
            key: "water_temp",
            format: d3.format("0.6f"),
            tooltip: "water_temp",
        },
        {
            key: "water_u",
            format: d3.format("0.6f"),
            tooltip: "water_u",
        },
        {
            key: "water_v",
            format: d3.format("0.6f"),
            tooltip: "water_v",
        }
    ];
}
