/**************************************
 * 99_aniv_install_triggers.gs
 * Instalacao e auditoria de triggers do modulo de comunicacoes
 **************************************/

function comms_getManagedTriggerSpecs_() {
  return Object.freeze([
    Object.freeze({
      handler: 'checkBirthdaysToday',
      label: 'Aniversarios de membros no dia',
      scheduleType: 'DAILY',
      expectedSummary: 'Todo dia as 7h'
    }),
    Object.freeze({
      handler: 'checkProfsBirthdaysToday',
      label: 'Aniversarios de professores no dia',
      scheduleType: 'DAILY',
      expectedSummary: 'Todo dia as 7h'
    }),
    Object.freeze({
      handler: 'weeklyBirthdayDigest',
      label: 'Resumo semanal de aniversarios de membros',
      scheduleType: 'WEEKLY',
      expectedSummary: 'Segunda-feira as 7h'
    }),
    Object.freeze({
      handler: 'weeklyProfsBirthdayDigest',
      label: 'Resumo semanal de aniversarios de professores',
      scheduleType: 'WEEKLY',
      expectedSummary: 'Segunda-feira as 7h'
    }),
    Object.freeze({
      handler: 'processScheduledCommunicationsToday',
      label: 'Comunicacoes agendadas do dia',
      scheduleType: 'DAILY',
      expectedSummary: 'Todo dia as 6h'
    }),
    Object.freeze({
      handler: 'processCommunicationsOutbox',
      label: 'Processador da MAIL_SAIDA',
      scheduleType: 'HOURLY',
      expectedSummary: 'A cada 1 hora'
    })
  ]);
}

function comms_getManagedTriggerHandlers_() {
  return comms_getManagedTriggerSpecs_().map(function(spec) {
    return spec.handler;
  });
}

function comms_listManagedTriggers_() {
  var handlers = comms_getManagedTriggerHandlers_();
  return ScriptApp.getProjectTriggers().filter(function(trigger) {
    return handlers.indexOf(trigger.getHandlerFunction()) >= 0;
  });
}

function comms_deleteManagedTriggers_() {
  var triggers = comms_listManagedTriggers_();
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  return triggers.length;
}

function comms_createManagedTriggers_() {
  ScriptApp.newTrigger('checkBirthdaysToday')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  ScriptApp.newTrigger('checkProfsBirthdaysToday')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

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

  ScriptApp.newTrigger('processScheduledCommunicationsToday')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  ScriptApp.newTrigger('processCommunicationsOutbox')
    .timeBased()
    .everyHours(1)
    .create();
}

function comms_installTriggers_() {
  var deleted = comms_deleteManagedTriggers_();
  comms_createManagedTriggers_();
  return Object.freeze({
    ok: true,
    deleted: deleted,
    created: comms_getManagedTriggerSpecs_().length,
    managedHandlers: comms_getManagedTriggerHandlers_()
  });
}

function comms_listTriggers_() {
  var specs = comms_getManagedTriggerSpecs_();
  var triggers = comms_listManagedTriggers_();
  var byHandler = {};

  triggers.forEach(function(trigger) {
    var handler = trigger.getHandlerFunction();
    if (!byHandler[handler]) byHandler[handler] = [];
    byHandler[handler].push(trigger);
  });

  return Object.freeze({
    ok: true,
    note: 'A API do Apps Script permite auditar presenca e duplicidade dos handlers, mas nao expoe todos os detalhes finos da agenda configurada.',
    managed: specs.map(function(spec) {
      var installed = byHandler[spec.handler] || [];
      return Object.freeze({
        handler: spec.handler,
        label: spec.label,
        scheduleType: spec.scheduleType,
        expectedSummary: spec.expectedSummary,
        installedCount: installed.length,
        triggerSource: installed.length ? String(installed[0].getTriggerSource()) : '',
        eventType: installed.length ? String(installed[0].getEventType()) : '',
        uniqueIds: installed.map(function(item) { return item.getUniqueId(); })
      });
    })
  });
}

function comms_validateTriggers_() {
  var listing = comms_listTriggers_();
  var missing = [];
  var duplicates = [];

  listing.managed.forEach(function(item) {
    if (item.installedCount === 0) missing.push(item.handler);
    if (item.installedCount > 1) duplicates.push(item.handler);
  });

  return Object.freeze({
    ok: missing.length === 0 && duplicates.length === 0,
    missingHandlers: missing,
    duplicateHandlers: duplicates,
    managed: listing.managed,
    note: listing.note
  });
}

function installCommunicationsTriggers() {
  return comms_installTriggers_();
}

function reinstallCommunicationsTriggers() {
  return comms_installTriggers_();
}

function listCommunicationsTriggers() {
  return comms_listTriggers_();
}

function validateCommunicationsTriggers() {
  return comms_validateTriggers_();
}

function aniv_installTriggers() {
  return comms_installTriggers_();
}
