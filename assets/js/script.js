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

  // check due date
  auditTask(taskLi);

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

var auditTask = function(taskEl) {
  var date = $(taskEl).find("span").text().trim();
  var time = moment(date, "L").set("hour", 17);
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger")
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } 
  else if (Math.abs(moment().diff(time, "days")) <=2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

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

// click on task description to edit the task and focus on text box
$(".list-group").on("click", "p", function() {
    var text = $(this)
    .text()
    .trim();
    
    var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
$(this).replaceWith(textInput);
    textInput.trigger("focus");
});

// user clicks outside of textbox, it will auto save and revert to normal display with updated text
$(".list-group").on("blur", "textarea", function() {
    var text = $(this).val();
    var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

    var index = $(this)
    .closest(".list-group-item")
    .index();

    tasks[status][index].text = text;
    saveTasks();

    var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

$(this).replaceWith(taskP);
});

// user wants to edit task date, it will focus on text box and allow them to edit
$(".list-group").on("click", "span", function() {
    var date = $(this).text().trim();

    var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

$(this).replaceWith(dateInput);

// jquery datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      $(this).trigger("change");
    }
  });

    dateInput.trigger("focus");
});

// user clicks out of textbox, it will auto save and revert to normal display with updated date
$(".list-group").on("change", "input[type='text']", function() {
    var date = $(this).val();

    var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

    var index = $(this)
    .closest(".list-group-item")
    .index();

    tasks[status][index].date = date;
    saveTasks();

    var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

    $(this).replaceWith(taskSpan);

    // pass task <li> el into auditTask to check new due date
    auditTask($(taskSpan).closest(".list-group-item"));
});

//make list items sortable
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event, ui) {
    $(this).addClass(".dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event, ui) {
    $(this).removeClass(".dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function() {
    // empty array for task data
    var tempArr = [];
    // loop over current set of children in sortable list
    $(this).children().each(function() {
        // save values in temp array
      tempArr.push({
      text: $(this)
      .find("p")
      .text()
      .trim(),
      date: $(this)
      .find("span")
      .text()
      .trim()
    });
  });

    var arrName = $(this)
      .attr("id")
      .replace("list-", "");
    
    //update array on task data and save
    tasks[arrName] = tempArr;
    saveTasks();
  },
  stop: function(event) {
    $(this).removeClass("dropover");
  }
});

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function(event, ui) {
    console.log(ui);
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});

// add datepicker UI to modal
$("#modalDueDate").datepicker({
  minDate: 1
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

setInterval(function () {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, (1000 * 60) * 30);