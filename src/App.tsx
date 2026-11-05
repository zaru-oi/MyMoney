/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AndroidHeader } from './components/AndroidHeader';
import { AndroidBottomNav } from './components/AndroidBottomNav';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { StatisticsView } from './components/StatisticsView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { PinLockScreen } from './components/PinLockScreen';
import { NotificationModal } from './components/NotificationModal';
import { Toast } from './components/Toast';

const MainAppContent: React.FC = () => {
  const { activeTab, toast } = useFinance();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSimulatorFrame, setIsSimulatorFrame] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardView />;
      case 'history':
        return <HistoryView />;
      case 'statistics':
        return <StatisticsView />;
      case 'savings':
        return <SavingsGoalsView />;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center transition-colors ${
        isSimulatorFrame ? 'p-2 sm:p-6' : ''
      }`}
    >
      {/* Toast notifications */}
      <Toast toast={toast} />

      {/* Main Container: Android Mobile Frame or Fluid Responsive Frame */}
      <div
        className={`w-full bg-slate-50 dark:bg-slate-950 flex flex-col transition-all min-h-screen ${
          isSimulatorFrame
            ? 'max-w-md shadow-2xl rounded-[40px] border-[6px] border-slate-800 dark:border-slate-800 overflow-hidden relative'
            : 'max-w-lg mx-auto shadow-sm min-h-screen'
        }`}
      >
        {/* Top Android Header & Status Bar */}
        <AndroidHeader
          onOpenNotifications={() => setIsNotificationOpen(true)}
          isSimulatorFrame={isSimulatorFrame}
          toggleSimulatorFrame={() => setIsSimulatorFrame((prev) => !prev)}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {renderActiveView()}
        </main>

        {/* Android Material Bottom Navigation */}
        <AndroidBottomNav />

        {/* Modals & Overlays */}
        <TransactionModal />
        <PinLockScreen />
        <NotificationModal
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}
