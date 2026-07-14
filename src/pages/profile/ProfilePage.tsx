import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Shield,
  Bell,
  Laptop,
  ScrollText,
  Pencil,
  X,
  CheckCircle2,
  Camera,
  ChevronRight,
  Home,
  LogOut,
  Smartphone,
  Globe,
} from 'lucide-react';
import { useAuthStore, toast } from '../../stores';
import { userApi } from '../../apis';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../constants';

const roleTranslations: Record<string, string> = {
  SYSTEM_ADMIN: 'Quản trị viên hệ thống',
  PROVINCE_ADMIN: 'Quản trị viên cấp tỉnh',
  COMMUNITY_LEADER: 'Trưởng cộng đồng',
  RESCUE_TEAM_LEADER: 'Đội trưởng cứu hộ',
  USER: 'Người dùng',
  VOLUNTEER: 'Tình nguyện viên',
};

const genderLabels: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

type Section = 'basic' | 'contact' | 'security' | 'notifications' | 'devices' | 'logs';

export default function ProfilePage() {
  const { user, setAuth, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<Section>('basic');
  const [editBasic, setEditBasic] = useState(false);
  const [editContact, setEditContact] = useState(false);
  const [showConfirmLogoutCurrent, setShowConfirmLogoutCurrent] = useState<number | null>(null);
  const [showConfirmLogoutAll, setShowConfirmLogoutAll] = useState(false);

  // Form state — basic
  const [formBasic, setFormBasic] = useState({
    fullName: user?.fullName || '',
    dateOfBirth: user?.dateOfBirth?.slice(0, 10) || '',
    gender: user?.gender || 'MALE',
    addressDetail: user?.addressDetail || '',
    avatarUrl: user?.avatarUrl || '',
  });

  // Form state — contact
  const [formContact, setFormContact] = useState({
    phone: user?.phone || '',
    email: user?.email || '',
    zalo: '',
    telegram: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const accessToken = useAuthStore(s => s.accessToken);

  // Fetch fresh user data
  const { data: freshUser } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => userApi.getById(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const displayUser = freshUser || user;
  const initials = displayUser?.fullName
    ? displayUser.fullName.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase()
    : 'AD';
  const roleText = displayUser?.role ? (roleTranslations[displayUser.role] || displayUser.role) : 'Quản trị viên';

  // Fetch user login devices
  const { data: devicesList, isLoading: loadingDevices } = useQuery({
    queryKey: ['user-devices', user?.id],
    queryFn: () => userApi.getDevices(),
    enabled: activeSection === 'devices' && !!user?.id,
  });

  // Mutation — update basic info
  const updateBasicMutation = useMutation({
    mutationFn: (data: Partial<typeof formBasic>) => userApi.update(user!.id, data as any),
    onSuccess: (updated) => {
      const mergedUser = { ...user, ...updated } as any;
      setAuth(mergedUser, accessToken!);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Cập nhật thông tin cơ bản thành công!');
      setEditBasic(false);
    },
    onError: (err: any) => toast.api(err, 'Lỗi cập nhật thông tin'),
  });

  // Mutation — update contact info
  const updateContactMutation = useMutation({
    mutationFn: (data: { phone?: string; email?: string }) => userApi.update(user!.id, data as any),
    onSuccess: (updated) => {
      const mergedUser = { ...user, ...updated } as any;
      setAuth(mergedUser, accessToken!);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Cập nhật thông tin liên lạc thành công!');
      setEditContact(false);
    },
    onError: (err: any) => toast.api(err, 'Lỗi cập nhật thông tin liên lạc'),
  });

  // Mutation — delete device
  const deleteDeviceMutation = useMutation({
    mutationFn: (id: number) => userApi.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-devices', user?.id] });
      toast.success('Đã gỡ thiết bị di động thành công!');
    },
    onError: (err: any) => toast.api(err, 'Lỗi khi gỡ thiết bị'),
  });

  // Mutation — revoke session
  const revokeSessionMutation = useMutation({
    mutationFn: (id: number) => userApi.revokeSession(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-devices', user?.id] });
      toast.success('Đã đăng xuất thiết bị thành công!');
      
      const revokedSession = devicesList?.find((d: any) => d.id === variables && d.type === 'WEB');
      if (revokedSession?.isCurrent) {
        logout();
      }
    },
    onError: (err: any) => toast.api(err, 'Lỗi khi đăng xuất thiết bị'),
  });

  // Mutation — revoke all sessions
  const revokeAllSessionsMutation = useMutation({
    mutationFn: () => userApi.revokeAllSessions(),
    onSuccess: () => {
      toast.success('Đã đăng xuất khỏi tất cả thiết bị thành công!');
      logout();
    },
    onError: (err: any) => toast.api(err, 'Lỗi khi đăng xuất các thiết bị'),
  });

  const handleOpenBasic = () => {
    setFormBasic({
      fullName: displayUser?.fullName || '',
      dateOfBirth: displayUser?.dateOfBirth?.slice(0, 10) || '',
      gender: displayUser?.gender || 'MALE',
      addressDetail: displayUser?.addressDetail || '',
      avatarUrl: displayUser?.avatarUrl || '',
    });
    setEditBasic(true);
  };

  const handleOpenContact = () => {
    setFormContact({
      phone: displayUser?.phone || '',
      email: displayUser?.email || '',
      zalo: '',
      telegram: '',
    });
    setEditContact(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSelectAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File không được lớn hơn 2MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<{ url: string }>('/upload/single?folder=avatars', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = response.data?.url || (response.data as any)?.data?.url;
      if (url) {
        setFormBasic(prev => ({ ...prev, avatarUrl: url }));
        toast.success('Đã tải ảnh lên thành công. Nhấn Lưu thay đổi để hoàn tất!');
      } else {
        toast.error('Không nhận được URL ảnh từ máy chủ');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi tải ảnh lên máy chủ');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu mới nhập lại không khớp!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    try {
      setChangingPassword(true);
      await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.api(err, 'Mật khẩu cũ không chính xác hoặc xảy ra lỗi.');
    } finally {
      setChangingPassword(false);
    }
  };

  const sideMenu = [
    {
      group: 'Thông tin cá nhân',
      icon: User,
      active: activeSection === 'basic' || activeSection === 'contact',
      children: [
        { label: 'Thông tin cơ bản', section: 'basic' as Section },
        { label: 'Thông tin liên lạc', section: 'contact' as Section },
      ],
    },
    { group: 'Bảo mật', icon: Shield, active: activeSection === 'security', section: 'security' as Section, children: [] },
    { group: 'Thông báo', icon: Bell, active: activeSection === 'notifications', section: 'notifications' as Section, children: [] },
    { group: 'Thiết bị đăng nhập', icon: Laptop, active: activeSection === 'devices', section: 'devices' as Section, children: [] },
    { group: 'Nhật ký hoạt động', icon: ScrollText, active: activeSection === 'logs', section: 'logs' as Section, children: [] },
  ];

  return (
    <div className="min-h-0 flex flex-col gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
          <Home size={12} /> Trang chủ
        </Link>
        <ChevronRight size={12} />
        <span className="text-gray-900 dark:text-white font-semibold">Hồ sơ cá nhân</span>
      </div>

      <div className="pb-[-10px]">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Hồ sơ cá nhân</h1>
      </div>

      <div className="flex gap-5 items-start">
        {/* ── Sidebar ── */}
        <aside className="w-52 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {sideMenu.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.group}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.section) {
                      setActiveSection(item.section);
                    } else if (item.group === 'Thông tin cá nhân') {
                      setActiveSection('basic');
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold transition-colors text-left border-0 bg-transparent cursor-pointer',
                    item.active
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon size={15} className={item.active ? 'text-blue-500' : 'text-gray-400'} />
                  {item.group}
                </button>
                {item.active && item.children && item.children.length > 0 && (
                  <div className="pl-4 border-l-2 border-blue-100 dark:border-blue-800 ml-5 mb-1 flex flex-col">
                    {item.children.map((child) => (
                      <button
                        key={child.section}
                        type="button"
                        onClick={() => setActiveSection(child.section)}
                        className={cn(
                          'text-left px-3 py-2 text-xs transition-colors rounded-lg border-0 bg-transparent cursor-pointer',
                          activeSection === child.section
                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                        )}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 space-y-4 min-w-0">
          {activeSection === 'security' && (
            <div className="space-y-4">
              {/* Form đổi mật khẩu */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden text-left">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">Đổi mật khẩu</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Để đảm bảo an toàn, vui lòng sử dụng mật khẩu mạnh có ít nhất 6 ký tự.
                  </p>
                </div>
                <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Nhập lại mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Xác nhận lại mật khẩu mới"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400 font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm cursor-pointer border-0"
                  >
                    {changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              </section>

              {/* Xác thực 2 lớp */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden text-left p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">Xác thực 2 yếu tố (2FA)</h3>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-md leading-relaxed">
                      Thêm một lớp bảo mật cho tài khoản của bạn. Khi kích hoạt, bạn sẽ cần nhập một mã xác nhận gửi qua ứng dụng Google Authenticator hoặc tin nhắn SMS để đăng nhập.
                    </p>
                  </div>
                  <button type="button" className="px-3.5 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-transparent cursor-pointer">
                    Kích hoạt
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeSection === 'devices' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden text-left">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center gap-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">Thiết bị đăng nhập</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Quản lý danh sách các thiết bị di động và các phiên trình duyệt web đã đăng nhập tài khoản của bạn.
                  </p>
                </div>
                {devicesList && devicesList.length > 0 && (
                  <button
                    type="button"
                    disabled={revokeAllSessionsMutation.isPending}
                    onClick={() => {
                      setShowConfirmLogoutAll(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white border border-rose-250 hover:bg-rose-600 rounded-lg transition-colors cursor-pointer bg-transparent disabled:opacity-50 flex-shrink-0"
                  >
                    <LogOut size={12} />
                    <span>Đăng xuất tất cả</span>
                  </button>
                )}
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {loadingDevices ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : !devicesList || devicesList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    Không tìm thấy dữ liệu thiết bị hoạt động nào.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-105 dark:divide-slate-700/60">
                    {devicesList.map((d: any) => {
                      const IsMobile = d.type === 'MOBILE';
                      return (
                        <div key={d.key} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-gray-750 flex items-center justify-center text-slate-500 dark:text-gray-300">
                              {IsMobile ? <Smartphone size={20} /> : <Globe size={20} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{d.name}</span>
                                <span className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                                  d.isActive 
                                    ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400" 
                                    : "bg-slate-100 text-slate-500 dark:bg-gray-800"
                                )}>
                                  {d.isActive ? 'Đang hoạt động' : 'Ngoại tuyến'}
                                </span>
                                {d.isCurrent && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                    Thiết bị hiện tại
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-450 dark:text-gray-400 mt-1">
                                Hệ điều hành: <strong className="text-gray-600 dark:text-gray-250 font-medium">{d.os}</strong> 
                                {!IsMobile && <> • Địa chỉ IP: <strong className="text-gray-600 dark:text-gray-250 font-medium">{d.ipAddress}</strong></>}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                Hoạt động gần nhất: {new Date(d.lastActiveAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            disabled={deleteDeviceMutation.isPending || revokeSessionMutation.isPending}
                            onClick={() => {
                              if (IsMobile) {
                                deleteDeviceMutation.mutate(d.id);
                              } else {
                                if (d.isCurrent) {
                                  setShowConfirmLogoutCurrent(d.id);
                                } else {
                                  revokeSessionMutation.mutate(d.id);
                                }
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white border border-rose-250 hover:bg-rose-600 rounded-lg transition-colors cursor-pointer bg-transparent disabled:opacity-50"
                          >
                            <LogOut size={12} />
                            <span>Đăng xuất</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeSection === 'notifications' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden text-left">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Cấu hình nhận thông báo</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Tùy chỉnh các kênh và loại thông báo khẩn cấp mà bạn muốn nhận từ hệ thống cứu hộ.
                </p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { title: 'Thông báo cứu trợ khẩn cấp', desc: 'Nhận cảnh báo trực tiếp khi có yêu cầu SOS mới phát sinh tại địa bàn quản lý.', enabled: true },
                  { title: 'Cập nhật thời tiết cực đoan', desc: 'Bản tin cảnh báo thiên tai, mưa lũ diện rộng gửi qua SMS hoặc thông báo đẩy.', enabled: true },
                  { title: 'Nhật ký phân công nhiệm vụ', desc: 'Thông báo khi bạn được điều phối hoặc phân công làm trưởng nhóm cứu hộ hiện trường.', enabled: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start py-3 border-b border-slate-50 dark:border-slate-750 last:border-0">
                    <div className="max-w-md">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === 'logs' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden text-left">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Nhật ký hoạt động</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Nhật ký lưu lại các hành động bảo mật, cập nhật hồ sơ và phiên đăng nhập của bạn.
                </p>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {[
                    { action: 'Đổi mật khẩu tài khoản thành công', time: '10 phút trước', ip: '192.168.1.12' },
                    { action: 'Tải lên ảnh đại diện mới (avatar_v2.png)', time: 'Hôm nay, 11:28 AM', ip: '113.161.44.89' },
                    { action: 'Cập nhật Số điện thoại liên lạc', time: 'Hôm qua, 03:45 PM', ip: '113.161.44.89' },
                    { action: 'Đăng nhập hệ thống (Chrome Web / Windows)', time: '09/07/2026, 10:14 AM', ip: '192.168.1.12' },
                  ].map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2.5 border-b border-slate-50 dark:border-slate-750 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{log.action}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Địa chỉ IP: {log.ip}</p>
                      </div>
                      <span className="text-[10px] text-gray-400">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {(activeSection === 'basic' || activeSection === 'contact') && (
            <>
              {/* Thông tin cơ bản */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">Thông tin cơ bản</h2>
                  <button
                    type="button"
                    onClick={handleOpenBasic}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors bg-transparent cursor-pointer"
                  >
                    <Pencil size={12} /> Thay đổi
                  </button>
                </div>

                <div className="px-6 py-5">
                  {/* Avatar row */}
                  <div className="flex items-start gap-6 mb-6 pb-5 border-b border-dashed border-slate-105 dark:border-slate-700">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xl font-bold overflow-hidden">
                        {displayUser?.avatarUrl ? (
                          <img src={displayUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-5 h-5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center shadow">
                        <Camera size={10} className="text-gray-500" />
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pt-1 max-w-xs text-left">
                      Ảnh đại diện giúp người dùng khác nhận ra bạn và cũng giúp bạn nhận biết được rằng mình đã đăng nhập vào tài khoản
                    </p>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
                    {[
                      { label: 'Họ và tên', value: displayUser?.fullName },
                      { label: 'Tên đăng nhập', value: displayUser?.username },
                      { label: 'Email', value: displayUser?.email },
                      { label: 'Số điện thoại', value: displayUser?.phone },
                      { label: 'Chức vụ', value: roleText },
                      { label: 'Đơn vị', value: (displayUser as any)?.provinceName || 'Ủy ban nhân dân Thành phố Hồ Chí Minh' },
                      { label: 'Ngày sinh', value: displayUser?.dateOfBirth ? new Date(displayUser.dateOfBirth).toLocaleDateString('vi-VN') : '—' },
                      { label: 'Giới tính', value: displayUser?.gender ? genderLabels[displayUser.gender] || displayUser.gender : '—' },
                      { label: 'Địa chỉ', value: displayUser?.addressDetail || '—', full: true },
                    ].map(({ label, value, full }) => (
                      <div key={label} className={cn('flex items-start py-2 border-b border-slate-50 dark:border-slate-800 text-left', full && 'sm:col-span-2')}>
                        <span className="w-36 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">{label}</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Thông tin liên lạc */}
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="text-left">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Thông tin liên lạc</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Thông tin liên lạc giúp hệ thống và các đội cứu hộ có thể liên hệ với bạn khi cần thiết.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenContact}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0 ml-4 bg-transparent cursor-pointer"
                  >
                    <Pencil size={12} /> Thay đổi
                  </button>
                </div>

                <div className="px-6 py-5 space-y-0 text-left">
                  {[
                    {
                      label: 'Số điện thoại liên lạc',
                      value: displayUser?.phone || '—',
                      verified: displayUser?.phoneVerified,
                      link: false,
                    },
                    {
                      label: 'Email liên hệ',
                      value: displayUser?.email || '—',
                      verified: displayUser?.emailVerified,
                      link: false,
                    },
                    {
                      label: 'Zalo',
                      value: 'Chưa liên kết',
                      verified: false,
                      link: true,
                    },
                    {
                      label: 'Telegram',
                      value: 'Chưa liên kết',
                      verified: false,
                      link: true,
                    },
                  ].map(({ label, value, verified, link }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                      <span className="w-44 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">{label}</span>
                      <span className="flex-1 text-xs font-semibold text-gray-900 dark:text-white">{value}</span>
                      {verified ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 ml-2 whitespace-nowrap">
                          <CheckCircle2 size={12} className="text-green-500" /> Đã xác thực
                        </span>
                      ) : link ? (
                        <button type="button" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-2 whitespace-nowrap border-0 bg-transparent cursor-pointer">
                          Liên kết
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              {/* Lưu ý bảo mật */}
              <section className="relative bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-5 overflow-hidden text-white shadow">
                <div className="relative z-10 flex items-center gap-4 text-left">
                  <Shield size={36} className="text-blue-200 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold mb-1">Lưu ý bảo mật</p>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      Hãy đảm bảo thông tin cá nhân của bạn luôn được cập nhật chính xác để hệ thống có thể liên hệ và hỗ trợ bạn lập tức trong các tình huống khẩn cấp.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          Modal — Chỉnh sửa thông tin cơ bản
      ══════════════════════════════════════════ */}
      {editBasic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={() => setEditBasic(false)}>
          <div
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-slate-155 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideInUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Chỉnh sửa thông tin cơ bản</h3>
              <button type="button" onClick={() => setEditBasic(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-400 transition-colors border-0 bg-transparent cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row gap-6 p-6">
              {/* Left Column: Avatar Section */}
              <div className="flex flex-col items-center text-center space-y-4 md:w-1/3 md:border-r border-slate-105 dark:border-slate-800 md:pr-6">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 w-full text-left">
                  Ảnh đại diện
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div 
                  className="relative cursor-pointer group"
                  onClick={handleSelectAvatar}
                >
                  <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-300 text-2xl font-bold overflow-hidden">
                    {uploadingAvatar ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : null}
                    {formBasic.avatarUrl ? (
                      <img src={formBasic.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-85 transition-opacity" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-6 h-6 bg-white dark:bg-gray-700 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center shadow hover:scale-105 transition-transform">
                    <Camera size={12} className="text-gray-500" />
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 space-y-2">
                  <p>JPG, PNG tối đa 2MB</p>
                  <button 
                    type="button"
                    onClick={handleSelectAvatar}
                    disabled={uploadingAvatar}
                    className="px-4 py-1.5 border border-slate-200 dark:border-slate-755 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors text-xs disabled:opacity-50 cursor-pointer bg-transparent"
                  >
                    {uploadingAvatar ? 'Đang tải...' : 'Chọn ảnh'}
                  </button>
                </div>
              </div>

              {/* Right Column: Form Fields Section */}
              <div className="flex-1 space-y-4 text-left">
                {/* Họ và tên */}
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formBasic.fullName}
                    onChange={e => setFormBasic(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-left"
                  />
                </div>

                {/* Ngày sinh + Giới tính */}
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formBasic.dateOfBirth}
                      onChange={e => setFormBasic(p => ({ ...p, dateOfBirth: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formBasic.gender}
                      onChange={e => setFormBasic(p => ({ ...p, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' }))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium text-left"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>

                {/* Chức vụ (readonly) */}
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Chức vụ</label>
                  <div className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-slate-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 font-medium text-left">
                    {roleText}
                  </div>
                </div>

                {/* Đơn vị (readonly) */}
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Đơn vị</label>
                  <div className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-slate-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 font-medium text-left">
                    {(displayUser as any)?.provinceName || 'Ủy ban nhân dân Thành phố Hồ Chí Minh'}
                  </div>
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formBasic.addressDetail}
                    onChange={e => setFormBasic(p => ({ ...p, addressDetail: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none font-medium text-left"
                    placeholder="Nhập địa chỉ của bạn..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => setEditBasic(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-755 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-transparent cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => updateBasicMutation.mutate(formBasic)}
                disabled={updateBasicMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 cursor-pointer border-0"
              >
                {updateBasicMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Modal — Chỉnh sửa thông tin liên lạc
      ══════════════════════════════════════════ */}
      {editContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={() => setEditContact(false)}>
          <div
            className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-slate-150 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideInUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Chỉnh sửa thông tin liên lạc</h3>
              <button type="button" onClick={() => setEditContact(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-400 transition-colors border-0 bg-transparent cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Phone */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-left">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Số điện thoại liên lạc <span className="text-red-500">*</span>
                  </label>
                  {displayUser?.phoneVerified && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                      <CheckCircle2 size={12} className="text-green-500" /> Đã xác thực
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  value={formContact.phone}
                  onChange={e => setFormContact(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-left"
                />
              </div>

              {/* Email */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-left">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Email liên hệ <span className="text-red-500">*</span>
                  </label>
                  {displayUser?.emailVerified && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                      <CheckCircle2 size={12} className="text-green-500" /> Đã xác thực
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  value={formContact.email}
                  onChange={e => setFormContact(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-left"
                />
              </div>

              {/* Zalo */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 text-left">Zalo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formContact.zalo}
                    onChange={e => setFormContact(p => ({ ...p, zalo: e.target.value }))}
                    placeholder="Nhập số điện thoại Zalo"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400 font-medium text-left"
                  />
                  <button type="button" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap border-0 cursor-pointer">
                    Liên kết
                  </button>
                </div>
              </div>

              {/* Telegram */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 text-left dark:text-gray-300 mb-1.5">Telegram</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formContact.telegram}
                    onChange={e => setFormContact(p => ({ ...p, telegram: e.target.value }))}
                    placeholder="Nhập tên người dùng Telegram"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-755 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400 font-medium text-left"
                  />
                  <button type="button" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap border-0 cursor-pointer">
                    Liên kết
                  </button>
                </div>
              </div>

              {/* Alert message / Note */}
              <div className="flex items-start gap-2.5 p-3 bg-blue-50/70 dark:bg-blue-900/10 rounded-lg">
                <Shield size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium text-left">
                  Thông tin liên lạc sẽ được sử dụng để nhận thông báo, xác nhận yêu cầu và hỗ trợ khẩn cấp.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => setEditContact(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-755 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-transparent cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => updateContactMutation.mutate({ phone: formContact.phone, email: formContact.email })}
                disabled={updateContactMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 cursor-pointer border-0"
              >
                {updateContactMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Modal — Xác nhận đăng xuất thiết bị hiện tại
      ══════════════════════════════════════════ */}
      {showConfirmLogoutCurrent !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={() => setShowConfirmLogoutCurrent(null)}>
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-slate-150 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideInUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cảnh báo bảo mật</h3>
              <button type="button" onClick={() => setShowConfirmLogoutCurrent(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-400 transition-colors border-0 bg-transparent cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-left">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
                Bạn đang yêu cầu đăng xuất khỏi thiết bị hiện tại đang hoạt động.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-450 mt-2 leading-relaxed">
                Hành động này sẽ hủy phiên đăng nhập (Session) hiện tại ngay lập tức và bạn sẽ phải đăng nhập lại từ đầu để tiếp tục sử dụng hệ thống. Bạn có chắc chắn muốn tiếp tục không?
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => setShowConfirmLogoutCurrent(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-755 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-transparent cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showConfirmLogoutCurrent !== null) {
                    revokeSessionMutation.mutate(showConfirmLogoutCurrent);
                    setShowConfirmLogoutCurrent(null);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer border-0"
              >
                Đăng xuất ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Modal — Xác nhận đăng xuất TẤT CẢ thiết bị
      ══════════════════════════════════════════ */}
      {showConfirmLogoutAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={() => setShowConfirmLogoutAll(false)}>
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-slate-150 dark:border-slate-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideInUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Xác nhận đăng xuất tất cả</h3>
              <button type="button" onClick={() => setShowConfirmLogoutAll(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-400 transition-colors border-0 bg-transparent cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-left">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
                Bạn đang yêu cầu đăng xuất khỏi TẤT CẢ các thiết bị di động và phiên trình duyệt web.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-455 mt-2 leading-relaxed">
                Hành động này sẽ hủy tất cả các phiên đăng nhập đang hoạt động của tài khoản này ngay lập tức. Thiết bị hiện tại của bạn cũng sẽ bị đăng xuất và bạn sẽ được chuyển hướng về trang đăng nhập. Bạn có chắc chắn muốn tiếp tục?
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => setShowConfirmLogoutAll(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-755 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-transparent cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  revokeAllSessionsMutation.mutate();
                  setShowConfirmLogoutAll(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer border-0"
              >
                Đăng xuất tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
