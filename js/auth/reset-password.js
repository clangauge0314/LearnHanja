import { resetPassword } from "../firebase/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const resetButton = document.getElementById("reset-password-button");

  resetButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    if (!email) {
      alert("이메일을 입력하세요.");
      return;
    }

    resetButton.disabled = true;
    resetButton.textContent = "전송 중...";

    try {
      await resetPassword(email);
      alert("비밀번호 재설정 링크가 이메일로 전송되었습니다.");
      emailInput.value = "";
      window.location.href = "login.html";
    } catch (error) {
      switch (error.code) {
        case "auth/user-not-found":
          alert("등록되지 않은 이메일입니다.");
          break;
        case "auth/invalid-email":
          alert("유효하지 않은 이메일 주소입니다.");
          break;
        case "auth/too-many-requests":
          alert("너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.");
          break;
        default:
          alert("오류가 발생했습니다. 다시 시도해주세요.");
          console.error("비밀번호 재설정 오류:", error);
      }
    } finally {
      resetButton.disabled = false;
      resetButton.textContent = "링크 보내기";
    }
  });
});
