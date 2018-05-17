// 改变ow系数事件，用于改变ow热力图
function changeOWcoeff(coef){
    var owstd = 20.9;
    var threshold = owstd * +coef;
    if(d <= -owstd){
        return colorInterp(1);
    }
    else if(-owstd < d && d <= -threshold){
        return colorInterp(linear1(d));
    }
    else if(-threshold < d && d <= threshold){
        return colorInterp(0.5);
    }
    else if(threshold < d && d <= owstd){
        return colorInterp(linear2(d));
    }
    else{
        return colorInterp(0);
    }
}

function changeSLAthresold(value){

}