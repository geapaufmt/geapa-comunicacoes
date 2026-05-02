/**************************************
 * 16_comms_operability.gs
 * Healthcheck, preview e relatorios operacionais
 **************************************/

function comms_getOperabilityConfig_() {
  return ANIV_CFG.COMUNICACOES.OPERABILITY || {};
}

function comms_resolveExecutionType_(opts, defaultType) {
  var raw = opts && opts.executionType ? opts.executionType : defaultType;
  return comms_normalizeText_(raw || 'MANUAL') || 'MANUAL';
}

function comms_isModulesConfigBlockError_(err) {
  var message = err && err.message ? err.message : String(err || '');
  return message.indexOf('GEAPA-CORE: fluxo bloqueado por MODULOS_CONFIG.') === 0;
}

function comms_extractModulesConfigBlockReason_(message) {
  var lines = String(message || '').split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('Motivo: ') === 0) {
      return String(lines[i].substring('Motivo: '.length) || '').trim();
    }
  }
  return String(message || '').trim();
}

function comms_summarizeOperationalResult_(result) {
  if (result == null) return 'sem resultado';
  if (typeof result !== 'object') return String(result);

  var parts = [];
  [
    'matchedConfigs',
    'generatedBundles',
    'queued',
    'simulatedQueues',
    'requeued',
    'duplicates',
    'withoutRecipients',
    'errors',
    'updated',
    'pendingCount'
  ].forEach(function(key) {
    if (typeof result[key] !== 'undefined') {
      parts.push(key + '=' + result[key]);
    }
  });

  if (result.skipped === true) {
    parts.push('skipped=' + String(result.reason || 'SIM'));
  }

  if (result.blockedByConfig === true) {
    parts.push('blockedByConfig=' + String(result.reason || 'SIM'));
  }

  if (result.outbox && typeof result.outbox === 'object') {
    parts.push('outbox=executado');
  }

  if (result.logSync && typeof result.logSync.updated !== 'undefined') {
    parts.push('logSync.updated=' + result.logSync.updated);
  }

  if (!parts.length) {
    parts.push('ok=' + (result.ok === true ? 'SIM' : 'NAO'));
  }

  return parts.join(', ');
}

function comms_getOrCreateModulesStatusSheet_() {
  var cfg = comms_getOperabilityConfig_();
  var ss = SpreadsheetApp.openById(cfg.STATUS_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(cfg.STATUS_SHEET_NAME || 'MODULOS_STATUS');

  if (!sheet) {
    sheet = ss.insertSheet(cfg.STATUS_SHEET_NAME || 'MODULOS_STATUS');
  }

  return sheet;
}

function comms_ensureModulesStatusHeaders_(sheet) {
  var cfg = comms_getOperabilityConfig_();
  var headersCfg = cfg.STATUS_HEADERS || {};
  var requiredHeaders = [];
  Object.keys(headersCfg).forEach(function(key) {
    var header = String(headersCfg[key] || '').trim();
    if (header && requiredHeaders.indexOf(header) < 0) requiredHeaders.push(header);
  });

  if (!requiredHeaders.length) return [];

  var lastColumn = Math.max(sheet.getLastColumn(), 0);
  if (lastColumn < 1) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sheet.setFrozenRows(1);
    return requiredHeaders;
  }

  var existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(item) {
    return String(item || '').trim();
  });
  var missing = requiredHeaders.filter(function(header) {
    return existingHeaders.indexOf(header) < 0;
  });

  if (missing.length) {
    sheet.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]);
    existingHeaders = existingHeaders.concat(missing);
  }

  sheet.setFrozenRows(1);
  return existingHeaders;
}

function comms_findModulesStatusRowNumber_(sheet, moduleName, flowName) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return 0;

  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var moduleIndex = aniv_findHeaderIndex_(headers, 'MODULO', true);
  var flowIndex = aniv_findHeaderIndex_(headers, 'FLUXO', true);
  if (moduleIndex < 0 || flowIndex < 0) return 0;

  var rows = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  var targetModule = comms_normalizeText_(moduleName);
  var targetFlow = comms_normalizeText_(flowName);

  for (var i = 0; i < rows.length; i++) {
    if (comms_normalizeText_(rows[i][moduleIndex]) !== targetModule) continue;
    if (comms_normalizeText_(rows[i][flowIndex]) !== targetFlow) continue;
    return i + 2;
  }

  return 0;
}

function comms_tryWriteModulesStatus_(flowName, payload) {
  var cfg = comms_getOperabilityConfig_();
  var headersCfg = cfg.STATUS_HEADERS || {};

  try {
    var sheet = comms_getOrCreateModulesStatusSheet_();
    comms_ensureModulesStatusHeaders_(sheet);
    var rowNumber = comms_findModulesStatusRowNumber_(sheet, cfg.MODULE_NAME, flowName);
    if (!rowNumber) rowNumber = Math.max(sheet.getLastRow() + 1, 2);

    var headerMap = GEAPA_CORE.coreHeaderMap(sheet, 1);
    var fullPayload = Object.assign({}, payload || {});
    fullPayload[headersCfg.moduleName] = cfg.MODULE_NAME;
    fullPayload[headersCfg.flowName] = flowName;
    fullPayload[headersCfg.updatedAt] = new Date();

    Object.keys(fullPayload).forEach(function(headerName) {
      GEAPA_CORE.coreWriteCellByHeader(sheet, rowNumber, headerMap, headerName, fullPayload[headerName], {
        normalize: true,
        oneBased: true
      });
    });
  } catch (err) {
    GEAPA_CORE.coreLogWarn(
      GEAPA_CORE.coreRunId(),
      'MODULOS_STATUS: falha ao registrar status operacional',
      {
        flowName: flowName,
        error: err && err.message ? err.message : String(err || '')
      }
    );
  }
}

function comms_buildOperationalStatusPayload_(ctx) {
  var headers = comms_getOperabilityConfig_().STATUS_HEADERS || {};
  var config = ctx && ctx.config ? ctx.config : {};
  var payload = {};

  payload[headers.lastMode] = String(ctx && ctx.mode || config.mode || '').trim();
  payload[headers.lastCapability] = String(ctx && ctx.capability || '').trim();
  payload[headers.lastExecutionType] = String(ctx && ctx.executionType || '').trim();
  payload[headers.lastConfigLine] = config && config.lineNo ? config.lineNo : '';
  payload[headers.lastFallbackType] = String(config && config.fallbackType || '').trim();
  return payload;
}

function comms_recordOperationalBlock_(ctx, reason) {
  var headers = comms_getOperabilityConfig_().STATUS_HEADERS || {};
  var payload = comms_buildOperationalStatusPayload_(ctx);
  payload[headers.lastBlockedAt] = new Date();
  payload[headers.lastBlockedReason] = String(reason || '').trim();
  comms_tryWriteModulesStatus_(ctx.flowName, payload);
}

function comms_recordOperationalDryRun_(ctx, result) {
  var headers = comms_getOperabilityConfig_().STATUS_HEADERS || {};
  var payload = comms_buildOperationalStatusPayload_(ctx);
  payload[headers.lastDryRunAt] = new Date();
  payload[headers.lastDryRunSummary] = comms_summarizeOperationalResult_(result);
  comms_tryWriteModulesStatus_(ctx.flowName, payload);
}

function comms_recordOperationalSuccess_(ctx, result) {
  var headers = comms_getOperabilityConfig_().STATUS_HEADERS || {};
  var payload = comms_buildOperationalStatusPayload_(ctx);
  payload[headers.lastSuccessAt] = new Date();
  payload[headers.lastSuccessSummary] = comms_summarizeOperationalResult_(result);
  comms_tryWriteModulesStatus_(ctx.flowName, payload);
}

function comms_recordOperationalError_(ctx, err) {
  var headers = comms_getOperabilityConfig_().STATUS_HEADERS || {};
  var payload = comms_buildOperationalStatusPayload_(ctx);
  payload[headers.lastErrorAt] = new Date();
  payload[headers.lastError] = err && err.message ? err.message : String(err || '');
  comms_tryWriteModulesStatus_(ctx.flowName, payload);
}

function comms_runOperationalFlow_(flowName, capability, opts, runner) {
  opts = opts || {};

  var operability = comms_getOperabilityConfig_();
  var executionType = comms_resolveExecutionType_(opts, opts.defaultExecutionType || 'MANUAL');
  var runId = opts.runId || GEAPA_CORE.coreRunId();
  var config = null;

  try {
    config = GEAPA_CORE.coreGetModuleConfig(operability.MODULE_NAME, flowName, {});
    var decision = GEAPA_CORE.coreAssertModuleExecutionAllowed(
      operability.MODULE_NAME,
      flowName,
      capability,
      { executionType: executionType }
    );

    var ctx = {
      flowName: flowName,
      capability: capability,
      executionType: executionType,
      runId: runId,
      config: decision.config || config,
      mode: decision.config && decision.config.mode ? decision.config.mode : (config && config.mode ? config.mode : ''),
      dryRun: decision.dryRun === true
    };

    var result = runner(ctx);
    if (ctx.dryRun) comms_recordOperationalDryRun_(ctx, result);
    else comms_recordOperationalSuccess_(ctx, result);
    return result;
  } catch (err) {
    var blockCtx = {
      flowName: flowName,
      capability: capability,
      executionType: executionType,
      runId: runId,
      config: config,
      mode: config && config.mode ? config.mode : ''
    };

    if (comms_isModulesConfigBlockError_(err)) {
      var reason = comms_extractModulesConfigBlockReason_(err && err.message ? err.message : String(err || ''));
      GEAPA_CORE.coreLogWarn(runId, 'Fluxo bloqueado por MODULOS_CONFIG', {
        moduleName: operability.MODULE_NAME,
        flowName: flowName,
        capability: capability,
        executionType: executionType,
        reason: reason,
        mode: blockCtx.mode
      });
      comms_recordOperationalBlock_(blockCtx, reason);
      return Object.freeze({
        ok: true,
        skipped: true,
        blockedByConfig: true,
        flowName: flowName,
        capability: capability,
        executionType: executionType,
        mode: blockCtx.mode,
        reason: reason
      });
    }

    comms_recordOperationalError_(blockCtx, err);
    throw err;
  }
}

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
    'coreGetModuleConfig',
    'coreAssertModuleExecutionAllowed',
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

function comms_checkModulesStatusHealth_() {
  try {
    var sheet = comms_getOrCreateModulesStatusSheet_();
    comms_ensureModulesStatusHeaders_(sheet);
    return comms_buildHealthcheckStatus_('modules-status-sheet', true, {
      sheetName: sheet.getName()
    });
  } catch (err) {
    return comms_buildHealthcheckStatus_('modules-status-sheet', false, {
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
    .concat([comms_checkModulesStatusHealth_()])
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
  opts = opts || {};
  return comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.MANUALS,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.EMAIL,
    {
      executionType: comms_resolveExecutionType_(opts, 'MANUAL'),
      defaultExecutionType: 'MANUAL'
    },
    function() {
      return comms_previewCommunicationByCode_(code, opts || {});
    }
  );
}

function previewFirstManualCommunication() {
  return comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.MANUALS,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.EMAIL,
    {
      executionType: 'MANUAL',
      defaultExecutionType: 'MANUAL'
    },
    function() {
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
  );
}
