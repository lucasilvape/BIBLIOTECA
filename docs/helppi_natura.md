<div align="center">

# Assistência Helppi Natura

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Poetry](https://img.shields.io/badge/Poetry-2.x-60A5FA?style=for-the-badge&logo=poetry&logoColor=white)](https://python-poetry.org/)
[![Pandas](https://img.shields.io/badge/Pandas-2.x-150458?style=for-the-badge&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-psycopg2-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.psycopg.org/)
[![SFTP](https://img.shields.io/badge/SFTP-Paramiko_4.x-2E7D32?style=for-the-badge&logo=openssh&logoColor=white)](https://www.paramiko.org)

> Pipeline ETL para extração e normalização de dados de apólices de seguro residencial Natura do sistema **Innoveo**, gerando arquivos CSV datados e transmitindo-os via SFTP ao parceiro **Kovr/Fácil Seguro**.

</div>

---

## ✨ Funcionalidades

- **Extração de dados via PostgreSQL**: consultas ao banco Innoveo com CTEs que unificam bilhetes de pagamento Natura e Natura+PicPay

- **Classificação automática de movimentos**:

  - `C` — Contratação: apólices com início de assistência posterior à data atual

  - `A` — Ativo: apólices dentro da janela de vigência

  - `S` — Suspensão: certificados com parcelas vencidas há mais de 5 dias e status pendente

- **Mapeamento de coberturas** com base no código Kovr: `Assistência Essencial` ou `Assistência Ampliada`

- **Geração de CSV** no padrão do parceiro Fácil Seguro (separador `;`, encoding UTF-16)

- **Entrega via SFTP**: envio automático do arquivo gerado com autenticação por chave RSA privada

- **Gerenciamento de credenciais**: variáveis de ambiente via `.env` (python-dotenv), sem credenciais hardcoded

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Python 3.11+](https://www.python.org/downloads/)

- [Poetry 2.0+](https://python-poetry.org/docs/#installation)

- Acesso ao banco de dados **PostgreSQL** (Innoveo) com as tabelas:

  - `innoveo_natura_residencial_infos`

  - `innoveo_natura_residencial_parcelas`

  - `innoveo_picpay_residencial_parcelas`

- Acesso ao servidor **SFTP** de destino do parceiro Kovr

- Arquivo de chave privada RSA (`.pem` ou equivalente)

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd helppi-natura
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
# ─── PostgreSQL (Innoveo) ─────────────────────────────────────
PG_DB=
PG_HOST=
PG_USER=
PG_PASSWORD=
PG_PORT=

# ─── SFTP ─────────────────────────────────────────────────────
SFTP_HOST=
SFTP_USUARIO=
SFTP_CHAVE=       # Caminho absoluto para o arquivo de chave RSA
SFTP_DIR=         # Diretório remoto de destino
SFTP_PORTA=
```

> **Atenção:** Nunca versione o arquivo `.env`. Ele já está (ou deve estar) listado no `.gitignore`.

---

## ▶️ Uso

Execute o pipeline principal com o comando:

```bash
poetry run python hellpi_natura.py
```

O arquivo gerado segue o padrão de nomenclatura:

```
Kovr_Helppi_Natura_YYYYMMDD_HHMM.csv
```

<details>
<summary>Ver fluxo completo do pipeline</summary>

### 🏠 Pipeline Principal (`hellpi_natura.py`)

**1. Conexão ao banco**  
Abre conexão com o PostgreSQL (Innoveo) via `psycopg2` com as credenciais do `.env`.

**2. Extração dos dados**  
Executa uma query com CTEs que:

- Identifica bilhetes sem parcelas registradas na tabela Natura

- Busca as parcelas correspondentes via PicPay

- Consolida bilhetes Natura e Natura+PicPay em um único resultado via `UNION ALL`

**3. Renomeação e filtragem por vigência**  
Renomeia as colunas para o padrão Fácil Seguro e remove apólices com `dt_fim_vigencia_end` anterior à data de hoje.

**4. Classificação de movimentos**  
Calcula `dt_inicio_assist = dt_ini_vigencia_end + 1 dia` e classifica:

- `C` — se `dt_inicio_assist` for posterior à data atual (nova contratação)

- `A` — demais casos (apólice ativa)

- `S` — se houver parcelas vencidas há mais de 5 dias com status `'Parcela a vencer'`

**5. Enriquecimento dos dados**  
Adiciona campos fixos exigidos pelo parceiro: `tipo_endosso`, `cia`, `plataforma`, `tipo_cobertura`, `pais_risco`, `dt_emissao` e `cod_facil` (mapeado a partir do `cod_kovr`).

**6. Geração e envio**  
Salva o CSV com separador `;` e encoding UTF-16 no caminho de rede configurado e o transmite via SFTP com autenticação por chave RSA.

</details>

---

## 📁 Estrutura do Projeto

```
helppi-natura/
├── conexoes.py                   # Classes de configuração do banco e SFTP (via variáveis de ambiente)
├── funcoes.py                    # Funções utilitárias: envio SFTP e verificação de vencimento
├── hellpi_natura.py              # Script principal do pipeline ETL
├── helppi_natura_notebook.ipynb  # Notebook para exploração e desenvolvimento
├── pyproject.toml                # Configuração do projeto e dependências (Poetry)
├── .env                          # Variáveis de ambiente (não versionado)
└── src/
    └── assistencia_helppi_natura/
        └── __init__.py
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

- **Matheus Araujo** - Matheus.Oliveira@kovr.com.br

<!-- ---

## 🕐 Última atualização

> **Data:** 05/03/2026  
> **Responsável:** Lucas Silva Pereira -->
