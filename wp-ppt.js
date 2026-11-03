/* Ekspor PPT Paparan Realisasi Workplan Pemeliharaan Distribusi — UP3 Sorong 2026
   Format sama dengan Paparan ROW (bingkai template PLN, infografis, matriks capaian, panel per ULP, catatan tindak lanjut).
   Data: window.Workplan (target tahunan per lead measure × ULP, realisasi harian). Target bulanan = tahunan ÷ 12.
   Satuan lead measure berbeda-beda, sehingga agregat memakai rata-rata capaian (%) lead measure bertarget (dibatasi 150%),
   sedangkan volume pekerjaan memakai jumlah entri realisasi. */
(function(){
  var KEL_LBL = {"PHBTM":"PHB-TM","JTM":"JTM","GARDU":"Gardu Distribusi","JTR":"JTR","SR-APP":"SR-APP","LAINNYA":"Lainnya"};
  var KEL_CLR = {"PHBTM":"#7B4FA0","JTM":"#0067AC","GARDU":"#E9A700","JTR":"#1E9E8F","SR-APP":"#C2410C","LAINNYA":"#7F8C9D"};
  var ROWS_PER_PAGE = 17;

  function H(){ if(!window.ROWPPT || !window.ROWPPT.H) throw new Error("Modul paparan (row-ppt.js) belum termuat"); return window.ROWPPT.H; }
  function cap(p){ return p==null ? null : Math.min(150, p); }
  function avg(a){ a=a.filter(function(x){ return x!=null; }); return a.length ? a.reduce(function(s,x){return s+x;},0)/a.length : null; }

  /* ---------- model ---------- */
  function model(now){
    var h=H(), P=window.Workplan.data(), ULPS=h.ULPS, MON=P.MONTHS, st=P.state||{};
    var real=(P.REAL||[]).filter(function(d){ return d.bulan>=0 && ULPS.indexOf(d.ulp)>=0; });
    var cur;
    if(st.bulan && st.bulan!=="SEMUA BULAN" && MON.indexOf(st.bulan)>=0) cur=MON.indexOf(st.bulan);
    else { var ms=real.map(function(d){return d.bulan;}).filter(function(m){ return m<=now.getMonth(); }); cur=ms.length?Math.max.apply(null,ms):now.getMonth(); }
    var nM=cur+1, months=[]; for(var i=0;i<nM;i++) months.push(i);
    real=real.filter(function(d){ return d.bulan<=cur; });
    var idx={}; real.forEach(function(d){ var k=d.key+"|"+d.ulp+"|"+d.bulan; idx[k]=(idx[k]||0)+d.jumlah; });
    function R(key,u,a,b){ var s=0; for(var m=a;m<=b;m++) s+=idx[key+"|"+u+"|"+m]||0; return s; }
    // daftar lead measure bertarget (urut kelompok)
    var ord=P.KEL_ORDER||[], seen={}, LM=[];
    (P.TARGET||[]).forEach(function(t,i){ var key=t.key+"|"+t.kelompok; if(seen[key]) return; seen[key]=1;
      var tot=ULPS.reduce(function(a,u){return a+(t.tg[u]||0);},0); if(tot<=0) return;
      var o=ord.indexOf(t.kelompok); LM.push({t:t, o:o<0?99:o, i:i}); });
    LM.sort(function(a,b){ return (a.o-b.o)||(a.i-b.i); });
    LM=LM.map(function(x){
      var t=x.t, r={kel:t.kelompok, prog:t.program, lm:t.lm, key:t.key, sat:t.satuan, u:{}, yr:0, cum:0, real:0};
      ULPS.forEach(function(u){
        var y=t.tg[u]||0, c=y/12*nM, re=R(t.key,u,0,cur), mon=months.map(function(m){ return R(t.key,u,m,m); });
        r.u[u]={y:y, cum:c, real:re, p:c>0?re/c*100:null, pY:y>0?re/y*100:null, mon:mon, pm:months.map(function(m){ return y>0?cap(mon[m]/(y/12)*100):null; })};
        r.yr+=y; r.cum+=c; r.real+=re;
      });
      r.p=r.cum>0?r.real/r.cum*100:null; r.pY=r.yr>0?r.real/r.yr*100:null;
      return r;
    });
    var tKeys={}; LM.forEach(function(r){ tKeys[r.key]=1; });
    var noTgt={}; real.forEach(function(d){ if(!tKeys[d.key]){ noTgt[d.key]=noTgt[d.key]||{lm:d.lm,n:0}; noTgt[d.key].n++; } });
    // agregat ULP
    var U={};
    ULPS.forEach(function(u){
      var rows=LM.filter(function(r){ return r.u[u].y>0; });
      var e=real.filter(function(d){ return d.ulp===u; });
      U[u]={p:avg(rows.map(function(r){ return cap(r.u[u].p); })), pY:avg(rows.map(function(r){ return cap(r.u[u].pY); })),
        nB:rows.length, nT:rows.filter(function(r){ return r.u[u].p>=100; }).length, nA:rows.filter(function(r){ return r.u[u].real>0; }).length,
        n:e.length, nMon:months.map(function(m){ return e.filter(function(d){return d.bulan===m;}).length; }),
        pMon:months.map(function(m){ return avg(rows.map(function(r){ return r.u[u].pm[m]; })); }),
        low:rows.slice().sort(function(a,b){ return (a.u[u].p||0)-(b.u[u].p||0); }).slice(0,3),
        kel:{}};
      (ord.length?ord:["PHBTM","JTM","GARDU","JTR","SR-APP","LAINNYA"]).forEach(function(k){ var kr=rows.filter(function(r){return r.kel===k;}); if(kr.length) U[u].kel[k]=avg(kr.map(function(r){ return cap(r.u[u].p); })); });
    });
    var kels=[]; LM.forEach(function(r){ if(kels.indexOf(r.kel)<0) kels.push(r.kel); });
    var KEL={}; kels.forEach(function(k){ var kr=LM.filter(function(r){return r.kel===k;}); KEL[k]={p:avg(kr.map(function(r){return cap(r.p);})), n:kr.length, nT:kr.filter(function(r){return r.p>=100;}).length,
      e:real.filter(function(d){ return d.kelompok===k; }).length}; });
    var nMon=months.map(function(m){ return real.filter(function(d){return d.bulan===m;}).length; });
    var pMon=months.map(function(m){ return avg(LM.map(function(r){ var y=r.yr; if(!y) return null; var s=0; h.ULPS.forEach(function(u){ s+=r.u[u].mon[m]; }); return cap(s/(y/12)*100); })); });
    var vmap={}; real.forEach(function(d){ var v=d.vendor||"TANPA MITRA"; vmap[v]=vmap[v]||{ven:v,n:0,u:{}}; vmap[v].n++; vmap[v].u[d.ulp]=(vmap[v].u[d.ulp]||0)+1; });
    var vendors=Object.keys(vmap).map(function(k){return vmap[k];}).sort(function(a,b){return b.n-a.n;});
    return {cur:cur, nM:nM, months:months, LM:LM, U:U, KEL:KEL, kels:kels, entries:real.length, nMon:nMon, pMon:pMon, vendors:vendors,
      p:avg(LM.map(function(r){return cap(r.p);})), pY:avg(LM.map(function(r){return cap(r.pY);})),
      nB:LM.length, nT:LM.filter(function(r){return r.p>=100;}).length, nA:LM.filter(function(r){return r.real>0;}).length,
      zero:LM.filter(function(r){return r.real===0;}), noTgt:Object.keys(noTgt).map(function(k){return noTgt[k];}),
      ulpFilter:st.ulp&&st.ulp!=="SEMUA ULP"?st.ulp:null};
  }

  /* ---------- kanvas: panel hero ---------- */
  function band(g, w, hh, col, icon, t1, t2){
    var h=H(); g.fillStyle="#FFFFFF"; h.rr(g,0.5,0.5,w-1,hh-1,10); g.fill();
    g.save(); h.rr(g,0.5,0.5,w-1,hh-1,10); g.clip(); var gr=g.createLinearGradient(0,0,w,0); gr.addColorStop(0,col); gr.addColorStop(1,h.hexA(col,0.78)); g.fillStyle=gr; g.fillRect(0,0,w,56);
    icon(g, w-46, 32, 90, "rgba(255,255,255,0.16)"); g.restore();
    g.fillStyle="#FFFFFF"; g.beginPath(); g.arc(32,28,20,0,Math.PI*2); g.fill(); icon(g,32,28,30,col);
    h.txt(g,t1,62,25,{sz:16,b:1,c:"#FFFFFF"}); h.txt(g,t2,62,43,{sz:11,c:"rgba(255,255,255,0.9)"});
  }
  function frame(g,w,hh){ var h=H(); g.strokeStyle="#D6DEE8"; g.lineWidth=1; h.rr(g,0.5,0.5,w-1,hh-1,10); g.stroke(); }
  function iconClip(g, cx, cy, s, col){ // papan klip + centang
    g.save(); g.translate(cx,cy); g.scale(s/40,s/40); g.strokeStyle=col; g.fillStyle=col; g.lineWidth=2.6; g.lineJoin="round"; g.lineCap="round";
    g.strokeRect(-12,-13,24,30); g.fillRect(-6,-17,12,6);
    g.beginPath(); g.moveTo(-7,-2); g.lineTo(-3,2); g.lineTo(5,-6); g.stroke();
    g.beginPath(); g.moveTo(-7,8); g.lineTo(7,8); g.moveTo(-7,13); g.lineTo(3,13); g.stroke(); g.restore();
  }
  function iconPin(g, cx, cy, s, col){ // penanda lokasi ULP
    g.save(); g.translate(cx,cy); g.scale(s/40,s/40); g.fillStyle=col;
    g.beginPath(); g.arc(0,-6,11,Math.PI,0); g.quadraticCurveTo(11,6,0,17); g.quadraticCurveTo(-11,6,-11,-6); g.fill();
    g.fillStyle="#FFFFFF"; g.beginPath(); g.arc(0,-6,4.5,0,Math.PI*2); g.fill(); g.restore();
  }
  function gauge(g, gx, gy, R, p, ideal, col, lbl){
    var h=H(), th=18, NAVY=h.C.NAVY;
    g.lineCap="butt"; g.lineWidth=th; g.strokeStyle="#E9EEF4"; g.beginPath(); g.arc(gx,gy,R,Math.PI,2*Math.PI); g.stroke();
    var pv=Math.max(0,Math.min(100,p||0)); g.strokeStyle=col; g.beginPath(); g.arc(gx,gy,R,Math.PI,Math.PI+Math.PI*pv/100); g.stroke();
    if(ideal!=null){ var ia=Math.PI+Math.PI*Math.min(100,ideal)/100, mid=Math.abs(ia-Math.PI*1.5)<0.18;
      g.strokeStyle=NAVY; g.lineWidth=2.5; g.beginPath(); g.moveTo(gx+Math.cos(ia)*(R-th/2-4),gy+Math.sin(ia)*(R-th/2-4)); g.lineTo(gx+Math.cos(ia)*(R+th/2+5),gy+Math.sin(ia)*(R+th/2+5)); g.stroke();
      h.txt(g,"ideal "+h.pc(ideal),gx+Math.cos(ia)*(R+th/2+9)+(mid?6:0),gy+Math.sin(ia)*(R+th/2+9)+(mid?3:-2),{sz:9.5,b:1,c:NAVY,al:mid?"left":(ia>Math.PI*1.5?"left":"right")}); }
    h.txt(g,h.pc(p),gx,gy-14,{sz:28,b:1,c:col,al:"center"}); h.txt(g,lbl,gx,gy+2,{sz:10,c:h.C.MUTED,al:"center"});
    h.txt(g,"0",gx-R,gy+16,{sz:9,c:h.C.MUTED,al:"center"}); h.txt(g,"100%",gx+R,gy+16,{sz:9,c:h.C.MUTED,al:"center"});
  }
  function statBox(g, x, y, w, hh, col, soft, lbl, main, unit, sub, pill){
    var h=H(); g.fillStyle=soft; h.rr(g,x,y,w,hh,7); g.fill(); g.fillStyle=col; g.fillRect(x,y+8,3.5,hh-16);
    h.txt(g,lbl,x+12,y+15,{sz:9.5,b:1,c:h.C.MUTED});
    var mw=h.txt(g,main,x+12,y+38,{sz:21,b:1,c:h.C.INK}); h.txt(g,unit,x+16+mw,y+38,{sz:10.5,c:h.C.MUTED});
    var xr=x+w-10;
    if(pill!=null){ var pw=58; g.fillStyle=h.heat(pill); h.rr(g,xr-pw,y+9,pw,18,9); g.fill(); h.txt(g,h.pc(pill),xr-pw/2,y+18.5,{sz:11,b:1,al:"center",bl:"middle"}); }
    if(sub) h.txt(g,sub,xr,y+(pill!=null?40:30),{sz:9.5,c:h.C.MUTED,al:"right",max:w-mw-60});
  }
  function barRow(g, x, y, w, label, col, p, right, pill){
    var h=H(); g.fillStyle=col; h.rr(g,x,y-6,6,12,2); g.fill();
    h.txt(g,label,x+11,y+1,{sz:11,b:1,c:h.C.INK,bl:"middle",max:84});
    var bx=x+100, bw=w-100-150;
    g.fillStyle="#EEF2F6"; h.rr(g,bx,y-7,bw,14,7); g.fill();
    var f=Math.min(1,(p||0)/100); if(f>0){ g.fillStyle=col; h.rr(g,bx,y-7,Math.max(14,bw*f),14,7); g.fill(); }
    g.strokeStyle=h.C.NAVY; g.lineWidth=1.5; g.setLineDash([3,2]); g.beginPath(); g.moveTo(bx+bw,y-10); g.lineTo(bx+bw,y+10); g.stroke(); g.setLineDash([]);
    h.txt(g,right,bx+bw+8,y+1,{sz:10.5,b:1,c:h.C.INK,bl:"middle"});
    var pw=48; g.fillStyle=h.heat(pill); h.rr(g,x+w-pw,y-8,pw,16,8); g.fill(); h.txt(g,h.pc(pill),x+w-pw/2,y+0.5,{sz:9.5,b:1,al:"center",bl:"middle"});
  }
  function heroUP3(M, w, hh){
    var h=H(), c=h.newCanvas(w,hh), g=c.g, col="#0B3C6E", soft="#E8EEF6", ideal=M.nM/12*100;
    band(g,w,hh,col,iconClip,"CAPAIAN WORKPLAN UP3 SORONG","Realisasi s/d "+h.BULAN[M.cur]+" 2026 · "+M.nB+" lead measure bertarget");
    gauge(g,118,176,78,M.p,null,col,"rata-rata capaian kumulatif");
    var l1="Thd target 2026: "; h.txt(g,l1,30,212,{sz:10.5,c:h.C.MUTED}); h.txt(g,h.pc(M.pY),30+g.measureText(l1).width,212,{sz:10.5,b:1,c:h.C.INK});
    h.txt(g,"ideal s/d "+h.BL3[M.cur]+": "+h.pc(ideal),30,226,{sz:10,c:h.C.MUTED});
    var sx=236, sw=w-sx-14, by=66, bh=48, gp=6;
    statBox(g,sx,by,sw,bh,col,soft,"LEAD MEASURE TUNTAS (≥100%)",M.nT+" / "+M.nB,"LM",M.nA+" LM sudah ada realisasi",M.nB?M.nT/M.nB*100:null);
    statBox(g,sx,by+bh+gp,sw,bh,col,soft,"ENTRI PEKERJAAN s/d "+h.BL3[M.cur].toUpperCase(),h.nf(M.entries,0),"entri",h.BULAN[M.cur]+": "+M.nMon[M.cur]+" entri",null);
    statBox(g,sx,by+2*(bh+gp),sw,bh,"#C62828","#FDEDEC","LEAD MEASURE BELUM ADA REALISASI",String(M.zero.length),"LM",M.noTgt.length?M.noTgt.length+" jenis pekerjaan di luar target":"",null);
    var uy=by+3*(bh+gp)+6;
    g.strokeStyle="#E3E9F0"; g.lineWidth=1; g.beginPath(); g.moveTo(14,uy-4); g.lineTo(w-14,uy-4); g.stroke();
    h.txt(g,"PER KELOMPOK — rata-rata capaian kumulatif",14,uy+12,{sz:10.5,b:1,c:h.C.NAVY});
    h.txt(g,"LM tuntas",w-150+8,uy+12,{sz:9.5,c:h.C.MUTED});
    var ks=M.kels.slice(0,6), rh=(hh-uy-22)/Math.max(4,ks.length);
    ks.forEach(function(k,i){ var K=M.KEL[k]; barRow(g,14,uy+22+i*rh+rh/2,w-28,KEL_LBL[k]||k,KEL_CLR[k]||"#7F8C9D",K.p,K.nT+" / "+K.n+" LM",K.p); });
    frame(g,w,hh); return c.cv;
  }
  function heroULP(M, w, hh){
    var h=H(), c=h.newCanvas(w,hh), g=c.g, col="#0067AC", ULPS=h.ULPS;
    band(g,w,hh,col,iconPin,"CAPAIAN PER ULP","Rata-rata capaian lead measure s/d "+h.BULAN[M.cur]+" 2026");
    var rank=ULPS.slice().sort(function(a,b){ return (M.U[b].p||0)-(M.U[a].p||0); });
    var y0=70, rh=(hh-y0-12)/4;
    rank.forEach(function(u,i){
      var U=M.U[u], y=y0+i*rh, cy=y+rh/2;
      g.fillStyle=i%2?"#FFFFFF":"#F7F9FC"; g.fillRect(10,y+2,w-20,rh-4);
      g.fillStyle=h.UCLR[u]; g.beginPath(); g.arc(34,cy,16,0,Math.PI*2); g.fill(); h.txt(g,String(i+1),34,cy+1,{sz:15,b:1,c:"#FFFFFF",al:"center",bl:"middle"});
      h.txt(g,"ULP "+h.title(u),60,cy-12,{sz:14,b:1,c:h.C.INK});
      h.txt(g,U.nT+"/"+U.nB+" LM tuntas · "+U.nA+" LM ada realisasi · "+h.nf(U.n,0)+" entri",60,cy+4,{sz:10,c:h.C.MUTED});
      var bx=60, bw=w-60-110; g.fillStyle="#EEF2F6"; h.rr(g,bx,cy+12,bw,10,5); g.fill();
      var f=Math.min(1,(U.p||0)/100); if(f>0){ g.fillStyle=h.UCLR[u]; h.rr(g,bx,cy+12,Math.max(10,bw*f),10,5); g.fill(); }
      h.txt(g,h.pc(U.p),w-22,cy+2,{sz:24,b:1,c:U.p>=100?"#1E7B45":(U.p>=70?"#8A5A00":"#B3261E"),al:"right",bl:"middle"});
      h.txt(g,"thd 2026: "+h.pc(U.pY),w-22,cy+22,{sz:9.5,c:h.C.MUTED,al:"right"});
    });
    frame(g,w,hh); return c.cv;
  }
  function trendChart(M, w, hh){
    var h=H(), ULPS=h.ULPS, NAVY=h.C.NAVY;
    var ds=ULPS.map(function(u){ return {type:"bar",label:h.title(u),data:M.months.map(function(m){return M.U[u].nMon[m];}),backgroundColor:h.UCLR[u],stack:"s",borderRadius:2,maxBarThickness:40,yAxisID:"y",order:2}; });
    ds.push({type:"line",label:"Capaian bulanan (%)",data:M.pMon.map(function(v){return v==null?null:+v.toFixed(1);}),borderColor:"#C62828",backgroundColor:"#C62828",borderWidth:2,pointRadius:3,tension:.25,yAxisID:"y2",order:0});
    return h.chartCanvas({type:"bar",data:{labels:M.months.map(function(m){return h.BL3[m];}),datasets:ds},
      options:{layout:{padding:{top:4,right:6}},plugins:{title:{display:true,text:"Entri Pekerjaan per Bulan & Rata-rata Capaian Bulanan",align:"start",color:NAVY,font:{size:13,weight:"bold"},padding:{bottom:4}},
        legend:{position:"top",align:"end",labels:{boxWidth:10,boxHeight:10,font:{size:10}}},vlab:{mode:"stack",size:10,fmt:function(v){return h.nf(v,0);}}},
        scales:{x:{stacked:true,grid:{display:false},ticks:{font:{size:10.5,weight:"bold"}}},y:{stacked:true,beginAtZero:true,grace:"12%",title:{display:true,text:"entri",font:{size:9.5}},grid:{color:"#EEF2F6"},ticks:{font:{size:9.5}}},
          y2:{position:"right",beginAtZero:true,suggestedMax:100,grid:{display:false},ticks:{font:{size:9.5},callback:function(v){return v+"%";}}}}}}, w, hh);
  }
  function kelDonut(M, w, hh){
    var h=H(), ks=M.kels.filter(function(k){ return M.KEL[k].e>0; }), tot=ks.reduce(function(a,k){return a+M.KEL[k].e;},0);
    return h.chartCanvas({type:"doughnut",data:{labels:ks.map(function(k){return KEL_LBL[k]||k;}),datasets:[{data:ks.map(function(k){return M.KEL[k].e;}),backgroundColor:ks.map(function(k){return KEL_CLR[k]||"#7F8C9D";}),borderColor:"#FFFFFF",borderWidth:3}]},
      options:{cutout:"58%",layout:{padding:6},plugins:{title:{display:true,text:"Komposisi Entri per Kelompok",align:"start",color:h.C.NAVY,font:{size:13,weight:"bold"}},legend:{position:"right",labels:{boxWidth:10,font:{size:10.5}}}}},
      plugins:[{id:"ctr",afterDraw:function(c){ var g=c.ctx, a=c.chartArea, x=(a.left+a.right)/2, y=(a.top+a.bottom)/2; g.save(); g.textAlign="center"; g.fillStyle=h.C.NAVY; g.font="bold 20px "+h.C.FONT; g.fillText(h.nf(tot,0),x,y+4); g.font="10.5px "+h.C.FONT; g.fillStyle=h.C.MUTED; g.fillText("entri",x,y+18);
        c.getDatasetMeta(0).data.forEach(function(el,j){ var v=c.data.datasets[0].data[j]; if(!v||v/tot<0.05) return; var p=el.tooltipPosition(); g.font="bold 11px "+h.C.FONT; g.fillStyle="#FFFFFF"; g.fillText(Math.round(v/tot*100)+"%",p.x,p.y+4); }); g.restore(); }}]}, w, hh);
  }

  /* ---------- kanvas: tabel generik (sel berwarna) ---------- */
  function table(cols, rows, w){
    var h=H(), sc=w/cols.reduce(function(a,c){return a+c.w;},0); cols.forEach(function(c){ c.px=c.w*sc; });
    var HH=rows.reduce(function(a,r){return a+r.h;},0), cv=h.newCanvas(w,HH), g=cv.g, y=0;
    rows.forEach(function(r){
      var x=0;
      r.cells.forEach(function(cl,i){
        var cw=0; for(var k=0;k<(cl.cs||1);k++) cw+=cols[i+k] ? cols[i+k].px : 0;
        if(cl.skip){ return; }
        g.fillStyle=cl.bg||"#FFFFFF"; g.fillRect(x,y,cw,r.h); g.strokeStyle="#FFFFFF"; g.lineWidth=1.5; g.strokeRect(x,y,cw,r.h);
        if(cl.bar){ g.fillStyle=cl.bar; g.fillRect(x+2,y+5,4,r.h-10); }
        if(cl.t!=null && cl.t!==""){ var al=cl.al||"center", tx=al==="left"?x+(cl.bar?12:8):(al==="right"?x+cw-8:x+cw/2);
          h.txt(g,cl.t,tx,y+r.h/2+1,{sz:cl.sz||r.sz||11,b:cl.b,c:cl.c||h.C.INK,al:al,bl:"middle",max:cw-12}); }
        x+=cw;
      });
      y+=r.h;
    });
    return {cv:cv.cv, w:w, h:HH};
  }
  function hdr(t,o){ o=o||{}; return {t:t,bg:o.bg||"#0B3C6E",c:"#FFFFFF",b:1,sz:o.sz||11,cs:o.cs}; }
  function pcell(p,o){ var h=H(); o=o||{}; return {t:p==null?"-":h.pc(p),bg:p==null?"#F2F4F7":h.heat(p),b:1,sz:o.sz}; }

  function matrixKel(M, w){
    var h=H(), ULPS=h.ULPS, cols=[{w:190}], rows=[];
    ULPS.forEach(function(){ cols.push({w:120}); }); cols.push({w:130});
    rows.push({h:34,cells:[hdr("Kelompok")].concat(ULPS.map(function(u){ return {t:"ULP "+h.title(u),bg:h.UCLR[u],c:"#FFFFFF",b:1}; })).concat([hdr("UP3 Sorong")])});
    var rh=Math.max(30, Math.min(40, 230/Math.max(1,M.kels.length+1)));
    M.kels.forEach(function(k){
      rows.push({h:rh,sz:11.5,cells:[{t:(KEL_LBL[k]||k)+"  ("+M.KEL[k].n+" LM)",al:"left",b:1,bar:KEL_CLR[k],bg:"#F7F9FC"}].concat(ULPS.map(function(u){ return pcell(M.U[u].kel[k]); })).concat([pcell(M.KEL[k].p)])});
    });
    rows.push({h:rh,sz:12,cells:[{t:"Rata-rata ULP",al:"left",b:1,bg:"#E6EDF5"}].concat(ULPS.map(function(u){ return pcell(M.U[u].p); })).concat([pcell(M.p)])});
    rows.push({h:rh,sz:11,cells:[{t:"LM tuntas / bertarget",al:"left",b:1,bg:"#E6EDF5"}].concat(ULPS.map(function(u){ return {t:M.U[u].nT+" / "+M.U[u].nB,bg:"#F2F4F7",b:1}; })).concat([{t:M.nT+" / "+M.nB,bg:"#F2F4F7",b:1}])});
    return table(cols, rows, w);
  }
  function matrixMon(M, w){
    var h=H(), ULPS=h.ULPS, cols=[{w:150}], rows=[];
    M.months.forEach(function(){ cols.push({w:80}); }); cols.push({w:100});
    rows.push({h:32,cells:[hdr("ULP")].concat(M.months.map(function(m){return hdr(h.BL3[m]);})).concat([hdr("Entri s/d")])});
    ULPS.forEach(function(u){
      rows.push({h:30,sz:11,cells:[{t:h.title(u),al:"left",b:1,bar:h.UCLR[u],bg:"#F7F9FC"}].concat(M.months.map(function(m){ var p=M.U[u].pMon[m]; return {t:p==null?"-":h.pc(p)+"  ·  "+M.U[u].nMon[m],bg:p==null?"#F2F4F7":h.heat(p),sz:10.5}; })).concat([{t:h.nf(M.U[u].n,0),bg:"#EAF1F9",b:1}])});
    });
    rows.push({h:30,sz:11,cells:[{t:"UP3 Sorong",al:"left",b:1,bg:"#E6EDF5"}].concat(M.months.map(function(m){ var p=M.pMon[m]; return {t:p==null?"-":h.pc(p)+"  ·  "+M.nMon[m],bg:p==null?"#F2F4F7":h.heat(p),b:1,sz:10.5}; })).concat([{t:h.nf(M.entries,0),bg:"#D5E2F0",b:1}])});
    return table(cols, rows, w);
  }
  function lmTable(M, list, w, rh){
    var h=H(), ULPS=h.ULPS, dd=function(v){ return h.nf(v, Math.abs(v%1)<0.005?0:2); };
    var cols=[{w:300},{w:62},{w:86},{w:86},{w:86},{w:78}].concat(ULPS.map(function(){return {w:74};}));
    var rows=[{h:30,cells:[hdr("Lead Measure"),hdr("Satuan"),hdr("Target 2026"),hdr("Target s/d "+h.BL3[M.cur]),hdr("Realisasi"),hdr("Capaian",{bg:"#123A63"})].concat(ULPS.map(function(u){ return {t:h.title(u),bg:h.UCLR[u],c:"#FFFFFF",b:1,sz:10.5}; }))}];
    var lastK=null;
    list.forEach(function(r){
      if(r.kel!==lastK){ lastK=r.kel; rows.push({h:rh*0.85,cells:[{t:(KEL_LBL[r.kel]||r.kel).toUpperCase(),al:"left",b:1,c:"#FFFFFF",bg:KEL_CLR[r.kel]||"#7F8C9D",cs:6+ULPS.length,sz:10.5}].concat(Array(5+ULPS.length).fill({skip:1}))}); }
      rows.push({h:rh,sz:10.5,cells:[{t:r.lm,al:"left",bg:"#FFFFFF"},{t:r.sat||"",c:h.C.MUTED},{t:dd(r.yr),bg:"#F7F9FC"},{t:dd(r.cum),bg:"#F2F4F7",c:h.C.MUTED},{t:dd(r.real),b:1,bg:"#EAF1F9"},pcell(r.p)]
        .concat(ULPS.map(function(u){ return r.u[u].y>0 ? pcell(r.u[u].p,{sz:10}) : {t:"–",bg:"#F7F9FC",c:"#9AA6B4"}; }))});
    });
    return table(cols, rows, w);
  }
  // Realisasi bulanan lead measure untuk satu ULP: sel bulan berwarna = capaian bulan tsb thd target bulanan ULP
  function lmMonthTable(M, u, list, w, rh){
    var h=H(), nd=function(v){ return v ? h.nf(v, Math.abs(v%1)<0.005?0:(v>=100?0:1)) : "–"; };
    var mw=Math.max(46, Math.min(70, 640/M.nM));
    var cols=[{w:250},{w:52},{w:66}].concat(M.months.map(function(){return {w:mw};})).concat([{w:74},{w:68}]);
    var head=[hdr("Lead Measure"),hdr("Satuan"),hdr("Target/bln",{bg:"#123A63"})].concat(M.months.map(function(m){ return hdr(h.BL3[m],{bg:m===M.cur?h.UCLR[u]:"#0B3C6E"}); })).concat([hdr("Total s/d",{bg:"#123A63"}),hdr("Capaian",{bg:"#123A63"})]);
    var rows=[{h:30,cells:head}], lastK=null, span=cols.length;
    list.forEach(function(r){
      var x=r.u[u], tb=x.y/12;
      if(r.kel!==lastK){ lastK=r.kel; rows.push({h:rh*0.82,cells:[{t:(KEL_LBL[r.kel]||r.kel).toUpperCase(),al:"left",b:1,c:"#FFFFFF",bg:KEL_CLR[r.kel]||"#7F8C9D",cs:span,sz:10}].concat(Array(span-1).fill({skip:1}))}); }
      rows.push({h:rh,sz:10,cells:[{t:r.lm,al:"left"},{t:r.sat||"",c:h.C.MUTED},{t:tb>0?nd(tb):"–",bg:"#F2F4F7",c:h.C.MUTED}]
        .concat(M.months.map(function(m){ var v=x.mon[m]; return {t:nd(v),bg:tb>0?(v>0?h.heat(v/tb*100):"#FBE3E2"):(v>0?"#EAF1F9":"#F7F9FC"),c:v>0?h.C.INK:"#9AA6B4",b:m===M.cur?1:0,sz:9.5}; }))
        .concat([{t:nd(x.real),b:1,bg:"#EAF1F9"},x.y>0?pcell(x.p,{sz:10}):{t:"–",bg:"#F7F9FC",c:"#9AA6B4"}])});
    });
    return table(cols, rows, w);
  }
  function ulpPanel(M, u, w, hh){
    var h=H(), c=h.newCanvas(w,hh), g=c.g, U=M.U[u], col=h.UCLR[u];
    g.fillStyle="#FFFFFF"; h.rr(g,0.5,0.5,w-1,hh-1,8); g.fill(); g.strokeStyle="#D6DEE8"; g.lineWidth=1; g.stroke();
    g.save(); h.rr(g,0.5,0.5,w-1,30,8); g.clip(); g.fillStyle=col; g.fillRect(0,0,w,30); g.restore(); g.fillStyle=col; g.fillRect(0.5,20,w-1,10);
    h.txt(g,"ULP "+u,12,20,{sz:14,b:1,c:"#FFFFFF"}); h.txt(g,U.nB+" lead measure bertarget",w-12,20,{sz:11,c:"#FFFFFF",al:"right"});
    var sx=[10,w*0.36,w*0.68], sy=40;
    function st(x,l,v,un,p,sub){ h.txt(g,l,x,sy+11,{sz:10.5,c:h.C.MUTED,b:1}); var vw=h.txt(g,v,x,sy+33,{sz:21,b:1,c:h.C.INK}); h.txt(g,un,x+vw+4,sy+33,{sz:11,c:h.C.MUTED});
      if(p!=null){ var pw=46; g.fillStyle=h.heat(p); h.rr(g,x,sy+39,pw,15,7); g.fill(); h.txt(g,h.pc(p),x+pw/2,sy+47,{sz:10,b:1,al:"center",bl:"middle"}); h.txt(g,sub||"",x+pw+5,sy+47,{sz:9.5,c:h.C.MUTED,bl:"middle"}); }
      else if(sub) h.txt(g,sub,x,sy+48,{sz:9.5,c:h.C.MUTED,bl:"middle"}); }
    st(sx[0],"CAPAIAN RATA-RATA",h.pc(U.p),"",U.p,"thd 2026: "+h.pc(U.pY));
    st(sx[1],"LM TUNTAS",U.nT+"/"+U.nB,"LM",U.nB?U.nT/U.nB*100:null,U.nA+" ada realisasi");
    st(sx[2],"ENTRI s/d "+h.BL3[M.cur].toUpperCase(),h.nf(U.n,0),"entri",null,h.BULAN[M.cur]+": "+U.nMon[M.cur]+" entri");
    var chY=sy+62, chH=hh-chY-34;
    var chart=h.chartCanvas({type:"bar",data:{labels:M.months.map(function(m){return h.BL3[m];}),datasets:[
        {type:"bar",label:"Entri",data:M.months.map(function(m){return U.nMon[m];}),backgroundColor:M.months.map(function(m){return m===M.cur?col:h.hexA(col,0.55);}),borderRadius:3,maxBarThickness:26,yAxisID:"y",order:2},
        {type:"line",label:"Capaian bulanan (%)",data:U.pMon.map(function(v){return v==null?null:+v.toFixed(1);}),borderColor:"#C62828",backgroundColor:"#C62828",borderWidth:1.8,pointRadius:2.5,tension:.3,yAxisID:"y2",order:1}]},
      options:{layout:{padding:{top:14,right:4}},plugins:{legend:{position:"top",align:"end",labels:{boxWidth:9,boxHeight:9,font:{size:9.5}}},vlab:{mode:"bar",size:9,fmt:function(v){return h.nf(v,0);}}},
        scales:{x:{grid:{display:false},ticks:{font:{size:9.5}}},y:{beginAtZero:true,grace:"15%",title:{display:true,text:"entri",font:{size:9}},ticks:{font:{size:9}},grid:{color:"#EEF2F6"}},y2:{position:"right",beginAtZero:true,suggestedMax:100,ticks:{font:{size:9},callback:function(v){return v+"%";}},grid:{display:false}}}}},
      Math.round(w-16), Math.round(chH));
    g.drawImage(chart,8,chY,w-16,chH);
    g.fillStyle="#FDF1F0"; h.rr(g,8,hh-30,w-16,24,5); g.fill();
    var tx=h.txt(g,"Prioritas: ",16,hh-14,{sz:10.5,b:1,c:"#B3261E"});
    h.txt(g,U.low.length?U.low.map(function(r){ return r.lm+" ("+h.pc(r.u[u].p)+")"; }).join("  ·  "):"-",16+tx,hh-14,{sz:10.5,c:h.C.INK,max:w-40-tx});
    return c.cv;
  }

  /* ---------- analisa ---------- */
  function findings(M){
    var h=H(), ULPS=h.ULPS, per=h.BULAN[M.cur]+" 2026", f=[], r=[], ideal=M.nM/12*100;
    f.push("Rata-rata capaian "+M.nB+" lead measure bertarget s/d "+per+" sebesar "+h.pc(M.p)+" terhadap target kumulatif ("+h.pc(M.pY)+" terhadap target 2026; ideal "+h.pc(ideal)+").");
    f.push(M.nT+" dari "+M.nB+" lead measure telah mencapai ≥100% target kumulatif; "+M.zero.length+" lead measure belum memiliki realisasi.");
    var rk=ULPS.slice().sort(function(a,b){ return (M.U[b].p||0)-(M.U[a].p||0); });
    f.push("Capaian tertinggi ULP "+h.title(rk[0])+" ("+h.pc(M.U[rk[0]].p)+"), terendah ULP "+h.title(rk[3])+" ("+h.pc(M.U[rk[3]].p)+").");
    var kr=M.kels.slice().sort(function(a,b){ return (M.KEL[a].p||0)-(M.KEL[b].p||0); });
    if(kr.length) f.push("Kelompok dengan capaian terendah: "+(KEL_LBL[kr[0]]||kr[0])+" ("+h.pc(M.KEL[kr[0]].p)+"); tertinggi: "+(KEL_LBL[kr[kr.length-1]]||kr[kr.length-1])+" ("+h.pc(M.KEL[kr[kr.length-1]].p)+").");
    f.push("Total "+h.nf(M.entries,0)+" entri realisasi pekerjaan s/d "+per+"; "+h.BULAN[M.cur]+" "+M.nMon[M.cur]+" entri"+(M.cur>0?" ("+(M.nMon[M.cur]>=M.nMon[M.cur-1]?"naik":"turun")+" dari "+M.nMon[M.cur-1]+" entri pada "+h.BULAN[M.cur-1]+")":"")+".");
    if(M.vendors.length) f.push("Mitra dengan entri terbanyak: "+h.title(M.vendors[0].ven)+" ("+h.nf(M.vendors[0].n,0)+" entri, "+h.pc(M.vendors[0].n/M.entries*100)+").");
    ULPS.forEach(function(u){ var U=M.U[u]; if(U.p!=null && U.p<70 && U.low.length) r.push("ULP "+h.title(u)+" (capaian "+h.pc(U.p)+"): prioritaskan "+U.low.map(function(x){ return x.lm+" ("+h.pc(x.u[u].p)+")"; }).join(", ")+"."); });
    if(M.zero.length) r.push("Mulai pelaksanaan "+M.zero.length+" lead measure yang belum ada realisasi, a.l. "+M.zero.slice(0,4).map(function(x){return x.lm;}).join(", ")+(M.zero.length>4?" dan lainnya":"")+".");
    var kl=M.kels.filter(function(k){ return M.KEL[k].p!=null && M.KEL[k].p<60; });
    if(kl.length) r.push("Susun jadwal percepatan kelompok "+kl.map(function(k){return KEL_LBL[k]||k;}).join(", ")+" bersama mitra pelaksana; pantau mingguan hingga akhir tahun.");
    if(M.noTgt.length) r.push(M.noTgt.length+" jenis pekerjaan direalisasikan tanpa target workplan (a.l. "+M.noTgt.slice(0,3).map(function(x){return x.lm;}).join(", ")+") — selaraskan penamaan lead measure atau tetapkan targetnya.");
    if(M.pY!=null && M.pY<ideal*0.8) r.push("Capaian terhadap target 2026 ("+h.pc(M.pY)+") di bawah jalur ideal ("+h.pc(ideal)+"); perlu penambahan volume pekerjaan "+(11-M.cur)+" bulan tersisa.");
    if(!r.length) r.push("Seluruh ULP berada pada jalur target; pertahankan ritme pelaksanaan dan kelengkapan pelaporan WAG.");
    return {f:f, r:r};
  }

  /* ---------- build ---------- */
  async function build(JSZip, now, progress){
    var say=typeof progress==="function"?progress:function(){}, h=H();
    if(!window.Chart) throw new Error("Pustaka grafik (Chart.js) belum termuat");
    if(!window.Workplan || !window.Workplan.ensure) throw new Error("Modul data Workplan belum termuat");
    say("Memuat data Workplan…"); await window.Workplan.ensure();
    var M=model(now); if(!M.LM.length) throw new Error("Data target Workplan gagal dimuat dari spreadsheet — periksa koneksi lalu coba lagi");
    h.baseFont();
    var G=h.G, X0=G.X0, W0=G.W0, Y0=G.Y0, H0=G.H0, PX=G.PX, per=h.BULAN[M.cur]+" 2026", PER=" s/d "+per.toUpperCase();
    var DK=await h.deck(JSZip, now, ["Paparan Realisasi Workplan","Pemeliharaan Distribusi UP3 Sorong"], "wp", say), S=DK.S, putImg=DK.putImg, put=DK.put, s;

    // 2. Ringkasan
    say("Menyusun ringkasan…");
    s=S("RINGKASAN REALISASI WORKPLAN"+PER);
    var gx=150000, hw2=(W0-gx)/2, ph1=3900000, ry=Y0+ph1+110000, rh2=Y0+H0-ry;
    await putImg(s, heroUP3(M,hw2/PX,ph1/PX), X0, Y0, hw2, ph1, "Infografis UP3");
    await putImg(s, heroULP(M,hw2/PX,ph1/PX), X0+hw2+gx, Y0, hw2, ph1, "Capaian per ULP");
    var tw=6900000; await putImg(s, trendChart(M,tw/PX,rh2/PX), X0, ry, tw, rh2, "Tren entri & capaian");
    await putImg(s, kelDonut(M,(W0-tw-gx)/PX,rh2/PX), X0+tw+gx, ry, W0-tw-gx, rh2, "Komposisi kelompok");

    // 3. Matriks capaian
    say("Menyusun matriks capaian…");
    s=S("CAPAIAN WORKPLAN PER ULP & KELOMPOK"+PER);
    var mk=matrixKel(M, W0/PX), mm=matrixMon(M, W0/PX), cap1=300000, gp=170000;
    var sc=Math.min(1,(H0-2*cap1-gp-230000)/((mk.h+mm.h)*PX));
    put(s, h.caption(s.id, X0, Y0, W0, "Rata-rata Capaian per Kelompok × ULP", "% terhadap target kumulatif s/d "+h.BL3[M.cur]+" · dibatasi 150% per lead measure"),1);
    await putImg(s, mk.cv, X0, Y0+cap1, mk.w*PX*sc, mk.h*PX*sc, "Matriks kelompok");
    var y2=Y0+cap1+mk.h*PX*sc+gp;
    put(s, h.caption(s.id, X0, y2, W0, "Capaian Bulanan per ULP", "rata-rata capaian bulanan (%) · jumlah entri"),1);
    await putImg(s, mm.cv, X0, y2+cap1, mm.w*PX*sc, mm.h*PX*sc, "Matriks bulanan");
    put(s, h.shape(s.id, X0, y2+cap1+mm.h*PX*sc+60000, W0, 230000, {ins:0, paras:h.para(h.run("Skala warna capaian: ",{sz:900,b:1,c:"5B6573"})+h.run("■ ",{sz:1000,c:"F8696B"})+h.run("0%   ",{sz:900,c:"5B6573"})+h.run("■ ",{sz:1000,c:"FFEB84"})+h.run("50%   ",{sz:900,c:"5B6573"})+h.run("■ ",{sz:1000,c:"63BE7B"})+h.run("≥100%     Target bulanan = target tahunan workplan ÷ 12",{sz:900,c:"5B6573"}))}),1);

    // 4. Panel per ULP
    say("Menyusun panel tiap ULP…");
    s=S("KINERJA WORKPLAN PER ULP"+PER);
    var pg=120000, pw=(W0-pg)/2, ph=(H0-pg)/2;
    for(var i=0;i<4;i++) await putImg(s, ulpPanel(M,h.ULPS[i],pw/PX,ph/PX), X0+(i%2)*(pw+pg), Y0+Math.floor(i/2)*(ph+pg), pw, ph, "Panel "+h.ULPS[i]);

    // 5. Rekap lead measure (berhalaman)
    say("Menyusun rekap lead measure…");
    var pages=Math.ceil(M.LM.length/ROWS_PER_PAGE);
    for(var p=0;p<pages;p++){
      var part=M.LM.slice(p*ROWS_PER_PAGE,(p+1)*ROWS_PER_PAGE);
      s=S("REKAP LEAD MEASURE WORKPLAN"+PER+(pages>1?" ("+(p+1)+"/"+pages+")":""));
      var lt=lmTable(M, part, W0/PX, 28), k2=Math.min(1,(H0-260000)/(lt.h*PX));
      await putImg(s, lt.cv, X0, Y0, lt.w*PX*k2, lt.h*PX*k2, "Rekap lead measure");
      put(s, h.shape(s.id, X0, Y0+lt.h*PX*k2+50000, W0, 220000, {ins:0, paras:h.para(h.run("Target & realisasi agregat UP3 (jumlah 4 ULP). Kolom ULP = capaian terhadap target kumulatif ULP; – = tidak ada target.",{sz:900,c:"5B6573"}))}),1);
    }

    // 5b. Realisasi bulanan lead measure per ULP (berhalaman)
    say("Menyusun realisasi bulanan lead measure per ULP…");
    var MROWS=18;
    for(var ui=0; ui<h.ULPS.length; ui++){
      var u=h.ULPS[ui], lst=M.LM.filter(function(r){ return r.u[u].y>0 || r.u[u].real>0; });
      if(!lst.length) continue;
      var pgs=Math.ceil(lst.length/MROWS);
      for(var q=0;q<pgs;q++){
        s=S("REALISASI BULANAN LM — ULP "+u+(pgs>1?" ("+(q+1)+"/"+pgs+")":""));
        var mt=lmMonthTable(M, u, lst.slice(q*MROWS,(q+1)*MROWS), W0/PX, 26), k3=Math.min(1,(H0-260000)/(mt.h*PX));
        await putImg(s, mt.cv, X0, Y0, mt.w*PX*k3, mt.h*PX*k3, "Realisasi bulanan "+u);
        var U=M.U[u];
        put(s, h.shape(s.id, X0, Y0+mt.h*PX*k3+50000, W0, 230000, {ins:0, paras:h.para(
          h.run("ULP "+h.title(u)+": ",{sz:900,b:1,c:h.UCLR[u].replace("#","")})+
          h.run("capaian rata-rata "+h.pc(U.p)+" · "+U.nT+"/"+U.nB+" LM tuntas · "+h.nf(U.n,0)+" entri s/d "+h.BL3[M.cur]+".   Warna sel bulan = realisasi bulan tsb ÷ target bulanan ULP (target tahunan ÷ 12); merah muda = belum ada realisasi.",{sz:900,c:"5B6573"}))}),1);
      }
    }

    // 6. Lead measure prioritas & mitra
    say("Menyusun grafik prioritas & mitra…");
    s=S("LEAD MEASURE PRIORITAS & MITRA PELAKSANA");
    var low=M.LM.filter(function(r){return r.p!=null;}).sort(function(a,b){return a.p-b.p;}).slice(0,10), lw=6400000, rx=X0+lw+250000, rw=W0-lw-250000;
    put(s, h.caption(s.id, X0, Y0, lw, "10 Lead Measure dengan Capaian Terendah", "% target kumulatif UP3 s/d "+h.BL3[M.cur]),1);
    var cL=h.chartCanvas({type:"bar",data:{labels:low.map(function(r){ return r.lm.length>38?r.lm.slice(0,37)+"…":r.lm; }),datasets:[{label:"Capaian",data:low.map(function(r){return +Math.min(150,r.p).toFixed(1);}),backgroundColor:low.map(function(r){return h.heat(r.p);}),borderColor:low.map(function(r){return h.hexA("#000000",0.15);}),borderWidth:1,borderRadius:3,maxBarThickness:24}]},
      options:{indexAxis:"y",layout:{padding:{right:150}},plugins:{legend:{display:false},vlab:{mode:"hbar",size:10.5,fmt:function(v,j){ var r=low[j]; return h.pc(r.p)+" · "+h.nf(r.real,Math.abs(r.real%1)<0.005?0:1)+"/"+h.nf(r.cum,Math.abs(r.cum%1)<0.005?0:1)+" "+(r.sat||""); }}},
        scales:{x:{beginAtZero:true,suggestedMax:100,grid:{color:"#EEF2F6"},ticks:{callback:function(v){return v+"%";},font:{size:10}}},y:{grid:{display:false},ticks:{font:{size:10.5,weight:"bold"},color:h.C.INK}}}}}, lw/PX, (H0-300000)/PX);
    await putImg(s, cL, X0, Y0+300000, lw, H0-300000, "LM prioritas");
    put(s, h.caption(s.id, rx, Y0, rw, "Entri Pekerjaan per Mitra Pelaksana", "warna = ULP"),1);
    var V=M.vendors.slice(0,8);
    if(V.length){
      var cV=h.chartCanvas({type:"bar",data:{labels:V.map(function(v){ var t=h.title(v.ven); return t.length>26?t.slice(0,25)+"…":t; }),datasets:h.ULPS.map(function(u){ return {label:h.title(u),data:V.map(function(v){return v.u[u]||0;}),backgroundColor:h.UCLR[u],stack:"v",borderRadius:2,maxBarThickness:28}; })},
        options:{indexAxis:"y",layout:{padding:{right:40}},plugins:{legend:{position:"bottom",labels:{boxWidth:10,font:{size:10.5}}},vlab:{mode:"none"}},scales:{x:{stacked:true,beginAtZero:true,grid:{color:"#EEF2F6"}},y:{stacked:true,grid:{display:false},ticks:{font:{size:10.5,weight:"bold"},color:h.C.INK}}}},
        plugins:[{id:"vt",afterDatasetsDraw:function(c){ var g=c.ctx; g.save(); g.font="bold 11px "+h.C.FONT; g.fillStyle=h.C.INK; g.textBaseline="middle"; V.forEach(function(v,j){ var mx=null; c.data.datasets.forEach(function(d,i){ var el=c.getDatasetMeta(i).data[j]; if(el&&(mx===null||el.x>mx.x)) mx=el; }); if(mx) g.fillText(h.nf(v.n,0),mx.x+5,mx.y); }); g.restore(); }}]}, rw/PX, (H0-300000)/PX);
      await putImg(s, cV, rx, Y0+300000, rw, H0-300000, "Mitra");
    }

    // 7. Catatan & tindak lanjut
    s=S("CATATAN CAPAIAN & TINDAK LANJUT");
    var F=findings(M), hw=(W0-200000)/2;
    put(s, h.shape(s.id, X0, Y0, hw, 420000, {fill:h.C.NAVY,anchor:"ctr",paras:h.para(h.run("CATATAN CAPAIAN s/d "+per.toUpperCase(),{sz:1400,b:1,c:"FFFFFF"}))}),1);
    put(s, h.shape(s.id, X0+hw+200000, Y0, hw, 420000, {fill:"#E9A700",anchor:"ctr",paras:h.para(h.run("REKOMENDASI TINDAK LANJUT",{sz:1400,b:1,c:"FFFFFF"}))}),1);
    put(s, h.shape(s.id, X0, Y0+420000, hw, H0-420000, {fill:"#F4F7FB",line:"#DCE4ED",ins:150000,paras:F.f.map(function(t){ return h.para(h.run(t,{sz:1150}),{bu:1,buc:"0067AC",aft:800}); }).join("")}),1);
    put(s, h.shape(s.id, X0+hw+200000, Y0+420000, hw, H0-420000, {fill:"#FFF9E8",line:"#F3DFA6",ins:150000,paras:F.r.map(function(t){ return h.para(h.run(t,{sz:1150}),{bu:1,buc:"E9A700",aft:800}); }).join("")}),1);

    var blob=await DK.finish();
    return {blob:blob, name:"Paparan Realisasi Workplan UP3 Sorong s.d "+h.BULAN[M.cur]+" 2026.pptx", slides:DK.count()};
  }

  window.WPPPT = { build: build, _model: model };
})();
