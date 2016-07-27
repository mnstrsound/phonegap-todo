/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent();
    },
    // Update DOM on a Received Event
    receivedEvent: function() {
        var todoApp = new TodoApp(document.getElementById('app'));
    }
};

function Todo (params) {
    this.params = params;
};

Todo.prototype.render = function (parent) {
    var todo = document.createElement('div');
    var todoName = document.createElement('div');
    var todoDate = document.createElement('div');
    var todoRemove = document.createElement('div');

    this.els = {
        parent: parent.els.todoApp,
        todo: todo,
        todoName: todoName,
        todoDate: todoDate,
        todoRemove: todoRemove
    };

    todo.classList.add('todo');
    todoName.classList.add('todo__name');
    todoDate.classList.add('todo__date');
    todoRemove.classList.add('todo__remove');

    todoName.innerText = this.params.name;
    todoDate.innerText = this.params.date;
    todoRemove.innerText = '╳';

    todo.appendChild(todoDate);
    todo.appendChild(todoName);
    todo.appendChild(todoRemove);
    parent.els.todoApp.appendChild(todo);

    this.parent = parent;
    this.updateView();
    this.setEventListeners();
};

Todo.prototype.setEventListeners = function () {
    this.els.todoRemove.addEventListener('click', this.remove.bind(this), false);
    this.els.todo.addEventListener('click', this.update.bind(this), false);
};

Todo.prototype.updateView = function () {
    if (this.params.finished) {
        this.els.todo.classList.add('todo--finished');
    } else {
        this.els.todo.classList.remove('todo--finished');
    }
};

Todo.prototype.remove = function (e) {
    e.stopPropagation();
    this.parent.removeTodo(this);
};

Todo.prototype.update = function () {
    this.params.finished = !this.params.finished; 
    this.parent.updateTodo(this);
};


function TodoApp (elem) {
    var _this = this;
    this.parent = elem;
    this.todos = [];
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    var open;
    try {
        open = indexedDB.open('TodoApp');
    } catch (e) {
        alert('Catched: ' + e);
    }

    open.onupgradeneeded = function() {
        var db = open.result;
        db.createObjectStore('Todos', {keyPath: 'id', autoIncrement: true});

        _this.db = db;
    };

    open.onsuccess = function() {
        _this.db = open.result;
        _this.getTodos();
    };

    open.onerror = function (e) {
        alert('Open error: ' + e.errorCode);
    };

    this.render();
}

var error = document.getElementById('error');

TodoApp.prototype.getTodos = function () {
    var _this = this;
    var transaction = this.db.transaction('Todos', 'readwrite');
    var store = transaction.objectStore('Todos');
    var request = store.getAll();

    request.onsuccess = function (e) {
        error.innerText = 'Todos: ' + e.target.result.toString();
        _this.todos = e.target.result;
        _this.renderTodos();
    };
    
    request.onerror = function (e) {
        error.innerText = 'Get error: ' + e.errorCode;
    }
};


TodoApp.prototype.renderTodos = function () {
    var _this = this;
    for (var i = 0, len =  this.todos.length; i < len; i++) {
        var todo = new Todo(_this.todos[i]);
        todo.render(_this);
    }
};

TodoApp.prototype.addTodo = function (e) {
    e.preventDefault();

    var _this = this;
    var params = {};
    var todo;
    var transaction = this.db.transaction('Todos', 'readwrite');
    var store = transaction.objectStore('Todos');
    var request;

    if (!this.els.todoAppFormNameInput.value) return false;
    params.name = this.els.todoAppFormNameInput.value;
    this.els.todoAppFormNameInput.value = '';

    if (this.els.todoAppFormNameInput.value) return false;
    params.date = this.els.todoAppFormDateInput.value;
    this.els.todoAppFormDateInput.value = '';

    params.finished = false;

    request = store.add(params);

    request.onsuccess = function (e) {
        params.id = e.target.result;
        todo = new Todo(params);
        todo.render(_this);

        _this.todos.push(todo);
    };

    request.onerror = function (e) {
        error.innerText = 'Add error: ' + e.errorCode;
    };
};

TodoApp.prototype.removeTodo = function (todo) {
    var _this = this;
    var transaction = this.db.transaction('Todos', 'readwrite');
    var store = transaction.objectStore('Todos');
    var request = store.delete(todo.params.id);

    request.onsuccess = function () {
        _this.els.todoApp.removeChild(todo.els.todo);
        _this.todos.splice(_this.todos.indexOf(todo), 1);
    };

    request.onerror = function (e) {
        error.innerText = 'Remove error: ' + e.errorCode;
    };
};

TodoApp.prototype.updateTodo = function (todo) {
    var _this = this;
    var transaction = this.db.transaction('Todos', 'readwrite');
    var store = transaction.objectStore('Todos');
    var request = store.openCursor(todo.params.id);

    request.onsuccess = function (e) {
        var cursor = e.target.result;
        var request = cursor.update(todo.params);

        request.onsuccess = function (e) {
            todo.updateView();
        };

        request.onerror = function (e) {
            error.innerText = 'Update error: ' + e.errorCode;
        };
    };

    request.onerror = function (e) {
        error.innerText = 'Cursor error: ' + e.errorCode;
    };

};

TodoApp.prototype.render = function () {
    var todoApp = document.createElement('div');
    var todoAppForm = document.createElement('form');
    var todoAppFormNameInput = document.createElement('input');
    var todoAppFormDateInput = document.createElement('input');
    var todoAppFormSubmit = document.createElement('input');

    todoAppForm.setAttribute('action', '#');
    todoAppFormNameInput.setAttribute('type', 'text');
    todoAppFormNameInput.setAttribute('name', 'name');
    todoAppFormDateInput.setAttribute('type', 'text');
    todoAppFormDateInput.setAttribute('name', 'date');
    todoAppFormSubmit.setAttribute('type', 'submit');
    todoAppFormSubmit.setAttribute('value', 'Добавить');

    todoApp.classList.add('todoapp');
    todoAppForm.classList.add('todoapp__form');
    todoAppFormNameInput.classList.add('todoapp__input', 'todoapp__input--name');
    todoAppFormDateInput.classList.add('todoapp__input', 'todoapp__input--date');
    todoAppFormSubmit.classList.add('todoapp__submit');

    todoAppForm.appendChild(todoAppFormNameInput);
    todoAppForm.appendChild(todoAppFormDateInput);
    todoAppForm.appendChild(todoAppFormSubmit);
    todoApp.appendChild(todoAppForm);

    this.els = {
        todoApp: todoApp,
        todoAppForm: todoAppForm,
        todoAppFormNameInput: todoAppFormNameInput,
        todoAppFormDateInput: todoAppFormDateInput,
        todoAppFormSubmit: todoAppFormSubmit
    };

   this.parent.appendChild(todoApp);
    this.setEventListeners();
};

TodoApp.prototype.setEventListeners = function () {
    this.els.todoAppForm.addEventListener('submit', this.addTodo.bind(this), false);
};