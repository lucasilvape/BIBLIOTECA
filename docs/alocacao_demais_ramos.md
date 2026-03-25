
# Alocação de Analistas de Sinistros (DEMAIS RAMOS)

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Poetry](https://img.shields.io/badge/Poetry-60A5FA?style=for-the-badge&logo=poetry&logoColor=white) ![SQL%20Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white) ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) ![i4Pro%20API](https://img.shields.io/badge/i4Pro%20API-0078D4?style=for-the-badge&logoColor=white) ![Jenkins](https://img.shields.io/badge/Jenkins-D33835?style=for-the-badge&logo=jenkins&logoColor=white)

Automatiza a alocação de sinistros dos **DEMAIS RAMOS** para analistas, conforme percentuais definidos por ramo na planilha de distribuição. O pipeline valida entradas, cria a distribuição, consulta sinistros elegíveis, calcula carga, aloca novos sinistros, insere a alocação no DW, atualiza o analista no i4Pro via API e registra logs, com notificações por e-mail apenas quando necessário.

---

## 📋 Sumário

- [🗺️ Visão geral do pipeline](#visao-geral)
- [🔄 Fluxo detalhado (end-to-end)](#fluxo-detalhado)
- [📁 Entradas, saídas e estrutura de pastas](#entradas-saidas)
- [🚀 Requisitos e configuração](#roadmap)
- [⚙️ Execução](#execucao)
- [📧 Regras de notificação por e‑mail](#regras-email)
- [🗄️ Banco de dados e conexões](#banco-dados)
- [✅ Critérios de sucesso e relatórios](#criterios-sucesso)
- [❓ Dúvidas frequentes e troubleshooting](#duvidas)
- [📞 Contato](#contato)

---

<a id="visao-geral"></a>

## 🗺️ Visão geral do pipeline

O orquestrador principal da execução é o arquivo `main_ramo.py`. Ele realiza:

1. Validação da estrutura do Excel e da consistência dos percentuais.
2. Criação da distribuição por `nr_ramo`/analista.
3. Consulta e preparação dos sinistros dos DEMAIS RAMOS.
4. Cálculo de carga de trabalho e alocação de novos sinistros.
5. Preparação e inserção no banco de dados (DW).
6. Atualização do analista no i4Pro via API utilizando o endpoint: "https://...Sinistro/AlteraResponsavelSinistro".
7. Registro de log da atualização do i4Pro.
8. Relatório final no terminal e notificações condicionais.

> [!NOTE]
> - Percentuais devem somar **100% por `nr_ramo`**.
> - Em produção, o resultado final é inserido no DW; não há exportação de Excel como saída.
> - A atualização no i4Pro usa as URLs que estão no arquivo .env:
> 	- `URL_HOMOLOG = ...`
> 	- `URL_PROD    = ...`
> - As listas de destinatários (`DESTINATARIOS_ERROS` e `DESTINATARIOS_VALIDACAO`) estão definidas no código do entrypoint.

---

<a id="fluxo-detalhado"></a>

## 🔄 Fluxo detalhado (end-to-end)

<details markdown="1">
<summary>Ver fluxo completo</summary>

**1. Entrada e validação inicial**
- Leitura de `demais_ramos.xlsx` (abas: `ramos` e `pessoas`).
- A planilha é carregada a partir do caminho UNC definido em `PATH_PLANILHA`.
- Validação de estrutura: colunas obrigatórias (`VARIAVEIS_ALOCACAO = ['nr_ramo']`) e analistas (colunas extras da aba `ramos`) existentes no banco.

**2. Validação de analistas (compatibilidade com o banco)**
- Busca de logins no grupo **"Equipe Sinistro"** e comparação com as colunas de analistas presentes na planilha.

**3. Criação da distribuição**
- `criar_distribuicao_ramo(...)`: transforma a grade de percentuais em formato longo por `nr_ramo`/analista, mantendo percentuais > 0 e vinculando `id_analista`/`cd_analista`.

**4. Validação de percentuais**
- Confere se a soma de `percentual` é **100% por `nr_ramo`**.
- Em falha: imprime erro, envia e-mail (se habilitado) e encerra.

**5. Consulta e processamento de sinistros (DEMAIS RAMOS)**
- Consulta de sinistros para os ramos configurados em `DEMAIS_RAMOS`:
  `[10, 11, 21, 22, 46, 51, 54, 55, 59, 69, 75, 76, 77, 78, 82, 93]`.
- Preparação e separação entre sinistros novos e sinistros já alocados previamente.

**6. Cálculo de carga e alocação**
- Calcula carga de trabalho por analista (considerando alocações existentes) e aloca sinistros novos ponderando percentual configurado e carga atual.
- Gera `df_sinistros_alocados` e relatório de distribuição por ramo/analista.

**7. Preparação para inserção**
- Padroniza o dataset para persistência e atualização do i4Pro (ex.: `nr_sinistro`, `nm_cobertura`, `id_analista`, `cd_analista`, `dt_alocacao`).
- Para a API do i4Pro, o código usa a coluna `cd_pessoa_analista` (derivada de `cd_analista` no entrypoint).

**8. Persistência / atualização**
- Inserção no DW em `dim_alocacao_analista_sinistro`.
- Atualização do responsável no i4Pro via `POST` para `AlteraResponsavelSinistro`.
- Inserção do log da atualização do i4Pro em `atualiza_analista_sinistro_i4pro`.

</details>

---

<a id="entradas-saidas"></a>

## 📁 Entradas, saídas e estrutura de pastas

### Entradas
- Planilha obrigatória: `\\Awsseg130006\ALOCACAO_SINISTRO_POR_ANALISTA\DEMAIS_RAMOS\demais_ramos.xlsx`
	- Aba `ramos`: deve conter `nr_ramo` e uma coluna por analista com percentuais (0 a 100). A soma deve ser 100 por `nr_ramo`.
	- Aba `pessoas`: é lida na execução (aba definida no código como `ABA_PESSOAS = "pessoas"`).

### Saídas
- Produção: inserção no DW (`kovr_dw_bi`) em `dim_alocacao_analista_sinistro`.
- Log de API: inserção em `kovr_logs_processos` em `atualiza_analista_sinistro_i4pro`.
- Atualização operacional: alteração do analista responsável no i4Pro via API.

### Estrutura do repositório (principais itens)
- `main_ramo.py`: orquestração ponta-a-ponta (principal)
- `main/main.py`: alternativa de execução (não faz o update no i4Pro)
- `src/alocacao/`: lógica da pipeline (Excel, validações, alocação, SQL, e-mail e integração i4Pro)
- `conexao/`: conexões e autenticação (dotenv/ODBC/SMTP)

---

<a id="roadmap"></a>

## 🚀 Roadmap para Clonar e Executar o Projeto

<details markdown="1">
<summary>Ver passo a passo</summary>

### 1. Pré-requisitos
- Python 3.8 ou superior instalado
- Git instalado
- [Poetry](https://python-poetry.org/docs/#installation) instalado
- Acesso ao SQL Server e à rede onde está a planilha `demais_ramos.xlsx`
- Permissões para instalar dependências

### 2. Clonando o repositório
Abra o terminal e execute:
```sh
git clone https://github.com/KovrSeguradoraBI/ALOCACAO_ANALISTAS_SINISTROS_DEMAIS_RAMOS.git
cd ALOCACAO_ANALISTAS_SINISTROS_DEMAIS_RAMOS
```

### 3. Instalando as dependências e ativando o ambiente
```sh
poetry install
poetry shell (caso você feche o terminal e precise ativar o ambiente virtual novamente)
```

### 4. Configurando variáveis de ambiente
- Renomeie o arquivo `.env.example` para `.env` (ou crie um `.env` novo).
- Preencha as variáveis conforme necessário:
  ```
  USER_PROD=...
  PASSWORD_PROD=...
  USER_DW_BI=...
  PASSWORD_DW_BI=...
  USER_EMAIL_BI=...
  PASSWORD_EMAIL_BI=...
  URL_PROD=...
  URL_HOMOLOG=...
  ```
- Confirme que o caminho da planilha `demais_ramos.xlsx` está acessível conforme configurado no script.
- Para testes locais, edite a variável `PATH` no `main.py` para `demais_ramos.xlsx` ou para o caminho desejado.

<a id="execucao"></a>

### 5. Executando o pipeline
Configurações usadas no `config.py`:
- PATH do Excel: `demais_ramos.xlsx`
- Em produção, o path é o seguinte:
`\\Awsseg130006\ALOCACAO_SINISTRO_POR_ANALISTA\DEMAIS_RAMOS\demais_ramos.xlsx`.
- VARIAVEIS_ALOCACAO: `['nr_ramo']`
- Ramos RCO: `[10, 11, 21, 22, 46, 51, 54, 55, 59, 69, 75, 76, 77, 78, 82, 93]`
- Listas de e‑mail definidas no código:
  - `DESTINATARIOS_ERROS`: recebe falhas de execução/inserção
  - `DESTINATARIOS_VALIDACAO`: recebe erros de validação de estrutura/percentuais

#### Simulação (sem inserir no DW)
- No arquivo (`main_ramo.py` ou `main/main.py`), ajuste:
	- `ENVIAR = False`

#### Desabilitar envio de e-mail
- No arquivo, ajuste:
	- `ENVIAR_EMAIL = False`
```sh
python main.py
```

### 6. Resultados
- O processo imprime o relatório final no terminal.
- Inserções são feitas diretamente no banco de dados.
- E-mails são enviados apenas em caso de erro ou quando houver novas alocações (conforme configuração).

---

> 💡 **Dica:**  
> Se for rodar em ambiente de produção (ex: Jenkins), garanta que o `.env` esteja presente no workspace e que as variáveis estejam corretamente preenchidas.

</details>

---

<a id="regras-email"></a>

## 📧 Regras de notificação por e‑mail

- O envio de e-mail é controlado por `ENVIAR_EMAIL` no entrypoint.
- Em geral:
	- Erros de validação (estrutura/percentuais) e exceções de execução disparam e-mail quando `ENVIAR_EMAIL=True`.
	- Em execuções sem novos sinistros, o script apenas registra no terminal.
- As listas de destinatários (`DESTINATARIOS_ERROS` e `DESTINATARIOS_VALIDACAO`) estão definidas no código do main_ramo.py.

---

<a id="banco-dados"></a>

## 🗄️ Banco de dados e conexões

### Aliases de conexão
- `producao_i4`: leitura no banco `re_i4pro`.
- `dw_bi`: escrita no banco `kovr_dw_bi`.
- `logs_bi`: escrita no banco `kovr_logs_processos`.

### Tabelas usadas
- DW: `dim_alocacao_analista_sinistro`
	- Colunas inseridas: `nr_sinistro`, `nm_cobertura`, `id_analista`, `cd_analista`, `dt_alocacao`
- Logs: `atualiza_analista_sinistro_i4pro`
	- Colunas inseridas: `nr_sinistro`, `cd_analista`, `cd_retorno`, `nm_retorno`, `status_code`, `dt_atualizacao_i4pro`

---

<a id="criterios-sucesso"></a>

## ✅ Critérios de sucesso e relatórios

- Sucesso (DW): quando há registros novos e a inserção em `dim_alocacao_analista_sinistro` conclui sem erro.
- Sucesso (i4Pro): retorno da API com `cd_retorno == 0` e `status_code` esperado; o DataFrame de resultados (`df_resultado`) é impresso apenas quando não é nulo e não está vazio.
- Sem registros novos: imprime `Nenhum sinistro novo para inserir.` e não tenta inserir.

---
<a id="duvidas"></a>
## ❓ Dúvidas frequentes e troubleshooting

<details markdown="1">
<summary>Ver respostas</summary>

- “A validação passa, mas não há inserções.”
	- Verifique se existem sinistros elegíveis para os ramos em `DEMAIS_RAMOS`.
	- Confirme se `df_sinistros_novos` está vindo com linhas e se não são sinistros já alocados anteriormente.

- “Erro de percentuais.”
	- Garanta que a soma das colunas de analistas seja **100% por `nr_ramo`** na aba `ramos`.

- “Variáveis de ambiente não encontradas.”
	- Revise o `.env` e os nomes esperados: `USER_PROD`, `PASSWORD_PROD`, `USER_DW_BI`, `PASSWORD_DW_BI`, `USER_EMAIL_BI`, `PASSWORD_EMAIL_BI`, `URL_PROD`, `URL_HOMOLOG`.

- “Não encontra a planilha.”
	- Confirme acesso ao `\\Awsseg130006\ALOCACAO_SINISTRO_POR_ANALISTA\DEMAIS_RAMOS\demais_ramos.xlsx` e permissões de rede.

- “Falha de conexão ODBC/SQL Server.”
	- Confirme que o driver `{ODBC Driver 18 for SQL Server}` está instalado e que há conectividade com os servidores.

</details>

---

<a id="contato"></a>

## 📞 Contato

Para dúvidas, sugestões ou reportar problemas:

| Canal | Informação |
|-------|------------|
| 📧 **Email** | [usrpbi@kovr.com.br](mailto:usrpbi@kovr.com.br) |
<!-- | :material-microsoft-teams: **Teams** | Canal "Equipe de Dados" | -->

## 👥 Contribuidores

- **Lucas Silva** - lucas.silva@kev.tech


<!-- ---

## Última atualização

> **Data:** 05/03/2026  
> **Responsável:** Lucas Silva Pereira -->



