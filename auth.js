import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const $ = s => document.querySelector(s);
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Confetti helper for auth success */
function authConfetti(x, y, count) {
  if (prefersReduced) return;
  const colors = ["#ffc933", "#5cc6cb", "#0e6b6f", "#ff918a", "#8ab4ff"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.setProperty("--drift-x", (Math.random() - 0.5) * 180 + "px");
    el.style.setProperty("--drift-y", Math.random() * 220 + 60 + "px");
    el.style.setProperty("--spin", Math.random() * 600 + 200 + "deg");
    el.style.setProperty("--fall-duration", Math.random() * 0.8 + 1 + "s");
    el.style.width = Math.random() * 6 + 4 + "px";
    el.style.height = Math.random() * 6 + 4 + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

const ADMIN_EMAIL = "prajwal@gmail.com";

function isAdminEmail(email) {
  return typeof email === "string" && email.trim().toLowerCase() === ADMIN_EMAIL;
}

function dest(email) {
  if (isAdminEmail(email)) return "admin.html";
  const n = new URLSearchParams(location.search).get("next") || "";
  return /^[\w-]+\.html(#\w+)?$/.test(n) ? n : "index.html#feed";
}

const mark = (id, msg) => {
  const el = $("#" + id), er = $("#e-" + id);
  if (msg) { el.setAttribute("aria-invalid", "true"); el.setAttribute("aria-describedby", "e-" + id); er.textContent = msg; er.hidden = false; }
  else { el.removeAttribute("aria-invalid"); er.hidden = true; }
};
const formErr = (id, msg) => { const e = $("#" + id); e.textContent = msg; e.hidden = !msg; };
const busy = (form, on, label) => {
  const b = form.querySelector(".btn-primary");
  b.disabled = on;
  b.innerHTML = on ? '<span class="spin"></span> Please wait…' : label;
};
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function friendlyAuthError(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Log in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 8 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";
    default:
      return err?.message || "Something went wrong. Try again.";
  }
}

/* tabs */
function setTab(mode) {
  const reg = mode === "register";
  $("#t-login").setAttribute("aria-selected", String(!reg));
  $("#t-register").setAttribute("aria-selected", String(reg));
  $("#t-login").tabIndex = reg ? -1 : 0;
  $("#t-register").tabIndex = reg ? 0 : -1;
  $("#f-login").hidden = reg;
  $("#f-register").hidden = !reg;
}
$("#t-login").onclick = () => setTab("login");
$("#t-register").onclick = () => setTab("register");
document.querySelector(".tabs").addEventListener("keydown", e => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    const reg = $("#t-login").getAttribute("aria-selected") === "true";
    setTab(reg ? "register" : "login");
    $(reg ? "#t-register" : "#t-login").focus();
  }
});
if (location.hash === "#register") setTab("register");

/* show / hide password */
document.querySelectorAll(".show").forEach(b => b.onclick = () => {
  const inp = $("#" + b.dataset.for), show = inp.type === "password";
  inp.type = show ? "text" : "password";
  b.textContent = show ? "Hide" : "Show";
  b.setAttribute("aria-pressed", String(show));
});

/* password strength meter */
$("#r-pw").addEventListener("input", e => {
  const v = e.target.value;
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
  const m = $("#meter");
  m.style.width = (v ? Math.max(s, 1) * 25 : 0) + "%";
  m.style.background = s <= 1 ? "var(--err)" : s < 4 ? "var(--signal)" : "var(--teal)";
});

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let justSignedIn = false;

function done(displayName, email) {
  justSignedIn = true;
  const firstName = (displayName || "there").split(" ")[0];
  const target = dest(email);
  $("#forms").hidden = true;
  const s = $("#signed");
  s.hidden = false;
  s.className = "signed";
  s.setAttribute("role", "status");
  s.innerHTML = '<svg class="check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28"/><path d="M20 33l8 8 17-18"/></svg><h1>You’re in, ' + esc(firstName) + '</h1><p class="lede">' + (isAdminEmail(email) ? 'Taking you to Admin Panel…' : 'Taking you to CityFix…') + '</p>';
  const rect = s.getBoundingClientRect();
  authConfetti(rect.left + rect.width / 2, rect.top + 40, 24);
  setTimeout(() => { location.href = target; }, 1100);
}

/* register */
$("#f-register").onsubmit = async e => {
  e.preventDefault();
  const name = $("#r-name").value.trim(), email = $("#r-email").value.trim().toLowerCase(), pw = $("#r-pw").value;
  const e1 = name.length < 2 ? "Enter your name." : "";
  const e2 = !emailOk(email) ? "Enter a valid email address." : "";
  const e3 = pw.length < 8 ? "Use at least 8 characters." : "";
  mark("r-name", e1); mark("r-email", e2); mark("r-pw", e3); formErr("e-r", "");
  if (e1 || e2 || e3) { $(e1 ? "#r-name" : e2 ? "#r-email" : "#r-pw").focus(); return; }
  busy(e.target, true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pw);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      role: "citizen",
      createdAt: serverTimestamp(),
    });
    done(name, email);
  } catch (err) {
    formErr("e-r", friendlyAuthError(err));
    busy(e.target, false, "Create account");
  }
};

/* login */
$("#f-login").onsubmit = async e => {
  e.preventDefault();
  const email = $("#l-email").value.trim().toLowerCase(), pw = $("#l-pw").value;
  const e1 = !emailOk(email) ? "Enter a valid email address." : "";
  const e2 = !pw ? "Enter your password." : "";
  mark("l-email", e1); mark("l-pw", e2); formErr("e-l", "");
  if (e1 || e2) { $(e1 ? "#l-email" : "#l-pw").focus(); return; }
  busy(e.target, true);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pw);
    done(cred.user.displayName || cred.user.email, cred.user.email || email);
  } catch (err) {
    formErr("e-l", friendlyAuthError(err));
    busy(e.target, false, "Log in");
  }
};

/* already logged in */
onAuthStateChanged(auth, cur => {
  if (cur && !justSignedIn) {
    const firstName = (cur.displayName || cur.email || "there").split(" ")[0];
    $("#forms").hidden = true;
    const s = $("#signed");
    s.hidden = false;
    s.className = "signed";
    s.innerHTML = '<h1>Hi, ' + esc(firstName) + '</h1><p class="lede">You’re already logged in.</p><a class="btn btn-primary" href="' + dest(cur.email) + '">Continue</a><button class="btn" id="lo">Log out</button>';
    $("#lo").onclick = async () => {
      await signOut(auth);
      location.reload();
    };
  }
});
