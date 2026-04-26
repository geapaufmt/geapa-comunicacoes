/**************************************
 * 14_comms_sheet_ux.gs
 * UX operacional das abas do modulo
 **************************************/

const COMMS_SHEET_UX = Object.freeze({
  colors: Object.freeze({
    identity: '#d9ead3',
    event: '#d0e0e3',
    routing: '#fff2cc',
    content: '#fce5cd',
    control: '#ead1dc',
    operational: '#d9d2e9',
    neutralText: '#202124'
  }),
  configNotes: Object.freeze({
    'Ativo': 'Define se esta configuracao entra no processamento. Valores esperados: SIM ou NAO.',
    'Tipo Fluxo': 'Categoria funcional da comunicacao. Use COMEMORACAO, AVISO_ACADEMICO ou COMUNICADO_GERAL.',
    'Codigo Comunicacao': 'Identificador unico e estavel da comunicacao. Ex.: ANIV_MEM_DIA_PESSOA.',
    'Descricao': 'Resumo humano da finalidade da linha para facilitar manutencao futura.',
    'Fonte Evento': 'Origem dos dados que disparam a comunicacao. Use MEMBERS_ATUAIS, PROFESSORES, VIGENCIA_SEMESTRES, DADOS_OFICIAIS_GEAPA ou CONFIG.',
    'Modo Disparo': 'Define quando a comunicacao e gerada. Use DATA_ORIGEM, DATA_MANUAL, RESUMO_SEMANAL, ANIVERSARIO_INTEGRACAO_ANUAL ou MANUAL.',
    'Campo Data Origem': 'Nome exato da coluna da fonte que contem a data de referencia. Ex.: Início Matrículas Online, DATA_OFICIAL_CRIACAO ou DATA_INTEGRACAO.',
    'ID_Semestre': 'Semestre fixo a usar quando nao for o vigente. Ex.: 2026/1.',
    'Usar Semestre Vigente': 'Se SIM, ignora ID_Semestre e usa o semestre vigente calculado pelo core.',
    'Data Disparo Manual': 'Data fixa de disparo para modos DATA_MANUAL ou execucoes manuais. Ex.: 31/03/2026.',
    'Modo Destinatario': 'Regra de resolucao dos destinatarios. Use FIXO, LISTA_FIXA, MEMBERS_ATUAIS, PROFESSORES, MEMBERS_E_PROFESSORES, EMAIL_GROUP ou EVENT_SOURCE_EMAIL.',
    'Email Fixo': 'Email unico usado quando Modo Destinatario = FIXO. Ex.: comunicacao@exemplo.com.',
    'Lista Emails Fixos': 'Lista separada por virgula, ponto e virgula ou quebra de linha. Usada em LISTA_FIXA.',
    'Grupo Institucional': 'Nome do grupo institucional resolvido pelo core quando Modo Destinatario = EMAIL_GROUP.',
    'Enviar Em Cco': 'Se SIM, envia destinatarios em CCO quando houver mais de um email.',
    'Template Key': 'Template visual institucional do core. Use GEAPA_OPERACIONAL, GEAPA_COMEMORATIVO, GEAPA_CONVITE ou GEAPA_CLASSICO.',
    'Assunto Humano': 'Assunto legivel antes do prefixo tecnico [GEAPA][CHAVE]. Aceita placeholders. Ex.: Parabens pelos seus {{anos_no_grupo_label}} no GEAPA.',
    'Titulo Email': 'Titulo principal exibido no corpo do email. Aceita placeholders dinamicos.',
    'Preheader': 'Texto curto mostrado como resumo no cliente de email e no topo do template. Aceita placeholders quando houver contexto dinamico.',
    'Intro Texto': 'Paragrafo inicial do conteudo da comunicacao. Aceita placeholders dinamicos.',
    'Bloco Destaque': 'Texto opcional para caixa de destaque visual. Se vazio, o bloco some. Aceita placeholders dinamicos.',
    'Rotulo Botao': 'Texto do botao de acao. Ex.: Saiba mais.',
    'Link Botao': 'URL completa do botao. Ex.: https://exemplo.com/aviso.',
    'Dias Antecedencia': 'Dias a subtrair da data de referencia para disparar antes do evento. Ex.: 2.',
    'Dias Posterioridade': 'Dias a somar a data de referencia para disparar depois do evento. Ex.: 1.',
    'Prioridade': 'Prioridade da fila central. Ex.: BAIXA, MEDIA, ALTA ou NORMAL.',
    'Observacoes': 'Campo livre para contexto operacional, anotacoes de uso ou lembretes.',
    'Ativa Manualmente': 'Se SIM, permite disparo manual pela funcao queueCommunicationByCode(...).',
    'Permite Reenvio Manual': 'Se SIM, permite reenvio manual explicito da mesma comunicacao.',
    'Janela Duplicidade Dias': 'Bloqueia nova fila de comunicacoes equivalentes dentro dessa janela. Ex.: 7.',
    'Limite Destinatarios Por Lote': 'Opcional. Se preenchido, limita a quantidade de emails enviados por lote.',
    'Responder Para': 'Reply-to tecnico do envio. Ex.: geapa@ufmt.br.',
    'Usar Assinatura Institucional': 'Se SIM, mantem assinatura institucional padrao do core.',
    'Categoria Comunicacao': 'Classificacao livre para filtros e organizacao. Ex.: ANIVERSARIO, ACADEMICO.',
    'Tags': 'Marcadores separados por virgula para filtros e auditoria. Ex.: MEMBROS, SEMESTRE.',
    'Anexo 1': 'ID ou link do Drive para o primeiro anexo opcional.',
    'Anexo 2': 'ID ou link do Drive para o segundo anexo opcional.',
    'Anexo 3': 'ID ou link do Drive para o terceiro anexo opcional.'
  }),
  logNotes: Object.freeze({
    'Id Comunicacao': 'Identificador local da linha de log no modulo.',
    'Chave de Correlacao': 'Chave tecnica usada no assunto e na rastreabilidade. Ex.: COM-2026-1-MAT-ABERTURA.',
    'Tipo Fluxo': 'Tipo funcional registrado na execucao. Ex.: AVISO_ACADEMICO.',
    'Codigo Comunicacao': 'Codigo da configuracao que originou o disparo.',
    'ID_Semestre': 'Semestre associado quando aplicavel. Ex.: 2026/1.',
    'Data Referencia': 'Data que fundamentou a comunicacao, como aniversario ou marco academico.',
    'Data Disparo Prevista': 'Data em que a comunicacao deveria ser enfileirada ou enviada.',
    'Enviado Em': 'Momento em que a MAIL_SAIDA concluiu o envio tecnico.',
    'Status': 'Estado atual da comunicacao. Ex.: PENDENTE, ENVIADO ou ERRO.',
    'Modulo Dono': 'Modulo responsavel por esta comunicacao. Ex.: COMEMORACOES.',
    'Assunto Final': 'Assunto final ja montado com prefixo [GEAPA][CHAVE].',
    'Id Saida Central': 'Identificador da linha correspondente na MAIL_SAIDA.',
    'Id Thread Gmail': 'Thread do Gmail criada ou reutilizada no envio.',
    'Id Mensagem Gmail': 'Identificador da mensagem enviada no Gmail.',
    'Observacoes': 'Campo tecnico do log com detalhes extras da execucao, duplicidade ou metadata.',
    'Criado Em': 'Momento em que a linha de log foi criada.',
    'Atualizado Em': 'Momento da ultima atualizacao da linha de log.',
    'Ultimo Erro': 'Ultimo erro registrado para facilitar diagnostico operacional.',
    'Quantidade Destinatarios': 'Quantidade de emails resolvidos para o envio desta linha.',
    'Modo Destinatario Resolvido': 'Modo efetivamente usado na resolucao dos destinatarios.',
    'Template Usado': 'Template institucional usado no envio. Ex.: GEAPA_OPERACIONAL ou GEAPA_CLASSICO.',
    'Data Enfileiramento': 'Momento em que a comunicacao entrou na MAIL_SAIDA.',
    'Data Processamento': 'Momento em que a fila tentou processar ou concluiu o envio.',
    'Tentativas Envio': 'Numero de tentativas de envio tecnico na outbox central.',
    'Foi Reenvio': 'Indica se a linha nasceu de um reenvio manual. Valores: SIM ou NAO.',
    'Tags': 'Tags herdadas da configuracao para filtros e auditoria.',
    'Payload Resumo': 'Resumo serializado do conteudo enviado, util para auditoria rapida.'
  }),
  configGroups: Object.freeze([
    Object.freeze({ color: '#d9ead3', headers: ['Ativo', 'Tipo Fluxo', 'Codigo Comunicacao', 'Descricao'] }),
    Object.freeze({ color: '#d0e0e3', headers: ['Fonte Evento', 'Modo Disparo', 'Campo Data Origem', 'ID_Semestre', 'Usar Semestre Vigente', 'Data Disparo Manual', 'Dias Antecedencia', 'Dias Posterioridade'] }),
    Object.freeze({ color: '#fff2cc', headers: ['Modo Destinatario', 'Email Fixo', 'Lista Emails Fixos', 'Grupo Institucional', 'Enviar Em Cco', 'Limite Destinatarios Por Lote', 'Responder Para'] }),
    Object.freeze({ color: '#fce5cd', headers: ['Template Key', 'Assunto Humano', 'Titulo Email', 'Preheader', 'Intro Texto', 'Bloco Destaque', 'Rotulo Botao', 'Link Botao', 'Usar Assinatura Institucional', 'Anexo 1', 'Anexo 2', 'Anexo 3'] }),
    Object.freeze({ color: '#ead1dc', headers: ['Prioridade', 'Ativa Manualmente', 'Permite Reenvio Manual', 'Janela Duplicidade Dias', 'Categoria Comunicacao', 'Tags', 'Observacoes'] })
  ]),
  logGroups: Object.freeze([
    Object.freeze({ color: '#d9ead3', headers: ['Id Comunicacao', 'Chave de Correlacao', 'Tipo Fluxo', 'Codigo Comunicacao', 'ID_Semestre'] }),
    Object.freeze({ color: '#d0e0e3', headers: ['Data Referencia', 'Data Disparo Prevista', 'Enviado Em', 'Criado Em', 'Atualizado Em', 'Data Enfileiramento', 'Data Processamento'] }),
    Object.freeze({ color: '#fff2cc', headers: ['Status', 'Modulo Dono', 'Assunto Final', 'Template Usado'] }),
    Object.freeze({ color: '#ead1dc', headers: ['Id Saida Central', 'Id Thread Gmail', 'Id Mensagem Gmail', 'Tentativas Envio', 'Ultimo Erro', 'Foi Reenvio'] }),
    Object.freeze({ color: '#fce5cd', headers: ['Quantidade Destinatarios', 'Modo Destinatario Resolvido', 'Tags', 'Payload Resumo', 'Observacoes'] })
  ])
});

function applyCommunicationsSheetUx() {
  return comms_applySheetUx_();
}

function reapplyCommunicationsSheetUx() {
  return comms_applySheetUx_();
}

function applyCommunicationsConfigSheetUx() {
  return comms_applyConfigSheetUx_();
}

function applyCommunicationsLogSheetUx() {
  return comms_applyLogSheetUx_();
}

function applyCommunicationsDataValidation() {
  return comms_applyConfigDataValidation_();
}

function reapplyCommunicationsDataValidation() {
  return comms_applyConfigDataValidation_();
}

function reapplyCommunicationsHeaderNotes() {
  var configResult = comms_applyHeaderNotesBySheet_(
    aniv_getSheetByKey_(ANIV_CFG.COMUNICACOES.CONFIG_KEY),
    COMMS_SHEET_UX.configNotes
  );
  var logResult = comms_applyHeaderNotesBySheet_(
    aniv_getSheetByKey_(ANIV_CFG.COMUNICACOES.LOG_KEY),
    COMMS_SHEET_UX.logNotes
  );

  return Object.freeze({
    ok: true,
    config: configResult,
    log: logResult
  });
}

function comms_applySheetUx_() {
  return Object.freeze({
    ok: true,
    config: comms_applyConfigSheetUx_(),
    log: comms_applyLogSheetUx_()
  });
}

function comms_applyConfigSheetUx_() {
  var sheet = aniv_getSheetByKey_(ANIV_CFG.COMUNICACOES.CONFIG_KEY);
  var presentation = comms_applySheetPresentation_(sheet, COMMS_SHEET_UX.configNotes, COMMS_SHEET_UX.configGroups);
  return Object.freeze({
    ok: true,
    sheetName: presentation.sheetName,
    lastColumn: presentation.lastColumn,
    lastRow: presentation.lastRow,
    dataValidation: comms_applyConfigDataValidation_()
  });
}

function comms_applyLogSheetUx_() {
  var sheet = aniv_getSheetByKey_(ANIV_CFG.COMUNICACOES.LOG_KEY);
  return comms_applySheetPresentation_(sheet, COMMS_SHEET_UX.logNotes, COMMS_SHEET_UX.logGroups);
}

function comms_applySheetPresentation_(sheet, notesMap, colorGroups) {
  if (!sheet) {
    throw new Error('comms_applySheetPresentation_: sheet ausente.');
  }
  try {
    var lastColumn = Math.max(sheet.getLastColumn(), 1);
    var lastRow = Math.max(sheet.getLastRow(), 1);
    var operations = [];

    operations.push(comms_trySheetUxOperation_(sheet, 'freezeHeaderRow', function() {
      if (typeof GEAPA_CORE.coreFreezeHeaderRow === 'function') {
        GEAPA_CORE.coreFreezeHeaderRow(sheet, 1);
      } else {
        sheet.setFrozenRows(1);
      }
    }));

    operations.push(comms_trySheetUxOperation_(sheet, 'headerNotes', function() {
      comms_applyHeaderNotesBySheet_(sheet, notesMap);
    }));

    operations.push(comms_trySheetUxOperation_(sheet, 'headerStyles', function() {
      comms_applyHeaderStyles_(sheet, colorGroups || []);
    }));

    operations.push(comms_trySheetUxOperation_(sheet, 'filter', function() {
      if (typeof GEAPA_CORE.coreEnsureFilter === 'function') {
        GEAPA_CORE.coreEnsureFilter(sheet, 1, {});
      } else {
        comms_ensureFilter_(sheet, lastRow, lastColumn);
      }
    }));

    return Object.freeze({
      ok: true,
      sheetName: sheet.getName(),
      lastColumn: lastColumn,
      lastRow: lastRow,
      operations: Object.freeze(operations)
    });
  } catch (err) {
    if (!comms_isTypedColumnsRestrictionError_(err)) {
      throw err;
    }

    return Object.freeze({
      ok: true,
      sheetName: sheet.getName(),
      typedColumnsSafeMode: true,
      operations: Object.freeze([
        Object.freeze({
          operation: 'sheetPresentation',
          status: 'SKIPPED_TYPED_COLUMNS',
          reason: err && err.message ? err.message : String(err || 'Operacao nao permitida em colunas com tipo.')
        })
      ])
    });
  }
}

function comms_applyHeaderNotesBySheet_(sheet, notesMap) {
  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  var headerValues = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var resolvedNotes = {};

  for (var i = 0; i < headerValues.length; i++) {
    var header = String(headerValues[i] || '').trim();
    if (!header) continue;
    resolvedNotes[header] = comms_buildHeaderNote_(header, notesMap);
  }

  if (typeof GEAPA_CORE.coreApplyHeaderNotes === 'function') {
    GEAPA_CORE.coreApplyHeaderNotes(sheet, resolvedNotes, 1);
  } else {
    var noteRow = [];
    for (var j = 0; j < headerValues.length; j++) {
      noteRow.push(resolvedNotes[String(headerValues[j] || '').trim()] || '');
    }
    sheet.getRange(1, 1, 1, lastColumn).setNotes([noteRow]);
  }

  return Object.freeze({
    ok: true,
    sheetName: sheet.getName(),
    notesApplied: headerValues.filter(function(item) { return !!String(item || '').trim(); }).length
  });
}

function comms_buildHeaderNote_(header, notesMap) {
  var baseNote = String(notesMap[header] || '').trim();
  if (!baseNote) return '';

  if (comms_headerSupportsPlaceholders_(header)) {
    return baseNote + '\n\n' + comms_getPlaceholderHelpText_();
  }

  return baseNote;
}

function comms_headerSupportsPlaceholders_(header) {
  return [
    'Assunto Humano',
    'Titulo Email',
    'Preheader',
    'Intro Texto',
    'Bloco Destaque',
    'Descricao'
  ].indexOf(String(header || '').trim()) >= 0;
}

function comms_applyHeaderStyles_(sheet, colorGroups) {
  if (typeof GEAPA_CORE.coreApplyHeaderColors === 'function') {
    GEAPA_CORE.coreApplyHeaderColors(sheet, colorGroups, 1, {
      defaultColor: '#f3f3f3',
      fontColor: COMMS_SHEET_UX.colors.neutralText,
      fontWeight: 'bold',
      wrap: true
    });
    return;
  }

  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  var headerRange = sheet.getRange(1, 1, 1, lastColumn);
  var headerValues = headerRange.getValues()[0];
  var backgrounds = [];

  for (var i = 0; i < headerValues.length; i++) {
    backgrounds.push(comms_getHeaderGroupColor_(String(headerValues[i] || '').trim(), colorGroups));
  }

  headerRange
    .setBackgrounds([backgrounds])
    .setFontWeight('bold')
    .setFontColor(COMMS_SHEET_UX.colors.neutralText)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
}

function comms_getHeaderGroupColor_(header, colorGroups) {
  for (var i = 0; i < colorGroups.length; i++) {
    if (colorGroups[i].headers.indexOf(header) >= 0) return colorGroups[i].color;
  }

  return '#f3f3f3';
}

function comms_ensureFilter_(sheet, lastRow, lastColumn) {
  var existingFilter = sheet.getFilter();
  if (existingFilter) return;
  sheet.getRange(1, 1, Math.max(lastRow, 2), lastColumn).createFilter();
}

function comms_applyConfigDataValidation_() {
  var sheet = aniv_getSheetByKey_(ANIV_CFG.COMUNICACOES.CONFIG_KEY);
  var operation = comms_trySheetUxOperation_(sheet, 'dataValidation', function() {
    var applied = 0;

    if (typeof GEAPA_CORE.coreApplyDropdownValidationByHeader === 'function') {
      applied = GEAPA_CORE.coreApplyDropdownValidationByHeader(sheet, comms_getConfigDropdownRules_(), 1, {});
    } else {
      var rules = comms_getConfigDropdownRules_();
      var headerMap = GEAPA_CORE.coreHeaderMap(sheet, 1);
      var lastRow = Math.max(sheet.getMaxRows(), 2);
      Object.keys(rules).forEach(function(header) {
        var col = GEAPA_CORE.coreGetCol(headerMap, header);
        if (!col) return;
        var rule = rules[header] || {};
        if (!rule.values || !rule.values.length) return;
        var builder = SpreadsheetApp.newDataValidation()
          .requireValueInList(rule.values, true)
          .setAllowInvalid(rule.allowInvalid !== false);
        if (rule.helpText) builder.setHelpText(rule.helpText);
        sheet.getRange(2, col, Math.max(lastRow - 1, 1), 1).setDataValidation(builder.build());
        applied++;
      });
    }

    return {
      rulesApplied: applied
    };
  });

  return Object.freeze(Object.assign({
    ok: true,
    sheetName: sheet.getName()
  }, operation));
}

function comms_trySheetUxOperation_(sheet, operationName, fn) {
  try {
    var details = fn() || {};
    return Object.freeze(Object.assign({
      operation: operationName,
      status: 'APPLIED'
    }, details));
  } catch (err) {
    if (!comms_isTypedColumnsRestrictionError_(err)) {
      throw err;
    }

    return Object.freeze({
      operation: operationName,
      status: 'SKIPPED_TYPED_COLUMNS',
      reason: err && err.message ? err.message : String(err || 'Operacao nao permitida em colunas com tipo.')
    });
  }
}

function comms_isTypedColumnsRestrictionError_(err) {
  var message = String(err && err.message ? err.message : err || '');
  return message.indexOf('colunas com tipo') >= 0 ||
    message.indexOf('columns with type') >= 0;
}
