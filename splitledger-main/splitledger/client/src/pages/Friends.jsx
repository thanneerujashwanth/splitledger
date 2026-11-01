import React, { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { subscribeToEvents } from '../socket';
import { Search, UserPlus, Check, Clock, UserMinus } from 'lucide-react';

export default function Friends() {
  const { token, currentUser } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [pendingIncoming, setPendingIncoming] = useState([]);
  const [pendingOutgoing, setPendingOutgoing] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchFriends = useCallback(() => {
    fetch('http://localhost:5000/api/friends', {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })
    .then(res => res.json())
    .then(data => {
      setFriends(data.friends || []);
      setPendingIncoming(data.pendingIncoming || []);
      setPendingOutgoing(data.pendingOutgoing || []);
    });
  }, [token]);

  useEffect(() => {
    fetchFriends();
    
    const unsubscribe = subscribeToEvents((event) => {
      if (event.event === 'FRIENDS_UPDATED') {
        fetchFriends();
        return;
      }

      if (event.event === 'FRIEND_REQUEST' && event.data.recipientId === currentUser?.id) {
        fetchFriends();
      }
      if (event.event === 'FRIEND_ACCEPTED' && (event.data.requesterId === currentUser?.id || event.data.recipientId === currentUser?.id)) {
        fetchFriends();
      }
      if (event.event === 'FRIEND_REMOVED' && (event.data.userId1 === currentUser?.id || event.data.userId2 === currentUser?.id)) {
        fetchFriends();
      }
    });

    return unsubscribe;
  }, [fetchFriends, currentUser]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true);
      fetch(`http://localhost:5000/api/users/search?q=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      })
      .then(res => res.json())
      .then(data => setSearchResults(data))
      .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, token]);

  const sendRequest = (targetUserId) => {
    fetch('http://localhost:5000/api/friends/request', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ targetUserId })
    })
    .then(res => {
      if (res.ok) fetchFriends();
      else alert('Failed to send request');
    });
  };

  const acceptRequest = (requestId) => {
    fetch('http://localhost:5000/api/friends/accept', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ requestId })
    })
    .then(res => {
      if (res.ok) fetchFriends();
      else alert('Failed to accept request');
    });
  };

  const removeFriend = (targetUserId) => {
    fetch('http://localhost:5000/api/friends/remove', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ targetUserId })
    })
    .then(res => {
      if (res.ok) fetchFriends();
      else alert('Failed to remove friend');
    });
  };

  const renderUserList = (users, actionType) => {
    if (users.length === 0) return <div style={{ color: 'var(--text-secondary)' }}>No users found.</div>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {users.map(u => (
          <div key={u.id || u.request_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: u.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '1rem' }}>
                {u.initials}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>@{u.username}</div>
              </div>
            </div>
            <div>
              {actionType === 'search' && !friends.some(f => f.id === u.id) && !pendingOutgoing.some(p => p.id === u.id) && (
                <button className="btn btn-primary" onClick={() => sendRequest(u.id)}><UserPlus size={16} /> Add</button>
              )}
              {actionType === 'search' && pendingOutgoing.some(p => p.id === u.id) && (
                <button className="btn" disabled><Clock size={16} /> Sent</button>
              )}
              {actionType === 'search' && friends.some(f => f.id === u.id) && (
                <span className="badge badge-success">Friend</span>
              )}
              {actionType === 'incoming' && (
                <button className="btn btn-success" onClick={() => acceptRequest(u.request_id)}><Check size={16} /> Accept</button>
              )}
              {actionType === 'outgoing' && (
                <button className="btn btn-danger" onClick={() => removeFriend(u.id)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)' }}><UserMinus size={16} /> Cancel</button>
              )}
              {actionType === 'friend' && (
                <button className="btn btn-danger" onClick={() => removeFriend(u.id)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)' }}><UserMinus size={16} /> Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Friends</h1>
      
      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={20} /> Find Users
          </h3>
          <input 
            type="text" 
            placeholder="Search by username..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}
          />
          {isSearching ? <p>Searching...</p> : searchQuery.length > 2 ? renderUserList(searchResults, 'search') : <p style={{ color: 'var(--text-secondary)' }}>Type at least 3 characters to search.</p>}
        </div>

        <div>
          {pendingIncoming.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--warning-color)' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Friend Requests</h3>
              {renderUserList(pendingIncoming, 'incoming')}
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>My Friends ({friends.length})</h3>
            {renderUserList(friends, 'friend')}
          </div>
        </div>
      </div>
    </div>
  );
}
