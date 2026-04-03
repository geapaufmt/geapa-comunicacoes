/**************************************
 * 20_aniv_utils_dates.gs
 * Datas: parse, normalizacao, comparacoes por mes/dia
 **************************************/

function aniv_now_() {
  return GEAPA_CORE.coreNow();
}

function aniv_startOfDay_(date) {
  return GEAPA_CORE.coreStartOfDay(date);
}

function aniv_addDays_(date, days) {
  return GEAPA_CORE.coreAddDays(date, days);
}

function aniv_formatDate_(date) {
  return GEAPA_CORE.coreFormatDate(date, ANIV_CFG.TZ, 'dd/MM/yyyy');
}

function aniv_parseDateAny_(raw) {
  if (!raw) return null;

  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;

  const s = String(raw).trim();
  if (!s) return null;

  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?$/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    let yy = m[3] ? Number(m[3]) : 2000;
    if (yy < 100) yy = 2000 + yy;
    const d = new Date(yy, mm - 1, dd);
    return isNaN(d.getTime()) ? null : d;
  }

  const t = Date.parse(s);
  return isNaN(t) ? null : new Date(t);
}

function aniv_normalizeToYear_(date, year) {
  const d = new Date(date);
  return new Date(Number(year), d.getMonth(), d.getDate());
}

function aniv_normalizeToYearWithFeb28Fallback_(date, year) {
  const d = new Date(date);
  const targetYear = Number(year);
  const month = d.getMonth();
  const day = d.getDate();

  if (month === 1 && day === 29) {
    const leapProbe = new Date(targetYear, 1, 29);
    if (leapProbe.getMonth() !== 1) {
      return new Date(targetYear, 1, 28);
    }
  }

  return new Date(targetYear, month, day);
}

function aniv_monthDayKey_(date) {
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return mm + '-' + dd;
}

function aniv_formatBirth_(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return dd + '/' + mm;
}

function aniv_inWindowMonthDay_(normalizedDate, startInclusive, endExclusive) {
  return GEAPA_CORE.coreInWindowDay(normalizedDate, startInclusive, endExclusive);
}
