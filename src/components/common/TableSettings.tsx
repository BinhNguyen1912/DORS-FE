import { useState, useRef, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TableColumnDef {
  key: string;
  label: string;
  alwaysVisible?: boolean;
}

interface TableSettingsProps {
  columns: TableColumnDef[];
  visibleColumns: Record<string, boolean>;
  onChange: (visibleColumns: Record<string, boolean>) => void;
  storageKey?: string;
}

export default function TableSettings({
  columns,
  visibleColumns,
  onChange,
  storageKey,
}: TableSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleColumn = (key: string) => {
    const column = columns.find(c => c.key === key);
    if (column?.alwaysVisible) return;

    const updated = {
      ...visibleColumns,
      [key]: visibleColumns[key] === false ? true : false,
    };

    onChange(updated);

    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
        title="Cấu hình cột hiển thị"
      >
        <Settings size={14} className={cn("transition-transform duration-300", isOpen && "rotate-45")} />
        <span>Cấu hình cột</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 p-2 text-xs select-none">
          <p className="font-bold text-gray-500 dark:text-gray-400 px-2 py-1.5 border-b border-slate-100 dark:border-slate-750 uppercase tracking-wider text-[9px]">
            Hiển thị cột
          </p>
          <div className="mt-1.5 space-y-0.5 max-h-56 overflow-y-auto">
            {columns.map((col) => {
              const isVisible = visibleColumns[col.key] !== false;
              const isDisabled = col.alwaysVisible;
              
              return (
                <div
                  key={col.key}
                  onClick={() => !isDisabled && handleToggleColumn(col.key)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors",
                    isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-gray-700/60"
                  )}
                >
                  <span className="text-gray-750 dark:text-gray-250 font-semibold">{col.label}</span>
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                    isVisible 
                      ? "bg-amber-500 border-amber-500 text-white" 
                      : "border-slate-300 dark:border-slate-600 bg-transparent"
                  )}>
                    {isVisible && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
