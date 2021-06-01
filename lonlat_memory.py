# 将 oceandata 目录下的深度/日期.csv 数据按照 经度/维度.csv 的形式存储
# 方法：
# 遍历每个 深度/日期.csv 按照经纬度分类，遍历完后再写入新格式的 csv
# 特点：
# 1. 需要大内存，一次把所有文件读入内存，处理完后再一次写入
# 2. io 次数少，且每次内容也多，不会重复读一个文件
import os
import time
import pandas as pd

ROOTPATH = "./oceandata"
DEPTH_LIST = ['0.0m', '8.0m', '15.0m', '30.0m', '50.0m']

def floatToStr(num):
    return str(num).replace('.', 'p')

def processAllFile():
    file2result = {}
    for depth in DEPTH_LIST:
        absPath = '/'.join([ROOTPATH, depth])
        fileList = os.listdir(absPath)
        start = time.clock()
        print("processing depth: {0}".format(depth))
        for f in fileList:
            absf = '/'.join([absPath, f])
            print("processing file: {0}".format(absf))
            df1 = pd.read_csv(absf).drop(columns=['ow'])
            for i, row in df1.iterrows():
                tarPath = '/'.join([ROOTPATH, floatToStr(row['lon'])])
                if not os.path.exists(tarPath):
                    os.makedirs(tarPath)
                tarFile = '/'.join([tarPath, floatToStr(row['lat'])+'.csv'])
                if os.path.isfile(tarFile):
                    continue
                dict1 = row.drop(labels=['lon', 'lat']).to_dict()
                dict1['date'] = f[:-4]
                dict1['depth'] = depth
                if tarFile not in file2result:
                    file2result[tarFile] = []
                file2result[tarFile].append(dict1)
        print("run time: {0} s".format(time.clock()-start))
    for f, res in file2result.items():
        pd.DataFrame.from_records(res).to_csv(f, index=False)

if __name__ == "__main__":
    processAllFile()
