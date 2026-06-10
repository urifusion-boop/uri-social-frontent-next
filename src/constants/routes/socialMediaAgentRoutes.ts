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
  | 'generateStoryboard'
  | 'generateVideoFromStoryboard'
  | 'videoJob'
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
  | 'calendarToday'
  | 'mergeVideoJob'
  | 'videoDrafts'
  | 'generateStoryboardFrames'
  | 'storyboardFrameJob'
  | 'publishVideoDraft'
  | 'videoPublishJob'
  | 'extractImageText'
  | 'uploadCustomFont'
  | 'analyzeCustomFont'
  | 'generateBlog'
  | 'getBlogDrafts'
  | 'getBlogDraft'
  | 'agentChat'
  | 'agentChatHistory'
  | 'clearAgentChat'
  | 'agentChatStream'
  | 'agentChatUpload'
  | 'editVideo'
  | 'editVideoJob'
  | 'polishVideo'
  | 'polishVideoJob'
  | 'polishVideoRestyle'
  | 'videoPolishStyles'
  | 'writingDnaQuiz'
  | 'writingDna'
  | 'generateBlogPost'
  | 'blogPosts'
  | 'blogPostById'
  | 'blogPostFeedback'
  | 'blogPostPublish';

const rawSocialMediaAgentRoutes: Record<ISocialMediaAgentApi, string> = {
  connectFacebookToken: '/connect/facebook/token',
  initiateConnection: '/connect/initiate',
  pendingConnection: '/connect/pending',
  finalizeConnection: '/connect/finalize',
  getConnections: '/connections',
  disconnectPlatform: '/connections/account',
  generateContent: '/generate-content',
  generateStoryboard: '/generate-storyboard',
  generateVideoFromStoryboard: '/generate-video-from-storyboard',
  videoJob: '/video-job',
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
  mergeVideoJob: '/merge-video-job',
  videoDrafts: '/video-drafts',
  generateStoryboardFrames: '/generate-storyboard-frames',
  storyboardFrameJob: '/storyboard-frame-job',
  publishVideoDraft: '/publish-video-draft',
  videoPublishJob: '/video-publish-job',
  extractImageText: '/extract-image-text',
  uploadCustomFont: '/upload-custom-font',
  analyzeCustomFont: '/analyze-custom-font',
  generateBlog: '/generate-blog',
  getBlogDrafts: '/blog-drafts',
  getBlogDraft: '/blog-drafts/{draft_id}',
  agentChat: '/agent/chat',
  agentChatHistory: '/agent/chat/history',
  clearAgentChat: '/agent/chat/history',
  agentChatStream: '/agent/chat/stream',
  agentChatUpload: '/agent/chat/upload',
  editVideo: '/edit-video',
  editVideoJob: '/edit-video-job',
  polishVideo: '/polish-video',
  polishVideoJob: '/polish-video-job',
  polishVideoRestyle: '/polish-video-restyle',
  videoPolishStyles: '/video-polish-styles',
  // Writing DNA Blog Generator
  writingDnaQuiz: '/blog/writing-dna/quiz',
  writingDna: '/blog/writing-dna',
  generateBlogPost: '/blog/generate',
  blogPosts: '/blog/posts',
  blogPostById: '/blog/posts/{blog_id}',
  blogPostFeedback: '/blog/posts/{blog_id}/feedback',
  blogPostPublish: '/blog/posts/{blog_id}/publish',
};

export const socialMediaAgentRoutes: Record<ISocialMediaAgentApi, string> = RouteHelper.createRoutes(
  URI_INSIGHTS_PATH,
  rawSocialMediaAgentRoutes
);
