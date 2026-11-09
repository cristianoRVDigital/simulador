# RV Compare

Comparador de taxas e simulador mensal estático, em português. As taxas são editáveis e ficam salvas no armazenamento local do navegador. O site pode ser instalado como PWA em navegadores compatíveis e mantém o shell disponível offline após a primeira visita.

## Executar localmente

Abra `index.html` em um navegador. O projeto não requer instalação nem etapa de build.

## Publicar no Netlify

Conecte este repositório ao Netlify. A configuração em `netlify.toml` publica a raiz do projeto; não é necessário informar comando de build. O manifest e o service worker habilitam a instalação em HTTPS; no desenvolvimento, use `localhost` ou `127.0.0.1`.

## Sobre as taxas

Os valores iniciais da RV Pay foram transcritos da referência fornecida. As taxas de Stone, PagSeguro (PGS) e Minha taxa ficam em branco até serem informadas. A simulação compara lado a lado a taxa, o valor descontado e o valor estimado a receber no mês para as duas operadoras selecionadas, destacando em verde a menor taxa e em vermelho a maior. A projeção usa o faturamento mensal informado e considera somente o percentual cadastrado; não inclui antecipação ou outras cobranças. As cores indicam apenas o resultado da comparação, não uma aprovação comercial.

No comparativo direto, informe suas condições na coluna **Minha taxa** e compare com RV Pay, Stone e PagSeguro (PGS). O débito tem uma única linha, sem distinção de bandeira; as taxas editadas são salvas neste navegador. Campos vazios não entram na comparação.