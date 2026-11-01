import React, { useEffect, useState, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const { currentUser } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const currentUserId = currentUser.id;

  useEffect(() => {
    fetch(`http://localhost:5000/api/insights/${currentUserId}`)
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Good morning, {currentUser.name}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Here's your financial snapshot</p>

      <div className="grid-3">
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Spent (Your Share)</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>₹{data.totalSpent.toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Net Balance</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: data.netBalance >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
            {data.netBalance >= 0 ? '+' : ''}₹{data.netBalance.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Spending — last 6 months</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyTrend}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="var(--primary-light)" activeBar={{ fill: 'var(--primary-color)' }} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Recent Activity</h3>
          <ul style={{ listStyle: 'none' }}>
            {data.recentActivity.map(act => (
              <li key={act.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600 }}>{act.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  <span>{act.group_name} • {act.category}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{act.amount}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
