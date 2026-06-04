const calendarGrid = document.querySelector("#calendarGrid");
const currentMonthLabel = document.querySelector("#currentMonth");
const selectedDateLabel = document.querySelector("#selectedDateLabel");
const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoList = document.querySelector("#todoList");
const todoCount = document.querySelector("#todoCount");
const emptyState = document.querySelector("#emptyState");
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
let todosByDate = getCalendarTodosByDate();

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
  todosByDate[selectedDateKey] = getTodosForSelectedDate().map((todo) => {
    if (todo.id !== todoId) {
      return todo;
    }

    return { ...todo, completed: event.target.checked };
  });

  saveTodos();
  renderCalendar();
  renderTodoList();
});

todoList.addEventListener("click", (event) => {
  if (!event.target.matches("[data-action='delete']")) {
    return;
  }

  const todoId = event.target.dataset.id;
  todosByDate[selectedDateKey] = getTodosForSelectedDate().filter((todo) => todo.id !== todoId);

  if (todosByDate[selectedDateKey].length === 0) {
    delete todosByDate[selectedDateKey];
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
    const todos = getTodosForCalendarDate(dateKey);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-button";
    button.setAttribute("aria-label", formatFullDate(date));

    const dayNumber = document.createElement("span");
    dayNumber.className = "day-number";
    dayNumber.textContent = date.getDate();
    button.appendChild(dayNumber);

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

    if (todos.length > 0) {
      button.classList.add("has-todos");
      button.setAttribute("aria-label", `${formatFullDate(date)}, 할 일 ${todos.length}개`);
      button.appendChild(createTodoSummary(todos));
    }

    button.addEventListener("click", () => {
      selectedDateKey = dateKey;
      visibleDate = new Date(date.getFullYear(), date.getMonth(), 1);
      renderCalendar();
      renderTodoListIfReady();
      todoInput.focus();
    });

    calendarGrid.appendChild(button);
  }
}

function renderTodoList() {
  const todos = getTodosForSelectedDate();
  const completedCount = todos.filter((todo) => todo.completed).length;

  selectedDateLabel.textContent = formatFullDate(fromDateKey(selectedDateKey));
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
    checkbox.setAttribute("aria-label", `${todo.text} 완료`);

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "×";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = todo.id;
    deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);

    item.append(checkbox, text, deleteButton);
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

function createTodoSummary(todos) {
  const remainingCount = todos.filter((todo) => !todo.completed).length;
  const firstOpenTodo = todos.find((todo) => !todo.completed) || todos[0];
  const wrapper = document.createElement("span");
  const summary = document.createElement("span");
  const count = document.createElement("span");

  wrapper.className = "day-todo-wrap";
  summary.className = "day-todo-summary";
  summary.textContent = firstOpenTodo.text;
  count.className = "day-todo-count";
  count.textContent = remainingCount === 0 ? "완료" : `${remainingCount}개`;
  wrapper.append(summary, count);

  return wrapper;
}

function getCalendarTodosByDate() {
  if (typeof loadTodos === "function") {
    return loadTodos();
  }

  if (window.todosByDate && typeof window.todosByDate === "object") {
    return window.todosByDate;
  }

  return {};
}

function getTodosForCalendarDate(dateKey) {
  const source = window.todosByDate && typeof window.todosByDate === "object"
    ? window.todosByDate
    : todosByDate;
  const todos = source[dateKey];

  return Array.isArray(todos) ? todos : [];
}

function renderTodoListIfReady() {
  if (typeof getTodosForSelectedDate === "function") {
    renderTodoList();
  } else {
    selectedDateLabel.textContent = formatFullDate(fromDateKey(selectedDateKey));
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

renderCalendar();
renderTodoListIfReady();
