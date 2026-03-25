# Alocação de Analistas de Sinistros (Affinity)

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Poetry](https://img.shields.io/badge/Poetry-60A5FA?style=for-the-badge&logo=poetry&logoColor=white) ![SQL%20Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white) ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) ![i4Pro%20API](https://img.shields.io/badge/i4Pro%20API-0078D4?style=for-the-badge&logoColor=white) ![Jenkins](https://img.shields.io/badge/Jenkins-D33835?style=for-the-badge&logo=jenkins&logoColor=white)

---

Automatiza a alocação de sinistros para analistas de acordo com regras de negócio e percentuais definidos por cobertura e ramo. O pipeline valida entradas, cria a distribuição, processa sinistros, aloca, insere no banco e gera relatórios, com notificações por e‑mail somente quando necessário.

---

## 📋 Sumário
- [🔭 Visão geral do pipeline](#-visão-geral-do-pipeline)
- [🔄 Fluxo detalhado (end-to-end)](#-fluxo-detalhado-end-to-end)
- [📁 Entradas, saídas e estrutura de pastas](#-entradas-saídas-e-estrutura-de-pastas)
- [🚀 Roadmap para Clonar e Executar o Projeto](#-roadmap-para-clonar-e-executar-o-projeto)
- [📧 Regras de notificação por e‑mail](#-regras-de-notificação-por-email)
- [🗄️ Banco de dados e conexões](#️-banco-de-dados-e-conexões)
- [✅ Critérios de sucesso e relatórios](#-critérios-de-sucesso-e-relatórios)
- [❓ Dúvidas frequentes e troubleshooting](#-dúvidas-frequentes-e-troubleshooting)
- [📞 Contato](#-contato)

---

## 🔭 Visão geral do pipeline

O orquestrador da execução é o arquivo `main.py`. Ele realiza:

1. Validação da estrutura do Excel e da consistência dos percentuais.
2. Criação da distribuição por cobertura/ramo/analista.
3. Consulta e preparação dos sinistros.
4. Cálculo de carga de trabalho e alocação de novos sinistros.
5. Inserção das novas alocações no DW.
6. Atualização do analista no i4Pro via API utilizando o endpoint: "https://...Sinistro/AlteraResponsavelSinistro".
7. Inserção de log da atualização do i4Pro (banco de logs).
8. Relatório final e notificações condicionais.

**Observações importantes:**
- A impressão da distribuição “sinistros alocados por analista” só ocorre quando há novas alocações nesta execução.
- E‑mail: enviar apenas em caso de erro, ou com resumo explícito de sucesso quando houver inserções em banco; silenciar quando não houver novos sinistros.
- i4Pro: a URL do endpoint é carregada via `.env` (`URL_PROD` / `URL_HOMOLOG`) e depende do parâmetro `ambiente` na função `inserir_analistas_i4pro`.

Configurações usadas no `main.py` (padrão atual):
- PATH do Excel:
  - `\\awsseg130006\ALOCACAO_SINISTRO_POR_ANALISTA\MASSIFICADOS\GRADE_AFFINITY.xlsx`
- Ramos Affinity: `[14, 71]`
- Listas de e‑mail definidas no código:
  - `DESTINATARIOS_ERROS`: recebe falhas de execução/inserção
  - `DESTINATARIOS_VALIDACAO`: recebe erros de validação de estrutura/percentuais
- E‑mail de sucesso está opcional e comentado no código (enviar apenas se desejado quando houver inserções).

---

## 🔄 Fluxo detalhado (end-to-end)

<details markdown="1">
<summary>Ver fluxo completo</summary>

1. Entrada e validação inicial
   - Leitura do arquivo `\\awsseg130006\ALOCACAO_SINISTRO_POR_ANALISTA\MASSIFICADOS\GRADE_AFFINITY.xlsx` (abas: `coberturas` e `pessoas`).
   - Validação de estrutura: colunas obrigatórias, analistas existentes, compatibilidade com o banco.
   - Validação de percentuais: para cada combinação `nm_cobertura` + `nr_ramo`, a soma dos percentuais dos analistas deve ser 100%.
   - Em caso de falha em estrutura/percentuais: imprimir erro e enviar e‑mail de erro; encerrar o processo.

2. Criação da distribuição
   - `criar_distribuicao_cobertura(...)`: transforma tabela de percentuais em formato longo, associa `id_analista` a `cd_analista` e mantém apenas percentuais > 0.

3. Consulta e processamento de sinistros
   - Consulta de sinistros por ramos do Affinity (ex.: `[14, 71]`).
   - Filtragem por status válidos (ativos) e preparação dos dados para alocação.

4. Preparação para alocação e cálculo de carga
   - Cálculo da carga de trabalho específica por analista (considerando sinistros em aberto).

5. Alocação de novos sinistros
   - Aplicação das regras de distribuição e escolha do “melhor analista” por cobertura, respeitando percentuais configurados e carga atual.
   - Geração de `df_sinistros_alocados` e atualização de carga prevista.

6. Preparação para inserção
   - Padronização do dataset final para banco (colunas como `nr_sinistro`, `nm_cobertura`, `id_analista`, `cd_analista`, `dt_alocacao`).

7. Inserção no banco de dados
   - Inserção em lote na tabela de destino: `kovr_dw_bi.dbo.dim_alocacao_analista_sinistro`.
   - Critérios de retorno claros:
     - Sucesso: função retorna `True`, faz commit e imprime resumo; e‑mail de sucesso é opcional (somente quando houver inserções).
     - Falha: retorna `False`, imprime detalhes e envia e‑mail de erro.
     - Sem registros novos: imprimir “Nenhum sinistro novo para inserir.” (o `main.py` faz esse controle e não chama a função com DF vazio).

8. Persistência / atualização
  - Inserção no DW em `dim_alocacao_analista_sinistro`.
  - Atualização do responsável no i4Pro via `POST` para `AlteraResponsavelSinistro`.
  - Inserção do log da atualização do i4Pro em `atualiza_analista_sinistro_i4pro`.

</details>

---

## 📁 Entradas, saídas e estrutura de pastas

Entradas
- Planilha:
  - `\\awsseg130006\ALOCACAO_SINISTRO_POR_ANALISTA\MASSIFICADOS\GRADE_AFFINITY.xlsx`
    - Aba `coberturas`: colunas mínimas `nm_cobertura`, `nr_ramo`, além de uma coluna por analista contendo percentuais (0 a 100).
    - Aba `pessoas`: deve mapear pelo menos `cd_analista` → `id_analista`.

Estrutura de pastas
- `entrada/`: arquivos de entrada que podem ser consumidos.
- `processados/`: versões com timestamp dos arquivos já processados.

Estrutura do repositório (principais itens)
- `main.py` (orquestração ponta‑a‑ponta)
- `funcoes.py` (lógica de negócio, consultas, e utilitários)
- `conexao_banco.py` (conexão ao banco)
- `autenticacao.py` (autenticação/envio de e‑mails)
- `alocacao.ipynb` e `redistribuição.ipynb` (prototipação e testes)
- `pyproject.toml`, `poetry.lock` (gerenciamento de dependências)

---

## 🚀 Roadmap para Clonar e Executar o Projeto

<details markdown="1">
<summary>Ver passo a passo</summary>

### 1. Pré-requisitos
- Python 3.8 ou superior instalado
- Git instalado
- [Poetry](https://python-poetry.org/docs/#installation) instalado
- Acesso ao SQL Server e à rede onde está a planilha `GRADE_AFFINITY.xlsx`
- Permissões para instalar dependências

### 2. Clonando o repositório
Abra o terminal e execute:
```sh
git clone https://github.com/KovrSeguradoraBI/ALOCACAO_ANALISTAS_SINISTROS_AFFINITY.git
cd ALOCACAO_ANALISTAS_SINISTROS_AFFINITY
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
- Confirme que o caminho da planilha `GRADE_AFFINITY.xlsx` está acessível conforme configurado no script.
- Para testes locais, edite a variável `PATH` no `main.py` para `GRADE_AFFINITY.xlsx` ou para o caminho desejado.

### 5. Executando o pipeline
Configurações usadas no `main.py`:
- PATH do Excel: `GRADE_AFFINITY.xlsx`
- Em produção, o path é o seguinte:
`\\awsseg130006\ALOCACAO_SINISTRO_POR_ANALISTA\MASSIFICADOS\GRADE_AFFINITY.xlsx`.
- VARIAVEIS_ALOCACAO: `['nm_cobertura','nr_ramo']`
- Ramos AFFINITY: `[14 , 71]`
- Listas de e‑mail definidas no código:
  - `DESTINATARIOS_ERROS`: recebe falhas de execução/inserção
  - `DESTINATARIOS_VALIDACAO`: recebe erros de validação de estrutura/percentuais
```sh
python main.py
```

### 6. Resultados
- O processo imprime o relatório final no terminal.
- Inserções são feitas diretamente no banco de dados.
- E-mails são enviados apenas em caso de erro ou quando houver novas alocações (conforme configuração).

---

> 💡 **Dica:**  
Se for rodar em ambiente de produção (ex: Jenkins), garanta que o `.env` esteja presente no workspace e que as variáveis estejam corretamente preenchidas.

</details>

---

## 📧 Regras de notificação por e‑mail

- Erros: enviar e‑mail com detalhes (falha na validação, exceções nas consultas/transformações, erro na inserção em banco, etc.).
- Sucesso explícito: quando houver inserção no banco, pode enviar um resumo (quantidade inserida e distribuição por analista). O envio está comentado no `main.py` e pode ser ativado se desejado.
- Sem novos sinistros: não enviar e‑mail (execução silenciosa, apenas logs locais).

---

## 🗄️ Banco de dados e conexões

- Leitura: conexão apelidada como `producao_i4` (utilizada nas queries de consulta/validação).
- Escrita: conexão apelidada como `dw_bi` (utilizada para inserir em `kovr_dw_bi.dbo.dim_alocacao_analista_sinistro`).
- A tabela de destino efetiva no código é `dim_alocacao_analista_sinistro` no schema `dbo` do `kovr_dw_bi`.
- A tabela `atualiza_analista_sinistro_i4pro` contem os analistas que foram persitidos no i4pro
- Consulte `conexao_banco.py` para a configuração dos aliases de conexão.


---

## ✅ Critérios de sucesso e relatórios

- Inserção em banco:
  - Sucesso: função `inserir_sinistros_alocados` retorna `True` e são impressos os totais; e‑mail opcional de sucesso.
  - Falha: retorna `False` e envia e‑mail de erro.
  - Vazio: o `main.py` imprime “Nenhum sinistro novo para inserir.” e não chama a função de inserção.
- Relatórios:
  - Sempre imprimir estatísticas gerais da execução.
  - Imprimir “sinistros alocados por analista” apenas quando `df_sinistros_para_insercao` tiver registros (> 0).

---

## ❓ Dúvidas frequentes e troubleshooting

<details markdown="1">
<summary>Ver respostas</summary>

- "A validação passa, mas não há inserções no banco."
  - Verifique se os percentuais somam 100% por `nm_cobertura`+`nr_ramo` e se os ramos filtrados (ex.: 14 e 71) realmente possuem novos sinistros ativos.
  - Confirme se `preparar_sinistros_para_insercao` está produzindo linhas e se não há duplicidades já inseridas.
- "O pipeline imprime sucesso de inserção, mas o `main.py` considera falha."
  - Ajuste `inserir_sinistros_alocados` para retornar `True` explicitamente em sucesso; `None` ou `False` serão tratados como erro.
- "Estão sendo enviados e‑mails quando não há novos sinistros."
  - Mantenha desativado o envio de e‑mail informativo de 'sem novos sinistros'. O `main.py` está alinhado para silêncio nessas situações.
- "Variáveis de e‑mail ou banco não encontradas."
  - Revise `.env` e os nomes esperados por `autenticacao.py` e `conexao_banco.py`.

</details>

---

## 📞 Contato

Para dúvidas, sugestões ou reportar problemas:

| Canal | Informação |
|-------|------------|
| **Email** | [usrpbi@kovr.com.br](mailto:usrpbi@kovr.com.br) |
<!-- | :material-microsoft-teams: **Teams** | Canal "Equipe de Dados" | -->

## 👥 Contribuidores

- **Lucas Silva** - lucas.silva@kev.tech



<!-- ---

## Última atualização

> **Data:** 05/03/2026  
> **Responsável:** Lucas Silva Pereira -->



