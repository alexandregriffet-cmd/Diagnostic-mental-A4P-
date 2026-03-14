(function(){
  const cfg = window.A4P_CONFIG;

  function getData(){
    try { return JSON.parse(localStorage.getItem('a4p_hub_results')) || {}; }
    catch(e){ return {}; }
  }

  function setText(id, value){ const el=document.getElementById(id); if(el) el.textContent=value; }
  function setHTML(id, value){ const el=document.getElementById(id); if(el) el.innerHTML=value; }

  function renderRadar(dimensions){
    const svg = document.getElementById('radar-svg');
    if(!svg) return;
    const labels = ['Confiance','Régulation','Engagement','Stabilité'];
    const keys = ['confiance','regulation','engagement','stabilite'];
    const values = keys.map(k => Number(dimensions?.[k] || 0));
    const cx=260, cy=260, r=185;
    const pts = values.map((v,i)=>{
      const ang = (-90 + i*90) * Math.PI/180;
      const rr = r*(v/100);
      return [cx + Math.cos(ang)*rr, cy + Math.sin(ang)*rr];
    });
    const polygon = pts.map(p=>p.join(',')).join(' ');

    let grid='';
    [20,40,60,80,100].forEach(level=>{
      const rr=r*(level/100);
      const levelPts = [0,1,2,3].map(i=>{
        const ang=(-90+i*90)*Math.PI/180;
        return [cx+Math.cos(ang)*rr, cy+Math.sin(ang)*rr].join(',');
      }).join(' ');
      grid += `<polygon points="${levelPts}" fill="none" stroke="#cfd8e8" stroke-width="2"/>`;
    });
    const axes = [0,1,2,3].map(i=>{
      const ang=(-90+i*90)*Math.PI/180;
      return `<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(ang)*r}" y2="${cy+Math.sin(ang)*r}" stroke="#cfd8e8" stroke-width="2"/>`;
    }).join('');
    const labelPts = [0,1,2,3].map(i=>{
      const ang=(-90+i*90)*Math.PI/180;
      const lr=r+48;
      return {x:cx+Math.cos(ang)*lr, y:cy+Math.sin(ang)*lr, t:labels[i]};
    });
    const texts = labelPts.map(l=>`<text x="${l.x}" y="${l.y}" text-anchor="middle" dominant-baseline="middle" font-size="22" font-weight="700" fill="#264879">${l.t}</text>`).join('');
    const dots = pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#264879"/>`).join('');
    svg.innerHTML = `${grid}${axes}<polygon points="${polygon}" fill="rgba(38,72,121,.18)" stroke="#264879" stroke-width="5"/>${dots}${texts}`;
  }

  function render(){
    const data = getData();
    const cmp = data.CMP;
    const syncedCount = [data.PMP, data.CMP, data.EQU].filter(Boolean).length;
    const global = cmp?.score_global || 0;
    setText('score-global', `${global}/100`);
    setText('synced-count', `${syncedCount}/3 modules synchronisés`);

    renderRadar(cmp?.dimensions || {});

    if(cmp){
      setHTML('cmp-status', '<span class="status ok">Synchronisé</span>');
      setText('cmp-profil', cmp.profil_nom || 'Profil indisponible');
      setText('cmp-score', `${cmp.score_global}/100`);
      setText('cmp-summary', cmp.summary || 'Résumé indisponible');
    } else {
      setHTML('cmp-status', '<span class="status wait">En attente</span>');
      setText('cmp-profil', 'Aucun résultat');
      setText('cmp-score', '—');
      setText('cmp-summary', 'Le module CMP n’est pas encore synchronisé.');
    }

    setText('json-output', JSON.stringify(data, null, 2));

    const cmpOpen = document.getElementById('btn-open-cmp');
    const cmpRes = document.getElementById('btn-open-cmp-result');
    if(cmpOpen) cmpOpen.href = cfg.CMP_INDEX_URL;
    if(cmpRes) cmpRes.href = cfg.CMP_RESULTS_URL;
  }

  window.addEventListener('storage', render);
  document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById('btn-refresh')?.addEventListener('click', render);
    document.getElementById('btn-reset')?.addEventListener('click', ()=>{ localStorage.removeItem('a4p_hub_results'); render(); });
    render();
  });
})();
