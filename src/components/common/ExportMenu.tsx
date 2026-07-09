import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from '../../stores';

interface ExportMenuProps {
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  title?: string;
}

export default function ExportMenu({
  onExportExcel,
  onExportPdf,
  title = 'Xuất dữ liệu',
}: ExportMenuProps) {
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

  const handleExport = (type: 'excel' | 'pdf') => {
    setIsOpen(false);
    if (type === 'excel') {
      if (onExportExcel) {
        onExportExcel();
      } else {
        toast.success('Tính năng Xuất Excel sẽ sớm được phát triển!');
      }
    } else if (type === 'pdf') {
      if (onExportPdf) {
        onExportPdf();
      } else {
        toast.success('Tính năng Xuất PDF sẽ sớm được phát triển!');
      }
    }
  };

  return (
    <div className="relative inline-block text-left select-none" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
      >
        <Download size={14} className="text-gray-400" />
        <span>{title}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1.5 text-xs select-none">
          <button
            type="button"
            onClick={() => handleExport('excel')}
            className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center gap-2 border-0 bg-transparent text-gray-700 dark:text-gray-300 transition-colors"
          >
            <FileSpreadsheet size={13} className="text-emerald-500" />
            <span>Xuất Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-gray-750/50 cursor-pointer flex items-center gap-2 border-0 bg-transparent text-gray-700 dark:text-gray-300 transition-colors"
          >
            <FileText size={13} className="text-red-500" />
            <span>Xuất PDF (.pdf)</span>
          </button>
        </div>
      )}
    </div>
  );
}
