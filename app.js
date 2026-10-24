// Public website module. Firebase configuration is intentionally kept in firebase-config.js.
document.getElementById('year').textContent = new Date().getFullYear();
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');
menuToggle?.addEventListener('click', () => nav.classList.toggle('open'));
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// Load editable public content from Firestore when Firebase is configured.
// Without configuration, the polished default content remains visible.
import { firebaseReady, db } from './firebase-config.js';
if (firebaseReady && db) {
  try {
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const snap = await getDoc(doc(db, 'siteContent', 'public'));
    if (snap.exists()) {
      const data = snap.data();
      if (data.contactEmail) {
        const link = document.getElementById('emailLink');
        link.href = 'mailto:' + data.contactEmail;
      }
      if (data.founderName) {
        document.querySelector('.founder strong').textContent = data.founderName;
      }
    }
  } catch (err) {
    console.warn('Public Firestore content unavailable; showing default website content.', err);
  }
}
