import { login, googleLogin, githubLogin } from "../firebase/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");
  const submitButton = document.getElementById("login-button");

  const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
  };

  const hideError = () => {
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
  };

  document
    .getElementById("google-login-btn")
    .addEventListener("click", async () => {
      try {
        const user = await googleLogin();
        alert(`환영합니다, ${user.displayName}님!`);
        window.location.href = "index.html";
      } catch (error) {
        console.error(error.message);
        alert(error.message);
      }
    });

  document
    .getElementById("github-login-btn")
    .addEventListener("click", async () => {
      try {
        const user = await githubLogin();
        alert(
          `GitHub 로그인 성공! 환영합니다, ${user.displayName || user.email}님!`
        );
        window.location.href = "index.html";
      } catch (error) {
        console.error(error.message);
        alert(error.message);
      }
    });

  submitButton.addEventListener("click", async () => {
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      const user = await login(email, password);
      console.log("로그인된 사용자:", user);
      alert(`로그인 성공! 환영합니다, ${user.displayName}님!`);
      window.location.href = "index.html";
    } catch (error) {
      console.error("로그인 실패:", error.message);
      if (error.message.includes("이메일 인증")) {
        showError("이메일 인증이 필요합니다. 이메일을 확인해 주세요.");
      } else {
        showError(error.message);
      }
    }
  });
});
