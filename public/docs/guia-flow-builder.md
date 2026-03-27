# Guia Completo do Flow Builder

## O que é o Flow Builder?

O Flow Builder é uma ferramenta visual para criar fluxos de atendimento automatizado. Com ele, você monta conversas inteligentes que respondem seus clientes no WhatsApp, Instagram, Facebook, Webchat e Telegram — sem escrever código.

Você pode criar desde um menu simples com botões até agentes de IA que conversam livremente, consultam APIs, salvam dados e transferem para atendentes humanos quando necessário.

---

## Conceitos Fundamentais

### Nós e Conexões

Um fluxo é composto por **nós** (blocos) conectados por **setas** (conexões).

- **Nós** são as ações: enviar mensagem, capturar input, chamar API, etc.
- **Conexões** definem a ordem em que as ações acontecem.
- **Condições** nas conexões permitem criar ramificações (ex: se o usuário digitar "1", vai por um caminho; se digitar "2", vai por outro).

### Contexto da Conversa

O contexto é uma memória temporária que armazena dados durante a conversa. Quando o usuário informa o CPF, ele é salvo no contexto. Quando uma API retorna dados, eles vão para o contexto. Qualquer nó pode ler esses dados.

Para usar um valor do contexto em qualquer campo de texto, use a sintaxe:

```
${{nome_da_variavel}}
```

Exemplos:

| Sintaxe | O que faz |
|---|---|
| `${{nome}}` | Insere o nome salvo no contexto |
| `${{cpf}}` | Insere o CPF |
| `${{api_response.data.status}}` | Acessa campo aninhado da resposta de API |
| `${{results[0].nome}}` | Acessa primeiro item de um array |
| `${{secret.API_KEY}}` | Insere credencial guardada nas configurações |
| `${{env.BASE_URL}}` | Insere variável de ambiente do servidor |

### Credenciais (Secrets)

API keys, tokens e senhas nunca devem ser colocados direto nos nós. Use o menu "Variáveis de Ambiente" no editor para cadastrar credenciais de forma segura. Depois, referencie com `${{secret.NOME}}`.

---

## Componentes Disponíveis

### ▶️ Início

Ponto de entrada do fluxo. É adicionado automaticamente e não pode ser removido. Todo fluxo precisa de um. Ele não faz nada — apenas indica por onde a conversa começa.

### 💬 Mensagem

Envia um texto simples para o usuário.

**Quando usar:** Boas-vindas, confirmações, informações, qualquer texto que não precisa de resposta.

**Exemplo:**
```
Olá ${{nome}}! 👋
Bem-vindo à Loja Casa Nova.
Como posso ajudar você hoje?
```

### 🔘 Botões

Envia uma mensagem com até 3 botões clicáveis (limitação do WhatsApp).

**Quando usar:** Menus curtos, confirmações sim/não, escolhas rápidas.

**Exemplo de configuração:**
- Mensagem: "O que você gostaria de fazer?"
- Botões:
  ```
  Consultar pedido
  Falar com vendedor
  Suporte técnico
  ```

**Dica:** O texto do botão clicado vira a resposta do usuário. Use um Router ou condição na conexão seguinte para tratar cada opção.

### 📋 Lista

Envia uma lista expansível com múltiplas opções organizadas em seções.

**Quando usar:** Menus com mais de 3 opções, catálogos, seleção de produtos/serviços.

**Exemplo de JSON das opções:**
```json
[
  {
    "title": "Atendimento",
    "rows": [
      {"id": "1", "title": "Consultar pedido", "description": "Veja o status do seu pedido"},
      {"id": "2", "title": "2ª via de boleto", "description": "Receba o boleto atualizado"},
      {"id": "3", "title": "Trocar produto", "description": "Solicite uma troca"}
    ]
  },
  {
    "title": "Outros",
    "rows": [
      {"id": "4", "title": "Falar com atendente", "description": "Atendimento humano"},
      {"id": "5", "title": "Horário de funcionamento", "description": "Lojas físicas"}
    ]
  }
]
```

### ⌨️ Input (Capturar Dados)

Captura e valida a resposta do usuário, salvando no contexto.

**Tipos de validação:**

| Tipo | O que valida | Exemplo válido |
|---|---|---|
| Texto | Qualquer coisa | "João Silva" |
| Número | Somente dígitos | "12345" |
| CPF | CPF válido (11 dígitos + dígitos verificadores) | "12345678909" |
| CNPJ | CNPJ válido (14 dígitos) | "12345678000190" |
| CPF ou CNPJ | Detecta automaticamente | Ambos |
| Email | Formato de email | "joao@email.com" |
| Regex | Padrão personalizado | Configurável |

**Configuração:**
- **Tipo de input:** Selecione a validação desejada
- **Chave no contexto:** Nome da variável onde o valor será salvo (ex: `cpf`, `email`)
- **Mensagem de erro:** Texto mostrado quando a validação falha

**Exemplo prático:**
```
Tipo: CPF
Chave: cpf_cliente
Mensagem de erro: CPF inválido! Por favor, digite os 11 números do seu CPF.
```

Depois, use `${{cpf_cliente}}` em qualquer lugar do fluxo.

### 🎯 Router Inteligente

Avalia a resposta do usuário contra uma lista de regras e direciona para o caminho correspondente.

**Tipos de condição:**

| Condição | Como funciona | Exemplo |
|---|---|---|
| Igual a | Texto exato (ignora maiúsculas/acentos) | "1", "consultar pedido" |
| Contém | Texto parcial | "pedido", "boleto" |
| Regex | Expressão regular | `^\d{4}$` (4 dígitos) |
| Contexto | Compara valor do contexto | `${{tipo}} == "premium"` |
| Positivo | Palavras de confirmação | "sim", "ok", "claro" |
| Número | Somente dígitos | "123" |

**Exemplo de configuração:**

Router com 3 opções:
1. **Consultar pedido** — condição: Contém → valores: "pedido", "status", "rastrear"
2. **Financeiro** — condição: Contém → valores: "boleto", "pagamento", "parcela"
3. **Suporte** — condição: Contém → valores: "defeito", "problema", "trocar"

Se nenhuma opção combina → saída de erro com mensagem: "Não entendi. Escolha uma opção."

### 🌐 API Request

Faz requisições HTTP para APIs externas.

**Configuração:**
- **Método:** GET, POST, PUT, DELETE, PATCH
- **URL:** Endpoint da API (aceita variáveis)
- **Headers:** Cabeçalhos da requisição
- **Query Params:** Parâmetros na URL
- **Body:** Corpo da requisição (para POST/PUT/PATCH)
- **Context Key:** Onde salvar a resposta

**Exemplo: Consultar cliente no ERP**
```
Método: GET
URL: https://api.erp.com/clientes/${{cpf_cliente}}
Headers:
  Authorization: Bearer ${{secret.ERP_TOKEN}}
  Content-Type: application/json
Context Key: cliente
```

Após a chamada, os dados ficam disponíveis:
- `${{cliente.nome}}` → Nome do cliente
- `${{cliente.email}}` → Email
- `${{cliente_status}}` → Código HTTP (200, 404, etc.)
- `${{cliente_success}}` → true ou false

### 💾 Salvar no Contexto

Salva valores no contexto da conversa manualmente.

**Fontes de dados:**
- **Estático:** Valor fixo (aceita variáveis)
- **Contexto:** Copia de outra chave do contexto
- **Input:** Último valor digitado pelo usuário

**Exemplo:** Após uma API retornar dados do cliente, salvar campos específicos:
```
Mapeamentos:
  nome_cliente ← contexto: cliente.nome
  email_cliente ← contexto: cliente.email
  tipo_conta ← estático: "premium"
```

### 📎 Enviar Mídia

Envia documentos (PDF, etc.) ou imagens.

**Configuração:**
- **Tipo:** Documento ou Imagem
- **URL:** Link direto para o arquivo (aceita variáveis)
- **Nome do arquivo:** Para documentos (ex: "boleto.pdf")
- **Legenda:** Texto enviado junto

**Exemplo: Enviar boleto gerado por API**
```
Tipo: Documento
URL: ${{api_response.boleto_url}}
Nome: boleto_${{numero_pedido}}.pdf
Legenda: Aqui está sua 2ª via do boleto, ${{nome}}!
```

### ⏱️ Delay

Pausa a execução por um tempo antes de continuar.

**Quando usar:**
- Simular digitação (2-3 segundos)
- Dar tempo para o usuário ler uma mensagem longa
- Aguardar um processamento

**Limite:** 1 a 300 segundos.

### 👤 Transferir

Transfere o atendimento para um departamento de atendentes humanos no MonitChat.

**Configuração:**
- **Departamento:** Selecione no dropdown (carregado automaticamente do MonitChat)
- **Mensagem de sucesso:** "Transferindo para um especialista..."
- **Mensagem de erro:** "Departamento indisponível no momento."

Tem duas saídas: **sucesso** (verde) e **erro** (vermelho). Conecte cada uma a um caminho diferente.

### 🎫 Alterar Status

Altera o status do ticket no MonitChat (em andamento, resolvido, etc.).

### ↗️ Pular Para

Salta para qualquer outro nó do fluxo. Útil para criar loops ou reaproveitar trechos.

### 📝 Expressão

Cria, transforma e calcula valores a partir do contexto da conversa. O resultado é salvo em uma variável do contexto.

**Configuração:**
- **Template:** Texto base com variáveis `${{variavel}}`
- **Salvar em:** Nome da variável onde o resultado será armazenado
- **Modo:** Substituir (sobrescreve) ou Acumular (concatena com valor existente)
- **Separador:** Para modo acumular, texto usado entre valores (ex: `\n`)

**Operações disponíveis:**

| Grupo | Operação | O que faz | Exemplo |
|---|---|---|---|
| **Texto** | MAIÚSCULAS | Converte para maiúsculo | "joao" → "JOAO" |
| **Texto** | minúsculas | Converte para minúsculo | "JOAO" → "joao" |
| **Texto** | Remover espaços | Remove espaços início/fim | " oi " → "oi" |
| **Texto** | Substituir texto | Troca um texto por outro | "oi" → "olá" |
| **Texto** | Adicionar prefixo | Adiciona texto antes | "R$ " + "100" |
| **Texto** | Adicionar sufixo | Adiciona texto depois | "100" + " reais" |
| **Texto** | Recortar texto | Extrai trecho (início/fim) | posição 0 a 3 |
| **Matemática** | Operação matemática | +, -, ×, ÷, %, arredondar | "100" + 50 = "150" |
| **Matemática** | Formatar número | Define casas decimais | "1234.5" → "1,234.50" |
| **Matemática** | Formatar moeda | Formata como moeda | "1234.5" → "R$ 1,234.50" |
| **Listas** | Formatar lista | Formata cada item de um array | Ver abaixo |
| **Listas** | Somar campo da lista | Soma campo numérico de um array | Ver abaixo |

#### Operações de Listas (para uso com agendamento de arquivos)

Quando o agendamento importa um arquivo CSV com agrupamento, a variável `linhas` contém um array com os dados de cada linha do grupo. As operações de lista permitem formatar e calcular esses dados.

**Formatar lista (`format_list`):**

Formata cada item do array usando um template e junta tudo com um separador.

| Campo | Descrição | Exemplo |
|---|---|---|
| Variável da lista | Nome da variável que contém o array | `linhas` |
| Template por item | Texto com `{campo}` para cada item | `{vencimento}: R$ {valor}` |
| Separador | Texto entre cada item (padrão: `\n`) | `\n` |

**Exemplo prático:**
Se `linhas` contém:
```json
[
  {"vencimento": "27/01/2025", "valor": "50", "codigo": "001"},
  {"vencimento": "27/03/2025", "valor": "50", "codigo": "002"},
  {"vencimento": "27/04/2025", "valor": "50", "codigo": "003"}
]
```

Com template `{vencimento}: Valor: R$ {valor}` e separador `\n`, o resultado será:
```
27/01/2025: Valor: R$ 50
27/03/2025: Valor: R$ 50
27/04/2025: Valor: R$ 50
```

**Somar campo da lista (`sum_field`):**

Soma os valores numéricos de um campo específico em todos os itens do array.

| Campo | Descrição | Exemplo |
|---|---|---|
| Variável da lista | Nome da variável que contém o array | `linhas` |
| Campo a somar | Nome do campo cujos valores serão somados | `valor` |

**Exemplo:** Com o mesmo `linhas` acima e campo `valor`, o resultado será `150`.

**Agrupar lista por campo (`group_list`):**

Agrupa os itens de um array pelo valor de um campo, criando sub-grupos. Funciona com qualquer array no contexto — dados de API, arquivo CSV, etc.

| Campo | Descrição | Exemplo |
|---|---|---|
| Variável da lista | Nome da variável que contém o array | `pedidos` |
| Campo para agrupar | Nome do campo cujos valores definem os grupos | `cliente` |

**Exemplo prático:**
Se `pedidos` contém:
```json
[
  {"cliente": "João", "telefone": "5511999", "produto": "Sofá", "valor": 2500},
  {"cliente": "João", "telefone": "5511999", "produto": "Mesa", "valor": 1200},
  {"cliente": "Maria", "telefone": "5527888", "produto": "Cama", "valor": 3000}
]
```

Com campo `cliente` e salvando em `grupos`, o resultado será:
```json
[
  {
    "key": "João",
    "cliente": "João",
    "telefone": "5511999",
    "linhas": [{"cliente":"João","produto":"Sofá","valor":2500}, {"cliente":"João","produto":"Mesa","valor":1200}],
    "total_linhas": 2,
    "produto": "Sofá\nMesa",
    "valor": "2500\n1200"
  },
  {
    "key": "Maria",
    "cliente": "Maria",
    "telefone": "5527888",
    "linhas": [{"cliente":"Maria","produto":"Cama","valor":3000}],
    "total_linhas": 1,
    "produto": "Cama",
    "valor": "3000"
  }
]
```

Cada grupo contém:
- `key` — valor do campo agrupado
- `linhas` — array com os itens originais do grupo
- `total_linhas` — quantidade de itens
- Demais campos concatenados com `\n`

**Uso típico:** Após agrupar, use um **Loop** sobre `grupos` e dentro do loop use `format_list` no `item.linhas` para formatar cada grupo.

#### Exemplo completo: Cobrança com múltiplas parcelas

**Fluxo:** Início → Expressão 1 → Expressão 2 → Mensagem → Finalizar

**Expressão 1 (Formatar detalhes):**
- Operação: Formatar lista
- Variável: `linhas`
- Template: `{vencimento}: R$ {valor}`
- Salvar em: `detalhes`

**Expressão 2 (Calcular total):**
- Operação: Somar campo da lista
- Variável: `linhas`
- Campo: `valor`
- Salvar em: `total`

**Mensagem:**
```
Olá ${{nome}}, segue os vencimentos da sua fatura:

${{detalhes}}

Total: R$ ${{total}}

Obrigado!
```

**Resultado final:**
```
Olá João, segue os vencimentos da sua fatura:

27/01/2025: R$ 50
27/03/2025: R$ 50
27/04/2025: R$ 50

Total: R$ 150

Obrigado!
```

### 🏁 Finalizar

Encerra a conversa, envia mensagem de despedida e reseta o contexto. A próxima mensagem do usuário reinicia o fluxo.

---

## Inteligência Artificial

### 🤖 AI Router — Classificação de Intenções

O AI Router usa IA (OpenAI ou Google Gemini) para entender o que o usuário quer, sem depender de palavras-chave exatas.

**Diferença do Router Inteligente:**
- Router Inteligente: compara texto com regras fixas ("contém pedido", "igual a 1")
- AI Router: a IA entende o significado ("quero saber onde tá minha encomenda" → intenção: consultar_pedido)

**Como configurar:**

1. **Provedor:** OpenAI ou Gemini
2. **API Key:** Sua chave da API
3. **Modelo:** Recomendamos gpt-4o-mini (OpenAI) ou gemini-2.0-flash (Gemini) — bom equilíbrio entre custo e qualidade
4. **Prompt do sistema:** Explique o contexto do seu negócio

**Exemplo de prompt:**
```
Você é o classificador de intenções da loja de móveis Casa Nova.
Os clientes geralmente querem:
- Consultar status de pedidos
- Ver produtos disponíveis
- Solicitar assistência técnica
- Falar com um vendedor
- Pedir segunda via de boleto

Classifique a mensagem do cliente na intenção mais adequada.
Se a mensagem não se encaixa em nenhuma, retorne "none".
```

5. **Intenções:** Adicione cada uma com nome e descrição

| Nome | Descrição |
|---|---|
| consultar_pedido | Cliente quer saber status, rastreio ou informações de um pedido |
| ver_produtos | Cliente quer ver catálogo, preços ou disponibilidade |
| assistencia_tecnica | Produto com defeito, problema ou solicitação de reparo |
| falar_vendedor | Cliente quer atendimento humano para compra |
| segunda_via_boleto | Cliente precisa de boleto atualizado ou 2ª via |

6. **Resposta padrão (opcional):** Se ativado, a IA gera uma resposta livre quando não identifica nenhuma intenção, ao invés de mostrar erro.

**Cada intenção vira uma saída do nó.** Conecte cada saída ao fluxo correspondente.

---

### 🧠 Agente IA — O Componente Mais Poderoso

O Agente IA é um assistente conversacional completo. Ele mantém histórico da conversa, entende contexto, e pode executar ações (tools) automaticamente.

**Diferença dos outros componentes:**
- Mensagem/Botões/Lista: enviam conteúdo fixo
- Router/AI Router: classificam e direcionam
- **Agente IA: conversa livremente E executa ações**

**Configuração básica:**

1. **Provedor:** OpenAI, Gemini ou Azure
2. **API Key:** Sua chave
3. **Modelo:** gpt-4o-mini ou gemini-2.0-flash para a maioria dos casos
4. **Temperatura:** 0 = respostas precisas e consistentes, 1 = respostas mais criativas
5. **Max tokens:** Limite do tamanho da resposta (1000 é um bom padrão)
6. **Max iterações:** Quantas tools o agente pode chamar em sequência (10 é suficiente)

**O prompt é o coração do agente.** Quanto mais detalhado, melhor.

#### Como escrever um bom prompt

**Estrutura recomendada:**

```
Você é [quem o agente é] da [empresa].

PERSONALIDADE:
- [tom de voz, estilo de comunicação]
- [idioma, formalidade]

O QUE VOCÊ PODE FAZER:
- [lista de capacidades]

REGRAS:
- [limites e restrições]

INFORMAÇÕES ÚTEIS:
- [dados que o agente precisa saber]
```

**Exemplo completo:**

```
Você é a Ana, assistente virtual da Casa Nova Móveis.

PERSONALIDADE:
- Responda sempre em português, de forma simpática e profissional
- Use emojis com moderação (máximo 2 por mensagem)
- Mantenha respostas curtas (máximo 3 parágrafos)
- Trate o cliente pelo nome quando disponível: ${{nome}}

O QUE VOCÊ PODE FAZER:
- Consultar status de pedidos (precisa do número do pedido e CPF)
- Verificar prazo de entrega por CEP
- Consultar estoque por região
- Gerar segunda via de boleto
- Transferir para atendente humano quando necessário

REGRAS:
- NUNCA invente informações — sempre use as tools para buscar dados reais
- Se não conseguir ajudar, transfira para o departamento adequado
- Não faça promessas de prazo sem consultar a tool
- Se o cliente estiver irritado, seja empático e ofereça solução
- Não discuta política, religião ou assuntos fora do escopo da loja

INFORMAÇÕES:
- Horário de funcionamento: Seg-Sex 8h-18h, Sáb 8h-12h
- Telefone da loja: (27) 3333-4444
- Prazo de troca: até 7 dias após recebimento
- Frete grátis para compras acima de R$ 1.500
```

---

### 🔧 Tools — As Ações do Agente

Tools são funções que o agente pode executar durante a conversa. A IA decide sozinha quando e qual tool usar.

#### Tipos de Tools

| Tipo | Ícone | Para que serve |
|---|---|---|
| HTTP Request | 🌐 | Chamar APIs externas |
| Buscar Contexto | 💾 | Consultar dados já coletados na conversa |
| Salvar Dados | 💾 | Guardar informações extraídas da conversa |
| Enviar Botões | 🔘 | Enviar mensagem com botões clicáveis (até 3) |
| Enviar Lista | 📋 | Enviar lista de opções selecionáveis |
| Transferir | 👤 | Encaminhar para departamento humano |
| Finalizar | 🏁 | Encerrar o atendimento |
| Custom Function | ⚡ | Código Python personalizado |

#### 🌐 Tool HTTP Request — Detalhado

Esta é a tool mais usada. Permite que o agente chame qualquer API.

**Campos:**

| Campo | O que é | Exemplo |
|---|---|---|
| Nome | Identificador da tool (snake_case) | `consultar_pedido` |
| Descrição | Explica para a IA quando usar | "Consulta status de um pedido pelo número e CPF" |
| Método | Verbo HTTP | GET, POST, PUT, DELETE |
| URL | Endpoint da API | `https://api.erp.com/pedidos/{numero}` |
| Headers | Cabeçalhos | `{"Authorization": "Bearer ${{secret.TOKEN}}"}` |
| Parâmetros | JSON Schema dos argumentos | Ver abaixo |

**Como os parâmetros funcionam:**

Os parâmetros dizem à IA quais dados ela precisa extrair da conversa. Use JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "numero_pedido": {
      "type": "string",
      "description": "Número do pedido (ex: 12345)"
    },
    "cpf": {
      "type": "string",
      "description": "CPF do cliente, somente números (11 dígitos)"
    }
  },
  "required": ["numero_pedido", "cpf"]
}
```

**Campos importantes do JSON Schema:**

| Campo | Função |
|---|---|
| `type` | Tipo do dado: string, number, boolean, integer |
| `description` | **O mais importante!** A IA lê isso para saber o que preencher |
| `enum` | Restringe valores possíveis: `["opcao1", "opcao2"]` |
| `required` | Lista de campos obrigatórios — a IA só chama a tool quando tiver todos |

**Variáveis na URL:**

| Sintaxe | Fonte | Exemplo |
|---|---|---|
| `{param}` | IA preenche automaticamente | `https://api.com/clientes/{cpf}` |
| `${{campo}}` | Valor do contexto | `https://api.com/pedidos/${{ultimo_pedido}}` |
| `${{secret.X}}` | Credencial do fluxo | `${{secret.API_BASE}}/endpoint` |

Parâmetros definidos no Schema que não aparecem na URL vão automaticamente como query string (GET) ou body (POST).

#### 🔘 Tool Enviar Botões

Permite que a IA envie mensagens com botões clicáveis durante a conversa. A IA decide sozinha quando é melhor oferecer botões ao invés de esperar o usuário digitar.

**Quando a IA usa:** Quando há até 3 opções claras e quer simplificar a escolha do usuário.

**O que a IA controla:**
- Texto da mensagem acima dos botões
- Textos dos botões (máximo 3 — limitação do WhatsApp)

**Exemplo prático:** O cliente pergunta "Vocês têm sofás disponíveis?". A IA consulta o estoque via tool HTTP e depois envia:

```
Mensagem: "Encontrei 2 sofás disponíveis para sua região:"
Botões: ["Sofá Retrátil - R$ 2.500", "Sofá Fixo - R$ 1.800"]
```

O usuário clica no botão e a IA recebe o texto como resposta, podendo continuar o atendimento.

**Dica no prompt:**
```
Quando o usuário precisar escolher entre poucas opções (até 3),
use botões para facilitar. Não force o usuário a digitar quando
pode clicar.
```

#### 📋 Tool Enviar Lista

Permite que a IA envie uma lista expansível com múltiplas opções. Ideal quando há mais de 3 alternativas.

**Quando a IA usa:** Quando há muitas opções e botões não são suficientes.

**O que a IA controla:**
- Texto da mensagem
- Texto do botão que abre a lista (ex: "Ver opções")
- Título da seção
- Lista de opções com título e descrição

**Exemplo prático:** O cliente quer ver os produtos de uma categoria. A IA consulta o catálogo e envia:

```
Mensagem: "Encontrei 5 produtos na categoria Sala de Estar:"
Botão: "Ver produtos"
Opções:
  - Sofá Retrátil 3 Lugares | R$ 2.500 - Disponível
  - Sofá Fixo 2 Lugares | R$ 1.800 - Disponível
  - Poltrona Decorativa | R$ 890 - Disponível
  - Mesa de Centro | R$ 450 - Últimas unidades
  - Rack para TV 55" | R$ 1.200 - Disponível
```

**Dica no prompt:**
```
Quando houver mais de 3 opções para apresentar, use a lista ao
invés de digitar todas as opções no texto. Inclua preço e
disponibilidade na descrição de cada item quando possível.
```

**Combinando botões e lista com outras tools:**

A IA pode encadear tools livremente. Por exemplo:
1. Chama `consultar_estoque` (HTTP) → recebe lista de produtos
2. Se 1-3 resultados → chama `enviar_botoes` com as opções
3. Se 4+ resultados → chama `enviar_lista` com todas as opções
4. Usuário clica → IA chama `consultar_produto` com o item selecionado

Tudo isso acontece automaticamente baseado no prompt e nas descriptions das tools.

#### 💾 Tool Salvar Dados

A IA extrai informações da conversa e salva no contexto, sem precisar de um nó Input.

**Quando usar:** Quando dados chegam naturalmente na conversa, sem perguntas diretas.

**Exemplo:** O cliente diz "Meu nome é João, CPF 123.456.789-00 e moro em Vitória". A IA chama:
```
salvar_dados(data: {
  "nome": "João",
  "cpf": "12345678900",
  "cidade": "Vitória"
})
```

Os dados ficam disponíveis como `${{nome}}`, `${{cpf}}`, `${{cidade}}`.

#### 👤 Tool Transferir Departamento

A IA identifica o departamento mais adequado e transfere automaticamente.

**Configuração:** Selecione quais departamentos a IA pode usar (checkboxes). A IA recebe a lista com IDs e nomes, e escolhe o melhor com base na conversa.

**Exemplo:** O cliente reclama de um produto com defeito. A IA identifica que é assunto de assistência técnica e transfere para o departamento correto, gerando uma mensagem de despedida personalizada.

#### 🏁 Tool Finalizar

A IA encerra a conversa quando o assunto foi resolvido. Ela gera uma mensagem de despedida contextualizada, fecha o ticket no MonitChat e reseta o fluxo.

#### ⚡ Tool Custom Function

Executa código Python personalizado. Para lógica de negócio que não se resolve com uma chamada de API simples.

**Variáveis disponíveis no código:**

| Variável | Tipo | Conteúdo |
|---|---|---|
| `args` | dict | Argumentos que a IA forneceu |
| `context` | dict | Dados da conversa |
| `secrets` | dict | Credenciais do fluxo |
| `json` | module | Módulo json do Python |
| `re` | module | Módulo de regex |
| `math` | module | Módulo math |
| `datetime` | module | Módulo datetime |
| `requests` | module | Módulo requests (chamadas HTTP) |

**Regra:** Defina a variável `result` com o retorno. Pode ser dict, list, string, número ou boolean.

**Exemplo: Calcular parcelas com juros**
```python
valor = float(args.get("valor", 0))
parcelas = int(args.get("parcelas", 1))
taxa = 0.029  # 2.9% ao mês

valor_parcela = valor * (taxa * (1 + taxa) ** parcelas) / ((1 + taxa) ** parcelas - 1)

result = {
    "valor_total": round(valor * (1 + taxa * parcelas), 2),
    "valor_parcela": round(valor_parcela, 2),
    "parcelas": parcelas
}
```

**Exemplo: Validar regra de negócio**
```python
cpf = args.get("cpf", "")
valor_pedido = float(args.get("valor", 0))

# Consulta limite de crédito
resp = requests.get(
    f"https://api.erp.com/credito/{cpf}",
    headers={"Authorization": f"Bearer {secrets.get('ERP_TOKEN')}"},
    timeout=10,
)
dados = resp.json()
limite = float(dados.get("limite_disponivel", 0))

result = {
    "aprovado": valor_pedido <= limite,
    "limite_disponivel": limite,
    "valor_pedido": valor_pedido,
    "mensagem": "Crédito aprovado!" if valor_pedido <= limite else f"Limite insuficiente. Disponível: R$ {limite:.2f}"
}
```

---

## Cenários do Dia a Dia

### Cenário 1: Menu de Atendimento Básico

**Situação:** Loja quer um menu simples para direcionar clientes.

**Fluxo:**
```
Início
  → Mensagem: "Olá! Bem-vindo à Casa Nova Móveis 🏠"
    → Botões: "Consultar pedido" / "Falar com vendedor" / "Suporte"
      → Router (3 saídas):
        → "Consultar pedido" → [fluxo de consulta]
        → "Falar com vendedor" → Transferir (dept: Vendas)
        → "Suporte" → Transferir (dept: Suporte)
```

### Cenário 2: Consulta de Pedido com Validação

**Situação:** Cliente quer saber o status do pedido. Precisa do número e CPF.

**Fluxo:**
```
Início
  → Mensagem: "Para consultar seu pedido, preciso de algumas informações."
    → Mensagem: "Qual o número do pedido?"
      → Input (tipo: number, key: numero_pedido)
        → Mensagem: "Agora informe seu CPF:"
          → Input (tipo: cpf, key: cpf)
            → API Request: GET https://api.erp.com/pedidos/${{numero_pedido}}?cpf=${{cpf}}
              → Mensagem: "Pedido #${{numero_pedido}}
                           Status: ${{api_response.status}}
                           Previsão: ${{api_response.previsao_entrega}}"
                → Finalizar
```

### Cenário 3: Agente IA Completo para Loja

**Situação:** Loja quer atendimento automatizado inteligente que resolve a maioria dos casos.

**Fluxo:**
```
Início
  → Mensagem: "Olá! Sou a Ana, assistente da Casa Nova 😊"
    → Agente IA (com 5 tools):
        Tool 1: consultar_pedido (HTTP GET)
        Tool 2: consultar_prazo (HTTP GET)
        Tool 3: gerar_boleto (HTTP POST)
        Tool 4: salvar_dados (Salvar Contexto)
        Tool 5: transferir (Transferir Departamento)
        Tool 6: finalizar (Finalizar)
```

**Prompt do agente:**
```
Você é a Ana, assistente virtual da Casa Nova Móveis.

Seja simpática, objetiva e profissional.

CAPACIDADES:
- Consultar pedidos por número e CPF
- Verificar prazo de entrega por CEP
- Gerar 2ª via de boleto
- Salvar dados do cliente
- Transferir para atendente quando necessário
- Finalizar atendimento quando resolvido

REGRAS:
- Sempre consulte as tools antes de responder sobre pedidos/prazos
- Peça CPF e número do pedido antes de consultar
- Se não conseguir resolver, transfira para o departamento adequado
- Respostas curtas (máximo 3 parágrafos)
```

### Cenário 4: Atendimento com IA + Fallback Humano

**Situação:** IA resolve o que consegue, mas transfere automaticamente quando não sabe.

**Fluxo:**
```
Início
  → AI Router (classifica intenção):
    → consulta_simples → Agente IA (com tools de consulta)
    → reclamacao → Transferir (dept: SAC)
    → compra → Transferir (dept: Vendas)
    → erro/não identificado → Agente IA (resposta livre + tool de transferir)
```

### Cenário 5: Pesquisa de Satisfação

**Situação:** Após o atendimento, coletar feedback.

**Fluxo:**
```
Início
  → Mensagem: "Como foi seu atendimento?"
    → Botões: "Ótimo" / "Regular" / "Ruim"
      → Router:
        → "Ótimo" → Mensagem: "Que bom! 😊" → Finalizar
        → "Regular" → Mensagem: "O que podemos melhorar?"
          → Input (texto, key: feedback) → API POST (salvar feedback) → Finalizar
        → "Ruim" → Mensagem: "Sentimos muito. Vou te direcionar para um supervisor."
          → Transferir (dept: Supervisão)
```

### Cenário 6: Consulta Encadeada (CEP → Estoque)

**Situação:** Cliente quer saber se tem estoque de um produto na região dele.

**Configuração no Agente IA:**

Tool 1 — `consultar_regiao`:
```
Descrição: Identifica o centro de distribuição pela região do CEP
URL: https://api.logistica.com/regioes/{cep}
Parâmetros: cep (string, obrigatório) - "CEP de entrega, 8 dígitos"
```

Tool 2 — `consultar_estoque`:
```
Descrição: Consulta estoque de um produto em um centro de distribuição.
           Use o código do CD retornado pela tool consultar_regiao.
URL: https://api.erp.com/estoque/{codigo_produto}?cd={centro_distribuicao}
Parâmetros:
  - codigo_produto (string, obrigatório) - "Código ou nome do produto"
  - centro_distribuicao (string, obrigatório) - "Código do CD retornado pela consulta de região"
```

**O que acontece:**
1. Cliente: "Tem o sofá retrátil pro CEP 29100-000?"
2. IA chama `consultar_regiao(cep: "29100000")` → retorna `{cd: "CD-ES", regiao: "ES-Sul"}`
3. IA chama `consultar_estoque(codigo_produto: "sofa-retratil", centro_distribuicao: "CD-ES")` → retorna `{disponivel: true, quantidade: 5, prazo: "7 dias"}`
4. IA responde: "Sim! Temos 5 unidades do sofá retrátil disponíveis para sua região. Prazo de entrega: 7 dias úteis. Deseja fazer o pedido?"

### Cenário 7: Validação de Crédito com Custom Function

**Situação:** Antes de aprovar um pedido, verificar limite de crédito com regras de negócio complexas.

**Tool Custom Function:**

Nome: `validar_credito`
Descrição: `Valida se o cliente tem crédito disponível para o valor do pedido`
Parâmetros:
```json
{
  "type": "object",
  "properties": {
    "cpf": {"type": "string", "description": "CPF do cliente"},
    "valor": {"type": "number", "description": "Valor total do pedido em reais"}
  },
  "required": ["cpf", "valor"]
}
```

Código:
```python
cpf = args.get("cpf")
valor = float(args.get("valor", 0))

# Consulta limite no ERP
resp = requests.get(
    f"{secrets.get('ERP_BASE')}/credito/{cpf}",
    headers={"Authorization": f"Bearer {secrets.get('ERP_TOKEN')}"},
    timeout=10,
)
dados = resp.json()

limite = float(dados.get("limite_disponivel", 0))
score = int(dados.get("score", 0))
parcelas_max = 3 if score < 500 else 6 if score < 700 else 12

aprovado = valor <= limite and score >= 300

result = {
    "aprovado": aprovado,
    "limite": limite,
    "score": score,
    "parcelas_max": parcelas_max,
    "motivo": "Aprovado" if aprovado else "Score baixo" if score < 300 else "Limite insuficiente"
}
```

### Cenário 8: Catálogo Interativo com Botões e Lista

**Situação:** Cliente quer ver produtos disponíveis. A IA consulta o estoque e apresenta de forma interativa.

**Configuração no Agente IA:**

Prompt:
```
Você é a assistente virtual da loja Casa Nova Móveis.

Quando o cliente pedir para ver produtos:
1. Pergunte qual categoria (ou use botões com as categorias mais populares)
2. Consulte o estoque da categoria
3. Se houver até 3 produtos, envie como botões
4. Se houver mais de 3, envie como lista com preço e disponibilidade
5. Quando o cliente escolher um produto, mostre os detalhes completos

Sempre use botões ou lista quando possível — evite que o usuário precise digitar.
```

Tools:
- `consultar_categorias` (HTTP GET) → retorna categorias
- `consultar_produtos` (HTTP GET) → retorna produtos por categoria
- `enviar_botoes` (Botões) → para poucas opções
- `enviar_lista` (Lista) → para muitas opções
- `salvar_dados` (Salvar) → guarda preferências do cliente

**Conversa exemplo:**
```
Cliente: "Quero ver sofás"

IA chama: consultar_produtos(categoria: "sofas")
   → retorna 5 produtos

IA chama: enviar_lista(
    message: "Encontrei 5 sofás disponíveis:",
    button_text: "Ver sofás",
    options: [
      {title: "Sofá Retrátil 3L", description: "R$ 2.500 - Disponível"},
      {title: "Sofá Fixo 2L", description: "R$ 1.800 - Disponível"},
      {title: "Sofá Canto L", description: "R$ 3.200 - Disponível"},
      {title: "Sofá-Cama", description: "R$ 1.500 - Últimas unidades"},
      {title: "Poltrona Reclinável", description: "R$ 890 - Disponível"}
    ]
)

Cliente clica: "Sofá Retrátil 3L"

IA chama: consultar_produto(id: "sofa-retratil-3l")
   → retorna detalhes completos

IA responde: "O Sofá Retrátil 3 Lugares é perfeito para..."

IA chama: enviar_botoes(
    message: "O que gostaria de fazer?",
    buttons: ["Comprar agora", "Ver mais opções", "Falar com vendedor"]
)
```

---

## Conexões e Condições

Ao clicar em uma seta (conexão) entre dois nós, você pode adicionar condições. Isso permite criar ramificações sem precisar de um Router.

**Tipos de condição nas conexões:**

| Tipo | Cor | Quando usar |
|---|---|---|
| Sem condição | Cinza | Caminho padrão (sempre segue) |
| Igual a | Verde | Resposta exata |
| Contém | Azul | Texto parcial |
| Contexto | Amarelo | Baseado em valor salvo |
| Positivo | Roxo | Sim/ok/claro |
| Número | Ciano | Somente dígitos |
| Regex | Vermelho | Padrão personalizado |

**Exemplo:** Após um nó de botões "Sim/Não", ao invés de usar Router, coloque condição "Positivo" na conexão para "Sim" e "Sem condição" na outra para "Não" (fallback).

---

## Contas e Ativação

### Múltiplos Fluxos

Você pode ter vários fluxos ativos simultaneamente. Cada fluxo responde nas contas (canais) vinculadas a ele.

**Regra importante:** Uma conta só pode estar em **um fluxo ativo** por vez. Se tentar vincular uma conta que já está em outro fluxo ativo, o sistema pergunta se quer removê-la do outro.

### Configurar Contas

1. Abra o fluxo no editor
2. Menu → "Contas Permitidas"
3. Selecione os canais (WhatsApp, Instagram, etc.)
4. Salve

**Se nenhuma conta for selecionada, o fluxo não responde a ninguém** — mesmo estando ativo.

---

## Agendamento de Fluxos

O agendamento permite disparar fluxos automaticamente em horários definidos, sem depender de uma mensagem do usuário. Ideal para campanhas, cobranças, lembretes e notificações.

### Modos de Execução

| Modo | Descrição |
|---|---|
| **Passivo** | O fluxo só responde quando o usuário manda mensagem (padrão) |
| **Ativo** | O fluxo só executa via agendamento — mensagens recebidas são ignoradas |
| **Ambos** | O fluxo responde mensagens E executa via agendamento |

**Importante:** Se o fluxo está como **Ativo** e o usuário responde uma mensagem enviada pelo agendamento, a resposta será **ignorada**. Use **Ambos** se precisar que o fluxo continue a conversa após o disparo.

### Tipos de Agendamento

| Tipo | Descrição | Exemplo |
|---|---|---|
| **Intervalo** | Executa a cada N minutos | A cada 30 minutos |
| **Diário** | Executa em horários específicos | Todos os dias às 08:00 e 14:00 |
| **Semanal** | Executa em dias e horários específicos | Segunda e quarta às 10:00 |

### Regras de Bloqueio

- **Bloquear fins de semana:** Não executa sábado/domingo
- **Bloquear feriados:** Não executa em feriados
- **Datas bloqueadas:** Selecione datas específicas no calendário
- **Janela de horário:** Define horário mínimo e máximo (ex: 08:00 a 18:00)

### Tipos de Destinatário

#### Sem destinatário fixo

O fluxo é executado sem um alvo pré-definido. Ele decide internamente para quais contatos enviar usando sua própria lógica (nós API Request, etc.).

#### Lista de números

Cole uma lista de telefones manualmente (um por linha). O fluxo é executado uma vez para cada número.

```
5511999998888
5511999997777
5521988886666
```

#### Grupo do MonitChat

Selecione grupos de contatos diretamente do MonitChat. Os contatos são buscados **automaticamente a cada execução** — se alguém for adicionado ou removido do grupo, a próxima execução já reflete.

#### Arquivo CSV/TXT

Importe um arquivo com dados dos destinatários. **A coluna `telefone` é obrigatória.** As demais colunas ficam disponíveis como variáveis no contexto de cada sessão.

**Formato do arquivo:**
- Delimitador padrão: `;` (ponto e vírgula)
- Também aceita `,` (vírgula) e TAB
- Primeira linha deve ser o cabeçalho
- Extensões aceitas: `.csv`, `.txt`, `.tsv`

**Exemplo de arquivo:**
```
telefone;nome;vencimento;valor;codigo
5511999998888;João Silva;27/01/2025;50;001
5511999998888;João Silva;27/03/2025;50;002
5511999998888;João Silva;27/04/2025;50;003
5527999997777;Maria Santos;15/02/2025;120;004
```

##### Variáveis disponíveis

Cada coluna do arquivo vira uma variável no contexto da sessão, acessível com `${{nome_da_coluna}}`:

| Coluna no arquivo | Variável no fluxo |
|---|---|
| `telefone` | `${{telefone}}` |
| `nome` | `${{nome}}` |
| `vencimento` | `${{vencimento}}` |
| `valor` | `${{valor}}` |
| `codigo` | `${{codigo}}` |

##### Agrupamento por coluna

Quando o mesmo telefone (ou outro campo) aparece em várias linhas, você pode **agrupar** para enviar apenas uma mensagem com todos os dados.

**Como configurar:**
1. Faça upload do arquivo
2. No dropdown "Agrupar por", selecione a coluna desejada (ex: `telefone`)
3. Linhas com o mesmo valor na coluna escolhida serão combinadas em uma única execução

**O que acontece no contexto quando agrupa:**

| Variável | Conteúdo | Exemplo |
|---|---|---|
| `${{telefone}}` | Primeiro telefone do grupo | `5511999998888` |
| `${{nome}}` | Valores concatenados com `\n` | `João Silva` |
| `${{vencimento}}` | Valores concatenados com `\n` | `27/01/2025\n27/03/2025\n27/04/2025` |
| `${{valor}}` | Valores concatenados com `\n` | `50\n50\n50` |
| `${{linhas}}` | **Array completo** com todas as linhas | `[{telefone, nome, vencimento, valor, codigo}, ...]` |
| `${{total_linhas}}` | Quantidade de linhas no grupo | `3` |

**Para formatar os dados agrupados**, use o nó **Expressão** com as operações de lista:

1. **Formatar lista** — monta o texto formatado a partir do array `linhas`
2. **Somar campo da lista** — soma valores numéricos (ex: total da fatura)

Veja a seção [📝 Expressão](#-expressão) para exemplos completos.

##### Exemplo passo a passo: Cobrança por WhatsApp

**1. Arquivo CSV:**
```
telefone;nome;vencimento;valor
5511999998888;João;27/01/2025;50
5511999998888;João;27/03/2025;50
5511999998888;João;27/04/2025;50
5527999997777;Maria;15/02/2025;120
```

**2. Configuração do agendamento:**
- Tipo: Diário, às 09:00
- Modo: Ativo
- Destinatário: Arquivo CSV
- Agrupar por: `telefone`

**3. Fluxo:**
```
Início → Expressão (formatar) → Expressão (somar) → Template WhatsApp → Fim
```

**4. Expressão 1 — Formatar detalhes:**
- Operação: Formatar lista
- Variável: `linhas`
- Template por item: `{vencimento}: R$ {valor}`
- Salvar em: `detalhes`

**5. Expressão 2 — Calcular total:**
- Operação: Somar campo da lista
- Variável: `linhas`
- Campo: `valor`
- Salvar em: `total`

**6. Mensagem/Template:**
```
Olá ${{nome}}, segue os vencimentos da sua fatura:

${{detalhes}}

Total: R$ ${{total}}

Obrigado!
```

**7. Resultado — João recebe:**
```
Olá João, segue os vencimentos da sua fatura:

27/01/2025: R$ 50
27/03/2025: R$ 50
27/04/2025: R$ 50

Total: R$ 150

Obrigado!
```

**8. Resultado — Maria recebe:**
```
Olá Maria, segue os vencimentos da sua fatura:

15/02/2025: R$ 120

Total: R$ 120

Obrigado!
```

#### Dinâmico

O fluxo utiliza nós `api_request` ou lógica customizada para buscar a lista de destinatários a cada execução.

### Contexto Inicial

Em qualquer tipo de destinatário, você pode definir um **contexto inicial** em JSON. Essas variáveis estarão disponíveis no fluxo em toda execução agendada.

```json
{
  "campanha": "black-friday",
  "prioridade": "alta",
  "origem": "agendamento"
}
```

Use no fluxo com `${{campanha}}`, `${{prioridade}}`, etc.

---

## Dicas e Boas Práticas

### Para fluxos tradicionais (sem IA)
- Comece com Mensagem + Botões para o menu principal
- Use Input para coletar dados validados
- Use Router para tratar cada opção
- Sempre tenha um caminho de "erro" ou "não entendi"
- Finalize com mensagem de despedida

### Para Agentes IA
- **Prompt detalhado = agente melhor.** Invista tempo no prompt.
- Use `${{nome}}` no prompt para personalizar
- Cada tool precisa de uma **description clara** — é assim que a IA sabe quando usá-la
- O campo **description dos parâmetros** é fundamental — diga exatamente o formato esperado
- Use `required` para garantir que a IA não chame a tool sem ter todos os dados
- Teste no Playground antes de ativar
- Comece com poucas tools e vá adicionando conforme necessidade
- `gpt-4o-mini` e `gemini-2.0-flash` são os melhores custo-benefício

### Segurança
- Nunca coloque API keys direto nos nós — use Secrets (`${{secret.NOME}}`)
- Credenciais são mascaradas na interface
- Código Python de Custom Functions roda em ambiente restrito
- Exporte o fluxo regularmente como backup (menu → Exportar JSON)

### API Keys com variáveis

Todos os campos de API key aceitam variáveis. Ao invés de colar a key direto, use:

| Sintaxe | Fonte | Exemplo |
|---|---|---|
| `${{secret.OPENAI_KEY}}` | Secrets do fluxo | Configurado em menu → Variáveis de Ambiente |
| `${{env.OPENAI_API_KEY}}` | Variável de ambiente do servidor | Definida no .env ou docker-compose |
| `sk-proj-abc123...` | String direta | Funciona, mas não recomendado |

**Recomendação:** Cadastre a key uma vez nos Secrets do fluxo e use `${{secret.OPENAI_KEY}}` em todos os nós (AI Router, Agente IA, RAG). Assim, se precisar trocar a key, muda em um lugar só.

### Performance
- Use Delay com moderação (máximo 3-5 segundos)
- Limite o `max_iterations` do agente (10 é suficiente)
- Use `max_tokens` adequado (500-1000 para a maioria dos casos)
- Prefira `gpt-4o-mini` ao invés de `gpt-4o` — é mais rápido e mais barato

---

## Base de Conhecimento (RAG)

O RAG (Retrieval Augmented Generation) permite que o agente de IA busque informações em documentos antes de responder. Ideal para FAQs, manuais, catálogos, políticas e qualquer conteúdo que o agente precisa consultar.

### Como funciona

1. Você faz upload de documentos (PDF, TXT, CSV, Markdown) ou adiciona textos manualmente
2. O sistema divide o texto em pedaços (chunks) e gera representações vetoriais (embeddings)
3. Quando o usuário faz uma pergunta, o sistema busca os trechos mais relevantes
4. A IA recebe esses trechos como contexto e formula a resposta

### Configuração passo a passo

1. No editor do fluxo, adicione um **Agente IA**
2. Na configuração do agente, adicione a tool **🧠 RAG**
3. Clique em **"+ Nova"** para criar uma base de conhecimento
4. Configure:
   - **Provedor de Embeddings:** OpenAI (recomendado) ou Gemini
   - **Modelo:** text-embedding-3-small (melhor custo-benefício)
   - **Estratégia de Chunking:** Por tamanho, separador ou parágrafo
   - **Tamanho do Chunk:** 256-512 para precisão, 1000-2000 para mais contexto
   - **Overlap:** 50-100 caracteres (evita cortar informações entre chunks)
   - **Janela de Contexto:** 1-2 (inclui chunks vizinhos para mais contexto)
5. Faça upload dos documentos ou adicione textos
6. Configure o **Top K** (quantos trechos retornar) e **Score Mínimo** (relevância mínima)

### Estratégias de Chunking

| Estratégia | Como funciona | Quando usar |
|---|---|---|
| **Por tamanho** | Divide por N caracteres, quebrando em limites naturais | Textos corridos (manuais, artigos) |
| **Por separador** | Divide pelo texto separador (---, ===, ###) | Documentos estruturados (FAQ com seções) |
| **Por parágrafo** | Divide por linhas em branco, agrupa parágrafos pequenos | Textos bem organizados em parágrafos |

### Janela de Contexto

Ao encontrar um trecho relevante, a janela expande para incluir chunks vizinhos:

| Valor | O que retorna |
|---|---|
| 0 | Só o chunk encontrado |
| 1 | 1 antes + chunk + 1 depois |
| 2 | 2 antes + chunk + 2 depois |

**Dica:** Chunks menores (256-512) + janela de contexto 1-2 é o melhor equilíbrio entre precisão na busca e contexto na resposta.

### Top K e Score Mínimo

| Parâmetro | O que faz | Padrão |
|---|---|---|
| **Top K** | Quantos trechos mais relevantes retornar | 5 |
| **Score Mínimo** | Descarta trechos com relevância abaixo desse valor (0 a 1) | 0.3 (30%) |

Exemplos:
- `top_k=5, min_score=0.3` — Até 5 trechos com pelo menos 30% de relevância
- `top_k=3, min_score=0.5` — Até 3 trechos bem relevantes (pode não encontrar nada)
- `top_k=10, min_score=0` — 10 trechos sem filtro (mais contexto, mais ruído)

### Exemplo: FAQ da loja

**Prompt do agente:**
```
Você é a assistente virtual da Casa Nova Móveis.
SEMPRE use a tool de busca para responder perguntas.
Responda APENAS com informações encontradas nos documentos.
Se não encontrar, diga que vai verificar com a equipe.
```

**Tool RAG:**
- Nome: `buscar_informacoes`
- Descrição: `Busca informações nos documentos da loja. Use SEMPRE que o cliente perguntar algo.`
- Top K: 5
- Score Mínimo: 0.3

**Documento enviado (FAQ.txt):**
```
Qual o prazo de entrega?
O prazo de entrega varia de 3 a 15 dias úteis, dependendo da região.
---
Qual a política de troca?
Aceitamos trocas em até 7 dias após o recebimento, desde que o produto
esteja em perfeito estado e na embalagem original.
---
Vocês fazem entrega no interior?
Sim, fazemos entregas em todo o estado. Para cidades do interior,
o prazo pode ser de até 20 dias úteis.
```

**Conversa:**
```
Cliente: "Qual o prazo de entrega?"
IA busca: "prazo de entrega" → encontra trecho relevante (score 0.92)
IA responde: "O prazo de entrega varia de 3 a 15 dias úteis,
dependendo da região. Para cidades do interior, pode ser de até
20 dias úteis. 😊"
```

---

## Administração do Banco de Dados

### Backup e Restore

O script `scripts/db_backup_restore.py` gerencia backups do banco de dados:

```bash
# Backup completo (schema + dados)
python scripts/db_backup_restore.py backup

# Restaurar último backup
python scripts/db_backup_restore.py restore

# Restaurar backup específico
python scripts/db_backup_restore.py restore --file deskflow_backup_20260318_160000.sql

# Recriar banco do zero (PERDE DADOS)
python scripts/db_backup_restore.py rebuild

# Backup + recria estrutura + restaura dados (migração segura)
python scripts/db_backup_restore.py migrate
```

| Comando | O que faz | Perde dados? |
|---|---|---|
| `backup` | Salva tudo em `backups/deskflow_backup_TIMESTAMP.sql` | Não |
| `restore` | Restaura o último backup (ou `--file` específico) | Sobrescreve |
| `rebuild` | Drop banco + roda migrations + seed | Sim |
| `migrate` | Backup → rebuild → restore (melhor dos dois mundos) | Não |

**Quando usar:**

| Situação | Comando |
|---|---|
| Salvar estado atual antes de mexer | `backup` |
| Algo deu errado, quero voltar | `restore` |
| Quero banco limpo pra desenvolvimento | `rebuild` |
| Adicionei tabelas novas (ex: pgvector) | `migrate` |

---

## 14. Funis CRM

Os Funis CRM permitem acompanhar visualmente a jornada de cada contato em etapas personalizadas, com automacoes integradas ao MonitChat.

### 14.1 Conceitos Basicos

| Conceito | Descricao |
|---|---|
| **Funil** | Um pipeline com etapas sequenciais (ex: Vendas, Suporte, Pos-venda) |
| **Etapa** | Uma fase do processo (ex: Novo Lead, Qualificado, Proposta, Fechado) |
| **Card** | Um contato posicionado em uma etapa do funil |
| **Automacao** | Acao executada automaticamente quando um card entra em uma etapa |

### 14.2 Criando um Funil

1. Acesse **Funis** pelo botao no header
2. Clique em **+ Novo Funil**
3. De um nome e configure as etapas com cores
4. Clique em **Criar Funil**

Cada contato pode estar em apenas uma etapa por funil. Um contato pode estar em multiplos funis diferentes.

### 14.3 Kanban Board

O kanban exibe as etapas como colunas e os cards como cartoes:

- **Arrastar e soltar** — mova cards entre colunas para alterar a etapa
- **Adicionar card** — clique em "+ Adicionar contato" na base de qualquer coluna
- **Buscar** — campo de busca no header filtra por nome ou telefone
- **Detalhe** — clique no card para ver historico, alterar etapa ou remover

### 14.4 Automacoes por Etapa

Acesse pelo botao **Configurar** no kanban. Para cada etapa, adicione acoes que disparam automaticamente quando um card entra:

| Acao | Descricao | Requer contexto? |
|---|---|---|
| **Enviar mensagem** | Envia texto via WhatsApp | Sim (token) |
| **Enviar template** | Envia template aprovado com parametros | Sim (token + conta WA) |
| **Transferir departamento** | Roteia para departamento do MonitChat | Sim (token) |
| **Atribuir tag** | Adiciona tag ao contato | Sim (token + contact_id) |
| **Alterar status ticket** | Muda status do ticket ativo | Sim (token + ticket_id) |
| **Alterar dono ticket** | Atribui ticket a um usuario | Sim (token + ticket_id) |

> **Importante:** Automacoes que exigem contexto so funcionam para contatos que ja interagiram com o bot (tem token e ticket_id salvos). Contatos adicionados manualmente podem nao ter esses dados.

### 14.5 Integracao com Flow Builder

Use o no **Mover no Funil** no Flow Builder para que o bot mova contatos automaticamente:

```
[Cliente manda mensagem]
    |
[Bot coleta dados]
    |
[Mover no Funil -> "Novo Lead"]  <-- cria o card automaticamente
    |
[Bot qualifica]
    |
[Mover no Funil -> "Qualificado"]  <-- automacoes da etapa disparam
    |
[Transferir para vendedor]
```

**Configuracao do no:**
- **Funil** — selecione o funil destino
- **Etapa** — selecione a etapa destino
- **Criar se nao existir** — cria o card automaticamente se o contato ainda nao esta no funil (padrao: ativado)

### 14.6 Fluxo Completo (Exemplo)

1. Cliente envia mensagem no WhatsApp
2. Bot atende e coleta nome + interesse
3. No "Mover no Funil" cria card em **Novo Lead**
   - Automacao: atribui tag "lead-whatsapp"
4. Bot qualifica o lead → move para **Qualificado**
   - Automacao: transfere para dept "Vendas"
   - Automacao: envia msg "Um vendedor vai te atender!"
5. Vendedor arrasta no kanban para **Proposta**
   - Automacao: altera status do ticket para "Em negociacao"
6. Vendedor arrasta para **Fechado**
   - Automacao: atribui tag "cliente-novo"
   - Automacao: envia template de boas-vindas
