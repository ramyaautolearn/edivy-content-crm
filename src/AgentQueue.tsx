import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import AgentAgenda from './AgentAgenda';
import ContentVault from './ContentVault';

export default function AgentQueue({
  userEmail,
  userRole,
  onLogout,
}: {
  userEmail: string;
  userRole: string;
  onLogout: () => void;
}) {
  const [activeView, setActiveView] = useState('queue');
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [assetLink, setAssetLink] = useState('');

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

  const getRelevantPosts = () => {
    return posts
      .filter((post) => {
        if (userRole === 'Agent-Filmer')
          return !post.rawAssetLink && post.funnelStage !== 'published';
        if (userRole === 'Agent-Editor')
          return (
            post.rawAssetLink &&
            !post.finalAssetLink &&
            post.funnelStage !== 'published'
          );
        if (userRole === 'Agent-Poster')
          return post.finalAssetLink && post.funnelStage !== 'published';
        if (userRole === 'Agent-Full-Stack')
          return post.funnelStage !== 'published';
        return false;
      })
      .sort(
        (a, b) =>
          new Date(a.publishDate || 0).getTime() -
          new Date(b.publishDate || 0).getTime()
      );
  };

  const getPostsNeedingAnalytics = () => {
    return posts
      .filter(
        (post) => post.funnelStage === 'published' && !post.analyticsLogged
      )
      .sort(
        (a, b) =>
          new Date(a.publishDate || 0).getTime() -
          new Date(b.publishDate || 0).getTime()
      );
  };

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

  const isFilmingStage = selectedPost ? !selectedPost.rawAssetLink : false;
  const isEditingStage = selectedPost
    ? selectedPost.rawAssetLink && !selectedPost.finalAssetLink
    : false;

  const currentTaskRole =
    userRole === 'Agent-Full-Stack'
      ? isFilmingStage
        ? 'Agent-Filmer'
        : isEditingStage
        ? 'Agent-Editor'
        : 'Agent-Poster'
      : userRole;

  const handleActionSubmit = async () => {
    if (!selectedPost) return;
    let updateData = {};
    if (currentTaskRole === 'Agent-Filmer')
      updateData = { rawAssetLink: assetLink };
    if (currentTaskRole === 'Agent-Editor')
      updateData = { finalAssetLink: assetLink };
    if (currentTaskRole === 'Agent-Poster')
      updateData = { funnelStage: 'published', analyticsLogged: false };

    await updateDoc(doc(db, 'posts', selectedPost.id), updateData);
    setSelectedPost(null);
    setAssetLink('');
  };

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

  const pendingPosts = getRelevantPosts();
  const trackingPosts = getPostsNeedingAnalytics();

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <div className="w-64 bg-gray-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold tracking-wide text-indigo-400">
            Edivy Agent
          </h2>
          <p className="text-xs text-gray-400 mt-1 truncate">{userEmail}</p>
        </div>

        <div className="p-6 border-b border-gray-800">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Assigned Role
          </p>
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <p className="font-bold text-md text-white">
              {userRole === 'Agent-Filmer'
                ? '🎥 Production'
                : userRole === 'Agent-Editor'
                ? '✂️ Editing'
                : userRole === 'Agent-Poster'
                ? '🚀 Distribution'
                : '⭐ Full-Stack Creator'}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">
            Workspace
          </p>

          <button
            onClick={() => setActiveView('queue')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeView === 'queue'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            📋 Master Action Queue
          </button>

          {(userRole === 'Agent-Poster' || userRole === 'Agent-Full-Stack') && (
            <button
              onClick={() => setActiveView('analytics')}
              className={`w-full text-left px-4 py-3 rounded-lg transition flex justify-between items-center ${
                activeView === 'analytics'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span>📈 Data Tracking</span>
              {trackingPosts.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {trackingPosts.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveView('agenda')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeView === 'agenda'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            🗓️ My Personal Agenda
          </button>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">
            Metrics & History
          </p>
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

      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {activeView === 'agenda' && (
          <AgentAgenda userEmail={userEmail} userRole={userRole} />
        )}
        {activeView === 'vault' && <ContentVault />}

        {activeView === 'overview' && (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Team Performance Tower
            </h1>
            <p className="text-gray-500 mb-8">
              View the global pipeline to see what tasks are coming your way.
            </p>
            {/* ... (Performance Stats omitted for brevity, exact same as before) ... */}
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

        {/* OVERDUE LOGIC INCLUDED HERE */}
        {activeView === 'analytics' && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Data Tracking Queue
              </h1>
              <p className="text-gray-500">
                Log the real-world performance for these published posts to
                inform our strategy.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trackingPosts.length === 0 ? (
                <div className="col-span-full p-10 border-2 border-dashed border-gray-300 rounded-xl text-center">
                  <p className="text-xl font-bold text-green-500">
                    🎉 No Tracking Pending!
                  </p>
                  <p className="text-gray-400 mt-2">
                    All published content has been analyzed.
                  </p>
                </div>
              ) : (
                trackingPosts.map((post) => {
                  const daysLive = Math.floor(
                    (new Date().getTime() -
                      new Date(post.publishDate || Date.now()).getTime()) /
                      (1000 * 3600 * 24)
                  );
                  const isOverdue = daysLive >= 2;

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
                        Enter Analytics &rarr;
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeView === 'queue' && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Action Queue
              </h1>
              <p className="text-gray-500">
                Tasks assigned to you. Click a card to complete your stage.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingPosts.length === 0 ? (
                <div className="col-span-full p-10 border-2 border-dashed border-gray-300 rounded-xl text-center">
                  <p className="text-xl font-bold text-gray-500">
                    🎉 Queue is empty!
                  </p>
                  <p className="text-gray-400 mt-2">
                    You are all caught up on your tasks.
                  </p>
                </div>
              ) : (
                pendingPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-indigo-300 transition relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded">
                        {post.platform}
                      </span>
                      {userRole === 'Agent-Full-Stack' && (
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded-full">
                          {!post.rawAssetLink
                            ? 'Needs Filming'
                            : !post.finalAssetLink
                            ? 'Needs Editing'
                            : 'Needs Posting'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 leading-tight mb-2">
                      {post.hook || 'Untitled Post'}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {post.copy}
                    </p>
                    <button className="mt-4 w-full bg-indigo-50 text-indigo-700 font-bold py-2 rounded-lg transition">
                      Open Details &rarr;
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {activeView === 'overview' && (
        <div className="w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col z-10">
          <div className="p-6 border-b border-gray-200 bg-indigo-50">
            <h2 className="text-xl font-bold text-indigo-900">Live Channels</h2>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-pink-600">Instagram</h3>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-sm">
                <p className="text-gray-600 flex justify-between">
                  <span>Reach:</span>
                  <span className="font-bold text-gray-800">
                    {formatNum(instaStats.views)}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-blue-600">LinkedIn</h3>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-sm">
                <p className="text-gray-600 flex justify-between">
                  <span>Impressions:</span>
                  <span className="font-bold text-gray-800">
                    {formatNum(linkedInStats.views)}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-red-600">YouTube</h3>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-sm">
                <p className="text-gray-600 flex justify-between">
                  <span>Views:</span>
                  <span className="font-bold text-gray-800">
                    {formatNum(ytStats.views)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedPost.hook}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Platform:{' '}
              <span className="font-bold text-indigo-600">
                {selectedPost.platform}
              </span>
            </p>

            {activeView === 'analytics' ? (
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-4">
                  <h3 className="font-bold text-indigo-800 mb-2">
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
            ) : (
              <div>
                <div className="space-y-6">
                  {currentTaskRole === 'Agent-Filmer' && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="font-bold text-orange-800 mb-2">
                        🎥 Filming Instructions
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedPost.filmingInstructions ||
                          'No specific instructions provided. Shoot standard format.'}
                      </p>
                    </div>
                  )}
                  {currentTaskRole === 'Agent-Editor' && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-bold text-blue-800 mb-2">
                        ✂️ Editing Assets
                      </h3>
                      <a
                        href={selectedPost.rawAssetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 font-bold hover:underline break-all"
                      >
                        {selectedPost.rawAssetLink}
                      </a>
                    </div>
                  )}
                  {currentTaskRole === 'Agent-Poster' && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="font-bold text-green-800 mb-2">
                        🚀 Posting Details
                      </h3>
                      <a
                        href={selectedPost.finalAssetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 font-bold hover:underline break-all mb-4 block"
                      >
                        {selectedPost.finalAssetLink}
                      </a>
                      <p className="font-bold text-sm">Caption:</p>
                      <div className="bg-white p-3 border rounded text-sm text-gray-600 whitespace-pre-wrap mb-4">
                        {selectedPost.copy}
                      </div>
                    </div>
                  )}
                  {currentTaskRole !== 'Agent-Poster' && (
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        {currentTaskRole === 'Agent-Filmer'
                          ? 'Link to Raw Footage:'
                          : 'Link to Edited Video:'}
                      </label>
                      <input
                        type="url"
                        required
                        value={assetLink}
                        onChange={(e) => setAssetLink(e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        placeholder="https://..."
                      />
                    </div>
                  )}
                </div>
                <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="px-6 py-2 bg-gray-200 font-bold rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActionSubmit}
                    disabled={currentTaskRole !== 'Agent-Poster' && !assetLink}
                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {currentTaskRole === 'Agent-Filmer'
                      ? 'Mark as Filmed'
                      : currentTaskRole === 'Agent-Editor'
                      ? 'Mark as Edited'
                      : 'Mark as Published!'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
