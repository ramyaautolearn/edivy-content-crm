import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import AdminPlanner from './AdminPlanner';
import GlobalCalendar from './GlobalCalendar';
import UserManagement from './UserManagement';
import AdminAgenda from './AdminAgenda';
import ContentVault from './ContentVault';

export default function Dashboard({
  userEmail,
  onLogout,
}: {
  userEmail: string;
  onLogout: () => void;
}) {
  const [activeView, setActiveView] = useState('overview');
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState({
    views: '',
    likes: '',
    comments: '',
    ctr: '',
    retention: '',
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const totalDrafted = posts.length;
  const needsFilming = posts.filter(
    (p) => !p.rawAssetLink && p.funnelStage !== 'published'
  ).length;
  const inEditing = posts.filter(
    (p) => p.rawAssetLink && !p.finalAssetLink && p.funnelStage !== 'published'
  ).length;
  const readyToPost = posts.filter(
    (p) => p.finalAssetLink && p.funnelStage !== 'published'
  ).length;
  const publishedPosts = posts.filter(
    (p) => p.funnelStage === 'published'
  ).length;
  const getPercent = (value: number) =>
    totalDrafted === 0 ? 0 : Math.round((value / totalDrafted) * 100);

  const formatNum = (num: number) =>
    num > 999 ? (num / 1000).toFixed(1) + 'k' : num;

  const getChannelStats = (platformId: string) => {
    const channelPosts = posts.filter(
      (p) => p.platform === platformId && p.analyticsLogged
    );
    const views = channelPosts.reduce(
      (sum, p) => sum + Number(p.analytics?.views || 0),
      0
    );
    const likes = channelPosts.reduce(
      (sum, p) => sum + Number(p.analytics?.likes || 0),
      0
    );
    const comments = channelPosts.reduce(
      (sum, p) => sum + Number(p.analytics?.comments || 0),
      0
    );
    return {
      views,
      engagement: likes + comments,
      postsAnalyzed: channelPosts.length,
    };
  };

  const instaStats = getChannelStats('instagram');
  const linkedInStats = getChannelStats('linkedin');
  const ytStats = getChannelStats('youtube');

  // NEW: Tracking Logic for Admin
  const trackingPosts = posts
    .filter((post) => post.funnelStage === 'published' && !post.analyticsLogged)
    .sort(
      (a, b) =>
        new Date(a.publishDate || 0).getTime() -
        new Date(b.publishDate || 0).getTime()
    );

  const handleSaveAnalytics = async () => {
    if (!selectedPost) return;
    await updateDoc(doc(db, 'posts', selectedPost.id), {
      analyticsLogged: true,
      analytics: analyticsData,
    });
    setSelectedPost(null);
    setAnalyticsData({
      views: '',
      likes: '',
      comments: '',
      ctr: '',
      retention: '',
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="w-64 bg-gray-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold tracking-wide text-indigo-400">
            Edivy CRM
          </h2>
          <p className="text-xs text-gray-400 mt-1 truncate">
            Logged in as {userEmail}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">
            Operational
          </p>
          <button
            onClick={() => setActiveView('agenda')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeView === 'agenda'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            🗓️ Personal Agenda
          </button>
          <button
            onClick={() => setActiveView('overview')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeView === 'overview'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            📊 Performance Tower
          </button>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">
            Content Command
          </p>
          <button
            onClick={() => setActiveView('planner')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeView === 'planner'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            📝 Strategy Board
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeView === 'calendar'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            📅 Global Calendar
          </button>

          {/* NEW: Admin Data Tracking Tab */}
          <button
            onClick={() => setActiveView('analytics')}
            className={`w-full text-left px-4 py-3 rounded-lg transition flex justify-between items-center ${
              activeView === 'analytics'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span>📈 Missing Analytics</span>
            {trackingPosts.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                {trackingPosts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('vault')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeView === 'vault'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            🗄️ Content Vault (Logs)
          </button>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">
            System
          </p>
          <button
            onClick={() => setActiveView('users')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeView === 'users'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            👥 User Management
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* CENTRAL TOWER */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {activeView === 'agenda' && <AdminAgenda />}
        {activeView === 'vault' && <ContentVault />}

        {activeView === 'overview' && (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Central Performance Tower
            </h1>
            <p className="text-gray-500 mb-8">
              Real-time pulse on your content production assembly line.
            </p>

            {/* Quick Alert if Analytics are missing */}
            {trackingPosts.length > 0 && (
              <div
                className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex justify-between items-center cursor-pointer hover:bg-red-100 transition"
                onClick={() => setActiveView('analytics')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-red-800 font-bold">
                      Action Required: Missing Analytics
                    </h3>
                    <p className="text-red-600 text-sm">
                      You have {trackingPosts.length} published post(s) awaiting
                      real-world data logging.
                    </p>
                  </div>
                </div>
                <span className="text-red-700 font-bold text-sm">
                  View Queue &rarr;
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-gray-400">
                <h3 className="text-gray-500 font-semibold mb-1 text-sm uppercase">
                  Total Ideas
                </h3>
                <p className="text-4xl font-bold text-gray-800">
                  {totalDrafted}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-orange-400">
                <h3 className="text-gray-500 font-semibold mb-1 text-sm uppercase">
                  Needs Filming
                </h3>
                <p className="text-4xl font-bold text-orange-500">
                  {needsFilming}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-400">
                <h3 className="text-gray-500 font-semibold mb-1 text-sm uppercase">
                  In Editing
                </h3>
                <p className="text-4xl font-bold text-blue-500">{inEditing}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-400">
                <h3 className="text-gray-500 font-semibold mb-1 text-sm uppercase">
                  Published
                </h3>
                <p className="text-4xl font-bold text-green-500">
                  {publishedPosts}
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Production Pipeline Health
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                    <span>🎥 Awaiting Production ({needsFilming})</span>
                    <span>{getPercent(needsFilming)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <div
                      className="bg-orange-400 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${getPercent(needsFilming)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                    <span>✂️ Post-Production ({inEditing})</span>
                    <span>{getPercent(inEditing)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <div
                      className="bg-blue-400 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${getPercent(inEditing)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                    <span>🚀 Ready to Distribute ({readyToPost})</span>
                    <span>{getPercent(readyToPost)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <div
                      className="bg-indigo-400 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${getPercent(readyToPost)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                    <span>✅ Live & Published ({publishedPosts})</span>
                    <span>{getPercent(publishedPosts)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <div
                      className="bg-green-400 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${getPercent(publishedPosts)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: ADMIN DATA TRACKING QUEUE */}
        {activeView === 'analytics' && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Pending Analytics Queue
              </h1>
              <p className="text-gray-500">
                Monitor posts that need their real-world performance logged into
                the system.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trackingPosts.length === 0 ? (
                <div className="col-span-full p-10 border-2 border-dashed border-gray-300 rounded-xl text-center">
                  <p className="text-xl font-bold text-green-500">
                    🎉 All Data Logged!
                  </p>
                  <p className="text-gray-400 mt-2">
                    There are no published posts missing analytics.
                  </p>
                </div>
              ) : (
                trackingPosts.map((post) => {
                  const daysLive = Math.floor(
                    (new Date().getTime() -
                      new Date(post.publishDate || Date.now()).getTime()) /
                      (1000 * 3600 * 24)
                  );
                  const isOverdue = daysLive >= 2; // Overdue if live for 48+ hours

                  return (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`bg-white p-5 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition relative ${
                        isOverdue
                          ? 'border-red-400'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">
                          {post.platform}
                        </span>
                        {isOverdue ? (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                            ⚠️ OVERDUE ({daysLive} Days)
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[10px] font-semibold bg-gray-100 px-2 py-1 rounded-full">
                            Live {daysLive} days
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 leading-tight mb-2">
                        {post.hook || 'Untitled Post'}
                      </h3>
                      <button
                        className={`mt-4 w-full font-bold py-2 rounded-lg transition ${
                          isOverdue
                            ? 'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white'
                        }`}
                      >
                        Log Data &rarr;
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeView === 'users' && (
          <UserManagement currentUserEmail={userEmail} />
        )}
        {activeView === 'planner' && <AdminPlanner />}
        {activeView === 'calendar' && <GlobalCalendar />}
      </div>

      {/* RIGHT PANEL: Live Channel Analytics */}
      {activeView === 'overview' && (
        <div className="w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col z-10">
          <div className="p-6 border-b border-gray-200 bg-indigo-50">
            <h2 className="text-xl font-bold text-indigo-900">Live Channels</h2>
            <p className="text-sm text-indigo-700">Real-World Performance</p>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-pink-600">Instagram</h3>
                {instaStats.postsAnalyzed > 0 && (
                  <span className="text-green-500 text-sm font-bold tracking-wide text-[10px] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    {instaStats.postsAnalyzed} Tracked
                  </span>
                )}
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-sm">
                <p className="text-gray-600 flex justify-between">
                  <span>Reach:</span>
                  <span className="font-bold text-gray-800">
                    {formatNum(instaStats.views)}
                  </span>
                </p>
                <p className="text-gray-600 flex justify-between mt-1">
                  <span>Engagement:</span>
                  <span className="font-bold text-gray-800">
                    {formatNum(instaStats.engagement)}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-blue-600">LinkedIn</h3>
                {linkedInStats.postsAnalyzed > 0 && (
                  <span className="text-green-500 text-sm font-bold tracking-wide text-[10px] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    {linkedInStats.postsAnalyzed} Tracked
                  </span>
                )}
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-sm">
                <p className="text-gray-600 flex justify-between">
                  <span>Impressions:</span>
                  <span className="font-bold text-gray-800">
                    {formatNum(linkedInStats.views)}
                  </span>
                </p>
                <p className="text-gray-600 flex justify-between mt-1">
                  <span>Engagement:</span>
                  <span className="font-bold text-gray-800">
                    {formatNum(linkedInStats.engagement)}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-red-600">YouTube</h3>
                {ytStats.postsAnalyzed > 0 && (
                  <span className="text-green-500 text-sm font-bold tracking-wide text-[10px] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    {ytStats.postsAnalyzed} Tracked
                  </span>
                )}
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-sm">
                <p className="text-gray-600 flex justify-between">
                  <span>Views:</span>
                  <span className="font-bold text-gray-800">
                    {formatNum(ytStats.views)}
                  </span>
                </p>
                <p className="text-gray-600 flex justify-between mt-1">
                  <span>Engagement:</span>
                  <span className="font-bold text-gray-800">
                    {formatNum(ytStats.engagement)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR ADMIN TO LOG ANALYTICS */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl max-w-lg w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedPost.hook}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Platform:{' '}
              <span className="font-bold text-indigo-600">
                {selectedPost.platform}
              </span>
            </p>

            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-4">
              <h3 className="font-bold text-indigo-800 mb-4">
                📊 Enter Performance Data
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Views / Reach
                  </label>
                  <input
                    type="number"
                    value={analyticsData.views}
                    onChange={(e) =>
                      setAnalyticsData({
                        ...analyticsData,
                        views: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Likes
                  </label>
                  <input
                    type="number"
                    value={analyticsData.likes}
                    onChange={(e) =>
                      setAnalyticsData({
                        ...analyticsData,
                        likes: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Comments
                  </label>
                  <input
                    type="number"
                    value={analyticsData.comments}
                    onChange={(e) =>
                      setAnalyticsData({
                        ...analyticsData,
                        comments: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    CTR (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={analyticsData.ctr}
                    onChange={(e) =>
                      setAnalyticsData({
                        ...analyticsData,
                        ctr: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-6 py-2 bg-gray-200 font-bold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAnalytics}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
              >
                Save Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
