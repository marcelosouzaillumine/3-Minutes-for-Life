import { useEffect, useState } from 'react';
import './MissionProgress.css';

interface MissionProgressProps {
  current?: number;
  target?: number;
  variant?: 'pill' | 'bar';
}

export function MissionProgress({ current = 1247, target = 100000, variant = 'bar' }: MissionProgressProps) {
  const [animatedCurrent, setAnimatedCurrent] = useState(0);

  useEffect(() => {
    // Animação suave para o número
    const duration = 1500;
    const steps = 60;
    const stepTime = Math.abs(Math.floor(duration / steps));
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Easing function (easeOutExpo)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setAnimatedCurrent(Math.floor(current * easeProgress));
      
      if (step >= steps) {
        setAnimatedCurrent(current);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [current]);

  const percentage = Math.min(100, Math.max(0, (animatedCurrent / target) * 100));
  const formattedCurrent = animatedCurrent.toLocaleString('pt-BR');
  const formattedTarget = target.toLocaleString('pt-BR');

  if (variant === 'pill') {
    return (
      <div className="mission-progress-pill">
        <span className="pulse-dot"></span>
        <span className="pill-text"><strong>{formattedCurrent}</strong> pessoas alcançadas hoje</span>
      </div>
    );
  }

  return (
    <div className="mission-progress-bar-container">
      <div className="progress-labels">
        <span>{formattedCurrent}</span>
        <span>{formattedTarget}</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
