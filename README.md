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
- [11_aniv_readers.js](/C:/Users/Windows%2010/geapa-comemoracoes/11_aniv_readers.js): leitores de membros e professores
- [99_aniv_install_triggers.js](/C:/Users/Windows%2010/geapa-comemoracoes/99_aniv_install_triggers.js): instalacao de triggers
- [aniv_debug.js](/C:/Users/Windows%2010/geapa-comemoracoes/aniv_debug.js): testes manuais e debug

## Planilhas

Este modulo usa estas fontes por key do Registry:

- `MEMBERS_ATUAIS`
- `PROFS_BASE`
- `VIGENCIA_SEMESTRES`
- `COMUNICACOES_CONFIG`
- `COMUNICACOES_LOG`

Estruturas principais:

- `Comunicacoes_Config`: fonte oficial de configuracao do motor
- `Comunicacoes_Log`: log funcional local do modulo

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
- `CONFIG`

### Modos de disparo

- `DATA_ORIGEM`
- `DATA_MANUAL`
- `RESUMO_SEMANAL`
- `MANUAL`

Observacao:

- `MANUAL` nao entra no processamento automatico diario
- `MANUAL` deve ser disparado por `queueCommunicationByCode(...)`

### Modos de destinatario

- `FIXO`
- `LISTA_FIXA`
- `MEMBERS_ATUAIS`
- `EMAIL_GROUP`
- `EVENT_SOURCE_EMAIL`

Observacao importante sobre `MEMBERS_ATUAIS`:

- o modulo passa a respeitar `RECEBE_EMAILS` em `CARGOS_INSTITUCIONAIS_CONFIG`
- se o cargo atual do membro for encontrado e estiver com `RECEBE_EMAILS = NAO`, o membro nao entra como destinatario
- se nao houver correspondencia de cargo, o e-mail continua sendo considerado

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

## Funcoes Principais

Processamento automatico:

- `checkBirthdaysToday()`
- `checkProfsBirthdaysToday()`
- `weeklyBirthdayDigest()`
- `weeklyProfsBirthdayDigest()`
- `processScheduledCommunicationsToday()`
- `processCommunicationsOutbox()`

Compatibilidade legada:

- `processAcademicNoticesToday()`
- `processAcademicNoticeOutbox()`

Processamento manual:

- `queueCommunicationByCode(code, opts)`

Helpers de debug:

- `debugCommunicationsConfigs()`
- `queueScheduledCommunicationsToday()`
- `queueMemberBirthdaysToday()`
- `queueProfessorBirthdaysToday()`
- `queueMemberBirthdaysWeeklyForceToday()`
- `queueProfessorBirthdaysWeeklyForceToday()`
- `queueFirstManualCommunicationToday()`
- `resendFirstManualCommunicationToday()`
- `processCommunicationsOutboxNow()`
- `syncCommunicationsLogNow()`

## Triggers

Instalacao:

- `aniv_installTriggers()`

Triggers instalados atualmente:

- aniversario individual de membros: diario
- aniversario individual de professores: diario
- resumo semanal de membros: segunda-feira
- resumo semanal de professores: segunda-feira
- processamento diario das comunicacoes configuradas
- processamento horario da fila central

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
