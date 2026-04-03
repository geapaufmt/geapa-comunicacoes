/**************************************
 * 16_comms_operability.gs
 * Healthcheck, preview e relatorios operacionais
 **************************************/

function comms_getModuleSpreadsheet_() {
  return comms_getConfigSheet_().getParent();
}

function comms_getOrCreateValidationSheet_() {
  var ss = comms_getModuleSpreadsheet_();
  var name = ANIV_CFG.COMUNICACOES.VALIDATION_SHEET_NAME || 'Comunicacoes_Validacao';
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  return sheet;
}

function comms_buildHealthcheckStatus_(name, ok, details) {
  return Object.freeze({
    name: String(name || '').trim(),
    ok: ok === true,
    details: details || {}
  });
}

function comms_checkRegistryHealth_() {
  var keys = [
    ANIV_CFG.COMUNICACOES.CONFIG_KEY,
    ANIV_CFG.COMUNICACOES.LOG_KEY,
    ANIV_CFG.COMUNICACOES.OUTBOX_KEY,
    ANIV_CFG.MEMBERS.KEY,
    ANIV_CFG.PROFS.KEY,
    ANIV_CFG.COMUNICACOES.SEMESTERS_KEY,
    ANIV_CFG.OFFICIAL_DATA.KEY
  ];
  var statuses = [];

  keys.forEach(function(key) {
    try {
      var ref = GEAPA_CORE.coreGetRegistryRefByKey(key);
      var sheet = GEAPA_CORE.coreGetSheetByKey(key);
      statuses.push(comms_buildHealthcheckStatus_('registry:' + key, true, {
        key: key,
        spreadsheetId: ref && (ref.id || ref.spreadsheetId || ''),
        sheetName: sheet ? sheet.getName() : ''
      }));
    } catch (err) {
      statuses.push(comms_buildHealthcheckStatus_('registry:' + key, false, {
        key: key,
        error: err && err.message ? err.message : String(err || '')
      }));
    }
  });

  return statuses;
}

function comms_checkCoreFunctionHealth_() {
  var required = [
    'coreGetSheetByKey',
    'coreGetRegistryRefByKey',
    'coreReadRecordsByKey',
    'coreMailQueueOutgoing',
    'coreMailProcessOutbox',
    'coreMailRenderEmailTemplate',
    'coreMailBuildOutgoingDraft',
    'coreUniqueEmails',
    'coreGetCurrentEmailsByEmailGroup'
  ];

  return required.map(function(name) {
    return comms_buildHealthcheckStatus_('core:' + name, typeof GEAPA_CORE[name] === 'function', {
      functionName: name
    });
  });
}

function comms_checkValidationSheetHealth_() {
  try {
    var sheet = comms_getOrCreateValidationSheet_();
    return comms_buildHealthcheckStatus_('validation-sheet', true, {
      sheetName: sheet.getName()
    });
  } catch (err) {
    return comms_buildHealthcheckStatus_('validation-sheet', false, {
      error: err && err.message ? err.message : String(err || '')
    });
  }
}

function comms_checkHealth_() {
  var validation = comms_validateCommunicationsConfig_();
  var triggerHealth = comms_validateTriggers_();
  var checks = []
    .concat(comms_checkRegistryHealth_())
    .concat(comms_checkCoreFunctionHealth_())
    .concat([comms_checkValidationSheetHealth_()])
    .concat([
      comms_buildHealthcheckStatus_('config-validation', validation.ok, {
        processedRows: validation.processedRows,
        activeRows: validation.activeRows,
        errorCount: validation.errorCount,
        warningCount: validation.warningCount
      }),
      comms_buildHealthcheckStatus_('triggers', triggerHealth.ok, {
        missingHandlers: triggerHealth.missingHandlers,
        duplicateHandlers: triggerHealth.duplicateHandlers
      })
    ]);

  return Object.freeze({
    ok: checks.every(function(item) { return item.ok === true; }),
    checkedAt: new Date(),
    checks: checks,
    configValidation: validation,
    triggerValidation: triggerHealth
  });
}

function checkCommunicationsHealth() {
  return comms_checkHealth_();
}

function comms_writeValidationReport_() {
  var validation = comms_validateCommunicationsConfig_();
  var sheet = comms_getOrCreateValidationSheet_();
  var header = [['Executado Em', 'Gravidade', 'Linha', 'Codigo Comunicacao', 'Cabecalho', 'Problema', 'Sugestao']];
  var rows = [];
  var now = new Date();

  validation.issues.forEach(function(issue) {
    rows.push([
      now,
      issue.severity,
      issue.rowNumber,
      issue.communicationCode,
      issue.header,
      issue.issue,
      issue.suggestion
    ]);
  });

  if (!rows.length) {
    rows.push([now, 'INFO', '', '', '', 'Nenhum problema encontrado na Comunicacoes_Config.', '']);
  }

  sheet.clear();
  sheet.getRange(1, 1, 1, header[0].length).setValues(header);
  sheet.getRange(2, 1, rows.length, header[0].length).setValues(rows);
  sheet.setFrozenRows(1);

  try {
    if (sheet.getFilter()) {
      sheet.getFilter().remove();
    }
    sheet.getRange(1, 1, Math.max(rows.length + 1, 2), header[0].length).createFilter();
  } catch (err) {}

  return Object.freeze({
    ok: validation.ok,
    sheetName: sheet.getName(),
    rowsWritten: rows.length,
    errorCount: validation.errorCount,
    warningCount: validation.warningCount
  });
}

function writeCommunicationsValidationReport() {
  return comms_writeValidationReport_();
}

function previewCommunicationByCode(code, opts) {
  return comms_previewCommunicationByCode_(code, opts || {});
}

function previewFirstManualCommunication() {
  var rows = comms_getConfigRecords_();
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;

  for (var i = 0; i < rows.length; i++) {
    if (!comms_parseYesNo_(comms_getConfigValue_(rows[i], headers.active), false)) continue;
    if (!comms_parseYesNo_(comms_getConfigValue_(rows[i], headers.manualEnabled), false)) continue;
    return comms_previewCommunicationByCode_(
      String(comms_getConfigValue_(rows[i], headers.communicationCode) || '').trim(),
      { force: true }
    );
  }

  return Object.freeze({
    ok: false,
    reason: 'NO_MANUAL_COMMUNICATION_FOUND'
  });
}
