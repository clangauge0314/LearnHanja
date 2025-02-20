import { auth, db } from "../../js/firebase/firebase-init.js";
import {
  setDoc,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

export async function initAddHanja() {
  const closeModalBtn = document.getElementById("close-modal");
  const hanjaInput = document.getElementById("hanja-input");
  const strokeInput = document.getElementById("stroke-input");
  const meaningInput = document.getElementById("meaning-input");
  const descriptionInput = document.getElementById("description-input");
  const saveHanjaBtn = document.getElementById("save-hanja");

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      closeModal();
      resetForm();
    });
  }

  if (hanjaInput) {
    hanjaInput.addEventListener("input", async (e) => {
      const hanja = e.target.value.trim();
      if (hanja) {
        try {
          const charData = await HanziWriter.loadCharacterData(hanja);
          strokeInput.value = charData.strokes.length;
        } catch (error) {
          console.error("획수를 가져오는 중 오류 발생:", error);
          strokeInput.value = "";
        }
      } else {
        strokeInput.value = "";
      }
    });
  }

  if (saveHanjaBtn) {
    saveHanjaBtn.addEventListener("click", async () => {
      if (!validateForm()) {
        alert("모든 필드를 입력해주세요.");
        return;
      }

      try {
        const userEmail = auth.currentUser?.email;
        if (!userEmail) {
          alert("로그인이 필요합니다.");
          return;
        }

        const userRef = doc(db, "users", userEmail);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          alert("사용자 정보가 없습니다.");
          return;
        }

        const userData = userSnap.data();
        if (userData.wordCount >= userData.maxWordCount) {
          alert(
            "최대 한자 추가 개수를 초과했습니다. (최대: " +
              userData.maxWordCount +
              "개)"
          );
          return;
        }

        const hanja = hanjaInput.value.trim();
        const wordData = {
          hanja: hanja,
          meaning: meaningInput.value,
          stroke: parseInt(strokeInput.value),
          description: descriptionInput.value,
          createdAt: new Date().toISOString(),
        };

        const wordlistRef = doc(db, "wordlist", userEmail, "wordlist", hanja);
        await setDoc(wordlistRef, wordData);

        await updateDoc(userRef, {
          wordCount: userData.wordCount + 1,
        });

        alert("한자가 성공적으로 추가되었습니다.");
        closeModal();
        resetForm();
        window.location.reload();
      } catch (error) {
        console.error("한자 추가 중 오류 발생:", error);
        alert("한자 추가에 실패했습니다.");
      }
    });
  }
}

function validateForm() {
  const hanjaInput = document.getElementById("hanja-input");
  const meaningInput = document.getElementById("meaning-input");
  const strokeInput = document.getElementById("stroke-input");
  const descriptionInput = document.getElementById("description-input");

  return (
    hanjaInput.value.trim() !== "" &&
    meaningInput.value.trim() !== "" &&
    strokeInput.value.trim() !== "" &&
    descriptionInput.value.trim() !== ""
  );
}

function closeModal() {
  const modal = document.getElementById("hanja-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function resetForm() {
  const hanjaInput = document.getElementById("hanja-input");
  const meaningInput = document.getElementById("meaning-input");
  const strokeInput = document.getElementById("stroke-input");
  const descriptionInput = document.getElementById("description-input");

  if (hanjaInput) hanjaInput.value = "";
  if (meaningInput) meaningInput.value = "";
  if (strokeInput) strokeInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
}
