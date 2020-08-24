var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);


  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

//////////////////////////////////////////////////////////////////
// Setup the lists to be "sortable", so we can reorder them and
// move them between lists.
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    console.log("activate", this);
  },
  deactivate: function(event) {
    console.log("deactivate", this);
  },
  over: function(event) {
    console.log("over", event.target);
  },
  out: function(event) {
    console.log("out", event.target);
  },
  update: function(event) {

    // Define an array to store the updated task data.
    var tempArr = [];

    // Loop over the current set of children in the sortable list
    $(this).children().each(function () {
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      // Put the data in a new temporary array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });
    console.log( "This is the tempArr: ", tempArr);

    // Trim down list's ID to match the object property
    var arrName = $(this)
       .attr("id")
       .replace("list-", "");

    // Update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});


///////////////////////////////////////////////////////////////////
// Setup the ability to drop a task on/in the 'delete' zone
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
    console.log("drop");
  },
  over: function(event, ui) {
    console.log("over");
  },
  out: function(event, ui) {
    console.log("out");
  }
});


//////////////////////////////////////////////////////////////////
// The user clicked on a task item, switch this to 'edit' mode
$(".list-group").on("click", "p", function() {
  var text =  $(this)
    .text()
    .trim();

  var textInput = $("<textArea>")
    .addClass("formControl")
    .val(text);

    $(this).replaceWith(textInput);
    textInput.trigger("focus");

  console.log(text);  // call back that just shows a 'p' was clicked
});

// This blur event will trigger as soon as the user interacts with anything
// other than the 'textarea'.
$(".list-group").on("blur", "textarea", function() {

  // Get the textarea's current value/text
  var text = $(this).val().trim();

  // Get the parent ul's ID attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // Get the task's postition in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // Update the edited task using the three values just determined.
  tasks[status][index].text = text;
  saveTasks();

  // Change the task back from a 'textarea' to a 'p'
  var taskP = $("<p>").addClass("m-1").text(text);
  $(this).replaceWith(taskP);
});


////////////////////////////////////////////////////////////////////
// The user clicked on a date item, switch this to 'edit' mode
$(".list-group").on("click", "span", function() {
  // Get the current task
  var date = $(this).text().trim();

  // Create the new input element
  var dateInput = $("<input>").attr("type", "text").addClass("form-control").val(date);

  // Swap out the elements
  $(this).replaceWith(dateInput);

  // Automatically focus on the new element
  dateInput.trigger("focus");
});

// After the date has been changed, change it back to a 'p' element.
$(".list-group").on("blur", "input[type='text']", function() {
  // get the current text/value
  var date = $(this).val().trim();

  // Get the parent ul's ID attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // Get the task's postition in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // Update the task in the array and resave to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // Recreate the 'span' element with 'Bootstrap' classes
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);
  $(this).replaceWith(taskSpan);
})


// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();


