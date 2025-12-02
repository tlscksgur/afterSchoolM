/* =====================================
   로그인 페이지 로직 (API 연동)
   - JWT 토큰 기반 인증
   - 백엔드 API와 통신
===================================== */

/* =====================================================
  메인 초기화
===================================================== */
function loginPage() {
  document.addEventListener("DOMContentLoaded", () => {
    // 이미 로그인되어 있으면 해당 페이지로 리다이렉트
    const token = getAuthToken();
    const user = getCurrentUser();
    if (token && user) {
      redirectToRolePage(user.role);
      return;
    }

    const tabs = document.querySelectorAll(".tab-buttons button");
    const forms = document.querySelectorAll(".form");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    // 탭 전환
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(btn => btn.classList.remove("active"));
        tab.classList.add("active");
        forms.forEach(form => form.classList.remove("active"));
        document.getElementById(`${tab.dataset.tab}-form`).classList.add("active");
      });
    });

    /* -------------------------------------
       회원가입
------------------------------------- */
    // 역할 선택에 따라 학번 입력란 표시/숨김
    const roleSelect = document.getElementById("signup-role");
    const studentIdGroup = document.getElementById("student-id-group");
    const studentIdInput = document.getElementById("signup-student-id");

    roleSelect.addEventListener("change", () => {
      if (roleSelect.value === "STUDENT") {
        studentIdGroup.style.display = "block";
        studentIdInput.required = true;
      } else {
        studentIdGroup.style.display = "none";
        studentIdInput.required = false;
        studentIdInput.value = ""; // 교사 선택 시 학번 초기화
      }
    });

    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value.trim();
      const password2 = document.getElementById("signup-password2").value.trim();
      const role = document.getElementById("signup-role").value;
      const studentIdNo = document.getElementById("signup-student-id").value.trim();

      // 유효성 검사
      if (!name || !email || !password || !password2) {
        alert("모든 항목을 입력해주세요.");
        return;
      }

      if (!role) {
        alert("역할을 선택해주세요.");
        return;
      }

      if (role === "STUDENT" && !studentIdNo) {
        alert("학번을 입력해주세요.");
        return;
      }

      if (password !== password2) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
      }

      if (password.length < 6) {
        alert("비밀번호는 최소 6자 이상이어야 합니다.");
        return;
      }

      try {
        // 회원가입 버튼 비활성화
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "처리 중...";

        // 백엔드 API 호출
        await apiRequest('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            name,
            role: role, // "STUDENT" 또는 "TEACHER"
            studentIdNo: role === "STUDENT" ? studentIdNo : null
          })
        });

        alert("회원가입이 완료되었습니다! 로그인해주세요.");

        // 로그인 탭으로 전환
        document.querySelector('.tab-buttons button[data-tab="login"]').click();

        // 폼 초기화
        signupForm.reset();
        studentIdGroup.style.display = "none"; // 학번 필드 숨김

        // 버튼 다시 활성화
        submitBtn.disabled = false;
        submitBtn.textContent = "회원가입";

      } catch (error) {
        console.error('Signup error:', error);
        alert(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.');

        // 버튼 다시 활성화
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = "회원가입";
      }
    });

    /* -------------------------------------
       로그인 - 백엔드 API 호출
------------------------------------- */
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-id").value.trim();
      const password = document.getElementById("login-password").value.trim();

      if (!email || !password) {
        alert("이메일과 비밀번호를 모두 입력해주세요.");
        return;
      }

      try {
        // 로그인 버튼 비활성화
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "로그인 중...";

        // 백엔드 API 호출
        const response = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        // 응답에서 토큰과 역할 정보 추출
        const { token, role } = response;

        if (!token || !role) {
          throw new Error('로그인 응답 형식이 올바르지 않습니다.');
        }

        // 토큰과 역할 정보 저장
        setAuthToken(token);
        setCurrentUser(role);

        alert(`환영합니다! (${role})`);

        // 역할별 페이지 이동
        redirectToRolePage(role);

      } catch (error) {
        console.error('Login error:', error);
        alert(error.message || '로그인에 실패했습니다. 다시 시도해주세요.');

        // 버튼 다시 활성화
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = "로그인";
      }
    });
  });
}

/* =====================================================
  역할별 페이지 리다이렉트
===================================================== */
function redirectToRolePage(role) {
  switch (role) {
    case "관리자":
    case "ADMIN":
      window.location.href = "./admin.html";
      break;
    case "교사":
    case "TEACHER":
      window.location.href = "./teacher.html";
      break;
    case "학생":
    case "STUDENT":
      window.location.href = "./student.html";
      break;
    default:
      alert("알 수 없는 역할입니다.");
      clearAuthToken();
  }
}

/* =====================================================
  (선택) 구글 로그인 더미
===================================================== */
function googleLogin() {
  alert("Google 로그인은 아직 연결되지 않았습니다 😅");
  // TODO: OAuth 플로우 구현
}

// 초기 실행
loginPage();