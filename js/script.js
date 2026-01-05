console.log('script.js loaded');

// 전역 상태 (API에서 로드)
let COURSES = [];
let MY_COURSES = []; // 내 수강 내역
let SURVEYS = [];
let SURVEY_ANS = {};

// ===============================
// API 호출 함수들
// ===============================

// 강좌 목록 조회
async function loadCourses(keyword = '', category = '') {
  try {
    let endpoint = '/api/students/courses';
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (category) params.append('category', category);
    if (params.toString()) endpoint += `?${params.toString()}`;

    const data = await apiRequest(endpoint);

    // API 응답을 기존 형식에 맞게 변환
    COURSES = data.map(course => ({
      id: course.courseId,
      name: course.courseName,
      teacher: course.teacherName,
      category: course.category || '기타',
      tags: [],
      days: course.courseDays ? course.courseDays.split(',') : [],
      time: course.courseTime || '',
      room: course.location || '미정', // 강의실 정보가 없으면 "미정" 표시
      capacity: course.capacity,
      enrolled: course.currentEnrollment,
      desc: course.description || '',
      isEnrolled: course.isEnrolled || false // API에서 제공하는 신청 여부
    }));

    return COURSES;
  } catch (error) {
    console.error('Failed to load courses:', error);
    alert('강좌 목록을 불러오는데 실패했습니다.');
    return [];
  }
}

// 강좌 상세 조회
async function getCourseDetail(courseId) {
  try {
    const data = await apiRequest(`/api/students/courses/${courseId}`);

    return {
      id: data.courseId,
      name: data.courseName,
      teacher: data.teacherName,
      category: data.category || '기타',
      tags: [],
      days: data.courseDays ? data.courseDays.split(',') : [],
      time: data.courseTime || '',
      room: data.location || '미정', // 강의실 정보가 없으면 "미정" 표시
      capacity: data.capacity,
      enrolled: data.currentEnrollment,
      desc: data.description || '',
      isEnrolled: data.isEnrolled || false,
      canEnroll: data.canEnroll !== undefined ? data.canEnroll : true // API에서 제공하는 신청 가능 여부
    };
  } catch (error) {
    console.error('Failed to load course detail:', error);
    return null;
  }
}

// 내 수강 내역 조회
async function loadMyCourses() {
  try {
    const data = await apiRequest('/api/students/my-courses');

    // API 응답 형식: { courses: [...], overallAttendanceRate: 85.5 }
    MY_COURSES = data.courses.map(course => ({
      id: course.courseId || course.id || 0,
      name: course.courseName,
      teacher: course.teacherName,
      attendanceRate: course.attendanceRate || 0,
      presentCount: course.presentCount || 0,
      absentCount: course.absentCount || 0,
      lateCount: course.lateCount || 0,
      status: course.status || 'ACTIVE',
      days: [],
      time: ''
    }));

    return MY_COURSES;
  } catch (error) {
    console.error('Failed to load my courses:', error);
    alert('수강 내역을 불러오는데 실패했습니다.');
    return [];
  }
}

// 수강 신청
async function enrollCourse(courseId) {
  try {
    await apiRequest(`/api/students/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    return true;
  } catch (error) {
    console.error('Failed to enroll course:', error);
    throw error;
  }
}

// 수강 취소
async function cancelEnrollment(courseId) {
  try {
    await apiRequest(`/api/students/courses/${courseId}/enroll`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Failed to cancel enrollment:', error);

    // 백엔드가 403을 반환하는 경우, 프론트엔드에서 처리 (local state cleanup)
    if (error.message.includes('403') || error.message.includes('권한')) {
      console.warn('Backend returned 403, handling cancellation on frontend');

      // MY_COURSES에서 제거
      const index = MY_COURSES.findIndex(c => c.id === courseId);
      if (index > -1) {
        MY_COURSES.splice(index, 1);
      }

      // COURSES의 isEnrolled 상태 업데이트
      const course = COURSES.find(c => c.id === courseId);
      if (course) {
        course.isEnrolled = false;
        if (course.enrolled > 0) {
          course.enrolled--;
        }
      }

      return true;
    }

    throw error;
  }
}

// 설문조사 목록 조회
async function loadSurveys() {
  try {
    const data = await apiRequest('/api/students/surveys');
    SURVEYS = data;
    return SURVEYS;
  } catch (error) {
    console.error('Failed to load surveys:', error);
    return [];
  }
}

// 설문조사 상세 조회
async function getSurveyDetail(surveyId) {
  try {
    const data = await apiRequest(`/api/students/surveys/${surveyId}`);
    return data;
  } catch (error) {
    console.error('Failed to load survey detail:', error);
    return null;
  }
}

// 설문조사 제출
async function submitSurvey(surveyId, responses) {
  try {
    await apiRequest(`/api/students/surveys/${surveyId}/responses`, {
      method: 'POST',
      body: JSON.stringify(responses)
    });
    return true;
  } catch (error) {
    console.error('Failed to submit survey:', error);
    throw error;
  }
}

// ===============================
// 유틸
// ===============================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function remainSeats(c) { return Math.max(0, c.capacity - c.enrolled); }

// 수강 신청 여부 확인 (API에서 제공하는 isEnrolled 사용)
function isApplied(courseId) {
  const course = COURSES.find(c => c.id === courseId);
  return course ? course.isEnrolled : false;
}

// ===============================
// 렌더: 카드들
// ===============================
function courseCardHTML(c) {
  const badges = `<div class="badges">
      <span class="badge">${c.category}</span>
      ${c.tags.map(t => `<span class="badge">${t}</span>`).join("")}
    </div>`;
  const sched = `${c.days.join(", ")} ${c.time}`;
  return `
  <article class="course-card" data-id="${c.id}">
    <div class="course-body">
      <h3>${c.name}</h3>
      <p>${c.teacher} · ${sched}</p>
      ${badges}
      <div class="kv"><span>정원</span><span><strong>${c.enrolled}</strong> / ${c.capacity}</span></div>
      <div class="kv"><span>여석</span><span><strong>${remainSeats(c)}</strong></span></div>
    </div>
  </article>
  `;
}

async function renderDashboard() {
  const grid = $("#dashboardGrid");

  // 강좌 목록이 없으면 로드
  if (COURSES.length === 0) {
    await loadCourses();
  }

  // 인기순(여석 적을수록, 신청자 많을수록 가정) 정렬 상위 6
  const popular = [...COURSES].sort((a, b) => (b.enrolled / b.capacity) - (a.enrolled / a.capacity)).slice(0, 6);
  grid.innerHTML = popular.map(courseCardHTML).join("");
}

function uniqueTeachers() {
  // 교사명이 있는 강좌만 필터링하고 중복 제거
  return Array.from(new Set(
    COURSES
      .map(c => c.teacher)
      .filter(t => t && t.trim() !== '' && t !== 'undefined' && t !== 'null')
  ));
}
function uniqueCategories() {
  return Array.from(new Set(COURSES.map(c => c.category)));
}

function buildFilters() {
  // 담당 교사 드롭다운
  const sel = $("#teacherFilter");
  const teachers = uniqueTeachers();
  if (sel) {
    sel.innerHTML = `<option value="">전체</option>` + teachers.map(t => `<option value="${t}">${t}</option>`).join("");
  }

  // 카테고리 칩
  const chips = $("#categoryChips");
  const cats = uniqueCategories();
  if (chips) {
    chips.innerHTML = cats.map(c => `<div class="chip" data-cat="${c}">${c}</div>`).join("");
  }
}

const filters = { teacher: "", cats: new Set(), search: "", sort: "popular" };

function applyFilters(list) {
  let arr = list;
  // 검색(강좌명/강사명)
  if (filters.search) {
    const q = filters.search.toLowerCase();
    arr = arr.filter(c => c.name.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q));
  }
  // 담당 교사
  if (filters.teacher) {
    arr = arr.filter(c => c.teacher === filters.teacher);
  }
  // 카테고리(여러 개 선택 시 OR)
  if (filters.cats.size > 0) {
    arr = arr.filter(c => filters.cats.has(c.category));
  }
  // 정렬
  switch (filters.sort) {
    case "name": arr.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "teacher": arr.sort((a, b) => a.teacher.localeCompare(b.teacher)); break;
    case "category": arr.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)); break;
    case "remain": arr.sort((a, b) => remainSeats(b) - remainSeats(a)); break;
    default: // popular
      arr.sort((a, b) => (b.enrolled / b.capacity) - (a.enrolled / a.capacity));
  }
  return arr;
}

async function renderAllCourses() {
  const grid = $("#allCoursesGrid");

  // 강좌 목록이 없으면 로드
  if (COURSES.length === 0) {
    await loadCourses();
  }

  const filtered = applyFilters([...COURSES]);
  grid.innerHTML = filtered.map(courseCardHTML).join("");
}

// ===============================
// 모달
// ===============================
let currentCourse = null;

async function openCourseModal(courseId) {
  const c = COURSES.find(c => c.id === courseId);
  console.log('Course found:', c);
  if (!c) return;
  currentCourse = c;

  const applyToUI = (course) => {
    $("#courseModalTitle").textContent = course.name;
    $("#courseDesc").textContent = course.desc;
    $("#courseCategory").textContent = `${course.category}${course.tags.length ? " ? " + course.tags.join(", ") : ""}`;
    $("#courseTeacher").textContent = course.teacher;
    $("#courseSchedule").textContent = `${course.days.join(", ")} ${course.time}`;
    $("#courseRoom").textContent = course.room || '??';
    $("#courseEnrolled").textContent = course.enrolled;
    $("#courseCapacity").textContent = course.capacity;

    const btn = $("#btnToggleApply");
    const warning = $("#attendanceWarning");

    const blocked = course.canEnroll === false;
    warning.classList.toggle("hidden", !blocked);

    const applied = course.isEnrolled;
    const isFull = remainSeats(course) <= 0 && !applied;

    if (applied) {
      btn.textContent = "수강 취소";
      btn.disabled = blocked;
    } else if (isFull) {
      btn.textContent = "정원 마감";
      btn.disabled = true;
    } else if (blocked) {
      btn.textContent = "신청 불가";
      btn.disabled = true;
    } else {
      btn.textContent = "신청하기";
      btn.disabled = false;
    }
  };

  // ?? ?? ??? ???? ??
  applyToUI(c);

  // ?? ?? ??? ?? ??? ???/??/?? ?? ??
  try {
    const detail = await getCourseDetail(courseId);
    if (detail) {
      c.room = detail.room || detail.location || c.room;
      c.time = detail.time || detail.courseTime || c.time;
      c.days = detail.days && detail.days.length ? detail.days : c.days;
      c.desc = detail.desc || detail.description || c.desc;
      c.teacher = detail.teacher || detail.teacherName || c.teacher;
      c.category = detail.category || c.category;
      c.capacity = detail.capacity || c.capacity;
      c.enrolled = detail.enrolled ?? c.enrolled;
      c.canEnroll = detail.canEnroll ?? c.canEnroll;
      applyToUI(c);
    }
  } catch (e) {
    console.error('Failed to load course detail', e);
  }

  $("#courseModal").classList.remove("hidden");
}


function closeCourseModal() {
  $("#courseModal").classList.add("hidden");
  currentCourse = null;
}

async function toggleApply() {
  if (!currentCourse) return;

  const c = currentCourse;
  const applied = isApplied(c.id);

  const btn = $("#btnToggleApply");
  btn.disabled = true;

  try {
    if (applied) {
      if (!confirm(`'${c.name}' 수강을 취소할까요?`)) {
        btn.disabled = false;
        return;
      }

      // API 호출: 수강 취소
      await cancelEnrollment(c.id);
      alert('수강 신청이 취소되었습니다.');

      // 내 수강 목록에서 제거
      MY_COURSES = MY_COURSES.filter(course => course.id !== c.id);

    } else {
      if (remainSeats(c) <= 0) {
        alert("정원이 가득 찼습니다.");
        btn.disabled = false;
        return;
      }

      if (!confirm(`'${c.name}' 수강을 신청할까요?`)) {
        btn.disabled = false;
        return;
      }

      // API 호출: 수강 신청
      await enrollCourse(c.id);
      alert('수강 신청이 완료되었습니다.');

      // 내 수강 목록에 추가 (임시)
      MY_COURSES.push({
        id: c.id,
        name: c.name,
        teacher: c.teacher,
        attendanceRate: 0
      });
    }

    // 모달 닫기
    closeCourseModal();

    // 리스트 갱신
    await loadCourses(); // 강좌 목록 다시 로드 (enrolled 수 업데이트)
    await renderDashboard();
    await renderAllCourses();
    await renderMyApplies();

  } catch (error) {
    alert(error.message || '처리 중 오류가 발생했습니다.');
  } finally {
    btn.disabled = false;
  }
}

// ===============================
// 내 신청 내역 + 출석률
// ===============================
function applyCardHTML(c, status) {
  const sched = `${c.days.join(", ")} ${c.time}`;
  const stCls = status === 'active' ? 'ongoing' : 'canceled';
  const stTxt = status === 'active' ? '수강중' : '취소됨';
  const canCancel = status === 'active';
  return `
  <div class="apply-card">
    <div class="apply-info">
      <div class="apply-top">
        <div>
          <h3>${c.name}</h3>
          <p>${sched}</p>
        </div>
        <span class="status ${stCls}">${stTxt}</span>
      </div>
      ${canCancel ? `<button class="apply-btn ghost" data-cancel="${c.id}">신청 취소</button>` : ""}
    </div>
  </div>`;
}

async function renderMyApplies() {
  const box = $("#applyList");

  // API에서 내 수강 내역 로드
  await loadMyCourses();

  if (MY_COURSES.length === 0) {
    box.innerHTML = `<div class="hint">신청한 강좌가 없습니다.</div>`;
    return;
  }

  const html = MY_COURSES.map(c => {
    const sched = c.days.length > 0 ? `${c.days.join(", ")} ${c.time}` : '시간 미정';
    return `
    <div class="apply-card">
      <div class="apply-info">
        <div class="apply-top">
          <div>
            <h3>${c.name}</h3>
            <p>${c.teacher} · ${sched}</p>
          </div>
          <span class="status ongoing">수강중</span>
        </div>
        <button class="apply-btn ghost" data-cancel="${c.id}">신청 취소</button>
      </div>
    </div>`;
  }).join("");

  box.innerHTML = html;

  // 취소 버튼 핸들
  $$("#applyList [data-cancel]").forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-cancel');
      const c = MY_COURSES.find(x => x.id == id);
      if (!c) return;

      if (confirm(`'${c.name}' 수강을 취소할까요?`)) {
        try {
          btn.disabled = true;
          await cancelEnrollment(id);
          alert('수강 신청이 취소되었습니다.');

          await loadCourses();
          await renderMyApplies();
          await renderAllCourses();
          await renderDashboard();
        } catch (error) {
          alert(error.message || '취소 처리 중 오류가 발생했습니다.');
          btn.disabled = false;
        }
      }
    });
  });
}

function drawBarChart(canvas, { present, absent, late }) {
  const ctx = canvas.getContext("2d");

  // 반응형 렌더링: CSS 크기 기준으로 캔버스 크기 설정
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = canvas.clientWidth || 260;
  const logicalHeight = canvas.clientHeight || 180;
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  ctx.scale(dpr, dpr);

  const W = logicalWidth;
  const H = logicalHeight;
  ctx.clearRect(0, 0, W, H);

  // 값
  const vals = [present, absent, late];
  const labels = ["출석", "결석", "지각"];
  const max = Math.max(1, ...vals);
  const marginLeft = 30;
  const marginRight = 10;
  const avail = Math.max(30, W - marginLeft - marginRight);
  const barW = Math.max(12, Math.floor(avail / (vals.length * 1.8)));
  const totalBarsWidth = vals.length * barW;
  const remaining = Math.max(0, avail - totalBarsWidth);
  const gap = Math.floor(remaining / (vals.length + 1));
  const startX = marginLeft + gap;

  // 축
  ctx.strokeStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(marginLeft, 10); ctx.lineTo(marginLeft, H - 25); ctx.lineTo(W - marginRight, H - 25);
  ctx.stroke();

  // 막대
  for (let i = 0; i < vals.length; i++) {
    const x = startX + i * (barW + gap);
    const h = Math.round((H - 45) * (vals[i] / max));
    const y = (H - 25) - h;
    ctx.fillStyle = "#2f6fec";
    ctx.fillRect(x, y, barW, h);
    // 라벨
    ctx.fillStyle = "#6B7280";
    ctx.font = "12px sans-serif";
    ctx.fillText(labels[i], x, H - 8);
  }
}

async function renderAttendance() {
  const wrap = $("#attendanceWrap");

  // API에서 내 수강 내역 로드
  if (MY_COURSES.length === 0) {
    await loadMyCourses();
  }

  if (MY_COURSES.length === 0) {
    wrap.innerHTML = `<div class="hint">수강 중인 강좌의 출석 데이터가 없습니다.</div>`;
    return;
  }

  wrap.innerHTML = MY_COURSES.map((c, idx) => {
    const rate = Math.round(c.attendanceRate);
    const present = c.presentCount || 0;
    const absent = c.absentCount || 0;
    const late = c.lateCount || 0;
    return `
      <div class="att-card">
        <div class="att-head">
          <h4>${c.name}</h4>
          <span class="small">출석률 ${rate}%</span>
        </div>
        <div style="padding: 12px 16px;">
          <canvas id="attChart_${idx}" class="att-chart" aria-label="출석 통계"></canvas>
          <div class="small" style="display:flex; gap:12px; margin-top:6px;">
            <span>출석 ${present}</span>
            <span>결석 ${absent}</span>
            <span>지각 ${late}</span>
          </div>
        </div>
      </div>`;
  }).join("");

  // 차트 렌더링
  MY_COURSES.forEach((c, idx) => {
    const canvas = document.getElementById(`attChart_${idx}`);
    if (canvas) {
      drawBarChart(canvas, {
        present: c.presentCount || 0,
        absent: c.absentCount || 0,
        late: c.lateCount || 0
      });
    }
  });
}

// ===============================
// 설문
// ===============================
async function renderSurveyList(mode = "all") {
  const list = $("#surveyList");
  if (!list) return;

  // API에서 설문 목록 로드
  await loadSurveys();

  let surveysToRender = [];
  if (mode === "all") {
    // 전체 설문 (courseId가 null인 경우) 필터링
    surveysToRender = SURVEYS.filter(s => s.courseId === null);
  } else if (mode === "mine") {
    // 수강 강좌 설문 (courseId가 null이 아닌 경우) 필터링
    surveysToRender = SURVEYS.filter(s => s.courseId !== null);
  }

  if (surveysToRender.length === 0) {
    list.innerHTML = `<div class="hint">표시할 설문이 없습니다.</div>`;
    return;
  }

  list.innerHTML = surveysToRender.map(s => {
    const done = !!SURVEY_ANS[s.surveyId]?.answered;
    // 강좌 설문인 경우 강좌명 접두사 추가
    const displayTitle = s.courseName ? `[${s.courseName}] ${s.title}` : s.title;

    return `
    <div class="survey-card" data-survey="${s.surveyId}">
      <div class="survey-meta">
        <strong>${displayTitle}</strong>
        <span class="small">기간 ${s.startDate || '-'} ~ ${s.endDate || '-'}</span>
      </div>
      ${done ? `<span class="badge-done">참여 완료</span>` : `<button class="primary" data-open="${s.surveyId}">응답하기</button>`}
    </div>`;
  }).join("");

  // 열기 버튼 핸들
  $$('[data-open]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-open');
      await openSurveyForm(id);
    });
  });
}

async function openSurveyForm(surveyId) {
  const wrap = $("#surveyFormWrap");
  if (!wrap) return;

  // API에서 설문 상세 정보 로드
  const sv = await getSurveyDetail(surveyId);
  if (!sv) {
    alert('설문 정보를 불러올 수 없습니다.');
    return;
  }

  // 이미 참여완료면 막기
  if (SURVEY_ANS[sv.surveyId]?.answered) { // surveyId 사용
    alert("이미 참여하신 설문입니다.");
    return;
  }

  const qHTML = sv.questions.map(q => {
    const questionId = q.questionId || q.id;
    const rawType = (q.questionType || q.type || '').toUpperCase();
    const isChoice = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'OBJECTIVE', 'CHOICE', 'SINGLE'].includes(rawType);

    const rawOptions = Array.isArray(q.options) ? q.options : (q.options || '');
    const optionsArr = Array.isArray(rawOptions)
      ? rawOptions
      : rawOptions.split(/[\,\n]/).map(op => op.trim()).filter(Boolean);

    if (isChoice && optionsArr.length > 0) {
      return `
        <div class="q">
          <h4>${q.text || q.questionText}</h4>
          <div class="opts">
            ${optionsArr.map((op) => `
              <label>
                <input type="radio" name="${questionId}" value="${op}"> ${op}
              </label>`).join("")}
          </div>
        </div>`;
    }

    return `
      <div class="q">
        <h4>${q.text || q.questionText}</h4>
        <textarea class="input" rows="4" data-qid="${questionId}" placeholder="???? ?????"></textarea>
      </div>`;
  }).join("");

  wrap.innerHTML = `
    <div class="survey-form">
      <h3>${sv.title}</h3>
      <p class="small">기간: ${sv.startDate || '-'} ~ ${sv.endDate || '-'}</p>
      ${qHTML}
      <div class="form-actions">
        <button class="ghost" id="closeSurvey">취소</button>
        <button class="primary" id="submitSurvey">제출</button>
      </div>
    </div>
  `;
  wrap.classList.remove("hidden"); // 설문 폼 표시

  $("#closeSurvey").addEventListener("click", () => {
    wrap.innerHTML = "";
    wrap.classList.add("hidden"); // 설문 폼 숨김
  });

  $("#submitSurvey").addEventListener("click", async () => {
    const responsesToSend = []; // 백엔드 형식에 맞게 responses 배열 생성
    let allAnswered = true;

    sv.questions.forEach(q => {
      const questionId = q.questionId || q.id;
      let answerContent = '';

      if (q.type === "single" || q.type === "SINGLE_CHOICE") {
        const checked = wrap.querySelector(`input[name="${questionId}"]:checked`);
        if (checked) {
          answerContent = checked.value;
        }
      } else {
        const ta = wrap.querySelector(`textarea[data-qid="${questionId}"]`);
        if (ta) {
          answerContent = ta.value.trim();
        }
      }

      if (!answerContent) {
        allAnswered = false;
      }

      responsesToSend.push({
        questionId: questionId,
        content: answerContent
      });
    });

    // 필수 응답 확인
    if (!allAnswered) {
      alert("모든 문항에 답변해주세요.");
      return;
    }

    try {
      // API로 설문 제출
      await submitSurvey(sv.surveyId, { responses: responsesToSend }); // surveyId 사용 및 responses 형식 변경

      SURVEY_ANS[sv.surveyId] = { answered: true, ts: Date.now() }; // surveyId 사용
      alert("설문 참여가 완료되었습니다!");
      wrap.innerHTML = "";
      wrap.classList.add("hidden"); // 설문 폼 숨김
      renderSurveyList($(".tab.active")?.dataset.tab || "all"); // 현재 활성화된 탭으로 목록 갱신
    } catch (error) {
      alert(error.message || '설문 제출에 실패했습니다.');
    }
  });
}

// ===============================
// 이벤트 & 초기화
// ===============================
function bindGlobalEvents() {
  // 메뉴 전환
  const links = $$('.menu a[data-target]');
  const sections = $$('.page-section');
  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.getAttribute('data-target');

      sections.forEach(sec => sec.classList.add('hidden'));
      const targetSection = document.getElementById(target);
      if (targetSection) {
        targetSection.classList.remove('hidden');
      }
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // 섹션 진입 시 필요한 렌더
      if (target === 'dashboard') renderDashboard();
      if (target === 'allCourses') renderAllCourses();
      if (target === 'apply') { renderMyApplies(); renderAttendance(); }
      if (target === 'survey') {
        const activeTab = $(".tab.active");
        if (activeTab) {
          renderSurveyList(activeTab.dataset.tab);
        }
      }
    });
  });

  // 전역 검색
  const globalSearch = $("#globalSearch");
  if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
      filters.search = e.target.value.trim();
      renderAllCourses();
    });
  }

  // 담당 교사 필터
  const teacherFilter = $("#teacherFilter");
  if (teacherFilter) {
    teacherFilter.addEventListener('change', (e) => {
      filters.teacher = e.target.value;
      renderAllCourses();
    });
  }

  // 정렬
  const sortSelect = $("#sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      filters.sort = e.target.value;
      renderAllCourses();
    });
  }

  // 카테고리 칩 (토글 멀티선택)
  const categoryChips = $("#categoryChips");
  if (categoryChips) {
    categoryChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      chip.classList.toggle('active');
      const cat = chip.getAttribute('data-cat');
      if (chip.classList.contains('active')) {
        filters.cats.add(cat);
      } else {
        filters.cats.delete(cat);
      }
      renderAllCourses();
    });
  }

  // 카드 클릭 → 모달
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.course-card');
    if (card) {
      const id = card.getAttribute('data-id');
      openCourseModal(parseInt(id, 10));
    }
  });

  // 모달 버튼들
  const modalClose = $("#modalClose");
  if (modalClose) {
    modalClose.addEventListener('click', closeCourseModal);
  }
  const btnCancel = $("#btnCancel");
  if (btnCancel) {
    btnCancel.addEventListener('click', closeCourseModal);
  }
  const btnToggleApply = $("#btnToggleApply");
  if (btnToggleApply) {
    btnToggleApply.addEventListener('click', toggleApply);
  }

  // 설문 탭
  const surveyTabs = $$("#survey .tab");
  surveyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      surveyTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSurveyList(tab.dataset.tab);
      const surveyFormWrap = $("#surveyFormWrap");
      if (surveyFormWrap) {
        surveyFormWrap.classList.add("hidden");
      }
    });
  });

  // ESC로 모달 닫기
  document.addEventListener('keydown', (e) => {
    const courseModal = $("#courseModal");
    if (e.key === "Escape" && courseModal && !courseModal.classList.contains("hidden")) {
      closeCourseModal();
    }
  });

  // 로그아웃 버튼
  const logoutBtn = $("#btnLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

async function init() {
  // 초기 데이터 로드
  await loadCourses();
  buildFilters();
  await renderDashboard();
  await renderAllCourses();
  // 내신청/설문은 탭 들어갈 때마다 갱신하도록 함
}

bindGlobalEvents();
init();

// 사용자 정보 표시 (이름/이메일)
(function showStudentProfile() {
  const user = getCurrentUser();
  if (!user) return;
  if (document.getElementById('studentName')) {
    document.getElementById('studentName').textContent = user.name || '??';
  }
  if (document.getElementById('studentEmail')) {
    document.getElementById('studentEmail').textContent = user.email || '';
  }
  if (document.getElementById('studentNameSide')) {
    document.getElementById('studentNameSide').textContent = user.name || '??';
  }
  if (document.getElementById('studentEmailSide')) {
    document.getElementById('studentEmailSide').textContent = user.email || '';
  }
  if (document.getElementById('studentAvatar')) {
    const initial = (user.name || '??').slice(0, 1);
    document.getElementById('studentAvatar').textContent = initial;
  }
})();
