const STORAGE_KEY = 'dday-visual-tracker-v1';
const DAY_MS = 1000 * 60 * 60 * 24;

const elements = {
  goalTitle: document.querySelector('#goalTitle'),
  startDate: document.querySelector('#startDate'),
  targetDate: document.querySelector('#targetDate'),
  saveSettingsBtn: document.querySelector('#saveSettingsBtn'),
  goTodayBtn: document.querySelector('#goTodayBtn'),
  resetChecksBtn: document.querySelector('#resetChecksBtn'),
  validationMessage: document.querySelector('#validationMessage'),
  todayDday: document.querySelector('#todayDday'),
  todaySummaryText: document.querySelector('#todaySummaryText'),
  remainingDays: document.querySelector('#remainingDays'),
  remainingSummaryText: document.querySelector('#remainingSummaryText'),
  progressRate: document.querySelector('#progressRate'),
  progressSummaryText: document.querySelector('#progressSummaryText'),
  checkedCount: document.querySelector('#checkedCount'),
  checkedSummaryText: document.querySelector('#checkedSummaryText'),
  calendarTitle: document.querySelector('#calendarTitle'),
  monthSummary: document.querySelector('#monthSummary'),
  calendarGrid: document.querySelector('#calendarGrid'),
  selectedDayCard: document.querySelector('#selectedDayCard'),
  prevMonthBtn: document.querySelector('#prevMonthBtn'),
  nextMonthBtn: document.querySelector('#nextMonthBtn'),
  currentMonthBtn: document.querySelector('#currentMonthBtn'),
};

let state = loadState();

init();

function init() {
  syncFormWithState();
  bindEvents();
  render();
}

function bindEvents() {
  elements.saveSettingsBtn.addEventListener('click', handleSaveSettings);
  elements.goTodayBtn.addEventListener('click', jumpToCurrentMonth);
  elements.currentMonthBtn.addEventListener('click', jumpToCurrentMonth);
  elements.resetChecksBtn.addEventListener('click', resetChecks);
  elements.prevMonthBtn.addEventListener('click', () => moveMonth(-1));
  elements.nextMonthBtn.addEventListener('click', () => moveMonth(1));

  ['change', 'keydown'].forEach((eventName) => {
    elements.goalTitle.addEventListener(eventName, (event) => {
      if (eventName === 'keydown' && event.key !== 'Enter') return;
      handleSaveSettings();
    });
    elements.startDate.addEventListener(eventName, (event) => {
      if (eventName === 'keydown' && event.key !== 'Enter') return;
      handleSaveSettings();
    });
    elements.targetDate.addEventListener(eventName, (event) => {
      if (eventName === 'keydown' && event.key !== 'Enter') return;
      handleSaveSettings();
    });
  });

  elements.calendarGrid.addEventListener('click', (event) => {
    const toggleButton = event.target.closest('[data-action="toggle-check"]');
    if (toggleButton) {
      toggleChecked(toggleButton.dataset.date);
      return;
    }

    const dayCard = event.target.closest('.day-cell[data-date]');
    if (dayCard) {
      selectDate(dayCard.dataset.date);
    }
  });

  elements.selectedDayCard.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="toggle-selected"]');
    if (button) {
      toggleChecked(button.dataset.date);
    }
  });
}

function handleSaveSettings() {
  const draft = {
    goalTitle: (elements.goalTitle.value || '').trim() || '나의 목표',
    startDate: elements.startDate.value,
    targetDate: elements.targetDate.value,
  };

  if (!draft.startDate || !draft.targetDate) {
    setMessage('시작일과 D-day를 모두 입력해 주세요.', 'error');
    return;
  }

  if (!isDateOrderValid(draft.startDate, draft.targetDate)) {
    setMessage('시작일은 D-day보다 늦을 수 없습니다.', 'error');
    return;
  }

  state.goalTitle = draft.goalTitle;
  state.startDate = draft.startDate;
  state.targetDate = draft.targetDate;

  const today = startOfToday();
  const currentMonthDate = parseDateKey(`${state.viewYear}-${String(state.viewMonth + 1).padStart(2, '0')}-01`);
  if (!currentMonthDate) {
    state.viewYear = today.getFullYear();
    state.viewMonth = today.getMonth();
  }

  if (!state.selectedDate) {
    state.selectedDate = formatDate(today);
  }

  saveState();
  setMessage('설정이 저장되었습니다.', 'success');
  render();
}

function jumpToCurrentMonth() {
  const today = startOfToday();
  state.viewYear = today.getFullYear();
  state.viewMonth = today.getMonth();
  state.selectedDate = formatDate(today);
  saveState();
  render();
}

function moveMonth(offset) {
  const nextDate = new Date(state.viewYear, state.viewMonth + offset, 1);
  state.viewYear = nextDate.getFullYear();
  state.viewMonth = nextDate.getMonth();
  saveState();
  renderCalendar();
}

function resetChecks() {
  const ok = window.confirm('지금까지 기록한 X 표시를 모두 초기화할까요?');
  if (!ok) return;

  state.checkedDates = {};
  saveState();
  setMessage('X 기록을 초기화했습니다.', 'success');
  render();
}

function selectDate(dateKey) {
  state.selectedDate = dateKey;
  saveState();
  renderCalendar();
  renderSelectedDay();
}

function toggleChecked(dateKey) {
  const config = getConfig();
  if (!config.isValid) {
    setMessage('먼저 시작일과 D-day를 올바르게 설정해 주세요.', 'error');
    return;
  }

  const date = parseDateKey(dateKey);
  if (!isWithinRange(date, config.startDate, config.targetDate)) {
    setMessage('선택한 날짜는 목표 기간 밖이라 X 표시를 남길 수 없습니다.', 'error');
    return;
  }

  state.selectedDate = dateKey;

  if (state.checkedDates[dateKey]) {
    delete state.checkedDates[dateKey];
    setMessage(`${formatDisplayDate(date)}의 X 표시를 취소했습니다.`, 'success');
  } else {
    state.checkedDates[dateKey] = true;
    setMessage(`${formatDisplayDate(date)}에 X 표시를 남겼습니다.`, 'success');
  }

  saveState();
  render();
}

function render() {
  renderSummary();
  renderCalendar();
  renderSelectedDay();
}

function renderSummary() {
  const config = getConfig();
  const today = startOfToday();

  if (!config.isValid) {
    elements.todayDday.textContent = '-';
    elements.todaySummaryText.textContent = '시작일과 D-day를 모두 올바르게 입력해 주세요.';
    elements.remainingDays.textContent = '-';
    elements.remainingSummaryText.textContent = '기간 계산 대기 중';
    elements.progressRate.textContent = '-';
    elements.progressSummaryText.textContent = '체크율을 계산할 수 없습니다.';
    elements.checkedCount.textContent = '-';
    elements.checkedSummaryText.textContent = '총 기간 대비 체크 현황';
    return;
  }

  const diffToTarget = differenceInDays(config.targetDate, today);
  const totalDays = differenceInDays(config.targetDate, config.startDate) + 1;
  const effectiveEnd = compareDates(today, config.targetDate) <= 0 ? today : config.targetDate;
  const elapsedDays = compareDates(today, config.startDate) < 0
    ? 0
    : differenceInDays(effectiveEnd, config.startDate) + 1;

  const checkedElapsed = countCheckedDatesBetween(config.startDate, effectiveEnd);
  const checkedTotal = countCheckedDatesBetween(config.startDate, config.targetDate);
  const progressPercent = elapsedDays > 0 ? Math.round((checkedElapsed / elapsedDays) * 100) : 0;

  elements.todayDday.textContent = formatDday(config.targetDate, today);
  elements.todaySummaryText.textContent = `${state.goalTitle} · ${formatDisplayDate(config.targetDate)} 기준`;

  if (diffToTarget > 0) {
    elements.remainingDays.textContent = `${diffToTarget}일`;
    elements.remainingSummaryText.textContent = `목표일까지 ${diffToTarget}일 남았습니다.`;
  } else if (diffToTarget === 0) {
    elements.remainingDays.textContent = '오늘';
    elements.remainingSummaryText.textContent = '오늘이 바로 D-day입니다.';
  } else {
    elements.remainingDays.textContent = `${Math.abs(diffToTarget)}일`;
    elements.remainingSummaryText.textContent = `D-day가 ${Math.abs(diffToTarget)}일 지났습니다.`;
  }

  elements.progressRate.textContent = `${progressPercent}%`;
  elements.progressSummaryText.textContent = elapsedDays > 0
    ? `경과 ${elapsedDays}일 중 ${checkedElapsed}일을 X 표시했습니다.`
    : '시작일 이전이라 진행률이 아직 계산되지 않습니다.';

  elements.checkedCount.textContent = `${checkedTotal}/${totalDays}`;
  elements.checkedSummaryText.textContent = `전체 기간 ${totalDays}일 중 ${checkedTotal}일 체크 완료`;
}

function renderCalendar() {
  const monthDate = new Date(state.viewYear, state.viewMonth, 1);
  elements.calendarTitle.textContent = `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`;

  const config = getConfig();
  const monthStats = getMonthStats(state.viewYear, state.viewMonth, config);
  elements.monthSummary.textContent = config.isValid
    ? `${monthStats.availableDays}일 중 ${monthStats.checkedDays}일에 X 표시 · 월 체크율 ${monthStats.progressRate}%`
    : '올바른 목표 기간을 설정하면 월별 진행률이 표시됩니다.';

  const firstDayIndex = monthDate.getDay();
  const lastDate = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();

  const cells = [];
  for (let index = 0; index < firstDayIndex; index += 1) {
    cells.push('<div class="day-cell--empty" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const currentDate = new Date(state.viewYear, state.viewMonth, day);
    const dateKey = formatDate(currentDate);
    const today = startOfToday();
    const isToday = isSameDate(currentDate, today);
    const isTarget = config.isValid && isSameDate(currentDate, config.targetDate);
    const isSelected = state.selectedDate === dateKey;
    const isChecked = Boolean(state.checkedDates[dateKey]);
    const inRange = config.isValid && isWithinRange(currentDate, config.startDate, config.targetDate);
    const isFuture = compareDates(currentDate, today) > 0;

    const classes = [
      'day-cell',
      isToday ? 'day-cell--today' : '',
      isTarget ? 'day-cell--target' : '',
      isSelected ? 'day-cell--selected' : '',
      isChecked ? 'day-cell--checked' : '',
      !inRange && config.isValid ? 'day-cell--disabled' : '',
    ].filter(Boolean).join(' ');

    const ddayText = config.isValid ? formatDday(config.targetDate, currentDate) : '설정 필요';
    const caption = !config.isValid
      ? '기간을 설정하면 날짜별 D-day가 표시됩니다.'
      : inRange
        ? (isFuture ? '예정된 체크 날짜' : '진행 기록 가능')
        : '목표 기간 밖 날짜';

    const badges = [
      isToday ? '<span class="badge badge--today">오늘</span>' : '',
      isTarget ? '<span class="badge badge--target">D-day</span>' : '',
      isChecked ? '<span class="badge badge--checked">X 완료</span>' : '',
      !isChecked && inRange ? `<span class="badge badge--pending">${isFuture ? '예정' : '미체크'}</span>` : '',
      !inRange && config.isValid ? '<span class="badge badge--disabled">범위 밖</span>' : '',
    ].filter(Boolean).join('');

    const buttonLabel = isChecked ? 'X 취소' : 'X 표시';
    const buttonClass = isChecked ? 'day-select day-select--checked' : 'day-select';

    cells.push(`
      <article class="${classes}" data-date="${dateKey}" role="gridcell" aria-selected="${isSelected}">
        <div class="day-top">
          <strong class="day-number">${day}</strong>
          <span class="day-dday ${!config.isValid || !inRange ? 'day-dday--inactive' : ''}">${ddayText}</span>
        </div>
        <div class="day-badges">${badges}</div>
        <p class="day-caption">${caption}</p>
        <button
          class="${buttonClass}"
          type="button"
          data-action="toggle-check"
          data-date="${dateKey}"
          ${!inRange ? 'disabled' : ''}
        >${buttonLabel}</button>
      </article>
    `);
  }

  elements.calendarGrid.innerHTML = cells.join('');
}

function renderSelectedDay() {
  const config = getConfig();
  const selectedDate = parseDateKey(state.selectedDate) || startOfToday();
  const dateKey = formatDate(selectedDate);
  const isChecked = Boolean(state.checkedDates[dateKey]);
  const inRange = config.isValid && isWithinRange(selectedDate, config.startDate, config.targetDate);
  const today = startOfToday();
  const offsetFromToday = differenceInDays(selectedDate, today);
  const daysFromStart = config.isValid && compareDates(selectedDate, config.startDate) >= 0
    ? differenceInDays(selectedDate, config.startDate) + 1
    : null;

  const ddayText = config.isValid ? formatDday(config.targetDate, selectedDate) : '설정 필요';
  const relativeText = offsetFromToday === 0
    ? '오늘 날짜입니다.'
    : offsetFromToday > 0
      ? `오늘보다 ${offsetFromToday}일 뒤의 날짜입니다.`
      : `오늘보다 ${Math.abs(offsetFromToday)}일 전의 날짜입니다.`;

  const toggleDisabled = !inRange;
  const toggleLabel = isChecked ? '선택한 날짜 X 취소' : '선택한 날짜 X 표시';

  elements.selectedDayCard.innerHTML = `
    <p class="selected-day-card__date">${formatDisplayDate(selectedDate)}</p>
    <p class="selected-day-card__dday">${ddayText}</p>

    <div class="selected-day-card__meta">
      ${config.isValid && isSameDate(selectedDate, config.targetDate) ? '<span class="badge badge--target">D-day</span>' : ''}
      ${isSameDate(selectedDate, today) ? '<span class="badge badge--today">오늘</span>' : ''}
      ${isChecked ? '<span class="badge badge--checked">X 완료</span>' : '<span class="badge badge--pending">미체크</span>'}
      ${!inRange && config.isValid ? '<span class="badge badge--disabled">목표 기간 밖</span>' : ''}
    </div>

    <p class="selected-day-card__desc">
      ${relativeText}<br />
      ${config.isValid
        ? `${state.goalTitle} 기준 ${inRange ? '목표 기간 안의 날짜입니다.' : '목표 기간 밖의 날짜입니다.'}`
        : '먼저 시작일과 D-day를 설정해 주세요.'}
    </p>

    <div class="selected-day-card__stats">
      <div class="stat-box">
        <span>진행 차수</span>
        <strong>${daysFromStart && inRange ? `${daysFromStart}일차` : '-'}</strong>
      </div>
      <div class="stat-box">
        <span>상태</span>
        <strong>${isChecked ? 'X 완료' : '미체크'}</strong>
      </div>
      <div class="stat-box">
        <span>목표명</span>
        <strong>${escapeHtml(state.goalTitle)}</strong>
      </div>
    </div>

    <button
      class="${isChecked ? 'selected-day-card__action selected-day-card__action--checked' : 'selected-day-card__action'}"
      type="button"
      data-action="toggle-selected"
      data-date="${dateKey}"
      ${toggleDisabled ? 'disabled' : ''}
    >${toggleDisabled ? '목표 기간 밖이라 체크 불가' : toggleLabel}</button>
  `;
}

function getMonthStats(year, month, config) {
  if (!config.isValid) {
    return { availableDays: 0, checkedDays: 0, progressRate: 0 };
  }

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let availableDays = 0;
  let checkedDays = 0;

  for (let day = 1; day <= last.getDate(); day += 1) {
    const current = new Date(year, month, day);
    if (isWithinRange(current, config.startDate, config.targetDate)) {
      availableDays += 1;
      if (state.checkedDates[formatDate(current)]) {
        checkedDays += 1;
      }
    }
  }

  return {
    availableDays,
    checkedDays,
    progressRate: availableDays > 0 ? Math.round((checkedDays / availableDays) * 100) : 0,
  };
}

function countCheckedDatesBetween(startDate, endDate) {
  if (!startDate || !endDate || compareDates(startDate, endDate) > 0) {
    return 0;
  }

  return Object.keys(state.checkedDates).filter((dateKey) => {
    const current = parseDateKey(dateKey);
    return current && isWithinRange(current, startDate, endDate);
  }).length;
}

function getConfig() {
  const startDate = parseDateKey(state.startDate);
  const targetDate = parseDateKey(state.targetDate);
  const isValid = Boolean(startDate && targetDate && compareDates(startDate, targetDate) <= 0);
  return { startDate, targetDate, isValid };
}

function syncFormWithState() {
  elements.goalTitle.value = state.goalTitle;
  elements.startDate.value = state.startDate;
  elements.targetDate.value = state.targetDate;
}

function setMessage(message, type = 'success') {
  elements.validationMessage.textContent = message;
  elements.validationMessage.className = `message message--${type}`;
}

function loadState() {
  const today = startOfToday();
  const defaultTarget = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 60);
  const defaults = {
    goalTitle: '나의 목표',
    startDate: formatDate(today),
    targetDate: formatDate(defaultTarget),
    checkedDates: {},
    viewYear: today.getFullYear(),
    viewMonth: today.getMonth(),
    selectedDate: formatDate(today),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const saved = JSON.parse(raw);
    return {
      ...defaults,
      ...saved,
      checkedDates: saved.checkedDates && typeof saved.checkedDates === 'object' ? saved.checkedDates : {},
    };
  } catch (error) {
    console.error('저장된 데이터를 불러오지 못했습니다.', error);
    return defaults;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function parseDateKey(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function compareDates(a, b) {
  return getUtcTime(a) - getUtcTime(b);
}

function getUtcTime(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function differenceInDays(laterDate, earlierDate) {
  return Math.round((getUtcTime(laterDate) - getUtcTime(earlierDate)) / DAY_MS);
}

function formatDday(targetDate, currentDate) {
  const diff = differenceInDays(targetDate, currentDate);
  if (diff === 0) return 'D-DAY';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function isDateOrderValid(startDateKey, targetDateKey) {
  const startDate = parseDateKey(startDateKey);
  const targetDate = parseDateKey(targetDateKey);
  return Boolean(startDate && targetDate && compareDates(startDate, targetDate) <= 0);
}

function isWithinRange(date, rangeStart, rangeEnd) {
  return compareDates(date, rangeStart) >= 0 && compareDates(date, rangeEnd) <= 0;
}

function isSameDate(a, b) {
  return compareDates(a, b) === 0;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
