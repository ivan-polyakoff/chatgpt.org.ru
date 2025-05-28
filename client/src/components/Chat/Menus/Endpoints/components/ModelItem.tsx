import React from 'react';
import { Bot, Info } from 'lucide-react';

interface ModelItemProps {
  modelName: string;
  description?: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function ModelItem({ 
  modelName, 
  description, 
  isSelected = false, 
  onClick,
  className = ''
}: ModelItemProps) {
  return (
    <div
      className={`
        group relative w-full px-3 py-2.5 rounded-lg border transition-all duration-200 cursor-pointer
        hover:border-blue-300 dark:hover:border-blue-600
        ${isSelected
          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-600 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <span className={`font-medium truncate block ${
            isSelected
              ? 'text-blue-900 dark:text-blue-100'
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {modelName}
          </span>

          {description && (
            <p className={`text-xs mt-1 leading-relaxed ${
              isSelected
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 