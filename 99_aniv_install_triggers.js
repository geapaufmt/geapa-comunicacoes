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
      fn === 'weeklyProfsBirthdayDigest'
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

  ScriptApp.newTrigger('weeklyProfsBirthdayDigest')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(7)
    .create();

  Logger.log('Triggers de aniversários instalados com sucesso.');
}