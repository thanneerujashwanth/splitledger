import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subscribeToEvents } from '../socket';

import { AuthContext } from '../context/AuthContext';

export default function Expenses() {
  const { currentUser } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId') || 1; // Default to Goa Trip (ID 1)
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState([]);

  // Form state
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('General');

  const fetchExpenses = () => {
    fetch(`http://localhost:5000/api/expenses?group_id=${groupId}`)
      .then(res => res.json())
      .then(data => setExpenses(data));
  };

  useEffect(() => {
    fetchExpenses();
    
    fetch(`http://localhost:5000/api/groups/${groupId}/members`)
      .then(res => res.json())
      .then(data => setMembers(data));

    const unsubscribe = subscribeToEvents((msg) => {
      if (msg.event === 'expense:added') {
        setExpenses(prev => [msg.data, ...prev]);
      }
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!desc || !amount) return;

    // Equal split for demo
    const splitAmount = parseFloat(amount) / members.length;
    const splits = members.map(m => ({ user_id: m.id, share_amount: splitAmount }));

    fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group_id: groupId,
        paid_by: currentUser.id,
        amount: parseFloat(amount),
        category: cat,
        description: desc,
        splits
      })
    }).then(() => {
      setIsModalOpen(false);
      setDesc(''); setAmount('');
    });
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1>Expenses</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Expense</button>
      </div>

      <div className="card">
        {expenses.length === 0 ? <p>No expenses yet.</p> : (
          <ul style={{ listStyle: 'none' }}>
            {expenses.map(exp => (
              <li key={exp.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{exp.description}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {exp.category} • Paid by {exp.paid_by_name} on {new Date(exp.date).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>₹{exp.amount}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {exp.splits.length} splits
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add Expense</h2>
            <form onSubmit={handleAdd}>
              <input type="text" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} required style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
              <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
              <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <option>Travel</option><option>Food</option><option>Transport</option><option>General</option>
              </select>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
