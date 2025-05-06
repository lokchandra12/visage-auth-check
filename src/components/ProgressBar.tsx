
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  total,
  label = "Images Captured"
}) => {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-sm">
        <span>{label}: {current}/{total}</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
