# src/hooks/api 接口文档

本目录下包含前端对后端数据的获取 Hook（基于 getJSON 和 useFetchWithFallback 实现）。本文档梳理每个接口的用途、请求路径与方法、入参/出参说明、响应校验要点与回退机制，便于对接真实后端或联调。

接口总览
- GET /ai/analysis — AI 智能分析
- GET /checklist/steps — 复盘 Checklist 步骤
- GET /emotion/phases — 情绪周期阶段列表
- GET /four-dimension/summary — 四维选股系统综合分析
- GET /ladder/levels — 连板天梯数据
- GET /market/summary — 市场概览数据
- GET /risk/rules — 风险控制规则
- GET /strategies — 买/卖策略数据

通用说明
- HTTP 客户端：src/services/http.ts
  - Base URL：由环境变量 VITE_API_BASE 决定；最终请求 URL = `${VITE_API_BASE}/${path}`（自动去重斜杠）。若未配置 VITE_API_BASE，则直接使用传入的相对/绝对 path。
  - 超时机制：默认 VITE_API_TIMEOUT 或 8000ms，超时将中止请求并抛出 ApiError。
  - JSON 请求辅助：getJSON/postJSON/putJSON/deleteJSON。当前所有 Hook 使用 GET。
- 通用 Hook：src/hooks/use-fetch-with-fallback.ts
  - UseFetchOptions<T>
    - immediate?: boolean = true，是否在挂载时自动拉取
    - deps?: unknown[]，依赖项变更时重新拉取
    - validate?: (data: T) => boolean，校验失败则使用 fallback
  - UseFetchResult<T>
    - data: T | undefined
    - isLoading: boolean
    - isError: boolean（网络或服务端错误时为 true）
    - isFallback: boolean（使用回退数据时为 true）
    - refetch: () => Promise<void>，手动重试
- 回退机制：当网络错误或 validate 失败时，返回本地 mock 数据并标记 isFallback=true。各 Hook 的回退数据来源见下文。
- 切换真实后端的方式：
  - 直接将各 Hook 中的路径由如 '/ai/analysis' 改为真实网关前缀，如 '/api/ai/analysis'；或在 .env 中设置 VITE_API_BASE='https://api.example.com'，保留相对 path。
  - 视后端实际返回结构，调整各 Hook 内的 validate 逻辑。

使用示例（以 AI 分析为例）
```ts
const { data, isLoading, isError, isFallback, refetch } = useAIAnalysis();
```
- data 即为类型化响应；若 isFallback=true 说明当前数据来源于本地 mock。
- 通过 refetch 可在用户交互时手动重新拉取。

---

## 1) AI 智能分析
- Hook 文件：src/hooks/api/useAIAnalysis.ts
- 请求方法/路径：GET /ai/analysis
- 用途：获取 AI 对当前市场/个股的分析结论与建议。
- 入参（请求体/查询）：无（仅支持 UseFetchOptions 作为 Hook 选项）。
- 出参类型：AIAnalysis（src/types/index.ts）
  - 字段
    - status: 'analyzing' | 'completed' | 'error'
    - emotionPhase: EmotionPhase（'ice' | 'recovery' | 'ferment' | 'peak' | 'diverge' | 'decline'）
    - emotionDay: number
    - recommendedThemes: string[]
    - targetStock: { name: string; code: string; boards: number; type: string }
    - suggestion: string
    - confidence: number
- 响应校验要点（validate）：
  - status 为上述枚举之一；emotionPhase 为字符串；emotionDay 为 number；
  - recommendedThemes 为字符串数组；
  - targetStock 各字段类型正确；suggestion 为 string；confidence 为 number。
- 回退数据来源：mockAIAnalysis（src/data/strategyData.ts）

---

## 2) 复盘 Checklist 步骤
- Hook 文件：src/hooks/api/useChecklist.ts
- 请求方法/路径：GET /checklist/steps
- 用途：获取复盘流程的步骤与条目列表。
- 入参：无。
- 出参类型：ChecklistStep[]（src/types/index.ts）
  - ChecklistStep
    - id: number
    - title: string
    - duration: string
    - items: ChecklistItem[]
  - ChecklistItem
    - id: string
    - title: string
    - completed: boolean
- 响应校验要点（validate）：
  - 顶层为数组；每个 step 的 id/title/duration 类型正确；
  - items 为数组且每条目的 id/title/completed 类型正确。
- 回退数据来源：checklistSteps（src/data/strategyData.ts）

---

## 3) 情绪周期阶段列表 `MOCK即可`
- Hook 文件：src/hooks/api/useEmotionPhases.ts
- 请求方法/路径：GET /emotion/phases
- 用途：获取冰点/复苏/发酵/高潮/分歧/退潮等阶段的定义与策略建议。
- 入参：无。
- 出参类型：EmotionPhaseData[]（src/types/index.ts）
  - EmotionPhaseData
    - id: EmotionPhase
    - name: string
    - color: string
    - bgColor: string
    - features: string
    - strategy: string
    - position: string
- 响应校验要点（validate）：
  - 顶层为非空数组；各字段类型匹配。
- 回退数据来源：emotionPhases（src/data/strategyData.ts）

---

## 4) 四维选股系统综合分析
- Hook 文件：src/hooks/api/useFourDimensionData.ts
- 请求方法/路径：GET /four-dimension/summary
- 用途：获取主题、选手气质、技术形态、资金验证的打分与综合结论。
- 入参：无。
- 出参类型：FourDimensionAnalysis（src/types/index.ts）
  - theme: ThemeAnalysis
    - score: number
    - mainTheme: string
    - limitUpCount: number
    - ladderStructure: string
    - midCapStarted: boolean
  - character: StockCharacter
    - score: number
    - yearlyLimitUpCount: number
    - maxConsecutiveBoards: number
    - repairRate: number
    - avgPremium: number
    - marketCap: string
  - technical: TechnicalSignal
    - score: number
    - sealRatio: number
    - sealTime: string
    - turnoverRate: number
    - pattern: string
  - fund: FundVerification
    - score: number
    - dragonTigerList: string
    - institutionNetBuy: number
    - seatQuality: string
    - relayExpectation: string
  - totalScore: number
- 响应校验要点（validate）：
  - 四个维度各字段类型正确；totalScore 为 number。
- 回退数据来源：mockFourDimensionData（src/data/strategyData.ts）

---

## 5) 连板天梯数据
- Hook 文件：src/hooks/api/useLadderData.ts
- 请求方法/路径：GET /ladder/levels
- 用途：获取各连板层级及其包含的个股列表。
- 入参：无。
- 出参类型：LadderLevel[]（src/types/index.ts）
  - LadderLevel
    - level: number
    - stocks: LadderStock[]
  - LadderStock
    - code: string
    - name: string
    - boards: number
    - theme: string
    - change: number
    - volume: number
- 响应校验要点（validate）：
  - 顶层为数组；每个 level 为 number；
  - stocks 为数组且各字段类型正确。
- 回退数据来源：mockLadderData（src/data/strategyData.ts）

---

## 6) 市场概览数据
- Hook 文件：src/hooks/api/useMarketData.ts
- 请求方法/路径：GET /market/summary
- 用途：获取市场热度与溢价等核心指标（可通过 VITE_API_BASE 配置网关前缀）。
- 入参：无。
- 出参类型：MarketData（src/types/index.ts）
  - limitUpCount: number
  - limitDownCount: number
  - brokenBoardRate: number
  - premiumRate: number
  - advanceRate1to2: number
  - advanceRate2to3: number
  - maxHeight: number
- 响应校验要点（validate）：
  - 上述所有字段均为 number。
- 回退数据来源：mockMarketData（src/data/strategyData.ts）

---

## 7) 风险控制规则 `MOCK即可`
- Hook 文件：src/hooks/api/useRiskRules.ts
- 请求方法/路径：GET /risk/rules
- 用途：获取当前启用的风险控制项与触发状态。
- 入参：无。
- 出参类型：RiskRule[]（src/types/index.ts）
  - id: string
  - title: string
  - enabled: boolean
  - triggered: boolean
- 响应校验要点（validate）：
  - 顶层为数组；各字段类型正确。
- 回退数据来源：riskRules（src/data/strategyData.ts）

---

## 8) 买/卖策略数据
- Hook 文件：src/hooks/api/useStrategies.ts
- 请求方法/路径：GET /strategies
- 用途：获取买入/卖出策略集合。
- 入参：无。
- 出参类型：StrategiesData（在 useStrategies.ts 内声明）
  - buy: BuyStrategy[]
  - sell: SellStrategy[]
- BuyStrategy（src/types/index.ts）
  - level: 1 | 2 | 3
  - name: string
  - scenario: string
  - conditions: string[]
  - operation: string
  - position: string
  - status: 'pending' | 'executable' | 'executed' | 'expired'
- SellStrategy（src/types/index.ts）
  - level: 1 | 2 | 3
  - name: string
  - conditions: string[]
  - operation: string
  - status: 'pending' | 'triggered' | 'executed'
- 响应校验要点（validate）：
  - 当前实现仅校验 level、name、operation、conditions 四项是否满足要求（其余字段为可选校验，若真实后端返回包含 scenario/position/status，建议补充校验）。
- 回退数据来源：buyStrategies / sellStrategies（src/data/strategyData.ts，组装为 fallback）

## 错误处理与状态位
- 网络/服务端错误：抛出 ApiError（见 src/services/http.ts），Hook 捕获后返回 fallback，isError=true，isFallback=true。
- 校验失败：validate(...) 返回 false 时不视为硬错误，isError=false，isFallback=true，便于前端继续渲染。
- 超时：由 VITE_API_TIMEOUT 控制；超时将触发 AbortController，抛出 ApiError（status=0，message 包含超时提示）。
- 无内容：当后端返回 204 时 fetchJSON 返回 undefined（按泛型 T 断言），当前各 Hook 期望有内容，建议后端返回 200 + JSON。
- 手动重试：通过 refetch() 触发重新拉取。

---

对接建议
- 若真实后端返回字段与上述类型不一致：
  - 先在 src/types/index.ts 中调整类型声明；
  - 再同步更新各 Hook 的 validate 函数；
  - 验证通过后即可去除 isFallback=true 的标记，切换到后端数据。
- 若需添加查询参数、分页或筛选：
  - 将 getJSON 调用替换为包含 query 的路径，或改用 postJSON/putJSON；
  - 在 Hook 中扩展 fetcher 的参数，并将 UseFetchOptions.deps 配置为该参数数组以触发重新拉取。
