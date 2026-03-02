import { useState, useEffect, useRef } from 'react';
import { useMarketData } from '@/hooks/api/useMarketData';
import { useEmotionPhases } from '@/hooks/api/useEmotionPhases';
import type { EmotionPhase } from '@/types';
import { Info, TrendingUp, TrendingDown, AlertCircle, Activity } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EmotionCycleDashboardProps {
  currentPhase: EmotionPhase;
}

export function EmotionCycleDashboard({ currentPhase }: EmotionCycleDashboardProps) {
  const [activePhase, setActivePhase] = useState<EmotionPhase>(currentPhase);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // 数据来源：接口请求，失败时自动回退到本地 mock
  const { data: market } = useMarketData();
  const { data: phases } = useEmotionPhases();
  const phaseList = phases ?? [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const activePhaseData = phaseList.find(p => p.id === activePhase);

  return (
    <section
      ref={sectionRef}
      className={`py-8 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="bg-gradient-card rounded-2xl p-6 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#a855f7]" />
            <h2 className="text-xl font-bold text-white">情绪周期仪表盘</h2>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <Info className="w-4 h-4 text-white/50" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm bg-[#1a1a1a] border-white/10">
                <p className="text-sm text-white/70">
                  短线交易本质是市场情绪博弈。市场存在可识别的情绪周期，在不同阶段采取不同策略。
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* 情绪周期可视化 - 左侧 */}
          <div className="lg:col-span-3">
            <div className="relative">
              {/* 连接线 */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2" />
              
              {/* 阶段节点 */}
              <div className="relative flex justify-between items-center">
                {phaseList.map((phase, index) => {
                  const isActive = phase.id === activePhase;
                  const isCurrent = phase.id === currentPhase;
                  
                  return (
                    <button
                      key={phase.id}
                      onClick={() => setActivePhase(phase.id)}
                      className={`relative flex flex-col items-center gap-2 group transition-all duration-300 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      {/* 节点圆圈 */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isActive
                            ? 'scale-110'
                            : 'scale-100 hover:scale-105'
                        } ${
                          isCurrent ? 'animate-pulse-glow' : ''
                        }`}
                        style={{
                          backgroundColor: isActive ? phase.bgColor : 'rgba(20,20,20,0.9)',
                          borderColor: phase.color,
                          boxShadow: isActive ? `0 0 20px ${phase.color}40` : 'none'
                        }}
                      >
                        <span
                          className="text-lg font-bold font-mono"
                          style={{ color: phase.color }}
                        >
                          {index + 1}
                        </span>
                      </div>
                      
                      {/* 阶段名称 */}
                      <span
                        className={`text-xs font-medium transition-colors ${
                          isActive ? 'text-white' : 'text-white/50 group-hover:text-white/70'
                        }`}
                      >
                        {phase.name}
                      </span>
                      
                      {/* 当前指示器 */}
                      {isCurrent && (
                        <div
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                          style={{ backgroundColor: phase.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 关键指标 */}
            <div className="grid grid-cols-4 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[#ff2d2d]" />
                  <span className="text-xs text-white/50">涨停数</span>
                </div>
                <p className="text-2xl font-bold text-[#ff2d2d] font-mono">
                  {market?.limitUpCount ?? 0}
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-[#00c800]" />
                  <span className="text-xs text-white/50">跌停数</span>
                </div>
                <p className="text-2xl font-bold text-[#00c800] font-mono">
                  {market?.limitDownCount ?? 0}
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-[#ffb800]" />
                  <span className="text-xs text-white/50">炸板率</span>
                </div>
                <p className="text-2xl font-bold text-[#ffb800] font-mono">
                  {(market?.brokenBoardRate ?? 0)}%
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-[#00d4ff]" />
                  <span className="text-xs text-white/50">溢价率</span>
                </div>
                <p className="text-2xl font-bold text-[#00d4ff] font-mono">
                  +{market?.premiumRate ?? 0}%
                </p>
              </div>
            </div>
          </div>

          {/* 当前阶段详情 - 右侧 */}
          <div className="lg:col-span-2">
            {activePhaseData && (
              <div
                className="h-full p-5 rounded-xl border transition-all duration-300"
                style={{
                  backgroundColor: activePhaseData.bgColor,
                  borderColor: `${activePhaseData.color}40`
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: activePhaseData.color }}
                  />
                  <h3 className="text-lg font-bold text-white">
                    {activePhaseData.name}
                  </h3>
                  {activePhase === currentPhase && (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: activePhaseData.color,
                        color: '#000'
                      }}
                    >
                      当前
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-white/50 mb-1">市场特征</p>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {activePhaseData.features}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50 mb-1">核心策略</p>
                    <p
                      className="text-sm font-medium leading-relaxed"
                      style={{ color: activePhaseData.color }}
                    >
                      {activePhaseData.strategy}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50 mb-1">仓位建议</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: activePhaseData.position.includes('%')
                              ? activePhaseData.position.replace(/[^0-9]/g, '').split('').length > 2
                                ? '70%'
                                : activePhaseData.position.replace(/[^0-9]/g, '') + '%'
                              : '0%',
                            backgroundColor: activePhaseData.color
                          }}
                        />
                      </div>
                      <span
                        className="text-sm font-bold font-mono"
                        style={{ color: activePhaseData.color }}
                      >
                        {activePhaseData.position}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
