import { loadNavbar } from "./components/navbar.js";
import { auth, db } from "./firebase/firebase-init.js";
import {
  collection,
  query,
  getDocs,
  orderBy,
  setDoc,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

import {
  initLearnHanja,
  showLearnHanjaModal,
} from "./components/learnhanja.js";

let currentUser = null;
let allWords = [];
let filteredWords = [];
let displayCount = 12;

window.showLearnHanjaModal = showLearnHanjaModal;

const GEMINI_API_KEY = "AIzaSyA20jVcBHKAijE3K_YLystYe89uLnOS-U0";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

document.addEventListener("DOMContentLoaded", async () => {
  loadNavbar();
  await loadModal();
  await initLearnHanja();

  const addWordBtn = document.getElementById("ai-add-word");
  const searchInput = document.getElementById("search-input");
  const filterType = document.getElementById("filter-type");
  const loadMoreBtn = document.getElementById("load-more");

  async function getHanjaRecommendation(subject, amount) {
    const userRef = doc(db, "users", currentUser.email);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    const aiUsage = userData.aiUsage || 0;
    const maxAiUsage = userData.maxAiUsage || 0;

    if (aiUsage >= maxAiUsage) {
      alert("AI 사용 한도를 초과했습니다.");
      return;
    }

    await updateDoc(userRef, {
      aiUsage: aiUsage + 1
    });

    const prompt = `Recommend ${amount} Chinese characters (Hanja) related to the following topic: ${subject}.  
    Follow this exact format for each character:  
    
    Hanja|Korean Pronunciation|Stroke Count|Description (in Korean, max 10 characters)  
    
    ### Important Rules:  
    1. The Korean pronunciation must strictly follow the format: "meaning + pronunciation" (e.g., "나무 목", "물 수").  
    2. Each response must contain exactly **one** Hanja character (no two-character words).  
    3. The stroke count must be **100% accurate**, matching the standard stroke order.  
    4. The description and pronunciation must be written in **Korean**.  
    5. Each line should contain only one entry, and the format should be followed exactly.  
    
    Example Response:  
    木|나무 목|4|식물 관련  
    水|물 수|4|강이나 바다  
    火|불 화|4|뜨거운 것  
    `;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      return text.split("\n").map((line) => {
        const [hanja, meaning, stroke, description] = line.split("|");
        return {
          hanja,
          meaning,
          stroke: parseInt(stroke),
          description,
        };
      });
    } catch (error) {
      console.error("한자 추천 받기 실패:", error);
      throw error;
    }
  }

  async function saveRecommendedHanja(hanjaData) {
    try {
      const recommendRef = doc(
        db,
        "ai-recommend",
        currentUser.email,
        "ai-recommend",
        hanjaData.hanja
      );

      const docData = {
        ...hanjaData,
        createdAt: new Date().toISOString(),
      };

      await setDoc(recommendRef, docData);
    } catch (error) {
      console.error("한자 저장 실패:", error);
      alert("한자 저장 실패");
      throw error;
    }
  }

  addWordBtn.addEventListener("click", async () => {
    const subject = prompt("추천받을 주제를 입력해주세요.");
    let amount;
    do {
      amount = prompt("추천받을 한자의 개수를 입력해주세요. (1~50)");
    } while (!amount.match(/^\d+$/) || amount < 1 || amount > 50);

    amount = Number(amount);

    if (subject && amount) {
      let loadingDiv;  
      try {
        loadingDiv = document.createElement("div");
        loadingDiv.textContent = "한자를 추천받는 중입니다...";
        loadingDiv.className =
          "fixed top-0 left-0 w-full bg-blue-500 text-white text-center p-2";
        document.body.appendChild(loadingDiv);

        const recommendations = await getHanjaRecommendation(subject, amount);

        for (const hanjaData of recommendations) {
          await saveRecommendedHanja(hanjaData);
        }

        loadingDiv.remove();
        alert(`${amount}개의 한자가 성공적으로 추천되어 저장되었습니다.`);
        await fetchWords();
      } catch (error) {
        if (loadingDiv) loadingDiv.remove();
        alert(error.message || "한자 추천 및 저장 중 오류가 발생했습니다.");
        console.error(error);
      }
    }
  });

  async function updateAiUsageUI() {
    const userRef = doc(db, "users", currentUser.email);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    const aiUsage = userData.aiUsage || 0;
    const maxAiUsage = userData.maxAiUsage || 0;
    
    const usageText = document.getElementById('ai-usage-text');
    const usageBar = document.getElementById('ai-usage-bar');
    
    usageText.textContent = `${aiUsage}/${maxAiUsage}`;
    
    const usagePercentage = maxAiUsage > 0 ? (aiUsage / maxAiUsage) * 100 : 0;
    usageBar.style.width = `${Math.min(usagePercentage, 100)}%`;
    
    if (usagePercentage >= 90) {
      usageBar.classList.remove('bg-[#8B4513]');
      usageBar.classList.add('bg-red-500');
    } else if (usagePercentage >= 70) {
      usageBar.classList.remove('bg-[#8B4513]');
      usageBar.classList.add('bg-yellow-500');
    } else {
      usageBar.classList.remove('bg-red-500', 'bg-yellow-500');
      usageBar.classList.add('bg-[#8B4513]');
    }
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await fetchWords();
      await updateAiUsageUI();
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
  const learnHanjaResponse = await fetch("./components/learnhanja.html");

  const learnHanjaHtml = await learnHanjaResponse.text();

  document.getElementById("modal-container").innerHTML = learnHanjaHtml;
}

async function fetchWords() {
  try {
    if (!currentUser) return;

    const aiRecommendRef = collection(
      db,
      "ai-recommend",
      currentUser.email,
      "ai-recommend"
    );
    const aiQuery = query(aiRecommendRef, orderBy("createdAt", "desc"));
    const aiQuerySnapshot = await getDocs(aiQuery);

    allWords = [];
    aiQuerySnapshot.forEach((doc) => {
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
  if (!wordList || !loadMoreBtn) return;

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

  if (displayCount < filteredWords.length) {
    loadMoreBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.add("hidden");
  }

  document.getElementById("word-count").textContent = filteredWords.length;
}
