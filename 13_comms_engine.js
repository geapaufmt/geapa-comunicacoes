/**
 * ============================================================
 * 13_comms_engine.js
 * ============================================================
 *
 * Motor central de comunicacoes do modulo.
 *
 * Estrutura principal:
 * - Comunicacoes_Config
 * - Comunicacoes_Log
 *
 * O objetivo aqui e manter o modulo dono do conteudo e da deteccao
 * dos eventos, enquanto o geapa-core continua dono do layout,
 * assunto final, slogan e envio tecnico.
 */

function comms_getConfigSheet_() {
  return aniv_getSheetByKey_(ANIV_CFG.COMUNICACOES.CONFIG_KEY);
}

function comms_getLogSheet_() {
  return aniv_getSheetByKey_(ANIV_CFG.COMUNICACOES.LOG_KEY);
}

function comms_getConfigRecords_() {
  return GEAPA_CORE.coreReadRecordsByKey(ANIV_CFG.COMUNICACOES.CONFIG_KEY, {
    headerRow: 1,
    startRow: 2
  });
}

function comms_getLogRecords_() {
  return GEAPA_CORE.coreReadRecordsByKey(ANIV_CFG.COMUNICACOES.LOG_KEY, {
    headerRow: 1,
    startRow: 2
  });
}

function comms_normalizeText_(value) {
  return GEAPA_CORE.coreNormalizeText(value, {
    removeAccents: true,
    collapseWhitespace: true,
    caseMode: 'upper'
  });
}

function comms_parseYesNo_(value, defaultValue) {
  var normalized = comms_normalizeText_(value);
  if (!normalized) return defaultValue === true;
  if (normalized === 'SIM' || normalized === 'TRUE' || normalized === '1') return true;
  if (normalized === 'NAO' || normalized === 'FALSE' || normalized === '0') return false;
  return defaultValue === true;
}

function comms_parseInteger_(value, defaultValue) {
  var parsed = Number(value);
  return isNaN(parsed) ? Number(defaultValue || 0) : parsed;
}

function comms_parseEmailList_(value) {
  if (Array.isArray(value)) return GEAPA_CORE.coreUniqueEmails(value);
  return GEAPA_CORE.coreUniqueEmails(String(value || '').split(/[\r\n,;]+/));
}

function comms_slug_(value) {
  return GEAPA_CORE.coreNormalizeText(value, {
    removeAccents: true,
    collapseWhitespace: true,
    caseMode: 'lower'
  })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function comms_parseTags_(value) {
  var items = Array.isArray(value) ? value : String(value || '').split(/[\r\n,;]+/);
  return items.map(function(item) {
    return String(item || '').trim();
  }).filter(function(item) {
    return !!item;
  }).filter(function(item, index, arr) {
    return arr.indexOf(item) === index;
  });
}

function comms_parseJson_(value, defaultValue) {
  if (value == null || value === '') return defaultValue || {};
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(String(value || '').trim());
  } catch (err) {
    return defaultValue || {};
  }
}

function comms_coerceDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (value == null || value === '') return null;

  var parsed = aniv_parseDateAny_(value);
  if (parsed instanceof Date && !isNaN(parsed.getTime())) return parsed;

  parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function comms_startOfDay_(value) {
  var date = comms_coerceDate_(value);
  return date ? aniv_startOfDay_(date) : null;
}

function comms_dayDiff_(left, right) {
  var leftDay = comms_startOfDay_(left);
  var rightDay = comms_startOfDay_(right);
  if (!leftDay || !rightDay) return Number.POSITIVE_INFINITY;
  return Math.abs(Math.round((leftDay.getTime() - rightDay.getTime()) / 86400000));
}

function comms_createCounters_() {
  return {
    matchedConfigs: 0,
    generatedBundles: 0,
    queued: 0,
    requeued: 0,
    duplicates: 0,
    withoutRecipients: 0,
    errors: 0,
    errorDetails: []
  };
}

function comms_mergeCounters_(target, source) {
  target = target || comms_createCounters_();
  source = source || comms_createCounters_();

  target.matchedConfigs += Number(source.matchedConfigs || 0);
  target.generatedBundles += Number(source.generatedBundles || 0);
  target.queued += Number(source.queued || 0);
  target.requeued += Number(source.requeued || 0);
  target.duplicates += Number(source.duplicates || 0);
  target.withoutRecipients += Number(source.withoutRecipients || 0);
  target.errors += Number(source.errors || 0);
  target.errorDetails = (target.errorDetails || []).concat(source.errorDetails || []);
  return target;
}

function comms_getConfigValue_(record, headerName) {
  if (!record || !headerName) return '';
  if (Object.prototype.hasOwnProperty.call(record, headerName)) return record[headerName];

  var target = GEAPA_CORE.coreNormalizeHeader(headerName);
  var keys = Object.keys(record);

  for (var i = 0; i < keys.length; i++) {
    if (GEAPA_CORE.coreNormalizeHeader(keys[i]) === target) {
      return record[keys[i]];
    }
  }

  return '';
}

function comms_findConfigByCode_(code) {
  var target = comms_normalizeText_(code);
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var rows = comms_getConfigRecords_();

  for (var i = 0; i < rows.length; i++) {
    if (!comms_parseYesNo_(comms_getConfigValue_(rows[i], headers.active), false)) continue;
    if (comms_normalizeText_(comms_getConfigValue_(rows[i], headers.communicationCode)) === target) {
      return rows[i];
    }
  }

  return null;
}

function comms_findLogByCorrelationKey_(correlationKey) {
  var target = comms_normalizeText_(correlationKey);
  var rows = comms_getLogRecords_();
  var headers = ANIV_CFG.COMUNICACOES.LOG_HEADERS;

  for (var i = 0; i < rows.length; i++) {
    if (comms_normalizeText_(comms_getConfigValue_(rows[i], headers.correlationKey)) === target) {
      return rows[i];
    }
  }

  return null;
}

function comms_appendLog_(payload) {
  GEAPA_CORE.coreAppendObjectByHeaders(comms_getLogSheet_(), payload, { headerRow: 1 });
}

function comms_updateLogRow_(rowNumber, payload) {
  var sheet = comms_getLogSheet_();
  var headerMap = GEAPA_CORE.coreHeaderMap(sheet, 1);
  var keys = Object.keys(payload || {});

  for (var i = 0; i < keys.length; i++) {
    GEAPA_CORE.coreWriteCellByHeader(sheet, rowNumber, headerMap, keys[i], payload[keys[i]], {
      normalize: true,
      oneBased: true
    });
  }
}

function comms_getCurrentSemesterId_(today) {
  return String(GEAPA_CORE.coreGetSemesterIdForDate(today) || '').trim();
}

function comms_findSemesterRecordById_(semesterId) {
  var target = comms_normalizeText_(semesterId);
  var rows = GEAPA_CORE.coreReadRecordsByKey(ANIV_CFG.COMUNICACOES.SEMESTERS_KEY, {
    headerRow: 1,
    startRow: 2
  });

  for (var i = 0; i < rows.length; i++) {
    if (comms_normalizeText_(comms_getConfigValue_(rows[i], ANIV_CFG.COMUNICACOES.SEMESTER_HEADERS.id)) === target) {
      return rows[i];
    }
  }

  return null;
}

function comms_buildWindow_(today, triggerMode) {
  if (comms_normalizeText_(triggerMode) === 'RESUMO_SEMANAL') {
    return {
      start: today,
      endExclusive: aniv_addDays_(today, ANIV_CFG.DAYS_AHEAD_WEEKLY + 1)
    };
  }

  return {
    start: today,
    endExclusive: aniv_addDays_(today, 1)
  };
}

function comms_normalizeEventSource_(value) {
  var normalized = comms_normalizeText_(value);
  return normalized === 'DADOS-OFICIAIS_GEAPA' ? 'DADOS_OFICIAIS_GEAPA' : normalized;
}

function comms_getOfficialGroupRecord_() {
  try {
    var rows = GEAPA_CORE.coreReadRecordsByKey(ANIV_CFG.OFFICIAL_DATA.KEY, {
      headerRow: 1,
      startRow: 2
    });
    return rows && rows.length ? rows[0] : null;
  } catch (err) {
    return null;
  }
}

function comms_listCurrentMemberEmails_() {
  var sheet = aniv_getSheetByKey_(ANIV_CFG.MEMBERS.KEY);
  var data = aniv_readSheet_(sheet);
  var emailIndex = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_EMAIL, true);
  var statusIndex = aniv_findHeaderIndex_(data.headers, ANIV_CFG.MEMBERS.COL_STATUS, true);
  var activeStatuses = (ANIV_CFG.MEMBERS.ACTIVE_STATUS_VALUES || []).map(function(item) {
    return comms_normalizeText_(item);
  });
  var emails = [];

  if (emailIndex < 0) return [];

  for (var i = 0; i < data.rows.length; i++) {
    var email = String(data.rows[i][emailIndex] || '').trim();
    var status = statusIndex >= 0 ? comms_normalizeText_(data.rows[i][statusIndex]) : '';
    if (statusIndex >= 0 && activeStatuses.length && activeStatuses.indexOf(status) < 0) {
      continue;
    }

    if (email) emails.push(email);
  }

  return GEAPA_CORE.coreUniqueEmails(emails);
}

function comms_listCurrentProfessorEmails_() {
  var sheet = aniv_getSheetByKey_(ANIV_CFG.PROFS.KEY);
  var data = aniv_readSheet_(sheet);
  var emailIndex = aniv_findHeaderIndex_(data.headers, ANIV_CFG.PROFS.COL_EMAIL, true);
  var emails = [];

  if (emailIndex < 0) return [];

  for (var i = 0; i < data.rows.length; i++) {
    var email = String(data.rows[i][emailIndex] || '').trim();
    if (email) emails.push(email);
  }

  return GEAPA_CORE.coreUniqueEmails(emails);
}

function comms_resolveRecipientBundle_(configRecord, eventItems) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var mode = String(
    comms_getConfigValue_(configRecord, headers.recipientMode) || ANIV_CFG.COMUNICACOES.RECIPIENT_MODE
  ).trim().toUpperCase();
  var sendAsBcc = comms_parseYesNo_(comms_getConfigValue_(configRecord, headers.sendAsBcc), ANIV_CFG.COMUNICACOES.SEND_AS_BCC === true);
  var recipients = [];

  if (mode === 'FIXO') {
    recipients = comms_parseEmailList_(comms_getConfigValue_(configRecord, headers.fixedEmail));
  } else if (mode === 'LISTA_FIXA') {
    recipients = comms_parseEmailList_(comms_getConfigValue_(configRecord, headers.fixedEmailList));
  } else if (mode === 'MEMBERS_E_PROFESSORES') {
    recipients = GEAPA_CORE.coreUniqueEmails(
      comms_listCurrentMemberEmails_().concat(comms_listCurrentProfessorEmails_())
    );
  } else if (mode === 'EMAIL_GROUP') {
    recipients = GEAPA_CORE.coreGetCurrentEmailsByEmailGroup(comms_getConfigValue_(configRecord, headers.institutionalGroup) || '');
  } else if (mode === 'EVENT_SOURCE_EMAIL') {
    recipients = GEAPA_CORE.coreUniqueEmails((eventItems || []).map(function(item) {
      return item.email || '';
    }));
  } else {
    mode = 'MEMBERS_ATUAIS';
    recipients = comms_listCurrentMemberEmails_();
  }

  recipients = GEAPA_CORE.coreUniqueEmails(recipients);

  if (sendAsBcc && recipients.length > 1) {
    return {
      mode: mode,
      to: [],
      cc: [],
      bcc: recipients,
      recipientCount: recipients.length
    };
  }

  return {
    mode: mode,
    to: recipients,
    cc: [],
    bcc: [],
    recipientCount: recipients.length
  };
}

function comms_buildAcademicCorrelationKey_(code, semesterId) {
  var normalizedSemester = String(semesterId || '').trim().replace(/[\/\s]+/g, '-');
  var map = {
    MATRICULA_ABERTURA: 'MAT-ABERTURA',
    MATRICULA_FECHAMENTO: 'MAT-FECHAMENTO',
    AJUSTE_ALUNO_ABERTURA: 'AAL-ABERTURA',
    AJUSTE_ALUNO_FECHAMENTO: 'AAL-FECHAMENTO',
    AJUSTE_COORDENADOR_ABERTURA: 'ACO-ABERTURA',
    AJUSTE_COORDENADOR_FECHAMENTO: 'ACO-FECHAMENTO'
  };
  var suffix = map[comms_normalizeText_(code)] || ('CFG-' + comms_slug_(code));
  return ('COM-' + normalizedSemester + '-' + suffix).toUpperCase();
}

function comms_extractEmailLocalPart_(email) {
  var text = String(email || '').trim().toLowerCase();
  if (!text) return '';
  var atIndex = text.indexOf('@');
  return atIndex > 0 ? text.substring(0, atIndex) : text;
}

function comms_buildPersonCorrelationToken_(item) {
  item = item || {};
  var emailToken = comms_slug_(comms_extractEmailLocalPart_(item.email || ''));
  if (emailToken) return emailToken.toUpperCase();

  var nameToken = comms_slug_(item.name || '');
  if (nameToken) return nameToken.toUpperCase();

  return 'PESSOA';
}

function comms_buildBirthdayCodeToken_(code, aggregate) {
  var normalizedCode = comms_normalizeText_(code);
  var map = {
    ANIV_MEM_DIA_PESSOA: 'P',
    ANIV_MEM_DIA_COORD: 'C',
    ANIV_MEM_SEMANA_COORD: 'S',
    ANIV_PROF_DIA_PESSOA: 'P',
    ANIV_PROF_DIA_COORD: 'C',
    ANIV_PROF_SEMANA_COORD: 'S'
  };

  if (map[normalizedCode]) return map[normalizedCode];
  return aggregate ? 'G' : 'P';
}

function comms_buildIntegrationCodeToken_(code) {
  var normalizedCode = comms_normalizeText_(code);
  var map = {
    ANIV_GRUPO_DIA_PESSOA: 'P',
    ANIV_GRUPO_DIA_COORD: 'C'
  };

  return map[normalizedCode] || 'P';
}

function comms_formatYearsCompletedLabel_(yearsCompleted) {
  var years = Number(yearsCompleted || 0);
  return years === 1 ? '1 ano' : (String(years) + ' anos');
}

function comms_buildTemplateVariables_(eventBundle) {
  var firstItem = eventBundle && eventBundle.items && eventBundle.items.length ? eventBundle.items[0] : {};
  var yearsCompleted = Number(firstItem.yearsCompleted || 0);
  var integrationDate = firstItem.integrationDate || '';
  var officialRecord = comms_getOfficialGroupRecord_() || {};
  var semesterId = eventBundle && eventBundle.semesterId ? String(eventBundle.semesterId).trim() : '';

  return {
    nome: String(firstItem.name || '').trim(),
    nome_membro: String(firstItem.name || '').trim(),
    anos_completos: yearsCompleted > 0 ? String(yearsCompleted) : '',
    anos_no_grupo: yearsCompleted > 0 ? String(yearsCompleted) : '',
    anos_no_grupo_label: yearsCompleted > 0 ? comms_formatYearsCompletedLabel_(yearsCompleted) : '',
    data_integracao: integrationDate ? aniv_formatDate_(integrationDate) : '',
    data_referencia: eventBundle && eventBundle.referenceDate ? aniv_formatDate_(eventBundle.referenceDate) : '',
    data_disparo: eventBundle && eventBundle.plannedDate ? aniv_formatDate_(eventBundle.plannedDate) : '',
    semestre: semesterId,
    nome_grupo: String(comms_getConfigValue_(officialRecord, ANIV_CFG.OFFICIAL_DATA.COL_ORG_NAME) || '').trim(),
    sigla_grupo: String(comms_getConfigValue_(officialRecord, ANIV_CFG.OFFICIAL_DATA.COL_SHORT_NAME) || '').trim(),
    email_oficial: String(comms_getConfigValue_(officialRecord, ANIV_CFG.OFFICIAL_DATA.COL_EMAIL) || '').trim(),
    codigo_comunicacao: eventBundle && eventBundle.communicationCode ? String(eventBundle.communicationCode).trim() : '',
    tipo_fluxo: eventBundle && eventBundle.flowType ? String(eventBundle.flowType).trim() : '',
    fonte_evento: eventBundle && eventBundle.eventSource ? String(eventBundle.eventSource).trim() : ''
  };
}

function comms_interpolateText_(value, vars) {
  return String(value || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function(match, key) {
    return Object.prototype.hasOwnProperty.call(vars || {}, key) ? String(vars[key] || '') : '';
  }).trim();
}

function comms_buildCorrelationKey_(configRecord, eventBundle) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var flowType = comms_normalizeText_(comms_getConfigValue_(configRecord, headers.flowType));
  var source = comms_normalizeEventSource_(comms_getConfigValue_(configRecord, headers.eventSource));
  var code = String(comms_getConfigValue_(configRecord, headers.communicationCode) || '').trim();
  var dateToken = Utilities.formatDate(eventBundle.plannedDate, ANIV_CFG.TZ, 'yyyyMMdd');

  if (flowType === 'AVISO_ACADEMICO' && eventBundle.semesterId) {
    return comms_buildAcademicCorrelationKey_(code, eventBundle.semesterId);
  }

  if (source === 'MEMBERS_ATUAIS') {
    if (eventBundle.milestoneType === 'ANIVERSARIO_INTEGRACAO_ANUAL' && eventBundle.aggregate === false && eventBundle.items.length === 1) {
      return ('COM-MEM-ING-' +
        comms_buildIntegrationCodeToken_(code) +
        '-' +
        dateToken +
        '-' +
        String(eventBundle.items[0].yearsCompleted || 0) + 'A' +
        '-' +
        comms_buildPersonCorrelationToken_(eventBundle.items[0])).toUpperCase();
    }
    if (eventBundle.aggregate === false && eventBundle.items.length === 1) {
      return ('COM-MEM-' +
        comms_buildBirthdayCodeToken_(code, false) +
        '-' +
        dateToken +
        '-' +
        comms_buildPersonCorrelationToken_(eventBundle.items[0])).toUpperCase();
    }
    return ('COM-MEM-' + comms_buildBirthdayCodeToken_(code, true) + '-' + dateToken).toUpperCase();
  }

  if (source === 'PROFESSORES') {
    if (eventBundle.aggregate === false && eventBundle.items.length === 1) {
      return ('COM-PROF-' +
        comms_buildBirthdayCodeToken_(code, false) +
        '-' +
        dateToken +
        '-' +
        comms_buildPersonCorrelationToken_(eventBundle.items[0])).toUpperCase();
    }
    return ('COM-PROF-' + comms_buildBirthdayCodeToken_(code, true) + '-' + dateToken).toUpperCase();
  }

  if (source === 'DADOS_OFICIAIS_GEAPA') {
    return ('COM-GRP-' + comms_slug_(code) + '-' + dateToken).toUpperCase();
  }

  return ('COM-CFG-' + comms_slug_(code) + '-' + dateToken).toUpperCase();
}

function comms_buildPayload_(configRecord, eventBundle) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var vars = comms_buildTemplateVariables_(Object.assign({}, eventBundle, {
    communicationCode: String(comms_getConfigValue_(configRecord, headers.communicationCode) || '').trim(),
    flowType: String(comms_getConfigValue_(configRecord, headers.flowType) || '').trim(),
    eventSource: String(comms_getConfigValue_(configRecord, headers.eventSource) || '').trim()
  }));
  var flowType = comms_normalizeText_(comms_getConfigValue_(configRecord, headers.flowType));
  var title = comms_interpolateText_(comms_getConfigValue_(configRecord, headers.title), vars);
  var preheader = comms_interpolateText_(comms_getConfigValue_(configRecord, headers.preheader), vars);
  var introText = comms_interpolateText_(comms_getConfigValue_(configRecord, headers.introText), vars);
  var highlightBlock = comms_interpolateText_(comms_getConfigValue_(configRecord, headers.highlightBlock), vars);
  var buttonLabel = comms_interpolateText_(comms_getConfigValue_(configRecord, headers.buttonLabel), vars);
  var buttonLink = String(comms_getConfigValue_(configRecord, headers.buttonLink) || '').trim();
  var description = comms_interpolateText_(comms_getConfigValue_(configRecord, headers.description), vars);
  var blocks = [];

  if (highlightBlock) {
    blocks.push({ title: 'Destaque', text: highlightBlock });
  }

  if (flowType === 'COMEMORACAO') {
    if (eventBundle.aggregate === false && eventBundle.items.length === 1) {
      var person = eventBundle.items[0];
      if (person.yearsCompleted && person.integrationDate) {
        introText = introText || ('Hoje celebramos ' + comms_formatYearsCompletedLabel_(person.yearsCompleted) + ' de grupo de ' + person.name + '.');
      }
      introText = introText || ('Parabéns pelo seu dia, ' + person.name + '.');
      blocks.push({
        title: eventBundle.entityType === 'GRUPO' ? 'Grupo homenageado' : 'Pessoa homenageada',
        items: [
          { label: 'Nome', value: person.name },
          { label: 'Data', value: aniv_formatDate_(eventBundle.referenceDate) },
          { label: 'Data de integracao', value: person.integrationDate ? aniv_formatDate_(person.integrationDate) : '' },
          { label: 'Anos no grupo', value: person.yearsCompleted ? comms_formatYearsCompletedLabel_(person.yearsCompleted) : '' },
          { label: 'Origem', value: eventBundle.sourceLabel }
        ]
      });
    } else if (eventBundle.items && eventBundle.items.length) {
      blocks.push({
        title: eventBundle.triggerMode === 'RESUMO_SEMANAL' ? 'Aniversariantes da semana' : 'Aniversariantes do dia',
        items: eventBundle.items.map(function(item) {
          return {
            label: item.name,
            value: aniv_formatBirth_(aniv_normalizeToYear_(item.birth, eventBundle.referenceDate.getFullYear()))
          };
        })
      });
    }
  } else if (flowType === 'AVISO_ACADEMICO') {
    blocks.push({
      title: 'Referência institucional',
      items: [
        { label: 'Semestre', value: eventBundle.semesterId || '' },
        { label: 'Data de referência', value: aniv_formatDate_(eventBundle.referenceDate) },
        { label: 'Data de disparo', value: aniv_formatDate_(eventBundle.plannedDate) }
      ]
    });
  } else {
    blocks.push({
      title: 'Comunicado',
      text: description || introText || 'Comunicado institucional do GEAPA.'
    });
  }

  var payload = {
    preheader: preheader || title || description,
    eyebrow: flowType === 'COMEMORACAO' ? 'Comemoração GEAPA' : (flowType === 'AVISO_ACADEMICO' ? 'Aviso acadêmico GEAPA' : 'Comunicado geral GEAPA'),
    title: title || description || 'Comunicação GEAPA',
    subtitle: eventBundle.subtitle || '',
    introText: introText || description || '',
    blocks: blocks
  };

  if (buttonLabel || buttonLink) {
    payload.cta = {
      label: buttonLabel || 'Saiba mais',
      url: buttonLink || '',
      helper: buttonLink ? 'Acesse o link para mais detalhes.' : 'Esta comunicação segue a configuração institucional do GEAPA.'
    };
  }

  return payload;
}

function comms_buildContract_(configRecord, eventBundle) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var vars = comms_buildTemplateVariables_(Object.assign({}, eventBundle, {
    communicationCode: String(comms_getConfigValue_(configRecord, headers.communicationCode) || '').trim(),
    flowType: String(comms_getConfigValue_(configRecord, headers.flowType) || '').trim(),
    eventSource: String(comms_getConfigValue_(configRecord, headers.eventSource) || '').trim()
  }));
  var subjectHuman = String(comms_getConfigValue_(configRecord, headers.subjectHuman) || '').trim() || String(comms_getConfigValue_(configRecord, headers.description) || '').trim() || 'Comunicação GEAPA';
  subjectHuman = comms_interpolateText_(subjectHuman, vars) || subjectHuman;
  var templateKey = String(comms_getConfigValue_(configRecord, headers.templateKey) || '').trim() || ANIV_CFG.COMUNICACOES.TEMPLATE_KEY;
  var priority = String(comms_getConfigValue_(configRecord, headers.priority) || '').trim() || ANIV_CFG.COMUNICACOES.PRIORITY;
  var recipients = comms_resolveRecipientBundle_(configRecord, eventBundle.items);
  var recipientLimit = comms_parseInteger_(comms_getConfigValue_(configRecord, headers.recipientBatchLimit), 0);
  var tags = comms_parseTags_(comms_getConfigValue_(configRecord, headers.tags));
  var category = String(comms_getConfigValue_(configRecord, headers.category) || '').trim();
  var replyTo = String(comms_getConfigValue_(configRecord, headers.replyTo) || '').trim();
  var attachmentRefs = [
    String(comms_getConfigValue_(configRecord, headers.attachment1) || '').trim(),
    String(comms_getConfigValue_(configRecord, headers.attachment2) || '').trim(),
    String(comms_getConfigValue_(configRecord, headers.attachment3) || '').trim()
  ].filter(function(item) { return !!item; });

  if (recipientLimit > 0) {
    if (recipients.bcc.length) {
      recipients.bcc = recipients.bcc.slice(0, recipientLimit);
      recipients.recipientCount = recipients.bcc.length;
    } else if (recipients.to.length) {
      recipients.to = recipients.to.slice(0, recipientLimit);
      recipients.recipientCount = recipients.to.length;
    }
  }

  return {
    moduleName: ANIV_CFG.COMUNICACOES.MODULE_NAME,
    templateKey: templateKey,
    correlationKey: comms_buildCorrelationKey_(configRecord, eventBundle),
    entityType: eventBundle.entityType || 'COMUNICACAO',
    entityId: eventBundle.entityId || eventBundle.semesterId || '',
    flowCode: String(comms_getConfigValue_(configRecord, headers.communicationCode) || '').trim(),
    to: recipients.to,
    cc: recipients.cc,
    bcc: recipients.bcc,
    subjectHuman: subjectHuman,
    payload: comms_buildPayload_(configRecord, eventBundle),
    priority: priority,
    sendAfter: eventBundle.plannedDate,
    replyTo: replyTo,
    attachments: attachmentRefs,
    metadata: {
      flowType: String(comms_getConfigValue_(configRecord, headers.flowType) || '').trim(),
      communicationCode: String(comms_getConfigValue_(configRecord, headers.communicationCode) || '').trim(),
      eventSource: String(comms_getConfigValue_(configRecord, headers.eventSource) || '').trim(),
      triggerMode: String(comms_getConfigValue_(configRecord, headers.triggerMode) || '').trim(),
      recipientMode: recipients.mode,
      recipientCount: recipients.recipientCount,
      configRowNumber: configRecord.__rowNumber || 0,
      duplicateWindowDays: comms_parseInteger_(comms_getConfigValue_(configRecord, headers.duplicateWindowDays), 0),
      category: category,
      tags: tags,
      replyTo: replyTo,
      useInstitutionalSignature: comms_parseYesNo_(comms_getConfigValue_(configRecord, headers.useInstitutionalSignature), true),
      attachmentRefs: attachmentRefs,
      manualEnabled: comms_parseYesNo_(comms_getConfigValue_(configRecord, headers.manualEnabled), false),
      allowManualResend: comms_parseYesNo_(comms_getConfigValue_(configRecord, headers.allowManualResend), false),
      recipientBatchLimit: recipientLimit
    }
  };
}

function comms_findLogByCorrelationKeyInRows_(rows, correlationKey) {
  var target = comms_normalizeText_(correlationKey);
  var headers = ANIV_CFG.COMUNICACOES.LOG_HEADERS;

  for (var i = 0; i < (rows || []).length; i++) {
    if (comms_normalizeText_(comms_getConfigValue_(rows[i], headers.correlationKey)) === target) {
      return rows[i];
    }
  }

  return null;
}

function comms_buildPayloadSummary_(configRecord, contract, bundle) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var firstItem = bundle && bundle.items && bundle.items.length ? bundle.items[0] : {};
  return {
    communicationCode: String(comms_getConfigValue_(configRecord, headers.communicationCode) || '').trim(),
    category: String(contract.metadata.category || '').trim(),
    tags: contract.metadata.tags || [],
    templateKey: String(contract.templateKey || '').trim(),
    recipientMode: String(contract.metadata.recipientMode || '').trim(),
    recipientCount: Number(contract.metadata.recipientCount || 0),
    entityType: String(contract.entityType || '').trim(),
    entityId: String(contract.entityId || '').trim(),
    flowCode: String(contract.flowCode || '').trim(),
    subjectHuman: String(contract.subjectHuman || '').trim(),
    sendAfter: bundle && bundle.plannedDate ? bundle.plannedDate : '',
    referenceDate: bundle && bundle.referenceDate ? bundle.referenceDate : '',
    eventSource: String(contract.metadata.eventSource || '').trim(),
    triggerMode: String(contract.metadata.triggerMode || '').trim(),
    sourceLabel: String(bundle && bundle.sourceLabel ? bundle.sourceLabel : '').trim(),
    templateRequested: String(contract.metadata.templateRequested || contract.templateKey || '').trim(),
    templateFinal: String(contract.metadata.templateFinal || contract.templateKey || '').trim(),
    recipientPreview: contract.metadata.recipientPreview || [],
    triggerResponsible: String(contract.metadata.triggerResponsible || '').trim(),
    bundleItemCount: bundle && bundle.items ? bundle.items.length : 0,
    hasAttachmentsConfigured: (contract.metadata.attachmentRefs || []).length > 0,
    yearsCompleted: Number(firstItem.yearsCompleted || 0),
    integrationDate: firstItem.integrationDate ? aniv_formatDate_(firstItem.integrationDate) : ''
  };
}

function comms_getPayloadSummaryFromLog_(row) {
  return comms_parseJson_(comms_getConfigValue_(row, ANIV_CFG.COMUNICACOES.LOG_HEADERS.payloadSummary), {});
}

function comms_findDuplicateWithinWindow_(rows, configRecord, contract, bundle) {
  var headers = ANIV_CFG.COMUNICACOES.LOG_HEADERS;
  var windowDays = Number(contract.metadata.duplicateWindowDays || 0);
  var communicationCode = comms_normalizeText_(contract.metadata.communicationCode);
  var entityType = comms_normalizeText_(contract.entityType);
  var entityId = comms_normalizeText_(contract.entityId);
  var semesterId = comms_normalizeText_(bundle && bundle.semesterId ? bundle.semesterId : '');

  if (windowDays <= 0) return null;

  for (var i = 0; i < (rows || []).length; i++) {
    var row = rows[i];
    var status = comms_normalizeText_(comms_getConfigValue_(row, headers.status));
    if (status !== 'PENDENTE' && status !== 'ENVIADO') continue;
    if (comms_normalizeText_(comms_getConfigValue_(row, headers.communicationCode)) !== communicationCode) continue;

    var rowSemesterId = comms_normalizeText_(comms_getConfigValue_(row, headers.semesterId));
    if (semesterId && rowSemesterId && semesterId !== rowSemesterId) continue;

    var payloadSummary = comms_getPayloadSummaryFromLog_(row);
    var summaryEntityType = comms_normalizeText_(payloadSummary.entityType || '');
    var summaryEntityId = comms_normalizeText_(payloadSummary.entityId || '');

    if (entityType && summaryEntityType && entityType !== summaryEntityType) continue;
    if (entityId && summaryEntityId && entityId !== summaryEntityId) continue;

    var rowDate = comms_getConfigValue_(row, headers.plannedAt) || comms_getConfigValue_(row, headers.queuedAt) || comms_getConfigValue_(row, headers.sentAt);
    if (comms_dayDiff_(rowDate, bundle.plannedDate) <= windowDays) {
      return row;
    }
  }

  return null;
}

function comms_updateInMemoryLogRow_(row, payload) {
  var keys = Object.keys(payload || {});
  for (var i = 0; i < keys.length; i++) {
    row[keys[i]] = payload[keys[i]];
  }
  return row;
}

function comms_writeQueueLog_(rows, existingLog, configRecord, contract, bundle, queueResult, wasResend) {
  var now = new Date();
  var payloadSummary = comms_buildPayloadSummary_(configRecord, contract, bundle);
  var logPayload = {
    'Status': queueResult.status,
    'Modulo Dono': ANIV_CFG.COMUNICACOES.MODULE_NAME,
    'Assunto Final': queueResult.subject,
    'Id Saida Central': queueResult.saidaId || '',
    'Id Thread Gmail': '',
    'Id Mensagem Gmail': '',
    'Ultimo Erro': '',
    'Quantidade Destinatarios': Number(contract.metadata.recipientCount || 0),
    'Modo Destinatario Resolvido': String(contract.metadata.recipientMode || '').trim(),
    'Template Usado': String(contract.templateKey || '').trim(),
    'Data Enfileiramento': now,
    'Data Processamento': '',
    'Tentativas Envio': 0,
    'Foi Reenvio': wasResend === true ? 'SIM' : 'NAO',
    'Tags': (contract.metadata.tags || []).join(', '),
    'Payload Resumo': JSON.stringify(payloadSummary),
    'Observacoes': JSON.stringify({
      duplicate: queueResult.duplicate === true,
      requeued: queueResult.requeued === true,
      configRowNumber: contract.metadata.configRowNumber,
      recipientMode: contract.metadata.recipientMode,
      recipientCount: contract.metadata.recipientCount,
      recipientPreview: contract.metadata.recipientPreview || [],
      category: contract.metadata.category || '',
      replyTo: contract.metadata.replyTo || '',
      eventSource: contract.metadata.eventSource || '',
      triggerMode: contract.metadata.triggerMode || '',
      sourceLabel: bundle && bundle.sourceLabel ? bundle.sourceLabel : '',
      templateRequested: contract.metadata.templateRequested || contract.templateKey || '',
      templateFinal: contract.metadata.templateFinal || contract.templateKey || '',
      triggerResponsible: contract.metadata.triggerResponsible || '',
      attachmentCount: (contract.metadata.attachmentRefs || []).length
    }),
    'Atualizado Em': now
  };

  if (existingLog) {
    comms_updateLogRow_(existingLog.__rowNumber, logPayload);
    return comms_updateInMemoryLogRow_(existingLog, logPayload);
  }

  var createdPayload = Object.assign({
    'Id Comunicacao': 'CCM-' + comms_slug_(contract.correlationKey),
    'Chave de Correlacao': contract.correlationKey,
    'Tipo Fluxo': contract.metadata.flowType,
    'Codigo Comunicacao': contract.metadata.communicationCode,
    'ID_Semestre': bundle.semesterId || '',
    'Data Referencia': bundle.referenceDate,
    'Data Disparo Prevista': bundle.plannedDate,
    'Enviado Em': '',
    'Criado Em': now
  }, logPayload);

  comms_appendLog_(createdPayload);
  var inMemory = Object.assign({ __rowNumber: comms_getLogSheet_().getLastRow() }, createdPayload);
  rows.push(inMemory);
  return inMemory;
}

function comms_buildRecipientPreview_(contract) {
  var all = []
    .concat(Array.isArray(contract.to) ? contract.to : [])
    .concat(Array.isArray(contract.cc) ? contract.cc : [])
    .concat(Array.isArray(contract.bcc) ? contract.bcc : []);
  return GEAPA_CORE.coreUniqueEmails(all).slice(0, 5);
}

function comms_setContractOperationalMetadata_(contract, bundle, opts) {
  contract = contract || {};
  contract.metadata = contract.metadata || {};
  opts = opts || {};

  contract.metadata.templateRequested = String(contract.templateKey || '').trim();
  contract.metadata.templateFinal = String(contract.templateKey || '').trim();
  contract.metadata.sourceLabel = String(bundle && bundle.sourceLabel ? bundle.sourceLabel : '').trim();
  contract.metadata.triggerResponsible = opts.isManual === true ? 'MANUAL' : 'AUTOMATICO';
  contract.metadata.recipientPreview = comms_buildRecipientPreview_(contract);
  contract.metadata.bundleItemCount = bundle && bundle.items ? bundle.items.length : 0;
  return contract;
}

function comms_buildBirthdayBundles_(configRecord, source, triggerMode, today) {
  var window = comms_buildWindow_(today, triggerMode);
  var items = source === 'MEMBERS_ATUAIS'
    ? aniv_getMemberBirthdaysForWindow_(window.start, window.endExclusive).map(function(item) {
        return Object.assign({ sourceType: source }, item);
      })
    : aniv_getProfBirthdaysForWindow_(window.start, window.endExclusive).map(function(item) {
        return Object.assign({ sourceType: source }, item);
      });
  if (!items.length) return [];

  var recipientMode = comms_normalizeText_(comms_getConfigValue_(configRecord, ANIV_CFG.COMUNICACOES.CONFIG_HEADERS.recipientMode));
  var aggregate = recipientMode !== 'EVENT_SOURCE_EMAIL';
  var bundles = [];

  if (!aggregate) {
    items.forEach(function(item) {
      bundles.push({
        aggregate: false,
        items: [item],
        referenceDate: today,
        plannedDate: today,
        sourceLabel: source === 'MEMBERS_ATUAIS' ? 'Membros' : 'Professores',
        triggerMode: triggerMode,
        subtitle: aniv_formatDate_(today),
        entityType: source === 'MEMBERS_ATUAIS' ? 'MEMBRO' : 'PROFESSOR',
        entityId: item.email || item.name || ''
      });
    });
    return bundles;
  }

  bundles.push({
    aggregate: true,
    items: items,
    referenceDate: today,
    plannedDate: today,
    sourceLabel: source === 'MEMBERS_ATUAIS' ? 'Membros' : 'Professores',
    triggerMode: triggerMode,
    subtitle: triggerMode === 'RESUMO_SEMANAL'
      ? ('De ' + aniv_formatDate_(window.start) + ' ate ' + aniv_formatDate_(aniv_addDays_(window.start, ANIV_CFG.DAYS_AHEAD_WEEKLY)))
      : aniv_formatDate_(today),
    entityType: source === 'MEMBERS_ATUAIS' ? 'MEMBROS' : 'PROFESSORES',
    entityId: triggerMode === 'RESUMO_SEMANAL' ? Utilities.formatDate(today, ANIV_CFG.TZ, 'yyyyMMdd') : Utilities.formatDate(today, ANIV_CFG.TZ, 'yyyyMMdd')
  });
  return bundles;
}

function comms_buildIntegrationAnniversaryBundles_(configRecord, today) {
  var items = aniv_getMemberIntegrationAnniversariesForWindow_(today, aniv_addDays_(today, 1)).map(function(item) {
    return Object.assign({ sourceType: 'MEMBERS_ATUAIS' }, item);
  });
  var bundles = [];

  if (!items.length) return bundles;

  items.forEach(function(item) {
    bundles.push({
      aggregate: false,
      milestoneType: 'ANIVERSARIO_INTEGRACAO_ANUAL',
      items: [item],
      referenceDate: item.anniversaryDate || today,
      plannedDate: today,
      sourceLabel: 'Tempo de grupo',
      triggerMode: 'ANIVERSARIO_INTEGRACAO_ANUAL',
      subtitle: comms_formatYearsCompletedLabel_(item.yearsCompleted) + ' de GEAPA',
      entityType: 'MEMBRO',
      entityId: item.email || item.name || ''
    });
  });

  return bundles;
}

function comms_buildOfficialDataBundles_(configRecord, today) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var officialRecord = comms_getOfficialGroupRecord_();
  if (!officialRecord) return [];

  var originField = String(comms_getConfigValue_(configRecord, headers.originDateField) || '').trim() || ANIV_CFG.OFFICIAL_DATA.COL_CREATED_AT;
  var originalDate = aniv_parseDateAny_(comms_getConfigValue_(officialRecord, originField));
  if (!originalDate) return [];

  var normalizedDate = aniv_normalizeToYear_(originalDate, today.getFullYear());
  if (!aniv_inWindowMonthDay_(normalizedDate, today, aniv_addDays_(today, 1))) return [];

  var groupName = String(comms_getConfigValue_(officialRecord, ANIV_CFG.OFFICIAL_DATA.COL_ORG_NAME) || '').trim();
  var shortName = String(comms_getConfigValue_(officialRecord, ANIV_CFG.OFFICIAL_DATA.COL_SHORT_NAME) || '').trim();
  var officialEmail = String(comms_getConfigValue_(officialRecord, ANIV_CFG.OFFICIAL_DATA.COL_EMAIL) || '').trim();
  var displayName = groupName || shortName || 'GEAPA';

  return [{
    aggregate: false,
    items: [{
      name: displayName,
      shortName: shortName || 'GEAPA',
      email: officialEmail,
      sourceType: 'DADOS_OFICIAIS_GEAPA'
    }],
    referenceDate: normalizedDate,
    plannedDate: today,
    sourceLabel: shortName || displayName,
    triggerMode: 'DATA_ORIGEM',
    subtitle: aniv_formatDate_(normalizedDate),
    entityType: 'GRUPO',
    entityId: shortName || displayName
  }];
}

function comms_buildSemesterBundles_(configRecord, today, opts) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  opts = opts || {};
  var semesterId = comms_parseYesNo_(comms_getConfigValue_(configRecord, headers.useCurrentSemester), false)
    ? comms_getCurrentSemesterId_(today)
    : String(comms_getConfigValue_(configRecord, headers.semesterId) || '').trim();
  if (!semesterId) return [];

  var semesterRecord = comms_findSemesterRecordById_(semesterId);
  if (!semesterRecord) return [];

  var originField = String(comms_getConfigValue_(configRecord, headers.originDateField) || '').trim();
  var referenceDate = aniv_parseDateAny_(comms_getConfigValue_(semesterRecord, originField));
  if (!referenceDate) return [];

  var beforeDays = comms_parseInteger_(comms_getConfigValue_(configRecord, headers.daysBefore), 0);
  var afterDays = comms_parseInteger_(comms_getConfigValue_(configRecord, headers.daysAfter), 0);
  var plannedDate = aniv_startOfDay_(aniv_addDays_(referenceDate, afterDays - beforeDays));
  if (opts.forceManual === true) {
    plannedDate = aniv_startOfDay_(opts.manualRunDate || today);
  } else if (!GEAPA_CORE.coreIsSameDay(plannedDate, today)) {
    return [];
  }

  return [{
    aggregate: true,
    items: [{
      semesterId: semesterId,
      referenceDate: referenceDate
    }],
    referenceDate: referenceDate,
    plannedDate: plannedDate,
    semesterId: semesterId,
    subtitle: 'Semestre ' + semesterId,
    entityType: 'SEMESTRE',
    entityId: semesterId
  }];
}

function comms_buildConfigBundles_(configRecord, today, opts) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  opts = opts || {};
  var triggerMode = comms_normalizeText_(comms_getConfigValue_(configRecord, headers.triggerMode));
  if (triggerMode === 'MANUAL' && opts.forceManual !== true) return [];

  var manualDate = aniv_parseDateAny_(comms_getConfigValue_(configRecord, headers.manualDate));
  if (!manualDate && opts.forceManual !== true) return [];
  if (!manualDate) manualDate = aniv_startOfDay_(opts.manualRunDate || today);

  var beforeDays = comms_parseInteger_(comms_getConfigValue_(configRecord, headers.daysBefore), 0);
  var afterDays = comms_parseInteger_(comms_getConfigValue_(configRecord, headers.daysAfter), 0);
  var plannedDate = aniv_startOfDay_(aniv_addDays_(manualDate, afterDays - beforeDays));
  if (opts.forceManual === true) {
    plannedDate = aniv_startOfDay_(opts.manualRunDate || today);
  } else if (!GEAPA_CORE.coreIsSameDay(plannedDate, today)) {
    return [];
  }

  return [{
    aggregate: true,
    items: [],
    referenceDate: manualDate,
    plannedDate: plannedDate,
    subtitle: aniv_formatDate_(plannedDate),
    entityType: 'CONFIG',
    entityId: String(comms_getConfigValue_(configRecord, headers.communicationCode) || '').trim()
  }];
}

function comms_collectBundlesForConfig_(configRecord, today, opts) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var source = comms_normalizeEventSource_(comms_getConfigValue_(configRecord, headers.eventSource));
  var triggerMode = comms_normalizeText_(comms_getConfigValue_(configRecord, headers.triggerMode));

  if (source === 'MEMBERS_ATUAIS' && triggerMode === 'ANIVERSARIO_INTEGRACAO_ANUAL') {
    return comms_buildIntegrationAnniversaryBundles_(configRecord, today);
  }
  if (source === 'MEMBERS_ATUAIS' || source === 'PROFESSORES') {
    return comms_buildBirthdayBundles_(configRecord, source, triggerMode, today);
  }
  if (source === 'DADOS_OFICIAIS_GEAPA') {
    return comms_buildOfficialDataBundles_(configRecord, today);
  }
  if (source === 'VIGENCIA_SEMESTRES') {
    return comms_buildSemesterBundles_(configRecord, today, opts);
  }
  if (source === 'CONFIG') {
    return comms_buildConfigBundles_(configRecord, today, opts);
  }
  return [];
}

function comms_processConfigRows_(today, filterFn, opts) {
  var rows = comms_getConfigRecords_();
  var logs = comms_getLogRecords_();
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var runId = GEAPA_CORE.coreRunId();
  var counters = comms_createCounters_();
  opts = opts || {};

  for (var i = 0; i < rows.length; i++) {
    var configRow = rows[i];
    if (!comms_parseYesNo_(comms_getConfigValue_(configRow, headers.active), false)) continue;
    if (filterFn && filterFn(configRow) !== true) continue;
    counters.matchedConfigs++;

    var bundles = comms_collectBundlesForConfig_(configRow, today, opts);
    counters.generatedBundles += bundles.length;

    for (var j = 0; j < bundles.length; j++) {
      var bundle = bundles[j];
      var contract = null;
      var existingLog = null;
      try {
        contract = comms_buildContract_(configRow, bundle);
        comms_setContractOperationalMetadata_(contract, bundle, opts);
        if (opts.forceQueueDuplicate === true) {
          contract.forceQueueDuplicate = true;
          contract.metadata.forceQueueDuplicate = true;
        }
        var correlationKey = contract.correlationKey;
        existingLog = comms_findLogByCorrelationKeyInRows_(logs, correlationKey);
        var existingStatus = existingLog ? comms_normalizeText_(existingLog[ANIV_CFG.COMUNICACOES.LOG_HEADERS.status]) : '';
        if ((existingStatus === 'PENDENTE' || existingStatus === 'ENVIADO') && opts.forceQueueDuplicate !== true) {
          counters.duplicates++;
          continue;
        }

        var duplicateWithinWindow = comms_findDuplicateWithinWindow_(logs, configRow, contract, bundle);
        if (duplicateWithinWindow && opts.allowDuplicateWindowBypass !== true) {
          counters.duplicates++;
          continue;
        }

        var recipientCount = contract.to.length + contract.bcc.length;
        if (!recipientCount) {
          counters.withoutRecipients++;
          continue;
        }

        var queueResult = GEAPA_CORE.coreMailQueueOutgoing(contract);
        comms_writeQueueLog_(logs, existingLog, configRow, contract, bundle, queueResult, opts.isManual === true && opts.forceQueueDuplicate === true);

        if (queueResult.requeued === true) counters.requeued++;
        else if (queueResult.duplicate === true) counters.duplicates++;
        else counters.queued++;
      } catch (err) {
        counters.errors++;
        var errorMessage = err && err.message ? err.message : String(err || 'Erro desconhecido');
        counters.errorDetails.push({
          communicationCode: String(comms_getConfigValue_(configRow, headers.communicationCode) || '').trim(),
          flowType: String(comms_getConfigValue_(configRow, headers.flowType) || '').trim(),
          eventSource: String(comms_getConfigValue_(configRow, headers.eventSource) || '').trim(),
          plannedDate: bundle && bundle.plannedDate ? bundle.plannedDate : '',
          semesterId: bundle && bundle.semesterId ? bundle.semesterId : '',
          error: errorMessage
        });
        if (contract) {
          comms_writeQueueLog_(logs, existingLog, configRow, contract, bundle, {
            status: 'ERRO',
            subject: contract.subjectHuman || '',
            saidaId: '',
            duplicate: false,
            requeued: false
          }, opts.isManual === true && opts.forceQueueDuplicate === true);
          var latestLog = comms_findLogByCorrelationKeyInRows_(logs, contract.correlationKey);
          if (latestLog) {
            comms_updateLogRow_(latestLog.__rowNumber, {
              'Ultimo Erro': errorMessage,
              'Status': 'ERRO',
              'Atualizado Em': new Date()
            });
            comms_updateInMemoryLogRow_(latestLog, {
              'Ultimo Erro': errorMessage,
              'Status': 'ERRO',
              'Atualizado Em': new Date()
            });
          }
        }
        GEAPA_CORE.coreLogError(runId, 'comms_processConfigRows_', 'Erro ao enfileirar comunicacao', {
          communicationCode: String(comms_getConfigValue_(configRow, headers.communicationCode) || '').trim(),
          flowType: String(comms_getConfigValue_(configRow, headers.flowType) || '').trim(),
          eventSource: String(comms_getConfigValue_(configRow, headers.eventSource) || '').trim(),
          plannedDate: bundle && bundle.plannedDate ? bundle.plannedDate : '',
          semesterId: bundle && bundle.semesterId ? bundle.semesterId : '',
          error: errorMessage
        });
      }
    }
  }

  return Object.freeze(counters);
}

function comms_syncLogWithOutbox_() {
  var logs = comms_getLogRecords_();
  var outbox = GEAPA_CORE.coreReadRecordsByKey('MAIL_SAIDA', {
    headerRow: 1,
    startRow: 2
  });
  var byCorrelationKey = {};
  var updated = 0;

  outbox.forEach(function(row) {
    var key = comms_normalizeText_(row['Chave de Correlacao']);
    if (key) byCorrelationKey[key] = row;
  });

  logs.forEach(function(row) {
    var key = comms_normalizeText_(comms_getConfigValue_(row, ANIV_CFG.COMUNICACOES.LOG_HEADERS.correlationKey));
    var outboxRow = byCorrelationKey[key];
    if (!outboxRow) return;

    var observations = comms_parseJson_(outboxRow['Observacoes'], {});
    var outboxMetadata = observations.metadata || {};
    var attempts = Number(outboxRow['Tentativas'] || 0);
    var currentLogObservations = comms_parseJson_(comms_getConfigValue_(row, ANIV_CFG.COMUNICACOES.LOG_HEADERS.observations), {});
    var mergedObservations = Object.assign({}, currentLogObservations, {
      outboxStatus: String(outboxRow['Status Envio'] || '').trim(),
      outboxAttempts: attempts,
      outboxUpdatedAt: new Date(),
      templateFinal: String(observations.templateKey || outboxMetadata.templateKey || currentLogObservations.templateFinal || '').trim(),
      lastOutboxError: String(outboxRow['Ultimo Erro'] || '').trim()
    });

    comms_updateLogRow_(row.__rowNumber, {
      'Status': String(outboxRow['Status Envio'] || '').trim(),
      'Assunto Final': String(outboxRow['Assunto'] || '').trim(),
      'Id Saida Central': String(outboxRow['Id Saida'] || '').trim(),
      'Id Thread Gmail': String(outboxRow['Id Thread Gmail'] || '').trim(),
      'Id Mensagem Gmail': String(outboxRow['Id Mensagem Gmail'] || '').trim(),
      'Enviado Em': outboxRow['Enviado Em'] || '',
      'Ultimo Erro': String(outboxRow['Ultimo Erro'] || '').trim(),
      'Data Processamento': outboxRow['Enviado Em'] || '',
      'Tentativas Envio': attempts,
      'Template Usado': String(observations.templateKey || outboxMetadata.templateKey || comms_getConfigValue_(row, ANIV_CFG.COMUNICACOES.LOG_HEADERS.templateUsed) || '').trim(),
      'Observacoes': JSON.stringify(mergedObservations),
      'Atualizado Em': new Date()
    });
    updated++;
  });

  return Object.freeze({ ok: true, updated: updated });
}

function comms_queueCommunicationByCode_(code, opts) {
  opts = opts || {};

  var configRow = comms_findConfigByCode_(code);
  if (!configRow) {
    throw new Error('Comunicacao nao encontrada ou inativa: ' + code);
  }

  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var manualEnabled = comms_parseYesNo_(comms_getConfigValue_(configRow, headers.manualEnabled), false);
  if (manualEnabled !== true && opts.force !== true) {
    throw new Error('Comunicacao nao habilitada para disparo manual: ' + code);
  }

  var allowManualResend = comms_parseYesNo_(comms_getConfigValue_(configRow, headers.allowManualResend), false);
  var manualDate = comms_startOfDay_(opts.refDate || aniv_now_());
  var isExplicitResend = opts.resend === true;

  if (isExplicitResend && allowManualResend !== true && opts.force !== true) {
    throw new Error('Comunicacao nao permite reenvio manual: ' + code);
  }

  return comms_processConfigRows_(manualDate, function(row) {
    return row.__rowNumber === configRow.__rowNumber;
  }, {
    forceManual: true,
    manualRunDate: manualDate,
    isManual: true,
    allowDuplicateWindowBypass: isExplicitResend && allowManualResend === true,
    forceQueueDuplicate: isExplicitResend && allowManualResend === true
  });
}

function comms_previewCommunicationByCode_(code, opts) {
  opts = opts || {};
  var configRow = comms_findConfigByCode_(code);
  if (!configRow) {
    throw new Error('Comunicacao nao encontrada ou inativa: ' + code);
  }

  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var manualDate = comms_startOfDay_(opts.refDate || aniv_now_());
  var triggerMode = comms_normalizeText_(comms_getConfigValue_(configRow, headers.triggerMode));
  var forceManual = opts.force === true || triggerMode === 'MANUAL' || triggerMode === 'DATA_MANUAL';
  var bundles = comms_collectBundlesForConfig_(configRow, manualDate, {
    forceManual: forceManual,
    manualRunDate: manualDate
  });
  var rowIssues = comms_validateConfigRecord_(configRow);

  return Object.freeze({
    ok: rowIssues.filter(function(item) { return item.severity === 'ERROR'; }).length === 0,
    communicationCode: String(comms_getConfigValue_(configRow, headers.communicationCode) || '').trim(),
    rowNumber: configRow.__rowNumber || 0,
    triggerMode: String(comms_getConfigValue_(configRow, headers.triggerMode) || '').trim(),
    eventSource: String(comms_getConfigValue_(configRow, headers.eventSource) || '').trim(),
    issues: rowIssues,
    bundles: bundles.map(function(bundle) {
      var contract = comms_buildContract_(configRow, bundle);
      comms_setContractOperationalMetadata_(contract, bundle, {
        isManual: forceManual
      });
      return Object.freeze({
        correlationKey: contract.correlationKey,
        templateKey: contract.templateKey,
        subjectHuman: contract.subjectHuman,
        recipientCount: Number(contract.metadata.recipientCount || 0),
        recipientPreview: contract.metadata.recipientPreview || [],
        plannedDate: bundle.plannedDate || '',
        referenceDate: bundle.referenceDate || '',
        entityType: contract.entityType,
        entityId: contract.entityId,
        payloadSummary: comms_buildPayloadSummary_(configRow, contract, bundle)
      });
    })
  });
}

function comms_processBirthdaysTodayBySource_(source) {
  var today = aniv_startOfDay_(aniv_now_());
  return comms_processConfigRows_(today, function(configRow) {
    var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
    return comms_normalizeText_(comms_getConfigValue_(configRow, headers.eventSource)) === comms_normalizeText_(source) &&
      comms_normalizeText_(comms_getConfigValue_(configRow, headers.triggerMode)) === 'DATA_ORIGEM';
  });
}

function comms_processBirthdaysWeeklyBySource_(source) {
  var today = aniv_startOfDay_(aniv_now_());
  if (today.getDay() !== 1) {
    return Object.freeze({ skipped: true, reason: 'NOT_MONDAY' });
  }
  return comms_processConfigRows_(today, function(configRow) {
    var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
    return comms_normalizeText_(comms_getConfigValue_(configRow, headers.eventSource)) === comms_normalizeText_(source) &&
      comms_normalizeText_(comms_getConfigValue_(configRow, headers.triggerMode)) === 'RESUMO_SEMANAL';
  });
}

function comms_processConfiguredDaily_() {
  var today = aniv_startOfDay_(aniv_now_());
  return comms_processConfigRows_(today, function(configRow) {
    var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
    var source = comms_normalizeEventSource_(comms_getConfigValue_(configRow, headers.eventSource));
    var triggerMode = comms_normalizeText_(comms_getConfigValue_(configRow, headers.triggerMode));
    if (source === 'MEMBERS_ATUAIS' && triggerMode === 'ANIVERSARIO_INTEGRACAO_ANUAL') return true;
    return (source === 'VIGENCIA_SEMESTRES' && triggerMode === 'DATA_ORIGEM') ||
      (source === 'DADOS_OFICIAIS_GEAPA' && triggerMode === 'DATA_ORIGEM') ||
      (source === 'CONFIG' && triggerMode === 'DATA_MANUAL');
  });
}

function comms_processOutboxAndSync_() {
  return Object.freeze({
    ok: true,
    outbox: GEAPA_CORE.coreMailProcessOutbox(),
    logSync: comms_syncLogWithOutbox_()
  });
}
