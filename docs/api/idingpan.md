# API 接口清单（项目内实际调用的外部接口）

本文档根据代码扫描结果整理，列出项目中通过 fetch/请求适配器实际调用的所有外部接口。为方便维护，按服务提供方分组，并标注用途、HTTP 方法、常用查询参数及相关代码位置/方法名。部分域名存在主备切换（见“域名与容灾”）。

更新时间：2026-03-03

---

## 目录
- 东方财富 Push 系列
  - 实时行情（批量）/ 个股列表
  - 分时/五日趋势
  - K 线数据
  - 排行榜/板块列表
- 东方财富 数据中心
  - ETF 列表
- 东方财富 搜索
- 同花顺（10jqka）数据
  - 分钟成交额/涨停等图表
  - 涨跌分布（实时）
  - 热榜股票
- 大智慧（DZH）涨停温度
- 自建/第三方服务
  - 股票列表（备用）
- 其它/辅助说明
  - 动态构造的 K 线请求
  - 域名与容灾策略

---

## 东方财富 Push 系列

> 说明：代码中通过 Bo 映射存在主域名与备用域名切换。对应键为 `push2`, `push2delay`, `push2his`。见“域名与容灾”。

### 1. 实时行情数据（批量）/ 个股列表
- URL
  - https://push2delay.eastmoney.com/api/qt/ulist.np/get
  - https://push2.eastmoney.com/api/qt/ulist.np/get （背景页使用）
- 方法：GET
- 用途：
  - 批量获取证券的实时行情（首页列表、悬浮窗、角标数字）
  - 背景页 badge 更新与多标的行情汇总
- 常用查询参数（示例）
  - fltt: 2
  - fields: f2,f3,f12,f13,f14,f18（价格、涨幅、代码、交易所、名称、今开等）
  - secids: 多个 secid 以逗号分隔（如 sz000001, sh000300 …）
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `yr(symbols, fields)`
  - background/background.js: 构造 `https://push2.eastmoney.com/api/qt/ulist.np/get?...`

### 2. 分时/五日趋势图
- URL（两类域名均出现）
  - https://push2his.eastmoney.com/api/qt/stock/trends2/get
  - https://push2delay.eastmoney.com/api/qt/stock/trends2/get
- 方法：GET
- 用途：获取分时或五日分时趋势数据
- 常用查询参数（示例）
  - secid: 市场+代码（如 0.000001 / 1.600000）
  - fields1, fields2: 返回字段组
  - iscr: 0
  - iscca: 0
  - ndays: 1 或 5
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `vr(secid, '分时'|'五日')`、`br(secid)`（ndays=1）
  - background/KlineChart.vue: 以 push2his 为域，动态拼接 path + query

### 3. K 线数据（日/周/月/分钟）
- URL
  - https://push2his.eastmoney.com/api/qt/stock/kline/get
- 方法：GET
- 用途：获取日K、周K、月K、5/15/30/60/120分钟等 K 线
- 常用查询参数（示例）
  - secid: 市场+代码
  - klt: 101(日K)/102(周K)/103(月K)/60/30/15/5/120（分钟）
  - fqt: 1
  - lmt: 返回数量（如 280/400/500）
  - end: YYYYMMDD
  - iscca: 1
  - fields1: f1,f2,f3,f4,f5
  - fields2: f51,f52,f53,f54,f55,f56,f57,f59
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `vr(secid, period)`
  - background/KlineChart.vue: 指向 push2his 域

### 4. 排行榜/板块/市场列表
- URL
  - https://push2delay.eastmoney.com/api/qt/clist/get
- 方法：GET
- 用途：按市场/条件获取列表（涨跌幅榜、换手、北美港等）
- 常用查询参数（示例）
  - pn, pz, po, np
  - fid: 排序字段（如 f3）
  - fs: 市场筛选（例：m:90+t:2 / m:90+t:3）
  - fields: f12,f14,f2,f3,f4,f25,f20,f13,f18,f6,f145,f100,f265,f266…
  - _: 时间戳
  - ut, fltt, invt
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `Ir(market)`, `Or(filter)`

---

## 东方财富 数据中心

### 5. ETF 列表（选择器）
- URL
  - https://datacenter.eastmoney.com/stock/etfselector/api/data/get
- 方法：GET
- 用途：拉取 ETF 全量与相关指标（用于 ETF 页面）
- 常用查询参数（示例）
  - type: RPTA_APP_ETFSELECT
  - sty: ETF_TYPE_CODE, DEAL_AMOUNT, SECUCODE, …（详见代码）
  - filter: (IS_SUPPORT%3D%221%22)
  - p, ps, st, sr, isIndexFilter, source, client
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `_r()`

---

## 东方财富 搜索

### 6. 证券搜索
- URL
  - https://searchapi.eastmoney.com/api/Info/Search
- 方法：GET
- 用途：根据关键词（名称/代码/拼音）搜索证券（用于添加自选）
- 常用查询参数（示例，已封装为 and14* 系列）
  - appid, type, token
  - and14: MultiMatch/Name,Code,PinYin/${keyword}/true
  - returnfields14: Name,Code,PinYin,MarketType,…,SecurityTypeName
  - pageIndex14, pageSize14
  - isAssociation14
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `wr(keyword)`

---

## 同花顺（10jqka）数据

### 7. 市场分析图表数据（分钟成交额/涨停等）
- URL
  - https://dq.10jqka.com.cn/fuyao/market_analysis_api/chart/v1/get_chart_data
- 方法：GET
- 用途：按 chart_key 获取不同维度图表数据
- 常用 chart_key
  - turnover_minute（分钟成交额）
  - limit_up_minute（涨停分时）
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `Cr()`, `Tr()`

### 8. 涨跌分布（实时）
- URL
  - https://dq.10jqka.com.cn/fuyao/up_down_distribution/distribution/v2/realtime
- 方法：GET
- 用途：获取市场涨跌家数、涨停/跌停家数等分布
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `Er()`

### 9. 热榜股票
- URL（带查询）
  - https://dq.10jqka.com.cn/fuyao/hot_list_data/out/hot_list/v1/stock?stock_type=a&type=${type}&list_type=normal
- 方法：GET
- 用途：不同时间维度（如 1 小时、24 小时）热榜
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `kr(type)`

---

## 大智慧（DZH）涨停温度

### 10. 涨停/跌停温度数据
- URL（带查询）
  - https://webrelease.dzh.com.cn/htmlweb/ztts/api.php?service=getZttdData&date=${YYYYMMDD}
- 方法：GET
- 用途：用于“市场温度”功能
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `Dr(date)`

---

## 自建/第三方服务（备用）

### 11. 股票列表（备用）
- URL
  - https://stock-list.deno.dev/
  - 带查询：`https://stock-list.deno.dev/?secids=${secids}`
- 方法：GET
- 用途：备用接口，通过 secids 获取股票列表信息
- 相关函数/文件
  - assets/subscribe-CfirD66p.js: `Sr(secids)`

---

## 其它/辅助说明

### A. 动态构造的 K 线/趋势请求
- 文件：background/KlineChart.vue
- 说明：该组件使用
  - `const domain = "https://push2his.eastmoney.com"`
  - `const url = \`${domain}${path}?${queryString}\``
  进行动态拼接并 `fetch(url)`；对应 path 与查询参数与上述“分时/五日趋势”、“K 线数据”一致。

### B. 域名与容灾策略
- 代码中定义了域名池（主域名 + 备用域名/代理）：
  - push2his: ["https://push2his.eastmoney.com", "https://push2his.deno.dev"]
  - push2delay: ["https://push2delay.eastmoney.com", "https://push2delay.deno.dev"]
  - searchapi: ["https://searchapi.eastmoney.com", "https://searchapi.deno.dev"]
- 请求封装 `Ie(providerKey, path, params, options)` 会按主备顺序尝试，主域名失败则切换至备用域名。部分场景支持 `devUrl` 覆盖（本地/调试）。

---

## 汇总表（快速检索）

- 东方财富
  - push2delay/push2：/api/qt/ulist.np/get（批量行情）
  - push2his/push2delay：/api/qt/stock/trends2/get（分时/五日）
  - push2his：/api/qt/stock/kline/get（K 线）
  - push2delay：/api/qt/clist/get（榜单/列表）
  - datacenter：/stock/etfselector/api/data/get（ETF 列表）
  - searchapi：/api/Info/Search（证券搜索）
- 同花顺（10jqka）
  - /fuyao/market_analysis_api/chart/v1/get_chart_data（turnover_minute / limit_up_minute）
  - /fuyao/up_down_distribution/distribution/v2/realtime（涨跌分布）
  - /fuyao/hot_list_data/out/hot_list/v1/stock（热榜）
- 大智慧（DZH）
  - /htmlweb/ztts/api.php?service=getZttdData&date=YYYYMMDD（市场温度）
- 自建/第三方
  - https://stock-list.deno.dev/ （备用股票列表）

---

## 备注
- 上述接口均为 GET 调用，参数在查询串中传递。
- 部分字段名（如 fields/fields1/fields2/klt 等）在不同函数中存在固定配置，可参考 assets/subscribe-CfirD66p.js 中各个方法的实现以获取完整字段清单。
- 如需新增接口，请在对应服务分组下新增条目并标注文件位置/用途，便于统一维护。
