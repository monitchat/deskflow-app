# Client Flow Builder - Frontend

Interface visual para construção de fluxos de conversação do bot WhatsApp.

## 🚀 Quick Start

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### Produção

```bash
# Build para produção
npm run build
```

O build será colocado em `/public` e servido pelo Flask.

## 📦 Dependências Principais

- **React 18** - Framework UI
- **React Flow 11** - Biblioteca para diagramas e fluxos visuais
- **Axios** - Cliente HTTP
- **React Router** - Roteamento
- **Zustand** - Gerenciamento de estado (opcional, para expansões futuras)
- **Vite** - Build tool e dev server

## 🏗️ Estrutura

```
frontend/
├── src/
│   ├── pages/
│   │   ├── FlowList.jsx       # Lista de fluxos
│   │   └── FlowBuilder.jsx    # Editor visual drag-and-drop
│   ├── components/
│   │   ├── Sidebar.jsx        # Barra lateral com tipos de nós
│   │   ├── CustomNode.jsx     # Renderização customizada de nós
│   │   └── NodeEditorModal.jsx # Modal de edição de nós
│   ├── main.jsx               # Entry point
│   └── index.css              # Estilos globais
├── index.html
├── vite.config.js
└── package.json
```

## 🎨 Componentes

### FlowList

Lista todos os fluxos criados com opções para:
- Criar novo fluxo
- Editar fluxo existente
- Ativar/desativar fluxo
- Excluir fluxo

### FlowBuilder

Editor visual com:
- Canvas drag-and-drop
- Sidebar com tipos de nós
- Minimap para navegação
- Controles de zoom
- Edição de nós via modal
- Salvamento automático

### CustomNode

Renderização de 8 tipos de nós:
- 💬 Mensagem
- 🔘 Botões
- 📋 Lista
- ⌨️ Input
- 🔀 Condição
- 🔌 API Call
- 👤 Transferir
- 🏁 Fim

## 🔧 Configuração

### Proxy API

O Vite está configurado para fazer proxy das requisições `/api` para `http://localhost:5000`:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

### Build Output

O build é configurado para gerar os arquivos em `/public`:

```javascript
// vite.config.js
build: {
  outDir: '../public',
  emptyOutDir: true
}
```

## 📝 Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
npm run lint     # Linter ESLint
```

## 🎯 Features

- ✅ Drag-and-drop de nós
- ✅ Conexão visual entre nós
- ✅ Edição inline de propriedades
- ✅ Validação de dados
- ✅ Minimap e controles
- ✅ Zoom e pan
- ✅ Undo/redo (via React Flow)
- ✅ Exportação/importação JSON
- ✅ Responsivo

## 🐛 Troubleshooting

### Porta 3000 em uso

```bash
# Altere a porta em vite.config.js
server: {
  port: 3001
}
```

### Proxy não funciona

Certifique-se de que o backend Flask está rodando na porta 5000.

### Build falha

Limpe o cache e reinstale:

```bash
rm -rf node_modules
npm install
```

## 📚 Documentação

Ver [FLOW_BUILDER_README.md](../FLOW_BUILDER_README.md) para documentação completa.
