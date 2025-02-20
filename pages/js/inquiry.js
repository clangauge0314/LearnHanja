import { loadNavbar } from "../../components/js/navbar.js";
import { auth, db } from "../../js/firebase/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, collection, setDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      document.getElementById("name").value = user.email;
    } else {
      alert("로그인 후 이용해주세요.");
      window.location.href = "../login.html";
    }
  });

  const inquiryForm = document.getElementById("inquiryForm");
  inquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!subject || !message) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const inquirySnapshot = await getDocs(collection(db, "inquiries"));
      const newInquiryId = inquirySnapshot.size + 1;
      
      await setDoc(doc(db, "inquiries", newInquiryId.toString()), {
        id: user.uid,
        email: user.email,
        subject: subject,
        message: message,
        timestamp: serverTimestamp(),
        status: "접수 완료",
      });

      alert(`문의가 성공적으로 등록되었습니다. (문의번호: ${newInquiryId})`);
      inquiryForm.reset();
    } catch (error) {
      console.error("문의 등록 중 오류 발생:", error);
      alert("문의 등록에 실패했습니다. 다시 시도해주세요.");
    }
  });
});
