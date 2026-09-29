// Junta dados/*.json num só banco.js que o app carrega.
//
//   node montar.cjs
//
// dados/reais-*.json      questões de provas reais (Cesgranrio)
// dados/ineditas-*.json   questões inéditas no estilo da banca
// dados/flashcards-*.json cartões de revisão
//
// Os campos "origem" e "cargo" seguem no banco, mas o app não os mostra por enquanto
// (decisão de 28/09/2026: não subnichar o criativo). Para separar por cargo depois,
// é só filtrar por q.cargo ("comum", "comercial", "ti") no app.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'dados');
const MATERIAS = ['portugues', 'ingles', 'matematica', 'mat-financeira', 'estatistica',
  'bancarios', 'atualidades', 'informatica', 'vendas', 'ti'];

const questoes = [];
const flashcards = [];
const problemas = [];
const vistos = new Set();

for (const arq of fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort()) {
  let lista;
  try { lista = JSON.parse(fs.readFileSync(path.join(DIR, arq), 'utf8')); }
  catch (e) { problemas.push(`${arq}: JSON inválido (${e.message})`); continue; }
  if (!Array.isArray(lista)) { problemas.push(`${arq}: não é array`); continue; }

  if (arq.startsWith('flashcards-')) {
    for (const c of lista) {
      if (!MATERIAS.includes(c.materia) || !c.frente || !c.verso) { problemas.push(`${arq}: cartão inválido`); continue; }
      flashcards.push({ m: c.materia, f: c.frente.trim(), v: c.verso.trim() });
    }
    continue;
  }

  for (const q of lista) {
    const onde = `${arq} ${q.id}`;
    if (!q.id || vistos.has(q.id)) { problemas.push(`${onde}: id ausente ou repetido`); continue; }
    if (!MATERIAS.includes(q.materia)) { problemas.push(`${onde}: matéria "${q.materia}"`); continue; }
    const alts = q.alternativas;
    if (!Array.isArray(alts) || alts.length < 4 || alts.length > 5 || alts.some(a => !a || !String(a).trim())) {
      problemas.push(`${onde}: alternativas`); continue;
    }
    if (!Number.isInteger(q.correta) || q.correta < 0 || q.correta >= alts.length) { problemas.push(`${onde}: correta`); continue; }
    if (!q.enunciado || !q.comentario) { problemas.push(`${onde}: enunciado ou comentário vazio`); continue; }
    vistos.add(q.id);
    const s = {
      id: q.id, m: q.materia, a: (q.assunto || '').trim(), e: q.enunciado.trim(),
      o: alts.map(x => String(x).trim()), c: q.correta, x: q.comentario.trim(),
      d: [1, 2, 3].includes(q.dificuldade) ? q.dificuldade : 2,
      cargo: q.cargo || 'comum', origem: q.origem || ''
    };
    if (q.texto_apoio && q.texto_apoio.trim()) s.t = q.texto_apoio.trim();
    questoes.push(s);
  }
}

// o texto de apoio se repete em várias questões: guarda uma vez e referencia pelo índice
const textos = [];
const idxTexto = new Map();
for (const q of questoes) {
  if (q.t === undefined) continue;
  if (!idxTexto.has(q.t)) { idxTexto.set(q.t, textos.length); textos.push(q.t); }
  q.t = idxTexto.get(q.t);
}

const banco = { gerado: new Date().toISOString().slice(0, 10), textos, questoes, flashcards };
fs.writeFileSync(path.join(__dirname, 'banco.js'), 'var BANCO = ' + JSON.stringify(banco) + ';\n');

const porMateria = {};
for (const q of questoes) porMateria[q.m] = (porMateria[q.m] || 0) + 1;
const reais = questoes.filter(q => q.origem && q.origem !== 'inedita').length;
console.log(`questões: ${questoes.length} (reais ${reais}, inéditas ${questoes.length - reais}) · flashcards: ${flashcards.length} · textos: ${textos.length}`);
for (const m of MATERIAS) console.log(`  ${m.padEnd(15)} ${porMateria[m] || 0}`);
if (problemas.length) { console.log(`\n${problemas.length} descartadas:`); problemas.forEach(p => console.log('  ' + p)); }
