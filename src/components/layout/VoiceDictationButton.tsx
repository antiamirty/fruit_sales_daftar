import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { parseSpokenNumber, parseVoiceCommand } from '../../utils/spokenNumbers';

type TextField = HTMLInputElement | HTMLTextAreaElement;

interface SpeechRecognitionEventLike {
  results: { 0: { 0: { transcript: string } } };
}

interface SpeechRecognitionErrorLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const TEXT_INPUT_TYPES = ['text', 'search', 'number', 'tel', 'email', 'url', ''];

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const isTextField = (el: EventTarget | null): el is TextField => {
  if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
  if (el instanceof HTMLInputElement) {
    return TEXT_INPUT_TYPES.includes(el.type) && !el.readOnly && !el.disabled;
  }
  return false;
};

const isNumericField = (el: TextField) => {
  if (el instanceof HTMLInputElement && (el.type === 'number' || el.type === 'tel')) return true;
  const mode = el.getAttribute('inputmode');
  return mode === 'numeric' || mode === 'decimal';
};

const insertIntoField = (el: TextField, text: string, replaceAll: boolean) => {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  let nextValue: string;
  let caret: number;
  if (replaceAll) {
    nextValue = text;
    caret = text.length;
  } else {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const before = el.value.slice(0, start);
    const separator = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
    const inserted = separator + text;
    nextValue = before + inserted + el.value.slice(end);
    caret = before.length + inserted.length;
  }

  setter?.call(el, nextValue);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  try {
    el.setSelectionRange(caret, caret);
  } catch {
    // بعض أنواع الحقول (مثل الأرقام) لا تدعم تحديد المؤشر
  }
};

const focusSiblingField = (current: TextField | null, direction: 1 | -1) => {
  const fields = Array.from(document.querySelectorAll<HTMLElement>('input, textarea, select')).filter(
    el =>
      !(el as HTMLInputElement).disabled &&
      !(el as HTMLInputElement).readOnly &&
      (el as HTMLInputElement).type !== 'hidden' &&
      el.offsetParent !== null
  );
  if (fields.length === 0) return false;
  const index = current ? fields.indexOf(current) : -1;
  const nextIndex = index === -1 ? 0 : (index + direction + fields.length) % fields.length;
  fields[nextIndex].focus();
  return true;
};

export const VoiceDictationButton: React.FC = () => {
  const [isSupported] = useState(() => getSpeechRecognitionConstructor() !== null);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const lastFieldRef = useRef<TextField | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      if (isTextField(e.target)) lastFieldRef.current = e.target;
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      recognitionRef.current?.stop();
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const showFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4000);
  };

  const handleResult = (transcript: string) => {
    const command = parseVoiceCommand(transcript);
    if (command) {
      const moved = focusSiblingField(lastFieldRef.current, command === 'next' ? 1 : -1);
      if (!moved) showFeedback('لا توجد حقول أخرى للتنقل إليها');
      return;
    }

    const field = lastFieldRef.current;
    if (!field || !document.contains(field)) {
      showFeedback('انقر على أي حقل أولاً ثم اضغط زر الإملاء');
      return;
    }

    if (isNumericField(field)) {
      const number = parseSpokenNumber(transcript);
      if (number === null) {
        showFeedback(`لم أفهم الرقم "${transcript}"، حاول مرة أخرى`);
        return;
      }
      insertIntoField(field, number, true);
      field.focus();
      return;
    }

    insertIntoField(field, transcript.trim(), false);
    field.focus();
  };

  const startListening = () => {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = 'ar-EG';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = event => handleResult(event.results[0][0].transcript);
    recognition.onerror = event => {
      const message =
        event.error === 'not-allowed'
          ? 'لم يتم السماح باستخدام الميكروفون من المتصفح'
          : event.error === 'no-speech'
          ? 'لم يتم التقاط أي صوت'
          : 'حدث خطأ في الإملاء الصوتي';
      showFeedback(message);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    startListening();
  };

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] flex flex-col items-start gap-2" dir="rtl">
      {feedback && (
        <div className="max-w-xs bg-white border border-slate-300 shadow-md rounded-md px-3 py-2 text-xs font-bold text-slate-800">
          {feedback}
        </div>
      )}
      {isListening && (
        <div className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
          جارٍ الاستماع... تكلم الآن
        </div>
      )}
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={toggleListening}
        title="إملاء صوتي: تكلم وسيكتب في الحقل الذي فيه المؤشر. قل «التالي» أو «السابق» للتنقل بين الحقول"
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors border-2 ${
          isListening
            ? 'bg-rose-600 hover:bg-rose-700 border-rose-800 text-white'
            : 'bg-blue-900 hover:bg-blue-800 border-blue-950 text-white'
        }`}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
    </div>
  );
};
