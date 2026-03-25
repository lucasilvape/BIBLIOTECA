# Ferramenta de Extração de Relatórios

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![PySide6](https://img.shields.io/badge/PySide6-41CD52?style=for-the-badge&logo=qt&logoColor=white) ![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white) ![SQL%20Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)

## 📋 Proposta de Valor

A **Ferramenta de Extração de Relatórios** é uma solução *desktop* corporativa desenvolvida para descentralizar o acesso aos dados operacionais e financeiros.

Ao fornecer uma interface gráfica (GUI) que abstrai a complexidade de consultas SQL, a ferramenta permite que usuários de negócio ("self-service BI") extraiam relatórios complexos, realizem conciliações (ex: *Conciliação Cyber*), consultem apólices via API REST e importem/validem movimentações de sinistros — tudo de forma autônoma, sem depender da equipe de TI/Dados.

**Benefícios:**

- 🚀 **Autonomia:** Elimina a dependência da equipe de TI/Dados para extrações rotineiras.

- 📉 **Redução de Chamados:** Diminui drasticamente a fila de *tickets* operacionais.

- ⚡ **Agilidade:** Dados em tempo real para tomada de decisão imediata.

- 📥 **Importação Estruturada:** Validação automatizada de arquivos de movimentação de sinistros antes do envio ao sistema.

---

## 🏗 Arquitetura de Dados

A solução segue uma arquitetura modular em camadas, separando a lógica de apresentação (UI) das regras de negócio e acesso a dados.

### 1. Conectividade (`src/core/database.py`)
Utiliza drivers nativos para conexão direta e otimizada com os bancos de dados.

- **Multi-Database:** Suporte a SQL Server via **pyodbc**, PostgreSQL via **psycopg2** e MongoDB via **pymongo**.

- **Segurança:** Credenciais gerenciadas via variáveis de ambiente (`.env`), garantindo que senhas não sejam *hardcoded* no código fonte principal.

### 2. Processamento (`src/core/reports.py` & `conciliacao_cyber.py`)
O processamento é intensivo em memória e otimizado via **Pandas**.

- **Extração Eficiente:** Queries SQL otimizadas convertidas diretamente em DataFrames.

- **Conciliação Automatizada:** Pipelines que cruzam dados de bancos internos com planilhas externas enviadas pelo usuário.

- **Chunking:** Utilização de `xlsxwriter` para escrita incremental de grandes arquivos Excel, prevenindo *MemoryError*.

### 3. Concorrência (`src/core/threads.py`)
Para garantir uma UI responsiva (sem "congelamentos"), todas as operações pesadas rodam em *Worker Threads* (`QThread`).

**Definidas em `src/core/threads.py`:**

- `CarregarProdutosConcThread`: Carrega lista de produtos de forma assíncrona.

- `CarregamentoArquivosThread`: Lê arquivos Excel/CSV enviados pelo usuário.

- `ConsultaThread`: Busca bilhetes por filtro (bilhete, UUID ou parcela).

- `RelatorioThread`: Gera relatórios LoteCap e Recorrência.

- `ConciliacaoThread`: Executa o pipeline completo de conciliação Cyber.

- `ConsultaApoliceThread`: Consulta a API REST de apólices (emite progresso em 25/75/100%).

- `SinistroThread`: Executa validações de movto sinistro via `validacao_movto_sinistro.py`.

**Definida em `src/main1.py`:**

- `VersaoThread`: Verifica a versão do sistema no banco e alerta o usuário se desatualizada.

---

## 🖥 Interface do Usuário (UI)

Desenvolvida com **PySide6** (Qt for Python).

- **Layouts:** Arquivos `.ui` criados no Qt Designer (em `assets/ui_files/`). O layout ativo é `main_window_movto_sinistro.ui`, compilado para `src/ui/main_window_movto_sinistro.py` via `pyside6-uic`.

- **Lógica (`src/main1.py`):** Controla a navegação entre as 7 páginas (Home, Financeiro, Conciliação, Consulta Item, Movto Sinistro, Contatos, Sobre), validação de inputs, permissões por usuário e comunicação com as threads através do mecanismo de *Signals & Slots*.

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos
*   Python 3.10+
*   Drivers ODBC (ex: ODBC Driver 18 for SQL Server) instalados no SO.

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/KovrSeguradoraBI/FERRAMENTA_DE_RELATORIOS.git
   cd FERRAMENTA_DE_RELATORIOS
   ```

2. Crie e ative o ambiente virtual:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

### Configuração (.env)

Copie o arquivo de exemplo e configure suas credenciais:

```bash
cp .env.example .env
```

Edite o `.env` com os dados de conexão do seu Data Warehouse:
```ini
DW_BI_SERVER=SEU_SERVIDOR
DW_BI_DATABASE=SEU_BANCO
DW_BI_USER=SEU_USUARIO
DW_BI_PASSWORD=SUA_SENHA
driver={ODBC Driver 18 for SQL Server}
```

---

## 🎨 Manutenção da Interface (Qt Designer)

Caso realize alterações visuais nos arquivos `.ui` ou nos recursos `.qrc` (ícones), execute os comandos abaixo para refletir as mudanças no código Python:

```bash
# Converter banco de imagem/ícones
pyside6-rcc assets\qrc_files\icons_.qrc -o src\ui\icons_rc.py

# Converter telas (UI)
pyside6-uic assets\ui_files\nome_do_arquivo.ui -o src\ui\nome_do_arquivo.py
```

---

## 📦 Compilação (Build)

O projeto utiliza **PyInstaller** para gerar um executável único (`.exe`) para distribuição. O arquivo `build.spec` já contém todas as regras de inclusão de assets e dependências ocultas.

Para gerar uma nova versão:

```bash
pyinstaller build.spec
```

O executável final será gerado na pasta `dist/` com o nome configurado (ex: `Sistema de Relatorios v1.0.1.exe`), pronto para ser compartilhado com os usuários finais.

---
> 📖 Consulte a [documentação completa](https://lucasilvape.github.io/ferramenta_extracao/).
---

**Desenvolvido pela Equipe Dados Kovr**
