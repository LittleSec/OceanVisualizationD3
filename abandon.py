###########################################
# 弃用接口
#
###########################################

from flask import Flask, redirect, render_template, url_for
from flask import jsonify, request, json
from datetime import timedelta
import os
import pandas as pd
import numpy as np
from scipy.signal import argrelextrema
import time
app = Flask(__name__)

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(seconds=1)  # 将缓存最大时间设置为1s

@app.route('/')
def hello_world():
    # return redirect(url_for('static', filename='文件测试.html'))
    return render_template('layer.html')

# 以下是api，供前端ajax调用
# 以下变量用于合法性检查，暂时无用
ROOTPATH = './oceandata/'  # 路径和文件名规律: ./oceandata/depth/2014-07-01.csv
RESULATION_DEFAULT = '0p08'  # 默认分辨率
ATTR_DEFAULT_1 = 'surf_el'  # 默认海洋属性1 surf_el
ATTR_DEFAULT_2 = 'water_temp'  # 默认海洋属性2 water_temp
TIME_DEFAULT = '2014-07-01'  # 默认时间
DEPTH_DEFAULT = '0.0m'  # 默认深度
DEPTH_LIST = ['0.0m', '8.0m', '15.0m', '30.0m', '50.0m']
ATTR_LIST = ['surf_el', 'salinity', 'water_temp', 'water_u', 'water_v']

# 获取sla数据，grid-->tuple，并乘100让m转换为cm
@app.route('/api/get_data_sla', methods=['POST'])
def get_data_sla():
    '''
    request.json是个dict, 下面是个例子
    {
        "time": '2016-01-01'
    }
    '''
    dataInfo = request.json
    print(dataInfo)
    fileName = '/'.join([ROOTPATH, 'sla_grid', dataInfo["time"]+'.csv'])
    csv = np.genfromtxt(fileName, delimiter=',')
    x, y = np.meshgrid(csv[0, 1:], csv[1:, 0])
    points = np.rec.fromarrays([x, y]).ravel()
    values = csv[1:, 1:].ravel()
    # 去NaN
    points1 = []
    values1 = []
    for i in range(len(values)):
        if not np.isnan(values[i]):
            points1.append(list(points[i]))
            values1.append(values[i] * 100) # m --> cm
    df1 = pd.DataFrame(points1, columns=['lon', 'lat'])
    df2 = pd.DataFrame(values1, columns=['sla'])
    # print(pd.concat([df1, df2], axis=1).round(6))    
    return pd.concat([df1, df2], axis=1).round(6).to_json(orient='records')

# 获取ow参数，grid-->tuple
@app.route('/api/get_data_ow', methods=['POST'])
def get_data_ow():
    '''
    request.json是个dict, 下面是个例子
    {
        "time": '2016-01-01'
        (option)"depth": "0.0m"(若缺失则默认0.0m)
    }
    '''
    dataInfo = request.json
    print('now is get_data_ow: ' + str(dataInfo))
    if not "depth" in dataInfo:
        dataInfo["depth"] = '0.0m'
    fileName = '/'.join([ROOTPATH, 'ow_grid', dataInfo["depth"], dataInfo["time"]+'.csv'])
    csv = np.round(np.genfromtxt(fileName, delimiter=','), 6)
    x, y = np.meshgrid(csv[0, 1:], csv[1:, 0])
    points = np.rec.fromarrays([x, y]).ravel()
    values = csv[1:, 1:].ravel()
    # 去NaN
    points1 = []
    values1 = []
    for i in range(len(values)):
        if not np.isnan(values[i]):
            points1.append(list(points[i]))
            values1.append(values[i] * 100) # m --> cm
    df1 = pd.DataFrame(points1, columns=['lon', 'lat'])
    df2 = pd.DataFrame(values1, columns=['ow'])
    # print(pd.concat([df1, df2], axis=1).round(6))
    return pd.concat([df1, df2], axis=1).round(6).to_json(orient='records')

# 计算ssh极大极小值
# 可能会错，因为对nan值的处理未知
# 可以调整order参数
@app.route('/api/get_ssh_extrema', methods=['POST'])
def get_ssh_extrema():
    '''
    request.json是个dict, 下面是个例子
    {
        "time": '2016-01-01'
        "scale": 12
    }
    '''
    dataInfo = request.json
    print(dataInfo)
    if not "scale" in dataInfo:
        dataInfo["scale"] = 12 # 12其实就两度了，因为是两边各12，所以就是12*2+1=25恰好两度
    scale = int(dataInfo["scale"])
    fileName = '/'.join([ROOTPATH, 'surf_el_grid', dataInfo["time"]+'.csv'])
    csv = np.round(np.genfromtxt(fileName, delimiter=','), 6)
    x = csv[0,1:]
    y = csv[1:,0]
    res = {"argrelmax":[], "argrelmin":[]}
    # 极大值
    max1 = argrelextrema(csv[1:,1:], axis=0, comparator=np.greater, order=scale) # order是指定要对比多少个值， 返回值是个元组
    max2 = argrelextrema(csv[1:,1:], axis=1, comparator=np.greater, order=scale)
    for i in range(len(max1[0])):
        for j in range(len(max2[0])):
            if max1[0][i] == max2[0][j] and max1[1][i] == max2[1][j]:
                res["argrelmax"].append({ "point": [ float(x[max1[1][i]]), float(y[max1[0][i]]) ] })
                break
    # for i in range(len(max1[0])):
    #     # np.float64无法序列化
    #     # 注意哪个是x轴，哪个是y轴
    #     res["argrelmax"].append({ "point": [ float(x[max1[1][i]]), float(y[max1[0][i]]) ] })
    # for i in range(len(max2[0])):
    #     res["argrelmin"].append({ "point": [ float(x[max2[1][i]]), float(y[max2[0][i]]) ] })
        
    # 极小值
    # min = argrelextrema(csv[1:,1:], axis=1, comparator=np.less, order=scale)
    # for i in range(len(min[0])):
    #     res["argrelmin"].append({ "point": [ float(x[min[1][i]]), float(y[min[0][i]]) ] })
    # print("极大值点极小值点的数量: ", len(max[0]), len(min[0]))
    return jsonify(res)


def floatToStr(num):
    return str(num).replace('.', 'p')

if __name__ == '__main__':
    app.run(debug=True, port=8000)
