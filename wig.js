// Monitoring WIG Keandalan (HAR) — UP3 Sorong 2026
// Target : sheet 4DX (kolom UP3 SORONG, "Target 1 Bulan").
// Realisasi : spreadsheet harian sheet SOR (gid 1313963891), diagregasi per bulan.
(function () {
  const M = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const MO_EN = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  const MO_ID = {jan:0,feb:1,mar:2,apr:3,mei:4,jun:5,jul:6,agu:7,ags:7,sep:8,okt:9,nov:10,des:11};
  const N = null;

  const TARGET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQox8LABZOKmoHGTInV8l_YDceAJg1gPrHQumeFjFQOnUaJcJVnKS0ky7m8A-3sqXSFppMjdCCCljfE/pub?output=csv";
  const REAL_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6SbB8P0JAjleEjSfuiYYJ8PCL7IZdVf37CF0BmVpWwhIoBE0sYrAWm9dr988hkMPgG1_W_VGTOcS0/pub?gid=1313963891&single=true&output=csv";

  // cols: A=0 B=1 C=2 D=3 E=4 F=5 G=6 H=7 I=8 ... T=19 U=20 V=21 W=22 X=23
  const ROWS = [
    { no:1,  nama:"Inspeksi JTM (Berbasis EAM)",   cols:[1],    tm:/inspeksi\s+jaringan\s+tm\s+berbasis\s+eam/i },
    { no:2,  nama:"Inspeksi JTM Non EAM",          cols:[5],    tm:/inspeksi\s+jaringan\s+tm\s+non\s+eam/i },
    { no:3,  nama:"Tindaklanjut Inspeksi JTM",     cols:[2,6],  tm:/tindak ?lanjut inspeksi jtm/i },
    { no:4,  nama:"Inspeksi Gardu (Berbasis EAM)", cols:[3],    tm:/^inspeksi\s+gardu\s+distribusi(\s+berbasis\s+eam)?$/i },
    { no:5,  nama:"Inspeksi Gardu Non EAM",        cols:[7],    tm:/inspeksi\s+gardu\s+distribusi\s+non\s+eam/i },
    { no:6,  nama:"Tindaklanjut Inspeksi Gardu",   cols:[4,8],  tm:/tindak ?lanjut inspeksi gardu/i },
    { no:7,  nama:"Pelaksanaan ROW (kms)",         cols:[19],   tm:/^pelaksanaan row$/i },
    { no:8,  nama:"Penebangan Pohon (btg)",        cols:[20],   tm:/penebangan pohon/i },
    { no:9,  nama:"Pengukuran Gardu",              cols:[21],   tm:/pengukuran gardu/i },
    { no:10, nama:"Pekerjaan PDKB",                cols:[22],   tm:/pekerjaan pdkb/i },
    { no:11, nama:"Kwh PDKB",                      cols:[23],   tm:/kwh pdkb/i }
  ];

  let TGT = {};   // no -> target bulanan (null bila tak ada)
  let REAL = {};  // no -> [12] realisasi bulanan (null bila belum ada input)
  let META = { target:false, real:false, last:null };

  function parseCSV(text){
    const rows=[]; let row=[],f="",q=false;
    for(let i=0;i<text.length;i++){const c=text[i];
      if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
      else{ if(c==='"')q=true; else if(c===","){row.push(f);f="";} else if(c==="\n"){row.push(f);rows.push(row);row=[];f="";} else if(c!=="\r")f+=c; }
    }
    if(f.length||row.length){row.push(f);rows.push(row);}
    return rows;
  }
  function num(v){
    if(v==null) return 0;
    let s=String(v).replace(/[^0-9,.\-]/g,"").trim();
    if(!s||s==="-"||s===".") return 0;
    if(s.indexOf(",")!==-1) s=s.replace(/\./g,"").replace(",",".");
    else s=s.replace(/\./g,"");
    const n=parseFloat(s); return isNaN(n)?0:n;
  }
  function parseDate(s){
    const m=String(s).trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
    if(!m) return null;
    const key=m[2].slice(0,3).toLowerCase();
    const mo = (key in MO_ID) ? MO_ID[key] : MO_EN[key];
    if(mo===undefined) return null;
    return { d:+m[1], m:mo, y:+m[3] };
  }
  async function grab(url){
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),9000);
    try{ const r=await fetch(url,{signal:ctrl.signal,mode:"cors"}); clearTimeout(t); return r.ok ? await r.text() : null; }
    catch(e){ clearTimeout(t); return null; }
  }

  async function loadTarget(){
    const txt = await grab(TARGET_URL); if(!txt) return;
    const rows = parseCSV(txt);
    const items = [];
    for(let i=3;i<rows.length;i++){
      const nama=(rows[i][1]||"").trim();
      if(!nama || /^[IVX]+[.,]?$/.test((rows[i][0]||"").trim())) continue;
      // Kolom UP3 SORONG: tahun=2, bulan=7. Bila sel bulan kosong, turunkan dari target tahunan.
      const thn = num(rows[i][2]);
      let bln = num(rows[i][7]);
      if(!bln && thn) bln = thn/12;
      items.push({ nama, bulan: bln });
    }
    ROWS.forEach(r=>{
      if(!r.tm){ TGT[r.no]=N; return; }
      const hit = items.find(it=>r.tm.test(it.nama));
      TGT[r.no] = hit && hit.bulan>0 ? +hit.bulan.toFixed(1) : N;
    });
    META.target = true;
  }

  async function loadReal(){
    const txt = await grab(REAL_URL); if(!txt) return;
    const rows = parseCSV(txt);
    const acc = {}; ROWS.forEach(r=>{ acc[r.no]=Array(12).fill(null); });
    let last=null;
    for(let i=1;i<rows.length;i++){
      const dt = parseDate(rows[i][0]); if(!dt || dt.y!==2026) continue;
      ROWS.forEach(r=>{
        let v=0, any=false;
        r.cols.forEach(c=>{ const raw=rows[i][c]; if(raw!=null && String(raw).trim()!==""){ const n=num(raw); if(n) { v+=n; any=true; } } });
        if(any){ acc[r.no][dt.m] = (acc[r.no][dt.m]||0) + v; if(!last||dt.m>last.m||(dt.m===last.m&&dt.d>last.d)) last=dt; }
      });
    }
    REAL = acc; META.real = true;
    if(last) META.last = last.d+" "+M[last.m]+" 2026";
  }

  function fmt(n){
    if(n===N||n===undefined) return "–";
    return n%1===0 ? n.toLocaleString("id-ID") : n.toLocaleString("id-ID",{minimumFractionDigits:1,maximumFractionDigits:1});
  }
  function tone(p){
    if(p===N) return "nil";
    if(p>=100) return "s4"; if(p>=80) return "s3"; if(p>=50) return "s2"; if(p>0) return "s1"; return "s0";
  }
  function pctOf(r,t){ if(t===N||!t) return N; if(r===N) return 0; return (r/t)*100; }

  function renderHalf(el, from, to, label){
    let h = `<div class="wig-scroll"><table class="wig-tbl"><thead>`;
    h += `<tr><th rowspan="2" class="wig-no">NO</th><th rowspan="2" class="wig-act">Kegiatan</th>`;
    for(let m=from;m<=to;m++) h += `<th colspan="3" class="wig-mh">${M[m]}-26</th>`;
    h += `</tr><tr>`;
    for(let m=from;m<=to;m++) h += `<th class="wig-sub">Target</th><th class="wig-sub">Realisasi</th><th class="wig-sub">%</th>`;
    h += `</tr></thead><tbody>`;
    ROWS.forEach(row=>{
      const t = TGT[row.no], rr = REAL[row.no] || Array(12).fill(null);
      h += `<tr><td class="wig-no">${row.no}</td><td class="wig-act">${row.nama}</td>`;
      for(let m=from;m<=to;m++){
        const r = rr[m], p = pctOf(r, t);
        h += `<td class="num t">${fmt(t)}</td><td class="num">${fmt(r===N?N:+r.toFixed(1))}</td>`;
        h += `<td class="num pct ${tone(p)}">${p===N ? "–" : p.toFixed(1)+"%"}</td>`;
      }
      h += `</tr>`;
    });
    h += `</tbody></table></div>`;
    el.innerHTML = `<div class="wig-cap">${label}</div>` + h;
  }

  function renderRecap(el){
    let h = `<div class="wig-scroll"><table class="wig-tbl"><thead><tr><th rowspan="2" class="wig-no">NO</th><th rowspan="2" class="wig-act">Kegiatan</th>`+
      `<th colspan="3" class="wig-mh">Akumulasi 2026</th><th colspan="3" class="wig-mh">Semester 1</th><th colspan="3" class="wig-mh">Semester 2</th></tr><tr>`+
      Array(3).fill(`<th class="wig-sub">Target</th><th class="wig-sub">Realisasi</th><th class="wig-sub">%</th>`).join("")+
      `</tr></thead><tbody>`;
    ROWS.forEach(row=>{
      const t = TGT[row.no], rr = REAL[row.no] || Array(12).fill(null);
      const seg = (a,b)=>{
        let sum=0, has=false, months=0;
        for(let m=a;m<=b;m++){ months++; if(rr[m]!==N){ sum+=rr[m]; has=true; } }
        return { t: t===N ? N : t*months, r: has?sum:N };
      };
      const y=seg(0,11), s1=seg(0,5), s2=seg(6,11);
      h += `<tr><td class="wig-no">${row.no}</td><td class="wig-act">${row.nama}</td>`;
      [y,s1,s2].forEach(g=>{
        const p=pctOf(g.r,g.t);
        h += `<td class="num t">${fmt(g.t===N?N:Math.round(g.t))}</td><td class="num"><b>${fmt(g.r===N?N:+g.r.toFixed(1))}</b></td>`+
             `<td class="num pct ${tone(p)}">${p===N?"–":p.toFixed(1)+"%"}</td>`;
      });
      h += `</tr>`;
    });
    h += `</tbody></table></div>`;
    el.innerHTML = `<div class="wig-cap">Rekapitulasi Tahunan &amp; Semesteran</div>` + h;
  }

  function exportXls(){
    const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const cS=v=>`<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
    const cN=v=>`<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
    const rows=[[cS("MONITORING WIG KEANDALAN (HAR) — UP3 SORONG 2026")],[cS("")]];
    const head=[cS("NO"),cS("Kegiatan")];
    M.forEach(m=>{ head.push(cS(m+"-26 Target")); head.push(cS(m+"-26 Realisasi")); head.push(cS(m+"-26 %")); });
    head.push(cS("Total Target")); head.push(cS("Total Realisasi")); head.push(cS("% Capaian"));
    rows.push(head);
    ROWS.forEach(row=>{
      const t=TGT[row.no], rr=REAL[row.no]||Array(12).fill(null);
      const r=[cN(row.no),cS(row.nama)];
      let sum=0, has=false;
      rr.forEach(v=>{
        r.push(t===N?cS("-"):cN(t));
        r.push(v===N?cS("-"):cN(+v.toFixed(2)));
        const p=pctOf(v,t);
        r.push(p===N?cS("-"):cN(+p.toFixed(1)));
        if(v!==N){ sum+=v; has=true; }
      });
      const tt=t===N?N:t*12;
      r.push(tt===N?cS("-"):cN(+tt.toFixed(2)));
      r.push(has?cN(+sum.toFixed(2)):cS("-"));
      const tp=pctOf(has?sum:N,tt);
      r.push(tp===N?cS("-"):cN(+tp.toFixed(1)));
      rows.push(r);
    });
    const xml='<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="WIG Keandalan"><Table>'+rows.map(r=>"<Row>"+r.join("")+"</Row>").join("")+'</Table></Worksheet></Workbook>';
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob(["\ufeff",xml],{type:"application/vnd.ms-excel;charset=utf-8"}));
    a.download="Monitoring-WIG-Keandalan_UP3-Sorong_2026.xls";
    document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  }

  function paint(){
    const a=document.getElementById("wig-h1"), b=document.getElementById("wig-h2"), c=document.getElementById("wig-recap");
    if(a) renderHalf(a,0,5,"Semester 1 — Januari s/d Juni 2026");
    if(b) renderHalf(b,6,11,"Semester 2 — Juli s/d Desember 2026");
    if(c) renderRecap(c);
    const s=document.getElementById("wig-source");
    if(s){
      const ok = META.target && META.real;
      s.innerHTML = `<span class="fdx-badge ${ok?"live":"warn"}">● ${ok?"Target &amp; realisasi live dari spreadsheet":"Sebagian data gagal dimuat"}</span>`+
        `<span class="fdx-stamp">Realisasi sheet SOR${META.last?" · input terakhir "+META.last:""} · dimuat ${new Date().toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</span>`;
    }
  }

  let done=false;
  async function init(){
    if(done) return; done=true;
    ROWS.forEach(r=>{ TGT[r.no]=N; REAL[r.no]=Array(12).fill(null); });
    const s=document.getElementById("wig-source");
    if(s) s.innerHTML = `<span class="fdx-badge">● Memuat data…</span>`;
    await Promise.allSettled([loadTarget(), loadReal()]);
    paint();
    const x=document.getElementById("wig-xls"); if(x) x.onclick=exportXls;
  }
  window.WIG = { init };
})();
