/**************************************
 * 10_aniv_jobs.gs
 * Jobs/entradas do modulo.
 *
 * Nesta refatoracao, os pontos de entrada antigos foram preservados,
 * mas agora delegam para o motor central de comunicacoes.
 **************************************/

function checkBirthdaysToday(opts) {
  opts = opts || {};
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'checkBirthdaysToday: INICIO');

  return comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.MEMBER_BIRTHDAYS,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.EMAIL,
    {
      executionType: comms_resolveExecutionType_(opts, 'TRIGGER'),
      defaultExecutionType: 'TRIGGER',
      runId: runId
    },
    function(ctx) {
      const lock = LockService.getScriptLock();
      if (!lock.tryLock(15000)) {
        GEAPA_CORE.coreLogWarn(runId, 'Lock nao obtido, evitando execucao concorrente.', {});
        return Object.freeze({ skipped: true, reason: 'LOCK_NOT_OBTAINED' });
      }

      try {
        const result = comms_processBirthdaysTodayBySource_('MEMBERS_ATUAIS', {
          dryRun: ctx.dryRun === true
        });
        GEAPA_CORE.coreLogInfo(runId, 'checkBirthdaysToday: FIM OK', result);
        return result;
      } finally {
        lock.releaseLock();
      }
    }
  );
}

function processMemberBirthdaysToday(opts) {
  return checkBirthdaysToday(opts || {});
}

function checkProfsBirthdaysToday(opts) {
  opts = opts || {};
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'checkProfsBirthdaysToday: INICIO');

  return comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.PROFESSOR_BIRTHDAYS,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.EMAIL,
    {
      executionType: comms_resolveExecutionType_(opts, 'TRIGGER'),
      defaultExecutionType: 'TRIGGER',
      runId: runId
    },
    function(ctx) {
      const lock = LockService.getScriptLock();
      if (!lock.tryLock(15000)) {
        GEAPA_CORE.coreLogWarn(runId, 'Lock nao obtido, evitando execucao concorrente.', {});
        return Object.freeze({ skipped: true, reason: 'LOCK_NOT_OBTAINED' });
      }

      try {
        const result = comms_processBirthdaysTodayBySource_('PROFESSORES', {
          dryRun: ctx.dryRun === true
        });
        GEAPA_CORE.coreLogInfo(runId, 'checkProfsBirthdaysToday: FIM OK', result);
        return result;
      } finally {
        lock.releaseLock();
      }
    }
  );
}

function processProfessorBirthdaysToday(opts) {
  return checkProfsBirthdaysToday(opts || {});
}

function weeklyBirthdayDigest(opts) {
  opts = opts || {};
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'weeklyBirthdayDigest: INICIO');

  return comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.WEEKLY_SUMMARY,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.EMAIL,
    {
      executionType: comms_resolveExecutionType_(opts, 'TRIGGER'),
      defaultExecutionType: 'TRIGGER',
      runId: runId
    },
    function(ctx) {
      const today = aniv_startOfDay_(aniv_now_());
      if (today.getDay() !== 1) {
        GEAPA_CORE.coreLogInfo(runId, 'weeklyBirthdayDigest: ignorado, hoje nao e segunda-feira', {
          today: aniv_formatDate_(today)
        });
        return Object.freeze({ skipped: true, reason: 'NOT_MONDAY' });
      }

      const lock = LockService.getScriptLock();
      if (!lock.tryLock(15000)) {
        GEAPA_CORE.coreLogWarn(runId, 'Lock nao obtido, evitando execucao concorrente.', {});
        return Object.freeze({ skipped: true, reason: 'LOCK_NOT_OBTAINED' });
      }

      try {
        const result = comms_processBirthdaysWeeklyBySource_('MEMBERS_ATUAIS', {
          dryRun: ctx.dryRun === true
        });
        GEAPA_CORE.coreLogInfo(runId, 'weeklyBirthdayDigest: FIM OK', result);
        return result;
      } finally {
        lock.releaseLock();
      }
    }
  );
}

function processMemberBirthdaysWeekly(opts) {
  return weeklyBirthdayDigest(opts || {});
}

function weeklyProfsBirthdayDigest(opts) {
  opts = opts || {};
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'weeklyProfsBirthdayDigest: INICIO');

  return comms_runOperationalFlow_(
    ANIV_CFG.COMUNICACOES.OPERABILITY.FLOWS.WEEKLY_SUMMARY,
    ANIV_CFG.COMUNICACOES.OPERABILITY.CAPABILITIES.EMAIL,
    {
      executionType: comms_resolveExecutionType_(opts, 'TRIGGER'),
      defaultExecutionType: 'TRIGGER',
      runId: runId
    },
    function(ctx) {
      const today = aniv_startOfDay_(aniv_now_());
      if (today.getDay() !== 1) {
        GEAPA_CORE.coreLogInfo(runId, 'weeklyProfsBirthdayDigest: ignorado, hoje nao e segunda-feira', {
          today: aniv_formatDate_(today)
        });
        return Object.freeze({ skipped: true, reason: 'NOT_MONDAY' });
      }

      const lock = LockService.getScriptLock();
      if (!lock.tryLock(15000)) {
        GEAPA_CORE.coreLogWarn(runId, 'Lock nao obtido, evitando execucao concorrente.', {});
        return Object.freeze({ skipped: true, reason: 'LOCK_NOT_OBTAINED' });
      }

      try {
        const result = comms_processBirthdaysWeeklyBySource_('PROFESSORES', {
          dryRun: ctx.dryRun === true
        });
        GEAPA_CORE.coreLogInfo(runId, 'weeklyProfsBirthdayDigest: FIM OK', result);
        return result;
      } finally {
        lock.releaseLock();
      }
    }
  );
}

function processProfessorBirthdaysWeekly(opts) {
  return weeklyProfsBirthdayDigest(opts || {});
}
