# 🎮 Playground - Guia de Uso

## Visão Geral

O **Playground** é uma ferramenta interativa que simula conversas do WhatsApp em tempo real, permitindo testar fluxos completos antes de publicá-los.

## Características

### ✅ O que o Playground faz:

- **Simula conversas reais** - Interface tipo WhatsApp
- **Executa o fluxo atual** - Testa o fluxo que você está editando
- **Gerencia sessões** - Crie, selecione e delete sessões de teste
- **Botões interativos** - Clique em botões e listas como no WhatsApp
- **Contexto real** - Usa a tabela `contexts` do banco de dados
- **Múltiplas sessões** - Teste diferentes cenários simultaneamente

## Como Usar

### 1. **Abrir o Playground**

No Flow Builder, clique no botão **🎮 Playground** no canto superior direito.

```
┌────────────────────────────────────────────┐
│  [🔍 Debug] [🎮 Playground] [Voltar] [Salvar] │
│                                    ↑           │
│                              Clique aqui       │
└────────────────────────────────────────────┘
```

O Playground abrirá no lado direito da tela, sem fechar o editor de fluxo.

### 2. **Criar Nova Sessão**

Para começar um novo teste:

1. Clique em **➕ Nova Sessão**
2. Uma sessão com número aleatório será criada (ex: `5511987654321`)
3. O fluxo iniciará automaticamente

### 3. **Selecionar Sessão Existente**

Para continuar uma conversa anterior:

1. Clique no dropdown de sessões
2. Selecione uma sessão existente
3. O histórico será carregado automaticamente

### 4. **Enviar Mensagens**

Digite sua mensagem no campo de input e pressione Enter ou clique em 📤.

**Exemplo:**
```
┌─────────────────────────────────┐
│ Digite uma mensagem...      [📤]│
└─────────────────────────────────┘
```

### 5. **Clicar em Botões**

Quando o bot enviar botões, clique diretamente neles:

**Exemplo de mensagem com botões:**
```
┌─────────────────────────────────┐
│ Bot: Escolha uma opção:         │
│                                 │
│ ┌───────────────────────────┐   │
│ │   Sim                     │   │ ← Clique aqui
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │   Não                     │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

### 6. **Interagir com Listas**

Quando o bot enviar listas, clique nas opções:

**Exemplo de lista:**
```
┌─────────────────────────────────┐
│ Bot: Selecione um produto:      │
│                                 │
│ Produto 1                       │
│ Descrição do produto 1          │ ← Clique aqui
│                                 │
│ Produto 2                       │
│ Descrição do produto 2          │
└─────────────────────────────────┘
```

### 7. **Deletar Sessão**

Para limpar uma sessão de teste:

1. Selecione a sessão no dropdown
2. Clique no botão 🗑️
3. Confirme a exclusão

## Interface do Playground

### Estrutura Visual

```
┌──────────────────────────────────┐
│  🎮 Playground              ✕    │ ← Header
│  Teste o fluxo em tempo real     │
├──────────────────────────────────┤
│ [Selecione uma sessão...]   🔄  │ ← Seletor de Sessão
│ [➕ Nova Sessão]           [🗑️] │
├──────────────────────────────────┤
│                                  │
│  Você: Olá                       │ ← Área de Mensagens
│                                  │
│  Bot: Bem-vindo! Escolha:        │
│  [Opção 1] [Opção 2]             │
│                                  │
│  Você: Opção 1                   │
│                                  │
│  Bot: Você escolheu Opção 1      │
│                                  │
├──────────────────────────────────┤
│ [Digite uma mensagem...]    [📤]│ ← Input
└──────────────────────────────────┘
```

## Tipos de Mensagem Suportados

### 📝 Texto Simples
```javascript
{
  type: 'text',
  text: 'Olá, como posso ajudar?'
}
```

### 🔘 Botões
```javascript
{
  type: 'button',
  text: 'Escolha uma opção:',
  buttons: [
    { id: 'sim', title: 'Sim' },
    { id: 'nao', title: 'Não' }
  ]
}
```

### 📋 Listas
```javascript
{
  type: 'list',
  text: 'Selecione um item:',
  sections: [
    {
      title: 'Produtos',
      rows: [
        { id: '1', title: 'Produto 1', description: 'Descrição' },
        { id: '2', title: 'Produto 2', description: 'Descrição' }
      ]
    }
  ]
}
```

### ⚡ Router (Opções Dinâmicas)
```javascript
{
  type: 'router',
  text: 'Digite uma opção:',
  items: [
    { label: '1 - Opção 1', value: '1' },
    { label: '2 - Opção 2', value: '2' }
  ]
}
```

## Workflow Recomendado

### 1️⃣ **Desenvolvimento Iterativo**

```
1. Criar/editar nó no fluxo
   ↓
2. Salvar fluxo
   ↓
3. Abrir Playground
   ↓
4. Criar nova sessão
   ↓
5. Testar interação
   ↓
6. Identificar problemas
   ↓
7. Voltar ao editor
   ↓
8. Corrigir e repetir
```

### 2️⃣ **Teste de Cenários**

Crie múltiplas sessões para testar diferentes cenários:

**Sessão 1:** Usuário normal (fluxo feliz)
```
5511987654321 → Testa caminho ideal
```

**Sessão 2:** Usuário com erro
```
5511987654322 → Testa validações e erros
```

**Sessão 3:** Cliente antigo
```
5511987654323 → Testa com contexto pré-existente
```

### 3️⃣ **Validação de Contexto**

1. Execute uma conversa no Playground
2. Abra o Debug Panel (🔍)
3. Verifique se o contexto foi salvo corretamente
4. Confirme que variáveis estão sendo populadas

## Casos de Uso

### ✅ Testar Validações de Input

**Exemplo: Validar CPF**

```
Nó Input: "Digite seu CPF"
Validação: ^[0-9]{11}$

Playground:
├─ Você: 123
│  Bot: CPF inválido
├─ Você: 12345678900
   Bot: CPF válido! ✅
```

### ✅ Testar Condições

**Exemplo: Roteamento por idade**

```
Condição: idade >= 18

Playground (Sessão 1):
├─ Você: 25
   Bot: Você é maior de idade

Playground (Sessão 2):
├─ Você: 16
   Bot: Você é menor de idade
```

### ✅ Testar API Requests

**Exemplo: Buscar CEP**

```
API Request: https://viacep.com.br/ws/${{cep}}/json

Playground:
├─ Você: 01310100
   Bot: Endereço encontrado:
        Avenida Paulista, São Paulo - SP
```

### ✅ Testar Fluxos Complexos

**Exemplo: Cadastro completo**

```
Playground:
├─ Bot: Bem-vindo! Digite seu nome:
├─ Você: João Silva
├─ Bot: Digite seu CPF:
├─ Você: 12345678900
├─ Bot: Digite seu CEP:
├─ Você: 01310100
├─ Bot: [Busca na API ViaCEP]
   Bot: Confirma endereço?
        Av. Paulista, 1000
        [Sim] [Não]
├─ [Clica em Sim]
   Bot: Cadastro concluído! ✅
```

## Vantagens do Playground

### 🚀 **Desenvolvimento Mais Rápido**

- **Antes:** Editar → Salvar → Publicar → Testar no WhatsApp → Voltar
- **Agora:** Editar → Testar no Playground → Corrigir → Repetir

### 🎯 **Testes Precisos**

- Usa contexto real do banco de dados
- Simula interações exatas do WhatsApp
- Valida botões, listas e inputs

### 🔄 **Iteração Instantânea**

- Teste imediato após cada mudança
- Sem necessidade de WhatsApp físico
- Múltiplas sessões simultâneas

### 🐛 **Debug Facilitado**

- Veja mensagens de erro em tempo real
- Combine com Debug Panel para ver contexto
- Identifique problemas antes da produção

## Troubleshooting

### ❌ **Problema: Playground não abre**

**Solução:**
1. Recarregue a página
2. Verifique se o backend está rodando
3. Veja o console do navegador para erros

### ❌ **Problema: "Selecione ou crie uma sessão primeiro"**

**Solução:**
- Clique em **➕ Nova Sessão** ou selecione uma sessão existente no dropdown

### ❌ **Problema: Mensagens não aparecem**

**Solução:**
1. Verifique se salvou o fluxo antes de testar
2. Confirme que o nó inicial está conectado
3. Veja os logs do backend para erros

### ❌ **Problema: Botões não funcionam**

**Solução:**
- Aguarde o carregamento completar (ícone ⏳)
- Verifique se o botão tem `id` configurado
- Confirme que há conexão do nó de botão para o próximo nó

### ❌ **Problema: Variáveis não substituem**

**Solução:**
1. Verifique se a sessão tem o campo no contexto (use Debug Panel)
2. Confirme a sintaxe: `${{campo}}`
3. Execute o fluxo até o nó que popula a variável

## Limitações

### ⚠️ **Não Suportado (ainda):**

- ❌ Envio de mídias (imagens, documentos)
- ❌ Áudio e vídeo
- ❌ Localização
- ❌ Contatos

### ✅ **Totalmente Suportado:**

- ✅ Mensagens de texto
- ✅ Botões interativos
- ✅ Listas
- ✅ Inputs com validação
- ✅ Condições
- ✅ API Requests
- ✅ Contexto/variáveis

## Dicas Pro

### 💡 **1. Mantenha Playground Aberto**

Deixe o Playground aberto enquanto edita o fluxo para testes rápidos.

### 💡 **2. Use Sessões Nomeadas**

Crie sessões com contexto inicial específico via Debug Panel:
```javascript
{
  "stage": "start",
  "user_type": "vip",
  "test_scenario": "erro_de_validacao"
}
```

### 💡 **3. Combine com Debug Panel**

1. Teste no Playground
2. Abra Debug Panel
3. Veja o contexto atualizado
4. Valide que variáveis foram salvas

### 💡 **4. Teste Edge Cases**

Crie sessões específicas para:
- Inputs inválidos
- Timeouts
- Respostas inesperadas
- Erros de API

### 💡 **5. Documente Cenários**

Mantenha lista de cenários testados:
```
✅ Fluxo feliz - cadastro completo
✅ CPF inválido - validação OK
✅ CEP não encontrado - erro tratado
✅ API timeout - fallback funcionando
```

## Comparação: Playground vs WhatsApp Real

| Aspecto | Playground | WhatsApp Real |
|---------|-----------|---------------|
| **Velocidade** | Instantâneo | Depende de rede |
| **Setup** | Zero | Precisa de número |
| **Múltiplas sessões** | Ilimitado | 1 por número |
| **Debug** | Integrado | Manual |
| **Histórico** | Completo | WhatsApp apenas |
| **Rollback** | Delete sessão | Impossível |
| **Custo** | Grátis | Taxa de API |
| **Mídias** | Não suportado | Suportado |

## Próximos Passos

Após validar no Playground:

1. ✅ Salve o fluxo
2. ✅ Ative o fluxo (se desativado)
3. ✅ Teste em WhatsApp real (opcional)
4. ✅ Publique para produção

---

**Criado em:** 28/10/2025
**Versão:** 1.0
**Status:** Totalmente funcional ✅
