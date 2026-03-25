# RD Diários — Automações de Relatórios de Seguros

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Poetry](https://img.shields.io/badge/Poetry-60A5FA?style=for-the-badge&logo=poetry&logoColor=white) ![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white) ![SQL%20Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white) ![SFTP](https://img.shields.io/badge/SFTP-FF9800?style=for-the-badge&logo=gnubash&logoColor=white)

> Suite de automações Python para geração de relatórios diários, monitoramento de dados e backup de tabelas críticas no contexto de operações de seguro  conectando os sistemas **i4Pro**, **DW/BI** e **Innoveo** com notificações automatizadas por e-mail.

---

## ✨ Funcionalidades

- **Extração multi-fonte**: consultas ao SQL Server (i4Pro / DW-BI) via `pyodbc` e ao PostgreSQL (Innoveo) via `psycopg2`

- **Monitoramento de Cosseguro Cedido**: extrai baixas de parcelas do dia anterior e envia relatório Excel por e-mail aos destinatários configurados

- **Validação I4 vs BI**: compara movimentos de produção do i4Pro com o DW/BI, alertando por e-mail sobre divergências acima de R$ 10

- **Backup diário de sinistros**: exporta em CSV as tabelas de status de sinistros, alocação de analistas e movimentação de terceiros, enviando os arquivos por e-mail

- **Conciliação de emissões Innoveo**: identifica bilhetes (produtos demais e PicPay Cyber) sem apólice associada e busca a apólice correspondente no i4Pro em lotes configuráveis

- **Relatórios de Prestamista com Sorteio**: gera relatório completo com chave de sorteio, comissionamento e dados de vigência, publicando no caminho de rede compartilhado

- **Relatório de Emissões Viagem**: consolida apólices ativas de seguro viagem com detalhamento de comissões de corretagem e agenciamento

- **Relatório Prestamista Sem Parar**: gera relatório com valor de IS e dados de sorteio para o produto Prestamista Sem Parar

- **Notificações por e-mail**: envio automático via SMTP (Outlook) com templates HTML e suporte a anexos

- **Gerenciamento de credenciais**: variáveis de ambiente via `.env` (python-dotenv), sem credenciais hardcoded

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Python 3.11+](https://www.python.org/downloads/)

- [Poetry 2.0+](https://python-poetry.org/docs/#installation)

- [ODBC Driver 18 for SQL Server](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server)

- Acesso VPN à rede interna (os servidores de banco são endereços IP privados)

- Acesso ao caminho de rede `\\10.12.0.125\universal` para publicação dos relatórios RD

- Arquivo `.env` configurado na raiz do projeto (veja seção abaixo)

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd 00_RD_DIARIOS
```

### 2. Instale as dependências

```bash
poetry install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as suas credenciais.

---

## ⚙️ Configuração

Crie o arquivo `.env` na raiz do projeto com as seguintes variáveis:

```dotenv
#  SQL Server  Produção (i4Pro) 
USER_PROD=
PASSWORD_PROD=

#  SQL Server  DW/BI 
USER_DW_BI=
PASSWORD_DW_BI=

#  PostgreSQL (Innoveo) 
PG_HOST=
PG_PORT=
PG_DB=
PG_USER=
PG_PASSWORD=

#  PostgreSQL  Homologação (opcional) 
PG_HOMOLOG_HOST=
PG_HOMOLOG_PORT=
PG_HOMOLOG_DB=
PG_HOMOLOG_USER=
PG_HOMOLOG_PASSWORD=

#  E-mail (Outlook SMTP) 
USER_EMAIL_BI=
PASSWORD_EMAIL_BI=
```

> **Atenção:** Nunca versione o arquivo `.env`. Ele já está (ou deve estar) listado no `.gitignore`.

---

## ▶️ Uso

Cada automação possui um script principal independente. Execute via Poetry:

```bash
# Monitoramentos (MN)
poetry run python MN_01_BAIXAS_COSSEGURO_CEDIDO.py
poetry run python MN_02_PREMIOI4_PREMIOBI.py
poetry run python MN_03_BACKUP_TABELAS_MOVIMENTACAO.py
poetry run python MN_04_EMISSOES_INNOVEO.py

# Relatórios Diários (RD)
poetry run python RD_01_PRESTAMISTA_SORTEIO.py
poetry run python RD_02_EMISSAO_VIAGEM.py
poetry run python RD_03_PRESTAMISTA_SEMPARAR.py
```

Os scripts também estão disponíveis como Jupyter Notebooks na pasta `notebooks/` para exploração e desenvolvimento interativo.

<details markdown="1">
<summary>Ver descrição detalhada por script</summary>

###  MN_01  Baixas Cosseguro Cedido

**1. Configuração do período**
Define o dia anterior com base em `DIAS_RETROATIVOS` (padrão: 1 dia).

**2. Extração**
Executa query no SQL Server unindo `corp_endosso`, `corp_endosso_cosseguro`, `corp_parc_movto` e tabelas de cadastro para obter as baixas do dia.

**3. Geração do arquivo**
Exporta o resultado para um arquivo Excel (`Recebimento de parcelas.xlsx`) em `C:\ARQUIVOS_TRANSITORIOS_AUTOMACAO`.

**4. Envio**
Envia o arquivo por e-mail via SMTP Outlook para os destinatários configurados.

---

###  MN_02  Validação I4 vs BI

**1. Busca da data máxima**
Consulta a maior `dt_movimento` existente na tabela `corp_parc_movto_emissao_agrup` (DW/BI).

**2. Comparação**
Realiza CTE comparando o valor retido no i4 (`vl_retido_i4`) com o valor armazenado no BI (`vl_retido`), calculando a diferença.

**3. Alerta**
Se existirem divergências acima de R$ 10 a partir de 2022, envia e-mail de **ERRO**; caso contrário, envia e-mail de **SUCESSO**.

---

###  MN_03  Backup Tabelas Movimentação

**1. Extração**
Lê três tabelas do DW/BI: `movimentacao_status_sinistro`, `movimentacao_terceiros_sinistro` e `dim_alocacao_analista_sinistro`.

**2. Exportação**
Gera três arquivos CSV com separador `|` e encoding `cp1252`.

**3. Envio**
Envia cada CSV como anexo em e-mails separados via SMTP Outlook.

---

###  MN_04  Conciliação Emissões Innoveo

**1. Extração Innoveo**
Consulta PostgreSQL buscando bilhetes sem `cd_apolice` nas tabelas `innoveo_financeiro_demais` e `innoveo_picpay_cyber_infos`.

**2. Busca em lotes no i4Pro**
Monta CTEs dinamicamente com os bilhetes encontrados e consulta o SQL Server em pacotes de até 100.000 registros.

**3. Conciliação e exportação**
Une os resultados, gera CSV consolidado e salva em `C:\ARQUIVOS_TRANSITORIOS_AUTOMACAO`.

---

###  RD_01, RD_02, RD_03  Relatórios Diários

**Fluxo comum aos três relatórios:**

**1. Limpeza do diretório de rede**
Remove e recria o diretório de destino em `\\10.12.0.125\universal\RELATORIO_*`.

**2. Extração**
Executa queries no SQL Server com joins em `corp_apolice`, `corp_endosso`, `corp_item_vida`, `corp_pessoas` e tabelas de comissão.

**3. Exportação**
Gera os arquivos (`.xlsx` ou `.csv`) em `C:\ARQUIVOS_TRANSITORIOS_AUTOMACAO` e copia para o caminho de rede compartilhado.

</details>

---

## 📁 Estrutura do Projeto

```
00_RD_DIARIOS/
├── MN_01_BAIXAS_COSSEGURO_CEDIDO.py     # Baixas cosseguro cedido
├── MN_02_PREMIOI4_PREMIOBI.py           # Validação I4 vs BI
├── MN_03_BACKUP_TABELAS_MOVIMENTACAO.py # Backup tabelas sinistros
├── MN_04_EMISSOES_INNOVEO.py            # Conciliação emissões Innoveo
├── RD_01_PRESTAMISTA_SORTEIO.py         # Relatório prestamista c/ sorteio
├── RD_02_EMISSAO_VIAGEM.py              # Relatório emissões viagem
├── RD_03_PRESTAMISTA_SEMPARAR.py        # Relatório prestamista sem parar
├── pyproject.toml                        # Configuração do projeto (Poetry)
├── .env                                  # Variáveis de ambiente (não versionado)
├── notebooks/                            # Versões Jupyter dos scripts
└── tolls/                                # Módulos utilitários internos
    ├── autenticacao.py                   # Mapeamento de conexões (via .env)
    ├── conexao_banco.py                  # Conexão SQL Server via pyodbc
    ├── conexao_postgres.py               # Conexão PostgreSQL via psycopg2
    ├── conexao_banco_logs.py             # Conexão banco de logs
    ├── enviar_email.py                   # Envio de e-mails via SMTP Outlook
    └── funcoes.py                        # Funções utilitárias diversas
```

---

## 📞 Contato

Para dúvidas, sugestões ou reportar problemas:

| Canal | Informação |
|-------|------------|
| **Email** | [usrpbi@kovr.com.br](mailto:usrpbi@kovr.com.br) |
<!-- | :material-microsoft-teams: **Teams** | Canal "Equipe de Dados" | -->

---

## 👥 Contribuidores

- **Thiago Ramalho** - Thiago.Ramalho@kovr.com.br
- **Lucas Silva** - lucas.silva@kev.tech
---

<!-- ## 🕐 Última atualização

> **Data:** 10/03/2026  
> **Responsável:** Lucas Silva Pereira -->