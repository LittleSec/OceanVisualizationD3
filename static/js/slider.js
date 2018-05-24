// 改变ow系数事件，用于改变ow热力图
function changeOWcoeff(coef){
    curOWcoef = +coef;
    linearsOW[0].domain([curOWstd, curOWstd * curOWcoef]);
    linearsOW[1].domain([-curOWstd * curOWcoef, -curOWstd]);
    printOWHeatMap(curOWdata); // colorbar不需要重绘
}

function changeSLAthresold(thre){
    hmChartg.selectAll("rect.hm").style("fill", function(d){
        if(d['sla'] > -thre/100 && d['sla'] < +thre/100){
            return 'none';
        }
        else{
            return colorInterp(linearsWithAttr[curattr](d[curattr]));
        }
    });
}

function changeSSHextScale(value){
    var scale = Math.ceil(+value/111/0.08) //km 转换成多少个格子
    console.log(scale);
    $.ajax({
        url: "/api/get_ssh_extrema",
        type: 'POST',
        data: JSON.stringify({
            "time": curdate,
            "scale": scale
        }), //必须是字符串序列
        contentType: 'application/json; charset=UTF-8', //必须指明contentType，否则py会当表单处理，很麻烦
        success: function (data, status) {
            console.log(data);
            var warmeddys = data['argrelmax'];
            warmeddys.forEach(function(d){
                var xy = projection(d.point);
                d.x = xy[0];
                d.y = xy[1];
            });
            var coldeddys = data['argrelmin'];
            coldeddys.forEach(function(d){
                var xy = projection(d.point);
                d.x = xy[0];
                d.y = xy[1];
            });
            eddyChart.selectAll("circle.warm-eddy").data(warmeddys).enter()
                .append("circle").attr("class", "warm-eddy")
                .attr("cx", function(d){
                    return d.x;
                })
                .attr("cy", function(d){
                    return d.y;
                })
                .attr("r", function (d) {
                    var xadd = projection([d.point[0] + resolution*scale, d.point[1]])[0];
                    return xadd - d.x;
                });
        }
    });
}