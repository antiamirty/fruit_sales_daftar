import React, { useState } from 'react';
import { PBWindowFrame } from '../components/layout/PBWindowFrame';
import { wholesaleStore } from '../services/storage';
import { Nakla } from '../types/schema';
import { Truck, Edit, CheckCircle, Search, DollarSign, Filter } from 'lucide-react';

interface NaklaManagementWindowProps {
  mode?:
    | 'w_nakla_editing'
    | 'w_nakla_name_edit'
    | 'w_sup_naklat_masrofa'
    | 'w_sup_naklat_not_masrofa'
    | 'w_farm_naklat_masrofa'
    | 'w_farm_naklat_not_masrofa';
  onClose?: () => void;
  onSelectNaklaForSale?: (naklaId: number) => void;
  onSelectNaklaForSettle?: (naklaId: number) => void;
}

export const NaklaManagementWindow: React.FC<NaklaManagementWindowProps> = ({
  mode = 'w_nakla_editing',
  onClose,
  onSelectNaklaForSale,
  onSelectNaklaForSettle
}) => {
  const db = wholesaleStore.getState();
  const [activeMode, setActiveMode] = useState(mode);

  // Filter State
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing State
  const [selectedNaklaId, setSelectedNaklaId] = useState<number | null>(null);
  const [editNaklaName, setEditNaklaName] = useState('');
  const [editDriverName, setEditDriverName] = useState('');
  const [editTruckPlate, setEditTruckPlate] = useState('');
  const [editComission, setEditComission] = useState<number>(0.07);
  const [message, setMessage] = useState('');

  const handleStartEdit = (n: Nakla) => {
    setSelectedNaklaId(n.nakla_id);
    setEditNaklaName(n.nakla_name);
    setEditDriverName(n.driver_name || '');
    setEditTruckPlate(n.truck_plate || '');
    setEditComission(n.comission || 0.07);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNaklaId) return;

    wholesaleStore.updateNakla(selectedNaklaId, {
      nakla_name: editNaklaName,
      driver_name: editDriverName,
      truck_plate: editTruckPlate,
      comission: editComission
    });

    setMessage(`تم حفظ تعديل بيانات النقلة رقم ${selectedNaklaId} بنجاح`);
    setSelectedNaklaId(null);
  };

  // Determine window title
  const getWindowTitle = () => {
    switch (activeMode) {
      case 'w_nakla_editing':
        return 'تعديل النقلات';
      case 'w_nakla_name_edit':
        return 'تعديل اسم النقلة';
      case 'w_sup_naklat_masrofa':
        return 'نقلات مورد مصروفة';
      case 'w_sup_naklat_not_masrofa':
        return 'نقلات مورد غير مصروفة';
      case 'w_farm_naklat_masrofa':
        return 'نقلات مزرعة مصروفة';
      case 'w_farm_naklat_not_masrofa':
        return 'نقلات مزرعة غير مصروفة';
      default:
        return 'النقلات';
    }
  };

  // Filtered List based on mode
  const filteredNaklat = db.naklat.filter(n => {
    // Mode specific filtering
    if (activeMode === 'w_sup_naklat_masrofa' || activeMode === 'w_farm_naklat_masrofa') {
      if (!n.nakla_sarf) return false;
    }
    if (activeMode === 'w_sup_naklat_not_masrofa' || activeMode === 'w_farm_naklat_not_masrofa') {
      if (n.nakla_sarf) return false;
    }

    // Dropdown filters
    if (selectedSupplier !== 'all' && n.sup_name !== selectedSupplier) {
      return false;
    }
    if (selectedFarm !== 'all' && n.farm_name !== selectedFarm) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.nakla_name.toLowerCase().includes(q) ||
        n.sup_name.toLowerCase().includes(q) ||
        n.farm_name.toLowerCase().includes(q) ||
        String(n.nakla_number).includes(q)
      );
    }
    return true;
  });

  return (
    <PBWindowFrame
      windowCode={activeMode}
      windowTitle={getWindowTitle()}
      onClose={onClose}
      statusInfo={`النقلات المعروضة: ${filteredNaklat.length} من إجمالي ${db.naklat.length}`}
    >
      {/* Sub Navigation Bar inside window */}
      <div className="flex items-center gap-1 mb-3 border-b border-slate-300 pb-2 flex-wrap">
        <button
          onClick={() => setActiveMode('w_nakla_editing')}
          className={`px-3 py-1 font-bold text-xs border-2 shadow-sm ${
            activeMode === 'w_nakla_editing'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          تعديل النقلات
        </button>
        <button
          onClick={() => setActiveMode('w_nakla_name_edit')}
          className={`px-3 py-1 font-bold text-xs border-2 shadow-sm ${
            activeMode === 'w_nakla_name_edit'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          تعديل اسم النقلة
        </button>
        <button
          onClick={() => setActiveMode('w_sup_naklat_masrofa')}
          className={`px-3 py-1 font-bold text-xs border-2 shadow-sm ${
            activeMode === 'w_sup_naklat_masrofa'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          نقلات مورد مصروفة
        </button>
        <button
          onClick={() => setActiveMode('w_sup_naklat_not_masrofa')}
          className={`px-3 py-1 font-bold text-xs border-2 shadow-sm ${
            activeMode === 'w_sup_naklat_not_masrofa'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          نقلات مورد غير مصروفة
        </button>
        <button
          onClick={() => setActiveMode('w_farm_naklat_masrofa')}
          className={`px-3 py-1 font-bold text-xs border-2 shadow-sm ${
            activeMode === 'w_farm_naklat_masrofa'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          نقلات مزرعة مصروفة
        </button>
        <button
          onClick={() => setActiveMode('w_farm_naklat_not_masrofa')}
          className={`px-3 py-1 font-bold text-xs border-2 shadow-sm ${
            activeMode === 'w_farm_naklat_not_masrofa'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          نقلات مزرعة غير مصروفة
        </button>
      </div>

      {message && (
        <div className="mb-3 p-2 bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter Toolbar (DataWindow Filter Area) */}
      <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-2.5 mb-3 flex items-center gap-3 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-700" />
          <span className="font-bold">المورد:</span>
          <select
            value={selectedSupplier}
            onChange={e => setSelectedSupplier(e.target.value)}
            className="p-1 bg-white border border-slate-400 font-bold"
          >
            <option value="all">كل الموردين</option>
            {db.suppliers.map((s, idx) => (
              <option key={`nm_sup_${s.sup_id}_${idx}`} value={s.sup_name}>
                {s.sup_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-bold">المزرعة:</span>
          <select
            value={selectedFarm}
            onChange={e => setSelectedFarm(e.target.value)}
            className="p-1 bg-white border border-slate-400 font-bold"
          >
            <option value="all">كل المزارع</option>
            {db.farms.map((f, idx) => (
              <option key={`nm_farm_${f.farm_id}_${idx}`} value={f.farm_name}>
                {f.farm_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 mr-auto">
          <Search className="w-3.5 h-3.5 text-slate-700" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث برقم أو اسم النقلة..."
            className="p-1 bg-white border border-slate-400 w-48 shadow-inner"
          />
        </div>
      </div>

      {/* Modal / Inline Edit Form if editing */}
      {selectedNaklaId && (
        <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-500 shadow-md">
          <div className="font-bold text-amber-900 text-xs mb-2">
            تعديل بيانات النقلة رقم #{selectedNaklaId}
          </div>
          <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-0.5">اسم النقلة:</label>
              <input
                type="text"
                value={editNaklaName}
                onChange={e => setEditNaklaName(e.target.value)}
                className="w-full p-1 bg-white border border-slate-400 font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-0.5">اسم السائق:</label>
              <input
                type="text"
                value={editDriverName}
                onChange={e => setEditDriverName(e.target.value)}
                className="w-full p-1 bg-white border border-slate-400"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-0.5">رقم السيارة:</label>
              <input
                type="text"
                value={editTruckPlate}
                onChange={e => setEditTruckPlate(e.target.value)}
                className="w-full p-1 bg-white border border-slate-400"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-0.5">نسبة العمولة (0.07 = 7%):</label>
              <input
                type="number"
                step="0.01"
                value={editComission}
                onChange={e => setEditComission(Number(e.target.value))}
                className="w-full p-1 bg-white border border-slate-400 font-mono font-bold"
              />
            </div>
            <div className="md:col-span-4 flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="py-1 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold border-2 border-emerald-900"
              >
                حفظ التعديلات [F3]
              </button>
              <button
                type="button"
                onClick={() => setSelectedNaklaId(null)}
                className="py-1 px-3 bg-slate-200 hover:bg-slate-300 font-bold border border-slate-500"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DataWindow Grid: جدول النقلات */}
      <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-2.5 shadow-xs">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-2 py-1 text-xs font-bold mb-2 flex items-center justify-between">
          <span>DataWindow: dw_naklat_management (قائمة النقلات بحسب الفلتر)</span>
          <span className="font-mono text-[11px]">{filteredNaklat.length} نقلة</span>
        </div>

        <div className="overflow-x-auto border border-slate-400 bg-white">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-200 border-b-2 border-slate-400 sticky top-0 text-slate-900">
              <tr>
                <th className="p-1.5 border-l border-slate-300 text-center">رقم</th>
                <th className="p-1.5 border-l border-slate-300">التاريخ</th>
                <th className="p-1.5 border-l border-slate-300">اسم النقلة</th>
                <th className="p-1.5 border-l border-slate-300">المورد</th>
                <th className="p-1.5 border-l border-slate-300">المزرعة</th>
                <th className="p-1.5 border-l border-slate-300">السائق / السيارة</th>
                <th className="p-1.5 border-l border-slate-300 text-center">العمولة</th>
                <th className="p-1.5 border-l border-slate-300 text-center">حالة الصرف</th>
                <th className="p-1.5 text-center">إجراءات PowerBuilder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredNaklat.map((n, idx) => (
                <tr key={`nm_nakla_${n.nakla_id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-1.5 border-l border-slate-200 text-center font-mono font-bold text-blue-900">
                    {n.nakla_number}
                  </td>
                  <td className="p-1.5 border-l border-slate-200 font-mono text-slate-700">{n.nakla_date}</td>
                  <td className="p-1.5 border-l border-slate-200 font-bold text-slate-900">{n.nakla_name}</td>
                  <td className="p-1.5 border-l border-slate-200 text-emerald-900 font-bold">{n.sup_name}</td>
                  <td className="p-1.5 border-l border-slate-200 text-slate-700">{n.farm_name}</td>
                  <td className="p-1.5 border-l border-slate-200 text-slate-600">
                    {n.driver_name || '—'} {n.truck_plate ? `(${n.truck_plate})` : ''}
                  </td>
                  <td className="p-1.5 border-l border-slate-200 text-center font-mono font-bold">
                    {Math.round((n.comission || 0.07) * 100)}%
                  </td>
                  <td className="p-1.5 border-l border-slate-200 text-center">
                    {n.nakla_sarf ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded">
                        تم الصرف
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded">
                        لم تُصرف بعد
                      </span>
                    )}
                  </td>
                  <td className="p-1.5 text-center flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleStartEdit(n)}
                      className="px-2 py-0.5 bg-slate-200 hover:bg-slate-100 border border-slate-400 font-bold text-blue-900"
                    >
                      تعديل
                    </button>
                    {onSelectNaklaForSale && (
                      <button
                        onClick={() => onSelectNaklaForSale(n.nakla_id)}
                        className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 font-bold text-emerald-900"
                        title="فتح فاتورة بيع لهذه النقلة"
                      >
                        بيع
                      </button>
                    )}
                    {onSelectNaklaForSettle && (
                      <button
                        onClick={() => onSelectNaklaForSettle(n.nakla_id)}
                        className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 border border-blue-400 font-bold text-blue-900"
                        title="تصفية وصرف النقلة"
                      >
                        تصفية
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredNaklat.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center p-4 text-slate-500">
                    لا توجد نقلات مطابقة للفلتر المحدد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PBWindowFrame>
  );
};
