'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Column } from './Column';
import { Item } from './Item';
import Card from '../Card/Card';
import { Trash } from './Trash';
import AddTask from '../AddTask/AddTask';
import RecentActivities from '../RecentActivities/RecentActivities';
import Toast from '../Toast/Toast';

const Board = () => {
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [activeId, setActiveId] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [undoAction] = useState(null);
  const [toastTimer, setToastTimer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const router = useRouter();

  type Task = {
  id: number | string;
  title: string;
  status: "Todo" | "InProgress" | "Done";
  priority?: string;
};

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ✅ Fetch tasks on mount and group them into columns
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/');
      return;
    }

    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:3001/tasks');
        if (response.ok) {
          const data = await response.json();

          const grouped = { todo: [], inProgress: [], done: [] };
          data.forEach((task: Task) => {
            if (task.status === 'Todo') grouped.todo.push(task);
            else if (task.status === 'InProgress') grouped.inProgress.push(task);
            else if (task.status === 'Done') grouped.done.push(task);
          });

          setTasks(grouped);
        } else {
          console.error('Error fetching tasks: Response not OK');
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [router]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const user = localStorage.getItem('user');

    // 🗑 Delete into trash
    if (over.id === 'trash') {
      const sourceColumnId = active.data.current.sortable.containerId;
      const taskId = active.id;
      const taskToDelete = tasks[sourceColumnId].find((t) => t.id === taskId);
      const newItems = { ...tasks };
      newItems[sourceColumnId] = newItems[sourceColumnId].filter((t) => t.id !== taskId);
      setTasks(newItems);

      try {
        await fetch(`http://localhost:3001/tasks/${taskId}`, { method: 'DELETE' });
        await fetch('http://localhost:3001/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: `User ${user} deleted task "${taskToDelete.title}"` }),
        });
      } catch (error) {
        console.error('Error deleting task:', error);
      }
      return;
    }

    // ♻️ Move tasks between columns
    if (active.id !== over.id) {
      const oldTasks = JSON.parse(JSON.stringify(tasks));
      const sourceColumnId = active.data.current.sortable.containerId;
      const destinationColumnId = over.data.current?.sortable.containerId || over.id;
      const sourceTask = tasks[sourceColumnId].find((t) => t.id === active.id);

      if (!sourceTask) return;

      setTasks((prev) => {
        const newTasks = { ...prev };
        const sourceColumn = [...newTasks[sourceColumnId]];
        const destinationColumn = [...newTasks[destinationColumnId]];

        // remove from source
        const sourceIndex = sourceColumn.findIndex((t) => t.id === active.id);
        sourceColumn.splice(sourceIndex, 1);

        // add to destination
        if (over.data.current?.sortable.index !== undefined) {
          destinationColumn.splice(over.data.current.sortable.index, 0, sourceTask);
        } else {
          destinationColumn.push(sourceTask);
        }

        newTasks[sourceColumnId] = sourceColumn;
        newTasks[destinationColumnId] = destinationColumn;

        return newTasks;
      });

      // Save after delay
      if (toastTimer) clearTimeout(toastTimer);
      setToastMessage(`Moved task to ${destinationColumnId}`);
      setShowToast(true);

      const newTimer = setTimeout(async () => {
        try {
          // update status in backend
          await fetch(`http://localhost:3001/tasks/${sourceTask.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: destinationColumnId === 'todo' ? 'Todo' : destinationColumnId === 'inProgress' ? 'InProgress' : 'Done' }),
          });
          if (sourceColumnId !== destinationColumnId) {
            await fetch('http://localhost:3001/activities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                description: `User ${user} moved task "${sourceTask.title}" from ${sourceColumnId} to ${destinationColumnId}`,
              }),
            });
          }
        } catch (error) {
          console.error('Error updating tasks:', error);
          setTasks(oldTasks);
        }
        setShowToast(false);
        setToastTimer(null);
      }, 3000);

      setToastTimer(newTimer);
    }
  };

  // ➕ Add new task
  const handleAddTask = async (newTask) => {
    const user = localStorage.getItem('user');
    const newTaskId = Date.now();
    const task = { id: newTaskId, ...newTask };
    const oldTasks = JSON.parse(JSON.stringify(tasks));

    const statusMap = { Todo: 'todo', InProgress: 'inProgress', Done: 'done' };
    const columnKey = statusMap[task.status] || 'todo';

    setTasks((prev) => ({
      ...prev,
      [columnKey]: [task, ...(prev[columnKey] || [])],
    }));
    setIsAddTaskModalOpen(false);

    try {
      await fetch('http://localhost:3001/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      await fetch('http://localhost:3001/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: `User ${user} created task "${task.title}" in ${task.status}` }),
      });
    } catch (error) {
      console.error('Error adding task:', error);
      setTasks(oldTasks);
    }
  };

  const handleLogout = async () => {
    const user = localStorage.getItem('user');
    localStorage.removeItem('user');
    await fetch('http://localhost:3001/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: `User ${user} logged out.` }),
    });
    router.push('/');
  };

  const getTaskById = (id) => {
    for (const column of Object.values(tasks)) {
      const task = column.find((task) => task.id === id);
      if (task) return task;
    }
    return null;
  };

  const activeTask = activeId ? getTaskById(activeId) : null;

  // 🔍 Filters
  const filteredTasks = useMemo(() => {
    let filtered = { ...tasks };

    if (searchTerm) {
      filtered = Object.keys(filtered).reduce((acc, columnId) => {
        acc[columnId] = (filtered[columnId] || []).filter((task) =>
          task.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return acc;
      }, { todo: [], inProgress: [], done: [] });
    }

    if (priorityFilter !== 'all') {
      filtered = Object.keys(filtered).reduce((acc, columnId) => {
        acc[columnId] = (filtered[columnId] || []).filter((t) => t.priority === priorityFilter);
        return acc;
      }, { todo: [], inProgress: [], done: [] });
    }

    return filtered;
  }, [tasks, searchTerm, priorityFilter]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Sprint Board</h1>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search tasks..."
              className="mr-4 p-2 border rounded"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select className="mr-4 p-2 border rounded" onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button className="bg-blue-500 text-white px-4 py-2 rounded mr-4" onClick={() => setIsAddTaskModalOpen(true)}>
              Add Task
            </button>
            <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3 grid grid-cols-3 gap-4">
            {Object.keys(filteredTasks).map((columnId) => (
              <Column key={columnId} id={columnId} items={(filteredTasks[columnId] || []).map((task) => task.id)}>
                <h2 className="text-lg font-bold mb-4">
                  {columnId === 'todo' ? 'Todo' : columnId === 'inProgress' ? 'In Progress' : 'Done'}
                </h2>
                {(filteredTasks[columnId] || []).map((task) => (
                  <Item key={task.id} id={task.id}>
                    <Card task={task} />
                  </Item>
                ))}
              </Column>
            ))}
          </div>
          <div className="col-span-1">
            <RecentActivities />
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <Item id={activeTask.id}>
              <Card task={activeTask} />
            </Item>
          ) : null}
        </DragOverlay>

        <div className="fixed bottom-4 right-4">
          <Trash>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white">
              Delete
            </div>
          </Trash>
        </div>

        {isAddTaskModalOpen && (
          <AddTask onAddTask={handleAddTask} onCancel={() => setIsAddTaskModalOpen(false)} />
        )}
        {showToast && <Toast message={toastMessage} onUndo={undoAction} onDismiss={() => setShowToast(false)} />}
      </div>
    </DndContext>
  );
};

export default Board;
