# RV Compare

Comparador de taxas, consulta avançada por cenário e simulador mensal estático, em português. As taxas são editáveis e ficam salvas no armazenamento local do navegador. O site pode ser instalado como PWA em navegadores compatíveis e mantém o shell disponível offline após a primeira visita.

## Executar localmente

Abra `index.html` em um navegador. O projeto não requer instalação nem etapa de build.

## Publicar no Netlify

Conecte este repositório ao Netlify. A configuração em `netlify.toml` publica a raiz do projeto; não é necessário informar comando de build. O manifest e o service worker habilitam a instalação em HTTPS; no desenvolvimento, use `localhost` ou `127.0.0.1`.

## Sobre as taxas

Os valores iniciais da RV Pay e da InfiniteTap foram transcritos da referência fornecida. As demais taxas ficam em branco até serem informadas. A simulação considera somente o percentual cadastrado e não inclui antecipação ou outros custos.

A consulta avançada inclui taxas de referência para EQUIS, PagSeguro (PGS) e STONE no cenário supermercados, D+1, TPV menor que R$ 2 mil e Visa. Os filtros de oferta e de comparação são sincronizados para manter o mesmo cenário nos dois quadros. Para outras combinações, informe as taxas da proposta recebida; os valores preenchidos e as taxas editadas são salvos localmente neste navegador. O líquido é uma estimativa percentual e não inclui cobranças que não estejam na taxa cadastrada.

No comparativo direto, use **Puxar taxas da consulta** para importar as modalidades compatíveis do cenário selecionado na comparação entre adquirentes. EQUIS e PagSeguro (PGS) têm colunas próprias e STONE preenche a coluna Stone. Taxas que já estiverem cadastradas são preservadas. A bandeira ELO é importada para Débito Elo; Visa e Mastercard alimentam Débito Visa / Mastercard. As modalidades parceladas acima de 4x e a taxa embutida não têm linha correspondente no comparativo direto e não são importadas.