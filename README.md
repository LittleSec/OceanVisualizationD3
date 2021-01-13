# OceanVisualizationD3
使用以d3.js为主的库作海洋可视化分析
2018 OUC本科毕业设计

> release-branch删除了几乎所有无用的代码和注释。若需要开发请切换其他分支，主分支为develop分支
>
> 当时答辩用的演示视频已经上传到[bilibili](https://www.bilibili.com/video/BV1Ep4y1176z/)，没有讲解的声音。

## 使用

### 一、环境
1. 服务端：Python 3.6.x(3.4.x以上), Flask 1.0.2
2. 浏览器：Chrome
3. 用到的Python第三方库在```./requirements.txt```，执行命令：```pip3 install -r requirements.txt```，或一个一个安装。目前来说直接安装最新版本也行，可以无需指定版本。
4. 用到的第三方JavaScript库和css库都在```./static/lib```目录下，也可以使用CDN，在```./template/layer.html```的```<head>```标签中。

### 二、数据文件
1. 数据文件在百度盘，过段时间整理完后再分享。
    + 咨询的人有点多的，在此说明一下，数据仍有备份，但是量多而且有部分文件太大了，超过了百度盘非会员的上传限制，所以搁置到至今
    + 先提供部分的，不全，也不是最终数据：链接: https://pan.baidu.com/s/1g92muz_aGwbJz4YjLJT_5w  密码: rak8
    + 目前在浏览器收藏夹里找到两个和数据集下载有关的链接，但具体是网页里的哪个链接确实是记不起来了：[hycom](http://tds.hycom.org/thredds/catalog.html)和[IRI/LDEO](http://iridl.ldeo.columbia.edu/SOURCES/.CARTON-GIESE/.SODA/.v2p2p4/)
    + 本科毕业后不再从事这方面的工作和研究了，因此没有动力去精简一个能直接用的demo数据，待硕士毕业后有机会整理
    + 之后可能会选择付费/实体存储介质等形式提供数据
2. 数据文件夹名为oceandata，下载解压后放到项目根目录，即和```hello.py```在同一个目录下。
3. 数据文件尚未齐全，```./oceandata/lon/lat.csv```这种数据文件动态生成，若已存在则直接读取，若不存在则生成数据并存成csv方便下次读取。百度盘中这种数据文件只有部分。
    > 这算是一个不足，后续考虑改善数据存储形式（如sql）能有效解决这个问题。
2. 数据处理的代码在本人的[ncinterp](https://github.com/LittleSec/ncinterp/tree/nctocsv-nointerp-branch)仓库（数据文件使用该仓库生成），该repo尚未整理，后续可能会调整分支名字甚至是仓库名，若到时发现货不对板，请联系我即可。

### 三、运行
1. 进入根目录下直接运行```hello.py```开启服务器，输入命令为：```python3 hellp.py```。
2. 开启服务器后，在网址输入```127.0.0.1:8000```。
3. 加载需要时间，后期会尽量解决这个问题。

## 联系：
1. 直接在issue提问。
2. email: 517862788@qq.com
3. 若需要开发，请切换到develop分支。
