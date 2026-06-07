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
const todoListUrgent = document.querySelector("#todoListUrgent");
const todoModal = document.querySelector("#todoModal");
const modalTitle = document.querySelector("#modalTitle");
const modalTextInput = document.querySelector("#modalTextInput");
const modalPriority = document.querySelector("#modalPriority");
const modalCategory = document.querySelector("#modalCategory");
const modalSaveBtn = document.querySelector("#modalSaveBtn");
const modalCancelBtn = document.querySelector("#modalCancelBtn");
const selectedPriorityInput = document.querySelector("#selectedPriority");
const todoListHigh = document.querySelector("#todoListHigh");
const todoListMedium = document.querySelector("#todoListMedium");
const todoListLow = document.querySelector("#todoListLow");
const priorityGroupsContainer = document.querySelector("#priorityGroupsContainer");

const sfCanvas = createSunflowerCanvas(SunflowerState.stageIdx, SunflowerState.moodIdx, 150);
sunflowerGarden.appendChild(sfCanvas);
SunflowerPanel.init();

const STORAGE_KEY = "spicyyeol.todosByDate";
const JOURNAL_STORAGE_KEY = "spicyyeol.journalsByDate";
const today = new Date();
const todayKey = toDateKey(today);
let visibleDate = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDateKey = todayKey;
let todosByDate = loadTodos();
let journalsByDate = loadJournals();
let pendingPostponeTodo = null;
let isJournalEditing = false;
let journalMessage = "";
let editingTodoId = null;
let editingDateKey = null;

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

// 팝업 저장 (추가/수정 공통)
modalSaveBtn.addEventListener("click", () => {
  const text = modalTextInput.value.trim();
  if (!text) return;

  const targetDateKey = editingDateKey || selectedDateKey;

  if (editingTodoId) { // 수정일 때
    todosByDate[targetDateKey] = getTodosForDate(targetDateKey).map(t =>
      t.id === editingTodoId ? { ...t, text, priority: modalPriority.value, category: modalCategory.value } : t
    );
  } else { // 새로 추가할 때
    const newTodo = {
      id: crypto.randomUUID(), text, completed: false,
      priority: modalPriority.value, category: modalCategory.value
    };
    todosByDate[selectedDateKey] = [...getTodosForSelectedDate(), newTodo];
  }

  todoModal.style.display = "none";
  todoInput.value = "";
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



document.querySelector("#prevMonth").addEventListener("click", () => {
  visibleDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth() - 1, 1);
  renderCalendar();
});

document.querySelector("#nextMonth").addEventListener("click", () => {
  visibleDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 1);
  renderCalendar();
});

calendarTaskPanel.addEventListener("click", (event) => {
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

calendarJournalPanel.addEventListener("click", (event) => {
  const journalActionButton = event.target.closest("[data-journal-action]");
  if (!journalActionButton) return;

  if (journalActionButton.dataset.journalAction === "cancel") {
    isJournalEditing = false;
    journalMessage = "";
    renderJournalPanel();
    return;
  }

  if (journalActionButton.dataset.journalAction !== "save") return;

  const journalInput = calendarJournalPanel.querySelector("#journalInput");
  const journalText = journalInput ? journalInput.value.trim() : "";

  if (journalText) {
    journalsByDate[selectedDateKey] = journalText;
    journalMessage = "";
  } else {
    delete journalsByDate[selectedDateKey];
    journalMessage = "\ube48 \uc77c\uae30\ub294 \uc800\uc7a5\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.";
  }

  isJournalEditing = false;
  saveJournals();
  renderCalendar();
  renderJournalPanel();
});

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;

  editingTodoId = null;
  editingDateKey = null;
  modalTitle.textContent = "일정 추가";
  modalTextInput.value = text;
  modalPriority.value = "medium";
  modalCategory.value = "personal";

  todoModal.style.display = "flex";
});


priorityGroupsContainer.addEventListener("change", (event) => {
  if (!event.target.matches("[data-action='toggle']")) return;

  const todoId = event.target.dataset.id;
  // TodoList 표시 개선: 렌더링된 항목의 날짜 키를 기준으로 상태를 갱신합니다.
  const todoDateKey = event.target.dataset.dateKey || selectedDateKey;
  todosByDate[todoDateKey] = getTodosForDate(todoDateKey).map((todo) => {
    if (todo.id !== todoId) {
      return todo;
    }

    return { ...todo, completed: event.target.checked };
  });
  const todo = getTodosForDate(todoDateKey).find(t => t.id === todoId);
  if (event.target.checked && !todo.fertGiven) {
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
    const postponeTodo = { id: todoId, dateKey: actionButton.dataset.dateKey };
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

  if (actionButton.dataset.action !== "delete") return;


  const todoId = actionButton.dataset.id;
  // TodoList 표시 개선: 선택 날짜가 바뀌어도 항목이 등록된 날짜에서 정확히 삭제합니다.
  const todoDateKey = actionButton.dataset.dateKey || selectedDateKey;
  todosByDate[todoDateKey] = getTodosForDate(todoDateKey).filter((todo) => todo.id !== todoId);

  if (todosByDate[todoDateKey].length === 0) {
    delete todosByDate[todoDateKey];
  }

  saveTodos();
  renderCalendar();
  renderTodoList();
});

function renderCalendar() {
  calendarGrid.innerHTML = "";
  currentMonthLabel.textContent = formatMonth(visibleDate);
  postponeGuide.classList.toggle("is-visible", Boolean(pendingPostponeTodo));
  postponeGuide.setAttribute("aria-hidden", pendingPostponeTodo ? "false" : "true");

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

    if (pendingPostponeTodo) {
      button.classList.add("is-postpone-target");
    }

    button.addEventListener("click", () => {
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
    todos = todos.filter(t => !t.completed && t.status !== "in-progress");
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
    statusBadge.className = `status-badge ${todo.status === 'in-progress' ? 'status-in-progress' : 'status-pending'}`;
    statusBadge.textContent = todo.status === 'in-progress' ? "진행중" : "진행전";
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
    if (todo.daysLeft < 0 && !todo.completed) {
      const isActivePostpone = Boolean(pendingPostponeTodo) && pendingPostponeTodo.id === todo.id;
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

function renderJournalPanel() {
  const savedJournal = journalsByDate[selectedDateKey] || "";
  calendarJournalPanel.innerHTML = "";

  if (!isJournalEditing && !journalMessage && !savedJournal) {
    return;
  }

  const panelContent = document.createElement("div");
  panelContent.className = "journal-panel-content";

  if (isJournalEditing) {
    const textarea = document.createElement("textarea");
    textarea.id = "journalInput";
    textarea.className = "journal-input";
    textarea.value = savedJournal;
    textarea.placeholder = "\uc624\ub298\uc758 \uc77c\uae30\ub97c \uc801\uc5b4\ubcf4\uc138\uc694.";

    const actions = document.createElement("div");
    actions.className = "journal-actions";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "journal-save-button";
    saveButton.dataset.journalAction = "save";
    saveButton.textContent = "\uc800\uc7a5";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "journal-cancel-button";
    cancelButton.dataset.journalAction = "cancel";
    cancelButton.textContent = "\ucde8\uc18c";

    actions.append(saveButton, cancelButton);
    panelContent.append(textarea, actions);
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

      const title = document.createElement("strong");
      title.textContent = "\uc77c\uae30";

      const body = document.createElement("p");
      body.textContent = savedJournal;

      journalView.append(title, body);
      panelContent.appendChild(journalView);
    }
  }

  calendarJournalPanel.appendChild(panelContent);
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

  if (todos.length === 0) {
    return `${dateLabel}${journalLabel}`;
  }

  const todoLabel = todos.map((todo) => todo.text).join(", ");
  if (hasJournal) {
    return `${dateLabel}${journalLabel}, \ud560 \uc77c ${todos.length}\uac1c: ${todoLabel}`;
  }
  return `${dateLabel}, 할 일 ${todos.length}개: ${todoLabel}`;
}

function getTodosForSelectedDate() {
  return getTodosForDate(selectedDateKey);
}

// TodoList 표시 개선: 날짜 키로 항목을 조회하는 공통 함수입니다.
function getTodosForDate(dateKey) {
  return todosByDate[dateKey] || [];
}

function postponeTodoToDate(todoRef, targetDateKey) {
  const sourceTodos = getTodosForDate(todoRef.dateKey);
  const todoToMove = sourceTodos.find((todo) => todo.id === todoRef.id);

  if (!todoToMove || todoRef.dateKey === targetDateKey) {
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

renderCalendar();
renderTodoList();
renderJournalPanel();
updateCalendarTaskPanelPosition();
