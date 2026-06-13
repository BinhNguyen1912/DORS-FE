import { Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UnderConstructionPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="relative mb-6 flex items-center justify-center">
        {/* Glow background effect */}
        <div className="absolute rounded-full bg-orange-500/20 blur-xl animate-pulse w-24 h-24" />
        <div className="relative z-10 bg-slate-100 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md">
          <Lock className="w-12 h-12 text-orange-500" />
        </div>
      </div>
      
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-wide">
        Chức Năng Chưa Hoàn Thiện
      </h2>
      <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-md text-sm sm:text-base leading-relaxed">
        Trang này đang được phát triển và hoàn thiện. Vui lòng quay lại sau!
      </p>

      <button
        onClick={() => navigate(-1)}
        className="mt-8 flex items-center gap-2 px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98]"
      >
        <ArrowLeft size={16} />
        <span>Quay lại</span>
      </button>
    </div>
  );
}
