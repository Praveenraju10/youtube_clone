import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard/VideoCard';

export default function LikedVideos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    api.get('/videos/liked').then(({ data }) => setVideos(data));
  }, [user]);

  return (
    <div className="page-enter">
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Liked Videos</h1>
      {!videos.length
        ? <p style={{ color: 'var(--text-secondary)' }}>No liked videos yet.</p>
        : <div className="video-grid">{videos.map(v => <VideoCard key={v.id} video={v} />)}</div>}
    </div>
  );
}
