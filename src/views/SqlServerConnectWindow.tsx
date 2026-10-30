import React, { useEffect, useRef, useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { syncEngine, SyncEngineStatus } from '../services/syncEngine';
import { Cloud, CloudOff, Download, RefreshCw, Trash2, Upload } from 'lucide-react';

interface SqlServerConnectWindowProps {
  onClose?: () => void;
}

type Notice = { text: string; type: 'success' | 'error' };

const formatTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('ar-EG') : 'لم تتم أي مزامنة بعد';

export const SqlServerConnectWindow: React.FC<SqlServerConnectWindowProps> = ({ onClose }) => {
  const [status, setStatus] = useState<SyncEngineStatus>(syncEngine.getStatus());
  const [isReloading, setIsReloading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => syncEngine.subscribe(() => setStatus(syncEngine.getStatus())), []);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  const showNotice = (text: string, type: Notice['type']) => {
    setNotice({ text, type });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  };

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await wholesaleStore.reloadFromRemote();
      showNotice('تم تحديث البيانات من السحابة بنجاح.', 'success');
    } catch (e) {
      showNotice('تعذر تحديث البيانات من السحابة. تحقق من الاتصال بالإنترنت وحاول مرة أخرى.', 'error');
    } finally {
      setIsReloading(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([wholesaleStore.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fruit67_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('تم تصدير نسخة احتياطية من البيانات.', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result;
      if (typeof content !== 'string') return;
      const res = wholesaleStore.importDatabaseFromJson(content);
      showNotice(res.message, res.success ? 'success' : 'error');
    };
    reader.readAsText(file);
  };

  const handleClearMockData = () => {
    wholesaleStore.clearAllMockData();
    setShowClearConfirm(false);
    showNotice('تم حذف البيانات الافتراضية. قاعدة البيانات الآن جاهزة لبياناتك الفعلية.', 'success');
  };

  const isError = status.state === 'error';
  const isSaving = status.state === 'saving';

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 bg-[#dfdbd1] text-slate-900 overflow-auto" dir="rtl">
      <div className="bg-white border border-slate-400 rounded-sm shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 font-black text-sm text-blue-950">
            {isError ? <CloudOff className="w-4 h-4 text-amber-700" /> : <Cloud className="w-4 h-4 text-emerald-700" />}
            <span>قاعدة بيانات Supabase</span>
          </div>
          <span
            className={`px-2 py-1 text-xs font-bold rounded-sm border ${
              isError
                ? 'bg-amber-100 border-amber-400 text-amber-950'
                : isSaving
                ? 'bg-blue-100 border-blue-400 text-blue-950'
                : 'bg-emerald-100 border-emerald-400 text-emerald-950'
            }`}
          >
            {isError ? 'خطأ في الحفظ' : isSaving ? 'جارٍ الحفظ...' : 'البيانات محفوظة'}
          </span>
        </div>

        <div className="text-xs text-slate-700 flex flex-col gap-1">
          <span>آخر حفظ ناجح: <strong>{formatTime(status.lastSavedAt)}</strong></span>
          {isError && status.lastError && (
            <span className="text-amber-900">سبب الخطأ: {status.lastError}</span>
          )}
          <span>التغييرات تُحفظ تلقائياً عند كل تعديل، وتبقى نسخة على هذا المتصفح احتياطاً.</span>
        </div>

        {notice && (
          <div
            className={`text-xs font-bold px-3 py-2 rounded-sm border ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={handleReload}
            disabled={isReloading}
            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
            <span>تحديث من السحابة</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-400 rounded-sm flex items-center gap-1.5 text-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-700" />
            <span>تصدير نسخة احتياطية</span>
          </button>
          <label className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-400 rounded-sm flex items-center gap-1.5 text-slate-800 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>استيراد نسخة احتياطية</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-sm flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف البيانات الافتراضية</span>
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <div className="bg-white border border-rose-300 rounded-sm shadow-sm p-4 flex flex-col gap-3 text-xs">
          <span className="font-bold text-rose-900">سيتم حذف البيانات الافتراضية من قاعدة البيانات. هل تريد المتابعة؟</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClearMockData}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-sm"
            >
              نعم، احذف
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-400 font-bold rounded-sm text-slate-800"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {onClose && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-400 rounded-sm text-xs font-bold text-slate-800"
          >
            إغلاق
          </button>
        </div>
      )}
    </div>
  );
};
