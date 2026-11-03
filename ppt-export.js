/* Ekspor ringkas menu aktif ke PowerPoint (template js/ppt-template.pptx) dengan analisa otomatis */
(function(){
  var TEMPLATE = "ppt-template.pptx";
  var JSZIP = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
  var X0 = 612600, AW = 10966800, TY = 900000, SY = 1380000, Y0 = 1760000, AH = 4440000;
  var C_TITLE = "1B5061", C_BLUE = "0071BC", C_MUTED = "5B6573", C_INK = "10243B", C_YEL = "FDB913";
  var MAX_CHARTS = 4;
  var BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  var TSRE = /^(jan|feb|mar|apr|mei|may|jun|jul|agu|aug|ags|sep|okt|oct|nov|des|dec|minggu|mg|w\d|week|periode|q[1-4]|tw|\d{1,2}[\/\-.]|\d{4}-\d{2})/i;

  function load(src, test){ return new Promise(function(res, rej){ if(test()) return res(); var s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=function(){ rej(new Error("Gagal memuat "+src)); }; document.head.appendChild(s); }); }
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,""); }
  function txt(el){ return el ? (el.innerText||el.textContent||"").replace(/\s+/g," ").trim() : ""; }
  function vis(el){ return !!(el && el.getClientRects().length); }
  function R(n){ return Math.round(n); }
  function cut(s,n){ s=String(s||""); return s.length>n ? s.slice(0,n-1).replace(/\s+\S*$/,"")+"…" : s; }
  function fmt(n, pct){ if(!isFinite(n)) return "-"; var a=Math.abs(n), s;
    if(pct) s=n.toLocaleString("id-ID",{maximumFractionDigits:1})+"%";
    else if(a>=1e9) s=(n/1e9).toLocaleString("id-ID",{maximumFractionDigits:2})+" M";
    else if(a>=1e6) s=(n/1e6).toLocaleString("id-ID",{maximumFractionDigits:1})+" jt";
    else s=n.toLocaleString("id-ID",{maximumFractionDigits: a<10?2:1});
    return s; }
  function P(x){ return fmt(x*100, true); }

  /* ---------- shape builders ---------- */
  function rPr(o){ return '<a:rPr lang="id-ID" sz="'+(o.sz||1200)+'" b="'+(o.b?1:0)+'" dirty="0"><a:solidFill><a:srgbClr val="'+(o.color||C_INK)+'"/></a:solidFill><a:latin typeface="Open Sans"/><a:cs typeface="Open Sans"/></a:rPr>'; }
  function run(t,o){ return '<a:r>'+rPr(o)+'<a:t>'+esc(t)+'</a:t></a:r>'; }
  function body(anchor, inset){ var i=inset||0; return '<a:bodyPr wrap="square" lIns="'+i+'" tIns="'+i+'" rIns="'+i+'" bIns="'+i+'" anchor="'+(anchor||"t")+'"><a:normAutofit/></a:bodyPr><a:lstStyle/>'; }
  function spPr(x,y,w,h,geom,fill,ln){ return '<p:spPr><a:xfrm><a:off x="'+R(x)+'" y="'+R(y)+'"/><a:ext cx="'+R(w)+'" cy="'+R(h)+'"/></a:xfrm><a:prstGeom prst="'+(geom||"rect")+'"><a:avLst/></a:prstGeom>'+(fill?'<a:solidFill><a:srgbClr val="'+fill+'"/></a:solidFill>':'<a:noFill/>')+(ln?'<a:ln w="9525"><a:solidFill><a:srgbClr val="'+ln+'"/></a:solidFill></a:ln>':'<a:ln><a:noFill/></a:ln>')+'</p:spPr>'; }
  function tx(id,x,y,w,h,t,o){ o=o||{};
    return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="Teks '+id+'"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'+spPr(x,y,w,h)+'<p:txBody>'+body(o.anchor)+'<a:p><a:pPr algn="'+(o.align||"l")+'"/>'+run(t,o)+'</a:p></p:txBody></p:sp>'; }
  function box(id,x,y,w,h,fill,ln){ return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="Kotak '+id+'"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'+spPr(x,y,w,h,"roundRect",fill,ln)+'<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="id-ID"/></a:p></p:txBody></p:sp>'; }
  function bullets(id,x,y,w,h,items,o){ o=o||{}; var sz=o.sz||1300;
    var ps=items.map(function(t){ return '<a:p><a:pPr marL="228600" indent="-228600"><a:lnSpc><a:spcPct val="105000"/></a:lnSpc><a:spcAft><a:spcPts val="'+(o.gap||900)+'"/></a:spcAft><a:buClr><a:srgbClr val="'+(o.bu||C_YEL)+'"/></a:buClr><a:buSzPct val="120000"/><a:buFont typeface="Arial"/><a:buChar char="&#8226;"/></a:pPr>'+run(t,{sz:sz,color:C_INK})+'</a:p>'; }).join("");
    return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="Poin '+id+'"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'+spPr(x,y,w,h)+'<p:txBody>'+body("t")+(ps||'<a:p><a:endParaRPr lang="id-ID"/></a:p>')+'</p:txBody></p:sp>'; }
  function pic(id,rid,x,y,w,h){ return '<p:pic><p:nvPicPr><p:cNvPr id="'+id+'" name="Grafik '+id+'"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="'+R(x)+'" y="'+R(y)+'"/><a:ext cx="'+R(w)+'" cy="'+R(h)+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>'; }
  function line(id,x,y,w,color){ return '<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="'+id+'" name="Garis '+id+'"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr><a:xfrm><a:off x="'+R(x)+'" y="'+R(y)+'"/><a:ext cx="'+R(w)+'" cy="0"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="28575"><a:solidFill><a:srgbClr val="'+color+'"/></a:solidFill></a:ln></p:spPr></p:cxnSp>'; }
  function slideXml(shapes){ return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'+shapes+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'; }
  function head(title, sub){ return tx(2, X0, TY, AW, 440000, title, {sz:2400, b:1, color:C_TITLE, anchor:"b"}) + line(3, X0, TY+500000, 900000, C_YEL) + (sub ? tx(4, X0, SY, AW, 300000, cut(sub,170), {sz:1100, color:C_MUTED}) : ""); }
  function fit(iw, ih, x, y, w, h){ var k=Math.min(w/iw, h/ih); var fw=iw*k, fh=ih*k; return {x:x+(w-fw)/2, y:y+(h-fh)/2, w:fw, h:fh}; }
  function panel(id, x, y, w, h, title, items, sz){ return box(id, x, y, w, h, "F2F6FB", "DCE4ED") + tx(id+1, x+200000, y+170000, w-400000, 300000, title, {sz:1300, b:1, color:C_BLUE}) + bullets(id+2, x+200000, y+560000, w-400000, h-700000, items, {sz:sz||1200}); }

  /* ---------- analisa otomatis dari data grafik ---------- */
  function analyze(chart, title, lowerBetter){
    var labels=(chart.data.labels||[]).map(function(l){ return Array.isArray(l)?l.join(" "):String(l); });
    var horiz = chart.options && chart.options.indexAxis==="y";
    function v(d){ if(typeof d==="number") return d; if(d && typeof d==="object") return +(horiz?d.x:d.y)||0; return +d||0; }
    var ds=(chart.data.datasets||[]).filter(function(d,i){ return d.data && d.data.length && chart.isDatasetVisible(i); });
    var tgt=ds.filter(function(d){ return /target|rencana|rkap/i.test(d.label||""); });
    var real=ds.filter(function(d){ return tgt.indexOf(d)<0 && !/kumulatif|rata|avg/i.test(d.label||""); });
    if(!real.length) real=ds;
    var n=labels.length, b=[], rec=[];
    if(!n || !real.length) return {b:b, rec:rec};
    var series=labels.map(function(_,i){ return real.reduce(function(a,d){ return a+v(d.data[i]); },0); });
    var tser=tgt.length ? labels.map(function(_,i){ return tgt.reduce(function(a,d){ return a+v(d.data[i]); },0); }) : null;
    var isPct = /%|persen|capaian|perubahan|rasio/i.test(title+" "+real.map(function(d){return d.label;}).join(" ")) || series.some(function(x){ return x<0; });
    var isTS = chart.config.type==="line" || labels.filter(function(l){ return TSRE.test(l.trim()); }).length >= Math.min(3, n);
    var type = chart.config.type;
    if(isTS && !isPct){
      var last=n-1; while(last>0 && !series[last]) last--;
      var first=0; while(first<last && !series[first]) first++;
      var tot=0, pk=first; for(var i=first;i<=last;i++){ tot+=series[i]; if(series[i]>series[pk]) pk=i; }
      b.push("Total "+fmt(tot)+" pada periode "+labels[first]+(last>first?" – "+labels[last]:"")+"; rata-rata "+fmt(tot/(last-first+1))+" per periode.");
      b.push("Nilai tertinggi terjadi pada "+labels[pk]+" ("+fmt(series[pk])+").");
      if(last>first && series[last-1]){ var ch=(series[last]-series[last-1])/series[last-1], good = lowerBetter ? ch<0 : ch>0;
        b.push("Periode terakhir ("+labels[last]+") "+(ch<0?"turun ":"naik ")+P(Math.abs(ch))+" dibanding "+labels[last-1]+" — "+(Math.abs(ch)<0.02?"relatif stabil.":good?"tren membaik.":"perlu perhatian."));
        if(lowerBetter && ch>0) rec.push("Telusuri penyebab kenaikan "+cut(title,60)+" pada "+labels[last]+" dan percepat tindak lanjut di lokasi berulang.");
      }
      if(tser){ var tt=0; for(var j=first;j<=last;j++) tt+=tser[j];
        if(tt>0){ var cap=tot/tt; b.push("Capaian kumulatif "+P(cap)+" terhadap target periode berjalan ("+fmt(tot)+" dari "+fmt(tt)+").");
          rec.push(cap<1 ? "Percepat realisasi "+cut(title,60)+": masih kurang "+fmt(tt-tot)+" ("+P(1-cap)+") dari target." : "Pertahankan ritme "+cut(title,60)+" yang sudah mencapai "+P(cap)+" dari target."); }
      }
    } else if(isPct){
      var idx=labels.map(function(_,i){return i;}).sort(function(a,c){ return series[c]-series[a]; });
      var hi=idx[0], lo=idx[idx.length-1], avg=series.reduce(function(a,x){return a+x;},0)/n;
      b.push("Nilai tertinggi: "+labels[hi]+" ("+fmt(series[hi],true)+").");
      if(n>1) b.push("Nilai terendah: "+labels[lo]+" ("+fmt(series[lo],true)+").");
      b.push("Rata-rata seluruh kategori "+fmt(avg,true)+".");
      var worst = lowerBetter ? hi : lo;
      if(n>1) rec.push("Prioritaskan pendampingan untuk "+labels[worst]+" ("+fmt(series[worst],true)+") pada "+cut(title,55)+".");
    } else {
      var tot2=series.reduce(function(a,x){return a+x;},0);
      var ord=labels.map(function(_,i){return i;}).sort(function(a,c){ return series[c]-series[a]; });
      var top=ord[0], low=ord[ord.length-1], sh=tot2?series[top]/tot2:0;
      b.push(labels[top]+" tertinggi dengan "+fmt(series[top])+(tot2?" ("+P(sh)+" dari total "+fmt(tot2)+")":"")+".");
      if(n>3 && tot2){ var t3=(series[ord[0]]+series[ord[1]]+series[ord[2]])/tot2; b.push("Tiga teratas ("+[ord[0],ord[1],ord[2]].map(function(i){return labels[i];}).join(", ")+") mencakup "+P(t3)+" dari total."); }
      if(n>1) b.push("Terendah: "+labels[low]+" ("+fmt(series[low])+").");
      if(real.length>1 && real.length<=6){ var dt=real.map(function(d){ return {l:d.label, s:d.data.reduce(function(a,x){return a+v(x);},0)}; });
        b.push("Komposisi: "+dt.map(function(d){ return d.l+" "+(tot2?P(d.s/tot2):fmt(d.s)); }).join(" · ")+"."); }
      if(tser){ var caps=labels.map(function(_,i){ return tser[i]?series[i]/tser[i]:null; }), ci=-1;
        caps.forEach(function(c,i){ if(c!=null && (ci<0||c<caps[ci])) ci=i; });
        if(ci>=0){ b.push("Capaian terendah terhadap target: "+labels[ci]+" ("+P(caps[ci])+")."); rec.push("Dorong percepatan di "+labels[ci]+" yang capaiannya baru "+P(caps[ci])+" dari target."); }
      }
      if(n>1 && tot2){
        if(lowerBetter && sh>=0.25) rec.push("Fokuskan mitigasi pada "+labels[top]+" yang menyumbang "+P(sh)+" "+cut(title.toLowerCase(),50)+".");
        else if(!lowerBetter && !tser && /doughnut|pie/.test(type)===false && series[low]<series[top]*0.25) rec.push("Tingkatkan kontribusi "+labels[low]+" yang masih jauh di bawah "+labels[top]+".");
      }
    }
    return {b:b.slice(0,4), rec:rec};
  }

  /* ---------- pengumpulan data dari menu aktif ---------- */
  function kpis(view){
    return [].filter.call(view.querySelectorAll(".kpi"), vis).slice(0,6).map(function(k){
      return {l:txt(k.querySelector(".kpi__label")), v:txt(k.querySelector(".kpi__value")), s:txt(k.querySelector(".kpi__sub"))};
    }).filter(function(k){ return k.l && k.v; });
  }
  function charts(view){
    var seen=[], out=[];
    [].forEach.call(view.querySelectorAll("canvas"), function(cv){
      if(out.length>=MAX_CHARTS || !vis(cv) || !window.Chart) return;
      var ch=window.Chart.getChart(cv); if(!ch || !ch.data || !(ch.data.labels||[]).length) return;
      var p=cv.closest(".panel")||cv.parentNode; if(seen.indexOf(p)>=0) return; seen.push(p);
      out.push({cv:cv, chart:ch, title:txt(p.querySelector("h3"))||"Grafik", sub:txt(p.querySelector(".ph-sub"))});
    });
    return out;
  }
  function findings(view){
    var out=[];
    [].forEach.call(view.querySelectorAll(".verdict-desc,.eval-list li,.kev-txt"), function(el){ if(vis(el) && out.length<4){ var t=txt(el); if(t.length>20) out.push(cut(t,200)); } });
    return out;
  }
  function pickTable(view){
    var best=null;
    [].forEach.call(view.querySelectorAll(".table-wrap"), function(w){
      if(best || !vis(w)) return; var t=w.querySelector("table"); if(!t || !vis(t)) return;
      var tt=txt(w.querySelector(".table-head .tt")); if(/rekap|peringkat|matriks|realisasi/i.test(tt)) best={t:t, cap:tt};
    });
    if(!best){ var w=[].filter.call(view.querySelectorAll(".table-wrap"), vis)[0]; if(w && w.querySelector("table")) best={t:w.querySelector("table"), cap:txt(w.querySelector(".table-head .tt"))}; }
    return best;
  }
  function cellText(td){ var f=td.querySelector("input,select"); return cut(f ? (f.value||"") : txt(td), 60); }
  function readTable(table, maxRows, maxCols){
    var head=[];
    if(table.tHead && table.tHead.rows.length){ var grid=[];
      [].forEach.call(table.tHead.rows, function(tr, ri){ grid[ri]=grid[ri]||[]; var c=0;
        [].forEach.call(tr.cells, function(td){ while(grid[ri][c]!==undefined) c++; var cs=td.colSpan||1, rs=td.rowSpan||1, t=txt(td);
          for(var r=0;r<rs;r++){ grid[ri+r]=grid[ri+r]||[]; for(var k=0;k<cs;k++) grid[ri+r][c+k]=t; } c+=cs; }); });
      var nc=0; grid.forEach(function(r){ nc=Math.max(nc,r.length); });
      for(var c=0;c<nc;c++){ var parts=[]; grid.forEach(function(r){ if(r[c] && parts.indexOf(r[c])<0) parts.push(r[c]); }); head.push(parts.join(" · ")); }
    }
    var rows=[], total=0;
    [].forEach.call(table.tBodies, function(tb){ [].forEach.call(tb.rows, function(tr){
      if(!vis(tr) || tr.classList.contains("kids") || tr.cells.length<2) return; total++;
      if(rows.length>=maxRows) return; var cells=[];
      [].forEach.call(tr.cells, function(td){ cells.push(cellText(td)); for(var k=1;k<(td.colSpan||1);k++) cells.push(""); });
      rows.push(cells); }); });
    if(!head.length && rows.length) head=rows.shift();
    var nc2=Math.min(maxCols, Math.max(head.length, rows.reduce(function(a,r){return Math.max(a,r.length);},0)));
    return {head:head.slice(0,nc2), rows:rows.map(function(r){ return r.slice(0,nc2); }), ncol:nc2, total:total};
  }
  var NUMRE=/^[\s\d.,%+\-−–()Rp]*\d[\s\d.,%+\-−–()a-z×]*$/i;
  function tcell(t, o){
    var p = t ? '<a:p><a:pPr algn="'+(o.align||"l")+'"/>'+run(t,{sz:o.sz,b:o.b,color:o.color})+'</a:p>' : '<a:p><a:endParaRPr lang="id-ID" sz="'+o.sz+'"/></a:p>';
    return '<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>'+p+'</a:txBody><a:tcPr marL="64008" marR="64008" marT="36576" marB="36576" anchor="ctr"><a:lnL w="0"><a:noFill/></a:lnL><a:lnR w="0"><a:noFill/></a:lnR><a:lnT w="0"><a:noFill/></a:lnT><a:lnB w="9525"><a:solidFill><a:srgbClr val="DCE4ED"/></a:solidFill></a:lnB><a:solidFill><a:srgbClr val="'+o.fill+'"/></a:solidFill></a:tcPr></a:tc>';
  }
  function tableXml(d, x, y, w){
    var sz = d.ncol<=6?1100:1000, cw=[];
    for(var c=0;c<d.ncol;c++){ var m=Math.min(16,(d.head[c]||"").length*0.8); d.rows.forEach(function(r){ m=Math.max(m, Math.min(36,(r[c]||"").length)); }); cw.push(Math.max(4,m)); }
    var s=cw.reduce(function(a,b){return a+b;},0); cw=cw.map(function(v){ return Math.floor(w*v/s); });
    var rh=360000, trs='<a:tr h="'+rh+'">'+d.head.map(function(h){ return tcell(h,{sz:sz,b:1,color:"FFFFFF",fill:C_BLUE}); }).join("")+'</a:tr>';
    d.rows.forEach(function(r, ri){ var tot=/^total/i.test(r[0]||""), fill=tot?"E8F1FB":(ri%2?"F7F9FC":"FFFFFF");
      trs+='<a:tr h="'+rh+'">'+r.map(function(t,c){ return tcell(t,{sz:sz,b:tot,color:tot?C_TITLE:C_INK,fill:fill,align:(c>0&&NUMRE.test(t))?"r":"l"}); }).join("")+'</a:tr>'; });
    return '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="40" name="Tabel"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="'+R(x)+'" y="'+R(y)+'"/><a:ext cx="'+R(w)+'" cy="'+R(rh*(d.rows.length+1))+'"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>'+cw.map(function(v){return '<a:gridCol w="'+v+'"/>';}).join("")+'</a:tblGrid>'+trs+'</a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
  }
  function chartBlob(cv){ return new Promise(function(res){ var t=document.createElement("canvas"); t.width=cv.width; t.height=cv.height; var g=t.getContext("2d"); g.fillStyle="#fff"; g.fillRect(0,0,t.width,t.height); g.drawImage(cv,0,0); t.toBlob(function(b){ res({blob:b, w:t.width, h:t.height}); }, "image/png"); }); }

  /* ---------- susun slide ---------- */
  async function buildSlides(view, title){
    var lowerBetter = view.id==="view-gangguan";
    var scope = [txt(document.getElementById("scope")), txt(document.getElementById("page-legend"))].filter(Boolean)[view.id==="view-gangguan"?0:1] || "";
    var K=kpis(view), C=charts(view), slides=[], keyPts=[], recs=[];
    var A=C.map(function(c){ var a=analyze(c.chart, c.title, lowerBetter); if(a.b[0]) keyPts.push(c.title+": "+a.b[0]); recs=recs.concat(a.rec); return a; });

    // 1. Ringkasan eksekutif
    var s=head("Ringkasan Eksekutif", scope), y=Y0;
    if(K.length){ var cols=Math.min(3,K.length), rows=Math.ceil(K.length/cols), g=180000, cw=(AW-g*(cols-1))/cols, chh=880000;
      K.forEach(function(k,i){ var cx=X0+(i%cols)*(cw+g), cy=Y0+Math.floor(i/cols)*(chh+g), id=100+i*5;
        s+=box(id,cx,cy,cw,chh,"F2F6FB","DCE4ED")+'<p:sp><p:nvSpPr><p:cNvPr id="'+(id+1)+'" name="Aksen"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'+spPr(cx,cy+90000,45720,chh-180000,"rect",C_BLUE)+'<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="id-ID"/></a:p></p:txBody></p:sp>';
        s+=tx(id+2,cx+180000,cy+90000,cw-260000,220000,k.l.toUpperCase(),{sz:950,b:1,color:C_MUTED});
        s+=tx(id+3,cx+180000,cy+310000,cw-260000,340000,k.v,{sz:2000,b:1,color:C_TITLE});
        if(k.s) s+=tx(id+4,cx+180000,cy+650000,cw-260000,200000,cut(k.s,70),{sz:900,color:C_MUTED}); });
      y=Y0+rows*(chh+g)+60000; }
    if(keyPts.length){ s+=tx(60,X0,y,AW,280000,"Poin Kunci",{sz:1300,b:1,color:C_BLUE});
      s+=bullets(61,X0,y+330000,AW,Y0+AH-y-330000,keyPts.slice(0,4).map(function(t){return cut(t,190);}),{sz:K.length>3?1150:1300,gap:500}); }
    slides.push({shapes:s, media:[]});

    // 2. Grafik + analisa
    for(var i=0;i<C.length;i++){
      var c=C[i], im=await chartBlob(c.cv), lw=AW*0.6, f=fit(im.w,im.h,X0,Y0,lw,AH);
      var sh=head(c.title, c.sub)+box(30,X0,Y0,lw,AH,"FFFFFF","E4EAF1")+pic(31,"rId2",f.x+60000,f.y+60000,f.w-120000,f.h-120000);
      var px=X0+lw+250000, items=A[i].b.length?A[i].b:["Data belum tersedia untuk periode/filter ini."];
      sh+=panel(32,px,Y0,AW-lw-250000,AH,"Analisa",items.map(function(t){return cut(t,180);}),1200);
      slides.push({shapes:sh, media:[{blob:im.blob, ext:"png"}]});
    }

    // 3. Data pendukung (satu tabel ringkas)
    var T=pickTable(view);
    if(T){ var d=readTable(T.t, 8, 8);
      if(d.rows.length){ var st=head("Data Pendukung", T.cap)+tableXml(d, X0, Y0, AW);
        if(d.total>d.rows.length) st+=tx(41,X0,Y0+AH-60000,AW,220000,"Menampilkan "+d.rows.length+" dari "+d.total+" baris teratas — data lengkap tersedia di dashboard.",{sz:900,color:C_MUTED});
        slides.push({shapes:st, media:[]}); } }

    // 4. Kesimpulan & rekomendasi
    var F=findings(view); if(!F.length) F=keyPts.slice(0,4).map(function(t){return cut(t,190);});
    var uniq=[]; recs.forEach(function(r){ if(uniq.indexOf(r)<0) uniq.push(r); });
    if(!uniq.length) uniq=[lowerBetter?"Lanjutkan pemantauan aset berulang dan evaluasi efektivitas tindak lanjut setiap bulan.":"Lanjutkan pemantauan berkala dan tindak lanjuti item dengan capaian terendah."];
    var half=(AW-250000)/2;
    var sk=head("Kesimpulan & Rekomendasi", "Disusun otomatis dari data dashboard sesuai filter aktif")
      +panel(50,X0,Y0,half,AH,"Temuan Utama",F.slice(0,4),1150)
      +panel(55,X0+half+250000,Y0,half,AH,"Rekomendasi Tindak Lanjut",uniq.slice(0,4).map(function(t){return cut(t,190);}),1150);
    slides.push({shapes:sk, media:[]});
    return slides;
  }

  function overlay(msg){
    var o=document.getElementById("ppt-overlay");
    if(!msg){ if(o) o.remove(); return; }
    if(!o){ o=document.createElement("div"); o.id="ppt-overlay"; o.style.cssText="position:fixed;inset:0;z-index:9000;background:rgba(7,30,55,.55);display:flex;align-items:center;justify-content:center"; o.innerHTML='<div style="background:#fff;border-radius:14px;padding:22px 26px;min-width:300px;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:inherit"><div style="font-weight:800;color:#073B6B;font-size:15px;margin-bottom:6px">Menyusun PowerPoint…</div><div id="ppt-msg" style="font-size:12.5px;color:#5B6573"></div></div>'; document.body.appendChild(o); }
    document.getElementById("ppt-msg").textContent=msg;
  }
  async function exportActive(){
    var view=document.querySelector(".view.on"); if(!view) return;
    var title=txt(document.getElementById("page-title")) || "Dashboard";
    overlay("Memuat template…");
    try{
      await load(JSZIP, function(){ return !!window.JSZip; });
      if(view.id==="view-ao" && window.AOPPT && window.AO){
        overlay("Menyusun PPT format AO…");
        if(typeof window.AO.load==="function") await window.AO.load();
        var r=await window.AOPPT.build(window.JSZip, window.AO, new Date());
        var l=document.createElement("a"); l.href=URL.createObjectURL(r.blob); l.download=r.name;
        document.body.appendChild(l); l.click(); setTimeout(function(){ URL.revokeObjectURL(l.href); l.remove(); }, 1500);
        overlay(null); return;
      }
      if(view.id==="view-workplan" && window.WPPPT){
        overlay("Menyusun PPT Paparan Realisasi Workplan…");
        var r4=await window.WPPPT.build(window.JSZip, new Date(), overlay);
        var l4=document.createElement("a"); l4.href=URL.createObjectURL(r4.blob); l4.download=r4.name;
        document.body.appendChild(l4); l4.click(); setTimeout(function(){ URL.revokeObjectURL(l4.href); l4.remove(); }, 1500);
        overlay(null); return;
      }
      if(view.id==="view-row" && window.ROWPPT){
        overlay("Menyusun PPT Paparan Realisasi ROW…");
        var r3=await window.ROWPPT.build(window.JSZip, new Date(), overlay);
        var l3=document.createElement("a"); l3.href=URL.createObjectURL(r3.blob); l3.download=r3.name;
        document.body.appendChild(l3); l3.click(); setTimeout(function(){ URL.revokeObjectURL(l3.href); l3.remove(); }, 1500);
        overlay(null); return;
      }
      if(view.id==="view-fdx" && window.FDXPPT){
        overlay("Menyusun PPT Monitoring 4DX (WIG & Workplan HAR)…");
        var r2=await window.FDXPPT.build(window.JSZip, new Date(), overlay);
        var l2=document.createElement("a"); l2.href=URL.createObjectURL(r2.blob); l2.download=r2.name;
        document.body.appendChild(l2); l2.click(); setTimeout(function(){ URL.revokeObjectURL(l2.href); l2.remove(); }, 1500);
        overlay(null); return;
      }
      var resp=await fetch(TEMPLATE); if(!resp.ok) throw new Error("Template PPT tidak ditemukan ("+TEMPLATE+")");
      var zip=await window.JSZip.loadAsync(await resp.arrayBuffer());
      overlay("Menganalisa data & menyusun slide…");
      var slides=await buildSlides(view, title), now=new Date();
      var s1=await zip.file("ppt/slides/slide1.xml").async("string"), parts=s1.split("<p:txBody>");
      parts[1]=parts[1].replace(/<a:lstStyle\/>[\s\S]*<\/p:txBody>/, '<a:lstStyle/><a:p><a:pPr marL="0" lvl="0" indent="0" algn="l" rtl="0"><a:lnSpc><a:spcPct val="80000"/></a:lnSpc><a:buNone/></a:pPr><a:r><a:rPr lang="id-ID" sz="4000" dirty="0"><a:latin typeface="Open Sans"/><a:cs typeface="Open Sans"/></a:rPr><a:t>'+esc(title)+'</a:t></a:r></a:p></p:txBody>');
      zip.file("ppt/slides/slide1.xml", parts.join("<p:txBody>").replace("Sorong, Juli 2026", esc("Sorong, "+BULAN[now.getMonth()]+" "+now.getFullYear())));
      zip.remove("ppt/slides/slide2.xml"); zip.remove("ppt/slides/_rels/slide2.xml.rels");
      var ct=(await zip.file("[Content_Types].xml").async("string")).replace(/<Override PartName="\/ppt\/slides\/slide2\.xml"[^>]*\/>/,"");
      var prels=(await zip.file("ppt/_rels/presentation.xml.rels").async("string")).replace(/<Relationship Id="rId3"[^>]*\/>/,"");
      var pres=await zip.file("ppt/presentation.xml").async("string");
      var ids='<p:sldId id="256" r:id="rId2"/>', rels="", over="", mi=0;
      slides.forEach(function(sl, k){
        var n=k+2, rid="rIdS"+n;
        var srel='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout12.xml"/>';
        sl.media.forEach(function(m, j){ mi++; var name="exp"+mi+"."+m.ext; zip.file("ppt/media/"+name, m.blob); srel+='<Relationship Id="rId'+(2+j)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/'+name+'"/>'; });
        zip.file("ppt/slides/slide"+n+".xml", slideXml(sl.shapes));
        zip.file("ppt/slides/_rels/slide"+n+".xml.rels", srel+"</Relationships>");
        ids+='<p:sldId id="'+(1000+n)+'" r:id="'+rid+'"/>';
        rels+='<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+n+'.xml"/>';
        over+='<Override PartName="/ppt/slides/slide'+n+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
      });
      zip.file("ppt/presentation.xml", pres.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/, "<p:sldIdLst>"+ids+"</p:sldIdLst>"));
      zip.file("ppt/_rels/presentation.xml.rels", prels.replace("</Relationships>", rels+"</Relationships>"));
      zip.file("[Content_Types].xml", ct.replace("</Types>", over+"</Types>"));
      var blob=await zip.generateAsync({type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation"});
      var a=document.createElement("a"); a.href=URL.createObjectURL(blob);
      a.download=title.replace(/[\\/:*?"<>|]/g,"-")+" - "+now.toISOString().slice(0,10)+".pptx";
      document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }catch(e){ console.error(e); alert("Gagal membuat PPT: "+e.message); }
    overlay(null);
  }
  window.PPTExport={exportActive:exportActive, _analyze:analyze};
  document.addEventListener("click", function(e){ var b=e.target.closest("#ppt-btn"); if(!b||b.disabled) return; b.disabled=true; exportActive().finally(function(){ b.disabled=false; }); });
})();
