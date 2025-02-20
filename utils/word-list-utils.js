import { doc, getDoc, collection, query, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

export function createWordCard(word) {
  return `
    <div 
      class="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-300 border border-gray-200 cursor-pointer" 

      onclick="window.showLearnHanjaModal(${JSON.stringify(word).replace(/"/g, "&quot;")})"
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
          <span class="font-semibold">${word.description.slice(0, 10)}</span> 
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

export function initializeWordList({
  searchInput,
  filterType,
  loadMoreBtn,
  onSearch,
  onFilterChange,
  onLoadMore
}) {
  if (searchInput) {
    searchInput.addEventListener("input", onSearch);
  }

  if (filterType) {
    filterType.addEventListener("change", onFilterChange);
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", onLoadMore);
  }
}

export function filterWords(allWords, searchInput, filterType) {
  const searchValue = searchInput.value.toLowerCase();
  const filterValue = filterType.value;

  return allWords.filter((word) => {
    const valueToSearch = word[filterValue]?.toString().toLowerCase() || "";
    return valueToSearch.includes(searchValue);
  });
}

export function displayWordList(wordList, filteredWords, displayCount, loadMoreBtn) {
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

  wordList.innerHTML = wordsToShow.map(createWordCard).join("");

  if (filteredWords.length > displayCount) {
    loadMoreBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.add("hidden");
  }

  return wordsToShow.length;
}

export async function updateUsageUI(currentUser, db, type) {
  const userRef = doc(db, "users", currentUser.email);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  
  const usage = type === 'ai' ? userData.aiUsage || 0 : userData.wordCount || 0;
  const maxUsage = type === 'ai' ? userData.maxAiUsage || 0 : userData.maxWordCount || 0;
  
  const usageText = document.getElementById(`${type}-usage-text`);
  const usageBar = document.getElementById(`${type}-usage-bar`);
  
  usageText.textContent = `${usage}/${maxUsage}`;
  
  const usagePercentage = maxUsage > 0 ? (usage / maxUsage) * 100 : 0;
  usageBar.style.width = `${Math.min(usagePercentage, 100)}%`;
  
  updateUsageBarColor(usageBar, usagePercentage);
}

function updateUsageBarColor(usageBar, percentage) {
  if (percentage >= 90) {
    usageBar.classList.remove("bg-[#8B4513]");
    usageBar.classList.add("bg-red-500");
  } else if (percentage >= 70) {
    usageBar.classList.remove("bg-[#8B4513]");
    usageBar.classList.add("bg-yellow-500");
  } else {
    usageBar.classList.remove("bg-red-500", "bg-yellow-500");
    usageBar.classList.add("bg-[#8B4513]");
  }
}

export async function initializeWordListPage({
  currentUser,
  db,
  type, // 'ai' 또는 'wordlist'
  onAddWordClick,
  elements
}) {
  if (!currentUser) return;

  if (elements.addWordBtn) {
    elements.addWordBtn.addEventListener("click", onAddWordClick);
  }

  initializeWordList({
    ...elements,
    onSearch: () => handleSearch(elements),
    onFilterChange: () => handleSearch(elements),
    onLoadMore: () => handleLoadMore(elements)
  });

  await fetchAndDisplayWords(currentUser, db, type);
  await updateUsageUI(currentUser, db, type);
}

export function handleSearch(elements) {
  displayCount = 12;
  filteredWords = filterWords(allWords, elements.searchInput, elements.filterType);
  displayWordList(
    document.getElementById("word-list"), 
    filteredWords, 
    displayCount, 
    elements.loadMoreBtn
  );
}

export function handleLoadMore(elements) {
  displayCount += 12;
  displayWordList(
    document.getElementById("word-list"), 
    filteredWords, 
    displayCount, 
    elements.loadMoreBtn
  );
}

export async function fetchAndDisplayWords(currentUser, db, type) {
  try {
    if (!currentUser) return;

    const collectionPath = type === 'ai' ? 
      ["ai-recommend", currentUser.email, "ai-recommend"] :
      ["wordlist", currentUser.email, "wordlist"];

    const wordsRef = collection(db, ...collectionPath);
    const q = query(wordsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    allWords = [];
    querySnapshot.forEach((doc) => {
      allWords.push(doc.data());
    });

    document.getElementById("word-count").textContent = allWords.length;
    filteredWords = allWords;
    displayWordList(
      document.getElementById("word-list"),
      filteredWords,
      displayCount,
      document.getElementById("load-more")
    );
  } catch (error) {
    console.error("단어를 가져오는데 실패했습니다.", error);
  }
}

export async function loadModals(modalPaths) {
  const responses = await Promise.all(
    modalPaths.map(path => fetch(path))
  );
  
  const htmlContents = await Promise.all(
    responses.map(response => response.text())
  );
  
  document.getElementById("modal-container").innerHTML = htmlContents.join("");
}

let allWords = [];
let filteredWords = [];
let displayCount = 12;

export { allWords, filteredWords, displayCount };
