import React, { useState } from 'react';
import { ClipboardList, X } from 'lucide-react';
import { isVoiceDictationSupported } from './VoiceDictationButton';

const TEST_CASES = [
  { label: 'اسم (نص)', hint: 'قل: أحمد محمد علي', expected: 'يكتب الكلام كما هو', type: 'text' },
  { label: 'مبلغ (رقم)', hint: 'قل: مية وخمسين', expected: 'يكتب 150', type: 'number' },
  { label: 'كمية (رقم صحيح)', hint: 'قل: خمسة وعشرين', expected: 'يكتب 25', type: 'numeric' },
  { label: 'وزن (كسر عشري)', hint: 'قل: اتنين نقطة خمسة', expected: 'يكتب 2.5', type: 'number' },
  { label: 'ملاحظات (نص حر)', hint: 'قل أي جملة', expected: 'يكتب الجملة كما هي', type: 'textarea' },
] as const;

export const VoiceTestPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported] = useState(() => isVoiceDictationSupported());

  return (
    <div className="fixed bottom-4 left-20 z-[60] flex flex-col items-start gap-2" dir="rtl">
      {isOpen && (
        <div className="w-80 max-h-[70vh] overflow-y-auto bg-white border border-slate-300 shadow-xl rounded-lg p-4 flex flex-col gap-3 text-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">اختبار الإملاء الصوتي</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="إغلاق"
              className="p-1 rounded hover:bg-slate-100 text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!isSupported && (
            <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">
              متصفحك لا يدعم الإملاء الصوتي. استخدم Chrome أو Edge.
            </p>
          )}

          <ol className="text-xs text-slate-700 list-decimal pr-4 flex flex-col gap-1">
            <li>انقر على الحقل الذي تريد اختباره.</li>
            <li>اضغط زر الميكروفون في أسفل الشاشة وتكلم بعد ظهور رسالة الاستماع.</li>
            <li>اضغط Tab للانتقال للحقل التالي، أو قل «التالي» أو «السابق».</li>
          </ol>

          <div className="flex flex-col gap-2">
            {TEST_CASES.map(test => (
              <div key={test.label} className="flex flex-col gap-1 border-t border-slate-200 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{test.label}</span>
                  <span className="text-slate-600">{test.hint}</span>
                </div>
                {test.type === 'textarea' ? (
                  <textarea
                    rows={2}
                    className="w-full bg-white text-slate-900 border border-slate-400 rounded px-2 py-1 text-sm outline-none focus:border-blue-700"
                  />
                ) : (
                  <input
                    type={test.type === 'number' ? 'number' : 'text'}
                    inputMode={test.type === 'numeric' ? 'numeric' : undefined}
                    className="w-full bg-white text-slate-900 border border-slate-400 rounded px-2 py-1 text-sm outline-none focus:border-blue-700"
                  />
                )}
                <span className="text-[11px] text-slate-600">المتوقع: {test.expected}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="h-12 px-4 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold border-2 transition-colors bg-white hover:bg-slate-100 border-blue-900 text-blue-900"
      >
        <ClipboardList className="w-4 h-4" />
        {isOpen ? 'إخفاء الاختبار' : 'اختبار الإملاء'}
      </button>
    </div>
  );
};
