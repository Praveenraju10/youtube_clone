import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import VideoCard from '../components/VideoCard/VideoCard';
import { SkeletonGrid } from '../components/SkeletonCard/SkeletonCard';

export default function Search() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    api.get('/videos', { params: { search: query, limit: 24 } })
      .then(({ data }) => setVideos(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="page-enter">
      <h2 style={{ marginBottom: 24, color: 'var(--text-secondary)', fontSize: 16 }}>
        {query ? `Results for "${query}"` : 'Search for videos'}
      </h2>
      {loading ? <SkeletonGrid count={8} /> : (
        <div className="video-grid">
          {videos.map(v => <VideoCard key={v.id} video={v} />)}
          {query && !videos.length && <p style={{ color: 'var(--text-secondary)' }}>No results found for "{query}".</p>}
        </div>
      )}
    </div>
  );
}
