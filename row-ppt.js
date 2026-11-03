/* Ekspor PPT Paparan Realisasi Pekerjaan ROW (Rabas & Tebang Pohon) — UP3 Sorong 2026
   Memakai bingkai template PPT_Workplan_HAR (fdx-template.js): cover + header logo Danantara/PLN.
   Slide: 1 Cover · 2 Ringkasan (KPI + grafik bulanan + kurva S) · 3 Matriks realisasi bulanan per ULP
          4 Kinerja per ULP (panel 2×2) · 5 Penyulang prioritas & kontribusi ULP · 6 Mitra pelaksana · 7 Catatan & tindak lanjut
   Data: window.Rabas (realisasi), target per ULP dari Workplan (lead measure Rabas/Tebang), cadangan target WIG UP3. */
(function(){
  var TEMPLATE = "fdx-template.js";
  var BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  var BL3 = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  var ULPS = ["SORONG KOTA","AIMAS","TEMINABUAN","WAISAI"];
  var UCLR = {"SORONG KOTA":"#0B3C6E","AIMAS":"#0067AC","TEMINABUAN":"#E9A700","WAISAI":"#1E9E8F"};
  // Target bulanan per ULP (revisi 3 Nov 2026) — ubah di sini bila target berubah
  var TARGET_RABAS  = {"SORONG KOTA":31.67, "AIMAS":45, "TEMINABUAN":57.25, "WAISAI":16.67};   // kms / bulan (perabasan / pangkas)
  var TARGET_TEBANG = {"SORONG KOTA":60,    "AIMAS":80, "TEMINABUAN":225,   "WAISAI":40};      // btg / bulan (penebangan)
  var NAVY="#0B3C6E", BLUE="#0067AC", YEL="#FDB913", RED="#E2231A", GRN="#1E9E58", MUTED="#5B6573", INK="#10243B";
  var FONT = "Calibri, Carlito, 'Segoe UI', Arial, sans-serif";
  var DPR = 2.5, PX = 10000;          // 1 px logis = 10.000 EMU
  var X0 = 420000, W0 = 11352000, Y0 = 830000, H0 = 5820000;

  /* ---------- util ---------- */
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,""); }
  function nf(n,d){ if(n==null||!isFinite(n)) return "-"; d=d==null?2:d; if(Math.abs(n%1)<0.005) return Math.round(n).toLocaleString("id-ID"); return n.toLocaleString("id-ID",{minimumFractionDigits:Math.min(1,d),maximumFractionDigits:d}); }
  function pc(p){ return p==null||!isFinite(p) ? "-" : p.toLocaleString("id-ID",{maximumFractionDigits:1})+"%"; }
  function title(s){ return String(s||"").toLowerCase().replace(/(^|\s)([a-z])/g,function(m,a,b){return a+b.toUpperCase();}).replace(/\b(Ulp|Pt|Cv|Pln|Rsk|Acc|Up3)\b/g,function(w){return w.toUpperCase();}); }
  function heat(p){
    if(p==null) return "#EEF2F6";
    var lo=[248,105,107], mid=[255,235,132], hi=[99,190,123], t=Math.max(0,Math.min(100,p)), a, b, k;
    if(t<50){ a=lo; b=mid; k=t/50; } else { a=mid; b=hi; k=(t-50)/50; }
    return "rgb("+a.map(function(v,i){ return Math.round(v+(b[i]-v)*k); }).join(",")+")";
  }
  function blueScale(v,max){ if(!v) return "#F4F7FB"; var k=Math.min(1,v/(max||1)); var a=[226,238,250], b=[0,103,172]; return "rgb("+a.map(function(x,i){return Math.round(x+(b[i]-x)*k*0.85);}).join(",")+")"; }
  function hexA(h,a){ var n=parseInt(h.slice(1),16); return "rgba("+(n>>16)+","+((n>>8)&255)+","+(n&255)+","+a+")"; }
  function sum(a){ return a.reduce(function(x,y){return x+(y||0);},0); }

  /* ---------- data ---------- */
  async function withTimeout(p, ms){ return Promise.race([p, new Promise(function(r){ setTimeout(r, ms); })]); }
  async function model(now){
    var R=window.Rabas; if(!R) throw new Error("Modul data ROW (Rabas) belum termuat");
    if(!R.records) await R.load();
    var recs=R.records||[], act=R.activeMonths().filter(function(m){ return m<=11; });
    var cur = (R.month==="all"||R.month==null) ? (act.length?Math.max.apply(null,act):now.getMonth()) : +R.month;
    var nM=cur+1, months=[]; for(var i=0;i<nM;i++) months.push(i);
    var K={}, T={}; ULPS.forEach(function(u){ K[u]=Array(12).fill(0); T[u]=Array(12).fill(0); });
    var pnyMap={};
    recs.forEach(function(r){
      var u=String(r.ulp||"").toUpperCase().replace(/^ULP\s+/,""); if(!K[u]) return;
      var pk=0, pt=0;
      Object.keys(r.k||{}).forEach(function(m){ m=+m; K[u][m]+=r.k[m]||0; if(m<=cur) pk+=r.k[m]||0; });
      Object.keys(r.t||{}).forEach(function(m){ m=+m; T[u][m]+=r.t[m]||0; if(m<=cur) pt+=r.t[m]||0; });
      var key=u+"|"+String(r.pny||"").toUpperCase().replace(/EXRESS/,"EXPRESS").trim();
      if(!pnyMap[key]) pnyMap[key]={ulp:u, pny:String(r.pny||"").toUpperCase().replace(/EXRESS/,"EXPRESS").trim(), kms:0, btg:0};
      pnyMap[key].kms+=pk; pnyMap[key].btg+=pt;
    });
    var pny=Object.keys(pnyMap).map(function(k){ return pnyMap[k]; }).filter(function(p){ return p.kms>0||p.btg>0; });
    // vendor
    var vmap={};
    (R.vendorRecords||[]).forEach(function(r){
      var u=String(r.ulp||"").toUpperCase(); if(!K[u]) return;
      var v=String(r.ven||"").trim()||"TANPA MITRA"; if(!vmap[v]) vmap[v]={ven:v, kms:0, btg:0, u:{}};
      Object.keys(r.k||{}).forEach(function(m){ if(+m<=cur){ vmap[v].kms+=r.k[m]||0; vmap[v].u[u]=(vmap[v].u[u]||0)+(r.k[m]||0); } });
      Object.keys(r.t||{}).forEach(function(m){ if(+m<=cur) vmap[v].btg+=r.t[m]||0; });
    });
    var vendors=Object.keys(vmap).map(function(k){ return vmap[k]; }).filter(function(v){ return v.kms>0||v.btg>0; }).sort(function(a,b){ return b.kms-a.kms; });
    // target bulanan ROW per ULP (ditetapkan UP3 Sorong, revisi 3 Nov 2026)
    var tK=TARGET_RABAS, tT=TARGET_TEBANG, hasK=true, hasT=true;
    var src="Target bulanan ROW per ULP UP3 Sorong (revisi 3 Nov 2026): rabas/pangkas "+nf(sum(ULPS.map(function(u){return tK[u];})),2)+" kms & tebang "+nf(sum(ULPS.map(function(u){return tT[u];})),0)+" btg per bulan";
    var upK=sum(ULPS.map(function(u){return tK[u]||0;})), upT=sum(ULPS.map(function(u){return tT[u]||0;}));
    function tot(A,u,a,b){ var s=0; for(var m=a;m<=b;m++) s+=A[u][m]; return s; }
    var U={};
    ULPS.forEach(function(u){
      var k=tot(K,u,0,cur), t=tot(T,u,0,cur);
      U[u]={k:k, t:t, kM:K[u][cur], tM:T[u][cur], kPrev:cur>0?K[u][cur-1]:null,
        tgK:hasK?(tK[u]||0):null, tgT:hasT?(tT[u]||0):null,
        pk: hasK&&tK[u] ? k/(tK[u]*nM)*100 : null, pt: hasT&&tT[u] ? t/(tT[u]*nM)*100 : null,
        top: pny.filter(function(p){return p.ulp===u;}).sort(function(a,b){return b.kms-a.kms;}).slice(0,3),
        nPny: pny.filter(function(p){return p.ulp===u && p.kms>0;}).length};
    });
    var mK=months.map(function(m){ return sum(ULPS.map(function(u){return K[u][m];})); }), mT=months.map(function(m){ return sum(ULPS.map(function(u){return T[u][m];})); });
    return {cur:cur, nM:nM, months:months, K:K, T:T, U:U, mK:mK, mT:mT, totK:sum(mK), totT:sum(mT), upK:upK, upT:upT, tgSrc:src,
      pny:pny, vendors:vendors, source:R.source, nPny:pny.filter(function(p){return p.kms>0;}).length};
  }

  /* ---------- chart → gambar ---------- */
  var plugins = [{
    id:"bgw", beforeDraw:function(c){ var g=c.ctx; g.save(); g.fillStyle="#FFFFFF"; g.fillRect(0,0,c.width,c.height); g.restore(); }
  },{
    id:"vlab",
    afterDatasetsDraw:function(c, a, o){
      if(!o || !o.mode) return; var g=c.ctx; g.save(); g.font="bold "+(o.size||11)+"px "+FONT; g.fillStyle=o.color||INK; g.textAlign="center"; g.textBaseline="bottom";
      if(o.mode==="stack"){
        var bars=c.data.datasets.map(function(d,i){return i;}).filter(function(i){ return c.data.datasets[i].type!=="line" && c.isDatasetVisible(i); });
        if(!bars.length) { g.restore(); return; }
        c.data.labels.forEach(function(_,j){
          var s=0, top=null; bars.forEach(function(i){ s+=+c.data.datasets[i].data[j]||0; var el=c.getDatasetMeta(i).data[j]; if(el && (top===null||el.y<top.y)) top=el; });
          if(top && s>0) g.fillText(o.fmt?o.fmt(s):nf(s,1), top.x, top.y-3);
        });
      } else if(o.mode==="hbar"){
        g.textAlign="left"; g.textBaseline="middle";
        c.data.datasets.forEach(function(d,i){ if(d.type==="line"||!c.isDatasetVisible(i)) return; c.getDatasetMeta(i).data.forEach(function(el,j){ var v=+d.data[j]||0; if(v>0) g.fillText(o.fmt?o.fmt(v,j):nf(v,1), el.x+5, el.y); }); });
      } else if(o.mode==="bar"){
        c.data.datasets.forEach(function(d,i){ if(d.type==="line"||!c.isDatasetVisible(i)||d._nolab) return; c.getDatasetMeta(i).data.forEach(function(el,j){ var v=+d.data[j]||0; if(v>0) g.fillText(o.fmt?o.fmt(v):nf(v,1), el.x, el.y-3); }); });
      } else if(o.mode==="lastpts"){
        g.textAlign="right";
        c.data.datasets.forEach(function(d,i){ if(!c.isDatasetVisible(i)) return; var pts=c.getDatasetMeta(i).data, j=pts.length-1; if(j<0) return; g.fillStyle=d.borderColor; g.fillText(nf(+d.data[j],1)+" kms", pts[j].x-6, pts[j].y-6); });
      }
      g.restore();
    }
  }];
  function chartCanvas(cfg, w, h){
    var cv=document.createElement("canvas"); cv.width=w; cv.height=h;
    cfg.options=cfg.options||{}; cfg.options.responsive=false; cfg.options.animation=false; cfg.options.devicePixelRatio=DPR;
    cfg.plugins=(cfg.plugins||[]).concat(plugins);
    var ch=new window.Chart(cv.getContext("2d"), cfg);
    var out=document.createElement("canvas"); out.width=cv.width; out.height=cv.height; out.getContext("2d").drawImage(cv,0,0);
    ch.destroy();
    return out;
  }
  function baseFont(){ window.Chart.defaults.font.family=FONT; window.Chart.defaults.color=MUTED; }
  function png(cv){ return new Promise(function(res, rej){ cv.toBlob(function(b){ if(!b) return rej(new Error("Gagal membuat gambar")); b.arrayBuffer().then(function(ab){ res(new Uint8Array(ab)); }, rej); }, "image/png"); }); }
  function newCanvas(w,h){ var cv=document.createElement("canvas"); cv.width=Math.round(w*DPR); cv.height=Math.round(h*DPR); var g=cv.getContext("2d"); g.scale(DPR,DPR); g.fillStyle="#FFFFFF"; g.fillRect(0,0,w,h); return {cv:cv,g:g}; }
  function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
  function txt(g,s,x,y,o){ o=o||{}; g.font=(o.b?"bold ":"")+(o.sz||12)+"px "+FONT; g.fillStyle=o.c||INK; g.textAlign=o.al||"left"; g.textBaseline=o.bl||"alphabetic"; var t=String(s); if(o.max){ while(t.length>1 && g.measureText(t).width>o.max) t=t.slice(0,-2)+"…"; } g.fillText(t,x,y); return g.measureText(t).width; }

  /* ---------- tabel matriks (canvas) ---------- */
  function matrix(M, kind, w, rowH){
    var isK=kind==="k", A=isK?M.K:M.T, unit=isK?"kms":"btg";
    var cols=[120]; M.months.forEach(function(){ cols.push(0); }); cols.push(74,74,62);
    var fixed=120+74+74+62, mw=Math.max(40,(w-fixed)/M.nM); for(var i=1;i<=M.nM;i++) cols[i]=mw;
    var rows=ULPS.concat(["UP3 SORONG"]), hh=32, rh=rowH||30, H=hh+rows.length*rh;
    var c=newCanvas(w,H), g=c.g, xs=[0]; cols.forEach(function(cw,i){ xs.push(xs[i]+cw); });
    var max=0; ULPS.forEach(function(u){ M.months.forEach(function(m){ max=Math.max(max,A[u][m]); }); });
    function cell(x,y,cw,ch,bg){ g.fillStyle=bg; g.fillRect(x,y,cw,ch); g.strokeStyle="#FFFFFF"; g.lineWidth=1.5; g.strokeRect(x,y,cw,ch); }
    // header
    var heads=["ULP"].concat(M.months.map(function(m){return BL3[m];})).concat(["Total","Target s/d","Capaian"]);
    heads.forEach(function(h,i){ cell(xs[i],0,cols[i],hh,i===M.nM+1?"#123A63":(i>M.nM+1?"#123A63":NAVY)); txt(g,h,xs[i]+cols[i]/2,hh/2+1,{sz:11.5,b:1,c:"#FFFFFF",al:"center",bl:"middle"}); });
    rows.forEach(function(u,ri){
      var y=hh+ri*rh, up=u==="UP3 SORONG";
      var tgM = up ? (isK?M.upK:M.upT) : (isK?M.U[u].tgK:M.U[u].tgT);
      cell(0,y,cols[0],rh,up?"#E6EDF5":"#F7F9FC");
      if(!up){ g.fillStyle=UCLR[u]; g.fillRect(2,y+6,5,rh-12); }
      txt(g,up?"UP3 SORONG":u,12,y+rh/2+1,{sz:11.5,b:1,c:INK,bl:"middle"});
      var tot=0;
      M.months.forEach(function(m,j){
        var v= up ? sum(ULPS.map(function(x){return A[x][m];})) : A[u][m]; tot+=v;
        var bg = tgM ? heat(v/tgM*100) : (up?"#E6EDF5":blueScale(v,max));
        cell(xs[j+1],y,cols[j+1],rh,bg);
        var dark=!tgM && !up && v/(max||1)>0.55;
        txt(g,v?nf(v,isK?1:0):"–",xs[j+1]+cols[j+1]/2,y+rh/2+1,{sz:11,b:up?1:0,c:dark?"#FFFFFF":INK,al:"center",bl:"middle"});
      });
      var tg = tgM ? tgM*M.nM : null, p = tg ? tot/tg*100 : null, k=M.nM+1;
      cell(xs[k],y,cols[k],rh,up?"#D5E2F0":"#EAF1F9"); txt(g,nf(tot,isK?1:0),xs[k]+cols[k]/2,y+rh/2+1,{sz:11.5,b:1,al:"center",bl:"middle"});
      cell(xs[k+1],y,cols[k+1],rh,"#F2F2F2"); txt(g,tg?nf(tg,isK?1:0):"-",xs[k+1]+cols[k+1]/2,y+rh/2+1,{sz:11,c:MUTED,al:"center",bl:"middle"});
      cell(xs[k+2],y,cols[k+2],rh,heat(p)); txt(g,pc(p),xs[k+2]+cols[k+2]/2,y+rh/2+1,{sz:11.5,b:1,al:"center",bl:"middle"});
    });
    return {cv:c.cv, w:w, h:H, unit:unit};
  }

  /* ---------- panel per ULP (canvas) ---------- */
  function ulpPanel(M, u, w, h){
    var c=newCanvas(w,h), g=c.g, U=M.U[u], col=UCLR[u];
    g.fillStyle="#FFFFFF"; rr(g,0.5,0.5,w-1,h-1,8); g.fill(); g.strokeStyle="#D6DEE8"; g.lineWidth=1; g.stroke();
    g.save(); rr(g,0.5,0.5,w-1,30,8); g.clip(); g.fillStyle=col; g.fillRect(0,0,w,30); g.restore();
    g.fillStyle=col; g.fillRect(0.5,20,w-1,10);
    txt(g,"ULP "+u,12,20,{sz:14,b:1,c:"#FFFFFF"});
    txt(g,(U.nPny)+" penyulang dirabas s/d "+BL3[M.cur],w-12,20,{sz:11,c:"#FFFFFF",al:"right"});
    // statistik
    var sx=[10, w*0.36, w*0.68], sy=40;
    function stat(x, lbl, val, unit, p, sub){
      txt(g,lbl,x,sy+11,{sz:10.5,c:MUTED,b:1});
      var vw=txt(g,val,x,sy+33,{sz:21,b:1,c:INK}); txt(g,unit,x+vw+4,sy+33,{sz:11,c:MUTED});
      if(p!=null){ var pw=46; g.fillStyle=heat(p); rr(g,x,sy+39,pw,15,7); g.fill(); txt(g,pc(p),x+pw/2,sy+47,{sz:10,b:1,al:"center",bl:"middle"}); txt(g,sub||"",x+pw+5,sy+47,{sz:9.5,c:MUTED,bl:"middle"}); }
      else if(sub) txt(g,sub,x,sy+48,{sz:9.5,c:MUTED,bl:"middle"});
    }
    stat(sx[0],"RABAS s/d "+BL3[M.cur].toUpperCase(),nf(U.k,1),"kms",U.pk,U.tgK?"dari "+nf(U.tgK*M.nM,1)+" kms":"");
    stat(sx[1],"TEBANG s/d "+BL3[M.cur].toUpperCase(),nf(U.t,0),"btg",U.pt,U.tgT?"dari "+nf(U.tgT*M.nM,0)+" btg":"");
    var mom = U.kPrev ? (U.kM-U.kPrev)/U.kPrev*100 : null;
    stat(sx[2],"BULAN "+BULAN[M.cur].toUpperCase(),nf(U.kM,1),"kms",null,(mom==null?"":(mom>=0?"▲ ":"▼ ")+nf(Math.abs(mom),0)+"% vs "+BL3[M.cur-1])+" · "+nf(U.tM,0)+" btg");
    // grafik
    var chY=sy+62, chH=h-chY-34;
    var bg=M.months.map(function(m){ return m===M.cur ? col : hexA(col,0.55); });
    var ds=[{type:"bar",label:"Rabas (kms)",data:M.months.map(function(m){return +M.K[u][m].toFixed(2);}),backgroundColor:bg,borderRadius:3,maxBarThickness:26,yAxisID:"y",order:2},
            {type:"line",label:"Tebang (btg)",data:M.months.map(function(m){return M.T[u][m];}),borderColor:RED,backgroundColor:RED,borderWidth:1.8,pointRadius:2.5,tension:.3,yAxisID:"y2",order:1}];
    if(U.tgK) ds.push({type:"line",label:"Target rabas/bln",data:M.months.map(function(){return +U.tgK.toFixed(2);}),borderColor:"#7F8C9D",borderDash:[4,3],borderWidth:1.3,pointRadius:0,yAxisID:"y",order:0});
    var chart=chartCanvas({type:"bar",data:{labels:M.months.map(function(m){return BL3[m];}),datasets:ds},
      options:{layout:{padding:{top:14,right:4}},plugins:{legend:{position:"top",align:"end",labels:{boxWidth:9,boxHeight:9,font:{size:9.5}}},vlab:{mode:"bar",size:9,fmt:function(v){return nf(v,1);}}},
        scales:{x:{grid:{display:false},ticks:{font:{size:9.5}}},y:{beginAtZero:true,grace:"12%",title:{display:true,text:"kms",font:{size:9}},ticks:{font:{size:9}},grid:{color:"#EEF2F6"}},y2:{position:"right",beginAtZero:true,grace:"12%",title:{display:true,text:"btg",font:{size:9}},ticks:{font:{size:9}},grid:{display:false}}}}},
      Math.round(w-16), Math.round(chH));
    g.drawImage(chart, 8, chY, w-16, chH);
    // penyulang teratas
    g.fillStyle="#F4F7FB"; rr(g,8,h-30,w-16,24,5); g.fill();
    var tx=txt(g,"Penyulang teratas: ",16,h-14,{sz:10.5,b:1,c:NAVY});
    txt(g, U.top.length ? U.top.map(function(p){ return title(p.pny)+" ("+nf(p.kms,1)+" kms)"; }).join("  ·  ") : "belum ada realisasi", 16+tx, h-14, {sz:10.5,c:INK,max:w-40-tx});
    return c.cv;
  }

  /* ---------- PPTX XML ---------- */
  function picXml(id, rid, name, x, y, w, h){ return '<p:pic><p:nvPicPr><p:cNvPr id="'+id+'" name="'+esc(name)+'"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="'+Math.round(x)+'" y="'+Math.round(y)+'"/><a:ext cx="'+Math.round(w)+'" cy="'+Math.round(h)+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>'; }
  function run(t,o){ o=o||{}; return '<a:r><a:rPr lang="id-ID" sz="'+(o.sz||1200)+'" b="'+(o.b?1:0)+'" dirty="0"><a:solidFill><a:srgbClr val="'+(o.c||"10243B").replace("#","")+'"/></a:solidFill><a:latin typeface="Calibri"/><a:cs typeface="Calibri"/></a:rPr><a:t>'+esc(t)+'</a:t></a:r>'; }
  function para(runs,o){ o=o||{}; var bu=o.bu?'<a:buClr><a:srgbClr val="'+(o.buc||"FDB913")+'"/></a:buClr><a:buSzPct val="110000"/><a:buFont typeface="Arial"/><a:buChar char="&#9632;"/>':'<a:buNone/>';
    return '<a:p><a:pPr algn="'+(o.al||"l")+'"'+(o.bu?' marL="200000" indent="-200000"':'')+'><a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcAft><a:spcPts val="'+(o.aft||0)+'"/></a:spcAft>'+bu+'</a:pPr>'+runs+'</a:p>'; }
  function shape(id, x,y,w,h, o){ o=o||{};
    var fill=o.fill?'<a:solidFill><a:srgbClr val="'+o.fill.replace("#","")+'"/></a:solidFill>':'<a:noFill/>', ln=o.line?'<a:ln w="9525"><a:solidFill><a:srgbClr val="'+o.line.replace("#","")+'"/></a:solidFill></a:ln>':'<a:ln><a:noFill/></a:ln>';
    var ins=o.ins==null?90000:o.ins;
    return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="'+esc(o.name||("Kotak "+id))+'"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="'+Math.round(x)+'" y="'+Math.round(y)+'"/><a:ext cx="'+Math.round(w)+'" cy="'+Math.round(h)+'"/></a:xfrm><a:prstGeom prst="'+(o.geom||"rect")+'"><a:avLst>'+(o.geom==="roundRect"?'<a:gd name="adj" fmla="val 9000"/>':'')+'</a:avLst></a:prstGeom>'+fill+ln+'</p:spPr>'+
      '<p:txBody><a:bodyPr wrap="square" lIns="'+ins+'" tIns="'+Math.round(ins*0.6)+'" rIns="'+ins+'" bIns="'+Math.round(ins*0.6)+'" anchor="'+(o.anchor||"t")+'"><a:normAutofit/></a:bodyPr><a:lstStyle/>'+(o.paras||'<a:p><a:endParaRPr lang="id-ID"/></a:p>')+'</p:txBody></p:sp>'; }
  function kpiCard(id, x,y,w,h, lbl, val, unit, sub, accent, pct){
    var s=shape(id,x,y,w,h,{geom:"roundRect",fill:"#FFFFFF",line:"#D6DEE8",paras:'<a:p><a:endParaRPr lang="id-ID"/></a:p>'});
    s+=shape(id+1,x,y,70000,h,{fill:accent});
    var p=para(run(lbl,{sz:1000,b:1,c:"5B6573"}))+para(run(val,{sz:2400,b:1,c:"0B3C6E"})+run(" "+unit,{sz:1100,c:"5B6573"}))+para(run(sub,{sz:950,c:pct==null?"5B6573":(pct>=100?"1E7B45":(pct>=70?"8A5A00":"B3261E")),b:pct!=null}));
    s+=shape(id+2,x+110000,y,w-150000,h,{anchor:"ctr",ins:60000,paras:p});
    return s;
  }
  function caption(id, x,y,w, t, sub){ return shape(id,x,y,w,300000,{ins:0,anchor:"b",paras:para(run(t,{sz:1300,b:1,c:"0B3C6E"})+(sub?run("   "+sub,{sz:1000,c:"5B6573"}):""))}); }
  function imgRel(rid, target){ return '<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="'+target+'"/>'; }

  function loadTpl(){
    if(window.FDX_TPL) return Promise.resolve();
    return new Promise(function(res, rej){ var s=document.createElement("script"); s.src=TEMPLATE+"?v=20261103a";
      s.onload=function(){ window.FDX_TPL?res():rej(new Error("Template PPT kosong")); }; s.onerror=function(){ rej(new Error("Template PPT tidak ditemukan ("+TEMPLATE+")")); }; document.head.appendChild(s); });
  }

  /* ---------- analisa otomatis ---------- */
  function findings(M){
    var f=[], r=[], per=BULAN[M.cur]+" 2026", tgK=M.upK?M.upK*M.nM:null, tgT=M.upT?M.upT*M.nM:null;
    f.push("Realisasi rabas UP3 Sorong s/d "+per+" "+nf(M.totK,1)+" kms"+(tgK?" ("+pc(M.totK/tgK*100)+" dari target kumulatif "+nf(tgK,1)+" kms)":"")+"; tebang pohon "+nf(M.totT,0)+" btg"+(tgT?" ("+pc(M.totT/tgT*100)+" dari target "+nf(tgT,0)+" btg)":"")+".");
    var byK=ULPS.slice().sort(function(a,b){return M.U[b].k-M.U[a].k;});
    if(M.totK>0) f.push("Kontributor rabas terbesar ULP "+title(byK[0])+" "+nf(M.U[byK[0]].k,1)+" kms ("+pc(M.U[byK[0]].k/M.totK*100)+"), terkecil ULP "+title(byK[3])+" "+nf(M.U[byK[3]].k,1)+" kms ("+pc(M.U[byK[3]].k/M.totK*100)+").");
    var mi=M.mK.indexOf(Math.max.apply(null,M.mK)); if(M.mK[mi]>0) f.push("Realisasi bulanan tertinggi pada "+BULAN[mi]+" ("+nf(M.mK[mi],1)+" kms); rata-rata "+nf(M.totK/M.nM,1)+" kms per bulan.");
    if(M.cur>0 && M.mK[M.cur-1]>0){ var ch=(M.mK[M.cur]-M.mK[M.cur-1])/M.mK[M.cur-1]*100; f.push("Realisasi "+BULAN[M.cur]+" "+nf(M.mK[M.cur],1)+" kms, "+(ch>=0?"naik ":"turun ")+pc(Math.abs(ch))+" dibanding "+BULAN[M.cur-1]+" ("+nf(M.mK[M.cur-1],1)+" kms)."); }
    var tp=M.pny.slice().sort(function(a,b){return b.kms-a.kms;})[0]; if(tp) f.push("Penyulang dengan rabas terpanjang: "+title(tp.pny)+" (ULP "+title(tp.ulp)+") "+nf(tp.kms,1)+" kms; total "+M.nPny+" penyulang telah dirabas.");
    var vt=sum(M.vendors.map(function(v){return v.kms;})); if(M.vendors.length && vt>0) f.push("Mitra pelaksana terbesar "+title(M.vendors[0].ven)+" dengan "+nf(M.vendors[0].kms,1)+" kms ("+pc(M.vendors[0].kms/vt*100)+" dari volume rabas).");
    // rekomendasi
    var rem=11-M.cur;
    ULPS.forEach(function(u){ var U=M.U[u]; if(U.pk!=null && U.pk<85 && U.tgK){ var gap=U.tgK*M.nM-U.k, need=rem>0?(U.tgK*12-U.k)/rem:null;
      r.push("ULP "+title(u)+": capaian rabas "+pc(U.pk)+", kurang "+nf(gap,1)+" kms dari target kumulatif"+(need!=null?"; perlu rata-rata "+nf(need,1)+" kms/bulan pada "+rem+" bulan tersisa untuk memenuhi target tahunan":"")+"."); } });
    var lowT=ULPS.filter(function(u){ return M.U[u].pt!=null && M.U[u].pt<70; });
    if(lowT.length) r.push("Capaian tebang pohon di bawah 70%: "+lowT.map(function(u){ return "ULP "+title(u)+" ("+pc(M.U[u].pt)+")"; }).join(", ")+" — percepat penebangan pada titik rawan sentuh pohon hasil inspeksi JTM.");
    if(M.cur>0 && M.mK[M.cur-1]>0 && M.mK[M.cur]<M.mK[M.cur-1]*0.7) r.push("Evaluasi penurunan realisasi "+BULAN[M.cur]+" bersama mitra pelaksana; susun jadwal rabas mingguan per penyulang untuk bulan berikutnya.");
    if(M.vendors.length && vt>0 && M.vendors[0].kms/vt>0.6) r.push("Volume rabas terkonsentrasi pada satu mitra ("+pc(M.vendors[0].kms/vt*100)+"); siapkan kapasitas mitra pendamping agar target tidak bergantung pada satu pelaksana.");
    ULPS.forEach(function(u){ if(M.U[u].k===0) r.push("ULP "+title(u)+" belum memiliki realisasi rabas s/d "+per+" — pastikan pekerjaan berjalan dan input realisasi di spreadsheet ROW lengkap."); });
    if(M.source!=="live") r.push("Data ROW dimuat dari snapshot (spreadsheet tidak terjangkau saat ekspor) — perbarui sebelum paparan.");
    if(!r.length) r.push("Seluruh ULP berada pada jalur target; pertahankan ritme pelaksanaan dan prioritaskan penyulang dengan riwayat gangguan akibat pohon.");
    return {f:f, r:r};
  }

  /* ---------- build ---------- */
  async function build(JSZip, now, progress){
    var say=typeof progress==="function"?progress:function(){};
    if(!window.Chart) throw new Error("Pustaka grafik (Chart.js) belum termuat");
    say("Memuat data ROW & target…");
    var M=await model(now); baseFont();
    say("Memuat template PPT…"); await loadTpl();
    var zip=await JSZip.loadAsync(window.FDX_TPL,{base64:true});
    var per=BULAN[M.cur]+" 2026", rangeTxt=M.cur===0?"Januari 2026":"Januari – "+per;

    // Cover
    var s1=await zip.file("ppt/slides/slide1.xml").async("string");
    s1=s1.replace(/Sorong, [A-Za-z]+ 20\d\d/, "Sorong, "+BULAN[now.getMonth()]+" "+now.getFullYear());
    var tIdx=s1.indexOf("Monitoring WIG"); if(tIdx>0){ var tsp=s1.lastIndexOf("<p:txBody>",tIdx), tep=s1.indexOf("</p:txBody>",tIdx);
      var body=s1.slice(tsp,tep), pr=(body.match(/<a:rPr\b[^>]*\/>|<a:rPr\b[^>]*>[\s\S]*?<\/a:rPr>/)||['<a:rPr lang="id-ID"/>'])[0], ppr=(body.match(/<a:pPr\b[^>]*\/>|<a:pPr\b[^>]*>[\s\S]*?<\/a:pPr>/)||[""])[0];
      var bp=body.slice(0, body.indexOf("<a:p>"));
      var nb=bp+["Paparan Realisasi Pekerjaan ROW","Rabas & Tebang Pohon UP3 Sorong"].map(function(t){ return "<a:p>"+ppr+"<a:r>"+pr+"<a:t>"+esc(t)+"</a:t></a:r></a:p>"; }).join("");
      s1=s1.slice(0,tsp)+nb+s1.slice(tep); }
    zip.file("ppt/slides/slide1.xml", s1);

    var proto=(await zip.file("ppt/slides/slide2.xml").async("string")).replace("MONITORING WIG KEANDALAN (HAR)","{{TITLE}}");
    var protoRel=(await zip.file("ppt/slides/_rels/slide2.xml.rels").async("string")).replace(/<Relationship Id="rId2"[^>]*notesSlide[^>]*\/>/,"");
    var slides=[], imgN=0;
    async function addImg(cv){ imgN++; var fn="row_"+imgN+".png"; zip.file("ppt/media/"+fn, await png(cv)); return fn; }
    function S(t){ var s={title:t, xml:"", rels:"", id:60, rid:60}; slides.push(s); return s; }
    async function putImg(s, cv, x,y,w,h, name){ var fn=await addImg(cv), rid="rId"+(s.rid++); s.rels+=imgRel(rid,"../media/"+fn); s.xml+=picXml(s.id++, rid, name||fn, x,y,w,h); }
    function put(s, xml, n){ s.xml+=xml; s.id+=(n||3); }

    // Slide 2 — Ringkasan
    say("Menyusun grafik ringkasan…");
    var PER=" s/d "+per.toUpperCase();
    var s=S("RINGKASAN REALISASI ROW"+PER);
    var tgK=M.upK?M.upK*M.nM:null, tgT=M.upT?M.upT*M.nM:null, cw=(W0-4*110000)/5, ch=980000;
    var mom = M.cur>0 && M.mK[M.cur-1] ? (M.mK[M.cur]-M.mK[M.cur-1])/M.mK[M.cur-1]*100 : null;
    var cards=[["RABAS s/d "+BL3[M.cur].toUpperCase(),nf(M.totK,1),"kms",tgK?pc(M.totK/tgK*100)+" dari target "+nf(tgK,1)+" kms":"Target belum tersedia",BLUE,tgK?M.totK/tgK*100:null],
      ["TEBANG POHON s/d "+BL3[M.cur].toUpperCase(),nf(M.totT,0),"btg",tgT?pc(M.totT/tgT*100)+" dari target "+nf(tgT,0)+" btg":"Target belum tersedia",RED,tgT?M.totT/tgT*100:null],
      ["REALISASI "+BULAN[M.cur].toUpperCase(),nf(M.mK[M.cur],1),"kms",(mom==null?"":(mom>=0?"▲ ":"▼ ")+pc(Math.abs(mom))+" vs "+BL3[M.cur-1]+" · ")+nf(M.mT[M.cur],0)+" btg",YEL,null],
      ["RATA-RATA / BULAN",nf(M.totK/M.nM,1),"kms",M.upK?"Target "+nf(M.upK,1)+" kms/bulan":nf(M.totT/M.nM,0)+" btg/bulan",NAVY,null],
      ["PENYULANG DIRABAS",String(M.nPny),"penyulang",M.vendors.length+" mitra pelaksana · 4 ULP",GRN,null]];
    cards.forEach(function(c,i){ put(s, kpiCard(s.id, X0+i*(cw+110000), Y0, cw, ch, c[0],c[1],c[2],c[3],c[4],c[5])); });
    var cy=Y0+ch+150000, chh=Y0+H0-cy-300000, lw=6850000, rx=X0+lw+200000, rw=W0-lw-200000;
    put(s, caption(s.id, X0, cy, lw, "Realisasi Rabas Bulanan per ULP", "kms · label = total UP3"),1);
    put(s, caption(s.id, rx, cy, rw, "Kurva S Kumulatif Rabas", "realisasi vs target"),1);
    var dsA=ULPS.map(function(u){ return {type:"bar",label:title(u),data:M.months.map(function(m){return +M.K[u][m].toFixed(2);}),backgroundColor:UCLR[u],stack:"s",borderRadius:2,maxBarThickness:46}; });
    if(M.upK) dsA.push({type:"line",label:"Target UP3/bulan",data:M.months.map(function(){return +M.upK.toFixed(2);}),borderColor:RED,borderDash:[6,4],borderWidth:2,pointRadius:0});
    var cA=chartCanvas({type:"bar",data:{labels:M.months.map(function(m){return BL3[m];}),datasets:dsA},
      options:{layout:{padding:{top:16}},plugins:{legend:{position:"bottom",labels:{boxWidth:11,font:{size:11}}},vlab:{mode:"stack",size:11}},scales:{x:{stacked:true,grid:{display:false},ticks:{font:{size:11.5,weight:"bold"}}},y:{stacked:true,beginAtZero:true,grace:"8%",grid:{color:"#EEF2F6"},ticks:{font:{size:10.5}}}}}}, lw/PX, chh/PX);
    await putImg(s, cA, X0, cy+300000, lw, chh, "Grafik bulanan per ULP");
    var cum=0, cumR=M.mK.map(function(v){ cum+=v; return +cum.toFixed(2); });
    var dsB=[{type:"line",label:"Realisasi kumulatif",data:cumR,borderColor:BLUE,backgroundColor:hexA(BLUE,0.15),fill:true,borderWidth:2.5,pointRadius:3,tension:.25}];
    if(M.upK) dsB.push({type:"line",label:"Target kumulatif",data:M.months.map(function(m){return +(M.upK*(m+1)).toFixed(2);}),borderColor:RED,borderDash:[6,4],borderWidth:2,pointRadius:0,fill:false});
    var cB=chartCanvas({type:"line",data:{labels:M.months.map(function(m){return BL3[m];}),datasets:dsB},
      options:{layout:{padding:{top:18,right:10}},plugins:{legend:{position:"bottom",labels:{boxWidth:11,font:{size:11}}},vlab:{mode:"lastpts",size:11}},scales:{x:{grid:{display:false},ticks:{font:{size:11}}},y:{beginAtZero:true,grid:{color:"#EEF2F6"},ticks:{font:{size:10.5}}}}}}, rw/PX, chh/PX);
    await putImg(s, cB, rx, cy+300000, rw, chh, "Kurva S kumulatif");

    // Slide 3 — Matriks bulanan
    say("Menyusun matriks realisasi bulanan per ULP…");
    s=S("REALISASI BULANAN ROW PER ULP"+PER);
    var gap=180000, mrh=Math.max(28, Math.min(42, ((H0-2*300000-gap-260000)/PX/2 - 32)/5));
    var mxW=W0/PX, mk=matrix(M,"k",mxW,mrh), mt=matrix(M,"t",mxW,mrh);
    var avail=H0-2*300000-gap-260000, scale=Math.min(1, avail/((mk.h+mt.h)*PX));
    var y1=Y0;
    put(s, caption(s.id, X0, y1, W0, "Rabas Pohon (kms)", M.upK?"warna = capaian bulanan terhadap target bulanan ULP":"warna = intensitas realisasi"),1);
    await putImg(s, mk.cv, X0, y1+300000, mk.w*PX*scale, mk.h*PX*scale, "Matriks rabas");
    var y2=y1+300000+mk.h*PX*scale+gap;
    put(s, caption(s.id, X0, y2, W0, "Tebang Pohon (btg)", M.upT?"warna = capaian bulanan terhadap target bulanan ULP":"warna = intensitas realisasi"),1);
    await putImg(s, mt.cv, X0, y2+300000, mt.w*PX*scale, mt.h*PX*scale, "Matriks tebang");
    var ly=y2+300000+mt.h*PX*scale+70000;
    put(s, shape(s.id, X0, ly, W0, 230000, {ins:0, paras:para(run("Skala warna capaian: ",{sz:900,b:1,c:"5B6573"})+run("■ ",{sz:1000,c:"F8696B"})+run("0%   ",{sz:900,c:"5B6573"})+run("■ ",{sz:1000,c:"FFEB84"})+run("50%   ",{sz:900,c:"5B6573"})+run("■ ",{sz:1000,c:"63BE7B"})+run("≥100%",{sz:900,c:"5B6573"})+run(M.tgSrc?"     Sumber target: "+M.tgSrc:"",{sz:900,c:"5B6573"}))}),1);

    // Slide 4 — Panel per ULP
    say("Menyusun panel kinerja tiap ULP…");
    s=S("KINERJA ROW PER ULP"+PER);
    var pg=120000, pw=(W0-pg)/2, ph=(H0-pg)/2;
    for(var i=0;i<4;i++){ var cvP=ulpPanel(M, ULPS[i], pw/PX, ph/PX); await putImg(s, cvP, X0+(i%2)*(pw+pg), Y0+Math.floor(i/2)*(ph+pg), pw, ph, "Panel "+ULPS[i]); }

    // Slide 5 — Penyulang prioritas & kontribusi
    say("Menyusun grafik penyulang & kontribusi…");
    s=S("PENYULANG PRIORITAS & KONTRIBUSI ULP");
    var top=M.pny.slice().sort(function(a,b){return b.kms-a.kms;}).slice(0,12), lw5=7000000, rx5=X0+lw5+250000, rw5=W0-lw5-250000, hh5=H0-300000;
    put(s, caption(s.id, X0, Y0, lw5, "Top "+top.length+" Penyulang — Panjang Rabas", "kms · warna = ULP · keterangan = batang tebang"),1);
    var cC=chartCanvas({type:"bar",data:{labels:top.map(function(p){return title(p.pny);}),datasets:[{label:"Rabas (kms)",data:top.map(function(p){return +p.kms.toFixed(2);}),backgroundColor:top.map(function(p){return UCLR[p.ulp];}),borderRadius:3,maxBarThickness:24}]},
      options:{indexAxis:"y",layout:{padding:{right:130}},plugins:{legend:{display:false},vlab:{mode:"hbar",size:11,fmt:function(v,j){ return nf(v,1)+" kms · "+nf(top[j].btg,0)+" btg"; }}},scales:{x:{beginAtZero:true,grid:{color:"#EEF2F6"},ticks:{font:{size:10.5}}},y:{grid:{display:false},ticks:{font:{size:11.5,weight:"bold"},color:INK}}}}}, lw5/PX, hh5/PX);
    await putImg(s, cC, X0, Y0+300000, lw5, hh5, "Top penyulang");
    put(s, caption(s.id, rx5, Y0, rw5, "Kontribusi Rabas per ULP", "s/d "+per),1);
    var cD=chartCanvas({type:"doughnut",data:{labels:ULPS.map(title),datasets:[{data:ULPS.map(function(u){return +M.U[u].k.toFixed(2);}),backgroundColor:ULPS.map(function(u){return UCLR[u];}),borderColor:"#FFFFFF",borderWidth:3}]},
      options:{cutout:"58%",layout:{padding:8},plugins:{legend:{position:"bottom",labels:{boxWidth:11,font:{size:11.5}}}}},
      plugins:[{id:"ctr",afterDraw:function(c){ var g=c.ctx, a=c.chartArea, x=(a.left+a.right)/2, y=(a.top+a.bottom)/2; g.save(); g.textAlign="center"; g.fillStyle=NAVY; g.font="bold 24px "+FONT; g.fillText(nf(M.totK,1),x,y+4); g.font="12px "+FONT; g.fillStyle=MUTED; g.fillText("kms total UP3",x,y+22);
        c.getDatasetMeta(0).data.forEach(function(el,j){ var v=c.data.datasets[0].data[j]; if(!v||!M.totK) return; var p=el.tooltipPosition(); g.font="bold 12px "+FONT; g.fillStyle="#FFFFFF"; g.fillText(Math.round(v/M.totK*100)+"%",p.x,p.y+4); }); g.restore(); }}]}, rw5/PX, 3300000/PX);
    await putImg(s, cD, rx5, Y0+300000, rw5, 3300000, "Kontribusi ULP");
    var tb=ULPS.map(function(u){ var U=M.U[u]; return para(run("■ ",{sz:1200,c:UCLR[u]})+run("ULP "+title(u),{sz:1150,b:1}),{aft:0})+
      para(run(nf(U.k,1)+" kms"+(U.pk!=null?" ("+pc(U.pk)+")":"")+" · "+nf(U.t,0)+" btg"+(U.pt!=null?" ("+pc(U.pt)+")":"")+" · "+U.nPny+" penyulang",{sz:1000,c:"5B6573"}),{aft:500}); }).join("");
    put(s, shape(s.id, rx5, Y0+3700000, rw5, H0-3700000, {geom:"roundRect",fill:"#F4F7FB",line:"#DCE4ED",ins:120000,anchor:"ctr",paras:tb}),1);

    // Slide 6 — Mitra
    say("Menyusun grafik mitra pelaksana…");
    s=S("REALISASI PER MITRA PELAKSANA"+PER);
    var V=M.vendors.slice(0,8), vt=sum(M.vendors.map(function(v){return v.kms;})), lw6=7000000, rx6=X0+lw6+250000, rw6=W0-lw6-250000;
    put(s, caption(s.id, X0, Y0, lw6, "Volume Rabas per Mitra & ULP", "kms"),1);
    if(V.length){
      var cE=chartCanvas({type:"bar",data:{labels:V.map(function(v){return title(v.ven);}),datasets:ULPS.map(function(u){ return {label:title(u),data:V.map(function(v){return +((v.u[u]||0).toFixed(2));}),backgroundColor:UCLR[u],stack:"v",borderRadius:2,maxBarThickness:34}; })},
        options:{indexAxis:"y",layout:{padding:{right:60}},plugins:{legend:{position:"bottom",labels:{boxWidth:11,font:{size:11}}},vlab:{mode:"none"}},scales:{x:{stacked:true,beginAtZero:true,grid:{color:"#EEF2F6"}},y:{stacked:true,grid:{display:false},ticks:{font:{size:11.5,weight:"bold"},color:INK}}}},
        plugins:[{id:"vt",afterDatasetsDraw:function(c){ var g=c.ctx; g.save(); g.font="bold 11px "+FONT; g.fillStyle=INK; g.textBaseline="middle"; V.forEach(function(v,j){ var mx=null; c.data.datasets.forEach(function(d,i){ var el=c.getDatasetMeta(i).data[j]; if(el && (mx===null||el.x>mx.x)) mx=el; }); if(mx) g.fillText(nf(v.kms,1),mx.x+5,mx.y); }); g.restore(); }}]}, lw6/PX, (H0-300000)/PX);
      await putImg(s, cE, X0, Y0+300000, lw6, H0-300000, "Mitra per ULP");
    } else put(s, shape(s.id, X0, Y0+300000, lw6, 800000, {paras:para(run("Belum ada data mitra pelaksana pada periode ini.",{sz:1200,c:"5B6573"}))}),1);
    var vp=para(run("Rekap Mitra Pelaksana",{sz:1300,b:1,c:"0B3C6E"}),{aft:600});
    M.vendors.slice(0,8).forEach(function(v,i){ vp+=para(run((i+1)+". "+title(v.ven),{sz:1100,b:1}),{aft:0})+para(run(nf(v.kms,1)+" kms ("+pc(vt?v.kms/vt*100:0)+") · "+nf(v.btg,0)+" btg · "+Object.keys(v.u).filter(function(u){return v.u[u]>0;}).map(title).join(", "),{sz:1000,c:"5B6573"}),{aft:500}); });
    put(s, shape(s.id, rx6, Y0+300000, rw6, Math.min(H0-300000, 700000+Math.min(8,M.vendors.length)*640000), {geom:"roundRect",fill:"#F4F7FB",line:"#DCE4ED",ins:140000,paras:vp}),1);

    // Slide 7 — Catatan & tindak lanjut
    s=S("CATATAN CAPAIAN & TINDAK LANJUT");
    var F=findings(M), hw=(W0-200000)/2;
    put(s, shape(s.id, X0, Y0, hw, 420000, {fill:NAVY,anchor:"ctr",paras:para(run("CATATAN CAPAIAN s/d "+per.toUpperCase(),{sz:1400,b:1,c:"FFFFFF"}))}),1);
    put(s, shape(s.id, X0+hw+200000, Y0, hw, 420000, {fill:"#E9A700",anchor:"ctr",paras:para(run("REKOMENDASI TINDAK LANJUT",{sz:1400,b:1,c:"FFFFFF"}))}),1);
    put(s, shape(s.id, X0, Y0+420000, hw, H0-420000, {fill:"#F4F7FB",line:"#DCE4ED",ins:150000,paras:F.f.map(function(t){ return para(run(t,{sz:1200}),{bu:1,buc:"0067AC",aft:900}); }).join("")}),1);
    put(s, shape(s.id, X0+hw+200000, Y0+420000, hw, H0-420000, {fill:"#FFF9E8",line:"#F3DFA6",ins:150000,paras:F.r.map(function(t){ return para(run(t,{sz:1200}),{bu:1,buc:"E9A700",aft:900}); }).join("")}),1);

    // Rakit slide: slide2 = slide pertama konten, sisanya baru; hapus slide3 bawaan
    say("Merakit berkas PPT…");
    var pres=await zip.file("ppt/presentation.xml").async("string"), presRel=await zip.file("ppt/_rels/presentation.xml.rels").async("string"), ct=await zip.file("[Content_Types].xml").async("string");
    var r3=(presRel.match(/<Relationship Id="(rId\d+)"[^>]*Target="slides\/slide3\.xml"\/>/)||[]);
    if(r3[1]){ pres=pres.replace(new RegExp('<p:sldId id="\\d+" r:id="'+r3[1]+'"/>'),""); presRel=presRel.replace(r3[0],""); }
    zip.remove("ppt/slides/slide3.xml"); zip.remove("ppt/slides/_rels/slide3.xml.rels");
    var sid=Math.max.apply(null,(pres.match(/<p:sldId id="(\d+)"/g)||['id="300"']).map(function(x){return +x.replace(/\D/g,"");}));
    slides.forEach(function(sl,k){
      var sn=k===0?2:10+k, xml=proto.replace("{{TITLE}}",esc(sl.title)).replace("<!--PICS-->",sl.xml);
      var rel=(k===0?(protoRel.replace("</Relationships>",'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide2.xml"/></Relationships>')):protoRel).replace("</Relationships>",sl.rels+"</Relationships>");
      zip.file("ppt/slides/slide"+sn+".xml", xml); zip.file("ppt/slides/_rels/slide"+sn+".xml.rels", rel);
      if(k>0){ var rid="rId"+(300+k);
        pres=pres.replace("</p:sldIdLst>",'<p:sldId id="'+(sid+k)+'" r:id="'+rid+'"/></p:sldIdLst>');
        presRel=presRel.replace("</Relationships>",'<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+sn+'.xml"/></Relationships>');
        ct=ct.replace('<Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>','').replace("</Types>",'<Override PartName="/ppt/slides/slide'+sn+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>');
      }
    });
    ct=ct.replace('<Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>','');
    zip.file("ppt/presentation.xml",pres); zip.file("ppt/_rels/presentation.xml.rels",presRel); zip.file("[Content_Types].xml",ct);
    say("Menyimpan berkas PPT…");
    var blob=await zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation"});
    return {blob:blob, name:"Paparan Realisasi ROW UP3 Sorong s.d "+BULAN[M.cur]+" 2026.pptx", slides:1+slides.length};
  }

  window.ROWPPT = { build: build };
})();
