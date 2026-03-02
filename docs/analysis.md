# 项目深度分析（接口与 AI 大模型逻辑）

本文对当前代码库进行系统性梳理，聚焦两大维度：
- 接口使用情况：对外/对内 HTTP、WebSocket、代理、依赖库与配置。
- AI 大模型相关逻辑：数据来源、交互流程、类型约束与未来接入设计。

结论概览：
- 项目为纯前端演示，未发现任何后端接口或第三方 AI SDK 的实际调用；数据均来自本地 mock。
- AI 逻辑在 UI 层模拟（进度条 + 打字机 + 状态机），没有真实模型/Prompt/流式输出。
- 若接入真实 LLM，建议通过后端代理暴露标准化 API（例如 /api/ai/analyze），与现有类型结构对齐（AIAnalysis），同时注意安全合规与异常降级。

---

## 1. 技术栈与结构

- 技术栈
  - React 19 + TypeScript
  - Vite 7
  - Tailwind CSS（shadcn 主题）
  - Radix UI（@radix-ui/react-*）
  - charts：recharts
  - 通知：sonner
- 目录结构（核心相关）
  - src/sections/
    - AIAnalysisCenter.tsx（AI 建议的展示与交互）
    - EmotionCycleDashboard.tsx（情绪周期展示）
    - LadderBoard.tsx（连板天梯）
    - FourDimensionSystem.tsx（四维选股）
    - StrategyEngine.tsx（策略引擎）
    - PositionManager.tsx（仓位管理）
    - ReviewChecklist.tsx（复盘清单）
    - RiskControl.tsx（风险控制）
  - src/data/strategyData.ts（情绪阶段、策略、天梯、四维、AI 建议等 mock 数据）
  - src/types/index.ts（完整的类型定义）
  - src/App.tsx（页面编排与数据分发）
  - src/main.tsx（入口）
  - vite.config.ts（构建与解析配置，@ 别名）

---

## 2. 数据流与状态管理

- 数据源
  - 全部来自本地 mock：src/data/strategyData.ts
    - emotionPhases（六阶段）
    - buyStrategies / sellStrategies
    - checklistSteps / riskRules
    - mockMarketData / mockFourDimensionData / mockLadderData
    - mockAIAnalysis（AI 建议：状态、情绪、推荐主题、目标股、建议文案、置信度）
- 数据传递
  - App.tsx 从 data 导入 mockMarketData 等，并以 props 分发给各个 Section。
- 核心 AI 模块
  - src/sections/AIAnalysisCenter.tsx
    - useState：isVisible、isAnalyzing、analysis、typedText
    - IntersectionObserver：控制组件入场动画（isVisible）
    - “重新分析”：setTimeout(2000ms) 模拟耗时 → 重置 analysis 为 mockAIAnalysis
    - 打字机效果：当 analysis.status === 'completed' 时，逐字符展示 analysis.suggestion
    - 情绪阶段与颜色：analysis.emotionPhase 查 emotionPhases 映射展示风格

---

## 3. 接口梳理

- 外部 HTTP(S)
  - 仅发现 Google Fonts：
    - src/index.css：`@import url('https://fonts.googleapis.com/css2?family=Inter...')`
- 内部 HTTP / WS
  - 未发现 fetch、axios、GraphQL、WebSocket、SSE、EventSource 等任何网络调用。
- 代理与环境变量
  - vite.config.ts 未设置 devServer.proxy、未注入 API 相关环境变量。
- 依赖检查（package.json）
  - 未包含 openai、langchain、anthropic、cohere、ollama、vllm 等 AI/网络 SDK。
- 结论
  - 目前无后端或第三方 API 接入；接口层为“空”，项目以静态数据演示业务流程。

---

## 4. AI 大模型逻辑（现状）

- 性质：UI 驱动的“模拟”AI 流程
  - “AI 正在分析…”文案 + 进度条 + 阶段提示
  - 打字机呈现建议文案
  - 数据来源：`mockAIAnalysis`
- 缺失：真实的 AI 推理链路
  - 无 Prompt 设计、无模型调用、无流式输出、无上下文对话、无错误/重试策略
  - 无 Key 管理、无合规与审计控制点

---

## 5. 类型约束与数据模式

src/types/index.ts 提供了清晰的类型约束，核心包括：
- 情绪周期：EmotionPhase、EmotionPhaseData
- 市场数据：MarketData
- 四维选股：ThemeAnalysis / StockCharacter / TechnicalSignal / FundVerification / FourDimensionAnalysis
- 策略：BuyStrategy / SellStrategy
- 仓位管理、复盘 Checklist、风险控制：PositionConfig / ChecklistStep / RiskRule / RiskLimit
- AI 分析输出：AIAnalysis
  - status: 'analyzing' | 'completed' | 'error'
  - emotionPhase: 'ice' | 'recovery' | 'ferment' | 'peak' | 'diverge' | 'decline'
  - emotionDay: number
  - recommendedThemes: string[]
  - targetStock: { name, code, boards, type }
  - suggestion: string
  - confidence: number

建议：
- 继续保持以 AIAnalysis 为前端统一结构的“对外契约”，后端返回与之对齐，便于前端无缝替换 mock。

---

## 6. 接入真实 LLM 的设计建议

为保持与现有组件解耦，建议“后端代理 + 前端轻薄客户端”的模式，核心要点如下：

- 服务端代理与配置
  - 避免在前端暴露 API Key。将 LLM 调用放在服务端（Node/Cloud Functions）。
  - 配置项（.env.server）：LLM Base URL、API Key、模型名、超时、重试次数、SSE 开关、地区等。
  - 服务端路由示例：POST /api/ai/analyze

- 接口协议（建议）
  - 入参（摘要）：
    - 当前情绪阶段：EmotionPhase
    - 连板天梯：mockLadderData（或标准化结构）
    - 四维分析指标：mockFourDimensionData
    - 风控规则：riskRules
    - 用户偏好/风险偏好（可选）
  - 出参：AIAnalysis（保持完全对齐）
  - 误码：错误码 + 说明，前端可切换降级策略

- 前端客户端封装（示例）
  ```ts
  // src/lib/aiClient.ts
  import type { AIAnalysis } from '@/types';

  export async function analyzeMarket(input: {
    emotionPhase: string;
    ladder: unknown;
    fourDim: unknown;
    rules: unknown;
  }): Promise<AIAnalysis> {
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      // 这里可根据后端返回的错误结构细化错误处理
      throw new Error(`AI analyze failed: ${res.status}`);
    }
    return await res.json();
  }
  ```

- 流式输出（建议提升“打字机”的真实感）
  - 服务端以 SSE 或 chunked 方式流式返回 token
  - 前端将 ReadableStream 累计到 typedText，替换 setTimeout 打字机
  - UI 状态机：'analyzing' → 渐进补全 suggestion → 'completed' 或 'error'

- Prompt 与安全
  - Prompt 结构化：明确输入（市场状态、天梯、四维、风控）与期望输出（AIAnalysis）
  - 约束与合规：
    - 明确拒绝超高风险/不合规策略
    - 输出置信度与理由；避免“建议即结论”的误导
  - 审计与速率限制：记录调用摘要（脱敏），设置限流，防止滥用

- 错误处理与降级
  - 超时/配额/网络错误：
    - 退回到基于本地规则的建议（使用 strategyData 中规则与当前 emotionPhase 计算保底建议）
  - UI 侧 toast/降级提示，保持用户可见性与信任

- 校验与容错（zod 示例）
  ```ts
  import { z } from 'zod';

  export const AIAnalysisSchema = z.object({
    status: z.enum(['analyzing','completed','error']),
    emotionPhase: z.enum(['ice','recovery','ferment','peak','diverge','decline']),
    emotionDay: z.number(),
    recommendedThemes: z.array(z.string()),
    targetStock: z.object({
      name: z.string(),
      code: z.string(),
      boards: z.number(),
      type: z.string(),
    }),
    suggestion: z.string(),
    confidence: z.number().min(0).max(100),
  });

  // 前端使用：
  // const parsed = AIAnalysisSchema.safeParse(resp);
  // if (!parsed.success) { 降级处理 + 上报日志 }
  ```

---

## 7. 市场数据接口接入建议（扩展）

如果进一步走向实盘/准实时：
- 行情/K线/分时：
  - 统一以后端代理转发（例如 /api/market/quote, /api/market/kline）
  - 缓存 + 去重（同标的同时间段，避免重复拉取）
  - 超时/重试/断路器
- 龙虎榜、资金流向、板块情绪：
  - 标准化接口，输出结构与现有 types 对齐（或新增 types）
- 数据新鲜度与一致性：
  - 定义“快照时间戳”
  - 前端显示“上次更新时间”，增强可信度

---

## 8. 运行与构建

- 开发：`npm run dev`
- 构建：`npm run build`
- 预览：`npm run preview`
- 目前无后端服务；若接入 LLM/行情，请新增服务端（Node/云函数）与 .env 配置。

---

## 9. 风险与合规

- 投资风险提示已在页面底部明确。
- AI 建议仅供参考，务必结合风险控制规则（riskRules）执行。
- Key 管理：严禁在前端明文暴露；应使用服务端代理与最小权限原则。
- 日志与合规：记录必要但脱敏的信息，用于追踪与优化策略；遵循当地监管要求。

---

## 10. 现状差距与改进路线

- 从“前端演示”到“策略辅助”的路径：
  1) 增加后端接口：行情/分时/K线/龙虎榜/情绪指标
  2) 接入 LLM（后端代理），与 AIAnalysis 类型对齐返回
  3) 前端实现流式输出、错误/降级处理、缓存与并发控制
  4) 增加效果评估与 A/B 实验（收益、命中率、回撤、夏普）
  5) 安全合规全面落地（鉴权、速率、审计）

---

## 附录：关键文件与职责

- src/sections/AIAnalysisCenter.tsx
  - 模拟 AI 分析过程与建议展示；使用本地 `mockAIAnalysis` 数据；打字机效果与重新分析按钮。
- src/data/strategyData.ts
  - 情绪阶段数据、买卖策略、复盘 Checklist、风险控制规则、模拟市场/天梯/四维数据、`mockAIAnalysis`。
- src/types/index.ts
  - 统一数据类型定义，`AIAnalysis` 为核心输出类型。
- src/App.tsx
  - 页面编排；将 mock 数据传递给 Navbar 与各 Section。
- vite.config.ts
  - 插件：`kimi-plugin-inspect-react`（开发辅助）、`@vitejs/plugin-react`
  - 别名：`@` → `./src`
  - 未配置 dev 代理。

以上为当前项目的接口与 AI 逻辑深度分析。当前实现以本地数据驱动 UI 演示，后续接入真实 LLM 与行情数据时，可按本文建议扩展，确保类型对齐、安全合规与用户体验。
