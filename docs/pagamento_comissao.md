# Sistema de Pagamento de Comissões de Assessoria

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Poetry](https://img.shields.io/badge/Poetry-60A5FA?style=for-the-badge&logo=poetry&logoColor=white) ![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white) ![NumPy](https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white) ![pyodbc](https://img.shields.io/badge/pyodbc-0078D4?style=for-the-badge&logo=microsoftsqlserver&logoColor=white) ![python-dotenv](https://img.shields.io/badge/python--dotenv-4CAF50?style=for-the-badge&logoColor=white) ![Pandera](https://img.shields.io/badge/Pandera-ED1C40?style=for-the-badge&logoColor=white) ![openpyxl](https://img.shields.io/badge/openpyxl-217346?style=for-the-badge&logo=microsoftexcel&logoColor=white) ![pathlib-types](https://img.shields.io/badge/pathlib--types-607D8B?style=for-the-badge&logoColor=white) ![ipykernel](https://img.shields.io/badge/ipykernel-F37626?style=for-the-badge&logo=jupyter&logoColor=white)

Sistema automatizado para processamento e envio de relatórios de comissões para assessorias de corretores de seguros.

## 📋 Descrição

Este sistema conecta-se ao banco de dados SQL Server para:

- Extrair dados de comissões de assessorias com base na competência (mês/ano)

- Gerar relatórios individuais em Excel para cada assessoria

- Enviar os relatórios por email automaticamente 

- Criar relatório consolidado com todas as assessorias

## 🛠️ Pré-requisitos

### Software necessário:
- Python 3.9 ou superior

- Acesso à rede corporativa (diretório `\\AWSSEG130006\pagamento_comissao_assessoria`)

- Driver ODBC 18 para SQL Server

- Credenciais de acesso aos bancos de dados

### Gerenciamento de dependências:
Este projeto é configurado para usar **Poetry** como gerenciador de dependências, mas pode ser usado com qualquer gerenciador Python (pip, conda, pipenv, etc.).

### Bibliotecas Python necessárias:
```
pandas>=2.3.0,<3.0.0
pyodbc>=5.2.0,<6.0.0
python-dotenv>=1.1.0,<2.0.0
pandera>=0.24.0,<0.25.0
openpyxl>=3.1.5,<4.0.0
numpy>=1.24.0,<2.0.0
pathlib-types>=0.8.0,<1.0.0
ipykernel>=6.29.5,<7.0.0  # Para desenvolvimento em Jupyter
```

## ⚙️ Configuração

### 1. Arquivo de ambiente (.env)

Copie o arquivo `.env_exemplo` para `.env` e configure as credenciais:

```bash
cp .env_exemplo .env
```

Configure as seguintes variáveis no arquivo `.env`:

```env
# Banco de produção I4
USER_PROD='seu_usuario_producao'
PASSWORD_PROD='sua_senha_producao'

# Data Warehouse BI
USER_DW_BI='seu_usuario_bi'
PASSWORD_DW_BI='sua_senha_bi'

# Email BI
USER_EMAIL_BI='seu_usuario_email'
PASSWORD_EMAIL_BI='sua_senha_email'
```

### 2. Configuração de assessorias (config.py)

O arquivo `config.py` contém o mapeamento de todas as assessorias:

- **ASSESSORIAS_CONFIG**: Dicionário com ID da assessoria → dados (nome e email)

- **ASSESSORIAS_ESPECIAIS**: Casos especiais (sem assessoria, sem produtor, etc.)

Estrutura do config.py:
```python
ASSESSORIAS_CONFIG = {
    2400936: {
        'nome': '2MCS ASSESSORIA EMPRESARIAL LTDA',
        'email': 'contato@assessoria.com.br'
    },
    # ... outras assessorias
}
```

## 🚀 Instalação

### Opção 1: Usando Poetry (Recomendado)

Este projeto utiliza Poetry para gerenciamento de dependências. Se você tem Poetry instalado:

1. Clone ou baixe o projeto
2. Instale as dependências automaticamente:
```bash
poetry install
```

3. Ative o ambiente virtual:
```bash
poetry shell
```

### Opção 2: Usando pip

Se preferir usar pip diretamente:

1. Clone ou baixe o projeto
2. (Opcional) Crie um ambiente virtual:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install pandas pyodbc python-dotenv pandera openpyxl numpy pathlib-types
```

4. Para desenvolvimento em Jupyter Notebook:
```bash
pip install ipykernel
```

### Finalização da configuração

1. Configure o arquivo `.env` com suas credenciais


## 📖 Como usar

### Modo Automático (Recomendado)

Execute o sistema para a competência do mês anterior automaticamente:

```python
from main import main

# Execução automática para mês anterior com envio de emails
main(enviar_emails=True)

# Apenas gerar relatórios sem enviar emails
main(enviar_emails=False)
```

### Modo Manual

Especifique uma competência específica:

```python
from main import main

# Para competência específica (formato: YYYYMM)
main(competencia=202412, enviar_emails=True)
```

### Modo de Teste

Para testes, envie todos os emails para um endereço específico:

```python
from main import main

# Todos os emails vão para o endereço de teste
main(enviar_emails=True, email_teste="seu.email@teste.com")
```

## 📁 Estrutura de saída

O sistema cria a seguinte estrutura de diretórios:

```
\\AWSSEG130006\pagamento_comissao_assessoria\
└── pagamento_assessoria_competencia_YYYYMM_gerado_em_DDMMYYYY_HHhMMminSSs\
    ├── assessorias_individuais\
    │   ├── assessoria_XXXXXXX_competencia_YYYYMM.xlsx
    │   ├── assessoria_XXXXXXX_competencia_YYYYMM.xlsx
    │   └── ...
    └── Relatorio_Comissoes_Assessoria_YYYYMM.xlsx
```

### Arquivos gerados:

1. **Relatórios individuais**: Um arquivo Excel para cada assessoria com suas comissões
2. **Relatório consolidado**: Um único arquivo Excel com duas abas:
   - **Aba "Analitico"**: Consolidação detalhada de todas as assessorias

   - **Aba "Totais"**: Totalizações por assessoria

## 📧 Envio de emails

### Funcionalidades do Email:
- Template HTML profissional

- Anexa automaticamente o relatório Excel da assessoria

- Suporte a emails de teste para validação

### Conteúdo do email:
- Assunto: "Relatório de Comissões - Competência MM/YYYY - [Nome da Assessoria]"

- Corpo em HTML com informações da competência

- Anexo: Relatório Excel da assessoria específica

## ⚡ Funcionalidades principais

### 1. Cálculo automático de competência
```python
# Se competencia=None, calcula automaticamente o mês anterior
competencia = int((datetime.now().replace(day=1) - timedelta(days=1)).strftime("%Y%m"))
```

**Como funciona:**

1. `datetime.now()` → Pega a data atual (ex: 15/07/2025)
2. `.replace(day=1)` → Vai para o dia 1 do mês atual (01/07/2025)
3. `- timedelta(days=1)` → Volta 1 dia, indo para o último dia do mês anterior (30/06/2025)
4. `.strftime("%Y%m")` → Formata como YYYYMM (202506)
5. `int()` → Converte para número inteiro (202506)

**Resultado:** Se hoje é julho/2025, a competência será 202506 (junho/2025)

### 2. Filtros aplicados
- Apenas registros onde `asse.id_pessoa IS NOT NULL` (assessoria válida)

- Competência específica baseada na data de emissão

- Status válidos de apólices

### 3. Validação de dados
- Schema de validação com Pandera

- Verificação de tipos de dados

- Tratamento de valores nulos

### 4. Tratamento de erros
- Conexões de banco com fallback

- Logs detalhados de erros

- Continuidade em caso de falhas pontuais

## 🔧 Estrutura técnica

### Arquivos principais:
- `main.py`: Arquivo principal de execução

- `conexao_banco.py` / `conexao_banco1.py`: Conexões com banco de dados

- `autenticacao.py`: Configurações de autenticação

- `sql/query.sql`: Query principal para extração de dados

### Bancos de dados utilizados:
- **Produção I4** (`re_i4pro`): Dados de comissões

- **Stage BI** (`kovr_stage_bi`): Dados complementares

- **Réplica**: Backup para consultas

## 📊 Dados processados

### Campos principais do relatório:
- Data base e competência

- Dados da apólice (número, cliente, produto)

- Informações do endosso

- Valores de prêmio e comissão

- Dados do corretor e assessoria

- Percentuais de comissão

### Totalizações:
- Valor total por assessoria

- Quantidade de registros

- Prêmio total processado

- Comissões totais

## 🚨 Pontos importantes

### Dependências críticas:
1. **Rede corporativa**: Sistema requer acesso ao diretório `\\AWSSEG130006\pagamento_comissao_assessoria`
2. **Credenciais válidas**: Verificar se as credenciais no `.env` estão atualizadas
3. **Driver ODBC**: Necessário "ODBC Driver 18 for SQL Server"

### Modos de execução:
- **Produção**: `main(enviar_emails=True)` - Envia emails reais

- **Teste**: `main(enviar_emails=True, email_teste="teste@email.com")` - Todos emails para teste

- **Geração apenas**: `main(enviar_emails=False)` - Só gera arquivos

- **Somente banco**: `main(enviar_emails=False, gerar_arquivos=False)` - Não gera arquivos, apenas insere os dados no banco (implementado no notebook)

### Competência:
- **Automático**: Se não especificada, usa mês anterior

- **Manual**: Formato YYYYMM (ex: 202412 para dezembro/2024)

## 🐛 Solução de problemas

### Erro de conexão de rede:
```
ERRO CRÍTICO: Diretório de rede não acessível
```

- Verificar conexão VPN

- Confirmar acesso ao servidor `\\AWSSEG130006`

### Erro de banco de dados:
```
Erro ao conectar no banco
```

- Verificar credenciais no arquivo `.env`

- Confirmar conectividade com os servidores de banco

### Erro de email:
```
Erro ao enviar email
```

- Verificar credenciais de email no `.env`

- Confirmar configuração do servidor SMTP

## 📝 Logs e monitoramento

O sistema fornece logs detalhados para:

- Progresso da execução

- Quantidade de registros processados

- Erros e exceções

- Status de envio de emails

- Tempo de processamento

## 🔄 Exemplo de execução completa

```python
from main import main

# Execução padrão - mês anterior com envio de emails
resultado = main(enviar_emails=True)

# Resultado esperado:
# - Relatórios gerados na rede
# - Emails enviados para todas as assessorias
# - Logs de confirmação no console


```

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
