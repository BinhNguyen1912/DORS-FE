import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle } from 'lucide-react';
import { sosApi } from '../../../apis';
import Loader from '../../../components/common/Loader';
import { cn } from '../../../lib/utils';
import { toast } from '../../../stores';
import {
  severityColors,
  severityLabels,
  type SosDetailModalProps,
} from './SosDetailModal.types';
import SosRequesterInfoPanel from './SosRequesterInfoPanel';
import SosAttachmentPanel from './SosAttachmentPanel';
import SosDispatchPanel from './SosDispatchPanel';
import SosTimelinePanel from './SosTimelinePanel';
import SosActionPanel from './SosActionPanel';

export default function SosDetailModal({ id, isOpen, onClose }: SosDetailModalProps) {
  const queryClient = useQueryClient();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // 1. Fetch SOS details
  const { data: sos, isLoading, error } = useQuery({
    queryKey: ['sos-request-detail', id],
    queryFn: () => sosApi.getById(id),
    enabled: isOpen && !!id,
  });

  // 2. Fetch timeline history
  const { data: timelineData } = useQuery({
    queryKey: ['sos-request-timeline', id],
    queryFn: async () => {
      try { return await sosApi.getTimeline(id); } catch { return null; }
    },
    enabled: isOpen && !!id,
  });

  // 3. Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string; resolutionNotes?: string }) =>
      sosApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos-request-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['sos-request-timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['db-sos-requests'] });
      toast.success('Cập nhật trạng thái SOS thành công!');
      setIsUpdatingStatus(false);
      setSelectedNewStatus('');
      setResolutionNotes('');
    },
    onError: (err: any) => toast.api(err, 'Lỗi khi cập nhật trạng thái'),
  });

  // Format date helper
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('vi-VN');
    return `${time} ${date}`;
  };

  // Build timeline — prefer API data, fallback to derived
  const timeline = useMemo(() => {
    if (timelineData && Array.isArray(timelineData) && timelineData.length > 0) {
      return timelineData.map((item: any) => ({
        ...item,
        time: item.time ? formatDate(item.time) : '—',
      }));
    }
    if (!sos) return [];

    const list: any[] = [];
    list.push({
      time: formatDate(sos.createdAt),
      title: 'SOS được tạo',
      desc: sos.source === 'WEB'
        ? 'Khách gửi yêu cầu khẩn cấp qua cổng web.'
        : 'Người dùng gửi yêu cầu khẩn cấp qua ứng dụng di động.',
      eventType: 'CREATED',
    });
    if (sos.assignedTeamId) {
      list.push({
        time: formatDate(sos.updatedAt || sos.createdAt),
        title: 'Đã tiếp nhận',
        desc: 'Đội điều phối đã tiếp nhận và phân công đội cứu hộ phù hợp.',
        eventType: 'TEAM_ASSIGNED',
        teamName: sos.assignedTeam?.name,
      });
    }
    if (sos.status === 'ON_SITE' || sos.status === 'RESOLVED') {
      list.push({
        time: formatDate(sos.updatedAt),
        title: 'Đã tiếp cận hiện trường',
        desc: 'Đội cứu hộ đã có mặt tại hiện trường.',
        eventType: 'STATUS_CHANGED',
        toStatus: 'ON_SITE',
      });
    }
    if (sos.status === 'RESOLVED') {
      list.push({
        time: formatDate(sos.updatedAt),
        title: 'Đã xử lý xong',
        desc: sos.resolutionNotes || 'Nhiệm vụ cứu hộ hoàn thành.',
        eventType: 'RESOLVED',
      });
    }
    if (sos.status === 'CANCELLED') {
      list.push({
        time: formatDate(sos.updatedAt),
        title: 'Yêu cầu bị hủy',
        desc: sos.resolutionNotes || 'Yêu cầu SOS đã bị hủy.',
        eventType: 'CANCELLED',
        isCancelled: true,
      });
    }
    return list;
  }, [sos, timelineData]);

  if (!isOpen) return null;

  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewStatus) return;
    updateStatusMutation.mutate({
      status: selectedNewStatus,
      resolutionNotes: resolutionNotes.trim() || undefined,
    });
  };

  const handleCallPhone = (phone?: string) => {
    if (phone) {
      window.open(`tel:${phone}`);
      toast.info(`Đang gọi đến số: ${phone}`);
    } else {
      toast.error('Không tìm thấy số điện thoại!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Modal card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] text-left border border-gray-200 dark:border-gray-800">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                  {sos ? `SOS-2024-${sos.id}` : 'SOS Request'}
                </h2>
                {sos && (
                  <span className={cn(
                    'px-2.5 py-0.5 text-xs font-semibold rounded-md border',
                    severityColors[sos.severity as keyof typeof severityColors]
                  )}>
                    {severityLabels[sos.severity as keyof typeof severityLabels] || sos.severity}
                  </span>
                )}
              </div>
              {sos && (
                <p className="text-xs text-gray-400 dark:text-gray-500 font-normal mt-0.5">
                  Tạo lúc {formatDate(sos.createdAt)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader size="md" colorClass="text-blue-500" text="Đang tải dữ liệu chi tiết SOS..." />
            </div>
          ) : error || !sos ? (
            <div className="py-20 text-center text-gray-500 max-w-sm mx-auto">
              <AlertCircle className="mx-auto text-red-500 mb-3" size={36} />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Lỗi tải dữ liệu</p>
              <p className="text-xs text-gray-400 mt-1 font-normal">
                Vui lòng kiểm tra kết nối API hoặc báo quản trị viên.
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* 1. Thông tin yêu cầu */}
              <SosRequesterInfoPanel
                sos={sos}
                formatDate={formatDate}
                handleCallPhone={handleCallPhone}
              />

              {/* 2. Thông tin điều phối */}
              <SosDispatchPanel sos={sos} handleCallPhone={handleCallPhone} />

              {/* 3. Hình ảnh + Lịch sử (2 cols) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SosAttachmentPanel imageUrls={sos.imageUrls} />
                <SosTimelinePanel timeline={timeline} />
              </div>

              {/* 4. Hành động */}
              <SosActionPanel
                sos={sos}
                isUpdatingStatus={isUpdatingStatus}
                setIsUpdatingStatus={setIsUpdatingStatus}
                selectedNewStatus={selectedNewStatus}
                setSelectedNewStatus={setSelectedNewStatus}
                resolutionNotes={resolutionNotes}
                setResolutionNotes={setResolutionNotes}
                isPending={updateStatusMutation.isPending}
                handleSubmit={handleUpdateStatusSubmit}
                handleCallPhone={handleCallPhone}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
