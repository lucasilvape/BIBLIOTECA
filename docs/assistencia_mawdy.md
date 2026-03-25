# Assistência Mawdy

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Poetry](https://img.shields.io/badge/Poetry-60A5FA?style=for-the-badge&logo=poetry&logoColor=white) ![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white) ![SFTP](https://img.shields.io/badge/SFTP-FF9800?style=for-the-badge&logo=gnubash&logoColor=white)

> Pipeline ETL automatizado para extração, normalização e envio de dados de clientes e propostas do  **PICPAY VIDA**, gerando arquivos de layout fixo e transmitindo-os via SFTP.

---

## ✨ Funcionalidades

- **Extração de dados** de clientes e propostas diretamente do banco de dados PostgreSQL via query SQL parametrizada
- **Limpeza e normalização** de dados: remoção de acentos, conversão para maiúsculas e eliminação de quebras de linha
- **Formatação de campos** com padding fixo pelos tipos `AN` (alfanumérico) e `NU` (numérico) definidos no layout da seguradora
- **Geração de arquivo TXT posicional** com cabeçalho (70 caracteres) + registros de dados (1.125 caracteres por linha)
- **Nomeação automática** do arquivo de saída no padrão `PICPAY_FYYYYMMDDX.TXT`
- **Envio automatizado via SFTP** utilizando o protocolo SSH com autenticação por usuário e senha
- **Suporte a múltiplos ambientes**: `PRODUCAO` e `HOMOLOGACAO`, via parâmetro na função principal
- **Módulo `tools/conexao_postgres.py`** com utilitários de conexão PostgreSQL (COPY, índices, delete/truncate)

<!-- ---

## 🛠️ Tecnologias

| Biblioteca       | Versão          | Propósito                                  |
|------------------|-----------------|--------------------------------------------|
| Python           | ≥ 3.11          | Linguagem principal                        |
| Pandas           | ≥ 2.3.3, < 3.0  | Processamento e manipulação de DataFrames  |
| Psycopg2         | ≥ 2.9.11, < 3.0 | Driver de conexão com PostgreSQL           |
| Paramiko         | ≥ 4.0.0, < 5.0  | Cliente SFTP/SSH para envio de arquivos    |
| python-dotenv    | ≥ 0.9.9         | Carregamento de variáveis de ambiente      |
| Poetry           | ≥ 2.0.0         | Gerenciamento de dependências e build      | -->

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Python 3.11+](https://www.python.org/downloads/)
- [Poetry 2.0+](https://python-poetry.org/docs/#installation)
- Acesso ao banco de dados **PostgreSQL** de origem
- Acesso ao servidor **SFTP** de destino da seguradora
- *(Opcional)* ODBC Driver 18 for SQL Server — apenas para uso do módulo `tools/conexao_sqlserver.py`

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/assistencia-mawdy.git
cd assistencia-mawdy
```

### 2. Instale as dependências

```bash
poetry install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto copiando o exemplo abaixo:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as suas credenciais.

---

## ⚙️ Configuração

Crie o arquivo `.env` na raiz do projeto com as seguintes variáveis:

```dotenv
# ─── PostgreSQL ───────────────────────────────────────────────
PG_DB=nome_do_banco
PG_HOST=endereco_do_servidor
PG_USER=usuario
PG_PASSWORD=senha
PG_PORT=5432

# ─── SFTP ─────────────────────────────────────────────────────
SFTP_HOST=endereco_do_sftp
SFTP_USUARIO=usuario_sftp
SFTP_PASSWORD=senha_sftp
SFTP_PORTA=22
```

> **Atenção:** Nunca versione o arquivo `.env`. Ele já está (ou deve estar) listado no `.gitignore`.

---

## ▶️ Uso

<details markdown="1">
<summary>Ver fluxo completo</summary>


### Executar o pipeline completo

```bash
poetry run python main.py
```

O processo executa as seguintes etapas internas:

**1. Conexão ao banco**  
Abre conexão com o PostgreSQL via `abrir_conexao_postgres()`, respeitando o parâmetro `ambiente` (`PRODUCAO` ou `HOMOLOGACAO`).

**2. Extração dos dados**  
Roda a `QUERY_SQL` definida em `main.py` via `pd.read_sql()` e retorna um DataFrame com os registros cujo `info_responsecodecompra = '200'`.

**3. Tratamento do DataFrame**  
Aplica `trata_df()`, que:
- Substitui quebras de linha (`\n`, `\r`, `\t`) em todo o DataFrame por espaço
- Adiciona campos fixos obrigatórios: `numero_contrato`, `versao_contrato`, `nome_estipulante`, `valor_limite_funeral`
- Preenche todos os campos opcionais ausentes com string vazia, garantindo que todos os campos do layout existam

**4. Normalização campo a campo**  
Para cada campo do layout, `formatar_campo()` + `normalizar_texto()` aplica em sequência:
1. Conversão para MAIÚSCULAS
2. Remoção de espaços extras e quebras de linha residuais via regex (`\s+` → `' '`)
3. Remoção de acentos (via `unicodedata.normalize` + encode ASCII)
4. Remoção de caracteres especiais (mantém apenas `A-Z`, `0-9`, espaço, `@` e `.`)
5. Preenchimento com espaços à direita (tipo `AN`) ou zeros à esquerda (tipo `NU`) até o tamanho exato do campo

**5. Geração do arquivo TXT**  
Cria o arquivo `PICPAY_F{YYYYMMDD}1.TXT` no diretório de destino com:
- 1ª linha: cabeçalho com exatamente **70 caracteres**
- Demais linhas: 1 registro por linha com exatamente **1.125 caracteres**

> Linhas com tamanho incorreto são descartadas com aviso no console.

**6. Envio via SFTP** *(se `sftp_params` configurado)*  
Conecta via `paramiko.SSHClient`, realiza upload do arquivo para o caminho remoto e encerra a sessão SSH.

**7. Encerramento**  
A conexão com o banco é sempre fechada no bloco `finally`, independentemente de erros.

</details>

<!-- --- -->
<!-- 
## 📁 Estrutura do Projeto

```
assistencia-mawdy/
│
├── main.py                  # Orquestrador principal do pipeline ETL
├── conexao.py               # Classes de configuração de conexões (PostgreSQL e SFTP)
├── funcoes.py               # Lógica central: extração, normalização, formatação e envio
├── pyproject.toml           # Dependências e configurações do projeto (Poetry)
│
├── tools/                   # Módulo utilitário reutilizável
│   ├── conexao_postgres.py  # Conector PostgreSQL ← utilizado pelo pipeline principal
│   ├── conexao_mongo.py     # Conector MongoDB (opcional, não utilizado pelo pipeline principal)
│   ├── conexao_sqlserver.py # Conector SQL Server (opcional, não utilizado pelo pipeline principal)
│   ├── config_loader.py     # Parser de argumentos CLI (opcional)
│   └── funcoes_gerais.py    # Utilitários: datas, UUID, limpeza de diretórios, schemas
│
├── src/
│   └── assistencia_mawdy/   # Pacote instalável do projeto
│       └── __init__.py
│
└── tests/                   # Diretório de testes
    └── __init__.py
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

 
