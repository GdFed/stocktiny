import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { EmotionCycleDashboard } from '@/sections/EmotionCycleDashboard';
import { FourDimensionSystem } from '@/sections/FourDimensionSystem';
import { StrategyEngine } from '@/sections/StrategyEngine';
import { PositionManager } from '@/sections/PositionManager';
import { ReviewChecklist } from '@/sections/ReviewChecklist';
import { RiskControl } from '@/sections/RiskControl';
import { AIAnalysisCenter } from '@/sections/AIAnalysisCenter';
import { LadderBoard } from '@/sections/LadderBoard';
import type { EmotionPhase } from '@/types';
import { mockMarketData } from '@/data/strategyData';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [currentPhase] = useState<EmotionPhase>('ferment');
  const [isLoading, setIsLoading] = useState(true);

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // 模拟情绪阶段变化
  useEffect(() => {
    const interval = setInterval(() => {
      // 这里可以根据实际数据动态调整情绪阶段
      // 暂时保持发酵期
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-purple flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl font-bold text-white">Q</span>
          </div>
          <p className="text-white/50">QuickTiny AI 加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* 导航栏 */}
      <Navbar
        currentPhase={currentPhase}
        limitUpCount={mockMarketData.limitUpCount}
        limitDownCount={mockMarketData.limitDownCount}
      />

      {/* 主内容区 */}
      <main className="pt-20 pb-8 px-4 lg:px-8">
        <div className="max-w-[1440px] mx-auto space-y-6">
          {/* AI智能分析中心 - 置顶 */}
          <AIAnalysisCenter />

          {/* 情绪周期仪表盘 */}
          <EmotionCycleDashboard currentPhase={currentPhase} />

          {/* 连板天梯 */}
          <LadderBoard />

          {/* 四维选股系统 */}
          <FourDimensionSystem />

          {/* 买卖点策略引擎 */}
          <StrategyEngine />

          {/* 仓位管理 */}
          <PositionManager currentPhase={currentPhase} />

          {/* AI复盘Checklist */}
          <ReviewChecklist />

          {/* 风险控制 */}
          <RiskControl />

          {/* 页脚 */}
          <footer className="pt-8 pb-4 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-purple flex items-center justify-center">
                  <span className="text-sm font-bold text-white">Q</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">QuickTiny AI</p>
                  <p className="text-xs text-white/50">专业短线打板策略系统</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-xs text-white/50">
                <span>情绪周期理论</span>
                <span>四维选股</span>
                <span>AI驱动</span>
                <span>风险控制</span>
              </div>
              
              <p className="text-xs text-white/30">
                投资有风险，交易需谨慎
              </p>
            </div>
          </footer>
        </div>
      </main>

      <Toaster />
    </div>
  );
}

export default App;
