# go-stock 外部接口调用清单（API Inventory）

最后更新：2026-03-03

本文档梳理了代码中出现的所有“通过程序发起的外部 HTTP 接口/页面调用”，按后端/前端分别罗列，并标注来源文件/函数、HTTP 方法、URL/URL 模板、以及必要的 Header 说明。部分为页面抓取类接口（HTML/图片），也一并记录。仅供排查依赖、统一配置、以及后续抽象出配置中心/代理/重试逻辑时参考。

说明：
- 方法（Method）根据调用链推断（resty 的 `.Get()`/`.Post()`），若代码中为字符串拼接再传入 `.Get(url)`，统一标为 GET。
- Header 多为伪造来源/UA，标注常见字段（Host/Origin/Referer/User-Agent）。
- 某些 URL 带时间戳/随机参数（如 `_=`、`rn=`），文档以模板展示。
- 包含测试文件中的接口调用，标注“[test]”。

建议后续：
- 将域名/路径集中到配置（env/settings）；
- 对请求增加统一的：超时/重试/退避、错误上报、代理开关；
- 对明文 HTTP 的接口（如部分 sina/gtimg）评估可替代或代理。

---

## 一、后端（Go）接口调用

### app.go
- GET https://api.github.com/repos/ArvinLovegood/go-stock/releases/latest  
  用途：获取最新 release 版本信息。  
  备注：日志有 TLS 握手超时风险。

- GET https://api.github.com/repos/ArvinLovegood/go-stock/git/ref/tags/{tag}  
  用途：校验 tag 引用。

- 下载地址模板（按平台选择，含直连与代理镜像）  
  - https://github.com/ArvinLovegood/go-stock/releases/download/{tag}/go-stock-windows-amd64.exe  
  - https://github.com/ArvinLovegood/go-stock/releases/download/{tag}/go-stock-darwin-universal  
  - https://gitproxy.click/https://github.com/ArvinLovegood/go-stock/releases/download/{tag}/go-stock-windows-amd64.exe  
  - https://gitproxy.click/https://github.com/ArvinLovegood/go-stock/releases/download/{tag}/go-stock-darwin-universal

- GET http://8.134.249.145:18080/go-stock/stock_basic.json  
- GET http://8.134.249.145:18080/go-stock/stock_base_info_hk.json  
- GET http://8.134.249.145:18080/go-stock/stock_base_info_us.json  
  用途：基础股票列表/信息同步（镜像存储）。

- GET http://go-stock.sparkmemory.top:16666/FinancialNews/json?since={unix}  
  用途：财联社/快讯同步（自建服务）。

- POST http://go-stock.sparkmemory.top:16688/upload  
  用途：分享分析结果（上传 HTML/图标等）。  
  Headers（示例）：Filename/Icon/Attach 自定义头。

- GET https://www.cls.cn/telegraph  
  Headers：  
  - Referer: https://www.cls.cn/  
  - User-Agent: Mozilla/5.0 ...  

方法映射：
- App.CheckUpdate/ShareAnalysis/refreshTelegraphList：上述 GitHub/自建服务/CLS 页面相关。
- App.SyncNews/SyncStockBasics：上述自建/镜像 JSON 拉取。

---

### backend/data/search_stock_api.go
- GET https://np-tjxg-g.eastmoney.com/api/smart-tag/stock/v3/pw/search-code  
  功能：东财 选股通-股票搜索  
  Headers：Host: np-tjxg-g.eastmoney.com / Origin+Referer: https://xuangu.eastmoney.com / UA: Firefox

- GET https://np-tjxg-b.eastmoney.com/api/smart-tag/bkc/v3/pw/search-code  
  功能：东财 选股通-板块搜索（SearchBk）  
  Headers：Host: np-tjxg-g.eastmoney.com / Origin+Referer: https://xuangu.eastmoney.com

- GET https://np-tjxg-b.eastmoney.com/api/smart-tag/etf/v3/pw/search-code  
  功能：东财 选股通-ETF 搜索  
  Headers 同上

- GET https://np-ipick.eastmoney.com/recommend/stock/heat/ranking?count=20&trace={unix}&client=web&biz=web_smart_tag  
  功能：东财 热门策略（HotStrategy）  
  Headers：Host: np-ipick.eastmoney.com / Origin+Referer: https://xuangu.eastmoney.com

- GET https://backtest.10jqka.com.cn/strategysquare/list?order=desc&page=1&pageNum=10&sortType=hot&keyword=  
  功能：同花顺策略广场（StrategySquare）  
  Headers：Host: backtest.10jqka.com.cn / Origin+Referer: https://backtest.10jqka.com.cn

方法映射：
- SearchStockApi.SearchCode -> stock/v3/pw/search-code  
- SearchStockApi.SearchBk -> bkc/v3/pw/search-code  
- SearchStockApi.SearchETF -> etf/v3/pw/search-code  
- SearchStockApi.HotStrategy -> recommend/stock/heat/ranking  
- SearchStockApi.StrategySquare -> strategysquare/list

---

### backend/data/openai_api.go（页面抓取/财务报告定位）
- BaseUrl: https://gushitong.baidu.com  
  路由（模板）：  
  - https://gushitong.baidu.com/stock/ab-{code}（A 股）  
  - https://gushitong.baidu.com/stock/hk-{code}（港股）  
  - https://gushitong.baidu.com/stock/us-{code}（美股）

- GET https://xueqiu.com/snowman/S/{code}/detail#/ZYCWZB  
  以及 BaseUrl: https://xueqiu.com

- GET https://emweb.securities.eastmoney.com/pc_hsf10/pages/index.html?type=web&code={code}#/cwfx（A股）  
- GET https://emweb.securities.eastmoney.com/PC_HKF10/pages/home/index.html?code={code}&type=web&color=w#/NewFinancialAnalysis（港股）  
- GET https://emweb.securities.eastmoney.com/pc_usf10/pages/index.html?type=web&code={code}#/cwfx（美股）  
  Headers：UA 为 Edge/Chrome。

- GET https://www.cls.cn/telegraph  
- GET https://www.cls.cn  
  Headers：Referer: https://www.cls.cn/ ...

方法映射：
- GetFinancialReports(stockCode, crawlTimeOut) -> emweb.securities.eastmoney.com（A/HK/US F10）  
- GetTelegraphList(crawlTimeOut) -> https://www.cls.cn/telegraph  
- GetTopNewsList(crawlTimeOut) -> https://www.cls.cn（首页）

---

### backend/data/market_news_api.go（新闻/榜单/指标/研报）
- GET https://www.cls.cn/nodeapi/telegraphList  
  Headers：Referer/UA（cls.cn）

- GET https://www.cls.cn/telegraph  
  Headers 同上

- GET https://zhibo.sina.com.cn/api/zhibo/feed?callback=callback&page=1&page_size=20&zhibo_id=152&tag_id=0&dire=f&dpc=1&pagesize=20&id=4161089&type=0&_=<unix>  
  Headers：Referer: https://finance.sina.com.cn

- GET https://proxy.finance.qq.com/ifzqgtimg/appstock/app/rank/indexRankDetail2  
  GET https://proxy.finance.qq.com/ifzqgtimg/appstock/app/mktHs/rank?l={cnt}&p=1&t=01/averatio&ordertype=&o={sort}  
  Headers：Referer: https://stockapp.finance.qq.com/

- GET https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/MoneyFlow.ssl_bkzj_bk?page=1&num=20&sort={sort}&asc=0&fenlei={fenlei}  
  GET https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/MoneyFlow.ssl_bkzj_ssggzj?page=1&num=20&sort={sort}&asc=0&bankuai=&shichang=  
  Headers：Host: vip.stock.finance.sina.com.cn / Referer: finance.sina.com.cn

- GET http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/MoneyFlow.ssl_qsfx_zjlrqs?page=1&num={days}&sort=opendate&asc=0&daima={stockCode}  
  Headers 同上（注意 http 明文）

- GET http://vip.stock.finance.sina.com.cn/q/go.php/vInvestConsult/kind/lhb/index.phtml?tradedate={date}  
  Headers 同上（http 明文）

- GET https://datacenter-web.eastmoney.com/api/data/v1/get  
  用途：龙虎榜/经济数据（GDP/CPI/PPI/PMI 等，带不同 query）  
  Headers：Host: datacenter-web.eastmoney.com / Referer: https://data.eastmoney.com / 或 https://data.eastmoney.com/cjsj/*.html

  经济指标模板（含 `_={unix}`）：  
  - GDP: ...reportName=RPT_ECONOMY_GDP...  
  - CPI: ...reportName=RPT_ECONOMY_CPI...  
  - PPI: ...reportName=RPT_ECONOMY_PPI...  
  - PMI: ...reportName=RPT_ECONOMY_PMI...

- GET https://reportapi.eastmoney.com/report/list  
- GET https://reportapi.eastmoney.com/report/list2  
- GET https://reportapi.eastmoney.com/report/bk  
  Headers：Host: reportapi.eastmoney.com / Origin: https://data.eastmoney.com / Referer: 对应 report 页面

- GET https://np-anotice-stock.eastmoney.com/api/security/ann?page_size=50&page_index=1&ann_type=SHA%2CCYB%2CSZA%2CBJA%2CINV&client_source=web&f_node=0&stock_list={codes}  
  Headers：Host: np-anotice-stock.eastmoney.com / Referer: https://data.eastmoney.com/notices/hsa/5.html

- 交易视图（TradingView）新闻流与详情  
  - GET https://news-mediator.tradingview.com/news-flow/v2/news?filter=lang%3Azh-Hans&client=screener&streaming=false  
    Headers：Host: news-mediator.tradingview.com / Origin+Referer: https://cn.tradingview.com  
  - GET https://news-headlines.tradingview.com/v3/story?id={url.QueryEscape(id)}&lang=zh-Hans  
    同域 Headers

- 雪球热点/话题  
  - GET https://xueqiu.com/hq#hot（引导页）  
  - GET https://stock.xueqiu.com/v5/stock/hot_stock/list.json?page=1&size={size}&_type={type}&type={type}  
    Headers：Host: stock.xueqiu.com / Origin+Referer: https://xueqiu.com  
  - GET https://xueqiu.com/hot_event/list.json?count={size}  
    Headers：xueqiu.com

- 东方财富话题  
  - GET https://gubatopic.eastmoney.com/interface/GetData.aspx?path=newtopic/api/Topic/HomePageListRead  
    Headers：Host: gubatopic.eastmoney.com / Origin+Referer: https://gubatopic.eastmoney.com

- 九言公社  
  - GET https://app.jiuyangongshe.com/jystock-app/api/v1/timeline/list  
    Headers：Host: app.jiuyangongshe.com / Origin: https://www.jiuyangongshe.com / Referer: https://www.jiuyangongshe.com/

- 财联社日历  
  - GET https://www.cls.cn/api/calendar/web/list?app=CailianpressWeb&flag=0&os=web&sv=8.4.6&type=0&sign=4b839750dc2f6b803d1c8ca00d2b40be  
    Headers：Host/Origin/Referer: www.cls.cn

- 互动易（问答）  
  - GET https://irm.cninfo.com.cn/newircs/index/search?_t={unix}  
    Headers：Host/Origin/Referer: irm.cninfo.com.cn（views/interactiveAnswer）

- 财联社接口（POST）  
  - POST https://www.cls.cn/api/csw?app=CailianpressWeb&os=web&sv=8.4.6&sign=9f8797a1f4de66c2370f7a03990d2737  
    Headers：Referer: https://www.cls.cn/telegraph

- 路透新闻（Reuters）  
  - GET https://www.reuters.com/pf/api/v3/content/fetch/recent-stories-by-sections-v1?...  
    Headers：Host/Origin/Referer: www.reuters.com

方法映射（部分）：
- MarketNewsApi.TelegraphList / GetNewTelegraph -> CLS telegraph/nodeapi  
- MarketNewsApi.GetIndustryMoneyRankSina -> vip.stock.finance.sina.com.cn MoneyFlow.*  
- MarketNewsApi.TopStocksRankingList -> vip.stock.finance.sina.com.cn lhb index  
- MarketNewsApi.TradingViewNews -> news-mediator.tradingview.com  
- MarketNewsApi.TradingViewNewsDetail(id) -> news-headlines.tradingview.com  
- MarketNewsApi.XueQiuHot(size/type) -> stock.xueqiu.com 热股列表 / xueqiu.com hot_event  
- MarketNewsApi.HotTopic(size) -> gubatopic.eastmoney.com  
- MarketNewsApi.ClsCalendar() -> www.cls.cn/api/calendar/web/list  
- MarketNewsApi.EconomicData*（GDP/CPI/PPI/PMI） -> datacenter-web.eastmoney.com（不同 reportName）  
- MarketNewsApi.IndustryResearchReport/List -> reportapi.eastmoney.com  
- MarketNewsApi.StockNotice(stock_list) -> np-anotice-stock.eastmoney.com

---

### backend/data/stock_data_api.go（行情/K线/资金流/主题/持有人等）
常量：
- sinaStockUrl（http）: http://hq.sinajs.cn/rn={int}&list={codes}  
- txStockUrl（http）: http://qt.gtimg.cn/?_={int}&q={codes}  
- tushareApiUrl（http）: http://api.tushare.pro

通用 Headers 示例：  
- Host: qt.gtimg.cn / Referer: https://gu.qq.com/ / UA: Edge  
- Host: hq.sinajs.cn / Referer: https://finance.sina.com.cn/ / UA: Edge

页面抓取（价格/名称等）：
- GET https://quote.eastmoney.com/{code}.html（选择器：div.zxj 等）
- GET https://stock.finance.sina.com.cn/usstock/quotes/{code}.html（选择器：div#hqPrice）
- GET https://stock.finance.sina.com.cn/hkstock/quotes/{code}.html
- GET https://finance.sina.com.cn/realstock/company/{stockCode}/nc.shtml（指数/沪深）

分钟/K线：
- GET https://web.ifzq.gtimg.cn/appstock/app/minute/query?code={stockCode}（A股/HK）  
- GET https://web.ifzq.gtimg.cn/appstock/app/UsMinute/query?code={stockCode}（美股）  
- GET http://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData?symbol={stock}&scale={kLineType}&ma=yes&datalen={days}（A股 K 线）  
- GET https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={stockCode},{kLineType},,,{days},qfq（复权 K 线）

板块/列表/资金：
- GET https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHKStockData?page={}&num={}&sort=symbol&asc=1&node=qbgg_hk&_s_r_a=init（港股列表，含代理示例）  
- GET https://push2.eastmoney.com/api/qt/clist/get?np=1&fltt=1&invt=2&cb=data&fs={fs}&fields=f12,f13,...&fid=f3&pn={page}&pz={pageSize}&po=1&dect=1&wbp2u=|0|0|0|web&_={milli}  
  Headers：Host: push2.eastmoney.com / Referer: https://quote.eastmoney.com/center/gridlist.html

- GET https://stock.gtimg.cn/data/hk_rank.php?board=main_all&metric=price&pageSize={}&reqPage={}&order=desc&var_name=list_data（港股排名，多页拉取）

- GET https://push2his.eastmoney.com/api/qt/stock/fflow/daykline/get?cb=data&lmt=0&klt=101&fields1=f1%2Cf2...&fields2=f51...&ut=b2884a...&secid={stockCode}&_={unix}（单股资金流）

主题/财务/F10 等（东财数据中心）：
- GET https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_CORETHEME_BOARDTYPE&columns=...&filter=(SECUCODE%3D%22{stockCode}%22)(IS_PRECISE%3D%221%22)&pageNumber=1&pageSize=&sortTypes=1&sortColumns=BOARD_RANK&source=HSF10&client=PC&v={unix}  
  Headers：Host: datacenter.eastmoney.com / Referer+Origin: https://emweb.securities.eastmoney.com

- GET https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_FINANCE_DUPONT&columns=...&filter=(SECUCODE%3D%22{stockCode}%22)&pageNumber=1&pageSize=12&sortTypes=-1&sortColumns=REPORT_DATE&source=HSF10&client=PC&v={unix}  
- GET https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_EH_HOLDERNUM&columns=...&filter=(SECUCODE%3D%22{stockCode}%22)&pageNumber=1&pageSize=12&sortTypes=-1&sortColumns=END_DATE&source=HSF10&client=PC&v={nano}

搜索/资讯聚合（片段示例）：
- GET https://www.cls.cn/searchPage?keyword={stock}&type={msgType}（财联社搜索）  
- GET https://gushitong.baidu.com/stock/ab-{code}（百度股市通）

方法映射（部分）：
- StockDataApi.GetKLineData(stockCode, kLineType, days) -> quotes.sina.cn / web.ifzq.gtimg.cn  
- StockDataApi.GetHKStockInfo(pageSize) -> stock.gtimg.cn 港股列表  
- StockDataApi.GetMinuteData(stockCode) -> web.ifzq.gtimg.cn minute/query（A/HK/US 根据 code 前缀）  
- StockDataApi.CrawlUS/HK/SHSZ价格信息 -> stock.finance.sina.com.cn / quote.eastmoney.com（页面抓取）  
- StockDataApi.GetZSInfo / getSHSZStockPriceInfo -> finance.sina.com.cn realstock  
- StockDataApi.GetThemeBoardType / GetFinanceDupont / GetHolderNum -> datacenter.eastmoney.com securities/api/...  
- StockDataApi.GetMoneyDataByDay(stockCode) -> push2his.eastmoney.com daykline ffow  
- StockDataApi.GetTopMoneyStocks() -> push2.eastmoney.com clist fid=f62（资金榜单）

---

### backend/data/fund_data_api.go（基金）
- BaseUrl: http://fund.eastmoney.com（页面抓取）  
- GET https://fund.eastmoney.com/allfund.html  
- GET https://fundgz.1234567.com.cn/js/{code}.js（基金净值 JS）  
- GET http://hq.sinajs.cn/rn={milli}&list=f_{code}（Sina 基金快照，http）  
  Headers：Referer: https://finance.sina.com.cn

方法映射（部分）：
- FundDataApi.GetAllFunds() -> fund.eastmoney.com/allfund.html  
- FundDataApi.GetFundNetUnitValue(code) -> fundgz.1234567.com.cn/js/{code}.js / hq.sinajs.cn 快照

---

### backend/data/market_news_api_test.go（[test]）
- 代理示例：SetProxy("http://go-stock:...@stock.sparkmemory.top:8888")  
- GET https://news-mediator.tradingview.com/news-flow/v2/news?filter=lang%3Azh-Hans&client=screener&streaming=false&user_prostatus=non_pro  
- 注释示例（文件名/附件上传到 go-stock.sparkmemory.top:16667）

---

### backend/data/crawler_api_test.go（[test]，多页面）
示例（仅列举部分）：
- https://www.cls.cn/searchPage?type=depth&keyword=...  
- https://gushitong.baidu.com/stock/ab-600745  
- https://stock.finance.sina.com.cn/hkstock/quotes/{code}.html  
- https://stock.finance.sina.com.cn/usstock/quotes/{code}.html  
- https://quote.eastmoney.com/us/{code}.html  
- https://finance.sina.com.cn/stock/usstock/sector.shtml#cm  
- https://finance.sina.com.cn/realstock/company/sz002906/nc.shtml  
- https://emweb.securities.eastmoney.com/pc_hsf10/pages/index.html?type=web&code=sh600745#/cwfx

---

### backend/data/pool_test.go（[test]）
- https://fund.eastmoney.com/016533.html  
- https://fund.eastmoney.com/217021.html  
- https://fund.eastmoney.com/001125.html

---

### backend/data/dingding_api_test.go（[test]）
- https://img.alicdn.com/tfs/TB1NwmBEL9TBuNjy1zbXXXpepXa-2400-1218.png（图片）  
- https://www.dingtalk.com（文本中的链接）

---

## 二、前端（Vue）外链/嵌入/图片资源

说明：前端未检出 fetch/axios 程序化请求，主要是 BrowserOpenURL/EmbeddedUrl 等外链打开或图片展示，亦列出以便域名白名单/代理统一配置。

### frontend/src/components/SelectStock.vue
- 打开：https://quote.eastmoney.com/{MARKET_SHORT_NAME}{SECURITY_CODE}.html#fullScreenChart

### frontend/src/components/stock.vue
- 打开（例）：  
  - https://www.iwencai.com/unifiedwap/result?w={name}  
- 图片（Sina 行情图，http 明文）：  
  - 分时：http://image.sinajs.cn/newchart/min/n/{code}.gif  
  - 分时（港）：http://image.sinajs.cn/newchart/hk_stock/min/{code_no_hk}.gif  
  - 分时（美）：http://image.sinajs.cn/newchart/usstock/min/{code_no_gb}.gif  
  - 日K：http://image.sinajs.cn/newchart/daily/n/{code}.gif  
  - 日K（港）：http://image.sinajs.cn/newchart/hk_stock/daily/{code_no_hk}.gif  
  - 日K（美）：http://image.sinajs.cn/newchart/usstock/daily/{code_no_gb}.gif

### frontend/src/components/fund.vue
- 打开：https://fund.eastmoney.com/{code}.html  
- 打开（注释示例）：https://finance.sina.com.cn/fund/quotes/{code}/bc.shtml  
- 图片：https://image.sinajs.cn/newchart/v5/fund/nav/ss/{code}.gif

### frontend/src/components/stockhotmap.vue（嵌入）
- https://xuangutong.com.cn  
- https://gushitong.baidu.com  
- https://quote.eastmoney.com/stockhotmap/  
- https://tophub.today/c/finance  
- https://996.ninja/  
- https://www.cls.cn/quotation  
- https://go-stock.sparkmemory.top:16667/go-stock

### frontend/src/components/HotTopics.vue
- 打开：https://gubatopic.eastmoney.com/topic_v3.html?htid={htid}

### frontend/src/components/StockResearchReportList.vue
- 打开 PDF：https://pdf.dfcfw.com/pdf/H3_{code}_1.pdf?{ts}.pdf

### frontend/src/components/StockNoticeList.vue
- 打开 PDF：https://pdf.dfcfw.com/pdf/H2_{code}_1.pdf?{ts}.pdf

### frontend/src/components/about.vue / agent-chat.vue / agent-chat_bk.vue / market.vue
- 图标/图片/链接：  
  - https://raw.githubusercontent.com/ArvinLovegood/go-stock/master/build/appicon.png  
  - https://github.com/ArvinLovegood/go-stock/raw/master/build/screenshot/alipay.jpg  
  - https://github.com/ArvinLovegood/go-stock/raw/master/build/screenshot/wxpay.jpg  
  - https://github.com/ArvinLovegood/go-stock/raw/dev/build/screenshot/%E6%89%AB%E7%A0%81_%E6%90%9C%E7%B4%A2%E8%81%94%E5%90%88%E4%BC%A0%E6%92%AD%E6%A0%B7%E5%BC%8F-%E7%99%BD%E8%89%B2%E7%89%88.png  
  - https://github.com/ArvinLovegood（作者/项目链接）  
  - https://go-stock.sparkmemory.top/（社区）  
  - https://avatars.githubusercontent.com/u/7401917?v=4  
  - 头像示例：https://tdesign.gtimg.com/site/avatar.jpg

### frontend/src/components/IndustryResearchReportList.vue
- 打开 PDF：与 StockResearchReportList 同模版（H3_{code}_1.pdf）

### frontend/src/components/StockNoticeList.vue / StockResearchReportList.vue
- 同域：pdf.dfcfw.com（东方财富 PDF 分发）

### frontend/src/components/settings.vue（配置项，非调用）
- httpProxy: http://127.0.0.1:7890  
- baseUrl（AI 服务示例默认）：https://api.deepseek.com

---

## 三、域名汇总（便于白名单/代理/证书管理）

- api.github.com（GitHub API）
- github.com / raw.githubusercontent.com（下载/图片）
- gitproxy.click（代理镜像）
- go-stock.sparkmemory.top（自建服务 16666/16667/16688）
- 8.134.249.145（静态 JSON）
- www.cls.cn（财联社）
- zhibo.sina.com.cn / finance.sina.com.cn / vip.stock.finance.sina.com.cn / image.sinajs.cn / hq.sinajs.cn / stock.finance.sina.com.cn（新浪）
- np-tjxg-*.eastmoney.com / np-ipick.eastmoney.com / datacenter-web.eastmoney.com / datacenter.eastmoney.com / reportapi.eastmoney.com / push2.eastmoney.com / push2his.eastmoney.com / quote.eastmoney.com / gubatopic.eastmoney.com / pdf.dfcfw.com（东方财富）
- qt.gtimg.cn / web.ifzq.gtimg.cn / proxy.finance.qq.com / stock.gtimg.cn（腾讯）
- xueqiu.com / stock.xueqiu.com（雪球）
- emweb.securities.eastmoney.com（东财 F10 页面）
- gushitong.baidu.com（百度股市通）
- news-mediator.tradingview.com / news-headlines.tradingview.com / cn.tradingview.com（TradingView）
- www.reuters.com（路透）
- irm.cninfo.com.cn（互动易）
- app.jiuyangongshe.com / www.jiuyangongshe.com（九言公社）
- iwencai.com（i问财）
- np-anotice-stock.eastmoney.com（公告）
- tophub.today / 996.ninja（嵌入页面）

---

## 四、上下游关系与前端调用链参考（Wails）

- Wails 会为后端导出方法自动生成前端绑定（frontend/wailsjs/go/main/App.js / App.d.ts；models.ts）。
- 前端通过 import { MethodName } from '../../wailsjs/go/main/App' 调用后端方法，或订阅事件（frontend/wailsjs/runtime 的 EventsOn/EventsOff/EventsEmit）。
- 典型组件方法导入与事件：
  - market.vue：ChatWithAgent、GetAiConfigs、GetConfig、GetSponsorInfo、GetVersionInfo；订阅 newTelegraph/newSinaNews/tradingViewNews/summaryStockNews。
  - settings.vue：UpdateConfig、GetConfig；事件 updateSettings、frontendError。
  - KLineChart.vue：GetStockKLine（对应 StockDataApi/GetKLineData 外部接口链路）。
  - StockNoticeList.vue / StockResearchReportList.vue / IndustryResearchReportList.vue：GetStockList、StockNotice、StockResearchReport、IndustryResearchReport 等（对应东方财富公告/研报接口）。
- 详情参考 docs/frontend-backend-calls.md。

---

## 五、备注与后续改进建议

1. 明文 HTTP（sina/gtimg 等）建议通过代理转发或替换为 HTTPS 能力（如有官方 HTTPS），降低被劫持/超时风险。  
2. 统一 resty 客户端配置：超时（连接/读）、重试（指数退避）、错误上报、代理开关、全局 UA。  
3. 将域名与路径集中到 settings（后端）与前端配置；便于切换镜像/代理、开关某些来源。  
4. 为 TradingView、雪球、东财等接口设置合理速率限制与降级策略；日志里有多处超时。  
5. 对抓取类接口（HTML）可考虑缓存或离线数据落库，减轻实时依赖。
