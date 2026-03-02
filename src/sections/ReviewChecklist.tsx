import { useState, useEffect, useRef } from 'react';
import { useChecklist } from '@/hooks/api/useChecklist';
import { CheckCircle2, Circle, Clock, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function ReviewChecklist() {
  const [isVisible, setIsVisible] = useState(false);
  const { data: checklist } = useChecklist();
  const [steps, setSteps] = useState(checklist ?? []);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
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
  
  // 同步后端/回退数据到本地可编辑状态
  useEffect(() => {
    if (checklist) setSteps(checklist);
  }, [checklist]);

  // 计算完成进度
  const totalItems = steps.reduce((acc, step) => acc + step.items.length, 0);
  const completedItems = steps.reduce(
    (acc, step) => acc + step.items.filter(item => item.completed).length,
    0
  );
  const progress = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

  // 切换任务完成状态
  const toggleItem = (stepId: number, itemId: string) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId
          ? {
              ...step,
              items: step.items.map(item =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              )
            }
          : step
      )
    );
  };

  // 重置所有任务
  const resetAll = () => {
    setSteps(prev =>
      prev.map(step => ({
        ...step,
        items: step.items.map(item => ({ ...item, completed: false }))
      }))
    );
  };

  // AI一键复盘
  const aiReview = () => {
    setSteps(prev =>
      prev.map(step => ({
        ...step,
        items: step.items.map(item => ({ ...item, completed: true }))
      }))
    );
  };

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
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI复盘Checklist</h2>
              <p className="text-sm text-white/50">每日必做四步复盘</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-white/50">完成进度</p>
              <p className="text-2xl font-bold text-gradient-purple font-mono">
                {progress}%
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAll}
                className="gap-1.5 border-white/10 hover:bg-white/5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置
              </Button>
              <Button
                size="sm"
                onClick={aiReview}
                className="gap-1.5 bg-gradient-purple hover:opacity-90"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI复盘
              </Button>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div
          className={`mb-6 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-white/30">
          <span>预计耗时: 30分钟</span>
          <span>{completedItems}/{totalItems} 项完成</span>
        </div>
        </div>

        {/* 步骤列表 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const stepCompleted = step.items.filter(item => item.completed).length;
            const stepTotal = step.items.length;
            const isExpanded = expandedStep === step.id;
            const isAllCompleted = stepCompleted === stepTotal;

            return (
              <div
                key={step.id}
                className={`rounded-xl border transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } ${isAllCompleted ? 'border-[#00c800]/30 bg-[#00c800]/5' : 'border-white/10 bg-[#141414]'}`}
                style={{ transitionDelay: `${150 + index * 100}ms` }}
              >
                {/* Step Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isAllCompleted
                            ? 'bg-[#00c800]/20 text-[#00c800]'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {isAllCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-white">{step.title}</h3>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-white/30 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-white/30" />
                    <span className="text-xs text-white/50">{step.duration}</span>
                    <span className="text-xs text-white/30 ml-auto">
                      {stepCompleted}/{stepTotal}
                    </span>
                  </div>
                </div>

                {/* Step Items */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    <ul className="space-y-2">
                      {step.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start gap-2 cursor-pointer group"
                          onClick={() => toggleItem(step.id, item.id)}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {item.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#00c800] transition-transform hover:scale-110" />
                            ) : (
                              <Circle className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" />
                            )}
                          </div>
                          <span
                            className={`text-sm transition-all ${
                              item.completed
                                ? 'text-white/50 line-through'
                                : 'text-white/70 group-hover:text-white'
                            }`}
                          >
                            {item.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 复盘提示 */}
        <div
          className={`mt-6 p-4 rounded-xl bg-[#00d4ff]/5 border border-[#00d4ff]/20 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '550ms' }}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-[#00d4ff] mb-1">AI复盘建议</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                复盘是短线交易的核心环节。通过系统化的数据扫描、梯队梳理、龙虎榜分析和次日预案，
                可以有效提升次日交易的胜率。建议每日收盘后30分钟内完成复盘。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
