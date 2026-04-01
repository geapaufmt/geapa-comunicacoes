/**************************************
 * 11_aniv_readers.gs
 * LEITURA + FILTRO DE DADOS
 **************************************/

function aniv_getMemberBirthdaysForWindow_(startInclusive, endExclusive) {
  const sh = aniv_getSheetByKey_(ANIV_CFG.MEMBERS.KEY);
  const data = aniv_readSheet_(sh);

  const iName = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_NAME);
  const iBirth = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_BIRTHDATE);
  const iEmail = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_EMAIL);
  const iRole = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_ROLE, true);
  const iInsta = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_INSTA, true);

  if (iName < 0 || iBirth < 0 || iEmail < 0) return [];

  const startYear = new Date(startInclusive).getFullYear();
  const out = [];

  for (const row of data.rows) {
    const name = String(row[iName] || '').trim();
    const birthRaw = row[iBirth];
    const email = String(row[iEmail] || '').trim();
    if (!name || !birthRaw) continue;

    const birth = aniv_parseDateAny_(birthRaw);
    if (!birth) continue;

    const normalized = aniv_normalizeToYear_(birth, startYear);
    if (aniv_inWindowMonthDay_(normalized, startInclusive, endExclusive)) {
      out.push({
        name,
        email,
        role: iRole >= 0 ? String(row[iRole] || '').trim() : '',
        insta: iInsta >= 0 ? String(row[iInsta] || '').trim() : '',
        birth
      });
    }
  }

  out.sort((a, b) => aniv_monthDayKey_(a.birth).localeCompare(aniv_monthDayKey_(b.birth)));
  return out;
}

function aniv_getProfBirthdaysForWindow_(startInclusive, endExclusive) {
  const sh = aniv_getSheetByKey_(ANIV_CFG.PROFS.KEY);
  const data = aniv_readSheet_(sh);

  const iName = aniv_findHeaderIndex_(data.headers, ANIV_CFG.PROFS.COL_NAME);
  const iEmail = aniv_findHeaderIndex_(data.headers, ANIV_CFG.PROFS.COL_EMAIL);
  const iBirth = aniv_findHeaderIndex_(data.headers, ANIV_CFG.PROFS.COL_BIRTHDATE);

  if (iName < 0 || iEmail < 0 || iBirth < 0) return [];

  const startYear = new Date(startInclusive).getFullYear();
  const out = [];

  for (const row of data.rows) {
    const name = String(row[iName] || '').trim();
    const email = String(row[iEmail] || '').trim();
    const birthRaw = row[iBirth];
    if (!name || !email || !birthRaw) continue;

    const birth = aniv_parseDateAny_(birthRaw);
    if (!birth) continue;

    const normalized = aniv_normalizeToYear_(birth, startYear);
    if (aniv_inWindowMonthDay_(normalized, startInclusive, endExclusive)) {
      out.push({ name, email, birth });
    }
  }

  out.sort((a, b) => aniv_monthDayKey_(a.birth).localeCompare(aniv_monthDayKey_(b.birth)));
  return out;
}

function aniv_readSheet_(sheet) {
  const data = GEAPA_CORE.coreReadSheetData(sheet, {
    headerRow: 1,
    startRow: 2
  });

  return {
    headers: data.headers,
    rows: data.rows
  };
}

function aniv_findHeaderIndex_(headers, name, optional) {
  const target = aniv_normHeader_(name);
  for (let i = 0; i < headers.length; i++) {
    if (aniv_normHeader_(headers[i]) === target) return i;
  }
  return optional ? -1 : -1;
}

function aniv_normHeader_(s) {
  return GEAPA_CORE.coreNormalizeHeader(s);
}
