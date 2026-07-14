import { useState } from 'react';
import DashboardHeader from './components/DashboardHeader';
import TopStatsGrid from './components/TopStatsGrid';
import MainChartsPanel from './components/MainChartsPanel';
import RegionalStatsPanel from './components/RegionalStatsPanel';
import HistoricalOutcomesPanel from './components/HistoricalOutcomesPanel';
import MapAndMissionsPanel from './components/MapAndMissionsPanel';
import ResourcesAndNewsPanel from './components/ResourcesAndNewsPanel';

export default function DashboardPage() {
  const [provinceId, setProvinceId] = useState<number | null>(null);

  const handleRefresh = () => {
    console.log('Refreshing dashboard data for provinceId:', provinceId);
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#f8fafc] dark:bg-gray-950 min-h-screen text-gray-800 dark:text-gray-150 p-1 md:p-2">
      
      {/* HEADER SECTION (Welcome, update time, filters) */}
      <DashboardHeader 
        onRefresh={handleRefresh}
        selectedProvinceId={provinceId}
        onChangeProvince={setProvinceId}
      />

      {/* ROW 1: 5 STATS CARDS WITH SPARKLINES */}
      {/* Trong tương lai, TopStatsGrid sẽ nhận provinceId và gọi API thực tế */}
      <TopStatsGrid />

      {/* ROW 2: MAIN CHARTS PANEL */}
      <MainChartsPanel />

      {/* ROW 3: FOUR SMALL PANELS (Regional breakdown, mission status, progress, latest SOS) */}
      <RegionalStatsPanel />

      {/* ROW 4: HISTORICAL OUTCOMES PANEL (Stacked bar, ratios) */}
      <HistoricalOutcomesPanel />

      {/* ROW 5: MAP AND ACTIVE MISSIONS */}
      <MapAndMissionsPanel />

      {/* ROW 6: THREE SMALL GRID CARDS (Materials, donations, news) */}
      <ResourcesAndNewsPanel />

    </div>
  );
}
