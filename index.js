// TASK: import helper functions from utils
// TASK: import initialData
import { getTasks, createNewTask, deleteTask } from './utils/taskFunctions.js';
import { initialData } from './initialData.js';

/*************************************************************************************************************************************************
 * FIX BUGS!!!
 * **********************************************************************************************************************************************/

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true')
  } else {
    console.log('Data already exists in localStorage');
  }
}

// TASK: Get elements from the DOM
const elements = {
  headerBoardName: document.getElementById('header-board-name'),
  modalWindow: document.getElementById('new-task-modal-window'),
  editTaskModal: document.querySelector('.edit-task-modal-window'),
  filterDiv: document.getElementById('filterDiv'),
  hideSideBarBtn: document.getElementById('hide-side-bar-btn'),
  showSideBarBtn: document.getElementById('show-side-bar-btn'),
  themeSwitch: document.getElementById('switch'),
  createNewTaskBtn: document.getElementById('add-new-task-btn'),
  columnDivs: document.querySelectorAll('.column-div'),
};

let activeBoard = "";

// Extracts unique board names from tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"))
    activeBoard = localStorageBoard ? localStorageBoard :  boards[0]; 
    elements.headerBoardName.textContent = activeBoard
    styleActiveBoard(activeBoard)
    refreshTasksUI();
  }
}

function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = '<h4 id="headline-sidepanel">ALL BOARDS</h4>';
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener('click', () => { 
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board;
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}

function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks();
  const filteredTasks = tasks.filter(task => task.board === boardName);

  elements.columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => { 
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);
      taskElement.addEventListener("click", () => { 
        openEditTaskModal(task);
      });
      tasksContainer.appendChild(taskElement);
    });
  });
}

function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => { 
    if(btn.textContent === boardName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`);
  if (!column) return;

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title;
  taskElement.setAttribute('data-task-id', task.id);
  taskElement.addEventListener('click', () => openEditTaskModal(task));



  tasksContainer.appendChild(taskElement);
}

function setupEventListeners() {
  document.getElementById('cancel-edit-btn').addEventListener('click', () => toggleModal(false, elements.editTaskModal));
  document.getElementById('cancel-add-task-btn').addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
  });
  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
  });
  elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));
  elements.themeSwitch.addEventListener('change', toggleTheme);
  elements.createNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block';
  });
  elements.modalWindow.addEventListener('submit', addTask);
}

function toggleModal(show, modal = elements.modalWindow) {
  modal.style.display = show ? 'block' : 'none';
}

function addTask(event) {
  event.preventDefault();
  const title = document.getElementById('title-input').value.trim();
  const description = document.getElementById('desc-input').value.trim();
  const status = document.getElementById('select-status').value;

  if (!title || !status) return;

  const task = {
    title,
    description,
    status,
    board: activeBoard,
  };

  const newTask = createNewTask(task);
  if (newTask) {
    addTaskToUI(newTask);
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
    event.target.reset();
    refreshTasksUI();
  }
}

function toggleSidebar(show) {
  const sidebar = document.getElementById('side-bar-div');
  const showBtn = document.getElementById('show-side-bar-btn');
  sidebar.style.display = show ? 'flex' : 'none';
  showBtn.style.display = show ? 'none' : 'block';
  localStorage.setItem('showSideBar', show);
}

function toggleTheme() {
  const lightThemeEnabled = document.body.classList.toggle('light-theme');
  localStorage.setItem('light-theme', lightThemeEnabled ? 'enabled' : 'disabled');
}

function openEditTaskModal(task) {
  document.getElementById('edit-task-title-input').value = task.title;
  document.getElementById('edit-task-desc-input').value = task.description;
  document.getElementById('edit-select-status').value = task.status;

  document.getElementById('save-task-changes-btn').onclick = () => saveTaskChanges(task.id);
  document.getElementById('delete-task-btn').onclick = () => {
    deleteTask(task.id);
    toggleModal(false, elements.editTaskModal);
    refreshTasksUI();
  };

  toggleModal(true, elements.editTaskModal);
}

function saveTaskChanges(taskId) {
  const updatedTitle = document.getElementById('edit-task-title-input').value.trim();
  const updatedDesc = document.getElementById('edit-task-desc-input').value.trim();
  const updatedStatus = document.getElementById('edit-select-status').value;

  const updatedTask = {
    id: taskId,
    title: updatedTitle,
    description: updatedDesc,
    status: updatedStatus,
    board: activeBoard,
  };

  updateTask(taskId, updatedTask);
  toggleModal(false, elements.editTaskModal);
  refreshTasksUI();
}

/*************************************************************************************************************************************************/

document.addEventListener('DOMContentLoaded', function() {
  initializeData();
  init();
});

function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks();
}
