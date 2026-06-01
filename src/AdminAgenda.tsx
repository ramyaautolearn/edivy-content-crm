import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

export default function AdminAgenda() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // NEW: View toggles
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

  // Fallback categories if the database is empty
  const defaultCategories = [
    {
      id: 'default1',
      label: 'School Demo',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'default2',
      label: 'Offline Class',
      color: 'bg-green-100 text-green-800 border-green-200',
    },
    {
      id: 'default3',
      label: 'Content Sprint',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  ];

  const activeCategories =
    categories.length > 0 ? categories : defaultCategories;

  useEffect(() => {
    // Fetch Tasks
    const unsubscribeTasks = onSnapshot(
      collection(db, 'adminTasks'),
      (snapshot) => {
        setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    );
    // Fetch Custom Categories
    const unsubscribeCats = onSnapshot(
      collection(db, 'agendaCategories'),
      (snapshot) => {
        setCategories(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );
    return () => {
      unsubscribeTasks();
      unsubscribeCats();
    };
  }, []);

  // --- TASK MANAGEMENT ---
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
    if (id) await updateDoc(doc(db, 'adminTasks', id), taskData);
    else await addDoc(collection(db, 'adminTasks'), taskData);
    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = async () => {
    if (formData.id) await deleteDoc(doc(db, 'adminTasks', formData.id));
    setIsTaskModalOpen(false);
  };

  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
    await updateDoc(doc(db, 'adminTasks', task.id), { status: newStatus });
  };

  // --- CATEGORY MANAGEMENT ---
  const handleSaveCategory = async () => {
    if (!newCategory.label.trim()) return;
    await addDoc(collection(db, 'agendaCategories'), newCategory);
    setNewCategory({
      label: '',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    });
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'agendaCategories', id));
  };

  // --- CALENDAR HELPERS ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // For Month View
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // For Week View
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
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans flex flex-col h-full overflow-hidden">
      {/* Header & Controls */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Founder's Agenda
          </h1>
          <p className="text-gray-500">
            Manage your diverse workflow across classes, demos, and strategy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggles */}
          <div className="flex bg-gray-200 p-1 rounded-lg shadow-inner">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition ${
                viewMode === 'day'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition ${
                viewMode === 'week'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition ${
                viewMode === 'month'
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Month
            </button>
          </div>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 shadow-sm transition"
          >
            🏷️ Categories
          </button>
          <button
            onClick={() => handleOpenTaskModal()}
            className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 shadow transition"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
        {/* Universal Date Navigation */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
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
              &lt; Prev
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-lg"
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
              Next &gt;
            </button>
          </div>
        </div>

        {/* --- DAY VIEW --- */}
        {viewMode === 'day' && (
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {getTasksForDate(currentDate).length === 0 ? (
              <div className="text-center text-gray-400 mt-10 font-semibold italic">
                Your schedule is clear for this day. Enjoy the breathing room!
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
                      {task.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* --- WEEK VIEW --- */}
        {viewMode === 'week' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4 overflow-y-auto pb-4">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day.toISOString()}
                  className={`flex flex-col border rounded-lg overflow-hidden ${
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
                  <div className="flex-1 p-2 space-y-2 bg-white overflow-y-auto min-h-[200px]">
                    {dayTasks.map((task) => {
                      const typeStyle =
                        activeCategories.find((t) => t.label === task.type)
                          ?.color ||
                        'bg-gray-100 text-gray-800 border-gray-200';
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleOpenTaskModal(task)}
                          className={`p-2 rounded border text-xs cursor-pointer hover:shadow-sm transition ${
                            task.status === 'Completed' ? 'opacity-50' : ''
                          } ${typeStyle}`}
                        >
                          <p className="font-bold truncate">{task.title}</p>
                          <p className="mt-1 opacity-80">
                            {new Date(task.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- MONTH VIEW --- */}
        {viewMode === 'month' && (
          <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
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
                  className={`bg-white min-h-[100px] p-2 border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
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
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-gray-400 font-bold px-1">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- TASK MODAL --- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {formData.id ? 'Edit Agenda Task' : 'Add Agenda Task'}
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
                  placeholder="e.g., Demo at Oakridge, Record 3 Hooks..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Category Type
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
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Notes & Objectives
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  placeholder="Add specific goals, links, or items to bring..."
                ></textarea>
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
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700"
                >
                  Save Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CATEGORY MANAGEMENT MODAL --- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Manage Custom Categories
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
                  {/* Only allow deleting custom ones from DB, not fallbacks */}
                  {cat.id && !cat.id.startsWith('default') && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 text-xs font-bold hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Create New Category
              </h3>
              <input
                type="text"
                placeholder="Category Name (e.g., Training)"
                value={newCategory.label}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, label: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md mb-3 text-sm"
              />

              <label className="block text-xs font-bold text-gray-500 mb-1">
                Select Theme Color:
              </label>
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
                <option value="bg-pink-100 text-pink-800 border-pink-200">
                  Pink Theme
                </option>
                <option value="bg-red-100 text-red-800 border-red-200">
                  Red Theme
                </option>
                <option value="bg-gray-100 text-gray-800 border-gray-300">
                  Gray Theme
                </option>
              </select>

              <button
                onClick={handleSaveCategory}
                className="w-full bg-indigo-600 text-white font-bold py-2 rounded-md hover:bg-indigo-700 transition"
              >
                Add Category
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300"
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
