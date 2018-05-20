var marginTop = 60;
$(".container-fluid.keen-dashboard").css("margin-top", marginTop);

// 设置热力图所在大div的高度
var leftColTopRowHight;
$("div.heatmap").height(
    function () {
        leftColTopRowHight = $(this).children("#heatmap").width() * 1.1;
        return leftColTopRowHight;
    }
);
// 设置热力图容器内所有子元素的高度一致
$("div.heatmap").children().height(leftColTopRowHight);
// 消除colorbar的左padding使得更紧凑
$("div.heatmap").children("#colorbar, #dateselector").css("padding-left", "0")


// 左列上行高度统一
$("div.leftcol-toprow").height(leftColTopRowHight);
// 左列下行高宽1:2.5
$("#parallel-coordinate").height(
    function(){
        return $(this).width() / 2.5;
    }
);

// 设置总container的高度
$(".container-fluid.keen-dashboard").height(
    function () {
        return $("html").height() - marginTop;
    }
);

// 重新设置总行两列同高
$(".first-row-right").height(
    function(){
        return $(".first-row-left").height() - parseFloat($(".keen-dashboard .chart-wrapper").css("margin-bottom"));
        // 在css里，$(".keen-dashboard .chart-wrapper").css("margin-bottom")为10px
    }
);

// 设置右列及其子元素的高度
$(".two-yAxis-charts").height(
    function(){
        h1 = $(".first-row-right").height() - $(".keen-dashboard .chart-wrapper .chart-title").height();
        h2 = h1 - 2*parseFloat($(".keen-dashboard .chart-wrapper").css("margin-bottom")) - parseFloat($(".keen-dashboard .chart-wrapper .chart-stage").css("padding-top"));
        // 在css里，margin-bottom是10px
        return h2;
    }
);
$(".two-yAxis-charts").children(".yAxis2").height(
    function () {
        return ($(this).width()*0.8);
    }
);
$("#scatter").height(function(){
    return $(this).width();
})

function numToStr(num) {
    return num.toString().replace('.', 'p');
}

function strToNum(str) {
    return parseFloat(str.replace('p', '.'));
}