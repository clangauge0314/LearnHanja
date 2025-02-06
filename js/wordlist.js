import { loadNavbar } from "./components/navbar.js";
import { auth, db } from "./firebase/firebase-init.js";
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { initAddHanja } from "./components/addhanja.js";
import {
  initLearnHanja,
  showLearnHanjaModal,
} from "./components/learnhanja.js";

let currentUser = null;
let allWords = [];
let filteredWords = [];
let displayCount = 12;

window.showLearnHanjaModal = showLearnHanjaModal;

document.addEventListener("DOMContentLoaded", async () => {
  loadNavbar();
  await loadModal();
  await initAddHanja();
  await initLearnHanja();

  const addWordBtn = document.getElementById("add-word");
  const searchInput = document.getElementById("search-input");
  const filterType = document.getElementById("filter-type");
  const loadMoreBtn = document.getElementById("load-more");

  if (addWordBtn) {
    addWordBtn.addEventListener("click", () => {
      const modal = document.getElementById("hanja-modal");
      if (modal) {
        modal.classList.remove("hidden");
      }
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await fetchWords();
      await updateWordListUsageUI();
    } else {
      alert("로그인이 필요합니다.");
      window.location.href = "./login.html";
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      displayCount = 12;
      filterAndDisplayWords();
    });
  }

  if (filterType) {
    filterType.addEventListener("change", () => {
      displayCount = 12;
      filterAndDisplayWords();
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      displayCount += 12;
      displayWords();
    });
  }
});

async function loadModal() {
  const [addHanjaResponse, learnHanjaResponse] = await Promise.all([
    fetch("components/addhanja.html"),
    fetch("components/learnhanja.html"),
  ]);

  const [addHanjaHtml, learnHanjaHtml] = await Promise.all([
    addHanjaResponse.text(),
    learnHanjaResponse.text(),
  ]);

  document.getElementById("modal-container").innerHTML =
    addHanjaHtml + learnHanjaHtml;
}

async function fetchWords() {
  try {
    if (!currentUser) return;

    const wordlistRef = collection(
      db,
      "wordlist",
      currentUser.email,
      "wordlist"
    );
    const q = query(wordlistRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    allWords = [];
    querySnapshot.forEach((doc) => {
      allWords.push(doc.data());
    });

    document.getElementById("word-count").textContent = allWords.length;
    filterAndDisplayWords();
  } catch (error) {
    console.error("단어를 가져오는데 실패했습니다.", error);
  }
}

function createWordCard(word) {
  return `
        <div 
          class="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-300 border border-gray-200 cursor-pointer" 
          onclick="window.showLearnHanjaModal(${JSON.stringify(word).replace(
            /"/g,
            "&quot;"
          )})"
        >
          <h1 class="!text-8xl md:text-9xl font-extrabold text-center mb-4 text-black">
            ${word.hanja}
          </h1>
          <div class="space-y-3">
            
            <p class="flex items-center text-gray-700 text-xl">
              <i class="fas fa-book-open text-green-500 mr-2"></i> 
              <span class="font-semibold">${word.meaning}</span> 
            </p>
    
            <p class="flex items-center text-gray-700 text-xl">
              <i class="fas fa-pencil-alt text-blue-500 mr-2"></i> 
              <span class="font-semibold">${word.stroke} 획</span> 
            </p>
  
            <p class="flex items-start text-gray-700 text-xl">
              <i class="fas fa-comment-dots text-purple-500 mr-2 mt-1"></i> 
              <span class="font-semibold">${word.description.slice(
                0,
                10
              )}</span> 
            </p>
  
            <p class="text-gray-500 text-sm flex items-center">
              <i class="fas fa-calendar-alt mr-2"></i> 
              ${new Date(word.createdAt).toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>
        </div>
      `;
}

function filterAndDisplayWords() {
  const searchInput = document
    .getElementById("search-input")
    .value.toLowerCase();
  const filterType = document.getElementById("filter-type").value;

  filteredWords = allWords.filter((word) => {
    const searchValue = word[filterType]?.toString().toLowerCase() || "";
    return searchValue.includes(searchInput);
  });

  displayWords();
}

function displayWords() {
  const wordList = document.getElementById("word-list");
  const loadMoreBtn = document.getElementById("load-more");
  if (!wordList) return;

  const wordsToShow = filteredWords.slice(0, displayCount);

  if (wordsToShow.length === 0) {
    wordList.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-500">
        저장된 단어가 없습니다.
      </div>
    `;
    loadMoreBtn.classList.add("hidden");
    return;
  }

  wordList.innerHTML = wordsToShow.map((word) => createWordCard(word)).join("");

  if (filteredWords.length > displayCount) {
    loadMoreBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.add("hidden");
  }

  document.getElementById("word-count").textContent = filteredWords.length;
}

async function updateWordListUsageUI() {
  const userRef = doc(db, "users", currentUser.email);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  const wordCount = userData.wordCount || 0;
  const maxWordCount = userData.maxWordCount || 0;

  const usageText = document.getElementById("wordlist-usage-text");
  const usageBar = document.getElementById("wordlist-usage-bar");

  usageText.textContent = `${wordCount}/${maxWordCount}`;

  const usagePercentage =
    maxWordCount > 0 ? (wordCount / maxWordCount) * 100 : 0;
  usageBar.style.width = `${Math.min(usagePercentage, 100)}%`;

  if (usagePercentage >= 90) {
    usageBar.classList.remove("bg-[#8B4513]");
    usageBar.classList.add("bg-red-500");
  } else if (usagePercentage >= 70) {
    usageBar.classList.remove("bg-[#8B4513]");
    usageBar.classList.add("bg-yellow-500");
  } else {
    usageBar.classList.remove("bg-red-500", "bg-yellow-500");
    usageBar.classList.add("bg-[#8B4513]");
  }
}
