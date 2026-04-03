import { BackendUrlEnum } from '@/src/models/enum-models/BackendUrlEnum';
import { RouteHelper } from '../../helpers/RouteHelper';

const URI_INSIGHTS_PATH = BackendUrlEnum.INSIGHTS + '/social-media';

type ISocialMediaAgentApi =
  | 'connectFacebookToken'
  | 'initiateConnection'
  | 'pendingConnection'
  | 'finalizeConnection'
  | 'getConnections'
  | 'disconnectPlatform'
  | 'generateContent'
  | 'refineContent'
  | 'approveContent'
  | 'denyContent'
  | 'deleteDraft'
  | 'contentCalendar'
  | 'scheduledContent'
  | 'autoGenerateSettings'
  | 'autoGenerateTrigger'
  | 'autoGenerateConnectInsights'
  | 'calendarPlan'
  | 'calendarPlanGenerate'
  | 'calendarDayBase'
  | 'calendarToday';

const rawSocialMediaAgentRoutes: Record<ISocialMediaAgentApi, string> = {
  connectFacebookToken: '/connect/facebook/token',
  initiateConnection: '/connect/initiate',
  pendingConnection: '/connect/pending',
  finalizeConnection: '/connect/finalize',
  getConnections: '/connections',
  disconnectPlatform: '/connections',
  generateContent: '/generate-content',
  refineContent: '/refine',
  approveContent: '/approve',
  denyContent: '/deny',
  deleteDraft: '/drafts',
  contentCalendar: '/content-calendar',
  scheduledContent: '/scheduled',
  autoGenerateSettings: '/auto-generate/settings',
  autoGenerateTrigger: '/auto-generate/trigger',
  autoGenerateConnectInsights: '/auto-generate/connect-insights',
  calendarPlan: '/content-calendar/plan',
  calendarPlanGenerate: '/content-calendar/plan/generate',
  calendarDayBase: '/content-calendar/plan',
  calendarToday: '/content-calendar/today',
};

export const socialMediaAgentRoutes: Record<ISocialMediaAgentApi, string> = RouteHelper.createRoutes(URI_INSIGHTS_PATH, rawSocialMediaAgentRoutes);
