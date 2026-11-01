import React, { useEffect, useState } from 'react';

export default function Splits() {
  const [settlements, setSettlements] = useState([]);
  const groupId = 1; // Default Goa Trip

  useEffect(() => {
    fetch(`http://localhost:5000/api/settlements/${groupId}`)
      .then(res => res.json())
      .then(data => setSettlements(data));
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Settlements & Splits</h1>
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Smart Settlement Algorithm</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          This calculates the minimum number of transactions needed to clear all debts.
        </p>

        {settlements.length === 0 ? <p>All debts settled!</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {settlements.map((s, idx) => (
              <div key={idx} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="badge badge-warning">{s.from.name}</div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>pays</span>
                  <div className="badge badge-success">{s.to.name}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                  ₹{s.amount}
                </div>
                <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>Mark Paid</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
