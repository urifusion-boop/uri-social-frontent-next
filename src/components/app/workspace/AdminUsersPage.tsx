'use client';

/**
 * Admin Users Page Component for Workspace
 * Admin-only page for user management
 * Only accessible by: urisocialingsight@gmail.com
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';
import { AdminService, AdminUser, AdminUserDetails, AdminStats } from '@/src/api/AdminService';
import { useRouter } from 'next/navigation';

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
  const { userDetails } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'stats' | 'all-users' | 'recent'>('stats');
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

  // Check if user is admin
  const isAdmin = AdminService.isAdmin(userDetails?.email);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/workspace');
    }
  }, [isAdmin, router]);

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

  if (!isAdmin) {
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
        {(['stats', 'all-users', 'recent'] as const).map((tab) => {
          const labels = { stats: 'Overview', 'all-users': 'All Users', recent: 'Recent Signups' };
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
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} formatDate={formatDate} />
      )}
    </div>
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
                    {user.email}
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
}: {
  user: AdminUserDetails;
  onClose: () => void;
  formatDate: (date?: string) => string;
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
