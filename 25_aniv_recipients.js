/**************************************
 * 25_recipients.gs
 * DESTINATÁRIO DA COMUNICAÇÃO VIA VIGÊNCIAS
 *
 * Responsabilidade:
 * - Descobrir quem é a coordenação de comunicação vigente
 * - Cruzar com a base MEMBERS_ATUAIS para obter o e-mail
 **************************************/

/**
 * Retorna a lista de e-mails da coordenação de comunicação vigente.
 *
 * Regras:
 * 1) Descobre a diretoria vigente hoje na aba Diretorias
 * 2) Busca, em Membros_Diretoria, o cargo "Coordenador(a) de Comunicação"
 * 3) Cruza o RGA com MEMBERS_ATUAIS para obter o e-mail atual
 *
 * Saída:
 * - [] se não encontrar
 * - [email] se encontrar
 */
function getCommunicationRecipientEmails_() {
  const runId = GEAPA_CORE.coreRunId();
  const today = aniv_startOfDay_(aniv_now_());

  try {
    const shBoards = GEAPA_CORE.coreGetSheetByKey(ANIV_CFG.VIGENCIA.DIRETORIAS_KEY);
    const shBoardMembers = GEAPA_CORE.coreGetSheetByKey(ANIV_CFG.VIGENCIA.MEMBROS_DIRETORIAS_KEY);
    const shMembers = GEAPA_CORE.coreGetSheetByKey(ANIV_CFG.MEMBERS.KEY);

    // ==========================================================
    // 1) Descobrir a diretoria vigente
    // ==========================================================
    const boardsData = readSheet_(shBoards);

    const iBoardId = findHeaderIndex_(boardsData.headers, ANIV_CFG.VIGENCIA.DIRETORIAS_COL_ID);
    const iBoardStart = findHeaderIndex_(boardsData.headers, ANIV_CFG.VIGENCIA.DIRETORIAS_COL_START);
    const iBoardEnd = findHeaderIndex_(boardsData.headers, ANIV_CFG.VIGENCIA.DIRETORIAS_COL_END);

    if (iBoardId < 0 || iBoardStart < 0 || iBoardEnd < 0) {
      GEAPA_CORE.coreLogError(runId, 'Vigências: colunas da aba Diretorias não encontradas', {
        headers: boardsData.headers
      });
      return [];
    }

    let currentBoardId = '';

    for (const row of boardsData.rows) {
      const boardId = String(row[iBoardId] || '').trim();
      const start = row[iBoardStart] ? new Date(row[iBoardStart]) : null;
      const end = row[iBoardEnd] ? new Date(row[iBoardEnd]) : null;

      if (!boardId || !start || !end) continue;
      if (today >= startOfDay_(start) && today <= startOfDay_(end)) {
        currentBoardId = boardId;
        break;
      }
    }

    if (!currentBoardId) {
      GEAPA_CORE.coreLogWarn(runId, 'Vigências: nenhuma diretoria vigente encontrada', {
        today: aniv_formatDate_(today)
      });
      return [];
    }

    // ==========================================================
    // 2) Buscar coordenação de comunicação vigente
    // ==========================================================
    const boardMembersData = readSheet_(shBoardMembers);

    const iName = findHeaderIndex_(boardMembersData.headers, ANIV_CFG.VIGENCIA.MEMBROS_COL_NAME, true);
    const iRga = findHeaderIndex_(boardMembersData.headers, ANIV_CFG.VIGENCIA.MEMBROS_COL_RGA);
    const iRole = findHeaderIndex_(boardMembersData.headers, ANIV_CFG.VIGENCIA.MEMBROS_COL_ROLE);
    const iBoardRef = findHeaderIndex_(boardMembersData.headers, ANIV_CFG.VIGENCIA.MEMBROS_COL_BOARD_ID);
    const iStart = findHeaderIndex_(boardMembersData.headers, ANIV_CFG.VIGENCIA.MEMBROS_COL_START);
    const iEnd = findHeaderIndex_(boardMembersData.headers, ANIV_CFG.VIGENCIA.MEMBROS_COL_END, true);
    const iEndPlanned = findHeaderIndex_(boardMembersData.headers, ANIV_CFG.VIGENCIA.MEMBROS_COL_END_PLANNED, true);

    if (iRga < 0 || iRole < 0 || iBoardRef < 0 || iStart < 0) {
      GEAPA_CORE.coreLogError(runId, 'Vigências: colunas da aba Membros_Diretoria não encontradas', {
        headers: boardMembersData.headers
      });
      return [];
    }

    let coordinator = null;

    for (const row of boardMembersData.rows) {
      const role = String(row[iRole] || '').trim();
      const boardId = String(row[iBoardRef] || '').trim();
      const rga = String(row[iRga] || '').trim();
      const name = iName >= 0 ? String(row[iName] || '').trim() : '';
      const start = row[iStart] ? new Date(row[iStart]) : null;
      const end = iEnd >= 0 && row[iEnd] ? new Date(row[iEnd]) : null;
      const endPlanned = iEndPlanned >= 0 && row[iEndPlanned] ? new Date(row[iEndPlanned]) : null;

      if (!rga || !role || !boardId || !start) continue;
      if (boardId !== currentBoardId) continue;
      if (normHeader_(role) !== normHeader_(ANIV_CFG.VIGENCIA.COMM_ROLE_NAME)) continue;
      if (today < startOfDay_(start)) continue;

      const validUntil = end ? startOfDay_(end) : (endPlanned ? startOfDay_(endPlanned) : null);
      if (validUntil && today > validUntil) continue;

      coordinator = { rga, name, boardId };
      break;
    }

    if (!coordinator) {
      GEAPA_CORE.coreLogWarn(runId, 'Vigências: coordenação de comunicação vigente não encontrada', {
        currentBoardId
      });
      return [];
    }

    // ==========================================================
    // 3) Cruzar com MEMBERS_ATUAIS para achar e-mail
    // ==========================================================
    const membersData = readSheet_(shMembers);
    const iMemberRga = findHeaderIndex_(membersData.headers, ANIV_CFG.MEMBERS.COL_RGA);
    const iMemberEmail = findHeaderIndex_(membersData.headers, ANIV_CFG.MEMBERS.COL_EMAIL);

    if (iMemberRga < 0 || iMemberEmail < 0) {
      GEAPA_CORE.coreLogError(runId, 'MEMBERS_ATUAIS: colunas RGA/EMAIL não encontradas', {
        headers: membersData.headers
      });
      return [];
    }

    for (const row of membersData.rows) {
      const rga = String(row[iMemberRga] || '').trim();
      const email = String(row[iMemberEmail] || '').trim();

      if (rga !== coordinator.rga) continue;
      if (!GEAPA_CORE.coreIsValidEmail(email)) continue;

      GEAPA_CORE.coreLogInfo(runId, 'Comunicação (vigências): destinatário encontrado', {
        nome: coordinator.name,
        rga: coordinator.rga,
        email,
        boardId: currentBoardId
      });

      return [email];
    }

    GEAPA_CORE.coreLogWarn(runId, 'Comunicação (vigências): coordenador encontrado, mas sem e-mail na base de membros', {
      nome: coordinator.name,
      rga: coordinator.rga
    });

    return [];

  } catch (e) {
    GEAPA_CORE.coreLogError(runId, 'Erro ao buscar destinatário pela vigência', {
      err: String(e),
      stack: e && e.stack
    });
    return [];
  }
}

/**
 * Envia o resumo para a coordenação de comunicação vigente.
 */
function sendToCommunication_(subject, htmlBody) {
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