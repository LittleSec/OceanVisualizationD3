laydate.render({
    elem: "#date-pick",
    min: "2014-07-01",
    max: "2017-09-30",
    value: "2014-07-01",
    btns: ['confirm'],
    done: function (value, date, endDate) {
        changeDate(value);
        // console.log(value); //得到日期生成的值，如：2017-08-18
        // console.log(date); //得到日期时间对象：{year: 2017, month: 8, date: 18, hours: 0, minutes: 0, seconds: 0}
        // console.log(endDate); //得结束的日期时间对象，开启范围选择（range: true）才会返回。对象成员同上。
    }
})

var requestDataInfo = {
    "time": curdate,
    "depth": curdepth,
};
curattr = "surf_el";
drawGeoMap(hmChartg);
// var colorbarSvg = d3.select("#colorbar svg"); //or false
changeDepthOrDate(requestDataInfo);
drawQuiver(requestDataInfo);
hmBrushg.call(brushHM);
$("input[type=checkbox][value=brush]").change(function () {
    if ($(this).is(':checked')) {
        $(".hmbrush").css("display", "");
    } else {
        $(".hmbrush").css("display", "none");
    }
});

var req1x1yDataInfo = {
    'lon': curlonlat[0],
    'lat': curlonlat[1]
}
change1x1y(req1x1yDataInfo);

function redrawGroup1() {
    requestDataInfo = {
        "time": curdate,
        "depth": curdepth
    };
    changeDepthOrDate(requestDataInfo);
    drawQuiver(requestDataInfo);
}

function changeDate(date) {
    curdate = date;
    redrawGroup1();
}

$("input.depthoption").change(function () {
    curdepth = this.value;
    redrawGroup1();
});

var sliderwidth = $(".attr-selector").width() * 0.9;

$('#ssh-slider').jRange({
    from: 40,
    to: 160,
    step: 20,
    scale: [40, 60, 80, 100, 120, 140, 160],
    format: '%s',
    theme: "theme-blue",
    width: sliderwidth,
    showLabels: true,
    snap: true
    // ondragend: function (value){
    //     console.log('ssh scale: ' + value);
    //     changeSSHextScale(value);
    // }
});

// $('input.attroption,input.attroption-special').change(function () {
//     // 这个option的值肯定不会是ow或sla，因此不需要合理性判断
//     if (this.value == 'ow') {
//         $('#ow-slider').jRange('enable');
//     }
//     else {
//         $('#ow-slider').jRange('disable');
//     }
// });

$("#reset-brush1").css("visibility", "hidden");

$("select.y1-picker").change(function () {
    y2attr1 = this.value;
    redrawLineCharts();
    print2yScatter();
});

$("select.y2-picker").change(function () {
    y2attr2 = this.value;
    redrawLineCharts();
    print2yScatter();
});

$("input.date-space-option").change(function () {
    setCarouselItem();
});

$("button.play-stop-btn").click(function(){
    var span = $(this).children('span');
    if (span.hasClass('glyphicon-play')){
        span.attr("class", "glyphicon glyphicon-pause");
        $(this).attr("class", "play-stop-btn btn btn-danger");
        // 开始自动播放，不再绘图，不允许滑条
    }
    else{
        span.attr("class", "glyphicon glyphicon-play");
        $(this).attr("class", "play-stop-btn btn btn-success");
        // 停止自动播放，开始绘图，开放滑条
    }
});

// 开启/关闭涡旋模块
$("div.eddy-block input.date-space-option").attr("disabled", "disabled");
$("div.eddy-block button").attr("disabled", "disabled");
$('#ssh-slider').jRange('disable');
$("input[type=checkbox][value=eddy]").change(function () {
    if ($(this).is(':checked')) {
        $("div.eddy-block input.date-space-option").removeAttr("disabled");
        $("div.eddy-block button").removeAttr("disabled");
        $('#ssh-slider').jRange('enable');
    } else {         
        $("div.eddy-block input.date-space-option").attr("disabled", "disabled");
        $("div.eddy-block button").attr("disabled", "disabled");
        $('#ssh-slider').jRange('disable');
    }
});