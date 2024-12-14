import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "tabulator-tables/dist/css/tabulator.min.css";

function App() {
  const tableref = useRef(null);
  const tabulatorInstance = useRef(null);
  const [filterOption, setFilterOption] = useState("All");
  const [dataLength, setDataLength] = useState(0);
  const [taskData, setTaskData] = useState([]);
  const [initialData, setInitialData] = useState([]);
  const [searchValue, setSearchvalue] = useState("");

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/todos"
        );
        const data = await response.json();
        const datawithdesc = data.map((task) => ({
          ...task,
          description: "No Description Available",
        }));
        setTaskData(datawithdesc);
        setDataLength(datawithdesc.length);
        setInitialData(datawithdesc);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to fetch tasks");
      }
    };
    fetchData();
  }, []);

  // Initialize and Update Tabulator Table
  useEffect(() => {
    if (taskData.length > 0) {
      // Destroy existing instance
      if (tabulatorInstance.current) {
        tabulatorInstance.current.destroy();
      }

      // Create a new Tabulator instance
      tabulatorInstance.current = new Tabulator(tableref.current, {
        data: taskData.slice(0, 20),
        layout: "fitColumns",
        columns: [
          { title: "Task ID", field: "id" },
          {
            title: "Title",
            field: "title",
            editor: "input",
            cellEdited: function (cell) {
              const newValue = cell.getValue();
              const rowData = cell.getRow().getData();

              setInitialData((prevData) =>
                prevData.map((task) =>
                  task.id === rowData.id ? { ...task, title: newValue } : task
                )
              );
              toast.info(`Task "${rowData.id}" title updated`);
            },
          },
          {
            title: "Description",
            field: "description",
            editor: "input",
            cellEdited: function (cell) {
              const newValue = cell.getValue();
              const rowData = cell.getRow().getData();

              setInitialData((prevData) =>
                prevData.map((task) =>
                  task.id === rowData.id
                    ? { ...task, description: newValue }
                    : task
                )
              );
              toast.info(`Task "${rowData.id}" description updated`);
            },
          },
          {
            title: "Status",
            field: "completed",
            editor: "list",
            editorParams: { values: ["To Do", "Done", "Progress"] },
            formatter: function (cell) {
              const value = cell.getValue();
              if (value === true || value === "Done") return "Done";
              if (value === false || value === "To Do") return "To Do";
              return "Progress";
            },
            cellEdited: function (cell) {
              const newValue = cell.getValue();
              const rowData = cell.getRow().getData();

              setInitialData((prevData) =>
                prevData.map((task) =>
                  task.id === rowData.id
                    ? { ...task, completed: newValue }
                    : task
                )
              );
              toast.info(`Task "${rowData.id}" status changed to ${newValue}`);
            },
          },
          {
            title: "",
            formatter: () => '<button class="delete-btn">Delete</button>',
            cellClick: function (e, cell) {
              const rowData = cell.getRow().getData();

              // Remove task from initialData and taskData
              setTaskData((prevData) =>
                prevData.filter((task) => task.id !== rowData.id)
              );
              setInitialData((prevData) =>
                prevData.filter((task) => task.id !== rowData.id)
              );
              toast.error(`Task "${rowData.id}" deleted`);
            },
          },
        ],
      });
    }
    // To Display Empty Table instead of Previous Instance Table if Any Filter Option has Zero Element
    else {
      if (tabulatorInstance.current) {
        tabulatorInstance.current.destroy();
      }
    }
  }, [taskData]);

  // Filter function
  const handleFilter = (selectedOption) => {
    // Update filter option
    setFilterOption(selectedOption);
    searchandfilter(selectedOption);
  };

  const handleAddNewTask = () => {
    // Find the maximum existing ID to ensure unique ID
    const maxId = Math.max(...initialData.map((task) => task.id), 0);

    const newTask = {
      id: maxId + 1,
      title: "New Task",
      userId: 1,
      completed: false,
      description: "New Task Created",
    };

    setInitialData((prevData) => [...prevData, newTask]);

    // Update task data (this will be used for display)
    setTaskData((prevData) => {
      // If current view is less than 20, add to end
      // Otherwise, replace the last temporarily with new task
      const updatedData =
        prevData.length < 20
          ? [...prevData, newTask]
          : [...prevData.slice(0, 19), newTask, ...prevData.slice(20)];
      return updatedData;
    });

    setDataLength((prevLength) => prevLength + 1);
    toast.success(`New task added with ID ${newTask.id}`);
  };

  const searchRecords = () => {
    searchandfilter(filterOption);
    totaltask();
  };

  const searchandfilter = (selectedOption) => {
    const input = document.getElementsByClassName("search-bar")[0];
    const inputElement = input ? input.value : "";
    let filteredData;
    switch (selectedOption) {
      case "Done":
        filteredData = initialData.filter(
          (task) => task.completed === true || task.completed === "Done"
        );
        break;
      case "To Do":
        filteredData = initialData.filter(
          (task) => task.completed === false || task.completed === "To Do"
        );
        break;
      case "Progress":
        filteredData = initialData.filter(
          (task) => task.completed === "Progress"
        );
        break;
      default:
        filteredData = initialData;
    }
    const finalData = filteredData.filter((task) => {
      const title = task.title || "";
      const description = task.description || "";
      return (
        title.toLowerCase().includes(inputElement.toLowerCase()) ||
        description.toLowerCase().includes(inputElement.toLowerCase())
      );
    });
    setTaskData(finalData);
    toast.info(`Found ${finalData.length} matching tasks`);
  };

  const totaltask = () => {
    const todotask = taskData.filter(
      (task) => task.completed === false || task.completed === "To Do"
    );
    const completetask = taskData.filter(
      (task) => task.completed === true || task.completed === "Done"
    );
    const inprogresstask = taskData.filter(
      (task) => task.completed === "Progress"
    );
    return (
      <div id="task_capacity">
        <h1>Total = {taskData.length}</h1>
        <h1>To Do = {todotask.length}</h1>
        <h1>In Progress = {inprogresstask.length}</h1>
        <h1>Done = {completetask.length}</h1>
      </div>
    );
  };

  return (
    <div className="App">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="filter-container">
        {totaltask()}
        <div id="filterdata">
          <select
            value={filterOption}
            onChange={(e) => {
              handleFilter(e.target.value);
              toast.info(`Filtered to show ${e.target.value} tasks`);
            }}
          >
            <option value="All">All Tasks</option>
            <option value="Done">Done</option>
            <option value="To Do">To Do</option>
            <option value="Progress">Progress</option>
          </select>
          <input
            className="search-bar"
            type="text"
            placeholder="Search Records"
            onKeyDown={(e) => e.key === "Enter" && searchRecords(e)}
          />
        </div>
      </div>
      <div id="tabledata" ref={tableref}></div>
      <div id="newtask-container">
        <button id="newtask" onClick={handleAddNewTask}>
          New Task
        </button>
      </div>
    </div>
  );
}

export default App;
