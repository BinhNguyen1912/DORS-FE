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
    <div className="space-y-6 pb-12 font-sans text-gray-800 dark:text-gray-150 p-1 md:p-2">
      
      {/* HEADER SECTION (Welcome, update time, filters) */}
      <DashboardHeader 
        onRefresh={handleRefresh}
        selectedProvinceId={provinceId}
        onChangeProvince={setProvinceId}
      />

      {/* ROW 1: 5 STATS CARDS WITH SPARKLINES */}
      <TopStatsGrid provinceId={provinceId} />

      {/* ROW 2: MAIN CHARTS PANEL */}
      <MainChartsPanel provinceId={provinceId} />

      {/* ROW 3: FOUR SMALL PANELS (Regional breakdown, mission status, progress, latest SOS) */}
      <RegionalStatsPanel provinceId={provinceId} />

      {/* ROW 4: HISTORICAL OUTCOMES PANEL (Stacked bar, ratios) */}
      <HistoricalOutcomesPanel provinceId={provinceId} />

      {/* ROW 5: MAP AND ACTIVE MISSIONS */}
      <MapAndMissionsPanel provinceId={provinceId} />

      {/* ROW 6: THREE SMALL GRID CARDS (Materials, donations, news) */}
      <ResourcesAndNewsPanel provinceId={provinceId} />

    </div>
  );
}
