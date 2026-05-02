/**
 * Compatibilidade temporaria do fluxo antigo de avisos academicos.
 *
 * O modulo agora usa Comunicacoes_Config/Comunicacoes_Log como estrutura
 * principal. Estas funcoes permanecem como wrappers para evitar quebra
 * de menus, testes manuais e triggers antigos durante a migracao.
 */

function processAcademicNoticesToday(opts) {
  opts = opts || {};
  return comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.SCHEDULED,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.SYNC,
    {
      executionType: comms_resolveExecutionType_(opts, 'TRIGGER'),
      defaultExecutionType: 'TRIGGER'
    },
    function(ctx) {
      return comms_processConfiguredDaily_({
        dryRun: ctx.dryRun === true
      });
    }
  );
}

function processConfiguredCommunicationsToday(opts) {
  return processAcademicNoticesToday(opts || {});
}

function processScheduledCommunicationsToday(opts) {
  return processAcademicNoticesToday(opts || {});
}

function runScheduledCommunicationsToday(opts) {
  return processScheduledCommunicationsToday(opts || {});
}

function processDailyCommunications(opts) {
  return processScheduledCommunicationsToday(opts || {});
}

function processAcademicNoticeOutbox(opts) {
  opts = opts || {};
  return comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.OUTBOX,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.EMAIL,
    {
      executionType: comms_resolveExecutionType_(opts, 'TRIGGER'),
      defaultExecutionType: 'TRIGGER'
    },
    function(ctx) {
      return comms_processOutboxAndSync_({
        dryRun: ctx.dryRun === true
      });
    }
  );
}

function processCommunicationsOutbox(opts) {
  return processAcademicNoticeOutbox(opts || {});
}

function runCommunicationsOutbox(opts) {
  return processCommunicationsOutbox(opts || {});
}

function syncCommunicationsOperationalLog(opts) {
  return syncCommunicationsLog(opts || {});
}

function queueCommunicationByCode(code, opts) {
  opts = opts || {};
  return comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.MANUALS,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.EMAIL,
    {
      executionType: comms_resolveExecutionType_(opts, 'MANUAL'),
      defaultExecutionType: 'MANUAL'
    },
    function(ctx) {
      var queueOpts = Object.assign({}, opts, {
        dryRun: ctx.dryRun === true
      });
      return comms_queueCommunicationByCode_(code, queueOpts);
    }
  );
}

function aniv_syncAcademicNoticeLog_() {
  return syncCommunicationsLog({ executionType: 'MANUAL' });
}

function syncCommunicationsLog(opts) {
  opts = opts || {};
  return comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.OUTBOX,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.SYNC,
    {
      executionType: comms_resolveExecutionType_(opts, 'MANUAL'),
      defaultExecutionType: 'MANUAL'
    },
    function(ctx) {
      if (ctx.dryRun === true) {
        return Object.freeze({
          ok: true,
          dryRun: true,
          skipped: true,
          reason: 'DRY_RUN'
        });
      }
      return comms_syncLogWithOutbox_();
    }
  );
}
