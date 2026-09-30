# PreVAlerta

Plataforma web para consultar rapidamente a situação meteorológica e os riscos de cidades do Estado de São Paulo — clima atual, previsão das próximas 24 horas, alertas oficiais do governo e uma classificação de risco calculada automaticamente, tudo em um mapa interativo. Também dá para montar uma rota com várias cidades e comparar a situação de cada parada.

🔗 **Acesse:** [prev-alerta.vercel.app](https://prev-alerta.vercel.app)

## Motivação

A ideia surgiu de um problema real: ao planejar uma viagem de Mogi das Cruzes para o Guarujá, foi difícil encontrar rapidamente uma visão clara de como estava a situação de cada cidade — uma tinha um alerta leve da Defesa Civil, a outra um alerta bem mais grave, e não havia um lugar simples para comparar isso. O PreVAlerta nasceu para responder, de forma direta: **"como está a situação dessa região agora, e nas próximas horas?"**

## Funcionalidades

- Busca por qualquer cidade do Estado de São Paulo, com mapa interativo (contorno do Estado, marcador e mancha de risco coloridas)
- Condições atuais e previsão horária (24h) via [Open-Meteo](https://open-meteo.com/)
- Alertas meteorológicos oficiais do [INMET](https://portal.inmet.gov.br/), filtrados pela mesorregião exata da cidade pesquisada (dados geográficos via [IBGE](https://servicodados.ibge.gov.br/api/docs/localidades))
- Classificação de risco (Normal / Atenção / Risco Elevado / Crítico) calculada por regras próprias apenas a partir dos dados meteorológicos do local — os alertas oficiais aparecem separados, sem alterar essa classificação
- Resumo da situação em linguagem natural gerado por IA (Gemini), sob demanda, usando apenas os dados exibidos na tela — a IA explica, não decide: não cria nem altera alertas
- Planejamento de rota com várias paradas: trajeto real pelas estradas via [OSRM](https://project-osrm.org/), com distância e tempo estimados, paradas reordenáveis e abas para alternar entre o clima, os alertas e o risco de cada cidade da rota
- Histórico das pesquisas recentes, salvo no próprio navegador
- Interface responsiva: mapa em tela cheia com painéis flutuantes no desktop, gaveta arrastável no celular

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS
- [React Leaflet](https://react-leaflet.js.org/) sobre [OpenStreetMap](https://www.openstreetmap.org/), rotas via [OSRM](https://project-osrm.org/)
- API routes do próprio Next.js como backend, sem servidor separado
- Deploy na [Vercel](https://vercel.com/)

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

O resumo por IA é opcional e usa a [API do Google Gemini](https://ai.google.dev/) (há camada gratuita). Para ativá-lo, gere uma chave no [Google AI Studio](https://aistudio.google.com/apikey) e crie um arquivo `.env.local` na raiz com ela (o arquivo é ignorado pelo Git):

```
GEMINI_API_KEY=sua-chave-aqui
```

Sem a chave, o restante do app funciona normalmente e o botão de resumo mostra uma mensagem de erro.

## Próximos passos

- Integração com dados de risco hidrológico/geológico (CEMADEN)

## Licença

[MIT](./LICENSE)
