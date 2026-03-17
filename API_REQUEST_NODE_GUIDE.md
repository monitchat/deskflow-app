# Guia do Componente API Request

## Visão Geral

O componente **API Request** permite fazer requisições HTTP customizáveis para qualquer endpoint externo, com total controle sobre método, URL, query params, headers e body. A resposta é automaticamente salva no contexto para uso posterior em outros nós do fluxo.

## Ícone

🌐 **HTTP Request**

## Funcionalidades

✅ Suporte a múltiplos métodos HTTP: GET, POST, PUT, DELETE, PATCH
✅ URL dinâmica com variáveis do contexto
✅ Query parameters customizáveis (key-value)
✅ Headers customizáveis (key-value)
✅ Body JSON para POST/PUT/PATCH
✅ Substituição automática de variáveis do contexto
✅ Resposta salva automaticamente no contexto
✅ Tratamento de erros e timeouts

## Como Usar

### 1. Adicionar ao Fluxo

1. Na **Sidebar**, arraste o componente **🌐 API Request** para o canvas
2. Clique no nó para abrir o editor

### 2. Configuração Básica

#### **Rótulo**
Nome descritivo do nó (ex: "Buscar CEP", "Criar Usuário")

#### **Método HTTP**
Escolha entre:
- **GET** - Buscar dados
- **POST** - Criar recursos
- **PUT** - Atualizar recursos completos
- **DELETE** - Deletar recursos
- **PATCH** - Atualizar parcialmente

#### **URL do Endpoint**
```
https://viacep.com.br/ws/${{cep}}/json/
```
- Use variáveis do contexto com `${{campo}}`
- Suporte para campos aninhados: `${{customer.id}}`

#### **Salvar Resposta em**
Nome da chave no contexto onde a resposta será salva (padrão: `api_response`)

### 3. Query Parameters (Opcional)

Adicione parâmetros de URL (ex: `?page=1&limit=10`):

| Key | Value |
|-----|-------|
| `page` | `1` |
| `limit` | `${{items_per_page}}` |

**Resultado:** `https://api.com/users?page=1&limit=20`

### 4. Headers (Opcional)

Adicione headers HTTP customizados:

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer ${{access_token}}` |
| `Content-Type` | `application/json` |
| `X-Custom-Header` | `valor-estatico` |

### 5. Body (POST/PUT/PATCH)

Para requisições com corpo, adicione JSON:

```json
{
  "nome": "${{nome_cliente}}",
  "email": "${{email}}",
  "endereco": {
    "cep": "${{cep}}",
    "numero": "${{numero}}"
  }
}
```

## Exemplos de Uso

### Exemplo 1: Buscar CEP via ViaCEP

**Configuração:**
- **Método:** GET
- **URL:** `https://viacep.com.br/ws/${{cep}}/json/`
- **Context Key:** `endereco`

**Uso posterior:**
```
Rua: ${{endereco.logradouro}}
Bairro: ${{endereco.bairro}}
Cidade: ${{endereco.localidade}} - ${{endereco.uf}}
```

### Exemplo 2: Criar Pedido em API Externa

**Configuração:**
- **Método:** POST
- **URL:** `https://api.loja.com/v1/orders`
- **Headers:**
  - `Authorization`: `Bearer abc123xyz`
  - `Content-Type`: `application/json`
- **Body:**
```json
{
  "customer_id": "${{customer.id}}",
  "items": [
    {
      "product_id": "${{produto_id}}",
      "quantity": 1
    }
  ],
  "total": "${{total}}"
}
```
- **Context Key:** `pedido_criado`

**Uso posterior:**
```
Pedido #${{pedido_criado.order_id}} criado com sucesso!
Status: ${{pedido_criado.status}}
```

### Exemplo 3: Buscar Dados de Usuário

**Configuração:**
- **Método:** GET
- **URL:** `https://api.github.com/users/${{github_username}}`
- **Context Key:** `github_user`

**Uso posterior:**
```
Nome: ${{github_user.name}}
Bio: ${{github_user.bio}}
Repos: ${{github_user.public_repos}}
```

## Dados Salvos no Contexto

Quando a requisição é executada, os seguintes dados são salvos:

### Chave Principal (`context_key`)
Contém a resposta completa da API (JSON parseado ou objeto com texto/headers)

### Metadados Auxiliares
- `{context_key}_status` - HTTP status code (200, 404, 500, etc)
- `{context_key}_success` - Boolean indicando sucesso (status 2xx)

### Resultado Específico do Nó
- `_api_result_{node_id}` - Metadados detalhados incluindo URL, método, status

**Exemplo:**
```json
{
  "api_response": {
    "id": 123,
    "name": "João Silva",
    "email": "joao@example.com"
  },
  "api_response_status": 200,
  "api_response_success": true
}
```

## Condições Baseadas em Resposta

Use as flags de sucesso para criar condições:

**Exemplo com Router:**
1. Conecte o nó API Request a um Router
2. Configure opções no Router:
   - **Opção "Sucesso"**: `${{api_response_success}}` equals `true`
   - **Opção "Erro"**: `${{api_response_success}}` equals `false`

## Tratamento de Erros

### Timeout (30 segundos)
```json
{
  "api_response": {"error": "Request timeout"},
  "api_response_status": 408,
  "api_response_success": false
}
```

### Erro de Conexão
```json
{
  "api_response": {"error": "Connection refused"},
  "api_response_status": 0,
  "api_response_success": false
}
```

### Resposta Não-JSON
Se a API retornar texto simples:
```json
{
  "api_response": {
    "status_code": 200,
    "text": "Resposta em texto",
    "headers": {...}
  }
}
```

## Boas Práticas

### ✅ Recomendado

1. **Sempre defina um Context Key descritivo**
   - ❌ `api_response`
   - ✅ `endereco_cep`, `pedido_criado`, `usuario_github`

2. **Use variáveis para valores dinâmicos**
   ```json
   {
     "customer_id": "${{customer.id}}",
     "timestamp": "${{current_timestamp}}"
   }
   ```

3. **Adicione timeout handling no fluxo**
   - Use Router para verificar `${{api_response_success}}`
   - Crie mensagens de erro amigáveis

4. **Valide dados antes de usar**
   - Verifique se campos existem: `${{api_response.campo}}`
   - Use set_context para transformar dados se necessário

### ⚠️ Evite

1. **Não coloque credenciais sensíveis diretamente no fluxo**
   - Use variáveis de ambiente ou busque tokens de um serviço seguro

2. **Não faça requisições sem tratamento de erro**
   - Sempre conecte a um Router ou verifique `_success`

3. **Não use URLs hardcoded quando possível**
   - Prefira `https://api.com/users/${{user_id}}`
   - Ao invés de `https://api.com/users/123`

## Logs e Debug

O interpretador gera logs detalhados:

```
🌐 API REQUEST NODE [Buscar CEP] - Method: GET, URL: https://viacep.com...
🔗 URL after variable replacement: https://viacep.com.br/ws/12345678/json/
🔗 Query params: {'format': 'json'}
📋 Headers: {'Accept': 'application/json'}
🚀 Making GET request to: https://viacep.com.br/ws/12345678/json/
✅ API Response - Status: 200
💾 Saved API response to context key: endereco
```

## Diferença entre `api_call` e `api_request`

| Feature | api_call (legado) | api_request (novo) |
|---------|-------------------|-------------------|
| Endpoints | Fixos (Sankhya) | Qualquer URL |
| Métodos | Apenas GET | GET/POST/PUT/DELETE/PATCH |
| Headers | Pré-definidos | Customizáveis |
| Query Params | Limitados | Totalmente customizáveis |
| Body | Não suportado | Suportado com JSON |
| Uso | APIs internas | Qualquer API externa |

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do container (`docker logs bot-danubio-app-1`)
2. Use o Debug Panel do Flow Builder para inspecionar o contexto
3. Teste a requisição manualmente com `curl` ou Postman antes de adicionar ao fluxo

---

**Criado em:** 28/10/2025
**Versão:** 1.0
