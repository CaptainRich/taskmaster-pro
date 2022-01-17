var tasks = {};

$("#modalDueDate").datepicker({
  minDate: 1
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
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

  // check the due date
  auditTask( taskLi );


  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

/////////////////////////////////////////////////////////////////////////////////////////
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
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
    console.log("activate", this);
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
    console.log("deactivate", this);
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
    console.log("over", event.target);
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
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
    $(".bottom-trash").removeClass("bottom-trash-drag");
    ui.draggable.remove();
    console.log("drop");
  },
  over: function(event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
    console.log("over");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-drag");
    console.log("out");
  }
});


//////////////////////////////////////////////////////////////////
// The user clicked on a task item, switch this to 'edit' mode
$(".list-group").on("click", "p", function() {
  var text =  $(this)
    .text()
    .trim();

  var textInput = $("<textArea>")        // create a new <textarea> element
    .addClass("formControl")
    .val(text);

    $(this).replaceWith(textInput);      // replace the existing <p> with the new <textarea> for editing
    textInput.trigger("focus");          // give the focus to the new <textarea> for editing

  console.log(text);  // call back that just shows a 'p' was clicked
});

// This blur event will trigger as soon as the user interacts with anything
// other than the 'textarea'.
$(".list-group").on("blur", "textarea", function() {

  // Get the textarea's current value/text
  var text = $(this).val().trim();

  // Get the parent ul's ID attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // Get the task's position in the list of other li elements
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

  $(this).replaceWith(dateInput);

  // Enable the JQueryUI datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function(){
      // When the calendar is closed, force a "change" event on the 'dateInput'
      $(this).trigger("change");
    }
  });

  // Automatically bring up the calendar
  dateInput.trigger("focus");

});

// After the date has been changed, change it back to a 'p' element.
$(".list-group").on("change", "input[type='text']", function() {
  // get the current text/value
  var date = $(this).val().trim();

  // Get the parent ul's ID attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // Get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // Update the task in the array and re-save to local storage
  tasks[status][index].date = date;
  saveTasks();

  // Recreate the 'span' element with 'Bootstrap' classes
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);
  $(this).replaceWith(taskSpan);

  // Pass this task's <li> element into the 'auditTask()' function to check the new due-date.
  auditTask( $(taskSpan).closest(".list-group-item"));
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
$("#task-form-modal .btn-save").click(function() {
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


/////////////////////////////////////////////////////////////////////
// Setup the 'date' audit function
var auditTask = function(taskEl) {

  // Get the date from the task element
  var date = $(taskEl).find("span").text().trim();

  // Convert the date to a moment object at 5pm
  var time = moment(date, "L").set("hour", 17);

  // Remove any old classes from the element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // Apply new class if the task is near/over the due date
  if( moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
}

/////////////////////////////////////////////////////////////////////
// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});


///////////////////////////////////////////////////////////////////
// load tasks for the first time
loadTasks();


///////////////////////////////////////////////////////////////////
// Start a timer to audit the tasks every 30 minutes (in case the
// browser is left open for days), so that near/past dates can be
// colored appropriately.

setInterval(function() {
 $(".card .list-group-item").each(function(el){
   auditTask(el);
 });
}, 1800000);       // audit the tasks every 30 minutes
