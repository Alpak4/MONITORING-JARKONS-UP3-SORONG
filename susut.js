/* Workplan Susut — UP3 Sorong 2026
   Target : sheet "WP UIW Target 2026" (gid=0) — baris "sor" (Pemerataan & HAR PHBTR per bulan) + blok SORONG per ULP
   Realisasi: sheet "SOR" (gid=1169472843) — volume harian per 18 kegiatan susut */
window.Susut = (function(){
  const BASE="https://docs.google.com/spreadsheets/d/e/2PACX-1vTBfJGgvJtOrp6P8U1I_UXpVn9wMz5a6u8KrVi0XAusl4rJibj3_LMq-5aIAVrtsjxWYQU6QJ3fCWJf/pub?single=true&output=csv&gid=";
  const URL_TARGET=BASE+"0", URL_REAL=BASE+"1169472843";
  const MON=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const MONL=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const MIDX={jan:0,feb:1,mar:2,apr:3,mei:4,may:4,jun:5,jul:6,agu:7,agt:7,aug:7,sep:8,okt:9,oct:9,nov:10,des:11,dec:11};
  const KEG=["Penarikan Penyulang Baru untuk Pemecahan Beban","Rehabilitasi / Pemerataan JTM","Rekonektorisasi Jumper / Sambungan","Penggantian Isolator / Arrester Bocor / Tembus","Pemasangan AVR","Pemasangan Kapasitor","Pembangunan Gardu Sisipan","Manajemen Trafo Distribusi","Menaikan Tap Changer trafo distribusi","Penyeimbangan Beban","Pemeliharaan PHBTR (Holder, Opstik, Pipa, Jointing Opstik, dll)","Penggantian PHBTR (Anggaran Investasi)","Perbaikan Grounding Gardu","Penarikan Jurusan Baru untuk Pemecahan Beban","Rekonektorisasi Sambungan JTR","Perbaikan SR Seri banyak","Rekonektorisasi SR","Clusterisasi kWh Meter daerah tertentu"];
  const GRP=["JTM","JTM","JTM","JTM","JTM","JTM","Gardu","Gardu","Gardu","Gardu","Gardu","Gardu","Gardu","JTR","JTR","SR / APP","SR / APP","SR / APP"];
  const GROUPS=["JTM","Gardu","JTR","SR / APP"];
  const GCOL={"JTM":"#1273C4","Gardu":"#0F9B9B","JTR":"#FDB913","SR / APP":"#073B6B"};
  const TGT_IDX={1:"P",10:"H"}; // kegiatan yang memiliki target UIW
  /* snapshot cadangan (diverifikasi thd baris total sheet SOR) */
  const SNAP=[["2026-01-31",{1:5,2:5,3:1,6:1,7:1,9:8,13:3,14:8,15:8,16:8}],["2026-02-28",{1:9,2:9,6:1,9:1,11:4,13:6,14:5}],["2026-03-31",{1:7,2:7,3:1,6:1,11:1,14:10}],["2026-04-30",{1:1,2:1,6:1,9:1,11:7,14:7,15:5,16:5}],["2026-05-31",{1:3,2:3,3:3,6:1,7:4,10:16,11:2,13:2,14:2,15:12,16:12}],["2026-06-21",{7:2,11:4}],["2026-06-30",{1:1,2:1,3:2,9:13,10:16,11:1,13:1,14:13,15:13,16:13}],["2026-07-02",{2:1}],["2026-07-04",{2:3}],["2026-07-05",{7:1}],["2026-07-09",{3:2}],["2026-07-14",{2:1}],["2026-07-21",{2:1}],["2026-07-31",{10:16,14:12,15:12}],["2026-08-03",{14:1}],["2026-08-05",{12:1}],["2026-08-06",{8:1,9:2,10:4,15:22,16:22}],["2026-08-07",{14:1}],["2026-08-12",{3:1}],["2026-08-14",{13:1}],["2026-08-16",{3:2}],["2026-08-18",{14:6}],["2026-08-20",{13:3}],["2026-08-21",{14:2}],["2026-08-26",{2:1,13:1,14:3}],["2026-08-27",{14:3}],["2026-08-31",{6:1,10:16}],["2026-09-30",{2:38,3:26,6:1,7:1,9:168,10:16,11:2,12:5,13:16,14:3,15:15,16:15}]];
  const SNAP_T={P:[6,11,11,11,11,11,11,11,11,6,11,6],H:[10,20,20,20,20,20,20,20,20,10,20,10],ulp:[["Sorong",4,8],["Aimas",3,8],["Temi",2,2],["Waisai",2,2]],freq:{bulanan:[11,20],mingguan:[3,5]}};

  /* ---- Data Realisasi Workplan (menu Realisasi Workplan) ---- */
  const WP_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vSj3GxboKjS6HO1P3DUMAQYKy8gE6rd0W9F14JX8IAtDedB8vVKxMWT1tQZsee6uRB4nzozqj5L1xOc/pub?output=csv&gid=869651897";
  const WP_MONTHS=["JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI","JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"];
  const WP_ULPS=["SORONG KOTA","AIMAS","TEMINABUAN","WAISAI"];
  const nrm=s=>String(s||"").toUpperCase().replace(/\s+/g," ").trim();
  const wnum=v=>{let s=String(v==null?"":v).replace(/[^0-9,.\-]/g,"").trim();if(!s||s==="-")return 0;s=s.indexOf(",")!==-1?s.replace(/\./g,"").replace(",","."):s.replace(/\./g,"");const n=parseFloat(s);return isNaN(n)?0:n;};
  const wkel=v=>{const n=nrm(v).replace(/[\s-]/g,"");return n.startsWith("PHBTM")?"PHBTM":n.startsWith("JTM")?"JTM":n.startsWith("GARDU")?"GARDU":n.startsWith("JTR")?"JTR":n.startsWith("SR")?"SR-APP":"LAINNYA";};
  /* klasifikasi lead measure workplan → kegiatan susut (urutan = prioritas) */
  function classify(lm,kel){
    const t=nrm(lm), J=kel==="JTR", SR=kel==="SR-APP";
    const R=[[/CLUSTER/,17],[/\bSR\b.*SERI|SERI BANYAK|\bDERET\b/,15],[/TAP\s*CHANGER|NAIK.*\bTAP\b|\bTAP\b.*TRAFO/,8],[/KAPASITOR|CAPACITOR/,5],[/\bAVR\b|VOLTAGE REGULATOR/,4],[/SISIPAN/,6],[/JURUSAN BARU|PECAH\w*\s+JURUSAN|PEMECAHAN.*JURUSAN/,13],[/PENYULANG BARU|PECAH\w*\s+PENYULANG|PEMECAHAN.*PENYULANG/,0],[/SEIMBANG|BALANC|PEMERATAAN BEBAN|UNBALANCE/,9],[/ISOLATOR|ARRESTER|\bLA\b/,3],[/UPRATING\s+KONDUKTOR|(UPRATING|DOWNRATING).*(KONDUKTOR|KAWAT|JTM)/,1],[/MANAJEMEN TRAFO|MUTASI TRAFO|ROTASI TRAFO|(UPRATING|DOWNRATING).*TRAFO|TRAFO.*(UPRATING|DOWNRATING)|(GANTI|PENGGANTIAN)\s.*TRAFO/,7],[/GROUNDING|PENTANAHAN|\bARDE\b/,12],[/(GANTI|PENGGANTIAN|PASANG|PEMASANGAN)\s.*(PHB.?TR|LEMARI)/,11],[/PHB.?TR|OPSTIK/,10]];
    for(const [re,i] of R) if(re.test(t)) return i;
    if((kel==="GARDU"||J)&&/HOLDER|NH.?FUSE|JOINTING/.test(t)) return 10;
    if(!J&&!SR&&/PEMERATAAN|REHAB|REKONDISI|ANDONGAN|PERAPIHAN JTM|PERBAIKAN JTM|UPRATING/.test(t)&&!/TRAFO/.test(t)) return 1;
    const CON=/REKONEKTOR|KONEKTOR|SAMBUNGAN|JUMPER|JOINT|CCO|PG.?CLAMP|BIMETAL/;
    if((SR||/\bSR\b|SAMBUNGAN RUMAH/.test(t))&&(CON.test(t)||/PERBAIKAN|GANTI|PENGGANTIAN|PERAPIHAN|PENERTIBAN/.test(t))) return 16;
    if((J||/\bJTR\b/.test(t))&&CON.test(t)) return 14;
    if((kel==="JTM"||kel==="PHBTM"||/\bJTM\b|\bTM\b/.test(t))&&CON.test(t)) return 2;
    return -1;
  }
  function parseWP(rows){
    if(!rows||!rows.length) return null;
    const head=rows[0]||[],starts=[];head.forEach((h,i)=>{if(nrm(h)==="TANGGAL")starts.push(i);});if(!starts.length)starts.push(0);
    const out=[];
    starts.forEach(c=>{for(let i=1;i<rows.length;i++){const r=rows[i]||[];const lm=(r[c+6]||"").trim(),ulp=nrm(r[c+3]);if(!lm||!ulp||/FAK\s*FAK|KAIMANA/.test(ulp))continue;
      const bi=WP_MONTHS.indexOf(nrm(r[c+1]));const kl=wkel(r[c+5]);
      out.push({m:bi,ulp,penyulang:(r[c+4]||"").trim(),kel:kl,lm,key:nrm(lm),v:wnum(r[c+7]),sat:(r[c+8]||"").trim(),auto:classify(lm,kl),k:-1});}});
    return out.length?out:null;
  }
  const OVK="susut_map_override_v1";
  let OV={};try{OV=JSON.parse(localStorage.getItem(OVK)||"{}")||{};}catch(e){OV={};}
  const saveOV=()=>{try{localStorage.setItem(OVK,JSON.stringify(OV));}catch(e){}};
  function applyOV(){if(W)W.forEach(d=>{d.k=OV[d.key]!=null?OV[d.key]:d.auto;});}
  const KEL_ORD=["PHBTM","JTM","GARDU","JTR","SR-APP","LAINNYA"];const KO=k=>{const i=KEL_ORD.indexOf(k);return i<0?99:i;};
  let W=null;

  let S=null, inited=false, charts={};
  const $=id=>document.getElementById(id);
  const num=v=>{v=String(v==null?"":v).trim().replace(/\s/g,""); if(!v||v==="-")return 0; v=v.replace(/\./g,"").replace(",","."); const n=parseFloat(v); return isNaN(n)?0:n;};
  const fmt=n=>(Math.round(n*100)/100).toLocaleString("id-ID");
  const pct=(r,t)=>t>0?r/t*100:null;
  const pctS=p=>p==null?"—":(Math.round(p*10)/10).toLocaleString("id-ID")+"%";
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  function parseCSV(text){const rows=[];let row=[],f="",q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c==='"')q=true;else if(c===","){row.push(f);f="";}else if(c==="\n"){row.push(f);rows.push(row);row=[];f="";}else if(c!=="\r")f+=c;}}if(f.length||row.length){row.push(f);rows.push(row);}return rows;}
  async function grab(url){const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),15000);try{const r=await fetch(url,{signal:ctrl.signal});clearTimeout(t);if(!r.ok)return null;return parseCSV(await r.text());}catch(e){clearTimeout(t);return null;}}

  function parseDate(s){const m=String(s).trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);if(!m)return null;const mi=MIDX[m[2].slice(0,3).toLowerCase()];if(mi==null)return null;return {d:+m[1],m:mi,y:+m[3],iso:m[3]+"-"+String(mi+1).padStart(2,"0")+"-"+String(m[1]).padStart(2,"0")};}
  function parseReal(rows){
    if(!rows||rows.length<2)return null;
    const head=rows[0].map(h=>h.trim().toLowerCase());
    const colOf=KEG.map(k=>{const key=k.toLowerCase().slice(0,22);const j=head.findIndex(h=>h.slice(0,22)===key);return j;});
    const out=[];
    rows.slice(1).forEach(r=>{const d=parseDate(r[0]);if(!d)return;KEG.forEach((k,i)=>{const j=colOf[i]>=0?colOf[i]:i+1;const v=num(r[j]);if(v)out.push({iso:d.iso,m:d.m,day:d.d,k:i,v});});});
    return out;
  }
  function parseTarget(rows){
    if(!rows)return null;
    const T={P:null,H:null,ulp:[],freq:{}};
    for(const r of rows){const j=r.findIndex(c=>c.trim().toLowerCase()==="sor");if(j>=0){const v=r.slice(j+1,j+25).map(num);T.P=[];T.H=[];for(let m=0;m<12;m++){T.P.push(v[m*2]);T.H.push(v[m*2+1]);}break;}}
    for(let i=0;i<rows.length;i++){const k=rows[i].findIndex(c=>c.trim().toUpperCase()==="SORONG");if(k>=0&&String(rows[i][k+1]||"").toUpperCase().includes("PEMERATAAN")){
      for(let x=i+1;x<rows.length;x++){const n=String(rows[x][k]||"").trim();if(!n)break;const lo=n.toLowerCase();if(lo==="bulanan"||lo==="mingguan"){T.freq[lo]=[num(rows[x][k+1]),num(rows[x][k+2])];continue;}T.ulp.push([n,num(rows[x][k+1]),num(rows[x][k+2])]);}
      break;}}
    return T.P?T:null;
  }

  async function load(){
    $("ss-source").innerHTML='<span class="wp-pill loading">● Memuat data spreadsheet…</span>';
    const [rt,rr,rw]=await Promise.all([grab(URL_TARGET),grab(URL_REAL),grab(WP_URL)]);
    W=parseWP(rw);applyOV();
    const T=parseTarget(rt), R=parseReal(rr);
    const live=!!(T&&R);
    S={T:T||SNAP_T,R:R||SNAP.flatMap(([iso,o])=>Object.entries(o).map(([k,v])=>({iso,m:+iso.slice(5,7)-1,day:+iso.slice(8),k:+k,v}))),live};
    if(!S.T.ulp.length)S.T.ulp=SNAP_T.ulp;
    const now=new Date();
    $("ss-source").innerHTML=(live?'<span class="wp-pill live">● Live · Google Spreadsheet</span>':'<span class="wp-pill warn">● Offline · snapshot 30 Sep 2026</span>')+'<span class="wp-pill">Sheet: WP UIW Target 2026 · SOR</span><span class="wp-pill">Dimuat '+now.toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})+'</span>';
    fillFilters(); render();
  }

  function fillFilters(){
    const mo=[...new Set(S.R.map(e=>e.m))].sort((a,b)=>a-b);
    $("ss-f-bulan").innerHTML='<option value="">Semua bulan</option>'+MONL.map((n,i)=>'<option value="'+i+'">'+n+(mo.includes(i)?"":" (belum ada data)")+'</option>').join("");
    $("ss-f-kel").innerHTML='<option value="">Semua kelompok</option>'+GROUPS.map(g=>'<option>'+g+'</option>').join("");
    fillKeg();
  }
  function fillKeg(){const g=$("ss-f-kel").value;const cur=$("ss-f-keg").value;$("ss-f-keg").innerHTML='<option value="">Semua kegiatan</option>'+KEG.map((k,i)=>(!g||GRP[i]===g)?'<option value="'+i+'">'+esc(k)+'</option>':"").join("");if([...$("ss-f-keg").options].some(o=>o.value===cur))$("ss-f-keg").value=cur;}

  function sel(){const b=$("ss-f-bulan").value,g=$("ss-f-kel").value,k=$("ss-f-keg").value;return {b:b===""?null:+b,g,k:k===""?null:+k};}
  const keep=(f,i)=>(f.k==null||f.k===i)&&(!f.g||GRP[i]===f.g);

  function render(){
    if(!S)return;
    const f=sel();
    const lastM=S.R.length?Math.max(...S.R.map(e=>e.m)):-1;
    const months=f.b==null?[...Array(12).keys()]:[f.b];
    const mUpTo=f.b==null?[...Array(lastM+1).keys()]:[f.b];
    const E=S.R.filter(e=>keep(f,e.k)&&(f.b==null||e.m===f.b));
    // matrix
    const M=KEG.map(()=>Array(12).fill(0));S.R.forEach(e=>{M[e.k][e.m]+=e.v;});
    const tg=(key,ms)=>ms.reduce((s,m)=>s+(S.T[key][m]||0),0);
    const showP=keep(f,1),showH=keep(f,10);
    const tot=E.reduce((s,e)=>s+e.v,0);
    const active=KEG.filter((k,i)=>keep(f,i)&&months.some(m=>M[i][m]>0)).length, nK=KEG.filter((k,i)=>keep(f,i)).length;
    const rP=mUpTo.reduce((s,m)=>s+M[1][m],0),rH=mUpTo.reduce((s,m)=>s+M[10][m],0),tP=tg("P",mUpTo),tH=tg("H",mUpTo);
    const days=new Set(E.map(e=>e.iso)).size;
    const per=f.b==null?(lastM>=0?"Jan – "+MON[lastM]+" 2026":"2026"):MONL[f.b]+" 2026";
    $("ss-scope").textContent=per;
    const kpi=(c,l,v,s)=>'<div class="kpi kpi--'+c+'"><div class="kpi__label">'+l+'</div><div class="kpi__value">'+v+'</div><div class="kpi__sub">'+s+'</div></div>';
    $("ss-kpis").innerHTML=
      kpi("blue","Total Volume Realisasi",fmt(tot),"Akumulasi semua kegiatan · "+per)+
      kpi("teal","Kegiatan Terealisasi",active+" / "+nK,"Kegiatan susut dengan realisasi > 0")+
      kpi("green","Capaian Pemerataan JTM",showP?pctS(pct(rP,tP)):"—",showP?fmt(rP)+" dari target "+fmt(tP)+" (s.d. "+(f.b==null?MON[Math.max(lastM,0)]:MON[f.b])+")":"Tidak termasuk filter")+
      kpi("amber","Capaian HAR PHBTR",showH?pctS(pct(rH,tH)):"—",showH?fmt(rH)+" dari target "+fmt(tH)+" (s.d. "+(f.b==null?MON[Math.max(lastM,0)]:MON[f.b])+")":"Tidak termasuk filter")+
      kpi("navy","Target Tahunan UIW","P "+fmt(tg("P",[...Array(12).keys()]))+" · H "+fmt(tg("H",[...Array(12).keys()])),"Pemerataan · HAR PHBTR — UP3 Sorong 2026")+
      kpi("red","Hari Input",days,"Tanggal dengan entri realisasi");
    charts_(f,M,lastM);
    table(f,M,months,lastM);
    detail(E);
    wpRekap(f,M);
  }

  function wpRekap(f,M){
    const src=$("ss-wp-src");
    if(!W){src.innerHTML='<span class="wp-pill warn">● Data Realisasi Workplan tidak dapat dimuat</span>';$("ss-wp-head").innerHTML="";$("ss-wp-body").innerHTML="";$("ss-map-body").innerHTML="";return;}
    const u=$("ss-wp-ulp").value;
    const D=W.filter(d=>(!u||d.ulp===u)&&d.m>=0);
    const Dk=D.filter(d=>d.k>=0&&keep(f,d.k)&&(f.b==null||d.m===f.b));
    const WM=KEG.map(()=>Array(12).fill(0));D.forEach(d=>{if(d.k>=0)WM[d.k][d.m]+=d.v;});
    const lmAll=new Set(D.map(d=>d.key)),lmIn=new Set(D.filter(d=>d.k>=0).map(d=>d.key));
    const vol=Dk.reduce((s,d)=>s+d.v,0);
    src.innerHTML='<span class="wp-pill live">● Sumber: menu Realisasi Workplan</span><span class="wp-pill">'+lmIn.size+' dari '+lmAll.size+' lead measure masuk kategori susut</span><span class="wp-pill">'+fmt(Dk.length)+' entri · volume '+fmt(vol)+'</span><span class="wp-pill">'+(u?"ULP "+esc(u):"Semua ULP")+'</span>';
    // matriks — template sama dgn Workplan Susut + perbandingan dgn sheet SOR
    $("ss-wp-head").innerHTML='<tr><th>No</th><th>Kegiatan Susut</th>'+MON.map((m,i)=>'<th class="num'+(f.b===i?" mx-sel":"")+'">'+m+'</th>').join("")+'<th class="num">Total WP</th><th class="num">Sheet SOR</th><th class="num">Selisih</th></tr>';
    const cell=(v,m)=>'<td class="num'+(f.b===m?" mx-sel":"")+'"'+(v?'':' style="color:#B8C2CE"')+'>'+(v?fmt(v):"·")+'</td>';
    const ms=f.b==null?[...Array(12).keys()]:[f.b];
    const dif=x=>'<td class="num" style="font-weight:700;color:'+(x>0?"#157A43":x<0?"#B81910":"var(--muted)")+'">'+(x>0?"+":"")+fmt(x)+'</td>';
    let html="",no=0;const tA=Array(12).fill(0);let tW=0,tS=0;
    GROUPS.forEach(g=>{
      if(f.g&&f.g!==g)return;
      const idx=KEG.map((k,i)=>i).filter(i=>GRP[i]===g&&keep(f,i));if(!idx.length)return;
      const sub=Array(12).fill(0);let sw=0,ss=0,rows="";
      idx.forEach(i=>{no++;const row=WM[i];row.forEach((v,m)=>{sub[m]+=v;tA[m]+=v;});const w=ms.reduce((s,m)=>s+row[m],0),s=ms.reduce((a,m)=>a+M[i][m],0);sw+=w;ss+=s;
        rows+='<tr><td class="muted">'+no+'</td><td style="min-width:260px">'+esc(KEG[i])+'</td>'+row.map(cell).join("")+'<td class="num"><b>'+fmt(w)+'</b></td><td class="num">'+fmt(s)+'</td>'+dif(w-s)+'</tr>';});
      tW+=sw;tS+=ss;
      html+='<tr class="wp-sub"><td></td><td><span class="cdot" style="background:'+GCOL[g]+';margin-right:7px"></span>'+g+'</td>'+sub.map((v,m)=>'<td class="num'+(f.b===m?" mx-sel":"")+'">'+(v?fmt(v):"·")+'</td>').join("")+'<td class="num">'+fmt(sw)+'</td><td class="num">'+fmt(ss)+'</td>'+dif(sw-ss)+'</tr>'+rows;
    });
    html+='<tr class="total-row"><td></td><td>TOTAL</td>'+tA.map(v=>'<td class="num">'+(v?fmt(v):"·")+'</td>').join("")+'<td class="num">'+fmt(tW)+'</td><td class="num">'+fmt(tS)+'</td>'+dif(tW-tS)+'</tr>';
    $("ss-wp-body").innerHTML=html;
    // pemetaan lead measure
    const G={};D.filter(d=>f.b==null||d.m===f.b).forEach(d=>{const o=G[d.key]||(G[d.key]={key:d.key,lm:d.lm,kel:d.kel,sat:d.sat,k:d.k,auto:d.auto,n:0,v:0});o.n++;o.v+=d.v;});
    const q=($("ss-map-q").value||"").toLowerCase(),sh=$("ss-map-show").value;
    const all=Object.values(G).filter(o=>o.k<0||keep(f,o.k));
    const L=all.filter(o=>(!q||(o.lm+" "+o.kel+" "+(o.k>=0?KEG[o.k]:"")).toLowerCase().includes(q))&&(!sh||(sh==="in"&&o.k>=0)||(sh==="out"&&o.k<0)||(sh==="man"&&OV[o.key]!=null))).sort((a,b)=>KO(a.kel)-KO(b.kel)||(a.k<0)-(b.k<0)||a.k-b.k||b.v-a.v);
    const nMan=Object.keys(OV).length;
    $("ss-map-count").textContent=all.filter(o=>o.k>=0).length+" masuk kategori · "+all.filter(o=>o.k<0).length+" di luar · "+nMan+" manual";
    $("ss-map-reset").style.display=nMan?"inline-flex":"none";
    const opts=k=>'<option value="-1"'+(k<0?" selected":"")+'>— Tidak masuk kategori susut</option>'+GROUPS.map(g=>'<optgroup label="'+g+'">'+KEG.map((x,i)=>GRP[i]===g?'<option value="'+i+'"'+(k===i?" selected":"")+'>'+esc(x)+'</option>':"").join("")+'</optgroup>').join("");
    let lastKel=null;
    $("ss-map-body").innerHTML=L.map(o=>{const man=OV[o.key]!=null;let hd="";if(o.kel!==lastKel){lastKel=o.kel;const grp=L.filter(x=>x.kel===o.kel);hd='<tr class="wp-sub"><td colspan="4">'+esc(o.kel)+' <span class="muted" style="font-weight:600">· '+grp.length+' lead measure · '+grp.filter(x=>x.k>=0).length+' masuk kategori</span></td><td class="num">'+fmt(grp.reduce((s,x)=>s+x.n,0))+'</td><td class="num">'+fmt(grp.reduce((s,x)=>s+x.v,0))+'</td></tr>';}return hd+'<tr'+(o.k<0&&!man?' style="opacity:.6"':'')+'><td>'+esc(o.lm)+'</td><td>'+esc(o.kel)+'</td><td>'+esc(o.sat)+'</td><td><div style="display:flex;align-items:center;gap:7px">'+(o.k>=0?'<span class="cdot" style="background:'+GCOL[GRP[o.k]]+'"></span>':'<span class="cdot" style="background:#D6DEE8"></span>')+'<select class="ss-map-sel" data-key="'+esc(o.key)+'" data-auto="'+o.auto+'" style="max-width:340px;padding:5px 8px;font-size:12px'+(man?';border-color:var(--yellow);background:#FFF8E6':'')+'">'+opts(o.k)+'</select>'+(man?'<span class="wp-pill" style="color:#8A6A00;background:#FFF6DF;border-color:#F2E0AE;padding:3px 8px">Manual</span><button class="ss-map-undo" data-key="'+esc(o.key)+'" title="Kembalikan ke otomatis" style="font:inherit;font-size:11px;font-weight:700;color:var(--muted);background:none;border:0;cursor:pointer">↺</button>':'')+'</div></td><td class="num">'+fmt(o.n)+'</td><td class="num"><b>'+fmt(o.v)+'</b></td></tr>';}).join("")||'<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">Tidak ada data.</td></tr>';
    S.wpCache={D,WM};
  }

  function mk(id,cfg){if(charts[id])charts[id].destroy();const el=$(id);if(!el||!window.Chart)return;charts[id]=new Chart(el,cfg);}
  const baseOpt=(extra)=>Object.assign({responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:10,boxHeight:10,font:{family:"Plus Jakarta Sans",size:11,weight:"600"}}},tooltip:{callbacks:{label:c=>" "+c.dataset.label+": "+fmt(c.parsed.y!=null&&c.chart.options.indexAxis!=="y"?c.parsed.y:c.parsed.x)}}},scales:{x:{grid:{display:false},ticks:{font:{family:"Plus Jakarta Sans",size:11}}},y:{beginAtZero:true,grid:{color:"#EDF1F6"},ticks:{font:{family:"Plus Jakarta Sans",size:11}}}}},extra||{});

  function charts_(f,M,lastM){
    if(!window.Chart)return;
    Chart.defaults.font.family="Plus Jakarta Sans";
    const hl=i=>f.b==null||f.b===i;
    // 1. per bulan per kelompok
    mk("ss-ch-bulan",{type:"bar",data:{labels:MON,datasets:GROUPS.filter(g=>!f.g||f.g===g).map(g=>({label:g,backgroundColor:MON.map((x,i)=>hl(i)?GCOL[g]:GCOL[g]+"40"),borderRadius:3,data:MON.map((x,m)=>KEG.reduce((s,k,i)=>s+(GRP[i]===g&&keep(f,i)?M[i][m]:0),0))}))},options:baseOpt({scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,grid:{color:"#EDF1F6"}}}})});
    // 2. komposisi kelompok
    const gv=GROUPS.map(g=>KEG.reduce((s,k,i)=>s+(GRP[i]===g&&keep(f,i)?(f.b==null?M[i].reduce((a,b)=>a+b,0):M[i][f.b]):0),0));
    mk("ss-ch-kel",{type:"doughnut",data:{labels:GROUPS,datasets:[{data:gv,backgroundColor:GROUPS.map(g=>GCOL[g]),borderWidth:2,borderColor:"#fff"}]},options:{responsive:true,maintainAspectRatio:false,cutout:"62%",plugins:{legend:{position:"bottom",labels:{boxWidth:10,font:{size:11,weight:"600"}}},tooltip:{callbacks:{label:c=>" "+c.label+": "+fmt(c.parsed)}}}}});
    // 3/4. target vs realisasi
    const tv=(id,ki,key,col)=>{let cr=0,ct=0;const cumR=[],cumT=[];MON.forEach((x,m)=>{ct+=S.T[key][m]||0;cumT.push(ct);if(m<=lastM){cr+=M[ki][m];cumR.push(cr);}else cumR.push(null);});
      mk(id,{data:{labels:MON,datasets:[
        {type:"bar",label:"Realisasi",data:MON.map((x,m)=>M[ki][m]),backgroundColor:MON.map((x,m)=>hl(m)?col:col+"40"),borderRadius:4,order:2,yAxisID:"y"},
        {type:"line",label:"Target bulanan",data:S.T[key],borderColor:"#E2231A",borderDash:[5,4],borderWidth:2,pointRadius:2,pointBackgroundColor:"#E2231A",fill:false,order:1,yAxisID:"y"},
        {type:"line",label:"Kumulatif realisasi",data:cumR,borderColor:"#073B6B",borderWidth:2,pointRadius:2,tension:.25,order:0,yAxisID:"y2"},
        {type:"line",label:"Kumulatif target",data:cumT,borderColor:"#9AA6B5",borderDash:[2,3],borderWidth:1.5,pointRadius:0,order:0,yAxisID:"y2"}]},
        options:baseOpt({scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:"#EDF1F6"},title:{display:true,text:"Bulanan",font:{size:10}}},y2:{beginAtZero:true,position:"right",grid:{display:false},title:{display:true,text:"Kumulatif",font:{size:10}}}}})});
      return {cr,ct:cumT[Math.max(lastM,0)]};};
    const a=tv("ss-ch-p",1,"P","#1273C4"),b=tv("ss-ch-h",10,"H","#0F9B9B");
    $("ss-p-sub").textContent="Kumulatif s.d. "+MON[Math.max(lastM,0)]+": "+fmt(a.cr)+" / "+fmt(a.ct)+" ("+pctS(pct(a.cr,a.ct))+")";
    $("ss-h-sub").textContent="Kumulatif s.d. "+MON[Math.max(lastM,0)]+": "+fmt(b.cr)+" / "+fmt(b.ct)+" ("+pctS(pct(b.cr,b.ct))+")";
    // 5. per kegiatan
    const ks=KEG.map((k,i)=>({k,i,v:keep(f,i)?(f.b==null?M[i].reduce((x,y)=>x+y,0):M[i][f.b]):0})).filter(o=>keep(f,o.i)).sort((x,y)=>y.v-x.v);
    $("ss-keg-box").style.height=Math.max(220,ks.length*26+50)+"px";
    mk("ss-ch-keg",{type:"bar",data:{labels:ks.map(o=>o.k.length>48?o.k.slice(0,46)+"…":o.k),datasets:[{label:"Volume",data:ks.map(o=>o.v),backgroundColor:ks.map(o=>GCOL[GRP[o.i]]),borderRadius:3,barThickness:16}]},options:baseOpt({indexAxis:"y",plugins:{legend:{display:false},tooltip:{callbacks:{title:c=>ks[c[0].dataIndex].k,label:c=>" "+fmt(c.parsed.x)}}},scales:{x:{beginAtZero:true,grid:{color:"#EDF1F6"}},y:{grid:{display:false},ticks:{font:{size:11}}}}})});
    // 6. target per ULP
    const U=S.T.ulp;
    mk("ss-ch-ulp",{type:"bar",data:{labels:U.map(u=>u[0]),datasets:[{label:"Pemerataan JTM",data:U.map(u=>u[1]),backgroundColor:"#1273C4",borderRadius:4},{label:"HAR PHBTR",data:U.map(u=>u[2]),backgroundColor:"#0F9B9B",borderRadius:4}]},options:baseOpt()});
    const fq=S.T.freq||{};
    $("ss-ulp-sub").textContent="Frekuensi per ULP · total bulanan "+(fq.bulanan?fq.bulanan.join(" / "):"—")+" · mingguan "+(fq.mingguan?fq.mingguan.join(" / "):"—")+" (Pemerataan / PHBTR)";
  }

  function table(f,M,months,lastM){
    const head='<tr><th>No</th><th>Kegiatan Susut</th>'+MON.map((m,i)=>'<th class="num'+(f.b===i?" mx-sel":"")+'">'+m+'</th>').join("")+'<th class="num">Total</th><th class="num">Target</th><th>Capaian</th></tr>';
    $("ss-mx-head").innerHTML=head;
    let html="",no=0;const tAll=Array(12).fill(0);
    GROUPS.forEach(g=>{
      if(f.g&&f.g!==g)return;
      const idx=KEG.map((k,i)=>i).filter(i=>GRP[i]===g&&keep(f,i));if(!idx.length)return;
      const sub=Array(12).fill(0);let rows="";
      idx.forEach(i=>{no++;const row=M[i];row.forEach((v,m)=>{sub[m]+=v;tAll[m]+=v;});const t=row.reduce((a,b)=>a+b,0);
        const key=TGT_IDX[i];let tg="—",cp="";
        if(key){const ms=[...Array(Math.max(lastM,0)+1).keys()];const tt=ms.reduce((s,m)=>s+S.T[key][m],0);const tr=ms.reduce((s,m)=>s+row[m],0);const p=pct(tr,tt);tg=fmt(tt);cp=bar(p);}
        rows+='<tr><td class="muted">'+no+'</td><td style="min-width:260px">'+esc(KEG[i])+'</td>'+row.map((v,m)=>'<td class="num'+(f.b===m?" mx-sel":"")+'"'+(v?'':' style="color:#B8C2CE"')+'>'+(v?fmt(v):"·")+'</td>').join("")+'<td class="num"><b>'+fmt(t)+'</b></td><td class="num">'+tg+'</td><td>'+cp+'</td></tr>';});
      html+='<tr class="wp-sub"><td></td><td><span class="cdot" style="background:'+GCOL[g]+';margin-right:7px"></span>'+g+'</td>'+sub.map((v,m)=>'<td class="num'+(f.b===m?" mx-sel":"")+'">'+(v?fmt(v):"·")+'</td>').join("")+'<td class="num">'+fmt(sub.reduce((a,b)=>a+b,0))+'</td><td></td><td></td></tr>'+rows;
    });
    html+='<tr class="total-row"><td></td><td>TOTAL</td>'+tAll.map(v=>'<td class="num">'+(v?fmt(v):"·")+'</td>').join("")+'<td class="num">'+fmt(tAll.reduce((a,b)=>a+b,0))+'</td><td></td><td></td></tr>';
    $("ss-mx-body").innerHTML=html;
    $("ss-mx-note").textContent="Target & capaian dihitung s.d. "+MONL[Math.max(lastM,0)]+" (bulan realisasi terakhir)";
  }
  function bar(p){if(p==null)return "—";const c=p>=100?"var(--green)":p>=80?"var(--blue)":p>=50?"var(--yellow)":"var(--red)";return '<div style="display:flex;align-items:center;gap:7px;min-width:120px"><span class="barcell" style="width:70px;margin:0"><span class="barcell__fill" style="width:'+Math.min(p,100)+'%;background:'+c+'"></span></span><b style="font-size:11.5px;color:var(--navy)">'+pctS(p)+'</b></div>';}

  function detail(E){
    const L=[...E].sort((a,b)=>b.iso.localeCompare(a.iso)||a.k-b.k);
    $("ss-dcount").textContent=L.length+" entri";
    $("ss-dbody").innerHTML=L.length?L.map(e=>'<tr><td class="nowrap">'+e.day+" "+MON[e.m]+' 2026</td><td><span class="cdot" style="background:'+GCOL[GRP[e.k]]+';margin-right:7px"></span>'+GRP[e.k]+'</td><td>'+esc(KEG[e.k])+'</td><td class="num"><b>'+fmt(e.v)+'</b></td></tr>').join(""):'<tr><td colspan="4" class="muted" style="text-align:center;padding:24px">Belum ada realisasi untuk filter ini.</td></tr>';
  }

  function xls(){
    if(!S)return;const f=sel();const M=KEG.map(()=>Array(12).fill(0));S.R.forEach(e=>{M[e.k][e.m]+=e.v;});
    const cS=v=>'<Cell><Data ss:Type="String">'+esc(v)+'</Data></Cell>',cN=v=>'<Cell><Data ss:Type="Number">'+v+'</Data></Cell>';
    const s1=[["No","Kelompok","Kegiatan",...MONL,"Total"].map(cS).join("")];let n=0;
    KEG.forEach((k,i)=>{if(!keep(f,i))return;n++;s1.push([cN(n),cS(GRP[i]),cS(k),...M[i].map(cN),cN(M[i].reduce((a,b)=>a+b,0))].join(""));});
    const s2=[["Bulan","Target Pemerataan JTM","Realisasi Pemerataan JTM","Target HAR PHBTR","Realisasi HAR PHBTR"].map(cS).join("")];
    MONL.forEach((m,i)=>s2.push([cS(m),cN(S.T.P[i]),cN(M[1][i]),cN(S.T.H[i]),cN(M[10][i])].join("")));
    const s3=[["Tanggal","Kelompok","Kegiatan","Volume"].map(cS).join("")];
    S.R.filter(e=>keep(f,e.k)&&(f.b==null||e.m===f.b)).sort((a,b)=>a.iso.localeCompare(b.iso)).forEach(e=>s3.push([cS(e.iso),cS(GRP[e.k]),cS(KEG[e.k]),cN(e.v)].join("")));
    const sh=(nm,rr)=>'<Worksheet ss:Name="'+nm+'"><Table>'+rr.map(r=>"<Row>"+r+"</Row>").join("")+'</Table></Worksheet>';
    const xml='<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'+sh("Rekap Bulanan",s1)+sh("Target vs Realisasi",s2)+sh("Detail Entri",s3)+'</Workbook>';
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff",xml],{type:"application/vnd.ms-excel;charset=utf-8"}));a.download="Workplan_Susut_UP3_Sorong_2026.xls";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  }

  function wpXls(){
    if(!S||!S.wpCache)return;const f=sel();const {D,WM}=S.wpCache;
    const cS=v=>'<Cell><Data ss:Type="String">'+esc(v)+'</Data></Cell>',cN=v=>'<Cell><Data ss:Type="Number">'+v+'</Data></Cell>';
    const s1=[["No","Kelompok","Kegiatan Susut",...MONL,"Total WP"].map(cS).join("")];let n=0;
    KEG.forEach((k,i)=>{if(!keep(f,i))return;n++;s1.push([cN(n),cS(GRP[i]),cS(k),...WM[i].map(cN),cN(WM[i].reduce((a,b)=>a+b,0))].join(""));});
    const s2=[["Bulan","ULP","Penyulang","Kelompok WP","Lead Measure WP","Kegiatan Susut","Jumlah","Satuan"].map(cS).join("")];
    D.filter(d=>d.k>=0&&keep(f,d.k)&&(f.b==null||d.m===f.b)).forEach(d=>s2.push([cS(MONL[d.m]),cS(d.ulp),cS(d.penyulang),cS(d.kel),cS(d.lm),cS(KEG[d.k]),cN(d.v),cS(d.sat)].join("")));
    const sh=(nm,rr)=>'<Worksheet ss:Name="'+nm+'"><Table>'+rr.map(r=>"<Row>"+r+"</Row>").join("")+'</Table></Worksheet>';
    const xml='<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'+sh("Rekap Susut dari WP",s1)+sh("Detail Entri WP",s2)+'</Workbook>';
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff",xml],{type:"application/vnd.ms-excel;charset=utf-8"}));a.download="Rekap_Susut_dari_Workplan_UP3_Sorong_2026.xls";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  }

  function init(){
    if(inited){Object.values(charts).forEach(c=>c.resize());return;}
    inited=true;
    $("ss-f-bulan").addEventListener("change",render);
    $("ss-f-kel").addEventListener("change",()=>{fillKeg();render();});
    $("ss-f-keg").addEventListener("change",render);
    $("ss-reset").addEventListener("click",()=>{$("ss-f-bulan").value="";$("ss-f-kel").value="";fillKeg();$("ss-f-keg").value="";render();});
    $("ss-xls").addEventListener("click",xls);
    $("ss-wp-ulp").innerHTML='<option value="">Semua ULP</option>'+WP_ULPS.map(u=>'<option>'+u+'</option>').join("");
    $("ss-wp-ulp").addEventListener("change",render);
    $("ss-wp-xls").addEventListener("click",wpXls);
    const remap=()=>{saveOV();applyOV();render();};
    $("ss-map-body").addEventListener("change",e=>{const s=e.target.closest(".ss-map-sel");if(!s)return;const v=+s.value,key=s.dataset.key;if(v===+s.dataset.auto)delete OV[key];else OV[key]=v;remap();});
    $("ss-map-body").addEventListener("click",e=>{const b=e.target.closest(".ss-map-undo");if(!b)return;delete OV[b.dataset.key];remap();});
    $("ss-map-reset").addEventListener("click",()=>{if(confirm("Hapus semua pemetaan manual dan kembali ke pemetaan otomatis?")){OV={};remap();}});
    $("ss-map-q").addEventListener("input",render);
    $("ss-map-show").addEventListener("change",render);
    load();
  }
  return {init,reload:load};
})();
