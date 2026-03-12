/**************************************
 * 10_aniv_jobs.gs
 * JOBS/ENTRADAS (funções chamadas por triggers)
 *
 * Ideia:
 * - Cada job é pequeno e só orquestra:
 *   1) calcula datas
 *   2) lê linhas
 *   3) chama envio
 *   4) registra logs
 **************************************/

/**
 * ------------------------------------------------------------
 * checkBirthdaysToday()
 * ------------------------------------------------------------
 * Envia:
 * - E-mail individual para cada aniversariante (membro).
 * - Resumo para Comunicação (lista do dia).
 *
 * Observação importante:
 * - Usa lock para evitar duplicidade se dois triggers rodarem juntos.
 */
function checkBirthdaysToday() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'checkBirthdaysToday: INÍCIO');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock não obtido — evitando execução concorrente.');
    return;
  }

  try {
    const today = aniv_now_();
    const start = aniv_startOfDay_(today);
    const endExclusive = aniv_addDays_(start, 1);

    const rows = aniv_getMemberBirthdaysForWindow_(start, endExclusive);

    GEAPA_CORE.coreLogInfo(runId, 'checkBirthdaysToday: encontrados', { count: rows.length });

    rows.forEach(r => {
      try {
        aniv_sendBirthdayMessageToMember_(r, start);
      } catch (e) {
        GEAPA_CORE.coreLogError(runId, 'Erro ao enviar para membro', {
          nome: r.name,
          email: r.email,
          err: String(e),
          stack: e && e.stack
        });
      }
    });

    GEAPA_CORE.coreLogInfo(runId, 'checkBirthdaysToday: FIM OK', { count: rows.length });
  } finally {
    lock.releaseLock();
  }
}

function checkProfsBirthdaysToday() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'checkProfsBirthdaysToday: INÍCIO');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock não obtido — evitando execução concorrente.');
    return;
  }

  try {
    const today = aniv_now_();
    const start = aniv_startOfDay_(today);
    const endExclusive = aniv_addDays_(start, 1);

    const rows = aniv_getProfBirthdaysForWindow_(start, endExclusive);

    rows.forEach(r => {
      try {
        aniv_sendProfBirthdayEmail_(r, start);
      } catch (e) {
        GEAPA_CORE.coreLogError(runId, 'Erro ao enviar prof', {
          nome: r.name,
          email: r.email,
          err: String(e),
          stack: e && e.stack
        });
      }
    });

    GEAPA_CORE.coreLogInfo(runId, 'checkProfsBirthdaysToday: FIM OK', { count: rows.length });
  } finally {
    lock.releaseLock();
  }
}

function weeklyBirthdayDigest() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'weeklyBirthdayDigest: INÍCIO');

  const today = aniv_startOfDay_(aniv_now_());

  if (today.getDay() !== 1) {
    GEAPA_CORE.coreLogInfo(runId, 'weeklyBirthdayDigest: ignorado, hoje não é segunda-feira', {
      today: aniv_formatDate_(today)
    });
    return;
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock não obtido — evitando execução concorrente.');
    return;
  }

  try {
    const start = today;
    const endExclusive = aniv_addDays_(start, ANIV_CFG.DAYS_AHEAD_WEEKLY + 1);

    const rows = aniv_getMemberBirthdaysForWindow_(start, endExclusive);

    aniv_notifyCommunicationMembers_(rows, start, aniv_addDays_(start, ANIV_CFG.DAYS_AHEAD_WEEKLY), true);

    GEAPA_CORE.coreLogInfo(runId, 'weeklyBirthdayDigest: FIM OK', { count: rows.length });
  } finally {
    lock.releaseLock();
  }
}

function weeklyProfsBirthdayDigest() {
  const runId = GEAPA_CORE.coreRunId();
  GEAPA_CORE.coreLogInfo(runId, 'weeklyProfsBirthdayDigest: INÍCIO');

  const today = aniv_startOfDay_(aniv_now_());

  if (today.getDay() !== 1) {
    GEAPA_CORE.coreLogInfo(runId, 'weeklyProfsBirthdayDigest: ignorado, hoje não é segunda-feira', {
      today: aniv_formatDate_(today)
    });
    return;
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    GEAPA_CORE.coreLogWarn(runId, 'Lock não obtido — evitando execução concorrente.');
    return;
  }

  try {
    const start = today;
    const endExclusive = aniv_addDays_(start, ANIV_CFG.DAYS_AHEAD_WEEKLY + 1);

    const rows = aniv_getProfBirthdaysForWindow_(start, endExclusive);

    aniv_notifyCommunicationProfs_(rows, start, aniv_addDays_(start, ANIV_CFG.DAYS_AHEAD_WEEKLY), true);

    GEAPA_CORE.coreLogInfo(runId, 'weeklyProfsBirthdayDigest: FIM OK', { count: rows.length });
  } finally {
    lock.releaseLock();
  }
}