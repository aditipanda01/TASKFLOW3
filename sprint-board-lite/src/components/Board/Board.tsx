'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Column } from './Column';
import { Item } from './Item';
import Card from '../Card/Card';
import { Trash } from './Trash';
import AddTask from '../AddTask/AddTask';
import RecentActivities from '../RecentActivities/RecentActivities';

const Board = () => {
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [activeId, setActiveId] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/');
    }

    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:3001/tasks');
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    if (user) {
      fetchTasks();
    }
  }, [router]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const user = localStorage.getItem('user');

    if (over.id === 'trash') {
      const sourceColumnId = active.data.current.sortable.containerId;
      const taskId = active.id;
      const taskToDelete = tasks[sourceColumnId].find((t) => t.id === taskId);
      const newItems = { ...tasks };
      newItems[sourceColumnId] = newItems[sourceColumnId].filter((task) => task.id !== taskId);
      setTasks(newItems);

      try {
        await fetch(`http://localhost:3001/tasks/${sourceColumnId}/${taskId}`, { method: 'DELETE' });
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

    if (active.id !== over.id) {
      const sourceColumnId = active.data.current.sortable.containerId;
      const destinationColumnId = over.data.current?.sortable.containerId || over.id;
      const sourceTask = tasks[sourceColumnId].find((task) => task.id === active.id);

      if (!sourceTask) return;

      const oldTasks = JSON.parse(JSON.stringify(tasks));

      setTasks((prev) => {
        const newTasks = { ...prev };
        const sourceColumn = newTasks[sourceColumnId];
        const destinationColumn = newTasks[destinationColumnId];
        const sourceIndex = sourceColumn.findIndex((task) => task.id === active.id);
        sourceColumn.splice(sourceIndex, 1);

        if (destinationColumnId === over.id) {
          const overIndex = destinationColumn.findIndex((task) => task.id === over.id);
          destinationColumn.splice(overIndex, 0, sourceTask);
        } else {
          const overContainerIndex = over.data.current?.sortable.index;
          if (overContainerIndex !== undefined) {
            destinationColumn.splice(overContainerIndex, 0, sourceTask);
          } else {
            destinationColumn.push(sourceTask);
          }
        }

        return newTasks;
      });

      const randomNumber = Math.random();
      if (randomNumber < 0.1) {
        setTimeout(() => {
          alert('Failed to move the task. Please try again.');
          setTasks(oldTasks);
        }, 1000);
      } else {
        try {
          await fetch('http://localhost:3001/tasks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tasks),
          });
          if (sourceColumnId !== destinationColumnId) {
            await fetch('http://localhost:3001/activities', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ description: `User ${user} moved task "${sourceTask.title}" from ${sourceColumnId} to ${destinationColumnId}` }),
            });
          }
        } catch (error) {
          console.error('Error updating tasks:', error);
          setTasks(oldTasks);
          alert('Failed to move the task. Please try again.');
        }
      }
    }
  };

  const handleAddTask = async (newTask) => {
    const user = localStorage.getItem('user');
    const newTaskId = Date.now();
    const task = { id: newTaskId, ...newTask };
    const oldTasks = JSON.parse(JSON.stringify(tasks));

    setTasks((prev) => ({ ...prev, todo: [task, ...prev.todo] }));
    setIsAddTaskModalOpen(false);

    const randomNumber = Math.random();
    if (randomNumber < 0.1) {
      setTimeout(() => {
        alert('Failed to add the task. Please try again.');
        setTasks(oldTasks);
      }, 1000);
    } else {
      try {
        await fetch('http://localhost:3001/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        });
        await fetch('http://localhost:3001/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: `User ${user} created task "${task.title}"` }),
        });
      } catch (error) {
        console.error('Error adding task:', error);
        setTasks(oldTasks);
        alert('Failed to add the task. Please try again.');
      }
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

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Sprint Board</h1>
          <div>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-4" onClick={() => setIsAddTaskModalOpen(true)}>
              Add Task
            </button>
            <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <div className="grid grid-cols-3 gap-4">
              {Object.keys(tasks).map((columnId) => (
                <Column key={columnId} id={columnId} items={tasks[columnId].map((task) => task.id)}>
                  <h2 className="text-lg font-bold mb-4">{columnId.charAt(0).toUpperCase() + columnId.slice(1)}</h2>
                  {tasks[columnId].map((task) => (
                    <Item key={task.id} id={task.id}>
                      <Card task={task} />
                    </Item>
                  ))}
                </Column>
              ))}
            </div>
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
      </div>
    </DndContext>
  );
};

export default Board;
