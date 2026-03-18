import { useState } from 'react'

const slides = [
  {
    title: 'Bem-vindo ao Flow Builder',
    subtitle: 'Crie fluxos de atendimento inteligentes sem escrever codigo',
    icon: '🚀',
    content: (
      <>
        <p>O Flow Builder permite criar fluxos de conversacao visuais que respondem automaticamente no WhatsApp, Facebook, Instagram e outros canais.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
          {[
            { icon: '🖱️', text: 'Arraste componentes da sidebar para o canvas' },
            { icon: '🔗', text: 'Conecte os nos arrastando de um ponto ao outro' },
            { icon: '✏️', text: 'Clique em um no para editar suas configuracoes' },
            { icon: '▶️', text: 'Todo fluxo comeca pelo no de Inicio' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              padding: '0.6rem', borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary, #F9FAFB)',
              border: '1px solid var(--border, #E5E7EB)',
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text, #374151)', lineHeight: 1.4 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    title: 'Componentes Basicos',
    subtitle: 'Os blocos fundamentais do seu fluxo',
    icon: '📦',
    content: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { icon: '▶️', name: 'Inicio', desc: 'Ponto de entrada do fluxo. Adicionado automaticamente, nao pode ser removido. Todo fluxo precisa de um.' },
            { icon: '💬', name: 'Mensagem', desc: 'Envia um texto simples para o usuario. Suporta variaveis do contexto com a sintaxe ${{variavel}}.' },
            { icon: '🔘', name: 'Botoes', desc: 'Envia uma mensagem com botoes interativos (quick replies). O usuario clica em um botao para responder.' },
            { icon: '📋', name: 'Lista', desc: 'Envia uma lista de opcoes que o usuario pode selecionar. Ideal para menus com muitas opcoes.' },
            { icon: '⌨️', name: 'Input', desc: 'Captura e valida a resposta do usuario. Tipos: texto livre, CPF, CNPJ, email, numero ou regex customizado.' },
            { icon: '📎', name: 'Midia', desc: 'Envia documentos ou imagens. A URL pode usar variaveis do contexto.' },
            { icon: '⏱️', name: 'Delay', desc: 'Aguarda de 1 a 300 segundos antes de continuar. Util para simular digitacao ou dar tempo ao usuario.' },
            { icon: '🏁', name: 'Fim', desc: 'Finaliza a conversa e reseta o contexto. O proximo contato do usuario reinicia o fluxo.' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              padding: '0.5rem 0',
              borderBottom: i < 7 ? '1px solid var(--border, #F3F4F6)' : 'none',
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0, width: '28px', textAlign: 'center' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #111)' }}>{item.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    title: 'Roteamento e Logica',
    subtitle: 'Direcione a conversa com inteligencia',
    icon: '🎯',
    content: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            padding: '0.75rem', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🎯</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #111)' }}>Router Inteligente</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim, #6B7280)', margin: 0, lineHeight: 1.5 }}>
              Avalia a resposta do usuario contra uma lista de opcoes. Cada opcao tem uma condicao:
            </p>
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {[
                { label: 'Igual a', color: '#22c55e' },
                { label: 'Contem', color: '#3b82f6' },
                { label: 'Regex', color: '#ef4444' },
                { label: 'Contexto', color: '#f59e0b' },
                { label: 'Positivo (sim/ok)', color: '#a855f7' },
                { label: 'Numero', color: '#06b6d4' },
              ].map((c) => (
                <span key={c.label} style={{
                  fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px',
                  backgroundColor: `${c.color}20`, color: c.color, fontWeight: 500,
                }}>{c.label}</span>
              ))}
            </div>
          </div>

          <div style={{
            padding: '0.75rem', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.1rem' }}>👤</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #111)' }}>Transferir</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim, #6B7280)', margin: 0, lineHeight: 1.5 }}>
              Transfere para atendimento humano em um departamento especifico do MonitChat. Tem saidas de sucesso e erro.
            </p>
          </div>

          <div style={{
            padding: '0.75rem', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.1rem' }}>↗️</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #111)' }}>Pular para</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim, #6B7280)', margin: 0, lineHeight: 1.5 }}>
              Salta para qualquer outro no do fluxo. Util para criar loops ou reaproveitar trechos do fluxo.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Variaveis e Contexto',
    subtitle: 'Personalize mensagens com dados dinamicos',
    icon: '💾',
    content: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          O contexto armazena dados da conversa. Use variaveis em qualquer campo de texto para personalizar:
        </p>

        <div style={{
          padding: '0.75rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8rem',
          backgroundColor: 'var(--bg-secondary, #1a1a2e)', color: '#a5b4fc',
          border: '1px solid var(--border, #333)',
          marginBottom: '0.75rem',
        }}>
          <div style={{ marginBottom: '0.3rem' }}><span style={{ color: '#6ee7b7' }}>{'${{nome}}'}</span> <span style={{ color: '#9ca3af' }}>{'// valor do contexto'}</span></div>
          <div style={{ marginBottom: '0.3rem' }}><span style={{ color: '#6ee7b7' }}>{'${{api_response.data.email}}'}</span> <span style={{ color: '#9ca3af' }}>{'// caminho aninhado'}</span></div>
          <div style={{ marginBottom: '0.3rem' }}><span style={{ color: '#6ee7b7' }}>{'${{results[0].name}}'}</span> <span style={{ color: '#9ca3af' }}>{'// acesso a arrays'}</span></div>
          <div style={{ marginBottom: '0.3rem' }}><span style={{ color: '#fbbf24' }}>{'${{secret.API_KEY}}'}</span> <span style={{ color: '#9ca3af' }}>{'// credencial do fluxo'}</span></div>
          <div><span style={{ color: '#fb923c' }}>{'${{env.BASE_URL}}'}</span> <span style={{ color: '#9ca3af' }}>{'// variavel de ambiente'}</span></div>
        </div>

        <div style={{
          padding: '0.75rem', borderRadius: '10px',
          backgroundColor: 'var(--bg-secondary, #F9FAFB)',
          border: '1px solid var(--border, #E5E7EB)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.1rem' }}>💾</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #111)' }}>Salvar no Contexto</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim, #6B7280)', margin: 0, lineHeight: 1.5 }}>
            Permite salvar valores no contexto para usar depois. Fontes: valor fixo, valor do contexto, ou ultimo input do usuario. Exemplo: salvar o CPF digitado como <code>cpf_cliente</code> para usar em uma API depois.
          </p>
        </div>
      </>
    ),
  },
  {
    title: 'Integracoes e APIs',
    subtitle: 'Conecte seu fluxo a qualquer sistema externo',
    icon: '🌐',
    content: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            padding: '0.75rem', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🌐</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #111)' }}>API Request</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim, #6B7280)', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
              Faz requisicoes HTTP para qualquer API. Suporta GET, POST, PUT, DELETE e PATCH.
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.6 }}>
              <strong>Configuracoes:</strong>
              <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.2rem' }}>
                <li><strong>URL</strong> - Endpoint da API (aceita variaveis: <code>{'${{secret.BASE_URL}}/clientes/${{cpf}}'}</code>)</li>
                <li><strong>Headers</strong> - Ex: Authorization, Content-Type</li>
                <li><strong>Query Params</strong> - Parametros na URL</li>
                <li><strong>Body</strong> - Corpo da requisicao (JSON)</li>
                <li><strong>Context Key</strong> - Onde salvar a resposta (ex: <code>api_response</code>)</li>
              </ul>
            </div>
          </div>

          <div style={{
            padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            color: 'var(--text-dim, #6B7280)',
            lineHeight: 1.5,
          }}>
            <strong>Dica:</strong> Apos a chamada, a resposta fica disponivel como <code>{'${{api_response}}'}</code>, o status como <code>{'${{api_response_status}}'}</code> e o sucesso como <code>{'${{api_response_success}}'}</code>.
          </div>

          <div style={{
            padding: '0.75rem', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🎫</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #111)' }}>Alterar Status</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim, #6B7280)', margin: 0, lineHeight: 1.5 }}>
              Altera o status do ticket no MonitChat. Selecione o status desejado no dropdown ao editar o no.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'AI Router',
    subtitle: 'Classifique intencoes com inteligencia artificial',
    icon: '🤖',
    content: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          O AI Router usa IA (OpenAI ou Gemini) para entender o que o usuario quer e direcionar para o caminho certo, sem precisar de palavras-chave exatas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text, #374151)' }}>
            <strong>Como configurar:</strong>
            <ol style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem' }}>
              <li>Escolha o provedor: <strong>OpenAI</strong> ou <strong>Gemini</strong></li>
              <li>Informe sua <strong>API Key</strong> (fica salva nas credenciais do fluxo)</li>
              <li>Selecione o <strong>modelo</strong> (ex: gpt-4o-mini, gemini-2.0-flash)</li>
              <li>Escreva o <strong>prompt</strong> explicando o contexto do seu negocio</li>
              <li>Adicione <strong>intencoes</strong> com nome e descricao</li>
            </ol>
          </div>

          <div style={{
            padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
            backgroundColor: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.15)',
            color: 'var(--text-dim, #6B7280)', lineHeight: 1.5,
          }}>
            <strong>Exemplo:</strong> Um usuario escreve "quero ver o status do meu pedido". A IA identifica a intencao <code>consultar_pedido</code> e direciona para o fluxo de consulta, sem precisar que o usuario digite exatamente "1" ou "consultar pedido".
          </div>

          <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text, #374151)' }}>
            <strong>Saidas do no:</strong>
            <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.2rem' }}>
              <li>Uma saida para cada <strong>intencao</strong> configurada</li>
              <li>Saida de <strong>erro</strong> quando nenhuma intencao combina</li>
              <li>Opcao de <strong>resposta padrao</strong>: a IA gera uma resposta livre quando nao identifica intencao</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Agente IA',
    subtitle: 'Conversacao autonoma com ferramentas conectaveis',
    icon: '🧠',
    content: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          O Agente IA e o componente mais poderoso. Ele conversa livremente com o usuario, mantendo historico, e pode <strong>executar tools automaticamente</strong> para buscar dados, chamar APIs e tomar decisoes.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text, #374151)' }}>
            <strong>Configuracao do Agente:</strong>
            <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.2rem' }}>
              <li><strong>Provedor</strong> - OpenAI, Gemini ou Azure</li>
              <li><strong>Modelo</strong> - Escolha o modelo de IA</li>
              <li><strong>Prompt</strong> - Instrucoes de como o agente deve se comportar. Aceita variaveis: <code>{'${{nome_cliente}}'}</code></li>
              <li><strong>Temperatura</strong> - 0 = preciso, 1 = criativo</li>
              <li><strong>Max tokens</strong> - Limite da resposta</li>
            </ul>
          </div>

          <div style={{
            padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            color: 'var(--text-dim, #6B7280)', lineHeight: 1.5,
          }}>
            <strong>Historico:</strong> O agente mantem as ultimas 20 mensagens da conversa. Isso permite que ele lembre do que foi dito anteriormente e tenha uma conversa natural e continua.
          </div>

          <div style={{
            padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            color: 'var(--text-dim, #6B7280)', lineHeight: 1.5,
          }}>
            <strong>Dica de prompt:</strong> Seja especifico! Diga ao agente quem ele e, o que pode fazer, em que tom responder, e quais limites tem. Quanto melhor o prompt, melhor a conversa.
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Tools do Agente IA',
    subtitle: 'De superpoderes ao seu agente com ferramentas',
    icon: '🔧',
    content: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          Tools sao funcoes que a IA pode chamar durante a conversa. A IA decide sozinha quando e qual tool usar com base no que o usuario pediu.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            padding: '0.75rem', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #111)', marginBottom: '0.4rem' }}>
              🌐 Tool HTTP Request
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim, #6B7280)', margin: '0 0 0.4rem', lineHeight: 1.5 }}>
              Chama uma API externa. A IA preenche os parametros automaticamente com base na conversa.
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--text, #374151)', lineHeight: 1.6 }}>
              <strong>Campos importantes:</strong>
              <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1.2rem' }}>
                <li><strong>Nome</strong> - Nome claro da funcao (ex: <code>buscar_cliente</code>)</li>
                <li><strong>Descricao</strong> - Explique o que faz para a IA saber quando usar</li>
                <li><strong>URL</strong> - Aceita <code>{'${{variaveis}}'}</code> e <code>{'{parametro}'}</code> para a IA preencher</li>
                <li><strong>Metodo</strong> - GET, POST, PUT, DELETE</li>
                <li><strong>Parametros (JSON Schema)</strong> - Define quais argumentos a IA deve fornecer</li>
              </ul>
            </div>
          </div>

          <div style={{
            padding: '0.75rem', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #111)', marginBottom: '0.4rem' }}>
              💾 Tool Context Lookup
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim, #6B7280)', margin: 0, lineHeight: 1.5 }}>
              Busca dados do contexto da conversa. A IA pede a chave e recebe o valor. Util para o agente consultar dados ja coletados (CPF, nome, pedidos).
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Parametros das Tools',
    subtitle: 'Como a IA sabe quais dados fornecer',
    icon: '⚙️',
    content: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          Os parametros definem o que a IA precisa extrair da conversa para executar a tool. Use o formato JSON Schema:
        </p>

        <div style={{
          padding: '0.75rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.75rem',
          backgroundColor: 'var(--bg-secondary, #1a1a2e)', color: '#a5b4fc',
          border: '1px solid var(--border, #333)',
          marginBottom: '0.75rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}>
{`{
  "type": "object",
  "properties": {
    "cpf": {
      "type": "string",
      "description": "CPF do cliente (somente numeros)"
    },
    "tipo": {
      "type": "string",
      "enum": ["fisica", "juridica"],
      "description": "Tipo de pessoa"
    }
  },
  "required": ["cpf"]
}`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{
            padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.15)',
            color: 'var(--text-dim, #6B7280)', lineHeight: 1.5,
          }}>
            <strong>description</strong> e o campo mais importante! A IA usa a descricao para entender o que preencher. Seja claro: "CEP do endereco de entrega, formato 00000-000".
          </div>

          <div style={{
            padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            color: 'var(--text-dim, #6B7280)', lineHeight: 1.5,
          }}>
            <strong>enum</strong> restringe os valores possiveis. A IA so vai usar um dos valores listados.
          </div>

          <div style={{
            padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            color: 'var(--text-dim, #6B7280)', lineHeight: 1.5,
          }}>
            <strong>URL com parametros:</strong> Use <code>{'{cpf}'}</code> na URL e a IA substitui automaticamente. Ex: <code>{'https://api.com/clientes/{cpf}'}</code>. Parametros que nao estao na URL vao como query string (GET) ou body (POST).
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Dicas e Boas Praticas',
    subtitle: 'Aproveite ao maximo o Flow Builder',
    icon: '✨',
    content: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { icon: '🔑', title: 'Credenciais', desc: 'Guarde API keys e tokens em "Credenciais" (menu do fluxo). Use ${{secret.NOME}} nos campos. Nunca coloque senhas direto nos nos.' },
            { icon: '📱', title: 'Contas', desc: 'Configure quais canais (WhatsApp, Instagram...) cada fluxo responde em "Contas". Uma conta so pode estar em um fluxo ativo por vez.' },
            { icon: '🧪', title: 'Playground', desc: 'Teste seu fluxo sem enviar mensagens reais. O playground simula a conversa completa dentro do editor.' },
            { icon: '💾', title: 'Auto-save', desc: 'O fluxo salva automaticamente a cada 2 segundos. O indicador no topo mostra quando foi o ultimo salvamento.' },
            { icon: '📤', title: 'Exportar/Importar', desc: 'Exporte fluxos como JSON para backup ou para copiar entre ambientes. Importe na tela de listagem de fluxos.' },
            { icon: '🔗', title: 'Condicoes nas conexoes', desc: 'Clique em uma conexao (seta) entre nos para adicionar condicoes. Isso permite ramificacoes sem precisar de um Router.' },
            { icon: '🎯', title: 'Comece simples', desc: 'Crie primeiro um fluxo basico com mensagem e botoes. Depois adicione AI Router e Agentes conforme necessidade.' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              padding: '0.5rem 0',
              borderBottom: i < 6 ? '1px solid var(--border, #F3F4F6)' : 'none',
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0, width: '24px', textAlign: 'center' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text, #111)' }}>{item.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    title: 'Documentacao Completa',
    subtitle: 'Tudo em um so lugar, com exemplos reais',
    icon: '📖',
    content: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginBottom: '1rem' }}>
          Criamos um guia completo com todos os detalhes, exemplos de prompts, configuracoes de tools, cenarios reais do dia a dia e boas praticas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
          {[
            'Todos os componentes explicados em detalhe',
            'Como escrever prompts eficazes para o Agente IA',
            'JSON Schema de parametros com exemplos completos',
            'Cenario: menu de atendimento basico',
            'Cenario: consulta de pedido com validacao',
            'Cenario: agente IA completo com 6 tools',
            'Cenario: consulta encadeada (CEP → estoque)',
            'Cenario: validacao de credito com Custom Function',
            'Cenario: pesquisa de satisfacao',
            'Dicas de seguranca e performance',
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.82rem', color: 'var(--text, #374151)',
            }}>
              <span style={{
                width: '18px', height: '18px', borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e', fontSize: '0.7rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>✓</span>
              {item}
            </div>
          ))}
        </div>

        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            color: '#6366f1',
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
            transition: 'all 0.15s',
          }}
        >
          📖 Abrir Guia Completo
        </a>
      </>
    ),
  },
]

function TutorialModal({ onClose }) {
  const [step, setStep] = useState(0)
  const slide = slides[step]
  const isLast = step === slides.length - 1
  const isFirst = step === 0

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 20000,
        animation: 'tutFadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes tutFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tutSlideIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg, #fff)',
          borderRadius: '16px',
          width: '620px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.3)',
          animation: 'tutSlideIn 0.25s ease-out',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          borderBottom: '1px solid var(--border, #eee)',
          flexShrink: 0,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', flexShrink: 0,
          }}>
            {slide.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text, #111)' }}>
              {slide.title}
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-dim, #9CA3AF)' }}>
              {slide.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: '1.3rem',
              cursor: 'pointer', color: 'var(--text-dim, #999)', lineHeight: 1,
              padding: '0.25rem',
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          flex: 1,
          color: 'var(--text, #374151)',
          fontSize: '0.85rem',
          lineHeight: 1.5,
        }}>
          {slide.content}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.75rem 1.5rem 1rem',
          borderTop: '1px solid var(--border, #eee)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: i === step ? '#6366f1' : 'var(--border, #D1D5DB)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          {/* Step counter + buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim, #9CA3AF)', marginRight: '0.25rem' }}>
              {step + 1} / {slides.length}
            </span>

            {!isFirst && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  padding: '0.45rem 0.9rem',
                  backgroundColor: 'var(--bg-hover, #F3F4F6)',
                  color: 'var(--text, #374151)',
                  border: '1px solid var(--border, #E5E7EB)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                }}
              >
                Anterior
              </button>
            )}

            <button
              onClick={() => {
                if (isLast) {
                  onClose()
                } else {
                  setStep(step + 1)
                }
              }}
              style={{
                padding: '0.45rem 0.9rem',
                backgroundColor: isLast ? '#22c55e' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.target.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.target.style.opacity = '1' }}
            >
              {isLast ? 'Comecar!' : 'Proximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorialModal
