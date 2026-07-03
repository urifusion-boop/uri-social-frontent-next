/**
 * Jane's First Message API Service
 * PRD: URI-Social-Jane-First-Message-PRD.pdf
 *
 * Handles communication with Jane's first message endpoints.
 * Goal: Turn passive signups into active users with one contextual offer.
 */
import { apiRequest } from './core/apiRequest';

export interface JaneFirstMessageResponse {
  message_id: string;
  message: string;
  hook: string;
  seed_content: string;
  platforms_suggested: string[];
}

export interface AcceptMessageResponse {
  seed_content: string;
  platforms: string[];
  message_id: string;
}

export class JaneService {
  /**
   * PRD Section 4: Check if user should see Jane's first message
   * Called on workspace load to decide whether to display welcome card
   */
  static async shouldShowFirstMessage(): Promise<boolean> {
    try {
      const response = await apiRequest<{ should_show: boolean }>({
        url: '/social-media/jane/should-show',
        method: 'GET',
      });
      return response.responseData?.should_show ?? false;
    } catch (error) {
      console.error('Error checking if should show first message:', error);
      return false;
    }
  }

  /**
   * PRD Section 4: Fetch Jane's first message
   * Returns personalized message based on user's brand profile + Nigerian seasonal context
   *
   * Message contains:
   * 1. Proof it was listening (business/industry reference)
   * 2. Genuinely specific, timely hook
   * 3. Low-effort offer
   * 4. One clear next step
   */
  static async getFirstMessage(): Promise<JaneFirstMessageResponse | null> {
    try {
      const response = await apiRequest<JaneFirstMessageResponse>({
        url: '/social-media/jane/first-message',
        method: 'GET',
      });
      return response.responseData || null;
    } catch (error) {
      console.error('Error fetching Jane first message:', error);
      return null;
    }
  }

  /**
   * PRD Section 8: Accept Jane's first message
   * User said yes! Returns data for content generation.
   *
   * Frontend should then:
   * 1. Call SocialMediaAgentService.generateContent() with returned params
   * 2. Navigate to drafts tab to show generated content
   * 3. Track if user publishes (key metric!)
   */
  static async acceptFirstMessage(messageId: string, platforms?: string[]): Promise<AcceptMessageResponse | null> {
    try {
      const response = await apiRequest<AcceptMessageResponse>({
        url: '/social-media/jane/accept',
        method: 'POST',
        data: {
          message_id: messageId,
          platforms,
        },
      });
      return response.responseData || null;
    } catch (error) {
      console.error('Error accepting first message:', error);
      return null;
    }
  }

  /**
   * PRD Section 9: Decline Jane's first message gracefully
   * "No wahala — I'm here whenever you want to make something"
   */
  static async declineFirstMessage(messageId: string): Promise<boolean> {
    try {
      await apiRequest({
        url: `/social-media/jane/decline?message_id=${messageId}`,
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('Error declining first message:', error);
      return false;
    }
  }
}
