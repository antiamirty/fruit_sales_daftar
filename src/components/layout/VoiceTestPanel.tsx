import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, RotateCcw, X } from 'lucide-react';
import { isVoiceDictationSupported } from './VoiceDictationButton';

type FieldKind = 'text' | 'number' | 'numeric' | 'textarea';

interface TestCase {
  id: string;
  label: string;
  hint: string;
  expected: string;
  kind: FieldKind;
  answer?: number;
}

const TEST_CASES: TestCase[] = [
  { id: 'name', label: 'اسم (نص)', hint: 'قل: أحمد محمد علي', expected: 'يكتب الكلام كما هو', kind: 'text' },
  { id: 'amount', label: 'مبلغ (رقم)', hint: 'قل: مية وخمسين', expected: 'يكتب 150', kind: 'number', answer: 150 },
  { id: 'quantity', label: 'كمية (رقم صحيح)', hint: 'قل: خمسة وعشرين', expected: 'يكتب 25', kind: 'numeric', answer: 25 },
  { id: 'weight', label: 'وزن (كسر عشري)', hint: 'قل: اتنين نقطة خمسة', expected: 'يكتب 2.5', kind: 'number', answer: 2.5 },
  { id: 'note', label: 'ملاحظات (نص حر)', hint: 'قل أي جملة', expected: 'يكتب الجملة كما هي', kind: 'textarea' },
];

const isMatch = (test: TestCase, value: string) => {
  if (value.trim() === '') return false;
  if (test.answer === undefined) return true;
  return Number(value) === test.answer;
};

const fieldClass = (matched: boolean) =>
  `w-full bg-white text-slate-900 border rounded px-2 py-1 text-sm outline-none focus:border-blue-700 ${
    matched ? 'border-green-600 ring-1 ring-green-600' : 'border-slate-400'
  }`;

export const VoiceTestPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported] = useState(() => isVoiceDictationSupported());
  const [values, setValues] = useState<Record<string, string>>({});

  const matchedCount = TEST_CASES.filter(test => isMatch(test, values[test.id] ?? '')).length;

  return (
    <div className="fixed bottom-4 left-20 z-[60] flex flex-col items-start gap-2" dir="rtl">
      {isOpen && (
        <div className="w-80 max-h-[70vh] overflow-y-auto bg-white border border-slate-300 shadow-xl rounded-lg p-4 flex flex-col gap-3 text-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">اختبار الإملاء الصوتي</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setValues({})}
                aria-label="مسح الحقول"
                title="مسح كل الحقول لتجربة جديدة"
                className="p-1 rounded hover:bg-slate-100 text-slate-600"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="إغلاق"
                className="p-1 rounded hover:bg-slate-100 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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

          <div
            className={`text-xs font-bold rounded px-2 py-1 ${
              matchedCount === TEST_CASES.length
                ? 'bg-green-50 text-green-800 border border-green-300'
                : 'bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            مطابق: {matchedCount} من {TEST_CASES.length}
          </div>

          <div className="flex flex-col gap-2">
            {TEST_CASES.map(test => {
              const value = values[test.id] ?? '';
              const matched = isMatch(test, value);
              const attempted = value.trim() !== '';
              const onChange = (next: string) => setValues(prev => ({ ...prev, [test.id]: next }));
              return (
                <div key={test.id} className="flex flex-col gap-1 border-t border-slate-200 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{test.label}</span>
                    <span className="text-slate-600">{test.hint}</span>
                  </div>
                  {test.kind === 'textarea' ? (
                    <textarea
                      rows={2}
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      className={fieldClass(matched)}
                    />
                  ) : (
                    <input
                      type={test.kind === 'number' ? 'number' : 'text'}
                      inputMode={test.kind === 'numeric' ? 'numeric' : undefined}
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      className={fieldClass(matched)}
                    />
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">المتوقع: {test.expected}</span>
                    {matched && (
                      <span className="flex items-center gap-1 font-bold text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        مطابق
                      </span>
                    )}
                    {!matched && attempted && (
                      <span className="flex items-center gap-1 font-bold text-amber-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        غير مطابق
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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
