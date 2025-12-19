// ===============================
// 페이지 접근 권한 확인
// ===============================
// 교사만 접근 가능
checkAuth('교사');

// ===============================
// 전역 상태
// ===============================
const currentUser = getCurrentUser();
let MY_COURSES = []; // 내 담당 강좌 목록
let currentCourseId = null; // 현재 관리 중인 강좌 ID
let surveyQuestions = []; // ?? ?? ??? ??

const QUARTER_OPTIONS = [
  { value: 1, label: "1분기 · 1학기" },
  { value: 2, label: "2분기 · 여름방학" },
  { value: 3, label: "3분기 · 2학기" },
  { value: 4, label: "4분기 · 겨울방학" },
];
const QUARTER_LABELS = QUARTER_OPTIONS.reduce((acc, opt) => {
  acc[String(opt.value)] = opt.label;
  return acc;
}, {});

const buildQuarterOptions = (selected = 1) =>
  QUARTER_OPTIONS.map(opt => `<option value="${opt.value}" ${opt.value === Number(selected) ? "selected" : ""}>${opt.label}</option>`).join("");

const resolveQuarterLabel = (value, fallback) => fallback || QUARTER_LABELS[String(value)] || "";

const CLASSROOM_OPTIONS = ["206", "207", "301", "302", "305", "306", "307", "308", "309", "강당", "406"];
const buildLocationOptions = (selected = "206") =>
  CLASSROOM_OPTIONS.map(room => `<option value="${room}" ${room === selected ? "selected" : ""}>${room}</option>`).join("");

const CATEGORY_OPTIONS = ["그래픽", "게임프로그래밍", "인공프로그래밍", "예체능", "교과", "기타"];
const buildCategoryOptions = (selected = "그래픽") =>
  CATEGORY_OPTIONS.map(cat => `<option value="${cat}" ${cat === selected ? "selected" : ""}>${cat}</option>`).join("");

// ===============================
// API 호출 함수들
// ===============================

// 강좌 개설 신청
async function createCourse(courseData) {
  try {
    const response = await apiRequest('/api/teachers/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
    return response;
  } catch (error) {
    console.error('Failed to create course:', error);
    throw error;
  }
}

// 내 담당 강좌 목록 조회
async function loadMyCourses() {
  try {
    // 올바른 엔드포인트로 교사 강좌 목록 조회
    MY_COURSES = await apiRequest('/api/teachers/courses/my');
    console.log(`Loaded ${MY_COURSES.length} courses from the server.`);
    return MY_COURSES;
  } catch (error) {
    console.error('Failed to load my courses:', error);
    alert('강좌 목록을 불러오는데 실패했습니다.');
    return [];
  }
}

// 강좌 정보 수정
async function updateCourse(courseId, courseData) {
  try {
    const response = await apiRequest(`/api/teachers/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
    return response;
  } catch (error) {
    console.error('Failed to update course:', error);
    throw error;
  }
}

// 수강생 목록 조회
async function getStudentList(courseId) {
  try {
    const data = await apiRequest(`/api/teachers/courses/${courseId}/students`);
    return data;
  } catch (error) {
    console.error('Failed to load students:', error);
    return [];
  }
}

// 출결 현황 조회
async function getAttendance(courseId, classDate) {
  try {
    const data = await apiRequest(`/api/teachers/courses/${courseId}/attendance?classDate=${classDate}`);
    return data;
  } catch (error) {
    console.error('Failed to load attendance:', error);
    return [];
  }
}

// 출결 기록/수정
async function saveAttendance(courseId, attendanceData) {
  try {
    await apiRequest(`/api/teachers/courses/${courseId}/attendance`, {
      method: 'POST',
      body: JSON.stringify(attendanceData)
    });
    return true;
  } catch (error) {
    console.error('Failed to save attendance:', error);
    throw error;
  }
}

// 공지사항 목록 조회
async function getNotices(courseId) {
  try {
    const data = await apiRequest(`/api/teachers/courses/${courseId}/notices`);
    return data;
  } catch (error) {
    console.error('Failed to load notices:', error);
    return [];
  }
}

// 공지사항 작성
async function createNotice(courseId, noticeData) {
  try {
    const response = await apiRequest(`/api/teachers/courses/${courseId}/notices`, {
      method: 'POST',
      body: JSON.stringify(noticeData)
    });
    return response;
  } catch (error) {
    console.error('Failed to create notice:', error);
    throw error;
  }
}

// 공지사항 수정
async function updateNotice(courseId, noticeId, noticeData) {
  try {
    const response = await apiRequest(`/api/teachers/courses/${courseId}/notices/${noticeId}`, {
      method: 'PUT',
      body: JSON.stringify(noticeData)
    });
    return response;
  } catch (error) {
    console.error('Failed to update notice:', error);
    throw error;
  }
}

// 공지사항 삭제
async function deleteNotice(courseId, noticeId) {
  try {
    await apiRequest(`/api/teachers/courses/${courseId}/notices/${noticeId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Failed to delete notice:', error);
    throw error;
  }
}

// 설문조사 목록 조회
async function getSurveys(courseId) {
  try {
    const data = await apiRequest(`/api/teachers/courses/${courseId}/surveys`);
    return data;
  } catch (error) {
    console.error('Failed to load surveys:', error);
    return [];
  }
}

// 설문조사 생성
async function createSurvey(courseId, surveyData) {
  try {
    const response = await apiRequest(`/api/teachers/courses/${courseId}/surveys`, {
      method: 'POST',
      body: JSON.stringify(surveyData)
    });
    return response;
  } catch (error) {
    console.error('Failed to create survey:', error);
    throw error;
  }
}

// ===============================
// UI 렌더링
// ===============================

// 헤더 교사 정보 표시
document.getElementById('teacherName').textContent = (currentUser && currentUser.name) || '교사';
document.getElementById('teacherEmail').textContent = (currentUser && currentUser.email) || '';
document.getElementById('teacherAvatar').textContent = ((currentUser && currentUser.name) || '교').slice(0, 1);

// 로그아웃
document.getElementById('btnLogout').addEventListener('click', logout);


// 강좌 목록 렌더링
async function renderCourseList() {
  const box = document.getElementById('courseList');

  await loadMyCourses();

  if (MY_COURSES.length === 0) {
    box.innerHTML = `<div class="tip">아직 강좌가 없어요. '신규 강좌 개설 신청'을 눌러 시작해요.</div>`;
    return;
  }

  box.innerHTML = MY_COURSES.map(c => {
    const baseStatusText = {
      'PENDING': '대기',
      'APPROVED': '승인',
      'REJECTED': '반려',
      'pending': '대기',
      'approved': '승인',
      'rejected': '반려'
    }[c.status] || c.status;
    const statusText = c.ended ? '종료' : baseStatusText;
    const statusClass = c.ended ? 'ended' : (c.status || '').toLowerCase();
    const quarterText = resolveQuarterLabel(c.quarter, c.quarterLabel) || '-';
    const endDateText = c.endDate || '-';

    return `
      <div class="course-card" data-id="${c.courseId}">
        <div class="course-title">
          <h3>${c.courseName}</h3>
          <span class="status ${statusClass}">${statusText}</span>
        </div>
        <div class="meta">
          <div><b>정원</b> ${c.currentEnrollmentCount || 0}/${c.capacity || 0}</div>
          <div><b>분기</b> ${quarterText}</div>
          <div><b>종료일</b> ${endDateText}</div>
        </div>
        <div class="card-actions">
          ${c.status === 'APPROVED' || c.status === 'approved' ? `<button class="primary" data-manage='${JSON.stringify(c)}'>관리</button>` : ''}
          ${c.status === 'PENDING' || c.status === 'REJECTED' || c.status === 'pending' || c.status === 'rejected' ? `<button class="ghost" data-edit='${JSON.stringify(c)}'>수정</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // 관리 버튼 핸들러
  document.querySelectorAll('#courseList [data-manage]').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = JSON.parse(btn.getAttribute('data-manage'));
      openCourseManagementModal(course);
    });
  });

  // 수정 버튼 핸들러
  document.querySelectorAll('#courseList [data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = JSON.parse(btn.getAttribute('data-edit'));
      openCourseEditModal(course);
    });
  });
}

// ===============================
// 강좌 관리 모달
// ===============================
async function openCourseManagementModal(course) {
  currentCourseId = course.courseId;

  const modalHTML = `
    <div class="t-modal-overlay" id="courseManagementModal">
      <div class="t-modal-content large">
        <div class="t-modal-header">
          <h2>${course.courseName} 관리</h2>
          <button class="t-modal-close" onclick="closeCourseManagementModal()">×</button>
        </div>
        
        <div class="tabs">
          <button class="tab active" data-tab="students">수강생</button>
          <button class="tab" data-tab="attendance">출결</button>
          <button class="tab" data-tab="notices">공지</button>
          <button class="tab" data-tab="surveys">설문</button>
        </div>
        
        <div class="t-modal-body">
          <!-- 수강생 탭 -->
          <div id="tab_students" class="tab-panel active">
            <div id="studentListContainer">로딩 중...</div>
          </div>
          
          <!-- 출결 탭 -->
          <div id="tab_attendance" class="tab-panel" style="display:none;">
            <div class="toolbar-row">
              <label>날짜 선택: <input type="date" id="attendanceDate" /></label>
              <button class="primary" onclick="loadAttendanceForDate()">조회</button>
              <button class="primary" onclick="saveAttendanceData()">저장</button>
            </div>
            <div id="attendanceContainer">날짜를 선택하고 조회 버튼을 눌러주세요.</div>
          </div>
          
          <!-- 공지/설문 기능 제거 -->
        </div>
      </div>
    </div>
  `;

  document.getElementById('modalRoot').innerHTML = modalHTML;

  // 탭 전환 이벤트
  document.querySelectorAll('#courseManagementModal .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#courseManagementModal .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('#courseManagementModal .tab-panel').forEach(p => p.style.display = 'none');
      document.getElementById(`tab_${tab.dataset.tab}`).style.display = 'block';
    });
  });

  // 오늘 날짜 설정
  const today = new Date().toISOString().split('T')[0];
  setTimeout(() => {
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) dateInput.value = today;
  }, 100);

  // 초기 데이터 로드
  await loadStudentList();
  // 공지/설문 기능 제거됨
}

function closeCourseManagementModal() {
  document.getElementById('modalRoot').innerHTML = '';
  currentCourseId = null;
  surveyQuestions = [];
}

// 수강생 목록 로드
async function loadStudentList() {
  const container = document.getElementById('studentListContainer');
  const students = await getStudentList(currentCourseId);

  if (students.length === 0) {
    container.innerHTML = '<div class="tip">수강생이 없습니다.</div>';
    return;
  }

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>학번</th>
          <th>이름</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(s => `
          <tr>
            <td>${s.studentIdNo || '-'}</td>
            <td>${s.name}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// 출결 조회
async function loadAttendanceForDate() {
  const dateInput = document.getElementById('attendanceDate');
  const classDate = dateInput.value;

  if (!classDate) {
    alert('날짜를 선택해주세요.');
    return;
  }

  const container = document.getElementById('attendanceContainer');
  const attendanceData = await getAttendance(currentCourseId, classDate);

  if (attendanceData.length === 0) {
    container.innerHTML = '<div class="tip">해당 날짜의 출결 데이터가 없습니다. 아래에서 출결을 입력해주세요.</div>';
    // 수강생 목록 가져와서 빈 출결표 만들기
    const students = await getStudentList(currentCourseId);
    renderAttendanceGrid(students, []);
    return;
  }

  renderAttendanceGrid(attendanceData, attendanceData);
}

function renderAttendanceGrid(students, attendanceData) {
  const container = document.getElementById('attendanceContainer');

  // enrollmentId를 명확하게 가져오기 위한 헬퍼 함수
  const getEnrollmentId = (s, attendance) => {
    if (s.enrollmentId) return s.enrollmentId;
    if (attendance && attendance.enrollmentId) return attendance.enrollmentId;
    // Fallback: studentId를 사용하되, 고유성을 보장하기 위해 문자열로 변환
    return `student_${s.studentId}`;
  };

  const gridHtml = `
    <table class="table">
      <thead>
        <tr>
          <th>학생</th>
          <th>출석</th>
          <th>결석</th>
          <th>지각</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(s => {
    const attendance = attendanceData.find(a => a.studentId === s.studentId); // studentId로 매칭 시도
    const status = (attendance && attendance.status) ? attendance.status : 'PRESENT';
    const enrollmentId = getEnrollmentId(s, attendance);

    return `
            <tr data-enrollment-id="${enrollmentId}">
              <td>${s.studentName || s.name}</td>
              <td><input type="radio" name="attendance_${enrollmentId}" value="PRESENT" ${status === 'PRESENT' ? 'checked' : ''} /></td>
              <td><input type="radio" name="attendance_${enrollmentId}" value="ABSENT" ${status === 'ABSENT' ? 'checked' : ''} /></td>
              <td><input type="radio" name="attendance_${enrollmentId}" value="LATE" ${status === 'LATE' ? 'checked' : ''} /></td>
            </tr>
          `;
  }).join('')}
      </tbody>
    </table>
  `;
  container.innerHTML = gridHtml;
}

// 출결 저장
async function saveAttendanceData() {
  const dateInput = document.getElementById('attendanceDate');
  const classDate = dateInput.value;

  if (!classDate) {
    alert('날짜를 선택해주세요.');
    return;
  }

  // 테이블의 각 행에서 enrollmentId와 선택된 상태를 가져오기
  const attendanceRecords = [];
  const rows = document.querySelectorAll('#attendanceContainer tbody tr[data-enrollment-id]');

  rows.forEach(row => {
    const enrollmentId = row.getAttribute('data-enrollment-id');
    const selected = row.querySelector('input[type="radio"]:checked');

    if (selected && enrollmentId) {
      attendanceRecords.push({
        enrollmentId: parseInt(enrollmentId, 10),
        status: selected.value
      });
    }
  });

  console.log('Saving attendance records:', attendanceRecords); // 디버깅 로그

  if (attendanceRecords.length === 0) {
    alert('출석 체크를 하나 이상 선택해주세요.');
    return;
  }

  try {
    await saveAttendance(currentCourseId, {
      classDate: classDate,
      students: attendanceRecords
    });
    alert('출결이 저장되었습니다.');
  } catch (error) {
    alert(error.message || '출결 저장에 실패했습니다.');
  }
}

// 공지 목록 로드
async function loadNoticeList() {
  const container = document.getElementById('noticeListContainer');
  const notices = await getNotices(currentCourseId);

  if (notices.length === 0) {
    container.innerHTML = '<div class="tip">공지사항이 없습니다.</div>';
    return;
  }

  container.innerHTML = notices.map(n => `
    <div class="notice-item">
      <h4>${n.title}</h4>
      <p>${n.content}</p>
      <div class="notice-actions">
        <button class="ghost" onclick="editNotice(${n.noticeId}, '${n.title.replace(/'/g, "\'")}', '${n.content.replace(/'/g, "\'")}')">수정</button>
        <button class="ghost" onclick="deleteNoticeById(${n.noticeId})">삭제</button>
      </div>
    </div>
  `).join('');
}

// 공지 작성 폼
function openNoticeForm(noticeId = null, title = '', content = '') {
  const isEdit = noticeId !== null;
  const formHTML = `
    <div class="notice-form">
      <h4>${isEdit ? '공지 수정' : '새 공지 작성'}</h4>
      <input type="text" id="noticeTitle" placeholder="제목" value="${title}" class="input" />
      <textarea id="noticeContent" placeholder="내용" class="textarea">${content}</textarea>
      <div class="form-actions">
        <button class="primary" onclick="${isEdit ? `updateNoticeById(${noticeId})` : 'createNoticeNow()'}">${isEdit ? '수정' : '작성'}</button>
        <button class="ghost" onclick="loadNoticeList()">취소</button>
      </div>
    </div>
  `;

  document.getElementById('noticeListContainer').innerHTML = formHTML;
}

async function createNoticeNow() {
  const title = document.getElementById('noticeTitle').value.trim();
  const content = document.getElementById('noticeContent').value.trim();

  if (!title || !content) {
    alert('제목과 내용을 입력해주세요.');
    return;
  }

  try {
    await createNotice(currentCourseId, { title, content });
    alert('공지가 작성되었습니다.');
    await loadNoticeList();
  } catch (error) {
    alert(error.message || '공지 작성에 실패했습니다.');
  }
}

function editNotice(noticeId, title, content) {
  openNoticeForm(noticeId, title, content);
}

async function updateNoticeById(noticeId) {
  const title = document.getElementById('noticeTitle').value.trim();
  const content = document.getElementById('noticeContent').value.trim();

  if (!title || !content) {
    alert('제목과 내용을 입력해주세요.');
    return;
  }

  try {
    await updateNotice(currentCourseId, noticeId, { title, content });
    alert('공지가 수정되었습니다.');
    await loadNoticeList();
  } catch (error) {
    alert(error.message || '공지 수정에 실패했습니다.');
  }
}

async function deleteNoticeById(noticeId) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    await deleteNotice(currentCourseId, noticeId);
    alert('공지가 삭제되었습니다.');
    await loadNoticeList();
  } catch (error) {
    alert(error.message || '공지 삭제에 실패했습니다.');
  }
}

// ===============================
// 설문 관리
// ===============================
async function loadSurveyList() {
  const container = document.getElementById('surveyListContainer');
  if (!container || currentCourseId === null) return;

  container.innerHTML = '로딩 중...';

  try {
    const surveys = await getSurveys(currentCourseId);
    if (!surveys || surveys.length === 0) {
      container.innerHTML = '<div class="tip">등록된 설문이 없습니다.</div>';
      return;
    }

    container.innerHTML = surveys.map(s => {
      const period = [s.startDate, s.endDate].filter(Boolean).join(' ~ ');
      return `
        <div class="notice-item">
          <h4>${s.title}</h4>
          <p class="small">${period || ''}</p>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load surveys:', error);
    container.innerHTML = '<div class="tip">설문을 불러오지 못했습니다.</div>';
  }
}

function renderTeacherSurveyQuestions() {
  const wrap = document.getElementById('teacherQuestionWrap');
  if (!wrap) return;

  if (surveyQuestions.length === 0) {
    wrap.innerHTML = '<div class="tip">질문을 추가해주세요.</div>';
    return;
  }

  wrap.innerHTML = surveyQuestions.map((q, idx) => `
    <div class="q-item">
      <div class="q-header">
        <strong>질문 ${idx + 1} (${q.type === 'TEXT' ? '주관식' : '객관식'})</strong>
        <button class="ghost" onclick="removeSurveyQuestion(${q.id})">삭제</button>
      </div>
      <input type="text" class="input" placeholder="질문 내용" value="${q.text}" onchange="updateSurveyQuestionText(${q.id}, this.value)" />
      ${q.type === 'SINGLE_CHOICE' ? `
        <input type="text" class="input" placeholder="선택지 (쉼표로 구분)" value="${q.options || ''}" onchange="updateSurveyQuestionOptions(${q.id}, this.value)" />
      ` : ''}
    </div>
  `).join('');
}

function removeSurveyQuestion(id) {
  surveyQuestions = surveyQuestions.filter(q => q.id !== id);
  renderTeacherSurveyQuestions();
}
function updateSurveyQuestionText(id, text) {
  const q = surveyQuestions.find(q => q.id === id);
  if (q) q.text = text;
}
function updateSurveyQuestionOptions(id, options) {
  const q = surveyQuestions.find(q => q.id === id);
  if (q) q.options = options;
}

function openSurveyForm() {
  const formWrap = document.getElementById('surveyFormContainer');
  if (!formWrap) return;

  surveyQuestions = [];
  formWrap.innerHTML = `
    <div class="notice-form">
      <h4>새 설문 작성</h4>
      <input type="text" id="teacherSurveyTitle" class="input" placeholder="설문 제목" />
      <div class="toolbar-row">
        <label>시작일 <input type="date" id="teacherSurveyStart" class="input" /></label>
        <label>종료일 <input type="date" id="teacherSurveyEnd" class="input" /></label>
      </div>
      <div id="teacherQuestionWrap" class="q-wrap"></div>
      <div class="flex gap">
        <button id="btnTeacherAddTextQ" class="ghost" type="button">주관식 추가</button>
        <button id="btnTeacherAddChoiceQ" class="ghost" type="button">객관식 추가</button>
      </div>
      <div class="form-actions">
        <button id="btnTeacherSurveySave" class="primary" type="button">저장</button>
        <button id="btnTeacherSurveyCancel" class="ghost" type="button">취소</button>
      </div>
    </div>
  `;

  document.getElementById('btnTeacherAddTextQ')?.addEventListener('click', () => {
    surveyQuestions.push({ id: Date.now(), type: 'TEXT', text: '', options: null });
    renderTeacherSurveyQuestions();
  });
  document.getElementById('btnTeacherAddChoiceQ')?.addEventListener('click', () => {
    surveyQuestions.push({ id: Date.now(), type: 'SINGLE_CHOICE', text: '', options: '' });
    renderTeacherSurveyQuestions();
  });
  document.getElementById('btnTeacherSurveySave')?.addEventListener('click', saveSurveyForm);
  document.getElementById('btnTeacherSurveyCancel')?.addEventListener('click', cancelSurveyForm);

  renderTeacherSurveyQuestions();
}

function cancelSurveyForm() {
  surveyQuestions = [];
  const formWrap = document.getElementById('surveyFormContainer');
  if (formWrap) formWrap.innerHTML = '';
}

async function saveSurveyForm() {
  const title = document.getElementById('teacherSurveyTitle')?.value.trim();
  const start = document.getElementById('teacherSurveyStart')?.value;
  const end = document.getElementById('teacherSurveyEnd')?.value;

  if (!title || !start || !end) {
    alert('제목과 기간을 입력해주세요.');
    return;
  }
  if (surveyQuestions.length === 0) {
    alert('질문을 한 개 이상 추가해주세요.');
    return;
  }

  const questions = surveyQuestions.map(q => ({
    questionText: q.text,
    questionType: q.type,
    options: q.options
  }));

  try {
    await createSurvey(currentCourseId, {
      title,
      startDate: start,
      endDate: end,
      questions
    });
    alert('설문이 생성되었습니다.');
    cancelSurveyForm();
    await loadSurveyList();
  } catch (error) {
    alert(error.message || '설문 생성에 실패했습니다.');
  }
}

// ===============================
// 강좌 수정 모달
// ===============================
function openCourseEditModal(course) {
  const modalHTML = `
    <div class="t-modal-overlay" id="courseEditModal">
      <div class="t-modal-content">
        <div class="t-modal-header">
          <h2>강좌 수정</h2>
          <button class="t-modal-close" onclick="closeCourseEditModal()">×</button>
        </div>
        <div class="t-modal-body">
          <div class="input-group">
            <label>강좌명</label>
            <input type="text" id="editCourseName" value="${course.courseName}" class="input" />
          </div>
          <div class="input-group">
            <label>카테고리</label>
            <select id="editCategory" class="input">
              ${buildCategoryOptions(course.category || "그래픽")}
            </select>
          </div>
          <div class="input-group">
            <label>수업 요일</label>
            <input type="text" id="editCourseDays" value="${course.courseDays || ''}" class="input" placeholder="예: 월,수" />
          </div>
          <div class="input-group">
            <label>수업 시간</label>
            <input type="text" id="editCourseTime" value="${course.courseTime || ''}" class="input" placeholder="예: 16:00-18:00" />
          </div>
          <div class="input-group">
            <label>강의실</label>
            <select id="editLocation" class="input">
              ${buildLocationOptions(course.location || "206")}
            </select>
          </div>
          <div class="input-group">
            <label>운영 분기</label>
            <select id="editQuarter" class="input">
              ${buildQuarterOptions(course.quarter || 1)}
            </select>
          </div>
          <div class="input-group">
            <label>방과후 종료 날짜</label>
            <input type="date" id="editEndDate" value="${course.endDate || ''}" class="input" />
          </div>
          <div class="input-group">
            <label>정원</label>
            <input type="number" id="editCapacity" value="${course.capacity || 20}" class="input" />
          </div>
          <div class="input-group">
            <label>설명</label>
            <textarea id="editDescription" class="textarea">${course.description || ''}</textarea>
          </div>
          <button class="primary" onclick="saveCourseEdit(${course.courseId})">저장</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modalRoot').innerHTML = modalHTML;
}

function closeCourseEditModal() {
  document.getElementById('modalRoot').innerHTML = '';
}

async function saveCourseEdit(courseId) {
  const courseName = document.getElementById('editCourseName').value.trim();
  const category = document.getElementById('editCategory').value.trim();
  const courseDays = document.getElementById('editCourseDays').value.trim();
  const courseTime = document.getElementById('editCourseTime').value.trim();
  const location = document.getElementById('editLocation').value;
  const quarter = parseInt(document.getElementById('editQuarter').value, 10);
  const endDate = document.getElementById('editEndDate').value;
  const capacity = parseInt(document.getElementById('editCapacity').value, 10);
  const description = document.getElementById('editDescription').value.trim();

  if (!courseName || !category || !courseDays || !courseTime || !location || !capacity || !quarter || !endDate) {
    alert('모든 필수 항목을 입력해주세요.');
    return;
  }

  try {
    await updateCourse(courseId, {
      courseName,
      category,
      description,
      courseDays,
      courseTime,
      location,
      capacity,
      quarter,
      quarterLabel: resolveQuarterLabel(quarter),
      endDate
    });
    alert('강좌가 수정되었습니다.');
    closeCourseEditModal();
    await renderCourseList();
  } catch (error) {
    alert(error.message || '강좌 수정에 실패했습니다.');
  }
}

// ===============================
// 신규 강좌 개설
// ===============================
document.getElementById('btnNewCourse').addEventListener('click', () => {
  const modalHTML = `
    <div class="t-modal-overlay" id="newCourseModal">
      <div class="t-modal-content">
        <div class="t-modal-header">
          <h2>신규 강좌 개설 신청</h2>
          <button class="t-modal-close" onclick="closeNewCourseModal()">&times;</button>
        </div>
        <div class="t-modal-body">
          <div class="input-group">
            <label>강좌명 *</label>
            <input type="text" id="newCourseName" class="input" />
          </div>
          <div class="input-group">
            <label>카테고리 *</label>
            <select id="newCategory" class="input">
              ${buildCategoryOptions("그래픽")}
            </select>
          </div>
          <div class="input-group">
            <label>수업 요일 *</label>
            <input type="text" id="newCourseDays" class="input" placeholder="예: 월,수" />
          </div>
          <div class="input-group">
            <label>수업 시간 *</label>
            <input type="text" id="newCourseTime" class="input" placeholder="예: 16:00-18:00" />
          </div>
          <div class="input-group">
            <label>운영 분기 *</label>
            <select id="newQuarter" class="input">
              ${buildQuarterOptions(1)}
            </select>
          </div>
          <div class="input-group">
            <label>방과후 종료 날짜 *</label>
            <input type="date" id="newEndDate" class="input" />
          </div>
          <div class="input-group">
            <label>강의실 *</label>
            <select id="newLocation" class="input">
              ${buildLocationOptions("206")}
            </select>
          </div>
          <div class="input-group">
            <label>정원 *</label>
            <input type="number" id="newCapacity" class="input" value="20" />
          </div>
          <div class="input-group">
            <label>강좌 설명</label>
            <textarea id="newDescription" class="textarea"></textarea>
          </div>
          <button class="primary" onclick="submitNewCourse()">신청</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modalRoot').innerHTML = modalHTML;
});

function closeNewCourseModal() {
  document.getElementById('modalRoot').innerHTML = '';
}

async function submitNewCourse() {
  const courseName = document.getElementById('newCourseName').value.trim();
  const category = document.getElementById('newCategory').value.trim();
  const courseDays = document.getElementById('newCourseDays').value.trim();
  const courseTime = document.getElementById('newCourseTime').value.trim();
  const quarter = parseInt(document.getElementById('newQuarter').value, 10);
  const endDate = document.getElementById('newEndDate').value;
  const location = document.getElementById('newLocation').value;
  const capacityValue = document.getElementById('newCapacity').value.trim();
  const description = document.getElementById('newDescription').value.trim();

  // 먼저 필수 항목이 모두 입력되었는지 확인
  if (!courseName || !category || !courseDays || !courseTime || !quarter || !endDate || !location || !capacityValue) {
    alert('필수 항목을 모두 입력해주세요.');
    return;
  }

  // 정원 값 파싱 및 검증
  const capacity = parseInt(capacityValue, 10);
  if (isNaN(capacity) || capacity < 1) {
    alert('정원은 1명 이상이어야 합니다.');
    return;
  }

  try {
    await createCourse({
      courseName,
      category,
      description,
      courseDays,
      courseTime,
      location,
      capacity,
      quarter,
      quarterLabel: resolveQuarterLabel(quarter),
      endDate
    });

    alert('강좌 개설 신청이 완료되었습니다. 관리자 승인을 기다려주세요.');
    closeNewCourseModal();
    await renderCourseList();
  } catch (error) {
    alert(error.message || '강좌 개설 신청에 실패했습니다.');
  }
}

// 초기화
renderCourseList();

// ===============================
// 전역 함수 노출 (onclick 핸들러용)
// ===============================
window.closeCourseManagementModal = closeCourseManagementModal;
window.loadAttendanceForDate = loadAttendanceForDate;
window.saveAttendanceData = saveAttendanceData;
window.openNoticeForm = openNoticeForm;
window.createNoticeNow = createNoticeNow;
window.editNotice = editNotice;
window.updateNoticeById = updateNoticeById;
window.deleteNoticeById = deleteNoticeById;
window.closeCourseEditModal = closeCourseEditModal;
window.saveCourseEdit = saveCourseEdit;
window.closeNewCourseModal = closeNewCourseModal;
window.submitNewCourse = submitNewCourse;
window.openSurveyForm = openSurveyForm;
window.removeSurveyQuestion = removeSurveyQuestion;
window.updateSurveyQuestionText = updateSurveyQuestionText;
window.updateSurveyQuestionOptions = updateSurveyQuestionOptions;
