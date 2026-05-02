/**************************************
 * 25_recipients.gs
 * DESTINATÁRIO DA COMUNICAÇÃO VIA VIGÊNCIAS
 *
 * Responsabilidade:
 * - Descobrir quem ocupa a diretoria/ocupação institucional vigente de comunicação
 * - Cruzar com a base MEMBERS_ATUAIS para obter o e-mail
 **************************************/
/**
 * Retorna a lista de e-mails da ocupação institucional vigente de comunicação.
 *
 * Agora resolvido pelo GEAPA_CORE a partir da projeção institucional atual.
 */
function aniv_resolveCommunicationRoleQueries_() {
  var candidates = [];
  var seen = {};

  function pushCandidate(value) {
    var text = String(value || '').trim();
    if (!text) return;
    var key = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (seen[key]) return;
    seen[key] = true;
    candidates.push(text);
  }

  pushCandidate(aniv_getCommunicationOccupationRoleKey_());
  pushCandidate(ANIV_CFG.VIGENCIA.COMM_OCCUPATION_NAME);
  pushCandidate(ANIV_CFG.VIGENCIA.COMM_ROLE_NAME);
  aniv_getCommunicationOccupationAliases_().forEach(pushCandidate);

  return candidates;
}

function getCommunicationRecipientEmails_() {
  const runId = GEAPA_CORE.coreRunId();
  const preferredOccupationName = aniv_getCommunicationOccupationLabel_();
  const queries = aniv_resolveCommunicationRoleQueries_();
  const emailsByNormalizedValue = {};

  try {
    queries.forEach(function(query) {
      var currentEmails = [];

      if (typeof GEAPA_CORE.coreGetCurrentEmailsByOccupation === 'function') {
        currentEmails = GEAPA_CORE.coreGetCurrentEmailsByOccupation(query) || [];
      } else {
        currentEmails = GEAPA_CORE.coreGetCurrentEmailsByRole(query) || [];
      }

      currentEmails.forEach(function(email) {
        var normalized = String(email || '').trim().toLowerCase();
        if (!normalized) return;
        emailsByNormalizedValue[normalized] = String(email || '').trim();
      });
    });

    const emails = Object.keys(emailsByNormalizedValue)
      .sort()
      .map(function(key) { return emailsByNormalizedValue[key]; });

    if (!emails.length) {
      GEAPA_CORE.coreLogWarn(runId, 'Comunicação: ocupação institucional vigente não encontrada', {
        preferredOccupationName: preferredOccupationName,
        queries: queries
      });
      return [];
    }

    GEAPA_CORE.coreLogInfo(runId, 'Comunicação: destinatário(s) encontrado(s)', {
      count: emails.length,
      emails: emails,
      preferredOccupationName: preferredOccupationName,
      queries: queries
    });

    return emails;
  } catch (e) {
    GEAPA_CORE.coreLogError(runId, 'Erro ao buscar destinatário da comunicação pelo core', {
      err: String(e),
      stack: e && e.stack
    });
    return [];
  }
}

/**
 * Envia o resumo para a ocupação institucional vigente de comunicação.
 */
function aniv_sendToCommunication_(subject, htmlBody) {
  const runId = GEAPA_CORE.coreRunId();
  const recipients = getCommunicationRecipientEmails_();

  if (!recipients.length) {
    GEAPA_CORE.coreLogWarn(runId, 'Comunicação: nenhum destinatário encontrado — não enviei resumo', { subject });
    return false;
  }

  GEAPA_CORE.coreSendHtmlEmail({
    to: recipients.join(','),
    subject,
    htmlBody
  });

  GEAPA_CORE.coreLogInfo(runId, 'Comunicação: resumo enviado', {
    subject,
    toCount: recipients.length
  });

  return true;
}
