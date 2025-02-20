import { loadNavbar } from "../../components/js/navbar.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { auth, db } from "../../js/firebase/firebase-init.js";
import {
  collection,
  query,
  getDocs,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { initAddHanja } from "../../components/js/add-hanja-modal.js";
import {
  initLearnHanja,
  showLearnHanjaModal,
} from "../../components/js/learn-hanja-modal.js";
import {
  initializeWordListPage,
  loadModals
} from "../../utils/word-list-utils.js";

let currentUser = null;
let allWords = [];
let filteredWords = [];
let displayCount = 12;

window.showLearnHanjaModal = showLearnHanjaModal;

document.addEventListener("DOMContentLoaded", async () => {
  loadNavbar();
  await loadModals([
    "../components/add-hanja-modal.html",
    "../components/learn-hanja-modal.html"
  ]);
  await initAddHanja();
  await initLearnHanja();

  const elements = {
    addWordBtn: document.getElementById("add-word"),
    searchInput: document.getElementById("search-input"),
    filterType: document.getElementById("filter-type"),
    loadMoreBtn: document.getElementById("load-more"),
  };

  if (elements.addWordBtn) {
    elements.addWordBtn.addEventListener("click", () => {
      const modal = document.getElementById("hanja-modal");
      if (modal) modal.classList.remove("hidden");
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await initializeWordListPage({
        currentUser,
        db,
        type: 'wordlist',
        onAddWordClick: () => {
          const modal = document.getElementById("hanja-modal");
          if (modal) modal.classList.remove("hidden");
        },
        elements
      });
    } else {
      alert("로그인이 필요합니다.");
      window.location.href = "../login.html";
    }
  });
});