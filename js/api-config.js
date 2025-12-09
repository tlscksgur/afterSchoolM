/* =====================================
   API Configuration & Utilities
   Railway 백엔드 서버와 통신하기 위한 설정
===================================== */

// 환경에 따른 API 기본 URL 설정
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:4000' // Local development proxy
  : 'https://sdhsafterproject2025-production.up.railway.app'; // Production backend

console.log('Environment:', isLocal ? 'Local (Proxy)' : 'Production');
console.log('API_BASE_URL:', API_BASE_URL);

// LocalStorage 키
const AUTH_TOKEN_KEY = 'afterschool.authToken';
const CURRENT_USER_KEY = 'afterschool.currentUser';

/* -------------------------------------
   인증 토큰 관리
------------------------------------- */
function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

function getCurrentUser() {
  const userDataStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!userDataStr) return null;

  try {
    const userData = JSON.parse(userDataStr);
    return userData;
  } catch (e) {
    // 이전 버전 호환성: role만 저장된 경우
    return { role: userDataStr };
  }
}

function setCurrentUser(role, name, email) {
  const userData = { role, name, email };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
}

/* -------------------------------------
   공통 API 요청 함수
------------------------------------- */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  // 기본 헤더 설정
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 인증 토큰이 있으면 헤더에 추가
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // 401 Unauthorized - 토큰 만료 또는 인증 실패
    if (response.status === 401) {
      clearAuthToken();
      alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
      window.location.href = './login.html';
      throw new Error('Unauthorized');
    }

    // 403 Forbidden - 권한 없음
    if (response.status === 403) {
      let errorMessage = '접근 권한이 없습니다.';
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;

          // 특정 에러 메시지 매핑
          if (errorMessage.includes('duplicate') || errorMessage.includes('이미') || errorMessage.includes('존재')) {
            errorMessage = '이미 가입된 이메일입니다.';
          } else if (errorMessage.includes('not found') || errorMessage.includes('가입되지') || errorMessage.includes('존재하지')) {
            errorMessage = '가입되지 않은 이메일입니다.';
          } else if (errorMessage.includes('password') || errorMessage.includes('비밀번호') || errorMessage.includes('incorrect')) {
            errorMessage = '잘못된 비밀번호입니다.';
          }
        }
      } catch (e) {
        // JSON 파싱 실패 시 기본 메시지 사용
      }

      // 로그인/회원가입 페이지가 아닌 경우에만 alert 표시
      if (!window.location.pathname.includes('login.html')) {
        alert(errorMessage);
      }
      throw new Error(errorMessage);
    }

    // 404 Not Found
    if (response.status === 404) {
      throw new Error('요청한 리소스를 찾을 수 없습니다.');
    }

    // 500 Server Error
    if (response.status >= 500) {
      throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }

    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '요청 처리 중 오류가 발생했습니다.');
      }

      return data;
    }

    // JSON이 아닌 경우 (204 No Content 등)
    if (response.ok) {
      return null;
    }

    throw new Error('요청 처리 중 오류가 발생했습니다.');

  } catch (error) {
    // 네트워크 오류 (CORS, 서버 다운 등)
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      console.error('Network error:', error);
      throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    throw error;
  }
}

/* -------------------------------------
   페이지 접근 권한 확인
------------------------------------- */
function checkAuth(requiredRole = null) {
  const token = getAuthToken();
  const user = getCurrentUser();

  // 토큰이 없으면 로그인 페이지로
  if (!token || !user) {
    window.location.href = './login.html';
    return false;
  }

  // 특정 역할이 필요한 경우 확인
  // API는 'STUDENT', 'TEACHER', 'ADMIN' 반환
  // 프론트엔드 checkAuth('학생') 호출 시 매핑 필요
  const roleMap = {
    '학생': 'STUDENT',
    '교사': 'TEACHER',
    '관리자': 'ADMIN'
  };

  const requiredRoleCode = roleMap[requiredRole] || requiredRole;

  if (requiredRole && user.role !== requiredRoleCode && user.role !== requiredRole) {
    alert(`접근 권한이 없습니다. (필요: ${requiredRole}, 현재: ${user.role})`);
    // 역할에 맞는 페이지로 리다이렉트
    switch (user.role) {
      case 'ADMIN':
      case '관리자':
        window.location.href = './admin.html';
        break;
      case 'TEACHER':
      case '교사':
        window.location.href = './teacher.html';
        break;
      case 'STUDENT':
      case '학생':
        window.location.href = './student.html';
        break;
      default:
        window.location.href = './login.html';
    }
    return false;
  }

  return true;
}

/* -------------------------------------
   로그아웃
------------------------------------- */
function logout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    clearAuthToken();
    window.location.href = './login.html';
  }
}

/* -------------------------------------
   토큰 유효성 검증
------------------------------------- */
function validateToken() {
  const token = getAuthToken();

  if (!token) {
    return false;
  }

  try {
    // JWT 토큰은 세 부분으로 구성: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      clearAuthToken();
      return false;
    }

    // payload 디코딩 (Base64)
    const payload = JSON.parse(atob(parts[1]));

    // 만료 시간 확인 (exp는 Unix timestamp)
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.error('Token expired');
        clearAuthToken();
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = './login.html';
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    clearAuthToken();
    return false;
  }
}

// 보호된 페이지에서 토큰 유효성 자동 검증
// login.html이 아닌 페이지에서만 실행
if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    const token = getAuthToken();
    if (token && !validateToken()) {
      // 토큰이 유효하지 않으면 로그인 페이지로 리다이렉트
      window.location.href = './login.html';
    }
  });
}
