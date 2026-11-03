/* Ekspor PPT khusus Monitoring AO — format mengikuti ao-template.pptx (AO_M1_November) dan diisi data live */
(function(){
  var TEMPLATE = "ao-template.pptx";
  var BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  var BLS = ["JAN","FEB","MAR","APR","MEI","JUN","JUL","AGU","SEP","OKT","NOV","DES"];
  var PER_PAGE = 14;
  var PPR = /<a:pPr\b[^>]*\/>|<a:pPr\b[^>]*>[\s\S]*?<\/a:pPr>/;
  var RPR = /<a:rPr\b[^>]*\/>|<a:rPr\b[^>]*>[\s\S]*?<\/a:rPr>/;
  var ROWID = /<a:extLst><a:ext uri="\{0D108BD9[\s\S]*?<\/a:extLst>/g;

  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,""); }
  function loc(n,d){ return (n||0).toLocaleString("id-ID",{minimumFractionDigits:d,maximumFractionDigits:d}); }
  function rp(n){ return Math.round(n||0).toLocaleString("id-ID"); }
  function M(n){ return "Rp "+loc((n||0)/1e9,2)+" M"; }
  function J(n){ return Math.abs(n||0)>=1e9 ? M(n) : "Rp "+loc((n||0)/1e6,1)+" jt"; }
  function pct(a,b){ return b ? a/b*100 : 0; }
  function p1(v){ return loc(v,1)+"%"; }
  function titleCase(s){ return String(s||"").toLowerCase().replace(/(^|\s|\()([a-z])/g,function(m,a,b){return a+b.toUpperCase();}).replace(/\b(Ulp|Jtm|Jtr|Sktm|Sutm|Pdkb|Ups|Kva|Lbs|Pfk|Apd|Gh|Kv|Mvtic|Sm|Ii|Iii|Iv|Tw|Pt|Cv|Kwh|Sr|Hut|Ri|Pkp|Up3|Ppk|Bbm|Hps)\b/g,function(w){return w.toUpperCase().replace("KWH","kWh").replace("KVA","kVA");}).replace(/^PT\.\s*/,"PT ").replace(/^CV\.\s*/,"CV "); }
  var SH = {"peralatan, material & fast moving":"Material & Fast Moving","gudang & logistik distribusi":"Gudang & Logistik","operasional & perjalanan pemeliharaan":"Operasional & Perjalanan","peremajaan peralatan pendukung operasi":"Peremajaan Peralatan Pend."};
  function short(n){ n=String(n||"").trim(); return SH[n.toLowerCase()] || n.replace(/^Pemeliharaan\s+/i,""); }
  function list(a){ return a.length<=1 ? a.join("") : a.slice(0,-1).join(", ")+" dan "+a[a.length-1]; }

  /* ---------- XML helpers: ganti teks dengan tetap memakai format template ---------- */
  function rebuildP(p, strs, fb){
    var pPr=(p.match(PPR)||[""])[0], groups=[], last=null;
    (p.match(/<a:r>[\s\S]*?<\/a:r>/g)||[]).forEach(function(r){ var x=(r.match(RPR)||["<a:rPr/>"])[0], k=x.replace(/ (err|dirty|lang)="[^"]*"/g,""); if(k!==last){ groups.push(x); last=k; } });
    if(!groups.length) groups.push(fb || '<a:rPr lang="id-ID"/>');
    return "<a:p>"+pPr+strs.map(function(t,k){ return "<a:r>"+groups[Math.min(k,groups.length-1)].replace(/ err="1"/,"")+"<a:t>"+esc(t)+"</a:t></a:r>"; }).join("")+"</a:p>";
  }
  function setParas(frag, paras, fb){
    var ps=frag.match(/<a:p>[\s\S]*?<\/a:p>/g); if(!ps) return frag;
    var out=paras.map(function(s,i){ return rebuildP(ps[Math.min(i,ps.length-1)], s, fb); }).join("");
    var a=frag.indexOf(ps[0]), b=frag.lastIndexOf(ps[ps.length-1])+ps[ps.length-1].length;
    return frag.slice(0,a)+out+frag.slice(b);
  }
  function setShape(x, name, paras){
    var i=x.indexOf('name="'+name+'"'); if(i<0) return x;
    var st=x.lastIndexOf("<p:sp>",i), en=x.indexOf("</p:sp>",i)+7;
    return x.slice(0,st)+setParas(x.slice(st,en), paras)+x.slice(en);
  }
  function fbr(sz,color,b){ return '<a:rPr sz="'+sz+'" b="'+(b?1:0)+'" i="0"><a:solidFill><a:srgbClr val="'+(color||"2A2A2A")+'"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr>'; }
  function setCell(tc, text, o){
    o=o||{};
    var r=setParas(tc, [text===""||text==null?[]:[String(text)]], fbr(o.sz||800, o.color, o.b));
    if(o.color) r=r.replace(/(<a:r><a:rPr[\s\S]*?<a:srgbClr val=")\w+/, "$1"+o.color);
    if(o.fill) r=r.replace(/<a:srgbClr val="\w+"\/><\/a:solidFill><\/a:tcPr>/, '<a:srgbClr val="'+o.fill+'"/></a:solidFill></a:tcPr>');
    return r;
  }
  function fillRow(proto, vals, opts){
    var i=0; opts=opts||[];
    return proto.replace(ROWID,"").replace(/<a:tc\b[^>]*>[\s\S]*?<\/a:tc>/g, function(tc){ var k=i++; return k<vals.length ? setCell(tc, vals[k], opts[k]) : tc; });
  }
  function rows(x){ return x.match(/<a:tr [\s\S]*?<\/a:tr>/g)||[]; }
  function setRows(x, newRows){
    var rs=rows(x), a=x.indexOf(rs[0]), b=x.lastIndexOf(rs[rs.length-1])+rs[rs.length-1].length;
    return x.slice(0,a)+newRows.join("")+x.slice(b);
  }

  /* ---------- olah data ---------- */
  function model(AO, now){
    var T=AO.totalRow||{}, C=(AO.contracts||[]).slice(), jobs=(AO.jobs||[]).slice();
    var prkName={}; jobs.forEach(function(j){ prkName[j.prk]=j.nama; });
    var today=now.toISOString().slice(0,10);
    var by=function(f){ return C.filter(f); }, sum=function(l,f){ return l.reduce(function(a,c){ return a+(f(c)||0); },0); };
    var st={Selesai:by(function(c){return c.status==="Selesai";}), "On Progres":by(function(c){return c.status==="On Progres";})};
    st["Belum Mulai"]=by(function(c){ return c.status!=="Selesai" && c.status!=="On Progres"; });
    var th={}; ["Terbayar","Proses Tagihan","Pelaksanaan","Pengadaan"].forEach(function(t){ th[t]=by(function(c){return c.tahap===t;}); });
    var late=by(function(c){ return c.akhir && c.akhir<today && c.status!=="Selesai"; });
    var kontrak=by(function(c){ return c.nilai>0; });
    var mitra={}; kontrak.forEach(function(c){ if(c.mitra) mitra[c.mitra.toUpperCase().replace(/[^A-Z0-9]/g,"")]=1; });
    var hs=(AO.hutang||[]).find(function(h){ return /sorong/i.test(h.unit); });
    return {T:T, C:C, jobs:jobs, prkName:prkName, today:today, st:st, th:th, late:late, kontrak:kontrak, nMitra:Object.keys(mitra).length, hs:hs, sum:sum,
      jalan:Math.max((T.terkontrak||0)-(T.terbayar||0)-(T.tagihan||0),0),
      pK:pct(T.terkontrak,T.skao), pB:pct(T.terbayar,T.skao), pBK:pct(T.terbayar,T.terkontrak)};
  }

  function slide1(x, m, now){
    return x.replace(/Sorong, [A-Za-z]+ \d{4}/, "Sorong, "+BULAN[now.getMonth()]+" "+now.getFullYear());
  }
  function slide2(x, m, now){
    var T=m.T, bln=BULAN[now.getMonth()]+" "+now.getFullYear(), vt;
    if(m.pK>=90 && m.pBK>=60) vt="Penyerapan Anggaran Sehat"; else if(m.pBK<50) vt="Perlu Percepatan Pembayaran"; else vt="Perlu Percepatan Kontrak";
    x=setShape(x,"Verdict",[["EVALUASI PER "+now.getDate()+" "+BLS[now.getMonth()]+" "+now.getFullYear()],[vt]]);
    x=setShape(x,"Stat 1",[[p1(m.pK)],["Terkontrak / SKAO"]]);
    x=setShape(x,"Stat 2",[[p1(m.pBK)],["Terbayar / Kontrak"]]);
    x=setShape(x,"Stat 3",[[m.st.Selesai.length+"/"+m.C.length],["Paket selesai fisik"]]);
    x=setShape(x,"Stat 4",[[String(m.late.length)],["Paket lewat akhir kontrak"]]);
    var sisaK=Math.max(T.skao-T.terkontrak,0);
    x=setShape(x,"Temuan Item 1",[["Kontrak "+M(T.terkontrak)+" ("+p1(m.pK)+" SKAO). ", "Sisa "+M(sisaK)+" belum terkontrak"+(T.lelang?", "+M(T.lelang)+" di antaranya masih proses pengadaan.":".")]]);
    x=setShape(x,"Temuan Item 2",[[(m.pBK<50?"Pembayaran tertinggal: ":"Pembayaran berjalan: ")+M(T.terbayar)+" ", "("+p1(m.pB)+" SKAO; "+p1(m.pBK)+" kontrak), tagihan proses "+M(T.tagihan)+" ("+m.th["Proses Tagihan"].length+" paket)."]]);
    x=setShape(x,"Temuan Item 3",[[m.C.length+" paket: "+m.st.Selesai.length+" selesai, "+m.st["On Progres"].length+" berjalan, "+m.st["Belum Mulai"].length+" belum mulai. ", m.th.Terbayar.length+" terbayar, "+m.th["Proses Tagihan"].length+" proses tagihan, "+m.th.Pelaksanaan.length+" pelaksanaan, "+m.th.Pengadaan.length+" pengadaan."]]);
    var nT=m.th["Proses Tagihan"].length;
    x=setShape(x,"Tindak Item 1", nT ? [["Percepat verifikasi "+nT+" berkas tagihan ", "("+M(T.tagihan)+") sesuai komitmen Tagihan "+bln+"."]] : [["Pertahankan ritme penagihan ", "— belum ada berkas tagihan yang tertahan per "+bln+"."]]);
    var peng=m.th.Pengadaan, hps=peng.filter(function(c){ return !c.lelang && !c.nilai; }).length;
    x=setShape(x,"Tindak Item 2", peng.length ? [["Tuntaskan "+peng.length+" paket pengadaan ", "("+M(T.lelang)+") agar terkontrak "+bln+(hps?"; tetapkan HPS "+hps+" paket yang belum bernilai.":".")]] : [["Pengadaan tuntas: ", "seluruh paket sudah terkontrak."]]);
    var def=m.jobs.filter(function(j){return j.sisa<0;}).sort(function(a,b){return a.sisa-b.sisa;}).slice(0,3).map(function(j){return short(j.nama);});
    var src=m.jobs.filter(function(j){return j.sisa>0;}).sort(function(a,b){return b.sisa-a.sisa;}).slice(0,3).map(function(j){return short(j.nama);});
    x=setShape(x,"Tindak Item 3", def.length ? [["Rekomposisi anggaran: ", "tutup kekurangan "+list(def)+(src.length?" dari sisa "+list(src):"")+"."]] : [["Optimalkan sisa pagu: ", src.length?"serap sisa anggaran "+list(src)+" sebelum akhir tahun.":"seluruh pagu telah terserap kontrak."]]);
    return x;
  }
  function slide3(x, m){
    var T=m.T, b=function(n){ return loc((n||0)/1e9,2); }, sisaK=Math.max(T.skao-T.terkontrak,0);
    x=setShape(x,"TextBox 5",[["Rp "+b(T.skao)," miliar"]]);
    x=setShape(x,"TextBox 9",[["Rp "+b(T.terkontrak)," miliar"]]);
    x=setShape(x,"TextBox 10",[[p1(m.pK)+" dari pagu SKKO"]]);
    x=setShape(x,"TextBox 13",[["Rp "+b(sisaK)," miliar"]]);
    x=setShape(x,"TextBox 14",[[p1(pct(sisaK,T.skao))+" pagu · proses pengadaan "+M(T.lelang)]]);
    x=setShape(x,"TextBox 17",[["Rp "+b(T.tagihan)," miliar"]]);
    x=setShape(x,"TextBox 18",[[m.th["Proses Tagihan"].length+" paket dalam verifikasi pembayaran"]]);
    x=setShape(x,"TextBox 21",[["Rp "+b(T.terbayar)," miliar"]]);
    x=setShape(x,"TextBox 22",[[p1(m.pB)+" pagu · "+p1(m.pBK)+" terkontrak"]]);
    x=setShape(x,"TextBox 25",[[String(m.C.length)," paket"]]);
    x=setShape(x,"TextBox 26",[[m.kontrak.length+" terkontrak · "+m.nMitra+" mitra pelaksana"]]);
    x=setShape(x,"TextBox 28",[["Komposisi SKKO:   ","Jasa "+M(T.jasa)+" ("+p1(pct(T.jasa,T.skao))+")","        ·        ","Material "+M(T.material)+" ("+p1(pct(T.material,T.skao))+")","        ·        "+m.jobs.length+" Jenis Kegiatan"]]);
    return x;
  }
  function slide4(x, m){
    var T=m.T, rs=rows(x), sz=750;
    var num=function(c){ return {sz:sz}; };
    var tot=fillRow(rs[2],["",(window.AO&&AO.unit||"UP3 Sorong")+" — TOTAL SKAO","",rp(T.material),rp(T.jasa),rp(T.skao),rp(T.lelang),rp(T.terkontrak),Math.round(m.pK)+"%",rp(T.tagihan),rp(T.terbayar),Math.round(m.pB)+"%",rp(T.sisa)],
      [null,null,null,null,null,null,{sz:800,b:1,color:"142C54"},null,null,null,null,null,{sz:800,b:1,color:"142C54"}]);
    var data=m.jobs.map(function(j,i){
      var o=[]; o[6]={sz:sz,color:"0E74B8"}; o[7]={sz:sz,color:"0E74B8"}; o[12]={sz:sz,color:j.sisa<0?"FF0000":"000000"};
      return fillRow(rs[3+(i%2)], [String(i+1), j.nama, j.prk, j.material?rp(j.material):"–", rp(j.jasa), rp(j.skao), j.lelang?rp(j.lelang):"", j.terkontrak?rp(j.terkontrak):"–", loc(pct(j.terkontrak,j.skao),2)+"%", rp(j.tagihan), rp(j.terbayar), Math.round(pct(j.terbayar,j.skao))+"%", rp(j.sisa)], o);
    });
    return setRows(x, [rs[0],rs[1],tot].concat(data));
  }
  function slide5(x, m){
    var T=m.T, S=m.st, sv=function(l){ return m.sum(l,function(c){ return c.nilai||c.lelang; }); };
    x=setShape(x,"Title",[["Status Pekerjaan AO 2026 — "+m.C.length+" Paket"]]);
    x=setShape(x,"Doughnut Center",[[String(m.C.length)],["paket"]]);
    x=setShape(x,"Legend Selesai Val",[[S.Selesai.length+" paket"," · "+M(sv(S.Selesai))]]);
    x=setShape(x,"Legend On Progres Val",[[S["On Progres"].length+" paket"," · "+M(sv(S["On Progres"]))]]);
    x=setShape(x,"Legend Belum Mulai Val",[[S["Belum Mulai"].length+" paket"," · "+M(sv(S["Belum Mulai"]))]]);
    var bln=BULAN[new Date().getMonth()]+" "+new Date().getFullYear(), nT=m.th["Proses Tagihan"].length, nP=m.th.Pengadaan.length;
    x=setShape(x,"Alert 2",[[nT+" ","paket","   "+M(T.tagihan)],["Tagihan dalam proses — komitmen dibayar "+bln+"."]]);
    x=setShape(x,"Alert 3",[[nP+" ","paket","   "+M(T.lelang)],["Masih tahap pengadaan / dokumen; harus terkontrak sebelum akhir tahun."]]);
    var hs=m.hs;
    if(hs) x=setShape(x,"Alert 4",[["Hutang usaha 2025","   "+J(hs.belum)],[hs.belum>0?"Belum terbayar dari "+J(hs.terkontrak)+" ("+p1(pct(hs.terbayar,hs.terkontrak))+" sudah terbayar).":"Lunas — seluruh "+J(hs.terkontrak)+" sudah terbayar."]]);
    return x;
  }
  function chart1(x, m){
    var v=[m.st.Selesai.length, m.st["On Progres"].length, m.st["Belum Mulai"].length];
    return x.replace(/(<c:val>[\s\S]*?<\/c:val>)/, function(s){ var i=0; return s.replace(/<c:v>[^<]*<\/c:v>/g, function(){ return "<c:v>"+v[i++]+"</c:v>"; }); })
      .replace(/<c:externalData[\s\S]*?<\/c:externalData>/,"");
  }
  function chart2(x, m){
    var T=m.T, th=m.th, cat=["Terbayar ("+th.Terbayar.length+")","Proses Tagihan ("+th["Proses Tagihan"].length+")","Pelaksanaan ("+th.Pelaksanaan.length+")","Pengadaan ("+th.Pengadaan.length+")"];
    var val=[T.terbayar, T.tagihan, m.jalan, T.lelang].map(function(n){ return Math.round((n||0)/1e7)/100; });
    var i=0, j=0, k=0, mx=Math.max.apply(null, val.concat([0.1]));
    return x.replace(/(<c:cat>[\s\S]*?<\/c:cat>)/, function(s){ return s.replace(/<c:v>[^<]*<\/c:v>/g, function(){ return "<c:v>"+esc(cat[i++])+"</c:v>"; }); })
      .replace(/(<c:val>[\s\S]*?<\/c:val>)/, function(s){ return s.replace(/<c:v>[^<]*<\/c:v>/g, function(){ return "<c:v>"+val[j++]+"</c:v>"; }); })
      .replace(/(<c:dLbl><c:idx val="\d"\/><c:tx>[\s\S]*?<a:t>)[^<]*(<\/a:t>)/g, function(s,a,b){ return a+"Rp "+loc(val[k++],2)+" M"+b; })
      .replace(/<c:max val="[^"]*"\/>/, '<c:max val="'+(Math.ceil(mx*1.18*10)/10)+'"/>')
      .replace(/<c:externalData[\s\S]*?<\/c:externalData>/,"");
  }
  var ST_C={"Selesai":"2FA96A","On Progres":"0E74B8"}, TH_C={"Terbayar":["2FA96A","ECF6EF"],"Proses Tagihan":["1486B5","E6F5FC"],"Pelaksanaan":["0E74B8","EFF5FB"],"Pengadaan":["0F8B8D","E7F4F4"]};
  function fd(d){ var p=d.split("-"); return p[2]+"/"+p[1]+"/"+p[0].slice(2); }
  function tablePage(x, m, list, start, page, pages){
    x=setShape(x,"Title",[["Daftar Pekerjaan & Status — Paket AO 2026 ("+page+"/"+pages+")"]]);
    var rs=rows(x);
    var data=list.map(function(c,i){
      var isLate=c.akhir && c.akhir<m.today && c.status!=="Selesai";
      var ket=[]; if(isLate) ket.push("Lewat akhir kontrak ("+fd(c.akhir)+")"); if(c.mulai && +c.mulai.slice(0,4)<2026) ket.push("Hutang usaha 2025");
      [c.ket,c.komitmen].forEach(function(t){ t=String(t||"").replace(/\s+/g," ").trim(); var lt=t.toLowerCase(); if(t && !ket.some(function(s){ s=s.toLowerCase(); return s.indexOf(lt)>=0 || lt.indexOf(s.replace(/ \d{4}$/,""))>=0; })) ket.push(t); });
      var stc=c.risiko?"C62828":(ST_C[c.status]||"8A939E"), thc=TH_C[c.tahap]||TH_C.Pelaksanaan;
      var o=[]; o[2]={sz:800,color:c.mitra?"2A2A2A":"8A939E"}; o[4]={sz:800,color:c.nilai?"2A2A2A":"0F8B8D"};
      o[6]={sz:800,b:1,color:stc}; o[7]={sz:800,b:1,color:thc[0],fill:thc[1]}; o[8]={sz:750,color:isLate?"C62828":"5B6673"};
      return fillRow(rs[1+(i%2)], [String(start+i+1), titleCase(c.uraian), c.mitra?titleCase(c.mitra):"Belum ditetapkan", short(m.prkName[c.prk]||c.prk), c.nilai?rp(c.nilai):(c.lelang?rp(c.lelang):"–"), c.fisik>0?Math.round(c.fisik)+"%":"–", c.status||"–", c.tahap||"–", ket.join(" · ")||"–"], o);
    });
    return setRows(x, [rs[0]].concat(data));
  }

  async function build(JSZip, AO, now){
    var resp=await fetch(TEMPLATE); if(!resp.ok) throw new Error("Template PPT AO tidak ditemukan ("+TEMPLATE+")");
    var zip=await JSZip.loadAsync(await resp.arrayBuffer()), m=model(AO, now);
    var rd=function(p){ return zip.file(p).async("string"); };
    zip.file("ppt/slides/slide1.xml", slide1(await rd("ppt/slides/slide1.xml"), m, now));
    zip.file("ppt/slides/slide2.xml", slide2(await rd("ppt/slides/slide2.xml"), m, now));
    zip.file("ppt/slides/slide3.xml", slide3(await rd("ppt/slides/slide3.xml"), m));
    zip.file("ppt/slides/slide4.xml", slide4(await rd("ppt/slides/slide4.xml"), m));
    zip.file("ppt/slides/slide5.xml", slide5(await rd("ppt/slides/slide5.xml"), m));
    zip.file("ppt/charts/chart1.xml", chart1(await rd("ppt/charts/chart1.xml"), m));
    zip.file("ppt/charts/chart2.xml", chart2(await rd("ppt/charts/chart2.xml"), m));
    ["chart1","chart2"].forEach(function(c){ zip.file("ppt/charts/_rels/"+c+".xml.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'); });
    zip.remove("ppt/embeddings/Microsoft_Excel_Worksheet.xlsx"); zip.remove("ppt/embeddings/Microsoft_Excel_Worksheet1.xlsx");

    // Halaman daftar pekerjaan: slide6 sebagai prototipe, jumlah halaman mengikuti jumlah paket
    var proto=await rd("ppt/slides/slide6.xml"), protoRel=await rd("ppt/slides/_rels/slide6.xml.rels");
    var pres=await rd("ppt/presentation.xml"), prels=await rd("ppt/_rels/presentation.xml.rels"), ct=await rd("[Content_Types].xml");
    for(var n=6;n<=10;n++){
      var re=new RegExp('<Relationship Id="(rId\\d+)"[^>]*Target="slides/slide'+n+'\\.xml"/>'), mm=prels.match(re);
      if(mm){ pres=pres.replace(new RegExp('<p:sldId id="\\d+" r:id="'+mm[1]+'"/>'),""); prels=prels.replace(mm[0],""); }
      ct=ct.replace('<Override PartName="/ppt/slides/slide'+n+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>',"");
      zip.remove("ppt/slides/slide"+n+".xml"); zip.remove("ppt/slides/_rels/slide"+n+".xml.rels");
    }
    // Urutan sesuai format AO_M1_November: per tahap (Pelaksanaan → Proses Tagihan → Pengadaan → Terbayar),
    // dalam tahap: paket lewat akhir kontrak lebih dulu, lalu nilai terbesar.
    var TH_ORD={"Pelaksanaan":0,"Proses Tagihan":1,"Pengadaan":2,"Terbayar":3};
    var lateOf=function(c){ return c.akhir && c.akhir<m.today && c.status!=="Selesai" ? 0 : 1; };
    var C=m.C.map(function(c,i){ return {c:c,i:i}; }).sort(function(a,b){
      var ta=TH_ORD[a.c.tahap], tb=TH_ORD[b.c.tahap]; ta=ta==null?9:ta; tb=tb==null?9:tb;
      return (ta-tb) || (lateOf(a.c)-lateOf(b.c)) || (((b.c.nilai||b.c.lelang||0)-(a.c.nilai||a.c.lelang||0))) || (a.i-b.i);
    }).map(function(x){ return x.c; }), pages=Math.max(1,Math.ceil(C.length/PER_PAGE)), ids="", rels="", over="";
    for(var p=0;p<pages;p++){
      var sn=6+p, rid="rIdAO"+sn;
      zip.file("ppt/slides/slide"+sn+".xml", tablePage(proto, m, C.slice(p*PER_PAGE,(p+1)*PER_PAGE), p*PER_PAGE, p+1, pages));
      zip.file("ppt/slides/_rels/slide"+sn+".xml.rels", protoRel);
      ids+='<p:sldId id="'+(2000+sn)+'" r:id="'+rid+'"/>';
      rels+='<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+sn+'.xml"/>';
      over+='<Override PartName="/ppt/slides/slide'+sn+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
    }
    zip.file("ppt/presentation.xml", pres.replace("</p:sldIdLst>", ids+"</p:sldIdLst>"));
    zip.file("ppt/_rels/presentation.xml.rels", prels.replace("</Relationships>", rels+"</Relationships>"));
    zip.file("[Content_Types].xml", ct.replace("</Types>", over+"</Types>"));
    var blob=await zip.generateAsync({type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation"});
    return {blob:blob, name:"AO_M"+Math.ceil(now.getDate()/7)+"_"+BULAN[now.getMonth()]+"_"+now.getFullYear()+".pptx"};
  }
  window.AOPPT = { build: build, _model: model };
})();
