function getDdayColor(daysLeft) {

  if (daysLeft > 7) {
    return "#111111";
  }

  if (daysLeft <= 0) {
    return "#cc0000";
  }

  const ratio = (7 - daysLeft) / 7;

  const start = [17, 17, 17];
  const end = [204, 0, 0];

  const r = Math.round(start[0] + (end[0] - start[0]) * ratio);
  const g = Math.round(start[1] + (end[1] - start[1]) * ratio);
  const b = Math.round(start[2] + (end[2] - start[2]) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}
const calendarGrid = document.querySelector("#calendarGrid");
const calendarPanel = document.querySelector(".calendar-panel");
const calendarTaskPanel = document.querySelector(".calendar-task-panel");
const calendarJournalPanel = document.querySelector("#calendarJournalPanel");
const postponeGuide = document.querySelector("#postponeGuide");
const currentMonthLabel = document.querySelector("#currentMonth");
const selectedDateLabel = document.querySelector("#selectedDateLabel");
const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoCount = document.querySelector("#todoCount");
const emptyState = document.querySelector("#emptyState");
const todoSectionTitle = document.querySelector(".todo-list-section .section-title h3");
const sunflowerMessage = document.querySelector("#sunflowerMessage");
const sunflowerGarden = document.querySelector("#sunflowerGarden");
const fertGauge = document.querySelector("#fertGauge");
const ownedSunflowerCount = document.querySelector("#ownedSunflowerCount");
const todoListUrgent = document.querySelector("#todoListUrgent");
const todoModal = document.querySelector("#todoModal");
const pastIncompleteTodoModal = document.querySelector("#pastIncompleteTodoModal");
const pastIncompletePostponeBtn = document.querySelector("#pastIncompletePostponeBtn");
const modalTitle = document.querySelector("#modalTitle");
const modalTextInput = document.querySelector("#modalTextInput");
const modalDateInput = document.querySelector("#modalDateInput");
const modalPriority = document.querySelector("#modalPriority");
const modalCategory = document.querySelector("#modalCategory");
const modalSaveBtn = document.querySelector("#modalSaveBtn");
const modalCancelBtn = document.querySelector("#modalCancelBtn");
const selectedPriorityInput = document.querySelector("#selectedPriority");
const todoListHigh = document.querySelector("#todoListHigh");
const todoListMedium = document.querySelector("#todoListMedium");
const todoListLow = document.querySelector("#todoListLow");
const priorityGroupsContainer = document.querySelector("#priorityGroupsContainer");
const ddayList = document.querySelector("#ddayList");
let ddays = JSON.parse(localStorage.getItem("spicyyeol.ddays") || "[]");

const sfCanvas = createSunflowerCanvas(SunflowerState.stageIdx, SunflowerState.moodIdx, 150);
sunflowerGarden.appendChild(sfCanvas);
SunflowerPanel.init();

const STORAGE_KEY = "spicyyeol.todosByDate";
const JOURNAL_STORAGE_KEY = "spicyyeol.journalsByDate";
const SUNFLOWER_DATES_STORAGE_KEY = "spicyyeol.sunflowersByDate";
const today = new Date();
const todayKey = toDateKey(today);
let visibleDate = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDateKey = todayKey;
let todosByDate = loadTodos();
let journalsByDate = loadJournals();
let sunflowersByDate = loadSunflowers();
let pendingPostponeTodo = null;
let isSunflowerPlacementMode = false;
let isJournalEditing = false;
let journalMessage = "";
let editingTodoId = null;
let editingDateKey = null;
const TRASH_STORAGE_KEY = "spicyyeol.deletedTodos";
let deletedTodos = loadDeletedTodos();
const JOURNAL_TRASH_KEY = "spicyyeol.deletedJournals";
let deletedJournals = loadDeletedJournals();

const categoryMap = {
  study: "학업",
  personal: "개인",
  team: "팀플",
  work: "업무"
};

// 🌟 탭 요소 및 현재 상태 변수
const filterTabsContainer = document.querySelector("#filterTabs");
let currentFilter = "all";

// 🌟 탭 클릭 시 리스트 다시 그리기
filterTabsContainer.addEventListener("click", (e) => {
  if (!e.target.classList.contains("filter-tab")) return;
  document.querySelectorAll(".filter-tab").forEach(tab => tab.classList.remove("active"));
  e.target.classList.add("active");
  currentFilter = e.target.dataset.filter;
  renderTodoList();
});

// 팝업 닫기
modalCancelBtn.addEventListener("click", () => todoModal.style.display = "none");

if (pastIncompletePostponeBtn) {
  pastIncompletePostponeBtn.addEventListener("click", () => {
    postponePastIncompleteTodosToToday();
  });
}

// 팝업 저장 (추가/수정 공통)
modalSaveBtn.addEventListener("click", () => {
  const text = modalTextInput.value.trim();
  if (!text) {
    modalTextInput.focus();
    return;
  }

  const targetDateKey = modalDateInput.value || editingDateKey || selectedDateKey;
  if (!targetDateKey) return;

  if (editingTodoId) { // 수정일 때
    const sourceDateKey = editingDateKey || selectedDateKey;
    const todoToEdit = getTodosForDate(sourceDateKey).find(t => t.id === editingTodoId);
    if (!todoToEdit) return;

    const updatedTodo = {
      ...todoToEdit,
      text,
      priority: modalPriority.value,
      category: modalCategory.value
    };

    if (sourceDateKey === targetDateKey) {
      todosByDate[targetDateKey] = getTodosForDate(targetDateKey).map(t =>
        t.id === editingTodoId ? updatedTodo : t
      );
    } else {
      todosByDate[sourceDateKey] = getTodosForDate(sourceDateKey).filter(t => t.id !== editingTodoId);
      if (todosByDate[sourceDateKey].length === 0) {
        delete todosByDate[sourceDateKey];
      }
      todosByDate[targetDateKey] = [...getTodosForDate(targetDateKey), updatedTodo];
    }
  } else { // 새로 추가할 때
    const newTodo = {
      id: crypto.randomUUID(), text, completed: false,
      status: "pending",
      priority: modalPriority.value, category: modalCategory.value
    };
    todosByDate[targetDateKey] = [...getTodosForDate(targetDateKey), newTodo];
  }

  todoModal.style.display = "none";
  todoInput.value = "";
  selectedDateKey = targetDateKey;
  const targetDate = fromDateKey(targetDateKey);
  visibleDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  editingTodoId = null;
  editingDateKey = null;
  saveTodos(); renderCalendar(); renderTodoList();
});

function updateCalendarTaskPanelPosition() {
  if (!calendarPanel || !calendarTaskPanel) return;

  const panelRect = calendarPanel.getBoundingClientRect();
  const panelStyle = getComputedStyle(calendarPanel);
  const leftInset = parseFloat(panelStyle.paddingLeft) || 0;
  const rightInset = parseFloat(panelStyle.paddingRight) || 0;
  const edgeInset = parseFloat(panelStyle.getPropertyValue("--calendar-task-edge")) || leftInset;
  const fixedBottom = window.innerHeight - 24;
  const calendarBottom = panelRect.bottom - edgeInset;

  calendarTaskPanel.style.setProperty("--calendar-task-left", `${panelRect.left + leftInset}px`);
  calendarTaskPanel.style.setProperty("--calendar-task-width", `${panelRect.width - leftInset - rightInset}px`);
  calendarTaskPanel.classList.toggle("is-anchored-to-calendar-end", fixedBottom > calendarBottom);
}

window.addEventListener("scroll", updateCalendarTaskPanelPosition, { passive: true });
window.addEventListener("resize", updateCalendarTaskPanelPosition);

function renderOwnedSunflowerCount() {
  if (!ownedSunflowerCount) return;
  ownedSunflowerCount.textContent = `해바라기: ${SunflowerState.ownedCount}개`;
}

window.addEventListener("sunflower-owned-count-change", renderOwnedSunflowerCount);

function spendOwnedSunflower() {
  if (SunflowerState.ownedCount <= 0) return false;

  SunflowerState.ownedCount -= 1;
  localStorage.setItem("sf.ownedCount", SunflowerState.ownedCount);
  window.dispatchEvent(new CustomEvent("sunflower-owned-count-change", {
    detail: { ownedCount: SunflowerState.ownedCount },
  }));
  SunflowerPanel.refresh();
  SunflowerNavIcon.refresh();
  return true;
}

function placeSunflowerOnDate(dateKey) {
  if (sunflowersByDate[dateKey]) {
    alert("이미 해바라기가 붙어 있는 날짜입니다.");
    return false;
  }

  if (!spendOwnedSunflower()) {
    alert("보유한 해바라기가 없습니다.");
    return false;
  }

  sunflowersByDate[dateKey] = true;
  saveSunflowers();
  return true;
}



document.querySelector("#prevMonth").addEventListener("click", () => {
  visibleDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth() - 1, 1);
  renderCalendar();
});

document.querySelector("#nextMonth").addEventListener("click", () => {
  visibleDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 1);
  renderCalendar();
});

calendarTaskPanel.addEventListener("click", (event) => {
  const sunflowerButton = event.target.closest("[data-action='place-sunflower']");
  if (sunflowerButton) {
    isSunflowerPlacementMode = !isSunflowerPlacementMode;
    pendingPostponeTodo = null;
    renderCalendar();
    return;
  }

  const deleteJournalButton = event.target.closest("[data-journal-action='delete']");
  if (deleteJournalButton) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const journalToDelete = journalsByDate[selectedDateKey];
    if (journalToDelete) {
      const journal = typeof journalToDelete === "string"
        ? { title: "일기", text: journalToDelete }
        : journalToDelete;
      deletedJournals.unshift({
        ...journal,
        dateKey: selectedDateKey,
        deletedAt: new Date().toISOString()
    });
    saveDeletedJournals();
  }

    delete journalsByDate[selectedDateKey];
    isJournalEditing = false;
    journalMessage = "";
    saveJournals();
    renderCalendar();
    renderJournalPanel();
    return;
}

  if (!event.target.closest(".journal-button")) return;

  if (!canWriteJournalForSelectedDate()) {
    isJournalEditing = false;
    journalMessage = "\ubbf8\ub798 \ub0a0\uc9dc\uc5d0\ub294 \uc77c\uae30\ub97c \uc791\uc131\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.";
    renderJournalPanel();
    return;
  }

  isJournalEditing = true;
  journalMessage = "";
  renderJournalPanel();
  const journalInput = calendarJournalPanel.querySelector("#journalInput");
  if (journalInput) {
    journalInput.focus();
  }
});


todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();

  editingTodoId = null;
  editingDateKey = null;
  modalTitle.textContent = "일정 추가";
  modalTextInput.value = text;
  modalDateInput.value = selectedDateKey;
  modalPriority.value = "medium";
  modalCategory.value = "personal";

  todoModal.style.display = "flex";
  modalTextInput.focus();
});

// 일기 렌더링(제목 입력 & 수정 버튼) 로직 변경
function renderJournalPanel() {
  const rawJournal = journalsByDate[selectedDateKey];
  // 과거 데이터 호환성 유지 (문자열이면 객체로 변환)
  const savedJournal = typeof rawJournal === "string" ? { title: "일기", text: rawJournal } : rawJournal || null;

  calendarJournalPanel.innerHTML = "";

  if (!isJournalEditing && !journalMessage && !savedJournal) {
    return;
  }

  const panelContent = document.createElement("div");
  panelContent.className = "journal-panel-content";

  if (isJournalEditing) {
    const titleInput = document.createElement("input");
    titleInput.id = "journalTitleInput";
    titleInput.className = "journal-title-input";
    titleInput.placeholder = "일기 제목을 작성해주세요.";
    titleInput.value = savedJournal ? savedJournal.title : "";

    const textarea = document.createElement("textarea");
    textarea.id = "journalInput";
    textarea.className = "journal-input";
    textarea.value = savedJournal ? savedJournal.text : "";
    textarea.placeholder = "오늘의 일기를 적어보세요.";

    const actions = document.createElement("div");
    actions.className = "journal-actions";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "journal-save-button";
    saveButton.dataset.journalAction = "save";
    saveButton.textContent = "저장";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "journal-cancel-button";
    cancelButton.dataset.journalAction = "cancel";
    cancelButton.textContent = "취소";

    actions.append(saveButton, cancelButton);
    panelContent.append(titleInput, textarea, actions);
  } else {
    if (journalMessage) {
      const message = document.createElement("p");
      message.className = "journal-message";
      message.textContent = journalMessage;
      panelContent.appendChild(message);
    }

    if (savedJournal) {
      const journalView = document.createElement("article");
      journalView.className = "journal-view";

      const titleRow = document.createElement("div");
      titleRow.className = "journal-title-row";

      const title = document.createElement("strong");
      title.textContent = savedJournal.title;

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "journal-edit-btn";
      editBtn.title = "일기 수정"; //  마우스 오버 툴팁
      editBtn.textContent = "✏️";
      editBtn.dataset.journalAction = "edit";

      titleRow.append(title, editBtn);

      const body = document.createElement("p");
      body.textContent = savedJournal.text;

      journalView.append(titleRow, body);
      panelContent.appendChild(journalView);
    }
  }

  calendarJournalPanel.appendChild(panelContent);
}

// 일기 패널 내 클릭 이벤트 (저장/취소/수정)
calendarJournalPanel.addEventListener("click", (event) => {
  const journalActionButton = event.target.closest("[data-journal-action]");
  if (!journalActionButton) return;

  const action = journalActionButton.dataset.journalAction;

  if (action === "edit") {
    isJournalEditing = true;
    renderJournalPanel();
    return;
  }

  if (action === "cancel") {
    isJournalEditing = false;
    journalMessage = "";
    renderJournalPanel();
    return;
  }

  if (action === "save") {
    const titleInput = calendarJournalPanel.querySelector("#journalTitleInput");
    const journalInput = calendarJournalPanel.querySelector("#journalInput");

    const titleText = titleInput ? titleInput.value.trim() : "";
    const journalText = journalInput ? journalInput.value.trim() : "";

    if (journalText) {
      journalsByDate[selectedDateKey] = {
        title: titleText || "제목 없음",
        text: journalText
      };
      journalMessage = "";
    } else {
      delete journalsByDate[selectedDateKey];
      journalMessage = "빈 일기는 저장하지 않았습니다.";
    }

    isJournalEditing = false;
    saveJournals();
    renderCalendar();
    renderJournalPanel();
  }
});

priorityGroupsContainer.addEventListener("change", (event) => {
  if (!event.target.matches("[data-action='toggle']")) return;

  const todoId = event.target.dataset.id;
  const todoDateKey = event.target.dataset.dateKey || selectedDateKey;

  // 🌟 핵심: 체크박스 체크 여부에 따라 completed와 status를 동시에 업데이트
  const isChecked = event.target.checked;

  todosByDate[todoDateKey] = getTodosForDate(todoDateKey).map((todo) => {
    if (todo.id !== todoId) return todo;

    return {
      ...todo,
      completed: isChecked,
      status: isChecked ? "completed" : "pending" // 완료면 completed, 아니면 pending으로 복구
    };
  });

  const todo = getTodosForDate(todoDateKey).find(t => t.id === todoId);

  // 비료 주기 로직 (기존 유지)
  if (isChecked && !todo.fertGiven) {
    const daysLeft = calculateDaysLeftFromToday(todoDateKey);
    SunflowerState.onTaskComplete(daysLeft, Boolean(todo.wasProcrastinated));
    todosByDate[todoDateKey] = getTodosForDate(todoDateKey).map(t =>
      t.id === todoId ? { ...t, fertGiven: true } : t
    );
  }

  saveTodos();
  renderCalendar();
  renderTodoList();
});

priorityGroupsContainer.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;
  const todoId = actionButton.dataset.id;
  const todoDateKey = actionButton.dataset.dateKey || selectedDateKey;

  // 1️⃣ 미루기 버튼 처리
  if (action === "postpone") {
    const todo = getTodosForDate(todoDateKey).find(t => t.id === todoId);
    if (!canPostponeTodo(todo, todoDateKey)) {
      pendingPostponeTodo = null;
      renderCalendar();
      renderTodoList();
      return;
    }

    const postponeTodo = { id: todoId, dateKey: todoDateKey };
    const isSamePostponeTodo =
      Boolean(pendingPostponeTodo) &&
      pendingPostponeTodo.id === postponeTodo.id &&
      pendingPostponeTodo.dateKey === postponeTodo.dateKey;

    pendingPostponeTodo = isSamePostponeTodo ? null : postponeTodo;
    renderCalendar();
    renderTodoList();
    return;
  }

  // 2️⃣ 삭제(X) 버튼 처리
  if (action === "delete") {
    const todoToDelete = getTodosForDate(todoDateKey).find(t => t.id === todoId);
    if (todoToDelete) {
        deletedTodos.unshift({ ...todoToDelete, dateKey: todoDateKey, deletedAt: new Date().toISOString() });
        saveDeletedTodos();
    }
    todosByDate[todoDateKey] = getTodosForDate(todoDateKey).filter((todo) => todo.id !== todoId);
    if (todosByDate[todoDateKey].length === 0) {
        delete todosByDate[todoDateKey];
    }
    saveTodos(); renderCalendar(); renderTodoList();
    return;

  }

  // 3️⃣ 수정(✏️) 버튼 처리
  if (action === "edit") {
    const todo = getTodosForDate(todoDateKey).find(t => t.id === todoId);
    if (todo) {
      editingTodoId = todo.id;
      editingDateKey = todoDateKey;
      modalTitle.textContent = "일정 수정";
      modalTextInput.value = todo.text;
      modalDateInput.value = todoDateKey;
      modalPriority.value = todo.priority || "medium";
      modalCategory.value = todo.category || "personal";
      todoModal.style.display = "flex";
    }
    return;
  }

  // 4️⃣ 상태 뱃지(진행전/진행중) 버튼 처리 🌟
  if (action === "toggle-status") {
    const todo = getTodosForDate(todoDateKey).find(t => t.id === todoId);
    if (todo) {
      todo.status = todo.status === "in-progress" ? "pending" : "in-progress";
      saveTodos();
      renderTodoList();
    }
    return;
  }
});

function loadDeletedTodos() {
  try {
    const saved = localStorage.getItem(TRASH_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveDeletedTodos() {
  localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(deletedTodos));
}

function loadDeletedJournals() {
  try {
    const saved = localStorage.getItem(JOURNAL_TRASH_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveDeletedJournals() {
  localStorage.setItem(JOURNAL_TRASH_KEY, JSON.stringify(deletedJournals));
}

function openTrashModal() {
  const modal = document.querySelector("#trashModal");
  const list = document.querySelector("#trashList");
  const empty = document.querySelector("#trashEmpty");
  list.innerHTML = "";

  if (deletedTodos.length === 0) {
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
    deletedTodos.forEach((todo, idx) => {
      const li = document.createElement("li");
      li.className = "trash-item";

      const info = document.createElement("div");
      info.className = "trash-info";

      const name = document.createElement("span");
      name.className = "trash-text";
      name.textContent = todo.text;

      const date = document.createElement("span");
      date.className = "trash-date";
      date.textContent = `${todo.dateKey} 삭제됨`;

      info.append(name, date);

      const restoreBtn = document.createElement("button");
      restoreBtn.type = "button";
      restoreBtn.className = "restore-btn";
      restoreBtn.textContent = "복원";
      restoreBtn.addEventListener("click", () => {
        todosByDate[todo.dateKey] = [...getTodosForDate(todo.dateKey), {
          id: crypto.randomUUID(),
          text: todo.text,
          completed: todo.completed || false,       // 🌟 삭제 전 완료 여부 복구
          status: todo.status || "pending",         // 🌟 삭제 전 상태(진행전/중/완료) 복구
          priority: todo.priority || "medium",
          category: todo.category || "personal",
          fertGiven: todo.fertGiven,                // 비료 지급 여부 복구
          wasProcrastinated: todo.wasProcrastinated // 미루기 여부 복구
        }];
        deletedTodos.splice(idx, 1);
        saveTodos();
        saveDeletedTodos();
        renderCalendar();
        renderTodoList();
        openTrashModal();
      });

      li.append(info, restoreBtn);
      list.appendChild(li);
    });
  }
  modal.style.display = "flex";
}

document.querySelector("#trashBtn").addEventListener("click", openTrashModal);
document.querySelector("#trashCloseBtn").addEventListener("click", () => {
  document.querySelector("#trashModal").style.display = "none";
});

function renderCalendar() {
  if (pendingPostponeTodo) {
    const pendingTodo = getTodosForDate(pendingPostponeTodo.dateKey).find((todo) => todo.id === pendingPostponeTodo.id);
    if (!canPostponeTodo(pendingTodo, pendingPostponeTodo.dateKey)) {
      pendingPostponeTodo = null;
    }
  }

  calendarGrid.innerHTML = "";
  currentMonthLabel.textContent = formatMonth(visibleDate);
  postponeGuide.classList.toggle("is-visible", Boolean(pendingPostponeTodo));
  postponeGuide.setAttribute("aria-hidden", pendingPostponeTodo ? "false" : "true");
  calendarPanel.classList.toggle("is-placing-sunflower", isSunflowerPlacementMode);
  const sunflowerButton = calendarTaskPanel.querySelector("[data-action='place-sunflower']");
  if (sunflowerButton) {
    sunflowerButton.classList.toggle("is-active", isSunflowerPlacementMode);
    sunflowerButton.setAttribute("aria-pressed", isSunflowerPlacementMode ? "true" : "false");
  }

  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index);
    const dateKey = toDateKey(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-button";
    const todos = todosByDate[dateKey] || [];
    const activeTodos = todos.filter((todo) => !todo.completed);
    const hasJournal = Boolean(journalsByDate[dateKey]);
    const hasSunflower = Boolean(sunflowersByDate[dateKey]);

    const dayNumber = document.createElement("span");
    dayNumber.className = "day-number";
    dayNumber.textContent = date.getDate();

    const todoDots = document.createElement("span");
    todoDots.className = "day-todo-dots";

    activeTodos.forEach(() => {
      const dot = document.createElement("span");
      dot.className = "day-todo-dot";
      todoDots.appendChild(dot);
    });

    if (hasJournal) {
      const journalMarker = document.createElement("span");
      journalMarker.className = "day-journal-marker";
      journalMarker.innerHTML = `
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 7.75c-1.35-1.2-3.2-1.9-5.5-1.9H4.75A1.75 1.75 0 0 0 3 7.6v10.55c0 .55.45 1 1 1h2.5c2.3 0 4.15.7 5.5 1.9 1.35-1.2 3.2-1.9 5.5-1.9H20c.55 0 1-.45 1-1V7.6a1.75 1.75 0 0 0-1.75-1.75H17.5c-2.3 0-4.15.7-5.5 1.9Z" />
          <path d="M12 7.75v13.3" />
          <path d="M7 9.35c1.35.08 2.5.42 3.45 1.05" />
          <path d="M17 9.35c-1.35.08-2.5.42-3.45 1.05" />
        </svg>
      `;
      journalMarker.setAttribute("aria-hidden", "true");
      button.append(dayNumber, journalMarker, todoDots);
    } else {
      button.append(dayNumber, todoDots);
    }
    button.setAttribute("aria-label", getCalendarDateLabel(date, activeTodos, hasJournal));

    if (date.getMonth() !== month) {
      button.classList.add("is-muted");
    }

    if (dateKey < todayKey) {
      button.classList.add("is-past");
    }

    if (dateKey === toDateKey(today)) {
      button.classList.add("is-today");
    }

    if (dateKey === selectedDateKey) {
      button.classList.add("is-selected");
      button.setAttribute("aria-current", "date");
    }

    if (activeTodos.length > 0) {
      button.classList.add("has-todos");
    }

    if (hasJournal) {
      button.classList.add("has-journal");
    }

    if (hasSunflower) {
      const sunflowerMarker = document.createElement("span");
      sunflowerMarker.className = "day-sunflower-marker";
      sunflowerMarker.textContent = "🌻";
      sunflowerMarker.setAttribute("aria-hidden", "true");
      button.appendChild(sunflowerMarker);
      button.classList.add("has-sunflower");
    }

    if (pendingPostponeTodo) {
      button.classList.add("is-postpone-target");
    }

    if (isSunflowerPlacementMode) {
      button.classList.add("is-sunflower-target");
    }

    button.addEventListener("click", () => {
      if (isSunflowerPlacementMode) {
        const placed = placeSunflowerOnDate(dateKey);
        isSunflowerPlacementMode = false;
        selectedDateKey = dateKey;
        visibleDate = new Date(date.getFullYear(), date.getMonth(), 1);
        renderCalendar();
        if (placed) {
          renderTodoList();
          renderJournalPanel();
        }
        return;
      }

      if (pendingPostponeTodo) {
        postponeTodoToDate(pendingPostponeTodo, dateKey);
        pendingPostponeTodo = null;
        selectedDateKey = dateKey;
        visibleDate = new Date(date.getFullYear(), date.getMonth(), 1);
        saveTodos();
        renderCalendar();
        renderTodoList();
        isJournalEditing = false;
        journalMessage = "";
        renderJournalPanel();
        todoInput.focus();
        return;
      }

      selectedDateKey = dateKey;
      visibleDate = new Date(date.getFullYear(), date.getMonth(), 1);
      isJournalEditing = false;
      journalMessage = "";
      renderCalendar();
      renderTodoList();
      renderJournalPanel();
      todoInput.focus();
    });

    calendarGrid.appendChild(button);
  }

  updateCalendarTaskPanelPosition();
}

function renderTodoList() {
  // 🌟 1. 전체 데이터를 가져와서 탭(currentFilter)에 맞게 필터링!
  let todos = getAllTodosWithDaysLeft();



  if (currentFilter === "pending") {
    todos = todos.filter(t => !t.completed && (t.status || "pending") === "pending");
  } else if (currentFilter === "in-progress") {
    todos = todos.filter(t => !t.completed && t.status === "in-progress");
  } else if (currentFilter === "completed") {
    todos = todos.filter(t => t.completed);
  }

  // 🌟 2. 완료된 항목은 밑으로, 위급은 위로 정렬
  todos = todos.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const urgentA = a.daysLeft <= 3 ? 0 : 1;
    const urgentB = b.daysLeft <= 3 ? 0 : 1;
    if (urgentA !== urgentB) return urgentA - urgentB;
    return a.daysLeft - b.daysLeft;
  });



  const urgentTodo = todos.find(todo => todo.daysLeft <= 3 && !todo.completed);
  if (urgentTodo) SunflowerState.updateMoodForUrgentTodo();

  // 전체 완료 갯수를 세기 위해 필터링 전의 전체 목록을 사용
  const allTodos = getAllTodosWithDaysLeft();
  const completedCount = allTodos.filter((todo) => todo.completed).length;

  selectedDateLabel.textContent = "전체 TodoList";
  todoSectionTitle.textContent = "전체 체크리스트";
  todoCount.textContent = `${completedCount}/${allTodos.length} 완료`;
  emptyState.classList.toggle("is-visible", todos.length === 0);

  todoListUrgent.innerHTML = "";
  todoListHigh.innerHTML = "";
  todoListMedium.innerHTML = "";
  todoListLow.innerHTML = "";

  //리스트 아이템 생성 및 조립
  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "todo-item";
    item.classList.toggle("is-complete", todo.completed);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.dataset.action = "toggle";
    checkbox.dataset.id = todo.id;
    checkbox.dataset.dateKey = todo.dateKey;

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;
    text.style.color = getDdayColor(todo.daysLeft);

    if (todo.daysLeft <= 3) {
      text.style.fontWeight = "700";
    }

    // 🌟 3. 진행 상태 뱃지 만들기
    const statusBadge = document.createElement("button");
    statusBadge.type = "button";
    if (todo.completed) {
      statusBadge.className = "status-badge status-completed";
      statusBadge.textContent = "완료";
      statusBadge.disabled = true;
    } else {
      statusBadge.className = `status-badge ${todo.status === 'in-progress' ? 'status-in-progress' : 'status-pending'}`;
      statusBadge.textContent = todo.status === 'in-progress' ? "진행중" : "진행전";
    }

    statusBadge.dataset.action = "toggle-status";
    statusBadge.dataset.id = todo.id;
    statusBadge.dataset.dateKey = todo.dateKey;

    const categoryBadge = document.createElement("span");
    categoryBadge.className = "todo-category";
    categoryBadge.textContent = categoryMap[todo.category || "personal"];

    const dDay = document.createElement("span");
    dDay.className = "todo-dday";
    dDay.textContent = formatDDay(todo.daysLeft);

    if (todo.daysLeft <= 3) {
      dDay.style.background = "#cc0000";
      dDay.style.color = "#ffffff";
    }
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "✏️";
    editButton.dataset.action = "edit";
    editButton.dataset.id = todo.id;
    editButton.dataset.dateKey = todo.dateKey;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "×";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = todo.id;
    deleteButton.dataset.dateKey = todo.dateKey;

    // 최종 조립 (배열 순서 맞춤)
    item.append(checkbox, text, statusBadge, categoryBadge, dDay, editButton, deleteButton);

    // 미루기 버튼 추가
    if (canPostponeTodo(todo, todo.dateKey)) {
      const isActivePostpone = Boolean(pendingPostponeTodo) &&
        pendingPostponeTodo.id === todo.id &&
        pendingPostponeTodo.dateKey === todo.dateKey;
      const postponeButton = document.createElement("button");
      postponeButton.className = "postpone-button";
      postponeButton.textContent = isActivePostpone ? "취소" : "미루기";
      postponeButton.dataset.action = "postpone";
      postponeButton.dataset.id = todo.id;
      postponeButton.dataset.dateKey = todo.dateKey;
      item.appendChild(postponeButton);
    }

    // 각 방(우선순위 섹션)에 넣기
    if (todo.daysLeft <= 3) todoListUrgent.appendChild(item);
    else {
      const p = todo.priority || "medium";
      if (p === "high") todoListHigh.appendChild(item);
      else if (p === "medium") todoListMedium.appendChild(item);
      else todoListLow.appendChild(item);
    }
  });
  renderSunflower();
}

function renderSunflower() {
  refreshCanvas(sfCanvas, SunflowerState.stageIdx, SunflowerState.moodIdx);
  const stage = STAGES[SunflowerState.stageIdx];
  const mood = MOODS[SunflowerState.moodIdx];
  sunflowerMessage.textContent = `${stage.name} · ${mood.text} (비료 ${SunflowerState.fert}/14개)`;

  fertGauge.innerHTML = "";
  for (let i = 0; i < 14; i++) {
    const dot = document.createElement("div");
    Object.assign(dot.style, {
      width: "14px", height: "14px", borderRadius: "50%",
      background: i < SunflowerState.fert ? "#1D9E75" : "#ddd",
      fontSize: "8px", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
    });
    dot.textContent = i < SunflowerState.fert ? "✿" : "";
    fertGauge.appendChild(dot);
  }
}



function canWriteJournalForSelectedDate() {
  return selectedDateKey <= todayKey;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long"
  }).format(date);
}

function formatFullDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);
}

function getCalendarDateLabel(date, todos, hasJournal = false) {
  const dateLabel = formatFullDate(date);
  const journalLabel = hasJournal ? ", \uc77c\uae30 \uc788\uc74c" : "";
  const sunflowerLabel = sunflowersByDate[toDateKey(date)] ? ", \ud574\ubc14\ub77c\uae30 \uc788\uc74c" : "";

  if (todos.length === 0) {
    return `${dateLabel}${journalLabel}${sunflowerLabel}`;
  }

  const todoLabel = todos.map((todo) => todo.text).join(", ");
  if (hasJournal) {
    return `${dateLabel}${journalLabel}${sunflowerLabel}, \ud560 \uc77c ${todos.length}\uac1c: ${todoLabel}`;
  }
  return `${dateLabel}${sunflowerLabel}, 할 일 ${todos.length}개: ${todoLabel}`;
}

function getTodosForSelectedDate() {
  return getTodosForDate(selectedDateKey);
}

// TodoList 표시 개선: 날짜 키로 항목을 조회하는 공통 함수입니다.
function getTodosForDate(dateKey) {
  return todosByDate[dateKey] || [];
}

function isTodoComplete(todo) {
  return Boolean(todo) && (todo.completed === true || todo.status === "completed");
}

function isPastIncompleteTodo(todo, dateKey) {
  return Boolean(todo) && !isTodoComplete(todo) && dateKey < todayKey;
}

function getPastIncompleteTodos() {
  return Object.keys(todosByDate)
    .filter((dateKey) => dateKey < todayKey)
    .sort()
    .flatMap((dateKey) => getTodosForDate(dateKey)
      .filter((todo) => isPastIncompleteTodo(todo, dateKey))
      .map((todo) => ({
        ...todo,
        dateKey,
        daysLeft: calculateDaysLeftFromToday(dateKey)
      })));
}

function hasPastIncompleteTodos() {
  return getPastIncompleteTodos().length > 0;
}

function renderPastIncompleteTodoModal() {
  if (!pastIncompleteTodoModal) return;
  pastIncompleteTodoModal.style.display = hasPastIncompleteTodos() ? "flex" : "none";
}

function canPostponeTodo(todo, dateKey) {
  return isPastIncompleteTodo(todo, dateKey);
}

function postponeTodoToDate(todoRef, targetDateKey) {
  const sourceTodos = getTodosForDate(todoRef.dateKey);
  const todoToMove = sourceTodos.find((todo) => todo.id === todoRef.id);

  if (!canPostponeTodo(todoToMove, todoRef.dateKey) || todoRef.dateKey === targetDateKey) {
    return;
  }

  todosByDate[todoRef.dateKey] = sourceTodos.filter((todo) => todo.id !== todoRef.id);

  if (todosByDate[todoRef.dateKey].length === 0) {
    delete todosByDate[todoRef.dateKey];
  }

  todosByDate[targetDateKey] = [
    ...getTodosForDate(targetDateKey),
    {
      ...todoToMove,
      completed: false,
      wasProcrastinated: true
    }
  ];
}

function postponePastIncompleteTodosToToday() {
  const movedTodos = [];

  Object.keys(todosByDate)
    .filter((dateKey) => dateKey < todayKey)
    .forEach((dateKey) => {
      const remainingTodos = [];

      getTodosForDate(dateKey).forEach((todo) => {
        if (isPastIncompleteTodo(todo, dateKey)) {
          movedTodos.push({
            ...todo,
            completed: false,
            status: todo.status || "pending",
            wasProcrastinated: true
          });
          return;
        }

        remainingTodos.push(todo);
      });

      if (remainingTodos.length > 0) {
        todosByDate[dateKey] = remainingTodos;
      } else {
        delete todosByDate[dateKey];
      }
    });

  if (movedTodos.length === 0) {
    renderPastIncompleteTodoModal();
    return;
  }

  todosByDate[todayKey] = [
    ...getTodosForDate(todayKey),
    ...movedTodos
  ];
  pendingPostponeTodo = null;
  selectedDateKey = todayKey;
  visibleDate = new Date(today.getFullYear(), today.getMonth(), 1);

  saveTodos();
  renderCalendar();
  renderTodoList();
  renderJournalPanel();
  todoInput.focus();
}

// TodoList 표시 개선: 오늘 날짜를 기준으로 선택 날짜까지 남은 일수를 계산합니다.
function calculateDaysLeftFromToday(dateKey) {
  const selectedDate = fromDateKey(dateKey);
  const todayDate = fromDateKey(toDateKey(today));
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.round((selectedDate - todayDate) / millisecondsPerDay);
}

function formatDDay(daysLeft) {
  if (daysLeft === 0) {
    return "D-Day";
  }

  return daysLeft > 0 ? `D-${daysLeft}` : `D+${Math.abs(daysLeft)}`;
}

// TodoList 표시 개선: 특정 날짜의 TodoList 항목에 오늘 기준 남은 일수 정보를 추가합니다.
function getTodosForDateWithDaysLeft(dateKey) {
  const daysLeft = calculateDaysLeftFromToday(dateKey);

  return getTodosForDate(dateKey).map((todo) => ({
    ...todo,
    dateKey,
    daysLeft
  }));
}

// TodoList 표시 개선: 저장된 모든 날짜의 TodoList 항목을 날짜순으로 모두 모읍니다.
function getAllTodosWithDaysLeft() {
  return Object.keys(todosByDate)
    .sort()
    .flatMap((dateKey) => getTodosForDateWithDaysLeft(dateKey));
}

function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    return savedTodos ? JSON.parse(savedTodos) : {};
  } catch (error) {
    console.warn("저장된 할 일을 불러오지 못했습니다.", error);
    return {};
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todosByDate));
  renderPastIncompleteTodoModal();
}

function loadJournals() {
  try {
    const savedJournals = localStorage.getItem(JOURNAL_STORAGE_KEY);
    return savedJournals ? JSON.parse(savedJournals) : {};
  } catch (error) {
    console.warn("\uc800\uc7a5\ub41c \uc77c\uae30\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.", error);
    return {};
  }
}

function saveJournals() {
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journalsByDate));
}

function loadSunflowers() {
  try {
    const savedSunflowers = localStorage.getItem(SUNFLOWER_DATES_STORAGE_KEY);
    return savedSunflowers ? JSON.parse(savedSunflowers) : {};
  } catch (error) {
    console.warn("Saved sunflowers could not be loaded.", error);
    return {};
  }
}

function saveSunflowers() {
  localStorage.setItem(SUNFLOWER_DATES_STORAGE_KEY, JSON.stringify(sunflowersByDate));
}

// D-day 모달 DOM 요소 선택
const ddayModal = document.querySelector("#ddayModal");
const ddayModalNameInput = document.querySelector("#ddayModalNameInput");
const ddayModalDateInput = document.querySelector("#ddayModalDateInput");
const ddayModalCategory = document.querySelector("#ddayModalCategory");
const ddayModalCancelBtn = document.querySelector("#ddayModalCancelBtn");
const ddayModalSaveBtn = document.querySelector("#ddayModalSaveBtn");

// D-day 추가 버튼 클릭 시 모달 열기
document.querySelector("#addDdayBtn").addEventListener("click", () => {
  ddayModalNameInput.value = "";
  ddayModalDateInput.value = "";
  ddayModalCategory.value = "personal";
  ddayModal.style.display = "flex";
});

// D-day 모달 닫기
ddayModalCancelBtn.addEventListener("click", () => {
  ddayModal.style.display = "none";
});

// D-day 모달 저장
ddayModalSaveBtn.addEventListener("click", () => {
  const name = ddayModalNameInput.value.trim();
  const date = ddayModalDateInput.value;
  const category = ddayModalCategory.value;

  if (!name) {
    alert("D-day 이름을 입력해주세요.");
    ddayModalNameInput.focus();
    return;
  }
  if (!date) {
    alert("날짜를 설정해주세요.");
    return;
  }

  ddays.push({ id: crypto.randomUUID(), name, date, category });
  localStorage.setItem("spicyyeol.ddays", JSON.stringify(ddays));
  renderDdays();

  ddayModal.style.display = "none";
});

// D-day 리스트 렌더링 (카테고리 표시 포함)
function renderDdays() {
  ddayList.innerHTML = "";
  ddays.forEach((d) => {
    const daysLeft = Math.round((new Date(d.date) - new Date(toDateKey(today))) / 86400000);
    const label = daysLeft === 0 ? "D-Day" : daysLeft > 0 ? `D-${daysLeft}` : `D+${Math.abs(daysLeft)}`;

    // 카테고리 매핑
    const catName = categoryMap[d.category || "personal"];

    const item = document.createElement("div");
    item.className = "dday-item";
    item.innerHTML = `
      <span class="todo-category" style="margin-right: 4px;">${catName}</span>
      <span class="dday-name">${d.name}</span>
      <span class="dday-badge" style="color:${getDdayColor(daysLeft)}">${label}</span>
      <button class="dday-delete" data-id="${d.id}">×</button>
    `;
    ddayList.appendChild(item);
  });

  ddayList.querySelectorAll(".dday-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      ddays = ddays.filter(d => d.id !== btn.dataset.id);
      localStorage.setItem("spicyyeol.ddays", JSON.stringify(ddays));
      renderDdays();
    });
  });
}

// ==========================================
// 일기 기록 및 휴지통 모달 기능
// ==========================================
const journalHistoryBtn = document.querySelector("#journalHistoryBtn");
const journalHistoryModal = document.querySelector("#journalHistoryModal");
const journalHistoryCloseBtn = document.querySelector("#journalHistoryCloseBtn");
const journalHistoryList = document.querySelector("#journalHistoryList");
const journalHistoryEmpty = document.querySelector("#journalHistoryEmpty");

const journalTrashBtn = document.querySelector("#journalTrashBtn");
const journalTrashModal = document.querySelector("#journalTrashModal");
const journalTrashCloseBtn = document.querySelector("#journalTrashCloseBtn");
const journalTrashList = document.querySelector("#journalTrashList");
const journalTrashEmpty = document.querySelector("#journalTrashEmpty");

// 일기 기록 버튼 클릭 시 이번 달 기록 모아보기
if (journalHistoryBtn) {
  journalHistoryBtn.addEventListener("click", () => {
    renderJournalHistory();
    journalHistoryModal.style.display = "flex";
  });
}
if (journalHistoryCloseBtn) {
  journalHistoryCloseBtn.addEventListener("click", () => journalHistoryModal.style.display = "none");
}

function renderJournalHistory() {
  journalHistoryList.innerHTML = "";
  const yearMonthPrefix = toDateKey(visibleDate).substring(0, 7);

  const entries = Object.entries(journalsByDate)
    .filter(([dateKey]) => dateKey.startsWith(yearMonthPrefix))
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    journalHistoryEmpty.style.display = "block";
  } else {
    journalHistoryEmpty.style.display = "none";
    entries.forEach(([dateKey, rawJournal]) => {
      const journal = typeof rawJournal === "string" ? { title: "일기", text: rawJournal } : rawJournal;
      const li = document.createElement("li");
      li.className = "trash-item";
      li.innerHTML = `
        <div class="trash-info">
          <span class="trash-text" style="color: var(--accent-dark);"><strong>${journal.title}</strong></span>
          <span class="trash-date">${dateKey} | ${journal.text.substring(0, 20)}${journal.text.length > 20 ? '...' : ''}</span>
        </div>
      `;
      journalHistoryList.appendChild(li);
    });
  }
}

// 기록 모달 안에 있는 쓰레기통 클릭 시 휴지통 모달 열기
if (journalTrashBtn) {
  journalTrashBtn.addEventListener("click", () => {
    renderJournalTrash();
    journalHistoryModal.style.display = "none";
    journalTrashModal.style.display = "flex";
  });
}
if (journalTrashCloseBtn) {
  journalTrashCloseBtn.addEventListener("click", () => journalTrashModal.style.display = "none");
}

// 삭제된 일기 렌더링 및 복원
function renderJournalTrash() {
  journalTrashList.innerHTML = "";
  if (deletedJournals.length === 0) {
    journalTrashEmpty.style.display = "block";
  } else {
    journalTrashEmpty.style.display = "none";
    deletedJournals.forEach((journal, idx) => {
      const li = document.createElement("li");
      li.className = "trash-item";

      const info = document.createElement("div");
      info.className = "trash-info";

      const title = document.createElement("span");
      title.className = "trash-text";
      title.style.fontWeight = "700";
      title.textContent = journal.title;

      const date = document.createElement("span");
      date.className = "trash-date";
      date.textContent = `${journal.dateKey} 삭제됨 | ${journal.text.substring(0, 15)}...`;

      info.append(title, date);

      const restoreBtn = document.createElement("button");
      restoreBtn.type = "button";
      restoreBtn.className = "restore-btn";
      restoreBtn.textContent = "복원";
      restoreBtn.addEventListener("click", () => {
        if (journalsByDate[journal.dateKey]) {
          if (!confirm("해당 날짜에 이미 작성된 일기가 있습니다. 덮어쓰시겠습니까?")) return;
        }
        journalsByDate[journal.dateKey] = { title: journal.title, text: journal.text };
        deletedJournals.splice(idx, 1);

        saveJournals();
        saveDeletedJournals();
        renderCalendar();
        renderJournalPanel();
        renderJournalTrash();
      });

      li.append(info, restoreBtn);
      journalTrashList.appendChild(li);
    });
  }
}

renderDdays();

renderCalendar();
renderTodoList();
renderJournalPanel();
renderOwnedSunflowerCount();
renderPastIncompleteTodoModal();
updateCalendarTaskPanelPosition();
