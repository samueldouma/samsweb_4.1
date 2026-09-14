(() => {
  "use strict";
  const dataNodes = (window.SITE_NODES || []).map(n => ({ ...n }));
  const byId = new Map(dataNodes.map(n => [n.id, n]));
  const dataLinks = [];
  const linkKeys = new Set();
  function addDataLink(source, target, weight = 1) {
    if (!byId.has(source) || !byId.has(target) || source === target) return;
    const key = [source, target].sort().join("::");
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    dataLinks.push({ source, target, weight });
  }
  dataNodes.forEach(n => {
    if (n.parent) addDataLink(n.parent, n.id, n.type === "section" ? 3 : 1);
    (n.related || []).forEach(otherId => addDataLink(n.id, otherId, 0.8));
  });
  const data = { nodes: dataNodes, links: dataLinks };

  const HISTORY_KEY = "samsweb-connectome-black-history-v1";
  let visitedMap = loadVisitedMap();
  let activeNodeId = null;
  let hoverNodeId = null;
  let currentSearch = "";
  let selectedHistory = [];

  const app = document.getElementById("hybridApp");
  const graphWrap = document.getElementById("graphWrap");
  const svg = d3.select("#graph");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const searchResults = document.getElementById("searchResults");
  const documentFrame = document.getElementById("documentFrame");
  const documentOpen = document.getElementById("documentOpen");
  const documentBack = document.getElementById("documentBack");
  const desktopDivider = document.getElementById("desktopDivider");
  const mobileDivider = document.getElementById("mobileDivider");
  const mobileDividerHint = document.getElementById("mobileDividerHint");
  const searchWrap = searchInput.closest(".search-wrap");
  const graphPane = document.getElementById("graphPane");
  const topbar = document.querySelector(".hybrid-topbar");

  function placeSearchForViewport(){
    if(innerWidth <= 900){
      if(searchWrap.parentElement !== topbar) topbar.appendChild(searchWrap);
    } else {
      if(searchWrap.parentElement !== graphPane) graphPane.insertBefore(searchWrap, graphPane.firstChild);
    }
  }
  placeSearchForViewport();
  window.addEventListener("resize", placeSearchForViewport, {passive:true});

  const ballToggle = document.getElementById("ballToggle");
  ballToggle.addEventListener("click", () => { location.href = "index.html"; });

  const hybridArrows = [...document.querySelectorAll(".hybrid-view-arrow")];
  const rainbow = ["#ff0000", "#ff7f00", "#ffe600", "#00b83f", "#006eff", "#5a00c8", "#d000ff"];
  function recolorHybridArrows() {
    const pool = [...rainbow].sort(() => Math.random() - 0.5);
    hybridArrows.forEach((arrow, i) => {
      arrow.style.color = pool[i % pool.length];
      arrow.style.opacity = String(0.45 + Math.random() * 0.55);
    });
  }
  recolorHybridArrows();
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(recolorHybridArrows, 667);
  }

  const zoomLayer = svg.append("g");
  const linkLayer = zoomLayer.append("g");
  const nodeLayer = zoomLayer.append("g");
  const adjacency = new Map();
  data.nodes.forEach(n => adjacency.set(n.id, new Set()));
  data.links.forEach(l => { adjacency.get(l.source).add(l.target); adjacency.get(l.target).add(l.source); });

  function getGraphSize() {
    const rect = graphWrap.getBoundingClientRect();
    return { width: Math.max(280, rect.width), height: Math.max(220, rect.height) };
  }
  let { width, height } = getGraphSize();
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const zoomBehavior = d3.zoom().scaleExtent([0.35, 3]).on("zoom", event => zoomLayer.attr("transform", event.transform));
  svg.call(zoomBehavior);
  function dismissMobileDividerHint(){
    if(mobileDividerHint) mobileDividerHint.classList.add("is-hidden");
  }
  svg.on("touchstart.hint pointerdown.hint wheel.hint", dismissMobileDividerHint);
  mobileDivider.addEventListener("touchstart", dismissMobileDividerHint, {passive:true});
  mobileDivider.addEventListener("pointerdown", dismissMobileDividerHint);
  function updateMobileDividerState(documentPixels){
    if(innerWidth > 900) {
      mobileDivider.classList.remove("is-collapsed");
      return;
    }
    const rect = app.getBoundingClientRect();
    const graphPixels = rect.height - documentPixels;
    mobileDivider.classList.toggle("is-collapsed", graphPixels <= 34);
  }

  // These are the original samsweb_4-2.1-main_3 force values.
  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id).distance(d => 124 - d.weight * 12).strength(0.18))
    .force("charge", d3.forceManyBody().strength(-225))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(d => (d.size || 16) + 20))
    .force("x", d3.forceX(width / 2).strength(0.015))
    .force("y", d3.forceY(height / 2).strength(0.015));

  const link = linkLayer.selectAll("line").data(data.links).enter().append("line").attr("class","link").attr("stroke-width",d => .8 + d.weight * .35);
  const node = nodeLayer.selectAll("g").data(data.nodes).enter().append("g").attr("class","node").call(drag(simulation));
  node.append("circle").attr("r", d => d.size || 16);
  node.append("text").attr("dx", d => (d.size || 16) + 8).attr("dy",4).text(d => d.title);

  node.on("mouseover", function(event,d){ hoverNodeId=d.id; updateStyles(); })
    .on("mouseout", function(){ hoverNodeId=null; updateStyles(); })
    .on("click", function(event,d){ event.stopPropagation(); selectNode(d); })
    .on("touchstart", function(event,d){ event.preventDefault(); selectNode(d); });

  simulation.on("tick", () => {
    link.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y).attr("x2",d=>d.target.x).attr("y2",d=>d.target.y);
    node.attr("transform",d=>`translate(${d.x},${d.y})`);
  });

  function loadVisitedMap(){ try { const raw=localStorage.getItem(HISTORY_KEY); return raw?JSON.parse(raw):{}; } catch(_){ return {}; } }
  function saveVisitedMap(){ try { localStorage.setItem(HISTORY_KEY,JSON.stringify(visitedMap)); } catch(_){} }
  function markVisited(id){ visitedMap[id]=true; saveVisitedMap(); }
  function isVisited(id){ return !!visitedMap[id]; }
  function isLocked(n){ return !!n.locked || n.section === "Dico"; }
  function findNode(id){ return byId.get(id); }

  function selectNode(d, options={}) {
    if (!d || !d.path) return;
    if (!options.skipHistory && activeNodeId && activeNodeId !== d.id) selectedHistory.push(activeNodeId);
    markVisited(d.id);
    activeNodeId = d.id;
    applyActiveForces();
    updateStyles();
    centerOnNode(d);
    openDocument(d);
    try { history.replaceState(null,"",`#${encodeURIComponent(d.id)}`); } catch(_){}
  }

  function embeddedPath(path){
    if(!path || !/\.html(?:$|[?#])/i.test(path)) return path;
    const hashIndex = path.indexOf("#");
    const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
    const base = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
    return `${base}${base.includes("?") ? "&" : "?"}embedded=1${hash}`;
  }

  function openDocument(d){
    documentFrame.title=d.title;
    documentFrame.src=embeddedPath(d.path);
    documentOpen.href=d.path;
  }

  documentBack.addEventListener("click", () => {
    const previous = selectedHistory.pop();
    if (previous && findNode(previous)) selectNode(findNode(previous), { skipHistory:true });
    else {
      const sameSiteReferrer = (() => { try { return document.referrer && new URL(document.referrer).origin === location.origin; } catch(_) { return false; } })();
      if (sameSiteReferrer) history.back(); else location.href="index.html";
    }
  });

  function applyActiveForces(){
    if(!activeNodeId){ simulation.force("clusterX",null); simulation.force("clusterY",null); simulation.alpha(.9).restart(); return; }
    const active=findNode(activeNodeId); const neighbors=adjacency.get(activeNodeId);
    simulation.force("clusterX",d3.forceX(d => (d.id===activeNodeId || neighbors.has(d.id)) ? (active.x||width/2) : width/2).strength(d => d.id === activeNodeId ? .45 : (neighbors.has(d.id) ? .18 : .01)));
    simulation.force("clusterY",d3.forceY(d => (d.id===activeNodeId || neighbors.has(d.id)) ? (active.y||height/2) : height/2).strength(d => d.id === activeNodeId ? .45 : (neighbors.has(d.id) ? .18 : .01)));
    simulation.alpha(1).restart();
  }

  function getNodeStyle(d,focusId){
    const focused=focusId===d.id; const neighbor=focusId?adjacency.get(focusId).has(d.id):false; const visited=isVisited(d.id);
    let fill="#fff", stroke="#fff", strokeWidth=1;
    if(visited){ fill="#000"; stroke="#fff"; strokeWidth=1.6; }
    if(focused){ fill="#000"; stroke="#fff"; strokeWidth=2.2; }
    else if(neighbor){ fill=visited?"#101010":"#d8d8d8"; stroke="#fff"; strokeWidth=1.4; }
    return {fill,stroke,strokeWidth,focused,neighbor};
  }

  function updateStyles(){
    const focusId=hoverNodeId||activeNodeId;
    node.each(function(d){ const el=d3.select(this); const s=getNodeStyle(d,focusId); el.classed("active",activeNodeId===d.id).classed("hovered",hoverNodeId===d.id).classed("neighbor",s.neighbor).classed("dim",!!focusId&&!(s.focused||s.neighbor)); el.select("circle").attr("fill",s.fill).attr("stroke",s.stroke).attr("stroke-width",s.strokeWidth); });
    link.classed("active",d=>{ if(!focusId)return false; const a=d.source.id||d.source,b=d.target.id||d.target; return a===focusId||b===focusId; }).attr("stroke-opacity",d=>{ if(!focusId)return .56; const a=d.source.id||d.source,b=d.target.id||d.target; return (a===focusId||b===focusId)?.95:.07; });
  }

  function centerOnNode(d){ const current=d3.zoomTransform(svg.node()); const scale=current.k; const x=width/2-d.x*scale; const y=height/2-d.y*scale; svg.transition().duration(450).call(zoomBehavior.transform,d3.zoomIdentity.translate(x,y).scale(scale)); }
  function drag(sim){
    function started(event,d){ if(!event.active)sim.alphaTarget(.25).restart(); d.fx=d.x; d.fy=d.y; }
    function moved(event,d){ d.fx=event.x; d.fy=event.y; }
    function ended(event){ if(!event.active)sim.alphaTarget(0); }
    return d3.drag().on("start",started).on("drag",moved).on("end",ended);
  }

  function normalize(t){ return String(t||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,""); }
  function haystack(n){ return normalize([n.title,n.section,...(n.keywords||[]),n.indexedText||""].join(" ")); }
  function score(n,q){ q=normalize(q).trim(); if(!q)return 1; const terms=q.split(/\s+/).filter(Boolean); const title=normalize(n.title), keys=normalize((n.keywords||[]).join(" ")), body=normalize(n.indexedText); let s=0; terms.forEach(t=>{ if(title===t)s+=20; else if(title.startsWith(t))s+=12; else if(title.includes(t))s+=8; if(keys.includes(t))s+=5; if(body.includes(t))s+=2; }); return terms.every(t=>haystack(n).includes(t))?s+1:0; }
  function applySearch(query){
    currentSearch=query.trim(); clearSearch.hidden=!currentSearch;
    const scored=data.nodes.filter(n=>n.id!=="root").map(n=>({node:n,score:score(n,currentSearch)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.node.title.localeCompare(b.node.title));
    const matches=new Set(scored.map(x=>x.node.id));
    node.classed("search-match",d=>!!currentSearch&&matches.has(d.id)).classed("dim",d=>!!currentSearch&&!matches.has(d.id)&&d.id!=="root");
    searchResults.textContent="";
    if(!currentSearch){ searchResults.hidden=true; updateStyles(); return; }
    searchResults.hidden=false;
    scored.slice(0,12).forEach(({node:n})=>{ const b=document.createElement("button"); b.type="button"; b.className="search-result"; b.innerHTML=`<span class="search-result-title"></span><span class="search-result-section"></span>`; b.firstElementChild.textContent=n.title+(isLocked(n)?"  ×":""); b.lastElementChild.textContent=n.section; b.addEventListener("click",()=>{ selectNode(n); searchInput.value=""; applySearch(""); }); searchResults.appendChild(b); });
    if(!scored.length){ const d=document.createElement("div"); d.className="search-result"; d.textContent="No matching page"; searchResults.appendChild(d); }
  }
  searchInput.addEventListener("input",()=>applySearch(searchInput.value));
  clearSearch.addEventListener("click",()=>{searchInput.value="";applySearch("");searchInput.focus();});
  document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))searchResults.hidden=true;});

  async function indexPageText(n){
    if(isLocked(n)||!n.path||!n.path.toLowerCase().endsWith(".html"))return;
    try{ const r=await fetch(n.path,{cache:"force-cache"}); if(!r.ok)return; const source=await r.text(); const doc=new DOMParser().parseFromString(source,"text/html"); doc.querySelectorAll("script,style,noscript,.access-gate").forEach(e=>e.remove()); const keys=doc.querySelector('meta[name="keywords"]')?.content||""; const desc=doc.querySelector('meta[name="description"]')?.content||""; const text=(doc.body?.innerText||doc.body?.textContent||"").replace(/\s+/g," ").slice(0,24000); n.indexedText=`${keys} ${desc} ${text}`; }catch(_){}
  }

  function resizeGraph(){ const s=getGraphSize(); width=s.width;height=s.height;svg.attr("viewBox",`0 0 ${width} ${height}`);simulation.force("center",d3.forceCenter(width/2,height/2));simulation.force("x",d3.forceX(width/2).strength(.015));simulation.force("y",d3.forceY(height/2).strength(.015));if(activeNodeId)applyActiveForces();simulation.alpha(.6).restart(); }
  new ResizeObserver(resizeGraph).observe(graphWrap);

  function initDividers(){
    let dragState = null;
    let queuedEvent = null;
    let framePending = false;

    function applyDrag(event){
      framePending = false;
      if(!dragState || !event) return;
      const rect = app.getBoundingClientRect();

      if(dragState.kind === "desktop" && innerWidth > 900){
        const dividerWidth = desktopDivider.getBoundingClientRect().width || 12;
        const minDocument = Math.min(360, Math.max(250, rect.width * .28));
        const minGraph = Math.min(380, Math.max(270, rect.width * .25));
        const maximum = Math.max(minDocument, rect.width - minGraph - dividerWidth);
        const documentPixels = Math.max(minDocument, Math.min(maximum, event.clientX - rect.left));
        document.documentElement.style.setProperty("--doc-width", `${documentPixels.toFixed(1)}px`);
      }

      if(dragState.kind === "mobile" && innerWidth <= 900){
        const minDocument = Math.min(220, Math.max(140, rect.height * .22));
        const maximum = Math.max(minDocument, rect.height - 15);
        const documentPixels = Math.max(minDocument, Math.min(maximum, event.clientY - rect.top));
        document.documentElement.style.setProperty("--mobile-doc", `${documentPixels.toFixed(1)}px`);
        updateMobileDividerState(documentPixels);
      }
    }

    function queueDrag(event){
      if(!dragState || event.pointerId !== dragState.pointerId) return;
      queuedEvent = event;
      if(!framePending){
        framePending = true;
        requestAnimationFrame(() => applyDrag(queuedEvent));
      }
      if(event.cancelable) event.preventDefault();
    }

    function beginDrag(kind, element){
      return event => {
        if(event.button !== undefined && event.button !== 0) return;
        dragState = { kind, pointerId:event.pointerId, element };
        if(kind === "mobile" && mobileDividerHint) mobileDividerHint.classList.add("is-hidden");
        try { element.setPointerCapture(event.pointerId); } catch(_) {}
        document.documentElement.classList.add("is-resizing");
        document.documentElement.classList.toggle("is-resizing-mobile", kind === "mobile");
        if(event.cancelable) event.preventDefault();
      };
    }

    function endDrag(event){
      if(!dragState) return;
      if(event && event.pointerId !== undefined && event.pointerId !== dragState.pointerId) return;
      try { dragState.element.releasePointerCapture(dragState.pointerId); } catch(_) {}
      dragState = null;
      queuedEvent = null;
      document.documentElement.classList.remove("is-resizing", "is-resizing-mobile");
      resizeGraph();
    }

    function normalizePanelSizes(){
      const rect = app.getBoundingClientRect();
      if(innerWidth > 900){
        const dividerWidth = desktopDivider.getBoundingClientRect().width || 12;
        const minDocument = Math.min(360, Math.max(250, rect.width * .28));
        const minGraph = Math.min(380, Math.max(270, rect.width * .25));
        const maximum = Math.max(minDocument, rect.width - minGraph - dividerWidth);
        const current = document.getElementById("documentPane").getBoundingClientRect().width;
        if(current < minDocument || current > maximum){
          const clamped = Math.max(minDocument, Math.min(maximum, current));
          document.documentElement.style.setProperty("--doc-width", `${clamped.toFixed(1)}px`);
        }
      } else {
        const minDocument = Math.min(220, Math.max(140, rect.height * .22));
        const maximum = Math.max(minDocument, rect.height - 15);
        const current = document.getElementById("documentPane").getBoundingClientRect().height;
        const clamped = Math.max(minDocument, Math.min(maximum, current));
        if(Math.abs(current - clamped) > 1){
          document.documentElement.style.setProperty("--mobile-doc", `${clamped.toFixed(1)}px`);
        }
        updateMobileDividerState(clamped);
      }
      resizeGraph();
    }

    desktopDivider.addEventListener("pointerdown", beginDrag("desktop", desktopDivider));
    mobileDivider.addEventListener("pointerdown", beginDrag("mobile", mobileDivider));
    mobileDivider.addEventListener("click", () => {
      if(innerWidth <= 900 && mobileDivider.classList.contains("is-collapsed")){
        const rect = app.getBoundingClientRect();
        const documentPixels = rect.height * .58;
        document.documentElement.style.setProperty("--mobile-doc", `${documentPixels.toFixed(1)}px`);
        updateMobileDividerState(documentPixels);
        resizeGraph();
      }
    });
    window.addEventListener("pointermove", queueDrag, {passive:false});
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", () => endDrag());
    window.addEventListener("resize", normalizePanelSizes, {passive:true});
  }
  initDividers();
  if(innerWidth <= 900){
    requestAnimationFrame(() => updateMobileDividerState(document.getElementById("documentPane").getBoundingClientRect().height));
  }

  const hash=decodeURIComponent(location.hash.replace(/^#/,""));
  const initial=findNode(hash)||findNode("about")||data.nodes[0];
  selectNode(initial,{skipHistory:true});
  updateStyles();
  simulation.alpha(1).restart();
  Promise.allSettled(data.nodes.map(indexPageText));
})();
