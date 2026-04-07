import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard/VideoCard';
import './WatchVideo.css';

function formatViews(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n;
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  const intervals = [[31536000,'year'],[2592000,'month'],[86400,'day'],[3600,'hour'],[60,'minute']];
  for (const [s, u] of intervals) { const n = Math.floor(seconds/s); if (n>=1) return `${n} ${u}${n>1?'s':''} ago`; }
  return 'Just now';
}

export default function WatchVideo() {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const viewCounted = useRef(false);

  useEffect(() => {
    viewCounted.current = false;
    setVideo(null); setComments([]); setCommentText('');
    api.get(`/videos/${id}`).then(({ data }) => {
      setVideo(data);
      if (user) {
        setLiked(user.liked_videos?.includes(id));
        setSubscribed(user.subscribed_to?.includes(data.user_id));
      }
    });
    api.get('/videos', { params: { limit: 8 } }).then(({ data }) => setRelated(data.filter(v => v.id !== id)));
    api.get(`/comments/${id}`).then(({ data }) => setComments(data));
  }, [id]);

  const handlePlay = () => {
    if (!viewCounted.current) {
      viewCounted.current = true;
      api.put(`/videos/${id}/view`).catch(() => {});
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const { data } = await api.put(`/videos/${id}/like`);
    setLiked(data.action === 'liked');
    setDisliked(false);
    setVideo(v => ({ ...v, likes: v.likes + (data.action === 'liked' ? 1 : -1) }));
  };

  const handleDislike = async () => {
    if (!user) return;
    const { data } = await api.put(`/videos/${id}/dislike`);
    setDisliked(data.action === 'disliked');
    setLiked(false);
  };

  const handleSubscribe = async () => {
    if (!user) return;
    if (subscribed) {
      await api.put(`/users/${video.user_id}/unsubscribe`);
      setSubscribed(false);
    } else {
      await api.put(`/users/${video.user_id}/subscribe`);
      setSubscribed(true);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    const { data } = await api.post('/comments/', { video_id: id, text: commentText });
    setComments(prev => [data, ...prev]);
    setCommentText('');
  };

  if (!video) return <div className="watch-loading"><div className="skeleton" style={{width:'100%',height:400}} /></div>;

  return (
    <div className="watch-page page-enter">
      <div className="watch-main">
        {/* Video Player */}
        <div className="player-wrap">
          <video
            key={video.video_url}
            className="video-player"
            src={video.video_url}
            controls
            autoPlay
            onPlay={handlePlay}
          />
        </div>

        <h1 className="watch-title">{video.title}</h1>

        {/* Actions */}
        <div className="watch-actions">
          <div className="channel-info">
            {video.channel_avatar
              ? <img src={video.channel_avatar} alt={video.channel_name} className="watch-avatar" />
              : <div className="watch-avatar-ph">{(video.channel_name||'U')[0]}</div>}
            <div>
              <Link to={`/channel/${video.user_id}`} className="watch-channel-name">{video.channel_name}</Link>
              <p className="watch-subs">{formatViews(video.channel_subscribers)} subscribers</p>
            </div>
            {user && user.id !== video.user_id && (
              <button className={`btn ${subscribed ? 'btn-secondary' : 'btn-primary'}`} onClick={handleSubscribe}>
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>

          <div className="action-btns">
            <div className="like-group">
              <button className={`action-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
                <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                </svg>
                {formatViews(video.likes)}
              </button>
              <div className="like-divider" />
              <button className={`action-btn ${disliked ? 'active' : ''}`} onClick={handleDislike}>
                <svg viewBox="0 0 24 24" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Stats + Description */}
        <div className="watch-desc-box" onClick={() => setShowDesc(!showDesc)}>
          <p className="watch-stats">{formatViews(video.views)} views · {timeAgo(video.created_at)}</p>
          <p className={`watch-desc-text ${showDesc ? 'expanded' : ''}`}>{video.description}</p>
          {!showDesc && <span className="show-more">Show more</span>}
        </div>

        {/* Comments */}
        <div className="comments-section">
          <h3>{comments.length} Comments</h3>
          {user && (
            <form className="comment-form" onSubmit={handleComment}>
              <input className="form-control" placeholder="Add a comment…" value={commentText} onChange={e => setCommentText(e.target.value)} />
              <button type="submit" className="btn btn-secondary" disabled={!commentText.trim()}>Comment</button>
            </form>
          )}
          <div className="comments-list">
            {comments.map(c => (
              <div key={c.id} className="comment">
                <div className="comment-avatar-ph">{(c.user_name||'U')[0]}</div>
                <div className="comment-body">
                  <span className="comment-author">{c.user_name}</span>
                  <span className="comment-time"> · {timeAgo(c.created_at)}</span>
                  <p className="comment-text">{c.text}</p>
                  {c.replies?.length > 0 && (
                    <div className="replies">
                      {c.replies.map(r => (
                        <div key={r.id} className="comment reply">
                          <div className="comment-avatar-ph sm">{(r.user_name||'U')[0]}</div>
                          <div className="comment-body">
                            <span className="comment-author">{r.user_name}</span>
                            <p className="comment-text">{r.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Videos */}
      <aside className="watch-sidebar">
        <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14 }}>Up next</h3>
        {related.map(v => <VideoCard key={v.id} video={v} />)}
      </aside>
    </div>
  );
}
