/* =====================================
   로그인 페이지 로직 (API 연동)
   - JWT 토큰 기반 인증
   - 백엔드 API와 통신
===================================== */

/* =====================================================
  메인 초기화
===================================================== */
const EMAIL_VERIFICATION_ENDPOINTS = {
  send: '/api/auth/send-verification',
  verify: '/api/auth/email/send-code'
};
const VERIFICATION_EXPIRE_SECONDS = 180;

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
    const signupEmailInput = document.getElementById("signup-email");
    const sendCodeBtn = document.getElementById("send-verification-btn");
    const verificationStatus = document.getElementById("verification-status");
    const verificationFields = document.getElementById("verification-fields");
    const verificationCodeInput = document.getElementById("verification-code");
    const verifyCodeBtn = document.getElementById("verify-code-btn");

    const verificationState = {
      timerId: null,
      expireAt: null,
      verified: false
    };

    const setVerificationStatus = (message = "", tone = "info") => {
      if (!verificationStatus) return;
      const toneColorMap = {
        info: "#4c809a",
        success: "#16a34a",
        error: "#dc2626"
      };
      verificationStatus.style.color = toneColorMap[tone] || toneColorMap.info;
      verificationStatus.textContent = message;
    };

    const clearVerificationTimer = () => {
      if (verificationState.timerId) {
        clearInterval(verificationState.timerId);
        verificationState.timerId = null;
      }
      verificationState.expireAt = null;
      if (sendCodeBtn) {
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = "인증코드 발송";
      }
    };

    const resetVerificationState = (options = { hideInputs: true }) => {
      verificationState.verified = false;
      clearVerificationTimer();
      setVerificationStatus("");
      if (verifyCodeBtn) {
        verifyCodeBtn.disabled = false;
        verifyCodeBtn.textContent = "인증코드 확인";
      }
      if (verificationCodeInput) {
        verificationCodeInput.disabled = false;
        if (!options.keepCode) {
          verificationCodeInput.value = "";
        }
      }
      if (options.hideInputs) {
        verificationFields?.classList.add("hidden");
      }
    };

    const startVerificationTimer = () => {
      clearVerificationTimer();
      verificationState.expireAt = Date.now() + VERIFICATION_EXPIRE_SECONDS * 1000;
      if (sendCodeBtn) sendCodeBtn.disabled = true;

      const tick = () => {
        if (!sendCodeBtn) return;
        const remaining = Math.max(0, Math.ceil((verificationState.expireAt - Date.now()) / 1000));
        if (remaining <= 0) {
          clearVerificationTimer();
          sendCodeBtn.textContent = "인증코드 재발송";
          setVerificationStatus("인증코드가 만료되었습니다. 다시 요청해주세요.", "error");
          return;
        }

        const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
        const seconds = String(remaining % 60).padStart(2, "0");
        sendCodeBtn.textContent = `재전송 ${minutes}:${seconds}`;
      };

      tick();
      verificationState.timerId = setInterval(tick, 1000);
    };

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (signupEmailInput) {
      signupEmailInput.addEventListener("input", () => {
        if (verificationState.verified) {
          setVerificationStatus("이메일이 변경되어 다시 인증이 필요합니다.", "info");
        }
        resetVerificationState({ hideInputs: true });
      });
    }

    if (sendCodeBtn) {
      sendCodeBtn.addEventListener("click", async () => {
        if (!signupEmailInput) return;
        const email = signupEmailInput.value.trim();

        if (!emailRegex.test(email)) {
          alert("올바른 이메일 형식이 아닙니다.");
          signupEmailInput.focus();
          return;
        }

        try {
          resetVerificationState({ hideInputs: false, keepCode: false });
          verificationFields?.classList.remove("hidden");
          setVerificationStatus("인증코드를 발송 중입니다...", "info");
          sendCodeBtn.disabled = true;
          sendCodeBtn.textContent = "발송 중...";

          await apiRequest(EMAIL_VERIFICATION_ENDPOINTS.send, {
            method: "POST",
            body: JSON.stringify({ email })
          });

          setVerificationStatus("인증코드가 발송되었습니다. 3분 안에 입력해주세요.", "info");
          verificationCodeInput?.focus();
          startVerificationTimer();
        } catch (error) {
          console.error("Email code send error:", error);
          resetVerificationState({ hideInputs: true });
          let errorMessage = "인증코드 발송에 실패했습니다.";
          if (error.message) errorMessage = error.message;
          alert(errorMessage);
        }
      });
    }

    if (verifyCodeBtn) {
      verifyCodeBtn.addEventListener("click", async () => {
        if (!signupEmailInput || !verificationCodeInput) return;

        if (!verificationFields || verificationFields.classList.contains("hidden")) {
          alert("먼저 인증코드를 발송해주세요.");
          return;
        }

        if (verificationState.expireAt && Date.now() > verificationState.expireAt) {
          setVerificationStatus("인증코드가 만료되었습니다. 다시 요청해주세요.", "error");
          clearVerificationTimer();
          return;
        }

        const email = signupEmailInput.value.trim();
        const code = verificationCodeInput.value.trim();

        if (!code) {
          alert("인증코드를 입력해주세요.");
          verificationCodeInput.focus();
          return;
        }

        try {
          verifyCodeBtn.disabled = true;
          verifyCodeBtn.textContent = "확인 중...";
          setVerificationStatus("인증 확인 중입니다...", "info");

          await apiRequest(EMAIL_VERIFICATION_ENDPOINTS.verify, {
            method: "POST",
            body: JSON.stringify({ email, code })
          });

          verificationState.verified = true;
          clearVerificationTimer();
          setVerificationStatus("이메일 인증이 완료되었습니다.", "success");
          verificationCodeInput.disabled = true;
          if (sendCodeBtn) {
            sendCodeBtn.disabled = true;
            sendCodeBtn.textContent = "인증 완료";
          }
          if (verifyCodeBtn) {
            verifyCodeBtn.disabled = true;
            verifyCodeBtn.textContent = "인증 완료";
          }
        } catch (error) {
          console.error("Email code verify error:", error);
          let errorMessage = "인증코드 확인에 실패했습니다.";
          if (error.message) errorMessage = error.message;
          setVerificationStatus(errorMessage, "error");
          verifyCodeBtn.disabled = false;
          verifyCodeBtn.textContent = "인증코드 확인";
        }
      });
    }

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

      // 이메일 형식 검증
      if (!emailRegex.test(email)) {
        alert("올바른 이메일 형식이 아닙니다.");
        return;
      }

      if (!verificationState.verified) {
        alert("이메일 인증을 완료해주세요.");
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
        resetVerificationState({ hideInputs: true });

        // 버튼 다시 활성화
        submitBtn.disabled = false;
        submitBtn.textContent = "회원가입";

      } catch (error) {
        console.error('Signup error:', error);

        // 에러 메시지 개선
        let errorMessage = '회원가입에 실패했습니다. 다시 시도해주세요.';

        if (error.message.includes('이미') || error.message.includes('duplicate') || error.message.includes('already') || error.message.includes('존재')) {
          errorMessage = '이미 가입된 이메일입니다.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        alert(errorMessage);

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
      try {
        console.log('Login button clicked! Starting login process...');

        const emailInput = document.getElementById("login-id");
        const passwordInput = document.getElementById("login-password");

        if (!emailInput || !passwordInput) {
          throw new Error('ID 또는 비밀번호 입력창을 찾을 수 없습니다.');
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // 빈 필드 검증 추가
        if (!email || !password) {
          alert('아이디와 비밀번호를 입력해주세요.');
          return;
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert('올바른 이메일 형식이 아닙니다.');
          return;
        }

        const submitBtn = loginForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.textContent = "로그인 중...";

        // 백엔드 API 호출
        console.log('Sending login request to:', API_BASE_URL + '/api/auth/login');
        const response = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        console.log('Login response received:', response);

        // 응답에서 토큰과 역할 정보 추출
        const { token, role, name, email: userEmail } = response;

        // 토큰과 사용자 정보 저장
        setAuthToken(token);
        setCurrentUser(role, name, userEmail);

        // 역할에 따른 리다이렉션
        // Role 문자열이 "ROLE_ADMIN" 등으로 올 수 있으므로 처리
        const userRole = role.replace('ROLE_', '');

        alert('로그인 성공!');



        switch (userRole) {
          case 'ADMIN':
            window.location.href = './admin.html';
            break;
          case 'TEACHER':
            window.location.href = './teacher.html';
            break;
          case 'STUDENT':
            window.location.href = './student.html';
            break;
          default:
            alert('알 수 없는 사용자 역할입니다.');
            submitBtn.disabled = false;
            submitBtn.textContent = "로그인";
        }
      } catch (error) {
        console.error('Login Critical Error:', error);

        // 에러 메시지 개선
        let errorMessage = '로그인에 실패했습니다.';

        // 여기서 에러가 나면 대부분 비밀번호 오류 또는 가입되지 않은 사용자
        if (error.message.includes('가입되지 않은') || error.message.includes('존재하지 않는') || error.message.includes('not found')) {
          errorMessage = '가입되지 않은 이메일입니다.';
        } else if (error.message.includes('비밀번호') || error.message.includes('password') ||
          error.message.includes('Unauthorized') || error.message.includes('401') ||
          error.message.includes('403') || error.message.includes('권한')) {
          errorMessage = '잘못된 비밀번호입니다.';
        } else if (error.message && !error.message.includes('Failed to fetch')) {
          errorMessage = error.message;
        }

        alert(errorMessage);

        const submitBtn = loginForm.querySelector("button[type='submit']");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "로그인";
        }
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
