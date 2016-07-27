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

