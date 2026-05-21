'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  SwapHoriz as SwitchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';

// Mock data structure matching the SDK types
interface Workspace {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  slug: string;
  description?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  member_count: number;
  created_at: string;
}

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  joined_at: string;
}

export default function MultiTenantDemoPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  // Mock initial data
  useEffect(() => {
    // Simulate fetching workspaces
    const mockWorkspaces: Workspace[] = [
      {
        id: '1',
        workspace_id: 'ws_1',
        client_id: 'client_1',
        name: 'Marketing Team',
        slug: 'marketing-team',
        description: 'Main marketing workspace',
        role: 'owner',
        member_count: 5,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        workspace_id: 'ws_2',
        client_id: 'client_1',
        name: 'Sales Team',
        slug: 'sales-team',
        description: 'Sales team workspace',
        role: 'admin',
        member_count: 3,
        created_at: new Date().toISOString(),
      },
    ];
    setWorkspaces(mockWorkspaces);
    setCurrentWorkspace(mockWorkspaces[0]);

    // Mock members
    const mockMembers: WorkspaceMember[] = [
      {
        id: '1',
        workspace_id: 'ws_1',
        user_email: 'john@example.com',
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      },
      {
        id: '2',
        workspace_id: 'ws_1',
        user_email: 'jane@example.com',
        role: 'admin',
        status: 'active',
        joined_at: new Date().toISOString(),
      },
      {
        id: '3',
        workspace_id: 'ws_1',
        user_email: 'bob@example.com',
        role: 'member',
        status: 'pending',
        joined_at: new Date().toISOString(),
      },
    ];
    setMembers(mockMembers);
  }, []);

  const handleCreateWorkspace = () => {
    const newWorkspace: Workspace = {
      id: String(workspaces.length + 1),
      workspace_id: `ws_${workspaces.length + 1}`,
      client_id: 'client_1',
      name: newWorkspaceName,
      slug: newWorkspaceName.toLowerCase().replace(/\s+/g, '-'),
      description: newWorkspaceDesc,
      role: 'owner',
      member_count: 1,
      created_at: new Date().toISOString(),
    };
    setWorkspaces([...workspaces, newWorkspace]);
    setCreateDialogOpen(false);
    setNewWorkspaceName('');
    setNewWorkspaceDesc('');
  };

  const handleInviteMember = () => {
    const newMember: WorkspaceMember = {
      id: String(members.length + 1),
      workspace_id: currentWorkspace?.workspace_id || '',
      user_email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      joined_at: new Date().toISOString(),
    };
    setMembers([...members, newMember]);
    setInviteDialogOpen(false);
    setInviteEmail('');
    setInviteRole('member');
  };

  const handleSwitchWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    // In real implementation, this would call:
    // uriSocial.setWorkspaceId(workspace.workspace_id);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: '#CD1B78',
      admin: '#2563EB',
      member: '#10B981',
      viewer: '#6B7280',
    };
    return colors[role] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10B981',
      pending: '#F59E0B',
      suspended: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3, backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Multi-Tenant Demo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Test workspace management, member roles, and multi-tenant features
          </Typography>
        </Box>

        {/* Current Workspace Selector */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BusinessIcon sx={{ color: '#CD1B78' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: 12 }}>
                  Current Workspace
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentWorkspace?.name}
                </Typography>
              </Box>
              <Chip
                label={currentWorkspace?.role.toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: getRoleColor(currentWorkspace?.role || ''),
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Workspaces Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon sx={{ color: '#CD1B78' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Workspaces
                    </Typography>
                    <Chip label={workspaces.length} size="small" />
                  </Box>
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{
                      backgroundColor: '#CD1B78',
                      '&:hover': { backgroundColor: '#A0145E' },
                      textTransform: 'none',
                    }}
                  >
                    Create Workspace
                  </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {workspaces.map((workspace) => (
                    <Box
                      key={workspace.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: currentWorkspace?.id === workspace.id ? '#CD1B78' : '#E5E7EB',
                        backgroundColor: currentWorkspace?.id === workspace.id ? '#FFF5FA' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#CD1B78',
                          boxShadow: '0 2px 8px rgba(205, 27, 120, 0.1)',
                        },
                      }}
                      onClick={() => handleSwitchWorkspace(workspace)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{workspace.name}</Typography>
                          {workspace.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mb: 1 }}>
                              {workspace.description}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={workspace.role}
                              size="small"
                              sx={{
                                backgroundColor: getRoleColor(workspace.role),
                                color: 'white',
                                fontSize: 11,
                                height: 20,
                              }}
                            />
                            <Chip
                              label={`${workspace.member_count} members`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 11, height: 20 }}
                            />
                          </Box>
                        </Box>
                        {currentWorkspace?.id === workspace.id && <SwitchIcon sx={{ color: '#CD1B78' }} />}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Members Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon sx={{ color: '#CD1B78' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Members
                    </Typography>
                    <Chip label={members.length} size="small" />
                  </Box>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => setInviteDialogOpen(true)}
                    sx={{
                      borderColor: '#CD1B78',
                      color: '#CD1B78',
                      '&:hover': { borderColor: '#A0145E', backgroundColor: '#FFF5FA' },
                      textTransform: 'none',
                    }}
                  >
                    Invite Member
                  </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {members
                    .filter((m) => m.workspace_id === currentWorkspace?.workspace_id)
                    .map((member) => (
                      <Box
                        key={member.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid #E5E7EB',
                          backgroundColor: 'white',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{member.user_email}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={member.role}
                                size="small"
                                sx={{
                                  backgroundColor: getRoleColor(member.role),
                                  color: 'white',
                                  fontSize: 11,
                                  height: 20,
                                }}
                              />
                              <Chip
                                label={member.status}
                                size="small"
                                sx={{
                                  backgroundColor: getStatusColor(member.status),
                                  color: 'white',
                                  fontSize: 11,
                                  height: 20,
                                }}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {member.role !== 'owner' && (
                              <IconButton size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* SDK Usage Examples */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  SDK Usage Examples
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <Typography sx={{ color: '#6B7280', mb: 1, fontSize: 12 }}>
                      Initialize SDK with workspace context:
                    </Typography>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {`import { URISocial } from '@urisocial/typescript-sdk';

const uriSocial = new URISocial({
  apiKey: 'your-api-key',
  workspaceId: '${currentWorkspace?.workspace_id || 'ws_xxx'}'
});`}
                    </pre>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <Typography sx={{ color: '#6B7280', mb: 1, fontSize: 12 }}>Switch workspace context:</Typography>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {`// Switch to different workspace
uriSocial.setWorkspaceId('ws_2');

// Generate content in new workspace context
const content = await uriSocial.content.generate({
  seedContent: 'New product launch',
  platforms: ['linkedin', 'instagram']
});`}
                    </pre>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <Typography sx={{ color: '#6B7280', mb: 1, fontSize: 12 }}>Manage workspace members:</Typography>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {`// Invite member
await uriSocial.workspaces.inviteMember('ws_1', {
  email: 'member@example.com',
  role: 'member'
});

// Update member role
await uriSocial.workspaces.updateMemberRole(
  'ws_1',
  'member_id',
  'admin'
);`}
                    </pre>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Create Workspace Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Workspace Name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description (optional)"
              value={newWorkspaceDesc}
              onChange={(e) => setNewWorkspaceDesc(e.target.value)}
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateWorkspace}
              variant="contained"
              disabled={!newWorkspaceName.trim()}
              sx={{ backgroundColor: '#CD1B78', '&:hover': { backgroundColor: '#A0145E' } }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Invite Member Dialog */}
        <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
            />
            <Select
              fullWidth
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
              label="Role"
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleInviteMember}
              variant="contained"
              disabled={!inviteEmail.trim()}
              sx={{ backgroundColor: '#CD1B78', '&:hover': { backgroundColor: '#A0145E' } }}
            >
              Send Invitation
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
