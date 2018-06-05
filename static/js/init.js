laydate.render({
    elem: "#date-pick",
    done: function (value, date, endDate) {
        curdate = value;
        setCarouselItem()
        redrawGroup1();
        if($("input[type=checkbox][value=eddy]").is(':checked')){
            changeDateEddy();
        }
        // console.log(value); //得到日期生成的值，如：2017-08-18
        // console.log(date); //得到日期时间对象：{year: 2017, month: 8, date: 18, hours: 0, minutes: 0, seconds: 0}
        // console.log(endDate); //得结束的日期时间对象，开启范围选择（range: true）才会返回。对象成员同上。
    }
});

var requestDataInfo = {
    "time": curdate,
    "depth": curdepth,
};
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
    console.log('redrawGroup1');
    requestDataInfo = {
        "time": curdate,
        "depth": curdepth
    };
    changeDepthOrDate(requestDataInfo);
    drawQuiver(requestDataInfo);
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
    snap: true,
    ondragend: function (value){
        changeSSHextScale(value);
    }
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


// 双y轴所指示的属性发生变化
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

// 设置需要播放的时间
$("input.date-space-option").change(function () {
    setCarouselItem();
});

// 停止和播放按钮
$("button.play-stop-btn").click(function () {
    var span = $(this).children('span');
    if (span.hasClass('glyphicon-play')) {
        span.attr("class", "glyphicon glyphicon-pause");
        $(this).attr("class", "play-stop-btn btn btn-danger");
        // 开始自动播放，不再绘图，不允许滑条
        isAutoPlay = true;
        dateIns.reload({
            autoplay: isAutoPlay
        });
        $("input.attroption, input.attoption-special").attr("disabled", "disabled").parent().css('color', 'grey');
        $("input#idate-pick").attr("disabled", "disabled").css('color', 'grey');
        $("input.depthoption").attr("disabled", "disabled").parent().css('color', 'grey');
        $('#ssh-slider').jRange('disable');
        $('input.date-space-option').attr("disabled", "disabled").parent().css('color', 'grey');
    }
    else {
        span.attr("class", "glyphicon glyphicon-play");
        $(this).attr("class", "play-stop-btn btn btn-success");
        // 停止自动播放，开始绘图，开放滑条
        isAutoPlay = false;
        dateIns.reload({
            autoplay: isAutoPlay
        });
        $("input.attroption, input.attoption-special").removeAttr("disabled", "disabled").parent().css('color', '');
        $("input#idate-pick").removeAttr("disabled").css('color', ''); 
        $("input.depthoption").removeAttr("disabled").parent().css('color', '');
        $('#ssh-slider').jRange('enable');
        $('input.date-space-option').removeAttr('disabled').parent().css('color', '');
        UpDateRedrawScaAndPara();
    }
});

// 初始禁用eddy模块
$("div.eddy-block input.date-space-option").attr("disabled", "disabled");
$("div.eddy-block button").attr("disabled", "disabled");
$('#ssh-slider').jRange('disable');
$('.eddy-block').children('*').css('color', 'grey');
// 开启/关闭涡旋模块
$("input[type=checkbox][value=eddy]").change(function () {
    if ($(this).is(':checked')) {
        // $("div.eddy-block").children("*").removeAttr("disabled");
        $("div.eddy-block input.date-space-option").removeAttr("disabled");
        $("div.eddy-block button").removeAttr("disabled");
        $('#ssh-slider').jRange('enable');
        $('.eddy-block').children('*').css('color', '');
        setCarouselItem();
        $("input[type=checkbox][value=quiver]").attr("disabled", "disabled").css('color', 'grey');
        eddyBoundaryChart.selectAll('rect.eddyhm, path.eddy-line').style("visibility", "visible");
    } else {
        // $("div.eddy-block").children("*").attr("disabled", "disabled");        
        $("div.eddy-block input.date-space-option").attr("disabled", "disabled");
        $("div.eddy-block button").attr("disabled", "disabled");
        $('#ssh-slider').jRange('disable');
        $('.eddy-block').children('*').css('color', 'grey');
        $("input[type=checkbox][value=quiver]").removeAttr("disabled").css('color', '');
        eddyBoundaryChart.selectAll('rect.eddyhm, path.eddy-line').style("visibility", "hidden");
    }
});