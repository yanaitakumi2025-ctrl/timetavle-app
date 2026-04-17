import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdpa0t-S76CKwDpoj--jb1SgUnwlIjSZc",
  authDomain: "timetable-74561.firebaseapp.com",
  projectId: "timetable-74561",
  storageBucket: "timetable-74561.firebasestorage.app",
  messagingSenderId: "347609918753",
  appId: "1:347609918753:web:5a4b07f4be5075d9296260"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const userInfo = document.getElementById("userInfo");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

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

const showSaturdayCheckbox = document.getElementById("showSaturday");
const showSundayCheckbox = document.getElementById("showSunday");
const courseDaySatOption = document.getElementById("courseDaySatOption");
const courseDaySunOption = document.getElementById("courseDaySunOption");

const schoolYearSelect = document.getElementById("schoolYearSelect");
const termSelect = document.getElementById("termSelect");

let editMode = false;
let mobileMode = false;
let currentUser = null;

function createDefaultData() {
  return {
    currentYear: new Date().getFullYear(),
    currentTerm: "前期",
    courses: [],
    tasks: [],
    settings: {
      showSaturday: false,
      showSunday: false
    }
  };
}

let data = JSON.parse(localStorage.getItem("data")) || createDefaultData();

function normalizeData() {
  if (!data.settings) {
    data.settings = {
      showSaturday: false,
      showSunday: false
    };
  }

  if (!data.currentYear) {
    data.currentYear = new Date().getFullYear();
  }

  if (!data.currentTerm) {
    data.currentTerm = "前期";
  }

  data.tasks.forEach(task => {
    if (!task.type) task.type = "single";
    if (!("completed" in task)) task.completed = false;
    if (!("completedAt" in task)) task.completedAt = null;
    if (!task.schoolYear) task.schoolYear = data.currentYear;
    if (!task.term) task.term = "前期";
  });

  data.courses.forEach(course => {
    if (!course.schoolYear) course.schoolYear = data.currentYear;
    if (!course.term) course.term = "前期";
  });
}

normalizeData();

async function loadCloudData(uid) {
  const ref = doc(db, "users", uid, "timetableApp", "main");
  const snap = await getDoc(ref);

  if (snap.exists()) {
    data = snap.data();
  } else {
    data = createDefaultData();
    await setDoc(ref, data);
  }

  normalizeData();
}

async function saveCloudData(uid) {
  const ref = doc(db, "users", uid, "timetableApp", "main");
  await setDoc(ref, data);
}

async function save() {
  if (currentUser) {
    await saveCloudData(currentUser.uid);
  } else {
    localStorage.setItem("data", JSON.stringify(data));
  }
}

const dayMap = {
  "月": "mon",
  "火": "tue",
  "水": "wed",
  "木": "thu",
  "金": "fri",
  "土": "sat",
  "日": "sun"
};

const reverseDayMap = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日"
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

function getVisibleDays() {
  const days = ["mon", "tue", "wed", "thu", "fri"];
  if (data.settings.showSaturday) days.push("sat");
  if (data.settings.showSunday) days.push("sun");
  return days;
}

function getVisibleJapaneseDays() {
  return getVisibleDays().map(dayKey => reverseDayMap[dayKey]);
}

function getTodayDayKey() {
  const today = new Date().getDay();
  const map = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat"
  };
  return map[today] || null;
}

function getTodayDayKeyFromDate(date) {
  const day = new Date(date).getDay();
  const map = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat"
  };
  return map[day] || null;
}

function getCurrentCourses() {
  return data.courses.filter(course =>
    Number(course.schoolYear) === Number(data.currentYear) &&
    (course.term === data.currentTerm || course.term === "通年")
  );
}

function getCurrentTasks() {
  return data.tasks.filter(task =>
    Number(task.schoolYear) === Number(data.currentYear) &&
    (task.term === data.currentTerm || task.term === "通年")
  );
}

function renderYearOptions() {
  schoolYearSelect.innerHTML = "";

  const current = new Date().getFullYear();
  for (let y = current - 1; y <= current + 3; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = `${y}年度`;
    if (Number(y) === Number(data.currentYear)) {
      option.selected = true;
    }
    schoolYearSelect.appendChild(option);
  }

  termSelect.value = data.currentTerm;
}

function updateDayOptions() {
  courseDaySatOption.style.display = data.settings.showSaturday ? "block" : "none";
  courseDaySunOption.style.display = data.settings.showSunday ? "block" : "none";

  if (courseDayInput.value === "土" && !data.settings.showSaturday) {
    courseDayInput.value = "月";
  }

  if (courseDayInput.value === "日" && !data.settings.showSunday) {
    courseDayInput.value = "月";
  }
}

function syncSettingsUI() {
  showSaturdayCheckbox.checked = data.settings.showSaturday;
  showSundayCheckbox.checked = data.settings.showSunday;
  updateDayOptions();
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function resetWeeklyTasks() {
  const today = startOfDay(new Date());

  data.tasks.forEach(task => {
    if (
      task.type !== "weekly" ||
      !task.completed ||
      !task.completedAt ||
      Number(task.schoolYear) !== Number(data.currentYear) ||
      !(task.term === data.currentTerm || task.term === "通年")
    ) {
      return;
    }

    const course = data.courses.find(c => Number(c.id) === Number(task.courseId));
    if (!course) return;

    const checkedDate = startOfDay(new Date(task.completedAt));
    if (today <= checkedDate) return;

    const taskDayKey = dayMap[course.day];
    let cursor = new Date(checkedDate);
    cursor.setDate(cursor.getDate() + 1);

    while (cursor <= today) {
      if (getTodayDayKeyFromDate(cursor) === taskDayKey) {
        task.completed = false;
        task.completedAt = null;
        break;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });
}

function deleteTask(taskId) {
  data.tasks = data.tasks.filter(task => task.id !== taskId);
}

function createDeleteTaskButton(taskId) {
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "削除";
  deleteBtn.className = "taskDeleteBtn";
  deleteBtn.type = "button";

  deleteBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    deleteTask(taskId);
    await save();
    renderAll();
  });

  return deleteBtn;
}

function renderCourses() {
  courseSelect.innerHTML = "";

  const visibleDays = getVisibleJapaneseDays();
  const currentCourses = getCurrentCourses()
    .filter(course => visibleDays.includes(course.day))
    .sort((a, b) => {
      const dayDiff =
        getVisibleJapaneseDays().indexOf(a.day) -
        getVisibleJapaneseDays().indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return Number(a.period) - Number(b.period);
    });

  currentCourses.forEach(course => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.name} (${course.day}${course.period})`;
    courseSelect.appendChild(option);
  });
}

function createTable() {
  timetableBody.innerHTML = "";
  const todayKey = getTodayDayKey();
  const visibleDays = getVisibleDays();

  const headerRow = document.createElement("tr");

  const cornerTh = document.createElement("th");
  cornerTh.textContent = "時限";
  cornerTh.className = "periodHeader";
  headerRow.appendChild(cornerTh);

  visibleDays.forEach(day => {
    const th = document.createElement("th");
    th.textContent = `${reverseDayMap[day]}曜日`;
    th.className = "dayHeader";

    if (day === todayKey) {
      th.classList.add("todayHeader");
    }

    headerRow.appendChild(th);
  });

  timetableBody.appendChild(headerRow);

  for (let i = 1; i <= 5; i++) {
    const row = document.createElement("tr");

    const th = document.createElement("th");
    th.textContent = `${i}限`;
    row.appendChild(th);

    visibleDays.forEach(day => {
      const td = document.createElement("td");
      td.id = `${day}-${i}`;

      if (day === todayKey) {
        td.classList.add("todayColumn");
      }

      if (editMode) {
        const course = getCurrentCourses().find(
          c => dayMap[c.day] === day && Number(c.period) === i
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

          btn.addEventListener("click", async () => {
            const name = input.value.trim();
            const jpDay = reverseDayMap[day];

            data.courses = data.courses.filter(
              c => !(
                Number(c.schoolYear) === Number(data.currentYear) &&
                c.term === data.currentTerm &&
                c.day === jpDay &&
                Number(c.period) === i
              )
            );

            if (name !== "") {
              data.courses.push({
                id: Date.now(),
                name,
                day: jpDay,
                period: i,
                color,
                schoolYear: Number(data.currentYear),
                term: data.currentTerm
              });
            }

            await save();
            renderAll();
          });

          palette.appendChild(btn);
        });

        input.addEventListener("change", async () => {
          const name = input.value.trim();
          const jpDay = reverseDayMap[day];

          data.courses = data.courses.filter(
            c => !(
              Number(c.schoolYear) === Number(data.currentYear) &&
              c.term === data.currentTerm &&
              c.day === jpDay &&
              Number(c.period) === i
            )
          );

          if (name !== "") {
            data.courses.push({
              id: Date.now(),
              name,
              day: jpDay,
              period: i,
              color: course ? course.color : COLORS[2],
              schoolYear: Number(data.currentYear),
              term: data.currentTerm
            });
          }

          await save();
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

function renderMobile() {
  mobileView.innerHTML = "";

  const visibleJapaneseDays = getVisibleJapaneseDays();
  const todayKey = getTodayDayKey();
  const currentCourses = getCurrentCourses();
  const currentTasks = getCurrentTasks();

  visibleJapaneseDays.forEach(day => {
    const dayCard = document.createElement("div");
    dayCard.className = "dayCard";

    if (dayMap[day] === todayKey) {
      dayCard.classList.add("todayDayCard");
    }

    const title = document.createElement("div");
    title.className = "dayTitle";
    title.textContent = `${day}曜日`;

    if (dayMap[day] === todayKey) {
      title.classList.add("todayDayTitle");
      title.textContent = `★ ${day}曜日`;
    }

    dayCard.appendChild(title);

    for (let period = 1; period <= 5; period++) {
      const course = currentCourses.find(
        c => c.day === day && Number(c.period) === period
      );

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

          btn.addEventListener("click", async () => {
            const name = input.value.trim();

            data.courses = data.courses.filter(
              c => !(
                Number(c.schoolYear) === Number(data.currentYear) &&
                c.term === data.currentTerm &&
                c.day === day &&
                Number(c.period) === period
              )
            );

            if (name !== "") {
              data.courses.push({
                id: Date.now(),
                name,
                day,
                period,
                color,
                schoolYear: Number(data.currentYear),
                term: data.currentTerm
              });
            }

            await save();
            renderAll();
          });

          palette.appendChild(btn);
        });

        input.addEventListener("change", async () => {
          const name = input.value.trim();

          data.courses = data.courses.filter(
            c => !(
              Number(c.schoolYear) === Number(data.currentYear) &&
              c.term === data.currentTerm &&
              c.day === day &&
              Number(c.period) === period
            )
          );

          if (name !== "") {
            data.courses.push({
              id: Date.now(),
              name,
              day,
              period,
              color: course ? course.color : COLORS[2],
              schoolYear: Number(data.currentYear),
              term: data.currentTerm
            });
          }

          await save();
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
        currentTasks
          .filter(task => Number(task.courseId) === Number(course.id))
          .forEach(task => {
            if (task.type === "single" && task.completed) return;

            const taskCard = document.createElement("label");
            taskCard.className = "taskCard";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;
            checkbox.className = "taskCheckbox";

            checkbox.addEventListener("change", async () => {
              task.completed = checkbox.checked;
              task.completedAt = checkbox.checked ? Date.now() : null;
              await save();
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

            if (editMode && task.type === "weekly") {
              taskCard.appendChild(createDeleteTaskButton(task.id));
            }

            courseCard.appendChild(taskCard);
          });
      }

      dayCard.appendChild(courseCard);
    }

    mobileView.appendChild(dayCard);
  });
}

function renderTimetable() {
  createTable();

  const currentCourses = getCurrentCourses();
  const currentTasks = getCurrentTasks();

  if (!editMode) {
    currentCourses.forEach(course => {
      const cell = document.getElementById(`${dayMap[course.day]}-${course.period}`);
      if (!cell) return;

      const div = document.createElement("div");
      div.className = "courseBlock";
      div.innerHTML = `<strong>${course.name}</strong>`;
      div.style.backgroundColor = course.color;

      cell.appendChild(div);
    });
  }

  currentTasks.forEach(task => {
    const course = currentCourses.find(c => Number(c.id) === Number(task.courseId));
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

    checkbox.addEventListener("change", async () => {
      task.completed = checkbox.checked;
      task.completedAt = checkbox.checked ? Date.now() : null;
      await save();
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

    if (editMode && task.type === "weekly") {
      div.appendChild(createDeleteTaskButton(task.id));
    }

    cell.appendChild(div);
  });
}

function renderCompleted() {
  completedList.innerHTML = "";

  getCurrentTasks().forEach(task => {
    if (task.type === "single" && task.completed) {
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.textContent = task.title;

      const backBtn = document.createElement("button");
      backBtn.textContent = "戻す";
      backBtn.onclick = async () => {
        task.completed = false;
        task.completedAt = null;
        await save();
        renderAll();
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "削除";
      deleteBtn.onclick = async () => {
        data.tasks = data.tasks.filter(t => t.id !== task.id);
        await save();
        renderAll();
      };

      li.appendChild(span);
      li.appendChild(backBtn);
      li.appendChild(deleteBtn);

      completedList.appendChild(li);
    }
  });
}

function renderAll() {
  resetWeeklyTasks();
  syncSettingsUI();
  renderYearOptions();
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

switchViewBtn.addEventListener("click", () => {
  mobileMode = !mobileMode;
  switchViewBtn.textContent = mobileMode ? "PC版に切り替え" : "スマホ版に切り替え";
  renderAll();
});

editModeBtn.addEventListener("click", () => {
  editMode = !editMode;

  editModeBtn.textContent = editMode ? "編集モード ON" : "編集モード OFF";
  editModeBtn.style.background = editMode ? "#e53935" : "";

  courseNameInput.disabled = !editMode;
  courseDayInput.disabled = !editMode;
  coursePeriodInput.disabled = !editMode;
  courseColorInput.disabled = !editMode;
  addCourseBtn.disabled = !editMode;

  courseForm.style.display = editMode ? "flex" : "none";
  courseTitle.style.display = editMode ? "block" : "none";

  renderAll();
});

showSaturdayCheckbox.addEventListener("change", async () => {
  data.settings.showSaturday = showSaturdayCheckbox.checked;
  await save();
  renderAll();
});

showSundayCheckbox.addEventListener("change", async () => {
  data.settings.showSunday = showSundayCheckbox.checked;
  await save();
  renderAll();
});

schoolYearSelect.addEventListener("change", async () => {
  data.currentYear = Number(schoolYearSelect.value);
  await save();
  renderAll();
});

termSelect.addEventListener("change", async () => {
  data.currentTerm = termSelect.value;
  await save();
  renderAll();
});

addBtn.addEventListener("click", async () => {
  const title = taskTitle.value.trim();
  const courseId = Number(courseSelect.value);
  const type = taskTypeSelect.value;

  if (!title) return;
  if (!courseId) {
    alert("授業を先に選んでください");
    return;
  }

  data.tasks.push({
    id: Date.now(),
    title,
    courseId,
    type,
    completed: false,
    completedAt: null,
    schoolYear: Number(data.currentYear),
    term: data.currentTerm
  });

  taskTitle.value = "";
  await save();
  renderAll();
});

addCourseBtn.addEventListener("click", async () => {
  if (!editMode) {
    alert("編集モードでのみ追加できます");
    return;
  }

  const name = courseNameInput.value.trim();
  const day = courseDayInput.value;
  const period = Number(coursePeriodInput.value);
  const color = courseColorInput.value;

  if (!name) return;

  const visibleJapaneseDays = getVisibleJapaneseDays();
  if (!visibleJapaneseDays.includes(day)) {
    alert("その曜日は現在表示設定でOFFになっています");
    return;
  }

  const exists = data.courses.some(
    c =>
      Number(c.schoolYear) === Number(data.currentYear) &&
      c.term === data.currentTerm &&
      c.day === day &&
      Number(c.period) === period
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
    color,
    schoolYear: Number(data.currentYear),
    term: data.currentTerm
  });

  courseNameInput.value = "";
  await save();
  renderAll();
});

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    alert("ログインに失敗しました");
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
    alert("ログアウトに失敗しました");
  }
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (user) {
    userInfo.textContent = `${user.displayName || "ユーザー"} でログイン中`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    try {
      await loadCloudData(user.uid);
    } catch (error) {
      console.error(error);
      alert("クラウドデータの読み込みに失敗しました");
      data = JSON.parse(localStorage.getItem("data")) || createDefaultData();
      normalizeData();
    }
  } else {
    userInfo.textContent = "未ログイン";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";

    data = JSON.parse(localStorage.getItem("data")) || createDefaultData();
    normalizeData();
  }

  renderAll();
});
