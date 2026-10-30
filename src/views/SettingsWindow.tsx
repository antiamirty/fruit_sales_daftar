import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { CompanyData } from '../types/schema';
import {
  Settings,
  Building2,
  Save,
  CheckCircle,
  Database,
  Download,
  Upload,
  RefreshCw,
  Flame,
  Info
} from 'lucide-react';

export const SettingsWindow: React.FC = () => {
  const db = wholesaleStore.getState();

  const [company, setCompany] = useState<CompanyData>({ ...db.company });
  const [successMsg, setSuccessMsg] = useState('');
  const [importText, setImportText] = useState('');

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    wholesaleStore.updateCompany(company);
    setSuccessMsg('تم حفظ وتحديث بيانات الوكالة والنسب بنجاح.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleExportJson = () => {
    const dataStr = wholesaleStore.exportJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fruit67_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const [errorMsg, setErrorMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleImportJson = () => {
    if (!importText.trim()) return;
    setErrorMsg('');
    const ok = wholesaleStore.importJson(importText.trim());
    if (ok) {
      setSuccessMsg('تم استيراد قاعدة البيانات وتحديث جميع الجداول والشاشات بنجاح.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setImportText('');
    } else {
      setErrorMsg('صيغة ملف JSON غير صحيحة، يرجى التأكد من محتوى الملف.');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  const handleResetData = () => {
    wholesaleStore.resetToDefault();
    setCompany({ ...wholesaleStore.getState().company });
    setShowResetConfirm(false);
    setSuccessMsg('تمت استعادة البيانات الافتراضية بنجاح.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold shadow">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>إعدادات الوكالة وقاعدة البيانات (w_company_data)</span>
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">System Config</span>
            </h1>
            <p className="text-xs text-slate-500">
              ضبط الثوابت المحاسبية (العمولة، التنزيل، الوهبة)، إدارة النسخ الاحتياطي، والتكامل مع Firebase
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 text-rose-800 px-4 py-2.5 rounded-lg text-sm">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* VIEW 1: بيانات الشركة والثوابت (w_company_data) */}
        <form onSubmit={handleSaveCompany} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>بيانات الوكالة والثوابت المحاسبية (company_data)</span>
          </h3>

          <div>
            <label className="block text-slate-600 font-medium mb-1">اسم الفرع / الوكالة (branch)</label>
            <input
              type="text"
              value={company.branch}
              onChange={e => setCompany({ ...company, branch: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">نسبة العمولة الافتراضية (comission)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={company.comission}
                  onChange={e => setCompany({ ...company, comission: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
                  required
                />
                <span className="text-slate-500 font-mono text-xs">{(company.comission * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">نسبة رسم البياعة (byaaa)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={company.byaaa}
                  onChange={e => setCompany({ ...company, byaaa: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
                  required
                />
                <span className="text-slate-500 font-mono text-xs">{(company.byaaa * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">أجرة التنزيل الافتراضية (tanzil)</label>
              <input
                type="number"
                value={company.tanzil}
                onChange={e => setCompany({ ...company, tanzil: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">الوهبة / الإكرامية الافتراضية (wahba)</label>
              <input
                type="number"
                value={company.wahba}
                onChange={e => setCompany({ ...company, wahba: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">هاتف الوكالة (tel)</label>
            <input
              type="text"
              value={company.tel}
              onChange={e => setCompany({ ...company, tel: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow flex items-center justify-center gap-1.5 mt-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ بيانات الوكالة</span>
          </button>
        </form>

        {/* VIEW 2: النسخ الاحتياطي والـ Firebase */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>النسخ الاحتياطي وإدارة البيانات (Backup & Firebase)</span>
          </h3>

          <div className="space-y-3">
            {/* تصدير نسخة احتياطية */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">تصدير نسخة احتياطية كاملة (JSON)</span>
                <span className="text-[11px] text-slate-500">حفظ كافة النقلات والفواتير والعملاء والموردين بملف</span>
              </div>
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded font-semibold text-xs shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل النسخة</span>
              </button>
            </div>

            {/* استيراد نسخة احتياطية */}
            <div className="space-y-1.5">
              <label className="block text-slate-600 font-medium">استيراد نسخة احتياطية (ألصق كود الـ JSON هنا):</label>
              <textarea
                rows={3}
                placeholder="ألصق كود JSON للنسخة الاحتياطية هنا لاستعادتها..."
                value={importText}
                onChange={e => setImportText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={handleImportJson}
                className="w-full py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>استعادة البيانات من النص الملصق</span>
              </button>
            </div>

            {/* Firebase Card */}
            <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>التكامل مع قاعدة بيانات Firebase Firestore</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                هياكل الجداول في هذا النظام مطابقة بنسبة 100% لمجموعات Firestore:
                <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded font-mono text-[10px]">naklat</code>,
                <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded font-mono text-[10px]">fatora_f</code>,
                <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded font-mono text-[10px]">safi_fatora</code>,
                <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded font-mono text-[10px]">suppliers</code>,
                <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded font-mono text-[10px]">customers</code>,
                <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded font-mono text-[10px]">branch_exps</code>.
              </p>
            </div>

            {/* إعادة ضبط المصنع */}
            <div className="pt-2 border-t border-slate-200 flex flex-col items-end gap-2">
              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-rose-600 hover:text-rose-800 font-semibold text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط البيانات للوضع الافتراضي الأولي</span>
                </button>
              ) : (
                <div className="bg-rose-50 border border-rose-300 p-2.5 rounded text-xs flex items-center justify-between gap-3 w-full">
                  <span className="text-rose-800 font-bold">هل أنت متأكد من رغبتك في استعادة البيانات الافتراضية الأولية؟</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded hover:bg-rose-700"
                    >
                      تأكيد الاستعادة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
