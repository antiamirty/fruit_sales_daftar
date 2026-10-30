const UNITS: Record<string, number> = {
  'صفر': 0, 'واحد': 1, 'واحدة': 1, 'اتنين': 2, 'اثنين': 2, 'اثنان': 2, 'اثنتين': 2,
  'تلاتة': 3, 'ثلاثة': 3, 'ثلاث': 3, 'تلات': 3, 'اربعة': 4, 'أربعة': 4, 'اربع': 4, 'أربع': 4,
  'خمسة': 5, 'خمس': 5, 'ستة': 6, 'ست': 6, 'سبعة': 7, 'سبع': 7,
  'تمانية': 8, 'ثمانية': 8, 'ثمان': 8, 'تسعة': 9, 'تسع': 9,
  'عشرة': 10, 'عشر': 10, 'احدعشر': 11, 'اتناشر': 12, 'اثنعشر': 12,
  'تلتاشر': 13, 'اربعتاشر': 14, 'خمستاشر': 15, 'ستاشر': 16, 'سبعتاشر': 17,
  'تمنتاشر': 18, 'تسعتاشر': 19
};

const TENS: Record<string, number> = {
  'عشرين': 20, 'تلاتين': 30, 'ثلاثين': 30, 'اربعين': 40, 'أربعين': 40, 'خمسين': 50,
  'ستين': 60, 'سبعين': 70, 'تمانين': 80, 'ثمانين': 80, 'تسعين': 90
};

const HUNDREDS: Record<string, number> = {
  'مية': 100, 'ميه': 100, 'مائة': 100, 'مئة': 100, 'ميتين': 200, 'مائتين': 200, 'مئتين': 200,
  'تلتمية': 300, 'ثلاثمائة': 300, 'ربعمية': 400, 'أربعمائة': 400, 'خمسمية': 500,
  'ستمية': 600, 'سبعمية': 700, 'تمنمية': 800, 'ثمانمائة': 800, 'تسعمية': 900
};

const MULTIPLIERS: Record<string, number> = {
  'ألف': 1000, 'الف': 1000, 'الاف': 1000, 'آلاف': 1000, 'مليون': 1000000
};

const DECIMAL_WORDS = ['نقطة', 'فاصلة'];

const ARABIC_INDIC_DIGITS = /[\u0660-\u0669]/g;
const PERSIAN_DIGITS = /[\u06F0-\u06F9]/g;

export function normalizeDigits(text: string): string {
  return text
    .replace(ARABIC_INDIC_DIGITS, d => String(d.charCodeAt(0) - 0x0660))
    .replace(PERSIAN_DIGITS, d => String(d.charCodeAt(0) - 0x06f0));
}

function parseIntegerWords(tokens: string[]): number | null {
  let total = 0;
  let current = 0;
  let matched = false;
  for (const raw of tokens) {
    const token = raw.replace(/^و/, '');
    if (token in MULTIPLIERS) {
      total += (current || 1) * MULTIPLIERS[token];
      current = 0;
      matched = true;
      continue;
    }
    const value = [UNITS, TENS, HUNDREDS]
      .map(map => map[raw] ?? map[token])
      .find(v => v !== undefined);
    if (value === undefined) return null;
    current += value;
    matched = true;
  }
  return matched ? total + current : null;
}

export function parseSpokenNumber(transcript: string): string | null {
  const normalized = normalizeDigits(transcript).trim();
  if (/^-?\d+(\.\d+)?$/.test(normalized)) return normalized;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const decimalIndex = tokens.findIndex(t => DECIMAL_WORDS.includes(t));
  const integerTokens = decimalIndex === -1 ? tokens : tokens.slice(0, decimalIndex);
  const fractionTokens = decimalIndex === -1 ? [] : tokens.slice(decimalIndex + 1);

  const integerPart = parseIntegerWords(integerTokens);
  if (integerPart === null) {
    return /^\d+$/.test(normalized) ? normalized : null;
  }
  if (decimalIndex === -1) return String(integerPart);

  const fractionDigits = fractionTokens.map(t => {
    const value = parseIntegerWords([t]);
    return value === null ? null : String(value);
  });
  if (fractionDigits.length === 0 || fractionDigits.some(d => d === null)) return null;
  return `${integerPart}.${fractionDigits.join('')}`;
}

export type VoiceCommand = 'next' | 'previous';

export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const text = transcript.trim();
  if (['التالي', 'بعده', 'اللي بعده', 'التالى'].includes(text)) return 'next';
  if (['السابق', 'اللي قبله', 'قبله'].includes(text)) return 'previous';
  return null;
}
