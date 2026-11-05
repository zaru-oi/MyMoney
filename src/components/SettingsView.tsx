/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Sparkles,
  Bell,
  Palette,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { INDONESIAN_DAYS } from '../utils/autoIncome';
import { formatRupiah, parseRupiahInput } from '../utils/finance';
import { exportBackupJSON } from '../utils/storage';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    restoreFromBackup,
    triggerToast,
    processAutoIncomeManually,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Weekly amount editor
  const [weeklyAmountStr, setWeeklyAmountStr] = useState<string>(() =>
    settings.weeklyAmount.toLocaleString('id-ID')
  );

  // New category inputs
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');

  // Security PIN
  const [pinInput, setPinInput] = useState(settings.securityPin || '');

  // Reset confirmation modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // Save auto income settings
  const handleSaveWeeklySettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseRupiahInput(weeklyAmountStr);
    if (parsedAmount <= 0) {
      triggerToast('Nominal pemasukan mingguan harus lebih dari Rp0', 'error');
      return;
    }

    updateSettings({
      ...settings,
      weeklyAmount: parsedAmount,
    });
    triggerToast('Pengaturan pemasukan mingguan disimpan', 'success');
  };

  // Toggle Auto Income
  const toggleAutoIncome = () => {
    const nextState = !settings.autoIncomeEnabled;
    updateSettings({
      ...settings,
      autoIncomeEnabled: nextState,
    });
  };

  // Change Weekly Day
  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const day = parseInt(e.target.value, 10);
    updateSettings({
      ...settings,
      weeklyDay: day,
    });
  };

  // Save PIN
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput && pinInput.length !== 4) {
      triggerToast('PIN harus terdiri dari tepat 4 angka', 'error');
      return;
    }
    updateSettings({
      ...settings,
      securityPin: pinInput.trim(),
    });
    triggerToast(
      pinInput.trim() ? 'PIN Keamanan berhasil diaktifkan' : 'PIN Keamanan dinonaktifkan',
      'success'
    );
  };

  // Category management
  const handleAddCategory = (type: 'INCOME' | 'EXPENSE') => {
    if (type === 'INCOME') {
      if (!newIncomeCat.trim()) return;
      if (settings.customIncomeCategories.includes(newIncomeCat.trim())) {
        triggerToast('Kategori ini sudah ada', 'error');
        return;
      }
      updateSettings({
        ...settings,
        customIncomeCategories: [...settings.customIncomeCategories, newIncomeCat.trim()],
      });
      setNewIncomeCat('');
    } else {
      if (!newExpenseCat.trim()) return;
      if (settings.customExpenseCategories.includes(newExpenseCat.trim())) {
        triggerToast('Kategori ini sudah ada', 'error');
        return;
      }
      updateSettings({
        ...settings,
        customExpenseCategories: [...settings.customExpenseCategories, newExpenseCat.trim()],
      });
      setNewExpenseCat('');
    }
  };

  const handleRemoveCategory = (type: 'INCOME' | 'EXPENSE', catName: string) => {
    if (type === 'INCOME') {
      if (settings.customIncomeCategories.length <= 1) {
        triggerToast('Minimal harus ada 1 kategori pemasukan', 'error');
        return;
      }
      updateSettings({
        ...settings,
        customIncomeCategories: settings.customIncomeCategories.filter((c) => c !== catName),
      });
    } else {
      if (settings.customExpenseCategories.length <= 1) {
        triggerToast('Minimal harus ada 1 kategori pengeluaran', 'error');
        return;
      }
      updateSettings({
        ...settings,
        customExpenseCategories: settings.customExpenseCategories.filter((c) => c !== catName),
      });
    }
  };

  // Export JSON
  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ymd = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `mymoney_backup_${ymd}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Cadangan data berhasil diunduh', 'success');
  };

  // Import JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        restoreFromBackup(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-200">
      {/* 1. Pengaturan Pemasukan Otomatis Mingguan */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Pemasukan Otomatis Mingguan
              </h3>
              <p className="text-xs text-slate-500">
                Fitur utama penambahan uang rutin ke saldo utama
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoIncomeEnabled}
              onChange={toggleAutoIncome}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <form onSubmit={handleSaveWeeklySettings} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Nominal Mingguan (IDR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={weeklyAmountStr}
                  onChange={(e) => {
                    const parsed = parseRupiahInput(e.target.value);
                    setWeeklyAmountStr(parsed === 0 ? '' : parsed.toLocaleString('id-ID'));
                  }}
                  className="w-full pl-10 pr-3 py-2 text-sm font-extrabold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Hari Penerimaan Uang
              </label>
              <select
                value={settings.weeklyDay}
                onChange={handleDayChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                {INDONESIAN_DAYS.map((dayName, idx) => (
                  <option key={dayName} value={idx}>
                    Setiap hari {dayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => processAutoIncomeManually()}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
            >
              Periksa & Sinkronisasi Sekarang
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>

      {/* 2. Pengaturan Notifikasi & Pengingat */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Notifikasi & Pengingat
            </h3>
            <p className="text-xs text-slate-500">
              Notifikasi transaksi dan peringatan kondisi finansial
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1 text-xs">
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Notifikasi Pemasukan Mingguan
              </span>
              <span className="text-slate-500">
                Pemberitahuan saat Rp50.000 otomatis masuk ke saldo
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoIncomeAlert}
              onChange={(e) =>
                updateSettings({ ...settings, autoIncomeAlert: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Peringatan Saldo Rendah
              </span>
              <span className="text-slate-500">
                Peringatan jika saldo bebas tersisa di bawah {formatRupiah(settings.lowBalanceThreshold)}
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.lowBalanceAlert}
              onChange={(e) =>
                updateSettings({ ...settings, lowBalanceAlert: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Pemberitahuan Target Tabungan Tercapai
              </span>
              <span className="text-slate-500">
                Ucapan selamat saat target tabungan terkumpul 100%
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.goalAlert}
              onChange={(e) =>
                updateSettings({ ...settings, goalAlert: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded"
            />
          </div>
        </div>
      </div>

      {/* 3. Tampilan & Tema */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Tema Tampilan
            </h3>
            <p className="text-xs text-slate-500">Pilih skema warna sesuai kenyamanan Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as const).map((mode) => {
            const labels = { light: 'Mode Terang', dark: 'Mode Gelap', system: 'Sistem' };
            const isSel = settings.themeMode === mode;
            return (
              <button
                key={mode}
                onClick={() => updateSettings({ ...settings, themeMode: mode })}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all ${
                  isSel
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Kelola Kategori Transaksi */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Kelola Kategori
            </h3>
            <p className="text-xs text-slate-500">Kategori pemasukan & pengeluaran kustom</p>
          </div>
        </div>

        {/* Pemasukan categories */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
            Kategori Pemasukan:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {settings.customIncomeCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                {cat}
                {cat !== 'Uang Mingguan' && (
                  <button
                    onClick={() => handleRemoveCategory('INCOME', cat)}
                    className="hover:text-rose-600"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Nama kategori baru..."
              value={newIncomeCat}
              onChange={(e) => setNewIncomeCat(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              onClick={() => handleAddCategory('INCOME')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Pengeluaran categories */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">
            Kategori Pengeluaran:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {settings.customExpenseCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              >
                {cat}
                <button
                  onClick={() => handleRemoveCategory('EXPENSE', cat)}
                  className="hover:text-rose-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Nama kategori pengeluaran baru..."
              value={newExpenseCat}
              onChange={(e) => setNewExpenseCat(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              onClick={() => handleAddCategory('EXPENSE')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
            >
              Tambah
            </button>
          </div>
        </div>
      </div>

      {/* 5. Keamanan Aplikasi: PIN 4 Digit */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              PIN Keamanan
            </h3>
            <p className="text-xs text-slate-500">
              Kunci layar privasi finansial dengan 4 digit angka
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePin} className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="password"
              maxLength={4}
              placeholder="PIN 4 Angka (Kosongkan jika dinonaktifkan)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/[^\d]/g, ''))}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white tracking-widest font-mono focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Simpan PIN
            </button>
          </div>
        </form>
      </div>

      {/* 6. Cadangan & Pemulihan Data (Backup & Restore) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Cadangan & Pemulihan (Offline-First)
          </h3>
          <p className="text-xs text-slate-500">
            Ekspor seluruh catatan finansial Anda ke berkas JSON atau impor kembali
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all active:scale-98"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Unduh Cadangan JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all active:scale-98"
          >
            <Upload className="w-4 h-4 text-sky-600" />
            Pulihkan dari Berkas
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* 7. Panduan Build APK Android & Arsitektur */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-3xl p-5 border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-3">
        <button
          onClick={() => setShowAndroidGuide(!showAndroidGuide)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Panduan Build APK Android Native
              </h3>
              <p className="text-xs text-slate-500">
                Langkah ekspor proyek web ini menjadi berkas `.apk` mandiri
              </p>
            </div>
          </div>
          {showAndroidGuide ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showAndroidGuide && (
          <div className="pt-2 text-xs text-slate-700 dark:text-slate-300 space-y-3 border-t border-emerald-200 dark:border-emerald-800">
            <p>
              Aplikasi <strong>MyMoney</strong> dirancang dengan arsitektur <em>Mobile-First PWA & Capacitor Ready</em>. Seluruh penyimpanan data bersifat offline-first permanen tanpa server berbayar.
            </p>
            <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-2xl font-mono text-[11px] space-y-2 overflow-x-auto">
              <p className="text-slate-400"># 1. Pasang Capacitor di repositori:</p>
              <p>npm install @capacitor/core @capacitor/cli @capacitor/android</p>
              <p className="text-slate-400"># 2. Inisialisasi dan build aset web:</p>
              <p>npx cap init "MyMoney" "com.mymoney.app"</p>
              <p>npm run build</p>
              <p className="text-slate-400"># 3. Tambahkan platform Android & buka di Android Studio:</p>
              <p>npx cap add android</p>
              <p>npx cap sync</p>
              <p>npx cap open android</p>
              <p className="text-slate-400"># 4. Di Android Studio: Build &gt; Build Bundle(s) / APK(s) &gt; Build APK</p>
            </div>
            <p className="text-[11px] text-slate-500">
              Hasil APK dapat diinstal langsung pada semua ponsel Android tanpa bergantung pada server internet luar.
            </p>
          </div>
        )}
      </div>

      {/* 8. Reset Data Seluruhnya */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl p-5 border border-rose-200 dark:border-rose-900/40 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">
            Hapus Seluruh Data
          </h4>
          <p className="text-xs text-slate-500">
            Kembalikan saldo ke Rp0 dan bersihkan riwayat transaksi
          </p>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Data
        </button>
      </div>

      {/* Double confirmation modal for reset */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Reset Total
              </h3>
              <p className="text-xs text-slate-500">
                Tindakan ini akan menghapus seluruh data transaksi, tabungan, dan mengembalikan saldo awal ke Rp0. Anda disarankan mengunduh cadangan JSON terlebih dahulu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 dark:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700"
              >
                Ya, Reset Total
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
