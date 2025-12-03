// ===============================
// 페이지 접근 권한 확인
// ===============================
// 관리자만 접근 가능
// checkAuth('관리자');

// ===============================
// 전역 상태
// ===============================
const currentUser = getCurrentUser();

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

// 강제 배정
async function forceEnroll(courseId, studentId) {
  try {
    await apiRequest(`/api/admin/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ studentId })
    });
    return true;
  } catch (error) {
    console.error('Failed to force enroll:', error);
    throw error;
  }
}

// 강제 취소
async function forceUnenroll(courseId, studentId) {
  try {
    await apiRequest(`/api/admin/courses/${courseId}/unenroll/${studentId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Failed to force unenroll:', error);
    throw error;
  }
}

// 전체 공지 작성
async function createGlobalNotice(noticeData) {
  try {
    await apiRequest('/api/admin/notices', {
      method: 'POST',
      body: JSON.stringify(noticeData)
    });
    return true;
  } catch (error) {
    console.error('Failed to create notice:', error);
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
      renderPendingCourses();
      renderAllCourses();
    }
  });
});

// 탭 전환
document.querySelectorAll('.tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const parentTabs = tab.closest('.tabs');
    parentTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const section = tab.closest('.page-section');
    section.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    section.querySelector(`#tab_${tab.dataset.tab}`).classList.remove('hidden');
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
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>
        <select class="roleSelect" data-id="${u.userId}">
          <option ${u.role === 'STUDENT' || u.role === '학생' ? 'selected' : ''}>학생</option>
          <option ${u.role === 'TEACHER' || u.role === '교사' ? 'selected' : ''}>교사</option>
          <option ${u.role === 'ADMIN' || u.role === '관리자' ? 'selected' : ''}>관리자</option>
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
async function renderPendingCourses() {
  const tbody = document.getElementById('pendingTbody');
  tbody.innerHTML = '<tr><td colspan="5">로딩 중...</td></tr>';

  const courses = await loadPendingCourses();

  tbody.innerHTML = '';

  courses.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.courseName}</td>
      <td>${c.teacherName || '-'}</td>
      <td>${c.createdAt || '-'}</td>
      <td><span class="badge yellow">대기</span></td>
      <td>
        <button class="primary btnApprove" data-id="${c.courseId}">승인</button>
        <button class="ghost btnReject" data-id="${c.courseId}">반려</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('pendingTbody').addEventListener('click', async e => {
  const courseId = e.target.dataset.id;
  if (!courseId) return;

  try {
    if (e.target.classList.contains('btnApprove')) {
      await changeCourseStatus(courseId, 'APPROVED');
      alert('강좌가 승인되었습니다.');
    }
    if (e.target.classList.contains('btnReject')) {
      await changeCourseStatus(courseId, 'REJECTED');
      alert('강좌가 반려되었습니다.');
    }
    renderPendingCourses();
    renderAllCourses();
  } catch (error) {
    alert(error.message || '처리에 실패했습니다.');
  }
});

async function renderAllCourses() {
  const tbody = document.getElementById('allCourseTbody');
  tbody.innerHTML = '<tr><td colspan="5">로딩 중...</td></tr>';

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
    filtered = filtered.filter(c => c.status.toLowerCase() === statusFilter);
  }

  tbody.innerHTML = '';

  filtered.forEach(c => {
    let color = 'yellow';
    let statusText = '대기';
    if (c.status === 'APPROVED' || c.status === 'approved') {
      color = 'green';
      statusText = '승인';
    }
    if (c.status === 'REJECTED' || c.status === 'rejected') {
      color = 'red';
      statusText = '반려';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.courseName}</td>
      <td>${c.teacherName || '-'}</td>
      <td>${c.capacity || 0}</td>
      <td>${c.currentEnrollmentCount || 0}/${c.capacity || 0}</td>
      <td><span class="badge ${color}">${statusText}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('courseSearch').addEventListener('input', renderAllCourses);
document.getElementById('statusFilter').addEventListener('change', renderAllCourses);

// ===============================
// 3. 공지 및 설문 관리
// ===============================

// 공지사항 목록 로드
async function loadNoticeList() {
  try {
    const notices = await apiRequest('/api/admin/notices');
    const container = document.getElementById('noticeList');

    if (notices.length === 0) {
      container.innerHTML = '<div class="hint">등록된 공지사항이 없습니다.</div>';
      return;
    }

    container.innerHTML = notices.map(n => `
      <div class="list-item">
        <div>
          <strong>${n.title}</strong>
          <p>${n.content}</p>
        </div>
        <button class="ghost" onclick="deleteGlobalNotice(${n.noticeId})">삭제</button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load notices:', error);
  }
}

async function deleteGlobalNotice(noticeId) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    await apiRequest(`/api/admin/notices/${noticeId}`, { method: 'DELETE' });
    alert('공지사항이 삭제되었습니다.');
    await loadNoticeList();
  } catch (error) {
    alert(error.message || '삭제에 실패했습니다.');
  }
}

document.getElementById('btnNoticeSave').addEventListener('click', async () => {
  const title = document.getElementById('noticeTitle').value.trim();
  const content = document.getElementById('noticeBody').value.trim();

  if (!title || !content) {
    alert('제목과 내용을 입력하세요.');
    return;
  }

  try {
    await createGlobalNotice({ title, content });
    alert('공지사항이 등록되었습니다.');
    document.getElementById('noticeTitle').value = '';
    document.getElementById('noticeBody').value = '';
    await loadNoticeList();
  } catch (error) {
    alert(error.message || '공지 등록에 실패했습니다.');
  }
});

document.getElementById('btnNoticeReset').addEventListener('click', () => {
  document.getElementById('noticeTitle').value = '';
  document.getElementById('noticeBody').value = '';
});

// 설문조사 질문 관리
let surveyQuestions = [];

document.getElementById('btnAddTextQ').addEventListener('click', () => {
  const qId = Date.now();
  surveyQuestions.push({ id: qId, type: 'SUBJECTIVE', text: '', options: null });
  renderQuestions();
});

document.getElementById('btnAddSingleQ').addEventListener('click', () => {
  const qId = Date.now();
  surveyQuestions.push({ id: qId, type: 'OBJECTIVE', text: '', options: '' });
  renderQuestions();
});

function renderQuestions() {
  const wrap = document.getElementById('questionWrap');

  wrap.innerHTML = surveyQuestions.map((q, idx) => `
    <div class="q-item">
      <div class="q-header">
        <strong>질문 ${idx + 1} (${q.type === 'SUBJECTIVE' ? '주관식' : '객관식'})</strong>
        <button class="ghost" onclick="removeQuestion(${q.id})">삭제</button>
      </div>
      <input type="text" class="input" placeholder="질문 내용" value="${q.text}" onchange="updateQuestionText(${q.id}, this.value)" />
      ${q.type === 'OBJECTIVE' ? `
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
loadNoticeList();

// ===============================
// 초기 렌더링
// ===============================
renderUsers();

// ===============================
// 전역 함수 노출 (onclick 핸들러용)
// ===============================
window.deleteGlobalNotice = deleteGlobalNotice;
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

        // 강좌 운영 탭으로 전환 시 강제 배정 드롭다운 초기화
        if (targetId === 'courses') {
          loadForceEnrollmentData();
        }
      } else {
        section.classList.add('hidden');
      }
    });
  });
});

// ===============================
// 강제 배정/취소 기능
// ===============================
let selectedStudentId = null;
let selectedCourseId = null;

async function loadForceEnrollmentData() {
  try {
    // 학생 목록 로드
    const students = await loadUsers('STUDENT', '');
    const studentSelect = document.getElementById('assignStudentSelect');
    studentSelect.innerHTML = '<option value="">학생을 선택하세요</option>';
    students.forEach(s => {
      const option = document.createElement('option');
      option.value = s.userId;
      option.textContent = `${s.name} (${s.email})`;
      studentSelect.appendChild(option);
    });

    // 강좌 목록 로드
    const courses = await loadAllCourses();
    const courseSelect = document.getElementById('assignCourseSelect');
    courseSelect.innerHTML = '<option value="">강좌를 선택하세요</option>';
    courses.forEach(c => {
      const option = document.createElement('option');
      option.value = c.courseId;
      option.textContent = `${c.courseName} (${c.teacherName || '교사'})`;
      courseSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load force enrollment data:', error);
  }
}

// 학생 선택 이벤트
document.getElementById('assignStudentSelect').addEventListener('change', (e) => {
  selectedStudentId = e.target.value;
  const selectedOption = e.target.options[e.target.selectedIndex];
  document.getElementById('chosenStudent').textContent = selectedOption.textContent || '-';
});

// 강좌 선택 이벤트
document.getElementById('assignCourseSelect').addEventListener('change', (e) => {
  selectedCourseId = e.target.value;
  const selectedOption = e.target.options[e.target.selectedIndex];
  document.getElementById('chosenCourse').textContent = selectedOption.textContent || '-';
});

// 강제 배정 버튼
document.getElementById('btnForceEnroll').addEventListener('click', async () => {
  if (!selectedStudentId || !selectedCourseId) {
    alert('학생과 강좌를 모두 선택해주세요.');
    return;
  }

  if (!confirm('선택한 학생을 강좌에 강제 배정하시겠습니까?')) {
    return;
  }

  try {
    await forceEnroll(selectedCourseId, selectedStudentId);
    alert('강제 배정이 완료되었습니다.');
  } catch (error) {
    alert(error.message || '강제 배정에 실패했습니다.');
  }
});

// 강제 취소 버튼
document.getElementById('btnForceCancel').addEventListener('click', async () => {
  if (!selectedStudentId || !selectedCourseId) {
    alert('학생과 강좌를 모두 선택해주세요.');
    return;
  }

  if (!confirm('선택한 학생의 수강을 강제 취소하시겠습니까?')) {
    return;
  }

  try {
    await forceUnenroll(selectedCourseId, selectedStudentId);
    alert('강제 취소가 완료되었습니다.');
  } catch (error) {
    alert(error.message || '강제 취소에 실패했습니다.');
  }
});