import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";
import { auth, db, storage } from "./firebase-config.js";

const CATS={pothole:"Pothole or damaged road",garbage:"Garbage or waste",streetlight:"Broken streetlight",water:"Water supply or leak",drainage:"Drainage or flooding",other:"Something else"};
const STAT=["submitted","acknowledged","in_progress","resolved"];
const LABEL={submitted:"Submitted",acknowledged:"Acknowledged",in_progress:"In progress",resolved:"Resolved"};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=s=>document.querySelector(s);
const main=$("#main");
let token=0;
let currentUser = null;

function mapReportDoc(docSnap) {
  const d = docSnap.data();
  let createdIso = new Date().toISOString();
  if (d.createdAt && typeof d.createdAt.toDate === "function") {
    createdIso = d.createdAt.toDate().toISOString();
  } else if (typeof d.createdAt === "string") {
    createdIso = d.createdAt;
  }
  return {
    id: docSnap.id,
    ...d,
    createdAt: createdIso,
  };
}

/* ---- Firebase Data Layer ---- */
const api = {
  async list() {
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(mapReportDoc);
  },

  async mine() {
    if (!currentUser) throw Object.assign(new Error("Authentication required"), { code: "unauthenticated" });
    const q = query(
      collection(db, "reports"),
      where("userId", "==", currentUser.uid)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(mapReportDoc)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create({ title, category, description, locationAddress, latitude, longitude, photoFile }) {
    if (!currentUser) throw Object.assign(new Error("Please log in to submit a report."), { code: "unauthenticated" });

    let imageUrl = null;
    if (photoFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(photoFile.type)) {
        throw new Error("Only JPG, JPEG, PNG, and WebP images are allowed.");
      }
      if (photoFile.size > MAX_IMAGE_SIZE) {
        throw new Error("Image file size must be 5 MB or less.");
      }
      const extMap = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp" };
      const ext = extMap[photoFile.type] || "jpg";
      const storageRef = ref(storage, `reports/${currentUser.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`);
      const snapshot = await uploadBytes(storageRef, photoFile, { contentType: photoFile.type });
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const docRef = await addDoc(collection(db, "reports"), {
      title,
      category,
      description: description || "",
      locationAddress: locationAddress || "Pinned by GPS",
      latitude: typeof latitude === "number" ? latitude : null,
      longitude: typeof longitude === "number" ? longitude : null,
      imageUrl,
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email || "Citizen",
      status: "submitted",
      statusHistory: [
        {
          status: "submitted",
          changedBy: currentUser.uid,
          note: "Report submitted",
          changedAt: new Date().toISOString(),
        },
      ],
      isDemo: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: docRef.id };
  },
};

/* ---- Animation helpers ---- */
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function confetti(x, y, count) {
  if (prefersReduced) return;
  const colors = ["#ffc933", "#5cc6cb", "#0e6b6f", "#ff918a", "#8ab4ff"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.setProperty("--drift-x", (Math.random() - 0.5) * 200 + "px");
    el.style.setProperty("--drift-y", Math.random() * 250 + 80 + "px");
    el.style.setProperty("--spin", Math.random() * 600 + 200 + "deg");
    el.style.setProperty("--fall-duration", Math.random() * 0.8 + 1 + "s");
    el.style.width = Math.random() * 6 + 4 + "px";
    el.style.height = Math.random() * 6 + 4 + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

function ripple(e) {
  if (prefersReduced) return;
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  btn.style.setProperty("--ripple-x", x + "%");
  btn.style.setProperty("--ripple-y", y + "%");
}

/* Attach ripple to all buttons via delegation */
document.addEventListener("mousedown", function(e) {
  const btn = e.target.closest(".btn");
  if (btn) ripple(e);
}, { passive: true });

function hero(){return `<section class="hero" aria-labelledby="h">
<h1 id="h"><span>Spot it.</span><span>Report it.</span><span>Watch it get fixed.</span></h1>
<p>Report potholes, garbage, broken lights and leaks in under a minute, then follow each report until it's resolved.</p>
<div class="cta"><a class="btn btn-primary" href="#report">Report an issue</a><a class="btn" href="#feed">Browse city reports</a></div>
<svg class="sky" viewBox="0 0 800 176" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<rect class="cloud" x="60" y="20" width="110" height="18" rx="9"/><rect class="cloud" x="90" y="10" width="60" height="18" rx="9" style="animation-delay:-12s"/>
<g fill="#0a2430"><rect x="20" y="70" width="70" height="106"/><rect x="100" y="40" width="60" height="136"/><rect x="170" y="86" width="80" height="90"/><rect x="262" y="52" width="64" height="124"/><rect x="560" y="64" width="72" height="112"/><rect x="644" y="34" width="62" height="142"/><rect x="716" y="80" width="70" height="96"/></g>
<g>
<rect class="win" x="34" y="84" width="9" height="11"/><rect class="win" x="54" y="108" width="9" height="11"/><rect class="win" x="34" y="132" width="9" height="11"/>
<rect class="win" x="114" y="56" width="9" height="11"/><rect class="win" x="134" y="84" width="9" height="11"/><rect class="win" x="114" y="112" width="9" height="11"/><rect class="win" x="134" y="140" width="9" height="11"/>
<rect class="win" x="186" y="100" width="9" height="11"/><rect class="win" x="216" y="124" width="9" height="11"/>
<rect class="win" x="278" y="66" width="9" height="11"/><rect class="win" x="298" y="94" width="9" height="11"/><rect class="win" x="278" y="122" width="9" height="11"/>
<rect class="win" x="576" y="80" width="9" height="11"/><rect class="win" x="602" y="110" width="9" height="11"/>
<rect class="win" x="660" y="50" width="9" height="11"/><rect class="win" x="682" y="78" width="9" height="11"/><rect class="win" x="660" y="106" width="9" height="11"/><rect class="win" x="682" y="134" width="9" height="11"/>
<rect class="win" x="732" y="96" width="9" height="11"/><rect class="win" x="754" y="124" width="9" height="11"/>
</g>
<g><circle class="lamp-glow" cx="420" cy="84" r="46"/><rect x="417" y="84" width="6" height="92" fill="#06161d"/><rect x="408" y="80" width="26" height="6" rx="3" fill="#06161d"/></g>
<g class="car"><rect x="0" y="152" width="46" height="13" rx="5" fill="#ffc933"/><rect x="10" y="144" width="24" height="10" rx="4" fill="#ffc933"/><circle cx="11" cy="166" r="5" fill="#06161d"/><circle cx="35" cy="166" r="5" fill="#06161d"/></g>
<rect x="0" y="170" width="800" height="6" fill="#06161d"/>
<path d="M0 173h800" stroke="#ffc933" stroke-width="2" stroke-dasharray="14 12"/>
</svg></section>`}

function skeleton(){return `<div role="status" aria-live="polite"><span class="hint">Loading reports…</span><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>`}
function card(i,n){
 const step=STAT.indexOf(i.status);
 const loc = i.locationAddress || i.loc || "";
 const dateVal = i.createdAt || i.at;
 return `<li class="card" style="--i:${n}"><div class="head"><h3>${esc(i.title)}</h3><span class="badge ${i.status}">${LABEL[i.status]}</span></div>
 <p class="meta">${esc(CATS[i.category]||i.category)}. ${esc(loc)}. ${new Date(dateVal).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
 ${i.description?`<p>${esc(i.description)}</p>`:""}
 ${i.imageUrl?`<img class="preview" src="${esc(i.imageUrl)}" alt="Photo for ${esc(i.title)}" loading="lazy">`:""}
 <ol class="steps" aria-label="Progress: ${LABEL[i.status]}">${STAT.map((s,k)=>`<li style="--k:${k}" data-on="${k<=step?1:0}">${LABEL[s]}</li>`).join("")}</ol>
 ${i.isDemo||i.demo?`<p class="demo">Demo data</p>`:""}</li>`}

async function listView(kind){
 const my=++token, isFeed=kind==="feed";
 main.innerHTML=`<section class="page"><h2>${isFeed?"City feed":"My reports"}</h2><p class="lede">${isFeed?"Recent reports from around the city.":"Issues you've reported from your account."}</p><div id="body">${skeleton()}</div></section>`;
 const body=$("#body");
 const run=async()=>{
  body.innerHTML=skeleton();
  let items;
  try{items=await (isFeed?api.list():api.mine())}catch(e){
   if(my!==token)return;
   if(e.code==="unauthenticated"){gateView("mine");return}
   body.innerHTML=`<div class="state bad" role="alert"><p><strong>We couldn't load reports.</strong> ${esc(e.message || "Check your connection and try again.")}</p><button class="btn" id="retry">Try again</button></div>`;
   $("#retry").onclick=run;return}
  if(my!==token)return;
  if(!items.length){body.innerHTML=`<div class="state"><p><strong>${isFeed?"No reports yet. Be the first.":"You haven't reported anything yet."}</strong></p><a class="btn btn-primary" href="#report">Report an issue</a></div>`;return}
  let f="all";
  const draw=()=>{
   const shown=items.filter(i=>f==="all"||(f==="open"?i.status!=="resolved":i.status==="resolved"));
   body.innerHTML=`<div class="chips" role="group" aria-label="Filter reports">${[["all","All"],["open","Open"],["done","Resolved"]].map(([v,l])=>`<button class="chip" data-f="${v}" aria-pressed="${f===v}">${l}</button>`).join("")}</div>
   ${shown.length?`<ul class="list">${shown.map(card).join("")}</ul>`:`<div class="state"><p>No ${f==="done"?"resolved":"open"} reports to show.</p></div>`}`;
   body.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{f=b.dataset.f;draw();body.querySelector(`[data-f="${f}"]`).focus()});
   requestAnimationFrame(()=>requestAnimationFrame(()=>body.querySelectorAll(".steps li[data-on='1']").forEach(l=>l.classList.add("on"))));
  };
  draw();
 };
 run();
}

function reportView(){
 ++token;
 main.innerHTML=`<section class="page" aria-labelledby="rt"><h2 id="rt">Report an issue</h2><p class="lede">The more precise the location, the faster someone can find it.</p>
 <form id="f" novalidate>
 <label for="title">What's the problem?</label><input id="title" autocomplete="off"><p class="err" id="e-title" hidden></p>
 <label for="cat">Type</label><select id="cat">${Object.entries(CATS).map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select>
 <label for="desc">Details <span class="opt">(optional)</span></label><textarea id="desc" rows="4"></textarea>
 <label for="loc">Where is it?</label><input id="loc" placeholder="Street, landmark, ward" autocomplete="off"><p class="err" id="e-loc" hidden></p>
 <div><button type="button" class="btn" id="gps">Use my location</button> <span class="hint" id="geo" role="status"></span></div>
 <label>Photo <span class="opt">(optional)</span></label>
 <div class="upload-zone" id="drop-zone">
   <svg class="upload-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
     <polyline points="17 8 12 3 7 8"/>
     <line x1="12" y1="3" x2="12" y2="15"/>
   </svg>
   <p class="upload-zone-text"><strong>Drop a photo here</strong> or click to browse</p>
   <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="pn">
 </div>
 <img id="pv" class="preview" alt="Preview of the photo you chose" hidden>
 <p class="hint" id="pn">Avoid capturing faces and vehicle number plates. Retake or crop if they appear. Max 5 MB (JPG, PNG, WebP).</p>
 <p class="err" id="e-sub" role="alert" hidden></p>
 <button class="btn btn-primary" id="go" type="submit">Send report</button></form></section>`;

 /* Drag-and-drop enhancement */
 const dropZone = $("#drop-zone");
 const photoInput = $("#photo");

 ["dragenter", "dragover"].forEach(evt => {
   dropZone.addEventListener(evt, function(e) {
     e.preventDefault();
     e.stopPropagation();
     dropZone.classList.add("drag-over");
   }, { passive: false });
 });
 ["dragleave", "drop"].forEach(evt => {
   dropZone.addEventListener(evt, function(e) {
     e.preventDefault();
     e.stopPropagation();
     dropZone.classList.remove("drag-over");
   }, { passive: false });
 });
 dropZone.addEventListener("drop", function(e) {
   const files = e.dataTransfer.files;
   if (files.length && files[0].type.startsWith("image/")) {
     photoInput.files = files;
     photoInput.dispatchEvent(new Event("change", { bubbles: true }));
   }
 });

 let coords=null;
 $("#gps").onclick=()=>{const g=$("#geo");
  if(!navigator.geolocation){g.textContent="Your browser can't share location. Type the address instead.";return}
  g.textContent="Finding you…";
  navigator.geolocation.getCurrentPosition(p=>{coords=[p.coords.latitude,p.coords.longitude];g.textContent="Location added. You can still describe the spot."},()=>{g.textContent="We couldn't get your location. Allow access or type the address."},{timeout:10000})};

 $("#photo").onchange=e=>{const f=e.target.files[0],pv=$("#pv");if(!f){pv.hidden=true;return}pv.src=URL.createObjectURL(f);pv.hidden=false};
 const mark=(id,eid,msg)=>{const el=$("#"+id),er=$("#"+eid);if(msg){el.setAttribute("aria-invalid","true");el.setAttribute("aria-describedby",eid);er.textContent=msg;er.hidden=false}else{el.removeAttribute("aria-invalid");er.hidden=true}};

 $("#f").onsubmit=async e=>{e.preventDefault();
  const t=$("#title").value.trim(),l=$("#loc").value.trim();
  const bad1=t.length<5?"Add a short title, at least 5 characters.":"",bad2=(!l&&!coords)?"Tell us where this is, or use your location.":"";
  mark("title","e-title",bad1);mark("loc","e-loc",bad2);
  if(bad1||bad2){$(bad1?"#title":"#loc").focus();return}
  const b=$("#go");b.disabled=true;b.innerHTML='<span class="spin"></span> Sending…';$("#e-sub").hidden=true;

  const form = $("#f");
  form.classList.add("submit-loading");

  try{
   await api.create({
    title: t,
    category: $("#cat").value,
    description: $("#desc").value.trim(),
    locationAddress: l || "Pinned by GPS",
    latitude: coords ? coords[0] : null,
    longitude: coords ? coords[1] : null,
    photoFile: $("#photo").files[0] || null,
   });
   main.innerHTML=`<section class="success" role="status"><svg class="check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28"/><path d="M20 33l8 8 17-18"/></svg><h2>Report received</h2><p class="lede">Follow its progress under My reports.</p><a class="btn btn-primary" href="#mine">See my reports</a> <a class="btn" href="#report" id="again">Report another</a></section>`;

   const rect = main.querySelector(".success").getBoundingClientRect();
   confetti(rect.left + rect.width / 2, rect.top + 60, 30);

   $("#again").onclick=ev=>{ev.preventDefault();reportView()};
  }catch(err){
   form.classList.remove("submit-loading");
   if (err.code === "unauthenticated") { gateView("report"); return; }
   b.disabled=false;b.textContent="Send report";
   const s=$("#e-sub");
   s.textContent=err.message || "We couldn't send your report. Your details are still here. Try again.";
   s.hidden=false;
  }
 };
}

function gateView(r){++token;main.innerHTML=`<section class="state"><h2>Log in to ${r==="report"?"report an issue":"see your reports"}</h2><p class="lede">It takes a few seconds, and it lets you follow your reports.</p><a class="btn btn-primary" href="auth.html?next=index.html%23${r}">Log in or register</a></section>`}
function authSlot(){
 const u=currentUser,el=$("#auth");
 const firstName = u ? (u.displayName || u.email || "User").split(" ")[0] : "";
 el.innerHTML=u?`<span class="who">Hi, ${esc(firstName)}</span><button class="btn lo" id="out">Log out</button>`:`<a class="btn lo" href="auth.html?next=index.html%23home">Log in</a>`;
 if(u)$("#out").onclick=async()=>{await signOut(auth);location.hash="#home";route()};
}

function route(){
 authSlot();
 const r=(location.hash||"#home").slice(1);
 document.querySelectorAll("nav a").forEach(a=>a.dataset.r===r?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current"));
 if((r==="report"||r==="mine")&&!currentUser)gateView(r);else if(r==="report")reportView();else if(r==="mine")listView("mine");else if(r==="feed")listView("feed");else{++token;main.innerHTML=hero()}
 window.scrollTo(0,0);
}

let initialized = false;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!initialized) {
    initialized = true;
    route();
  } else {
    authSlot();
    const r = (location.hash || "#home").slice(1);
    if ((r === "report" || r === "mine") && !currentUser) {
      route();
    }
  }
});

addEventListener("hashchange",()=>{if(initialized){route();main.focus({preventScroll:true})}});
