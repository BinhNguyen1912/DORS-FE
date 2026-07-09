import type { SosRequestItem } from './mockData';

interface RequestHistoryProps {
  request: SosRequestItem;
}

export default function RequestHistory({ request }: RequestHistoryProps) {
  return (
    <div className="p-4 flex flex-col gap-6 text-xs font-bold text-left text-gray-700 dark:text-gray-300">
      <div className="relative border-l border-slate-200 dark:border-slate-800 pl-6 space-y-6">
        <div className="relative">
          <span className="absolute -left-[30px] top-0 w-4.5 h-4.5 rounded-full bg-blue-600 border-4 border-white dark:border-gray-900 flex items-center justify-center" />
          <div>
            <p className="font-extrabold text-gray-900 dark:text-white text-xs">Mới gửi yêu cầu cứu hộ</p>
            <p className="text-[10px] text-gray-450 mt-0.5">
              Người gửi: {request.requesterName} • Nguồn: {request.source}
            </p>
            <span className="text-[9px] text-gray-400 font-semibold">
              {request.createdAt.toLocaleTimeString('vi-VN')} {request.createdAt.toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>

        {request.status !== 'PENDING' && (
          <div className="relative">
            <span className="absolute -left-[30px] top-0 w-4.5 h-4.5 rounded-full bg-orange-500 border-4 border-white dark:border-gray-900 flex items-center justify-center" />
            <div>
              <p className="font-extrabold text-gray-900 dark:text-white text-xs">Phê duyệt & Điều phối Đội cứu trợ</p>
              <p className="text-[10px] text-gray-450 mt-0.5">Hệ thống đã tự động chạy thuật toán điều phối để chỉ định Đội tối ưu</p>
              <span className="text-[9px] text-gray-400 font-semibold">Tự động xử lý</span>
            </div>
          </div>
        )}

        {(request.status === 'ON_SITE' || request.status === 'RESOLVED') && (
          <div className="relative">
            <span className="absolute -left-[30px] top-0 w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-white dark:border-gray-900 flex items-center justify-center" />
            <div>
              <p className="font-extrabold text-gray-900 dark:text-white text-xs">Đội cứu hộ đã tiếp cận hiện trường</p>
              <p className="text-[10px] text-gray-450 mt-0.5">Đội cứu hộ báo cáo đã tiếp cận hiện trường ngập lụt</p>
            </div>
          </div>
        )}

        {request.status === 'RESOLVED' && (
          <div className="relative">
            <span className="absolute -left-[30px] top-0 w-4.5 h-4.5 rounded-full bg-blue-500 border-4 border-white dark:border-gray-900 flex items-center justify-center" />
            <div>
              <p className="font-extrabold text-gray-900 dark:text-white text-xs">Nhiệm vụ cứu hộ hoàn thành</p>
              <p className="text-[10px] text-gray-450 mt-0.5">Đã hoàn thành cứu hộ thành công và hạ mức độ ngập lụt</p>
            </div>
          </div>
        )}

        {request.status === 'CANCELLED' && (
          <div className="relative">
            <span className="absolute -left-[30px] top-0 w-4.5 h-4.5 rounded-full bg-slate-400 border-4 border-white dark:border-gray-900 flex items-center justify-center" />
            <div>
              <p className="font-extrabold text-gray-900 dark:text-white text-xs">Đã hủy / Từ chối yêu cầu</p>
              <p className="text-[10px] text-gray-450 mt-0.5">Lý do: Nước đã rút hoặc tin báo không chính xác</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
