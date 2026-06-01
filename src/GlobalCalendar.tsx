import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export default function GlobalCalendar() {
  const [posts, setPosts] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // NEW: State for the "Daily Agenda" modal
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const platforms = [
    {
      id: 'instagram',
      label: 'Instagram',
      icon: '📱',
      color: 'bg-pink-100 text-pink-800',
    },
    {
      id: 'youtube',
      label: 'YouTube',
      icon: '▶️',
      color: 'bg-red-100 text-red-800',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: '📘',
      color: 'bg-indigo-100 text-indigo-800',
    },
  ];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper function to find posts for a specific day
  const getPostsForDay = (day: number, month: number, year: number) => {
    return posts
      .filter((p) => {
        if (!p.publishDate) return false;
        const pDate = new Date(p.publishDate);
        return (
          pDate.getFullYear() === year &&
          pDate.getMonth() === month &&
          pDate.getDate() === day
        );
      })
      .sort(
        (a, b) =>
          new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
      );
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Global Calendar
        </h1>
        <p className="text-gray-500">
          Your master view of all scheduled multi-channel content.
        </p>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentDate.toLocaleString('default', { month: 'long' })} {year}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1))}
              className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold rounded-lg transition"
            >
              &lt; Prev
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-lg transition"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1))}
              className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold rounded-lg transition"
            >
              Next &gt;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden flex-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}

          {blanks.map((b) => (
            <div key={`blank-${b}`} className="bg-white min-h-[120px]"></div>
          ))}

          {days.map((day) => {
            const dayPosts = getPostsForDay(day, month, year);
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(new Date(year, month, day))}
                className={`bg-white min-h-[120px] p-2 border-t border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
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

                <div className="mt-2 space-y-1 overflow-y-auto max-h-[100px]">
                  {dayPosts.map((post) => {
                    const platformData = platforms.find(
                      (pl) => pl.id === post.platform
                    );
                    return (
                      <div
                        key={post.id}
                        className={`text-[10px] p-1.5 rounded truncate ${platformData?.color}`}
                      >
                        {platformData?.icon} {post.hook || 'Untitled'}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DAILY AGENDA MODAL: Shows Channel Coverage & Post List */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Agenda:{' '}
                {selectedDay.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-500 hover:text-red-500 font-bold text-xl"
              >
                &times;
              </button>
            </div>

            {/* CHANNEL COVERAGE CHECKLIST */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                Daily Channel Coverage
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platforms.map((p) => {
                  const dayPosts = getPostsForDay(
                    selectedDay.getDate(),
                    selectedDay.getMonth(),
                    selectedDay.getFullYear()
                  );
                  const postCount = dayPosts.filter(
                    (post) => post.platform === p.id
                  ).length;
                  const hasCoverage = postCount > 0;

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg border text-center ${
                        hasCoverage
                          ? 'bg-white border-green-300'
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">{p.icon}</div>
                      <div className="font-bold text-sm text-gray-800">
                        {p.label}
                      </div>
                      {hasCoverage ? (
                        <div className="text-xs font-bold text-green-600 mt-1">
                          ✅ {postCount} Scheduled
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-red-500 mt-1">
                          ❌ Missing
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CHRONOLOGICAL POST LIST */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                Scheduled Content
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {getPostsForDay(
                  selectedDay.getDate(),
                  selectedDay.getMonth(),
                  selectedDay.getFullYear()
                ).length === 0 ? (
                  <p className="text-gray-400 italic">
                    No posts scheduled for this day.
                  </p>
                ) : (
                  getPostsForDay(
                    selectedDay.getDate(),
                    selectedDay.getMonth(),
                    selectedDay.getFullYear()
                  ).map((post) => {
                    const platformData = platforms.find(
                      (pl) => pl.id === post.platform
                    );
                    const timeString = new Date(
                      post.publishDate
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={post.id}
                        className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                      >
                        <div className="w-20 text-sm font-bold text-indigo-600">
                          {timeString}
                        </div>
                        <div className="text-2xl mr-4">
                          {platformData?.icon}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">
                            {post.hook || 'Untitled Post'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Audience: {post.audience} | Funnel:{' '}
                            {post.funnelStage}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
