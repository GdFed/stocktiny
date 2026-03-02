import { useState, useEffect, useRef } from 'react';
import { useEmotionPhases } from '@/hooks/api/useEmotionPhases';
import type { EmotionPhase } from '@/types';
import { Layers, AlertTriangle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface PositionManagerProps {
  currentPhase: EmotionPhase;
}

export function PositionManager({ currentPhase }: PositionManagerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(75);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const { data: phases } = useEmotionPhases();
  
  const phaseData = phases?.find(p => p.id === currentPhase);
  
  // 解析建议仓位范围
  const getSuggestedRange = (positionStr: string): [number, number] => {
    if (positionStr.includes('-')) {
      const matches = positionStr.match(/(\d+)-(\d+)%/);
      if (matches) {
        return [parseInt(matches[1]), parseInt(matches[2])];
      }
    }
    const match = positionStr.match(/(\d+)%/);
    if (match) {
      const val = parseInt(match[1]);
      return [val, val];
    }
    return [0, 0];
  };

  const [, maxSuggest] = getSuggestedRange(phaseData?.position || '0%');
  
  // 计算风险等级
  const getRiskLevel = (position: number): { level: 'low' | 'medium' | 'high'; color: string } => {
    if (position <= 30) return { level: 'low', color: '#00c800' };
    if (position <= 70) return { level: 'medium', color: '#ffb800' };
    return { level: 'high', color: '#ff2d2d' };
  };

  const risk = getRiskLevel(currentPosition);

  // 金字塔层级数据
  const pyramidLevels = [
    { label: '高潮期', range: '40-60%', color: '#ff2d2d', phase: 'peak' as EmotionPhase },
    { label: '发酵期', range: '60-80%', color: '#a855f7', phase: 'ferment' as EmotionPhase },
    { label: '复苏期', range: '20-40%', color: '#00c8c8', phase: 'recovery' as EmotionPhase },
    { label: '冰点期', range: '0-20%', color: '#00d4ff', phase: 'ice' as EmotionPhase },
    { label: '退潮期', range: '0%', color: '#6b7280', phase: 'decline' as EmotionPhase },
  ];

  return (
    <section ref={sectionRef} className="py-8">
      <div className="bg-gradient-card rounded-2xl p-6 border border-white/10">
        {/* Header */}
        <div
          className={`flex items-center justify-between mb-6 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">仓位管理</h2>
              <p className="text-sm text-white/50">动态金字塔配置</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-white/50">当前仓位</p>
              <p className="text-2xl font-bold font-mono" style={{ color: risk.color }}>
                {currentPosition}%
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${risk.color}20` }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: risk.color }} />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 金字塔可视化 */}
          <div
            className={`flex items-center justify-center transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            <div className="relative">
              {/* 金字塔 */}
              <div className="flex flex-col items-center gap-1">
                {pyramidLevels.map((level, index) => {
                  const isCurrentPhase = level.phase === currentPhase;
                  const width = 280 - index * 50;
                  
                  return (
                    <div
                      key={level.phase}
                      className={`h-10 rounded-lg flex items-center justify-between px-4 transition-all duration-300 ${
                        isCurrentPhase ? 'scale-105' : 'opacity-60'
                      }`}
                      style={{
                        width: `${width}px`,
                        backgroundColor: isCurrentPhase ? level.color : `${level.color}30`,
                        boxShadow: isCurrentPhase ? `0 0 20px ${level.color}50` : 'none'
                      }}
                    >
                      <span className={`text-sm font-medium ${isCurrentPhase ? 'text-black' : 'text-white'}`}>
                        {level.label}
                      </span>
                      <span className={`text-sm font-mono ${isCurrentPhase ? 'text-black' : 'text-white/70'}`}>
                        {level.range}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 当前阶段指示 */}
              <div
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: phaseData?.color }}
              />
            </div>
          </div>

          {/* 仓位控制面板 */}
          <div
            className={`space-y-6 transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            {/* 仓位滑块 */}
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/70">调整仓位</span>
                <span className="text-sm font-mono" style={{ color: risk.color }}>
                  {currentPosition}%
                </span>
              </div>
              <Slider
                value={[currentPosition]}
                onValueChange={(value) => setCurrentPosition(value[0])}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-white/30">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* 建议仓位 */}
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/70">建议仓位</span>
                <span
                  className="text-sm font-bold font-mono"
                  style={{ color: phaseData?.color }}
                >
                  {phaseData?.position}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${maxSuggest}%`,
                    background: `linear-gradient(90deg, ${phaseData?.color}60, ${phaseData?.color})`
                  }}
                />
              </div>
              <p className="text-xs text-white/50 mt-2">
                当前处于<span style={{ color: phaseData?.color }}>{phaseData?.name}</span>，
                {phaseData?.strategy}
              </p>
            </div>

            {/* 配置建议 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/30 text-center">
                <p className="text-xs text-white/50 mb-1">龙头仓位</p>
                <p className="text-lg font-bold text-[#a855f7] font-mono">
                  {Math.round(currentPosition * 0.5)}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-center">
                <p className="text-xs text-white/50 mb-1">跟风仓位</p>
                <p className="text-lg font-bold text-[#00d4ff] font-mono">
                  {Math.round(currentPosition * 0.3)}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <p className="text-xs text-white/50 mb-1">现金储备</p>
                <p className="text-lg font-bold text-white/70 font-mono">
                  {100 - currentPosition}%
                </p>
              </div>
            </div>

            {/* 风险等级 */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <span className="text-sm text-white/70">风险等级:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: risk.color }}
                />
                <span
                  className="text-sm font-medium capitalize"
                  style={{ color: risk.color }}
                >
                  {risk.level === 'low' ? '低风险' : risk.level === 'medium' ? '中等风险' : '高风险'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
