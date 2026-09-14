import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Plus,
  Send,
  ThumbsUp,
  X,
} from 'lucide-react';
import { Feedback } from '../../types';
import { api } from '../../services/api';

export const FeedbackView: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Response Modal
  const [replyTarget, setReplyTarget] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // New feedback form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [cleanliness, setCleanliness] = useState(5);
  const [service, setService] = useState(5);
  const [comfort, setComfort] = useState(5);
  const [dining, setDining] = useState(5);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Feedback[] }>('/feedback');
      if (res.success) {
        setFeedbacks(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget || !replyText) return;

    setIsReplying(true);
    try {
      await api.post(`/feedback/${replyTarget._id}/respond`, { response: replyText });
      setReplyTarget(null);
      setReplyText('');
      await loadFeedback();
    } catch (err: any) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setIsReplying(false);
    }
  };

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !comments) return;

    try {
      await api.post('/feedback', {
        guestName,
        rating: Number(rating),
        comments,
        cleanlinessRating: Number(cleanliness),
        serviceRating: Number(service),
        comfortRating: Number(comfort),
        foodAndDiningRating: Number(dining),
      });
      setShowAddModal(false);
      setGuestName('');
      setComments('');
      await loadFeedback();
    } catch (err: any) {
      alert(err.message || 'Failed to record feedback');
    }
  };

  // Calculations
  const averageRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Guest Experience & Reviews</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Voice of the guest, amenity ratings, and personalized executive management replies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadFeedback}
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Review
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-serif font-black text-amber-600">{averageRating}</div>
          <div className="flex items-center gap-1 text-amber-500 my-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <div className="text-xs text-zinc-500">Based on {feedbacks.length} verified stays</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <span className="text-zinc-500 block mb-1">Cleanliness</span>
            <span className="text-lg font-bold text-zinc-900">4.9 / 5</span>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full w-[98%]" />
            </div>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <span className="text-zinc-500 block mb-1">Staff & Service</span>
            <span className="text-lg font-bold text-zinc-900">5.0 / 5</span>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full w-[100%]" />
            </div>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <span className="text-zinc-500 block mb-1">Room Comfort</span>
            <span className="text-lg font-bold text-zinc-900">4.8 / 5</span>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-500 h-full w-[96%]" />
            </div>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <span className="text-zinc-500 block mb-1">Michelin Dining</span>
            <span className="text-lg font-bold text-zinc-900">4.9 / 5</span>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-500 h-full w-[98%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-zinc-400 text-xs">Loading reviews...</div>
        ) : (
          feedbacks.map((fb) => (
            <div
              key={fb._id}
              className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">{fb.guestName}</h4>
                  <div className="text-[11px] text-zinc-400">
                    {new Date(fb.createdAt).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(fb.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-zinc-700 leading-relaxed italic">"{fb.comments}"</p>

              {/* Management Response */}
              {fb.response ? (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>The Grand Imperial Executive Management Response:</span>
                  </div>
                  <p className="text-zinc-700 leading-relaxed">{fb.response}</p>
                  {fb.respondedAt && (
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Replied on {new Date(fb.respondedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setReplyTarget(fb);
                      setReplyText('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Respond to Guest</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Response Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">
                Respond to {replyTarget.guestName}
              </h3>
              <button
                onClick={() => setReplyTarget(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-600 italic">
                "{replyTarget.comments}"
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Management Response</label>
                <textarea
                  rows={4}
                  placeholder="Dear Guest, Thank you for sharing your wonderful experience with us..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplying}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isReplying ? 'Sending...' : 'Publish Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Feedback Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Record Guest Stay Review</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeedback} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Guest Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lady Genevieve Vance"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Overall Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-bold"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ 5 Stars (Exceptional)</option>
                  <option value={4}>⭐⭐⭐⭐ 4 Stars (Very Good)</option>
                  <option value={3}>⭐⭐⭐ 3 Stars (Average)</option>
                  <option value={2}>⭐⭐ 2 Stars (Poor)</option>
                  <option value={1}>⭐ 1 Star (Unacceptable)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Guest Comments</label>
                <textarea
                  rows={3}
                  placeholder="The panoramic sea view and private sauna were breathtaking..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
