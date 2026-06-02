const calendarGrid = document.querySelector("#calendarGrid");
const currentMonthLabel = document.querySelector("#currentMonth");
const selectedDateLabel = document.querySelector("#selectedDateLabel");
const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoList = document.querySelector("#todoList");
const todoCount = document.querySelector("#todoCount");
const emptyState = document.querySelector("#emptyState");
const sunflower = document.querySelector("#sunflower");
const sunflowerMessage = document.querySelector("#sunflowerMessage");

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
  todosByDate[selectedDateKey] = getTodosForSelectedDate().map((todo) => {
    if (todo.id !== todoId) {
      return todo;
    }

    return { ...todo, completed: event.target.checked };
  });

  saveTodos();
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
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-button";
    button.textContent = date.getDate();
    button.setAttribute("aria-label", formatFullDate(date));

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

    if ((todosByDate[dateKey] || []).length > 0) {
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

  renderSunflower(completedCount, todos.length);
}

function renderSunflower(completedCount, totalCount) {
  const ratio = totalCount === 0 ? 0 : completedCount / totalCount;
  const scale = 0.42 + ratio * 0.58;
  const drop = 72 - ratio * 70;

  sunflower.style.setProperty("--flower-scale", scale.toFixed(2));
  sunflower.style.setProperty("--flower-drop", `${drop.toFixed(0)}px`);

  if (totalCount === 0) {
    sunflowerMessage.textContent = "할 일을 추가하고 완료하면 새싹이 자랍니다.";
  } else if (completedCount === totalCount) {
    sunflowerMessage.textContent = "오늘의 해바라기가 활짝 피었습니다.";
  } else {
    sunflowerMessage.textContent = `완료 ${completedCount}개, 남은 할 일 ${totalCount - completedCount}개`;
  }
}

function getTodosForSelectedDate() {
  return todosByDate[selectedDateKey] || [];
}

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todosByDate));
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
renderTodoList();
