/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Delete, ShieldCheck } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin, isPinLocked } = useFinance();
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState(false);

  if (!isPinLocked) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);

      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = unlockWithPin(nextPin);
          if (!success) {
            setErrorShake(true);
            setTimeout(() => {
              setPin('');
              setErrorShake(false);
            }, 500);
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl text-white select-none animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xs text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold tracking-tight">MyMoney Terkunci</h2>
          <p className="text-xs text-slate-400">
            Masukkan 4 digit PIN keamanan Anda untuk mengakses data finansial
          </p>
        </div>

        {/* 4 dots */}
        <div
          className={`flex items-center justify-center gap-4 py-2 ${
            errorShake ? 'animate-bounce text-rose-500' : ''
          }`}
        >
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-md shadow-emerald-400/50'
                  : 'border-slate-600 bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="w-16 h-16 rounded-full bg-slate-800/80 hover:bg-slate-700/80 active:bg-emerald-600 text-xl font-bold font-mono transition-all active:scale-95 flex items-center justify-center border border-slate-700/50"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-slate-800/80 hover:bg-slate-700/80 active:bg-emerald-600 text-xl font-bold font-mono transition-all active:scale-95 flex items-center justify-center border border-slate-700/50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Hapus digit PIN"
            className="w-16 h-16 rounded-full bg-slate-800/50 hover:bg-slate-700/50 active:bg-rose-600 text-slate-400 hover:text-white transition-all active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
