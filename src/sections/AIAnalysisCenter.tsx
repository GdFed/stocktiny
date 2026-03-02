import { useState, useEffect, useRef } from 'react';
import { mockAIAnalysis, emotionPhases } from '@/data/strategyData';
import { Brain, Sparkles, Target, TrendingUp, AlertCircle, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function AIAnalysisCenter() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(mockAIAnalysis);
  const [typedText, setTypedText] = useState('');
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

  // 打字机效果
  useEffect(() => {
    if (analysis.status === 'completed' && typedText.length < analysis.suggestion.length) {
      const timer = setTimeout(() => {
        setTypedText(analysis.suggestion.slice(0, typedText.length + 1));
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [analysis.suggestion, typedText, analysis.status]);

  // 重新分析
  const handleReanalyze = () => {
    setIsAnalyzing(true);
    setTypedText('');
    
    // 模拟分析过程
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysis({ ...mockAIAnalysis });
    }, 2000);
  };

  const phaseData = emotionPhases.find(p => p.id === analysis.emotionPhase);

  return (
    <section ref={sectionRef} className="py-8">
      <div
        className={`relative rounded-2xl p-6 border transition-all duration-500 overflow-hidden ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(255, 107, 53, 0.05))',
          borderColor: 'rgba(168, 85, 247, 0.3)'
        }}
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a855f7]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center animate-pulse-glow">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI智能分析中心</h2>
              <p className="text-sm text-white/50">深度学习驱动的策略建议</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReanalyze}
            disabled={isAnalyzing}
            className="gap-1.5 border-[#a855f7]/30 hover:bg-[#a855f7]/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAnalyzing ? '分析中...' : '重新分析'}
          </Button>
        </div>

        {isAnalyzing ? (
          // 分析中状态
          <div className="relative py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#a855f7]/20 mb-4">
              <Zap className="w-8 h-8 text-[#a855f7] animate-pulse" />
            </div>
            <p className="text-lg text-white/70">AI正在分析市场数据...</p>
            <div className="max-w-md mx-auto mt-4">
              <Progress value={65} className="h-1" />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <span className="text-xs text-white/40">扫描市场情绪</span>
              <span className="text-xs text-white/40">→</span>
              <span className="text-xs text-white/40">识别主线题材</span>
              <span className="text-xs text-white/40">→</span>
              <span className="text-xs text-[#a855f7]">生成策略</span>
            </div>
          </div>
        ) : (
          // 分析完成状态
          <div className="relative grid lg:grid-cols-3 gap-6">
            {/* 左侧：分析结果 */}
            <div className="lg:col-span-2 space-y-4">
              {/* 情绪判断 */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${phaseData?.color}20` }}
                >
                  <TrendingUp className="w-5 h-5" style={{ color: phaseData?.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/50 mb-1">情绪判断</p>
                  <p className="text-sm text-white">
                    当前处于
                    <span
                      className="font-bold mx-1"
                      style={{ color: phaseData?.color }}
                    >
                      {phaseData?.name}
                    </span>
                    第{analysis.emotionDay}天
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: phaseData?.color,
                    color: phaseData?.color,
                    backgroundColor: `${phaseData?.color}15`
                  }}
                >
                  置信度 {analysis.confidence}%
                </Badge>
              </div>

              {/* 主线推荐 */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#ff2d2d]/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#ff2d2d]" />
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">主线推荐</p>
                  <div className="flex gap-2">
                    {analysis.recommendedThemes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-sm bg-[#ff2d2d]/20 text-[#ff2d2d]"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 目标股 */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#a855f7]/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#a855f7]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/50 mb-1">目标股</p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">
                      {analysis.targetStock.name}
                    </span>
                    <span className="text-sm text-white/50 font-mono">
                      {analysis.targetStock.code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-[#a855f7]/20 text-[#a855f7]">
                      {analysis.targetStock.boards}连板
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/70">
                      {analysis.targetStock.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI建议 */}
              <div className="p-4 rounded-xl bg-[#00d4ff]/5 border border-[#00d4ff]/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-[#00d4ff] mb-1">AI操作建议</p>
                    <p className="text-sm text-white/80">
                      {typedText}
                      <span className="animate-blink">|</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：快捷操作 */}
            <div className="space-y-3">
              <p className="text-xs text-white/50 mb-2">快捷操作</p>
              
              <Button
                className="w-full justify-between bg-gradient-purple hover:opacity-90"
              >
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  加入自选股
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-between border-white/10 hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  设置预警
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-between border-white/10 hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  查看分时
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* 历史分析 */}
              <div className="mt-6 p-3 rounded-lg bg-white/5">
                <p className="text-xs text-white/50 mb-2">今日分析记录</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">09:30 开盘分析</span>
                    <span className="text-[#00c800]">命中</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">11:30 午盘分析</span>
                    <span className="text-[#00c800]">命中</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">15:00 收盘分析</span>
                    <span className="text-white/30">进行中</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
