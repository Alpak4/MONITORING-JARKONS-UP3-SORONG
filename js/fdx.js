// Monitoring 4DX UP3 Sorong — Target Lead Measure 2026
// Sumber: Google Spreadsheet (published CSV). Layout: 7 ULP x 4 skala periode (Tahun/Bulan/Minggu/Hari).
(function () {
  const LIVE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQox8LABZOKmoHGTInV8l_YDceAJg1gPrHQumeFjFQOnUaJcJVnKS0ky7m8A-3sqXSFppMjdCCCljfE/pub?output=csv";
  const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const UNITS = ["UP3 SORONG","SORONG KOTA","AIMAS","TEMINABUAN","WAISAI"];
  const SCALES = [{k:"tahun",l:"Target 1 Tahun",off:2},{k:"bulan",l:"Target 1 Bulan",off:7},{k:"minggu",l:"Target 1 Minggu",off:12},{k:"hari",l:"Target Per Hari",off:17}];
  let DATA = null, initialized = false;
  const state = { ulp: "UP3 SORONG", bulan: new Date().getMonth(), tgl: new Date().getDate() };

  // ---------- Store realisasi (input manual per ULP, tersimpan di perangkat) ----------
  const RKEY = "fdx_realisasi_2026";
  let REAL = {};
  function loadReal(){ try{ REAL = JSON.parse(localStorage.getItem(RKEY)) || {}; }catch(e){ REAL = {}; } }
  function saveReal(){ try{ localStorage.setItem(RKEY, JSON.stringify(REAL)); }catch(e){} }
  function dkey(m,d){ return "2026-" + String(m+1).padStart(2,"0") + "-" + String(d).padStart(2,"0"); }
  function getReal(ulp,m,d,key){ return ((REAL[ulp]||{})[dkey(m,d)]||{})[key] || 0; }
  function setReal(ulp,m,d,key,val){
    if(!REAL[ulp]) REAL[ulp]={};
    const dk=dkey(m,d);
    if(!REAL[ulp][dk]) REAL[ulp][dk]={};
    if(val>0) REAL[ulp][dk][key]=val; else delete REAL[ulp][dk][key];
    saveReal();
  }
  function monthReal(ulp,m,key){
    const u=REAL[ulp]||{}; let s=0;
    const pre="2026-"+String(m+1).padStart(2,"0")+"-";
    Object.keys(u).forEach(dk=>{ if(dk.indexOf(pre)===0) s += u[dk][key]||0; });
    return s;
  }
  function ytdReal(ulp,m,key){ let s=0; for(let i=0;i<=m;i++) s+=monthReal(ulp,i,key); return s; }
  function daysInMonth(m){ return new Date(2026, m+1, 0).getDate(); }
  function itemKey(sec,it,i){ return sec.no + "|" + i; }

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
    if(!s||s==="-") return 0;
    if(s.indexOf(",")!==-1) s=s.replace(/\./g,"").replace(",",".");
    else s=s.replace(/\./g,"");
    const n=parseFloat(s); return isNaN(n)?0:n;
  }
  function fmt(n){
    if(!n) return "0";
    return n%1===0 ? n.toLocaleString("id-ID") : n.toLocaleString("id-ID",{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function process(rows){
    const sections=[]; let cur=null;
    for(let i=3;i<rows.length;i++){
      const r=rows[i]; if(!r) continue;
      const no=(r[0]||"").trim(), nama=(r[1]||"").trim();
      if(!nama) continue;
      if(/^[IVX]+[.,]?$/.test(no)){ cur={no:no.replace(/[.,]$/,""),nama,items:[]}; sections.push(cur); continue; }
      if(!cur) continue;
      const vals={};
      SCALES.forEach(sc=>{ vals[sc.k]=UNITS.map((u,ui)=>num(r[sc.off+ui])); });
      // Bila sel bulan/minggu/hari kosong, turunkan dari target tahunan.
      UNITS.forEach((u,ui)=>{
        const thn=vals.tahun[ui];
        if(thn){
          if(!vals.bulan[ui]) vals.bulan[ui]=thn/12;
          if(!vals.minggu[ui]) vals.minggu[ui]=thn/48;
          if(!vals.hari[ui]) vals.hari[ui]=thn/240;
        }
      });
      cur.items.push({no,nama,vals});
    }
    return sections.filter(s=>s.items.length);
  }

  async function load(){
    try{
      const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),9000);
      const res=await fetch(LIVE_URL,{signal:ctrl.signal,mode:"cors"}); clearTimeout(t);
      if(res.ok){ const body=await res.text(); const out=process(parseCSV(body)); if(out&&out.length) return out; }
    }catch(e){}
    return null;
  }

  // ---------- Render ----------
  function ui(id){ return document.getElementById(id); }
  function ulpIdx(){ return Math.max(0, UNITS.indexOf(state.ulp)); }

  function allItems(){ return DATA.reduce((a,s)=>a.concat(s.items.map(it=>({sec:s,it}))),[]); }

  function renderKPI(){
    const u = ulpIdx(), m = state.bulan;
    const tot = { tahun:0, bulan:0, minggu:0, hari:0 };
    let rHari=0, rBulan=0, rYtd=0;
    DATA.forEach(sec=>sec.items.forEach((it,i)=>{
      SCALES.forEach(sc=>{ tot[sc.k]+=it.vals[sc.k][u]||0; });
      const k=itemKey(sec,it,i);
      rHari += getReal(state.ulp,m,state.tgl,k);
      rBulan += monthReal(state.ulp,m,k);
      rYtd += ytdReal(state.ulp,m,k);
    }));
    const kum = tot.bulan*(m+1);
    const pctB = tot.bulan>0 ? (rBulan/tot.bulan)*100 : 0;
    const pctY = kum>0 ? (rYtd/kum)*100 : 0;
    const pctH = tot.hari>0 ? (rHari/tot.hari)*100 : 0;
    const tone = p => p>=100 ? "kpi--green" : (p>=70 ? "kpi--blue" : (p>0 ? "kpi--amber" : "kpi--red"));
    const el=ui("fdx-kpis"); if(!el) return;
    const card=(lbl,val,sub,mod)=>`<div class="kpi ${mod||""}"><div class="kpi__label">${lbl}</div><div class="kpi__value">${val}</div><div class="kpi__sub">${sub}</div></div>`;
    el.innerHTML =
      card("Realisasi Harian", fmt(Math.round(rHari)), `${state.tgl} ${MONTHS[m]} · target harian ${fmt(Math.round(tot.hari))} <b>(${pctH.toFixed(0)}%)</b>`, tone(pctH)) +
      card("Realisasi Bulanan", fmt(Math.round(rBulan)), `Target ${MONTHS[m]} ${fmt(Math.round(tot.bulan))} <b>(${pctB.toFixed(0)}%)</b>`, tone(pctB)) +
      card("Akumulasi s/d "+MONTHS[m], fmt(Math.round(rYtd)), `Target kumulatif ${fmt(Math.round(kum))} <b>(${pctY.toFixed(0)}%)</b>`, tone(pctY)) +
      card("Target Setahun", fmt(Math.round(tot.tahun)), `${allItems().length} lead measure · ${state.ulp}`);
  }

  function renderTable(){
    const u=ulpIdx(), m=state.bulan, body=ui("fdx-body"); if(!body) return;
    let html="", n=0;
    DATA.forEach(sec=>{
      html+=`<tr class="fdx-sec"><td colspan="8">${sec.no}. ${sec.nama}</td></tr>`;
      sec.items.forEach((it,i)=>{
        n++;
        const k=itemKey(sec,it,i);
        const hr=it.vals.hari[u], bl=it.vals.bulan[u];
        const rh=getReal(state.ulp,m,state.tgl,k), rb=monthReal(state.ulp,m,k);
        const pctH=hr>0?(rh/hr)*100:0, pctB=bl>0?(rb/bl)*100:0;
        const cls=p=>p>=100?"ok":(p>=70?"mid":(p>0?"low":"nil"));
        html+=`<tr><td>${it.no||""}</td><td class="fdx-name">${it.nama}</td>`+
          `<td class="num">${fmt(it.vals.tahun[u])}</td><td class="num">${fmt(bl)}</td><td class="num">${fmt(hr)}</td>`+
          `<td class="num"><input class="fdx-in" type="number" min="0" step="any" data-k="${k}" value="${rh||""}" placeholder="0" /></td>`+
          `<td class="num"><b>${fmt(+rb.toFixed(2))}</b></td>`+
          `<td><div class="fdx-bar"><span class="${cls(pctB)}" style="width:${Math.min(100,pctB).toFixed(1)}%"></span></div><div class="fdx-barv">${pctB.toFixed(0)}% <em>dari target bulan</em></div></td></tr>`;
      });
    });
    body.innerHTML=html;
    body.querySelectorAll(".fdx-in").forEach(inp=>{
      inp.addEventListener("change", ()=>{
        setReal(state.ulp, state.bulan, state.tgl, inp.dataset.k, parseFloat(inp.value)||0);
        renderKPI(); renderTable(); renderCompare(); renderTrend();
      });
    });
    const c=ui("fdx-tcount"); if(c) c.textContent=`${n} lead measure · ${state.ulp} · input tanggal ${state.tgl} ${MONTHS[m]}`;
  }

  function renderTrend(){
    const el=ui("fdx-trend"); if(!el) return;
    const u=ulpIdx(), m=state.bulan, dim=daysInMonth(m);
    let thari=0; DATA.forEach(s=>s.items.forEach(it=>{ thari+=it.vals.hari[u]||0; }));
    const days=[];
    for(let d=1; d<=dim; d++){
      let v=0; DATA.forEach(sec=>sec.items.forEach((it,i)=>{ v+=getReal(state.ulp,m,d,itemKey(sec,it,i)); }));
      days.push(v);
    }
    const max=Math.max(thari, Math.max.apply(null,days))||1;
    el.innerHTML = `<div class="fdx-trend-head"><span>Realisasi harian ${MONTHS[m]} 2026 — ${state.ulp}</span><span class="fdx-trend-lg"><i></i> target harian ${fmt(Math.round(thari))}</span></div>`+
      `<div class="fdx-trend-bars">`+days.map((v,i)=>{
        const d=i+1, h=(v/max)*100, on=d===state.tgl;
        const st=v>=thari&&v>0?"ok":(v>0?"low":"nil");
        return `<button class="fdx-day${on?" on":""}" data-d="${d}" title="${d} ${MONTHS[m]}: ${fmt(Math.round(v))}"><span class="fdx-day-bar ${st}" style="height:${Math.max(2,h).toFixed(1)}%"></span><em>${d}</em></button>`;
      }).join("")+`<div class="fdx-target-line" style="bottom:calc(18px + ${((thari/max)*100).toFixed(1)}% * 0.82)"></div></div>`;
    el.querySelectorAll(".fdx-day").forEach(b=>b.onclick=()=>{ state.tgl=+b.dataset.d; const s=ui("fdx-f-tgl"); if(s)s.value=String(state.tgl); renderAll(); });
  }

  function renderCompare(){
    const el=ui("fdx-compare"); if(!el) return;
    const m=state.bulan;
    const rows=UNITS.map((un,i)=>{
      let bl=0, rb=0;
      DATA.forEach(sec=>sec.items.forEach((it,ix)=>{ bl+=it.vals.bulan[i]||0; rb+=monthReal(un,m,itemKey(sec,it,ix)); }));
      return {u:un, bl, rb, pct: bl>0?(rb/bl)*100:0};
    });
    el.innerHTML=rows.map(r=>{
      const act=r.u===state.ulp;
      const st=r.pct>=100?"ok":(r.pct>=70?"mid":(r.pct>0?"low":"nil"));
      return `<button class="fdx-cmp${act?" on":""}" data-ulp="${r.u}"><div class="fdx-cmp-h"><span>${r.u}</span><b>${r.pct.toFixed(0)}%</b></div>`+
        `<div class="fdx-cmp-bar"><span class="${st}" style="width:${Math.min(100,r.pct).toFixed(1)}%"></span></div>`+
        `<div class="fdx-cmp-s">Realisasi ${fmt(Math.round(r.rb))} dari target ${fmt(Math.round(r.bl))} · ${MONTHS[m]}</div></button>`;
    }).join("");
    el.querySelectorAll(".fdx-cmp").forEach(b=>b.onclick=()=>{ state.ulp=b.dataset.ulp; const s=ui("fdx-f-ulp"); if(s)s.value=state.ulp; renderAll(); });
  }

  function renderSections(){
    const el=ui("fdx-sections"); if(!el) return;
    const u=ulpIdx();
    const tot=DATA.map(s=>({nama:s.nama,no:s.no,n:s.items.length,th:s.items.reduce((a,it)=>a+(it.vals.tahun[u]||0),0),bl:s.items.reduce((a,it)=>a+(it.vals.bulan[u]||0),0)}));
    const gt=tot.reduce((a,s)=>a+s.th,0)||1;
    el.innerHTML=tot.map(s=>`<div class="panel fdx-sec-card"><div class="fdx-sec-no">${s.no}</div><h3>${s.nama}</h3>`+
      `<div class="fdx-sec-v">${fmt(Math.round(s.th))}<em>target/tahun</em></div>`+
      `<div class="fdx-bar"><span style="width:${((s.th/gt)*100).toFixed(1)}%"></span></div>`+
      `<div class="fdx-sec-s">${s.n} lead measure · ${fmt(Math.round(s.bl))} per bulan · ${((s.th/gt)*100).toFixed(1)}% dari total</div></div>`).join("");
  }

  function renderAll(){ renderKPI(); renderSections(); renderTrend(); renderCompare(); renderTable(); }

  function exportXls(){
    const u=ulpIdx(), m=state.bulan;
    const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const cS=v=>`<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
    const cN=v=>`<Cell><Data ss:Type="Number">${v||0}</Data></Cell>`;
    const rows=[[cS("MONITORING 4DX — TARGET & REALISASI 2026")],[cS("ULP: "+state.ulp),cS("Bulan: "+MONTHS[m]),cS("Tanggal input: "+state.tgl)],[cS("")],
      [cS("No"),cS("Uraian Kegiatan Lead Measure"),cS("Target 1 Tahun"),cS("Target 1 Bulan"),cS("Target Per Hari"),cS("Realisasi Harian"),cS("Realisasi Bulanan"),cS("% Capaian Bulan")]];
    DATA.forEach(sec=>{
      rows.push([cS(sec.no+". "+sec.nama)]);
      sec.items.forEach((it,i)=>{
        const k=itemKey(sec,it,i), bl=it.vals.bulan[u], rb=monthReal(state.ulp,m,k);
        rows.push([cS(it.no||""),cS(it.nama),cN(+it.vals.tahun[u].toFixed(2)),cN(+bl.toFixed(2)),cN(+it.vals.hari[u].toFixed(2)),cN(+getReal(state.ulp,m,state.tgl,k).toFixed(2)),cN(+rb.toFixed(2)),cN(bl>0?+((rb/bl)*100).toFixed(1):0)]);
      });
    });
    // Sheet 2 — realisasi harian sebulan
    const dim=daysInMonth(m);
    const s2=[[cS("Tanggal"),cS("Uraian Lead Measure"),cS("Realisasi")]];
    for(let d=1; d<=dim; d++){
      DATA.forEach(sec=>sec.items.forEach((it,i)=>{
        const v=getReal(state.ulp,m,d,itemKey(sec,it,i));
        if(v>0) s2.push([cS(d+" "+MONTHS[m]+" 2026"),cS(it.nama),cN(+v.toFixed(2))]);
      }));
    }
    if(s2.length===1) s2.push([cS("Belum ada input realisasi pada bulan ini")]);
    const sh=(nm,rr)=>'<Worksheet ss:Name="'+nm+'"><Table>'+rr.map(r=>"<Row>"+r.join("")+"</Row>").join("")+'</Table></Worksheet>';
    const xml='<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'+sh("Rekap 4DX",rows)+sh("Realisasi Harian",s2)+'</Workbook>';
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob(["\ufeff",xml],{type:"application/vnd.ms-excel;charset=utf-8"}));
    a.download="4DX_"+state.ulp.replace(/\s+/g,"-")+"_"+MONTHS[m]+"_2026.xls";
    document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  }

  async function init(){
    if(initialized) return; initialized=true;
    loadReal();
    const badge=ui("fdx-source");
    DATA = await load();
    if(!DATA){ if(badge) badge.innerHTML=`<span class="fdx-badge warn">● Gagal memuat data spreadsheet</span>`; return; }
    if(badge) badge.innerHTML=`<span class="fdx-badge live">● Data Langsung dari Spreadsheet</span><span class="fdx-stamp">${DATA.length} kategori · ${allItems().length} lead measure · diperbarui ${new Date().toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span>`;
    const su=ui("fdx-f-ulp"), sb=ui("fdx-f-bulan");
    if(su){ su.innerHTML=UNITS.map(u=>`<option value="${u}">${u}</option>`).join(""); su.value=state.ulp; su.onchange=()=>{state.ulp=su.value;renderAll();}; }
    const st=ui("fdx-f-tgl");
    function fillDays(){
      if(!st) return;
      const dim=daysInMonth(state.bulan);
      if(state.tgl>dim) state.tgl=dim;
      let o=""; for(let d=1;d<=dim;d++) o+=`<option value="${d}">${d} ${MONTHS[state.bulan]}</option>`;
      st.innerHTML=o; st.value=String(state.tgl);
    }
    if(sb){ sb.innerHTML=MONTHS.map((m,i)=>`<option value="${i}">${m} 2026</option>`).join(""); sb.value=String(state.bulan); sb.onchange=()=>{state.bulan=+sb.value; fillDays(); renderAll();}; }
    if(st){ fillDays(); st.onchange=()=>{ state.tgl=+st.value; renderAll(); }; }
    const rb=ui("fdx-reset"); if(rb) rb.onclick=()=>{ state.ulp="UP3 SORONG"; state.bulan=new Date().getMonth(); state.tgl=new Date().getDate(); if(su)su.value=state.ulp; if(sb)sb.value=String(state.bulan); fillDays(); renderAll(); };
    const cb=ui("fdx-clear"); if(cb) cb.onclick=()=>{
      if(!confirm("Hapus seluruh input realisasi "+state.ulp+" bulan "+MONTHS[state.bulan]+"?")) return;
      const pre="2026-"+String(state.bulan+1).padStart(2,"0")+"-";
      const u2=REAL[state.ulp]||{}; Object.keys(u2).forEach(dk=>{ if(dk.indexOf(pre)===0) delete u2[dk]; });
      saveReal(); renderAll();
    };
    const xb=ui("fdx-xls"); if(xb) xb.onclick=exportXls;
    renderAll();
  }

  window.FDX = { init };
})();
