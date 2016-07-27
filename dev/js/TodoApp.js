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

var error = document.getElementById('error');

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
            items.push(cursor.value);
            _this.todos.push(e.target.result);
            cursor.continue();
        }
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