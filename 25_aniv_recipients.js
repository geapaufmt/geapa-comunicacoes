/**************************************
 * 25_recipients.gs
 * DESTINATÁRIO DA COMUNICAÇÃO VIA VIGÊNCIAS
 *
 * Responsabilidade:
 * - Descobrir quem ocupa a coordenação de comunicação vigente
 * - Cruzar com a base MEMBERS_ATUAIS para obter o e-mail
 **************************************/
/**
 * Retorna a lista de e-mails da ocupação institucional vigente de comunicação.
 *
 * Agora resolvido pelo GEAPA_CORE a partir da projeção institucional atual.
 */
function getCommunicationRecipientEmails_() {
  const runId = GEAPA_CORE.coreRunId();
  const occupationName = ANIV_CFG.VIGENCIA.COMM_ROLE_NAME;

  try {
    const emails = GEAPA_CORE.coreGetCurrentEmailsByRole(occupationName);

    if (!emails.length) {
      GEAPA_CORE.coreLogWarn(runId, 'Comunicação: ocupação vigente não encontrada', {
        occupationName: occupationName
      });
      return [];
    }

    GEAPA_CORE.coreLogInfo(runId, 'Comunicação: destinatário(s) encontrado(s)', {
      count: emails.length,
      emails: emails,
      occupationName: occupationName
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
