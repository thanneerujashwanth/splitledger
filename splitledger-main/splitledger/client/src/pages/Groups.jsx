import React, { useEffect, useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { subscribeToEvents } from '../socket';

export default function Groups() {
  const { token, currentUser } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('🌟');
  const [selectedFriends, setSelectedFriends] = useState([]);

  const fetchGroups = () => {
    fetch('http://localhost:5000/api/groups', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setGroups(data));
  };

  useEffect(() => {
    fetchGroups();
    
    // Fetch friends for the group creation modal
    fetch('http://localhost:5000/api/friends', {
      headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setFriends(data.friends || []));

    const unsubscribe = subscribeToEvents((event) => {
      if (event.event === 'GROUPS_UPDATED' || event.event === 'expense:added' || event.event === 'split:accepted' || event.event === 'split:paid') {
        fetchGroups();
      }
    });

    return unsubscribe;
  }, [token]);

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!groupName) return;

    // Always include current user in the group
    const member_ids = [currentUser.id, ...selectedFriends];

    fetch('http://localhost:5000/api/groups', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        name: groupName,
        icon: groupIcon,
        member_ids
      })
    })
    .then(res => {
      if (res.ok) {
        setIsModalOpen(false);
        setGroupName('');
        setSelectedFriends([]);
        fetchGroups();
      } else {
        alert('Failed to create group');
      }
    });
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1>Groups</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Group</button>
      </div>

      {groups.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>You are not part of any groups yet.</p> : null}

      <div className="grid-2">
        {groups.map(group => (
          <div key={group.id} className="card">
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{group.icon}</span>
                <h3 style={{ margin: 0 }}>{group.name}</h3>
              </div>
              <div style={{ fontWeight: 600 }}>Total: ₹{group.total_spent || 0}</div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {group.members.map(m => (
                <div key={m.id} style={{ 
                  width: 32, height: 32, borderRadius: '50%', backgroundColor: m.color, 
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 600, position: 'relative'
                }} title={m.name}>
                  {m.initials}
                </div>
              ))}
            </div>

            <NavLink to={`/expenses?groupId=${group.id}`} className="btn" style={{ background: 'var(--bg-color)', width: '100%', justifyContent: 'center' }}>
              View Expenses
            </NavLink>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 450, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Group</h2>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Group Name</label>
                  <input type="text" placeholder="e.g. Goa Trip" value={groupName} onChange={e => setGroupName(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                </div>
                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Icon</label>
                  <input type="text" value={groupIcon} onChange={e => setGroupIcon(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Add Friends to Group</label>
                {friends.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>You don't have any friends yet. Add them from the Friends page!</p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.5rem' }}>
                    {friends.map(f => (
                      <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', cursor: 'pointer', borderRadius: '0.25rem' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-color)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <input type="checkbox" checked={selectedFriends.includes(f.id)} onChange={() => toggleFriend(f.id)} style={{ width: '1.2rem', height: '1.2rem' }} />
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: f.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '0.75rem', fontSize: '0.75rem' }}>
                            {f.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{f.name}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>@{f.username}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
