const courseNameInput = document.getElementById("courseName");
const courseDayInput = document.getElementById("courseDay");
const coursePeriodInput = document.getElementById("coursePeriod");
const courseColorInput = document.getElementById("courseColor");
const addCourseBtn = document.getElementById("addCourseBtn");

const taskTypeSelect = document.getElementById("taskType");

const courseSelect = document.getElementById("courseSelect");
const taskTitle = document.getElementById("taskTitle");
const addBtn = document.getElementById("addTaskBtn");
const timetableBody = document.getElementById("timetableBody");
const completedList = document.getElementById("completedList");

const editModeBtn = document.getElementById("editModeBtn");
const courseTitle = document.getElementById("courseTitle");

const courseForm = document.getElementById("courseForm");
const mobileView = document.getElementById("mobileView");

let editMode = false;

let data = JSON.parse(localStorage.getItem("data")) || {
  courses: [],
  tasks: []
};

function save() {
  localStorage.setItem("data", JSON.stringify(data));
}

data.tasks.forEach(task => {
  if (!task.type) task.type = "single";
});

const dayMap = {
  "月": "mon",
  "火": "tue",
  "水": "wed",
  "木": "thu",
  "金": "fri"
};

const COLORS = [
  "#FFCDD2", "#C8E6C9", "#BBDEFB",
  "#FFF9C4", "#E1BEE7", "#FFE0B2", "#CFD8DC"
];

// 編集モード切替
editModeBtn.addEventListener("click", () => {
  editMode = !editMode;

  editModeBtn.textContent = editMode ? "編集モード ON" : "編集モード OFF";
  editModeBtn.style.background = editMode ? "red" : "";

  courseNameInput.disabled = !editMode;
  courseDayInput.disabled = !editMode;
  coursePeriodInput.disabled = !editMode;
  courseColorInput.disabled = !editMode;
  addCourseBtn.disabled = !editMode;

  courseForm.style.display = editMode ? "flex" : "none";
  courseTitle.style.display = editMode ? "block" : "none";

  renderAll();
});

// 授業セレクト更新
function renderCourses() {
  courseSelect.innerHTML = "";
  data.courses.forEach(c => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = `${c.name} (${c.day}${c.period})`;
    courseSelect.appendChild(option);
  });
}

// 週間課題リセット
function resetWeeklyTasks() {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;

  data.tasks.forEach(task => {
    if (task.type === "weekly" && task.completed && task.completedAt) {
      if (now - task.completedAt > week) {
        task.completed = false;
        task.completedAt = null;
      }
    }
  });
}

// PC版テーブル UI
function createTable() {
  timetableBody.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    let row = document.createElement("tr");

    const th = document.createElement("th");
    th.textContent = `${i}限`;
    row.appendChild(th);

    ["mon","tue","wed","thu","fri"].forEach(day => {
      const td = document.createElement("td");
      td.id = `${day}-${i}`;

      if (editMode) {
        const course = data.courses.find(
          c => dayMap[c.day] === day && c.period === i
        );

        const input = document.createElement("input");
        input.className = "cellInput";
        input.value = course ? course.name : "";

        const palette = document.createElement("div");
        palette.className = "colorPalette";

        COLORS.forEach(color => {
          const btn = document.createElement("div");
          btn.className = "colorBtn";
          btn.style.background = color;

          if (course && course.color === color) {
            btn.style.outline = "3px solid black";
          }

          btn.addEventListener("click", () => {
            const name = input.value.trim();
            const jpDay = Object.keys(dayMap).find(k => dayMap[k] === day);

            data.courses = data.courses.filter(
              c => !(c.day === jpDay && c.period === i)
            );

            if (name !== "") {
              data.courses.push({
                id: Date.now(),
                name,
                day: jpDay,
                period: i,
                color
              });
            }

            save();
            renderAll();
          });

          palette.appendChild(btn);
        });

        input.addEventListener("change", () => {
          const name = input.value.trim();
          const jpDay = Object.keys(dayMap).find(k => dayMap[k] === day);

          data.courses = data.courses.filter(
            c => !(c.day === jpDay && c.period === i)
          );

          if (name !== "") {
            data.courses.push({
              id: Date.now(),
              name,
              day: jpDay,
              period: i,
              color: course ? course.color : COLORS[2]
            });
          }

          save();
          renderAll();
        });

        td.appendChild(input);
        td.appendChild(palette);
      }

      row.appendChild(td);
    });

    timetableBody.appendChild(row);
  }
}

// スマホ専用 UI
function renderMobile() {
  mobileView.innerHTML = "";

  const days = ["月","火","水","木","金"];

  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "dayCard";

    const title = document.createElement("div");
    title.className = "dayTitle";
    title.textContent = `${day}曜日`;
    card.appendChild(title);

    data.courses
      .filter(c => c.day === day)
      .sort((a,b) => a.period - b.period)
      .forEach(course => {
        const div = document.createElement("div");
        div.className = "courseCard";
        div.style.background = course.color;
        div.textContent = `${course.period}限：${course.name}`;
        card.appendChild(div);

        data.tasks
          .filter(t => t.courseId == course.id)
          .forEach(task => {
            const tdiv = document.createElement("div");
            tdiv.className = "taskCard";
            tdiv.textContent = task.title;
            card.appendChild(tdiv);
          });
      });

    mobileView.appendChild(card);
  });
}

// PC版時間割描画
function renderTimetable() {
  resetWeeklyTasks();
  createTable();

  if (!editMode) {
    data.courses.forEach(course => {
      const cell = document.getElementById(`${dayMap[course.day]}-${course.period}`);
      if (!cell) return;

      const div = document.createElement("div");
      div.innerHTML = `<strong>${course.name}</strong>`;
      div.style.backgroundColor = course.color;
      div.style.padding = "5px";
      div.style.borderRadius = "6px";

      cell.appendChild(div);
    });
  }

  data.tasks.forEach(task => {
    const course = data.courses.find(c => c.id == task.courseId);
    if (!course) return;

    if (task.type === "single" && task.completed) return;

    const cell = document.getElementById(`${dayMap[course.day]}-${course.period}`);
    if (!cell) return;

    const div = document.createElement("div");
    div.className = "task";
    div.style.backgroundColor = course.color;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      task.completedAt = checkbox.checked ? Date.now() : null;
      save();
      renderAll();
    });

    const span = document.createElement("span");
    span.textContent = `${task.type === "weekly" ? "🗓" : "📌"} ${task.title}`;

    if (task.completed) {
      span.style.textDecoration = "line-through";
      div.style.opacity = "0.5";
    }

    div.appendChild(checkbox);
    div.appendChild(span);

    cell.appendChild(div);
  });
}

// 全体描画
function renderAll() {
  renderCourses();

  if (window.innerWidth <= 600) {
    document.getElementById("timetable").style.display = "none";
    mobileView.style.display = "block";
    renderMobile();
  } else {
    document.getElementById("timetable").style.display = "table";
    mobileView.style.display = "none";
    renderTimetable();
  }

  renderCompleted();
}

// 課題追加
addBtn.addEventListener("click", () => {
  const title = taskTitle.value.trim();
  const courseId = Number(courseSelect.value);
  const type = taskTypeSelect.value;

  if (!title) return;

  data.tasks.push({
    id: Date.now(),
    title,
    courseId,
    type,
    completed: false,
    completedAt: null
  });

  save();
  renderAll();

  taskTitle.value = "";
});

// 授業追加
addCourseBtn.addEventListener("click", () => {
  if (!editMode) {
    alert("編集モードでのみ追加できます");
    return;
  }

  const name = courseNameInput.value.trim();
  const day = courseDayInput.value;
  const period = Number(coursePeriodInput.value);
  const color = courseColorInput.value;

  if (!name) return;

  const exists = data.courses.some(
    c => c.day === day && c.period === period
  );

  if (exists) {
    alert("その時間にはすでに授業があります");
    return;
  }

  data.courses.push({
    id: Date.now(),
    name,
    day,
    period,
    color
  });

  save();
  renderAll();
});

// 初期描画
renderAll();
