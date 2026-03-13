# Seletor de Sessão - Teste com Variáveis do Contexto

## 🎯 Problema Resolvido

Agora você pode testar requisições com variáveis do contexto como `${{cep}}` usando dados reais de sessões ativas!

## 🆕 Nova Interface

Quando você abre o nó **API Request**, verá no topo:

```
┌─────────────────────────────────────────┐
│  🧪 Sessão de Teste:                    │
│  ┌─────────────────────────────────┐   │
│  │ 5511999999999 (ask_cep)         │ ▼ │  ← Dropdown de sessões
│  └─────────────────────────────────┘   │
│  💡 Variáveis como ${​{cep}} serão      │
│     substituídas pelo contexto desta    │
│     sessão                              │
└─────────────────────────────────────────┘
```

## 📋 Como Usar

### **1. Reinicie o Frontend**
```bash
cd frontend
# Ctrl+C para parar
npm run dev
```

### **2. Abra um Nó API Request**
- No Flow Builder, clique em um nó 🌐 API Request
- Você verá o **seletor de sessão azul** no topo

### **3. Escolha uma Sessão**
O dropdown mostra:
- **Telefone** (msisdn)
- **Stage atual** entre parênteses

Exemplo:
```
5511999999999 (ask_cep)
5521888888888 (input_cpf)
5531777777777 (menu_principal)
```

### **4. Configure a URL com Variáveis**
```
URL: https://viacep.com.br/ws/${{cep}}/json
```

### **5. Clique no Botão Play (▶️)**

**O que acontece:**
1. Sistema busca o contexto da sessão selecionada
2. Substitui `${{cep}}` pelo valor real do contexto
3. Exemplo: Se `cep = "01310100"`, a URL vira:
   ```
   https://viacep.com.br/ws/01310100/json
   ```
4. Faz a requisição
5. Mostra o resultado

### **6. Veja o Resultado**
No painel de resultado, você verá a **URL final com variável substituída**:
```
✅ Teste Executado (200)

URL: https://viacep.com.br/ws/01310100/json
      ────────────────────────────────
      ↑ Variável foi substituída!
```

## 🔍 Exemplo Completo

### **Cenário**: Testar busca de CEP

#### **Passo 1: Criar uma Sessão de Teste**
Você pode fazer isso de duas formas:

**A) Usar sessão existente:**
- Abra o Debug Panel (botão 🐛 no Flow Builder)
- Veja a lista de sessões com seus dados

**B) Criar uma sessão mock:**
```bash
# Via API (Postman/cURL)
curl -X POST http://localhost:5000/api/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "msisdn": "5511999999999",
    "text": "teste",
    "flow_id": 1
  }'
```

#### **Passo 2: Popular o Contexto**
No fluxo, faça o bot capturar o CEP:
```
1. Input Node: "Digite seu CEP"
   - Salva em: cep
2. Usuário digita: "01310100"
3. Contexto agora tem: { "cep": "01310100" }
```

#### **Passo 3: Testar API Request**
1. Abra o nó API Request
2. Selecione a sessão: `5511999999999`
3. Configure:
   ```
   URL: https://viacep.com.br/ws/${{cep}}/json
   Método: GET
   ```
4. Clique no ▶️
5. Veja:
   ```
   URL final: https://viacep.com.br/ws/01310100/json

   Resposta:
   {
     "cep": "01310-100",
     "logradouro": "Avenida Paulista",
     "bairro": "Bela Vista",
     "localidade": "São Paulo",
     "uf": "SP"
   }
   ```

## 🎨 Estados do Seletor

### **✅ Sessões Encontradas**
```
┌─────────────────────────────────────────┐
│  🧪 Sessão de Teste:                    │
│  ┌─────────────────────────────────┐   │
│  │ 5511999999999 (ask_cep)         │ ▼ │
│  │ 5521888888888 (menu)            │   │
│  │ 5531777777777 (input_cpf)       │   │
│  └─────────────────────────────────┘   │
│  💡 Variáveis serão substituídas        │
└─────────────────────────────────────────┘
```

### **⚠️ Nenhuma Sessão Ativa**
```
┌─────────────────────────────────────────┐
│  🧪 Sessão de Teste:                    │
│  Nenhuma sessão ativa encontrada.       │
│  Variáveis ${{campo}} não serão         │
│  substituídas.                          │
└─────────────────────────────────────────┘
```

Neste caso, as variáveis permanecerão como `${{cep}}` na URL.

## 💡 Variáveis Suportadas

### **Campos Simples**
```
URL: https://api.com/user/${{user_id}}
Context: { "user_id": "123" }
Resultado: https://api.com/user/123
```

### **Campos Aninhados**
```
URL: https://api.com/customer/${{customer.codparc}}
Context: { "customer": { "codparc": "456" } }
Resultado: https://api.com/customer/456
```

### **Query Params**
```
Query Params:
  - cpf: ${{cpf}}
  - nome: ${{customer.nome}}

Context: { "cpf": "12345678900", "customer": { "nome": "João" } }
Resultado: ?cpf=12345678900&nome=João
```

### **Headers**
```
Headers:
  - Authorization: Bearer ${{access_token}}
  - X-User-ID: ${{user_id}}

Context: { "access_token": "abc123", "user_id": "789" }
```

### **Body (POST)**
```json
{
  "nome": "${{nome}}",
  "email": "${{email}}",
  "endereco": {
    "cep": "${{cep}}",
    "numero": "${{numero}}"
  }
}
```

## 🐛 Troubleshooting

### **Problema: Variável não foi substituída**

**Causas possíveis:**

1. **Nenhuma sessão selecionada**
   - Solução: Selecione uma sessão no dropdown

2. **Campo não existe no contexto**
   ```
   URL: https://viacep.com.br/ws/${{cep}}/json
   Context: { "cpf": "123" }  ← Não tem 'cep'!
   Resultado: https://viacep.com.br/ws/${{cep}}/json
   ```
   - Solução: Verifique o contexto da sessão no Debug Panel

3. **Nome do campo incorreto**
   ```
   URL: https://api.com/${{CEP}}
   Context: { "cep": "123" }  ← Campo é lowercase!
   ```
   - Solução: Use o nome exato do campo

4. **Frontend não reiniciado**
   - Solução: Reinicie o frontend para ver o seletor

### **Problema: Dropdown vazio**

**Causa:** Nenhuma sessão ativa no banco

**Solução:**
1. Execute um fluxo no WhatsApp
2. Ou crie uma sessão mock via API
3. Refresh o modal (feche e abra novamente)

### **Problema: Sessão não tem os dados necessários**

**Solução:**
1. Abra o **Debug Panel** (🐛)
2. Clique na sessão desejada
3. Veja o contexto completo
4. Execute o fluxo até capturar os dados necessários

## 🔄 Workflow Recomendado

```
1. Desenvolver fluxo até o ponto que captura as variáveis
   ↓
2. Testar o fluxo no WhatsApp (ou criar sessão mock)
   ↓
3. Verificar no Debug Panel se as variáveis foram salvas
   ↓
4. Abrir o nó API Request
   ↓
5. Selecionar a sessão que acabou de criar
   ↓
6. Configurar URL com ${{variavel}}
   ↓
7. Clicar no Play ▶️
   ↓
8. Ver resultado com variável substituída
   ↓
9. Ajustar conforme necessário
   ↓
10. Repetir 6-9 até funcionar
```

## 📊 Comparação: Antes vs Agora

### **Antes (Sem Seletor)**
```
URL: https://viacep.com.br/ws/${{cep}}/json
Clica no Play
   ↓
❌ Erro: https://viacep.com.br/ws/${{cep}}/json
   "Variável não foi substituída!"
```

### **Agora (Com Seletor)**
```
Seleciona sessão: 5511999999999
URL: https://viacep.com.br/ws/${{cep}}/json
Clica no Play
   ↓
✅ Sucesso: https://viacep.com.br/ws/01310100/json
   { "logradouro": "Avenida Paulista", ... }
```

## 🚀 Dicas Pro

1. **Use sessões de produção**
   - Teste com dados reais para garantir que funciona

2. **Crie sessões de teste dedicadas**
   - Tenha sessões com dados conhecidos para testes

3. **Verifique sempre o Debug Panel**
   - Confirme que as variáveis existem antes de testar

4. **Sessão mais recente é selecionada automaticamente**
   - A primeira do dropdown é a mais recente

5. **Recarregue sessões**
   - Feche e abra o modal para atualizar a lista

---

**Criado em:** 28/10/2025
**Versão:** 1.0
