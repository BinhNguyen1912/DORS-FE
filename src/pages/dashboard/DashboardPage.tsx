import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores';
import { useSocket } from '../../providers/SocketProvider';
import { DISPATCH_EVENTS } from '../../constants/websocket.constant';
import DashboardHeader from './components/DashboardHeader';
import TopStatsGrid from './components/TopStatsGrid';
import MainChartsPanel from './components/MainChartsPanel';
import RegionalStatsPanel from './components/RegionalStatsPanel';
import HistoricalOutcomesPanel from './components/HistoricalOutcomesPanel';
import MapAndMissionsPanel from './components/MapAndMissionsPanel';
import ResourcesAndNewsPanel from './components/ResourcesAndNewsPanel';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role || (user as any)?.userRoles?.[0]?.role?.name;
  const isProvinceAdmin = userRole === 'PROVINCE_ADMIN';

  // React Query & Socket
  const queryClient = useQueryClient();
  const { dispatchSocket } = useSocket();

  // State
  const [provinceId, setProvinceId] = useState<number | null>(() => {
    return isProvinceAdmin ? (user?.provinceId ?? null) : null;
  });
  const [adminUnitId, setAdminUnitId] = useState<number | null>(null);

  // Subscribe to socket room for current province
  useEffect(() => {
    if (!dispatchSocket || !provinceId) return;
    dispatchSocket.emit(DISPATCH_EVENTS.JOIN_PROVINCE_ROOM, { provinceId });
  }, [dispatchSocket, provinceId]);

  // Listen to SOS real-time events to auto-refetch dashboard data
  useEffect(() => {
    if (!dispatchSocket) return;

    const handleRefetch = () => {
      console.log('Real-time socket event received. Invalidate dashboard queries...');
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMapTasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardResources'] });
    };

    dispatchSocket.on(DISPATCH_EVENTS.SOS_CREATED, handleRefetch);
    dispatchSocket.on(DISPATCH_EVENTS.SOS_STATUS_UPDATED, handleRefetch);
    dispatchSocket.on(DISPATCH_EVENTS.TEAM_ASSIGNED, handleRefetch);
    dispatchSocket.on(DISPATCH_EVENTS.TEAM_REASSIGNED, handleRefetch);

    return () => {
      dispatchSocket.off(DISPATCH_EVENTS.SOS_CREATED, handleRefetch);
      dispatchSocket.off(DISPATCH_EVENTS.SOS_STATUS_UPDATED, handleRefetch);
      dispatchSocket.off(DISPATCH_EVENTS.TEAM_ASSIGNED, handleRefetch);
      dispatchSocket.off(DISPATCH_EVENTS.TEAM_REASSIGNED, handleRefetch);
    };
  }, [dispatchSocket, queryClient]);

  // Sync state if user loads later
  useEffect(() => {
    if (isProvinceAdmin && user?.provinceId && provinceId !== user.provinceId) {
      setProvinceId(user.provinceId);
    }
  }, [isProvinceAdmin, user?.provinceId, provinceId]);

  // Helper to format Date to YYYY-MM-DD
  const formatDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [endDate, setEndDate] = useState<string>(() => {
    return formatDateString(new Date());
  });

  const [startDate, setStartDate] = useState<string>(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return formatDateString(start);
  });

  const handleRefresh = () => {
    console.log('Refreshing dashboard data for:', { provinceId, adminUnitId, startDate, endDate });
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-gray-800 dark:text-gray-150 p-1 md:p-2">
      
      {/* HEADER SECTION (Welcome, update time, filters) */}
      <DashboardHeader 
        onRefresh={handleRefresh}
        selectedProvinceId={provinceId}
        onChangeProvince={(id) => {
          setProvinceId(id);
          setAdminUnitId(null); // Reset admin unit when province changes
        }}
        selectedAdminUnitId={adminUnitId}
        onChangeAdminUnit={setAdminUnitId}
        startDate={startDate}
        onChangeStartDate={setStartDate}
        endDate={endDate}
        onChangeEndDate={setEndDate}
      />

      {/* ROW 1: 5 STATS CARDS WITH SPARKLINES */}
      <TopStatsGrid 
        provinceId={provinceId} 
        startDate={startDate} 
        endDate={endDate} 
        adminUnitId={adminUnitId} 
      />

      {/* ROW 2: MAIN CHARTS PANEL */}
      <MainChartsPanel 
        provinceId={provinceId} 
        startDate={startDate} 
        endDate={endDate} 
        adminUnitId={adminUnitId} 
      />

      {/* ROW 3: FOUR SMALL PANELS (Regional breakdown, mission status, progress, latest SOS) */}
      <RegionalStatsPanel 
        provinceId={provinceId} 
        startDate={startDate} 
        endDate={endDate} 
        adminUnitId={adminUnitId} 
      />

      {/* ROW 4: HISTORICAL OUTCOMES PANEL (Stacked bar, ratios) */}
      <HistoricalOutcomesPanel 
        provinceId={provinceId} 
        startDate={startDate} 
        endDate={endDate} 
        adminUnitId={adminUnitId} 
      />

      {/* ROW 5: MAP AND ACTIVE MISSIONS */}
      <MapAndMissionsPanel 
        provinceId={provinceId} 
        startDate={startDate} 
        endDate={endDate} 
        adminUnitId={adminUnitId} 
      />

      {/* ROW 6: THREE SMALL GRID CARDS (Materials, donations, news) */}
      <ResourcesAndNewsPanel 
        provinceId={provinceId} 
        startDate={startDate} 
        endDate={endDate} 
        adminUnitId={adminUnitId} 
      />

    </div>
  );
}
