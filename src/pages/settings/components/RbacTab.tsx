import { useState } from 'react';
import { Save, Shield, Users, MapPin, CheckSquare, Square } from 'lucide-react';
import { toast } from '../../../stores';

type RbacSubTab = 'roles' | 'matrix' | 'scope';

interface RoleDetail {
  code: string;
  name: string;
  level: string;
  description: string;
  color: string;
}

interface PermissionRow {
  moduleCode: string;
  moduleName: string;
  permissions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    approve: boolean;
  };
}

export default function RbacTab() {
  const [subTab, setSubTab] = useState<RbacSubTab>('roles');

  // Seed roles list
  const roles: RoleDetail[] = [
    { code: 'SUPER_ADMIN', name: 'Quản trị viên Hệ thống', level: 'Trung ương', description: 'Toàn quyền cấu hình hệ thống, quản lý cơ sở dữ liệu và tài khoản quản trị cấp tỉnh.', color: 'border-red-500 text-red-650 bg-red-50/50' },
    { code: 'PROVINCE_ADMIN', name: 'Quản trị viên Cấp Tỉnh', level: 'Cấp Tỉnh', description: 'Quản lý toàn bộ thông tin thiên tai, cứu hộ và người dùng thuộc phạm vi Tỉnh/Thành phố được chỉ định.', color: 'border-amber-500 text-amber-600 bg-amber-50/50' },
    { code: 'DISTRICT_ADMIN', name: 'Điều phối viên Cấp Huyện', level: 'Cấp Quận/Huyện', description: 'Giám sát các vụ thiên tai, điều phối nhân lực và quản lý các đội cứu hộ trong địa bàn Quận/Huyện.', color: 'border-blue-500 text-blue-600 bg-blue-50/50' },
    { code: 'COMMUNE_ADMIN', name: 'Cán bộ Cấp Xã/Phường', level: 'Cấp Xã/Phường', description: 'Tiếp nhận yêu cầu SOS từ người dân, xác minh thực tế địa bàn và cập nhật trực tiếp trạng thái thiên tai.', color: 'border-teal-500 text-teal-600 bg-teal-50/50' },
    { code: 'TEAM_LEADER', name: 'Đội trưởng Cứu Hộ', level: 'Cấp Đội', description: 'Quản lý thành viên đội, phương tiện chuyên dụng, nhận nhiệm vụ cứu nạn và báo cáo tiến độ trực tiếp.', color: 'border-indigo-500 text-indigo-600 bg-indigo-50/50' },
    { code: 'RESCUE_MEMBER', name: 'Thành viên Đội Cứu Hộ', level: 'Cấp Đội', description: 'Tham gia trực tiếp các hoạt động tìm kiếm cứu nạn, cập nhật vị trí trực tuyến trên bản đồ hành trình.', color: 'border-slate-500 text-slate-650 bg-slate-50/50' },
    { code: 'VOLUNTEER', name: 'Tình nguyện viên', level: 'Cá nhân', description: 'Hỗ trợ công tác hậu cần, cứu trợ nhu yếu phẩm và vận chuyển đồ tiếp tế tới khu vực cách ly.', color: 'border-purple-500 text-purple-600 bg-purple-50/50' },
    { code: 'MEDICAL_TEAM', name: 'Đội y tế khẩn cấp', level: 'Tổ chức', description: 'Sơ cứu vết thương, chăm sóc y tế khẩn cấp tại hiện trường và điều phối xe cấp cứu chuyển viện.', color: 'border-rose-500 text-rose-650 bg-rose-50/50' },
    { code: 'FIRE_DEPARTMENT', name: 'Lực lượng PCCC & CNCH', level: 'Tổ chức', description: 'Triển khai xe cứu hỏa, cano chuyên dụng và thiết bị phá dỡ cơ giới tại vùng ngập lụt hiểm trở.', color: 'border-orange-500 text-orange-600 bg-orange-50/50' },
    { code: 'CITIZEN', name: 'Người dân / Công dân', level: 'Cá nhân', description: 'Gửi yêu cầu khẩn cấp SOS kèm tọa độ định vị, hình ảnh thực tế và theo dõi trạng thái đội giải cứu.', color: 'border-green-500 text-green-600 bg-green-50/50' },
  ];

  // Selected role for Permission Matrix
  const [selectedMatrixRole, setSelectedMatrixRole] = useState('PROVINCE_ADMIN');

  // Seed permission matrix state
  const [matrixData, setMatrixData] = useState<Record<string, PermissionRow[]>>({
    SUPER_ADMIN: [
      { moduleCode: 'user', moduleName: 'Quản lý người dùng', permissions: { view: true, create: true, update: true, delete: true, approve: true } },
      { moduleCode: 'sos', moduleName: 'Quản lý yêu cầu SOS', permissions: { view: true, create: true, update: true, delete: true, approve: true } },
      { moduleCode: 'team', moduleName: 'Quản lý đội cứu hộ', permissions: { view: true, create: true, update: true, delete: true, approve: true } },
      { moduleCode: 'mission', moduleName: 'Quản lý nhiệm vụ', permissions: { view: true, create: true, update: true, delete: true, approve: true } },
      { moduleCode: 'report', moduleName: 'Báo cáo & Thống kê', permissions: { view: true, create: true, update: true, delete: true, approve: true } },
      { moduleCode: 'settings', moduleName: 'Cấu hình hệ thống', permissions: { view: true, create: true, update: true, delete: true, approve: true } },
    ],
    PROVINCE_ADMIN: [
      { moduleCode: 'user', moduleName: 'Quản lý người dùng', permissions: { view: true, create: true, update: true, delete: false, approve: true } },
      { moduleCode: 'sos', moduleName: 'Quản lý yêu cầu SOS', permissions: { view: true, create: true, update: true, delete: false, approve: true } },
      { moduleCode: 'team', moduleName: 'Quản lý đội cứu hộ', permissions: { view: true, create: true, update: true, delete: false, approve: true } },
      { moduleCode: 'mission', moduleName: 'Quản lý nhiệm vụ', permissions: { view: true, create: true, update: true, delete: false, approve: true } },
      { moduleCode: 'report', moduleName: 'Báo cáo & Thống kê', permissions: { view: true, create: false, update: false, delete: false, approve: false } },
      { moduleCode: 'settings', moduleName: 'Cấu hình hệ thống', permissions: { view: false, create: false, update: false, delete: false, approve: false } },
    ],
    TEAM_LEADER: [
      { moduleCode: 'user', moduleName: 'Quản lý người dùng', permissions: { view: true, create: false, update: false, delete: false, approve: false } },
      { moduleCode: 'sos', moduleName: 'Quản lý yêu cầu SOS', permissions: { view: true, create: false, update: true, delete: false, approve: false } },
      { moduleCode: 'team', moduleName: 'Quản lý đội cứu hộ', permissions: { view: true, create: false, update: true, delete: false, approve: false } },
      { moduleCode: 'mission', moduleName: 'Quản lý nhiệm vụ', permissions: { view: true, create: true, update: true, delete: false, approve: false } },
      { moduleCode: 'report', moduleName: 'Báo cáo & Thống kê', permissions: { view: true, create: false, update: false, delete: false, approve: false } },
      { moduleCode: 'settings', moduleName: 'Cấu hình hệ thống', permissions: { view: false, create: false, update: false, delete: false, approve: false } },
    ],
  });

  const togglePermission = (moduleCode: string, action: 'view' | 'create' | 'update' | 'delete' | 'approve') => {
    setMatrixData((prev) => {
      const currentRoleData = prev[selectedMatrixRole] || [];
      const updatedRoleData = currentRoleData.map((row) => {
        if (row.moduleCode === moduleCode) {
          return {
            ...row,
            permissions: {
              ...row.permissions,
              [action]: !row.permissions[action],
            },
          };
        }
        return row;
      });
      return {
        ...prev,
        [selectedMatrixRole]: updatedRoleData,
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Cập nhật phân quyền & ma trận vai trò thành công!');
  };

  const currentRoleMatrix = matrixData[selectedMatrixRole] || [
    { moduleCode: 'user', moduleName: 'Quản lý người dùng', permissions: { view: true, create: false, update: false, delete: false, approve: false } },
    { moduleCode: 'sos', moduleName: 'Quản lý yêu cầu SOS', permissions: { view: true, create: false, update: false, delete: false, approve: false } },
    { moduleCode: 'team', moduleName: 'Quản lý đội cứu hộ', permissions: { view: true, create: false, update: false, delete: false, approve: false } },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Title & Save Button Header */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-black dark:text-white leading-tight">
            Phân quyền & vai trò
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
            Định nghĩa danh sách vai trò người dùng, thiết lập ma trận quyền hạn và giới hạn phạm vi truy cập dữ liệu
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all dark:bg-white dark:text-black dark:hover:bg-slate-100 cursor-pointer"
        >
          <Save size={14} />
          Lưu thay đổi
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center border-b border-slate-100 dark:border-slate-800 p-0.5 gap-2">
        <button
          type="button"
          onClick={() => setSubTab('roles')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subTab === 'roles'
              ? 'bg-slate-100 dark:bg-gray-700 text-black dark:text-white'
              : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
          }`}
        >
          <Users size={14} />
          Danh sách vai trò
        </button>
        <button
          type="button"
          onClick={() => setSubTab('matrix')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subTab === 'matrix'
              ? 'bg-slate-100 dark:bg-gray-700 text-black dark:text-white'
              : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
          }`}
        >
          <Shield size={14} />
          Ma trận quyền hạn
        </button>
        <button
          type="button"
          onClick={() => setSubTab('scope')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            subTab === 'scope'
              ? 'bg-slate-100 dark:bg-gray-700 text-black dark:text-white'
              : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
          }`}
        >
          <MapPin size={14} />
          Phạm vi quản lý dữ liệu
        </button>
      </div>

      {/* Tab 1: Roles list grid */}
      {subTab === 'roles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => (
              <div
                key={r.code}
                className={`p-4 border rounded-2xl flex flex-col gap-2 transition-all hover:shadow-sm bg-white dark:bg-gray-900 border-slate-100 dark:border-slate-800`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border ${r.color}`}>
                    {r.code}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                    {r.level}
                  </span>
                </div>
                <h4 className="text-xs font-extrabold text-black dark:text-white">
                  {r.name}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-450 leading-relaxed font-medium">
                  {r.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Permission Matrix Grid */}
      {subTab === 'matrix' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-black dark:text-white flex-shrink-0">
              Chọn vai trò cấu hình:
            </span>
            <div className="relative flex-1 max-w-[240px]">
              <select
                value={selectedMatrixRole}
                onChange={(e) => setSelectedMatrixRole(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-gray-900 text-black dark:text-white text-xs font-bold appearance-none cursor-pointer"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Quản trị viên tối cao)</option>
                <option value="PROVINCE_ADMIN">PROVINCE_ADMIN (Quản trị cấp tỉnh)</option>
                <option value="TEAM_LEADER">TEAM_LEADER (Đội trưởng cứu hộ)</option>
              </select>
            </div>
          </div>

          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-gray-800 border-b border-slate-100 dark:border-slate-750">
                  <th className="px-4 py-3 font-extrabold text-black dark:text-white select-none w-[200px]">
                    Chức năng / Module
                  </th>
                  <th className="px-4 py-3 font-extrabold text-black dark:text-white text-center select-none">
                    Xem (View)
                  </th>
                  <th className="px-4 py-3 font-extrabold text-black dark:text-white text-center select-none">
                    Tạo mới (Create)
                  </th>
                  <th className="px-4 py-3 font-extrabold text-black dark:text-white text-center select-none">
                    Cập nhật (Update)
                  </th>
                  <th className="px-4 py-3 font-extrabold text-black dark:text-white text-center select-none">
                    Xóa (Delete)
                  </th>
                  <th className="px-4 py-3 font-extrabold text-black dark:text-white text-center select-none">
                    Phê duyệt (Approve)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {currentRoleMatrix.map((row) => (
                  <tr key={row.moduleCode} className="hover:bg-slate-50/20 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3.5 font-bold text-black dark:text-white">
                      {row.moduleName}
                    </td>
                    {(['view', 'create', 'update', 'delete', 'approve'] as const).map((action) => {
                      const isChecked = row.permissions[action];
                      return (
                        <td key={action} className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => togglePermission(row.moduleCode, action)}
                            className="inline-flex items-center justify-center p-1 rounded-lg text-slate-500 hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare size={16} className="text-amber-500" />
                            ) : (
                              <Square size={16} className="text-slate-200 dark:text-slate-700" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Data Scope rules */}
      {subTab === 'scope' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30 rounded-2xl">
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <MapPin size={14} />
              Quy chế giới hạn phạm vi địa lý dữ liệu (Data Scope Rule)
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-450 leading-relaxed font-semibold mt-1.5">
              Để bảo vệ tính riêng tư và tối ưu hóa xử lý chỉ huy, hệ thống tự động phân loại phạm vi truy cập dữ liệu dựa trên địa bàn gán vào tài khoản hành chính.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Scope Level 1 */}
            <div className="p-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-gray-900 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-red-50 text-red-500 dark:bg-red-950/30 rounded-xl">
                <Shield size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-extrabold text-black dark:text-white">
                  Phạm vi Toàn quốc (Global Scope)
                </h5>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-0.5">
                  Áp dụng: SUPER_ADMIN
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-450 leading-relaxed font-medium pt-1">
                  Đọc và ghi toàn bộ dữ liệu người dùng, sự cố thiên tai, nguồn lực tài trợ và tình huống SOS trên cả nước. Không có bất kỳ giới hạn địa bàn nào.
                </p>
              </div>
            </div>

            {/* Scope Level 2 */}
            <div className="p-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-gray-900 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-amber-50 text-amber-500 dark:bg-amber-950/30 rounded-xl">
                <MapPin size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-extrabold text-black dark:text-white">
                  Phạm vi theo Tỉnh / Thành Phố (Province Scope)
                </h5>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-0.5">
                  Áp dụng: PROVINCE_ADMIN
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-450 leading-relaxed font-medium pt-1">
                  Tự động cách ly dữ liệu. Ví dụ: tài khoản có <code className="px-1 py-0.5 bg-slate-150 rounded text-red-500">provinceId</code> là TP. Hồ Chí Minh thì chỉ truy vấn sự cố và đội cứu trợ trực thuộc TP. Hồ Chí Minh. Không thể can thiệp hoặc nhìn thấy các yêu cầu SOS trực thuộc Đồng Nai, Long An.
                </p>
              </div>
            </div>

            {/* Scope Level 3 */}
            <div className="p-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-gray-900 rounded-2xl flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 text-blue-500 dark:bg-blue-950/30 rounded-xl">
                <Users size={16} />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-extrabold text-black dark:text-white">
                  Phạm vi Cấp cơ sở / Cấp Đội (Local & Team Scope)
                </h5>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-0.5">
                  Áp dụng: TEAM_LEADER, RESCUE_MEMBER
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-450 leading-relaxed font-medium pt-1">
                  Giới hạn chặt chẽ chỉ xem thông tin thành viên thuộc đội của mình, các nhiệm vụ phân công trực tiếp cho đội, và thông tin sự cố SOS mà đội được điều phối giải quyết.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
