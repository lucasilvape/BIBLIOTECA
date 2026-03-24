<div align="center">

#  Sistema de Redistribuição de Sinistros


[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Poetry](https://img.shields.io/badge/Poetry-dependency%20manager-60A5FA?style=for-the-badge&logo=poetry&logoColor=white)](https://python-poetry.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-database-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Git](https://img.shields.io/badge/Git-version%20control-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com/)
![i4Pro API](https://img.shields.io/badge/i4Pro-API%20REST-0078D4?style=for-the-badge&logo=fastapi&logoColor=white)
[![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?style=for-the-badge&logo=jenkins&logoColor=white)](https://www.jenkins.io/)

</div>

---

## 📋 Sumário

- [📖 Descrição do Projeto](#-descrição-do-projeto)

- [🎯 Objetivos](#-objetivos)

- [🗂️ Estrutura do Projeto](#️-estrutura-do-projeto)

- [⚙️ Fluxo do Processo](#️-fluxo-do-processo)

- [🚀 Roadmap para Clonar e Executar o Projeto](#-roadmap-para-clonar-e-executar-o-projeto)

- [🔔 Notificações de Erro](#-notificações-de-erro)

- [📊 Relatório](#-relatório)

- [📞 Contato](#-contato)

---

## 📖 Descrição do Projeto
Este sistema foi desenvolvido para automatizar o processo de redistribuição de sinistros entre analistas. Ele realiza validações nos dados fornecidos, insere as informações no banco de dados e notifica os responsáveis em caso de erros ou falhas críticas.
Além disso, após o processamento com sucesso, o sistema **atualiza o analista responsável no i4Pro** e **registra logs** do retorno da API para auditoria.

---

## 🎯 Objetivos
- Garantir a integridade dos dados antes da inserção no banco.

- Automatizar o processo de redistribuição de sinistros.

- Enviar notificações por e-mail em caso de erros ou falhas.

- Atualizar o analista responsável no i4Pro utilizando o endpoint: "https://...Sinistro/AlteraResponsavelSinistro", após a inserção no banco.

- Registrar logs de cada tentativa de atualização no i4Pro (sucesso/erro).

---

## 🗂️ Estrutura do Projeto

| Arquivo | Descrição |
|---|---|
| **`main.py`** | Arquivo principal que orquestra o processo de redistribuição. |
| **`funcoes.py`** | Contém funções auxiliares para validação, inserção no banco e envio de e-mails. |
| **`conexao_banco.py`** | Gerencia a conexão com o banco de dados. |
| **`autenticacao.py`** | Gerencia a autenticação para envio de e-mails. |
| **`coberturas.xlsx`** | Arquivo de referência para validação de coberturas. |

---

## ⚙️ Fluxo do Processo

<details>
<summary>Ver fluxo completo</summary>

```
📂 Carregamento  →  ✅ Validações  →  💾 Inserção  →  🌐 API i4Pro  →  📋 Logs  →  📧 Notificações  →  📁 Movimentação
```

1. 📂 **Carregamento de Dados**:
   - Os arquivos de entrada são carregados da pasta configurada.

   - Os dados são lidos e preparados para validação.

2. ✅ **Validações**:
   - Verificação de colunas obrigatórias.

   - Validação de códigos de analistas.

   - Confirmação da existência de sinistros no banco de dados.

3. 💾 **Inserção no Banco**:
   - Os dados validados são inseridos na tabela `dim_alocacao_analista_sinistro`.

4. 🌐 **Atualização no i4Pro (API)**:
   - Para cada sinistro, é feita uma chamada HTTP **POST** para atualizar o analista responsável no i4Pro.

   - A URL utilizada depende do ambiente (`PRODUCAO` ou `HOMOLOGACAO`).

5. 📋 **Logs de Auditoria da Atualização i4Pro**:
   - Cada tentativa (sucesso ou falha) é registrada na tabela `atualiza_analista_sinistro_i4pro` (banco `logs_bi`), contendo:

     - `nr_sinistro`, `cd_analista` (analista enviado), `cd_retorno`, `nm_retorno`, `status_code`, `dt_atualizacao_i4pro`.

6. 📧 **Notificações**:
   - E-mails são enviados em caso de erros de validação ou falhas críticas.

7. 📁 **Movimentação de Arquivos**:
   - Após o processamento, os arquivos são movidos para a pasta de processados.
</details>

---

## 🚀 Roadmap para Clonar e Executar o Projeto

<details>
<summary>Ver passo a passo</summary>

### 1. 🔧 Pré-requisitos
- Python 3.8 ou superior instalado

- Git instalado

- [Poetry](https://python-poetry.org/docs/#installation) instalado

- Acesso ao SQL Server e à rede onde estão as pasta de entrada e de processados: `PASTA_ENTRADA = "<caminho_para_pasta_entrada>"`
`PASTA_PROCESSADOS = "<caminho_para_pasta_processados>"`

- Permissões para instalar dependências

### 2. 📥 Clonando o repositório
Abra o terminal e execute:
```sh
git clone https://github.com/KovrSeguradoraBI/REBALANCEAMENTO_ANALISTAS_SINISTRO.git
cd REBALANCEAMENTO_ANALISTAS_SINISTRO
```

### 3. 📦 Instalando as dependências e ativando o ambiente
```sh
poetry install
poetry shell (caso você feche o terminal e precise ativar o ambiente virtual novamente)
```

### 4. 🔑 Configurando variáveis de ambiente
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

- Confirme que o caminho das pastas  está acessível conforme configurado no script.

### 5. ▶️ Executando o pipeline
Configurações usadas no `main.py`:

- PATH da PASTA_ENTRADA: `\\Awsseg130006\ALOCACAO_SINISTRO_POR_ANALISTA\BALANCEAR`

- PATH da PASTA_PROCESSADOS = `\\Awsseg130006\ALOCACAO_SINISTRO_POR_ANALISTA\PROCESSADOS`

- Listas de e‑mail definidas no código:

  - `DESTINATARIOS_ERROS`: recebe falhas de execução/inserção

  - `DESTINATARIOS_VALIDACAO`: recebe erros de validação de estrutura/percentuais
```sh
python main.py
```

### 6. 📊 Resultados
- O processo imprime o relatório final no terminal.

- Inserções são feitas diretamente no banco de dados.

- E-mails são enviados apenas em caso de erro ou quando houver novas alocações (conforme configuração).

---

> 💡 **Dica:**  
> Se for rodar em ambiente de produção (ex: Jenkins), garanta que o `.env` esteja presente no workspace e que as variáveis estejam corretamente preenchidas.

</details>

---

## 🔔 Notificações de Erro
- **Erros de Validação**:

  - Enviados para os destinatários configurados em `DESTINATARIOS_VALIDACAO`.

- **Falhas Críticas**:

  - Enviadas para os destinatários configurados em `DESTINATARIOS_ERROS`.

---

## 📊 Relatório
Ao final do processo, um relatório é exibido no console com as seguintes informações:

- Total de arquivos processados.

- Total de registros inseridos.

- Tempo de execução.

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
---

<!-- ## 🕐 Última atualização

> **Data:** 10/03/2026  
> **Responsável:** Lucas Silva Pereira -->