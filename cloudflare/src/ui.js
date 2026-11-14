export const HTML = String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#10131a"><title>Telegram SAPI</title>
<style>
:root{color-scheme:dark;--bg:#0d1016;--panel:#151a23;--line:#283140;--muted:#9aa6b7;--text:#edf2fa;--accent:#8b9cff;--good:#55d6a2;--bad:#ff7b86}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 15% 0%,#1b2340 0,transparent 40%),var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}button,input{font:inherit}button{cursor:pointer;border:1px solid #46516a;background:#242d40;color:var(--text);padding:10px 15px;border-radius:10px}button.primary{background:var(--accent);border-color:var(--accent);color:#10131a;font-weight:700}button.danger{border-color:#7d3b46;background:#382027;color:#ffabb2}button:disabled{opacity:.45;cursor:not-allowed}input{background:#0e131c;border:1px solid var(--line);color:var(--text);padding:12px;border-radius:10px;width:100%;outline:none}input:focus{border-color:var(--accent)}.wrap{max-width:1040px;margin:auto;padding:32px 18px 70px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:26px}.brand{display:flex;align-items:center;gap:12px}.logo{width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#a5b2ff,#6878db);display:grid;place-items:center;color:#111827;font-weight:900;font-size:20px}.muted,.hint{color:var(--muted)}.panel{background:color-mix(in srgb,var(--panel) 94%,transparent);border:1px solid var(--line);border-radius:18px;padding:22px;margin:16px 0;box-shadow:0 12px 35px #0002}.login{max-width:420px;margin:12vh auto}.hidden{display:none!important}.row{display:flex;gap:10px;align-items:center}.row>*{min-width:0}.grow{flex:1}.drop{border:1px dashed #596783;border-radius:14px;padding:28px;text-align:center;background:#111722}.drop.over{border-color:var(--accent);background:#1a2031}.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.toolbar input{flex:1;min-width:190px}.file{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:15px 0;border-bottom:1px solid var(--line)}.file:last-child{border:0}.filename{font-weight:650;overflow-wrap:anywhere}.meta{font-size:13px;color:var(--muted)}.actions{display:flex;gap:8px;align-items:center}.progress{height:6px;background:#283140;border-radius:9px;overflow:hidden;margin-top:9px}.progress>i{display:block;height:100%;background:var(--good);width:0;transition:width .2s}.status{font-size:12px;color:var(--muted)}.good{color:var(--good)}.bad{color:var(--bad)}.empty{text-align:center;padding:28px;color:var(--muted)}.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#242d40;border:1px solid #596783;padding:11px 16px;border-radius:10px;max-width:90vw}.small{font-size:12px}.section-title{margin:0 0 5px;font-size:18px}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
button,input,select{min-height:42px}button{transition:background .15s,border-color .15s,transform .15s}button:not(:disabled):active{transform:translateY(1px)}
.panel{backdrop-filter:blur(12px)}.drop{transition:border-color .15s,background .15s}.file{align-items:center;min-width:0}.file>div:first-child{min-width:0}.filename{line-height:1.4}.meta,.status{overflow-wrap:anywhere}
.transfer-card{background:#111722;border:1px solid var(--line);border-radius:13px;padding:14px;margin-top:12px}.transfer-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.transfer-name{font-weight:650;overflow-wrap:anywhere}.transfer-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}.stat{background:#0d131d;border:1px solid #202a39;border-radius:10px;padding:9px;min-width:0}.stat strong{display:block;font-size:14px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.stat span{display:block;color:var(--muted);font-size:11px}.transfer-detail{display:flex;justify-content:space-between;gap:10px;margin-top:9px;flex-wrap:wrap}.transfer-card .progress{height:8px}.transfer-card .progress>i{background:linear-gradient(90deg,#7d91ff,#55d6a2)}
.toolbar select{min-width:130px}.actions button{white-space:nowrap}
@media(min-width:900px){.wrap{padding-top:42px}.panel{padding:24px}.drop{padding:36px}}
@media(max-width:720px){.wrap{padding:22px 14px 48px}.panel{padding:17px;border-radius:15px}.file{grid-template-columns:minmax(0,1fr);gap:10px}.actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}.actions button{width:100%}.toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto}.toolbar input{min-width:0}.top{align-items:center}.transfer-stats{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:420px){.wrap{padding:14px 10px 36px}.panel{padding:14px;margin:12px 0}.top{gap:8px}.brand{gap:9px}.logo{width:36px;height:36px}.top h1{font-size:19px!important}#logout{padding:8px 10px}.drop{padding:20px 12px}.toolbar{grid-template-columns:1fr}.toolbar select{width:100%!important}.row{gap:7px}.transfer-card{padding:11px}.transfer-stats{gap:5px}.stat{padding:7px}.stat strong{font-size:12px}.actions{gap:7px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
</style></head><body><main class="wrap">
<section id="login" class="panel login"><div class="brand"><div class="logo">S</div><div><h1 style="margin:0;font-size:23px">Telegram SAPI</h1><div class="muted">Private file storage</div></div></div><p class="muted">Sign in with your shared API token.</p><form id="loginForm"><input id="password" type="password" autocomplete="current-password" placeholder="API token" required><button class="primary" style="width:100%;margin-top:12px">Sign in</button><p id="loginError" class="bad small"></p></form></section>
<section id="app" class="hidden"><header class="top"><div class="brand"><div class="logo">S</div><div><h1 style="margin:0;font-size:23px">Telegram SAPI</h1><div class="muted">Your private file library</div></div></div><button id="logout">Sign out</button></header>
<section class="panel"><h2 class="section-title">Upload files</h2><p class="muted" style="margin-top:4px">Select multiple files or drop them here. Files are transferred in 10 MiB chunks.</p><div id="drop" class="drop"><input id="picker" type="file" multiple style="display:none"><button id="choose" class="primary">Choose files</button><p class="hint" style="margin-bottom:0">or drag and drop files here</p></div><div id="uploads"></div></section>
<section class="panel"><div class="row" style="margin-bottom:15px"><div class="grow"><h2 class="section-title">File library</h2><div id="count" class="muted small">Loading…</div></div><button id="refresh">Refresh</button></div><div class="toolbar"><input id="search" type="search" placeholder="Search filenames…"><select id="status" style="width:auto;background:#0e131c;color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px"><option value="">All statuses</option><option value="complete">Complete</option><option value="uploading">Uploading</option><option value="error">Error</option></select></div><div id="files"><div class="empty">Loading files…</div></div><div class="row" style="justify-content:space-between;margin-top:12px"><span id="pageInfo" class="muted small"></span><div class="row"><button id="prev">Previous</button><button id="next">Next</button></div></div></section><p class="muted small" style="text-align:center">Chunk integrity is verified during download. Keep independent backups of important files.</p></section></main><div id="toast" class="toast hidden"></div>
<script>
const $=s=>document.querySelector(s), CHUNK=10*1024*1024;let page=0,query="",status="",timer=null,loading=false;
function toast(s){const t=$("#toast");t.textContent=s;t.classList.remove("hidden");clearTimeout(timer);timer=setTimeout(()=>t.classList.add("hidden"),3200)}
async function api(path,opts={}){const r=await fetch(path,{...opts,credentials:"same-origin",headers:opts.headers||{}});if(r.status===401){showLogin();throw Error("Session expired. Sign in again.")}if(!r.ok){let d={};try{d=await r.json()}catch{}throw Error(d.error||("Request failed ("+r.status+")"))}return r}
function showLogin(){$("#app").classList.add("hidden");$("#login").classList.remove("hidden")}
function showApp(){$("#login").classList.add("hidden");$("#app").classList.remove("hidden");loadFiles()}
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();$("#loginError").textContent="";const b=e.submitter;b.disabled=true;try{await api("/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("#password").value})});$("#password").value="";showApp()}catch(err){$("#loginError").textContent=err.message}finally{b.disabled=false}});
$("#logout").onclick=async()=>{try{await api("/auth/logout",{method:"POST"})}finally{showLogin()}};
$("#choose").onclick=()=>$("#picker").click();$("#picker").onchange=e=>{uploadFiles([...e.target.files]);e.target.value=""};
const drop=$("#drop");["dragenter","dragover"].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.add("over")}));["dragleave","drop"].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.remove("over")}));drop.addEventListener("drop",e=>uploadFiles([...e.dataTransfer.files]));
function fmt(n){if(n<1024)return n+" B";const u=["KB","MB","GB","TB"];let i=-1;do{n/=1024;i++}while(n>=1024&&i<u.length-1);return n.toFixed(1)+" "+u[i]}
function fmtSpeed(n){return fmt(n)+"/s"}
function fmtTime(seconds){if(!Number.isFinite(seconds)||seconds<0)return "—";if(seconds<60)return Math.ceil(seconds)+"s";if(seconds<3600)return Math.floor(seconds/60)+"m "+Math.ceil(seconds%60)+"s";return Math.floor(seconds/3600)+"h "+Math.floor(seconds%3600/60)+"m"}
function transferStats(bytes,total,start){const elapsed=Math.max(.25,(performance.now()-start)/1000),speed=bytes/elapsed;return {speed,eta:speed>0?(total-bytes)/speed:Infinity,elapsed}}
function liveTransferStats(samples,bytes,total,start){const now=performance.now();samples.push([now,bytes]);while(samples.length>2&&now-samples[0][0]>2500)samples.shift();const first=samples[0],span=(now-first[0])/1000;const liveSpeed=span>0?(bytes-first[1])/span:0;const average=bytes/Math.max(.25,(now-start)/1000);const speed=liveSpeed>0?liveSpeed:average;return {speed,eta:speed>0?(total-bytes)/speed:Infinity}}
function safe(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function digest(buf){const h=await crypto.subtle.digest("SHA-256",buf);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function uploadCard(file){const key="upload:"+file.name+"|"+file.size;let el=[...$("#uploads").querySelectorAll(".transfer-card")].find(x=>x.dataset.transferKey===key);if(!el){el=document.createElement("article");el.className="transfer-card";el.dataset.transferKey=key;$("#uploads").prepend(el)}el.innerHTML='<div class="transfer-top"><div class="transfer-name">'+safe(file.name)+'</div><div class="status">Queued</div></div><div class="meta">'+fmt(file.size)+' total</div><div class="progress"><i></i></div><div class="transfer-stats"><div class="stat"><strong data-speed>—</strong><span>Speed</span></div><div class="stat"><strong data-eta>—</strong><span>Time left</span></div><div class="stat"><strong data-done>0%</strong><span>Progress</span></div></div><div class="transfer-detail"><span class="meta" data-detail>Waiting to start</span><span class="meta" data-bytes>0 B / '+fmt(file.size)+'</span></div>';$("#uploads").prepend(el);return {el,bar:el.querySelector(".progress i"),meta:el.querySelector(".meta"),state:el.querySelector(".status"),speed:el.querySelector("[data-speed]"),eta:el.querySelector("[data-eta]"),done:el.querySelector("[data-done]"),detail:el.querySelector("[data-detail]"),bytes:el.querySelector("[data-bytes]")}}
async function fingerprint(file){
 const hashes=[];
 for(let offset=0;offset<file.size;offset+=CHUNK){
  const part=await file.slice(offset,Math.min(file.size,offset+CHUNK)).arrayBuffer();
  hashes.push(await digest(part));
 }
 return digest(new TextEncoder().encode(file.name+"|"+file.size+"|"+hashes.join("|")).buffer);
}
async function uploadOne(file,card){
 try{
  card.state.textContent="Identifying file…";
  const fp=await fingerprint(file);
  const m=await api("/v1/files",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:file.name,size:file.size,fingerprint:fp})}).then(r=>r.json());
  card.meta.textContent=fmt(file.size)+" · "+(m.recovered?"Recovered instantly":m.resumed?"Resuming":"New upload")+" · "+m.id;
  const totalChunks=m.total_chunks??m.totalChunks;
  if(!Number.isSafeInteger(totalChunks)||totalChunks<0)throw Error("Server returned an invalid chunk count");
  const done=new Set((m.chunks||[]).filter(c=>c.status==="uploaded").map(c=>c.chunk_index));
  if(m.recovered){card.bar.style.width="100%";card.done.textContent="100%";card.speed.textContent="—";card.eta.textContent="Instant";card.bytes.textContent=fmt(file.size)+" / "+fmt(file.size);card.detail.textContent="Restored from recovery archive · no bytes transferred";card.state.innerHTML='<span class="good">Recovered instantly</span>';toast("Recovered instantly: "+file.name);return}
  let completed=done.size,failed=[],sentBytes=0;
  const todo=Array.from({length:totalChunks},(_,i)=>i).filter(i=>!done.has(i));
  const transferStart=performance.now(),uploadTotal=todo.reduce((sum,i)=>sum+Math.min(CHUNK,file.size-i*CHUNK),0);
  card.bar.style.width=(completed/Math.max(1,totalChunks)*100)+"%";
  card.done.textContent=Math.round(completed/Math.max(1,totalChunks)*100)+"%";
  card.detail.textContent="Preparing upload";
  let cursor=0;
  async function worker(){
   while(cursor<todo.length){
    const i=todo[cursor++];
    try{
     const blob=file.slice(i*CHUNK,Math.min(file.size,(i+1)*CHUNK));
     await api("/v1/files/"+m.id+"/chunks/"+i,{method:"PUT",headers:{"Content-Type":"application/octet-stream"},body:blob});
     completed++;sentBytes+=blob.size;card.bar.style.width=(completed/Math.max(1,totalChunks)*100)+"%";
     const stats=transferStats(sentBytes,uploadTotal,transferStart);
     card.speed.textContent=fmtSpeed(stats.speed);card.eta.textContent=fmtTime(stats.eta);
     card.done.textContent=Math.round(completed/Math.max(1,totalChunks)*100)+"%";
     card.bytes.textContent=fmt(sentBytes)+" / "+fmt(uploadTotal);
     card.detail.textContent="Uploaded "+completed+"/"+totalChunks+" chunks · 3 parallel";
     card.state.textContent="Uploading";
    }catch(e){failed.push(i);card.state.textContent="Chunk "+(i+1)+" failed: "+e.message}
   }
  }
  await Promise.all(Array.from({length:Math.min(3,todo.length)},worker));
  if(failed.length){card.state.innerHTML='<span class="bad">'+failed.length+' chunks need retry. Select the same file again to resume.</span>';card.detail.textContent="Select the same file again to resume";card.eta.textContent="Paused"}
  else{
   card.state.textContent="Verifying upload…";card.detail.textContent="Verifying uploaded chunks";
   const final=await api("/v1/files/"+m.id+"/complete",{method:"POST"}).then(r=>r.json());
   if(final.status!=="complete")throw Error("Server did not confirm upload completion");
   card.state.innerHTML='<span class="good">Complete</span>';card.eta.textContent="Done";card.done.textContent="100%";card.detail.textContent="Upload and integrity checks completed";card.bytes.textContent=fmt(file.size)+" / "+fmt(file.size);toast((m.resumed?"Resumed: ":"Uploaded: ")+file.name)
  }
 }catch(e){card.state.innerHTML='<span class="bad">'+safe(e.message)+'</span>'}
 finally{loadFiles()}
}
async function uploadFiles(files){if(!files.length)return;for(const f of files){const c=uploadCard(f);uploadOne(f,c)}}
async function loadFiles(){if(loading)return;loading=true;$("#files").innerHTML='<div class="empty">Loading files…</div>';try{const p=new URLSearchParams({limit:"25",offset:String(page*25),q:query,status});const d=await api("/v1/files?"+p).then(r=>r.json());$("#count").textContent=d.total+" file"+(d.total===1?"":"s");$("#pageInfo").textContent=d.total?("Page "+(page+1)+" · "+d.total+" total"):"";$("#prev").disabled=page===0;$("#next").disabled=(page+1)*25>=d.total;if(!d.files.length){$("#files").innerHTML='<div class="empty">No files found.</div>';return}$("#files").innerHTML=d.files.map(f=>'<div class="file"><div><div class="filename">'+safe(f.filename)+'</div><div class="meta">'+fmt(f.size_bytes)+' · '+safe(f.created_at||"")+' · '+safe(f.id)+'</div><div class="status">'+safe(f.status)+' · '+f.total_chunks+' chunks</div></div><div class="actions"><button data-download="'+safe(f.id)+'" '+(f.status!=="complete"?"disabled":"")+'>Download</button><button data-delete="'+safe(f.id)+'" class="danger">Delete</button></div></div>').join("");$("#files").querySelectorAll("[data-download]").forEach(b=>b.onclick=()=>downloadFile(b.dataset.download,b));$("#files").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteFile(b.dataset.delete,b))}catch(e){$("#files").innerHTML='<div class="empty bad">'+safe(e.message)+'</div>'}finally{loading=false}}
async function deleteFile(id,button){
 const row=button.closest(".file");
 const filename=row?.querySelector(".filename")?.textContent||id;
 if(!confirm("Delete "+filename+" from the library?\\n\\nThis removes its D1 metadata only. Telegram-stored chunks will remain in Telegram."))return;
 const old=button.textContent;button.disabled=true;button.textContent="Deleting…";
 try{
  await api("/v1/files/"+encodeURIComponent(id),{method:"DELETE"});
  toast("Removed from database. Telegram data was not deleted.");
  await loadFiles();
 }catch(e){toast(e.message);button.disabled=false;button.textContent=old}
}
async function downloadFile(id,button){
 const old=button.textContent;button.disabled=true;button.textContent="Preparing…";let card=null;
 try{
  const m=await api("/v1/files/"+id).then(r=>r.json());
  if(m.status!=="complete")throw Error("File is not complete");
  const totalChunks=m.total_chunks??m.totalChunks;
  if(!Number.isSafeInteger(totalChunks)||totalChunks<0)throw Error("Server returned an invalid chunk count");
  if(!Array.isArray(m.chunks)||m.chunks.length!==totalChunks)throw Error("Server returned incomplete chunk metadata");
  const parts=new Array(totalChunks);let completed=0,cursor=0,receivedBytes=0;
  const downloadStart=performance.now(),downloadTotal=Number(m.size_bytes)||0,downloadSamples=[];
  card=[...$("#uploads").querySelectorAll(".transfer-card")].find(x=>x.dataset.transferKey==="download:"+id);if(!card){card=document.createElement("article");card.className="transfer-card";card.dataset.transferKey="download:"+id;$("#uploads").prepend(card)}card.innerHTML='<div class="transfer-top"><div class="transfer-name">'+safe(m.filename)+'</div><div class="status">Downloading</div></div><div class="progress"><i></i></div><div class="transfer-stats"><div class="stat"><strong data-speed>—</strong><span>Speed</span></div><div class="stat"><strong data-eta>—</strong><span>Time left</span></div><div class="stat"><strong data-done>0%</strong><span>Progress</span></div></div><div class="transfer-detail"><span class="meta" data-detail>Starting download</span><span class="meta" data-bytes>0 B / '+fmt(downloadTotal)+'</span></div>';$("#uploads").prepend(card);
  const dbar=card.querySelector(".progress i"),dspeed=card.querySelector("[data-speed]"),deta=card.querySelector("[data-eta]"),ddone=card.querySelector("[data-done]"),ddetail=card.querySelector("[data-detail]"),dbytes=card.querySelector("[data-bytes]");
  const workers=Array.from({length:Math.min(4,totalChunks)},async()=>{
   while(cursor<totalChunks){
    const i=cursor++;
    const r=await api("/v1/files/"+id+"/chunks/"+i);
    if(!r.body)throw Error("Streaming downloads are not supported by this browser");
    const reader=r.body.getReader(),streamParts=[];let chunkBytes=0;
    while(true){
     const {done,value}=await reader.read();
     if(done)break;
     streamParts.push(value);chunkBytes+=value.byteLength;receivedBytes+=value.byteLength;
     const stats=liveTransferStats(downloadSamples,receivedBytes,downloadTotal,downloadStart);
     dspeed.textContent=fmtSpeed(stats.speed);deta.textContent=fmtTime(stats.eta);
     ddone.textContent=Math.min(100,Math.round(receivedBytes/Math.max(1,downloadTotal)*100))+"%";
     dbar.style.width=ddone.textContent;dbytes.textContent=fmt(receivedBytes)+" / "+fmt(downloadTotal);
     ddetail.textContent="Receiving chunk "+(i+1)+"/"+totalChunks+" · "+fmt(chunkBytes)+" received";
     button.textContent="Downloading "+ddone.textContent;
    }
    // Keep the received fragments as a Blob instead of copying the entire
    // chunk into a second Uint8Array. Only allocate an ArrayBuffer for hashing.
    const chunkBlob=new Blob(streamParts,{type:"application/octet-stream"});
    const hash=await digest(await chunkBlob.arrayBuffer());
    if(hash!==m.chunks[i].sha256||chunkBlob.size!==m.chunks[i].size_bytes)throw Error("Integrity check failed at chunk "+i);
    parts[i]=chunkBlob;completed++;
    ddetail.textContent="Received and verified "+completed+"/"+totalChunks+" chunks";
   }
  });
  await Promise.all(workers);
  const blob=new Blob(parts,{type:"application/octet-stream"});
  if(m.sha256&&await digest(await blob.arrayBuffer())!==m.sha256)throw Error("Whole-file integrity check failed");
  const a=document.createElement("a"),u=URL.createObjectURL(blob);
  a.href=u;a.download=m.filename;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);
  dspeed.textContent=fmtSpeed(receivedBytes/Math.max(.25,(performance.now()-downloadStart)/1000));deta.textContent="Done";ddone.textContent="100%";dbar.style.width="100%";ddetail.textContent="Integrity verified · download ready";
  toast("Download ready");
 }catch(e){toast(e.message);if(card){const detail=card.querySelector("[data-detail]"),state=card.querySelector(".status");if(detail)detail.textContent="Download failed: "+e.message;if(state)state.innerHTML='<span class="bad">Failed</span>'}}
 finally{button.disabled=false;button.textContent=old}
}
$("#refresh").onclick=()=>loadFiles();$("#prev").onclick=()=>{page=Math.max(0,page-1);loadFiles()};$("#next").onclick=()=>{page++;loadFiles()};$("#search").oninput=()=>{query=$("#search").value.trim();page=0;clearTimeout(timer);timer=setTimeout(loadFiles,250)};$("#status").onchange=()=>{status=$("#status").value;page=0;loadFiles()};
(async()=>{try{await api("/auth/me");showApp()}catch{showLogin()}})();
</script></body></html>`;
