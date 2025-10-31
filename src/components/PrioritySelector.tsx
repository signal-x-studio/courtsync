import { useState } from 'react';
import type { Priority } from '../hooks/usePriority';

interface PrioritySelectorProps {
  matchId: number;
  currentPriority: Priority;
  onPriorityChange: (matchId: number, priority: Priority) => void;
  onClose?: () => void;
}

export const PrioritySelector = ({
  matchId,
  currentPriority,
  onPriorityChange,
  onClose,
}: PrioritySelectorProps) => {
  const [hoveredPriority, setHoveredPriority] = useState<Priority | null>(null);

  const priorityOptions: Array<{ value: Priority; label: string; color: string; icon: string }> = [
    { value: 'must-cover', label: 'Must Cover', color: '#eab308', icon: '⭐' },
    { value: 'priority', label: 'Priority', color: '#f59e0b', icon: '🔸' },
    { value: 'optional', label: 'Optional', color: '#9fa2ab', icon: '○' },
    { value: null, label: 'Clear', color: '#9fa2ab', icon: '✕' },
  ];

  const handlePriorityClick = (priority: Priority) => {
    onPriorityChange(matchId, priority);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-[#3b3c48] border border-[#454654] rounded-lg p-2 shadow-lg min-w-[160px]">
      <div className="text-xs font-medium text-[#9fa2ab] uppercase tracking-wider mb-2 px-1">
        Set Priority
      </div>
      <div className="space-y-1">
        {priorityOptions.map((option) => {
          const isSelected = currentPriority === option.value;
          const isHovered = hoveredPriority === option.value;
          
          return (
            <button
              key={option.value || 'null'}
              onClick={() => handlePriorityClick(option.value)}
              onMouseEnter={() => setHoveredPriority(option.value)}
              onMouseLeave={() => setHoveredPriority(null)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/50'
                  : isHovered
                  ? 'bg-[#454654] text-[#f8f8f9]'
                  : 'text-[#c0c2c8] hover:bg-[#454654]'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

