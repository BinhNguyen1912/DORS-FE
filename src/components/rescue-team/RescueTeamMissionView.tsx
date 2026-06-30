import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Phone,
  Users,
  AlertTriangle,
  Clock,
  Loader2,
  Shield,
  Activity,
  User as UserIcon,
} from 'lucide-react';
import { rescueTeamApi, sosApi } from '../../apis';
import { useAuthStore, toast } from '../../stores';
import { useSocket } from '../../providers/SocketProvider';
import { DISPATCH_EVENTS } from '../../constants/websocket.constant';
import { cn } from '../../lib/utils';

export default function RescueTeamMissionView() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { dispatchSocket, joinTeamRoom } = useSocket();

  const [activeOffer, setActiveOffer] = useState<{
    sosId: number;
    latitude: number;
    longitude: number;
    severity: string;
    requestType: string;
    description: string;
    timeoutSeconds: number;
    createdAt: number; // local time when offer received
  } | null>(null);

  const [offerSecondsLeft, setOfferSecondsLeft] = useState<number>(0);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // 1. Fetch all teams in the province to find the user's team
  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['my-rescue-team-info', user?.provinceId],
    queryFn: () => rescueTeamApi.getAll({ page: 1, limit: 100, provinceId: user?.provinceId }),
    enabled: !!user?.provinceId,
  });

  const myTeam = useMemo(() => {
    if (!teamsData?.data || !user) return null;
    return teamsData.data.find(
      (t: any) => t.leaderId === user.id || (t as any).leader?.id === user.id || t.leaderName === user.fullName
    );
  }, [teamsData, user]);

  // Join WebSocket room for the team
  useEffect(() => {
    if (myTeam?.id) {
      joinTeamRoom(myTeam.id);
    }
  }, [myTeam?.id, dispatchSocket]);

  // 2. Fetch active SOS missions assigned to this team
  const { data: sosList, isLoading: isLoadingSos } = useQuery({
    queryKey: ['my-active-sos-missions', myTeam?.id],
    queryFn: () => sosApi.getAll({ provinceId: user?.provinceId, limit: 100 }),
    enabled: !!myTeam?.id,
  });

  const activeMission = useMemo(() => {
    if (!sosList?.data || !myTeam) return null;
    return sosList.data.find(
      (s: any) =>
        s.assignedTeamId === myTeam.id &&
        (s.status === 'DISPATCHED' || s.status === 'ON_SITE')
    );
  }, [sosList, myTeam]);

  // 3. Socket event listeners for Claim Offers
  useEffect(() => {
    if (!dispatchSocket || !myTeam?.id) return;

    const handleSosOffer = (offer: any) => {
      console.log('📩 [WS] Nhận được lời mời cứu hộ:', offer);
      setActiveOffer({
        ...offer,
        createdAt: Date.now(),
      });
      setOfferSecondsLeft(offer.timeoutSeconds || 30);
      toast.info(`🔔 Lời mời cứu hộ mới cho ca SOS-#${offer.sosId}!`, 8000);
    };

    const handleOfferClaimed = (payload: { sosId: number; assignedTeamId: number }) => {
      if (activeOffer && activeOffer.sosId === payload.sosId) {
        console.log('⚡ [WS] Lời mời đã được tiếp nhận bởi đội:', payload.assignedTeamId);
        setActiveOffer(null);
        queryClient.invalidateQueries({ queryKey: ['my-active-sos-missions'] });
      }
    };

    const handleClaimResult = (result: { sosId: number; success: boolean; message: string }) => {
      console.log('🏆 [WS] Kết quả tiếp nhận:', result);
      if (result.success) {
        toast.success(result.message);
        setActiveOffer(null);
        queryClient.invalidateQueries({ queryKey: ['my-active-sos-missions'] });
      } else {
        toast.error(result.message);
      }
    };

    const handleAssigned = (payload: any) => {
      console.log('🚒 [WS] Được gán nhiệm vụ mới:', payload);
      queryClient.invalidateQueries({ queryKey: ['my-active-sos-missions'] });
      setActiveOffer(null);
    };

    dispatchSocket.on(DISPATCH_EVENTS.SOS_OFFER, handleSosOffer);
    dispatchSocket.on(DISPATCH_EVENTS.SOS_OFFER_CLAIMED, handleOfferClaimed);
    dispatchSocket.on(DISPATCH_EVENTS.SOS_CLAIM_RESULT, handleClaimResult);
    dispatchSocket.on(DISPATCH_EVENTS.TEAM_ASSIGNED, handleAssigned);

    return () => {
      dispatchSocket.off(DISPATCH_EVENTS.SOS_OFFER, handleSosOffer);
      dispatchSocket.off(DISPATCH_EVENTS.SOS_OFFER_CLAIMED, handleOfferClaimed);
      dispatchSocket.off(DISPATCH_EVENTS.SOS_CLAIM_RESULT, handleClaimResult);
      dispatchSocket.off(DISPATCH_EVENTS.TEAM_ASSIGNED, handleAssigned);
    };
  }, [dispatchSocket, myTeam?.id, activeOffer]);

  // 4. Timer for the active offer countdown
  useEffect(() => {
    if (!activeOffer) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeOffer.createdAt) / 1000);
      const remaining = (activeOffer.timeoutSeconds || 30) - elapsed;
      if (remaining <= 0) {
        setActiveOffer(null);
        clearInterval(interval);
      } else {
        setOfferSecondsLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeOffer]);

  // 5. Claim mutation (Client -> Server via socket)
  const handleClaim = () => {
    if (!dispatchSocket || !activeOffer || !myTeam) return;
    console.log(`⚡ Emit claims for SOS ${activeOffer.sosId} from Team ${myTeam.id}`);
    dispatchSocket.emit(DISPATCH_EVENTS.SOS_CLAIM, {
      sosId: activeOffer.sosId,
      teamId: myTeam.id,
    });
  };

  // 6. Update SOS Status mutation (ON_SITE, RESOLVED)
  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string; resolutionNotes?: string }) => {
      if (!activeMission) throw new Error('No active mission');
      return sosApi.updateStatus(activeMission.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-active-sos-missions'] });
      setResolutionNotes('');
      toast.success('Cập nhật trạng thái nhiệm vụ thành công!');
    },
    onError: (err: any) => toast.api(err, 'Lỗi khi cập nhật trạng thái'),
  });

  const handleCallPhone = (phone?: string) => {
    if (phone) {
      window.open(`tel:${phone}`);
      toast.info(`Đang gọi: ${phone}`);
    } else {
      toast.error('Không tìm thấy số điện thoại!');
    }
  };

  if (isLoadingTeams || isLoadingSos) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Đang đồng bộ phòng điều khiển cứu hộ...</span>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 text-center shadow-md">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Không tìm thấy Đội Cứu Hộ</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Tài khoản của bạn ({user?.fullName}) chưa được liên kết là Đội trưởng của bất kỳ đội cứu hộ nào trong cơ sở dữ liệu.
        </p>
      </div>
    );
  }

  const isTeamAvailable = myTeam.status === 'ACTIVE' || (myTeam.status as string) === 'AVAILABLE';

  return (
    <div className="space-y-6 relative">
      {/* Team Profile header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            {myTeam.teamType}
          </span>
          <h1 className="text-2xl font-black mt-1.5">{myTeam.name}</h1>
          <p className="text-white/80 text-xs mt-1 font-normal flex items-center gap-1.5">
            <MapPin size={13} /> {myTeam.baseLocationAddress || 'Chưa cập nhật'}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/10 px-4 py-3 rounded-xl border border-white/15">
          <div className="text-left">
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Trạng thái đội</p>
            <p className="text-sm font-extrabold flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isTeamAvailable ? 'bg-green-400 animate-pulse' : 'bg-amber-400'
                )}
              />
              {isTeamAvailable ? 'Sẵn sàng chiến đấu' : 'Đang làm nhiệm vụ'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Mission Control Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active mission or Standby view */}
        <div className="lg:col-span-8">
          {activeMission ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Activity className="text-rose-500 animate-pulse" size={20} />
                  <div>
                    <h2 className="text-base font-extrabold text-rose-700 dark:text-rose-400">
                      NHIỆM VỤ ĐANG THỰC HIỆN
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase mt-0.5">
                      SOS-2024-#{activeMission.id} · Trạng thái:{' '}
                      <span className="font-extrabold">
                        {activeMission.status === 'DISPATCHED' ? 'Đã điều phối' : 'Đã đến hiện trường'}
                      </span>
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2.5 py-0.5 text-xs font-bold rounded-full uppercase border',
                    activeMission.severity === 'CRITICAL'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : activeMission.severity === 'HIGH'
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  )}
                >
                  {activeMission.severity}
                </span>
              </div>

              {/* SOS Details */}
              <div className="p-6 space-y-6">
                {/* Info row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-100 dark:border-gray-700 pb-5">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Người yêu cầu</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <UserIcon size={14} className="text-gray-400" />
                      {activeMission.requesterName || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Số điện thoại liên hệ</span>
                    <button
                      onClick={() => handleCallPhone(activeMission.requesterPhone)}
                      className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                    >
                      <Phone size={14} />
                      {activeMission.requesterPhone || 'Không có'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Số người gặp nạn</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Users size={14} className="text-gray-400" />
                      {activeMission.trappedPeopleCount || 0} người
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Mô tả tình huống</h3>
                  <div className="bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300">
                    {activeMission.description || 'Không có mô tả chi tiết.'}
                  </div>
                </div>

                {activeMission.imageUrls && activeMission.imageUrls.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Hình ảnh hiện trường</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {activeMission.imageUrls.map((url: string, index: number) => (
                        <a key={index} href={url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img src={url} alt={`Hiện trường ${index + 1}`} className="w-full h-40 object-cover hover:scale-105 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Update Action Forms */}
                <div className="bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-850 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                    <Activity className="text-blue-500" size={16} />
                    Cập nhật tiến trình cứu hộ
                  </h3>

                  {activeMission.status === 'DISPATCHED' ? (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">
                        Đội của bạn đã được gán vào ca cứu nạn này. Vui lòng di chuyển tới hiện trường ngay lập tức và xác nhận khi đã tiếp cận.
                      </p>
                      <button
                        onClick={() => updateStatusMutation.mutate({ status: 'ON_SITE' })}
                        disabled={updateStatusMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:bg-blue-300 shadow-sm"
                      >
                        {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        ĐÃ TIẾP CẬN HIỆN TRƯỜNG
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Ghi chú / Kết quả xử lý cứu nạn (Bắt buộc)
                        </label>
                        <textarea
                          rows={3}
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Mô tả kết quả ứng cứu, tình trạng sức khỏe nạn nhân, hoặc số lượng người đã cứu thành công..."
                          className="w-full text-sm bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            status: 'RESOLVED',
                            resolutionNotes: resolutionNotes.trim() || undefined,
                          })
                        }
                        disabled={updateStatusMutation.isPending || !resolutionNotes.trim()}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-350 text-white font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:cursor-not-allowed"
                      >
                        {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        HOÀN THÀNH NHIỆM VỤ CỨU HỘ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 animate-pulse">
                  <Shield size={32} />
                </div>
                <div className="absolute inset-0 w-16 h-16 border-2 border-green-500 rounded-full animate-ping opacity-25" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                ĐANG Ở CHẾ ĐỘ SẴN SÀNG
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                Đội của bạn hiện tại chưa có nhiệm vụ được phân công. Hãy duy trì kết nối mạng để nhận lời mời cứu hộ khẩn cấp ngay khi có cuộc gọi SOS mới phát sinh.
              </p>
            </div>
          )}
        </div>

        {/* Info & stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-left">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="text-indigo-500" size={16} />
              Thông số đội ({myTeam.name})
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">Chỉ huy đội</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{myTeam.leaderName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">SĐT chỉ huy</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{myTeam.leaderPhone}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">Số ca cứu hộ xong</span>
                <span className="text-xs font-bold text-green-600">{myTeam.missionsCount || 0} ca</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Offer Live Alert Overlay */}
      {activeOffer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border-2 border-amber-500 shadow-2xl p-6 text-left animate-scale-up">
            <div className="flex items-center gap-3 text-amber-600 mb-4 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider">
                  Mời nhận ca cứu hộ khẩn cấp!
                </h3>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Top 3 đội tối ưu nhất đang được mời thầu cứu hộ
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 dark:bg-gray-950 p-4 rounded-xl border border-slate-100 dark:border-gray-800 text-sm">
              <div className="flex justify-between border-b border-slate-100 dark:border-gray-800 pb-2">
                <span className="text-gray-400 font-medium">Mã yêu cầu:</span>
                <span className="font-extrabold text-blue-600">SOS-2024-#{activeOffer.sosId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-gray-800 pb-2">
                <span className="text-gray-400 font-medium">Loại sự cố:</span>
                <span className="font-extrabold text-gray-900 dark:text-white uppercase">
                  {activeOffer.requestType}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-gray-800 pb-2">
                <span className="text-gray-400 font-medium">Mức độ khẩn cấp:</span>
                <span className="font-extrabold text-rose-600 uppercase">{activeOffer.severity}</span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-medium">Mô tả chi tiết:</span>
                <p className="text-gray-700 dark:text-gray-300 text-xs italic bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-slate-100 dark:border-gray-800 mt-1">
                  {activeOffer.description || 'Không có mô tả chi tiết'}
                </p>
              </div>
            </div>

            {/* Countdown timer progress bar */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between items-center text-xs font-extrabold">
                <span className="text-gray-400 uppercase">Hạn chót tiếp nhận:</span>
                <span className="text-amber-600 animate-pulse">{offerSecondsLeft} giây</span>
              </div>
              <div className="w-full bg-gray-250 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-1000 rounded-full"
                  style={{ width: `${(offerSecondsLeft / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => setActiveOffer(null)}
                className="py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-extrabold text-gray-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                BỎ QUA
              </button>
              <button
                onClick={handleClaim}
                className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-amber-500/10"
              >
                <Clock className="w-4 h-4" />
                NHẬN CỨU HỘ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
