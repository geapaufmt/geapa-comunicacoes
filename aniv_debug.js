/**************************************
 * Debugs
 **************************************/

function debugToday() {
  const runId = GEAPA_CORE.coreRunId();
  const today = aniv_now_();
  GEAPA_CORE.coreLogInfo(runId, 'debugToday', {
    now: String(today),
    tz: ANIV_CFG.TZ,
    mmdd: aniv_monthDayKey_(today),
    fmt: aniv_formatDate_(today)
  });
}

function pingEmail() {
  GEAPA_CORE.coreSendEmailText({
    to: Session.getActiveUser().getEmail(),
    subject: 'Ping GEAPA Aniversarios',
    body: 'Ok.'
  });
}

function debugAcademicNoticesToday() {
  Logger.log(JSON.stringify(processAcademicNoticesToday({ executionType: 'MANUAL' }), null, 2));
}

function debugConfiguredCommunicationsToday() {
  Logger.log(JSON.stringify(processConfiguredCommunicationsToday({ executionType: 'MANUAL' }), null, 2));
}

function debugAcademicNoticeConfigs() {
  Logger.log(JSON.stringify(comms_getConfigRecords_(), null, 2));
}

function debugCommunicationsConfigs() {
  Logger.log(JSON.stringify(comms_getConfigRecords_(), null, 2));
}

function applyCommunicationsUxNow() {
  Logger.log(JSON.stringify(applyCommunicationsSheetUx(), null, 2));
}

function reapplyCommunicationsHeaderNotesNow() {
  Logger.log(JSON.stringify(reapplyCommunicationsHeaderNotes(), null, 2));
}

function applyCommunicationsDataValidationNow() {
  Logger.log(JSON.stringify(applyCommunicationsDataValidation(), null, 2));
}

function validateCommunicationsConfigNow() {
  Logger.log(JSON.stringify(validateCommunicationsConfig(), null, 2));
}

function listCommunicationsTriggersNow() {
  Logger.log(JSON.stringify(listCommunicationsTriggers(), null, 2));
}

function validateCommunicationsTriggersNow() {
  Logger.log(JSON.stringify(validateCommunicationsTriggers(), null, 2));
}

function reinstallCommunicationsTriggersNow() {
  Logger.log(JSON.stringify(reinstallCommunicationsTriggers(), null, 2));
}

function checkCommunicationsHealthNow() {
  Logger.log(JSON.stringify(checkCommunicationsHealth(), null, 2));
}

function writeCommunicationsValidationReportNow() {
  Logger.log(JSON.stringify(writeCommunicationsValidationReport(), null, 2));
}

function previewCommunicationByCodeNow(code) {
  Logger.log(JSON.stringify(previewCommunicationByCode(code, {
    force: true,
    executionType: 'MANUAL'
  }), null, 2));
}

function previewFirstManualCommunicationNow() {
  Logger.log(JSON.stringify(previewFirstManualCommunication(), null, 2));
}

function queueAcademicNoticesToday() {
  Logger.log(JSON.stringify(processAcademicNoticesToday({ executionType: 'MANUAL' }), null, 2));
}

function queueConfiguredCommunicationsToday() {
  Logger.log(JSON.stringify(processConfiguredCommunicationsToday({ executionType: 'MANUAL' }), null, 2));
}

function queueScheduledCommunicationsToday() {
  Logger.log(JSON.stringify(processScheduledCommunicationsToday({ executionType: 'MANUAL' }), null, 2));
}

function queueCommunicationByCodeNow(code) {
  Logger.log(JSON.stringify(queueCommunicationByCode(code, { executionType: 'MANUAL' }), null, 2));
}

function resendCommunicationByCodeNow(code) {
  Logger.log(JSON.stringify(queueCommunicationByCode(code, {
    resend: true,
    executionType: 'MANUAL'
  }), null, 2));
}

function queueFirstManualCommunicationToday() {
  var rows = comms_getConfigRecords_();
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;

  for (var i = 0; i < rows.length; i++) {
    if (!comms_parseYesNo_(comms_getConfigValue_(rows[i], headers.active), false)) continue;
    if (!comms_parseYesNo_(comms_getConfigValue_(rows[i], headers.manualEnabled), false)) continue;

    Logger.log(JSON.stringify(queueCommunicationByCode(
      String(comms_getConfigValue_(rows[i], headers.communicationCode) || '').trim(),
      {
        force: true,
        executionType: 'MANUAL'
      }
    ), null, 2));
    return;
  }

  Logger.log(JSON.stringify({
    ok: false,
    reason: 'NO_MANUAL_COMMUNICATION_FOUND'
  }, null, 2));
}

function resendFirstManualCommunicationToday() {
  var rows = comms_getConfigRecords_();
  var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;

  for (var i = 0; i < rows.length; i++) {
    if (!comms_parseYesNo_(comms_getConfigValue_(rows[i], headers.active), false)) continue;
    if (!comms_parseYesNo_(comms_getConfigValue_(rows[i], headers.manualEnabled), false)) continue;
    if (!comms_parseYesNo_(comms_getConfigValue_(rows[i], headers.allowManualResend), false)) continue;

    Logger.log(JSON.stringify(queueCommunicationByCode(
      String(comms_getConfigValue_(rows[i], headers.communicationCode) || '').trim(),
      {
        resend: true,
        executionType: 'MANUAL'
      }
    ), null, 2));
    return;
  }

  Logger.log(JSON.stringify({
    ok: false,
    reason: 'NO_MANUAL_RESEND_COMMUNICATION_FOUND'
  }, null, 2));
}

function queueMemberBirthdaysToday() {
  Logger.log(JSON.stringify(checkBirthdaysToday({ executionType: 'MANUAL' }), null, 2));
}

function queueProfessorBirthdaysToday() {
  Logger.log(JSON.stringify(checkProfsBirthdaysToday({ executionType: 'MANUAL' }), null, 2));
}

function queueMemberBirthdaysWeekly() {
  Logger.log(JSON.stringify(weeklyBirthdayDigest({ executionType: 'MANUAL' }), null, 2));
}

function queueMemberBirthdaysWeeklyForceToday() {
  Logger.log(JSON.stringify(comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.WEEKLY_SUMMARY,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.EMAIL,
    {
      executionType: 'MANUAL',
      defaultExecutionType: 'MANUAL'
    },
    function(ctx) {
      return comms_processConfigRows_(aniv_startOfDay_(aniv_now_()), function(configRow) {
        var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
        return comms_normalizeText_(comms_getConfigValue_(configRow, headers.eventSource)) === 'MEMBERS_ATUAIS' &&
          comms_normalizeText_(comms_getConfigValue_(configRow, headers.triggerMode)) === 'RESUMO_SEMANAL';
      }, {
        dryRun: ctx.dryRun === true
      });
    }
  ), null, 2));
}

function queueProfessorBirthdaysWeekly() {
  Logger.log(JSON.stringify(weeklyProfsBirthdayDigest({ executionType: 'MANUAL' }), null, 2));
}

function queueProfessorBirthdaysWeeklyForceToday() {
  Logger.log(JSON.stringify(comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.WEEKLY_SUMMARY,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.EMAIL,
    {
      executionType: 'MANUAL',
      defaultExecutionType: 'MANUAL'
    },
    function(ctx) {
      return comms_processConfigRows_(aniv_startOfDay_(aniv_now_()), function(configRow) {
        var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
        return comms_normalizeText_(comms_getConfigValue_(configRow, headers.eventSource)) === 'PROFESSORES' &&
          comms_normalizeText_(comms_getConfigValue_(configRow, headers.triggerMode)) === 'RESUMO_SEMANAL';
      }, {
        dryRun: ctx.dryRun === true
      });
    }
  ), null, 2));
}

function queueMemberIntegrationAnniversariesToday() {
  Logger.log(JSON.stringify(comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.SCHEDULED,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.SYNC,
    {
      executionType: 'MANUAL',
      defaultExecutionType: 'MANUAL'
    },
    function(ctx) {
      return comms_processConfigRows_(aniv_startOfDay_(aniv_now_()), function(configRow) {
        var headers = ANIV_CFG.COMUNICACOES.CONFIG_HEADERS;
        return comms_normalizeText_(comms_getConfigValue_(configRow, headers.eventSource)) === 'MEMBERS_ATUAIS' &&
          comms_normalizeText_(comms_getConfigValue_(configRow, headers.triggerMode)) === 'ANIVERSARIO_INTEGRACAO_ANUAL';
      }, {
        dryRun: ctx.dryRun === true
      });
    }
  ), null, 2));
}

function syncAcademicNoticeLog() {
  Logger.log(JSON.stringify(syncCommunicationsLog({ executionType: 'MANUAL' }), null, 2));
}

function syncCommunicationsLogNow() {
  Logger.log(JSON.stringify(syncCommunicationsLog({ executionType: 'MANUAL' }), null, 2));
}

function processAcademicOutboxNow() {
  Logger.log(JSON.stringify(processAcademicNoticeOutbox({ executionType: 'MANUAL' }), null, 2));
}

function processCommunicationsOutboxNow() {
  Logger.log(JSON.stringify(processCommunicationsOutbox({ executionType: 'MANUAL' }), null, 2));
}
