import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChalkboardTeacher, 
  faChartLine, 
  faCalendarAlt, 
  faClock, 
  faUsers,
  faEye,
  faPlus,
  faSignOutAlt,
  faSync,
  faFilter,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const InstructorDashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if user is not an instructor
  useEffect(() => {
    if (user && user.role !== 'instructor') {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Fetch meetings
  const fetchMeetings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/meetings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch meetings');
      }
      
      setMeetings(data.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError(error.message || 'Failed to fetch meetings');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMeetings();
  }, []);
  
  // Filter and search meetings
  const filteredMeetings = meetings.filter(meeting => {
    // Filter by active status
    if (activeFilter === 'active' && !meeting.isActive) return false;
    if (activeFilter === 'completed' && meeting.isActive) return false;
    
    // Search by title or room ID
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        meeting.title.toLowerCase().includes(query) ||
        meeting.roomId.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate class duration in readable format
  const getClassDuration = (startTime, endTime) => {
    if (!endTime) return 'Ongoing';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Ensure both dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date in getClassDuration:', { startTime, endTime });
      return 'Invalid';
    }
    
    // Calculate duration in milliseconds
    const durationMs = end.getTime() - start.getTime();
    
    // Handle case where end time is before start time (should not happen)
    if (durationMs < 0) {
      console.error('End time is before start time:', { startTime, endTime });
      return 'Error';
    }
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes} min`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };
  
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#323248' }}>
      {/* Header */}
      <header className="p-3" style={{ backgroundColor: '#252536', borderBottom: '1px solid #454564' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FontAwesomeIcon 
                icon={faChalkboardTeacher} 
                className="me-3"
                style={{ fontSize: '1.5rem', color: '#3949AB' }}
              />
              <h1 className="h4 mb-0" style={{ color: '#e0e0e0' }}>Instructor Dashboard</h1>
            </div>
            
            <div className="d-flex align-items-center">
              {user && (
                <div className="me-3 text-end">
                  <div style={{ color: '#e0e0e0' }}>{user.name}</div>
                  <span className="badge bg-primary">Instructor</span>
                </div>
              )}
              </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container py-4 flex-grow-1">
        <div className="row mb-4">
          <div className="col-md-8">
            <div className="d-flex align-items-center mb-3">
              <h2 className="h4 mb-0 me-3" style={{ color: '#e0e0e0' }}>My Classes</h2>
              
              <button 
                className="btn btn-sm"
                style={{ backgroundColor: '#3949AB', color: '#ffffff' }}
                onClick={fetchMeetings}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faSync} className={isLoading ? 'fa-spin me-1' : 'me-1'} />
                Refresh
              </button>
            </div>
            
            <div className="d-flex align-items-center mb-3">
              <div className="input-group me-3">
                <span className="input-group-text" style={{ backgroundColor: '#252536', borderColor: '#454564' }}>
                  <FontAwesomeIcon icon={faSearch} style={{ color: '#adb5bd' }} />
                </span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search classes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ backgroundColor: '#252536', borderColor: '#454564', color: '#e0e0e0' }}
                />
              </div>
              
              <div className="btn-group">
                <button 
                  className={`btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveFilter('all')}
                  style={{ borderColor: '#454564' }}
                >
                  All
                </button>
                <button 
                  className={`btn btn-sm ${activeFilter === 'active' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveFilter('active')}
                  style={{ borderColor: '#454564' }}
                >
                  Active
                </button>
                <button 
                  className={`btn btn-sm ${activeFilter === 'completed' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveFilter('completed')}
                  style={{ borderColor: '#454564' }}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 text-end">
            <Link 
              to="/" 
              className="btn"
              style={{ backgroundColor: '#3949AB', color: '#ffffff' }}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Create New Class
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2" style={{ color: '#e0e0e0' }}>Loading classes...</p>
          </div>
        ) : (
          <>
            {filteredMeetings.length === 0 ? (
              <div className="text-center py-5" style={{ color: '#adb5bd' }}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '3rem', opacity: 0.5 }} />
                <p className="mt-3">No classes found. Create a new class to get started.</p>
              </div>
            ) : (
              <div className="row">
                {filteredMeetings.map(meeting => (
                  <div className="col-md-6 col-lg-4 mb-4" key={meeting._id}>
                    <div className="card h-100" style={{ backgroundColor: '#252536', borderColor: '#454564' }}>
                      <div className="card-header d-flex justify-content-between align-items-center" style={{ borderColor: '#454564' }}>
                        <h5 className="card-title mb-0 text-truncate" style={{ color: '#e0e0e0', maxWidth: '200px' }}>
                          {meeting.title}
                        </h5>
                        <span 
                          className={`badge ${meeting.isActive ? 'bg-success' : 'bg-secondary'}`}
                        >
                          {meeting.isActive ? 'Active' : 'Completed'}
                        </span>
                      </div>
                      
                      <div className="card-body">
                        <div className="mb-2" style={{ color: '#e0e0e0' }}>
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                          {formatDate(meeting.startTime)}
                        </div>
                        
                        <div className="mb-2" style={{ color: '#e0e0e0' }}>
                          <FontAwesomeIcon icon={faClock} className="me-2" />
                          {formatTime(meeting.startTime)} - {meeting.endTime ? formatTime(meeting.endTime) : 'Ongoing'}
                          <span className="ms-2 text-muted">
                            ({getClassDuration(meeting.startTime, meeting.endTime)})
                          </span>
                        </div>
                        
                        <div className="mb-2" style={{ color: '#e0e0e0' }}>
                          <FontAwesomeIcon icon={faUsers} className="me-2" />
                          {meeting.overallStats?.totalParticipants || 0} participants
                        </div>
                        
                        <div className="mb-3" style={{ color: '#e0e0e0' }}>
                          <FontAwesomeIcon icon={faEye} className="me-2" />
                          Avg. Attention: {Math.round(meeting.overallStats?.averageAttention || 0)}%
                        </div>
                        
                        <div className="progress mb-2" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{ width: `${Math.round(meeting.overallStats?.averageAttention || 0)}%` }}
                            role="progressbar"
                            aria-valuenow={Math.round(meeting.overallStats?.averageAttention || 0)}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        
                        <div className="text-muted small mb-3">
                          Class ID: {meeting.roomId}
                        </div>
                      </div>
                      
                      <div className="card-footer" style={{ borderColor: '#454564', backgroundColor: 'rgba(69, 69, 100, 0.2)' }}>
                        <Link 
                          to={`/instructor/analytics/${meeting._id}`}
                          className="btn btn-primary w-100"
                        >
                          <FontAwesomeIcon icon={faChartLine} className="me-2" />
                          View Analytics
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-3 text-center" style={{ backgroundColor: '#252536', borderTop: '1px solid #454564', color: '#adb5bd' }}>
        <div className="container">
          <p className="mb-0 small">
            Student Monitoring System - Instructor Dashboard
          </p>
        </div>
      </footer>
    </div>
  );
};

export default InstructorDashboard; 