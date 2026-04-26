/**************************************
 * 15_comms_config_validation.gs
 * Validacao operacional da Comunicacoes_Config
 **************************************/

const COMMS_CONFIG_CATALOG = Object.freeze({
  yesNo: Object.freeze(['SIM', 'NAO']),
  flowTypes: Object.freeze(['COMEMORACAO', 'AVISO_ACADEMICO', 'COMUNICADO_GERAL']),
  eventSources: Object.freeze(['MEMBERS_ATUAIS', 'PROFESSORES', 'VIGENCIA_SEMESTRES', 'DADOS_OFICIAIS_GEAPA', 'CONFIG']),
  triggerModes: Object.freeze(['DATA_ORIGEM', 'DATA_MANUAL', 'RESUMO_SEMANAL', 'ANIVERSARIO_INTEGRACAO_ANUAL', 'MANUAL']),
  recipientModes: Object.freeze(['FIXO', 'LISTA_FIXA', 'MEMBERS_ATUAIS', 'PROFESSORES', 'MEMBERS_E_PROFESSORES', 'EMAIL_GROUP', 'EVENT_SOURCE_EMAIL']),
  templateKeys: Object.freeze(['GEAPA_COMEMORATIVO', 'GEAPA_OPERACIONAL', 'GEAPA_CONVITE', 'GEAPA_CLASSICO']),
  priorities: Object.freeze(['BAIXA', 'MEDIA', 'ALTA', 'NORMAL'])
});

function comms_getSupportedPlaceholderCatalog_() {
  return Object.freeze({
    nome: 'Nome principal da pessoa ou entidade do evento.',
    nome_membro: 'Alias de {{nome}} para fluxos de membros.',
    anos_completos: 'Numero de anos completos no marco de integracao.',
    anos_no_grupo: 'Alias numerico de anos completos no grupo.',
    anos_no_grupo_label: 'Texto amigavel como "1 ano" ou "2 anos".',
    data_integracao: 'Data de integracao formatada.',
    data_referencia: 'Data que fundamenta a comunicacao.',
    data_disparo: 'Data prevista de disparo.',
    semestre: 'ID do semestre quando a comunicacao envolve VIGENCIA_SEMESTRES.',
    nome_grupo: 'Nome oficial do grupo em DADOS_OFICIAIS_GEAPA.',
    sigla_grupo: 'Sigla oficial do grupo.',
    email_oficial: 'Email oficial do grupo.',
    codigo_comunicacao: 'Codigo da linha em Comunicacoes_Config.',
    tipo_fluxo: 'Tipo funcional da comunicacao.',
    fonte_evento: 'Fonte de evento configurada na linha.'
  });
}

function comms_getSupportedPlaceholderKeys_() {
  return Object.freeze(Object.keys(comms_getSupportedPlaceholderCatalog_()));
}

function comms_getPlaceholderHelpText_() {
  return 'Placeholders disponiveis neste modulo: ' + comms_getSupportedPlaceholderKeys_().map(function(key) {
    return '{{' + key + '}}';
  }).join(', ') + '.';
}

function comms_getConfigDropdownRules_() {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  return Object.freeze((function() {
    var rules = {};
    rules[headers.active] = {
      values: COMMS_CONFIG_CATALOG.yesNo,
      allowInvalid: false,
      helpText: 'Use SIM para ativar a linha ou NAO para mantela fora do processamento.'
    };
    rules[headers.flowType] = {
      values: COMMS_CONFIG_CATALOG.flowTypes,
      allowInvalid: false,
      helpText: 'Tipos suportados: COMEMORACAO, AVISO_ACADEMICO e COMUNICADO_GERAL.'
    };
    rules[headers.eventSource] = {
      values: COMMS_CONFIG_CATALOG.eventSources,
      allowInvalid: false,
      helpText: 'Fontes suportadas: MEMBERS_ATUAIS, PROFESSORES, VIGENCIA_SEMESTRES, DADOS_OFICIAIS_GEAPA ou CONFIG.'
    };
    rules[headers.triggerMode] = {
      values: COMMS_CONFIG_CATALOG.triggerModes,
      allowInvalid: false,
      helpText: 'Modos suportados: DATA_ORIGEM, DATA_MANUAL, RESUMO_SEMANAL, ANIVERSARIO_INTEGRACAO_ANUAL e MANUAL.'
    };
    rules[headers.useCurrentSemester] = {
      values: COMMS_CONFIG_CATALOG.yesNo,
      allowInvalid: false,
      helpText: 'Use SIM para ignorar o ID_Semestre fixo e resolver o semestre vigente automaticamente.'
    };
    rules[headers.recipientMode] = {
      values: COMMS_CONFIG_CATALOG.recipientModes,
      allowInvalid: false,
      helpText: 'Regras suportadas: FIXO, LISTA_FIXA, MEMBERS_ATUAIS, PROFESSORES, MEMBERS_E_PROFESSORES, EMAIL_GROUP e EVENT_SOURCE_EMAIL.'
    };
    rules[headers.sendAsBcc] = {
      values: COMMS_CONFIG_CATALOG.yesNo,
      allowInvalid: false,
      helpText: 'Use SIM para enviar em CCO quando houver mais de um destinatario.'
    };
    rules[headers.templateKey] = {
      values: COMMS_CONFIG_CATALOG.templateKeys,
      allowInvalid: false,
      helpText: 'Templates institucionais suportados pelo geapa-core.'
    };
    rules[headers.priority] = {
      values: COMMS_CONFIG_CATALOG.priorities,
      allowInvalid: false,
      helpText: 'Prioridade usada pela MAIL_SAIDA.'
    };
    rules[headers.manualEnabled] = {
      values: COMMS_CONFIG_CATALOG.yesNo,
      allowInvalid: false,
      helpText: 'Use SIM para permitir queueCommunicationByCode(...).'
    };
    rules[headers.allowManualResend] = {
      values: COMMS_CONFIG_CATALOG.yesNo,
      allowInvalid: false,
      helpText: 'Use SIM para permitir reenvio manual explicito da mesma comunicacao.'
    };
    rules[headers.useInstitutionalSignature] = {
      values: COMMS_CONFIG_CATALOG.yesNo,
      allowInvalid: false,
      helpText: 'Use SIM para manter a assinatura institucional padrao do renderer do core.'
    };
    return rules;
  })());
}

function comms_extractPlaceholders_(value) {
  var text = String(value || '');
  var matches = text.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [];
  var found = [];

  matches.forEach(function(match) {
    var key = String(match || '').replace(/[{}]/g, '').trim();
    if (key && found.indexOf(key) < 0) {
      found.push(key);
    }
  });

  return found;
}

function comms_getPlaceholderEnabledHeaders_() {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  return Object.freeze([
    headers.description,
    headers.subjectHuman,
    headers.title,
    headers.preheader,
    headers.introText,
    headers.highlightBlock
  ]);
}

function comms_buildConfigIssue_(severity, rowNumber, communicationCode, header, issue, suggestion) {
  return Object.freeze({
    severity: String(severity || 'ERROR').toUpperCase(),
    rowNumber: Number(rowNumber || 0),
    communicationCode: String(communicationCode || '').trim(),
    header: String(header || '').trim(),
    issue: String(issue || '').trim(),
    suggestion: String(suggestion || '').trim()
  });
}

function comms_isBlankConfigRecord_(record) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  return !String(comms_getConfigValue_(record, headers.communicationCode) || '').trim() &&
    !String(comms_getConfigValue_(record, headers.description) || '').trim() &&
    !String(comms_getConfigValue_(record, headers.eventSource) || '').trim() &&
    !String(comms_getConfigValue_(record, headers.subjectHuman) || '').trim();
}

function comms_isAllowedCatalogValue_(value, catalog, allowBlank) {
  var text = String(value || '').trim();
  if (!text) return allowBlank === true;
  return catalog.indexOf(comms_normalizeEventSource_(text)) >= 0 || catalog.indexOf(comms_normalizeText_(text)) >= 0 || catalog.indexOf(text) >= 0;
}

function comms_validatePlaceholderFields_(record, issues) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var allowed = comms_getSupportedPlaceholderKeys_();
  var rowNumber = record.__rowNumber || 0;
  var communicationCode = String(comms_getConfigValue_(record, headers.communicationCode) || '').trim();
  var fields = comms_getPlaceholderEnabledHeaders_();

  fields.forEach(function(headerName) {
    var value = String(comms_getConfigValue_(record, headerName) || '').trim();
    if (!value) return;

    comms_extractPlaceholders_(value).forEach(function(placeholder) {
      if (allowed.indexOf(placeholder) >= 0) return;
      issues.push(comms_buildConfigIssue_(
        'ERROR',
        rowNumber,
        communicationCode,
        headerName,
        'Placeholder nao suportado: {{' + placeholder + '}}.',
        'Use apenas os placeholders documentados nas notas do cabecalho.'
      ));
    });
  });
}

function comms_validateConfigRecord_(record) {
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var issues = [];
  var rowNumber = record.__rowNumber || 0;
  var communicationCode = String(comms_getConfigValue_(record, headers.communicationCode) || '').trim();

  if (comms_isBlankConfigRecord_(record)) return issues;

  var flowType = comms_normalizeText_(comms_getConfigValue_(record, headers.flowType));
  var source = comms_normalizeEventSource_(comms_getConfigValue_(record, headers.eventSource));
  var triggerMode = comms_normalizeText_(comms_getConfigValue_(record, headers.triggerMode));
  var recipientMode = comms_normalizeText_(comms_getConfigValue_(record, headers.recipientMode));
  var templateKey = String(comms_getConfigValue_(record, headers.templateKey) || '').trim();
  var priority = String(comms_getConfigValue_(record, headers.priority) || '').trim();
  var originDateField = String(comms_getConfigValue_(record, headers.originDateField) || '').trim();
  var manualDate = comms_getConfigValue_(record, headers.manualDate);
  var fixedEmail = String(comms_getConfigValue_(record, headers.fixedEmail) || '').trim();
  var fixedEmailList = String(comms_getConfigValue_(record, headers.fixedEmailList) || '').trim();
  var institutionalGroup = String(comms_getConfigValue_(record, headers.institutionalGroup) || '').trim();
  var buttonLabel = String(comms_getConfigValue_(record, headers.buttonLabel) || '').trim();
  var buttonLink = String(comms_getConfigValue_(record, headers.buttonLink) || '').trim();
  var replyTo = String(comms_getConfigValue_(record, headers.replyTo) || '').trim();
  var activeValue = String(comms_getConfigValue_(record, headers.active) || '').trim();

  if (!communicationCode) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, '', headers.communicationCode, 'Codigo Comunicacao vazio.', 'Preencha um identificador unico e estavel para a linha.'));
  }

  if (!comms_isAllowedCatalogValue_(activeValue, COMMS_CONFIG_CATALOG.yesNo, false)) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.active, 'Valor invalido em Ativo.', 'Use apenas SIM ou NAO.'));
  }

  if (!comms_isAllowedCatalogValue_(flowType, COMMS_CONFIG_CATALOG.flowTypes, false)) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.flowType, 'Tipo Fluxo invalido.', 'Use COMEMORACAO, AVISO_ACADEMICO ou COMUNICADO_GERAL.'));
  }

  if (!comms_isAllowedCatalogValue_(source, COMMS_CONFIG_CATALOG.eventSources, false)) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.eventSource, 'Fonte Evento invalida.', 'Use uma das fontes suportadas pelo motor.'));
  }

  if (!comms_isAllowedCatalogValue_(triggerMode, COMMS_CONFIG_CATALOG.triggerModes, false)) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.triggerMode, 'Modo Disparo invalido.', 'Use um dos modos documentados nas notas da planilha.'));
  }

  if (!comms_isAllowedCatalogValue_(recipientMode, COMMS_CONFIG_CATALOG.recipientModes, false)) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.recipientMode, 'Modo Destinatario invalido.', 'Use um dos modos suportados pelo motor.'));
  }

  if (templateKey && !comms_isAllowedCatalogValue_(templateKey, COMMS_CONFIG_CATALOG.templateKeys, true)) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.templateKey, 'Template Key invalido.', 'Use GEAPA_COMEMORATIVO, GEAPA_OPERACIONAL, GEAPA_CONVITE ou GEAPA_CLASSICO.'));
  }

  if (priority && !comms_isAllowedCatalogValue_(priority, COMMS_CONFIG_CATALOG.priorities, true)) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.priority, 'Prioridade invalida.', 'Use BAIXA, MEDIA, ALTA ou NORMAL.'));
  }

  if ((triggerMode === 'DATA_ORIGEM' || triggerMode === 'ANIVERSARIO_INTEGRACAO_ANUAL') && !originDateField) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.originDateField, 'Campo Data Origem obrigatorio para este modo de disparo.', 'Preencha o nome exato da coluna de data da fonte.'));
  }

  if (triggerMode === 'DATA_MANUAL' && !comms_coerceDate_(manualDate)) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.manualDate, 'Data Disparo Manual obrigatoria para DATA_MANUAL.', 'Preencha uma data valida na linha.'));
  }

  if (source === 'CONFIG' && triggerMode !== 'DATA_MANUAL' && triggerMode !== 'MANUAL') {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.triggerMode, 'Fonte CONFIG so suporta DATA_MANUAL ou MANUAL.', 'Troque o modo de disparo ou altere a fonte do evento.'));
  }

  if (source === 'VIGENCIA_SEMESTRES' && triggerMode !== 'DATA_ORIGEM') {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.triggerMode, 'Fonte VIGENCIA_SEMESTRES so suporta DATA_ORIGEM.', 'Use DATA_ORIGEM para eventos de semestre.'));
  }

  if (source === 'DADOS_OFICIAIS_GEAPA' && triggerMode !== 'DATA_ORIGEM') {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.triggerMode, 'Fonte DADOS_OFICIAIS_GEAPA so suporta DATA_ORIGEM.', 'Use DATA_ORIGEM para eventos oficiais do grupo.'));
  }

  if (source === 'PROFESSORES' && triggerMode !== 'DATA_ORIGEM' && triggerMode !== 'RESUMO_SEMANAL') {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.triggerMode, 'Fonte PROFESSORES so suporta DATA_ORIGEM ou RESUMO_SEMANAL.', 'Ajuste o modo de disparo desta linha.'));
  }

  if (source === 'MEMBERS_ATUAIS' && ['DATA_ORIGEM', 'RESUMO_SEMANAL', 'ANIVERSARIO_INTEGRACAO_ANUAL'].indexOf(triggerMode) < 0) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.triggerMode, 'Fonte MEMBERS_ATUAIS nao suporta este modo de disparo.', 'Use DATA_ORIGEM, RESUMO_SEMANAL ou ANIVERSARIO_INTEGRACAO_ANUAL.'));
  }

  if (triggerMode === 'RESUMO_SEMANAL' && ['MEMBERS_ATUAIS', 'PROFESSORES'].indexOf(source) < 0) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.triggerMode, 'RESUMO_SEMANAL so esta implementado para MEMBERS_ATUAIS e PROFESSORES.', 'Troque a fonte ou use outro modo de disparo.'));
  }

  if (triggerMode === 'ANIVERSARIO_INTEGRACAO_ANUAL') {
    if (source !== 'MEMBERS_ATUAIS') {
      issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.eventSource, 'ANIVERSARIO_INTEGRACAO_ANUAL exige Fonte Evento = MEMBERS_ATUAIS.', 'Ajuste a fonte desta configuracao.'));
    }
    if (GEAPA_CORE.coreNormalizeHeader(originDateField) !== GEAPA_CORE.coreNormalizeHeader('DATA_INTEGRACAO')) {
      issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.originDateField, 'ANIVERSARIO_INTEGRACAO_ANUAL exige Campo Data Origem = DATA_INTEGRACAO.', 'Use DATA_INTEGRACAO como fonte de verdade do marco anual.'));
    }
  }

  if (recipientMode === 'FIXO') {
    if (!GEAPA_CORE.coreIsValidEmail(fixedEmail)) {
      issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.fixedEmail, 'Email Fixo invalido para Modo Destinatario = FIXO.', 'Preencha um email valido ou troque o modo de destinatario.'));
    }
  }

  if (recipientMode === 'LISTA_FIXA') {
    if (!comms_parseEmailList_(fixedEmailList).length) {
      issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.fixedEmailList, 'Lista Emails Fixos vazia ou invalida para LISTA_FIXA.', 'Preencha uma lista com emails validos separados por virgula, ponto e virgula ou quebra de linha.'));
    }
  }

  if (recipientMode === 'EMAIL_GROUP' && !institutionalGroup) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.institutionalGroup, 'Grupo Institucional obrigatorio para EMAIL_GROUP.', 'Preencha o grupo institucional que sera resolvido pelo core.'));
  }

  if (recipientMode === 'EVENT_SOURCE_EMAIL' && ['MEMBERS_ATUAIS', 'PROFESSORES', 'DADOS_OFICIAIS_GEAPA'].indexOf(source) < 0) {
    issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headers.recipientMode, 'EVENT_SOURCE_EMAIL exige uma fonte que forneca email por evento.', 'Use MEMBERS_ATUAIS, PROFESSORES ou DADOS_OFICIAIS_GEAPA, ou troque o modo de destinatario.'));
  }

  if (buttonLabel && !buttonLink) {
    issues.push(comms_buildConfigIssue_('WARN', rowNumber, communicationCode, headers.buttonLink, 'Rotulo Botao preenchido sem Link Botao.', 'Preencha a URL do botao ou deixe o rotulo vazio.'));
  }

  if (!buttonLabel && buttonLink) {
    issues.push(comms_buildConfigIssue_('WARN', rowNumber, communicationCode, headers.buttonLabel, 'Link Botao preenchido sem Rotulo Botao.', 'Preencha o texto do botao para aproveitar o CTA.'));
  }

  if (buttonLink && !/^https?:\/\//i.test(buttonLink)) {
    issues.push(comms_buildConfigIssue_('WARN', rowNumber, communicationCode, headers.buttonLink, 'Link Botao nao parece uma URL http(s) valida.', 'Prefira links completos iniciando com http:// ou https://.'));
  }

  if (replyTo && !GEAPA_CORE.coreIsValidEmail(replyTo)) {
    issues.push(comms_buildConfigIssue_('WARN', rowNumber, communicationCode, headers.replyTo, 'Responder Para nao parece um email valido.', 'Ajuste o email de reply-to ou deixe o campo vazio.'));
  }

  [headers.daysBefore, headers.daysAfter, headers.duplicateWindowDays, headers.recipientBatchLimit].forEach(function(headerName) {
    var raw = String(comms_getConfigValue_(record, headerName) || '').trim();
    if (!raw) return;
    if (!/^-?\d+$/.test(raw)) {
      issues.push(comms_buildConfigIssue_('ERROR', rowNumber, communicationCode, headerName, 'Valor numerico invalido.', 'Use apenas numeros inteiros neste campo.'));
    }
  });

  comms_validatePlaceholderFields_(record, issues);
  return issues;
}

function comms_validateCommunicationsConfig_() {
  var rows = comms_getConfigRecords_();
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
  var issues = [];
  var codes = {};
  var processedRows = 0;
  var activeRows = 0;

  rows.forEach(function(row) {
    if (comms_isBlankConfigRecord_(row)) return;
    processedRows++;

    if (comms_parseYesNo_(comms_getConfigValue_(row, headers.active), false)) {
      activeRows++;
    }

    var code = String(comms_getConfigValue_(row, headers.communicationCode) || '').trim();
    if (code) {
      var codeKey = comms_normalizeText_(code);
      if (codes[codeKey]) {
        issues.push(comms_buildConfigIssue_(
          'ERROR',
          row.__rowNumber || 0,
          code,
          headers.communicationCode,
          'Codigo Comunicacao duplicado.',
          'Use um identificador unico para cada linha ativa de configuracao.'
        ));
      } else {
        codes[codeKey] = true;
      }
    }

    issues = issues.concat(comms_validateConfigRecord_(row));
  });

  var errorCount = issues.filter(function(item) { return item.severity === 'ERROR'; }).length;
  var warningCount = issues.filter(function(item) { return item.severity === 'WARN'; }).length;

  return Object.freeze({
    ok: errorCount === 0,
    processedRows: processedRows,
    activeRows: activeRows,
    errorCount: errorCount,
    warningCount: warningCount,
    issues: issues
  });
}

function validateCommunicationsConfig() {
  return comms_validateCommunicationsConfig_();
}
