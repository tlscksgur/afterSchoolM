// ===============================
// 페이지 접근 권한 확인
// ===============================
// 관리자만 접근 가능
checkAuth('관리자');

// ===============================
// 전역 상태
// ===============================
const currentUser = getCurrentUser();
if (currentUser) {
  document.getElementById('adminName').textContent = currentUser.name || '관리자';
  document.getElementById('adminEmail').textContent = currentUser.email || '';
}

const QUARTER_OPTIONS = {
  1: "1분기 · 1학기",
  2: "2분기 · 여름방학",
  3: "3분기 · 2학기",
  4: "4분기 · 겨울방학"
};

const resolveQuarterLabel = value => QUARTER_OPTIONS[value] || QUARTER_OPTIONS[String(value)] || value || '';

// ===============================
// API 호출 함수들
// ===============================

// 사용자 목록 조회
async function loadUsers(role = '', name = '') {
  try {
    let endpoint = '/api/admin/users';
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (name) params.append('name', name);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const data = await apiRequest(endpoint);
    return data;
  } catch (error) {
    console.error('Failed to load users:', error);
    alert('사용자 목록을 불러오는데 실패했습니다.');
    return [];
  }
}

// 사용자 역할 변경
async function changeUserRole(userId, role) {
  try {
    await apiRequest(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
    return true;
  } catch (error) {
    console.error('Failed to change user role:', error);
    throw error;
  }
}

// 사용자 삭제
async function deleteUser(userId) {
  try {
    await apiRequest(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}

// 승인 대기 강좌 목록
async function loadPendingCourses() {
  try {
    const data = await apiRequest('/api/admin/courses/pending');
    return data;
  } catch (error) {
    console.error('Failed to load pending courses:', error);
    return [];
  }
}

// 강좌 승인/반려
async function changeCourseStatus(courseId, status) {
  try {
    await apiRequest(`/api/admin/courses/${courseId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return true;
  } catch (error) {
    console.error('Failed to change course status:', error);
    throw error;
  }
}

// NEW: 강좌 전체 승인
async function approveAllCourses() {
  try {
    await apiRequest(`/api/admin/courses/approve-all`, {
      method: 'POST'
    });
    return true;
  } catch (error) {
    console.error('Failed to approve all courses:', error);
    throw error;
  }
}

// 전체 강좌 목록
async function loadAllCourses() {
  try {
    const data = await apiRequest('/api/admin/courses');
    return data;
  } catch (error) {
    console.error('Failed to load all courses:', error);
    return [];
  }
}

async function endCourse(courseId) {
  try {
    await apiRequest(`/api/admin/courses/${courseId}/end`, {
      method: 'POST'
    });
    return true;
  } catch (error) {
    console.error('Failed to end course:', error);
    throw error;
  }
}





// 전체 설문 생성
async function createGlobalSurvey(surveyData) {
  try {
    await apiRequest('/api/admin/surveys', {
      method: 'POST',
      body: JSON.stringify(surveyData)
    });
    return true;
  } catch (error) {
    console.error('Failed to create survey:', error);
    throw error;
  }
}

// ===============================
// UI 렌더링
// ===============================

// 로그아웃
document.getElementById('btnLogout').addEventListener('click', logout);

// 메뉴 전환
document.querySelectorAll('.menu-item').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const target = btn.dataset.target;
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(target).classList.remove('hidden');

    // 페이지 진입 시 데이터 로드
    if (target === 'users') renderUsers();
    if (target === 'courses') {
      renderAllCourses();
    }
  });
});


// ===============================
// 1. 사용자 관리
// ===============================
async function renderUsers() {
  const tbody = document.getElementById('userTbody');
  tbody.innerHTML = '<tr><td colspan="5">로딩 중...</td></tr>';

  const keyword = document.getElementById('userSearch').value.trim();
  const roleFilterValue = document.getElementById('roleFilter').value;

  // 역할 매핑: 한글 -> 영문 코드
  const roleMap = {
    '학생': 'STUDENT',
    '교사': 'TEACHER',
    '관리자': 'ADMIN'
  };
  const roleFilter = roleMap[roleFilterValue] || roleFilterValue;

  const users = await loadUsers(roleFilter, keyword);

  tbody.innerHTML = '';

  users.forEach(u => {
    const tr = document.createElement('tr');
    
    // 역할 드롭다운을 더 명확하게 생성
    const roles = {
        'STUDENT': '학생',
        'TEACHER': '교사',
        'ADMIN': '관리자'
    };
    const currentUserRole = u.role ? u.role.toUpperCase() : '';
    
    const roleOptions = Object.entries(roles).map(([value, text]) => {
        // 백엔드에서 'STUDENT' 또는 '학생' 형태로 값이 올 수 있으므로 둘 다 확인
        const isSelected = (currentUserRole === value || currentUserRole === text);
        return `<option value="${value}" ${isSelected ? 'selected' : ''}>${text}</option>`;
    }).join('');

    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>
        <select class="roleSelect" data-id="${u.userId}">
          ${roleOptions}
        </select>
      </td>
      <td><span class="badge green">활성</span></td>
      <td>
        <button class="ghost btnDelete" data-id="${u.userId}">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('userSearch').addEventListener('input', renderUsers);
document.getElementById('roleFilter').addEventListener('change', renderUsers);

document.getElementById('userTbody').addEventListener('change', async e => {
  if (e.target.classList.contains('roleSelect')) {
    const userId = e.target.dataset.id;
    const newRole = e.target.value;

    try {
      await changeUserRole(userId, newRole);
      alert('역할이 변경되었습니다.');
    } catch (error) {
      alert(error.message || '역할 변경에 실패했습니다.');
      renderUsers();
    }
  }
});

document.getElementById('userTbody').addEventListener('click', async e => {
  if (e.target.classList.contains('btnDelete')) {
    const userId = e.target.dataset.id;
    if (confirm('정말로 삭제하시겠습니까?')) {
      try {
        await deleteUser(userId);
        alert('사용자가 삭제되었습니다.');
        renderUsers();
      } catch (error) {
        alert(error.message || '삭제에 실패했습니다.');
      }
    }
  }
});

// ===============================
// 2. 강좌 운영 관리
// ===============================

// 통합된 강좌 목록 렌더링
async function renderAllCourses() {
  const tbody = document.getElementById('allCourseTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8">로딩 중...</td></tr>';

  const courses = await loadAllCourses();
  const keyword = document.getElementById('courseSearch').value.trim().toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;

  let filtered = courses;
  if (keyword) {
    filtered = filtered.filter(c =>
      c.courseName.toLowerCase().includes(keyword) ||
      (c.teacherName && c.teacherName.toLowerCase().includes(keyword))
    );
  }
  if (statusFilter) {
    filtered = filtered.filter(c => c.status === statusFilter);
  }

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">표시할 강좌가 없습니다.</td></tr>';
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  filtered.forEach(c => {
    let color = 'yellow';
    let statusText = '대기';
    if (c.ended) {
      color = 'gray';
      statusText = '종료';
    } else if (c.status === 'APPROVED') {
      color = 'green';
      statusText = '승인';
    } else if (c.status === 'REJECTED') {
      color = 'red';
      statusText = '반려';
    }

    const quarterText = c.quarterLabel || resolveQuarterLabel(c.quarter) || '-';
    const endDateText = c.endDate || '-';

    let actionButtons = '';
    if (c.status === 'PENDING') {
      actionButtons = `
        <button class="primary small btnApprove" data-id="${c.courseId}">승인</button>
        <button class="ghost small btnReject" data-id="${c.courseId}">반려</button>
      `;
    }

    const canEnd = !c.ended && c.status === 'APPROVED' && c.endDate && c.endDate <= today;
    if (canEnd) {
      actionButtons += `<button class="ghost small btnEndCourse" data-end="${c.courseId}">종료 처리</button>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.courseName}</td>
      <td>${c.teacherName || '-'}</td>
      <td>${quarterText}</td>
      <td>${endDateText}</td>
      <td>${c.capacity || 0}</td>
      <td>${c.currentEnrollmentCount || 0}/${c.capacity || 0}</td>
      <td><span class="badge ${color}">${statusText}</span></td>
      <td>${actionButtons}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 통합된 강좌 목록의 이벤트 리스너
document.getElementById('allCourseTbody')?.addEventListener('click', async e => {
  const courseId = e.target.dataset.id;
  const endId = e.target.dataset.end;

  if (endId) {
    try {
      await endCourse(endId);
      alert('강좌가 종료 처리되었습니다.');
      renderAllCourses();
    } catch (error) {
      alert(error.message || '종료 처리에 실패했습니다.');
    }
    return;
  }

  if (!courseId) return;

  let status = '';
  if (e.target.classList.contains('btnApprove')) {
    status = 'APPROVED';
  } else if (e.target.classList.contains('btnReject')) {
    status = 'REJECTED';
  }

  if (status) {
    try {
      await changeCourseStatus(courseId, status);
      alert(`강좌가 ${status === 'APPROVED' ? '승인' : '반려'}되었습니다.`);
      renderAllCourses(); // 목록 새로고침
    } catch (error) {
      alert(error.message || '처리에 실패했습니다.');
    }
  }
});


document.getElementById('courseSearch').addEventListener('input', renderAllCourses);
document.getElementById('statusFilter').addEventListener('change', renderAllCourses);


// ===============================
// 3. 설문 관리
// ===============================
// ===============================


// 설문조사 질문 관리
let surveyQuestions = [];

document.getElementById('btnAddTextQ').addEventListener('click', () => {
  const qId = Date.now();
  surveyQuestions.push({ id: qId, type: 'TEXT', text: '', options: null });
  renderQuestions();
});

document.getElementById('btnAddSingleQ').addEventListener('click', () => {
  const qId = Date.now();
  surveyQuestions.push({ id: qId, type: 'SINGLE_CHOICE', text: '', options: '' });
  renderQuestions();
});

function renderQuestions() {
  const wrap = document.getElementById('questionWrap');

  wrap.innerHTML = surveyQuestions.map((q, idx) => `
    <div class="q-item">
      <div class="q-header">
        <strong>질문 ${idx + 1} (${q.type === 'TEXT' ? '주관식' : '객관식'})</strong>
        <button class="ghost" onclick="removeQuestion(${q.id})">삭제</button>
      </div>
      <input type="text" class="input" placeholder="질문 내용" value="${q.text}" onchange="updateQuestionText(${q.id}, this.value)" />
      ${q.type === 'SINGLE_CHOICE' ? `
        <input type="text" class="input" placeholder="선택지 (쉼표로 구분, 예: 예,아니오)" value="${q.options || ''}" onchange="updateQuestionOptions(${q.id}, this.value)" />
      ` : ''}
    </div>
  `).join('');
}

function removeQuestion(qId) {
  surveyQuestions = surveyQuestions.filter(q => q.id !== qId);
  renderQuestions();
}

function updateQuestionText(qId, text) {
  const q = surveyQuestions.find(q => q.id === qId);
  if (q) q.text = text;
}

function updateQuestionOptions(qId, options) {
  const q = surveyQuestions.find(q => q.id === qId);
  if (q) q.options = options;
}

document.getElementById('btnSurveySave').addEventListener('click', async () => {
  const title = document.getElementById('surveyTitle').value.trim();
  const period = document.getElementById('surveyPeriod').value.trim();

  if (!title || !period) {
    alert('제목과 기간을 입력하세요.');
    return;
  }

  if (surveyQuestions.length === 0) {
    alert('최소 1개 이상의 질문을 추가해주세요.');
    return;
  }

  // 기간 파싱 (예: 2025-10-01 ~ 2025-10-20)
  const dates = period.split('~').map(d => d.trim());
  if (dates.length !== 2) {
    alert('기간 형식이 올바르지 않습니다. (예: 2025-10-01 ~ 2025-10-20)');
    return;
  }

  const questions = surveyQuestions.map(q => ({
    questionText: q.text,
    questionType: q.type,
    options: q.options
  }));

  try {
    await createGlobalSurvey({
      title,
      startDate: dates[0],
      endDate: dates[1],
      questions
    });

    alert('설문조사가 생성되었습니다.');
    document.getElementById('surveyTitle').value = '';
    document.getElementById('surveyPeriod').value = '';
    surveyQuestions = [];
    renderQuestions();
  } catch (error) {
    alert(error.message || '설문 생성에 실패했습니다.');
  }
});

document.getElementById('btnSurveyReset').addEventListener('click', () => {
  document.getElementById('surveyTitle').value = '';
  document.getElementById('surveyPeriod').value = '';
  surveyQuestions = [];
  renderQuestions();
});

// 초기 공지 목록 로드


// ===============================
// 초기 렌더링
// ===============================
renderUsers();
renderAllCourses();

// ===============================
// 전역 함수 노출 (onclick 핸들러용)
// ===============================
window.removeQuestion = removeQuestion;

window.updateQuestionText = updateQuestionText;
window.updateQuestionOptions = updateQuestionOptions;

// ===============================
// 사이드바 네비게이션
// ===============================
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();

    // 1. 메뉴 활성화 상태 변경
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');

    // 2. 섹션 표시 전환
    const targetId = item.getAttribute('data-target');
    document.querySelectorAll('.page-section').forEach(section => {
      if (section.id === targetId) {
        section.classList.remove('hidden');

      } else {
        section.classList.add('hidden');
      }
    });
  });
});
