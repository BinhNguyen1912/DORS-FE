import { cn } from '../../../lib/utils';

interface RequestStepperProps {
  status: string;
}

export default function RequestStepper({ status }: RequestStepperProps) {
  const getStepperActiveStep = (statusStr: string) => {
    switch (statusStr) {
      case 'PENDING':
        return 1;
      case 'DISPATCHED':
        return 2;
      case 'ON_SITE':
        return 3;
      case 'RESOLVED':
        return 4;
      default:
        return 1;
    }
  };

  const activeStep = getStepperActiveStep(status);

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-auto flex items-center justify-between select-none">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-left">Quy trình xử lý</div>
      <div className="flex items-center gap-1.5 md:gap-4 text-[10.5px] font-extrabold text-gray-400">
        {/* Step 1 */}
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
            activeStep >= 1
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700"
          )}>
            1
          </span>
          <span className={activeStep >= 1 ? "text-gray-900 dark:text-white" : ""}>Mới tiếp nhận</span>
        </div>

        <div className="w-6 md:w-10 h-px bg-slate-200 dark:bg-slate-800" />

        {/* Step 2 */}
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
            activeStep >= 2
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700"
          )}>
            2
          </span>
          <span className={activeStep >= 2 ? "text-gray-900 dark:text-white" : ""}>Đang xác minh</span>
        </div>

        <div className="w-6 md:w-10 h-px bg-slate-200 dark:bg-slate-800" />

        {/* Step 3 */}
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
            activeStep >= 3
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700"
          )}>
            3
          </span>
          <span className={activeStep >= 3 ? "text-gray-900 dark:text-white" : ""}>Đã xác nhận</span>
        </div>

        <div className="w-6 md:w-10 h-px bg-slate-200 dark:bg-slate-800" />

        {/* Step 4 */}
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
            activeStep >= 4
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700"
          )}>
            4
          </span>
          <span className={activeStep >= 4 ? "text-gray-900 dark:text-white" : ""}>Đã hiển thị</span>
        </div>
      </div>
    </div>
  );
}
