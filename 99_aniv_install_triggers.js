/**************************************
 * 50_aniv_install.gs
 * Instala triggers do módulo de aniversários
 **************************************/

function aniv_installTriggers() {
  const all = ScriptApp.getProjectTriggers();

  all.forEach(t => {
    const fn = t.getHandlerFunction();
    if (
      fn === 'checkBirthdaysToday' ||
      fn === 'checkProfsBirthdaysToday' ||
      fn === 'weeklyBirthdayDigest' ||
      fn === 'weeklyProfsBirthdayDigest' ||
      fn === 'processScheduledCommunicationsToday' ||
      fn === 'processCommunicationsOutbox' ||
      fn === 'processAcademicNoticesToday' ||
      fn === 'processAcademicNoticeOutbox'
    ) {
      ScriptApp.deleteTrigger(t);
    }
  });

  // aniversário individual diário
  ScriptApp.newTrigger('checkBirthdaysToday')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  // professores diário
  ScriptApp.newTrigger('checkProfsBirthdaysToday')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  // resumo semanal: segunda-feira
  ScriptApp.newTrigger('weeklyBirthdayDigest')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(7)
    .create();

  // resumo semanal de professores: segunda-feira
  ScriptApp.newTrigger('weeklyProfsBirthdayDigest')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(7)
    .create();

  // avisos academicos diarios
  ScriptApp.newTrigger('processScheduledCommunicationsToday')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  // processamento da fila central de saida
  ScriptApp.newTrigger('processCommunicationsOutbox')
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log('Triggers de comunicacoes instalados com sucesso.');
}
