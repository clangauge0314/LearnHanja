import { loadNavbar } from "../../components/js/navbar.js";
import { auth, db } from "../../js/firebase/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
  initLearnHanja,
  showLearnHanjaModal,
} from "../../components/js/learn-hanja-modal.js";
import {
  initializeWordListPage,
  loadModals
} from "../../utils/word-list-utils.js";
import { handleAIRecommendation } from "../../utils/ai-utils.js";

let currentUser = null;
window.showLearnHanjaModal = showLearnHanjaModal;

document.addEventListener("DOMContentLoaded", async () => {
  loadNavbar();
  await loadModals(["../components/learn-hanja-modal.html"]);
  await initLearnHanja();

  const elements = {
    addWordBtn: document.getElementById("ai-add-word"),
    searchInput: document.getElementById("search-input"),
    filterType: document.getElementById("filter-type"),
    loadMoreBtn: document.getElementById("load-more"),
  };

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await initializeWordListPage({
        currentUser,
        db,
        type: 'ai',
        onAddWordClick: () => handleAIRecommendation(currentUser, db),
        elements
      });
    } else {
      alert("로그인이 필요합니다.");
      window.location.href = "../login.html";
    }
  });
});
