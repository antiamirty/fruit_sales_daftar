import React, { useState, useEffect } from 'react';
import { PBWindowName } from '../components/layout/TopMenu';
import { wholesaleStore } from '../services/storage';
import {
  Truck,
  Scale,
  DollarSign,
  Users,
  Wallet,
  FileText,
  Building2,
  Sprout,
  Receipt,
  FileCheck,
  Package,
  HardDriveDownload,
  Database,
  Calendar,
  Clock,
  Layers,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface HomeViewProps {
  onOpenWindow: (win: PBWindowName) => void;
  onExitBackup: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenWindow,
  onExitBackup
}) => {
  const [db, setDb] = useState(wholesaleStore.getState());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const unsub = wholesaleStore.subscribe(() => {
      setDb({ ...wholesaleStore.getState() });
    });
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  // حسابات إحصائيات سريعة للوحة القيادة
  const todayStr = new Date().toISOString().split('T')[0];
  const activeNaklat = db.naklat.filter(n => !n.nakla_finish).length;
  const totalSalesToday = db.fatora_f
    .filter(f => f.trans_date === todayStr)
    .reduce((sum, f) => sum + (f.tota || 0), 0);
  const totalTahseelToday = db.tahseelat
    .filter(t => t.trans_date === todayStr)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const khaznaBalance = db.khazna.reduce(
    (bal, t) => bal + (t.trans_type === 'in' ? t.amount : -t.amount),
    0
  );
  const totalZemam = db.zemam.reduce((sum, z) => sum + (z.safi_zemam || 0), 0);

  const formattedDate = currentTime.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="relative min-h-[calc(100vh-130px)] w-full overflow-hidden bg-[#5a6b7c] flex flex-col justify-between font-sans select-none border-2 border-t-slate-800 border-l-slate-800 border-b-white border-r-white shadow-inner">
      {/* 1. MDI Workspace Canvas Texture (Classic PowerBuilder Desktop Pattern) */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1.5px, transparent 1.5px), radial-gradient(#000000 1.5px, #5a6b7c 1.5px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />

      {/* 2. Top-Left Connected Box & exit_backup (مطابق لصور باور بيلدر الأصلية بالخط المائل والتسطير) */}
      <div className="relative z-10 p-2 flex flex-wrap justify-between items-start gap-2">
        {/* مستطيلا الاتصال والنسخ الاحتياطي الكلاسيكيان مع زر الاتصال بقاعدة البيانات */}
        <div className="flex flex-col gap-0 border-2 border-black bg-[#b0b0b0] shadow-md">
          <button
            type="button"
            onClick={() => onOpenWindow('w_sql_server_connect')}
            title="انقر لتعديل اتصال قاعدة البيانات وجلب البيانات من سيرفر local1"
            className="px-5 py-2 text-center text-slate-950 hover:bg-[#c4c4c4] active:bg-[#9a9a9a] font-sans font-bold italic underline text-base sm:text-lg border-b-2 border-black tracking-wide select-none cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Connected : محل 67</span>
          </button>
          <button
            type="button"
            onClick={onExitBackup}
            className="px-5 py-2 text-center text-slate-950 bg-[#b0b0b0] hover:bg-[#c4c4c4] active:bg-[#9a9a9a] font-sans font-bold italic underline text-base sm:text-lg transition-colors cursor-pointer select-none border-b border-black"
            title="النسخ الاحتياطي والخروج"
          >
            exit_backup
          </button>
          <button
            type="button"
            onClick={() => onOpenWindow('w_sql_server_connect')}
            className="px-3 py-1.5 text-center text-blue-950 bg-[#e4e0d8] hover:bg-white active:bg-[#c8c4bc] font-sans font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="الاتصال بقاعدة بيانات SQL Server (local1) واستعراض الجداول"
          >
            <Database className="w-3.5 h-3.5 text-blue-900" />
            <span>اتصال SQL Server (local1)</span>
          </button>
        </div>

        {/* بطاقة محرك باور بيلدر والفرع */}
        <div className="bg-[#d4d0c8]/95 border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 px-3 py-1.5 text-xs text-slate-800 shadow-md">
          <div className="font-bold flex items-center gap-1.5 text-slate-900">
            <span className="w-4 h-4 bg-emerald-700 text-white flex items-center justify-center text-[9px] font-bold">
              PB
            </span>
            <span>fruit67 - سوق الجملة 6 أكتوبر</span>
          </div>
          <div className="text-[11px] text-slate-700 font-mono mt-0.5">
            الفرع: محل 67 فاكهة | عنبر 1
          </div>
        </div>
      </div>

      {/* 3. الشعار المركزي الكلاسيكي (أبو حسن لتجارة الفاكهة بالجملة - محل 67) ومؤشرات اليوم */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 my-auto py-2">
        {/* اللوجو الرسمي الكلاسيكي */}
        <div className="relative w-full max-w-3xl rounded-lg bg-slate-100 border-4 border-t-white border-l-white border-b-slate-800 border-r-slate-800 shadow-2xl p-5 text-center">
          {/* شريط عنوان النافذة الرئيسي الداخلي */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white py-1.5 px-3 rounded-t -mt-5 -mx-5 mb-4 flex items-center justify-between border-b-2 border-blue-950">
            <span className="font-bold text-xs tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 bg-emerald-600 rounded-xs flex items-center justify-center text-[10px] font-black">
                67
              </span>
              الرئيسية ------- ( محل 67 )
            </span>
            <span className="text-[10px] font-mono bg-blue-950 px-2 py-0.5 rounded border border-blue-700">
              PowerBuilder MDI Frame
            </span>
          </div>

          <div className="border-2 border-slate-300 p-4 rounded bg-white shadow-inner mb-4">
            <div className="text-3xl md:text-4xl font-black text-slate-900 tracking-wider font-serif">
              أبـو حسـن
            </div>
            <div className="text-sm md:text-base font-bold text-emerald-800 tracking-wide mt-1">
              لتجارة الفاكهة والخضار بالجملة
            </div>

            <div className="my-2.5 flex items-center justify-center gap-3">
              <span className="h-px bg-slate-300 flex-1"></span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-black text-xs rounded border border-emerald-400 shadow-xs">
                عنبر 1 - محل 67 فاكهة
              </span>
              <span className="h-px bg-slate-300 flex-1"></span>
            </div>

            <div className="text-xs font-bold text-slate-700">
              سوق الجملة للخضار والفاكهة - 6 أكتوبر
            </div>
          </div>

          {/* شريط المؤشرات الحية السريعة لنشاط المحل اليومي */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 text-right">
            <div className="bg-slate-50 border border-slate-300 p-2 rounded shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500">نقلات نشطة</div>
              <div className="text-base font-black text-emerald-800 font-mono mt-0.5">
                {activeNaklat} <span className="text-[10px] font-sans">نقلة</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-300 p-2 rounded shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500">مبيعات اليوم</div>
              <div className="text-base font-black text-blue-900 font-mono mt-0.5">
                {totalSalesToday.toLocaleString()} <span className="text-[10px] font-sans">ج.م</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-300 p-2 rounded shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500">تحصيلات اليوم</div>
              <div className="text-base font-black text-purple-900 font-mono mt-0.5">
                {totalTahseelToday.toLocaleString()} <span className="text-[10px] font-sans">ج.م</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-300 p-2 rounded shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500">رصيد الخزينة</div>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {khaznaBalance.toLocaleString()} <span className="text-[10px] font-sans">ج.م</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-300 p-2 rounded shadow-2xs col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold text-slate-500">إجمالي الذمم</div>
              <div className="text-base font-black text-rose-800 font-mono mt-0.5">
                {totalZemam.toLocaleString()} <span className="text-[10px] font-sans">ج.م</span>
              </div>
            </div>
          </div>

          {/* مربعات الوصول السريع المقسمة حسب مجموعات شاشات باور بيلدر الأصلية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-right">
            {/* المجموعة 1: النقلات والمبيعات */}
            <div className="bg-slate-200/80 border border-slate-300 p-2 rounded">
              <div className="font-bold text-emerald-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                <span>النقلات والمبيعات</span>
                <Truck className="w-3.5 h-3.5 text-emerald-800" />
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => onOpenWindow('w_nakla')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">3-1</span>
                    <span>تسجيل نقلة</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_nakla</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_fatora_f')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">7-1</span>
                    <span>فاتورة فاكهة</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_fatora_f</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_fatora')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-amber-50 active:bg-amber-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">7-2</span>
                    <span>فاتورة موز</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_fatora</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_esdar_fatora')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">9-1</span>
                    <span>إصدار فاتورة</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_esdar_fatora</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_print_fwateer')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">9-2</span>
                    <span>طباعة الفواتير</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_print_fwateer</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_sarf_fatora_group')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">9-6</span>
                    <span>صرف مجموعة فواتير</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_sarf_fatora_group</span>
                </button>
              </div>
            </div>

            {/* المجموعة 2: حسابات الزبائن والتحصيل */}
            <div className="bg-slate-200/80 border border-slate-300 p-2 rounded">
              <div className="font-bold text-blue-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                <span>الزبائن والتحصيل</span>
                <Users className="w-3.5 h-3.5 text-blue-800" />
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => onOpenWindow('w_customers')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-blue-50 active:bg-blue-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">5-1</span>
                    <span>دليل الزبائن</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_customers</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_tahseel_rahn_customers')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-blue-50 active:bg-blue-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">5-2</span>
                    <span>تحصيل ورهن الزبائن</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_tahseel_rahn</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_rad_rahn_nakdi_today')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-blue-50 active:bg-blue-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">5-3</span>
                    <span>رد رهن نقدية اليوم</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_rad_rahn_nakdi</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_zemam_balance')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-rose-50 active:bg-rose-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">10-2-1</span>
                    <span>رصيد الذمم</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_zemam_balance</span>
                </button>
              </div>
            </div>

            {/* المجموعة 3: الموردون والمزارع */}
            <div className="bg-slate-200/80 border border-slate-300 p-2 rounded">
              <div className="font-bold text-amber-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                <span>الموردون والمزارع</span>
                <Sprout className="w-3.5 h-3.5 text-amber-800" />
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => onOpenWindow('w_suppliers')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-amber-50 active:bg-amber-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">4-1</span>
                    <span>دليل الموردين</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_suppliers</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_farm')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-amber-50 active:bg-amber-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">4-2</span>
                    <span>المزارع والمصروفات</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_farm</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_sup_sahb')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-amber-50 active:bg-amber-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">4-3</span>
                    <span>مسحوبات المورد</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_sup_sahb</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_package_sups')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-amber-50 active:bg-amber-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">6-1</span>
                    <span>محلات الكراتين والتعبئة</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_package_sups</span>
                </button>
              </div>
            </div>

            {/* المجموعة 4: الخزينة والمصروفات والإدارة */}
            <div className="bg-slate-200/80 border border-slate-300 p-2 rounded">
              <div className="font-bold text-purple-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                <span>الخزينة والمالية</span>
                <Wallet className="w-3.5 h-3.5 text-purple-800" />
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => onOpenWindow('w_khazna')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-purple-50 active:bg-purple-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">8-1</span>
                    <span>الخزينة والتقفيل اليومي</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_takfeel</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_branch_exps')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-purple-50 active:bg-purple-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">11-1</span>
                    <span>مصروفات الفرع</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_branch_exps</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_markz_mali')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-purple-50 active:bg-purple-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">1-12</span>
                    <span>المركز المالي</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_markz_mali</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_fwateer_print_tax')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">14-1</span>
                    <span>الفواتير الضريبية</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_fwateer_print_tax</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_change_password_user')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-indigo-50 active:bg-indigo-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">12-1</span>
                    <span>كلمات المرور والمستخدمين</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_change_password</span>
                </button>
                <button
                  onClick={() => onOpenWindow('w_arseda_madeena')}
                  className="w-full text-right px-2 py-1 bg-white hover:bg-rose-50 active:bg-rose-100 border border-slate-300 rounded font-semibold text-[11px] text-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-slate-900 px-1 rounded border border-amber-400">12-2</span>
                    <span>الأرصدة المدينة للزبائن</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">w_arseda_madeena</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. شريط الحالة الكلاسيكي لباور بيلدر (PowerBuilder MicroHelp / Status Bar) */}
      <div className="relative z-10 bg-slate-200 border-t-2 border-white px-2 py-1 flex items-center justify-between text-[11px] text-slate-800 font-mono shadow-xs select-none">
        <div className="flex items-center gap-2">
          {/* Panel 1: Ready */}
          <span className="px-2 py-0.5 bg-slate-100 border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white font-bold text-emerald-800 shadow-inner">
            جاهز (Ready)
          </span>

          {/* Panel 2: User */}
          <span className="px-2 py-0.5 bg-slate-100 border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white text-slate-700 shadow-inner hidden md:inline">
            مستخدم: المدير العام (Admin)
          </span>

          {/* Panel 3: Database */}
          <span className="px-2 py-0.5 bg-slate-100 border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white text-slate-700 shadow-inner">
            القاعدة: fruit67 (متصل)
          </span>

          {/* Panel 4: Branch */}
          <span className="px-2 py-0.5 bg-slate-100 border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white text-slate-700 shadow-inner hidden lg:inline">
            الفرع: محل 67 فاكهة - عنبر 1
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Panel 5: Date and Live Clock */}
          <span className="px-2 py-0.5 bg-slate-100 border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white text-slate-800 font-bold shadow-inner flex items-center gap-2">
            <span>{formattedDate}</span>
            <span className="text-emerald-700">{formattedTime}</span>
          </span>

          {/* Panel 6: Keyboard locks */}
          <span className="px-1.5 py-0.5 bg-slate-100 border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white font-bold text-slate-600 shadow-inner">
            NUM
          </span>
          <span className="px-1.5 py-0.5 bg-slate-100 border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white font-bold text-slate-600 shadow-inner">
            CAPS
          </span>
          <span className="px-1.5 py-0.5 bg-slate-100 border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white font-bold text-slate-600 shadow-inner hidden sm:inline">
            INS
          </span>
        </div>
      </div>
    </div>
  );
};
