# 将 oceandata 目录下的深度/日期.csv 数据按照 经度/维度.csv 的形式存储
# 方法：给定经纬度，判断文件是否存在，存在这跳过，不存在则执行：
# 遍历每个 深度/日期.csv 找到对应经纬度的数据，合并这些数据，得到新格式的 csv
# 特点：
# 1. io 次数多，每次 io 的内容不多，须重复读同一个文件，既是 io 密集，也是 cpu 密集
# 2. 多进程，默认启动 60 个进程。
import os
import time
import pandas as pd
from multiprocessing import Pool
from multiprocessing import Process

# DEPTH_LIST = ['0.0m', '8.0m', '15.0m', '30.0m', '50.0m']

def floatToStr(num):
    return str(num).replace('.', 'p')

def get_data_bylonlat(lon, lat, cur, total):
    ROOTPATH = "./oceandata"
    tarPath = '/'.join([ROOTPATH, floatToStr(lon)])
    tarFile = '/'.join([tarPath, floatToStr(lat)+'.csv'])
    if os.path.isfile(tarFile):
        print('skip lon={0}, lat={1}'.format(lon, lat))
    else:
        print('calu lon={0}, lat={1}'.format(lon, lat))
        queryExpr = 'lon=={0} and lat=={1}'.format(lon, lat)
        start = time.clock()
        res = []
        for depth in ['0.0m', '8.0m', '15.0m', '30.0m', '50.0m']:
            absPath = '/'.join([ROOTPATH, depth])
            fileList = os.listdir(absPath)
            for f in fileList:
                dict1 = {}
                df1 = pd.read_csv('/'.join([absPath, f])).drop(columns=['ow'])
                qdf = df1.query(queryExpr).drop(columns=['lon', 'lat'])
                if qdf.empty:
                    continue
                dict1 = qdf.to_dict('record')
                dict1[0]['date'] = f[:-4]
                dict1[0]['depth'] = depth
                res.append(dict1[0])
        print("run time: {0} s".format(time.clock()-start))
        if not os.path.exists(tarPath):
            os.makedirs(tarPath)
        df1 = pd.DataFrame.from_records(res)
        df1.to_csv(tarFile, index=False)
    print("done process {0}/{1}".format(cur, total))
    

if __name__ == "__main__":
    basefn = "./oceandata/0.0m/2014-07-01.csv"
    df1 = pd.read_csv(basefn)
    total = len(df1)
    pool = Pool(processes=60)
    for i, row in df1.iterrows():
        # print("processing {0}/{1}".format(i, total))
        pool.apply_async(get_data_bylonlat, (row['lon'], row['lat'], i, total))
        # get_data_bylonlat(row['lon'], row['lat'])
    pool.close()
    pool.join()
