# 项目 API 接口清单

本文档记录了项目中使用的所有API接口，分为自研接口和第三方接口。

## 自研接口

这些是项目自身的后端服务接口。

### 主机: `https://bm-com.com/`

- **POST** `/api/sigin`
  - 描述: 用户登录。
  - 文件: `2.0.0_0/js/login.js`

- **POST** `/api/emailRegist`
  - 描述: 邮箱注册验证码。
  - 文件: `2.0.0_0/js/login.js`

- **GET** `api/user`
  - 描述: 获取用户详情。
  - 文件: `2.0.0_0/js/login.js`

- **GET/POST** `/api/stock/getOptionalStock`
  - 描述: 获取/更新用户自选股。
  - 文件: `2.0.0_0/js/login.js`, `2.0.0_0/js/popup.js`

### 主机: `https://plug2025.bm-com.com`

- **POST** `/api/visitor/visitorRecord`
  - 描述: 记录访客信息。
  - 文件: `2.0.0_0/js/background.js`

- **POST** `/api/visitor/visitorInstall`
  - 描述: 记录插件安装。
  - 文件: `2.0.0_0/js/background.js`

## 第三方接口

这些是项目依赖的外部数据服务接口。

### Eastmoney (东方财富)

- `http://86.push2.eastmoney.com/api/qt/clist/get`
  - 描述: 获取股票列表。
  - 文件: `2.0.0_0/js/stockCom.js`

- `https://dcfm.eastmoney.com/em_mutisvcexpandinterface/api/js/get`
  - 描述: 获取可转债数据。
  - 文件: `2.0.0_0/js/stockCom.js`

### QQ Finance (腾讯财经)

- `https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get`
  - 描述: 获取K线数据。
  - 文件: `2.0.0_0/js/stockCom.js`, `2.0.0_0/js/newStockCom.js`

- `https://proxy.finance.qq.com/cgi/cgi-bin/smartbox/search`
  - 描述: 股票搜索建议。
  - 文件: `2.0.0_0/js/search.js`, `2.0.0_0/js/popup.js`

### GTIMG (腾讯行情)

- `https://data.gtimg.cn/flashdata/hushen/latest/daily/`
  - 描述: 获取日线数据。
  - 文件: `2.0.0_0/js/stockCom.js`

- `https://qt.gtimg.cn/`
  - 描述: 获取实时行情数据。
  - 文件: `2.0.0_0/js/stockCom.js`, `2.0.0_0/js/newStockCom.js`

- `https://web.ifzq.gtimg.cn/stock/relate/data/plate`
  - 描述: 获取板块数据。
  - 文件: `2.0.0_0/js/stockCom.js`

- `https://web.ifzq.gtimg.cn/appstock/app/.../query`
  - 描述: 获取分时图数据。
  - 文件: `2.0.0_0/js/stockCom.js`

- `https://stock.gtimg.cn/data/index.php`
  - 描述: 获取排行榜数据。
  - 文件: `2.0.0_0/js/popup.js`

### AliCloud (阿里云)

- `https://dingxin.market.alicloudapi.com/dx/sendSms`
  - 描述: 发送短信。
  - 文件: `2.0.0_0/js/stockCom.js`

### Sina Finance (新浪财经)

- `http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeDataSimple`
  - 描述: 获取行情节点数据。
  - 文件: `2.0.0_0/js/stockCom.js`
