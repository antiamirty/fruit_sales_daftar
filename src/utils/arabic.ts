/**
 * أداة توحيد ومعالجة النصوص العربية لمنع تكرار الأسماء والتحايل
 */

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    // إزالة علامات التشكيل والتنوين
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // توحيد الألفات (أ، إ، آ، ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // توحيد التاء المربوطة (ة -> ه)
    .replace(/ة/g, 'ه')
    // توحيد الياء والألف المقصورة (ى -> ي)
    .replace(/ى/g, 'ي')
    // توحيد الكاف الفارسية أو الياء الفارسية إن وجدت
    .replace(/ي/g, 'ي')
    .replace(/ك/g, 'ك')
    // إزالة المسافات الزائدة والمتعددة
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * مقارنة اسمين عربيين مع تجاهل الفروق الإملائية
 */
export function areArabicNamesEqual(name1: string, name2: string): boolean {
  return normalizeArabic(name1) === normalizeArabic(name2);
}
