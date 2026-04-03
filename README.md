# GEAPA Comunicacoes

Modulo Apps Script do ecossistema GEAPA para comunicacoes institucionais baseadas em configuracao.

Hoje ele cobre tres familias principais:

- `COMEMORACAO`
- `AVISO_ACADEMICO`
- `COMUNICADO_GERAL`

O modulo nao monta o HTML final na mao. Ele detecta eventos, resolve destinatarios, monta o contrato de saida e enfileira na `MAIL_SAIDA` do `geapa-core`. O core continua responsavel por:

- layout institucional
- assunto final com `[GEAPA][CHAVE]`
- slogan vigente da diretoria
- assinatura institucional
- envio tecnico
- registro em `MAIL_SAIDA`, `MAIL_EVENTOS` e `MAIL_INDICE`

## Arquitetura

Arquivos principais:

- [00_aniv_config.js](/C:/Users/Windows%2010/geapa-comemoracoes/00_aniv_config.js): keys do Registry, cabecalhos esperados e defaults do modulo
- [10_aniv_jobs.js](/C:/Users/Windows%2010/geapa-comemoracoes/10_aniv_jobs.js): entradas automaticas de aniversarios
- [12_aniv_academic_notices.js](/C:/Users/Windows%2010/geapa-comemoracoes/12_aniv_academic_notices.js): wrappers publicos e compatibilidade legada
- [13_comms_engine.js](/C:/Users/Windows%2010/geapa-comemoracoes/13_comms_engine.js): motor central de comunicacoes
- [14_comms_sheet_ux.js](/C:/Users/Windows%2010/geapa-comemoracoes/14_comms_sheet_ux.js): notas, filtros, congelamento de cabecalho e validacoes da planilha
- [15_comms_config_validation.js](/C:/Users/Windows%2010/geapa-comemoracoes/15_comms_config_validation.js): catalogo de valores permitidos, placeholders e validador da `Comunicacoes_Config`
- [16_comms_operability.js](/C:/Users/Windows%2010/geapa-comemoracoes/16_comms_operability.js): healthcheck, preview manual e relatorio operacional em aba
- [11_aniv_readers.js](/C:/Users/Windows%2010/geapa-comemoracoes/11_aniv_readers.js): leitores de membros e professores
- [99_aniv_install_triggers.js](/C:/Users/Windows%2010/geapa-comemoracoes/99_aniv_install_triggers.js): instalacao de triggers
- [aniv_debug.js](/C:/Users/Windows%2010/geapa-comemoracoes/aniv_debug.js): testes manuais e debug

## Planilhas

Este modulo usa estas fontes por key do Registry:

- `MEMBERS_ATUAIS`
- `PROFS_BASE`
- `VIGENCIA_SEMESTRES`
- `DADOS_OFICIAIS_GEAPA`
- `COMUNICACOES_CONFIG`
- `COMUNICACOES_LOG`

Estruturas principais:

- `Comunicacoes_Config`: fonte oficial de configuracao do motor
- `Comunicacoes_Log`: log funcional local do modulo
- `Comunicacoes_Validacao`: aba auxiliar opcional, gerada pelo modulo para relatorio de validacao operacional

Nao ha mais dependencia estrutural de `Avisos_Config`, `Avisos_Log` nem de `DatasComemorativas`.
Os wrappers antigos foram mantidos apenas para compatibilidade de nomes de funcoes, sem reutilizar essas abas.

## O Que E Dirigido Por Config

Uma nova comunicacao pode ser criada sem mexer no codigo quando usar combinacoes ja suportadas de:

- `Tipo Fluxo`
- `Fonte Evento`
- `Modo Disparo`
- `Modo Destinatario`
- `Template Key`
- `Assunto Humano`
- `Titulo Email`
- `Preheader`
- `Intro Texto`
- `Bloco Destaque`
- `Rotulo Botao`
- `Link Botao`
- `Dias Antecedencia`
- `Dias Posterioridade`
- `Prioridade`
- `Responder Para`
- `Tags`
- `Categoria Comunicacao`
- `Anexo 1`, `Anexo 2`, `Anexo 3`

Templates institucionais hoje disponiveis no core:

- `GEAPA_OPERACIONAL`
- `GEAPA_COMEMORATIVO`
- `GEAPA_CONVITE`
- `GEAPA_CLASSICO`

So exige codigo novo quando surgir:

- nova fonte de evento
- novo modo de disparo
- novo modo de destinatario
- nova regra de agregacao
- novo comportamento tecnico que o core ainda nao suporta

## Modos Suportados

### Fontes de evento

- `MEMBERS_ATUAIS`
- `PROFESSORES`
- `VIGENCIA_SEMESTRES`
- `DADOS_OFICIAIS_GEAPA`
- `CONFIG`

Uso tipico de `DADOS_OFICIAIS_GEAPA`:

- aniversario institucional do proprio grupo
- comunicacoes baseadas na `DATA_OFICIAL_CRIACAO`

### Modos de disparo

- `DATA_ORIGEM`
- `DATA_MANUAL`
- `RESUMO_SEMANAL`
- `ANIVERSARIO_INTEGRACAO_ANUAL`
- `MANUAL`

Observacao:

- `MANUAL` nao entra no processamento automatico diario
- `MANUAL` deve ser disparado por `queueCommunicationByCode(...)`
- `ANIVERSARIO_INTEGRACAO_ANUAL` usa `DATA_INTEGRACAO` como fonte de verdade e dispara apenas no aniversario anual exato

### Modos de destinatario

- `FIXO`
- `LISTA_FIXA`
- `MEMBERS_ATUAIS`
- `MEMBERS_E_PROFESSORES`
- `EMAIL_GROUP`
- `EVENT_SOURCE_EMAIL`

Observacao importante sobre `MEMBERS_ATUAIS`:

- o modulo usa a coluna `Status` da planilha `MEMBERS_ATUAIS`
- entram como destinatarios os registros com status ativo, como `ATIVO`, `ATIVA` ou `SIM`

Observacao sobre `MEMBERS_E_PROFESSORES`:

- combina os emails ativos de `MEMBERS_ATUAIS` com os emails da base `PROFS_BASE`
- remove duplicados automaticamente antes de montar o envio

## Contrato Com O Core

O modulo monta e enfileira contratos logicos como:

```js
{
  moduleName,
  templateKey,
  correlationKey,
  entityType,
  entityId,
  flowCode,
  to,
  cc,
  bcc,
  subjectHuman,
  payload,
  priority,
  sendAfter,
  replyTo,
  attachments,
  metadata
}
```

O `geapa-core` processa a `MAIL_SAIDA`, renderiza o e-mail institucional e envia tecnicamente.

## Chaves De Correlacao

As chaves foram compactadas para reduzir o tamanho do assunto sem perder rastreabilidade.

Exemplos:

- `COM-2026-1-MAT-ABERTURA`
- `COM-MEM-P-20260331-LMTPUTTON`
- `COM-MEM-S-20260331`
- `COM-PROF-C-20260331`
- `COM-CFG-sem-reuniao-semana-20260415`

## Campos Novos Da V2

### Em `Comunicacoes_Config`

Campos opcionais com defaults seguros:

- `Ativa Manualmente`: default `NAO`
- `Permite Reenvio Manual`: default `NAO`
- `Janela Duplicidade Dias`: default `0`
- `Limite Destinatarios Por Lote`: vazio
- `Responder Para`: vazio
- `Usar Assinatura Institucional`: default `SIM`
- `Categoria Comunicacao`: vazio
- `Tags`: vazio
- `Anexo 1`, `Anexo 2`, `Anexo 3`: vazios

### Em `Comunicacoes_Log`

Campos operacionais preenchidos pelo codigo:

- `Ultimo Erro`
- `Quantidade Destinatarios`
- `Modo Destinatario Resolvido`
- `Template Usado`
- `Data Enfileiramento`
- `Data Processamento`
- `Tentativas Envio`
- `Foi Reenvio`
- `Tags`
- `Payload Resumo`

## UX E Validacao Da Planilha

Funcoes reaplicaveis:

- `applyCommunicationsSheetUx()`: reaplica notas, cores, congelamento da linha 1, filtro e validacoes na `Comunicacoes_Config`
- `applyCommunicationsConfigSheetUx()`: reaplica a UX completa apenas na `Comunicacoes_Config`
- `applyCommunicationsLogSheetUx()`: reaplica a UX visual da `Comunicacoes_Log`
- `reapplyCommunicationsHeaderNotes()`: reaplica apenas as notas dos cabecalhos
- `applyCommunicationsDataValidation()`: reaplica apenas as listas suspensas/validacoes da `Comunicacoes_Config`
- `validateCommunicationsConfig()`: gera relatorio de erros e avisos antes do processamento

O que a validacao verifica:

- combinacoes validas entre `Fonte Evento` e `Modo Disparo`
- obrigatoriedades por `Modo Destinatario`
- `Template Key`, `Prioridade` e campos `SIM/NAO`
- placeholders desconhecidos nos campos textuais
- problemas comuns de CTA, links e campos numericos

Observacao:

- as listas suspensas aplicadas por codigo substituem a validacao existente na mesma coluna/faixa; elas nao se duplicam visualmente.

## Funcoes Principais

Processamento automatico:

- `checkBirthdaysToday()`
- `checkProfsBirthdaysToday()`
- `weeklyBirthdayDigest()`
- `weeklyProfsBirthdayDigest()`
- `processScheduledCommunicationsToday()`
- `processCommunicationsOutbox()`

Nomes recomendados na nomenclatura nova:

- `processMemberBirthdaysToday()`
- `processProfessorBirthdaysToday()`
- `processMemberBirthdaysWeekly()`
- `processProfessorBirthdaysWeekly()`
- `processDailyCommunications()`
- `runScheduledCommunicationsToday()`
- `runCommunicationsOutbox()`

Compatibilidade legada:

- `processAcademicNoticesToday()`
- `processAcademicNoticeOutbox()`

Processamento manual:

- `queueCommunicationByCode(code, opts)`
- `previewCommunicationByCode(code, opts)`
- `previewFirstManualCommunication()`

Helpers de debug:

- `debugCommunicationsConfigs()`
- `applyCommunicationsUxNow()`
- `reapplyCommunicationsHeaderNotesNow()`
- `applyCommunicationsDataValidationNow()`
- `validateCommunicationsConfigNow()`
- `checkCommunicationsHealthNow()`
- `writeCommunicationsValidationReportNow()`
- `previewCommunicationByCodeNow(code)`
- `previewFirstManualCommunicationNow()`
- `queueScheduledCommunicationsToday()`
- `queueMemberBirthdaysToday()`
- `queueProfessorBirthdaysToday()`
- `queueMemberBirthdaysWeeklyForceToday()`
- `queueProfessorBirthdaysWeeklyForceToday()`
- `queueMemberIntegrationAnniversariesToday()`
- `queueFirstManualCommunicationToday()`
- `resendFirstManualCommunicationToday()`
- `processCommunicationsOutboxNow()`
- `syncCommunicationsLogNow()`
- `listCommunicationsTriggersNow()`
- `validateCommunicationsTriggersNow()`
- `reinstallCommunicationsTriggersNow()`

## Aniversario De Tempo No Grupo

Para aniversarios de integracao no grupo, configure linhas como:

- `ANIV_GRUPO_DIA_PESSOA`
  - `Fonte Evento = MEMBERS_ATUAIS`
  - `Modo Disparo = ANIVERSARIO_INTEGRACAO_ANUAL`
  - `Campo Data Origem = DATA_INTEGRACAO`
  - `Modo Destinatario = EVENT_SOURCE_EMAIL`

- `ANIV_GRUPO_DIA_COORD`
  - `Fonte Evento = MEMBERS_ATUAIS`
  - `Modo Disparo = ANIVERSARIO_INTEGRACAO_ANUAL`
  - `Campo Data Origem = DATA_INTEGRACAO`
  - `Modo Destinatario = EMAIL_GROUP`
  - `Grupo Institucional = COMUNICACAO`

Placeholders suportados nos textos configurados:

- `{{nome}}`
- `{{nome_membro}}`
- `{{anos_completos}}`
- `{{anos_no_grupo}}`
- `{{anos_no_grupo_label}}`
- `{{data_integracao}}`
- `{{data_referencia}}`
- `{{data_disparo}}`
- `{{semestre}}`
- `{{nome_grupo}}`
- `{{sigla_grupo}}`
- `{{email_oficial}}`
- `{{codigo_comunicacao}}`
- `{{tipo_fluxo}}`
- `{{fonte_evento}}`

## Triggers

Instalacao:

- `installCommunicationsTriggers()`
- `reinstallCommunicationsTriggers()`

Auditoria:

- `listCommunicationsTriggers()`
- `validateCommunicationsTriggers()`

Compatibilidade:

- `aniv_installTriggers()`

Healthcheck operacional:

- `checkCommunicationsHealth()`

O healthcheck verifica:

- acesso as keys do Registry usadas pelo modulo
- presenca das funcoes criticas do `geapa-core`
- situacao dos triggers gerenciados
- erros e avisos da `Comunicacoes_Config`

Triggers instalados atualmente:

- aniversario individual de membros: diario
- aniversario individual de professores: diario
- resumo semanal de membros: segunda-feira
- resumo semanal de professores: segunda-feira
- processamento diario das comunicacoes configuradas
- processamento horario da fila central

Observacao:

- a API do Apps Script permite validar presenca e duplicidade dos handlers dos triggers, mas nao expoe todos os detalhes finos do agendamento em tempo de leitura.

## UX Da Planilha

Funcoes reaplicaveis de ajuda visual:

- `applyCommunicationsSheetUx()`: aplica notas, congela linha 1, cria filtros e colore os grupos de colunas em `Comunicacoes_Config` e `Comunicacoes_Log`
- `reapplyCommunicationsSheetUx()`: reaplica toda a camada visual das duas abas
- `applyCommunicationsConfigSheetUx()`: reaplica apenas a aba `Comunicacoes_Config`
- `applyCommunicationsLogSheetUx()`: reaplica apenas a aba `Comunicacoes_Log`
- `reapplyCommunicationsHeaderNotes()`: reaplica somente as notas dos cabecalhos, sem mexer no restante
- `applyCommunicationsDataValidation()`: reaplica apenas as listas suspensas e validacoes de colunas constantes na `Comunicacoes_Config`

Atalhos de debug:

- `applyCommunicationsUxNow()`
- `reapplyCommunicationsHeaderNotesNow()`
- `applyCommunicationsDataValidationNow()`

O que essa camada faz:

- congela a linha 1
- aplica filtro na linha 1
- escreve notas explicativas nos cabecalhos
- colore grupos de colunas para facilitar leitura operacional
- inclui nas notas dos campos textuais o catalogo de placeholders disponiveis no modulo
- aplica listas suspensas nas colunas de valores constantes da `Comunicacoes_Config`

Observacao importante para abas em formato de tabela:

- quando o Google Sheets bloquear alguma operacao por causa de colunas com tipo, a camada de UX passa a registrar essa etapa como pulada, em vez de derrubar a execucao inteira

## Validacao E Relatorio Operacional

Funcoes:

- `validateCommunicationsConfig()`
- `writeCommunicationsValidationReport()`
- `checkCommunicationsHealth()`

Uso recomendado:

1. rode `validateCommunicationsConfig()` para um retorno rapido em JSON
2. rode `writeCommunicationsValidationReport()` para gravar o relatorio na aba `Comunicacoes_Validacao`
3. rode `checkCommunicationsHealth()` para validar config, triggers, registry e funcoes essenciais do core

## Como Testar Manualmente

### 1. Aviso academico

1. Crie uma linha ativa em `Comunicacoes_Config` com:
   - `Tipo Fluxo = AVISO_ACADEMICO`
   - `Fonte Evento = VIGENCIA_SEMESTRES`
   - `Modo Disparo = DATA_ORIGEM`
2. Garanta que a data de referencia do semestre caia hoje.
3. Rode `queueScheduledCommunicationsToday()`.
4. Rode `processCommunicationsOutboxNow()`.
5. Rode `syncCommunicationsLogNow()`.

### 2. Aniversario de membro no dia

1. Garanta uma linha ativa com:
   - `Fonte Evento = MEMBERS_ATUAIS`
   - `Modo Disparo = DATA_ORIGEM`
   - `Modo Destinatario = EVENT_SOURCE_EMAIL`
2. Garanta que exista um membro com aniversario hoje.
3. Rode `queueMemberBirthdaysToday()`.
4. Rode `processCommunicationsOutboxNow()`.

### 3. Resumo semanal de aniversarios

1. Garanta uma linha ativa com:
   - `Fonte Evento = MEMBERS_ATUAIS` ou `PROFESSORES`
   - `Modo Disparo = RESUMO_SEMANAL`
2. Em dia de teste fora da segunda-feira, use:
   - `queueMemberBirthdaysWeeklyForceToday()`
   - `queueProfessorBirthdaysWeeklyForceToday()`
3. Rode `processCommunicationsOutboxNow()`.

### 4. Comunicacao manual

1. Defina `Ativa Manualmente = SIM`.
2. Opcionalmente defina `Permite Reenvio Manual = SIM`.
3. Rode:
   - `queueFirstManualCommunicationToday()`
   - ou `queueCommunicationByCodeNow('SEU_CODIGO')`
4. Para reenvio explicito:
   - `resendFirstManualCommunicationToday()`
   - ou `resendCommunicationByCodeNow('SEU_CODIGO')`

### 5. Comunicacao com reply-to e anexo

1. Preencha `Responder Para` com um e-mail valido.
2. Preencha `Anexo 1` com ID do Drive ou link do Drive.
3. Enfileire a comunicacao.
4. Rode `processCommunicationsOutboxNow()`.
5. Valide no Gmail o `reply-to` e o anexo.

## Observacoes Operacionais

- `MAIL_SAIDA` nao precisa de colunas extras para anexos nesta versao
- anexos e `replyTo` ficam serializados em `Observacoes` da saida central
- o log local do modulo e o ponto principal para acompanhar o estado funcional da comunicacao

## Backlog Natural

- batches reais por `Limite Destinatarios Por Lote`
- visualizacao mais rica de anexos no log
- suporte a mais de 3 anexos por configuracao
- respostas automáticas e ingestao de replies desse modulo
- adapter `COM` mais rico no mail hub
