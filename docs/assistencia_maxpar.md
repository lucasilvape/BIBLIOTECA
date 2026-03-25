# Assistência Maxpar

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Poetry](https://img.shields.io/badge/Poetry-60A5FA?style=for-the-badge&logo=poetry&logoColor=white) ![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white) ![SQL%20Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white) ![SFTP](https://img.shields.io/badge/SFTP-FF9800?style=for-the-badge&logo=gnubash&logoColor=white)

> Pipeline ETL multi-ramo para extração e normalização de dados de apólices ativas dos sistemas **i4Pro** e **Innoveo**, gerando arquivos CSV datados e transmitindo-os via SFTP ao parceiro **Maxpar**.

---

## ✨ Funcionalidades

- **Extração multi-fonte**: consultas ao SQL Server (i4Pro ERP) via `pyodbc` e ao PostgreSQL (Innoveo) via `psycopg2`

- **Processamento por ramo de seguro**:

  - **Auto** — filtra apólices ativas, aplica franquia de 32 dias e classifica o tipo de movimentação (`I`, `C`, `A`)

  - **Patrimonial** — une dados de Incêndio e Fiança (i4Pro) com dados do Innoveo, filtra endossos cancelados

  - **Vida** — extrai apólices de vida, remove duplicatas, remove endossos cancelados e comprime o CSV em ZIP (LZMA)

- **Filtro de endossos cancelados**: identificação e exclusão de endossos revertidos antes da geração dos arquivos

- **Entrega via SFTP**: envio automático dos arquivos gerados com autenticação por chave RSA (`.ppk`)

- **Suporte a FTPS**: cliente FTP sobre TLS customizado com verificação de certificados (`certifi`)

- **Notificações por e-mail**: envio de e-mails via SMTP (Outlook), com suporte a HTML e anexos

- **Gerenciamento de credenciais**: variáveis de ambiente via `.env` (python-dotenv), sem credenciais hardcoded

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Python 3.11+](https://www.python.org/downloads/)

- [Poetry 2.0+](https://python-poetry.org/docs/#installation)

- [ODBC Driver 18 for SQL Server](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server)

- Acesso ao banco de dados **SQL Server** (i4Pro) e **PostgreSQL** (Innoveo)

- Acesso ao servidor **SFTP** de destino do parceiro Maxpar

- Arquivo de chave privada RSA (`.ppk`) em `arquivos_sftp/`

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd assistencia-maxpar
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
# ─── SQL Server (i4Pro / DW-BI) ───────────────────────────────
USER_PROD=
PASSWORD_PROD=
USER_DW_BI=
PASSWORD_DW_BI=

# ─── PostgreSQL (Innoveo) ─────────────────────────────────────
PG_HOST=
PG_DB=
PG_USER=
PG_PASSWORD=
PG_PORT=

# ─── SFTP ─────────────────────────────────────────────────────
SFTP_HOST=
SFTP_PORTA=
SFTP_USUARIO=
SFTP_CHAVE=       # Caminho absoluto para o arquivo .ppk
SFTP_DIR=         # Diretório remoto de destino

# ─── E-mail (Outlook SMTP) ────────────────────────────────────
USER_EMAIL_BI=
PASSWORD_EMAIL_BI=
```

> **Atenção:** Nunca versione o arquivo `.env`. Ele já está (ou deve estar) listado no `.gitignore`.

---

## ▶️ Uso

Cada ramo de seguro possui um script principal independente:

```bash
# Seguro Auto
poetry run python Auto/main_auto.py

# Seguro Patrimonial
poetry run python patrimonial/main_patrimonial.py

# Seguro Vida
poetry run python vida/main_vida.py
```

Os arquivos gerados seguem o padrão de nomenclatura:

```
F_KOVR_AUTO_YYYYMMDD.csv
F_KOVR_PATRIMONIAL_YYYYMMDD.csv
F_KOVR_VIDA_YYYYMMDD.csv
F_KOVR_VIDA_YYYYMMDD.zip    # versão comprimida do ramo Vida
```

<details markdown="1">
<summary>Ver fluxo completo por ramo</summary>

### 🚗 Auto (`Auto/main_auto.py`)

**1. Conexão ao banco**  
Abre conexão com o PostgreSQL (Innoveo) via `psycopg2` com as credenciais do `.env`.

**2. Extração dos dados**  
Executa duas queries: `innoveo_picpay_auto_infos` (dados da apólice e cliente) e `innoveo_picpay_auto_parcelas` (dados de vencimento e status das parcelas).

**3. Filtragem por vigência**  
Remove apólices cuja `DataFimVigencia` seja anterior à data de hoje.

**4. Aplicação da franquia de 32 dias**  
Calcula `DataInicioAssistencia = DataInicioVigencia + 32 dias`. Apólices ainda dentro da franquia recebem `TipoMovimentacao = 'C'`; as demais recebem `'I'`.

**5. Verificação de inadimplência**  
Bilhetes com parcelas vencidas há mais de 5 dias e ainda com status `'parcela a vencer'` são classificados como `'A'` (suspended).

**6. Geração e envio**  
Salva o CSV `F_KOVR_AUTO_YYYYMMDD.csv` no caminho de rede e o transmite via SFTP com autenticação por chave RSA.

---

### 🏠 Patrimonial (`patrimonial/main_patrimonial.py`)

**1. Busca de endossos cancelados**  
Executa `endossosCancelados()` no SQL Server para obter a lista de `id_endosso` com evento de estorno (`cd_evento = 104`).

**2. Extração Patrimonial i4Pro**  
Roda `fc_patrimonial_i4pro.fc_patrimonial()`: query no SQL Server que une Incêndio e Fiança, aplicando lógica de data snapshot para o dia corrente.

**3. Filtro de endossos cancelados**  
Remove do DataFrame todas as linhas cujo `id_endosso` conste na lista de estornos.

**4. Extração Patrimonial Innoveo**  
Roda `fc_patrimonial_innoveo.fc_patrimonial_innoveo()`: query no PostgreSQL para dados complementares do Innoveo.

**5. Consolidação**  
Concatena os dois DataFrames via `pd.concat` e normaliza o campo `Apolice` para `Int64`.

**6. Geração e envio**  
Salva o CSV `F_KOVR_PATRIMONIAL_YYYYMMDD.csv` e o transmite via SFTP.

---

### 💚 Vida (`vida/main_vida.py`)

**1. Busca de endossos cancelados**  
Mesma lógica do ramo Patrimonial via `endossosCancelados()`.

**2. Extração Vida i4Pro**  
Roda `fc_vida_i4pro.fc_vida()`: query com CTEs no SQL Server (`vida_seg_i4pro`) para consolidar coberturas, endossos e vigências.

**3. Limpeza**  
Remove endossos cancelados e elimina duplicatas via `drop_duplicates()`.

**4. Compressão**  
Escreve o CSV em memória (`io.StringIO`) e comprime com `zipfile.ZIP_LZMA`, gerando `F_KOVR_VIDA_YYYYMMDD.zip`. Inclui retry automático em caso de falha de escrita em rede.

**5. Geração e envio**  
Salva o CSV e o ZIP no caminho de rede e transmite o CSV via SFTP.

</details>

<!-- ---

## 📁 Estrutura do Projeto

```
assistencia-maxpar/
├── autenticacao.py          # Mapa de conexões com bancos de dados
├── pyproject.toml           # Configuração do projeto e dependências (Poetry)
├── .env                     # Variáveis de ambiente (não versionado)
├── arquivos_sftp/           # Chave privada SFTP
├── Auto/
│   ├── fc_auto_innoveo.py   # Extração e transformação — ramo Auto (Innoveo)
│   └── main_auto.py         # Orquestrador do ramo Auto
├── patrimonial/
│   ├── fc_patrimonial_i4pro.py    # Extração — Patrimonial i4Pro
│   ├── fc_patrimonial_innoveo.py  # Extração — Patrimonial Innoveo
│   └── main_patrimonial.py        # Orquestrador do ramo Patrimonial
├── vida/
│   ├── fc_vida_i4pro.py     # Extração e transformação — ramo Vida
│   └── main_vida.py         # Orquestrador do ramo Vida
└── funcoes/
    ├── conexao_banco.py     # Classe de conexão SQL Server (pyodbc)
    ├── conexao_pg_sftp.py   # Configurações PostgreSQL e SFTP via .env
    └── functions.py         # Utilitários: SFTP, FTPS, e-mail, helpers SQL
``` -->

## 📞 Contato

Para dúvidas, sugestões ou reportar problemas:

| Canal | Informação |
|-------|------------|
| **Email** | [usrpbi@kovr.com.br](mailto:usrpbi@kovr.com.br) |
<!-- | :material-microsoft-teams: **Teams** | Canal "Equipe de Dados" | -->

---

## 👥 Contribuidores

- **Matheus Araujo** - Matheus.Oliveira@kovr.com.br

<!-- ---

## 🕐 Última atualização

> **Data:** 05/03/2026  
> **Responsável:** Lucas Silva Pereira -->
