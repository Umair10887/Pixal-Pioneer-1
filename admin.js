import { app, db, firebaseReady } from "./firebase-config.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.5/";

// IDs must match admin.html
const $ = (id) => document.getElementById(id);
const loginPanel = $("loginPanel");
const dashboard = $("dashboard");
const loginBtn = $("loginBtn");
const saveBtn = $("saveBtn");
const logoutBtn = $("logoutBtn");
const loginStatus = $("loginStatus");
const saveStatus = $("saveStatus");
const emailInput = $("email");
const passwordInput = $("password");
const founderNameInput = $("founderName");
const contactEmailInput = $("contactEmail");
const announcementInput = $("announcement");

let authMod, fsMod, auth;

function say(el, msg, isError = false) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? "#d93025" : "#1a7f37";
}

function showDashboard(show) {
  loginPanel.classList.toggle("hidden", show);
  dashboard.classList.toggle("hidden", !show);
}

function busy(b) {
  loginBtn.disabled = b;
  loginBtn.textContent = b ? "Please wait..." : "Sign in securely";
}

function friendlyError(e) {
  const map = {
    "auth/invalid-credential": "Email ya password galat hai.",
    "auth/invalid-email": "Email format sahi nahi hai.",
    "auth/user-not-found": "Is email ka user nahi mila.",
    "auth/wrong-password": "Password galat hai.",
    "auth/too-many-requests": "Bohat zyada koshishein. Thori der baad try karo.",
    "auth/network-request-failed": "Internet / network masla. Dobara try karo.",
    "auth/unauthorized-domain": "Ye domain Firebase → Authentication → Settings → Authorized domains mein add karo.",
    "permission-denied": "Firestore rules ne access deny kiya. firestore.rules publish karo aur admins/UID document check karo.",
    "unavailable": "Firestore se connection nahi ho saka. Internet check karke dobara try karo."
  };
  const code = e?.code?.replace("firestore/", "") || "";
  return (map[e?.code] || map[code] || e?.message || "Unknown error") + (e?.code ? ` (${e.code})` : "");
}

// Load Firebase Auth + Firestore modules once, with retries (fixes random connection failures)
async function loadModules(retries = 3) {
  if (authMod && fsMod) return;
  if (!firebaseReady) throw new Error("Firebase config incomplete hai.");
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      [authMod, fsMod] = await Promise.all([
        import(`${FB}firebase-auth.js`),
        import(`${FB}firebase-firestore.js`)
      ]);
      auth = authMod.getAuth(app);
      return;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw new Error("Firebase load nahi hua. Internet check karo. " + (lastErr?.message || ""));
}

// getDoc with retry for temporary "offline/unavailable" errors
async function getDocRetry(ref, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fsMod.getDoc(ref);
    } catch (e) {
      lastErr = e;
      if (e.code === "permission-denied") throw e;
      await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw lastErr;
}

async function checkAdmin(user) {
  const snap = await getDocRetry(fsMod.doc(db, "admins", user.uid));
  if (!snap.exists()) {
    throw new Error(`Admin document nahi mila. Project: ${app.options.projectId} | Path: admins/${user.uid} | Email: ${user.email}`);
  }
  if (snap.data().active !== true) {
    throw new Error("Admin document mila, lekin 'active' field boolean true nahi hai.");
  }
}

async function loadSettings() {
  try {
    const snap = await getDocRetry(fsMod.doc(db, "siteContent", "public"));
    if (snap.exists()) {
      const d = snap.data();
      founderNameInput.value = d.founderName || founderNameInput.value;
      contactEmailInput.value = d.contactEmail || "";
      announcementInput.value = d.announcement || "";
    } else {
      say(saveStatus, "siteContent/public abhi bana nahi. Save dabao to ban jayega.");
    }
  } catch (e) {
    say(saveStatus, "Content load nahi hua: " + friendlyError(e), true);
  }
}

async function enterAdmin(user) {
  await checkAdmin(user);
  showDashboard(true);
  say(saveStatus, "Admin login successful.");
  await loadSettings();
}

async function handleLogin() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) {
    say(loginStatus, "Email aur password dono enter karo.", true);
    return;
  }
  busy(true);
  say(loginStatus, "Connecting to Firebase...");
  try {
    await loadModules();
    const cred = await authMod.signInWithEmailAndPassword(auth, email, password);
    try {
      await enterAdmin(cred.user);
    } catch (e) {
      // not an admin (or check failed) -> sign out and show reason
      await authMod.signOut(auth);
      showDashboard(false);
      throw e;
    }
  } catch (e) {
    console.error("Admin login error:", e);
    say(loginStatus, friendlyError(e), true);
  } finally {
    busy(false);
  }
}

async function handleSave() {
  saveBtn.disabled = true;
  try {
    if (!auth?.currentUser) throw new Error("Pehle login karo.");
    await checkAdmin(auth.currentUser);
    await fsMod.setDoc(
      fsMod.doc(db, "siteContent", "public"),
      {
        founderName: founderNameInput.value.trim(),
        contactEmail: contactEmailInput.value.trim(),
        announcement: announcementInput.value.trim()
      },
      { merge: true }
    );
    say(saveStatus, "Settings save ho gayi!");
  } catch (e) {
    console.error("Save error:", e);
    say(saveStatus, friendlyError(e), true);
  } finally {
    saveBtn.disabled = false;
  }
}

async function handleLogout() {
  try { await authMod?.signOut(auth); } catch (e) { console.error(e); }
  showDashboard(false);
  passwordInput.value = "";
  say(loginStatus, "Signed out.");
}

loginBtn.addEventListener("click", handleLogin);
saveBtn.addEventListener("click", handleSave);
logoutBtn.addEventListener("click", handleLogout);
[emailInput, passwordInput].forEach((el) =>
  el.addEventListener("keydown", (e) => { if (e.key === "Enter") handleLogin(); })
);

// Preload Firebase on page open and restore an existing session after refresh
(async () => {
  try {
    await loadModules();
    say(loginStatus, "Firebase connected. Sign in karein.");
    authMod.onAuthStateChanged(auth, async (user) => {
      if (!user || dashboard.classList.contains("hidden") === false) return;
      try {
        await enterAdmin(user);
      } catch (e) {
        await authMod.signOut(auth);
        showDashboard(false);
        say(loginStatus, friendlyError(e), true);
      }
    });
  } catch (e) {
    say(loginStatus, friendlyError(e), true);
  }
})();