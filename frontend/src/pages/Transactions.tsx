import { useEffect, useState, useMemo } from 'react';
import { getTransactions } from '../api/fraud';
import type { TransactionHistoryItem, RiskLevel } from '../types';
import RiskBadge from '../components/ui/RiskBadge';
import GlowingCard from '../components/ui/GlowingCard';
import KineticTitle from '../components/ui/KineticTitle';
import {
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const PRODUCT_LABELS: Record<string, string> = {
  W: 'Web / Digital Products',
  H: 'Home / Physical Goods',
  C: 'Cash / ATM Withdrawal',
  S: 'Services',
  R: 'Retail / In-Store',
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [predFilter, setPredFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination & Sorting
  const [page, setPage] = useState<number>(1);
  const [sortField, setSortField] = useState<keyof TransactionHistoryItem>('created_at');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Fetch Transactions
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 20000);
    return () => clearInterval(interval);
  }, []);

  // Filtered & Sorted Data
  const filteredData = useMemo(() => {
    return transactions.filter((t) => {
      if (riskFilter !== 'ALL' && t.risk_level.toUpperCase() !== riskFilter.toUpperCase()) {
        return false;
      }
      if (predFilter !== 'ALL' && t.prediction.toString() !== predFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = t.transaction_id.toLowerCase().includes(query);
        const matchesCard = t.card4?.toLowerCase().includes(query);
        const productLabel = PRODUCT_LABELS[t.ProductCD || ''] || t.ProductCD || '';
        const matchesProduct = t.ProductCD?.toLowerCase().includes(query) || productLabel.toLowerCase().includes(query);
        return matchesId || matchesCard || matchesProduct;
      }
      return true;
    });
  }, [transactions, riskFilter, predFilter, searchQuery]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedData, page]);

  const handleSort = (field: keyof TransactionHistoryItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
        ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page-content">
      <KineticTitle
        title="Transaction History"
        subtitle="Audit log of evaluated transactions, risk scores, and model classifications."
        rightElement={
          <button
            onClick={fetchTransactions}
            className="btn btn-outline btn-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Transactions
          </button>
        }
      />

      {/* Filter Toolbar */}
      <GlowingCard
        className="mb-6"
        fromColor="rgba(99, 102, 241, 0.3)"
        viaColor="rgba(147, 197, 253, 0.2)"
        toColor="rgba(99, 102, 241, 0.3)"
        borderRadius="var(--radius-lg)"
      >
        <div className="card card-sm" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 36, width: '100%', height: 36, fontSize: 13 }}
                placeholder="Search by TX ID, Card, Product..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>

            {/* Risk Level Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} color="var(--text-muted)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Risk:</span>
              <select
                className="form-select"
                value={riskFilter}
                onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>
            </div>

            {/* Verdict Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Verdict:</span>
              <select
                className="form-select"
                value={predFilter}
                onChange={(e) => { setPredFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">All Verdicts</option>
                <option value="0">Legitimate (0)</option>
                <option value="1">Fraudulent (1)</option>
              </select>
            </div>
          </div>
        </div>
      </GlowingCard>

      {/* Error state */}
      {error && (
        <div className="error-alert mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <GlowingCard
        fromColor="rgba(99, 102, 241, 0.35)"
        viaColor="rgba(168, 85, 247, 0.2)"
        toColor="rgba(59, 130, 246, 0.35)"
        borderRadius="var(--radius-lg)"
      >
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', background: 'transparent', boxShadow: 'none' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('transaction_id')}>
                  TX ID {sortField === 'transaction_id' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('transaction_amount')}>
                  Amount {sortField === 'transaction_amount' && (sortAsc ? '↑' : '↓')}
                </th>
                <th>Product</th>
                <th>Card Network</th>
                <th>Card Type</th>
                <th className="sortable" onClick={() => handleSort('risk_score')}>
                  Risk Score {sortField === 'risk_score' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('risk_level')}>
                  Risk Level {sortField === 'risk_level' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('prediction')}>
                  Classification {sortField === 'prediction' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('created_at')}>
                  Timestamp {sortField === 'created_at' && (sortAsc ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state" style={{ padding: '60px 20px' }}>
                      <div className="loading-spinner dark" style={{ margin: '0 auto 16px' }} />
                      <div className="empty-state-title">Loading transaction feed...</div>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <Database className="empty-state-icon" />
                      <div className="empty-state-title">No transactions found</div>
                      <div className="empty-state-sub">
                        {transactions.length === 0
                          ? 'Run your first evaluation in the Transaction Assessment tab to populate audit records.'
                          : 'No transactions match the selected filters.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((tx) => {
                  const isFraud = tx.prediction === 1;
                  return (
                    <tr key={tx.transaction_id}>
                      <td className="td-mono" style={{ fontWeight: 600 }}>
                        {tx.transaction_id.slice(0, 8)}...
                      </td>
                      <td className="td-amount">
                        ${tx.transaction_amount.toFixed(2)}
                      </td>
                      <td>
                        <span
                          style={{
                            background: 'var(--bg-subtle)',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                          }}
                          title={`Dataset Code: ${tx.ProductCD || 'W'}`}
                        >
                          {PRODUCT_LABELS[tx.ProductCD || ''] || tx.ProductCD || 'Web / Digital Products'}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {tx.card4 || 'visa'}
                      </td>
                      <td style={{ textTransform: 'capitalize', color: 'var(--text-tertiary)' }}>
                        {tx.card6 || 'debit'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {tx.risk_score}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/100</span>
                        </div>
                      </td>
                      <td>
                        <RiskBadge level={tx.risk_level as RiskLevel} size="sm" />
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: isFraud ? 'var(--risk-high-text)' : 'var(--risk-low-text)',
                        }}>
                          {isFraud ? <ShieldAlert size={14} color="var(--risk-high-accent)" /> : <ShieldCheck size={14} color="var(--risk-low-accent)" />}
                          {isFraud ? 'Fraud' : 'Legit'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(tx.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {sortedData.length > 0 && (
          <div className="pagination" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-base)' }}>
            <div className="pagination-info">
              Showing <strong>{(page - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong>{Math.min(page * ITEMS_PER_PAGE, sortedData.length)}</strong> of <strong>{sortedData.length}</strong> transactions
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 3),
                Math.min(totalPages, page + 2)
              ).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                  
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        </div>
      </GlowingCard>
    </div>
  );
}
