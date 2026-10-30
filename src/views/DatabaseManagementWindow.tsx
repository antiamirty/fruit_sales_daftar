import React, { useState, useEffect, useMemo } from 'react';
import { wholesaleStore } from '../services/storage';
import { AppUser, Customer, CompanyData } from '../types/schema';
import {
  Database,
  Lock,
  User,
  Eye,
  EyeOff,
  Edit,
  Save,
  Trash2,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  X,
  Minus,
  Maximize2,
  DollarSign,
  Users,
  ShieldCheck,
  Building2,
  FolderOpen,
  Server
} from 'lucide-react';
import { SqlServerConnectWindow } from './SqlServerConnectWindow';

export type DatabaseWindowMode =
  | 'w_change_password_user'
  | 'w_arseda_madeena'
  | 'db_restore'
  | 'w_sql_server_connect';

interface DatabaseManagementWindowProps {
  initialMode?: DatabaseWindowMode;
  onClose?: () => void;
}

export const DatabaseManagementWindow: React.FC<DatabaseManagementWindowProps> = ({
  initialMode = 'w_change_password_user',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<DatabaseWindowMode>(initialMode);

  // Sync if initialMode changes
  useEffect(() => {
    if (initialMode) {
      setActiveTab(initialMode);
    }
  }, [initialMode]);

  // Global store sync
  const [dbState, setDbState] = useState(wholesaleStore.getState());
  useEffect(() => {
    return wholesaleStore.subscribe(() => setDbState(wholesaleStore.getState()));
  }, []);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionName: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionName: '',
    onConfirm: () => {},
    isDangerous: true
  });

  // ==========================================
  // TAB 1: تعديل كلمة المرور واسم المستخدم (w_change_password_user)
  // ==========================================
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('مدير النظام');
  const [showPassword, setShowPassword] = useState(false);
  const [backupPathInput, setBackupPathInput] = useState(dbState.backup_path || 'C:\\fruit67_backup');

  // Load first user by default if available
  useEffect(() => {
    const users = dbState.users || [];
    if (users.length > 0 && selectedUserId === null) {
      setSelectedUserId(users[0].id);
      setUsernameInput(users[0].username);
      setPasswordInput(users[0].password);
      setRoleInput(users[0].role || 'مدير النظام');
    }
  }, [dbState.users]);

  const handleSelectUser = (user: AppUser) => {
    setSelectedUserId(user.id);
    setUsernameInput(user.username);
    setPasswordInput(user.password);
    setRoleInput(user.role || 'مستخدم');
  };

  const handleSaveUser = () => {
    if (!usernameInput.trim()) {
      showFeedback('يرجى إدخال اسم المستخدم أولاً', 'error');
      return;
    }
    if (!passwordInput.trim()) {
      showFeedback('يرجى إدخال كلمة المرور', 'error');
      return;
    }

    if (selectedUserId) {
      wholesaleStore.updateUser(selectedUserId, usernameInput.trim(), passwordInput.trim(), roleInput);
      showFeedback(`تم تعديل بيانات المستخدم [${usernameInput}] بنجاح.`);
    } else {
      const added = wholesaleStore.addUser({
        username: usernameInput.trim(),
        password: passwordInput.trim(),
        role: roleInput
      });
      setSelectedUserId(added.id);
      showFeedback(`تم إضافة المستخدم الجديد [${usernameInput}] بنجاح.`);
    }
  };

  const handleNewUser = () => {
    setSelectedUserId(null);
    setUsernameInput('');
    setPasswordInput('');
    setRoleInput('كاشير');
  };

  const handleDeleteSelectedUser = () => {
    if (!selectedUserId) return;
    const user = dbState.users?.find(u => u.id === selectedUserId);
    if (!user) return;

    if ((dbState.users || []).length <= 1) {
      showFeedback('لا يمكن حذف المستخدم الأخير في النظام!', 'error');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'تأكيد حذف المستخدم',
      message: `هل أنت متأكد من حذف المستخدم [${user.username}] من النظام نهائياً؟`,
      actionName: 'حذف المستخدم',
      isDangerous: true,
      onConfirm: () => {
        wholesaleStore.deleteUser(user.id);
        setSelectedUserId(null);
        setUsernameInput('');
        setPasswordInput('');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showFeedback(`تم حذف المستخدم [${user.username}] بنجاح.`);
      }
    });
  };

  const handleSaveBackupPath = () => {
    wholesaleStore.setBackupPath(backupPathInput.trim());
    // Also trigger instant backup download
    const dataStr = wholesaleStore.exportJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanPathName = backupPathInput.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `fruit67_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showFeedback(`تم حفظ مسار النسخة الاحتياطية [${backupPathInput}] وتصدير الملف بنجاح.`);
  };

  // Dangerous bottom button handlers
  const handleEmptyDatabase = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'تحذير أمني: تفريغ قاعدة البيانات بالكامل',
      message:
        'هل أنت متأكد تماماً من تفريغ كافة الحركات والعمليات (المبيعات، النقلات، الفواتير، حركات الخزينة، والمصروفات)؟\nسيتم الإبقاء على أسماء الموردين والزبائن والأصناف مع تصفير حركاتهم اليومية.',
      actionName: 'نعم، تفريغ الحركات الآن',
      isDangerous: true,
      onConfirm: () => {
        wholesaleStore.purgeDatabase();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showFeedback('تم تفريغ كافة حركات قاعدة البيانات بنجاح.');
      }
    });
  };

  const handleDeleteSuppliers = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'تحذير: حذف جميع الموردين',
      message: 'هل أنت متأكد من حذف كافة الموردين المسجلين ومزارعهم ومصروفات مزارعهم نهائياً؟',
      actionName: 'نعم، حذف كافة الموردين',
      isDangerous: true,
      onConfirm: () => {
        wholesaleStore.deleteAllSuppliers();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showFeedback('تم حذف جميع الموردين ومزارعهم بنجاح.');
      }
    });
  };

  const handleDeleteFarms = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'تحذير: حذف جميع المزارع',
      message: 'هل أنت متأكد من حذف كافة المزارع ومصروفاتها من قاعدة البيانات؟',
      actionName: 'نعم، حذف المزارع',
      isDangerous: true,
      onConfirm: () => {
        wholesaleStore.deleteAllFarms();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showFeedback('تم حذف جميع المزارع بنجاح.');
      }
    });
  };

  const handleDeleteCategories = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'تحذير: حذف جميع الأصناف',
      message: 'هل أنت متأكد من حذف جدول الأصناف بالكامل من النظام؟',
      actionName: 'نعم، حذف الأصناف',
      isDangerous: true,
      onConfirm: () => {
        wholesaleStore.deleteAllCategories();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showFeedback('تم حذف جميع الأصناف بنجاح.');
      }
    });
  };

  const handleDeleteCustomers = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'تحذير: حذف جميع الزبائن',
      message: 'هل أنت متأكد من حذف كافة الزبائن والتجار من النظام نهائياً؟',
      actionName: 'نعم، حذف الزبائن',
      isDangerous: true,
      onConfirm: () => {
        wholesaleStore.deleteAllCustomers();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showFeedback('تم حذف جميع الزبائن بنجاح.');
      }
    });
  };

  const handleClearAllMockData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'إلغاء وتطهير البيانات الافتراضية بالكامل',
      message: 'هل أنت متأكد من إلغاء وتفريغ كافة البيانات الافتراضية والتجريبية من قاعدة البيانات لتبدأ الجداول نظيفة تماماً 100% ومطابقة لسيرفر SQL Server؟',
      actionName: 'نعم، إلغاء البيانات الافتراضية',
      isDangerous: true,
      onConfirm: () => {
        wholesaleStore.clearAllMockData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showFeedback('تم إلغاء كافة البيانات الافتراضية وقاعدة البيانات نظيفة الآن وجاهزة للمزامنة.');
      }
    });
  };

  // ==========================================
  // TAB 2: أرصدة مدينة (w_arseda_madeena)
  // ==========================================
  const [customerFilter, setCustomerFilter] = useState<string>('الكل');
  const [balanceFilterType, setBalanceFilterType] = useState<'all' | 'debtors' | 'zero'>('debtors');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustBalance, setEditingCustBalance] = useState<{ id: number; name: string; balance: number } | null>(null);

  const debtorBalancesList = useMemo(() => {
    const list = wholesaleStore.getDebtorBalancesData();

    return list.filter(row => {
      // Customer name dropdown
      if (customerFilter !== 'الكل' && row.customer_name !== customerFilter) {
        return false;
      }
      // Balance type filter
      if (balanceFilterType === 'debtors' && row.currentDebitBalance <= 0) {
        return false;
      }
      if (balanceFilterType === 'zero' && row.currentDebitBalance !== 0) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = row.customer_name.toLowerCase().includes(q);
        const matchCode = String(row.customer_code).includes(q);
        const matchPhone = row.customer_mobile.includes(q);
        if (!matchName && !matchCode && !matchPhone) return false;
      }
      return true;
    });
  }, [dbState, customerFilter, balanceFilterType, searchQuery]);

  const totalDebtorAmount = useMemo(() => {
    return debtorBalancesList.reduce((s, r) => s + (r.currentDebitBalance > 0 ? r.currentDebitBalance : 0), 0);
  }, [debtorBalancesList]);

  const totalDebtorsCount = useMemo(() => {
    return debtorBalancesList.filter(r => r.currentDebitBalance > 0).length;
  }, [debtorBalancesList]);

  const maxDebtor = useMemo(() => {
    if (debtorBalancesList.length === 0) return null;
    return debtorBalancesList.reduce((max, r) => (r.currentDebitBalance > max.currentDebitBalance ? r : max), debtorBalancesList[0]);
  }, [debtorBalancesList]);

  const handleSaveCustomerBalance = () => {
    if (!editingCustBalance) return;
    wholesaleStore.updateCustomerBalance(editingCustBalance.id, editingCustBalance.balance);
    showFeedback(`تم تحديث رصيد الزبون [${editingCustBalance.name}] إلى ${editingCustBalance.balance.toLocaleString()} ج.`);
    setEditingCustBalance(null);
  };

  const handlePrintDebtorReport = () => {
    window.print();
  };

  // ==========================================
  // TAB 3: النسخ الاحتياطي وإعدادات الوكالة (db_restore)
  // ==========================================
  const [companyForm, setCompanyForm] = useState<CompanyData>({ ...dbState.company });
  const [importJsonText, setImportJsonText] = useState('');

  const handleSaveCompanyForm = (e: React.FormEvent) => {
    e.preventDefault();
    wholesaleStore.updateCompany(companyForm);
    showFeedback('تم حفظ وتحديث بيانات الوكالة والثوابت بنجاح.');
  };

  const handleImportJsonFile = () => {
    if (!importJsonText.trim()) return;
    const ok = wholesaleStore.importJson(importJsonText.trim());
    if (ok) {
      showFeedback('تم استيراد نسخة قاعدة البيانات وتحديث كافة الجداول بنجاح.');
      setImportJsonText('');
    } else {
      showFeedback('صيغة كود JSON غير صحيحة، يرجى التأكد من الملف.', 'error');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 font-sans pb-10" dir="rtl">
      {/* 1. Classic PowerBuilder Blue/Navy Title Window Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-t-lg border-2 border-slate-700 shadow-md">
        <div className="flex items-center justify-between px-3 py-2 border-b border-indigo-800/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-400 text-slate-950 rounded flex items-center justify-center font-bold text-xs shadow-inner">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide">
                  {activeTab === 'w_change_password_user' && 'تعديل كلمة المرور و اسم المستخدم'}
                  {activeTab === 'w_arseda_madeena' && 'ارصدة مدينة - كشف أرصدة الزبائن'}
                  {activeTab === 'db_restore' && 'إدارة قاعدة البيانات والنسخ الاحتياطي'}
                </span>
                <span className="text-[10px] font-mono text-amber-300 bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700">
                  {activeTab}
                </span>
              </div>
              <span className="text-[11px] text-slate-300">
                القائمة 12: قاعدة البيانات وإدارة صلاحيات المستخدمين والأرصدة المدينة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => showFeedback('تم تصغير النافذة في شريط المهام', 'info')}
              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded flex items-center justify-center text-xs border border-slate-600"
              title="تصغير"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded flex items-center justify-center text-xs border border-slate-600"
              title="تكبير"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-6 h-6 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white rounded flex items-center justify-center text-xs font-bold border border-rose-600 ml-1"
                title="إغلاق النافذة"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex flex-wrap items-center gap-1 px-2 pt-2 bg-slate-900/90 text-xs border-t border-slate-800">
          <button
            onClick={() => setActiveTab('w_change_password_user')}
            className={`px-3 py-1.5 rounded-t font-semibold flex items-center gap-1.5 transition-colors border-t-2 ${
              activeTab === 'w_change_password_user'
                ? 'bg-slate-100 text-slate-900 border-amber-500 font-bold shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border-transparent'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>[12-1] تعديل كلمة المرور و اسم المستخدم</span>
          </button>

          <button
            onClick={() => setActiveTab('w_arseda_madeena')}
            className={`px-3 py-1.5 rounded-t font-semibold flex items-center gap-1.5 transition-colors border-t-2 ${
              activeTab === 'w_arseda_madeena'
                ? 'bg-slate-100 text-slate-900 border-amber-500 font-bold shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>[12-2] ارصدة مدينة (أرصدة الزبائن)</span>
          </button>

          <button
            onClick={() => setActiveTab('db_restore')}
            className={`px-3 py-1.5 rounded-t font-semibold flex items-center gap-1.5 transition-colors border-t-2 ${
              activeTab === 'db_restore'
                ? 'bg-slate-100 text-slate-900 border-amber-500 font-bold shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border-transparent'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>[12-3] النسخ الاحتياطي وثوابت الوكالة</span>
          </button>

          <button
            onClick={() => setActiveTab('w_sql_server_connect')}
            className={`px-3 py-1.5 rounded-t font-semibold flex items-center gap-1.5 transition-colors border-t-2 ${
              activeTab === 'w_sql_server_connect'
                ? 'bg-slate-100 text-slate-900 border-amber-500 font-bold shadow'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border-transparent'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>[12-4] اتصال SQL Server (local1) واستعراض الجداول</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-sky-50 border-sky-300 text-sky-800'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: w_change_password_user (مطابق تماماً للشاشة الأولى من صور الباور بيلدر) */}
      {/* ========================================================================= */}
      {activeTab === 'w_change_password_user' && (
        <div className="bg-slate-200 p-4 rounded-b-lg border-2 border-t-0 border-slate-400 shadow-md space-y-4">
          {/* Box 1: تعديل المستخدم وكلمة المرور (Top Beveled Box) */}
          <div className="bg-white p-4 rounded border-2 border-slate-300 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* اسم المستخدم */}
              <div className="md:col-span-4 flex items-center gap-2">
                <label className="font-bold text-slate-800 text-xs shrink-0 w-24">
                  اسم المستخدم :
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="اسم المستخدم"
                  className="w-full bg-slate-50 border-2 border-slate-400 rounded px-2.5 py-1.5 font-bold text-slate-900 text-xs shadow-inner focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              {/* كلمة المرور */}
              <div className="md:col-span-4 flex items-center gap-2">
                <label className="font-bold text-slate-800 text-xs shrink-0 w-24">
                  كلمة المرور :
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="كلمة المرور"
                    className="w-full bg-slate-50 border-2 border-slate-400 rounded px-2.5 py-1.5 font-mono font-bold text-slate-900 text-xs shadow-inner focus:outline-none focus:border-indigo-600 focus:bg-white pl-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                    title={showPassword ? 'إخفاء' : 'إظهار'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* تشيك بوكس إظهار وزر تعديل */}
              <div className="md:col-span-4 flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800 select-none">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={e => setShowPassword(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-400 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>اظهار</span>
                </label>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={handleSaveUser}
                    className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-900 font-bold text-xs rounded border-2 border-t-white border-l-white border-b-slate-600 border-r-slate-600 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-indigo-700" />
                    <span>تعديل</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNewUser}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-400"
                    title="إضافة مستخدم جديد"
                  >
                    مستخدم جديد +
                  </button>
                  {selectedUserId && (
                    <button
                      type="button"
                      onClick={handleDeleteSelectedUser}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded border border-rose-300"
                      title="حذف المستخدم المختار"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: جدول عرض المستخدمين (dw_users DataWindow Table) */}
          <div className="bg-white rounded border-2 border-slate-400 shadow overflow-hidden">
            <div className="bg-slate-800 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
              <span>قائمة المستخدمين المسجلين (DataWindow: dw_users)</span>
              <span className="text-[11px] font-normal text-slate-300">
                انقر على أي مستخدم لاختياره وتعديل بياناته
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-200 text-slate-800 font-bold sticky top-0 border-b-2 border-slate-400">
                  <tr>
                    <th className="p-2 border-l border-slate-300 w-12 text-center">م</th>
                    <th className="p-2 border-l border-slate-300">اسم المستخدم</th>
                    <th className="p-2 border-l border-slate-300">كلمة المرور</th>
                    <th className="p-2 border-l border-slate-300">الصلاحية / الوظيفة</th>
                    <th className="p-2 text-center w-28">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(dbState.users || []).map((u, idx) => {
                    const isSelected = selectedUserId === u.id;
                    return (
                      <tr
                        key={`db_user_${u.id}_${idx}`}
                        onClick={() => handleSelectUser(u)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-100 font-bold text-slate-950'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-slate-100'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <td className="p-2 text-center font-mono border-l border-slate-200 text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="p-2 border-l border-slate-200 font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{u.username}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-amber-400 text-slate-950 px-1 rounded font-normal mr-2">
                              محدد حالياً
                            </span>
                          )}
                        </td>
                        <td className="p-2 border-l border-slate-200 font-mono text-slate-700">
                          {showPassword ? u.password : '••••••••'}
                        </td>
                        <td className="p-2 border-l border-slate-200 text-slate-700">
                          <span className="inline-block px-2 py-0.5 bg-slate-200 rounded text-[11px] font-medium text-slate-800">
                            {u.role || 'مستخدم عام'}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleSelectUser(u);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 rounded border border-indigo-200 text-[11px] font-semibold"
                          >
                            تحديد
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Box 3: مسار النسخة الاحتياطية (Backup Path Box) */}
          <div className="bg-white p-3.5 rounded border-2 border-slate-300 shadow-inner flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <label className="font-bold text-slate-800 text-xs shrink-0">
                مسار النسخة الاحتياطية :
              </label>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={backupPathInput}
                  onChange={e => setBackupPathInput(e.target.value)}
                  placeholder="C:\fruit67_backup"
                  className="w-full bg-slate-50 border-2 border-slate-400 rounded px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 shadow-inner focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveBackupPath}
                className="px-6 py-1.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-900 font-bold text-xs rounded border-2 border-t-white border-l-white border-b-slate-600 border-r-slate-600 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-emerald-700" />
                <span>حفظ</span>
              </button>
            </div>
          </div>

          {/* Box 4: أزرار إدارة قاعدة البيانات السفلية (PowerBuilder 3D Buttons Strip) */}
          <div className="bg-slate-300 p-3 rounded border-2 border-slate-400 shadow">
            <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>إجراءات مسح وحذف البيانات (الباور بيلدر):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {/* تفريغ قاعدة البيانات */}
              <button
                type="button"
                onClick={handleEmptyDatabase}
                className="py-2 px-2 bg-slate-100 hover:bg-rose-50 active:bg-slate-300 text-rose-800 font-bold text-xs rounded border-2 border-t-white border-l-white border-b-slate-600 border-r-slate-600 shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-colors"
                title="تفريغ الحركات اليومية والمبيعات والنقلات"
              >
                <Database className="w-4 h-4 text-rose-600" />
                <span>تفريغ قاعدة البيانات</span>
              </button>

              {/* حذف الموردين */}
              <button
                type="button"
                onClick={handleDeleteSuppliers}
                className="py-2 px-2 bg-slate-100 hover:bg-rose-50 active:bg-slate-300 text-slate-900 font-bold text-xs rounded border-2 border-t-white border-l-white border-b-slate-600 border-r-slate-600 shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-colors"
                title="حذف جميع الموردين ومزارعهم ومصروفاتهم"
              >
                <Trash2 className="w-4 h-4 text-amber-600" />
                <span>حذف الموردين</span>
              </button>

              {/* حذف المزارع */}
              <button
                type="button"
                onClick={handleDeleteFarms}
                className="py-2 px-2 bg-slate-100 hover:bg-rose-50 active:bg-slate-300 text-slate-900 font-bold text-xs rounded border-2 border-t-white border-l-white border-b-slate-600 border-r-slate-600 shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-colors"
                title="حذف جميع المزارع ومصروفاتها"
              >
                <Trash2 className="w-4 h-4 text-orange-600" />
                <span>حذف المزارع</span>
              </button>

              {/* حذف الاصناف */}
              <button
                type="button"
                onClick={handleDeleteCategories}
                className="py-2 px-2 bg-slate-100 hover:bg-rose-50 active:bg-slate-300 text-slate-900 font-bold text-xs rounded border-2 border-t-white border-l-white border-b-slate-600 border-r-slate-600 shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-colors"
                title="حذف جميع الأصناف من النظام"
              >
                <Trash2 className="w-4 h-4 text-yellow-600" />
                <span>حذف الاصناف</span>
              </button>

              {/* حذف الزبائن */}
              <button
                type="button"
                onClick={handleDeleteCustomers}
                className="py-2 px-2 bg-slate-100 hover:bg-rose-50 active:bg-slate-300 text-slate-900 font-bold text-xs rounded border-2 border-t-white border-l-white border-b-slate-600 border-r-slate-600 shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-colors"
                title="حذف جميع الزبائن والتجار"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>حذف الزبائن</span>
              </button>

              {/* إلغاء وتطهير البيانات الافتراضية بالكامل */}
              <button
                type="button"
                onClick={handleClearAllMockData}
                className="col-span-2 sm:col-span-3 md:col-span-5 py-2 px-3 bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs rounded border border-rose-950 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors mt-1"
                title="إلغاء كافة السجلات التجريبية وتفريغ الجداول لتكون مطابقة تماماً لقاعدة البيانات"
              >
                <Trash2 className="w-4 h-4 text-amber-300" />
                <span>إلغاء وتطهير كافة البيانات الافتراضية (بدء بجداول نظيفة لمزامنة SQL Server)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: w_arseda_madeena (ارصدة مدينة - مطابقة لشاشة الأرصدة المدينة) */}
      {/* ========================================================================= */}
      {activeTab === 'w_arseda_madeena' && (
        <div className="bg-slate-200 p-4 rounded-b-lg border-2 border-t-0 border-slate-400 shadow-md space-y-4">
          {/* Top Control and Filter Bar */}
          <div className="bg-white p-3.5 rounded border-2 border-slate-300 shadow-inner space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
              {/* اختيار الزبون */}
              <div className="md:col-span-4 flex items-center gap-2">
                <label className="font-bold text-slate-800 shrink-0">اسم الزبون :</label>
                <select
                  value={customerFilter}
                  onChange={e => setCustomerFilter(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-400 rounded px-2.5 py-1.5 font-bold text-slate-900"
                >
                  <option value="الكل">-- جميع الزبائن --</option>
                  {dbState.customers.map((c, cIdx) => (
                    <option key={`db_c_${c.customer_id}_${cIdx}`} value={c.customer_name}>
                      {c.customer_name} (كود: {c.customer_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* نوع الأرصدة */}
              <div className="md:col-span-4 flex items-center gap-3">
                <label className="font-bold text-slate-800 shrink-0">تصفية الأرصدة :</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="balFilter"
                      checked={balanceFilterType === 'debtors'}
                      onChange={() => setBalanceFilterType('debtors')}
                      className="cursor-pointer"
                    />
                    <span>المدينين فقط (&gt; 0)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="balFilter"
                      checked={balanceFilterType === 'all'}
                      onChange={() => setBalanceFilterType('all')}
                      className="cursor-pointer"
                    />
                    <span>الكل</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="balFilter"
                      checked={balanceFilterType === 'zero'}
                      onChange={() => setBalanceFilterType('zero')}
                      className="cursor-pointer"
                    />
                    <span>صفرية</span>
                  </label>
                </div>
              </div>

              {/* بحث سريع */}
              <div className="md:col-span-4 flex items-center gap-2">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="بحث باسم الزبون أو الكود..."
                    className="w-full bg-slate-50 border-2 border-slate-400 rounded pr-8 pl-2.5 py-1.5 font-bold text-slate-900 placeholder:font-normal"
                  />
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                <span>عدد السجلات المطابقة:</span>
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {debtorBalancesList.length} زبون
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintDebtorReport}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs border border-slate-400 flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-700" />
                  <span>طباعة كشف الأرصدة المدينة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = JSON.stringify(debtorBalancesList, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `debtor_balances_${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    showFeedback('تم تصدير كشف الأرصدة المدينة بنجاح.');
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs border border-slate-400 flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>تصدير ملف</span>
                </button>
              </div>
            </div>
          </div>

          {/* DataWindow Grid for Debtor Balances */}
          <div className="bg-white rounded border-2 border-slate-400 shadow overflow-hidden">
            <div className="bg-slate-800 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
              <span>كشف الأرصدة المدينة للزبائن (DataWindow: dw_arseda_madeena)</span>
              <span className="text-[11px] font-mono text-amber-300">
                إجمالي المديونية: {totalDebtorAmount.toLocaleString()} ج.م
              </span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-200 text-slate-900 font-bold sticky top-0 border-b-2 border-slate-400">
                  <tr>
                    <th className="p-2 border-l border-slate-300 w-10 text-center">م</th>
                    <th className="p-2 border-l border-slate-300 w-16 text-center">الكود</th>
                    <th className="p-2 border-l border-slate-300">اسم الزبون</th>
                    <th className="p-2 border-l border-slate-300">الهاتف / العنوان</th>
                    <th className="p-2 border-l border-slate-300 text-center">المسحوبات (مدين)</th>
                    <th className="p-2 border-l border-slate-300 text-center">المسدد (دائن)</th>
                    <th className="p-2 border-l border-slate-300 text-center font-bold text-rose-800">
                      الرصيد المدين الحالي
                    </th>
                    <th className="p-2 border-l border-slate-300 text-center">رصيد الفوارغ</th>
                    <th className="p-2 text-center w-28">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {debtorBalancesList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                        لا توجد أرصدة زبائن مطابقة لخيارات البحث الحالية
                      </td>
                    </tr>
                  ) : (
                    debtorBalancesList.map((row, idx) => {
                      const isDebtor = row.currentDebitBalance > 0;
                      return (
                        <tr
                          key={row.customer_id}
                          className={`hover:bg-amber-50/60 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                          }`}
                        >
                          <td className="p-2 text-center font-mono border-l border-slate-200 text-slate-600">
                            {idx + 1}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-l border-slate-200 text-slate-800">
                            {row.customer_code}
                          </td>
                          <td className="p-2 border-l border-slate-200 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{row.customer_name}</span>
                              {row.special && (
                                <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1 rounded border border-indigo-200">
                                  زبون خاص
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 border-l border-slate-200 text-slate-600 text-[11px]">
                            {row.customer_mobile !== '-' ? row.customer_mobile : row.customer_address}
                          </td>
                          <td className="p-2 text-center font-mono border-l border-slate-200 text-slate-700">
                            {row.totalPurchases.toLocaleString()}
                          </td>
                          <td className="p-2 text-center font-mono border-l border-slate-200 text-emerald-700 font-semibold">
                            {row.totalPaid.toLocaleString()}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-l border-slate-200">
                            {isDebtor ? (
                              <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-300">
                                {row.currentDebitBalance.toLocaleString()} ج.م
                              </span>
                            ) : (
                              <span className="text-slate-500 font-semibold">0 ج.م</span>
                            )}
                          </td>
                          <td className="p-2 text-center font-mono border-l border-slate-200 text-slate-700">
                            {row.crates_balance} فارغ
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingCustBalance({
                                  id: row.customer_id,
                                  name: row.customer_name,
                                  balance: row.currentDebitBalance
                                })
                              }
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 rounded border border-indigo-300 text-[11px] font-bold"
                            >
                              تعديل الرصيد
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Totals Summary Strip */}
            <div className="bg-slate-100 p-3 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded border border-slate-300 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">عدد الزبائن المدينين:</span>
                <span className="font-mono font-bold text-sm text-slate-800">
                  {totalDebtorsCount} زبون
                </span>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-300 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">إجمالي الأرصدة المدينة المطلوبة:</span>
                <span className="font-mono font-bold text-sm text-rose-700">
                  {totalDebtorAmount.toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-300 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">متوسط رصيد الزبون المدين:</span>
                <span className="font-mono font-bold text-sm text-indigo-700">
                  {totalDebtorsCount > 0 ? Math.round(totalDebtorAmount / totalDebtorsCount).toLocaleString() : 0} ج.م
                </span>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-300 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">أعلى رصيد مدين:</span>
                <span className="font-bold text-xs text-slate-800 truncate block">
                  {maxDebtor && maxDebtor.currentDebitBalance > 0
                    ? `${maxDebtor.customer_name} (${maxDebtor.currentDebitBalance.toLocaleString()} ج)`
                    : 'لا يوجد'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: db_restore (النسخ الاحتياطي وإعدادات وثوابت الوكالة) */}
      {/* ========================================================================= */}
      {activeTab === 'db_restore' && (
        <div className="bg-slate-200 p-4 rounded-b-lg border-2 border-t-0 border-slate-400 shadow-md space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ثوابت الوكالة والنسب */}
            <form onSubmit={handleSaveCompanyForm} className="bg-white p-4 rounded border-2 border-slate-300 shadow space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-1.5 text-sm">
                <Building2 className="w-4 h-4 text-indigo-700" />
                <span>بيانات الوكالة والثوابت المحاسبية (company_data)</span>
              </h3>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الفرع / المحل</label>
                <input
                  type="text"
                  value={companyForm.branch}
                  onChange={e => setCompanyForm({ ...companyForm, branch: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نسبة العمولة الافتراضية</label>
                  <input
                    type="number"
                    step="0.01"
                    value={companyForm.comission}
                    onChange={e => setCompanyForm({ ...companyForm, comission: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نسبة رسم البياعة</label>
                  <input
                    type="number"
                    step="0.01"
                    value={companyForm.byaaa}
                    onChange={e => setCompanyForm({ ...companyForm, byaaa: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">أجرة التنزيل (ج)</label>
                  <input
                    type="number"
                    value={companyForm.tanzil}
                    onChange={e => setCompanyForm({ ...companyForm, tanzil: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الوهبة / إكرامية السائق (ج)</label>
                  <input
                    type="number"
                    value={companyForm.wahba}
                    onChange={e => setCompanyForm({ ...companyForm, wahba: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">هاتف الوكالة</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={companyForm.tel}
                  onChange={e => setCompanyForm({ ...companyForm, tel: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded font-bold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Save className="w-4 h-4" />
                <span>حفظ بيانات الوكالة</span>
              </button>
            </form>

            {/* تصدير واستيراد قاعدة البيانات */}
            <div className="bg-white p-4 rounded border-2 border-slate-300 shadow space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-1.5 text-sm">
                <Database className="w-4 h-4 text-emerald-700" />
                <span>النسخ الاحتياطي والاستعادة الفورية</span>
              </h3>

              <div className="p-3 bg-slate-50 rounded border border-slate-300 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">تصدير نسخة احتياطية كاملة (JSON)</span>
                  <span className="text-[11px] text-slate-500">
                    حفظ كافة الجداول والنقلات والفواتير بملف
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = wholesaleStore.exportJson();
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `fruit67_backup_${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    showFeedback('تم تحميل ملف النسخة الاحتياطية بنجاح.');
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل الآن</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">
                  استيراد نسخة احتياطية (ألصق كود JSON هنا):
                </label>
                <textarea
                  rows={3}
                  value={importJsonText}
                  onChange={e => setImportJsonText(e.target.value)}
                  placeholder="ألصق كود JSON للنسخة الاحتياطية هنا لاستعادتها..."
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded p-2 font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleImportJsonFile}
                  className="w-full py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>استعادة قاعدة البيانات من النص</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'إعادة ضبط المصنع',
                      message: 'هل أنت متأكد من استعادة البيانات الافتراضية الأولية للنظام؟',
                      actionName: 'استعادة البيانات الافتراضية',
                      isDangerous: true,
                      onConfirm: () => {
                        wholesaleStore.resetToDefault();
                        setCompanyForm({ ...wholesaleStore.getState().company });
                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        showFeedback('تمت استعادة البيانات الافتراضية بنجاح.');
                      }
                    });
                  }}
                  className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط البيانات إلى الوضع الافتراضي</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: w_sql_server_connect (اتصال قاعدة بيانات SQL Server واستعراض الجداول) */}
      {/* ========================================================================= */}
      {activeTab === 'w_sql_server_connect' && (
        <SqlServerConnectWindow onClose={() => setActiveTab('w_change_password_user')} />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: تعديل رصيد الزبون (Edit Customer Debit Balance) */}
      {/* ========================================================================= */}
      {editingCustBalance && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-200 rounded-lg border-2 border-slate-500 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between font-bold text-sm">
              <span>تعديل الرصيد المدين للزبون</span>
              <button
                onClick={() => setEditingCustBalance(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-white space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">اسم الزبون:</label>
                <input
                  type="text"
                  value={editingCustBalance.name}
                  disabled
                  className="w-full bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الرصيد المدين (جنيه):</label>
                <input
                  type="number"
                  value={editingCustBalance.balance}
                  onChange={e =>
                    setEditingCustBalance({
                      ...editingCustBalance,
                      balance: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full bg-slate-50 border-2 border-indigo-400 rounded px-2.5 py-2 font-mono font-bold text-sm text-slate-900"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  المبلغ المستحق على الزبون (0 إذا كان حسابه خالصاً)
                </span>
              </div>
            </div>
            <div className="p-3 bg-slate-100 border-t border-slate-300 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCustBalance(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-xs border border-slate-400"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveCustomerBalance}
                className="px-5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded font-bold text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التعديل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: نافذة التأكيد للعمليات الخطيرة (Confirmation Modal) */}
      {/* ========================================================================= */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-200 rounded-lg border-2 border-rose-600 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-700 text-white px-4 py-2 flex items-center justify-between font-bold text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>{confirmDialog.title}</span>
              </div>
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="text-rose-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-white space-y-2 text-xs">
              <p className="text-slate-800 font-semibold leading-relaxed whitespace-pre-line">
                {confirmDialog.message}
              </p>
            </div>
            <div className="p-3 bg-slate-100 border-t border-slate-300 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-xs border border-slate-400 cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmDialog.actionName}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
