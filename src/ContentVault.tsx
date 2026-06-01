import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export default function ContentVault() {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  const [selectedPost, setSelectedPost] = useState<any>(null);

  // States for Editing
  const [postDetails, setPostDetails] = useState({
    copy: '',
    seoOptimiser: '',
    rawAssetLink: '',
    finalAssetLink: '',
  });
  const [analyticsData, setAnalyticsData] = useState({
    views: '',
    likes: '',
    comments: '',
    ctr: '',
    retention: '',
  });
  const [logNotes, setLogNotes] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch = (post.hook || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesPlatform =
        platformFilter === 'all' || post.platform === platformFilter;
      const matchesStage =
        stageFilter === 'all' || post.funnelStage === stageFilter;
      return matchesSearch && matchesPlatform && matchesStage;
    })
    .sort(
      (a, b) =>
        new Date(b.publishDate || 0).getTime() -
        new Date(a.publishDate || 0).getTime()
    );

  const handleOpenModal = (post: any) => {
    setSelectedPost(post);
    setPostDetails({
      copy: post.copy || '',
      seoOptimiser: post.seoOptimiser || '',
      rawAssetLink: post.rawAssetLink || '',
      finalAssetLink: post.finalAssetLink || '',
    });
    setAnalyticsData(
      post.analytics || {
        views: '',
        likes: '',
        comments: '',
        ctr: '',
        retention: '',
      }
    );
    setLogNotes(post.logNotes || '');
  };

  const handleSaveChanges = async () => {
    if (!selectedPost) return;
    await updateDoc(doc(db, 'posts', selectedPost.id), {
      copy: postDetails.copy,
      seoOptimiser: postDetails.seoOptimiser,
      rawAssetLink: postDetails.rawAssetLink,
      finalAssetLink: postDetails.finalAssetLink,
      analytics: analyticsData,
      logNotes: logNotes,
      analyticsLogged: true,
    });
    setSelectedPost(null);
  };

  return (
    <div className="p-4 md:p-8 flex-1 overflow-y-auto bg-gray-50 h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🗄️ Content Vault & Logs
        </h1>
        <p className="text-gray-500">
          The master bank of all historical content, analytics, and operational
          notes.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search post hooks or titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg font-semibold text-gray-700"
        >
          <option value="all">All Platforms</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="linkedin">LinkedIn</option>
          <option value="facebook">Facebook</option>
        </select>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg font-semibold text-gray-700"
        >
          <option value="all">All Stages</option>
          <option value="discovery">Discovery</option>
          <option value="interest">Interest</option>
          <option value="conversion">Conversion</option>
          <option value="published">✅ Published</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 text-sm uppercase tracking-wider">
            <tr>
              <th className="p-4">Post Title / Hook</th>
              <th className="p-4">Platform</th>
              <th className="p-4">Status</th>
              <th className="p-4">Views/Reach</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPosts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-bold text-gray-800">
                  {post.hook || 'Untitled'}
                </td>
                <td className="p-4">
                  <span className="bg-gray-200 text-gray-800 text-xs font-bold px-2 py-1 rounded">
                    {post.platform}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      post.funnelStage === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {post.funnelStage === 'published'
                      ? 'Published'
                      : 'In Pipeline'}
                  </span>
                </td>
                <td className="p-4 font-semibold text-gray-600">
                  {post.analytics?.views
                    ? `${post.analytics.views} views`
                    : '--'}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleOpenModal(post)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-sm"
                  >
                    View / Edit Data
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPosts.length === 0 && (
          <div className="p-10 text-center text-gray-500 font-semibold">
            No posts match your filters.
          </div>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedPost.hook}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Edit post contents, performance data, or add historical log notes.
            </p>

            <div className="space-y-6 mb-6">
              {/* SECTION 1: Editable Post Content */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">
                  ⚙️ Edit Post Details & Links
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700">
                      Caption / Copy
                    </label>
                    <textarea
                      rows={3}
                      value={postDetails.copy}
                      onChange={(e) =>
                        setPostDetails({ ...postDetails, copy: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">
                      SEO & Hashtags
                    </label>
                    <input
                      type="text"
                      value={postDetails.seoOptimiser}
                      onChange={(e) =>
                        setPostDetails({
                          ...postDetails,
                          seoOptimiser: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">
                        Raw Footage Link
                      </label>
                      <input
                        type="url"
                        value={postDetails.rawAssetLink}
                        onChange={(e) =>
                          setPostDetails({
                            ...postDetails,
                            rawAssetLink: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700">
                        Final Edited Video Link
                      </label>
                      <input
                        type="url"
                        value={postDetails.finalAssetLink}
                        onChange={(e) =>
                          setPostDetails({
                            ...postDetails,
                            finalAssetLink: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Analytics & Logs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-bold text-indigo-800 mb-4">
                    📈 Performance Analytics
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">
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
                        className="w-full p-2 border border-indigo-300 rounded"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700">
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
                          className="w-full p-2 border border-indigo-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700">
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
                          className="w-full p-2 border border-indigo-300 rounded"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700">
                          CTR (%)
                        </label>
                        <input
                          type="number"
                          value={analyticsData.ctr}
                          onChange={(e) =>
                            setAnalyticsData({
                              ...analyticsData,
                              ctr: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-indigo-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700">
                          Retention (%)
                        </label>
                        <input
                          type="number"
                          value={analyticsData.retention}
                          onChange={(e) =>
                            setAnalyticsData({
                              ...analyticsData,
                              retention: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-indigo-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex flex-col">
                  <h3 className="font-bold text-yellow-800 mb-2">
                    📝 Operational Log & Notes
                  </h3>
                  <p className="text-xs text-yellow-700 mb-4">
                    Why did this perform well? Any mistakes made? Add historical
                    notes here.
                  </p>
                  <textarea
                    rows={8}
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="w-full p-3 border border-yellow-300 rounded-lg flex-1"
                    placeholder="e.g., The hook was great, but the CTA was too long. Next time..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
