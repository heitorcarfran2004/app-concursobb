# Kit do Escriturário — app de estudo para o concurso do Banco do Brasil

Modelado no app "Kit do Operador" (concurso Transpetro) visto num anúncio em 26/09/2026:
questões comentadas por matéria, simulado cronometrado, flashcards e mapa de pontos fracos.

    npx serve .          # ou qualquer servidor estático; abrir index.html direto também funciona

## Arquivos

| arquivo | o que é |
|---|---|
| `index.html` | todas as telas (login, abas, questão, simulado, resultado, flashcards) |
| `app.js` | lógica; progresso salvo no aparelho (`localStorage`, chaves `kitbb-*`) |
| `banco.js` | **gerado** — não editar à mão |
| `montar.cjs` | junta `dados/*.json` em `banco.js` e lista o que descartou |
| `dados/reais-*.json` | questões das provas reais da Cesgranrio (BB 2021/2023, Caixa, Basa) |
| `dados/ineditas-*.json` | questões inéditas no estilo da banca |
| `dados/flashcards-*.json` | cartões de revisão |

Depois de mexer em qualquer coisa em `dados/`: `node montar.cjs`.

## Cargo e origem estão escondidos de propósito

Cada questão tem `cargo` (`comum`, `comercial`, `ti`) e `origem` (`BB 2023 - Cesgranrio - ...`
ou `inedita`), mas o app **não mostra** nenhum dos dois (decisão de 28/09/2026: não subnichar
o criativo). Quando for separar:

- **por cargo**: filtrar `Q` em `app.js` por `q.cargo` e mudar a tabela `SIMULADO`
- **mostrar a origem**: exibir `q.origem` no `.q-cab` de `htmlQuestao`

## Simulado

70 questões em 5 horas, o formato da prova de 2023. A composição (`SIMULADO` em `app.js`) segue o
Agente Comercial: Português 10, Inglês 5, Matemática 5, Atualidades 5, Estatística 5, Bancários 10,
Informática 15, Vendas 15. TI fica de fora do simulado até existir a versão por cargo. O
cronômetro para quando a pessoa sai da tela, e o simulado em andamento sobrevive a fechar o app.

## Ainda não ligado

- **Login** só confere o formato do e-mail. Para travar por compra, copiar o `acesso.js` do
  `apps/micanga-membros` (webhook Wiapy → Supabase) e cadastrar um item para este produto.
- **Sem marca do BB**: o logo é um "M" genérico e o subtítulo diz "Concurso Banco do Brasil".
  Não colocar o logo nem o nome como se o app fosse do banco (risco de reprovação na Meta e de
  notificação por uso de marca).
