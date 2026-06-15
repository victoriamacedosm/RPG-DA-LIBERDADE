import { initializeApp }                           from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot }   from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBe46ySfzg-Gt-bdsfF1UMkR3ukBD06f34",
  authDomain:        "mapa-da-liberdade-7a894.firebaseapp.com",
  projectId:         "mapa-da-liberdade-7a894",
  storageBucket:     "mapa-da-liberdade-7a894.firebasestorage.app",
  messagingSenderId: "262549761217",
  appId:             "1:262549761217:web:c553258e7a4e00f8f1b840"
};

const db = getFirestore(initializeApp(firebaseConfig));

window.firebaseDb          = db;
window.firebaseDoc         = doc;
window.firebaseSetDoc      = setDoc;
window.firebaseOnSnapshot  = onSnapshot;
window.firebaseReady       = true;
window.dispatchEvent(new Event('firebase-ready'));
