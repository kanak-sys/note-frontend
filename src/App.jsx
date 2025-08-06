/* eslint-disable no-unused-vars */
// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';

const BASE_URL = 'https://note-management-2260.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    content: ''
  });
  const [editingNote, setEditingNote] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchNotes(token);
    }
  }, []);

  const fetchNotes = async (token) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BASE_URL}/api/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setNotes(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateAuth = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    if (!isLogin && !formData.name) newErrors.name = 'Name is required';
    if (!isLogin && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNote = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!validateAuth()) return;

    const endpoint = isLogin ? `${BASE_URL}/api/login` : `${BASE_URL}/api/signup`;
    try {
      setIsLoading(true);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? 
          { email: formData.email, password: formData.password } :
          { name: formData.name, email: formData.email, password: formData.password }
        )
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ 
          userId: data.userId, 
          name: data.name 
        }));
        setUser({ userId: data.userId, name: data.name });
        fetchNotes(data.token);
      } else {
        setErrors({ general: data.message || 'An error occurred' });
      }
      setIsLoading(false);
    } catch (error) {
      setErrors({ general: 'Network error' });
      setIsLoading(false);
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!validateNote()) return;

    const token = localStorage.getItem('token');
    const method = editingNote ? 'PUT' : 'POST';
    const url = editingNote 
      ? `${BASE_URL}/api/notes/${editingNote._id}` 
      : `${BASE_URL}/api/notes`;
    
    try {
      setIsLoading(true);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        if (editingNote) {
          setNotes(notes.map(note => 
            note._id === editingNote._id ? data : note
          ));
          setEditingNote(null);
        } else {
          setNotes([data, ...notes]);
        }
        setFormData({ ...formData, title: '', content: '' });
      } else {
        setErrors({ general: data.message || 'An error occurred' });
      }
      setIsLoading(false);
    } catch (error) {
      setErrors({ general: 'Network error' });
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    const token = localStorage.getItem('token');
    try {
      setIsLoading(true);
      const response = await fetch(`${BASE_URL}/api/notes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotes(notes.filter(note => note._id !== id));
      } else {
        const data = await response.json();
        setErrors({ general: data.message });
      }
      setIsLoading(false);
    } catch (error) {
      setErrors({ general: 'Network error' });
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setNotes([]);
    setFormData({
      name: '',
      email: '',
      password: '',
      title: '',
      content: ''
    });
  };

  // Filter notes based on search term
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      {!user ? (
        <div className="auth-container">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          {errors.general && <p className="error">{errors.general}</p>}
          <form onSubmit={handleAuthSubmit}>
            {!isLogin && (
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error-input' : ''}
                />
                <label htmlFor="name">Full Name</label>
                {errors.name && <p className="error">{errors.name}</p>}
              </div>
            )}
            <div className="form-group">
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error-input' : ''}
              />
              <label htmlFor="email">Email Address</label>
              {errors.email && <p className="error">{errors.email}</p>}
            </div>
            <div className="form-group">
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'error-input' : ''}
              />
              <label htmlFor="password">Password</label>
              {errors.password && <p className="error">{errors.password}</p>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <span className="spinner"></span>
              ) : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>
          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              className="toggle-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      ) : (
        <div className="notes-container">
          <div className="header">
            <div className="user-info">
              <div className="avatar">
                <span>{user.name.charAt(0)}</span>
              </div>
              <div>
                <h2>Hello, {user.name}!</h2>
                <p>You have {notes.length} note{notes.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="header-actions">
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="Search notes..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </div>
          
          <div className="note-form">
            <h3>{editingNote ? 'Edit Note' : 'Create New Note'}</h3>
            {errors.general && <p className="error">{errors.general}</p>}
            <form onSubmit={handleNoteSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  name="title"
                  id="title"
                  placeholder=" "
                  value={formData.title}
                  onChange={handleInputChange}
                  className={errors.title ? 'error-input' : ''}
                />
                <label htmlFor="title">Note Title</label>
                {errors.title && <p className="error">{errors.title}</p>}
              </div>
              <div className="form-group">
                <textarea
                  name="content"
                  id="content"
                  placeholder=" "
                  value={formData.content}
                  onChange={handleInputChange}
                  className={errors.content ? 'error-input' : ''}
                ></textarea>
                <label htmlFor="content">Note Content</label>
                {errors.content && <p className="error">{errors.content}</p>}
              </div>
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="spinner"></span>
                  ) : editingNote ? 'Update Note' : 'Add Note'}
                </button>
                {editingNote && (
                  <button 
                    type="button" 
                    className="btn cancel-btn"
                    onClick={() => {
                      setEditingNote(null);
                      setFormData({ ...formData, title: '', content: '' });
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          
          <div className="notes-section">
            <div className="section-header">
              <h3>Your Notes</h3>
              <div className="notes-count">
                {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found
              </div>
            </div>
            
            {isLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading your notes...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <h4>No notes found</h4>
                <p>{searchTerm ? 'Try a different search term' : 'Create your first note to get started'}</p>
              </div>
            ) : (
              <div className="notes-grid">
                {filteredNotes.map(note => (
                  <div key={note._id} className="note-card">
                    <div className="note-content">
                      <h4>{note.title}</h4>
                      <p>{note.content}</p>
                    </div>
                    <div className="note-meta">
                      <div className="note-date">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {new Date(note.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="note-actions">
                        <button 
                          className="btn edit-btn"
                          onClick={() => {
                            setEditingNote(note);
                            setFormData({
                              ...formData,
                              title: note.title,
                              content: note.content
                            });
                          }}
                          disabled={isLoading}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn delete-btn"
                          onClick={() => handleDeleteNote(note._id)}
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;