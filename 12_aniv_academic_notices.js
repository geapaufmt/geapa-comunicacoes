/**
 * Compatibilidade temporaria do fluxo antigo de avisos academicos.
 *
 * O modulo agora usa Comunicacoes_Config/Comunicacoes_Log como estrutura
 * principal. Estas funcoes permanecem como wrappers para evitar quebra
 * de menus, testes manuais e triggers antigos durante a migracao.
 */

function processAcademicNoticesToday() {
  return comms_processConfiguredDaily_();
}

function processConfiguredCommunicationsToday() {
  return comms_processConfiguredDaily_();
}

function processScheduledCommunicationsToday() {
  return comms_processConfiguredDaily_();
}

function processAcademicNoticeOutbox() {
  return comms_processOutboxAndSync_();
}

function processCommunicationsOutbox() {
  return comms_processOutboxAndSync_();
}

function queueCommunicationByCode(code, opts) {
  return comms_queueCommunicationByCode_(code, opts || {});
}

function aniv_syncAcademicNoticeLog_() {
  return comms_syncLogWithOutbox_();
}

function syncCommunicationsLog() {
  return comms_syncLogWithOutbox_();
}
