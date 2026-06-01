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

const scriptTemplate = `Hook (First 5 seconds):\n\nProblem (Relatable pain point):\n\nSolution (3 Key Tips):\n1. \n2. \n3. \n\nCTA (Call to Action - Subscribe/Workshop):`;

export default function AdminPlanner() {
  const [posts, setPosts] = useState<any[]>([]);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [activePlatform, setActivePlatform] = useState('instagram');
  const [showArchived, setShowArchived] = useState(false); // NEW: Archive Toggle State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    hook: '',
    episodeNumber: '',
    audience: 'parents',
    format: 'reel',
    copy: '',
    rawAssetLink: '',
    finalAssetLink: '',
    filmDate: '',
    editDate: '',
    publishDate: '',
    platform: 'instagram',
    seriesId: '',
    funnelStage: 'discovery',
    filmingInstructions: '',
    seoOptimiser: '',
  });

  const platforms = [
    { id: 'instagram', label: '📱 Instagram' },
    { id: 'youtube', label: '▶️ YouTube' },
    { id: 'linkedin', label: '💼 LinkedIn' },
    { id: 'facebook', label: '📘 Facebook' },
  ];

  useEffect(() => {
    const unsubscribeSeries = onSnapshot(
      collection(db, 'series'),
      (snapshot) => {
        setSeriesList(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );
    const unsubscribePosts = onSnapshot(collection(db, 'posts'), (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubscribeSeries();
      unsubscribePosts();
    };
  }, []);

  const handleAddSeries = async () => {
    if (!newSeriesTitle.trim()) return;
    await addDoc(collection(db, 'series'), {
      platform: activePlatform,
      title: newSeriesTitle,
      archived: false,
    });
    setNewSeriesTitle('');
  };

  // NEW: Archive toggle logic
  const handleToggleArchiveSeries = async (series: any) => {
    if (
      confirm(
        `Are you sure you want to ${
          series.archived ? 'restore' : 'archive'
        } the series "${series.title}"?`
      )
    ) {
      await updateDoc(doc(db, 'series', series.id), {
        archived: !series.archived,
      });
    }
  };

  const handleOpenModal = (post: any = null, targetSeriesId: string = '') => {
    if (post) setFormData(post);
    else
      setFormData({
        id: '',
        hook: '',
        episodeNumber: '',
        audience: 'parents',
        format: 'reel',
        copy: scriptTemplate,
        rawAssetLink: '',
        finalAssetLink: '',
        filmDate: '',
        editDate: '',
        publishDate: '',
        platform: activePlatform,
        seriesId: targetSeriesId,
        funnelStage: 'discovery',
        filmingInstructions: '',
        seoOptimiser: '',
      });
    setIsModalOpen(true);
  };

  const handleSavePost = async () => {
    if (!formData.seriesId) {
      alert('Please select a Series for this post.');
      return;
    }
    const { id, ...postData } = formData;
    if (id) await updateDoc(doc(db, 'posts', id), postData);
    else await addDoc(collection(db, 'posts'), postData);
    setIsModalOpen(false);
  };

  const handleDeletePost = async () => {
    if (formData.id) await deleteDoc(doc(db, 'posts', formData.id));
    setIsModalOpen(false);
  };

  // NEW: Filters out archived series unless the toggle is on
  const activeSeries = seriesList.filter(
    (s) =>
      s.platform === activePlatform && (showArchived ? s.archived : !s.archived)
  );

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans flex flex-col h-full overflow-hidden">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Content & Series Planner
          </h1>
          <p className="text-gray-500">Plan your funnels and draft content.</p>
        </div>

        {/* NEW: Archive Toggle Button */}
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`px-4 py-2 text-sm font-bold rounded-lg border transition ${
            showArchived
              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {showArchived ? '📂 Hide Archived Series' : '📂 View Archived Series'}
        </button>
      </div>

      <div className="flex space-x-2 border-b border-gray-300 mb-6">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => setActivePlatform(platform.id)}
            className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${
              activePlatform === platform.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {platform.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-x-auto flex items-start space-x-6 pb-8">
        {activeSeries.map((series) => (
          <div
            key={series.id}
            className={`p-4 rounded-lg min-w-[320px] max-w-[320px] flex flex-col max-h-full ${
              series.archived
                ? 'bg-yellow-50 border-2 border-dashed border-yellow-200 opacity-80'
                : 'bg-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  {series.archived && '📦'} {series.title}
                </h3>
                {/* NEW: Archive Button */}
                <button
                  onClick={() => handleToggleArchiveSeries(series)}
                  className="text-[10px] text-gray-500 hover:text-red-500 font-bold underline mt-1"
                >
                  {series.archived ? 'Restore Series' : 'Archive Series'}
                </button>
              </div>
              {!series.archived && (
                <button
                  onClick={() => handleOpenModal(null, series.id)}
                  className="text-indigo-600 hover:bg-indigo-100 p-1 rounded transition"
                  title="Add Post to Series"
                >
                  ➕
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {posts
                .filter((p) => p.seriesId === series.id)
                .map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleOpenModal(post)}
                    className="p-4 rounded-lg border border-gray-300 bg-white cursor-pointer shadow-sm hover:shadow-md transition relative group"
                  >
                    <div className="absolute top-0 right-0 -mt-2 -mr-2">
                      {post.funnelStage === 'discovery' && (
                        <span className="bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                          Discovery
                        </span>
                      )}
                      {post.funnelStage === 'interest' && (
                        <span className="bg-purple-100 border border-purple-300 text-purple-800 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                          Interest
                        </span>
                      )}
                      {post.funnelStage === 'connection' && (
                        <span className="bg-pink-100 border border-pink-300 text-pink-800 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                          Connection
                        </span>
                      )}
                      {post.funnelStage === 'conversion' && (
                        <span className="bg-green-100 border border-green-300 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                          Conversion
                        </span>
                      )}
                      {post.funnelStage === 'loyalty' && (
                        <span className="bg-yellow-100 border border-yellow-300 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                          Loyalty
                        </span>
                      )}
                      {post.funnelStage === 'published' && (
                        <span className="bg-gray-800 border border-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                          ✅ Published
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-gray-800 pr-12 text-sm leading-tight">
                      {post.episodeNumber ? `Ep ${post.episodeNumber}: ` : ''}
                      {post.hook || 'Untitled Post'}
                    </p>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {post.format}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {post.audience}
                      </span>
                    </div>
                    {post.publishDate && (
                      <p className="text-[11px] text-green-700 font-bold mt-3 bg-green-50 p-1 rounded inline-block border border-green-200">
                        🚀 Live:{' '}
                        {new Date(post.publishDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}

        {!showArchived && (
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 p-4 rounded-lg min-w-[320px] flex flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-500 font-semibold mb-3">
              Create new series for{' '}
              {platforms.find((p) => p.id === activePlatform)?.label}
            </p>
            <input
              type="text"
              placeholder="e.g. Weekly Vlogs..."
              value={newSeriesTitle}
              onChange={(e) => setNewSeriesTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-2 text-sm"
            />
            <button
              onClick={handleAddSeries}
              className="w-full bg-white border border-indigo-200 text-indigo-600 font-bold py-2 rounded-md hover:bg-indigo-50 transition"
            >
              + Add Series List
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {formData.id ? 'Edit Post / Task Details' : 'Add Post Idea'}
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                  1. Architecture
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Platform
                    </label>
                    <select
                      value={formData.platform}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          platform: e.target.value,
                          seriesId: '',
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md mt-1 font-semibold text-indigo-600"
                    >
                      {platforms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Series List
                    </label>
                    <select
                      value={formData.seriesId}
                      onChange={(e) =>
                        setFormData({ ...formData, seriesId: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    >
                      <option value="" disabled>
                        Select Series...
                      </option>
                      {seriesList
                        .filter(
                          (s) => s.platform === formData.platform && !s.archived
                        )
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Funnel Stage
                    </label>
                    <select
                      value={formData.funnelStage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          funnelStage: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    >
                      <option value="discovery">Discovery (Broad Reach)</option>
                      <option value="interest">Interest (Engagement)</option>
                      <option value="connection">
                        Connection (Storytelling)
                      </option>
                      <option value="conversion">
                        Conversion (Sales/Offers)
                      </option>
                      <option value="loyalty">Loyalty (Community)</option>
                      <option value="published">
                        ✅ Published (Live on Social)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                    2. Strategy & Script
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Post Hook / Title
                      </label>
                      <input
                        type="text"
                        value={formData.hook}
                        onChange={(e) =>
                          setFormData({ ...formData, hook: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md mt-1"
                        placeholder="Grab their attention..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Format
                        </label>
                        <select
                          value={formData.format}
                          onChange={(e) =>
                            setFormData({ ...formData, format: e.target.value })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md mt-1"
                        >
                          <option value="reel">Short / Reel</option>
                          <option value="video">Long Video</option>
                          <option value="carousel">Carousel</option>
                          <option value="image">Static Image</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Episode #
                        </label>
                        <input
                          type="number"
                          value={formData.episodeNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              episodeNumber: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-md mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Script / Body Copy
                      </label>
                      <textarea
                        rows={8}
                        value={formData.copy}
                        onChange={(e) =>
                          setFormData({ ...formData, copy: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md mt-1 font-mono text-sm"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wide mb-3">
                      🎥 Filming & Production
                    </h3>
                    <label className="block text-sm font-medium text-gray-700">
                      Filming Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={formData.filmingInstructions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          filmingInstructions: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-orange-200 rounded-md mt-1 text-sm"
                    ></textarea>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Raw Footage Link
                      </label>
                      <input
                        type="url"
                        value={formData.rawAssetLink}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rawAssetLink: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-orange-200 rounded-md mt-1"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-3">
                      🚀 SEO & Distribution
                    </h3>
                    <label className="block text-sm font-medium text-gray-700">
                      SEO Optimizer
                    </label>
                    <textarea
                      rows={2}
                      value={formData.seoOptimiser}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seoOptimiser: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-blue-200 rounded-md mt-1 text-sm"
                    ></textarea>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Final Edited Video Link
                      </label>
                      <input
                        type="url"
                        value={formData.finalAssetLink}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            finalAssetLink: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-blue-200 rounded-md mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-3">
                  4. Assembly Line Deadlines
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      🎥 Film By
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.filmDate}
                      onChange={(e) =>
                        setFormData({ ...formData, filmDate: e.target.value })
                      }
                      className="w-full p-2 border border-indigo-200 rounded-md mt-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      ✂️ Edit By
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.editDate}
                      onChange={(e) =>
                        setFormData({ ...formData, editDate: e.target.value })
                      }
                      className="w-full p-2 border border-indigo-200 rounded-md mt-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      🚀 Publish By
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.publishDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          publishDate: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-indigo-200 rounded-md mt-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-between border-t pt-4">
              <button
                onClick={handleDeletePost}
                className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600"
              >
                Delete Post
              </button>
              <div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 mr-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePost}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition"
                >
                  Save to Pipeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
