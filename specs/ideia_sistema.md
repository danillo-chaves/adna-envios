# Especificação de Projeto: Sistema Gerenciador de Notas e Boletos (Detran)

## 1. Visão Geral do Sistema

Aplicação web para rodar localmente, focada no gerenciamento e disparo automatizado de e-mails contendo notas fiscais e/ou boletos para Clínicas do Detran. O sistema permite o cadastro das clínicas, configuração de credenciais via Senha de App do Google, e possui regras de exceção e variáveis dinâmicas de texto.

## 2. Stack Tecnológica

- **Framework:** Next.js (App Router).
- **Interface e Estilização:** React e Tailwind CSS.
- **Envio de E-mail:** `nodemailer` rodando nas rotas de API do Next.js.
- **Persistência de Dados (Local):** LocalStorage ou manipulação de arquivo `.json` local (preparando terreno para futura migração para Firebase).
- **Arquitetura:** Rigorosamente MVC (Model, View, Controller).

## 3. Estrutura Arquitetural (MVC no Next.js)

O projeto deve ser estruturado separando as responsabilidades nas seguintes camadas lógicas:

- **`/models` (Camada de Dados):**
  - Arquivo `clinicaModel.ts`: Define a interface/tipagem da Clínica e centraliza as funções de leitura, gravação e atualização dos dados locais.

- **`/views` (Camada de Apresentação):**
  - Componentes React (`/app` e `/components`).
  - Formulários limpos e sem regras de negócio embutidas. Apenas capturam os dados e repassam para os Controllers.

- **`/controllers` (Camada de Lógica):**
  - Arquivos `emailController.ts` e `clinicaController.ts`.
  - Responsáveis por aplicar as regras de negócio, processar os uploads de arquivos em memória, substituir as variáveis do texto e comandar o disparo via `nodemailer`. Estes controllers serão chamados diretamente pelas rotas de API do Next.js (`/app/api/...`).

## 4. Modelo de Dados da Clínica

Cada registro de clínica deve conter:

- `idContrato` (String)
- `nome` (String)
- `cnpj` (String)
- `celular` (String)
- `ignorarEnvio` (Boolean - status do checkbox de exceção)
- `arquivoAnexo` (Objeto File/PDF em memória no momento do disparo)

## 5. Funcionalidades e Regras de Negócio Core

### Módulo de Configuração (Setup)

- View com inputs para "E-mail Remetente" e "Senha de App (Google)".
- Salvar localmente para não exigir preenchimento a cada novo envio.

### Módulo de Gestão de Clínicas

- View com formulário de cadastro (ID, Nome, CNPJ, Celular).
- View com Lista/Tabela exibindo as clínicas cadastradas.
- **Regra de Exceção (Checkbox):** Cada clínica na lista possui um checkbox. Marcá-lo define `ignorarEnvio = true`.

### Módulo Compositor e Disparo de E-mail

- View com campos para **Assunto** e **Corpo da Mensagem**, além de uma área para upload múltiplo de PDFs (boletos/notas) relacionando o arquivo à clínica correta (ex: através do CNPJ ou ID no nome do arquivo).
- **Variáveis Dinâmicas:** O Controller deve interceptar as tags `{{nome_clinica}}` e `{{cnpj_clinica}}` digitadas no corpo do e-mail e substituí-las pelos dados reais da clínica da vez.
- **Regra de Disparo (Condição Positiva):** Para cada clínica cadastrada, o Controller avalia: SE `ignorarEnvio` for falso (checkbox desmarcado) E houver um arquivo PDF correspondente anexado na sessão, EXECUTE o envio via `nodemailer`.
- Retornar feedback visual individual de sucesso ou falha na View.
