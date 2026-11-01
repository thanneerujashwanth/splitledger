import React, { useEffect, useState } from 'react';
import { subscribeToEvents } from '../socket';

export default function Feed() {
  const [feed, setFeed] = useState([
    { id: 1, text: "System: Feed connected", time: new Date() }
  ]);

  useEffect(() => {
    const unsubscribeAdd = subscribeToEvents((msg) => {
      if (msg.event === 'expense:added') {
        setFeed(prev => [{ id: Date.now(), text: `New expense added: ${msg.data.description} for ₹${msg.data.amount}`, time: new Date() }, ...prev]);
      }
    });

    return () => {
      unsubscribeAdd();
    };
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Live Feed</h1>
      <div className="card">
        {feed.map(item => (
          <div key={item.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--primary-color)', marginRight: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
              {item.time.toLocaleTimeString()}
            </span>
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}
