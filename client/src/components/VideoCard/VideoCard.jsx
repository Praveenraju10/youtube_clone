import { Link } from 'react-router-dom';
import './VideoCard.css';

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const intervals = [
    [31536000, 'year'], [2592000, 'month'], [86400, 'day'],
    [3600, 'hour'], [60, 'minute'],
  ];
  for (const [secs, unit] of intervals) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
  }
}

function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n;
}

function formatDuration(secs) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoCard({ video }) {
  return (
    <Link to={`/watch/${video.id}`} className="video-card">
      <div className="video-thumbnail-wrap">
        <img
          className="video-thumbnail"
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
        />
        {video.duration && (
          <span className="video-duration">{formatDuration(video.duration)}</span>
        )}
      </div>
      <div className="video-info">
        {video.channel_avatar ? (
          <img src={video.channel_avatar} alt={video.channel_name} className="channel-avatar" />
        ) : (
          <div className="channel-avatar-placeholder">
            {(video.channel_name || 'U')[0].toUpperCase()}
          </div>
        )}
        <div className="video-meta">
          <h3 className="video-title">{video.title}</h3>
          <Link
            to={`/channel/${video.user_id}`}
            className="channel-name"
            onClick={(e) => e.stopPropagation()}
          >
            {video.channel_name}
          </Link>
          <p className="video-stats">
            {formatViews(video.views)} views · {timeAgo(video.created_at)}
          </p>
        </div>
      </div>
    </Link>
  );
}
