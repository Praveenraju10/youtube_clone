import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Upload.css';

const CATEGORIES = ['General', 'Music', 'Gaming', 'Film & Animation', 'Entertainment', 'Sports', 'Science & Tech', 'Autos', 'News'];

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', tags: '', category: 'General' });
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef();
  const thumbRef = useRef();

  if (!user) return (
    <div className="upload-gate">
      <h2>Sign in to upload videos</h2>
      <button className="btn btn-accent" onClick={() => navigate('/signin')}>Sign In</button>
    </div>
  );

  const handleThumb = (e) => {
    const f = e.target.files[0];
    if (f) { setThumbnail(f); setThumbPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video || !thumbnail) { setError('Please select a video and thumbnail.'); return; }
    setLoading(true); setError(''); setProgress(0);

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('tags', form.tags);
    fd.append('category', form.category);
    fd.append('video', video);
    fd.append('thumbnail', thumbnail);

    try {
      const { data } = await api.post('/videos/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      navigate(`/watch/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page page-enter">
      <h1 className="upload-heading">Upload Video</h1>
      <form className="upload-form" onSubmit={handleSubmit}>
        {/* Video Drop Zone */}
        <div className="drop-zone" onClick={() => videoRef.current.click()}>
          {video ? (
            <div className="file-selected">
              <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              <p>{video.name}</p>
              <span>{(video.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style={{ color: 'var(--text-muted)' }}>
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
              <p>Click to select a video file</p>
              <span>MP4, WebM, MOV up to 2GB</span>
            </>
          )}
          <input ref={videoRef} type="file" accept="video/*" hidden onChange={e => setVideo(e.target.files[0])} />
        </div>

        <div className="upload-cols">
          <div className="upload-left">
            <div className="form-group">
              <label>Title *</label>
              <input className="form-control" required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Add a title" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows="4" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Tell viewers about your video" />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input className="form-control" value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="gaming, tutorial, react" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="upload-right">
            <div className="form-group">
              <label>Thumbnail *</label>
              <div className="thumb-upload" onClick={() => thumbRef.current.click()}>
                {thumbPreview
                  ? <img src={thumbPreview} alt="thumb" className="thumb-preview" />
                  : <span>Click to upload thumbnail</span>}
                <input ref={thumbRef} type="file" accept="image/*" hidden onChange={handleThumb} />
              </div>
            </div>
          </div>
        </div>

        {error && <p className="upload-error">{error}</p>}

        {loading && (
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
            <span>{progress}% — Uploading to Cloudinary…</span>
          </div>
        )}

        <button type="submit" className="btn btn-accent upload-btn" disabled={loading}>
          {loading ? 'Uploading…' : 'Upload Video'}
        </button>
      </form>
    </div>
  );
}
