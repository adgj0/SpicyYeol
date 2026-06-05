const calendarGrid = document.querySelector("#calendarGrid");
const currentMonthLabel = document.querySelector("#currentMonth");
const selectedDateLabel = document.querySelector("#selectedDateLabel");
const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoList = document.querySelector("#todoList");
const todoCount = document.querySelector("#todoCount");
const emptyState = document.querySelector("#emptyState");
const todoSectionTitle = document.querySelector(".todo-list-section .section-title h3");
const sunflowerMessage = document.querySelector("#sunflowerMessage");
const sunflowerGarden = document.querySelector("#sunflowerGarden");
const fertGauge = document.querySelector("#fertGauge");
const sfCanvas = createSunflowerCanvas(SunflowerState.stageIdx, SunflowerState.moodIdx, 150);
sunflowerGarden.appendChild(sfCanvas);
SunflowerPanel.init();

const STORAGE_KEY = "spicyyeol.todosByDate";
const today = new Date();
let visibleDate = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDateKey = toDateKey(today);
let todosByDate = loadTodos();

document.querySelector("#prevMonth").addEventListener("click", () => {
  visibleDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth() - 1, 1);
  renderCalendar();
});

document.querySelector("#nextMonth").addEventListener("click", () => {
  visibleDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 1);
  renderCalendar();
});

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = todoInput.value.trim();
  if (!text) {
    return;
  }

  const newTodo = {
    id: crypto.randomUUID(),
    text,
    completed: false
  };

  todosByDate[selectedDateKey] = [...getTodosForSelectedDate(), newTodo];
  todoInput.value = "";
  saveTodos();
  renderCalendar();
  renderTodoList();
});

todoList.addEventListener("change", (event) => {
  if (!event.target.matches("[data-action='toggle']")) {
    return;
  }

  const todoId = event.target.dataset.id;
  // TodoList 표시 개선: 렌더링된 항목의 날짜 키를 기준으로 상태를 갱신합니다.
  const todoDateKey = event.target.dataset.dateKey || selectedDateKey;
  todosByDate[todoDateKey] = getTodosForDate(todoDateKey).map((todo) => {
    if (todo.id !== todoId) {
      return todo;
    }

    return { ...todo, completed: event.target.checked };
  });
  if (event.target.checked) {
    const daysLeft = calculateDaysLeftFromToday(todoDateKey);
    SunflowerState.onTaskComplete(daysLeft);
  }
  saveTodos();
  renderCalendar();
  renderTodoList();
});

todoList.addEventListener("click", (event) => {
  if (!event.target.matches("[data-action='delete']")) {
    return;
  }

  const todoId = event.target.dataset.id;
  // TodoList 표시 개선: 선택 날짜가 바뀌어도 항목이 등록된 날짜에서 정확히 삭제합니다.
  const todoDateKey = event.target.dataset.dateKey || selectedDateKey;
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

    button.append(dayNumber, todoDots);
    button.setAttribute("aria-label", getCalendarDateLabel(date, activeTodos));

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

    button.addEventListener("click", () => {
      selectedDateKey = dateKey;
      visibleDate = new Date(date.getFullYear(), date.getMonth(), 1);
      renderCalendar();
      renderTodoList();
      todoInput.focus();
    });

    calendarGrid.appendChild(button);
  }
}

function renderTodoList() {
  // TodoList 표시 개선: 날짜를 선택해도 체크리스트에는 모든 날짜의 TodoList를 표시하고, 남은 일수는 계산만 합니다.
  const todos = getAllTodosWithDaysLeft();
  const urgentTodo = todos.filter(t => !t.completed).sort((a, b) => a.daysLeft - b.daysLeft)[0];
  if (urgentTodo) {
  SunflowerState.updateMoodFromDDay(urgentTodo.daysLeft);
  }
  const completedCount = todos.filter((todo) => todo.completed).length;

  selectedDateLabel.textContent = "전체 TodoList";
  todoSectionTitle.textContent = "전체 체크리스트";
  todoCount.textContent = `${completedCount}/${todos.length} 완료`;
  emptyState.classList.toggle("is-visible", todos.length === 0);
  todoList.innerHTML = "";

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
    checkbox.setAttribute("aria-label", `${todo.text} 완료`);

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const dDay = document.createElement("span");
    dDay.className = "todo-dday";
    dDay.textContent = formatDDay(todo.daysLeft);
    dDay.setAttribute("aria-label", `마감 ${dDay.textContent}`);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "×";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = todo.id;
    deleteButton.dataset.dateKey = todo.dateKey;
    deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);

    item.append(checkbox, text, dDay, deleteButton);
    todoList.appendChild(item);
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

function getCalendarDateLabel(date, todos) {
  const dateLabel = formatFullDate(date);

  if (todos.length === 0) {
    return dateLabel;
  }

  const todoLabel = todos.map((todo) => todo.text).join(", ");
  return `${dateLabel}, 할 일 ${todos.length}개: ${todoLabel}`;
}

function getTodosForSelectedDate() {
  return getTodosForDate(selectedDateKey);
}

// TodoList 표시 개선: 날짜 키로 항목을 조회하는 공통 함수입니다.
function getTodosForDate(dateKey) {
  return todosByDate[dateKey] || [];
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

renderCalendar();
renderTodoList();
