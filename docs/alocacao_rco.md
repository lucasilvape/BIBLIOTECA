# Alocação de Analistas de Sinistros (RCO)

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Poetry](https://img.shields.io/badge/Poetry-60A5FA?style=for-the-badge&logo=poetry&logoColor=white) ![SQL%20Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white) ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) ![Jenkins](https://img.shields.io/badge/Jenkins-D33835?style=for-the-badge&logo=jenkins&logoColor=white)

Automatiza a alocação de sinistros do ramo RCO para analistas, conforme regras de negócio e percentuais definidos por cobertura/causa/esteira. O pipeline valida entradas, cria a distribuição, processa sinistros, aloca, insere no banco (DW) e gera relatórios no terminal, com notificações por e‑mail apenas quando necessário.

---

## 📋 Sumário

- [🔍 Visão geral do pipeline](#visao-geral)
- [🔄 Fluxo detalhado (end-to-end)](#fluxo-detalhado)
- [📁 Entradas, saídas e estrutura de pastas](#entradas-saidas)
- [🚀 Roadmap para clonar e executar o projeto](#roadmap)
- [📧 Regras de notificação por e‑mail](#notificacao)
- [🗄️ Banco de dados e conexões](#banco-dados)
- [✅ Critérios de sucesso e relatórios](#criterios)
- [❓ Dúvidas frequentes e troubleshooting](#troubleshooting)
- [📞 Contato](#contato)

---

<a name="visao-geral"></a>
## 🔍 Visão geral do pipeline

O orquestrador da execução é o arquivo `main.py`. Ele realiza:

1. Validação da estrutura do Excel e da consistência dos percentuais.
2. Criação da distribuição por cobertura/causa/esteira/analista.
3. Consulta e preparação dos sinistros RCO.
4. Cálculo de carga de trabalho e alocação de novos sinistros.
5. Preparação e inserção no banco de dados (DW).
6. Atualização do analista no i4Pro via API utilizando o endpoint: "https://...Sinistro/AlteraResponsavelSinistro".
7. Registro de log da atualização do i4Pro.
8. Relatório final no terminal e notificações condicionais.

> **Observações:**
> - Percentuais devem somar 100% por combinação `nm_cobertura` + `esteira`.
> - Resultado final é inserido no DW; não há arquivo Excel como saída em produção.
> - E‑mail apenas em erro ou quando há inserções (opcional).

---

<a name="fluxo-detalhado"></a>
## 🔄 Fluxo detalhado (end-to-end)

<details markdown="1">
<summary>Ver fluxo completo</summary>

1. Entrada e validação inicial
   - Leitura de `GRADE_RCO.xlsx` (abas: `rco` e `pessoas`).
   - Validação de estrutura: colunas obrigatórias, analistas existentes, compatibilidade com o banco.
   - Validação de percentuais: somar 100% por `nm_cobertura` + `esteira`. Em falha: imprimir erro e enviar e‑mail; encerrar.

2. Criação da distribuição
   - `criar_distribuicao_cobertura(...)`: transforma percentuais para formato longo, associa `id_analista` a `cd_analista` e mantém apenas percentuais > 0.

3. Consulta e processamento de sinistros (RCO)
   - Consulta por ramos RCO padrão: `[23, 28, 82]`.
   - Filtros (na query): `vl_reserva > 0`, não jurídico, possui terceiro, esteira definida por regras (DM/DC).
   - Filtragem por coberturas válidas (presentes na grade).

4. Preparação e carga
   - Seleciona sinistros válidos (ex.: por `vl_reserva > 0`) e calcula carga por analista/cobertura/esteira.

5. Alocação
   - Seleciona o "melhor analista" por cobertura/esteira, ponderando percentual configurado e carga atual.
   - Gera `df_sinistros_alocados` e atualiza carga prevista.

6. Preparação para inserção
   - Padroniza dataset para banco: `nr_sinistro`, `nm_cobertura`, `id_analista`, `cd_analista`, `dt_alocacao`.

7. Inserção no banco
   - Inserção em lote na tabela `kovr_dw_bi.dbo.dim_alocacao_analista_sinistro`.

8. Relatório final
   - Estatísticas: já alocados, sem analista, inseridos nesta execução.
   - Distribuição por analista impressa apenas quando houver novas alocações.
</details>

---

<a name="entradas-saidas"></a>
## 📁 Entradas, saídas e estrutura de pastas

### Entradas
- `GRADE_RCO.xlsx`
  - Aba `rco`: colunas mínimas `nm_cobertura`, `nm_causa`, `esteira` e uma coluna por analista com percentuais (0 a 100).
  - Aba `pessoas`: mapeia ao menos `cd_analista` → `id_analista`, além de `nome_analista`, `nm_email`.

### Saídas
- Produção: inserção direta no DW (`dim_alocacao_analista_sinistro`).
- Auxiliares (apenas em desenvolvimento): arquivos como `sinistros_validos.xlsx`, `sinistros_alocados.xlsx`, etc., podem ser gerados localmente para diagnóstico.

### Estrutura do repositório (principais itens)
- `main.py` (orquestração ponta‑a‑ponta)
- `funcoes.py` (lógica de negócio, queries e utilitários)
- `conexao_banco.py` (conexões ao banco)
- `autenticacao.py` (variáveis de ambiente e SMTP)
- `GRADE_RCO.xlsx` (grade RCO)

---

<a name="roadmap"></a>
## 🚀 Roadmap para Clonar e Executar o Projeto

<details markdown="1">
<summary>Ver passo a passo</summary>

### 1. Pré-requisitos
- Python 3.8 ou superior instalado
- Git instalado
- [Poetry](https://python-poetry.org/docs/#installation) instalado
- Acesso ao SQL Server e à rede onde está a planilha `GRADE_RCO.xlsx`
- Permissões para instalar dependências

### 2. Clonando o repositório
Abra o terminal e execute:
```sh
git clone https://github.com/KovrSeguradoraBI/ALOCACAO_ANALISTAS_SINISTROS_RCO.git
cd ALOCACAO_ANALISTAS_SINISTROS_RCO
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
- Confirme que o caminho da planilha `GRADE_RCO.xlsx` está acessível conforme configurado no script.
- Para testes locais, edite a variável `PATH` no `main.py` para `GRADE_RCO.xlsx` ou para o caminho desejado.

### 5. Executando o pipeline
Configurações usadas no `main.py`:
- PATH do Excel: `GRADE_RCO.xlsx`
- Em produção, o path é o seguinte:
`\\awsseg130006\ALOCACAO_SINISTRO_POR_ANALISTA\RCO\GRADE_RCO.xlsx`.
- VARIAVEIS_ALOCACAO: `['nm_cobertura', 'nm_causa', 'esteira']`
- Ramos RCO: `[23, 28, 82]`
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

> **💡 Dica:**
> Se for rodar em ambiente de produção (ex: Jenkins), garanta que o `.env` esteja presente no workspace e que as variáveis estejam corretamente preenchidas.

</details>

---

<a name="notificacao"></a>
## 📧 Regras de notificação por e‑mail

- Erros: enviar e‑mail com detalhes (falha na preparação/validação, exceções nas consultas/transformações, erro na inserção).
- Sucesso explícito: quando houver inserção no banco, o envio de resumo é opcional (pode ser habilitado conforme necessidade).
- Sem novos sinistros: não enviar e‑mail (execução silenciosa com logs locais).

---

<a name="banco-dados"></a>
## 🗄️ Banco de dados e conexões

- Leitura: conexão `producao_i4` (consultas de sinistros/validações).
- Escrita: conexão `dw_bi` (inserção em `kovr_dw_bi.dbo.dim_alocacao_analista_sinistro`).
- Consulte `conexao_banco.py` para aliases e strings de conexão.

---

<a name="criterios"></a>
## ✅ Critérios de sucesso e relatórios

### Inserção em banco
  - Sucesso: inserção em lote concluída e resumo impresso no terminal; e‑mail de sucesso é 
  - Sucesso no i4pro: retorno da API sem erro; imprimir `df_resultados` quando disponível.opcional.
  - Falha: exceção registrada e e‑mail de erro enviado.
  - Sem registros novos: imprime "Nenhum sinistro novo para inserir." e não tenta inserir.

### Relatórios
  - Sempre imprimir estatísticas gerais.
  - Distribuição por analista apenas quando `df_sinistros_para_insercao` tiver registros (> 0).

---

<a name="troubleshooting"></a>
## ❓ Dúvidas frequentes e troubleshooting

<details markdown="1">
<summary>Ver resposta</summary>

- "Validação passa, mas não há inserções."
  - Verifique se os percentuais somam 100% por `nm_cobertura` + `esteira` e se os ramos `[23, 28, 82]` possuem sinistros elegíveis.
  - Confirme se `preparar_sinistros_para_insercao` está produzindo linhas e se não são sinistros já alocados anteriormente.

- "Foram enviados e‑mails quando não houve novos sinistros."
  - Mantenha desativado qualquer envio de e‑mail informativo de "sem novos sinistros". O `main.py` já está adequado.

- "Variáveis de e‑mail/banco não encontradas."
  - Revise `.env` e os nomes esperados em `autenticacao.py` e `conexao_banco.py`.
</details>

---

<a name="contato"></a>
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
