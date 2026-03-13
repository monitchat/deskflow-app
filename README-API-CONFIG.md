# Configuração da API Base URL

## Mudanças Implementadas

Foi implementado um sistema de configuração de URL base da API que funciona tanto em desenvolvimento quanto em produção, resolvendo o problema de chamadas de API usando a mesma porta do frontend.

### Arquivos Criados

1. **`src/config/api.js`** - Centraliza a configuração da URL base da API
2. **`src/config/axios.js`** - Instância configurada do axios com interceptors
3. **`.env.example`** - Template de variáveis de ambiente
4. **`.env.local`** - Arquivo local de configuração (não versionado)

### Arquivos Atualizados

Todos os componentes foram atualizados para usar a instância configurada do axios:

- `src/pages/FlowList.jsx`
- `src/pages/FlowBuilder.jsx`
- `src/components/NodeEditorModal.jsx`
- `src/components/SessionDebugPanel.jsx`
- `src/components/ContextFieldsModal.jsx`
- `src/components/AutocompleteTextarea.jsx`

## Como Usar

### Desenvolvimento Local

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edite `.env.local` se necessário (o padrão já está configurado para localhost:5000):
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### Produção

1. Configure a variável de ambiente `VITE_API_BASE_URL` no servidor de produção:
   ```bash
   export VITE_API_BASE_URL=https://api.seudominio.com
   ```

   Ou crie um arquivo `.env.production`:
   ```env
   VITE_API_BASE_URL=https://api.seudominio.com
   ```

2. Build da aplicação:
   ```bash
   npm run build
   ```

## Estrutura da Configuração

### src/config/api.js
```javascript
// Lê a URL base do ambiente ou usa default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
```

### src/config/axios.js
```javascript
// Cria instância configurada do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})
```

### Uso nos componentes
```javascript
// Antes
import axios from 'axios'
const response = await axios.get('/api/v1/flows')

// Depois
import api from '../config/axios'
const response = await api.get('/api/v1/flows')
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_API_BASE_URL` | URL base da API do backend | `http://localhost:5000` |

**Importante:** Todas as variáveis de ambiente do Vite devem começar com `VITE_` para serem expostas ao cliente.

## Vantagens

✅ **Flexibilidade**: Funciona em desenvolvimento e produção
✅ **Segurança**: Arquivo `.env.local` não é versionado
✅ **Manutenibilidade**: Configuração centralizada
✅ **CORS**: Facilita configuração de CORS no backend
✅ **Interceptors**: Suporte para adicionar tokens de autenticação futuramente

## Troubleshooting

### Erro: "Network Error" ou "ERR_CONNECTION_REFUSED"

Verifique se:
1. O backend está rodando na porta correta (5000)
2. A variável `VITE_API_BASE_URL` está configurada corretamente
3. Não há problemas de CORS no backend

### Variável de ambiente não está sendo lida

1. Reinicie o servidor de desenvolvimento após alterar `.env.local`
2. Verifique se a variável começa com `VITE_`
3. Limpe o cache do Vite: `rm -rf node_modules/.vite`

## Configuração do Backend (Flask)

Certifique-se de que o backend Flask permite CORS adequadamente:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

Para produção, especifique os origins permitidos ao invés de `"*"`.
