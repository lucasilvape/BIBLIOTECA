<!-- echo.
echo ✅ Variáveis de ambiente definidas com sucesso.
echo 🔄 Reinicie o terminal ou o computador para que tenham efeito.
pause -->

# APACHE_HOP_00_VARIAVEIS

![Apache Hop](https://img.shields.io/badge/Apache%20Hop-ETL-D22128?style=for-the-badge&logo=apache&logoColor=white) ![Java](https://img.shields.io/badge/Java-8%2B-F89820?style=for-the-badge&logo=java&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Config-336791?style=for-the-badge&logo=postgresql&logoColor=white) ![Ambiente](https://img.shields.io/badge/Ambiente-Variáveis-2E7D32?style=for-the-badge&logoColor=white) ![License](https://img.shields.io/badge/Licença-Proprietária-757575?style=for-the-badge&logoColor=white)

> Gerenciamento e versionamento de variáveis de ambiente/configuração para pipelines Apache Hop.

## Estrutura do Projeto

- `VARIAVEIS_PROD.json`: Arquivo JSON contendo as variáveis de produção.
- `README.md`: Documentação e instruções do projeto.

## Como Usar

1. Edite o arquivo `VARIAVEIS_PROD.json` para adicionar ou modificar variáveis de ambiente conforme necessário.
2. Utilize o script abaixo para definir variáveis de ambiente permanentes no Windows:

```bat
@echo off
echo Configurando variáveis de ambiente permanentes para Apache Hop...
REM Define as variáveis de sistema (/M = machine-wide)
setx HOP_LOG_LEVEL Basic /M
setx HOP_MAX_LOG_LINES 10000 /M
setx HOP_OPTIONS -Xmx14g
echo.
echo ✅ Variáveis de ambiente definidas com sucesso.
echo 🔄 Reinicie o terminal ou o computador para que tenham efeito.
pause
```

<!-- ## Contribuindo

1. Faça um fork deste repositório.
2. Crie uma branch para sua feature ou correção: `git checkout -b minha-feature`
3. Commit suas alterações: `git commit -m 'Minha nova feature'`
4. Faça push para a branch: `git push origin minha-feature`
5. Abra um Pull Request.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes. -->
---
##  Contato

Para dúvidas, sugestões ou reportar problemas:

| Canal | Informação |
|-------|------------|
| **Email** | [thiago.ramalho@kovr.com.br](mailto:thiago.ramalho@kovr.com.br) |
| **Email** | [usrpbi@kovr.com.br](mailto:usrpbi@kovr.com.br) |
