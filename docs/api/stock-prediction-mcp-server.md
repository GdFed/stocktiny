# 项目外部接口清单（API Inventory）

本项目通过统一封装层（src/services/api.ts + http-client.ts）调用多类第三方数据源：东方财富（Eastmoney）、新浪（Sina）、腾讯（Tencent）。本文档梳理所有实际使用到的接口端点、请求方法、公共请求头、参数说明、返回结构要点，以及在项目中的封装函数与调用位置，便于维护和扩展。

目录
- 公共约定（Headers/UA/参数构造）
- 代码与市场转化工具（toSinaCode / toEastMoneySecid）
- 东方财富（Eastmoney）
  - 行情（push2）
  - 历史K线（push2his）
  - 数据中心（datacenter-web）
  - 证券中心数据（securities/api/data）
  - F10 聚合时间线（RTP_F10_INDEX）
  - 新闻搜索（JSONP）
  - 公告列表
- 新浪（Sina）
- 腾讯（Tencent）
- 调用参考与示例

==============================
公共约定（Headers/UA/参数构造）
==============================

- UA 池与随机 UA
  - 项目内内置多个常见浏览器 UA（见 src/services/api.ts 的 UA_POOL），默认请求时会随机选择一个 UA，以降低单一 UA 被限流的风险。
  - 如需覆盖，调用时可通过 headers 传入自定义 User-Agent。

- 标准 Referer（由封装层按来源自动设置）
  - Eastmoney push2/push2his 行情：Referer: https://quote.eastmoney.com
  - Eastmoney datacenter-web 数据中心：Referer: https://data.eastmoney.com/
  - Eastmoney 证券中心（F10/财务等）：Referer: https://datacenter.eastmoney.com
  - Eastmoney 搜索：Referer: https://search.eastmoney.com/
  - Sina 行情：Referer: https://finance.sina.com.cn
  - Tencent 行情：Referer: https://gu.qq.com

- 查询串构造
  - 统一使用 buildURL(base, params) 组装，忽略 undefined 参数，并对生成的 query string 做 decodeURIComponent（满足部分接口对未编码字符的宽松要求）。
  - JSONP/特殊参数（如 Eastmoney 搜索）见对应小节。

- HTTP 方法
  - 本项目所有外部接口均为 GET。

- 统一封装出口（src/services/api.ts）
  - httpClient: axios 实例（默认超时 30s，带请求/响应日志）
  - fetchText: 用于返回文本或 JSONP 原文字符串
  - 其余函数均为对外部接口的薄封装，统一处理 headers、URL 与错误兜底。

===========================
代码与市场转化工具（重要）
===========================

文件：src/utils/stock-code.ts

- parseStockCode(input): 解析股票代码，支持 000001 / sz000001 / 000001.SZ 等，返回 { code, market, fullCode }
- toSinaCode(input): 返回新浪/腾讯格式 fullCode，如 sh600000 / sz000001
- toTencentCode(input): 同上
- toEastMoneySecid(input)/toEastMoneyCode(input): 返回东财 secid 格式，如 上海=1.600000，深圳=0.000001
- isValidStockCode / formatStockCode：校验与格式化

调用层普遍依赖上述函数正确生成参数（如 secid、list、q 等）。

===========================
东方财富（Eastmoney）
===========================

1) 行情（push2）

- Endpoint
  - https://push2.eastmoney.com/api/qt/stock/get
- 方法
  - GET
- 必要请求头
  - Referer: https://quote.eastmoney.com
  - User-Agent: 随机 UA（可覆盖）
- 请求参数
  - secid: string（示例：1.600000 或 0.000001；详见 toEastMoneySecid）
  - fields: string（逗号分隔 f 字段列表）
- 返回
  - 顶层 JSON，其中 data 字段为目标对象；各 f 字段含义参见 eastmoney.md（本仓库内）
- 封装函数
  - eastmoneyQuoteGet({ secid, fields }): Promise<Record<string, unknown>>
- 调用位置（示例）
  - src/services/dimensions/fundamental/index.ts（fetchStockBasicInfo 用于获取 f43,f44,f45,...,f129,f162 等）
  - src/services/dimensions/news/index.ts（fetchIndustryInfo / fetchFundamentalData 精简上下文 f127,f128,f129）
  - src/services/dimensions/capital/index.ts（资金/情绪视图依赖 f178 等）

常用字段举例（非完整）：  
- 价格：f43 收盘, f46 开盘, f44 最高, f45 最低, f71 均价  
- 交易：f47 成交量, f48 成交额, f50 量比, f168 换手率  
- 基本信息：f57 代码, f58 名称, f80 交易时段, f84 总股本, f85 流通股  
- 行业上下文：f127 行业, f128 地区, f129 概念  
- 估值/市值：f92 每股净资产, f116 总市值(元), f117 流通市值(元), f162 市盈率  
- 资金：f137 主力净流入, f140 超大单净流入, f178 近5日主力净流入

2) 历史K线（push2his）

- Endpoint
  - https://push2his.eastmoney.com/api/qt/stock/kline/get
- 方法
  - GET
- 必要请求头
  - Referer: https://quote.eastmoney.com
- 请求参数
  - secid: string（同上）
  - klt: string 周期代码（day=101, week=102, month=103, 60min=60, 30min=30, 15min=15, 5min=5）
  - fqt: string 复权类型（默认 1）
  - end: string 截止日期（默认 20500101）
  - lmt: number 条数（默认 120）
  - fields1: string（默认 f1,f2,f3,f4,f5,f6）
  - fields2: string（默认 f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61）
- 返回
  - 可能为 JSONP 字符串，需 parse（项目中使用 parseMaybeJsonp 解析后读取 data.klines）
- 封装函数
  - eastmoneyKlineGetRaw({ secid, klt, ... }): Promise<string>
  - 上层使用：src/services/dimensions/technical/index.ts 的 fetchKlineData

3) 数据中心（datacenter-web）

- Endpoint
  - https://datacenter-web.eastmoney.com/api/data/v1/get
- 方法
  - GET
- 必要请求头
  - Referer: https://data.eastmoney.com/
- 请求参数
  - reportName: string（报告名，如 RPT_FCI_PERFORMANCEE 等）
  - columns: string（默认 ALL）
  - filter: string（常为已编码的过滤表达式，如 (SECURITY_CODE%3D%22688727%22)）
  - 其他：可通过 extraParams 透传（见源码）
- 返回
  - 顶层 { success, result: { data: [] } }，封装层直接返回 result.data 列表（数组）
- 封装函数
  - eastmoneyDataGet({ reportName, columns, filter, extraParams? }): Promise<Record<string,unknown>[]>
- 示例
  - 本文件底部“旧示例”保留了 RPT_FCI_PERFORMANCEE 请求与返回片段说明

4) 证券中心数据（securities/api/data）

- Endpoint
  - https://datacenter.eastmoney.com/securities/api/data/get
- 方法
  - GET
- 必要请求头
  - Referer: https://datacenter.eastmoney.com
- 请求参数
  - type: string（接口类型，如 RPT_F10_FINANCE_MAINFINADATA、RTP_F10_INDEX 等）
  - sty: string（返回风格，如 APP_F10_MAINFINADATA）
  - filter: string（过滤条件，需编码。示例：(SECUCODE%3D%22000001.SZ%22)）
  - p: number（页码，默认 1）
  - ps: number（每页条数，默认 10）
  - st: string（排序字段，示例 REPORT_DATE）
  - sr: number（排序方向，默认 -1）
  - 其他：支持扩展参数 extraParams
- 返回
  - 顶层 { success, result: { data: [] } }，封装层直接返回 result.data 数组
- 封装函数
  - eastmoneySecuritiesDataGet({ type, sty, filter, p, ps, st, sr, extraParams? }): Promise<Record<string,unknown>[]>
- 调用位置（示例）
  - src/services/dimensions/fundamental/index.ts（fetchFinancialIndicators）：
    - type: RPT_F10_FINANCE_MAINFINADATA
    - sty: APP_F10_MAINFINADATA
    - filter: (SECUCODE%3D%22{code}.{SZ|SH}%22)
    - 读取字段如 EPSJB（EPS）、BPS、ROEJQ、XSMLL（毛利率）、XSJLL（净利率）、DJD_TOI_YOY/TOTALOPERATEREVETZ（营收同比）、PARENTNETPROFITTZ（净利同比）、ZCFZL（资产负债率）、LD（流动比率）、SD（速动比率）等

5) F10 聚合时间线（RTP_F10_INDEX）

- Endpoint
  - https://datacenter.eastmoney.com/securities/api/data/get（同 securities 接口）
- 方法
  - GET
- 必要请求头
  - Referer: https://datacenter.eastmoney.com
- 请求参数
  - type: 固定 "RTP_F10_INDEX"
  - params: string（symbolWithSuffix，示例：000001.SZ 或 600000.SH）
- 返回
  - 顶层 { code, data, success, hasNext, message }；data 为二维数组（按事件类型分组）
- 封装函数
  - eastmoneyF10IndexGet({ symbolWithSuffix })
- 调用位置（示例）
  - src/services/dimensions/news/index.ts（fetchStockAnnouncements）：拉取后扁平化、按 NOTICE_DATE 排序映射为公告项

6) 新闻搜索（JSONP）

- Endpoint
  - https://search-api-web.eastmoney.com/search/jsonp
- 方法
  - GET（JSONP）
- 必要请求头
  - Referer: https://search.eastmoney.com/
  - Accept: */*
  - Accept-Language: zh-CN,zh;q=0.9
- 请求参数
  - cb: string（回调函数名，示例 jQuery）
  - param: string（需对 JSON.stringify 后的对象做 encodeURIComponent）
    - 结构示例：
      {
        "uid": "",
        "keyword": "股票代码或关键词",
        "type": ["cmsArticleWebOld"],
        "client": "web",
        "clientType": "web",
        "clientVersion": "curr",
        "param": {
          "cmsArticleWebOld": {
            "searchScope": "all|title|content",
            "sort": "time",
            "pageIndex": 1,
            "pageSize": 10,
            "preTag": "",
            "postTag": ""
          }
        }
      }
- 返回
  - JSONP 字符串，需要 parseMaybeJsonp 解析
- 封装函数
  - eastmoneySearchNewsRaw({ keyword, pageIndex?, pageSize?, sort?, searchScope? }): Promise<string>
- 调用位置
  - src/services/dimensions/news/index.ts（fetchStockNews）

7) 公告列表（公告中心）

- Endpoint
  - https://np-anotice-stock.eastmoney.com/api/security/ann
- 方法
  - GET
- 必要请求头
  - Referer: https://data.eastmoney.com/
- 请求参数
  - stock_list: string（股票列表，示例 "600000,000001" 等）
  - sr: number（排序方向，默认 -1）
  - page_size: number（默认 5）
  - page_index: number（默认 1）
  - ann_type: string（默认 'A'）
- 返回
  - 顶层 { data: { list: [] } }；封装层直接返回 data.list 或空数组
- 封装函数
  - eastmoneyNoticeAnnGet({ stock_list, sr?, page_size?, page_index?, ann_type? }): Promise<Array<{title, columns, notice_date, art_code}>>
- 备注
  - 当前消息面实现已切换为 F10 RTP_F10_INDEX 方案作为公告源，但该接口封装仍保留可复用。

==========
新浪（Sina）
==========

- Endpoint
  - 基础域名：https://hq.sinajs.cn
  - 路径式参数：/list={list}（注意：不是 ?list=...）
- 方法
  - GET
- 必要请求头
  - Referer: https://finance.sina.com.cn
- 请求参数
  - list: string（股票代码列表，逗号分隔；格式为 sh600000 或 sz000001；参见 toSinaCode）
- 返回
  - 文本，形如：
    var hq_str_sh600000="浦发银行,9.800,9.790,9.720,9.830,9.710,9.720,9.730,38642918,377066476.000,50700,9.720,1792400,9.710,1920000,9.700,847900,9.690,898800,9.680,1060314,9.730,723588,9.740,806900,9.750,392700,9.760,239400,9.770,2026-02-26,11:19:20,00,";
  - 解析：项目内 parseSinaQuote 依据逗号分隔字段解析 name/open/prevClose/current/high/low/volume/amount 等。
  - 重要字段（摘录）：
    - 0 名称，1 今日开盘，2 昨收，3 当前价，4 最高，5 最低，8 成交量（股），9 成交额（元），30 日期，31 时间
- 封装函数
  - sinaQuoteList({ list }): Promise<string>
- 调用位置
  - src/services/dimensions/technical/index.ts（fetchQuoteFromSina / fetchStockQuote）

==========
腾讯（Tencent）
==========

- Endpoint
  - 基础域名：https://qt.gtimg.cn
  - 路径式参数：/q={q}
- 方法
  - GET
- 必要请求头
  - Referer: https://gu.qq.com
- 请求参数
  - q: string（股票代码或列表，格式与新浪一致：sh600000 / sz000001）
- 返回
  - 文本，形如：v_sh600000="~浦发银行~..."; 字段以 ~ 分隔
  - 解析：项目内 parseTencentQuote 使用 ~ 分割并映射字段，常用：
    - [1] 名称, [3] 当前价, [4] 昨收, [5] 今开, [33] 最高, [34] 最低, [6] 成交量, [37] 成交额(万元) 等
- 封装函数
  - tencentQuoteQ({ q }): Promise<string>
- 调用位置
  - src/services/dimensions/technical/index.ts（fetchQuoteFromTencent / fetchStockQuote 兜底）

=====================
调用参考与示例片段
=====================

1) 获取行业/概念/地区（简版上下文）
- 封装：eastmoneyQuoteGet({ secid, fields: "f127,f128,f129" })
- 计算 secid：toEastMoneySecid("000001") -> "0.000001"
- 典型调用：src/services/dimensions/news/index.ts -> fetchFundamentalData

2) 获取 K 线（日线示例）
- 封装：eastmoneyKlineGetRaw({ secid, klt: "101", fqt: "1", end: "20500101", lmt: 120 })
- 解析：parseMaybeJsonp(text).data.klines 映射为 [date, open, close, high, low, volume, amount, …]

3) 获取实时行情（综合）
- 首选：新浪 sinaQuoteList({ list: toSinaCode(symbol) })
- 失败兜底：腾讯 tencentQuoteQ({ q: parseStockCode(symbol).fullCode })

4) 获取财务指标（证券中心）
- 封装：eastmoneySecuritiesDataGet({
    type: "RPT_F10_FINANCE_MAINFINADATA",
    sty: "APP_F10_MAINFINADATA",
    filter: `(SECUCODE%3D%22${code}.${marketSuffix}%22)`,
    p: 1,
    ps: 1,
    st: "REPORT_DATE",
    sr: -1
  })
- 字段映射参考 src/services/dimensions/fundamental/index.ts 中 fetchFinancialIndicators

======================
旧示例（保留摘录）
======================

东方财富获取财务指标数据（datacenter-web）：
https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_FCI_PERFORMANCEE&columns=ALL&filter=(SECURITY_CODE%3D%22688727%22)

返回结构与字段示意（节选）见仓库此前内容；关键字段含义与目标字段映射可参考：
- BASIC_EPS（每股收益）→ eps
- PARENT_BVPS（每股净资产）→ bps
- WEIGHTAVG_ROE（ROE）→ roe
- YSTZ（营收同比）→ revenueYoY
- JLRTBZCL（净利同比）→ netProfitYoY
- TOTAL_OPERATE_INCOME（营收）、PARENT_NETPROFIT（归母净利）……
（实际生产实现目前切换为证券中心 RPT_F10_FINANCE_MAINFINADATA）

======================
封装函数一览（索引）
======================

文件：src/services/api.ts
- 新浪
  - sinaQuoteList({ list }): GET https://hq.sinajs.cn/list={list}（返回文本）
- 腾讯
  - tencentQuoteQ({ q }): GET https://qt.gtimg.cn/q={q}（返回文本）
- 东财 push2（行情）
  - eastmoneyQuoteGet({ secid, fields }): GET https://push2.eastmoney.com/api/qt/stock/get
- 东财 push2his（K线，可能 JSONP）
  - eastmoneyKlineGetRaw({ secid, klt, fqt?, end?, lmt?, fields1?, fields2? }): GET https://push2his.eastmoney.com/api/qt/stock/kline/get（返回文本）
- 东财 datacenter-web（数据中心）
  - eastmoneyDataGet({ reportName, columns?, filter?, extraParams? }): GET https://datacenter-web.eastmoney.com/api/data/v1/get
- 东财 证券中心数据
  - eastmoneySecuritiesDataGet({ type, sty, filter?, p?, ps?, sr?, st?, extraParams? }): GET https://datacenter.eastmoney.com/securities/api/data/get
- 东财 F10 聚合时间线
  - eastmoneyF10IndexGet({ symbolWithSuffix }): GET https://datacenter.eastmoney.com/securities/api/data/get（type=RTP_F10_INDEX）
- 东财 新闻搜索（JSONP）
  - eastmoneySearchNewsRaw({ keyword, pageIndex?, pageSize?, sort?, searchScope? }): GET https://search-api-web.eastmoney.com/search/jsonp
- 东财 公告列表
  - eastmoneyNoticeAnnGet({ stock_list, sr?, page_size?, page_index?, ann_type? }): GET https://np-anotice-stock.eastmoney.com/api/security/ann

======================
额外说明与注意事项
======================

- JSONP 返回：eastmoneyKlineGetRaw / eastmoneySearchNewsRaw 返回文本，需使用 parseMaybeJsonp 解析。
- 金额/数值单位：eastmoneyQuoteGet 返回的价格通常需除以 100；部分市值为元，需要转换为亿元（参考 src/services/dimensions/fundamental/index.ts 的 toNumber 使用）。
- 过滤条件编码：证券中心/datacenter-web 的 filter 参数需要预先 URL 编码；封装层不会重复编码 filter 字符串（防止双重编码）。
- 速率与稳定性：封装层使用随机 UA 与规范 Referer；如遇 403/限流，请考虑增加 UA 池、引入代理或降低请求频率。
- 变更追踪：如第三方字段/接口发生调整，请优先更新 src/services/api.ts 的封装函数与此文档。
