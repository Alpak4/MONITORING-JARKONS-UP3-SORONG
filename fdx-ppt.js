/* Ekspor PPT khusus Monitoring 4DX — format mengikuti template PPT_Workplan_HAR (js/fdx-template.js)
   Slide 1  : Cover (bulan laporan otomatis)
   Slide 2  : Monitoring WIG Keandalan (HAR) — Jan–Jun, Jul–Des, rekap 2026/SMT 1/SMT 2 (data live WIG)
   Slide 3+ : Monitoring Pelaporan Realisasi Workplan ULP pada WAG (HAR) — 2 panel/slide, Januari s/d bulan filter 4DX + kumulatif
   Tabel dirender menjadi gambar resolusi tinggi agar tata letak identik dengan template. */
(function(){
  var TEMPLATE = "fdx-template.js";
  var BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  var BL3 = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  var ULPS = ["SORONG KOTA","AIMAS","TEMINABUAN","WAISAI"];
  var ULP_BG = {"SORONG KOTA":"#FFFF00","AIMAS":"#00FF00","TEMINABUAN":"#FF0000","WAISAI":"#00FFFF"};
  var KEL_LBL = {"GARDU":"GARDU DIST"};
  var SC = 2;                       // faktor ketajaman gambar (±285 dpi di slide)
  var FONT = "Calibri, Carlito, Arial, sans-serif";
  var GRID = "#8C8C8C";
  // Area gambar sesuai template (EMU)
  var BOX_WIG1 = {x:2064543, y:793623,  w:8469313, h:3584575};
  var BOX_WIG2 = {x:2063750, y:4430713, w:5205413, h:1933575};
  var BOX_WP = [{x:345349, y:806238, w:8119872, h:2876163},{x:345349, y:3732409, w:8128091, h:2876163}];
  var LBL_X = 8701115, LBL_H = 350523, LBL_H2 = 648145;

  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,""); }
  function nf(n, d){
    if(n==null || !isFinite(n)) return "-";
    if(Math.abs(n%1)<0.005) return Math.round(n).toLocaleString("id-ID");
    return n.toLocaleString("id-ID",{minimumFractionDigits:d==null?2:d, maximumFractionDigits:d==null?2:d});
  }
  function pf(p){ return p==null ? "-" : p.toLocaleString("id-ID",{minimumFractionDigits:1,maximumFractionDigits:1})+"%"; }
  // Skala warna 3 titik ala Excel: 0% merah → 50% kuning → ≥100% hijau
  function heat(p){
    if(p==null) return "#D9D9D9";
    var lo=[248,105,107], mid=[255,235,132], hi=[99,190,123], t=Math.max(0,Math.min(100,p)), a, b, k;
    if(t<50){ a=lo; b=mid; k=t/50; } else { a=mid; b=hi; k=(t-50)/50; }
    return "rgb("+a.map(function(v,i){ return Math.round(v+(b[i]-v)*k); }).join(",")+")";
  }

  /* ---------- Penggambar tabel (canvas) ---------- */
  function drawTable(spec){
    var cols=spec.cols, W=cols.reduce(function(a,b){return a+b;},0);
    var xs=[0]; cols.forEach(function(w,i){ xs.push(xs[i]+w); });
    var ys=[0]; spec.rows.forEach(function(r,i){ ys.push(ys[i]+r.h); });
    var H=ys[ys.length-1];
    var cv=document.createElement("canvas"); cv.width=Math.ceil(W*SC); cv.height=Math.ceil(H*SC);
    var g=cv.getContext("2d"); g.scale(SC,SC);
    g.fillStyle="#FFFFFF"; g.fillRect(0,0,W,H);
    var occ=spec.rows.map(function(){ return []; }), cells=[];
    spec.rows.forEach(function(r, ri){
      var c=0;
      r.cells.forEach(function(cell){
        while(occ[ri][c]) c++;
        var cs=cell.cs||1, rs=cell.rs||1;
        for(var a=0;a<rs;a++) for(var b=0;b<cs;b++){ if(occ[ri+a]) occ[ri+a][c+b]=1; }
        cells.push({cell:cell, x:xs[c], y:ys[ri], w:xs[c+cs]-xs[c], h:ys[Math.min(ri+rs, ys.length-1)]-ys[ri], sz:cell.sz||r.sz||11});
        c+=cs;
      });
    });
    cells.forEach(function(o){
      var cl=o.cell;
      g.fillStyle=cl.bg||"#FFFFFF"; g.fillRect(o.x,o.y,o.w,o.h);
      var t=cl.t==null?"":String(cl.t);
      if(t){
        g.save(); g.beginPath(); g.rect(o.x+1,o.y,o.w-2,o.h); g.clip();
        g.fillStyle=cl.fg||"#000000"; g.font=(cl.b?"bold ":"")+o.sz+"px "+FONT; g.textBaseline="middle";
        var pad=3, al=cl.al||"c", maxW=o.w-pad*2, lines=t.split("\n");
        lines=lines.map(function(s){ if(g.measureText(s).width<=maxW) return s; while(s.length>1 && g.measureText(s+"…").width>maxW) s=s.slice(0,-1); return s+"…"; });
        var lh=o.sz*1.15, y0=o.y+o.h/2-(lines.length-1)*lh/2;
        lines.forEach(function(s,i){
          var w=g.measureText(s).width, x=al==="l"?o.x+pad:(al==="r"?o.x+o.w-pad-w:o.x+(o.w-w)/2);
          g.fillText(s, x, y0+i*lh);
        });
        g.restore();
      }
    });
    g.strokeStyle=spec.grid||GRID; g.lineWidth=0.6;
    cells.forEach(function(o){ g.strokeRect(o.x+0.3,o.y+0.3,o.w-0.6,o.h-0.6); });
    g.lineWidth=1.2; g.strokeRect(0.6,0.6,W-1.2,H-1.2);
    return cv;
  }
  function stack(cvs, gap){
    var w=Math.max.apply(null, cvs.map(function(c){return c.width;})), h=cvs.reduce(function(a,c){return a+c.height;},0)+gap*SC*(cvs.length-1);
    var out=document.createElement("canvas"); out.width=w; out.height=h;
    var g=out.getContext("2d"); g.fillStyle="#FFFFFF"; g.fillRect(0,0,w,h);
    var y=0; cvs.forEach(function(c){ g.drawImage(c,0,y); y+=c.height+gap*SC; });
    return out;
  }
  function png(cv){
    return new Promise(function(res, rej){ cv.toBlob(function(b){ if(!b) return rej(new Error("Gagal membuat gambar tabel")); b.arrayBuffer().then(function(ab){ res(new Uint8Array(ab)); }, rej); }, "image/png"); });
  }
  // Tinggi baris agar rasio gambar mendekati rasio kotak template
  function rowH(W, box, headH, n, gaps, lo, hi){ var h=(W*box.h/box.w - headH - (gaps||0))/Math.max(1,n); return Math.max(lo, Math.min(hi, h)); }

  /* ---------- WIG Keandalan ---------- */
  var HDR_WIG = "#9DC3E6", TGT_BG = "#E7E6E6";
  function wigHalf(W, from, to, rh){
    var cols=[30,178]; for(var m=from;m<=to;m++) cols.push(52,64,54);
    var h1={h:20, sz:11, cells:[{t:"NO",rs:2,bg:HDR_WIG,b:1},{t:"Kegiatan",rs:2,bg:HDR_WIG,b:1}]};
    var h2={h:17, sz:9.5, cells:[]};
    for(m=from;m<=to;m++){ h1.cells.push({t:BL3[m]+"-26",cs:3,bg:HDR_WIG,b:1}); h2.cells.push({t:"Target",bg:HDR_WIG,b:1},{t:"Realisasi",bg:HDR_WIG,b:1},{t:"%",bg:HDR_WIG,b:1}); }
    var rows=[h1,h2], fs=Math.max(8, Math.min(11, rh*0.55));
    W.rows.forEach(function(r){
      var t=W.tgt[r.no], rr=W.real[r.no]||[], row={h:rh, sz:fs, cells:[{t:r.no,b:1},{t:r.nama,b:1,al:"l"}]};
      for(var m=from;m<=to;m++){
        var v=rr[m]==null?null:rr[m], p=(t==null||!t)?null:(v==null?0:v/t*100);
        row.cells.push({t:t==null?"-":nf(t,1),bg:TGT_BG,al:"r"},{t:v==null?"":nf(v,1),al:"r"},{t:pf(p),bg:heat(p),al:"r"});
      }
      rows.push(row);
    });
    return drawTable({cols:cols, rows:rows});
  }
  function wigRecap(W, rh){
    var groups=[[1,2],[3],[4,5],[6],[7],[8],[9],[10],[11]];
    var cols=[30,178,60,72,62,60,72,62,60,72,62];
    var segs=[{l:"2026",a:0,b:11},{l:"SMT 1 2026",a:0,b:5},{l:"SMT 2 2026",a:6,b:11}];
    var h1={h:20, sz:11, cells:[{t:"NO",rs:2,bg:HDR_WIG,b:1},{t:"Kegiatan",rs:2,bg:HDR_WIG,b:1}]}, h2={h:17, sz:9.5, cells:[]};
    segs.forEach(function(s){ h1.cells.push({t:s.l,cs:3,bg:HDR_WIG,b:1}); h2.cells.push({t:"Target",bg:HDR_WIG,b:1},{t:"Realisasi",bg:HDR_WIG,b:1},{t:"%",bg:HDR_WIG,b:1}); });
    var rows=[h1,h2], byNo={}, fs=Math.max(8, Math.min(11, rh*0.55));
    W.rows.forEach(function(r){ byNo[r.no]=r; });
    groups.forEach(function(gp){
      var vals=segs.map(function(s){
        var tt=null, rr=null;
        gp.forEach(function(no){
          var t=W.tgt[no], re=W.real[no]||[];
          if(t!=null) tt=(tt||0)+t*(s.b-s.a+1);
          for(var m=s.a;m<=s.b;m++) if(re[m]!=null) rr=(rr||0)+re[m];
        });
        return {t:tt, r:rr, p:(tt==null||!tt)?null:(rr==null?0:rr/tt*100)};
      });
      gp.forEach(function(no, k){
        var row={h:rh, sz:fs, cells:[{t:no,b:1},{t:(byNo[no]||{}).nama||"",b:1,al:"l"}]};
        if(k===0) vals.forEach(function(v){ var rs=gp.length;
          row.cells.push({t:v.t==null?"-":nf(v.t,0),bg:TGT_BG,al:"r",rs:rs},{t:v.r==null?"-":nf(v.r,2),al:"r",rs:rs},{t:pf(v.p),bg:heat(v.p),al:"r",rs:rs}); });
        rows.push(row);
      });
    });
    return drawTable({cols:cols, rows:rows});
  }

  /* ---------- Workplan ULP ---------- */
  var HDR_WP = "#4BACC6", SUB_WP = "#5B9BD5";
  function wpModel(P, cur){
    var idx={}, extra={}, list=[];
    P.REAL.forEach(function(d){
      if(d.bulan<0 || d.bulan>cur || ULPS.indexOf(d.ulp)<0) return;
      var k=d.key+"|"+d.ulp+"|"+d.bulan; idx[k]=(idx[k]||0)+d.jumlah;
      if(!extra[d.key]) extra[d.key]={kelompok:d.kelompok, program:"", lm:d.lm, key:d.key, satuan:d.satuan, tg:{}};
    });
    var seen={};
    P.TARGET.forEach(function(t){ if(seen[t.key]) return; seen[t.key]=1; var tot=ULPS.reduce(function(a,u){return a+(t.tg[u]||0);},0); if(tot>0 || extra[t.key]) list.push(t); });
    Object.keys(extra).forEach(function(k){ if(!seen[k]){ seen[k]=1; list.push(extra[k]); } });
    var ord=P.KEL_ORDER||[];
    list=list.map(function(r,i){ var o=ord.indexOf(r.kelompok); return {r:r,o:o<0?99:o,i:i}; }).sort(function(a,b){ return (a.o-b.o)||(a.i-b.i); }).map(function(x){ return x.r; });
    function real(key,u,a,b){ var s=0; for(var m=a;m<=b;m++) s+=idx[key+"|"+u+"|"+m]||0; return s; }
    return {list:list, real:real};
  }
  function wpTable(MD, a, b, months, rh){
    var cols=[86,128,206,54]; ULPS.forEach(function(){ cols.push(60,52,54); });
    var h1={h:19, sz:11.5, cells:[{t:"KELOMPOK",rs:2,bg:HDR_WP,b:1},{t:"PROGRAM",rs:2,bg:HDR_WP,b:1},{t:"LEAD MEASURE",rs:2,bg:HDR_WP,b:1},{t:"SATUAN",rs:2,bg:HDR_WP,b:1}]};
    var h2={h:16, sz:10.5, cells:[]};
    ULPS.forEach(function(u){ h1.cells.push({t:u,cs:3,bg:ULP_BG[u],b:1}); h2.cells.push({t:"TARGET",bg:SUB_WP,b:1},{t:"REAL",bg:SUB_WP,b:1},{t:"%",bg:SUB_WP,b:1}); });
    var rows=[h1,h2], fs=Math.max(7.5, Math.min(11, rh*0.62));
    MD.list.forEach(function(t){
      var row={h:rh, sz:fs, cells:[{t:KEL_LBL[t.kelompok]||t.kelompok},{t:t.program||""},{t:t.lm,al:"l"},{t:t.satuan||""}]};
      ULPS.forEach(function(u){
        var tg=(t.tg[u]||0)/12*months, re=MD.real(t.key,u,a,b), p=tg>0?re/tg*100:null;
        row.cells.push({t:nf(tg,2)},{t:nf(re,2)},{t:p==null?(re>0?"n/a":"-"):Math.round(p)+"%",bg:heat(p)});
      });
      rows.push(row);
    });
    if(!MD.list.length) rows.push({h:24, sz:11, cells:[{t:"Belum ada data target / realisasi workplan",cs:16,fg:"#7F7F7F"}]});
    return drawTable({cols:cols, rows:rows});
  }

  /* ---------- XML helper ---------- */
  function picXml(id, rid, name, x, y, w, h){
    return '<p:pic><p:nvPicPr><p:cNvPr id="'+id+'" name="'+esc(name)+'"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="'+Math.round(x)+'" y="'+Math.round(y)+'"/><a:ext cx="'+Math.round(w)+'" cy="'+Math.round(h)+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
  }
  function imgRel(rid, target){ return '<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="'+target+'"/>'; }
  // Muat gambar ke kotak: lebar penuh, tinggi proporsional (tidak melebihi kotak), rata atas-kiri
  function place(cv, box){ var k=Math.min(box.w/cv.width, box.h/cv.height); return {x:box.x, y:box.y, w:cv.width*k, h:cv.height*k}; }

  // Template dikemas base64 (fdx-template.js) dan baru dimuat saat ekspor
  function loadTpl(){
    if(window.FDX_TPL) return Promise.resolve();
    return new Promise(function(res, rej){
      var s=document.createElement("script"); s.src=TEMPLATE+"?v=20261103a";
      s.onload=function(){ window.FDX_TPL ? res() : rej(new Error("Template PPT 4DX kosong ("+TEMPLATE+")")); };
      s.onerror=function(){ rej(new Error("Template PPT 4DX tidak ditemukan ("+TEMPLATE+")")); };
      document.head.appendChild(s);
    });
  }

  async function build(JSZip, now, progress){
    var say=typeof progress==="function"?progress:function(){};
    if(!window.WIG || !window.Workplan || !window.Workplan.ensure) throw new Error("Modul data WIG/Workplan belum termuat");
    say("Memuat data WIG Keandalan & Workplan…");
    await Promise.all([window.WIG.init(), window.Workplan.ensure()]);
    var W=window.WIG.data(), P=window.Workplan.data();
    if(!W.meta.target && !W.meta.real && !P.TARGET.length && !P.REAL.length) throw new Error("Data WIG & Workplan gagal dimuat dari spreadsheet — periksa koneksi lalu coba lagi");
    var cur=(window.FDX && window.FDX.state && window.FDX.state.bulan!=null) ? +window.FDX.state.bulan : now.getMonth();

    say("Memuat template PPT 4DX…");
    await loadTpl();
    var zip=await JSZip.loadAsync(window.FDX_TPL, {base64:true});

    // 1. Cover
    var s1=await zip.file("ppt/slides/slide1.xml").async("string");
    s1=s1.replace(/Sorong, [A-Za-z]+ 20\d\d/, "Sorong, "+BULAN[now.getMonth()]+" "+now.getFullYear());
    zip.file("ppt/slides/slide1.xml", s1);

    // 2. WIG Keandalan
    say("Menyusun tabel WIG Keandalan…");
    var nW=W.rows.length, wWig=30+178+6*170;
    var rhW=rowH(wWig, BOX_WIG1, 2*37, 2*nW, 12, 15, 26);
    var cvW1=stack([wigHalf(W,0,5,rhW), wigHalf(W,6,11,rhW)], 12);
    var wRec=30+178+3*194;
    var cvW2=wigRecap(W, rowH(wRec, BOX_WIG2, 37, nW, 0, 15, 26));
    zip.file("ppt/media/fdx_wig_1.png", await png(cvW1));
    zip.file("ppt/media/fdx_wig_2.png", await png(cvW2));
    var s2=await zip.file("ppt/slides/slide2.xml").async("string");
    var p1=place(cvW1, BOX_WIG1), p2=place(cvW2, BOX_WIG2);
    s2=s2.replace("<!--PICS-->", picXml(30,"rId30","Tabel WIG Bulanan",p1.x,p1.y,p1.w,p1.h)+picXml(31,"rId31","Tabel WIG Rekap",p2.x,p2.y,p2.w,p2.h));
    zip.file("ppt/slides/slide2.xml", s2);
    var r2=await zip.file("ppt/slides/_rels/slide2.xml.rels").async("string");
    zip.file("ppt/slides/_rels/slide2.xml.rels", r2.replace("</Relationships>", imgRel("rId30","../media/fdx_wig_1.png")+imgRel("rId31","../media/fdx_wig_2.png")+"</Relationships>"));

    // 3. Workplan ULP per bulan + kumulatif
    say("Menyusun tabel Workplan ULP per bulan…");
    var MD=wpModel(P, cur);
    var panels=[]; for(var m=0;m<=cur;m++) panels.push({lbl:BULAN[m].toUpperCase()+" 2026", a:m, b:m, n:1, cum:false});
    panels.push({lbl:"KUMULATIF S/D "+BULAN[cur].toUpperCase()+" 2026", a:0, b:cur, n:cur+1, cum:true});
    var wWp=86+128+206+54+4*166, rhP=rowH(wWp, BOX_WP[0], 35, Math.max(1,MD.list.length), 0, 12, 24);
    var proto=await zip.file("ppt/slides/slide3.xml").async("string");
    var protoRel=await zip.file("ppt/slides/_rels/slide3.xml.rels").async("string");
    var pres=await zip.file("ppt/presentation.xml").async("string");
    var presRel=await zip.file("ppt/_rels/presentation.xml.rels").async("string");
    var ct=await zip.file("[Content_Types].xml").async("string");
    var sid=Math.max.apply(null, (pres.match(/<p:sldId id="(\d+)"/g)||['id="300"']).map(function(s){ return +s.replace(/\D/g,""); }));
    var nSlides=Math.ceil(panels.length/2);
    for(var k=0;k<nSlides;k++){
      var pair=panels.slice(k*2, k*2+2), pics="", rels="", xml=proto, sn=3+k;
      for(var j=0;j<pair.length;j++){
        var pn=pair[j], cv=wpTable(MD, pn.a, pn.b, pn.n, rhP), fn="fdx_wp_"+(k*2+j+1)+".png";
        zip.file("ppt/media/"+fn, await png(cv));
        var pl=place(cv, BOX_WP[j]), lh=pn.cum?LBL_H2:LBL_H, ly=Math.round(pl.y+pl.h/2-lh/2);
        pics+=picXml(40+j,"rId"+(40+j),"Tabel Workplan "+pn.lbl,pl.x,pl.y,pl.w,pl.h);
        rels+=imgRel("rId"+(40+j),"../media/"+fn);
        xml=xml.split("{{L"+(j+1)+"}}").join(esc(pn.lbl)).split("{{Y"+(j+1)+"}}").join(String(ly)).split("{{H"+(j+1)+"}}").join(String(lh));
      }
      if(pair.length<2) xml=xml.replace(/<!--L2S-->[\s\S]*?<!--L2E-->/, "");
      xml=xml.replace(/<!--L2[SE]-->/g,"").replace("{{TITLE}}", "MONITORING PELAPORAN REALISASI WORKPLAN ULP PADA WAG (HAR)").replace("<!--PICS-->", pics);
      zip.file("ppt/slides/slide"+sn+".xml", xml);
      zip.file("ppt/slides/_rels/slide"+sn+".xml.rels", protoRel.replace("</Relationships>", rels+"</Relationships>"));
      if(k>0){
        var rid="rId"+(200+k);
        pres=pres.replace("</p:sldIdLst>", '<p:sldId id="'+(sid+k)+'" r:id="'+rid+'"/></p:sldIdLst>');
        presRel=presRel.replace("</Relationships>", '<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+sn+'.xml"/></Relationships>');
        ct=ct.replace("</Types>", '<Override PartName="/ppt/slides/slide'+sn+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>');
      }
    }
    zip.file("ppt/presentation.xml", pres);
    zip.file("ppt/_rels/presentation.xml.rels", presRel);
    zip.file("[Content_Types].xml", ct);

    say("Menyimpan berkas PPT…");
    var blob=await zip.generateAsync({type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation"});
    return {blob:blob, name:"Monitoring 4DX - WIG & Workplan HAR UP3 Sorong s.d "+BULAN[cur]+" 2026.pptx", slides:2+nSlides};
  }

  window.FDXPPT = { build: build };
})();
