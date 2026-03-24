<div align="center">

# Ofício SUSEP — Automação de Respostas Regulatórias

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Poetry](https://img.shields.io/badge/Poetry-2.x-60A5FA?style=for-the-badge&logo=poetry&logoColor=white)](https://python-poetry.org/)
[![Pandas](https://img.shields.io/badge/Pandas-2.x-150458?style=for-the-badge&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-ODBC_18-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![PyMuPDF](https://img.shields.io/badge/PyMuPDF-1.x-00897B?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](https://pymupdf.readthedocs.io/)
[![dotenv](https://img.shields.io/badge/dotenv-python--dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=black)](https://pypi.org/project/python-dotenv/)

> Automatiza o processamento de ofícios da SUSEP: extrai CPFs e CNPJs de PDFs, consulta múltiplos bancos de dados de seguros e capitalização, e gera relatórios Excel detalhados com envio automático por e-mail.

</div>

---

## ✨ Funcionalidades

- **Leitura automática de PDFs**: varre uma pasta de rede em busca de ofícios em formato PDF e extrai todos os CPFs e CNPJs presentes via expressão regular

- **Consulta a múltiplos bancos de dados**: para cada CPF/CNPJ encontrado, consulta três bases de produção (`re_i4pro`, `vida_seg_i4pro`, `vida_i4pro`) e uma base de capitalização (`cap`)

- **Levantamento completo do histórico do segurado**: reúne informações sobre:

  - **Pessoas** — cadastro por CPF/CNPJ e nome

  - **Apólices** — individuais e coletivas (produto, ramo, vigência, status)

  - **Sinistros** — com detalhamento de reservas, indenizações, despesas, honorários, ressarcimentos e salvados

  - **Terceiros** — envolvidos em sinistros

  - **Premiações de capitalização**

- **Geração de relatório Excel multi-abas**: produz um arquivo `.xlsx` com abas de Resumo, Apólices, Sinistros, Sinistros de Terceiros e Capitalização

- **Envio automatizado de e-mail**: envia o relatório como anexo para a lista de destinatários configurada via SMTP (Outlook), com corpo em HTML responsivo

- **Gestão de arquivos processados**: move os PDFs para a subpasta `PROCESSADOS` ao final de cada execução

- **Registro de logs**: insere log de execução (data, processo, quantidade de registros, tempo) na tabela `logs_automacoes` do banco `kovr_logs_processos`

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Python 3.11+](https://www.python.org/downloads/)

- [Poetry 2.0+](https://python-poetry.org/docs/#installation)

- [ODBC Driver 18 for SQL Server](https://learn.microsoft.com/pt-br/sql/connect/odbc/download-odbc-driver-for-sql-server)

- Acesso à rede interna (servidores SQL Server configurados em `autenticacao.py`)

- Acesso à pasta de rede `\\awsseg130006\OFICIO_SUSEP` com a subpasta `ARQUIVO_PDF` populada com os PDFs a processar

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd oficio-susep
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
# ─── SQL Server (i4Pro / Produção) ────────────────────────────
USER_PROD=
PASSWORD_PROD=

# ─── SQL Server (DW-BI / Logs) ────────────────────────────────
USER_DW_BI=
PASSWORD_DW_BI=

# ─── E-mail (Outlook SMTP) ────────────────────────────────────
USER_EMAIL_BI=
PASSWORD_EMAIL_BI=
```

> **Atenção:** Nunca versione o arquivo `.env`. Ele já está (ou deve estar) listado no `.gitignore`.

---

## ▶️ Uso

### 1. Deposite os PDFs na pasta de entrada

Copie os ofícios em PDF para a pasta de rede:

```
\\awsseg130006\OFICIO_SUSEP\ARQUIVO_PDF\
```

### 2. Execute a automação

```bash
poetry run python Automacao_Susep.py
```

Os arquivos gerados seguem o padrão de nomenclatura:

```
{nome_do_pdf} processado em DD-MM-AA hHH mMM sSS.xlsx
```

<details>
<summary>Ver fluxo completo de execução</summary>

### 📄 Automacao_Susep.py

**1. Inicialização**  
Cria automaticamente as subpastas `PROCESSADOS` e `RESULTADO` na pasta de rede, caso não existam. Lista todos os arquivos `.pdf` presentes em `ARQUIVO_PDF`.

**2. Extração de CPF/CNPJ do PDF**  
Para cada PDF encontrado, utiliza `PyMuPDF (fitz)` para ler o texto de todas as páginas e aplica expressões regulares para capturar CPFs (`\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b`) e CNPJs (`\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b`).

**3. Verificação de conteúdo**  
Se nenhum CPF ou CNPJ for encontrado no documento, o PDF é movido para `PROCESSADOS` e a execução é encerrada para aquele arquivo.

**4. Consulta à base de capitalização**  
Conecta ao banco `Tkgs_cap` e executa a query `fc_cap()` para identificar premiações de capitalização vinculadas aos CPFs extraídos.

**5. Consulta às bases i4Pro**  
Para cada um dos três bancos (`re_i4pro`, `vida_seg_i4pro`, `vida_i4pro`), executa em sequência:

- `fc_pessoas()` — localiza o cadastro de cada CPF/CNPJ

- `fc_apolices()` — busca apólices individuais e coletivas vinculadas às pessoas

- `fc_sinistros()` — levanta todos os sinistros com detalhamento financeiro

- `fc_terceiros()` — identifica terceiros envolvidos em sinistros (apenas `re_i4pro`)

**6. Consolidação e cruzamento**  
Concatena os resultados de todos os bancos, realiza merges entre os DataFrames e gera contagens por CPF (Qde_Apolices, Qde_Sinistros, Qde_Terceiros, Qde_Capitalizacao). Filtra apenas CPFs com ao menos um vínculo encontrado.

**7. Geração do Excel**  
Salva o relatório em `RESULTADO` com cinco abas: `Resumo`, `Apolices`, `Sinistros`, `Sinistros_Terceiro` e `Capitalizacao`.

**8. Envio de e-mail**  
Envia o arquivo Excel como anexo, com corpo em HTML, via SMTP (Outlook) para os destinatários configurados em `DESTINATARIOS`.

**9. Arquivamento e log**  
Move o PDF processado para `PROCESSADOS` e registra o log de execução (data, processo, quantidade de arquivos e tempo total) na tabela `logs_automacoes`.

</details>

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
- **Matheus Araujo** - Matheus.Oliveira@kovr.com.br
---

<!-- ## 🕐 Última atualização

> **Data:** 10/03/2026  
> **Responsável:** Lucas Silva Pereira -->