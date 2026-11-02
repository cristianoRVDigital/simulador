# RV Compare

Comparador de taxas e simulador mensal estático, em português. As taxas são editáveis e ficam salvas no armazenamento local do navegador. O site pode ser instalado como PWA em navegadores compatíveis e mantém o shell disponível offline após a primeira visita.

## Executar localmente

Abra `index.html` em um navegador. O projeto não requer instalação nem etapa de build.

## Publicar no Netlify

Conecte este repositório ao Netlify. A configuração em `netlify.toml` publica a raiz do projeto; não é necessário informar comando de build. O manifest e o service worker habilitam a instalação em HTTPS; no desenvolvimento, use `localhost` ou `127.0.0.1`.

## Sobre as taxas

Os valores iniciais da RV Pay e da InfiniteTap foram transcritos da referência fornecida. As demais taxas ficam em branco até serem informadas. A simulação considera somente o percentual cadastrado e não inclui antecipação ou outros custos.