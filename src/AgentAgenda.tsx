import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export default function AgentAgenda({
  userEmail,
  userRole,
}: {
  userEmail: string;
  userRole: string;
}) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    type: '',
    date: '',
    notes: '',
    status: 'Pending',
  });

  const [newCategory, setNewCategory] = useState({
    label: '',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  });

  // Default agent categories
  const defaultCategories = [
    {
      id: 'default1',
      label: 'Video Production',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    {
      id: 'default2',
      label: 'Post-Editing',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'default3',
      label: 'Personal Task',
      color: 'bg-gray-100 text-gray-800 border-gray-300',
    },
  ];

  const activeCategories =
    categories.length > 0 ? categories : defaultCategories;

  useEffect(() => {
    // ONLY fetch tasks that belong to this specific user's email
    const qTasks = query(
      collection(db, 'personalTasks'),
      where('ownerEmail', '==', userEmail)
    );
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // ONLY fetch custom categories that belong to this specific user's email
    const qCats = query(
      collection(db, 'personalCategories'),
      where('ownerEmail', '==', userEmail)
    );
    const unsubscribeCats = onSnapshot(qCats, (snapshot) => {
      setCategories(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    return () => {
      unsubscribeTasks();
      unsubscribeCats();
    };
  }, [userEmail]);

  const handleOpenTaskModal = (task: any = null) => {
    if (task) setFormData(task);
    else
      setFormData({
        id: '',
        title: '',
        type: activeCategories[0]?.label || '',
        date: '',
        notes: '',
        status: 'Pending',
      });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    const { id, ...taskData } = formData;
    const dataToSave = { ...taskData, ownerEmail: userEmail }; // Attach their email to the task

    if (id) await updateDoc(doc(db, 'personalTasks', id), dataToSave);
    else await addDoc(collection(db, 'personalTasks'), dataToSave);
    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = async () => {
    if (formData.id) await deleteDoc(doc(db, 'personalTasks', formData.id));
    setIsTaskModalOpen(false);
  };

  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
    await updateDoc(doc(db, 'personalTasks', task.id), { status: newStatus });
  };

  const handleSaveCategory = async () => {
    if (!newCategory.label.trim()) return;
    await addDoc(collection(db, 'personalCategories'), {
      ...newCategory,
      ownerEmail: userEmail,
    });
    setNewCategory({
      label: '',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    });
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'personalCategories', id));
  };

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const getTasksForDate = (targetDate: Date) => {
    return tasks
      .filter((t) => {
        if (!t.date) return false;
        return new Date(t.date).toDateString() === targetDate.toDateString();
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 flex-1 overflow-y-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            My Personal Agenda
          </h1>
          <p className="text-gray-500">
            Plan your individual workflow and custom tasks privately.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-200 p-1 rounded-lg shadow-inner">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition ${
                viewMode === 'day'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-500'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition ${
                viewMode === 'week'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-500'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition ${
                viewMode === 'month'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-500'
              }`}
            >
              Month
            </button>
          </div>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 shadow-sm transition"
          >
            🏷️ My Categories
          </button>
          <button
            onClick={() => handleOpenTaskModal()}
            className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 shadow transition"
          >
            + Add Task
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            📅{' '}
            {viewMode === 'day'
              ? currentDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })
              : viewMode === 'week'
              ? `Week of ${startOfWeek.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}`
              : `${currentDate.toLocaleString('default', {
                  month: 'long',
                })} ${year}`}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                if (viewMode === 'day')
                  newDate.setDate(currentDate.getDate() - 1);
                if (viewMode === 'week')
                  newDate.setDate(currentDate.getDate() - 7);
                if (viewMode === 'month')
                  newDate.setMonth(currentDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
              className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold rounded-lg"
            >
              &lt;
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 bg-indigo-50 text-indigo-600 font-bold rounded-lg"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                if (viewMode === 'day')
                  newDate.setDate(currentDate.getDate() + 1);
                if (viewMode === 'week')
                  newDate.setDate(currentDate.getDate() + 7);
                if (viewMode === 'month')
                  newDate.setMonth(currentDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
              className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold rounded-lg"
            >
              &gt;
            </button>
          </div>
        </div>

        {viewMode === 'day' && (
          <div className="space-y-3 pr-2">
            {getTasksForDate(currentDate).length === 0 ? (
              <div className="text-center text-gray-400 mt-10 font-semibold italic">
                No personal tasks scheduled for today.
              </div>
            ) : (
              getTasksForDate(currentDate).map((task) => {
                const typeStyle =
                  activeCategories.find((t) => t.label === task.type)?.color ||
                  'bg-gray-100 text-gray-800';
                return (
                  <div
                    key={task.id}
                    className={`flex items-start p-4 rounded-lg border transition ${
                      task.status === 'Completed'
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-white border-gray-300 shadow-sm'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => toggleTaskStatus(task)}
                      className="mt-1.5 w-5 h-5 text-indigo-600 rounded cursor-pointer"
                    />
                    <div
                      className="ml-4 flex-1 cursor-pointer"
                      onClick={() => handleOpenTaskModal(task)}
                    >
                      <div className="flex justify-between items-start">
                        <h3
                          className={`font-bold text-lg ${
                            task.status === 'Completed'
                              ? 'line-through text-gray-500'
                              : 'text-gray-800'
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full border ${typeStyle}`}
                        >
                          {task.type}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-indigo-600 mt-1">
                        🕒{' '}
                        {new Date(task.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {viewMode === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day.toISOString()}
                  className={`flex flex-col border rounded-lg ${
                    isToday
                      ? 'border-indigo-400 shadow-md ring-1 ring-indigo-400'
                      : 'border-gray-200'
                  }`}
                >
                  <div
                    className={`p-2 text-center border-b ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase">
                      {day.toLocaleDateString(undefined, { weekday: 'short' })}
                    </p>
                    <p className="text-xl font-bold">{day.getDate()}</p>
                  </div>
                  <div className="flex-1 p-2 space-y-2 bg-white min-h-[150px]">
                    {dayTasks.map((task) => {
                      const typeStyle =
                        activeCategories.find((t) => t.label === task.type)
                          ?.color ||
                        'bg-gray-100 text-gray-800 border-gray-200';
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleOpenTaskModal(task)}
                          className={`p-2 rounded border text-xs cursor-pointer ${
                            task.status === 'Completed' ? 'opacity-50' : ''
                          } ${typeStyle}`}
                        >
                          <p className="font-bold truncate">{task.title}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'month' && (
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
            {monthBlanks.map((b) => (
              <div key={`blank-${b}`} className="bg-white min-h-[100px]"></div>
            ))}
            {monthDays.map((day) => {
              const targetDate = new Date(year, month, day);
              const dayTasks = getTasksForDate(targetDate);
              const isToday =
                targetDate.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day}
                  onClick={() => {
                    setCurrentDate(targetDate);
                    setViewMode('day');
                  }}
                  className={`bg-white min-h-[100px] p-2 border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    isToday ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isToday ? 'bg-indigo-600 text-white' : 'text-gray-500'
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-2 space-y-1">
                    {dayTasks.slice(0, 3).map((task) => {
                      const typeStyle =
                        activeCategories.find((t) => t.label === task.type)
                          ?.color || 'bg-gray-100 text-gray-800';
                      return (
                        <div
                          key={task.id}
                          className={`text-[10px] p-1 rounded truncate border ${typeStyle}`}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl max-w-lg w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {formData.id ? 'Edit Personal Task' : 'Add Personal Task'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Task Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Category
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md mt-1 font-semibold"
                  >
                    {activeCategories.map((cat) => (
                      <option key={cat.id || cat.label} value={cat.label}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-between border-t pt-4">
              {formData.id ? (
                <button
                  onClick={handleDeleteTask}
                  className="text-red-500 font-semibold hover:text-red-700"
                >
                  Delete
                </button>
              ) : (
                <div></div>
              )}
              <div>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 mr-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTask}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Save Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              My Custom Categories
            </h2>
            <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
              {activeCategories.map((cat) => (
                <div
                  key={cat.id || cat.label}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200"
                >
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded border ${cat.color}`}
                  >
                    {cat.label}
                  </span>
                  {cat.id && !cat.id.startsWith('default') && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 text-xs font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
              <input
                type="text"
                placeholder="New Category Name..."
                value={newCategory.label}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, label: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md mb-3 text-sm"
              />
              <select
                value={newCategory.color}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, color: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md mb-4 text-sm font-semibold"
              >
                <option value="bg-blue-100 text-blue-800 border-blue-200">
                  Blue Theme
                </option>
                <option value="bg-green-100 text-green-800 border-green-200">
                  Green Theme
                </option>
                <option value="bg-purple-100 text-purple-800 border-purple-200">
                  Purple Theme
                </option>
                <option value="bg-orange-100 text-orange-800 border-orange-200">
                  Orange Theme
                </option>
              </select>
              <button
                onClick={handleSaveCategory}
                className="w-full bg-indigo-600 text-white font-bold py-2 rounded-md"
              >
                Add Category
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
