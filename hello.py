from flask import Flask, redirect, render_template, url_for
from flask import jsonify, request, json
from datetime import timedelta
import os
import pandas as pd
import time
app = Flask(__name__)

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(seconds=120)  # 将缓存最大时间设置为1s


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
    return df.to_json(orient='records')


@app.route('/api/get_data_heatmap', methods=['POST'])
def get_data_heatmap():
    '''
    request.json是个dict, 下面是个例子
    {
        "resulation": 0p083,
        "attr": "ssh",
        "time": "2000-01-16",
        (option)"depth": "5p01m"
    }
    '''
    dataInfo = request.json
    print(dataInfo)
    # todo: dataInfo合法性检查
    path = ROOTPATH + dataInfo["resulation"]
    # 下面的filename还没有csv后缀
    fileName = '/'.join([path, dataInfo["attr"],
                         dataInfo["time"]])

    if 'depth' in dataInfo:
        fileName += (',' + dataInfo["depth"] + '.csv')
    else:
        fileName += '.csv'
    print(fileName)

    df = pd.read_csv(fileName)
    df.columns = ['lon', 'lat', 'value']  # 这句其实有点多此一举
    # return pd.read_csv(fileName).to_json(orient='records')
    return df.to_json(orient='records')


@app.route('/api/get_data_scatter', methods=['POST'])
def get_data_scatter():
    '''
    request.json是个dict, 下面是个例子
    {
        "resulation": 0p083, # 两文件的分辨率必须一致，其他不作要求
        "file1": {
            "attr": "ssh",
            "time": "2000-01-16",
            (option)"depth": "5p01m"
        }, # x
        "file2":{
            ...
        } # y
    }
    '''
    dataInfo = request.json
    print(dataInfo)
    # todo: dataInfo合法性检查
    path = ROOTPATH + dataInfo["resulation"]
    # 下面的filename还没有csv后缀
    fileName1 = '/'.join([path, dataInfo["file1"]["attr"],
                          dataInfo["file1"]["time"]])
    fileName2 = '/'.join([path, dataInfo["file2"]["attr"],
                          dataInfo["file2"]["time"]])

    # 根据需要加入后缀
    if 'depth' in dataInfo["file1"]:
        fileName1 += (',' + dataInfo["file1"]["depth"] + '.csv')
    else:
        fileName1 += '.csv'

    if 'depth' in dataInfo["file2"]:
        fileName2 += (',' + dataInfo["file2"]["depth"] + '.csv')
    else:
        fileName2 += '.csv'

    df1 = pd.read_csv(fileName1)
    df2 = pd.read_csv(fileName2)
    df3 = pd.merge(df1, df2, how='inner', on=['lon', 'lat'])
    df3.columns = ['lon', 'lat', 'x', 'y']
    # 不需要经纬度
    return df3.drop(columns=['lon', 'lat']).to_json(orient='records')

# 可以考虑与scatter合并
@app.route('/api/get_data_paraller', methods=['POST'])
def get_data_paraller():
    '''
    request.json是个dict, 下面是个例子
    {
        "resulation": "0p1",
        "time":"2001-01-16",
        "depth":"5.01m",
        "attrs": ["ssh", "salt", ...]
    }
    '''
    dataInfo = request.json
    print(dataInfo)
    # todo: dataInfo合法性检查
    path = ROOTPATH + dataInfo["resulation"]

    # 最多返回6个可变属性的数据
    count = len(dataInfo["attrs"]) if 6 > len(dataInfo["attrs"]) else 6
    columns = ['lon', 'lat']
    for i in range(count):
        fileName = '/'.join([path, dataInfo["attrs"][i], dataInfo["time"]])
        
        if dataInfo["attrs"][i] != 'ssh':
            fileName += (',' + dataInfo["depth"] + '.csv')
        else:
            fileName += '.csv'
        columns.append(dataInfo["attrs"][i])
        df1 = pd.read_csv(fileName)
        if i != 0:
            df2 = pd.merge(df2, df1, how='inner', on=['lon', 'lat']) # ide会提示错误，确实很危险
        else:
            df2 = df1.copy()

    df2.columns = columns
    # 不需要经纬度
    print(df2)
    return df2.drop(columns=['lon', 'lat']).to_json(orient='records')

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
    print(dataInfo)
    queryExpr = 'lon=={0} and lat=={1}'.format(dataInfo['lon'], dataInfo['lat'])
    start = time.clock()
    for depth in DEPTH_LIST:
        absPath = '/'.join([ROOTPATH, depth])
        fileList = os.listdir(absPath)
        for file in fileList:
            dict1 = {}
            df1 = pd.read_csv('/'.join([absPath, file]))
            qdf = df1.query(queryExpr).drop(columns=['lon', 'lat'])
            dict1 = qdf.to_dict('record')
            dict1[0]['date'] = file[:-4]
            dict1[0]['depth'] = depth
            res.append(dict1[0])
        print("run time: "+str(time.clock()-start)+" s")
    return jsonify(res)

if __name__ == '__main__':
    app.run(debug=True, port=8000)
