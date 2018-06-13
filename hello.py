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
OW_GRID_PATH = 'ow_grid/0.0m'
RESULATION_DEFAULT = '0p08'  # 默认分辨率
ATTR_DEFAULT_1 = 'surf_el'  # 默认海洋属性1 surf_el
ATTR_DEFAULT_2 = 'water_temp'  # 默认海洋属性2 water_temp
TIME_DEFAULT = '2014-07-01'  # 默认时间
DEPTH_DEFAULT = '0.0m'  # 默认深度
DEPTH_LIST = ['0.0m', '8.0m', '15.0m', '30.0m', '50.0m']
ATTR_LIST = ['surf_el', 'salinity', 'water_temp', 'water_u', 'water_v']
OWMAGNITUDE = 1e10

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
    print('now is get_data_quiver: ' + str(dataInfo))
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
    ow参数进行*1e10处理
    '''
    dataInfo = request.json
    print('now is get_data_1data1depth: ' + str(dataInfo))
    if not "depth" in dataInfo:
        dataInfo["depth"] = '0.0m'
    fileName = '/'.join([ROOTPATH, dataInfo["depth"], dataInfo["time"]+'.csv'])
    df = pd.read_csv(fileName)
    df['velocity'] = np.sqrt(df['water_u'].round(6)**2 + df['water_v'].round(6)**2)
    df['ow'] = df['ow'] * OWMAGNITUDE
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
    print('now is get_ow_std: ' + str(dataInfo))
    if not "depth" in dataInfo:
        dataInfo["depth"] = '0.0m'
    fileName = '/'.join([ROOTPATH, 'ow_grid', dataInfo["depth"], dataInfo["time"]+'.csv'])
    csv = np.genfromtxt(fileName, delimiter=',')
    print("标准偏差:(*1e10) ", np.nanstd(csv[1:,1:]*OWMAGNITUDE))
    return jsonify({"std": np.nanstd(csv[1:,1:]*OWMAGNITUDE)})

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
        df = pd.read_csv(tarFile)
        df['velocity'] = np.sqrt(df['water_u']**2 + df['water_v']**2)
        if 'sla' in df.columns.values:
            df.drop(columns=['sla']).to_csv(tarFile, index=False, na_rep='NaN')
        return df.to_json(orient='records')
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
        df1['velocity'] = np.sqrt(df1['water_u']**2 + df1['water_v']**2)
        return df1.to_json(orient='records')

def cmpGreater(a, b):
    return a > b

def cmpLess(a, b):
    return a < b

def isEddyCenter(ow, lon, lat, owlonList, owlatList, owstd, radius=1):
    owThreshold = 0.2 # 0.2 * std
    owI = np.where(owlatList==lat)[0]
    owJ = np.where(owlonList==lon)[0]
    if owI.size != 0 or owJ.size != 0: # 该点不在ow的计算范围内
        owI = owI[0]
        owJ = owJ[0]
    else:
        return False
    if np.isnan(ow[owI][owJ]): # 该点ow为NaN
        return False
    if ow[owI][owJ] > -owThreshold * owstd:
        return False
    if np.nanmin(ow[owI-radius:owI+radius+1, owJ-radius:owJ+radius+1]) == ow[owI][owJ]:
        return True
    else:
        return False

def sshthreshold(centerI, centerJ, radius, lonList, latList, srcSSH, tarSSH, eddyType):
    '''
    已知涡旋中心求涡旋边界的阈值
    6 2 7
    1   3
    5 4 8
    '''
    thresholdList = []
    j = centerJ-radius
    if eddyType == 'warm':
        cmp = cmpGreater
    else:
        cmp = cmpLess
    while j > 0: # 左1
        if np.isnan(srcSSH[centerI][j-1]):
            break
        if cmp(srcSSH[centerI][j-1], srcSSH[centerI][j]):
            break
        j -= 1
    thresholdList.append(srcSSH[centerI][j])

    i = centerI-radius
    while i > 0: # 上2
        if np.isnan(srcSSH[i-1][centerJ]):
            break
        if cmp(srcSSH[i-1][centerJ], srcSSH[i][centerJ]):
            break
        i -= 1
    thresholdList.append(srcSSH[i][centerJ])

    j = centerJ+radius
    while j < len(lonList)-1: # 右3
        if np.isnan(srcSSH[centerI][j+1]):
            break
        if cmp(srcSSH[centerI][j+1], srcSSH[centerI][j]):
            break
        j += 1
    thresholdList.append(srcSSH[centerI][j])

    i = centerI+radius
    while i < len(latList)-1: # 下4
        if np.isnan(srcSSH[i+1][centerJ]):
            break
        if cmp(srcSSH[i+1][centerJ], srcSSH[i][centerJ]):
            break
        i += 1
    thresholdList.append(srcSSH[i][centerJ])

    i = centerI+radius
    j = centerJ-radius
    while i < len(latList)-1 and j > 0: # 左下5
        if np.isnan(srcSSH[i+1][j-1]):
            break
        if cmp(srcSSH[i+1][j-1], srcSSH[i][j]):
            break
        i += 1
        j -= 1
    thresholdList.append(srcSSH[i][j])

    i = centerI-radius
    j = centerJ-radius
    while i > 0 and j > 0: # 左上6
        if np.isnan(srcSSH[i-1][j-1]):
            break
        if cmp(srcSSH[i-1][j-1], srcSSH[i][j]):
            break
        i -= 1
        j -= 1
    thresholdList.append(srcSSH[i][j])

    i = centerI-radius
    j = centerJ+radius
    while j < len(lonList)-1 and i > 0: # 右上7
        if np.isnan(srcSSH[i-1][j+1]):
            break
        if cmp(srcSSH[i-1][j+1], srcSSH[i][j]):
            break
        i -= 1
        j += 1
    thresholdList.append(srcSSH[i][j])

    i = centerI+radius
    j = centerJ+radius
    while j < len(lonList)-1 and i < len(latList)-1: # 右下8
        if np.isnan(srcSSH[i+1][j+1]):
            break
        if cmp(srcSSH[i+1][j+1], srcSSH[i][j]):
            break
        i += 1
        j += 1
    thresholdList.append(srcSSH[i][j])

    if eddyType == 'warm':
        threshold = np.nanmax(thresholdList)
    else:
        threshold = np.nanmin(thresholdList)

    return threshold

def eddyBoundary(centerI, centerJ, lonList, latList, threshold, srcSSH, eddyType):
    '''
    已知ssh阈值求八个方向阈值所在点
    '''
    pointsList = []

    if eddyType == 'warm':
        cmp = cmpLess
    else:
        cmp = cmpGreater

    j = centerJ
    while j > 0: # 左1
        if np.isnan(srcSSH[centerI][j-1]):
            break
        if cmp(srcSSH[centerI][j-1], threshold) or srcSSH[centerI][j-1] == threshold:
            break
        j -= 1
    pointsList.append([lonList[j], latList[centerI]])

    i = centerI
    j = centerJ
    while i > 0 and j > 0: # 左上6
        if np.isnan(srcSSH[i-1][j-1]):
            break
        if cmp(srcSSH[i-1][j-1], threshold) or srcSSH[i-1][j-1] == threshold:
            break
        i -= 1
        j -= 1
    pointsList.append([lonList[j], latList[i]])

    i = centerI
    while i > 0: # 上2
        if np.isnan(srcSSH[i-1][centerJ]):
            break
        if cmp(srcSSH[i-1][centerJ], threshold) or srcSSH[i-1][centerJ] == threshold:
            break
        i -= 1
    pointsList.append([lonList[centerJ], latList[i]])

    i = centerI
    j = centerJ
    while j < len(lonList)-1 and i > 0: # 右上7
        if np.isnan(srcSSH[i-1][j+1]):
            break
        if cmp(srcSSH[i-1][j+1], threshold) or srcSSH[i-1][j+1] == threshold:
            break
        i -= 1
        j += 1
    pointsList.append([lonList[j], latList[i]])

    j = centerJ
    while j < len(lonList)-1: # 右3
        if np.isnan(srcSSH[centerI][j+1]):
            break
        if cmp(srcSSH[centerI][j+1], threshold) or srcSSH[centerI][j+1] == threshold: 
            break
        j += 1
    pointsList.append([lonList[j], latList[centerI]])

    i = centerI
    j = centerJ
    while j < len(lonList)-1 and i < len(latList)-1: # 右下8
        if np.isnan(srcSSH[i+1][j+1]):
            break
        if cmp(srcSSH[i+1][j+1], threshold) or srcSSH[i+1][j+1] == threshold:
            break
        i += 1
        j += 1
    pointsList.append([lonList[j], latList[i]])

    i = centerI
    while i < len(latList)-1: # 下4
        if np.isnan(srcSSH[i+1][centerJ]):
            break
        if cmp(srcSSH[i+1][centerJ], threshold) or srcSSH[i+1][centerJ] == threshold:
            break
        i += 1
    pointsList.append([lonList[centerJ], latList[i]])
    
    i = centerI
    j = centerJ
    while i < len(latList)-1 and j > 0: # 左下5
        if np.isnan(srcSSH[i+1][j-1]):
            break
        if cmp(srcSSH[i+1][j-1], threshold) or srcSSH[i+1][j-1] == threshold:
            break
        i += 1
        j -= 1
    pointsList.append([lonList[j], latList[i]])

    return {"points": pointsList, "center": [lonList[centerJ], latList[centerI]], "type": eddyType}

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
    boundaryList = []

    owcsv = np.genfromtxt('/'.join([ROOTPATH, OW_GRID_PATH, dataInfo['time']+'.csv']), delimiter=',')
    owlonList = owcsv[0, 1:]
    owlatList = owcsv[1:, 0]
    ow = owcsv[1:, 1:]
    owstd = np.nanstd(ow)

    df1 = pd.read_csv('/'.join([ROOTPATH, DEPTH_DEFAULT, dataInfo['time']+'.csv']))
    df1['velocity'] = np.sqrt(df1['water_u']**2 + df1['water_v']**2)
    for i in range(radius, len(sshlat)-radius):
        for j in range(radius, len(sshlon)-radius):
            if np.isnan(srcSSH[i][j]):
                continue
            # judge velocity
            queryExpr = 'lon=={0} and lat=={1}'.format(sshlon[j], sshlat[i])
            qdf = df1.query(queryExpr)
            if qdf.index.empty: # 该点没有velocity
                velocity = 0 # to be discussed
            else:
                velocity = qdf['velocity'].values[0]
            if velocity > 0.2:
                continue
            # 暖涡
            if np.nanmax(srcSSH[i-radius:i+radius+1, j-radius:j+radius+1]) == srcSSH[i][j]:
                if isEddyCenter(ow, sshlon[j], sshlat[i], owlonList, owlatList, owstd):
                    threshold = sshthreshold(i, j, radius, sshlon, sshlat, srcSSH, tarSSH, 'warm')
                    boundaryList.append(eddyBoundary(i, j, sshlon, sshlat, threshold, srcSSH, 'warm'))
            # 冷涡
            elif np.nanmin(srcSSH[i-radius:i+radius+1, j-radius:j+radius+1]) == srcSSH[i][j]:
                if isEddyCenter(ow, sshlon[j], sshlat[i], owlonList, owlatList, owstd):
                    threshold = sshthreshold(i, j, radius, sshlon, sshlat, srcSSH, tarSSH, 'cold')
                    boundaryList.append(eddyBoundary(i, j, sshlon, sshlat, threshold, srcSSH, 'cold'))
    return jsonify(boundaryList)
    
if __name__ == '__main__':
    app.run(debug=True, port=8000)
