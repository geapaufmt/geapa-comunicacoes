/***************************************
 * 00_aniv_config.gs
 * MÓDULO: Aniversários & Datas Comemorativas
 *
 * Este arquivo NÃO abre planilhas nem envia e-mails.
 * Ele só centraliza configurações do módulo.
 *
 * PRINCÍPIO:
 * - Em vez de IDs "hardcoded", usamos KEYS do Registry (GEAPA-CORE).
 * - Isso permite trocar planilhas/abas apenas editando a planilha Registry,
 *   sem precisar mexer no código do módulo.
 ***************************************/

/**
 * ------------------------------------------------------------
 * KEYS do Registry (GEAPA-CORE)
 * ------------------------------------------------------------
 *
 * Quando usar:
 * - Sempre que este módulo precisar acessar planilhas institucionais.
 *
 * Como funciona:
 * - Cada KEY abaixo deve existir na planilha "Registry" (planilha-mãe).
 * - O Core resolve KEY → { spreadsheetId, sheetName } e abre a aba correta.
 *
 * Observações:
 * - Se você mudar a aba/planilha, altere só a Registry (não o código).
 */
const ANIV_KEYS = Object.freeze({
  MEMBERS: 'MEMBERS_ATUAIS',           // Base de membros (nome, nascimento, e-mail, cargo, insta)
  PROFS: 'PROFS_BASE',                 // Base de professores (nome, e-mail, nascimento)
  SEMESTERS: 'VIGENCIA_SEMESTRES',     // Datas oficiais do calendario academico
  OFFICIAL_DATA: 'DADOS_OFICIAIS_GEAPA', // Dados oficiais do grupo
  COMUNICACOES_LOG: 'COMUNICACOES_LOG',        // Log local principal do motor de comunicacoes
  COMUNICACOES_CONFIG: 'COMUNICACOES_CONFIG',  // Configuracao principal do motor de comunicacoes
});

/**
 * ------------------------------------------------------------
 * Configuração principal do módulo
 * ------------------------------------------------------------
 *
 * Este objeto reúne:
 * - quais colunas ler em cada planilha
 * - regras de destinatários (comunicação)
 * - textos/assuntos
 * - timezone e visual do e-mail
 *
 * Observação importante:
 * - As strings de colunas (ex.: 'MEMBRO', 'EMAIL') devem bater EXATAMENTE
 *   com o cabeçalho da planilha (mesmo acento, espaço, maiúsculas/minúsculas
 *   não importam se você usar headerMap normalizado no leitor).
 */
const ANIV_CFG = Object.freeze({
  /** Timezone padrão do módulo (deve bater com o padrão institucional) */
  TZ: 'America/Cuiaba',
  DATE_LOCALE: 'pt-BR',

  /** Digest semanal (quantos dias à frente olhar) */
  DAYS_AHEAD_WEEKLY: 7,

  // ==========================================================
  // 1) PLANILHA DE MEMBROS
  // ==========================================================
  MEMBERS: Object.freeze({
    KEY: ANIV_KEYS.MEMBERS,

    /**
     * Colunas (cabeçalhos) esperadas na base de membros.
     * Quando usar: leitores que montam lista de membros.
     */
    COL_NAME: Object.freeze(['MEMBRO', 'Membro', 'NOME_MEMBRO', 'Nome']),
    COL_RGA: Object.freeze(['RGA']),
    COL_BIRTHDATE: Object.freeze(['DATA DE NASCIMENTO', 'Data de nascimento', 'DATA_NASCIMENTO']),  // aceita DD/MM/AAAA ou DD/MM (depende do parser)
    COL_INTEGRATION_DATE: Object.freeze(['DATA_INTEGRACAO', 'DATA INTEGRACAO', 'Data Integracao', 'Data de Integracao']),
    COL_EMAIL: Object.freeze(['EMAIL', 'Email', 'E-mail']),
    COL_STATUS: Object.freeze(['Status', 'STATUS_CADASTRAL']),
    COL_ROLE: Object.freeze(['Cargo/fun\u00E7\u00E3o atual', 'Cargo/funcao atual', 'CARGO_FUNCAO_ATUAL']),
    COL_INSTA: Object.freeze(['@ Instagram', 'INSTAGRAM']),             // opcional
    ACTIVE_STATUS_VALUES: Object.freeze(['ATIVO', 'ATIVA', 'SIM']),
  }),

  // ==========================================================
  // 2) PLANILHA DE PROFESSORES
  // ==========================================================
  PROFS: Object.freeze({
    KEY: ANIV_KEYS.PROFS,

    /** Cabeçalhos esperados */
    COL_NAME: 'Nome',
    COL_EMAIL: 'E-mail',
    COL_BIRTHDATE: 'Data de Nascimento',      // pode ser Date do Sheets ou texto DD/MM(/AAAA)
  }),

  // ==========================================================
  // 3) DADOS OFICIAIS DO GRUPO
  // ==========================================================
  OFFICIAL_DATA: Object.freeze({
    KEY: ANIV_KEYS.OFFICIAL_DATA,
    COL_ORG_NAME: 'NOME_OFICIAL_GRUPO',
    COL_SHORT_NAME: 'SIGLA_OFICIAL_GRUPO',
    COL_EMAIL: 'EMAIL_OFICIAL',
    COL_CREATED_AT: 'DATA_OFICIAL_CRIACAO'
  }),

  // ==========================================================
  // 4) DESTINATÁRIOS AUTOMÁTICOS (COMUNICAÇÃO)
  // ==========================================================
  COMM: Object.freeze({
    /**
     * Regra: identificar membros da comunicação/marketing pela descrição do cargo.
     * Ex.: "Diretor de Comunicação", "Coordenação de Marketing", etc.
     *
     * Como funciona:
     * - O módulo procura no texto do cargo (COL_ROLE) por termos abaixo.
     */
    ROLES_MATCH: [
      'comunica',          // Comunicação, comunicacao
      'marketing',         // Marketing
      'social media',      // opcional
      'mídias', 'midias',  // opcional
      'instagram',         // opcional
    ],

    /**
     * Se true: restringe para cargos que também contenham a palavra "coord"
     * (coordenação/coordenador/coordenadora).
     *
     * Quando usar:
     * - Se você quer mandar só para o coordenador(a) de comunicação,
     *   e não para todo mundo que "toca" marketing.
     */
    REQUIRE_COORDINATOR_WORD: true,
  }),

  // ==========================================================
  // 5) E-MAIL / ASSUNTOS
  // ==========================================================
  EMAIL: Object.freeze({
    /** E-mail fixo opcional (se quiser CC/BCC institucional). Deixe vazio se não usar. */
    EMAIL_TO_FIXED: '',

    /** Assuntos */
    SUBJECT_TODAY: '🎉 Aniversariantes de hoje (GEAPA)',
    SUBJECT_WEEK: '📅 Aniversários da semana (GEAPA)',
    SUBJECT_PROF_TODAY: 'Aniversariante professor(a) de hoje (GEAPA)',
    SUBJECT_PROF_WEEK: 'Aniversários de professores – próximos dias (GEAPA)',
    SUBJECT_COMMEM_TODAY: 'Data comemorativa de hoje (GEAPA)',
    SUBJECT_COMMEM_WEEK: 'Datas comemorativas – próximos dias (GEAPA)',

    /** Integração opcional com Google Chat (Incoming Webhook) */
    CHAT_WEBHOOK_URL: '',
  }),

  // ==========================================================
  // 6) VISUAL / IDENTIDADE
  // ==========================================================
  BRAND: Object.freeze({
    /**
     * Logo do grupo usada em e-mails HTML.
     * Observação:
     * - Hoje está como ID fixo.
     * - Evolução: puxar pelo GEAPA_ASSETS no core (coreGetAssetBlob).
     */
    LOGO_FILE_ID: '1Md2YlFNXo4qD_5D1TwD7Ej3QqqvgitPV',

    COLOR_BG: '#ffffff',
    COLOR_TEXT: '#000000',
    BORDER: '#167d0a',
    QUOTE: '“Cultivar o Conhecimento Para Colher Sabedoria”',
  }),

  // ==========================================================
// 7) VIGÊNCIAS / DESTINATÁRIO DA COMUNICAÇÃO
// ==========================================================
  VIGENCIA: Object.freeze({
    DIRETORIAS_KEY: 'VIGENCIA_DIRETORIAS',
    MEMBROS_DIRETORIAS_KEY: 'VIGENCIA_MEMBROS_DIRETORIAS',

    // Aba Diretorias
    DIRETORIAS_COL_ID: 'ID_Diretoria',
    DIRETORIAS_COL_START: 'Início_Mandato',
    DIRETORIAS_COL_END: 'Fim_Mandato',

    // Aba Membros_Diretoria
    MEMBROS_COL_NAME: 'Nome',
    MEMBROS_COL_RGA: 'RGA',
    MEMBROS_COL_ROLE: 'Cargo/Função',
    MEMBROS_COL_BOARD_ID: 'ID_Diretoria',
    MEMBROS_COL_START: 'Data_Início',
    MEMBROS_COL_END: 'Data_Fim',
    MEMBROS_COL_END_PLANNED: 'Data_Fim_previsto',

    // Cargo que deve receber o resumo semanal
    COMM_ROLE_NAME: 'Coordenador(a) de Comunicação',
  }),

  // ==========================================================
  // 8) COMUNICACOES / MOTOR CONFIGURAVEL
  // ==========================================================
  COMUNICACOES: Object.freeze({
    MODULE_NAME: 'COMEMORACOES',
    SEMESTERS_KEY: ANIV_KEYS.SEMESTERS,
    LOG_KEY: ANIV_KEYS.COMUNICACOES_LOG,
    CONFIG_KEY: ANIV_KEYS.COMUNICACOES_CONFIG,
    OUTBOX_KEY: 'MAIL_SAIDA',
    VALIDATION_SHEET_NAME: 'Comunicacoes_Validacao',
    TEMPLATE_KEY: 'GEAPA_OPERACIONAL',
    RECIPIENT_MODE: 'MEMBERS_ATUAIS',
    FIXED_EMAIL: '',
    FIXED_EMAILS: [],
    EMAIL_GROUP_NAME: '',
    SEND_AS_BCC: true,
    PRIORITY: 'NORMAL',
    SEMESTER_HEADERS: Object.freeze({
      id: 'ID_Semestre',
      start: 'Início',
      end: 'Fim',
      matriculaStart: 'Início Matrículas Online',
      matriculaEnd: 'Fim Matrículas Online',
      ajusteAlunoStart: 'Início Ajuste do Aluno',
      ajusteAlunoEnd: 'Fim Ajuste do Aluno',
      ajusteCoordenadorStart: 'Início Ajuste do Coordenador',
      ajusteCoordenadorEnd: 'Fim ajuste do Coordenador'
    }),
    LOG_HEADERS: Object.freeze({
      id: 'Id Comunicacao',
      correlationKey: 'Chave de Correlacao',
      flowType: 'Tipo Fluxo',
      communicationCode: 'Codigo Comunicacao',
      semesterId: 'ID_Semestre',
      referenceDate: 'Data Referencia',
      plannedAt: 'Data Disparo Prevista',
      sentAt: 'Enviado Em',
      status: 'Status',
      moduleName: 'Modulo Dono',
      subject: 'Assunto Final',
      outboxId: 'Id Saida Central',
      threadId: 'Id Thread Gmail',
      messageId: 'Id Mensagem Gmail',
      lastError: 'Ultimo Erro',
      recipientCount: 'Quantidade Destinatarios',
      resolvedRecipientMode: 'Modo Destinatario Resolvido',
      templateUsed: 'Template Usado',
      queuedAt: 'Data Enfileiramento',
      processedAt: 'Data Processamento',
      attempts: 'Tentativas Envio',
      wasResend: 'Foi Reenvio',
      tags: 'Tags',
      payloadSummary: 'Payload Resumo',
      observations: 'Observacoes',
      createdAt: 'Criado Em',
      updatedAt: 'Atualizado Em'
    }),
    CONFIG_HEADERS: Object.freeze({
      active: 'Ativo',
      flowType: 'Tipo Fluxo',
      communicationCode: 'Codigo Comunicacao',
      description: 'Descricao',
      eventSource: 'Fonte Evento',
      triggerMode: 'Modo Disparo',
      originDateField: 'Campo Data Origem',
      semesterId: 'ID_Semestre',
      useCurrentSemester: 'Usar Semestre Vigente',
      manualDate: 'Data Disparo Manual',
      recipientMode: 'Modo Destinatario',
      fixedEmail: 'Email Fixo',
      fixedEmailList: 'Lista Emails Fixos',
      institutionalGroup: 'Grupo Institucional',
      sendAsBcc: 'Enviar Em Cco',
      templateKey: 'Template Key',
      subjectHuman: 'Assunto Humano',
      title: 'Titulo Email',
      preheader: 'Preheader',
      introText: 'Intro Texto',
      highlightBlock: 'Bloco Destaque',
      buttonLabel: 'Rotulo Botao',
      buttonLink: 'Link Botao',
      daysBefore: 'Dias Antecedencia',
      daysAfter: 'Dias Posterioridade',
      priority: 'Prioridade',
      manualEnabled: 'Ativa Manualmente',
      allowManualResend: 'Permite Reenvio Manual',
      duplicateWindowDays: 'Janela Duplicidade Dias',
      recipientBatchLimit: 'Limite Destinatarios Por Lote',
      replyTo: 'Responder Para',
      useInstitutionalSignature: 'Usar Assinatura Institucional',
      category: 'Categoria Comunicacao',
      tags: 'Tags',
      attachment1: 'Anexo 1',
      attachment2: 'Anexo 2',
      attachment3: 'Anexo 3',
      observations: 'Observacoes'
    })
  })
});

/**
 * ------------------------------------------------------------
 * Helper opcional: abrir Sheet via KEY (para padronizar módulo)
 * ------------------------------------------------------------
 *
 * Quando usar:
 * - Em qualquer reader/job do módulo, em vez de repetir chamada no core.
 *
 * Como funciona:
 * - Recebe uma KEY (ex.: 'MEMBERS_ATUAIS')
 * - Retorna o Sheet correspondente
 *
 * Observação:
 * - Isso depende de coreGetSheetByKey estar exportado pela Library.
 */
function aniv_getSheetByKey_(key) {
  return GEAPA_CORE.coreGetSheetByKey(key);
}

// Compatibilidade: arquivos antigos do módulo ainda usam CFG.*
const CFG = ANIV_CFG;
