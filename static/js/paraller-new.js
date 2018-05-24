var parachart = nv.models.parallelCoordinatesChart()
    .dimensionData(getDimensions())
    .displayBrush(false)
    .lineTension(0.85);
    // .color(function(d, i){
    //     var colors = d3.scale.category20().range().slice(10);
    //     console.log(colors[i % colors.length-1]);
    //     return colors[i % colors.length-1];
    // });

nv.utils.windowResize(parachart.update);

parachart.dispatch.on('brushEnd', function (e) {
    d3.select("#resetBrushButton").style("visibility", "visible");
});

parachart.dispatch.on('dimensionsOrder', function (e, b) {
    if (b) {
        d3.select("#resetSortingButton").style("visibility", "visible");
    }
});

function resetBrush() {
    parachart.filters([]);
    parachart.active([]);
    parachart.displayBrush(true);
    d3.select("#resetBrushButton").style("visibility", "hidden");
    parachart.update();
}

function resetSorting() {
    var dim = parachart.dimensionData();
    dim.map(function (d) { return d.currentPosition = d.originalPosition; });
    dim.sort(function (a, b) { return a.originalPosition - b.originalPosition; });
    parachart.dimensionData(dim);
    d3.select("#resetSortingButton").style("visibility", "hidden");
    parachart.update();
}

function mydata() {
    var data = [];
    for (var i in cur1d1dData) {
        if (cur1d1dData[i]['lon'] < curlonrange[0] ||
            cur1d1dData[i]['lon'] > curlonrange[1] ||
            cur1d1dData[i]['lat'] < curlatrange[0] ||
            cur1d1dData[i]['lat'] > curlatrange[1]
        ) {
            continue;
        }
        data.push({ "values": cur1d1dData[i] })
    }
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

function getDimensions() {
    return [
        {
            key: "lon",
            format: d3.format("g"),
            tooltip: "lon",
        },
        {
            key: "lat",
            format: d3.format("g"),
            tooltip: "lat",
        },
        {
            key: "surf_el",
            format: d3.format("g"),
            tooltip: "surf_el",
        },
        {
            key: "salinity",
            format: d3.format("g"),
            tooltip: "salinity",
        },
        {
            key: "water_temp",
            format: d3.format("g"),
            tooltip: "water_temp",
        },
        {
            key: "water_u",
            format: d3.format("g"),
            tooltip: "water_u",
        },
        {
            key: "water_v",
            format: d3.format("g"),
            tooltip: "water_v",
        }
    ];
}
