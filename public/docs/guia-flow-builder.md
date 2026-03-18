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

### Performance
- Use Delay com moderação (máximo 3-5 segundos)
- Limite o `max_iterations` do agente (10 é suficiente)
- Use `max_tokens` adequado (500-1000 para a maioria dos casos)
- Prefira `gpt-4o-mini` ao invés de `gpt-4o` — é mais rápido e mais barato
