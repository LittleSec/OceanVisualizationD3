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
ROOTPATH = './oceandata'  # 路径和文件名规律: ./oceandata/depth/2014-07-01.csv
SSH_GRID_PATH = 'surf_el_grid'
RESULATION_DEFAULT = '0p08'  # 默认分辨率
ATTR_DEFAULT_1 = 'surf_el'  # 默认海洋属性1 surf_el
ATTR_DEFAULT_2 = 'water_temp'  # 默认海洋属性2 water_temp
TIME_DEFAULT = '2014-07-01'  # 默认时间
DEPTH_DEFAULT = '0.0m'  # 默认深度
DEPTH_LIST = ['0.0m', '8.0m', '15.0m', '30.0m', '50.0m']
ATTR_LIST = ['surf_el', 'salinity', 'water_temp', 'water_u', 'water_v']

# 以下全局变量用于标识eddy区域
LAND = 0
WARMEDDYCENTER = 1
COLDEDDYCENTER = 2
WARMEDDYSCALE = 3
COLDEDDYSCALE = 4
BLACKGROUND = 5

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
    # df['lon1'] = df['lon'] + df['water_u']
    # df['lat1'] = df['lat'] + df['water_v']
    return df.to_json(orient='records')
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
    return df.to_json(orient='records')

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
    csv = np.genfromtxt(fileName, delimiter=',')
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
        return pd.read_csv(tarFile).to_json(orient='records')
    else:
        queryExpr = 'lon=={0} and lat=={1}'.format(dataInfo['lon'], dataInfo['lat'])
        start = time.clock()
        res = []
        for depth in DEPTH_LIST:
            absPath = '/'.join([ROOTPATH, depth])
            fileList = os.listdir(absPath)
            for file in fileList:
                dict1 = {}
                df1 = pd.read_csv('/'.join([absPath, file])).drop(columns=['ow'])
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

# 以下涡旋检查模块参考ncinterp repo的nctocsv-nointerp-branch
def cmpGreater(a, b):
    return a > b

def cmpLess(a, b):
    return a < b

def sshthreshold(centerI, centerJ, radius, lonList, latList, srcSSH, tarSSH, eddyType):
    '''
    对eddy的ssh进行标记
    6 2 7
    1   3
    5 4 8
    '''
    thresholdKVlist = []
    j = centerJ-radius
    if eddyType == 'warm':
        cmp = cmpGreater
        scaleTag = WARMEDDYSCALE
    else:
        cmp = cmpLess
        scaleTag = COLDEDDYSCALE
    while j > 0: # 左1
        if np.isnan(srcSSH[centerI][j-1]):
            break
        if cmp(srcSSH[centerI][j-1], srcSSH[centerI][j]):
            break
        j -= 1
    thresholdKVlist.append({'iscale': centerJ-j, 'jscale': centerJ-j, 'threshold':srcSSH[centerI][j], 'pos':1})

    i = centerI-radius
    while i > 0: # 上2
        if np.isnan(srcSSH[i-1][centerJ]):
            break
        if cmp(srcSSH[i-1][centerJ], srcSSH[i][centerJ]) :
            break
        i -= 1
    thresholdKVlist.append({'iscale': centerI-i, 'jscale': centerI-i, 'threshold':srcSSH[i][centerJ], 'pos':2})

    j = centerJ+radius
    while j < len(lonList)-1: # 右3
        if np.isnan(srcSSH[centerI][j+1]):
            break
        if cmp(srcSSH[centerI][j+1], srcSSH[centerI][j]): 
            break
        j += 1
    thresholdKVlist.append({'iscale': j-centerJ, 'jscale': j-centerJ, 'threshold':srcSSH[centerI][j], 'pos':3})

    i = centerI+radius
    while i < len(latList)-1: # 下4
        if np.isnan(srcSSH[i+1][centerJ]):
            break
        if cmp(srcSSH[i+1][centerJ], srcSSH[i][centerJ]):
            break
        i += 1
    thresholdKVlist.append({'iscale': i-centerI, 'jscale': i-centerI, 'threshold':srcSSH[i][centerJ], 'pos':4})
    
    i = centerI+radius
    j = centerJ-radius
    while i < len(latList)-1 and j > 0: # 左下5
        if np.isnan(srcSSH[i+1][j-1]):
            break
        if cmp(srcSSH[i+1][j-1], srcSSH[i][j]):
            break
        i += 1
        j -= 1
    thresholdKVlist.append({'iscale': i-centerI, 'jscale': centerJ-j, 'threshold':srcSSH[i][j], 'pos':5})

    i = centerI-radius
    j = centerJ-radius
    while i > 0 and j > 0: # 左上6
        if np.isnan(srcSSH[i-1][j-1]):
            break
        if cmp(srcSSH[i-1][j-1], srcSSH[i][j]):
            break
        i -= 1
        j -= 1
    thresholdKVlist.append({'iscale': centerI-i, 'jscale': centerJ-j, 'threshold':srcSSH[i][j], 'pos':6})

    i = centerI-radius
    j = centerJ+radius
    while j < len(lonList)-1 and i > 0: # 右上7
        if np.isnan(srcSSH[i-1][j+1]):
            break
        if cmp(srcSSH[i-1][j+1], srcSSH[i][j]):
            break
        i -= 1
        j += 1
    thresholdKVlist.append({'iscale': centerI-i, 'jscale': j-centerJ, 'threshold':srcSSH[i][j], 'pos':7})
    
    i = centerI+radius
    j = centerJ+radius
    while j < len(lonList)-1 and i < len(latList)-1: # 右下8
        if np.isnan(srcSSH[i+1][j+1]):
            break
        if cmp(srcSSH[i+1][j+1], srcSSH[i][j]):
            break
        i += 1
        j += 1
    thresholdKVlist.append({'iscale': i-centerI, 'jscale': j-centerJ, 'threshold':srcSSH[i][j], 'pos':8})
    
    if eddyType == 'warm':
        maxThresholdKV = max(thresholdKVlist, key=lambda kv: kv['threshold'] if not np.isnan(kv['threshold']) else np.NINF)
    else:
        maxThresholdKV = min(thresholdKVlist, key=lambda kv: kv['threshold'] if not np.isnan(kv['threshold']) else np.PINF)
    for i in range(centerI-maxThresholdKV['iscale'], centerI+maxThresholdKV['iscale']+1):
        for j in range(centerJ-maxThresholdKV['jscale'], centerJ+maxThresholdKV['jscale']+1):
            if i < 0 or i >= len(latList) or j < 0 or j >= len(lonList):
                continue
            if (cmp(srcSSH[i][j], maxThresholdKV['threshold']) or maxThresholdKV['threshold'] == srcSSH[i][j]) and cmp(srcSSH[centerI][centerJ], srcSSH[i][j]):
                tarSSH[i][j] = scaleTag
    return tarSSH

@app.route('/api/get_data_eddy', methods=['POST'])
def get_data_eddy():
    '''
    request.json是个dict，下面是个例子
    {
        "time": '2016-01-01',
        "scale": 30 (units: km, 直径)
    }
    '''
    dataInfo = request.json
    print('now is get_data_eddy: ' + str(dataInfo))
    scale = int(eval(str(dataInfo['scale'])) / 222 * 25)
    if scale % 2 == 0: # 确保scale是奇数
        scale =  int(scale) + 1
    sshcsv = np.genfromtxt('/'.join([ROOTPATH, SSH_GRID_PATH, dataInfo['time']+'.csv']), delimiter=',')
    sshlon = sshcsv[0, 1:]
    sshlat = sshcsv[1:, 0]
    srcSSH = sshcsv[1:, 1:]
    tarSSH = np.where(np.isnan(srcSSH), 0, BLACKGROUND)
    radius = scale // 2
    df1 = pd.read_csv('/'.join([ROOTPATH, DEPTH_DEFAULT, dataInfo['time']+'.csv']))
    for i in range(radius, len(sshlat)-radius):
        for j in range(radius, len(sshlon)-radius):
            if np.isnan(srcSSH[i][j]):
                continue
            # 暖涡
            if np.nanmax(srcSSH[i-radius:i+radius+1, j-radius:j+radius+1]) == srcSSH[i][j]:
                queryExpr = 'lon=={0} and lat=={1}'.format(sshlon[j], sshlat[i])
                qdf = df1.query(queryExpr)
                if qdf.index.empty: # 该点没有ow
                    continue
                if qdf['ow'].values[0] < 0:
                    tarSSH = sshthreshold(i, j, radius, sshlon, sshlat, srcSSH, tarSSH, 'warm')
                    tarSSH[i][j] = WARMEDDYCENTER
            # 冷涡
            elif np.nanmin(srcSSH[i-radius:i+radius+1, j-radius:j+radius+1]) == srcSSH[i][j]:
                queryExpr = 'lon=={0} and lat=={1}'.format(sshlon[j], sshlat[i])
                qdf = df1.query(queryExpr)
                if qdf.index.empty:
                    continue
                if qdf['ow'].values[0] < 0:
                    tarSSH = sshthreshold(i, j, radius, sshlon, sshlat, srcSSH, tarSSH, 'cold')
                    tarSSH[i][j] = COLDEDDYCENTER
    x, y = np.meshgrid(sshlon, sshlat)
    points = np.rec.fromarrays([x, y]).ravel()
    values = tarSSH.ravel()
    header = ['lon', 'lat', 'eddy']
    # 去NaN
    point1 = []
    value1 = []
    for i in range(len(values)):
        if values[i] in [WARMEDDYCENTER, WARMEDDYSCALE, COLDEDDYCENTER, COLDEDDYSCALE]:  # 在这里对整个values判NaN不起作用，不知道为啥
            point1.append(list(points[i]))
            value1.append(values[i])
    dt1 = pd.DataFrame(point1)
    dt2 = pd.DataFrame(value1)
    df2 = pd.concat([dt1, dt2], axis=1) # 合成后列名就是从0开始的数字而已
    df2.columns = header
    return pd.merge(df1[['lon','lat','surf_el']], df2, how='inner', on=['lon', 'lat']).to_json(orient='records')
    
if __name__ == '__main__':
    app.run(debug=True, port=8000)
