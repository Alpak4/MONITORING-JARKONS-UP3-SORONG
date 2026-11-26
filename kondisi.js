/* Menu "Kondisi Sistem UP3 Sorong" — Progres Penormalan Kelistrikan Sistem Sorong.
   Format: "Progress_Penormalan_Kelistrikan_Sorong_Editabel_v3_1.pptx" (1 slide).
   Data diisi/diedit di menu ini, tersimpan di browser (localStorage), dapat diekspor/impor JSON,
   disalin sebagai ringkasan WhatsApp, dan diunduh sebagai PPT format yang sama (template: js/kondisi-template.js). */
(function(){
  "use strict";
  var TEMPLATE = "kondisi-template.js";
  var LSKEY = "kondisi_penormalan_v1";
  var ULPS = ["Sorong Kota","Aimas","Teminabuan","Waisai"];
  var ST = {O:"Operasi", G:"Gangguan", P:"Pemeliharaan", S:"Standby"};
  var MAX_FOTO = 4;
  var S, inited = false;

  /* ---------- data awal (sesuai PPT update 26/11/2026 13:35 WIT) ---------- */
  function units(names, off){ return names.map(function(n){ var o=off&&off[n]; return {n:n, mw:o?o.mw:"", s:o?o.s:"O", ket:o?o.ket:""}; }); }
  function defaults(){
    return {
      v:1, tgl:"2026-11-26", jam:"13:35",
      judul:"PROGRES PENORMALAN KELISTRIKAN SISTEM SORONG",
      cards:[
        {k:"ulp", l:"ULP", j:0, n:0},
        {k:"pny", l:"PENYULANG", j:0, n:0},
        {k:"beban", l:"BEBAN (kW)", j:0, n:0},
        {k:"captive", l:"BEBAN CAPTIVE (kW)", j:300, n:0},
        {k:"trafo", l:"TRAFO (unit)", j:1, n:0},
        {k:"plg", l:"PELANGGAN", j:1, n:0}
      ],
      dmp:"61,38",
      eng:[
        {id:"mpp", judul:"PLTMG MPP", nama:"PLTMG MPP", units:units(["Unit 1","Unit 2","Unit 3","Unit 4","Unit 5"], {"Unit 4":{mw:"9,37", s:"P", ket:"dalam kondisi PM 48K (14 November s/d 13 Desember 2026)"}})},
        {id:"sewatama", judul:"SEWATAMA", nama:"PLTD Sewatama", units:units(["Unit 1","Unit 2","Unit 3","Unit 4","Unit 5","Unit 6","Unit 7","Unit 8","Unit 9","Unit 10","Unit 11"], {"Unit 3":{mw:"1", s:"P", ket:"kondisi cleaning radiator dan ganti coolant tgl 26 Nov"}})},
        {id:"maxpower", judul:"MAX POWER", nama:"PLTMG Max Power", units:units(["Unit 1","Unit 3","Unit 4","Unit 5","Unit 7"])},
        {id:"klasaman", judul:"KLASAMAN", nama:"PLTD Klasaman", units:units(["MAK 1","MAK 2","MAK 3","MAK 4"], {"MAK 3":{mw:"1,7", s:"G", ket:"kondisi gangguan kebocoran air cylinder no 3 tgl 24 Nov"}, "MAK 4":{mw:"1,7", s:"G", ket:"kondisi gangguan tekanan air hunting tgl 26 Nov"}})},
        {id:"klademak", judul:"KLADEMAK", nama:"PLTD Klademak", units:units(["Daihatsu"])}
      ],
      daerah:{"Sorong Kota":"-", "Aimas":"Pelanggan Saga Aimas (300 kW pukul 13.35 WIT)", "Teminabuan":"", "Waisai":""},
      pembuka:"Proses penormalan Sistem Sorong dilakukan secara bertahap menyusul adanya kendala teknis pada beberapa unit pembangkit dan adanya jadwal pemeliharaan sehingga terjadi keterbatasan daya pembangkit.",
      autoNote:true,
      penutup:"PLN terus berkoordinasi lintas unit dan mengupayakan percepatan pemulihan dengan tetap mengutamakan keselamatan serta keandalan sistem.",
      footer:"PLN mengupayakan percepatan pemulihan secara bertahap dengan tetap mengutamakan keselamatan dan kestabilan sistem.",
      foto:[]
    };
  }

  /* ---------- util ---------- */
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,""); }
  function num(v){ var n=parseFloat(String(v==null?"":v).replace(/\./g,"").replace(",",".")); return isFinite(n)?n:0; }
  function mwNum(v){ var s=String(v==null?"":v).trim(); if(!s) return 0; s=/,/.test(s)?s.replace(/\./g,"").replace(",","."):s; var n=parseFloat(s); return isFinite(n)?n:0; }
  function nf(n,d){ return (+n||0).toLocaleString("id-ID",{minimumFractionDigits:0,maximumFractionDigits:d==null?0:d}); }
  function mwTxt(v){ var n=mwNum(v); return String(v==null?"":v).trim()? nf(n,2) : ""; }
  function lines(t){ return String(t||"").split(/\r?\n/).map(function(s){ return s.replace(/^\s*[•\-–]\s+/,"").trim(); }).filter(Boolean); }
  function pct(c){ var j=num(c.j), n=num(c.n); return j>0 ? Math.min(100,Math.round(n/j*100)) : 0; }
  function padam(c){ return Math.max(0, num(c.j)-num(c.n)); }
  function jamDot(){ return String(S.jam||"").replace(":","."); }
  function tglTxt(sep){ var m=String(S.tgl||"").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[3]+sep+m[2]+sep+m[1] : ""; }
  function code(u){ var m=String(u.n).match(/^unit\s*(\d+)$/i); if(m) return "#"+m[1]; m=String(u.n).match(/^([A-Za-z]+)\s*(\d+)$/); return m ? m[1]+" #"+m[2] : u.n; }
  function save(){ try{ localStorage.setItem(LSKEY, JSON.stringify(S)); $("kn-save").textContent="Tersimpan di browser ini · "+new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}); $("kn-save").className="kn-save"; scheduleBackup(); }
    catch(e){ $("kn-save").textContent="Gagal menyimpan (memori browser penuh) — kurangi/hapus foto."; $("kn-save").className="kn-save kn-save--err"; } }
  function load(){ try{ var o=JSON.parse(localStorage.getItem(LSKEY)); if(o && o.v===1 && o.cards && o.eng) return o; }catch(e){} return defaults(); }

  /* ---------- isi catatan (pembuka + otomatis + penutup) ---------- */
  function opCount(e){ return e.units.filter(function(u){ return u.s==="O"; }).length; }
  function autoLines(){
    var out=[];
    if(String(S.dmp||"").trim()) out.push("Pada pukul "+jamDot()+" WIT, Daya mampu pembangkit (DMP) yang beroperasi sebesar "+mwTxt(S.dmp)+" MW");
    var op=S.eng.filter(function(e){ return opCount(e)>0; }).map(function(e){ return e.nama+" "+opCount(e)+" Unit"; });
    if(op.length) out.push("Unit pembangkit yang beroperasi saat ini : "+(op.length>1?op.slice(0,-1).join(", ")+", dan "+op[op.length-1]:op[0])+".");
    S.eng.forEach(function(e){ e.units.forEach(function(u){ if(u.s==="O") return;
      var ket=String(u.ket||"").trim() || (u.s==="G"?"dalam kondisi gangguan":(u.s==="P"?"dalam pemeliharaan":"dalam kondisi standby"));
      out.push(e.nama+" "+code(u)+" "+ket+(mwTxt(u.mw)?" – "+mwTxt(u.mw)+" MW":"")); }); });
    return out;
  }
  function notes(){ return lines(S.pembuka).concat(S.autoNote?autoLines():[]).concat(lines(S.penutup)); }
  function daerahList(){ return ULPS.map(function(u){ return {u:u, it:lines(S.daerah[u])}; }).filter(function(d){ return d.it.length; }); }
  function dmpSum(){ var s=0, any=false; S.eng.forEach(function(e){ e.units.forEach(function(u){ if(u.s==="O" && String(u.mw).trim()){ s+=mwNum(u.mw); any=true; } }); }); return any?s:null; }

  /* ---------- papan (tampilan seperti slide) ---------- */
  function renderBoard(){
    $("kn-b-title").textContent=S.judul;
    $("kn-b-upd").textContent="INFORMASI PEMULIHAN BERTAHAP  •  UPDATE: "+tglTxt(" / ")+"  |  "+S.jam+" WIT";
    $("kn-b-cards").innerHTML=S.cards.map(function(c){ var p=pct(c);
      return '<div class="kn-card"><div class="kn-card__h">'+esc(c.l)+'</div><div class="kn-card__lbl">Jumlah terdampak</div><div class="kn-card__v">'+nf(num(c.j))+'</div>'+
        '<div class="kn-card__row"><div><span class="kn-red" title="Jumlah terdampak − sudah nyala">Terdampak</span><b class="kn-red">'+nf(padam(c))+'</b></div><div class="kn-card__pct'+(p>=100?" ok":"")+'">'+p+' %</div><div><span class="kn-green">Sudah nyala</span><b class="kn-green">'+nf(num(c.n))+'</b></div></div>'+
        '<div class="kn-bar"><i style="width:'+p+'%"></i></div></div>'; }).join("");
    $("kn-b-eng").innerHTML=S.eng.map(function(e){ var op=opCount(e);
      return '<div class="kn-eng"><div class="kn-eng__h">'+esc(e.judul)+'<span>'+op+'/'+e.units.length+' unit</span></div><ul>'+
        e.units.map(function(u){ return '<li class="'+(u.s==="O"?"":"off")+'"><span>'+esc(u.n)+'</span><b>'+(mwTxt(u.mw)||"–")+' MW</b>'+(u.s==="O"?'<i class="kn-dot" title="Operasi"></i>':'<em title="'+esc(ST[u.s]+(u.ket?": "+u.ket:""))+'">×</em>')+'</li>'; }).join("")+'</ul></div>'; }).join("")+'<div class="kn-eng-lg"><i class="kn-dot"></i> operasi · <b style="color:#E2231A">×</b> tidak beroperasi (arahkan kursor untuk keterangan)</div>';
    var dl=daerahList();
    $("kn-b-daerah").innerHTML=dl.length ? dl.map(function(d){ return '<div class="kn-ulp"><b>ULP '+esc(d.u)+' :</b><ul>'+d.it.map(function(t){ return "<li>"+esc(t)+"</li>"; }).join("")+'</ul></div>'; }).join("") : '<div class="kn-muted">Tidak ada daerah yang masih terdampak.</div>';
    $("kn-b-notes").innerHTML="<ul>"+notes().map(function(t){ return "<li>"+esc(t)+"</li>"; }).join("")+"</ul>";
    $("kn-b-foto").innerHTML=S.foto.length ? S.foto.map(function(f){ return '<figure><img src="'+f.src+'" alt="'+esc(f.cap||"Dokumentasi")+'">'+(f.cap?'<figcaption>'+esc(f.cap)+'</figcaption>':'')+'</figure>'; }).join("") : '<div class="kn-muted">Belum ada foto. Tambahkan pada formulir Dokumentasi di bawah.</div>';
    $("kn-b-foot").textContent=S.footer;
    var ds=dmpSum(); $("kn-dmp-hint").textContent= ds!=null ? "Jumlah MW unit beroperasi yang terisi: "+nf(ds,2)+" MW" : "MW unit beroperasi belum diisi";
  }

  /* ---------- formulir ---------- */
  function renderForm(){
    $("kn-tgl").value=S.tgl; $("kn-jam").value=S.jam; $("kn-dmp").value=S.dmp;
    $("kn-f-cards").innerHTML=S.cards.map(function(c,i){
      return '<tr><td><b>'+esc(c.l)+'</b></td><td><input type="number" min="0" step="any" data-c="'+i+'" data-f="j" value="'+esc(c.j)+'"></td><td><input type="number" min="0" step="any" data-c="'+i+'" data-f="n" value="'+esc(c.n)+'"></td><td class="num kn-red" id="kn-pd-'+i+'">'+nf(padam(c))+'</td><td class="num" id="kn-pc-'+i+'">'+pct(c)+' %</td></tr>'; }).join("");
    $("kn-f-eng").innerHTML=S.eng.map(function(e,ei){
      return '<div class="kn-fe"><div class="kn-fe__h"><input class="kn-fe__t" data-e="'+ei+'" data-f="judul" value="'+esc(e.judul)+'" title="Judul di papan"><input class="kn-fe__n" data-e="'+ei+'" data-f="nama" value="'+esc(e.nama)+'" title="Nama di catatan"><span class="kn-fe__c">'+opCount(e)+'/'+e.units.length+' beroperasi</span></div>'+
        '<table class="kn-ftbl"><thead><tr><th>Unit</th><th>MW</th><th>Status</th><th>Keterangan (muncul di catatan bila tidak beroperasi)</th><th></th></tr></thead><tbody>'+
        e.units.map(function(u,ui){ return '<tr class="'+(u.s==="O"?"":"off")+'"><td><input data-e="'+ei+'" data-u="'+ui+'" data-f="n" value="'+esc(u.n)+'" class="kn-in-unit"></td><td><input data-e="'+ei+'" data-u="'+ui+'" data-f="mw" value="'+esc(u.mw)+'" inputmode="decimal" class="kn-in-mw" placeholder="–"></td>'+
          '<td><select data-e="'+ei+'" data-u="'+ui+'" data-f="s">'+Object.keys(ST).map(function(k){ return '<option value="'+k+'"'+(u.s===k?" selected":"")+'>'+ST[k]+'</option>'; }).join("")+'</select></td>'+
          '<td><input data-e="'+ei+'" data-u="'+ui+'" data-f="ket" value="'+esc(u.ket)+'" class="kn-in-ket" placeholder="'+(u.s==="O"?"":"mis. kondisi gangguan … tgl 26 Nov")+'"></td><td><button type="button" class="kn-x" data-del="'+ei+':'+ui+'" title="Hapus unit">×</button></td></tr>'; }).join("")+
        '</tbody></table><button type="button" class="kn-add" data-add="'+ei+'">+ Tambah unit</button></div>'; }).join("");
    $("kn-f-daerah").innerHTML=ULPS.map(function(u){ return '<div><label>ULP '+u+'</label><textarea rows="3" data-d="'+u+'" placeholder="Satu baris = satu poin. Kosongkan bila tidak ada.">'+esc(S.daerah[u]||"")+'</textarea></div>'; }).join("");
    $("kn-pembuka").value=S.pembuka; $("kn-penutup").value=S.penutup; $("kn-auto").checked=!!S.autoNote; $("kn-footer").value=S.footer; $("kn-judul").value=S.judul;
    renderFoto();
  }
  function renderFoto(){
    $("kn-f-foto").innerHTML=S.foto.map(function(f,i){ return '<div class="kn-ff"><img src="'+f.src+'" alt=""><input data-fc="'+i+'" value="'+esc(f.cap||"")+'" placeholder="Keterangan foto (opsional)"><button type="button" class="kn-x" data-fd="'+i+'" title="Hapus foto">×</button></div>'; }).join("");
    $("kn-foto-in").disabled = S.foto.length>=MAX_FOTO;
    $("kn-foto-info").textContent=S.foto.length+" / "+MAX_FOTO+" foto";
  }
  function onInput(ev){
    var t=ev.target, d=t.dataset; if(!d) return;
    if(d.c!=null){ var c=S.cards[+d.c]; c[d.f]=t.value===""?0:t.value; $("kn-pd-"+d.c).textContent=nf(padam(c)); $("kn-pc-"+d.c).textContent=pct(c)+" %"; }
    else if(d.e!=null && d.u!=null){ var u=S.eng[+d.e].units[+d.u]; u[d.f]=t.value; if(d.f==="s"){ t.closest("tr").className=t.value==="O"?"":"off"; var e=S.eng[+d.e]; t.closest(".kn-fe").querySelector(".kn-fe__c").textContent=opCount(e)+"/"+e.units.length+" beroperasi"; } }
    else if(d.e!=null){ S.eng[+d.e][d.f]=t.value; }
    else if(d.d!=null){ S.daerah[d.d]=t.value; }
    else if(d.fc!=null){ S.foto[+d.fc].cap=t.value; }
    else return;
    renderBoard(); save();
  }
  function onClick(ev){
    var t=ev.target.closest("button"); if(!t) return; var d=t.dataset;
    if(d.add!=null){ var e=S.eng[+d.add]; e.units.push({n:"Unit "+(e.units.length+1), mw:"", s:"O", ket:""}); }
    else if(d.del){ var p=d.del.split(":"); S.eng[+p[0]].units.splice(+p[1],1); }
    else if(d.fd!=null){ S.foto.splice(+d.fd,1); }
    else return;
    renderForm(); renderBoard(); save();
  }
  function addFoto(files){
    var list=Array.prototype.slice.call(files||[]).filter(function(f){ return /^image\//.test(f.type); }).slice(0, MAX_FOTO-S.foto.length);
    return Promise.all(list.map(function(f){ return new Promise(function(res){
      var img=new Image(), url=URL.createObjectURL(f);
      img.onload=function(){ var k=Math.min(1,1280/Math.max(img.width,img.height)), cv=document.createElement("canvas"); cv.width=Math.round(img.width*k); cv.height=Math.round(img.height*k);
        var g=cv.getContext("2d"); g.fillStyle="#fff"; g.fillRect(0,0,cv.width,cv.height); g.drawImage(img,0,0,cv.width,cv.height); URL.revokeObjectURL(url);
        res({src:cv.toDataURL("image/jpeg",0.75), w:cv.width, h:cv.height, cap:f.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").replace(/^(img|dsc|pxl|wa|photo|image|foto)?\s*[\d\s-]*$/i,"")}); };
      img.onerror=function(){ URL.revokeObjectURL(url); res(null); }; img.src=url; }); })).then(function(arr){
      arr.forEach(function(x){ if(x) S.foto.push(x); }); renderFoto(); renderBoard(); save(); });
  }

  /* ---------- ringkasan WhatsApp ---------- */
  function waText(){
    var L=["*"+S.judul+"*","Update: "+tglTxt("/")+" pukul "+jamDot()+" WIT","","*Jumlah terdampak / sudah nyala*"];
    S.cards.forEach(function(c){ L.push("• "+c.l+": "+nf(num(c.j))+" / "+nf(num(c.n))+" ("+pct(c)+"%) · masih padam "+nf(padam(c))); });
    L.push("","*Engine yang beroperasi*");
    S.eng.forEach(function(e){ var off=e.units.filter(function(u){return u.s!=="O";}).map(function(u){ return u.n+" ("+ST[u.s].toLowerCase()+")"; });
      L.push("• "+e.nama+": "+opCount(e)+"/"+e.units.length+" unit"+(off.length?" — "+off.join(", "):"")); });
    var dl=daerahList(); if(dl.length){ L.push("","*Daerah / wilayah yang masih terdampak*"); dl.forEach(function(d){ L.push("ULP "+d.u+":"); d.it.forEach(function(t){ L.push("• "+t); }); }); }
    L.push("","*Catatan / perkembangan penormalan*"); notes().forEach(function(t){ L.push("• "+t); });
    L.push("","_"+S.footer+"_");
    return L.join("\n");
  }
  function copyWA(){
    var t=waText(), done=function(ok){ var b=$("kn-wa"); b.textContent=ok?"✓ Ringkasan tersalin":"Salin manual dari kotak"; setTimeout(function(){ b.textContent="⧉ Salin ringkasan WA"; },2200); if(!ok){ $("kn-wa-box").hidden=false; $("kn-wa-box").value=t; $("kn-wa-box").select(); } };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function(){ done(true); }, function(){ done(false); }); else done(false);
  }

  /* ---------- ekspor / impor JSON ---------- */
  function exportJson(){
    var a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:"application/json"}));
    a.download="Penormalan Sistem Sorong "+tglTxt("-")+" "+String(S.jam).replace(":","")+".json"; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1500);
  }
  function importJson(file){
    var r=new FileReader(); r.onload=function(){ try{ var o=JSON.parse(r.result); if(!o||o.v!==1||!o.cards||!o.eng) throw 0; S=Object.assign(defaults(),o); renderForm(); renderBoard(); save(); }catch(e){ alertBox("Berkas JSON tidak sesuai format data penormalan."); } }; r.readAsText(file);
  }
  function alertBox(t){ var s=$("kn-save"); s.textContent=t; s.className="kn-save kn-save--err"; }

  /* ---------- PPT ---------- */
  var FONT='<a:latin typeface="Times New Roman" panose="02020603050405020304" pitchFamily="18" charset="0"/><a:cs typeface="Times New Roman" panose="02020603050405020304" pitchFamily="18" charset="0"/>';
  var C75='<a:solidFill><a:schemeClr val="tx2"><a:lumMod val="75000"/></a:schemeClr></a:solidFill>', CTX='<a:solidFill><a:schemeClr val="tx2"/></a:solidFill>', CRED='<a:solidFill><a:srgbClr val="FF0000"/></a:solidFill>';
  var BUL='<a:buFont typeface="Arial" panose="020B0604020202020204" pitchFamily="34" charset="0"/><a:buChar char="•"/>';
  var PPR=/<a:pPr\b[^>]*\/>|<a:pPr\b[^>]*>[\s\S]*?<\/a:pPr>/, RPR=/<a:rPr\b[^>]*\/>|<a:rPr\b[^>]*>[\s\S]*?<\/a:rPr>/;
  function run(t, sz, fill, b){ return '<a:r><a:rPr lang="id-ID" sz="'+sz+'"'+(b?' b="1"':'')+' dirty="0">'+fill+FONT+'</a:rPr><a:t>'+esc(t)+'</a:t></a:r>'; }
  function para(runs, bullet, algn){ return '<a:p>'+(bullet?'<a:pPr marL="171450" indent="-171450"'+(algn?' algn="'+algn+'"':'')+'>'+BUL+'</a:pPr>':'')+runs+'</a:p>'; }
  function emptyP(sz){ return '<a:p><a:endParaRPr lang="id-ID" sz="'+sz+'" dirty="0"/></a:p>'; }
  function setBody(sp, paras){ var a=sp.indexOf("<a:p>"), b=sp.lastIndexOf("</p:txBody>"); if(a<0||b<0) return sp; return sp.slice(0,a)+paras+sp.slice(b); }
  function setText(sp, text){
    var a=sp.indexOf("<a:p>"); if(a<0) return sp; var p=sp.slice(a, sp.indexOf("</a:p>",a)+6), pPr=(p.match(PPR)||[""])[0], rPr=(p.match(RPR)||['<a:rPr lang="id-ID" dirty="0"/>'])[0];
    return setBody(sp, '<a:p>'+pPr+'<a:r>'+rPr+'<a:t>'+esc(text)+'</a:t></a:r></a:p>');
  }
  function fitSz(lineArr, chars, maxLines){ var n=lineArr.reduce(function(s,t){ return s+Math.max(1,Math.ceil(String(t).length/chars)); },0); return n<=maxLines?1000:(n<=maxLines*1.15?900:(n<=maxLines*1.35?800:700)); }
  function engBody(e){
    var sz=e.units.length>12?(e.units.length>15?800:900):1000;
    return para(run(e.judul,sz,C75,true).replace(' b="1"',' b="1" u="sng"'))+emptyP(sz)+e.units.map(function(u){ var mw=mwTxt(u.mw);
      return para(run(u.n+" :  "+(mw?mw+" ":"      ")+"MW"+(u.s==="O"?"":" "),sz,C75)+(u.s==="O"?"":run("×",sz,CRED)),true); }).join("");
  }
  function daerahBody(){
    var dl=daerahList(); if(!dl.length) return para(run("Tidak ada daerah yang masih terdampak.",1000,C75));
    var all=[]; dl.forEach(function(d){ all.push("ULP "+d.u); d.it.forEach(function(t){ all.push(t); }); all.push(""); });
    var sz=fitSz(all,62,13);
    return dl.map(function(d,i){ return para(run("ULP "+d.u+" : ",sz,C75,true))+d.it.map(function(t){ return para(run(t,sz,C75),true); }).join("")+(i<dl.length-1?emptyP(sz):""); }).join("");
  }
  function notesBody(){ var n=notes(), sz=fitSz(n,92,12); return n.map(function(t){ return para(run(t,sz,CTX),true,"just"); }).join(""); }
  function loadTpl(){
    if(window.KONDISI_TPL) return Promise.resolve();
    return new Promise(function(res, rej){ var s=document.createElement("script"); s.src=TEMPLATE+"?v=20261126b";
      s.onload=function(){ window.KONDISI_TPL?res():rej(new Error("Template PPT penormalan kosong")); }; s.onerror=function(){ rej(new Error("Template PPT penormalan tidak ditemukan ("+TEMPLATE+")")); }; document.head.appendChild(s); });
  }
  function b64bytes(d){ var b=atob(d.split(",")[1]), u=new Uint8Array(b.length); for(var i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
  var BIG={0:10, 1:19, 2:24, 3:29, 4:34, 5:39};          // indeks <p:sp> angka besar per kartu (ULP, Penyulang, Beban, Captive, Trafo, Pelanggan)
  var SUB={0:[13,14], 1:[57,58], 2:[61,62], 3:[65,66], 4:[73,74], 5:[69,70]}; // [masih padam, sudah nyala]
  var PCT={0:54, 1:75, 2:76, 3:77, 4:78, 5:79};
  var ENG={mpp:85, sewatama:86, klasaman:87, klademak:88, maxpower:89};
  async function build(JSZip, say){
    say=say||function(){};
    say("Memuat template PPT…"); await loadTpl();
    var zip=await JSZip.loadAsync(window.KONDISI_TPL,{base64:true}), path="ppt/slides/slide1.xml", x=await zip.file(path).async("string");
    var map={3:function(sp){ return setText(sp,S.judul); }, 4:function(sp){ return setText(sp,"INFORMASI PEMULIHAN BERTAHAP  •  UPDATE: "+tglTxt(" / ")+"  |  "+S.jam+" WIT"); },
      40:function(sp){ return setBody(sp,daerahBody()); }, 48:function(sp){ return setBody(sp,notesBody()); }, 53:function(sp){ return setText(sp,S.footer); }};
    S.cards.forEach(function(c,i){ map[BIG[i]]=function(sp){ return setText(sp,nf(num(c.j))); }; map[SUB[i][0]]=function(sp){ return setText(sp,nf(padam(c))); };
      map[SUB[i][1]]=function(sp){ return setText(sp,nf(num(c.n))); }; map[PCT[i]]=function(sp){ return setText(sp,pct(c)+" %"); }; });
    S.eng.forEach(function(e){ if(ENG[e.id]!=null) map[ENG[e.id]]=function(sp){ return setBody(sp,engBody(e)); }; });
    var k=0; x=x.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, function(sp){ var i=k++; return map[i]?map[i](sp):sp; });
    if(S.foto.length){
      say("Menyisipkan foto dokumentasi…");
      var rels=await zip.file("ppt/slides/_rels/slide1.xml.rels").async("string"), pics="";
      var X0=3188098+70000, Y0=4598343+224029+60000, W=8839495-140000, H=4642738+1639190-60000-Y0, n=S.foto.length, gap=90000, hasCap=S.foto.some(function(f){return String(f.cap||"").trim();});
      var sw=(W-gap*(n-1))/n, ih=H-(hasCap?190000:0);
      S.foto.forEach(function(f,i){
        var fn="kondisi_foto"+(i+1)+".jpeg", rid="rIdKF"+(i+1); zip.file("ppt/media/"+fn, b64bytes(f.src));
        rels=rels.replace("</Relationships>",'<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/'+fn+'"/></Relationships>');
        var ar=(f.w&&f.h)?f.w/f.h:4/3, w=sw, h=w/ar; if(h>ih){ h=ih; w=h*ar; }
        var sx=X0+i*(sw+gap), px=sx+(sw-w)/2, py=Y0+(ih-h)/2;
        pics+='<p:pic><p:nvPicPr><p:cNvPr id="'+(9001+i*2)+'" name="Foto Dokumentasi '+(i+1)+'"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="'+Math.round(px)+'" y="'+Math.round(py)+'"/><a:ext cx="'+Math.round(w)+'" cy="'+Math.round(h)+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:ln w="9525"><a:solidFill><a:srgbClr val="D0D9E4"/></a:solidFill></a:ln></p:spPr></p:pic>';
        if(String(f.cap||"").trim()) pics+='<p:sp><p:nvSpPr><p:cNvPr id="'+(9002+i*2)+'" name="Keterangan Foto '+(i+1)+'"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="'+Math.round(sx)+'" y="'+Math.round(Y0+ih+25000)+'"/><a:ext cx="'+Math.round(sw)+'" cy="160000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t"><a:normAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr algn="ctr"/>'+run(String(f.cap).trim(),800,C75,true)+'</a:p></p:txBody></p:sp>';
      });
      x=x.replace("</p:spTree>", pics+"</p:spTree>");
      zip.file("ppt/slides/_rels/slide1.xml.rels", rels);
    }
    zip.file(path, x);
    say("Menyimpan berkas PPT…");
    var blob=await zip.generateAsync({type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation"});
    return {blob:blob, name:"Progres Penormalan Kelistrikan Sistem Sorong - "+tglTxt("-")+" "+String(S.jam).replace(":","")+" WIT.pptx"};
  }
  async function download(JSZip, overlay){
    var r=await build(JSZip, overlay);
    var a=document.createElement("a"); a.href=URL.createObjectURL(r.blob); a.download=r.name; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* ---------- backup per jam (IndexedDB browser ini) ----------
     Slot = tanggal + jam lokal (mis. 2026-11-26 13:00–13:59). Isi slot = data terakhir pada jam tersebut.
     Dibuat saat data disimpan, dan tiap pergantian jam selama dashboard terbuka. Foto disimpan sekali (dedup). */
  var BK_DB="kondisi_backup_v1", BK_DAYS=30, bkTimer=null, bkDeb=null, bkSel=null;
  function idb(){ return new Promise(function(res, rej){ if(!window.indexedDB) return rej(new Error("Browser tidak mendukung IndexedDB"));
    var r=indexedDB.open(BK_DB,1); r.onupgradeneeded=function(){ var d=r.result; if(!d.objectStoreNames.contains("snap")) d.createObjectStore("snap",{keyPath:"slot"}); if(!d.objectStoreNames.contains("foto")) d.createObjectStore("foto",{keyPath:"id"}); };
    r.onsuccess=function(){ res(r.result); }; r.onerror=function(){ rej(r.error); }; }); }
  function tx(db, stores, mode, fn){ return new Promise(function(res, rej){ var t=db.transaction(stores,mode), out; out=fn(t); t.oncomplete=function(){ res(out&&out.result!==undefined?out.result:out); }; t.onerror=function(){ rej(t.error); }; t.onabort=function(){ rej(t.error); }; }); }
  function reqP(q){ return new Promise(function(res, rej){ q.onsuccess=function(){ res(q.result); }; q.onerror=function(){ rej(q.error); }; }); }
  function hashStr(s){ var h1=5381, h2=52711; for(var i=0;i<s.length;i++){ var c=s.charCodeAt(i); h1=(h1*33)^c; h2=(h2*31)^c; } return "f"+(h1>>>0).toString(36)+(h2>>>0).toString(36)+s.length.toString(36); }
  function p2(n){ return String(n).padStart(2,"0"); }
  function slotOf(d){ return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())+"T"+p2(d.getHours()); }
  function slotLabel(sl){ var m=sl.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})$/); return m ? m[3]+"/"+m[2]+"/"+m[1]+" "+m[4]+":00–"+m[4]+":59" : sl; }
  function summary(st){
    var c=function(k){ return st.cards.filter(function(x){return x.k===k;})[0]||{j:0,n:0}; }, pc=function(x){ var j=num(x.j); return j>0?Math.min(100,Math.round(num(x.n)/j*100)):0; };
    var off=[], op=0, tot=0; st.eng.forEach(function(e){ e.units.forEach(function(u){ tot++; if(u.s==="O") op++; else off.push(e.nama+" "+code(u)); }); });
    return {upd:st.tgl+" "+st.jam, plg:[num(c("plg").j),num(c("plg").n),pc(c("plg"))], pny:[num(c("pny").j),num(c("pny").n),pc(c("pny"))], beban:[num(c("beban").j),num(c("beban").n),pc(c("beban"))], dmp:st.dmp, op:op, tot:tot, off:off};
  }
  async function backupNow(st, force){
    st=st||S; if(!st) return null;
    var db=await idb(), slot=slotOf(new Date()), data=JSON.parse(JSON.stringify(st)), fotos=[];
    data.foto=(st.foto||[]).map(function(f){ var id=hashStr(f.src); fotos.push({id:id, src:f.src}); return {id:id, w:f.w, h:f.h, cap:f.cap}; });
    await tx(db,["snap","foto"],"readwrite",function(t){ var fs=t.objectStore("foto"); fotos.forEach(function(f){ fs.put(f); });
      t.objectStore("snap").put({slot:slot, savedAt:new Date().toISOString(), data:data, sum:summary(st)}); });
    db.close(); return slot;
  }
  async function listSnaps(){ var db=await idb(); var all=await tx(db,["snap"],"readonly",function(t){ return t.objectStore("snap").getAll(); }); db.close(); return (all||[]).sort(function(a,b){ return a.slot<b.slot?1:-1; }); }
  async function getSnap(slot){
    var db=await idb(), rec=await tx(db,["snap"],"readonly",function(t){ return t.objectStore("snap").get(slot); }); if(!rec){ db.close(); return null; }
    var st=JSON.parse(JSON.stringify(rec.data));
    st.foto=await Promise.all((st.foto||[]).map(function(f){ return tx(db,["foto"],"readonly",function(t){ return t.objectStore("foto").get(f.id); }).then(function(p){ return p?{src:p.src, w:f.w, h:f.h, cap:f.cap}:null; }); }));
    st.foto=st.foto.filter(Boolean); db.close(); return {rec:rec, st:st};
  }
  async function pruneSnaps(){
    var lim=slotOf(new Date(Date.now()-BK_DAYS*864e5)), db=await idb(), all=await tx(db,["snap"],"readonly",function(t){ return t.objectStore("snap").getAll(); }), used={};
    var old=all.filter(function(r){ return r.slot<lim; }); all.filter(function(r){ return r.slot>=lim; }).forEach(function(r){ (r.data.foto||[]).forEach(function(f){ used[f.id]=1; }); });
    var fk=await tx(db,["foto"],"readonly",function(t){ return t.objectStore("foto").getAllKeys(); });
    await tx(db,["snap","foto"],"readwrite",function(t){ old.forEach(function(r){ t.objectStore("snap").delete(r.slot); }); (fk||[]).forEach(function(k){ if(!used[k]) t.objectStore("foto").delete(k); }); });
    db.close();
  }
  function scheduleBackup(){ clearTimeout(bkDeb); bkDeb=setTimeout(function(){ backupNow().then(function(){ if(inited) renderBackup(); }).catch(function(){}); }, 2500); }
  async function hourlyTick(){
    try{
      if(!S){ var raw=localStorage.getItem(LSKEY); if(!raw) return; var o=JSON.parse(raw); if(!o||o.v!==1) return; S=o; }
      var slot=slotOf(new Date()), db=await idb(), has=await tx(db,["snap"],"readonly",function(t){ return t.objectStore("snap").getKey(slot); }); db.close();
      if(has===undefined){ await backupNow(); await pruneSnaps(); if(inited) renderBackup(); }
    }catch(e){}
  }
  function startHourly(){ if(bkTimer) return; hourlyTick(); bkTimer=setInterval(hourlyTick, 60000); }
  function dl(blob, name){ var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1500); }
  function slotFile(sl){ return sl.replace("T"," ")+"00"; }
  var CSV_COLS=["Slot backup","Disimpan","Update data"].concat([].concat.apply([],["ULP","Penyulang","Beban (kW)","Beban Captive (kW)","Trafo (unit)","Pelanggan"].map(function(l){ return [l+" - jumlah terdampak", l+" - masih padam", l+" - sudah nyala", l+" - % pulih"]; }))).concat(["DMP (MW)","Unit beroperasi","Total unit","Unit tidak beroperasi","Daerah masih terdampak"]);
  function csvRow(rec){
    var d=rec.data, q=function(v){ v=String(v==null?"":v); return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
    var cells=[slotLabel(rec.slot), new Date(rec.savedAt).toLocaleString("id-ID"), d.tgl+" "+d.jam];
    d.cards.forEach(function(c){ var j=num(c.j), n=num(c.n); cells.push(j, Math.max(0,j-n), n, j>0?Math.min(100,Math.round(n/j*100)):0); });
    cells.push(String(d.dmp||""), rec.sum.op, rec.sum.tot, rec.sum.off.join(", "), ULPS.map(function(u){ var it=lines((d.daerah||{})[u]); return it.length?"ULP "+u+": "+it.join(" / "):""; }).filter(Boolean).join(" | "));
    return cells.map(q).join(";");
  }
  async function withState(st, fn){ var prev=S; S=st; try{ return await fn(); } finally{ S=prev; } }
  async function dlSnap(slot, kind){
    var ov=(window.PPTExport&&window.PPTExport.overlay)||function(){};
    try{
      ov("Mengambil backup "+slotLabel(slot)+"…"); var g=await getSnap(slot); if(!g) throw new Error("Backup tidak ditemukan");
      if(kind==="json"){ dl(new Blob([JSON.stringify(g.st,null,1)],{type:"application/json"}), "Backup Penormalan Sistem Sorong "+slotFile(slot)+".json"); }
      else { await window.PPTExport.loadJSZip(); var r=await withState(g.st, function(){ return build(window.JSZip, ov); }); dl(r.blob, "Backup "+slotFile(slot)+" - "+r.name); }
    }catch(e){ bkMsg("Gagal: "+(e.message||e), true); }
    ov(null);
  }
  async function dlRange(){
    var from=$("kn-bk-from").value, to=$("kn-bk-to").value, ppt=$("kn-bk-ppt").checked; if(from>to){ var x=from; from=to; to=x; }
    var ov=(window.PPTExport&&window.PPTExport.overlay)||function(){};
    try{
      ov("Menyiapkan backup…"); await window.PPTExport.loadJSZip();
      var recs=(await listSnaps()).filter(function(r){ return r.slot>=from && r.slot<=to; }).sort(function(a,b){ return a.slot<b.slot?-1:1; });
      if(!recs.length) throw new Error("Tidak ada backup pada rentang waktu tersebut");
      var zip=new window.JSZip();
      zip.file("Rekap per jam.csv", "﻿"+CSV_COLS.join(";")+"\n"+recs.map(csvRow).join("\n"));
      for(var i=0;i<recs.length;i++){ var r=recs[i]; ov("Backup "+(i+1)+"/"+recs.length+" · "+slotLabel(r.slot));
        var g=await getSnap(r.slot); zip.file("JSON/"+slotFile(r.slot)+".json", JSON.stringify(g.st,null,1));
        if(ppt){ var b=await withState(g.st, function(){ return build(window.JSZip, function(){}); }); zip.file("PPT/"+slotFile(r.slot)+" - "+b.name, b.blob); } }
      ov("Menyimpan ZIP…");
      var blob=await zip.generateAsync({type:"blob"});
      dl(blob, "Backup Penormalan Sistem Sorong "+slotFile(from)+" sd "+slotFile(to)+".zip");
      bkMsg(recs.length+" backup diunduh ("+slotLabel(from)+" s.d. "+slotLabel(to)+").");
    }catch(e){ bkMsg("Gagal: "+(e.message||e), true); }
    ov(null);
  }
  async function restoreSnap(slot, btn){
    if(!btn.dataset.arm){ btn.dataset.arm="1"; btn.textContent="Yakin?"; setTimeout(function(){ if(btn.dataset.arm){ delete btn.dataset.arm; btn.textContent="Pulihkan"; } },3500); return; }
    var g=await getSnap(slot); if(!g) return;
    try{ localStorage.setItem(LSKEY+"_undo", JSON.stringify(S)); }catch(e){} // data sebelum pemulihan, untuk dibatalkan
    S=Object.assign(defaults(), g.st); renderForm(); renderBoard(); save();
    bkMsg("Data dipulihkan dari backup "+slotLabel(slot)+".", false, true); window.scrollTo({top:0, behavior:"smooth"});
  }
  function undoRestore(){ try{ var o=JSON.parse(localStorage.getItem(LSKEY+"_undo")); if(!o) return; S=o; localStorage.removeItem(LSKEY+"_undo"); renderForm(); renderBoard(); save(); bkMsg("Pemulihan dibatalkan; data dikembalikan seperti sebelumnya."); }catch(e){} }
  function bkMsg(t, err, undo){ var m=$("kn-bk-msg"); if(!m) return; m.textContent=t; m.className="kn-save"+(err?" kn-save--err":"");
    if(undo){ var b=document.createElement("button"); b.type="button"; b.className="kn-link"; b.style.marginLeft="10px"; b.textContent="↶ Batalkan pemulihan"; b.onclick=undoRestore; m.appendChild(b); } }
  async function renderBackup(){
    var box=$("kn-bk-body"); if(!box) return;
    var recs; try{ recs=await listSnaps(); }catch(e){ box.innerHTML='<div class="kn-muted">Backup tidak tersedia: '+esc(e.message||e)+'</div>'; return; }
    var dates={}; recs.forEach(function(r){ dates[r.slot.slice(0,10)]=1; }); var ds=Object.keys(dates).sort().reverse();
    $("kn-bk-info").textContent=recs.length+" backup · "+ds.length+" hari"+(recs.length?" · terbaru "+slotLabel(recs[0].slot):"");
    var dsel=$("kn-bk-date"), cur=dsel.value; dsel.innerHTML=ds.map(function(d){ var m=d.split("-"); return '<option value="'+d+'">'+m[2]+"/"+m[1]+"/"+m[0]+"</option>"; }).join("")||'<option value="">—</option>';
    if(cur && dates[cur]) dsel.value=cur;
    var opts=recs.slice().reverse().map(function(r){ return '<option value="'+r.slot+'">'+slotLabel(r.slot)+'</option>'; }).join("");
    var f=$("kn-bk-from"), t=$("kn-bk-to"), fv=f.value, tv=t.value; f.innerHTML=opts; t.innerHTML=opts;
    if(recs.length && tv && tv===bkSel) tv=recs[0].slot;   // "sampai jam" ikut maju bila sebelumnya = backup terbaru
    bkSel=recs.length?recs[0].slot:null;
    if(recs.length){ var day=dsel.value, inDay=recs.filter(function(r){ return r.slot.slice(0,10)===day; });
      f.value=(fv&&recs.some(function(r){return r.slot===fv;}))?fv:(inDay.length?inDay[inDay.length-1].slot:recs[recs.length-1].slot);
      t.value=(tv&&recs.some(function(r){return r.slot===tv;}))?tv:(inDay.length?inDay[0].slot:recs[0].slot); }
    var day2=dsel.value, rows=recs.filter(function(r){ return r.slot.slice(0,10)===day2; });
    var pc=function(a){ return nf(a[1])+" / "+nf(a[0])+' <b>'+a[2]+'%</b>'; };
    box.innerHTML=rows.length ? '<table class="kn-ftbl kn-bk-tbl"><thead><tr><th>Jam</th><th>Disimpan</th><th>Update data</th><th class="num">Pelanggan nyala</th><th class="num">Penyulang nyala</th><th class="num">Beban nyala (kW)</th><th class="num">DMP (MW)</th><th>Unit tidak beroperasi</th><th>Unduh / pulihkan</th></tr></thead><tbody>'+
      rows.map(function(r){ var s=r.sum, d=r.data;
        return '<tr><td><b>'+r.slot.slice(11)+':00</b></td><td>'+new Date(r.savedAt).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})+'</td><td>'+esc(d.tgl.split("-").reverse().join("/")+" "+d.jam)+'</td><td class="num">'+pc(s.plg)+'</td><td class="num">'+pc(s.pny)+'</td><td class="num">'+pc(s.beban)+'</td><td class="num">'+esc(s.dmp||"–")+'</td>'+
          '<td class="kn-bk-off" title="'+esc(s.off.join(", "))+'">'+s.op+'/'+s.tot+' operasi'+(s.off.length?' · <span class="kn-red">'+esc(s.off.slice(0,3).join(", "))+(s.off.length>3?" +"+(s.off.length-3):"")+'</span>':'')+'</td>'+
          '<td class="kn-bk-act"><button type="button" class="kn-mini" data-bk="ppt" data-slot="'+r.slot+'">PPT</button><button type="button" class="kn-mini" data-bk="json" data-slot="'+r.slot+'">JSON</button><button type="button" class="kn-mini kn-mini--warn" data-bk="restore" data-slot="'+r.slot+'">Pulihkan</button></td></tr>'; }).join("")+'</tbody></table>'
      : '<div class="kn-muted">Belum ada backup. Backup pertama dibuat otomatis saat data disimpan atau klik <b>Backup sekarang</b>.</div>';
  }
  function initBackup(){
    $("kn-bk-date").onchange=function(){ $("kn-bk-from").value=""; $("kn-bk-to").value=""; renderBackup(); };
    $("kn-bk-now").onclick=function(){ backupNow(S).then(function(sl){ bkMsg("Backup slot "+slotLabel(sl)+" diperbarui."); renderBackup(); }, function(e){ bkMsg("Gagal: "+(e.message||e), true); }); };
    $("kn-bk-dl").onclick=dlRange;
    $("kn-bk-body").addEventListener("click", function(ev){ var b=ev.target.closest("button[data-bk]"); if(!b) return; ev.stopPropagation();
      if(b.dataset.bk==="restore") restoreSnap(b.dataset.slot, b); else dlSnap(b.dataset.slot, b.dataset.bk); });
    renderBackup(); startHourly();
  }

  /* ---------- init ---------- */
  function init(){
    if(inited){ renderBoard(); return; } inited=true;
    S=load();
    renderForm(); renderBoard();
    var v=$("view-kondisi");
    v.addEventListener("input", onInput); v.addEventListener("change", function(ev){ if(ev.target.tagName==="SELECT") onInput(ev); });
    v.addEventListener("click", onClick);
    $("kn-tgl").onchange=function(){ S.tgl=this.value; renderBoard(); save(); };
    $("kn-jam").onchange=function(){ S.jam=this.value; renderBoard(); save(); };
    $("kn-now").onclick=function(){ var d=new Date(); S.tgl=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); S.jam=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); $("kn-tgl").value=S.tgl; $("kn-jam").value=S.jam; renderBoard(); save(); };
    $("kn-dmp").oninput=function(){ S.dmp=this.value; renderBoard(); save(); };
    $("kn-pembuka").oninput=function(){ S.pembuka=this.value; renderBoard(); save(); };
    $("kn-penutup").oninput=function(){ S.penutup=this.value; renderBoard(); save(); };
    $("kn-footer").oninput=function(){ S.footer=this.value; renderBoard(); save(); };
    $("kn-judul").oninput=function(){ S.judul=this.value; renderBoard(); save(); };
    $("kn-auto").onchange=function(){ S.autoNote=this.checked; renderBoard(); save(); };
    $("kn-foto-in").onchange=function(){ addFoto(this.files); this.value=""; };
    $("kn-wa").onclick=copyWA;
    $("kn-json").onclick=exportJson;
    $("kn-imp").onchange=function(){ if(this.files[0]) importJson(this.files[0]); this.value=""; };
    $("kn-reset").onclick=function(){ var b=this; if(b.dataset.arm){ S=defaults(); renderForm(); renderBoard(); save(); b.textContent="↺ Kembalikan data awal"; delete b.dataset.arm; }
      else { b.dataset.arm="1"; b.textContent="Klik lagi untuk konfirmasi"; setTimeout(function(){ if(b.dataset.arm){ delete b.dataset.arm; b.textContent="↺ Kembalikan data awal"; } },3500); } };
    $("kn-dl").onclick=function(){ if(window.PPTExport && window.PPTExport.exportActive) window.PPTExport.exportActive(); };
    initBackup();
    $("kn-save").textContent=localStorage.getItem(LSKEY)?"Memakai data tersimpan di browser ini":"Data awal sesuai PPT update 26/11/2026 13:35 WIT";
  }
  window.KondisiSistem = { init:init, download:download, build:build, _state:function(){ return S; }, _backupNow:function(){ return backupNow(); } };
  // backup per jam berjalan selama dashboard terbuka (menu apa pun), bila data penormalan pernah diisi di browser ini
  try{ if(localStorage.getItem(LSKEY)) setTimeout(startHourly, 4000); }catch(e){}
})();
