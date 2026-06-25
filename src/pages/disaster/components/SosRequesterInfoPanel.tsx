import { Phone, Copy } from 'lucide-react';
import type { SosRequest } from '../../../types';
import { cn } from '../../../lib/utils';
import { severityLabels, statusLabels, statusColors } from './SosDetailModal.types';
import { toast } from '../../../stores';

interface SosRequesterInfoPanelProps {
  sos: SosRequest;
  formatDate: (dateStr?: string | Date) => string;
  handleCallPhone: (phone?: string) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="w-36 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400 font-normal">{label}</span>
      <span className="flex-1 text-sm text-gray-900 dark:text-white font-normal">{children}</span>
    </div>
  );
}

export default function SosRequesterInfoPanel({ sos, formatDate, handleCallPhone }: SosRequesterInfoPanelProps) {
  const coords = sos.location?.coordinates
    ? `${sos.location.coordinates[1].toFixed(6)},  ${sos.location.coordinates[0].toFixed(6)}`
    : null;

  const handleCopyCoords = () => {
    if (coords) {
      navigator.clipboard.writeText(coords);
      toast.success('Đã sao chép tọa độ!');
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-0.5 h-4 bg-blue-500 rounded-full flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200">
          Thông tin yêu cầu
        </span>
      </div>

      {/* 2-col grid */}
      <div className="px-5 py-1 grid grid-cols-1 md:grid-cols-2 gap-x-10">
        {/* Left column */}
        <div>
          <Row label="Người gửi">
            <span className="font-normal">{sos.requesterName || 'Khách vãng lai'}</span>
          </Row>
          <Row label="Số điện thoại">
            <button
              type="button"
              onClick={() => handleCallPhone(sos.requesterPhone || undefined)}
              className="inline-flex items-center gap-1.5 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-normal"
            >
              {sos.requesterPhone || 'Chưa cập nhật'}
              {sos.requesterPhone && <Phone size={12} className="text-blue-500" />}
            </button>
          </Row>
          <Row label="Thời gian gửi">
            <span className="font-normal">{formatDate(sos.createdAt)}</span>
          </Row>
          <Row label="Nguồn gửi">
            <span className="font-normal">
              {sos.source === 'APP' ? 'Ứng dụng di động' : 'Trình giả lập (Web)'}
            </span>
          </Row>
          <Row label="Số người mắc kẹt">
            <span className="font-normal">{sos.trappedPeopleCount || 1} người</span>
          </Row>
        </div>

        {/* Right column */}
        <div>
          <Row label="Trạng thái">
            <span className={cn('font-normal inline-flex items-center gap-1.5', statusColors[sos.status as keyof typeof statusColors])}>
              {statusLabels[sos.status as keyof typeof statusLabels] || sos.status}
              <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
            </span>
          </Row>
          <Row label="Mức độ">
            <span className="font-normal text-red-600 dark:text-red-400">
              {severityLabels[sos.severity as keyof typeof severityLabels] || sos.severity}
            </span>
          </Row>
          <Row label="Mô tả tình huống">
            <span className="font-normal leading-relaxed">
              {sos.description || 'Không có mô tả chi tiết.'}
            </span>
          </Row>
          <Row label="Vị trí tọa độ">
            {coords ? (
              <button
                type="button"
                onClick={handleCopyCoords}
                className="inline-flex items-center gap-1.5 text-gray-900 dark:text-white hover:text-blue-600 transition-colors font-normal font-mono text-sm"
              >
                {coords}
                <Copy size={11} className="text-gray-400 hover:text-blue-500" />
              </button>
            ) : <span className="text-gray-400">—</span>}
          </Row>
        </div>
      </div>
    </div>
  );
}
