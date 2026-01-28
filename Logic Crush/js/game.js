const GRID = document.getElementById('grid');
const SCORE = document.getElementById('score');
const LIVES = document.getElementById('lives');
const SHUFFLE = document.getElementById('shuffle');
const RESTART = document.getElementById('restart');

const MENU = document.getElementById('menu');
const STORE = document.getElementById('store');
const OPTIONS = document.getElementById('options');
const GAME_VIEW = document.getElementById('game');

const BTN_PLAY = document.getElementById('btnPlay');
const BTN_STORE = document.getElementById('btnStore');
const BTN_OPTIONS = document.getElementById('btnOptions');
const BTN_EXIT = document.getElementById('btnExit');
const BTN_INSTRUCTIONS = document.getElementById('btnInstructions');
const STORE_BACK = document.getElementById('store-back');
const OPTIONS_BACK = document.getElementById('options-back');
const MUTE = document.getElementById('mute');
const FINISH_LEVEL = document.getElementById('finish-level');
const EXIT_TO_MENU = document.getElementById('exit-to-menu');
const INSTRUCTIONS = document.getElementById('instructions');
const INSTRUCTIONS_CLOSE = document.getElementById('instructions-close');
const INSTRUCTIONS_ACK = document.getElementById('instructions-ack');

const soundMatch = document.getElementById('sound-match');
const soundClick = document.getElementById('sound-click');

const width = 8;
let squares = [];
let score = 0; // puntos globales (se guardan cuando terminas niveles o con la tienda)
let roundScore = 0; // puntos temporales de la ronda (solo se agregan a `score` al completar nivel)
let lives = 3;
const candyImages = [
  'img/prop/suma_booleana.png',
  'img/prop/Sumatoria.png',
  'img/prop/producto_booleano.png',
  'img/prop/Producto.png',
  'img/prop/phy.png',
  'img/prop/Landa.png',
  'img/prop/Equivalencia.png',
  'img/prop/Corazon.png'
];

// Levels / escenarios
const levels = [
  {name: 'Nivel 1 - Lobby', sceneClass: 'scene-lobby', target: 50, music: 'music/Music_Game/Ost/Giana Sisters [DS] music - Dungeon theme 1.mp3'},
  {name: 'Nivel 2 - Tienda', sceneClass: 'scene-tienda', target: 100, music: 'music/Music_Game/Ost/Giana Sisters DS OST - World Map 1 Music M+¦sica.mp3'},
  {name: 'Nivel 3 - Bonus', sceneClass: 'scene-default', target: 180, music: 'music/Music_Game/Sound effect/Swish - Quick Bamboo Swish Swish, Swoop, Swoosh  Swipe Foley.mp3'}
];
let currentLevel = null;
let musicAudio = null;
let scoreMultiplier = 1;

function startLevel(idx){
  if(idx<0 || idx>=levels.length) idx = 0;
  currentLevel = levels[idx];
  // set scene background class on body
  document.body.className = currentLevel.sceneClass || 'scene-default';
  document.getElementById('level-name').textContent = currentLevel.name;
  document.getElementById('level-target').textContent = currentLevel.target;
  // load music
  if(musicAudio){ musicAudio.pause(); musicAudio = null; }
  try{
    const src = encodeURI(currentLevel.music);
    musicAudio = new Audio(src);
    musicAudio.loop = true;
    musicAudio.volume = 0.6;
    musicAudio.load();
    if(!(MUTE && MUTE.checked)) musicAudio.play().catch((err)=>{ console.warn('music play failed', err); });
  }catch(e){ console.warn('music load failed', e); }
  // reset board
  roundScore = 0; updateRoundScore(); createBoard(); showScreen(GAME_VIEW);
}

function completeLevel(){
  if(!currentLevel) return;
  if(roundScore >= currentLevel.target){
    score += roundScore;
    alert('Nivel completado! +'+roundScore+' puntos');
    roundScore = 0; updateRoundScore(); updateScore();
    // advance if possible
    const idx = levels.indexOf(currentLevel);
    if(idx < levels.length-1){ startLevel(idx+1); }
    else { showScreen(MENU); }
  } else {
    alert('Aún no alcanzaste el objetivo del nivel: ' + currentLevel.target);
  }
}

// store purchase handling (delegated)
document.getElementById('store').addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const action = btn.dataset.action;
  const cost = Number(btn.dataset.cost||0);
  if(!action) return;
  if(action.startsWith('buy-')){
    if(score < cost){ alert('Puntos insuficientes'); return; }
    score -= cost; updateScore();
    if(action==='buy-life'){ lives++; updateLives(); alert('+1 vida'); }
    else if(action==='buy-bonus'){ roundScore += 50; updateRoundScore(); alert('+50 puntos de ronda'); }
    else if(action==='buy-mult'){ scoreMultiplier = 2; alert('Multiplicador x2 activo (esta ronda)'); }
  }
});

function showScreen(screen){
  MENU.classList.add('hidden');
  STORE.classList.add('hidden');
  OPTIONS.classList.add('hidden');
  GAME_VIEW.classList.add('hidden');
  screen.classList.remove('hidden');
  // set background depending on screen
  if(screen===MENU) document.body.className = 'scene-lobby';
  else if(screen===STORE) document.body.className = 'scene-tienda';
  else if(screen===OPTIONS) document.body.className = 'scene-default';
  else if(screen===GAME_VIEW) document.body.className = (currentLevel && currentLevel.sceneClass) ? currentLevel.sceneClass : 'scene-default';
  // when store opens, render a random quiz trio and update store score
  if(screen===STORE){ try{ renderTrio(); }catch(e){ console.warn('quiz render failed', e); } updateStoreScore(); }
}

function playSound(s){ if(MUTE && MUTE.checked) return; try{ s.currentTime = 0; s.play(); }catch(e){}
}

function createBoard(){
  GRID.innerHTML = '';
  squares = [];
  for(let i=0;i<width*width;i++){
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('data-id', i);
    const type = Math.floor(Math.random()*candyImages.length);
    cell.dataset.type = type;
    const img = document.createElement('img');
    img.setAttribute('draggable', false);
    img.src = candyImages[type];
    cell.appendChild(img);
    GRID.appendChild(cell);
    squares.push(cell);
    cell.addEventListener('click', handleClick);
  }
  roundScore = 0; updateRoundScore();
}

let firstSelected = null;

function adjacent(a,b){
  const idA = Number(a.dataset.id);
  const idB = Number(b.dataset.id);
  const dx = Math.abs((idA % width) - (idB % width));
  const dy = Math.abs(Math.floor(idA/width) - Math.floor(idB/width));
  return (dx===1 && dy===0) || (dx===0 && dy===1);
}

function handleClick(e){
  const el = e.currentTarget;
  playSound(soundClick);
  if(!firstSelected){
    firstSelected = el; el.classList.add('selected');
    return;
  }
  // only allow adjacent swaps
  if(!adjacent(firstSelected, el)){
    firstSelected.classList.remove('selected'); firstSelected = null; return;
  }
  const a = firstSelected; const b = el; firstSelected.classList.remove('selected'); firstSelected = null;
  // animate swap and commit types
  animateSwap(a,b).then(()=>{
    // after swap committed, check for matches
    if(!checkAndClear()){
      // no match -> swap back visually and penalize
      animateSwap(a,b).then(()=>{ lives--; updateLives(); });
    } else {
      playSound(soundMatch); updateRoundScore();
    }
    // cascade until no more matches
    let again = true;
    while(again){
      again = checkAndClear();
      if(again){ dropCandies(); playSound(soundMatch); updateRoundScore(); }
    }
    dropCandies();
  });
}

function swapTypes(a,b){
  const ta = a.dataset.type; const tb = b.dataset.type;
  a.dataset.type = tb; b.dataset.type = ta;
  const imgA = a.querySelector('img');
  const imgB = b.querySelector('img');
  if(imgA) imgA.src = candyImages[Number(a.dataset.type)];
  if(imgB) imgB.src = candyImages[Number(b.dataset.type)];
}

function animateSwap(a,b){
  return new Promise((resolve)=>{
    const idA = Number(a.dataset.id); const idB = Number(b.dataset.id);
    const colA = idA % width; const rowA = Math.floor(idA/width);
    const colB = idB % width; const rowB = Math.floor(idB/width);
    const STEP = 66; // cell width (60) + gap (6)
    const dx = (colB - colA) * STEP;
    const dy = (rowB - rowA) * STEP;
    const imgA = a.querySelector('img');
    const imgB = b.querySelector('img');
    if(!imgA || !imgB){ swapTypes(a,b); resolve(); return; }
    imgA.style.transition = 'transform 200ms cubic-bezier(.2,.9,.2,1)';
    imgB.style.transition = 'transform 200ms cubic-bezier(.2,.9,.2,1)';
    imgA.style.transform = `translate(${dx}px, ${dy}px)`;
    imgB.style.transform = `translate(${-dx}px, ${-dy}px)`;
    // after animation, clear transforms and swap types (commit)
    setTimeout(()=>{
      imgA.style.transform = '';
      imgB.style.transform = '';
      // small timeout to let transform reset
      setTimeout(()=>{ swapTypes(a,b); resolve(); }, 30);
    }, 210);
  });
}

function checkAndClear(){
  let found = false;
  // horizontal
  for(let r=0;r<width;r++){
    for(let c=0;c<width-2;c++){
      const idx = r*width + c;
      const t = squares[idx].dataset.type;
      if(t!==undefined && t!=='' && t===squares[idx+1].dataset.type && t===squares[idx+2].dataset.type){
        found = true;
        squares[idx].dataset.type = '';
        squares[idx+1].dataset.type = '';
        squares[idx+2].dataset.type = '';
        const i0 = squares[idx].querySelector('img'); if(i0) i0.src='';
        const i1 = squares[idx+1].querySelector('img'); if(i1) i1.src='';
        const i2 = squares[idx+2].querySelector('img'); if(i2) i2.src='';
        roundScore += 10 * scoreMultiplier;
      }
    }
  }
  // vertical
  for(let c=0;c<width;c++){
    for(let r=0;r<width-2;r++){
      const idx = r*width + c;
      const t = squares[idx].dataset.type;
      if(t!==undefined && t!=='' && t===squares[idx+width].dataset.type && t===squares[idx+2*width].dataset.type){
        found = true;
        squares[idx].dataset.type = '';
        squares[idx+width].dataset.type = '';
        squares[idx+2*width].dataset.type = '';
        const i0 = squares[idx].querySelector('img'); if(i0) i0.src='';
        const i1 = squares[idx+width].querySelector('img'); if(i1) i1.src='';
        const i2 = squares[idx+2*width].querySelector('img'); if(i2) i2.src='';
        roundScore += 10 * scoreMultiplier;
      }
    }
  }
  return found;
}

function dropCandies(){
  for(let c=0;c<width;c++){
    for(let r=width-1;r>=0;r--){
      const idx = r*width + c;
      if(squares[idx].dataset.type==='' || squares[idx].dataset.type===undefined){
        // find above
        let rr = r-1;
        while(rr>=0 && (squares[rr*width + c].dataset.type==='' || squares[rr*width + c].dataset.type===undefined)) rr--;
        if(rr>=0){
          const srcIdx = rr*width + c;
          squares[idx].dataset.type = squares[srcIdx].dataset.type;
          const iDest = squares[idx].querySelector('img'); if(iDest) iDest.src = candyImages[Number(squares[idx].dataset.type)];
          squares[srcIdx].dataset.type = '';
          const iSrc = squares[srcIdx].querySelector('img'); if(iSrc) iSrc.src = '';
        } else {
          const newType = Math.floor(Math.random()*candyImages.length);
          squares[idx].dataset.type = newType;
          const iNew = squares[idx].querySelector('img'); if(iNew) iNew.src = candyImages[newType];
        }
      }
    }
  }
}

function updateScore(){ SCORE.textContent = 'Puntos: ' + score; updateStoreScore(); }
function updateRoundScore(){ const r = document.getElementById('round-score'); if(r) r.textContent = 'Puntos de ronda: ' + roundScore; updateStoreScore(); }
function updateStoreScore(){ const s = document.getElementById('store-score'); if(s){ const total = score + roundScore; s.textContent = 'Puntos: ' + total; } }
function updateLives(){ LIVES.textContent = 'Vidas: ' + lives; if(lives<=0) { alert('Game over'); lives=3; score=0; createBoard(); updateLives(); updateScore(); showScreen(MENU); } }

SHUFFLE.addEventListener('click', ()=>{ for(const s of squares){ const t = Math.floor(Math.random()*candyImages.length); s.dataset.type = t; const i = s.querySelector('img'); if(i) i.src = candyImages[t]; } roundScore = 0; updateRoundScore(); });

RESTART.addEventListener('click', ()=>{ roundScore=0; score=0; lives=3; updateScore(); updateLives(); updateRoundScore(); createBoard(); });

// Menu and store handlers
BTN_PLAY.addEventListener('click', ()=>{ showScreen(GAME_VIEW); createBoard(); updateLives(); updateScore(); });
BTN_STORE.addEventListener('click', ()=>{ showScreen(STORE); });
BTN_OPTIONS.addEventListener('click', ()=>{ showScreen(OPTIONS); });
BTN_EXIT.addEventListener('click', ()=>{ window.close(); });
STORE_BACK.addEventListener('click', ()=>{ showScreen(MENU); });
OPTIONS_BACK.addEventListener('click', ()=>{ showScreen(MENU); });

function openInstructions(){ if(INSTRUCTIONS) INSTRUCTIONS.classList.remove('hidden'); }
function closeInstructions(){ if(INSTRUCTIONS) INSTRUCTIONS.classList.add('hidden'); }
function acknowledgeInstructions(){ closeInstructions(); showScreen(MENU); }

if(BTN_INSTRUCTIONS) BTN_INSTRUCTIONS.addEventListener('click', openInstructions);
if(INSTRUCTIONS_CLOSE) INSTRUCTIONS_CLOSE.addEventListener('click', closeInstructions);
if(INSTRUCTIONS_ACK) INSTRUCTIONS_ACK.addEventListener('click', acknowledgeInstructions);
if(INSTRUCTIONS) INSTRUCTIONS.addEventListener('click', (e)=>{ if(e.target === INSTRUCTIONS) closeInstructions(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeInstructions(); });

// level select buttons in menu
document.querySelectorAll('.level-btn').forEach(b=>{
  b.addEventListener('click', (e)=>{
    const idx = Number(e.currentTarget.dataset.level||0);
    startLevel(idx);
  });
});

// finish level
if(FINISH_LEVEL) FINISH_LEVEL.addEventListener('click', ()=>{ completeLevel(); });
if(EXIT_TO_MENU) EXIT_TO_MENU.addEventListener('click', ()=>{ if(musicAudio){ musicAudio.pause(); musicAudio=null; } showScreen(MENU); });

// Quiz: 20 questions about algorithms & data structures
const questionsPool = [
  {q:'¿Qué estructura usa FIFO (first-in, first-out)?', a:['Cola','Pila','Árbol'], correct:0},
  {q:'¿Qué estructura usa LIFO (last-in, first-out)?', a:['Pila','Cola','Grafo'], correct:0},
  {q:'¿Complejidad promedio de búsqueda en un hash table?', a:['O(1)','O(n)','O(log n)'], correct:0},
  {q:'¿Complejidad de búsqueda en lista enlazada (sin índice)?', a:['O(n)','O(1)','O(log n)'], correct:0},
  {q:'¿Qué recorrido de árbol visita raíz, izquierda, derecha?', a:['Preorden','Inorden','Postorden'], correct:0},
  {q:'¿Qué algoritmo es para búsqueda en grafos por anchura?', a:['BFS','DFS','Dijkstra'], correct:0},
  {q:'¿Qué algoritmo recorre en profundidad?', a:['DFS','BFS','Kruskal'], correct:0},
  {q:'¿Algoritmo para ordenar con mejor caso O(n log n)?', a:['MergeSort','BubbleSort','InsertionSort'], correct:0},
  {q:'¿Estructura ideal para LRU cache?', a:['Hash + lista doblemente enlazada','Árbol binario de búsqueda','Cola'], correct:0},
  {q:'¿Complejidad de insertar en heap (priority queue)?', a:['O(log n)','O(1)','O(n)'], correct:0},
  {q:'¿Qué estructura representa mejor relaciones 1:N jerárquicas?', a:['Árbol','Lista enlazada','Hash table'], correct:0},
  {q:'¿Qué método divide y vencerás se usa en QuickSort?', a:['Partición','Fusión','Heapify'], correct:0},
  {q:'¿Qué garantiza un árbol AVL?', a:['Balanceo por altura','Óptimo en memoria','Orden aleatorio'], correct:0},
  {q:'¿Para qué sirve un grafo dirigido acíclico (DAG)?', a:['Orden topológico','Búsqueda BFS exclusiva','Hashing'], correct:0},
  {q:'¿Qué algoritmo encuentra caminos mínimos con pesos positivos?', a:['Dijkstra','BFS','Prim'], correct:0},
  {q:'¿Qué estructura es mejor para undo/redo?', a:['Pilas','Colas','Árboles'], correct:0},
  {q:'¿Qué es un recorrido in-order en BST?', a:['Devuelve elementos ordenados','Devuelve raíz primero','No tiene orden'], correct:0},
  {q:'¿Qué necesita un algoritmo greedy?', a:['Propiedad de elección local óptima','Backtracking','Programación dinámica'], correct:0},
  {q:'¿Qué estructura es eficiente para prefijos (autocomplete)?', a:['Trie','Hash table','Heap'], correct:0},
  {q:'¿Qué algoritmo construye árbol de expansión mínima?', a:['Kruskal','QuickSort','Dijkstra'], correct:0}
];

function pickRandomTrio(){
  const pool = questionsPool.slice();
  // shuffle
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  return pool.slice(0,3);
}

function renderTrio(){
  const root = document.getElementById('quiz-root');
  if(!root) return;
  root.innerHTML = '';
  const trio = pickRandomTrio();
  trio.forEach((qs, qi)=>{
    const div = document.createElement('div'); div.className='quiz-q';
    const p = document.createElement('div'); p.textContent = (qi+1)+'. '+qs.q; div.appendChild(p);
    const feedback = document.createElement('div'); feedback.className='quiz-feedback'; div.appendChild(feedback);
    qs.a.forEach((opt,j)=>{
      const btn = document.createElement('button'); btn.textContent = opt; btn.style.pointerEvents='auto';
      btn.addEventListener('click', ()=>{
        if(btn.disabled) return;
        // disable all buttons in this question
        const buttons = Array.from(div.querySelectorAll('button'));
        buttons.forEach(b=>{ b.disabled=true; b.style.opacity=0.7; });
        if(j===qs.correct){
          btn.classList.add('correct');
          feedback.textContent='Correcto! +20 pts'; feedback.classList.add('show');
          score += 20; updateScore();
        } else {
          btn.classList.add('wrong');
          feedback.textContent='Incorrecto'; feedback.classList.add('show');
          // highlight the correct answer button
          const correctBtn = buttons[qs.correct];
          if(correctBtn){ correctBtn.classList.add('correct'); correctBtn.style.opacity = 1; }
        }
        // animation clear
        setTimeout(()=>{ feedback.classList.remove('show'); },900);
      });
      div.appendChild(btn);
    });
    root.appendChild(div);
  });
}

// Some browsers block autoplay until a user gesture — resume music on first click
document.addEventListener('click', ()=>{
  try{
    if(musicAudio && musicAudio.paused && !(MUTE && MUTE.checked)){
      musicAudio.play().catch(err=>{ console.warn('resume play failed', err); });
    }
  }catch(e){ }
});


// mute toggle affects music
if(MUTE){
  MUTE.addEventListener('change', ()=>{
    if(MUTE.checked){ if(musicAudio) musicAudio.pause(); }
    else { if(musicAudio) musicAudio.play().catch(()=>{}); }
  });
}

document.querySelectorAll('[data-action="buy-life"]').forEach(b=>{
  b.addEventListener('click', (e)=>{
    const cost = Number(e.currentTarget.dataset.cost||0);
    if(score>=cost){ score -= cost; lives++; updateScore(); updateLives(); playSound(soundClick); alert('Compra realizada: +1 vida'); }
    else alert('Puntos insuficientes');
  });
});

// Show instructions first, then go to menu on "Entendido"
document.body.className = 'scene-lobby';
openInstructions();

// initial
showScreen(MENU);
createBoard();
setTimeout(()=>{ while(checkAndClear()){ dropCandies(); } updateRoundScore(); },200);

// ensure store-back also stops any level music
if(STORE_BACK){ STORE_BACK.addEventListener('click', ()=>{ try{ if(musicAudio) musicAudio.pause(); }catch(e){} showScreen(MENU); }); }
