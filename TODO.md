# Skyrim Atlas — Outcomes de entrega

## 1. Fundação React/Vite e identidade visual original

- A aplicação deve usar React + TypeScript + Vite, Tailwind CSS e Zustand.
- O projeto deve ter estrutura modular para app, componentes de layout, mapa, filtros, progresso, dados, estado, API e servidor.
- Deve existir uma identidade própria, sem copiar marca, logotipo, textos, ícones, tiles ou dados proprietários de sites existentes.
- A interface deve usar o estilo cartografia editorial / dark Nordic field guide, com wordmark próprio `SKYRIM / ATLAS`, símbolo de nó de bússola angular e âmbar glacial como cor de ação.
- Deve haver suporte a tema escuro/claro, contraste adequado, foco visível, aria-labels, navegação por teclado e reduced motion.

## 2. Mapa interativo e dataset legal de placeholders

- O mapa deve usar Leaflet com `L.CRS.Simple`, tiles de imagem placeholder legais e zoom de 0 a 6.
- O mapa inicial deve ser Skyrim e o seletor deve preparar Skyrim e Solstheim.
- Os locais devem ser carregados por API com fallback a JSON local.
- O dataset inicial deve ser próprio/fictício ou legalmente utilizável e contemplar Locais, Colecionáveis, Itens, Missões, NPCs, Criaturas, Mineração e Plantas.
- Marcadores devem ter ícones por categoria, clusters em zoom baixo e aparência esmaecida quando o local estiver encontrado.
- O mapa deve suportar controles de zoom, tela cheia, localizar, pan, escala/coordenadas e persistência de viewport por mapa.

## 3. Shell de exploração desktop/mobile

- A barra superior deve conter logo próprio, nome do jogo, seletor de mapa Skyrim/Solstheim, busca de locais, botão de login e alternância de tema.
- A sidebar esquerda deve ser colapsável, agrupar categorias, exibir ícone, nome, contador encontrados/total e toggle de visibilidade, além de Mostrar todos, Ocultar todos e filtro de texto.
- A área central deve manter o mapa em tela cheia e os controles devem permanecer acessíveis.
- O painel de detalhes deve aparecer à direita no desktop e como bottom sheet/drawer no mobile.
- O painel deve exibir título, categoria, descrição, imagens/galeria placeholder, coordenadas, link de wiki, ação Marcar como encontrado, notas pessoais e Copiar link do local.
- Deve haver barra de progresso global e barras de progresso por categoria.
- Em viewport móvel, a sidebar deve virar drawer e o detalhe deve virar bottom sheet sem perder ações essenciais.

## 4. Busca, progresso e personalização local

- Marcar/desmarcar encontrado deve funcionar com localStorage para visitante, mantendo o ícone esmaecido e atualizando contadores/barras.
- Busca com autocomplete deve filtrar locais, centralizar o mapa e abrir o local selecionado.
- Deve funcionar deep link `/skyrim/maps/skyrim?location=ID`, abrindo o local correto.
- O zoom e a posição do mapa devem persistir.
- Deve haver filtros para ocultar encontrados e mostrar somente não encontrados.
- Atalhos F, Esc e H devem iniciar busca, fechar painel e ocultar sidebar, respectivamente.
- Deve ser possível importar e exportar o progresso em JSON validado.
- Deve ser possível criar pins personalizados clicando no mapa, definindo nome, cor e ícone, com edição/remoção básica.
- Deve existir ferramenta de medir distância e ferramenta de desenhar rota com polilinha, cancelar e limpar.

## 5. API, contas e persistência preparada

- Deve existir backend Node.js + Express ou equivalente, com endpoints para locais, progresso, notas e pins, além de health endpoint.
- O modelo de dados deve estar preparado para SQLite/Postgres/Database gerenciado via Prisma, com usuários, mapas, locais, progresso, notas e pins.
- O frontend deve escolher entre sessão visitante e sessão sincronizada sem duplicar a experiência principal.
- Deve existir UI e contrato para login email/senha e OAuth Google.
- Quando configurada a autenticação real, o progresso deve sincronizar com a conta na nuvem.
- Cookies de sessão no Preview HTTPS devem usar `SameSite=None; Secure`.

## 6. SEO, acessibilidade e performance

- A aplicação deve atualizar título, descrição, canonical e metadados Open Graph por mapa e local.
- Deve existir `manus-routes.json`, `sitemap.xml` e `robots.txt` coerentes com as rotas.
- Listas longas devem estar preparadas para virtualização; dados, tiles e imagens devem usar cache/lazy load/memoização quando aplicável.
- A interação deve funcionar por teclado e leitores de tela com ordem de foco lógica, labels e feedback de estado.
- Animações devem respeitar `prefers-reduced-motion`.

## 7. Build, diagnóstico e entrega do projeto gerenciado

- O runtime deve escutar em `0.0.0.0` na porta configurada pelo projeto e disponibilizar `GET /`, `GET /manus-routes.json`, `GET /api/health` e as rotas de mapa.
- Diagnostics TypeScript devem estar registrados pelo Webdev antes da implementação e não devem reportar erros acionáveis.
- O build deve ser reproduzível, ter Dockerfile compatível com `PORT` e saída/servidor prontos para publicação.
- A implementação deve passar por inspeção de integração entre estado, mapa, API e layout.
- O checkpoint deve ser commitado no `main` do repositório canônico do Webdev; publicação só ocorre se já estiver autorizada/configurada.
