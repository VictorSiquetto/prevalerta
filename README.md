# PreVAlerta

Plataforma web para consultar rapidamente a situação meteorológica e os riscos de uma cidade do Estado de São Paulo — clima atual, previsão das próximas 24 horas, alertas oficiais do governo e uma classificação de risco calculada automaticamente, tudo em um mapa interativo.

🔗 **Acesse:** [prev-alerta.vercel.app](https://prev-alerta.vercel.app)

## Motivação

A ideia surgiu de um problema real: ao planejar uma viagem de Mogi das Cruzes para o Guarujá, foi difícil encontrar rapidamente uma visão clara de como estava a situação de cada cidade — uma tinha um alerta leve da Defesa Civil, a outra um alerta bem mais grave, e não havia um lugar simples para comparar isso. O PreVAlerta nasceu para responder, de forma direta: **"como está a situação dessa região agora, e nas próximas horas?"**

## Funcionalidades

- Busca por qualquer cidade do Estado de São Paulo, com mapa interativo (contorno do Estado, marcador e mancha de risco coloridas)
- Condições atuais e previsão horária (24h) via [Open-Meteo](https://open-meteo.com/)
- Alertas meteorológicos oficiais do [INMET](https://portal.inmet.gov.br/), filtrados pela mesorregião exata da cidade pesquisada (dados geográficos via [IBGE](https://servicodados.ibge.gov.br/api/docs/localidades))
- Classificação de risco (Normal / Atenção / Risco Elevado / Crítico) calculada por regras próprias, combinando dados meteorológicos com os alertas oficiais em vigor
- Interface responsiva: mapa em tela cheia com painéis flutuantes no desktop, gaveta arrastável no celular

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS
- [React Leaflet](https://react-leaflet.js.org/) sobre [OpenStreetMap](https://www.openstreetmap.org/)
- API routes do próprio Next.js como backend, sem servidor separado
- Deploy na [Vercel](https://vercel.com/)

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Próximos passos

- Resumo da situação gerado por IA, sob demanda
- Integração com dados de risco hidrológico/geológico (CEMADEN)
- Comparação de condições entre origem e destino de uma viagem

## Licença

[MIT](./LICENSE)
