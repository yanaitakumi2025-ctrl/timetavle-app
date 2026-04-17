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
const switchViewBtn = document.getElementById("switchViewBtn");
const timetable = document.getElementById("timetable");

let editMode = false;
let mobileMode = false;

let data = JSON.parse(localStorage.getItem("data")) || {
  courses: [],
  tasks: []
};

function save() {
  localStorage.setItem("data", JSON.stringify(data));
}

// 古いデータ対策
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
  "#FFCDD2",
  "#C8E6C9",
  "#BBDEFB",
  "#FFF9C4",
  "#E1BEE7",
  "#FFE0B2",
  "#CFD8DC"
];

// 表示切り替え
switchViewBtn.addEventListener("click", () => {
  mobileMode = !mobileMode;

  switchViewBtn.textContent = mobileMode
    ? "PC版に切り替え"
    : "スマホ版に切り替え";

  renderAll();
});

// 編集モード
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

  data.courses.forEach(course => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.name} (${course.day}${course.period})`;
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

// PC版テーブル作成
function createTable() {
  timetableBody.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const row = document.createElement("tr");

    const th = document.createElement("th");
    th.textContent = `${i}限`;
    row.appendChild(th);

    ["mon", "tue", "wed", "thu", "fri"].forEach(day => {
      const td = document.createElement("td");
      td.id = `${day}-${i}`;

      if (editMode) {
        const course = data.courses.find(
          c => dayMap[c.day] === day && c.period === i
        );

        const input = document.createElement("input");
        input.className = "cellInput";
        input.value = course ? course.name : "";
        input.placeholder = "授業名";

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

// スマホ版
function renderMobile() {
  mobileView.innerHTML = "";

  const days = ["月", "火", "水", "木", "金"];

  days.forEach(day => {
    const dayCard = document.createElement("div");
    dayCard.className = "dayCard";

    const title = document.createElement("div");
    title.className = "dayTitle";
    title.textContent = `${day}曜日`;
    dayCard.appendChild(title);

    for (let period = 1; period <= 5; period++) {
      const course = data.courses.find(c => c.day === day && c.period === period);

      // 編集モード中は授業がなくても枠を出す
      if (!course && !editMode) continue;

      const courseCard = document.createElement("div");
      courseCard.className = "courseCard";
      courseCard.style.background = course ? course.color : "#ffffff";

      if (editMode) {
        const input = document.createElement("input");
        input.className = "mobileCourseInput";
        input.placeholder = `${period}限の授業名`;
        input.value = course ? course.name : "";

        const periodLabel = document.createElement("div");
        periodLabel.className = "mobilePeriodLabel";
        periodLabel.textContent = `${period}限`;
        courseCard.appendChild(periodLabel);
        courseCard.appendChild(input);

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

            data.courses = data.courses.filter(
              c => !(c.day === day && c.period === period)
            );

            if (name !== "") {
              data.courses.push({
                id: Date.now(),
                name,
                day,
                period,
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

          data.courses = data.courses.filter(
            c => !(c.day === day && c.period === period)
          );

          if (name !== "") {
            data.courses.push({
              id: Date.now(),
              name,
              day,
              period,
              color: course ? course.color : COLORS[2]
            });
          }

          save();
          renderAll();
        });

        courseCard.appendChild(palette);
      } else if (course) {
        const courseTitleEl = document.createElement("div");
        courseTitleEl.className = "courseTitle";
        courseTitleEl.textContent = `${course.period}限：${course.name}`;
        courseCard.appendChild(courseTitleEl);
      }

      if (course) {
        data.tasks
          .filter(task => task.courseId == course.id)
          .forEach(task => {
            if (task.type === "single" && task.completed) return;

            const taskCard = document.createElement("label");
            taskCard.className = "taskCard";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;
            checkbox.className = "taskCheckbox";

            checkbox.addEventListener("change", () => {
              task.completed = checkbox.checked;
              task.completedAt = checkbox.checked ? Date.now() : null;
              save();
              renderAll();
            });

            const span = document.createElement("span");
            span.textContent = `${task.type === "weekly" ? "🗓" : "📌"} ${task.title}`;
            span.className = "taskText";

            if (task.completed) {
              span.style.textDecoration = "line-through";
              taskCard.style.opacity = "0.5";
            }

            taskCard.appendChild(checkbox);
            taskCard.appendChild(span);

            courseCard.appendChild(taskCard);
          });
      }

      dayCard.appendChild(courseCard);
    }

    mobileView.appendChild(dayCard);
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

    const div = document.createElement("label");
    div.className = "task";
    div.style.backgroundColor = course.color;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.className = "taskCheckbox";

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      task.completedAt = checkbox.checked ? Date.now() : null;
      save();
      renderAll();
    });

    const span = document.createElement("span");
    span.textContent = `${task.type === "weekly" ? "🗓" : "📌"} ${task.title}`;
    span.className = "taskText";

    if (task.completed) {
      span.style.textDecoration = "line-through";
      div.style.opacity = "0.5";
    }

    div.appendChild(checkbox);
    div.appendChild(span);

    cell.appendChild(div);
  });
}

// 完了済み課題
function renderCompleted() {
  completedList.innerHTML = "";

  data.tasks.forEach(task => {
    if (task.type === "single" && task.completed) {
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.textContent = task.title;

      const backBtn = document.createElement("button");
      backBtn.textContent = "戻す";
      backBtn.onclick = () => {
        task.completed = false;
        task.completedAt = null;
        save();
        renderAll();
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "削除";
      deleteBtn.onclick = () => {
        data.tasks = data.tasks.filter(t => t.id !== task.id);
        save();
        renderAll();
      };

      li.appendChild(span);
      li.appendChild(backBtn);
      li.appendChild(deleteBtn);

      completedList.appendChild(li);
    }
  });
}

// 全体描画
function renderAll() {
  renderCourses();

  if (mobileMode) {
    timetable.style.display = "none";
    mobileView.style.display = "block";
    renderMobile();
  } else {
    timetable.style.display = "block";
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
