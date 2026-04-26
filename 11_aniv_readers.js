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
  const iOccupation = aniv_findOccupationHeaderIndex_(data.headers, true);
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
      const occupation = aniv_getOccupationValue_(row, data.headers, iOccupation);
      out.push({
        name,
        email,
        occupation,
        role: occupation,
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

function aniv_getMemberIntegrationAnniversariesForWindow_(startInclusive, endExclusive) {
  const sh = aniv_getSheetByKey_(ANIV_CFG.MEMBERS.KEY);
  const data = aniv_readSheet_(sh);

  const iName = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_NAME);
  const iIntegration = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_INTEGRATION_DATE);
  const iEmail = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_EMAIL, true);
  const iStatus = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_STATUS, true);
  const iOccupation = aniv_findOccupationHeaderIndex_(data.headers, true);
  const iInsta = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_INSTA, true);

  if (iName < 0 || iIntegration < 0) return [];

  const startYear = new Date(startInclusive).getFullYear();
  const activeStatuses = (ANIV_CFG.MEMBERS.ACTIVE_STATUS_VALUES || []).map(function(item) {
    return aniv_normHeader_(item);
  });
  const out = [];

  for (const row of data.rows) {
    const name = String(row[iName] || '').trim();
    const integrationRaw = row[iIntegration];
    const email = iEmail >= 0 ? String(row[iEmail] || '').trim() : '';
    const status = iStatus >= 0 ? aniv_normHeader_(row[iStatus]) : '';
    if (!name || !integrationRaw) continue;
    if (iStatus >= 0 && activeStatuses.length && activeStatuses.indexOf(status) < 0) continue;

    const integrationDate = aniv_parseDateAny_(integrationRaw);
    if (!integrationDate) continue;

    const normalizedAnniversary = aniv_normalizeToYearWithFeb28Fallback_(integrationDate, startYear);
    const yearsCompleted = startYear - integrationDate.getFullYear();
    if (yearsCompleted < 1) continue;
    if (!aniv_inWindowMonthDay_(normalizedAnniversary, startInclusive, endExclusive)) continue;

    const occupation = aniv_getOccupationValue_(row, data.headers, iOccupation);

    out.push({
      name,
      email,
      occupation,
      role: occupation,
      insta: iInsta >= 0 ? String(row[iInsta] || '').trim() : '',
      integrationDate,
      anniversaryDate: normalizedAnniversary,
      yearsCompleted
    });
  }

  out.sort((a, b) => a.anniversaryDate.getTime() - b.anniversaryDate.getTime());
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
  const targets = Array.isArray(name) ? name : [name];
  for (let t = 0; t < targets.length; t++) {
    const target = aniv_normHeader_(targets[t]);
    for (let i = 0; i < headers.length; i++) {
      if (aniv_normHeader_(headers[i]) === target) return i;
    }
  }
  return optional ? -1 : -1;
}

function aniv_normHeader_(s) {
  return GEAPA_CORE.coreNormalizeHeader(s);
}
