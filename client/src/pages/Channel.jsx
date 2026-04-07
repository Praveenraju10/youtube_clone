import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard/VideoCard';
import './Channel.css';

function formatNum(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n;
}

export default function Channel() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    api.get(`/users/${id}`).then(({ data }) => {
      setChannel(data);
      setSubscribed(user?.subscribed_to?.includes(id));
    });
    api.get(`/users/${id}/videos`).then(({ data }) => setVideos(data));
  }, [id]);

  const handleSubscribe = async () => {
    if (!user) return;
    if (subscribed) {
      await api.put(`/users/${id}/unsubscribe`);
      setSubscribed(false);
      setChannel(c => ({ ...c, subscribers: c.subscribers - 1 }));
    } else {
      await api.put(`/users/${id}/subscribe`);
      setSubscribed(true);
      setChannel(c => ({ ...c, subscribers: c.subscribers + 1 }));
    }
  };

  if (!channel) return null;

  return (
    <div className="channel-page page-enter">
      <div className="channel-header">
        {channel.avatar
          ? <img src={channel.avatar} alt={channel.name} className="channel-pic" />
          : <div className="channel-pic-ph">{channel.name[0].toUpperCase()}</div>}
        <div className="channel-details">
          <h1 className="channel-name-big">{channel.name}</h1>
          <p className="channel-stats">{formatNum(channel.subscribers)} subscribers · {videos.length} videos</p>
          {user && user.id !== id && (
            <button
              className={`btn ${subscribed ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleSubscribe}
            >
              {subscribed ? 'Subscribed ✓' : 'Subscribe'}
            </button>
          )}
        </div>
      </div>

      <div className="channel-tabs">
        <span className="channel-tab active">Videos</span>
      </div>

      <div className="video-grid">
        {videos.map(v => <VideoCard key={v.id} video={{ ...v, channel_name: channel.name, channel_avatar: channel.avatar }} />)}
        {!videos.length && <p style={{ color: 'var(--text-secondary)' }}>No videos yet.</p>}
      </div>
    </div>
  );
}
