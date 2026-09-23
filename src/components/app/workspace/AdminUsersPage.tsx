'use client';

/**
 * Admin Users Page Component for Workspace
 * Admin-only page for user management
 * Only accessible by: urisocialingsight@gmail.com
 */

import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';
import {
  AdminService,
  AdminUser,
  AdminUserDetails,
  AdminStats,
  AccessCode,
  AccessCodeRedemption,
} from '@/src/api/AdminService';
import { useRouter } from 'next/navigation';
import ConfirmDialog from './ConfirmDialog';

// Icon components
const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    users: (
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </>
    ),
    filter: (
      <>
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </>
    ),
    refresh: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
      </>
    ),
    eye: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    trending: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    loader: (
      <>
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
      </>
    ),
    more: (
      <>
        <circle cx="12" cy="5" r="1.6" fill={c} stroke="none" />
        <circle cx="12" cy="12" r="1.6" fill={c} stroke="none" />
        <circle cx="12" cy="19" r="1.6" fill={c} stroke="none" />
      </>
    ),
    ban: (
      <>
        <circle cx="12" cy="12" r="9" />
        <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
      </>
    ),
    trash: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </>
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="2 7 12 13 22 7" />
      </>
    ),
    ticket: (
      <>
        <path d="M3 9a2 2 0 100 6" />
        <path d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 100 6v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2" />
        <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2 2" />
      </>
    ),
  };
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {paths[n]}
    </svg>
  );
};

// Badge component
const Bd = ({
  children,
  v = 'default',
}: {
  children: React.ReactNode;
  v?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) => {
  const styles = {
    default: { bg: 'rgba(194,24,91,.08)', c: '#AD1457', b: 'rgba(194,24,91,.15)' },
    success: { bg: 'rgba(76,175,80,.08)', c: '#2e7d32', b: 'rgba(76,175,80,.15)' },
    warning: { bg: 'rgba(255,193,7,.1)', c: '#f57f17', b: 'rgba(255,193,7,.2)' },
    danger: { bg: 'rgba(220,38,38,.08)', c: '#dc2626', b: 'rgba(220,38,38,.15)' },
    info: { bg: 'rgba(33,150,243,.08)', c: '#1565c0', b: 'rgba(33,150,243,.15)' },
  };
  const s = styles[v];
  return (
    <span
      style={{
        background: s.bg,
        color: s.c,
        border: `1px solid ${s.b}`,
        padding: '3px 9px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
};

interface AdminUsersPageProps {
  onBack: () => void;
}

export default function AdminUsersPage({ onBack }: AdminUsersPageProps) {
  const { isAdminUser, isAdminStatusPending } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'stats' | 'all-users' | 'recent' | 'access-codes'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortBy, setSortBy] = useState<'createdAt' | 'email' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [recentDays, setRecentDays] = useState(7);

  useEffect(() => {
    // Wait for the backend-verified admin check to resolve before redirecting —
    // isAdminUser defaults to false while it's in flight, and redirecting on
    // that transient false would kick out a real admin on every page refresh.
    if (!isAdminStatusPending && !isAdminUser) {
      router.push('/workspace/');
    }
  }, [isAdminUser, isAdminStatusPending, router]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load users when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'all-users') {
      loadUsers();
    } else if (activeTab === 'recent') {
      loadRecentUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, searchTerm, sortBy, sortOrder, recentDays]);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AdminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const data = await AdminService.getAllUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setUsers(data.users);
      setTotalPages(data.pagination.total_pages);
      setTotalUsers(data.pagination.total);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  const loadRecentUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const data = await AdminService.getRecentUsers(recentDays);
      setRecentUsers(data.users);
    } catch (error) {
      console.error('Failed to load recent users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [recentDays]);

  const handleViewUser = async (userId: string) => {
    try {
      const details = await AdminService.getUserDetails(userId);
      setSelectedUser(details);
    } catch (error) {
      console.error('Failed to load user details:', error);
    }
  };

  // Patches the modal's user AND the underlying list row so both stay in sync
  // with a credit/trial adjustment, rather than only updating local optimistic
  // state that a fresh getUserDetails() call would then contradict.
  const handleUserUpdated = (userId: string, updates: Partial<AdminUser>) => {
    setSelectedUser((prev) => (prev && prev.id === userId ? { ...prev, ...updates } : prev));
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
    setRecentUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
  };

  const handleExportEmails = async () => {
    try {
      const emails = await AdminService.exportEmails();
      const emailList = emails.map((e) => e.email).join('\n');
      const blob = new Blob([emailList], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_emails_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export emails:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isAdminStatusPending || !isAdminUser) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#fafafa',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 32px',
          borderBottom: '1px solid rgba(0,0,0,.08)',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onBack}
            style={{
              background: 'white',
              border: '1px solid rgba(0,0,0,.08)',
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all .2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.borderColor = '#AD1457';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,.08)';
            }}
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#1a1a1a' }}>User Management</h1>
            <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>Admin Dashboard</p>
          </div>
        </div>
        <button
          onClick={handleExportEmails}
          style={{
            background: 'linear-gradient(135deg, #C21A5B 0%, #E91E63 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all .2s',
            boxShadow: '0 2px 8px rgba(194,24,91,.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(194,24,91,.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(194,24,91,.2)';
          }}
        >
          <I n="download" s={16} c="white" />
          Export Emails
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          padding: '0 32px',
          background: 'white',
          borderBottom: '1px solid rgba(0,0,0,.08)',
          display: 'flex',
          gap: 4,
          flexShrink: 0,
        }}
      >
        {(['stats', 'all-users', 'recent', 'access-codes'] as const).map((tab) => {
          const labels = {
            stats: 'Overview',
            'all-users': 'All Users',
            recent: 'Recent Signups',
            'access-codes': 'Access Codes',
          };
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              style={{
                background: active ? 'rgba(194,24,91,.06)' : 'transparent',
                color: active ? '#AD1457' : '#666',
                border: 'none',
                borderBottom: active ? '2px solid #AD1457' : '2px solid transparent',
                padding: '14px 20px',
                fontSize: 13,
                fontWeight: active ? 700 : 600,
                cursor: 'pointer',
                transition: 'all .2s',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(0,0,0,.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {loading && activeTab === 'stats' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <I n="loader" s={24} c="#AD1457" />
          </div>
        ) : null}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && !loading && (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 20,
                marginBottom: 32,
              }}
            >
              <StatCard icon="users" title="Total Users" value={stats.total_users.toLocaleString()} variant="default" />
              <StatCard
                icon="trending"
                title="New Users (7 days)"
                value={stats.new_users_7d.toLocaleString()}
                variant="success"
              />
              <StatCard
                icon="calendar"
                title="New Users (30 days)"
                value={stats.new_users_30d.toLocaleString()}
                variant="info"
              />
              <StatCard
                icon="chart"
                title="Total Content"
                value={stats.total_content.toLocaleString()}
                variant="default"
              />
            </div>

            {/* Subscription Stats */}
            <div
              style={{
                background: 'white',
                border: '1px solid rgba(0,0,0,.08)',
                borderRadius: 12,
                padding: 24,
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1a1a1a' }}>
                Subscription Tiers
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                {Object.entries(stats.subscription_stats).map(([tier, count]) => (
                  <div
                    key={tier}
                    style={{
                      padding: 16,
                      background: 'rgba(194,24,91,.04)',
                      border: '1px solid rgba(194,24,91,.1)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#AD1457', marginBottom: 4 }}>{count}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'capitalize' }}>
                      {tier}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              <div
                style={{
                  background: 'white',
                  border: '1px solid rgba(0,0,0,.08)',
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <I n="users" s={20} c="#AD1457" />
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Brand Profiles</h4>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#AD1457' }}>
                  {stats.total_brands.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  background: 'white',
                  border: '1px solid rgba(0,0,0,.08)',
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <I n="users" s={20} c="#AD1457" />
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Workspaces</h4>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#AD1457' }}>
                  {stats.total_workspaces.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Users Tab */}
        {activeTab === 'all-users' && (
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {/* Search and Filters */}
            <div style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ position: 'relative' }}>
                  <I n="search" s={18} c="#999" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 10px 10px 40px',
                      border: '1px solid rgba(0,0,0,.08)',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <I n="search" s={16} c="#999" />
                  </div>
                </div>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'email' | 'name')}
                style={{
                  padding: '10px 16px',
                  border: '1px solid rgba(0,0,0,.08)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <option value="createdAt">Sort by Date</option>
                <option value="email">Sort by Email</option>
                <option value="name">Sort by Name</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                style={{
                  padding: '10px 16px',
                  border: '1px solid rgba(0,0,0,.08)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
              <button
                onClick={loadUsers}
                disabled={loadingUsers}
                style={{
                  padding: '10px 20px',
                  border: '1px solid rgba(0,0,0,.08)',
                  borderRadius: 8,
                  background: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <I n="refresh" s={16} c={loadingUsers ? '#999' : '#AD1457'} />
                Refresh
              </button>
            </div>

            {/* Users Table */}
            <UserTable users={users} loading={loadingUsers} onViewUser={handleViewUser} formatDate={formatDate} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid rgba(0,0,0,.08)',
                    borderRadius: 8,
                    background: 'white',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }}
                >
                  Previous
                </button>
                <div style={{ padding: '8px 16px', fontSize: 13, color: '#666' }}>
                  Page {currentPage} of {totalPages} ({totalUsers} total)
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid rgba(0,0,0,.08)',
                    borderRadius: 8,
                    background: 'white',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: currentPage === totalPages ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recent Users Tab */}
        {activeTab === 'recent' && (
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>Show users from last:</span>
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setRecentDays(days)}
                  style={{
                    padding: '8px 16px',
                    border: recentDays === days ? '2px solid #AD1457' : '1px solid rgba(0,0,0,.08)',
                    borderRadius: 8,
                    background: recentDays === days ? 'rgba(194,24,91,.06)' : 'white',
                    color: recentDays === days ? '#AD1457' : '#666',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: recentDays === days ? 700 : 600,
                  }}
                >
                  {days} days
                </button>
              ))}
            </div>

            <UserTable users={recentUsers} loading={loadingUsers} onViewUser={handleViewUser} formatDate={formatDate} />
          </div>
        )}

        {/* Access Codes Tab */}
        {activeTab === 'access-codes' && (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <AccessCodesPanel />
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          formatDate={formatDate}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
}

// Known subscription_tiers.tier_id values (SubscriptionService.py's
// initialize_default_tiers) — hardcoded here rather than fetched, since
// this list changes rarely and a fetch would need its own loading state
// for a 5-item dropdown.
const PLAN_TIER_OPTIONS = [
  { id: 'starter', label: 'Starter' },
  { id: 'growth', label: 'Growth' },
  { id: 'pro', label: 'Pro' },
  { id: 'agency', label: 'Agency' },
];

// Splits a pasted/typed list of emails (one per line, or comma-separated —
// so a column pasted straight out of a spreadsheet just works) into a
// deduped, normalized array. Shared by the create form and the roster
// reassign editor.
function parseEmailList(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[,\n]/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

// Access Codes Tab — admin-generated partner/comp codes (e.g. "ASA26").
// Generic and reusable: create a code for any plan/duration, hand it to
// anybody, each redeemer gets their own access window from their own
// redemption date. See app/routers/admin_router.py + billing_router.py.
function AccessCodesPanel() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [detailCode, setDetailCode] = useState<AccessCode | null>(null);
  const [redemptions, setRedemptions] = useState<AccessCodeRedemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [restoringUserId, setRestoringUserId] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<AccessCode | null>(null);

  const [code, setCode] = useState('');
  const [planTierId, setPlanTierId] = useState('starter');
  const [durationDays, setDurationDays] = useState('60');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [label, setLabel] = useState('');
  const [assignedEmailsText, setAssignedEmailsText] = useState('');
  const [sendEmailOnCreate, setSendEmailOnCreate] = useState(true);
  const [resendingCode, setResendingCode] = useState<string | null>(null);

  // Inline reassign/unassign editor — which code row (if any) has its
  // roster open for editing, and the draft value being typed (one email
  // per line or comma-separated, so pasting a spreadsheet column works).
  const [reassigningCode, setReassigningCode] = useState<string | null>(null);
  const [reassignDraft, setReassignDraft] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await AdminService.listAccessCodes();
      setCodes(res.codes);
    } catch (error) {
      console.error('Failed to load access codes:', error);
      setMessage({ type: 'err', text: 'Failed to load access codes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setMessage(null);
    try {
      const assignedEmails = parseEmailList(assignedEmailsText);
      const created = await AdminService.createAccessCode({
        code: code.trim() || undefined,
        plan_tier_id: planTierId,
        duration_days: parseInt(durationDays, 10) || 60,
        max_redemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : undefined,
        label: label.trim() || undefined,
        assigned_emails: assignedEmails.length ? assignedEmails : undefined,
        send_email: sendEmailOnCreate,
      });
      setMessage({
        type: 'ok',
        text: assignedEmails.length
          ? `Created code "${created.code}" — reserved for ${assignedEmails.length} ${
              assignedEmails.length === 1 ? 'person' : 'people'
            }.` +
            (sendEmailOnCreate
              ? ` Emailed to ${created.emails_sent ?? 0} of them.`
              : ' (Not emailed — you can send it from the table below.)')
          : `Created code "${created.code}".`,
      });
      setCode('');
      setLabel('');
      setMaxRedemptions('');
      setAssignedEmailsText('');
      await loadCodes();
    } catch (error: unknown) {
      const detail =
        (error as { data?: { detail?: string }; response?: { data?: { detail?: string } } })?.data?.detail ??
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      console.error('Failed to create access code:', error);
      setMessage({ type: 'err', text: detail || 'Failed to create access code.' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (target: AccessCode) => {
    setMessage(null);
    try {
      const updated = await AdminService.updateAccessCode(target.code, { is_active: !target.is_active });
      if (!updated.is_active && (updated.revoked_active_users ?? 0) > 0) {
        setMessage({
          type: 'ok',
          text: `Revoked "${target.code}" — immediately cut off ${updated.revoked_active_users} ${
            updated.revoked_active_users === 1 ? 'person who was' : 'people who were'
          } currently using it.`,
        });
      }
      await loadCodes();
    } catch (error) {
      console.error('Failed to update access code:', error);
      setMessage({ type: 'err', text: 'Failed to update code.' });
    }
  };

  const handleResendEmail = async (target: AccessCode, email?: string) => {
    setResendingCode(target.code + (email || ''));
    setMessage(null);
    try {
      const res = await AdminService.sendAccessCodeEmail(target.code, email);
      setMessage({
        type: 'ok',
        text:
          res.to.length === 1
            ? `Emailed "${target.code}" to ${res.to[0]}.`
            : `Emailed "${target.code}" to ${res.to.length} people.`,
      });
    } catch (error: unknown) {
      const detail =
        (error as { data?: { detail?: string }; response?: { data?: { detail?: string } } })?.data?.detail ??
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      console.error('Failed to send access code email:', error);
      setMessage({ type: 'err', text: detail || 'Failed to send email.' });
    } finally {
      setResendingCode(null);
    }
  };

  const openReassign = (target: AccessCode) => {
    setReassigningCode(target.code);
    setReassignDraft(target.assigned_emails.join('\n'));
  };

  const handleSaveReassign = async (codeStr: string) => {
    setReassigning(true);
    try {
      // An empty draft clears the roster back to a shared/open code
      // (backend treats [] as "unassign", distinct from omitting the
      // field, which would leave the roster untouched).
      await AdminService.updateAccessCode(codeStr, { assigned_emails: parseEmailList(reassignDraft) });
      setReassigningCode(null);
      await loadCodes();
    } catch (error) {
      console.error('Failed to reassign access code:', error);
      setMessage({ type: 'err', text: 'Failed to update assignment.' });
    } finally {
      setReassigning(false);
    }
  };

  const loadRedemptions = async (codeStr: string) => {
    setLoadingRedemptions(true);
    try {
      const res = await AdminService.listAccessCodeRedemptions(codeStr);
      setRedemptions(res.redemptions);
    } catch (error) {
      console.error('Failed to load redemptions:', error);
      setMessage({ type: 'err', text: 'Failed to load redemptions.' });
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const handleOpenDetail = async (target: AccessCode) => {
    setDetailCode(target);
    setRedemptions([]);
    await loadRedemptions(target.code);
  };

  const handleRestore = async (codeStr: string, userId: string) => {
    setRestoringUserId(userId);
    setMessage(null);
    try {
      await AdminService.restoreAccessCodeRedemption(codeStr, userId);
      setMessage({ type: 'ok', text: `Restored access for this person.` });
      await loadRedemptions(codeStr);
    } catch (error: unknown) {
      const detail =
        (error as { data?: { detail?: string }; response?: { data?: { detail?: string } } })?.data?.detail ??
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      console.error('Failed to restore access:', error);
      setMessage({ type: 'err', text: detail || 'Failed to restore access.' });
    } finally {
      setRestoringUserId(null);
    }
  };

  const handleRevoke = async (codeStr: string, userId: string) => {
    setRevokingUserId(userId);
    setMessage(null);
    try {
      await AdminService.revokeAccessCodeRedemption(codeStr, userId);
      setMessage({ type: 'ok', text: `Revoked this person's access — the code stays active for everyone else.` });
      await loadRedemptions(codeStr);
    } catch (error: unknown) {
      const detail =
        (error as { data?: { detail?: string }; response?: { data?: { detail?: string } } })?.data?.detail ??
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      console.error('Failed to revoke access:', error);
      setMessage({ type: 'err', text: detail || 'Failed to revoke access.' });
    } finally {
      setRevokingUserId(null);
    }
  };

  const handleDelete = (target: AccessCode) => {
    setDeleteConfirmTarget(target);
  };

  const performDelete = async (target: AccessCode) => {
    setDeletingCode(target.code);
    setMessage(null);
    try {
      const res = await AdminService.deleteAccessCode(target.code);
      setMessage({
        type: 'ok',
        text:
          res.revoked_active_users > 0
            ? `Deleted "${target.code}" — also cut off ${res.revoked_active_users} ${
                res.revoked_active_users === 1 ? 'person who was' : 'people who were'
              } currently using it.`
            : `Deleted "${target.code}".`,
      });
      if (detailCode?.code === target.code) setDetailCode(null);
      await loadCodes();
    } catch (error: unknown) {
      const detail =
        (error as { data?: { detail?: string }; response?: { data?: { detail?: string } } })?.data?.detail ??
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      console.error('Failed to delete access code:', error);
      setMessage({ type: 'err', text: detail || 'Failed to delete code.' });
    } finally {
      setDeletingCode(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px',
    borderRadius: 8,
    border: '1.5px solid rgba(0,0,0,.1)',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div>
      <div
        style={{
          background: 'white',
          border: '1px solid rgba(0,0,0,.08)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Create a new code</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
          Whoever redeems a code gets the chosen plan free for the given number of days, starting from their own
          redemption date — not a shared expiry for everyone who uses the code. Leave "Assign to" blank for a shared
          code anyone can redeem, or set it to reserve this code for one specific person — only that email will be able
          to redeem it, and you'll see it's theirs immediately below, before they ever act.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4 }}>Code (optional)</div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Auto-generate"
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4 }}>Plan</div>
            <select
              value={planTierId}
              onChange={(e) => setPlanTierId(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            >
              {PLAN_TIER_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4 }}>Duration (days)</div>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4 }}>Max redemptions</div>
            <input
              type="number"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Unlimited"
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4 }}>
              Assign to (emails, optional)
            </div>
            <textarea
              value={assignedEmailsText}
              onChange={(e) => setAssignedEmailsText(e.target.value)}
              placeholder="Leave blank for a shared code anyone can redeem. Otherwise paste one email per line (or comma-separated) — only these accounts will be able to redeem it."
              rows={assignedEmailsText.trim() ? 3 : 1}
              style={{
                ...inputStyle,
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4 }}>
              Label (e.g. partnership name)
            </div>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Africa SME Assembly partnership"
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        {(() => {
          const parsed = parseEmailList(assignedEmailsText);
          if (!parsed.length) return null;
          return (
            <>
              <div style={{ marginTop: 8, fontSize: 11.5, color: '#888' }}>
                Only these <strong>{parsed.length}</strong> {parsed.length === 1 ? 'account' : 'accounts'} will be able
                to redeem this code: {parsed.join(', ')}
              </div>
              <label
                style={{
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 12.5,
                  color: '#444',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={sendEmailOnCreate}
                  onChange={(e) => setSendEmailOnCreate(e.target.checked)}
                />
                Email the code to {parsed.length === 1 ? 'them' : `all ${parsed.length} of them`} right away
              </label>
            </>
          );
        })()}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#AD1457',
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.7 : 1,
            }}
          >
            {creating ? 'Creating…' : 'Create code'}
          </button>
          {message && (
            <span style={{ fontSize: 12, fontWeight: 600, color: message.type === 'ok' ? '#2E7D32' : '#C62828' }}>
              {message.text}
            </span>
          )}
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 13 }}>Loading…</div>
        ) : codes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 13 }}>No access codes yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,.02)', textAlign: 'left' }}>
                {['Code', 'Plan', 'Duration', 'Redemptions', 'Assigned to', 'Code status', 'Label', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#888' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <Fragment key={c.code}>
                  <tr style={{ borderTop: '1px solid rgba(0,0,0,.06)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace' }}>{c.code}</td>
                    <td style={{ padding: '12px 16px' }}>{c.plan_tier_id}</td>
                    <td style={{ padding: '12px 16px' }}>{c.duration_days}d</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleOpenDetail(c)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#AD1457',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: 13,
                          textDecoration: 'underline',
                        }}
                      >
                        {c.redemption_count}
                        {c.max_redemptions ? ` / ${c.max_redemptions}` : ''}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {reassigningCode === c.code ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <textarea
                            autoFocus
                            value={reassignDraft}
                            onChange={(e) => setReassignDraft(e.target.value)}
                            placeholder="Anyone (shared) — one email per line"
                            rows={3}
                            style={{
                              ...inputStyle,
                              padding: '5px 8px',
                              fontSize: 12,
                              width: 170,
                              resize: 'vertical',
                              fontFamily: 'inherit',
                            }}
                          />
                          <button
                            onClick={() => handleSaveReassign(c.code)}
                            disabled={reassigning}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2E7D32',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 16,
                            }}
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setReassigningCode(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#999',
                              cursor: 'pointer',
                              fontSize: 14,
                            }}
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : c.assigned_emails.length > 0 ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {c.assigned_emails.length === 1
                              ? c.assigned_emails[0]
                              : `${c.assigned_emails.length} people`}
                          </div>
                          <div
                            style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}
                          >
                            <span
                              style={{
                                padding: '1px 8px',
                                borderRadius: 20,
                                fontSize: 10,
                                fontWeight: 700,
                                background:
                                  c.status === 'fully_redeemed'
                                    ? 'rgba(46,125,50,.1)'
                                    : c.status === 'partially_redeemed'
                                      ? 'rgba(2,119,189,.1)'
                                      : 'rgba(255,152,0,.12)',
                                color:
                                  c.status === 'fully_redeemed'
                                    ? '#2E7D32'
                                    : c.status === 'partially_redeemed'
                                      ? '#0277BD'
                                      : '#B26A00',
                              }}
                            >
                              {c.status === 'fully_redeemed'
                                ? 'All redeemed'
                                : c.status === 'partially_redeemed'
                                  ? `${c.redeemed_count ?? 0}/${c.assigned_count ?? c.assigned_emails.length} redeemed`
                                  : 'Pending'}
                            </span>
                            <button
                              onClick={() => openReassign(c)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#AD1457',
                                cursor: 'pointer',
                                fontSize: 11,
                              }}
                            >
                              Edit roster
                            </button>
                            <button
                              onClick={() => handleResendEmail(c)}
                              disabled={resendingCode === c.code}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: resendingCode === c.code ? '#999' : '#AD1457',
                                cursor: resendingCode === c.code ? 'not-allowed' : 'pointer',
                                fontSize: 11,
                              }}
                            >
                              {resendingCode === c.code ? 'Sending…' : 'Email code'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span style={{ color: '#999' }}>Anyone (shared)</span>{' '}
                          <button
                            onClick={() => openReassign(c)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#AD1457',
                              cursor: 'pointer',
                              fontSize: 11,
                            }}
                          >
                            Assign
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          background: c.is_active ? 'rgba(46,125,50,.1)' : 'rgba(198,40,40,.08)',
                          color: c.is_active ? '#2E7D32' : '#C62828',
                        }}
                      >
                        {c.is_active ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#666' }}>{c.label || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <AccessCodeActionsMenu
                        target={c}
                        onViewDetails={() => handleOpenDetail(c)}
                        onToggleActive={() => handleToggleActive(c)}
                        onDelete={() => handleDelete(c)}
                        onEmail={c.assigned_emails.length > 0 ? () => handleResendEmail(c) : undefined}
                        deleting={deletingCode === c.code}
                        emailing={resendingCode === c.code}
                      />
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AccessCodeDetailPanel
        accessCode={detailCode}
        redemptions={redemptions}
        loading={loadingRedemptions}
        onClose={() => setDetailCode(null)}
        onToggleActive={() => detailCode && handleToggleActive(detailCode)}
        onDelete={() => detailCode && handleDelete(detailCode)}
        onEmail={detailCode && detailCode.assigned_emails.length > 0 ? () => handleResendEmail(detailCode) : undefined}
        onEmailOne={(email) => detailCode && handleResendEmail(detailCode, email)}
        deleting={deletingCode === detailCode?.code}
        emailing={resendingCode === detailCode?.code}
        resendingCode={resendingCode}
        onRestore={(userId) => detailCode && handleRestore(detailCode.code, userId)}
        restoringUserId={restoringUserId}
        onRevoke={(userId) => detailCode && handleRevoke(detailCode.code, userId)}
        revokingUserId={revokingUserId}
      />
      <ConfirmDialog
        isOpen={!!deleteConfirmTarget}
        title="Delete this code?"
        message={
          deleteConfirmTarget
            ? `Permanently delete code "${deleteConfirmTarget.code}"? This can't be undone. Anyone currently redeeming it will lose access immediately — use Revoke instead if you just want to stop it while keeping the record.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="#dc2626"
        onConfirm={() => deleteConfirmTarget && performDelete(deleteConfirmTarget)}
        onCancel={() => setDeleteConfirmTarget(null)}
      />
    </div>
  );
}

function AccessCodeActionsMenu({
  target,
  onViewDetails,
  onToggleActive,
  onDelete,
  onEmail,
  deleting,
  emailing,
}: {
  target: AccessCode;
  onViewDetails?: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onEmail?: () => void;
  deleting?: boolean;
  emailing?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Positioned via `fixed` + a measured rect, not `absolute` relative to
  // this button — an `absolute` menu gets silently clipped by ANY ancestor
  // with `overflow: hidden` (the codes table's rounded-corner wrapper does
  // exactly that for rows near the bottom), cutting off whichever items
  // fall past the edge instead of just showing them.
  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setIsOpen((v) => !v);
  };

  // That `fixed` positioning fixed the table's own clipping, but a row near
  // the bottom of the *viewport* itself (not just the table) still opened a
  // menu that rendered past the bottom of the screen — same symptom, one
  // level up. Once the menu has actually rendered, flip it to sit ABOVE the
  // trigger instead if it doesn't fit below.
  useEffect(() => {
    if (!isOpen || !menuRef.current || !triggerRef.current) return;
    const menuRect = menuRef.current.getBoundingClientRect();
    if (menuRect.bottom > window.innerHeight) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      setMenuPos((prev) => (prev ? { bottom: window.innerHeight - triggerRect.top + 6, right: prev.right } : prev));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  const item = (opts: {
    key: string;
    icon: string;
    iconColor: string;
    label: string;
    color: string;
    disabled?: boolean;
    onClick: () => void;
  }) => (
    <button
      key={opts.key}
      onClick={() => {
        setIsOpen(false);
        opts.onClick();
      }}
      disabled={opts.disabled}
      style={{
        width: '100%',
        padding: '9px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        background: 'none',
        border: 'none',
        cursor: opts.disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        fontWeight: 500,
        color: opts.disabled ? '#bbb' : opts.color,
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => !opts.disabled && (e.currentTarget.style.background = '#f9f9f9')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <I n={opts.icon} s={15} c={opts.disabled ? '#ccc' : opts.iconColor} />
      {opts.label}
    </button>
  );

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        aria-label="Actions"
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          border: '1px solid rgba(0,0,0,.1)',
          background: isOpen ? '#f9f9f9' : '#fff',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <I n="more" s={16} c="#666" />
      </button>

      {isOpen && menuPos && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              ...(menuPos.top !== undefined ? { top: menuPos.top } : { bottom: menuPos.bottom }),
              right: menuPos.right,
              width: 200,
              background: '#fff',
              border: '1px solid #e5e3df',
              borderRadius: 11,
              boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
              zIndex: 1000,
              overflow: 'hidden',
              padding: '6px 0',
            }}
          >
            {onViewDetails &&
              item({
                key: 'details',
                icon: 'eye',
                iconColor: '#666',
                label: 'View details',
                color: '#333',
                onClick: onViewDetails,
              })}
            {item({
              key: 'toggle',
              icon: target.is_active ? 'ban' : 'refresh',
              iconColor: target.is_active ? '#C62828' : '#2E7D32',
              label: target.is_active ? 'Revoke' : 'Reactivate',
              color: target.is_active ? '#C62828' : '#2E7D32',
              onClick: onToggleActive,
            })}
            {onEmail &&
              item({
                key: 'email',
                icon: 'mail',
                iconColor: '#AD1457',
                label: emailing ? 'Sending…' : 'Email code',
                color: '#AD1457',
                disabled: emailing,
                onClick: onEmail,
              })}
            <div style={{ borderTop: '1px solid #f0f0f0', margin: '6px 0' }} />
            {item({
              key: 'delete',
              icon: 'trash',
              iconColor: '#dc2626',
              label: deleting ? 'Deleting…' : 'Delete permanently',
              color: '#dc2626',
              disabled: deleting,
              onClick: onDelete,
            })}
          </div>
        </>
      )}
    </div>
  );
}

const REDEMPTION_STATUS_STYLE: Record<
  NonNullable<AccessCodeRedemption['effective_status']>,
  { label: string; bg: string; fg: string }
> = {
  active: { label: 'Active', bg: 'rgba(46,125,50,.1)', fg: '#2E7D32' },
  revoked: { label: 'Revoked', bg: 'rgba(198,40,40,.1)', fg: '#C62828' },
  lapsed: { label: 'Lapsed', bg: 'rgba(0,0,0,.06)', fg: '#777' },
  superseded: { label: 'Superseded', bg: 'rgba(237,108,2,.1)', fg: '#B26A00' },
  not_redeemed: { label: 'Not redeemed yet', bg: 'rgba(2,119,189,.08)', fg: '#0277BD' },
};

function AccessCodeDetailPanel({
  accessCode,
  redemptions,
  loading,
  onClose,
  onToggleActive,
  onDelete,
  onEmail,
  onEmailOne,
  deleting,
  emailing,
  resendingCode,
  onRestore,
  restoringUserId,
  onRevoke,
  revokingUserId,
}: {
  accessCode: AccessCode | null;
  redemptions: AccessCodeRedemption[];
  loading: boolean;
  onClose: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onEmail?: () => void;
  onEmailOne?: (email: string) => void;
  deleting?: boolean;
  emailing?: boolean;
  resendingCode?: string | null;
  onRestore: (userId: string) => void;
  restoringUserId?: string | null;
  onRevoke: (userId: string) => void;
  revokingUserId?: string | null;
}) {
  // Renders always (even while closed) so the slide-out transition can play
  // on close instead of the panel just vanishing — `open` drives the
  // transform/opacity, `accessCode` (the last one shown) drives content.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (accessCode) {
      const id = requestAnimationFrame(() => setOpen(true));
      return () => cancelAnimationFrame(id);
    }
    setOpen(false);
  }, [accessCode]);

  if (!accessCode) return null;

  const metaCard = (icon: string, label: string, value: React.ReactNode) => (
    <div
      style={{
        background: 'rgba(194,24,91,.045)',
        border: '1px solid rgba(194,24,91,.12)',
        borderRadius: 11,
        padding: '11px 13px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <I n={icon} s={12.5} c="#AD1457" />
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#AD1457',
            textTransform: 'uppercase',
            letterSpacing: '.04em',
          }}
        >
          {label}
        </div>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#222' }}>{value}</div>
    </div>
  );

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.4)',
          opacity: open ? 1 : 0,
          transition: 'opacity 220ms ease',
          zIndex: 1000,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(460px, 100vw)',
          background: '#fff',
          boxShadow: '-8px 0 28px rgba(0,0,0,.18)',
          zIndex: 1001,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ height: 4, background: 'linear-gradient(90deg, #CD1B78 0%, #A01560 100%)', flexShrink: 0 }} />

        <div
          style={{
            padding: '20px 22px',
            borderBottom: '1px solid rgba(0,0,0,.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <I n="ticket" s={20} c="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: '.02em',
                  color: '#1a1a1a',
                  overflowWrap: 'anywhere',
                }}
              >
                {accessCode.code}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{accessCode.label || 'No label'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <AccessCodeActionsMenu
              target={accessCode}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
              onEmail={onEmail}
              deleting={deleting}
              emailing={emailing}
            />
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#999',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <I n="x" s={17} c="#999" />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 700,
                background: accessCode.is_active ? 'rgba(46,125,50,.1)' : 'rgba(198,40,40,.1)',
                color: accessCode.is_active ? '#2E7D32' : '#C62828',
              }}
            >
              {accessCode.is_active ? '● Open to new redemptions' : '● Closed to new redemptions'}
            </span>
            {/* Revoking a code (below) DOES immediately cut off everyone
                currently redeeming it too — that's the one-time side effect
                of the action, not an ongoing state. Reopening it is NOT the
                reverse of that: it only lets NEW people redeem again — it
                does nothing for someone already cut off, which is why a
                person's card below can still say Revoked even once this
                says Open. Use "Restore access" on their card for that. */}
            <div style={{ fontSize: 11, color: '#999', marginTop: 6, lineHeight: 1.5 }}>
              {accessCode.is_active
                ? "New people can redeem this code. If someone was cut off by an earlier revoke, reopening it doesn't bring them back — restore them individually below."
                : 'Nobody new can redeem this code, and everyone currently redeeming it was just cut off too.'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {metaCard('trending', 'Plan', accessCode.plan_tier_id)}
            {metaCard('calendar', 'Duration', `${accessCode.duration_days} days`)}
            {metaCard(
              'users',
              'Redemptions',
              `${accessCode.redemption_count}${accessCode.max_redemptions ? ` / ${accessCode.max_redemptions}` : ' (unlimited)'}`
            )}
            {metaCard(
              'mail',
              'Assigned to',
              accessCode.assigned_emails.length > 0
                ? `${accessCode.assigned_emails.length} ${accessCode.assigned_emails.length === 1 ? 'person' : 'people'}`
                : 'Anyone (shared)'
            )}
          </div>

          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 20 }}>
            Created by <strong style={{ color: '#888' }}>{accessCode.created_by}</strong>
          </div>

          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              marginBottom: 12,
              color: '#333',
              textTransform: 'uppercase',
              letterSpacing: '.03em',
            }}
          >
            Redeemed by ({redemptions.length})
          </div>
          {loading ? (
            <div style={{ color: '#888', fontSize: 12.5 }}>Loading…</div>
          ) : redemptions.length === 0 ? (
            <div
              style={{
                color: '#999',
                fontSize: 12.5,
                textAlign: 'center',
                padding: '28px 12px',
                background: 'rgba(0,0,0,.02)',
                borderRadius: 10,
              }}
            >
              No one has redeemed this code yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {redemptions.map((r) => {
                const identity = r.email || r.user_id || 'Unknown';
                const statusKey = r.effective_status ?? (r.revoked_at ? 'revoked' : 'active');
                const status = REDEMPTION_STATUS_STYLE[statusKey];
                const isResending = !!(r.email && resendingCode === accessCode.code + r.email);
                return (
                  <div
                    key={`${r.code}-${r.user_id}`}
                    style={{
                      border: '1px solid rgba(0,0,0,.08)',
                      borderRadius: 12,
                      padding: 14,
                      display: 'flex',
                      gap: 11,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#880E4F,#C2185B)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {identity[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#222', overflowWrap: 'anywhere' }}>
                          {identity}
                        </div>
                        <span
                          style={{
                            padding: '2px 9px',
                            borderRadius: 20,
                            fontSize: 10.5,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            background: status.bg,
                            color: status.fg,
                          }}
                          title={
                            statusKey === 'superseded'
                              ? "No longer this person's current plan — something else has taken over their wallet since"
                              : undefined
                          }
                        >
                          {status.label}
                        </span>
                      </div>
                      {statusKey === 'not_redeemed' ? (
                        <div style={{ fontSize: 11.5, color: '#888', marginTop: 5 }}>
                          Invited — hasn&apos;t redeemed {accessCode.code} yet
                        </div>
                      ) : (
                        <>
                          {r.redeemed_at && (
                            <div style={{ fontSize: 11.5, color: '#888', marginTop: 5 }}>
                              Redeemed {new Date(r.redeemed_at).toLocaleDateString()}
                            </div>
                          )}
                          {r.access_start && r.access_end && (
                            <div style={{ fontSize: 11.5, color: '#888' }}>
                              Access: {new Date(r.access_start).toLocaleDateString()} →{' '}
                              {new Date(r.access_end).toLocaleDateString()}
                            </div>
                          )}
                        </>
                      )}
                      {statusKey === 'revoked' && r.revocation_reason && (
                        <div style={{ fontSize: 11, color: '#C62828', marginTop: 4 }}>
                          {r.revocation_reason === 'credits_exhausted'
                            ? 'Ran out of credits'
                            : r.revocation_reason === 'admin_revoked'
                              ? 'Admin revoked the code'
                              : r.revocation_reason}
                        </div>
                      )}
                      {r.previous_subscription_tier && (
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                          Was on: {r.previous_subscription_tier}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {statusKey === 'not_redeemed' && r.email && onEmailOne && (
                          <button
                            onClick={() => onEmailOne(r.email as string)}
                            disabled={isResending}
                            style={{
                              marginTop: 8,
                              padding: '5px 11px',
                              borderRadius: 7,
                              border: '1px solid rgba(194,24,91,.3)',
                              background: 'rgba(194,24,91,.05)',
                              color: isResending ? '#bbb' : '#AD1457',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: isResending ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {isResending ? 'Sending…' : 'Resend code'}
                          </button>
                        )}
                        {statusKey === 'active' && r.user_id && (
                          <button
                            onClick={() => onRevoke(r.user_id as string)}
                            disabled={revokingUserId === r.user_id}
                            style={{
                              marginTop: 8,
                              padding: '5px 11px',
                              borderRadius: 7,
                              border: '1px solid rgba(198,40,40,.3)',
                              background: 'rgba(198,40,40,.05)',
                              color: revokingUserId === r.user_id ? '#bbb' : '#C62828',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: revokingUserId === r.user_id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {revokingUserId === r.user_id ? 'Revoking…' : 'Revoke this person'}
                          </button>
                        )}
                        {statusKey !== 'active' && statusKey !== 'not_redeemed' && r.user_id && (
                          <button
                            onClick={() => onRestore(r.user_id as string)}
                            disabled={restoringUserId === r.user_id}
                            style={{
                              marginTop: 8,
                              padding: '5px 11px',
                              borderRadius: 7,
                              border: '1px solid rgba(194,24,91,.3)',
                              background: 'rgba(194,24,91,.05)',
                              color: restoringUserId === r.user_id ? '#bbb' : '#AD1457',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: restoringUserId === r.user_id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {restoringUserId === r.user_id ? 'Restoring…' : 'Restore access'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Stat Card Component
function StatCard({
  icon,
  title,
  value,
  variant,
}: {
  icon: string;
  title: string;
  value: string;
  variant: 'default' | 'success' | 'info';
}) {
  const colors = {
    default: { bg: 'rgba(194,24,91,.06)', border: 'rgba(194,24,91,.15)', icon: '#AD1457' },
    success: { bg: 'rgba(76,175,80,.06)', border: 'rgba(76,175,80,.15)', icon: '#2e7d32' },
    info: { bg: 'rgba(33,150,243,.06)', border: 'rgba(33,150,243,.15)', icon: '#1565c0' },
  };
  const c = colors[variant];

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid rgba(0,0,0,.08)',
        borderRadius: 12,
        padding: 24,
        transition: 'all .2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: c.bg,
            border: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <I n={icon} s={20} c={c.icon} />
        </div>
        <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#666' }}>{title}</h3>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a' }}>{value}</div>
    </div>
  );
}

// User Table Component
function UserTable({
  users,
  loading,
  onViewUser,
  formatDate,
}: {
  users: AdminUser[];
  loading: boolean;
  onViewUser: (id: string) => void;
  formatDate: (date?: string) => string;
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <I n="loader" s={24} c="#AD1457" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        style={{
          background: 'white',
          border: '1px solid rgba(0,0,0,.08)',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
        }}
      >
        <I n="users" s={48} c="#ccc" />
        <p style={{ fontSize: 14, color: '#999', marginTop: 16 }}>No users found</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,.02)', borderBottom: '1px solid rgba(0,0,0,.08)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#666' }}>
                Email
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#666' }}>
                Name
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#666' }}>
                Registered
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#666' }}>
                Subscription
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#666' }}>
                Credits
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#666' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || 'N/A';

              return (
                <tr
                  key={user.id}
                  style={{ borderBottom: '1px solid rgba(0,0,0,.04)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(194,24,91,.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {user.email}
                      {user.is_admin && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 999,
                            color: '#2E7D32',
                            background: 'rgba(46,125,50,.1)',
                          }}
                        >
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>{name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>{formatDate(user.createdAt)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Bd v={user.subscription_tier === 'free' ? 'default' : 'success'}>
                      {user.subscription_tier || 'free'}
                    </Bd>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#666', fontWeight: 600 }}>
                    {user.credits_balance?.toLocaleString() || 0}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => onViewUser(user.id)}
                      style={{
                        background: 'rgba(194,24,91,.08)',
                        border: '1px solid rgba(194,24,91,.2)',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#AD1457',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <I n="eye" s={14} c="#AD1457" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// User Details Modal
function UserDetailsModal({
  user,
  onClose,
  formatDate,
  onUserUpdated,
}: {
  user: AdminUserDetails;
  onClose: () => void;
  formatDate: (date?: string) => string;
  onUserUpdated: (userId: string, updates: Partial<AdminUser>) => void;
}) {
  const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || 'N/A';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          maxWidth: 700,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: 24,
            borderBottom: '1px solid rgba(0,0,0,.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1a1a1a' }}>User Details</h2>
            <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>{user.email}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,.04)',
              border: 'none',
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <I n="x" s={18} c="#666" />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {/* User Info */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>
              Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <InfoItem label="Name" value={name} />
              <InfoItem label="Email" value={user.email} />
              <InfoItem label="Phone" value={user.phone || 'N/A'} />
              <InfoItem label="Registered" value={formatDate(user.createdAt)} />
              <InfoItem label="Subscription" value={user.subscription_tier || 'free'} />
              <InfoItem label="Credits" value={user.credits_balance?.toLocaleString() || '0'} />
            </div>
          </div>

          {/* Admin Access */}
          <AdminAccessManagement user={user} onUserUpdated={onUserUpdated} />

          {/* Credit & Trial Management */}
          <CreditTrialManagement user={user} onUserUpdated={onUserUpdated} />

          {/* Trial Info */}
          {user.trial_end && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>Trial Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <InfoItem label="Trial Start" value={formatDate(user.trial_start)} />
                <InfoItem label="Trial End" value={formatDate(user.trial_end)} />
              </div>
            </div>
          )}

          {/* Activity Stats */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>Activity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div
                style={{
                  padding: 16,
                  background: 'rgba(194,24,91,.04)',
                  border: '1px solid rgba(194,24,91,.1)',
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: '#AD1457' }}>{user.brand_profiles.length}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginTop: 4 }}>Brand Profiles</div>
              </div>
              <div
                style={{
                  padding: 16,
                  background: 'rgba(194,24,91,.04)',
                  border: '1px solid rgba(194,24,91,.1)',
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: '#AD1457' }}>{user.content_count}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginTop: 4 }}>Content Created</div>
              </div>
              <div
                style={{
                  padding: 16,
                  background: 'rgba(194,24,91,.04)',
                  border: '1px solid rgba(194,24,91,.1)',
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: '#AD1457' }}>{user.workspaces.length}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginTop: 4 }}>Workspaces</div>
              </div>
            </div>
          </div>

          {/* Brand Profiles */}
          {user.brand_profiles.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>Brand Profiles</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {user.brand_profiles.map((brand) => (
                  <div
                    key={brand.id}
                    style={{
                      padding: 12,
                      background: 'rgba(0,0,0,.02)',
                      border: '1px solid rgba(0,0,0,.06)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                      {brand.brand_name || 'Unnamed Brand'}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      {brand.industry || 'No industry'} • Created {formatDate(brand.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workspaces */}
          {user.workspaces.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>Workspaces</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {user.workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    style={{
                      padding: 12,
                      background: 'rgba(0,0,0,.02)',
                      border: '1px solid rgba(0,0,0,.06)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                      {workspace.name || 'Unnamed Workspace'}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      Created {formatDate(workspace.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Admin Access — grant/revoke another user's admin status. The backend is the
// real gate (rejects a non-admin caller and rejects self-revoke regardless of
// what this UI does); the disabled state here just avoids sending requests
// that are guaranteed to fail.
function AdminAccessManagement({
  user,
  onUserUpdated,
}: {
  user: AdminUserDetails;
  onUserUpdated: (userId: string, updates: Partial<AdminUser>) => void;
}) {
  const { userDetails } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);
  const isSelf = userDetails?.email?.toLowerCase() === user.email?.toLowerCase();

  const handleToggle = () => {
    if (user.is_admin) {
      setConfirmRevokeOpen(true);
      return;
    }
    performToggle();
  };

  const performToggle = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = user.is_admin ? await AdminService.revokeAdmin(user.id) : await AdminService.grantAdmin(user.id);
      onUserUpdated(user.id, { is_admin: result.is_admin });
      setMessage({ type: 'ok', text: result.is_admin ? 'Admin access granted.' : 'Admin access revoked.' });
    } catch (error) {
      console.error('Failed to change admin access:', error);
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setMessage({ type: 'err', text: detail || 'Failed to change admin access.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>Admin Access</h3>
      <div
        style={{
          padding: 16,
          background: 'rgba(0,0,0,.02)',
          border: '1px solid rgba(0,0,0,.06)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 999,
              color: user.is_admin ? '#2E7D32' : '#666',
              background: user.is_admin ? 'rgba(46,125,50,.1)' : 'rgba(0,0,0,.05)',
            }}
          >
            {user.is_admin ? 'Admin' : 'Not an admin'}
          </span>
          <button
            onClick={handleToggle}
            disabled={busy || isSelf}
            title={isSelf ? "You can't change your own admin access" : undefined}
            style={{
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: 'white',
              background: user.is_admin ? '#B71C1C' : '#AD1457',
              border: 'none',
              borderRadius: 8,
              cursor: busy || isSelf ? 'not-allowed' : 'pointer',
              opacity: busy || isSelf ? 0.5 : 1,
            }}
          >
            {busy ? 'Working…' : user.is_admin ? 'Remove Admin' : 'Make Admin'}
          </button>
          {isSelf && <span style={{ fontSize: 12, color: '#999' }}>This is your own account</span>}
        </div>
        {message && (
          <div style={{ fontSize: 12, fontWeight: 600, color: message.type === 'ok' ? '#2E7D32' : '#C62828' }}>
            {message.text}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={confirmRevokeOpen}
        title="Remove admin access?"
        message={`Remove admin access from ${user.email}?`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="#B71C1C"
        onConfirm={performToggle}
        onCancel={() => setConfirmRevokeOpen(false)}
      />
    </div>
  );
}

// Credit & Trial Management — the actual editing capability this admin tab
// was missing. Every adjustment re-fetches the user's full details afterward
// rather than hand-merging the response, since credits_balance folds trial
// credits in with subscription-tier logic computed server-side (see
// admin_router.get_user_details) that this component shouldn't re-derive.
function CreditTrialManagement({
  user,
  onUserUpdated,
}: {
  user: AdminUserDetails;
  onUserUpdated: (userId: string, updates: Partial<AdminUser>) => void;
}) {
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [trialAmount, setTrialAmount] = useState('');
  const [trialReason, setTrialReason] = useState('');
  const [busy, setBusy] = useState<'credit' | 'trial' | 'expire' | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [confirmExpireOpen, setConfirmExpireOpen] = useState(false);

  const refreshUser = async () => {
    const details = await AdminService.getUserDetails(user.id);
    onUserUpdated(user.id, details);
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid rgba(0,0,0,.12)',
    borderRadius: 8,
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 700,
    color: 'white',
    background: '#AD1457',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  const handleCreditAdjust = async () => {
    const amount = parseInt(creditAmount, 10);
    if (!amount) return;
    setBusy('credit');
    setMessage(null);
    try {
      await AdminService.adjustUserCredits(user.id, amount, creditReason || undefined);
      await refreshUser();
      setMessage({ type: 'ok', text: `Applied ${amount > 0 ? '+' : ''}${amount} credits.` });
      setCreditAmount('');
      setCreditReason('');
    } catch (error) {
      console.error('Failed to adjust credits:', error);
      setMessage({ type: 'err', text: 'Failed to adjust credits.' });
    } finally {
      setBusy(null);
    }
  };

  const handleTrialAdjust = async () => {
    const amount = parseInt(trialAmount, 10);
    if (!amount) return;
    setBusy('trial');
    setMessage(null);
    try {
      await AdminService.adjustUserTrialCredits(user.id, amount, trialReason || undefined);
      await refreshUser();
      setMessage({ type: 'ok', text: `Applied ${amount > 0 ? '+' : ''}${amount} trial credits.` });
      setTrialAmount('');
      setTrialReason('');
    } catch (error) {
      console.error('Failed to adjust trial credits:', error);
      setMessage({ type: 'err', text: 'Failed to adjust trial credits. Does this user have a trial record?' });
    } finally {
      setBusy(null);
    }
  };

  const handleExpireTrial = () => {
    setConfirmExpireOpen(true);
  };

  const performExpireTrial = async () => {
    setBusy('expire');
    setMessage(null);
    try {
      await AdminService.expireUserTrial(user.id);
      await refreshUser();
      setMessage({ type: 'ok', text: 'Trial expired.' });
    } catch (error) {
      console.error('Failed to expire trial:', error);
      setMessage({ type: 'err', text: 'Failed to expire trial. Does this user have a trial record?' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>
        Credit &amp; Trial Management
      </h3>
      <div
        style={{
          padding: 16,
          background: 'rgba(0,0,0,.02)',
          border: '1px solid rgba(0,0,0,.06)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Credit adjustment */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#666', minWidth: 100 }}>Adjust credits</span>
          <input
            type="number"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            placeholder="Amount (+/-)"
            style={{ ...inputStyle, width: 110 }}
          />
          <input
            type="text"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
            placeholder="Reason (optional)"
            style={{ ...inputStyle, flex: 1, minWidth: 140 }}
          />
          <button onClick={handleCreditAdjust} disabled={busy === 'credit' || !creditAmount} style={buttonStyle}>
            {busy === 'credit' ? 'Applying…' : 'Apply'}
          </button>
        </div>

        {/* Trial credit adjustment */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#666', minWidth: 100 }}>Adjust trial credits</span>
          <input
            type="number"
            value={trialAmount}
            onChange={(e) => setTrialAmount(e.target.value)}
            placeholder="Amount (+/-)"
            style={{ ...inputStyle, width: 110 }}
          />
          <input
            type="text"
            value={trialReason}
            onChange={(e) => setTrialReason(e.target.value)}
            placeholder="Reason (optional)"
            style={{ ...inputStyle, flex: 1, minWidth: 140 }}
          />
          <button onClick={handleTrialAdjust} disabled={busy === 'trial' || !trialAmount} style={buttonStyle}>
            {busy === 'trial' ? 'Applying…' : 'Apply'}
          </button>
        </div>

        {/* Expire trial */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#666', minWidth: 100 }}>Force-expire trial</span>
          <button
            onClick={handleExpireTrial}
            disabled={busy === 'expire'}
            style={{ ...buttonStyle, background: '#B71C1C' }}
          >
            {busy === 'expire' ? 'Expiring…' : 'Expire Trial'}
          </button>
        </div>

        {message && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: message.type === 'ok' ? '#2E7D32' : '#C62828',
            }}
          >
            {message.text}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={confirmExpireOpen}
        title="Force-expire this trial?"
        message={`Force-expire ${user.email}'s trial? This sets trial credits to 0 and cannot be undone.`}
        confirmText="Expire Trial"
        cancelText="Cancel"
        confirmColor="#B71C1C"
        onConfirm={performExpireTrial}
        onCancel={() => setConfirmExpireOpen(false)}
      />
    </div>
  );
}

// Info Item Component
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 4, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{value}</div>
    </div>
  );
}
