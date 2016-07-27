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
    var todoDesc = document.createElement('div');
    var todoRemove = document.createElement('div');

    this.els = {
        parent: parent.els.todoApp,
        todo: todo,
        todoName: todoName,
        todoDate: todoDate,
        todoDesc: todoDesc,
        todoRemove: todoRemove
    };

    todo.classList.add('todo');
    todoName.classList.add('todo__name');
    todoDate.classList.add('todo__date');
    todoDesc.classList.add('todo__desc');
    todoRemove.classList.add('todo__remove');

    todoName.innerText = this.params.name;
    todoDate.innerText = this.params.date;
    todoDesc.innerText = this.params.desc;
    todoRemove.innerText = 'удалить';

    todo.appendChild(todoDate);
    todo.appendChild(todoName);
    todo.appendChild(todoDesc);
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
    window.shimIndexedDB.__useShim();
    var indexedDB = window.shimIndexedDB || window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    var  open = indexedDB.open('Todos', 1);

    open.onupgradeneeded = function(e) {
        var db = e.target.result;
        db.createObjectStore('Todos', {keyPath: 'id', autoIncrement: true});

        _this.db = db;
    };

    open.onsuccess = function(e) {
        _this.db = e.target.result;
        _this.getTodos();
    };

    open.onerror = function (e) {
        console.log(e);
    };

    this.render();
}

TodoApp.prototype.getTodos = function () {
    var _this = this;
    var transaction = this.db.transaction('Todos', 'readwrite');
    var store = transaction.objectStore('Todos');
    var request = store.openCursor();

    transaction.oncomplete = function () {
      _this.renderTodos();
    };

    request.onsuccess = function (e) {
        var cursor = e.target.result;

        if (cursor) {
            _this.todos.push(cursor.value);
            cursor.continue();
        }
    };

    request.onerror = function (e) {
        console.log(e);
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

    var valid = true;

    function checkInput(el, str) {
        if (!el.value) {
            el.classList.add('todoapp__input--error');
            valid = false;
        } else {
            el.classList.remove('todoapp__input--error');
            params[str] = el.value;
        }
    }

    checkInput(this.els.todoAppFormNameInput, 'name');
    checkInput(this.els.todoAppFormDateInput, 'date');
    checkInput(this.els.todoAppFormDescInput, 'desc');

    if (!valid) {
        return;
    }

    this.els.todoAppFormNameInput.value = '';
    this.els.todoAppFormDateInput.value = '';
    this.els.todoAppFormDescInput.value = '';

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
        console.log(e);
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
            console.log(e);
        };
    };

    request.onerror = function (e) {
        console.log(e);
    };

};

TodoApp.prototype.render = function () {
    var todoApp = document.createElement('div');
    var todoAppForm = document.createElement('form');
    var todoAppFormNameInput = document.createElement('input');
    var todoAppFormDateInput = document.createElement('input');
    var todoAppFormDescInput = document.createElement('textarea');
    var todoAppFormSubmit = document.createElement('input');

    todoAppForm.setAttribute('action', '#');
    todoAppFormNameInput.setAttribute('type', 'text');
    todoAppFormNameInput.setAttribute('name', 'name');
    todoAppFormNameInput.setAttribute('placeholder', 'Введите название');
    todoAppFormDateInput.setAttribute('type', 'text');
    todoAppFormDateInput.setAttribute('name', 'date');
    todoAppFormDateInput.setAttribute('placeholder', 'Введите дату');
    todoAppFormDescInput.setAttribute('name', 'desc');
    todoAppFormDescInput.setAttribute('placeholder', 'Введите описание');
    todoAppFormSubmit.setAttribute('type', 'submit');
    todoAppFormSubmit.setAttribute('value', 'Добавить');

    todoApp.classList.add('todoapp');
    todoAppForm.classList.add('todoapp__form');
    todoAppFormNameInput.classList.add('todoapp__input', 'todoapp__input--name');
    todoAppFormDateInput.classList.add('todoapp__input', 'todoapp__input--date');
    todoAppFormDescInput.classList.add('todoapp__input', 'todoapp__input--desc');
    todoAppFormSubmit.classList.add('todoapp__submit');

    todoAppForm.appendChild(todoAppFormNameInput);
    todoAppForm.appendChild(todoAppFormDateInput);
    todoAppForm.appendChild(todoAppFormDescInput);
    todoAppForm.appendChild(todoAppFormSubmit);
    todoApp.appendChild(todoAppForm);

    this.els = {
        todoApp: todoApp,
        todoAppForm: todoAppForm,
        todoAppFormNameInput: todoAppFormNameInput,
        todoAppFormDateInput: todoAppFormDateInput,
        todoAppFormDescInput: todoAppFormDescInput,
        todoAppFormSubmit: todoAppFormSubmit
    };

   this.parent.appendChild(todoApp);
    this.setEventListeners();
};

TodoApp.prototype.setEventListeners = function () {
    this.els.todoAppForm.addEventListener('submit', this.addTodo.bind(this), false);
};