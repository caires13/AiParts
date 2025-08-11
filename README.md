AI Parts Identifier — Offset/Flexo (SPA)
Ajuda técnicos não-especialistas a identificar peças de máquinas de impressão (offset/flexo) e sugerir opções de compra usando um modelo de IA (OpenAI gpt-5) — tudo client-side, sem backend.

Principais recursos
Entrada multimodal: campos de texto + múltiplas imagens (drag-and-drop ou seleção).

Campos dinâmicos: adicione/remova linhas (“Descrição”, “Marcações Visíveis”, etc.).

Preview instantâneo das imagens.

Prompts personalizáveis (persona/analysis) em Configurações.

Debug Mode: pré-visualiza o payload (mensagens e nomes dos arquivos) sem chamar a API.

Chat com histórico após a primeira resposta.

Segurança: IA Markdown é sanitizado com DOMPurify antes de renderizar.

Resiliência: Web Worker (com fallback), timeouts (10s imagens, 60s API), mensagens de erro claras.

Arquitetura
Single File: index.html (UI + lógica).
Bibliotecas via CDN: Tailwind, Marked, DOMPurify.

Namespaces (no código)
App.Config: endpoints, limites, defaults (modelo, timeouts).

App.Errors: AppError, APIError, ValidationError.

App.Logger: log/warn/error.

App.Storage: persistência em localStorage (API key opcional, prompts, toggles).

App.UI: helpers de UI (status, chat, fields, previews).

App.Images: worker + fallback para data URLs.

App.Providers.OpenAI: callOpenAIAPI() com AbortController.

App.Controller: fluxo de submit inicial e follow-ups, montagem de mensagens, tratamento de erros.

Fluxo de dados
Formulário → validação → processamento de imagens (worker/fallback) →
montagem de messages com partes text + image_url:data: →
fetch ao Chat Completions → render Markdown sanitizado → chat loop.

Pré-requisitos
Navegador moderno (Chrome/Edge/Firefox/Safari atualizados).

Chave da OpenAI (ex.: sk-...). A chave fica somente no seu navegador.

Recomendado abrir via servidor local (para evitar restrições de file:// e garantir Worker).

Dica rápida (Python):

bash
Copy
Edit
# na pasta do projeto
python -m http.server 4321
# abra http://localhost:4321/index.html
Uso
Abra index.html.

Cole sua OpenAI API key (opcionalmente salve em localStorage).

Preencha ao menos um campo (ex.: “Descrição”, “Marcações Visíveis”).

Arraste e solte 1+ imagens (JPG/PNG/WEBP/GIF; máx. 10; 10 MB cada).

Clique “Analisar com IA”.

Use o chat para perguntas de acompanhamento.

Debug Mode: ative no topo do chat ou em Configurações → gera o payload e não chama a API.

Personalização (Configurações)
Persona (system): perfil do especialista e formato esperado da resposta.

Prompt de Análise: instruções para o primeiro turno (com checklist).

Modelo: padrão gpt-5.

Temperatura, max_tokens.

Debug, Autosave, Salvar API key.

As configurações podem ser salvas em localStorage.

Validações e limites
Imagens: tipos permitidos image/jpeg, image/png, image/webp, image/gif; ≤10 MB cada; até 10 arquivos.

Campos: exige pelo menos um par label + valor.

API key: verificação de formato (debounced); a validação real ocorre na primeira chamada (ou erro 401).

Acessibilidade
Atualizações de status com aria-live="polite".

Modal com role="dialog" e rótulos.

Erros comuns
401: chave inválida → verifique sk-....

429: rate limit → aguarde e tente novamente.

408: timeout (rede/lentidão) → tente reduzir imagens ou reenvie.

Tipos/Tamanho de imagem: respeite a lista e os limites.

Mensagens de erro também aparecem no chat para transparência.

Segurança e privacidade
Sem backend: a chave permanece no navegador e as requisições vão direto ao endpoint da OpenAI.

Sanitização: todo conteúdo Markdown de IA é higienizado com DOMPurify antes de entrar no DOM.

Observação: chamar a OpenAI diretamente do cliente expõe a chave ao ambiente do usuário. Para produção, considere um proxy mínimo com rate limiting e rotacionamento de chave.

Extensibilidade
A estrutura já separa namespaces. Para novos provedores (Gemini, etc.), adicione outro App.Providers.* e uma opção de seleção no UI.

Fácil evolução para fatiar em módulos/arquivos mantendo a filosofia Single File em protótipo.

Notas de implementação
Worker: converte File → ArrayBuffer → base64 e emite data:<mime>;base64,... (compatível com image_url no Chat Completions).

Fallback: FileReader.readAsDataURL na main thread se o worker demorar >10s ou falhar.

Timeout API: 60s com AbortController.

Troubleshooting
Nada acontece ao soltar arquivos: verifique se não excedeu 10 imagens e se os tipos são suportados.

Worker não roda com file://: suba um servidor local (ver seção Pré-requisitos).

Respostas truncadas: aumente max_tokens nas Configurações.

GIF animado: suportado como arquivo, mas o modelo analisa o frame passado pelo provedor; prefira PNG/JPG nítidos.