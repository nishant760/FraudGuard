import { useMemo, useState } from 'react';
import { useStream, CUSTOMER_ACCOUNTS, DEST_LABELS } from '../context/StreamContext';
import { useAuth } from '../context/AuthContext';
import KineticTitle from '../components/ui/KineticTitle';
import RiskBadge from '../components/ui/RiskBadge';
import { Search } from 'lucide-react';
import type { StreamTransaction } from '../types';

function resolveDestName(id: string) {
  return DEST_LABELS[id] ?? CUSTOMER_ACCOUNTS[id]?.name ?? id;
}

const TYPE_LABELS: Record<string, string> = {
  TRANSFER:  'Wire Transfer',
  CASH_OUT:  'Cash Withdrawal',
  PAYMENT:   'Merchant Payment',
  CASH_IN:   'Cash Deposit',
  DEBIT:     'Direct Debit',
};

function statusBadge(t: StreamTransaction) {
  const s = t.auth_status;
  if (s === 'AUTO_APPROVED')
    return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(16,185,129,.12)', color: '#10b981', fontWeight: 700 }}>Completed</span>;
  if (s === 'APPROVED_2FA')
    return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(16,185,129,.12)', color: '#10b981', fontWeight: 700 }}>Verified</span>;
  if (s === 'ABORTED')
    return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(239,68,68,.12)', color: '#ef4444', fontWeight: 700 }}>Declined</span>;
  if (s === 'PENDING_2FA')
    return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(245,158,11,.12)', color: '#f59e0b', fontWeight: 700 }}>Pending OTP</span>;
  return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontWeight: 600 }}>Processing</span>;
}

export default function ConsumerTransactions() {
  const { user } = useAuth();
  const { transactions, runningBalances } = useStream();
  const [search, setSearch] = useState('');

  const accountId = user?.accountId ?? '';
  const profile = CUSTOMER_ACCOUNTS[accountId];

  // Only show this consumer's own transactions
  const myTxns = useMemo(() => {
    return transactions.filter((t) => t.nameOrig === accountId);
  }, [transactions, accountId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return myTxns;
    const q = search.toLowerCase();
    return myTxns.filter(
      (t) =>
        t.txn_id.toLowerCase().includes(q) ||
        resolveDestName(t.nameDest).toLowerCase().includes(q) ||
        (TYPE_LABELS[t.type] ?? t.type).toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
    );
  }, [myTxns, search]);

  return (
    <div className="page-content">
      <KineticTitle
        title="My Transaction Activity"
        subtitle={`Personal transaction history for account ${accountId}`}
      />

      {/* Account summary strip */}
      {profile && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '12px 18px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-subtle)', border: '1px solid var(--border-base)',
          marginBottom: 20,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #4338ca)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0,
          }}>
            {profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{profile.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Account {accountId} · {profile.card_network} {profile.card_type === 'credit' ? 'Credit' : 'Debit'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.04em' }}>Available Balance</div>
            {(() => {
              const liveBalance = runningBalances[accountId] ?? profile?.balance ?? 0;
              const isNegative = liveBalance < 0;
              return (
                <div style={{ fontSize: 20, fontWeight: 800, color: isNegative ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>
                  {isNegative ? '-' : ''}${Math.abs(liveBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Transaction Statement</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {myTxns.length} transaction{myTxns.length !== 1 ? 's' : ''} recorded in this session
            </div>
          </div>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search recipient, type, amount…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34, fontSize: 12, height: 36 }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              {myTxns.length === 0 ? 'No transactions yet.' : 'No results match your search.'}
            </div>
            <div style={{ fontSize: 12 }}>
              {myTxns.length === 0
                ? 'Your transactions will appear here as the live stream processes them.'
                : 'Try a different search term.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-base)', color: 'var(--text-muted)', textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  <th style={{ padding: '10px 12px' }}>Ref ID</th>
                  <th style={{ padding: '10px 12px' }}>Recipient</th>
                  <th style={{ padding: '10px 12px' }}>Type</th>
                  <th style={{ padding: '10px 12px' }}>Card Used</th>
                  <th style={{ padding: '10px 12px' }}>Risk</th>
                  <th style={{ padding: '10px 12px' }}>Time</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((t) => {
                  const cardLabel = `${t.card_network ?? profile?.card_network ?? '—'} ${t.card_type === 'credit' ? 'Credit' : 'Debit'}`;
                  const time = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={t.txn_id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background .12s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '11px 12px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {t.txn_id}
                      </td>
                      <td style={{ padding: '11px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {resolveDestName(t.nameDest)}
                      </td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: 4, background: 'var(--bg-subtle)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {TYPE_LABELS[t.type] ?? t.type}
                        </span>
                      </td>
                      <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{cardLabel}</td>
                      <td style={{ padding: '11px 12px' }}>
                        <RiskBadge level={t.risk_level} score={t.risk_score} />
                      </td>
                      <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{time}</td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        −${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                        {statusBadge(t)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
