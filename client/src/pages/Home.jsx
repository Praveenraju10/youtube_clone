import { useState, useEffect } from 'react';
import api from '../utils/api';
import VideoCard from '../components/VideoCard/VideoCard';
import { SkeletonGrid } from '../components/SkeletonCard/SkeletonCard';
import './Home.css';

const CATEGORIES = ['All', 'Music', 'Gaming', 'Film & Animation', 'Entertainment', 'Sports', 'Science & Tech', 'Autos', 'News'];

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    setLoading(true);
    api.get('/videos', { params: { category: category === 'All' ? undefined : category, limit: 24 } })
      .then(({ data }) => setVideos(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="page-enter">
      <div className="category-chips">
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      {loading ? <SkeletonGrid count={12} /> : (
        <div className="video-grid">
          {videos.map((v) => <VideoCard key={v.id} video={v} />)}
          {!videos.length && <p style={{ color: 'var(--text-secondary)' }}>No videos found.</p>}
        </div>
      )}
    </div>
  );
}
