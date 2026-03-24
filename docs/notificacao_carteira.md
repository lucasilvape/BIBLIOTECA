# 📊 Notificação de Carteira — Extrator & Notificador Automático

![Python](https://img.shields.io/badge/PYTHON-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/DATA-PANDAS-150458?style=flat-square&logo=pandas&logoColor=white)
![SQL Server](https://img.shields.io/badge/DB-SQL%20SERVER-CC2927?style=flat-square&logo=microsoftsqlserver&logoColor=white)
![XlsxWriter](https://img.shields.io/badge/REPORT-XLSXWRITER-217346?style=flat-square&logo=microsoftexcel&logoColor=white)
![Outlook](https://img.shields.io/badge/EMAIL-OUTLOOK%20SMTP-0078D4?style=flat-square&logo=microsoftoutlook&logoColor=white)
![Poetry](https://img.shields.io/badge/DEPS-POETRY-60A5FA?style=flat-square&logo=poetry&logoColor=white)
![dotenv](https://img.shields.io/badge/ENV-DOTENV-ECD53F?style=flat-square&logo=dotenv&logoColor=black)

> **Sistema automatizado de gestão de inadimplência e adimplência** para a KOVR Seguradora.
> Extrai a carteira de parcelas em aberto e a vencer, gera relatórios Excel personalizados e envia notificações por e-mail para corretores, assessorias, congêneres e gestores — tudo de forma automática e rastreável.

---

## 🚀 Stack Tecnológica

| Categoria              | Tecnologia                                      |
|------------------------|-------------------------------------------------|
| **Linguagem**          | Python 3.11+                                    |
| **Dados**              | Pandas, NumPy                                   |
| **Banco de Dados**     | SQL Server                                      |
| **Relatórios**         | XlsxWriter (`.xlsx` com múltiplas abas)         |
| **E-mail**             | smtplib + email (stdlib) · Outlook SMTP 587     |
| **Variáveis Ambiente** | python-dotenv                                   |
| **Utilitários**        | holidays · tqdm · logging                       |
| **Gerenciador Deps.**  | Poetry (`pyproject.toml`)                       |

---

## ✨ Principais Funcionalidades

- **Extração inteligente de carteira** — consulta SQL Server e filtra parcelas em aberto e a vencer dos produtos configurados para notificação

- **Classificação automática** — categoriza cada parcela como *adimplente* ou *inadimplente*, com faixas de atraso e cálculo de dias úteis (feriados nacionais inclusos)

- **Geração de relatórios Excel** — para cada destinatário é gerado um arquivo `.xlsx` com **3 abas**:

  | Aba | Conteúdo |
  |-----|----------|
  | 📋 **Carteira** | Visão completa — todas as parcelas (adimplentes e inadimplentes) |
  | 🔴 **Inadimplência** | Apenas parcelas **vencidas** |
  | 🟢 **Adimplência** | Apenas parcelas **em dia ou a vencer** |

- **Envio de e-mail personalizado** — corpo HTML diferente para corretores, congêneres e gestores, com relatório em anexo e sumário financeiro (prêmio e comissão)

- **Rastreabilidade completa** — log em arquivo com timestamp + registro automático de execução no banco de dados

---

## 🗂️ Estrutura do Projeto

```
NOTIFICACAO_CARTEIRA/
├── main.py              # Orquestrador principal — executa todo o fluxo
├── config.py            # Colunas do relatório, template de e-mail e regras de negócio
├── conexao_banco.py     # Módulo de conexão com SQL Server
├── autenticacao.py      # Módulo de autenticação
├── .env                 # ⚠️ Credenciais (NÃO versionar)
├── pyproject.toml       # Dependências gerenciadas pelo Poetry
└── requirements.txt     # Alternativa para instalação via pip
```

---

## ⚙️ Como Rodar o Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/KovrSeguradoraBI/NOTIFICACAO_CARTEIRA.git
cd NOTIFICACAO_CARTEIRA
```

### 2. Instale as dependências

**Com Poetry (recomendado):**

```bash
poetry install --no-root
```

**Criar a venv dentro do projeto:**

```bash
poetry config virtualenvs.in-project true
```

**Com pip (alternativo):**

```bash
pip install -r requirements.txt
```

### 3. ⚠️ Configure o arquivo `.env` (obrigatório)

**A execução do projeto depende obrigatoriamente da criação do arquivo `.env`** na raiz do projeto. Sem ele, a conexão com os bancos de dados e o envio de e-mails irão falhar.

Crie o arquivo `.env` e preencha com suas credenciais:

```env
# Banco de dados produção
USER_PROD=seu_usuario
PASSWORD_PROD=sua_senha

# Data Warehouse BI
USER_DW_BI=seu_usuario_dw
PASSWORD_DW_BI=sua_senha_dw

# Conta de e-mail para envio das notificações
USER_EMAIL_BI=seu_email@dominio.com.br
PASSWORD_EMAIL_BI=sua_senha_email
```

> **🔒 Segurança:** O `.env` **jamais deve ser versionado**. Confirme que ele está no `.gitignore` antes de qualquer commit.

### 4. Ajuste os parâmetros de execução

No início do `main.py`, verifique as variáveis:

| Variável      | Descrição                                    | Valor padrão                       |
|---------------|----------------------------------------------|------------------------------------|
| `AMBIENTE`    | Ambiente do banco de dados                   | `'producao_i4'` ou `'replica'`     |
| `SALVA_EXCEL` | Diretório de saída dos relatórios            | `C:\pasta_transitoria1\relatorios` |
| `log_dir`     | Diretório dos arquivos de log                | `C:\Users\{usuario}\Desktop\logs1` |

### 5. Execute

```bash
python main.py
```

---

## 📖 Como Usar

### Execução completa (produção)

```bash
# Ativa o ambiente virtual e executa (se estiver utilizando pip)
.venv\scripts\activate
python main.py

# Se estiver utilizando Poetry
poetry env activate
poetry run python main.py
```

O fluxo executado automaticamente é:

```
[1] Carrega produtos notificáveis (dim_produto)
       ↓
[2] Extrai carteira de parcelas em aberto (SQL Server)
       ↓
[3] Classifica situação + calcula faixas e dias úteis
       ↓
[4] Gera relatório .xlsx por corretor / congênere / gestor
       ↓
[5] Envia e-mail com relatório em anexo
       ↓
[6] Registra execução em log (arquivo + banco)
```

<!-- ### Execução por etapas (depuração)

Abra `notebook_extrator.ipynb` no Jupyter e execute célula a célula para inspecionar cada etapa sem disparar e-mails:

```bash
jupyter notebook notebook_extrator.ipynb
```

### Usando `replica` para testes

Para testar sem impacto em produção, altere a variável no `main.py`:

```python
AMBIENTE = 'replica'  # em vez de 'producao_i4'
``` -->

---

## 📁 Logs de Execução

Os logs são gerados automaticamente a cada execução com timestamp:

```
C:\Users\{seu_usuario}\Desktop\logs1\log_processamento_DDMMYYYY_HHMMSS.log
```

Cada log registra: início, etapas concluídas, erros (se houver), duração total e quantidade de destinatários processados.

---

<!-- ## 🤝 Como Contribuir

Contribuições são bem-vindas! Siga o fluxo abaixo:

1. **Fork** este repositório
2. Crie uma branch para sua feature ou correção:
   ```bash
   git checkout -b feat/nome-da-sua-feature
   ```

3. Faça suas alterações e **teste localmente** usando `AMBIENTE = 'replica'`
4. Confirme que os logs não apresentam erros
5. Abra um **Pull Request** descrevendo o que foi alterado e por quê

> **Dica:** Antes de mexer nas queries SQL ou no `config.py`, alinhe com o time de negócios — as regras de notificação têm impacto direto nos e-mails enviados para parceiros externos. -->

## 📌 Observações

- Os diretórios `SALVA_EXCEL` e `log_dir` são criados automaticamente se não existirem

- A pasta transitória de relatórios é limpa automaticamente ao final de cada execução

- O servidor SMTP utilizado é `smtp-mail.outlook.com` na porta `587` (STARTTLS)

---

## 📞 Contato

Para dúvidas, sugestões ou reportar problemas:

| Canal | Informação |
|-------|------------|
| **Email** | [usrpbi@kovr.com.br](mailto:usrpbi@kovr.com.br) |
<!-- | :material-microsoft-teams: **Teams** | Canal "Equipe de Dados" | -->

---

## 👥 Contribuidores

- **Lucas Silva** - lucas.silva@kev.tech

<!-- ---

## 🕐 Última atualização

> **Data:** 05/03/2026  
> **Responsável:** Lucas Silva Pereira -->