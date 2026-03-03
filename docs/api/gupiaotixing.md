# 项目接口清单

本文档列出了项目中使用的所有外部接口。

## 数据接口

1.  **腾讯股票数据接口**
    *   **URL**: `http://qt.gtimg.cn/q=`
    *   **用途**: 获取股票的实时行情数据。
    *   **相关文件**: `3.8.0_0/js/stock.js`

2.  **雪球股票数据接口**
    *   **URL**: `https://stock.xueqiu.com/v5/stock/realtime/quotec.json?symbol=`
    *   **用途**: 获取雪球网提供的股票实时行情数据。
    *   **相关文件**: `3.8.0_0/js/stock.xueqiu.js`

3.  **新浪股票数据接口**
    *   **URL**: `http://hq.sinajs.cn/list=`
    *   **用途**: 获取新浪财经提供的股票实时行情数据。
    *   **相关文件**: `3.8.0_0/js/stock.sina.js`

4.  **新浪股票搜索建议接口**
    *   **URL**: `http://suggest3.sinajs.cn/suggest/`
    *   **用途**: 根据用户输入提供股票代码或名称的自动完成建议。
    *   **相关文件**: `3.8.0_0/js/options.js` (在注释中提及)

## 图表接口

5.  **新浪股票分钟图接口**
    *   **URL 格式**: `http://image.sinajs.cn/newchart/min/n/{stockCode}.gif`
    *   **用途**: 获取指定股票的分钟K线图。
    *   **相关文件**: `3.8.0_0/js/stock.js`, `3.8.0_0/js/stock.xueqiu.js`, `3.8.0_0/js/stock.sina.js`

6.  **新浪股票日K图接口**
    *   **URL 格式**: `http://image.sinajs.cn/newchart/daily/n/{stockCode}.gif`
    *   **用途**: 获取指定股票的日K线图。
    *   **相关文件**: `3.8.0_0/js/stock.js`, `3.8.0_0/js/stock.xueqiu.js`, `3.8.0_0/js/stock.sina.js`
