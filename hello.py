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
    return render_template('layer.html')

# 以下是api，供前端ajax调用
# 以下变量用于合法性检查，暂时无用
ROOTPATH = './oceandata'  # 路径和文件名规律: ./oceandata/depth/2014-07-01.csv
SSH_GRID_PATH = 'surf_el_grid'
DEPTH_DEFAULT = '0.0m'  # 默认深度
DEPTH_LIST = ['0.0m', '8.0m', '15.0m', '30.0m', '50.0m']
OWMAGNITUDE = 1e10

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
                if qdf.empty:
                    continue
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

def sshthreshold(centerI, centerJ, radius, lonList, latList, srcSSH, eddyType):
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

def isEddyCenter(srcSSH, sshi, sshj, sshext, sshlon, sshlat, radius, df1, owstd):
    if srcSSH[sshi][sshj] != sshext:
        return False
    else:
        maxpoints = []
        maxpointsscale = np.where(srcSSH[sshi-radius:sshi+radius+1, sshj-radius:sshj+radius+1]==sshext)
        if maxpointsscale[0].size < 1:
            return False
        else:
            maxpoints.append(maxpointsscale[0] + (sshi-radius))
            maxpoints.append(maxpointsscale[1] + (sshj-radius))
            if maxpoints[0].size == 1:
                queryExpr = 'lon=={0} and lat=={1}'.format(sshlon[maxpoints[1][0]], sshlat[maxpoints[0][0]])
                qdf = df1.query(queryExpr)
                if qdf.index.empty: # 该点没有ow
                    return False
                elif qdf['ow'].values[0] < -0.2*owstd and qdf['velocity'].values[0] < 0.3:
                    return True
                else:
                    return False
            else:
                for k in range(maxpoints[0].size):
                    minow = 0
                    mink = -1
                    queryExpr = 'lon=={0} and lat=={1}'.format(sshlon[maxpoints[1][k]], sshlat[maxpoints[0][k]])
                    qdf = df1.query(queryExpr)
                    if qdf.index.empty: # 该点没有ow
                        continue
                    elif qdf['ow'].values[0] < -0.2*owstd and qdf['velocity'].values[0] < 0.3:
                        if qdf['ow'].values[0] < minow:
                            minow = qdf['ow'].values[0]
                            mink = k
                    else:
                        continue
                if minow == 0 or mink < 0:
                    return False
                elif sshlon[maxpoints[1][mink]] == sshlon[sshj] and sshlat[maxpoints[0][mink]] == sshlat[sshi]:
                    return True
                else:
                    return False

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
    radius = scale // 2
    boundaryList = []
    df1 = pd.read_csv('/'.join([ROOTPATH, DEPTH_DEFAULT, dataInfo['time']+'.csv']))
    owstd = np.nanstd(df1['ow'])
    df1['velocity'] = np.sqrt(df1['water_u']**2 + df1['water_v']**2)
    for i in range(radius, len(sshlat)-radius):
        for j in range(radius, len(sshlon)-radius):
            if np.isnan(srcSSH[i][j]):
                continue
            # 暖涡
            if isEddyCenter(srcSSH, i, j, np.nanmax(srcSSH[i-radius:i+radius+1, j-radius:j+radius+1]), sshlon, sshlat, radius, df1, owstd):
                threshold = sshthreshold(i, j, radius, sshlon, sshlat, srcSSH, 'warm')
                boundaryList.append(eddyBoundary(i, j, sshlon, sshlat, threshold, srcSSH, 'warm'))
            # 冷涡
            elif isEddyCenter(srcSSH, i, j, np.nanmin(srcSSH[i-radius:i+radius+1, j-radius:j+radius+1]), sshlon, sshlat, radius, df1, owstd):
                threshold = sshthreshold(i, j, radius, sshlon, sshlat, srcSSH, 'cold')
                boundaryList.append(eddyBoundary(i, j, sshlon, sshlat, threshold, srcSSH, 'cold'))
    return jsonify(boundaryList)

if __name__ == '__main__':
    app.run(debug=True, port=8000)
