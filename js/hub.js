(function(){
  const cfg = window.A4P_CONFIG;

  function readHub(){
    try { return JSON.parse(localStorage.getItem(cfg.storageKey)) || {}; }
    catch(e){ return {}; }
  }

  function setText(id, value){
    const el = document.getElementById(id);
    if(el) el.textContent = value;
  }

  function setHref(id, href){
    const el = document.getElementById(id);
    if(el) el.href = href;
  }

  function renderModule(blockId, data, opts){
    const block = document.getElementById(blockId);
    if(!block) return;

    if(data && data.score_global != null){
      block.querySelector('.status').className = 'status status-success';
      block.querySelector('.status').textContent = 'Synchronisé';
      block.querySelector('.profil').textContent = data.profil_nom || 'Profil disponible';
      block.querySelector('.score').textContent = `${data.score_global}/100`;
      block.querySelector('.resume').textContent = data.summary || 'Résultat synchronisé avec le hub.';
    } else {
      block.querySelector('.status').className = 'status status-wait';
      block.querySelector('.status').textContent = 'En attente';
      block.querySelector('.profil').textContent = 'Aucun résultat';
      block.querySelector('.score').textContent = '—';
      block.querySelector('.resume').textContent = opts.emptyText;
    }

    setHref(opts.testBtnId, opts.testUrl);
    setHref(opts.resultBtnId, opts.resultUrl);
  }

  function average(values){
    const valid = values.filter(v => typeof v === 'number');
    if(!valid.length) return { value: 0, count: 0 };
    const total = valid.reduce((a,b)=>a+b,0);
    return { value: Math.round(total/valid.length), count: valid.length };
  }

  function drawRadar(dimensions){
    const canvas = document.getElementById('radarCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = Math.min(canvas.parentElement.clientWidth, 560);
    const cssHeight = cssWidth;
    canvas.width = cssWidth * ratio;
    canvas.height = cssHeight * ratio;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,cssWidth,cssHeight);

    const labels = ['Confiance','Régulation','Engagement','Stabilité'];
    const values = [dimensions.confiance||0, dimensions.regulation||0, dimensions.engagement||0, dimensions.stabilite||0];
    const cx = cssWidth/2, cy = cssHeight/2, radius = cssWidth*0.33;

    ctx.strokeStyle = '#cfd7e6';
    ctx.lineWidth = 2;
    for(let level=1; level<=5; level++){
      const r = radius * (level/5);
      ctx.beginPath();
      for(let i=0;i<4;i++){
        const angle = -Math.PI/2 + i*(Math.PI/2);
        const x = cx + Math.cos(angle)*r;
        const y = cy + Math.sin(angle)*r;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.strokeStyle = '#cfd7e6';
    for(let i=0;i<4;i++){
      const angle = -Math.PI/2 + i*(Math.PI/2);
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx + Math.cos(angle)*radius, cy + Math.sin(angle)*radius);
      ctx.stroke();
    }

    ctx.beginPath();
    values.forEach((v,i)=>{
      const angle = -Math.PI/2 + i*(Math.PI/2);
      const r = radius*(Math.max(0,Math.min(100,v))/100);
      const x = cx + Math.cos(angle)*r;
      const y = cy + Math.sin(angle)*r;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(31,63,119,.16)';
    ctx.strokeStyle = '#254b8b';
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#254b8b';
    values.forEach((v,i)=>{
      const angle = -Math.PI/2 + i*(Math.PI/2);
      const r = radius*(Math.max(0,Math.min(100,v))/100);
      const x = cx + Math.cos(angle)*r;
      const y = cy + Math.sin(angle)*r;
      ctx.beginPath();
      ctx.arc(x,y,6,0,Math.PI*2);
      ctx.fill();
    });

    ctx.fillStyle = '#24406f';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, Segoe UI, Arial';
    labels.forEach((label,i)=>{
      const angle = -Math.PI/2 + i*(Math.PI/2);
      const x = cx + Math.cos(angle)*(radius+44);
      const y = cy + Math.sin(angle)*(radius+44);
      const width = ctx.measureText(label).width;
      ctx.fillText(label, x - width/2, y + 6);
    });
  }

  function render(){
    const data = readHub();
    const cmp = data.CMP || null;
    const pmp = data.PMP || null;
    const equ = data.EQU || data.PSYCHO || null;

    renderModule('module-cmp', cmp, {
      testBtnId:'btn-cmp-test', resultBtnId:'btn-cmp-result',
      testUrl:cfg.cmpTestUrl, resultUrl:cfg.cmpResultsUrl,
      emptyText:'Le module CMP n’est pas encore synchronisé avec le hub.'
    });

    renderModule('module-pmp', pmp, {
      testBtnId:'btn-pmp-test', resultBtnId:'btn-pmp-result',
      testUrl:cfg.pmpTestUrl, resultUrl:cfg.pmpResultsUrl,
      emptyText:'Le module PMP a été remis sur sa passerelle locale pour éviter toute régression de lien.'
    });

    renderModule('module-equ', equ, {
      testBtnId:'btn-equ-test', resultBtnId:'btn-equ-result',
      testUrl:cfg.equilibreTestUrl, resultUrl:cfg.equilibreResultsUrl,
      emptyText:'Le module Équilibre n’est pas encore connecté.'
    });

    const avg = average([
      cmp?.score_global,
      pmp?.score_global,
      equ?.score_global
    ]);
    setText('global-score', `${avg.value}/100`);
    setText('global-count', `${avg.count}/3 modules synchronisés`);

    const dims = cmp?.dimensions || {confiance:0, regulation:0, engagement:0, stabilite:0};
    drawRadar(dims);

    const tech = document.getElementById('shared-json');
    if(tech) tech.textContent = JSON.stringify(data, null, 2);
  }

  window.addEventListener('resize', render);
  window.addEventListener('storage', render);
  document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('btn-refresh')?.addEventListener('click', render);
    document.getElementById('btn-reset')?.addEventListener('click', function(){
      localStorage.removeItem(cfg.storageKey);
      render();
    });
    render();
  });
})();
