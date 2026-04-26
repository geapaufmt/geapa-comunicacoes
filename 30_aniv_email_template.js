/**************************************
 * 30_aniv_email_templates.gs
 * Templates e envios de e-mails (HTML)
 **************************************/

function aniv_sendBirthdayMessageToMember_(m, day) {
  if (!GEAPA_CORE.coreIsValidEmail(m.email)) return;

  const subject = `🎉 Feliz aniversário, ${aniv_firstName_(m.name)}! — GEAPA`;
  const occupationLabel = aniv_formatOccupationDisplay_(aniv_getEntityOccupation_(m));

  const items = [];
  items.push({ line1: `🎂 ${aniv_safe_(m.name)}`, line2: occupationLabel ? aniv_safe_(occupationLabel) : '' });
  if (m.insta) items.push({ line1: `📷 Instagram`, line2: aniv_safe_(m.insta) });

  const html = aniv_buildHtmlEmail_({
    title: 'Feliz aniversário! 🎉',
    subtitle: `${aniv_formatDate_(day)}`,
    institutional: aniv_institutionalGreeting_(m.name),
    items,
    footer: ''
  });

  GEAPA_CORE.coreSendHtmlEmail({
    to: m.email,
    subject,
    htmlBody: html
  });
}

function aniv_sendProfBirthdayEmail_(p, day) {
  if (!GEAPA_CORE.coreIsValidEmail(p.email)) return;

  const subject = `🎉 Feliz aniversário, Prof(a). ${aniv_firstName_(p.name)}! — GEAPA`;

  const html = aniv_buildHtmlEmail_({
    title: 'Feliz aniversário! 🎉',
    subtitle: `${aniv_formatDate_(day)}`,
    institutional: aniv_institutionalGreeting_(p.name),
    items: [{ line1: `👩‍🏫 ${aniv_safe_(p.name)}`, line2: '' }],
    footer: ''
  });

  GEAPA_CORE.coreSendHtmlEmail({
    to: p.email,
    subject,
    htmlBody: html
  });
}

function aniv_sendCommemorativeEmail_(c, day) {
  const subject = `📌 ${c.title} — GEAPA`;

  const html = aniv_buildHtmlEmail_({
    title: 'Data comemorativa 📌',
    subtitle: `${aniv_formatDate_(day)}`,
    items: [{
      line1: `📌 ${aniv_safe_(c.title)}`,
      line2: `${aniv_safe_(c.dateStr)}${c.desc ? ` — ${aniv_safe_(c.desc)}` : ''}${c.audience ? ` (${aniv_safe_(c.audience)})` : ''}`
    }],
    footer: ANIV_CFG.BRAND.QUOTE
  });

  aniv_sendToCommunication_(subject, html);
}

/**
 * Resumo para Comunicação (membros)
 */
function aniv_notifyCommunicationMembers_(rows, startDay, endDay, weekly) {
  const subject = weekly ? ANIV_CFG.EMAIL.SUBJECT_WEEK : ANIV_CFG.EMAIL.SUBJECT_TODAY;

  const subtitle = weekly && endDay
    ? `De ${aniv_formatDate_(startDay)} até ${aniv_formatDate_(endDay)}`
    : `${aniv_formatDate_(startDay)}`;

  const items = rows.length
    ? rows.map(m => ({
        line1: `🎉 ${aniv_safe_(m.name)}`,
        line2: `${aniv_safe_(aniv_formatBirth_(aniv_normalizeToYear_(m.birth, startDay.getFullYear())))}${aniv_getEntityOccupation_(m) ? ` — ${aniv_safe_(aniv_formatOccupationDisplay_(aniv_getEntityOccupation_(m)))}` : ''}`
      }))
    : [{ line1: 'Sem aniversariantes no período.', line2: '' }];

  const html = aniv_buildHtmlEmail_({
    title: subject,
    subtitle,
    items,
    footer: ANIV_CFG.BRAND.QUOTE
  });

  const sent = aniv_sendToCommunication_(subject, html);

  // Chat opcional
  if (ANIV_CFG.EMAIL.CHAT_WEBHOOK_URL) {
    const payload = { text: `${subject}\n${aniv_stripHtml_(html)}` };
    UrlFetchApp.fetch(ANIV_CFG.EMAIL.CHAT_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  }

  return sent;
}

/**
 * Resumo para Comunicação (profs)
 */
function aniv_notifyCommunicationProfs_(rows, startDay, endDay, weekly) {
  const subject = weekly ? ANIV_CFG.EMAIL.SUBJECT_PROF_WEEK : ANIV_CFG.EMAIL.SUBJECT_PROF_TODAY;

  const subtitle = weekly && endDay
    ? `De ${aniv_formatDate_(startDay)} até ${aniv_formatDate_(endDay)}`
    : `${aniv_formatDate_(startDay)}`;

  const items = rows.length
    ? rows.map(p => ({
        line1: `👩‍🏫 ${aniv_safe_(p.name)}`,
        line2: `${aniv_safe_(aniv_formatBirth_(aniv_normalizeToYear_(p.birth, startDay.getFullYear())))}`
      }))
    : [{ line1: 'Sem aniversariantes (professores) no período.', line2: '' }];

  const html = aniv_buildHtmlEmail_({
    title: subject,
    subtitle,
    items,
    footer: ANIV_CFG.BRAND.QUOTE
  });

  return aniv_sendToCommunication_(subject, html);
}
function aniv_notifyCommunicationCombined_(memberRows, profRows, startDay, endDay, weekly) {
  const subject = weekly ? ANIV_CFG.EMAIL.SUBJECT_WEEK : ANIV_CFG.EMAIL.SUBJECT_TODAY;

  const subtitle = weekly && endDay
    ? `De ${aniv_formatDate_(startDay)} até ${aniv_formatDate_(endDay)}`
    : `${aniv_formatDate_(startDay)}`;

  const items = [];

  if (memberRows.length) {
    items.push({ line1: 'Membros', line2: '' });
    memberRows.forEach(m => {
      items.push({
        line1: `🎉 ${aniv_safe_(m.name)}`,
        line2: `${aniv_safe_(aniv_formatBirth_(aniv_normalizeToYear_(m.birth, startDay.getFullYear())))}${aniv_getEntityOccupation_(m) ? ` — ${aniv_safe_(aniv_formatOccupationDisplay_(aniv_getEntityOccupation_(m)))}` : ''}`
      });
    });
  }

  if (profRows.length) {
    items.push({ line1: 'Professores', line2: '' });
    profRows.forEach(p => {
      items.push({
        line1: `👩‍🏫 ${aniv_safe_(p.name)}`,
        line2: `${aniv_safe_(aniv_formatBirth_(aniv_normalizeToYear_(p.birth, startDay.getFullYear())))}`
      });
    });
  }

  if (!items.length) {
    items.push({ line1: 'Sem aniversariantes no período.', line2: '' });
  }

  const html = aniv_buildHtmlEmail_({
    title: subject,
    subtitle,
    items,
    footer: ANIV_CFG.BRAND.QUOTE
  });

  return aniv_sendToCommunication_(subject, html);
}

/**
 * ------------------------------------------------------------
 * HTML base do e-mail
 * ------------------------------------------------------------
 * Observação:
 * - O coreSendHtmlEmail já injeta inlineImages padrão (cid:geapa_logo).
 * - Aqui nós só referenciamos <img src="cid:geapa_logo">
 */
function aniv_buildHtmlEmail_(opts) {
  const title = opts.title || '';
  const subtitle = opts.subtitle || '';
  const items = opts.items || [];
  const footer = opts.footer || '';

  const li = items.map(it => `
    <div style="padding:10px 0;border-bottom:1px solid #eee;">
      <div style="font-size:16px;font-weight:600;color:${ANIV_CFG.BRAND.COLOR_TEXT};">${it.line1 || ''}</div>
      <div style="font-size:13px;color:#555;margin-top:2px;">${it.line2 || ''}</div>
    </div>
  `).join('');

  const logoHtml = `
    <div style="text-align:center;margin-bottom:15px;">
      <img src="cid:geapa_logo"
           alt="GEAPA"
           style="max-width:380px;width:100%;height:auto;">
    </div>
    <div style="height:4px;background:${ANIV_CFG.BRAND.BORDER};margin-bottom:20px;border-radius:2px;"></div>
  `;

  return `
  <div style="font-family:Arial,sans-serif;background:${ANIV_CFG.BRAND.COLOR_BG};color:${ANIV_CFG.BRAND.COLOR_TEXT};padding:16px;">
    <div style="border:2px solid ${ANIV_CFG.BRAND.BORDER};border-radius:12px;padding:16px;">
      ${logoHtml}
      <div style="font-size:20px;font-weight:700;margin-bottom:4px;">${aniv_safe_(title)}</div>
      <div style="font-size:13px;color:#555;margin-bottom:14px;">${aniv_safe_(subtitle)}</div>
      ${opts.institutional ? opts.institutional : ''}
      ${li || `<div style="color:#555;">(sem itens)</div>`}
      ${footer ? `<div style="margin-top:14px;font-size:12px;color:#666;"><em>${aniv_safe_(footer)}</em></div>` : ``}
    </div>
  </div>`;
}

function aniv_institutionalGreeting_(nomeCompleto) {
  const primeiroNome = aniv_firstName_(nomeCompleto);
  return `
    <div style="margin-bottom:18px;font-size:14px;line-height:1.6;">
      Olá${primeiroNome ? `, <strong>${aniv_safe_(primeiroNome)}</strong>` : ''}!<br><br>
      Em nome de todo o <strong>Grupo de Estudos de Apoio à Produção Agrícola (GEAPA)</strong>,
      expressamos nossos mais sinceros cumprimentos e desejamos que este seja
      um momento especial, repleto de conquistas, saúde e realizações.
    </div>
  `;
}

function aniv_firstName_(full) {
  const s = String(full || '').trim();
  if (!s) return '';
  return s.split(/\s+/)[0];
}

function aniv_safe_(s) {
  return String(s || '').replace(/[<>&"]/g, ch => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[ch]));
}

function aniv_stripHtml_(html) {
  return String(html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
