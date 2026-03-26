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
  DATES: 'DATAS_COMEMORATIVAS',        // Datas comemorativas do grupo
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
    COL_NAME: 'MEMBRO',
    COL_RGA: 'RGA',
    COL_BIRTHDATE: 'DATA DE NASCIMENTO',  // aceita DD/MM/AAAA ou DD/MM (depende do parser)
    COL_EMAIL: 'EMAIL',
    COL_ROLE: 'Cargo/função atual',
    COL_INSTA: '@ Instagram',             // opcional
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
  // 3) PLANILHA DE DATAS COMEMORATIVAS
  // ==========================================================
  DATES: Object.freeze({
    KEY: ANIV_KEYS.DATES,

    /** Cabeçalhos esperados */
    COL_TITLE: 'Titulo',
    COL_DATE: 'Data',
    COL_DESC: 'Descricao',                // opcional
    COL_AUDIENCE: 'Publico',              // 'Membros', 'Professores', 'Ambos'
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