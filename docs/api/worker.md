# 项目接口清单（自动整理）

本文件汇总了项目代码中实际使用到的外部接口（HTTP API），包含调用路径、参数、请求头、用途说明以及对应的代码位置，便于排查与维护。

说明：
- 仅收录代码中“实际调用”的接口（fetch/SDK 等）。未在代码中出现的接口不会包含。
- 组件开发环境通过 Vite 代理将以 “/api/...” 开头的请求转发至东方财富主机，生产环境直接拼接完整主机地址，详见下方「开发代理与生产地址」部分。
- Notion 接口通过官方 SDK 调用，未在代码中直接出现具体 HTTP 路径，文档中标注为「通过 SDK 调用」。

---

## 目录
- 东方财富（Eastmoney）
  - /api/qt/stock/kline/get
  - /api/qt/stock/trends2/get
  - /api/qt/stock/trends/get
- 新浪 OpenAPI
  - CN_MarketDataService.getKLineData
- xgpiao 文本数据源
  - genes_buy.txt
  - power_YYYYMMDD.txt
- Notion API（通过 SDK）
  - databases.query
  - pages.update
  - pages.create
- GitHub 原始文件通用获取（工具方法）
- 开发代理与生产地址

---

## 东方财富（Eastmoney）

主机：
- https://push2his.eastmoney.com
- 部分请求需要 Referer: https://quote.eastmoney.com

通用请求头（在不同处可见，示例）：
- User-Agent: DEFAULT_UA（见 packages/worker/src/utils/http.js）
- Referer: https://quote.eastmoney.com
- Accept: application/json, text/plain, */*

### 1) K 线数据
- URL: https://push2his.eastmoney.com/api/qt/stock/kline/get
- 方法: GET
- 常见参数（由调用端构造）：
  - secid: 证券 ID（形如 “1.600000” 或 “0.000001”，6 开头为 1.，其余为 0.）
  - klt: 周期（项目中见到：101=日K，其他分钟/周/月在组件端根据中文类型映射）
  - fqt: 复权标记（1）
  - end: 截止日期（YYYYMMDD）
  - lmt: 返回条数上限（依据周期设置 280/400/500 等）
  - fields1: 字段选择（如 f1,f2,f3,f4,f5 或 f1,f2,f3,f4,f5,f6）
  - fields2: 字段选择（如 f51,f52,f53,f54,f55,f56,f57,f59 等）
  - 组件端附加：iscca=1、ut='f057cbcbce2a86e2866ab8877db1d059'、forcect=1
- 用途: 拉取单个证券的 K 线历史数据
- 代码位置：
  - packages/worker/src/fetchers/eastmoney.js（服务端/脚本端数据源）
  - packages/components/src/api/kline.js（前端组件 API）

### 2) 分时/五日趋势图（当日/五日）
- URL: https://push2his.eastmoney.com/api/qt/stock/trends2/get
- 方法: GET
- 参数：
  - secid
  - fields1: 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13,f14'（五日时追加 ',f17'）
  - fields2: 'f51,f53,f56,f58'
  - iscr: 0
  - iscca: 0
  - ndays: 1（分时）或 5（五日）
- 用途: 获取单个证券当天或五日的分时趋势数据
- 代码位置：
  - packages/components/src/api/kline.js

### 3) 历史某日分时
- URL: https://push2his.eastmoney.com/api/qt/stock/trends/get
- 方法: GET
- 参数：
  - secid
  - fields1: 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13'
  - fields2: 'f51,f52,f53,f54,f55,f56,f57,f58'
  - iscr: 0
  - iscca: 0
  - ut: 'fa5fd1943c7b386f172d6893dbfba10b'
  - date: 历史日期（YYYYMMDD）
- 用途: 获取历史某日的分时数据
- 代码位置：
  - packages/components/src/api/kline.js

---

## 新浪 OpenAPI

主机：
- https://quotes.sina.cn
- 需要 Referer: https://finance.sina.com.cn

接口：
- 路径与说明：/cn/api/openapi.php/CN_MarketDataService.getKLineData
- 方法: GET
- 参数：
  - symbol: 标的（sh|sz|bj + 6 位代码，例如 sh600519）
  - scale: 240（表示日维度）
  - datalen: 返回的数据条数
- 请求头（示例）：
  - User-Agent: DEFAULT_UA
  - Referer: https://finance.sina.com.cn
  - Accept: application/json, text/plain, */*
- 返回结构：项目中做了多种返回结构兼容，最终映射为数组元素 { day, open, close, high, low }
- 用途: 拉取单个证券的 K 线数据（作为 Eastmoney 的备选数据源）
- 代码位置：
  - packages/worker/src/fetchers/sina-openapi.js

---

## xgpiao 文本数据源

主机：
- http://xgpiao.net

接口（静态文本资源）：
1) 买点列表
- URL: http://xgpiao.net/mystock/const/hisdata/sortdata/genes_buy.txt
- 方法: GET
- 用途: 拉取买点数据文本，结合强榜数据做交集计算
- 代码位置：
  - packages/worker/src/index.js
  - packages/worker/src/sync2notion.js（通过带超时重试的 fetchWithTimeout 调用）

2) 强资金/强榜（按日）
- URL 模板: http://xgpiao.net/mystock/const/hisdata/sortdata/ghosthisdata/power_{YYYYMMDD}.txt
- 方法: GET
- 用途: 拉取某日期的强榜文本数据，与买点列表求交集
- 代码位置：
  - packages/worker/src/index.js
  - packages/worker/src/sync2notion.js（通过带超时重试的 fetchWithTimeout 调用）

---

## Notion API（通过官方 SDK 调用）

- 使用库: @notionhq/client
- 认证: NOTION_TOKEN（环境变量）
- 关联数据库: NOTION_DATABASE_ID（环境变量）
- 实际 HTTP 端点：由 SDK 封装，底层指向 Notion 公共 API（一般为 https://api.notion.com/v1/...），代码中未直接拼接 URL
- 涉及的操作：
  - notion.databases.query（分页查询，含过滤、start_cursor、page_size 等）
  - notion.pages.update（按 page_id 更新属性）
  - notion.pages.create（向指定数据库写入页面）
- 调用位置：
  - packages/worker/src/stock2price.js（可选：当 USE_NOTION=true 时更新页面价格）
  - packages/worker/src/sync2notion.js（批量 upsert 交集结果）
- 可靠性措施：
  - 自定义 withRetry 与 fetchWithTimeout（sync2notion.js）用于重试/超时控制

---

## GitHub 原始文件通用获取（工具方法）

- 方法：getGitHubFile(rawUrl)
- 行为：对传入的原始 URL 执行 fetch 并返回文本内容；若失败，抛出包含状态码与部分响应体片段的错误
- 代码位置：
  - packages/worker/src/utils/github-file.js
- 备注：这是通用工具函数，是否访问 GitHub 取决于传入的 rawUrl。当前仓库中未检测到固定的 GitHub 原始链接常量调用点。

---

## 开发代理与生产地址

- 组件库（packages/components）使用 Vite 开发服务器：
  - 开发环境：将以「/api」前缀的请求代理到 https://push2his.eastmoney.com
  - 生产环境：通过 define 注入 import.meta.env.VITE_API_TARGET='https://push2his.eastmoney.com'，前端以 `${baseUrl}${path}?query` 拼接完整 URL
- 配置位置：
  - packages/components/vite.config.js
- 前端实际请求路径（由 packages/components/src/api/kline.js 构造）：
  - /api/qt/stock/kline/get
  - /api/qt/stock/trends2/get
  - /api/qt/stock/trends/get

---

## 附：调用分布快速索引

- packages/worker/src/index.js
  - http://xgpiao.net/mystock/const/hisdata/sortdata/genes_buy.txt
  - http://xgpiao.net/mystock/const/hisdata/sortdata/ghosthisdata/power_{YYYYMMDD}.txt
- packages/worker/src/fetchers/eastmoney.js
  - https://push2his.eastmoney.com/api/qt/stock/kline/get
- packages/worker/src/fetchers/sina-openapi.js
  - https://quotes.sina.cn/cn/api/openapi.php/CN_MarketDataService.getKLineData
- packages/worker/src/sync2notion.js
  - http://xgpiao.net/.../genes_buy.txt
  - http://xgpiao.net/.../power_{YYYYMMDD}.txt
  - Notion API（SDK：databases.query / pages.update / pages.create）
- packages/worker/src/stock2price.js
  - Notion API（SDK，可选开启）
  - 数据源通过 fetchers（eastmoney/sina）间接访问
- packages/components/src/api/kline.js
  - /api/qt/stock/kline/get（Eastmoney）
  - /api/qt/stock/trends2/get（Eastmoney）
  - /api/qt/stock/trends/get（Eastmoney）
- packages/chrome/*
  - 未直接发起外网请求；stock 页面加载组件后间接使用上述组件 API

---

若需扩充/更新本清单，可按如下流程快速复核：
1) 全局搜索 fetch(、new Request(、axios.*、以及以 http(s):// 开头的字符串常量。
2) 关注通用工具与 SDK 封装层（如 Notion SDK、fetch 包装器）。
3) 将新发现的端点补充到本文件相应分组中，并注明参数与调用位置。
