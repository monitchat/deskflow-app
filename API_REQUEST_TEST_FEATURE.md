# Feature: Testar API Request (🧪 Botão de Teste)

## Visão Geral

O componente **API Request** agora inclui um botão **🧪 Testar Requisição** que permite executar a chamada HTTP diretamente do editor, visualizando o resultado em tempo real antes de salvar no fluxo.

## Como Usar

### 1. Configurar o Nó API Request

1. Arraste o nó **🌐 API Request** para o canvas
2. Clique no nó para abrir o editor
3. Configure:
   - **URL**: Endpoint da API
   - **Método**: GET, POST, PUT, DELETE ou PATCH
   - **Query Params** (opcional): Parâmetros de URL
   - **Headers** (opcional): Headers HTTP customizados
   - **Body** (opcional, para POST/PUT/PATCH): JSON a ser enviado

### 2. Testar a Requisição

Após configurar, clique no botão **🧪 Testar Requisição** no final do formulário.

**O que acontece:**
- A requisição é executada em tempo real
- O resultado é exibido imediatamente abaixo do botão
- **Importante:** A resposta NÃO é salva no contexto (é apenas para teste)

### 3. Visualizar o Resultado

O painel de resultado mostra:

#### 🟢 Sucesso (Status 2xx)
```
✅ Teste Executado (200)                    0.13s
─────────────────────────────────────────────────
Status: [200] [GET]
URL: https://api.exemplo.com/endpoint

Query Params:
{
  "page": "1",
  "limit": "10"
}

Headers Enviados:
{
  "Authorization": "Bearer token",
  "Content-Type": "application/json"
}

Resposta:
{
  "id": 123,
  "name": "João Silva",
  "email": "joao@example.com"
}

💡 Dica: Esta resposta será salva em api_response quando o fluxo for executado.
```

#### 🔴 Erro (Status 4xx/5xx)
```
❌ Erro no Teste

Erro: Request timeout (30s)

OU

Erro: Connection refused
```

## Recursos do Teste

### ✅ Suportado
- Todos os métodos HTTP (GET/POST/PUT/DELETE/PATCH)
- Query parameters dinâmicos
- Headers customizados
- Body JSON
- Timeout de 30 segundos
- Parse automático de resposta JSON
- Tempo de resposta (elapsed time)
- Visualização completa dos headers da resposta

### ⚠️ Limitações
- **Variáveis do contexto NÃO são substituídas** (ainda)
  - Exemplo: `${{cpf}}` permanece como está
  - Para testar com contexto real, use o Debug Panel
- Não salva no contexto (é apenas visualização)
- Requer URL válida e acessível

## Casos de Uso

### 1. Testar Endpoint Público

**Exemplo: ViaCEP**
```
Método: GET
URL: https://viacep.com.br/ws/01310100/json/
```

**Clique em Testar**

**Resultado esperado:**
```json
{
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP"
}
```

### 2. Testar API com Headers

**Exemplo: GitHub API**
```
Método: GET
URL: https://api.github.com/users/torvalds
Headers:
  Accept: application/vnd.github.v3+json
```

**Resultado:**
```json
{
  "login": "torvalds",
  "name": "Linus Torvalds",
  "public_repos": 6,
  "followers": 212000
}
```

### 3. Testar POST com Body

**Exemplo: Create User**
```
Método: POST
URL: https://jsonplaceholder.typicode.com/users
Headers:
  Content-Type: application/json
Body:
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11999999999"
}
```

**Resultado:**
```json
{
  "id": 11,
  "name": "João Silva",
  "email": "joao@example.com"
}
```

## Debugging

### Problema: "⚠️ Preencha a URL antes de testar"
**Solução:** O campo URL está vazio. Preencha antes de clicar em Testar.

### Problema: "Request timeout (30s)"
**Causas possíveis:**
- URL inválida ou inacessível
- Servidor está lento ou offline
- Problemas de rede/firewall

### Problema: Status 404
**Causas possíveis:**
- URL incorreta
- Endpoint não existe
- Método HTTP errado

### Problema: Status 401/403
**Causas possíveis:**
- Falta de autenticação (header `Authorization`)
- Token inválido ou expirado
- Permissões insuficientes

### Problema: Status 400
**Causas possíveis:**
- Body JSON malformado
- Parâmetros obrigatórios faltando
- Tipo de dados incorreto

## Comparação: Teste vs Execução Real

| Aspecto | 🧪 Teste | ▶️ Execução no Fluxo |
|---------|----------|----------------------|
| Substitui `${{variáveis}}` | ❌ Não | ✅ Sim |
| Salva no contexto | ❌ Não | ✅ Sim |
| Tempo real | ✅ Sim | ✅ Sim |
| Visualiza resultado | ✅ Completo | ⚠️ Apenas logs |
| Requer conversa ativa | ❌ Não | ✅ Sim |
| Pode usar dados do contexto | ❌ Não | ✅ Sim |

## Dicas de Uso

### ✅ Recomendado

1. **Teste antes de salvar o fluxo**
   - Valide se a URL está correta
   - Verifique se os headers são necessários
   - Confirme o formato da resposta

2. **Use APIs públicas para testes iniciais**
   - JSONPlaceholder
   - ViaCEP
   - GitHub API
   - CatFacts API

3. **Verifique o tempo de resposta**
   - Se > 5s, considere otimizar ou usar cache
   - Se > 15s, pode causar timeout no fluxo real

4. **Analise a estrutura da resposta**
   - Use para definir o `context_key` apropriado
   - Identifique campos importantes para usar em mensagens
   - Planeje condições baseadas no status

### ⚠️ Evite

1. **Não teste APIs que requerem autenticação sem headers**
   - Vai retornar 401/403
   - Configure o header `Authorization` antes

2. **Não teste endpoints que modificam dados de produção**
   - POST/PUT/DELETE podem criar/alterar/deletar dados
   - Use ambientes de desenvolvimento/staging

3. **Não ignore erros no teste**
   - Se falhou no teste, vai falhar no fluxo
   - Corrija antes de ativar o fluxo

## Endpoint Backend

**URL:** `POST /api/v1/flows/test-api-request`

**Body:**
```json
{
  "method": "GET",
  "url": "https://api.exemplo.com/endpoint",
  "query_params": [
    {"key": "page", "value": "1"}
  ],
  "headers": [
    {"key": "Authorization", "value": "Bearer token"}
  ],
  "body": "{\"campo\":\"valor\"}",
  "msisdn": "5511999999999"  // opcional (futuro)
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "status_code": 200,
    "ok": true,
    "response": {...},
    "headers": {...},
    "elapsed_time": 0.13,
    "request": {
      "method": "GET",
      "url": "https://...",
      "params": {...},
      "headers": {...}
    }
  }
}
```

**Response (Erro):**
```json
{
  "success": false,
  "error": "Request timeout (30s)",
  "request": {...}
}
```

## Melhorias Futuras

### Planejado
- [ ] Suporte para substituição de variáveis do contexto via msisdn
- [ ] Histórico de testes executados
- [ ] Salvar configuração de teste como preset
- [ ] Copiar resposta como código para usar em mensagens
- [ ] Export da configuração como cURL

### Em Consideração
- [ ] Mock de respostas para testes offline
- [ ] Validação de schema JSON
- [ ] Comparação entre múltiplos testes
- [ ] Performance profiling

---

**Criado em:** 28/10/2025
**Versão:** 1.0
