/* PPT Evaluasi Gangguan JTM (FGTM) mingguan — format "Evaluasi_FGTM_M1_November - UP3 Sorong - Rev 1"
   Template: fgtm-template.js (base64, dimuat saat unduh). Data: window.GangguanData (detail gangguan),
   window.Rabas + ROWPPT (realisasi ROW). Slide tanpa sumber data di dashboard dipertahankan dari template.
   Slide 1 cover · 2 overview · 3 realisasi · 4 sebaran ULP & keypoint · 5 tren ULP · 6 tren keypoint kritis
   7 detail gangguan minggu (berhalaman) · 8–9 dokumentasi temuan · 10 evaluasi & tindak lanjut ULP
   11 realisasi pekerjaan Teminabuan (statis, tersembunyi) · 12–17 ROW · 18–21, 23 lampiran statis · 22 penutup */
(function(){
  var TEMPLATE = "fgtm-template.js";
  var BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  var BL3 = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  var ULP4 = ["Teminabuan","Aimas","Sorong Kota","Waisai"];
  var UCLR = {"Teminabuan":"C0392B","Aimas":"E8A33D","Sorong Kota":"1C7293","Waisai":"16456F"};
  var KCLR = ["16456F","1C7293","C0392B","7FA6B8","E8A33D"];
  var C_UP="C0392B", C_DOWN="2E8B57", C_FLAT="E8A33D";
  var YEAR = 2026, ROWS_PER_PAGE = 21;
  var LSKEY = "fgtm_ppt_opts_v1";
  var PPR = /<a:pPr\b[^>]*\/>|<a:pPr\b[^>]*>[\s\S]*?<\/a:pPr>/;
  var RPR = /<a:rPr\b[^>]*\/>|<a:rPr\b[^>]*>[\s\S]*?<\/a:rPr>/;
  var TINDAK = {
    E1:"Rabas/tebang pohon dan dahan dalam jarak bebas di sepanjang section; pengawasan ROW pascapekerjaan.",
    E2:"Periksa arrester dan pentanahan di titik terdampak; siagakan regu saat cuaca ekstrem.",
    E3:"Pasang cover/penghalang hewan pada tiang dan peralatan rawan; bersihkan sarang di sekitar jaringan.",
    E4:"Tertibkan layang-layang/umbul-umbul di koridor jaringan bersama aparat setempat.",
    I1:"Perbaiki/ganti komponen JTM yang rusak dan periksa komponen sejenis di section terdampak.",
    I2:"Perbaiki/ganti peralatan JTM yang rusak (FCO, isolator, konektor) dan inspeksi termovisi section terdampak.",
    I3:"Perbaiki komponen gardu yang rusak dan lakukan pemeliharaan gardu di section terdampak.",
    I4:"Perbaiki/ganti tiang dan konstruksi di titik temuan.",
    X:"Penelusuran section dan patroli malam segera setelah trip; review rekaman SCADA dan setting proteksi."
  };
  var KNAMA = {E1:"pohon",E2:"bencana alam",E3:"pihak ketiga/binatang",E4:"layang-layang/umbul-umbul",I1:"komponen JTM",I2:"peralatan JTM",I3:"komponen gardu",I4:"tiang",X:"tidak ditemukan"};

  /* ---------- util ---------- */
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,""); }
  function nf(n,d){ return (n||0).toLocaleString("id-ID",{minimumFractionDigits:d||0,maximumFractionDigits:d||0}); }
  function p1(v){ return v==null||!isFinite(v) ? "-" : nf(v,1)+"%"; }
  function p0(v){ return v==null||!isFinite(v) ? "-" : Math.round(v)+"%"; }
  function pct(a,b){ return b ? a/b*100 : null; }
  function dd(d){ return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0"); }
  function sum(a){ return a.reduce(function(x,y){return x+(y||0);},0); }
  function cap1(s){ s=String(s||"").trim().toLowerCase(); return s.charAt(0).toUpperCase()+s.slice(1); }
  function cut(s,n){ s=String(s||"").replace(/\s+/g," ").trim(); return s.length>n ? s.slice(0,n-1).replace(/[\s,;.]+$/,"")+"…" : s; }
  function short(a){ return String(a||"").replace(/\s+/g," ").trim().replace(/^Recloser\s+/i,"R. ").replace(/^Penyulang\s+/i,"P. ").replace(/^Gardu Hubung\s+/i,"GH ").replace(/^Exp(ress)?\s+/i,"Exp. "); }
  function list(a){ return a.length<=1 ? a.join("") : a.slice(0,-1).join(", ")+" dan "+a[a.length-1]; }
  var TERBILANG=["Nol","Satu","Dua","Tiga","Empat","Lima","Enam","Tujuh","Delapan","Sembilan","Sepuluh"];
  function tb(n){ return TERBILANG[n]||String(n); }
  function delta(a,b){ if(!a&&!b) return {t:"nihil",c:C_DOWN,st:"NIHIL"}; if(!a) return {t:"baru",c:C_UP,st:"NAIK"};
    var p=(b-a)/a*100; if(b===0) return {t:"−100%",c:C_DOWN,st:"NIHIL"}; if(b===a) return {t:"tetap",c:C_FLAT,st:"TETAP"};
    return b>a ? {t:"+"+Math.round(p)+"%",c:C_UP,st:"NAIK"} : {t:"−"+Math.round(-p)+"%",c:C_DOWN,st:"TURUN"}; }
  function stColor(st){ return st==="NAIK"?C_UP:(st==="TETAP"?C_FLAT:C_DOWN); }

  /* ---------- XML: ganti teks dengan tetap memakai format template ---------- */
  function rebuildP(p, strs){
    var pPr=(p.match(PPR)||[""])[0], groups=[], last=null;
    (p.match(/<a:r>[\s\S]*?<\/a:r>/g)||[]).forEach(function(r){ var x=(r.match(RPR)||["<a:rPr/>"])[0], k=x.replace(/ (err|dirty|lang)="[^"]*"/g,""); if(k!==last){ groups.push(x); last=k; } });
    if(!groups.length){ var e=(p.match(/<a:endParaRPr\b[^>]*?(\/>|>[\s\S]*?<\/a:endParaRPr>)/)||[""])[0]; groups.push(e ? e.replace("<a:endParaRPr","<a:rPr").replace("</a:endParaRPr>","</a:rPr>") : '<a:rPr lang="id-ID"/>'); }
    return "<a:p>"+pPr+strs.map(function(t,k){ return "<a:r>"+groups[Math.min(k,groups.length-1)].replace(/ err="1"/,"")+"<a:t>"+esc(t)+"</a:t></a:r>"; }).join("")+"</a:p>";
  }
  function setParas(frag, paras){
    var ps=frag.match(/<a:p>[\s\S]*?<\/a:p>/g); if(!ps) return frag;
    var out=paras.map(function(s,i){ return rebuildP(ps[Math.min(i,ps.length-1)], s); }).join("");
    var a=frag.indexOf(ps[0]), b=frag.lastIndexOf(ps[ps.length-1])+ps[ps.length-1].length;
    return frag.slice(0,a)+out+frag.slice(b);
  }
  function spRange(x, name){ var i=x.indexOf('name="'+name+'"'); if(i<0) return null; var st=x.lastIndexOf("<p:sp>",i), en=x.indexOf("</p:sp>",i)+7; return [st,en]; }
  function setShape(x, name, paras){ var r=spRange(x,name); if(!r) return x; return x.slice(0,r[0])+setParas(x.slice(r[0],r[1]), paras)+x.slice(r[1]); }
  function T(x, name, text){ return setShape(x, name, [[String(text)]]); }
  function runColor(x, name, color){ var r=spRange(x,name); if(!r) return x; var s=x.slice(r[0],r[1]).replace(/(<a:rPr\b[^>]*>\s*<a:solidFill>\s*<a:srgbClr val=")\w+/g, "$1"+color); return x.slice(0,r[0])+s+x.slice(r[1]); }
  function fill(x, name, color){ var r=spRange(x,name); if(!r) return x; var s=x.slice(r[0],r[1]).replace(/(<\/a:prstGeom>\s*<a:solidFill>\s*<a:srgbClr val=")\w+/, "$1"+color).replace(/(<\/a:custGeom>\s*<a:solidFill>\s*<a:srgbClr val=")\w+/, "$1"+color); return x.slice(0,r[0])+s+x.slice(r[1]); }
  function removeSp(x, name){ var r=spRange(x,name); return r ? x.slice(0,r[0])+x.slice(r[1]) : x; }

  /* ---------- XML: grafik native ---------- */
  function colL(i){ return String.fromCharCode(66+i); }
  function catXml(cats){ return '<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$'+(cats.length+1)+'</c:f><c:strCache><c:ptCount val="'+cats.length+'"/>'+cats.map(function(c,i){ return '<c:pt idx="'+i+'"><c:v>'+esc(c)+'</c:v></c:pt>'; }).join("")+'</c:strCache></c:strRef></c:cat>'; }
  function valXml(v,si){ return '<c:val><c:numRef><c:f>Sheet1!$'+colL(si)+'$2:$'+colL(si)+'$'+(v.length+1)+'</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="'+v.length+'"/>'+v.map(function(n,i){ return '<c:pt idx="'+i+'"><c:v>'+(+n||0)+'</c:v></c:pt>'; }).join("")+'</c:numCache></c:numRef></c:val>'; }
  function dptXml(i,color){ return '<c:dPt><c:idx val="'+i+'"/><c:invertIfNegative val="0"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="'+color+'"/></a:solidFill></c:spPr></c:dPt>'; }
  function setChart(x, cats, series, o){
    o=o||{}; var sers=x.match(/<c:ser>[\s\S]*?<\/c:ser>/g)||[]; if(!sers.length) return x; var n=cats.length;
    var out=series.map(function(sd,i){
      var s=sers[Math.min(i,sers.length-1)];
      s=s.replace(/<c:idx val="\d+"\/>(\s*)<c:order val="\d+"\/>/, '<c:idx val="'+i+'"/>$1<c:order val="'+i+'"/>');
      if(sd.name!=null) s=s.replace(/(<c:tx>[\s\S]*?<c:v>)[^<]*(<\/c:v>)/, "$1"+esc(sd.name)+"$2");
      if(sd.color) s=s.replace(/(<\/c:tx>\s*<c:spPr>\s*<a:solidFill>\s*<a:srgbClr val=")\w+/, "$1"+sd.color);
      s=s.replace(/<c:dPt>[\s\S]*?<\/c:dPt>/g, function(d){ var k=+d.match(/<c:idx val="(\d+)"/)[1]; return (o.keepDPt && k<n) ? d : ""; });
      s=s.replace(/<c:dLbl>[\s\S]*?<\/c:dLbl>/g, function(d){ var k=+d.match(/<c:idx val="(\d+)"/)[1]; return k<n ? d : ""; });
      if(sd.dpt){ var add=Object.keys(sd.dpt).filter(function(k){return +k<n;}).map(function(k){ return dptXml(+k, sd.dpt[k]); }).join("");
        var at=s.search(/<c:dLbls>|<c:cat>/); if(at>0) s=s.slice(0,at)+add+s.slice(at); }
      s=s.replace(/<c:cat>[\s\S]*?<\/c:cat>/, catXml(cats)).replace(/<c:val>[\s\S]*?<\/c:val>/, valXml(sd.vals,i));
      return s;
    });
    var a=x.indexOf(sers[0]), b=x.lastIndexOf(sers[sers.length-1])+sers[sers.length-1].length;
    return (x.slice(0,a)+out.join("")+x.slice(b)).replace(/<c:max val="[^"]*"\/>/g,"").replace(/<c:externalData[\s\S]*?<\/c:externalData>/,"");
  }

  /* ---------- XML: tabel ---------- */
  var ROWID = /<a:extLst><a:ext uri="\{0D108BD9[\s\S]*?<\/a:extLst>/g;
  function rowsOf(x){ return x.match(/<a:tr [\s\S]*?<\/a:tr>/g)||[]; }
  function fillRow(proto, vals){ var i=0; return proto.replace(ROWID,"").replace(/<a:tc\b[^>]*>[\s\S]*?<\/a:tc>/g, function(tc){ var k=i++; return k<vals.length ? setParas(tc,[[String(vals[k])]]) : tc; }); }
  function setRows(x, newRows){ var rs=rowsOf(x), a=x.indexOf(rs[0]), b=x.lastIndexOf(rs[rs.length-1])+rs[rs.length-1].length; return x.slice(0,a)+newRows.join("")+x.slice(b); }

  /* ---------- data ---------- */
  function normUlp(u){ var t=String(u||"").toLowerCase().replace(/^ulp\s+/,"").trim(); for(var i=0;i<ULP4.length;i++) if(ULP4[i].toLowerCase()===t) return ULP4[i]; return null; }
  function baseRecords(){
    var G=window.GangguanData; if(!G) return [];
    return (G.records||[]).filter(function(r){ return !r.excluded && r.tgl && !isNaN(r.tgl) && r.tgl.getFullYear()===YEAR && normUlp(r.ulp); })
      .map(function(r){ var o=Object.create(r); o.U=normUlp(r.ulp); o.kp=short(r.aset||r.sumber); o.m=r.tgl.getMonth(); o.d=r.tgl.getDate();
        o.u5 = r.u5 ? !!r.under5 : (r.durasiMin!=null && r.durasiMin<=5); o.id=(r.kode&&r.kode!=="X") && !/investigasi/i.test(r.detail||""); return o; });
  }
  function dim(m){ return new Date(YEAR,m+1,0).getDate(); }
  function win(m,w){ return {m:m, w:w, s:1+7*(w-1), e:w<4?7*w:dim(m)}; }
  function inWin(r,W){ return r.m===W.m && r.d>=W.s && r.d<=W.e; }
  function prevWin(W){ return W.w>1 ? win(W.m,W.w-1) : (W.m>0 ? win(W.m-1,4) : null); }
  function wLabel(W){ return BL3[W.m]+" M"+W.w; }
  function trip(r){ var t=String(r.jamTrip||"").match(/(\d{1,2})[:.](\d{2})/); return t ? String(t[1]).padStart(2,"0")+":"+t[2] : "–"; }
  function tripDot(r){ return trip(r).replace(":","."); }
  function indik(r){ var s=String(r.indikasi||"").replace(/\((50G\/51G|50\/51|50G|51G)\)/ig,"").replace(/\s+/g," ").trim(); return cut(s||r.indikasiKode||"–",14); }
  function penyebab(r){ return r.id ? cap1(cut(r.detail||KNAMA[r.kode]||r.kelompok,46)) : "Dalam investigasi"; }
  function sortT(a,b){ return (a.tgl-b.tgl) || (trip(a)<trip(b)?-1:trip(a)>trip(b)?1:0); }
  function countBy(arr,f){ var o={}; arr.forEach(function(r){ var k=f(r); if(k!=null) o[k]=(o[k]||0)+1; }); return o; }
  function topN(o,n){ return Object.keys(o).sort(function(a,b){ return o[b]-o[a] || (a<b?-1:1); }).slice(0,n); }

  function model(p){
    var all=baseRecords(), cutD=p.cut, m=cutD.getMonth();
    var ytd=all.filter(function(r){ return r.tgl<=cutD; });
    var W=win(p.m,p.w), PW=p.m>0?win(p.m-1,p.w):null;
    var wk=ytd.filter(function(r){ return inWin(r,W); }).sort(sortT), pwk=PW?ytd.filter(function(r){ return inWin(r,PW); }):[];
    var wins=[W]; while(wins.length<7){ var pv=prevWin(wins[0]); if(!pv) break; wins.unshift(pv); }
    var kpAll=countBy(ytd,function(r){return r.kp;}), kpU={}; ytd.forEach(function(r){ kpU[r.kp]=r.U; });
    return {p:p, all:all, ytd:ytd, W:W, PW:PW, wk:wk, pwk:pwk, wins:wins, cutD:cutD, cm:m,
      months:(function(){ var a=[]; for(var i=0;i<=m;i++) a.push(i); return a; })(), partial: cutD.getDate()<dim(m),
      kpAll:kpAll, kpU:kpU, top5:topN(kpAll,5), top10:topN(kpAll,10)};
  }

  /* ---------- slide 1–10 ---------- */
  function s1(x, M){
    var W=M.W, t="EVALUASI GANGGUAN JTM M"+W.w+" "+BULAN[W.m].toUpperCase()+" "+YEAR, pd=M.p.paparan;
    return x.replace(/EVALUASI GANGGUAN JTM M\d+ [A-Z]+ \d{4}/, esc(t)).replace(/Sorong, \d{1,2} [A-Za-z]+ \d{4}/, "Sorong, "+pd.getDate()+" "+BULAN[pd.getMonth()]+" "+pd.getFullYear());
  }
  function s2(x, M){
    var n=M.ytd.length, tg=+M.p.target||0, W=M.W, a=M.pwk.length, b=M.wk.length, dl=delta(a,b);
    x=T(x,"Text 4","Periode  1 Jan – "+M.cutD.getDate()+" "+BL3[M.cm]+" "+YEAR);
    x=T(x,"Text 7",nf(n)); x=T(x,"Text 9",tg?"dari target "+nf(tg)+" kali":"target belum diisi");
    var cp=tg&&n?tg/n*100:null; x=T(x,"Text 12",p1(cp)); x=runColor(x,"Text 12",n<=tg?C_DOWN:C_UP);
    x=T(x,"Text 14",!tg?"isi target di sub menu":(n<=tg?"realisasi di bawah target":"realisasi melampaui target"));
    var bu=countBy(M.ytd,function(r){return r.U;}), tu=topN(bu,1)[0]||ULP4[0];
    x=T(x,"Text 17",nf(bu[tu]||0)); x=T(x,"Text 18","Gangguan ULP "+tu); x=T(x,"Text 19",p1(pct(bu[tu]||0,n))+" dari total UP3");
    x=T(x,"Text 22",dl.t==="nihil"?"0%":(dl.t==="baru"?"+"+b:dl.t)); x=runColor(x,"Text 22",dl.c);
    x=T(x,"Text 23","Total UP3 "+(b>a?"naik":(b<a?"turun":"tetap")));
    x=T(x,"Text 24",M.PW?"M"+W.w+" "+BL3[M.PW.m]+" → M"+W.w+" "+BL3[W.m]+" ("+a+" → "+b+")":"M"+W.w+" "+BL3[W.m]+": "+b+" kejadian");
    var mv=M.months.map(function(mm){ return M.ytd.filter(function(r){return r.m===mm;}).length; });
    var order=mv.map(function(v,i){return i;}).sort(function(i,j){return mv[j]-mv[i];}), dpt={};
    if(order.length){ dpt[order[0]]=C_UP; order.slice(1,3).forEach(function(i){ dpt[i]="16456F"; }); }
    M.c1={cats:M.months.map(function(mm){ return BL3[mm]+(mm===M.cm&&M.partial?"*":""); }), series:[{name:"Gangguan",vals:mv,dpt:dpt}]};
    x=T(x,"Text 32","ULP");
    for(var i=0;i<5;i++){ var k=M.top5[i]; x=T(x,"Text "+(35+4*i),k?k.replace(/^R\. /,"Recloser ").replace(/^P\. /,"Penyulang "):"–"); x=T(x,"Text "+(36+4*i),k?M.kpU[k]:""); x=T(x,"Text "+(37+4*i),k?nf(M.kpAll[k]):""); }
    var t5=sum(M.top5.map(function(k){return M.kpAll[k];})), cu=countBy(M.top5,function(k){return M.kpU[k];}), mu=topN(cu,1)[0];
    x=T(x,"Text 54",M.top5.length?(cu[mu]===M.top5.length?"Seluruh lima keypoint berada di ULP "+mu:tb(cu[mu])+" dari lima berada di ULP "+mu)+"; lima keypoint ini menyumbang "+nf(t5)+" kejadian ("+p1(pct(t5,n))+" dari total UP3).":"Belum ada data gangguan pada periode ini.");
    x=T(x,"Text 55","Sumber: Detail Gangguan UP3 Sorong "+YEAR+" · "+nf(n)+" gangguan penyulang, di luar penyebab PEMBANGKIT dan PADAM GARDU/JTR · Capaian = target ÷ realisasi"+(M.partial?" · "+BULAN[M.cm]+" data parsial (1–"+M.cutD.getDate()+")":"")+" · M1 = tanggal 1–7");
    return x;
  }
  function s3(x, M){
    var R=M.ytd, n=R.length, u=R.filter(function(r){return r.u5;}).length, o=n-u;
    var z23=R.filter(function(r){ return /zona\s*[23]\b/i.test(r.zona); }).length, cm=R.filter(function(r){return r.m===M.cm;}).length;
    x=T(x,"Text 0","REALISASI FGTM s.d. "+M.cutD.getDate()+" "+BULAN[M.cm].toUpperCase()+" "+YEAR);
    x=T(x,"Text 3",nf(u)); x=T(x,"Text 4","Pulih < 5 menit ("+p0(pct(u,n))+")");
    x=T(x,"Text 6",nf(o)); x=T(x,"Text 7","Durasi > 5 menit ("+p0(pct(o,n))+")");
    x=T(x,"Text 9",nf(z23)); x=T(x,"Text 10","Di Zona 2 dan 3 ("+p0(pct(z23,n))+")");
    x=T(x,"Text 12",nf(cm)); x=T(x,"Text 13",BULAN[M.cm]+" 1–"+M.cutD.getDate()+" (M"+M.W.w+": "+M.wk.length+")");
    var zs=Object.keys(countBy(R,function(r){ var z=String(r.zona||"").match(/zona\s*(\d)/i); return z?"Zona "+z[1]:null; })).sort();
    M.c2={cats:zs, series:[{name:"Di bawah 5 menit",vals:zs.map(function(z){ return R.filter(function(r){ return r.u5 && new RegExp("^"+z+"\\b","i").test(String(r.zona).replace(/\s+/," ")); }).length; })},
                          {name:"Di atas 5 menit",vals:zs.map(function(z){ return R.filter(function(r){ return !r.u5 && new RegExp("^"+z+"\\b","i").test(String(r.zona).replace(/\s+/," ")); }).length; })}]};
    M.c3={cats:["Di bawah 5 menit","Di atas 5 menit"], series:[{name:"Durasi",vals:[u,o]}]};
    var cw=R.filter(function(r){return String(r.cuaca||"").trim();}), cc=countBy(cw,function(r){return cap1(r.cuaca);}), dc=topN(cc,1)[0]||"Cerah";
    x=T(x,"Text 17",nf(cc[dc]||0)); x=T(x,"Text 18","kejadian bercuaca "+String(dc).toLowerCase()); x=T(x,"Text 19","dari "+nf(cw.length)+" kejadian yang tercatat cuacanya ("+p0(pct(cc[dc]||0,cw.length))+")");
    var gf=R.filter(function(r){return r.indikasiKode==="GF";}).length, oc=R.filter(function(r){return r.indikasiKode==="OC";}).length, uf=R.filter(function(r){return r.indikasiKode==="UFR";}).length;
    x=T(x,"Text 21",nf(gf)); x=T(x,"Text 23",p0(pct(gf,n))+" dari total; "+nf(oc)+" kejadian indikasi OC"+(uf?" dan "+uf+" UFR":""));
    var zr=zs.map(function(z,i){ var t=M.c2.series[0].vals[i]+M.c2.series[1].vals[i]; return {z:z,t:t,o:M.c2.series[1].vals[i],p:pct(M.c2.series[1].vals[i],t)}; }).filter(function(q){return q.t>=5;}).sort(function(a,b){return b.p-a.p;})[0];
    x=T(x,"Text 25",zr?zr.z+" paling lama pulih: "+zr.o+" dari "+zr.t+" kejadian ("+p0(zr.p)+") berdurasi di atas 5 menit.":"Belum cukup data untuk perbandingan zona.");
    var kc=countBy(R,function(r){return r.kode;}), tk=topN(kc,1)[0];
    x=setShape(x,"Text 27",[["Ringkasan.  ", p0(pct(u,n))+" gangguan pulih kurang dari 5 menit (bersifat temporer), "+p0(pct(cc[dc]||0,cw.length))+" terjadi saat cuaca "+String(dc).toLowerCase()+", dan "+p0(pct(gf,n))+" berindikasi ground fault. Zona 2 dan 3 menyumbang "+p0(pct(z23,n))+" kejadian"+(tk?"; kelompok penyebab terbanyak "+(window.GangguanData.CAUSE_LABELS[tk]||tk)+" ("+nf(kc[tk])+" kejadian).":".")]]);
    x=T(x,"Text 28","Data s.d. "+M.cutD.getDate()+" "+BULAN[M.cm]+" "+YEAR+", di luar penyebab PEMBANGKIT dan PADAM GARDU/JTR.");
    return x;
  }
  function s4(x, M){
    var R=M.ytd, n=R.length;
    x=T(x,"Text 2","Gangguan bulanan per ULP, Jan–"+BL3[M.cm]+" "+YEAR);
    M.c4={cats:M.c1.cats, series:ULP4.map(function(u){ return {name:u, vals:M.months.map(function(mm){ return R.filter(function(r){return r.U===u&&r.m===mm;}).length; })}; })};
    var t10=M.top10.slice().reverse(), dpt={}; t10.forEach(function(k,i){ dpt[i]=UCLR[M.kpU[k]]; });
    x=T(x,"Text 3",tb(Math.min(10,M.top10.length))+" keypoint dengan gangguan terbanyak");
    M.c5={cats:t10, series:[{name:"Gangguan",vals:t10.map(function(k){return M.kpAll[k];}),dpt:dpt}]};
    var base=[6,13,20,27];
    ULP4.forEach(function(u,i){ var b=base[i], rr=R.filter(function(r){return r.U===u;}), uu=rr.filter(function(r){return r.u5;}).length;
      x=T(x,"Text "+b,u); x=T(x,"Text "+(b+1),nf(rr.length)); x=T(x,"Text "+(b+2),p1(pct(rr.length,n))); x=T(x,"Text "+(b+4),nf(uu)+" / "+nf(rr.length-uu)); });
    var bu=countBy(R,function(r){return r.U;}), tu=topN(bu,1)[0];
    if(tu){ var kpu={}; R.filter(function(r){return r.U===tu;}).forEach(function(r){ kpu[r.kp]=(kpu[r.kp]||0)+1; }); var t5=topN(kpu,5), s5=sum(t5.map(function(k){return kpu[k];}));
      x=T(x,"Text 32",tb(t5.length)+" keypoint kritis di ULP "+tu+" ("+list(t5)+") menyumbang "+nf(s5)+" kejadian, atau "+p0(pct(s5,n))+" dari seluruh gangguan UP3 Sorong."); }
    return x;
  }
  function weekNote(arr, n){ // ringkasan kejadian minggu untuk satu ULP
    var kc=countBy(arr,function(r){return r.kp;}), ks=topN(kc,3), inv=arr.filter(function(r){return !r.id;}).length;
    return ks.map(function(k){ return k+" "+kc[k]+"×"; }).join(", ")+(inv?"; "+inv+" dari "+n+" masih investigasi.":"; seluruhnya teridentifikasi.");
  }
  function cardsSlide(x, M, keys, getArr, titleOf, base, opts){
    var W=M.W, PW=M.PW, rng=W.s+"–"+W.e+" "+BULAN[W.m];
    var it=keys.map(function(k){ var cur=getArr(k).filter(function(r){return inWin(r,W);}), prv=PW?getArr(k).filter(function(r){return inWin(r,PW);}):[]; return {k:k,a:prv.length,b:cur.length,cur:cur,all:getArr(k)}; });
    it.sort(function(p,q){ return (p.b===0&&p.a===0?-1:0)-(q.b===0&&q.a===0?-1:0) || ((p.b-p.a)-(q.b-q.a)) || (p.b-q.b); });
    it.forEach(function(o,i){ var b0=base+7*i, d=delta(o.a,o.b);
      x=T(x,"Text "+b0,titleOf(o.k)); x=T(x,"Text "+(b0+1),o.a+" → "+o.b); x=T(x,"Text "+(b0+2),d.t); x=runColor(x,"Text "+(b0+2),d.c);
      x=T(x,"Text "+(b0+4),d.st); x=fill(x,"Shape "+(b0+3),stColor(d.st));
      x=T(x,"Text "+(b0+5),opts.note(o,rng)); });
    return {x:x, it:it};
  }
  function s5(x, M){
    var W=M.W, PW=M.PW;
    x=T(x,"Text 0","TREN GANGGUAN ULP (M"+W.w+" "+(PW?BULAN[PW.m].toUpperCase()+" – M"+W.w+" ":"")+BULAN[W.m].toUpperCase()+")");
    M.c6={cats:M.wins.map(wLabel), series:ULP4.map(function(u){ return {name:u, vals:M.wins.map(function(w){ return M.ytd.filter(function(r){return r.U===u&&inWin(r,w);}).length; })}; })};
    var r=cardsSlide(x,M,ULP4,function(u){ return M.ytd.filter(function(q){return q.U===u;}); },function(u){return "ULP "+u;},3,
      {note:function(o,rng){ return o.b ? weekNote(o.cur,o.b) : "Nihil gangguan JTM pada "+rng+"."; }});
    x=r.x; var a=M.pwk.length, b=M.wk.length, d=delta(a,b), up=r.it.filter(function(o){return o.b>o.a;}).length, dn=r.it.filter(function(o){return o.b<o.a;}).length;
    var o5=M.wk.filter(function(q){return !q.u5;}).length, inv=M.wk.filter(function(q){return !q.id;}).length;
    x=setShape(x,"Text 31",[["Minggu "+W.w+": "+a+" → "+b+" kejadian ("+(d.t==="nihil"?"nihil":d.t)+"). ",
      (up?"Kenaikan terjadi di "+tb(up).toLowerCase()+" ULP":"Tidak ada ULP yang naik")+(dn?", penurunan di "+tb(dn).toLowerCase()+" ULP. ":". ")+(b?o5+" dari "+b+" kejadian berdurasi di atas 5 menit; "+inv+" kejadian belum teridentifikasi"+(inv>b/2?", sehingga penelusuran trip temporer menjadi prioritas.":"."):"")]]);
    x=T(x,"Text 32",(PW?"M"+W.w+" "+BULAN[PW.m]+" = "+PW.s+"–"+PW.e+" "+BL3[PW.m]+"; ":"")+"M"+W.w+" "+BULAN[W.m]+" = "+W.s+"–"+W.e+" "+BL3[W.m]+" "+YEAR+".");
    return x;
  }
  function s6(x, M){
    var W=M.W, PW=M.PW, K=M.top5;
    x=T(x,"Text 0","TREN GANGGUAN KEYPOINT KRITIS (M"+W.w+" "+(PW?BL3[PW.m].toUpperCase()+" – M"+W.w+" ":"")+BL3[W.m].toUpperCase()+")");
    M.c7={cats:M.wins.map(wLabel), series:K.map(function(k,i){ return {name:k, color:KCLR[i], vals:M.wins.map(function(w){ return M.ytd.filter(function(r){return r.kp===k&&inWin(r,w);}).length; })}; })};
    var r=cardsSlide(x,M,K,function(k){ return M.ytd.filter(function(q){return q.kp===k;}); },function(k){ return k.replace(/^R\. /,"Recloser ").replace(/^P\. /,"Penyulang "); },3,
      {note:function(o){
        if(!o.b){ var last=o.all.filter(function(q){return q.tgl<=M.cutD;}).sort(sortT).pop(); return last?"Nihil; kejadian terakhir "+(last.id?cut(String(last.detail||"").toLowerCase(),36):"investigasi")+" "+dd(last.tgl)+".":"Nihil."; }
        var idl=o.cur.filter(function(q){return q.id;}), idn=idl.slice(0,2).map(function(q){ return cap1(cut(q.detail,26))+" "+dd(q.tgl); }), inv=o.cur.filter(function(q){return !q.id;}).map(function(q){return dd(q.tgl);});
        var more=idl.length>2?" (+"+(idl.length-2)+" temuan lain)":"";
        return (idn.join("; ")+more+(idn.length&&inv.length?"; ":"")+(inv.length?(inv.length>2?inv.length+" trip":"trip "+list(inv))+" masih investigasi":"")+".").replace(/^\./,""); }});
    x=r.x; var a=sum(r.it.map(function(o){return o.a;})), b=sum(r.it.map(function(o){return o.b;})), ups=r.it.filter(function(o){return o.b>o.a;}).map(function(o){return o.k;}), dns=r.it.filter(function(o){return o.b<o.a;}).map(function(o){return o.k;});
    var cur=[].concat.apply([],r.it.map(function(o){return o.cur;})), kc=countBy(cur.filter(function(q){return q.id;}),function(q){return q.kode;}), tk=topN(kc,1)[0];
    x=setShape(x,"Text 38",[["Minggu "+W.w+": lima keypoint kritis "+(b>a?"naik":(b<a?"turun":"tetap"))+" dari "+a+" menjadi "+b+" kejadian. ",
      (ups.length?"Kenaikan berasal dari "+list(ups)+". ":"")+(dns.length?"Penurunan di "+list(dns)+". ":"")+(tk?"Penyebab teridentifikasi terbanyak: "+KNAMA[tk]+" ("+kc[tk]+" kejadian).":(b?"Seluruh kejadian masih dalam investigasi.":""))]]);
    x=T(x,"Text 39",(PW?"M"+W.w+" "+BULAN[PW.m]+" = "+PW.s+"–"+PW.e+" "+BL3[PW.m]+"; ":"")+"M"+W.w+" "+BULAN[W.m]+" = "+W.s+"–"+W.e+" "+BL3[W.m]+" "+YEAR+", untuk lima keypoint kritis.");
    return x;
  }
  function s7pages(x, M){
    var W=M.W, R=M.wk, n=R.length, rng=W.s+"-"+W.e+" "+BULAN[W.m].toUpperCase()+" "+YEAR, rs=rowsOf(x);
    var inv=R.filter(function(r){return !r.id;}), idn=R.filter(function(r){return r.id;}), u5=R.filter(function(r){return r.u5;});
    x=T(x,"Text 133","Pola Minggu "+W.w+" "+BULAN[W.m]);
    x=T(x,"Text 135",inv.length+" / "+n); x=T(x,"Text 136","masih dalam investigasi");
    var ki=countBy(inv,function(r){return r.kp;}), k2=Object.keys(ki).filter(function(k){return ki[k]>=2;});
    x=T(x,"Text 137",!inv.length?"Seluruh kejadian sudah teridentifikasi.":(k2.length===1?k2[0]+" "+ki[k2[0]]+" trip belum teridentifikasi.":k2.length?list(k2.slice(0,3))+" masing-masing ≥2 trip belum teridentifikasi.":"Tersebar di "+Object.keys(ki).length+" keypoint, masing-masing 1 trip."));
    x=T(x,"Text 139",u5.length+" / "+n); x=T(x,"Text 140","pulih di bawah 5 menit");
    var o5=R.filter(function(r){return !r.u5;});
    x=T(x,"Text 141",!n?"Nihil gangguan.":(!o5.length?"Seluruh kejadian pulih di bawah 5 menit.":"Di atas 5 menit: "+o5.slice(0,3).map(function(r){ return r.kp+" "+dd(r.tgl)+", "+(r.durasiMin!=null?r.durasiMin+" menit":r.durasi)+(r.id?"":" (investigasi)"); }).join("; ")+(o5.length>3?"; dan "+(o5.length-3)+" lainnya.":".")));
    x=T(x,"Text 143",idn.length+" / "+n); x=T(x,"Text 144","sudah teridentifikasi");
    var kc=countBy(idn,function(r){return r.kode;});
    x=T(x,"Text 145",idn.length?topN(kc,4).map(function(k){ return cap1(KNAMA[k]||k)+" "+kc[k]; }).join(", ")+".":"Belum ada penyebab yang teridentifikasi.");
    var hj=R.filter(function(r){return /hujan|angin|petir/i.test(r.cuaca||"");}).length;
    x=T(x,"Text 147","Hujan/angin: "+hj+" dari "+n+" kejadian");
    var kp=countBy(R,function(r){return r.kp;}), tk=topN(kp,1)[0];
    x=setShape(x,"Text 131",[["Baris hijau = penyebab sudah teridentifikasi.  ", tk&&kp[tk]>=2 ? (function(){ var ds=[]; R.filter(function(r){return r.kp===tk;}).forEach(function(r){ var t=dd(r.tgl); if(ds.indexOf(t)<0) ds.push(t); }); return tk+" trip "+kp[tk]+" kali pada minggu ini ("+(ds.length>1?ds[0]+"–"+ds[ds.length-1]:ds[0])+")."; })() : "Tidak ada keypoint yang trip berulang pada minggu ini."]]);
    x=T(x,"Text 148","Data "+W.s+"–"+W.e+" "+BULAN[W.m]+" "+YEAR+" (Minggu "+W.w+" "+BULAN[W.m]+"), di luar penyebab PEMBANGKIT dan PADAM GARDU/JTR.");
    var pages=Math.max(1,Math.ceil(n/ROWS_PER_PAGE)), out=[];
    for(var pg=0;pg<pages;pg++){
      var part=R.slice(pg*ROWS_PER_PAGE,(pg+1)*ROWS_PER_PAGE), wi=0;
      var rows=part.map(function(r){ var proto=r.id?rs[3]:rs[1+((wi++)%2)];
        return fillRow(proto,[dd(r.tgl), r.U, cut(r.kp,22), trip(r), (r.durasiMin!=null?r.durasiMin+" mnt":(r.durasi||"–")), indik(r), penyebab(r)]); });
      if(!rows.length) rows=[fillRow(rs[1],["–","–","Nihil gangguan","–","–","–","Tidak ada gangguan JTM pada periode ini"])];
      var px=setRows(x,[rs[0]].concat(rows));
      px=T(px,"Text 0","DETAIL GANGGUAN "+rng+(pages>1?" ("+(pg+1)+"/"+pages+")":""));
      out.push(px);
    }
    return out;
  }
  var DOC_C = {E1:"E8A33D",E2:"7FA6B8",E3:"16456F",E4:"16456F",I1:"1C7293",I2:"1C7293",I3:"1C7293",I4:"1C7293"};
  function docSlide(x, evs, startIdx, title){
    var ph=(x.match(/name="Placeholder Foto (\d+)"/g)||[]).map(function(s){ return +s.match(/(\d+)/)[1]; });
    ph.forEach(function(id,i){
      var r=evs[i];
      if(!r){ ["Placeholder Foto "+id,"Rounded Rectangle 4 "+(id+1),"TextBox 12 "+(id+2)].forEach(function(nm){ x=removeSp(x,nm); }); return; }
      x=setShape(x,"Placeholder Foto "+id,[["Foto dokumentasi temuan"]]).replace(new RegExp('(name="Placeholder Foto '+id+'"[\\s\\S]*?<a:p>)(<a:r><a:rPr)'),'$1<a:pPr algn="ctr"/>$2');
      var rg=spRange(x,"Placeholder Foto "+id); if(rg){ var sp=x.slice(rg[0],rg[1]).replace(/<a:bodyPr\/>/,'<a:bodyPr anchor="ctr"/>').replace(/<a:rPr lang="id-ID"\/>/,'<a:rPr lang="id-ID" sz="1000"><a:solidFill><a:srgbClr val="9AA6B4"/></a:solidFill></a:rPr>'); x=x.slice(0,rg[0])+sp+x.slice(rg[1]); }
      x=T(x,"Rounded Rectangle 4 "+(id+1),cap1(cut(r.detail,34))); x=fill(x,"Rounded Rectangle 4 "+(id+1),DOC_C[r.kode]||"16456F");
      x=setShape(x,"TextBox 12 "+(id+2),[[r.kp+" — ULP "+r.U],[dd(r.tgl)+" pukul "+tripDot(r)+"  ·  "+(r.durasiMin!=null?r.durasiMin+" mnt":r.durasi)+"  ·  "+(r.indikasiKode||indik(r))]]);
    });
    return T(x,"Text 0",title);
  }
  function colItems(arr){
    var kc=countBy(arr,function(r){return r.kp;}), ks=topN(kc,3);
    return ks.map(function(k){ var rr=arr.filter(function(r){return r.kp===k;}), idn=rr.filter(function(r){return r.id;}), inv=rr.length-idn.length;
      var cz=[]; idn.forEach(function(r){ var c=String(r.detail||KNAMA[r.kode]).toLowerCase(); c=cut(c,20); if(cz.indexOf(c)<0) cz.push(c); });
      var dk=topN(countBy(rr,function(r){return r.kode;}),1)[0]||"X";
      var t=k+" · "+rr.length+" trip"+(cz.length?" ("+cz.slice(0,2).join(", ")+(inv?", "+inv+" investigasi":"")+")":" (investigasi)");
      return {t:t, b:(TINDAK[dk]||TINDAK.X)}; });
  }
  function s10(x, M){
    var W=M.W, R=M.wk;
    x=setShape(x,"Text 0",[["EVALUASI & TINDAK LANJUT ULP"],["GANGGUAN "+W.s+"-"+W.e+" "+BULAN[W.m].toUpperCase()+" "+YEAR]]);
    [["Teminabuan"],["Aimas"],["Sorong Kota","Waisai"]].forEach(function(us,ci){
      var b0=6003+15*ci, arr=R.filter(function(r){return us.indexOf(r.U)>=0;}), idn=arr.filter(function(r){return r.id;}).length;
      x=T(x,"Text "+b0,"ULP "+us.join(" & ")); x=T(x,"Text "+(b0+1),arr.length+" kejadian · "+idn+" teridentifikasi");
      var items=colItems(arr);
      us.forEach(function(u){ if(us.length>1 && !arr.some(function(r){return r.U===u;})) items.push({t:"ULP "+u+" · nihil", b:"Nihil gangguan JTM pada minggu ini; pertahankan patroli dan inspeksi rutin."}); });
      if(!items.length) items=[{t:"Nihil gangguan", b:"Tidak ada gangguan JTM pada minggu ini; pertahankan patroli dan inspeksi rutin."}];
      for(var j=0;j<3;j++){ var t=items[j]; x=T(x,"Text "+(b0+5+3*j),t?t.t:""); x=T(x,"Text "+(b0+6+3*j),t?t.b:""); }
    });
    var n=R.length, inv=R.filter(function(r){return !r.id;}).length;
    var since=new Date(M.cutD.getTime()-29*864e5), last30=M.ytd.filter(function(r){return r.tgl>=since;}), k30=countBy(last30,function(r){return r.kp;}), tk=topN(k30,1)[0];
    var kc=countBy(R.filter(function(r){return r.id;}),function(r){return r.kode;}), tc=topN(kc,1)[0];
    var i1= n ? (inv ? inv+" dari "+n+" kejadian belum teridentifikasi; penelusuran perlu dilakukan segera setelah trip." : "Seluruh "+n+" kejadian minggu ini sudah teridentifikasi penyebabnya.") : "Nihil gangguan JTM pada minggu ini.";
    var i2= tk ? tk+" ("+M.kpU[tk]+") sudah "+k30[tk]+" kali trip dalam 30 hari terakhir (sejak "+dd(since)+")." : "Tidak ada keypoint dengan trip berulang dalam 30 hari terakhir.";
    var i3= tc ? "Penyebab teridentifikasi terbanyak minggu ini: "+KNAMA[tc]+" ("+kc[tc]+" kejadian), terutama di "+list(topN(countBy(R.filter(function(r){return r.kode===tc;}),function(r){return r.kp;}),2))+"." : "Belum ada penyebab teridentifikasi; fokus pada penelusuran trip temporer.";
    x=setShape(x,"Text 6047",[["Isu untuk rapat"],["1.  ",i1],["2.  ",i2],["3.  ",i3]]);
    return x;
  }

  /* ---------- paket ---------- */
  function loadTpl(){
    if(window.FGTM_TPL) return Promise.resolve();
    return new Promise(function(res, rej){ var s=document.createElement("script"); s.src=TEMPLATE+"?v=20261116a";
      s.onload=function(){ window.FGTM_TPL?res():rej(new Error("Template PPT FGTM kosong")); }; s.onerror=function(){ rej(new Error("Template PPT FGTM tidak ditemukan ("+TEMPLATE+")")); }; document.head.appendChild(s); });
  }
  function relFor(n){ return "ppt/slides/_rels/slide"+n+".xml.rels"; }
  function imgRel(rid, target){ return '<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="'+target+'"/>'; }
  function picXml(id, rid, name, x, y, w, h){ return '<p:pic><p:nvPicPr><p:cNvPr id="'+id+'" name="'+esc(name)+'"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="'+Math.round(x)+'" y="'+Math.round(y)+'"/><a:ext cx="'+Math.round(w)+'" cy="'+Math.round(h)+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>'; }
  function png(cv){ return new Promise(function(res, rej){ cv.toBlob(function(b){ if(!b) return rej(new Error("Gagal membuat gambar")); b.arrayBuffer().then(function(ab){ res(new Uint8Array(ab)); }, rej); }, "image/png"); }); }

  async function rowSlides(zip, p, say){
    var R=window.Rabas; if(!window.ROWPPT || !R || !window.Chart) return null;
    var keep=R.month; R.month=p.m;
    try{
      var M=await window.ROWPPT.model(p.cut); window.ROWPPT.H.baseFont();
      var proto=await zip.file("ppt/slides/slide12.xml").async("string"), protoRel=await zip.file(relFor(12)).async("string");
      var relNoNotes=protoRel.replace(/<Relationship [^>]*notesSlide[^>]*\/>/,"");
      var slides=[], n=0;
      var DK={ S:function(t){ var s={title:t, xml:"", rels:"", id:300, rid:300}; slides.push(s); return s; },
        putImg:async function(s, cv, x,y,w,h, name){ n++; var fn="fgtm_row_"+n+".png"; zip.file("ppt/media/"+fn, await png(cv)); var rid="rId"+(s.rid++); s.rels+=imgRel(rid,"../media/"+fn); s.xml+=picXml(s.id++, rid, name||fn, x,y,w,h); },
        put:function(s, xml, k){ s.xml+=xml; s.id+=(k||3); } };
      await window.ROWPPT.addSlides(M, DK, say);
      return slides.map(function(sl,k){ return {xml:setShape(proto,"Parallelogram 5",[[sl.title]]).replace("</p:spTree>", sl.xml+"</p:spTree>"), rels:(k===0?protoRel:relNoNotes).replace("</Relationships>", sl.rels+"</Relationships>")}; });
    } finally { R.month=keep; }
  }

  async function build(JSZip, p, progress){
    var say=typeof progress==="function"?progress:function(){};
    if(!window.GangguanData) throw new Error("Modul data gangguan belum termuat");
    say("Memuat data gangguan…"); await window.GangguanData.load();
    var M=model(p);
    say("Memuat template PPT Evaluasi FGTM…"); await loadTpl();
    var zip=await JSZip.loadAsync(window.FGTM_TPL,{base64:true});
    var rd=function(f){ return zip.file(f).async("string"); };
    say("Mengisi slide gangguan…");
    zip.file("ppt/slides/slide1.xml", s1(await rd("ppt/slides/slide1.xml"), M));
    zip.file("ppt/slides/slide2.xml", s2(await rd("ppt/slides/slide2.xml"), M));
    zip.file("ppt/slides/slide3.xml", s3(await rd("ppt/slides/slide3.xml"), M));
    zip.file("ppt/slides/slide4.xml", s4(await rd("ppt/slides/slide4.xml"), M));
    zip.file("ppt/slides/slide5.xml", s5(await rd("ppt/slides/slide5.xml"), M));
    zip.file("ppt/slides/slide6.xml", s6(await rd("ppt/slides/slide6.xml"), M));
    zip.file("ppt/slides/slide10.xml", s10(await rd("ppt/slides/slide10.xml"), M));
    var CH={1:M.c1,2:M.c2,3:M.c3,4:M.c4,5:M.c5,6:M.c6,7:M.c7};
    for(var c=1;c<=7;c++){ if(!CH[c]) continue; zip.file("ppt/charts/chart"+c+".xml", setChart(await rd("ppt/charts/chart"+c+".xml"), CH[c].cats, CH[c].series, {keepDPt:c===3})); }

    var pres=await rd("ppt/presentation.xml"), prels=await rd("ppt/_rels/presentation.xml.rels"), ct=await rd("[Content_Types].xml");
    var ids=(pres.match(/<p:sldId [^>]*\/>/g)||[]).map(function(e){ var rid=e.match(/r:id="(rId\d+)"/)[1], t=(prels.match(new RegExp('Id="'+rid+'"[^>]*Target="slides/slide(\\d+)\\.xml"'))||prels.match(new RegExp('Target="slides/slide(\\d+)\\.xml"[^>]*Id="'+rid+'"'))||[])[1]; return {e:e, rid:rid, n:+t}; });
    var maxId=Math.max.apply(null, ids.map(function(o){ return +o.e.match(/id="(\d+)"/)[1]; })), extra=[], seq=0;
    function addSlide(xml, rels, after){ seq++; var sn=100+seq, rid="rIdF"+sn; zip.file("ppt/slides/slide"+sn+".xml", xml); zip.file(relFor(sn), rels);
      prels=prels.replace("</Relationships>",'<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+sn+'.xml"/></Relationships>');
      ct=ct.replace("</Types>",'<Override PartName="/ppt/slides/slide'+sn+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>');
      extra.push({after:after, e:'<p:sldId id="'+(maxId+seq)+'" r:id="'+rid+'"/>'}); }
    var drop={};

    // 7: detail (berhalaman)
    var pg=s7pages(await rd("ppt/slides/slide7.xml"), M), r7=(await rd(relFor(7))).replace(/<Relationship [^>]*notesSlide[^>]*\/>/,"");
    zip.file("ppt/slides/slide7.xml", pg[0]); for(var i=1;i<pg.length;i++) addSlide(pg[i], r7, 7);

    // 8–9: dokumentasi
    var docs=M.wk.filter(function(r){return r.id;});
    if(!p.dok || !docs.length){ drop[8]=1; drop[9]=1; }
    else {
      var two=docs.length>6, rng=M.W.s+"–"+M.W.e+" "+BL3[M.W.m];
      zip.file("ppt/slides/slide8.xml", docSlide(await rd("ppt/slides/slide8.xml"), docs.slice(0,6), 0, "DOKUMENTASI TEMUAN LAPANGAN"+(two?" (1/2)":"")+" · "+rng));
      if(two){ var x9=docSlide(await rd("ppt/slides/slide9.xml"), docs.slice(6,9), 6, "DOKUMENTASI TEMUAN LAPANGAN (2/2) · "+rng);
        var inv=M.wk.length-docs.length; x9=x9.replace(/(Dua belas|\d+) kejadian lain masih dalam investigasi/, inv+" kejadian lain masih dalam investigasi"); zip.file("ppt/slides/slide9.xml", x9); }
      else drop[9]=1;
    }

    // 12–17: ROW
    if(p.row){
      say("Menyusun slide ROW…");
      var rs=await rowSlides(zip, p, say);
      if(rs){ for(var k=0;k<6;k++){ if(rs[k]){ zip.file("ppt/slides/slide"+(12+k)+".xml", rs[k].xml); zip.file(relFor(12+k), rs[k].rels); } else drop[12+k]=1; }
        for(var k2=6;k2<rs.length;k2++) addSlide(rs[k2].xml, rs[k2].rels, 17); }
      else for(var q=12;q<=17;q++) drop[q]=1;
    } else for(var q2=12;q2<=17;q2++) drop[q2]=1;
    if(!p.statis){ [11,18,19,20,21,23].forEach(function(n){ drop[n]=1; }); }

    // susun ulang daftar slide
    var lst=""; ids.forEach(function(o){ if(!drop[o.n]) lst+=o.e; extra.filter(function(e){return e.after===o.n;}).forEach(function(e){ lst+=e.e; }); });
    pres=pres.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/, "<p:sldIdLst>"+lst+"</p:sldIdLst>");
    ids.forEach(function(o){ if(!drop[o.n]) return;
      prels=prels.replace(new RegExp('<Relationship Id="'+o.rid+'"[^>]*/>'),"");
      ct=ct.replace('<Override PartName="/ppt/slides/slide'+o.n+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>',"");
      zip.remove("ppt/slides/slide"+o.n+".xml"); });
    for(var dn in drop){ var rf=zip.file(relFor(dn)); if(rf){ var rr=await rf.async("string"), nm=(rr.match(/notesSlides\/(notesSlide\d+)\.xml/)||[])[1];
      if(nm){ zip.remove("ppt/notesSlides/"+nm+".xml"); zip.remove("ppt/notesSlides/_rels/"+nm+".xml.rels"); ct=ct.replace('<Override PartName="/ppt/notesSlides/'+nm+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>',""); }
      zip.remove(relFor(dn)); } }
    zip.file("ppt/presentation.xml", pres); zip.file("ppt/_rels/presentation.xml.rels", prels); zip.file("[Content_Types].xml", ct);
    say("Menyimpan berkas PPT…");
    var blob=await zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation"});
    return {blob:blob, name:"Evaluasi FGTM M"+M.W.w+" "+BULAN[M.W.m]+" "+YEAR+" - UP3 Sorong.pptx", model:M};
  }

  /* ---------- sub menu (tampilan) ---------- */
  function $(id){ return document.getElementById(id); }
  function loadOpts(){ try{ return JSON.parse(localStorage.getItem(LSKEY))||{}; }catch(e){ return {}; } }
  function saveOpts(o){ try{ localStorage.setItem(LSKEY, JSON.stringify(o)); }catch(e){} }
  function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function parseIso(s){ var m=String(s||"").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?new Date(+m[1],+m[2]-1,+m[3]):null; }
  function params(){
    var m=+$("fp-bulan").value, w=+$("fp-minggu").value, c=parseIso($("fp-cut").value)||new Date(YEAR,m,win(m,w).e), pd=parseIso($("fp-paparan").value)||new Date();
    return {m:m, w:w, cut:new Date(c.getFullYear(),c.getMonth(),c.getDate(),23,59,59), paparan:pd, target:+$("fp-target").value||0,
      dok:$("fp-dok").checked, row:$("fp-row").checked, statis:$("fp-statis").checked};
  }
  function persist(){ var p=params(); saveOpts({target:p.target, dok:p.dok, row:p.row, statis:p.statis}); }
  function defaultWeek(recs){
    var last=recs.reduce(function(a,r){ return (!a||r.tgl>a)?r.tgl:a; }, null)||new Date();
    var d=last.getDate(), w=d<=7?1:(d<=14?2:(d<=21?3:4)); return {m:last.getMonth(), w:w, last:last};
  }
  function syncCut(){ var m=+$("fp-bulan").value, w=+$("fp-minggu").value, W=win(m,w); $("fp-cut").value=iso(new Date(YEAR,m,W.e)); $("fp-range").textContent="M"+w+" "+BULAN[m]+" = tanggal "+W.s+"–"+W.e; preview(); }
  function preview(){
    var el=$("fp-preview"); if(!el) return;
    var p=params(), M=model(p), a=M.pwk.length, b=M.wk.length, d=delta(a,b), n=M.ytd.length;
    var card=function(l,v,s,c){ return '<div class="kpi '+(c||"")+'"><div class="kpi__label">'+l+'</div><div class="kpi__value">'+v+'</div><div class="kpi__sub">'+s+'</div></div>'; };
    el.innerHTML=card("Realisasi FGTM s.d. "+M.cutD.getDate()+" "+BL3[M.cm],nf(n),p.target?"capaian "+p1(p.target/n*100)+" dari target "+nf(p.target):"target belum diisi",n<=p.target?"kpi--green":"kpi--red")+
      card("Gangguan M"+M.W.w+" "+BULAN[M.W.m],String(b),(M.PW?"M"+M.W.w+" "+BL3[M.PW.m]+": "+a+" · ":"")+(d.t==="nihil"?"nihil":d.t),b>a?"kpi--red":"kpi--green")+
      card("Teridentifikasi minggu ini",M.wk.filter(function(r){return r.id;}).length+" / "+b,"sisanya dalam investigasi","kpi--blue")+
      card("Keypoint kritis (YTD)",M.top5[0]||"–",M.top5[0]?nf(M.kpAll[M.top5[0]])+" kejadian · ULP "+M.kpU[M.top5[0]]:"",'kpi--amber');
    var src=(window.GangguanData&&window.GangguanData.source)==="live";
    $("fp-src").innerHTML='<span class="wp-pill '+(src?"live":"warn")+'">● '+(src?"Data gangguan live dari spreadsheet":"Data gangguan snapshot (spreadsheet tidak terjangkau)")+'</span><span class="wp-pill">'+nf(M.all.length)+' kejadian 2026 · 4 ULP</span>';
    var rows=[["1","Cover","Judul M"+M.W.w+" "+BULAN[M.W.m]+" & tanggal paparan","data"],["2","Overview FGTM","Realisasi vs target, ULP terbesar, tren mingguan, 5 keypoint teratas","data"],
      ["3","Realisasi FGTM","Durasi, zonasi, cuaca, indikasi relai","data"],["4","Sebaran per ULP & keypoint","Bulanan per ULP, 10 keypoint teratas","data"],
      ["5","Tren gangguan ULP","7 minggu terakhir, M"+M.W.w+" bulan lalu vs bulan ini","data"],["6","Tren keypoint kritis","5 keypoint teratas, 7 minggu terakhir","data"],
      ["7","Detail gangguan","Tabel "+b+" kejadian minggu ini ("+Math.max(1,Math.ceil(b/ROWS_PER_PAGE))+" slide)","data"],
      ["8–9","Dokumentasi temuan",p.dok?M.wk.filter(function(r){return r.id;}).length+" kejadian teridentifikasi · bingkai foto diisi manual":"tidak disertakan",p.dok?"data":"off"],
      ["10","Evaluasi & tindak lanjut ULP","Keypoint per ULP + tindak lanjut sesuai penyebab, isu untuk rapat","data"],
      ["12–17","ROW",p.row?"Ringkasan, matriks, kinerja ULP, penyulang, mitra, catatan":"tidak disertakan",p.row?"data":"off"],
      ["11, 18–21, 23","Lampiran template",p.statis?"Realisasi pekerjaan Teminabuan, material cover, checkpoint (isi tetap dari template)":"tidak disertakan",p.statis?"statis":"off"],
      ["22","Penutup","Logo Danantara & PLN","statis"]];
    $("fp-slides").innerHTML=rows.map(function(r){ var tag=r[3]==="data"?'<span class="wp-pill live">data dashboard</span>':(r[3]==="statis"?'<span class="wp-pill">isi template</span>':'<span class="wp-pill warn">dilewati</span>');
      return "<tr><td>"+r[0]+"</td><td><b>"+r[1]+"</b></td><td>"+r[2]+"</td><td>"+tag+"</td></tr>"; }).join("");
  }
  var inited=false;
  async function initView(){
    if(inited){ preview(); return; } inited=true;
    var o=loadOpts();
    $("fp-src").innerHTML='<span class="wp-pill loading">Memuat data gangguan…</span>';
    await window.GangguanData.load();
    var recs=baseRecords(), dw=defaultWeek(recs);
    var months={}; recs.forEach(function(r){ months[r.m]=1; }); months[dw.m]=1;
    $("fp-bulan").innerHTML=Object.keys(months).map(Number).sort(function(a,b){return a-b;}).map(function(m){ return '<option value="'+m+'">'+BULAN[m]+" "+YEAR+"</option>"; }).join("");
    $("fp-bulan").value=String(dw.m); $("fp-minggu").value=String(dw.w);
    $("fp-target").value=o.target!=null?o.target:622; $("fp-paparan").value=iso(new Date());
    $("fp-dok").checked=o.dok!==false; $("fp-row").checked=o.row!==false; $("fp-statis").checked=o.statis!==false;
    syncCut();
    $("fp-bulan").onchange=syncCut; $("fp-minggu").onchange=syncCut;
    ["fp-cut","fp-target","fp-paparan","fp-dok","fp-row","fp-statis"].forEach(function(id){ $(id).onchange=function(){ persist(); preview(); }; });
    $("fp-dl").onclick=function(){ if(window.PPTExport && window.PPTExport.exportActive) window.PPTExport.exportActive(); };
  }
  async function download(JSZip, overlay){
    persist();
    var r=await build(JSZip, params(), overlay);
    var a=document.createElement("a"); a.href=URL.createObjectURL(r.blob); a.download=r.name; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  window.FGTMPPT = { build: build, download: download, initView: initView, _model: model,
    // dipakai menu "Kondisi Sistem UP3 Sorong" (kondisi.js) agar angka web = angka PPT
    core: { model:model, baseRecords:baseRecords, win:win, inWin:inWin, prevWin:prevWin, wLabel:wLabel, delta:delta, stColor:stColor,
      countBy:countBy, topN:topN, sortT:sortT, trip:trip, indik:indik, penyebab:penyebab, dd:dd, weekNote:weekNote, colItems:colItems,
      defaultWeek:defaultWeek, iso:iso, parseIso:parseIso, loadOpts:loadOpts, saveOpts:saveOpts,
      nf:nf, p0:p0, p1:p1, pct:pct, sum:sum, cut:cut, cap1:cap1, list:list, tb:tb, esc:esc,
      KNAMA:KNAMA, TINDAK:TINDAK, ULP4:ULP4, UCLR:UCLR, KCLR:KCLR, BULAN:BULAN, BL3:BL3, YEAR:YEAR, C_UP:C_UP, C_DOWN:C_DOWN, C_FLAT:C_FLAT } };
})();
