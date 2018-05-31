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

@app.route('/api/test', methods=['POST'])
def apitest():
    # name = request.json.name
    # isOk = request.json.isOk
    df1 = pd.DataFrame({'A': ['A0', 'A1', 'A2', 'A3'],
                        'B': ['B0', 'B1', 'B2', 'B3'],
                        'C': ['C0', 'C1', 'C2', 'C3'],
                        'D': ['D0', 'D1', 'D2', 'D3']},
                       index=[0, 1, 2, 3])
    fileInfo = request.json
    print(type(fileInfo))
    print(fileInfo['name'], fileInfo['isOk'])
    return jsonify(df1.to_json(orient='records'))

# 可考虑删除'water_u', 'water_v'两列加快传输速度
@app.route('/api/get_data_quiver', methods=['POST'])
def get_data_quiver():
    '''
    request.json是个dict, 下面是个例子
    {
        "time": '2016-05-06',
        "depth": "15.0m"
    }
    '''
    dataInfo = request.json
    print(dataInfo)
    fileName = '/'.join([ROOTPATH, 'quiver', dataInfo["depth"], dataInfo["time"]+'.csv'])
    df = pd.read_csv(fileName)
    return df.round(6).to_json(orient='records')
    # return df.drop(columns=['water_u', 'water_v']).to_json(orient='records')

@app.route('/api/get_data_1date1depth', methods=['POST'])
def get_data_1date1depth():
    '''
    request.json是个dict, 下面是个例子
    {
        "time": '2016-01-01',
        (option)"depth": "0.0m"(若缺失则默认0.0m)
    }
    '''
    dataInfo = request.json
    print(dataInfo)
    if not "depth" in dataInfo:
        dataInfo["depth"] = '0.0m'
    fileName = '/'.join([ROOTPATH, dataInfo["depth"], dataInfo["time"]+'.csv'])
    df = pd.read_csv(fileName)
    df['velocity'] = np.sqrt(df['water_u']**2 + df['water_v']**2)
    return df.round(6).to_json(orient='records')

# 计算ow标准偏差
@app.route('/api/get_ow_std', methods=['POST'])
def get_std():
    '''
    request.json是个dict, 下面是个例子
    {
        "time": '2016-01-01',
        (option)"depth": "0.0m"(若缺失则默认0.0m)        
    }
    '''
    dataInfo = request.json
    print(dataInfo)
    if not "depth" in dataInfo:
        dataInfo["depth"] = '0.0m'
    fileName = '/'.join([ROOTPATH, 'ow_grid', dataInfo["depth"], dataInfo["time"]+'.csv'])
    csv = np.round(np.genfromtxt(fileName, delimiter=','), 6)
    print("标准偏差: ", np.nanstd(csv[1:,1:]))
    return jsonify({"std": np.nanstd(csv[1:,1:])})

def floatToStr(num):
    return str(num).replace('.', 'p')

@app.route('/api/get_data_bylonlat', methods=['POST'])
def get_data_bylonlat():
    '''
    request.json是个dict，下面是个例子
    {
        "lon": 128.80,
        "lat": 32.88
    }
    '''
    dataInfo = request.json
    print('now is get_data_bylonlat: ' + str(dataInfo))
    tarPath = '/'.join([ROOTPATH, floatToStr(dataInfo['lon'])])
    tarFile = '/'.join([tarPath, floatToStr(dataInfo['lat'])+'.csv'])
    if os.path.isfile(tarFile):
        return pd.read_csv(tarFile).round(6).to_json(orient='records')
    else:
        queryExpr = 'lon=={0} and lat=={1}'.format(dataInfo['lon'], dataInfo['lat'])
        start = time.clock()
        res = []
        for depth in DEPTH_LIST:
            absPath = '/'.join([ROOTPATH, depth])
            fileList = os.listdir(absPath)
            for file in fileList:
                dict1 = {}
                df1 = pd.read_csv('/'.join([absPath, file])).round(6).drop(columns=['ow'])
                qdf = df1.query(queryExpr).drop(columns=['lon', 'lat'])
                dict1 = qdf.to_dict('record')
                dict1[0]['date'] = file[:-4]
                dict1[0]['depth'] = depth
                res.append(dict1[0])
            print("run time: "+str(time.clock()-start)+" s")
        if not os.path.exists(tarPath):
            os.makedirs(tarPath)
        df1 = pd.DataFrame.from_records(res)
        df1.to_csv(tarFile, index=False)
        return df1.to_json(orient='records')

if __name__ == '__main__':
    app.run(debug=True, port=8000)
