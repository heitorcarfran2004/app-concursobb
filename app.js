// Kit do Escriturário — app de estudo para o concurso do Banco do Brasil.
// O banco de questões vem de banco.js (gerado por montar.cjs). Todo o progresso fica
// no aparelho (localStorage), então trocar de celular zera o histórico.
(function () {
  'use strict';

  // grupo = como a prova divide (Conhecimentos Básicos x Específicos); barra = cor da
  // barra de progresso, uma por matéria como no app de referência
  var MATERIAS = [
    { id: 'portugues',      nome: 'Língua Portuguesa',                 ic: '📖', cor: '#EAF0FF', grupo: 'BÁSICOS',     barra: '#17A35B' },
    { id: 'ingles',         nome: 'Língua Inglesa',                    ic: '🌎', cor: '#E6F6FB', grupo: 'BÁSICOS',     barra: '#0A45B8' },
    { id: 'matematica',     nome: 'Matemática',                        ic: '➗', cor: '#FFF3D6', grupo: 'BÁSICOS',     barra: '#E8A200' },
    { id: 'atualidades',    nome: 'Atualidades do Mercado Financeiro', ic: '📰', cor: '#FDEBE4', grupo: 'BÁSICOS',     barra: '#E0434B' },
    { id: 'mat-financeira', nome: 'Matemática Financeira',             ic: '💰', cor: '#E3F6EB', grupo: 'ESPECÍFICOS', barra: '#17A35B' },
    { id: 'estatistica',    nome: 'Probabilidade e Estatística',       ic: '📊', cor: '#F1EAFF', grupo: 'ESPECÍFICOS', barra: '#7B4FE0' },
    { id: 'bancarios',      nome: 'Conhecimentos Bancários',           ic: '🏦', cor: '#FFF7D1', grupo: 'ESPECÍFICOS', barra: '#0A45B8' },
    { id: 'informatica',    nome: 'Informática',                       ic: '💻', cor: '#E8EEF6', grupo: 'ESPECÍFICOS', barra: '#0E9AA7' },
    { id: 'vendas',         nome: 'Vendas e Negociação',               ic: '🤝', cor: '#FDE8F0', grupo: 'ESPECÍFICOS', barra: '#E8A200' },
    { id: 'ti',             nome: 'Tecnologia da Informação',          ic: '🧠', cor: '#E4F3F1', grupo: 'ESPECÍFICOS', barra: '#17A35B' }
  ];
  var MAT = {};
  MATERIAS.forEach(function (m) { MAT[m.id] = m; });

  // Composição do simulado: a prova de 2023 (Agente Comercial) teve 25 básicas + 45
  // específicas. Matemática puxa também de Mat. Financeira. Se faltar questão numa
  // matéria, o resto é completado com as outras (ver montarSimulado).
  var SIMULADO = [
    { de: ['portugues'], n: 10 }, { de: ['ingles'], n: 5 },
    { de: ['matematica', 'mat-financeira'], n: 5 }, { de: ['atualidades'], n: 5 },
    { de: ['estatistica'], n: 5 }, { de: ['bancarios'], n: 10 },
    { de: ['informatica'], n: 15 }, { de: ['vendas'], n: 15 }
  ];
  var SIM_TOTAL = 70, SIM_SEGUNDOS = 5 * 3600;

  var Q = BANCO.questoes, TEXTOS = BANCO.textos, FLASH = BANCO.flashcards;
  var POR_ID = {};
  Q.forEach(function (q) { POR_ID[q.id] = q; });
  var LETRAS = 'ABCDE';

  // ─────────── estado salvo ───────────
  var CHAVE = 'kitbb-v1';
  var st;
  function carregar() {
    try { st = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { st = null; }
    st = st || {};
    st.resp = st.resp || {};      // id → {m: marcada, ok}
    st.flash = st.flash || {};    // índice → 1 (já sei)
    st.sims = st.sims || [];      // histórico de simulados
    st.dias = st.dias || [];      // datas AAAA-MM-DD em que estudou
    st.meta = st.meta || 20;      // questões por dia
    st.hoje = st.hoje || { d: '', n: 0 };
  }
  function feitasHoje() { return st.hoje.d === hoje() ? st.hoje.n : 0; }
  function contarHoje(n) {
    var antes = feitasHoje();
    st.hoje = { d: hoje(), n: antes + n };
    if (antes < st.meta && st.hoje.n >= st.meta) setTimeout(function () { confete(); aviso('Meta de hoje batida! 🎉'); }, 400);
  }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(st)); } catch (e) {} }
  function hoje() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function marcarDia() { var h = hoje(); if (st.dias.indexOf(h) < 0) { st.dias.push(h); st.dias = st.dias.slice(-400); } }
  function ofensiva() {
    var set = {}; st.dias.forEach(function (d) { set[d] = 1; });
    var d = new Date(), n = 0;
    function chave(x) { return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); }
    if (!set[chave(d)]) d.setDate(d.getDate() - 1); // ainda não estudou hoje: conta até ontem
    while (set[chave(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function responder(q, marcada) {
    st.resp[q.id] = { m: marcada, ok: marcada === q.c };
    contarHoje(1); marcarDia(); salvar();
  }

  // ─────────── retorno ao responder ───────────
  var seguidas = 0, tCombo;
  function vibrar(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function reagir(ok) {
    if (!ok) { seguidas = 0; vibrar([50, 40, 50]); return; }
    seguidas++; vibrar(25);
    if (seguidas >= 3) {
      var c = $('combo');
      c.textContent = '🔥 ' + seguidas + ' acertos seguidos!';
      c.classList.add('on'); clearTimeout(tCombo);
      tCombo = setTimeout(function () { c.classList.remove('on'); }, 1600);
      if (seguidas % 5 === 0) confete();
    }
  }
  function confete() {
    var cores = ['#FDE100', '#0A45B8', '#17A35B', '#E0434B', '#FFB800'];
    for (var i = 0; i < 70; i++) {
      var s = document.createElement('span');
      s.className = 'confete';
      s.style.left = Math.random() * 100 + 'vw';
      s.style.background = cores[i % cores.length];
      s.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
      s.style.animationDelay = Math.random() * .4 + 's';
      document.body.appendChild(s);
      setTimeout(function (x) { x.remove(); }.bind(null, s), 3800);
    }
  }

  // ─────────── utilidades ───────────
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function embaralhar(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function daMateria(m) { return Q.filter(function (q) { return q.m === m; }); }
  function stats(lista) {
    var f = 0, ok = 0;
    lista.forEach(function (q) { var r = st.resp[q.id]; if (r) { f++; if (r.ok) ok++; } });
    return { total: lista.length, feitas: f, certas: ok, pct: f ? Math.round(ok / f * 100) : null };
  }
  var tAviso;
  function aviso(txt) { var a = $('aviso'); a.textContent = txt; a.classList.add('on'); clearTimeout(tAviso); tAviso = setTimeout(function () { a.classList.remove('on'); }, 2200); }
  function modal(html) { $('modal-in').innerHTML = html; $('modal').classList.add('on'); }
  function fecharModal() { $('modal').classList.remove('on'); }
  $('modal').addEventListener('click', function (e) { if (e.target.id === 'modal') fecharModal(); });
  function abrirTela(id) { document.querySelectorAll('.tela.on').forEach(function (t) { t.classList.remove('on'); }); $(id).classList.add('on'); $(id).scrollTop = 0; }
  function fecharTela(id) { $(id).classList.remove('on'); render(); }
  document.querySelectorAll('[data-fechar]').forEach(function (b) { b.addEventListener('click', function () { fecharTela(b.dataset.fechar); }); });
  var SETA = '<svg class="seta" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';

  // ─────────── login ───────────
  // Por enquanto só confere o formato do e-mail (igual aos outros apps de membros).
  // Para travar por compra, ligar no ACESSO da Miçanga (webhook Wiapy → Supabase).
  function logado() { try { return !!localStorage.getItem('kitbb-membro'); } catch (e) { return true; } }
  function nome() { try { return localStorage.getItem('kitbb-nome') || ''; } catch (e) { return ''; } }
  $('form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = $('nome').value.trim().split(/\s+/)[0] || '';
    var v = $('email').value.trim().toLowerCase();
    if (!n) { $('erro-login').textContent = 'Como podemos te chamar?'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { $('erro-login').textContent = 'Digite o e-mail que você usou na compra.'; return; }
    n = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
    try { localStorage.setItem('kitbb-membro', v); localStorage.setItem('kitbb-nome', n); } catch (x) {}
    $('login').classList.add('oculto');
    render();
    aviso('Bem-vindo(a), ' + n + '! Bora rumo à aprovação 💛');
  });

  // ─────────── perfil ───────────
  $('btn-perfil').addEventListener('click', function () {
    var email = ''; try { email = localStorage.getItem('kitbb-membro') || ''; } catch (e) {}
    var metas = [10, 20, 30, 50];
    modal('<h3>' + esc(nome() || 'Meu perfil') + '</h3><p>' + esc(email) + '</p>' +
      '<div style="margin-top:10px"><div class="perfil-l"><span>Meta diária</span><span class="opcoes" id="m-metas">' +
      metas.map(function (m) { return '<button class="' + (st.meta === m ? 'on' : '') + '" data-meta="' + m + '">' + m + '</button>'; }).join('') + '</span></div>' +
      '<div class="perfil-l"><span>Questões respondidas</span><b>' + Object.keys(st.resp).length + '</b></div>' +
      '<div class="perfil-l"><span>Simulados feitos</span><b>' + st.sims.length + '</b></div></div>' +
      '<div class="modal-acoes"><button class="btn btn-sec toque" id="btn-zerar" style="flex:1">Zerar progresso</button><button class="btn toque" style="background:var(--fundo)" id="btn-sair">Sair</button></div>');
    $('m-metas').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        st.meta = +b.dataset.meta; salvar(); render();
        $('m-metas').querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      };
    });
    $('btn-sair').onclick = function () {
      try { localStorage.removeItem('kitbb-membro'); } catch (x) {}
      fecharModal(); $('login').classList.remove('oculto');
    };
    $('btn-zerar').onclick = confirmarZerar;
  });

  // ─────────── abas ───────────
  function irAba(nome) {
    document.querySelectorAll('.aba').forEach(function (a) { a.classList.toggle('on', a.id === 'aba-' + nome); });
    document.querySelectorAll('.barra button').forEach(function (b) { b.classList.toggle('on', b.dataset.aba === nome); });
    window.scrollTo(0, 0);
    render();
  }
  document.querySelectorAll('.barra button').forEach(function (b) { b.addEventListener('click', function () { irAba(b.dataset.aba); }); });

  // ─────────── render das abas ───────────
  function linhaMateria(m, extra) {
    var s = stats(daMateria(m.id));
    var pct = s.total ? Math.round(s.feitas / s.total * 100) : 0;
    var sub = extra || (s.feitas + '/' + s.total + ' questões · ' + (s.pct !== null ? s.pct + '% de acerto' : pct + '%') + ' · <em>' + m.grupo + '</em>');
    return '<button class="mat toque" data-mat="' + m.id + '"><span class="mat-ic" style="background:' + m.cor + '">' + m.ic +
      '<img src="assets/m-' + m.id + '.webp" alt="" loading="lazy" onerror="this.remove()"></span>' +
      '<span class="mat-meio"><b>' + esc(m.nome) + '</b><span class="trilho" style="display:block"><i style="background:' + m.barra + ';width:' + Math.max(pct, s.feitas ? 3 : 0) + '%"></i></span><small>' + sub + '</small></span>' + SETA + '</button>';
  }
  function materiasComQuestoes() { return MATERIAS.filter(function (m) { return daMateria(m.id).length; }); }

  function render() {
    var h = new Date().getHours();
    var n = nome();
    $('saudacao').textContent = (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + (n ? ', ' + n : '');
    $('btn-perfil').textContent = (n || 'E').charAt(0).toUpperCase();
    var fh = feitasHoje(), batida = fh >= st.meta;
    $('meta').classList.toggle('batida', batida);
    $('meta-tit').textContent = batida ? 'Meta de hoje batida! 🎉' : 'Meta de hoje';
    $('meta-sub').textContent = Math.min(fh, st.meta) + ' de ' + st.meta + ' questões' + (batida ? ' · continue assim' : '');
    $('meta-barra').style.width = Math.min(100, fh / st.meta * 100) + '%';
    $('meta-btn').textContent = fh ? 'Continuar' : 'Começar';
    var geral = stats(Q);
    var pct = Q.length ? Math.round(geral.feitas / Q.length * 100) : 0;
    $('anel-pct').textContent = pct + '%';
    $('anel-arco').style.strokeDashoffset = 314.16 * (1 - pct / 100);
    $('n-feitas').textContent = geral.feitas;
    $('n-acerto').textContent = geral.pct === null ? '–' : geral.pct + '%';
    var dias = ofensiva();
    $('chip-ofensiva').textContent = '🔥 ' + dias + (dias === 1 ? ' dia seguido' : ' dias seguidos');
    var erros = Q.filter(function (q) { var r = st.resp[q.id]; return r && !r.ok; }).length;
    $('sub-erros').textContent = erros ? erros + ' para refazer' : 'Nenhum erro ainda';

    var lista = materiasComQuestoes().map(function (m) { return linhaMateria(m); }).join('');
    $('lista-inicio').innerHTML = lista;
    $('lista-materias').innerHTML = lista;

    // simulados
    $('hist-sim').innerHTML = st.sims.length ? st.sims.slice().reverse().slice(0, 8).map(function (s) {
      var p = Math.round(s.certas / s.total * 100);
      return '<div class="hist-l"><span><b>' + s.data.split('-').reverse().join('/') + '</b> · ' + fmtTempo(s.tempo) + '</span><span class="nota" style="color:' + corPct(p) + '">' + s.certas + '/' + s.total + '</span></div>';
    }).join('') : '<div class="vazio">Você ainda não fez nenhum simulado.</div>';

    // progresso
    $('p-feitas').textContent = geral.feitas;
    $('p-acerto').textContent = geral.pct === null ? '–' : geral.pct + '%';
    $('p-dias').textContent = dias;
    var ranking = materiasComQuestoes().map(function (m) { return { m: m, s: stats(daMateria(m.id)) }; });
    var comDado = ranking.filter(function (r) { return r.s.feitas >= 3; }).sort(function (a, b) { return a.s.pct - b.s.pct; });
    var semDado = ranking.filter(function (r) { return r.s.feitas < 3; });
    $('p-lista').innerHTML = comDado.concat(semDado).map(function (r) {
      var sub = r.s.feitas < 3 ? 'Responda 3 questões para medir' : r.s.pct + '% de acerto · ' + r.s.feitas + ' respondidas';
      var html = linhaMateria(r.m, sub);
      if (r.s.feitas >= 3) html = html.replace('<i style="width:', '<i style="background:' + corPct(r.s.pct) + ';width:').replace(/width:\d+%/, 'width:' + r.s.pct + '%');
      return html;
    }).join('');
    var pior = comDado[0];
    $('p-fraco').innerHTML = pior && pior.s.pct < 70
      ? '<div class="fraco"><span class="mat-ic">' + pior.m.ic + '</span><span><b>Seu ponto fraco: ' + esc(pior.m.nome) + '</b><small>' + pior.s.pct + '% de acerto até agora</small></span><button class="toque" data-mat="' + pior.m.id + '">Treinar</button></div>'
      : '';
  }
  function corPct(p) { return p >= 70 ? 'var(--verde)' : p >= 50 ? 'var(--am-esc)' : 'var(--verm)'; }
  function fmtTempo(s) { var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + 'h' + ('0' + m).slice(-2) : m + ' min'; }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mat]');
    if (b) { treinarMateria(b.dataset.mat); return; }
    var t = e.target.closest('[data-acao]');
    if (!t) return;
    var a = t.dataset.acao;
    if (a === 'rapido') treinoRapido();
    else if (a === 'simulado') irAba('simulado');
    else if (a === 'erros') revisarErros();
    else if (a === 'flash') abrirFlash('todas');
  });

  // ─────────── treino (questão a questão, com gabarito na hora) ───────────
  var sessao = null; // {lista, i, titulo, modo, revisao: {id: marcada} | null}

  function treinarMateria(m) {
    var lista = daMateria(m);
    if (!lista.length) return;
    // as que faltam primeiro, na ordem do banco; depois as já respondidas
    var faltam = lista.filter(function (q) { return !st.resp[q.id]; });
    var feitas = lista.filter(function (q) { return st.resp[q.id]; });
    abrirSessao(faltam.concat(feitas), MAT[m].nome, 'Modo Foco', 0);
  }
  function treinoRapido() {
    var faltam = embaralhar(Q.filter(function (q) { return !st.resp[q.id]; }));
    var lista = faltam.length >= 10 ? faltam.slice(0, 10) : faltam.concat(embaralhar(Q.filter(function (q) { return st.resp[q.id]; }))).slice(0, 10);
    abrirSessao(lista, 'Treino Rápido', '10 questões sorteadas', 0);
  }
  function revisarErros() {
    var lista = Q.filter(function (q) { var r = st.resp[q.id]; return r && !r.ok; });
    if (!lista.length) { aviso('Você ainda não errou nenhuma questão 👏'); return; }
    abrirSessao(embaralhar(lista), 'Revisar Erros', lista.length + ' para refazer', 0, { refazer: true });
  }
  function abrirSessao(lista, titulo, modo, i, op) {
    op = op || {};
    sessao = { lista: lista, i: i, titulo: titulo, modo: modo, revisao: op.revisao || null, refazer: !!op.refazer, feitasAgora: {} };
    $('q-titulo').textContent = titulo;
    $('q-modo').textContent = modo;
    abrirTela('tela-q');
    mostrarQuestao();
  }

  function htmlQuestao(q, num, total) {
    var html = '<div class="q-cab"><span>Questão ' + num + ' de ' + total + '</span><span class="tag">' + esc(q.a || MAT[q.m].nome) + '</span></div>';
    if (q.t !== undefined) html += '<details class="apoio" open><summary>Texto de apoio <span class="mais">+</span></summary><div>' + esc(TEXTOS[q.t]) + '</div></details>';
    var codigo = /\n {2,}\S/.test(q.e) || q.m === 'ti' && /[{};=]\s*\n/.test(q.e);
    html += '<div class="enunciado' + (codigo ? ' codigo' : '') + '">' + fmtTexto(q.e, codigo) + '</div><div class="alts">';
    q.o.forEach(function (o, k) {
      html += '<button class="alt toque" data-k="' + k + '"><span class="letra">' + LETRAS[k] + '</span><span>' + fmtTexto(o, false) + '</span></button>';
    });
    return html + '</div>';
  }
  // trechos de código ganham fonte monoespaçada; o resto é texto puro
  function fmtTexto(s, codigo) {
    var t = esc(s);
    if (codigo) t = t.replace(/((?:^|\n)(?: {2,}|\t).*)+/g, function (b) { return '<code>' + b + '</code>'; });
    return t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  }

  function mostrarQuestao() {
    var q = sessao.lista[sessao.i];
    $('q-barra').style.width = ((sessao.i + 1) / sessao.lista.length * 100) + '%';
    $('q-corpo').innerHTML = htmlQuestao(q, sessao.i + 1, sessao.lista.length);
    $('tela-q').scrollTop = 0;
    // numa revisão de simulado, ou se já respondeu nesta sessão, mostra o gabarito direto
    var marcada = sessao.revisao ? sessao.revisao[q.id] : sessao.feitasAgora[q.id];
    if (marcada !== undefined) revelar(q, marcada, false);
    else if (!sessao.refazer && !sessao.revisao && st.resp[q.id]) {
      // já respondida em outro dia: deixa refazer, mas avisa como foi
      $('q-corpo').insertAdjacentHTML('afterbegin', '<div class="q-cab" style="justify-content:flex-start;gap:6px;color:' + (st.resp[q.id].ok ? 'var(--verde)' : 'var(--verm)') + '">' + (st.resp[q.id].ok ? '✓ Você acertou esta antes' : '✗ Você errou esta antes') + '</div>');
    }
    $('q-ant').disabled = sessao.i === 0;
    $('q-prox').textContent = sessao.i === sessao.lista.length - 1 ? 'Concluir' : 'Próxima';
    $('q-corpo').querySelectorAll('.alt').forEach(function (b) {
      b.addEventListener('click', function () {
        if (sessao.revisao || sessao.feitasAgora[q.id] !== undefined) return;
        var k = +b.dataset.k;
        sessao.feitasAgora[q.id] = k;
        responder(q, k);
        reagir(k === q.c);
        revelar(q, k, true);
      });
    });
  }
  function revelar(q, k, rolar) {
    var ok = k === q.c;
    $('q-corpo').querySelectorAll('.alt').forEach(function (b) {
      var j = +b.dataset.k;
      b.classList.add(j === q.c ? 'certa' : j === k ? 'errada' : 'apagada');
    });
    var titulo = k === null || k === undefined || k < 0 ? 'Em branco · resposta: letra ' + LETRAS[q.c]
      : ok ? 'Acertou! Letra ' + LETRAS[q.c] : 'Resposta certa: letra ' + LETRAS[q.c];
    var div = document.createElement('div');
    div.className = 'explica' + (ok ? '' : ' erro');
    div.innerHTML = '<h4>' + (ok ? '✅' : '💡') + ' ' + titulo + '</h4><p>' + fmtTexto(q.x, false) + '</p>';
    $('q-corpo').appendChild(div);
    if (rolar) setTimeout(function () { div.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);
  }
  $('q-ant').addEventListener('click', function () { if (sessao.i > 0) { sessao.i--; mostrarQuestao(); } });
  $('q-prox').addEventListener('click', function () {
    if (sessao.i < sessao.lista.length - 1) { sessao.i++; mostrarQuestao(); return; }
    if (sessao.revisao) { fecharTela('tela-q'); abrirTela('tela-res'); return; }
    var feitas = Object.keys(sessao.feitasAgora), certas = 0;
    feitas.forEach(function (id) { if (sessao.feitasAgora[id] === POR_ID[id].c) certas++; });
    fecharTela('tela-q');
    if (feitas.length) aviso('Você acertou ' + certas + ' de ' + feitas.length + ' 💪');
  });

  // ─────────── simulado ───────────
  var sim = null; // {ids, marc: {i: k}, i, inicio, restante}
  var tRelogio;

  function montarSimulado() {
    var usados = {}, ids = [];
    SIMULADO.forEach(function (b) {
      var pool = embaralhar(Q.filter(function (q) { return b.de.indexOf(q.m) >= 0 && !usados[q.id]; }));
      pool.slice(0, b.n).forEach(function (q) { usados[q.id] = 1; ids.push(q.id); });
    });
    // matéria com pouca questão: completa com as outras (menos TI, que é de outro cargo)
    if (ids.length < SIM_TOTAL) {
      embaralhar(Q.filter(function (q) { return !usados[q.id] && q.m !== 'ti'; })).slice(0, SIM_TOTAL - ids.length)
        .forEach(function (q) { ids.push(q.id); });
    }
    return ids;
  }
  function salvarSim() { try { localStorage.setItem('kitbb-sim', JSON.stringify(sim)); } catch (e) {} }
  function carregarSim() { try { return JSON.parse(localStorage.getItem('kitbb-sim') || 'null'); } catch (e) { return null; } }

  $('btn-sim').addEventListener('click', function () {
    var salvo = carregarSim();
    if (salvo && salvo.ids.every(function (id) { return POR_ID[id]; })) {
      modal('<h3>Continuar simulado?</h3><p>Você tem um simulado em andamento (' + Object.keys(salvo.marc).length + ' de ' + salvo.ids.length + ' respondidas).</p>' +
        '<div class="modal-acoes"><button class="btn btn-sec toque" id="m-novo">Começar outro</button><button class="btn btn-pri toque" id="m-cont">Continuar</button></div>');
      $('m-cont').onclick = function () { fecharModal(); sim = salvo; entrarSim(); };
      $('m-novo').onclick = function () { fecharModal(); novoSim(); };
      return;
    }
    novoSim();
  });
  function novoSim() {
    var ids = montarSimulado();
    if (!ids.length) { aviso('O banco de questões ainda está vazio.'); return; }
    sim = { ids: ids, marc: {}, i: 0, restante: SIM_SEGUNDOS };
    salvarSim(); entrarSim();
  }
  function entrarSim() {
    abrirTela('tela-sim'); mostrarSimQ();
    clearInterval(tRelogio);
    tRelogio = setInterval(function () {
      if (!$('tela-sim').classList.contains('on')) return; // pausado fora da tela
      sim.restante--;
      if (sim.restante % 15 === 0) salvarSim();
      pintarRelogio();
      if (sim.restante <= 0) { clearInterval(tRelogio); aviso('O tempo acabou!'); finalizarSim(); }
    }, 1000);
    pintarRelogio();
  }
  function pintarRelogio() {
    var s = Math.max(0, sim.restante), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    $('sim-relogio').textContent = h + ':' + ('0' + m).slice(-2) + ':' + ('0' + x).slice(-2);
    $('sim-relogio').classList.toggle('pouco', s < 900);
  }
  function mostrarSimQ() {
    var q = POR_ID[sim.ids[sim.i]];
    $('sim-cont').textContent = 'Questão ' + (sim.i + 1) + ' de ' + sim.ids.length;
    $('sim-barra').style.width = (Object.keys(sim.marc).length / sim.ids.length * 100) + '%';
    $('sim-corpo').innerHTML = htmlQuestao(q, sim.i + 1, sim.ids.length);
    $('tela-sim').scrollTop = 0;
    var k = sim.marc[sim.i];
    if (k !== undefined) $('sim-corpo').querySelector('[data-k="' + k + '"]').classList.add('marcada');
    $('sim-prox').textContent = sim.i === sim.ids.length - 1 ? 'Finalizar' : 'Próxima';
    $('sim-corpo').querySelectorAll('.alt').forEach(function (b) {
      b.addEventListener('click', function () {
        $('sim-corpo').querySelectorAll('.alt').forEach(function (x) { x.classList.remove('marcada'); });
        b.classList.add('marcada');
        sim.marc[sim.i] = +b.dataset.k;
        $('sim-barra').style.width = (Object.keys(sim.marc).length / sim.ids.length * 100) + '%';
        salvarSim();
      });
    });
  }
  $('sim-prox').addEventListener('click', function () {
    if (sim.i < sim.ids.length - 1) { sim.i++; salvarSim(); mostrarSimQ(); return; }
    confirmarFim();
  });
  $('sim-relogio').addEventListener('click', confirmarFim);
  function confirmarFim() {
    var falta = sim.ids.length - Object.keys(sim.marc).length;
    modal('<h3>Finalizar o simulado?</h3><p>' + (falta ? 'Ainda faltam <b>' + falta + '</b> questões sem resposta. Elas contam como erro.' : 'Você respondeu todas as questões.') + '</p>' +
      '<div class="modal-acoes"><button class="btn btn-sec toque" id="m-volta">Voltar</button><button class="btn btn-pri toque" id="m-fim">Finalizar</button></div>');
    $('m-volta').onclick = fecharModal;
    $('m-fim').onclick = function () { fecharModal(); finalizarSim(); };
  }
  $('sim-grade').addEventListener('click', function () {
    var html = '<h3>Ir para a questão</h3><div class="grade">';
    sim.ids.forEach(function (id, i) { html += '<button class="' + (sim.marc[i] !== undefined ? 'feita' : '') + (i === sim.i ? ' atual' : '') + '" data-ir="' + i + '">' + (i + 1) + '</button>'; });
    modal(html + '</div>');
    $('modal-in').querySelectorAll('[data-ir]').forEach(function (b) {
      b.onclick = function () { sim.i = +b.dataset.ir; fecharModal(); salvarSim(); mostrarSimQ(); };
    });
  });
  $('sim-pausa').addEventListener('click', function () {
    salvarSim(); fecharTela('tela-sim'); irAba('simulado');
    aviso('Simulado pausado. O cronômetro para enquanto você está fora.');
  });

  function finalizarSim() {
    clearInterval(tRelogio);
    var porMat = {}, certas = 0, revisao = {};
    sim.ids.forEach(function (id, i) {
      var q = POR_ID[id], k = sim.marc[i];
      revisao[id] = k === undefined ? -1 : k;
      var ok = k === q.c;
      if (ok) certas++;
      porMat[q.m] = porMat[q.m] || { t: 0, c: 0 };
      porMat[q.m].t++; if (ok) porMat[q.m].c++;
      if (k !== undefined) st.resp[q.id] = { m: k, ok: ok };
    });
    var r = { data: hoje(), certas: certas, total: sim.ids.length, tempo: SIM_SEGUNDOS - Math.max(0, sim.restante), porMat: porMat };
    st.sims.push(r); contarHoje(Object.keys(sim.marc).length); marcarDia(); salvar();
    try { localStorage.removeItem('kitbb-sim'); } catch (e) {}
    var ids = sim.ids; sim = null;
    fecharTela('tela-sim');
    mostrarResultado(r, ids, revisao);
  }
  function mostrarResultado(r, ids, revisao) {
    var p = Math.round(r.certas / r.total * 100);
    if (p >= 70) setTimeout(confete, 300);
    var html = '<div class="cartao res-top"><div class="nota-g" style="color:' + corPct(p) + '">' + r.certas + '<span style="font-size:24px;color:var(--cinza)">/' + r.total + '</span></div>' +
      '<p>' + p + '% de acerto · ' + fmtTempo(r.tempo) + ' de prova</p></div>' +
      '<div class="titulo-sec"><h2>Por matéria</h2></div><div class="cartao">';
    Object.keys(r.porMat).sort(function (a, b) { return r.porMat[a].c / r.porMat[a].t - r.porMat[b].c / r.porMat[b].t; }).forEach(function (m) {
      var x = r.porMat[m], pp = Math.round(x.c / x.t * 100);
      html += '<div class="linha-m"><div class="l1">' + esc(MAT[m].nome) + '<span>' + x.c + '/' + x.t + '</span></div><div class="trilho"><i style="width:' + pp + '%;background:' + corPct(pp) + '"></i></div></div>';
    });
    html += '</div><div class="titulo-sec"><h2>Gabarito</h2><span>toque para ver o comentário</span></div><div class="cartao grade" id="res-grade">';
    ids.forEach(function (id, i) {
      var k = revisao[id];
      html += '<button class="' + (k === POR_ID[id].c ? 'ok' : 'nok') + '" data-rev="' + i + '">' + (i + 1) + '</button>';
    });
    $('res-corpo').innerHTML = html + '</div>';
    abrirTela('tela-res');
    $('res-grade').querySelectorAll('[data-rev]').forEach(function (b) {
      b.onclick = function () {
        abrirSessao(ids.map(function (id) { return POR_ID[id]; }), 'Correção do simulado', 'Revisão', +b.dataset.rev, { revisao: revisao });
      };
    });
  }

  // ─────────── flashcards ───────────
  var fl = null; // {lista: [índices], i}
  function abrirFlash(filtro) {
    var mats = MATERIAS.filter(function (m) { return FLASH.some(function (c) { return c.m === m.id; }); });
    if (!FLASH.length) { aviso('Os flashcards ainda estão sendo preparados.'); return; }
    $('flash-chips').innerHTML = '<button data-f="todas" class="' + (filtro === 'todas' ? 'on' : '') + '">Todas</button>' +
      mats.map(function (m) { return '<button data-f="' + m.id + '" class="' + (filtro === m.id ? 'on' : '') + '">' + m.ic + ' ' + esc(m.nome) + '</button>'; }).join('');
    $('flash-chips').querySelectorAll('button').forEach(function (b) { b.onclick = function () { abrirFlash(b.dataset.f); }; });
    var idx = [];
    FLASH.forEach(function (c, i) { if (filtro === 'todas' || c.m === filtro) idx.push(i); });
    // os que ainda não sabe vêm primeiro, embaralhados
    var nao = embaralhar(idx.filter(function (i) { return !st.flash[i]; }));
    var sei = embaralhar(idx.filter(function (i) { return st.flash[i]; }));
    fl = { lista: nao.concat(sei), i: 0 };
    if (!$('tela-flash').classList.contains('on')) abrirTela('tela-flash');
    mostrarFlash();
  }
  function mostrarFlash() {
    var c = FLASH[fl.lista[fl.i]];
    $('flash').classList.remove('virado');
    setTimeout(function () {
      $('flash-mat').textContent = MAT[c.m].nome;
      $('flash-frente').textContent = c.f;
      $('flash-verso').textContent = c.v;
    }, fl.virou ? 180 : 0);
    fl.virou = false;
    var sabidos = fl.lista.filter(function (i) { return st.flash[i]; }).length;
    $('flash-cont').textContent = 'Cartão ' + (fl.i + 1) + ' de ' + fl.lista.length + ' · você já sabe ' + sabidos;
  }
  $('flash').addEventListener('click', function () { $('flash').classList.toggle('virado'); fl.virou = $('flash').classList.contains('virado'); });
  function proximoFlash(sei) {
    var i = fl.lista[fl.i];
    if (sei) st.flash[i] = 1; else delete st.flash[i];
    marcarDia(); salvar();
    if (fl.i < fl.lista.length - 1) { fl.i++; mostrarFlash(); }
    else { aviso('Você passou por todos os cartões 🎉'); fecharTela('tela-flash'); }
  }
  $('flash-sei').addEventListener('click', function () { proximoFlash(true); });
  $('flash-rev').addEventListener('click', function () { proximoFlash(false); });

  // ─────────── zerar ───────────
  function confirmarZerar() {
    modal('<h3>Zerar seu progresso?</h3><p>Apaga as respostas, os simulados e os flashcards marcados neste aparelho. Não dá para desfazer.</p>' +
      '<div class="modal-acoes"><button class="btn btn-sec toque" id="m-nao">Cancelar</button><button class="btn toque" style="background:var(--verm);color:#fff" id="m-sim">Zerar</button></div>');
    $('m-nao').onclick = fecharModal;
    $('m-sim').onclick = function () {
      try { localStorage.removeItem(CHAVE); localStorage.removeItem('kitbb-sim'); } catch (e) {}
      carregar(); fecharModal(); render(); aviso('Progresso zerado.');
    };
  }

  carregar();
  if (!logado()) $('login').classList.remove('oculto');
  render();
})();
