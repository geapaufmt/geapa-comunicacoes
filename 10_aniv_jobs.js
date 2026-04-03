/**************************************
 * 10_aniv_jobs.gs
 * Jobs/entradas do modulo.
 *
 * Nesta refatoracao, os pontos de entrada antigos foram preservados,
 * mas agora delegam para o motor central de comunicacoes.
 **************************************/

function checkBirthdaysToday() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'checkBirthdaysToday: INICIO');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock nao obtido, evitando execucao concorrente.', {});
    return;
  }

  try {
    const result = comms_processBirthdaysTodayBySource_('MEMBERS_ATUAIS');
    GEAPA_CORE.coreLogInfo(runId, 'checkBirthdaysToday: FIM OK', result);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function processMemberBirthdaysToday() {
  return checkBirthdaysToday();
}

function checkProfsBirthdaysToday() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'checkProfsBirthdaysToday: INICIO');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock nao obtido, evitando execucao concorrente.', {});
    return;
  }

  try {
    const result = comms_processBirthdaysTodayBySource_('PROFESSORES');
    GEAPA_CORE.coreLogInfo(runId, 'checkProfsBirthdaysToday: FIM OK', result);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function processProfessorBirthdaysToday() {
  return checkProfsBirthdaysToday();
}

function weeklyBirthdayDigest() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'weeklyBirthdayDigest: INICIO');

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
    return;
  }

  try {
    const result = comms_processBirthdaysWeeklyBySource_('MEMBERS_ATUAIS');
    GEAPA_CORE.coreLogInfo(runId, 'weeklyBirthdayDigest: FIM OK', result);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function processMemberBirthdaysWeekly() {
  return weeklyBirthdayDigest();
}

function weeklyProfsBirthdayDigest() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'weeklyProfsBirthdayDigest: INICIO');

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
    return;
  }

  try {
    const result = comms_processBirthdaysWeeklyBySource_('PROFESSORES');
    GEAPA_CORE.coreLogInfo(runId, 'weeklyProfsBirthdayDigest: FIM OK', result);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function processProfessorBirthdaysWeekly() {
  return weeklyProfsBirthdayDigest();
}
