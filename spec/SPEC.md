# CLAi Landing Page V1 Specification

## Overview

This specification describes the next version of the CLAi landing page. The goal is to evolve the current site from a static landing experience into a richer product preview where visitors can understand CLAi, try Ask CLAi for fashion advice, authenticate, and join the CLAi mobile app waitlist.

## Goals

- Improve the landing page with an Ask CLAi feature that gives users fashion advice.
- Integrate Google AI for Ask CLAi responses.
- Support authentication flows for signup, login, email signup, and Google signup.
- Add a dedicated mobile app waitlist page.
- Use Notion as the waitlist management backend.
- Allow Ask CLAi to accept both typed and spoken user prompts.
- Return text responses and relevant images from Google AI where appropriate.

## Non-Goals

- Building the full CLAi mobile app.
- Replacing the mobile app waitlist with a custom CRM.
- Building a full user dashboard unless required for authentication confirmation.
- Supporting every social login provider beyond Google.

## Key Experiences

### Landing Page

The landing page should continue to introduce CLAi clearly, but it should also surface Ask CLAi as a major interactive feature. Visitors should be able to understand that CLAi can provide fashion advice and should have a clear path to try the feature, create an account, or join the mobile app waitlist.

Expected landing page improvements:

- Add a clear Ask CLAi entry point above the fold or in a highly visible section.
- Communicate that Ask CLAi can help with outfit ideas, styling feedback, occasion-based recommendations, and fashion discovery.
- Include calls to action for:
    - Trying Ask CLAi.
    - Signing up or logging in.
    - Joining the mobile app waitlist.
- Preserve a polished and responsive experience across desktop and mobile.

### Ask CLAi

Ask CLAi is an AI-powered fashion advice experience integrated into the landing page. It should allow visitors or authenticated users to ask fashion-related questions and receive helpful advice.

Core Ask CLAi requirements:

- Users can type a fashion question or styling request.
- Users can speak a prompt using microphone input.
- Spoken prompts should be converted into text before being sent to Google AI.
- Google AI should return fashion advice as text.
- Google AI should include or generate relevant images when appropriate.
- The UI should clearly show:
    - User prompt.
    - CLAi text response.
    - Any returned images.
    - Loading, error, and empty states.

Example prompts:

- "What should I wear to a summer wedding?"
- "Help me style black wide-leg trousers."
- "What colors go well with olive green?"
- "Give me outfit ideas for a casual first date."
- "I need a polished look for a tech conference."

Image behavior:

- Images should be included when they help explain the recommendation, such as outfit inspiration, color palettes, or visual styling examples.
- If images are unavailable, the response should still provide useful text advice.
- The interface should handle multiple returned images gracefully.

Voice behavior:

- Users should be able to start and stop recording.
- The UI should indicate when microphone input is active.
- The transcribed prompt should be editable before submission when practical.
- Permission denial and unsupported-browser states should be handled clearly.

### Google AI Integration

Google AI will power Ask CLAi.

Integration expectations:

- Use a server-side API route or server action to call Google AI so secrets are not exposed in the browser.
- Store the Google AI API key in environment variables.
- Validate user input before sending it to Google AI.
- Shape prompts so responses stay focused on fashion, styling, fit, color, occasion, and shopping guidance.
- Support multimodal responses where Google AI can provide images or image references.
- Return normalized response data to the frontend:

```ts
type AskClaiResponse = {
	text: string;
	images?: Array<{
		url: string;
		alt: string;
		source?: string;
	}>;
};
```

Error handling:

- Show a friendly error when Google AI is unavailable.
- Avoid exposing provider errors or secrets to users.
- Log enough server-side detail to support debugging.

### Authentication

The landing page should include authentication so users can create an account and return later.

Supported authentication flows:

- Signup with email.
- Login with email.
- Signup with Google.
- Login with Google.
- Email verification after email signup.
- Forgot password request.
- Password reset using a secure reset link or token.
- Logout.

Authentication requirements:

- Provide clear signup and login entry points from the landing page.
- Support a dedicated auth page or modal flow.
- Validate email input.
- Require email verification before users can fully access authenticated-only features.
- Send verification emails to users who sign up with email.
- Allow users to request a new verification email when needed.
- Provide a forgot password flow from the login experience.
- Send password reset emails with secure, time-limited links.
- Allow users to set a new password after opening a valid reset link.
- Invalidate used or expired password reset tokens.
- Display authentication errors in a user-friendly way.
- Support redirecting users back to the original page or Ask CLAi flow after authentication.
- Keep provider secrets and OAuth credentials server-side.

Suggested auth pages:

- `/signup`
- `/login`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

Suggested post-auth behavior:

- After signup or login, return users to Ask CLAi or the landing page.
- After email signup, direct users to verify their email before continuing to authenticated-only features.
- After password reset, direct users back to login with a success state.
- If the user came from the waitlist page, return them to the waitlist confirmation flow.

### Mobile App Waitlist

CLAi should have a dedicated waitlist page for users who want access to the mobile app.

Route:

- `/waitlist`

Waitlist requirements:

- Collect user information needed for mobile app launch communication.
- Store waitlist submissions in Notion.
- Prevent accidental duplicate submissions when possible.
- Show success and error states.
- Work well on mobile devices.

Suggested waitlist fields:

- Name.
- Email.
- Style interest or reason for joining.
- Platform preference: iOS, Android, or both.
- Optional notes.

Notion integration expectations:

- Use the Notion API from the server side.
- Store the Notion API key and database ID in environment variables.
- Create one Notion database row per waitlist submission.
- Map form fields to Notion properties consistently.
- Return a success response only after Notion accepts the submission.

Suggested waitlist response shape:

```ts
type WaitlistSubmission = {
	name: string;
	email: string;
	styleInterest?: string;
	platformPreference?: 'ios' | 'android' | 'both';
	notes?: string;
};
```

### Pages and Routes

Expected routes:

- `/` - improved landing page with Ask CLAi entry point.
- `/ask` - Ask CLAi experience, if not embedded directly on the homepage.
- `/waitlist` - dedicated mobile app waitlist page.
- `/signup` - email and Google signup.
- `/login` - email and Google login.

Route implementation can be adjusted to match the existing Next.js app structure, but the user-facing experiences should remain available.

## UX Requirements

- The design should feel modern, fashion-aware, and easy to scan.
- Ask CLAi should feel like a real product preview, not just a contact form.
- The waitlist flow should feel lightweight and trustworthy.
- Authentication should not block users from understanding the product.
- Loading states should be visible for AI responses, auth actions, and waitlist submission.
- Forms should provide clear validation feedback.
- All interactive flows should work on desktop and mobile.

## Accessibility Requirements

- Forms must have accessible labels.
- Buttons must communicate state, especially for loading and recording.
- Voice input controls must be keyboard accessible.
- Images returned by Ask CLAi should include alt text.
- Error messages should be readable by assistive technologies.
- Color contrast should be sufficient for primary text and controls.

## Environment Variables

Expected environment variables:

```txt
GOOGLE_AI_API_KEY=
NOTION_API_KEY=
NOTION_WAITLIST_DATABASE_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=
AUTH_URL=
EMAIL_FROM=
EMAIL_PROVIDER_API_KEY=
```

Names may be adjusted to match the selected authentication and integration libraries.

## Acceptance Criteria

- Users can access an improved landing page that prominently introduces Ask CLAi.
- Users can type a fashion question into Ask CLAi and receive a Google AI text response.
- Users can use voice input to create an Ask CLAi prompt.
- Ask CLAi can display relevant images when the AI response includes them.
- Users can sign up and log in with email.
- Users can sign up and log in with Google.
- Users who sign up with email receive an email verification message.
- Users can verify their email before accessing authenticated-only features.
- Users can request a password reset from the login flow.
- Users can set a new password using a secure password reset link.
- Users can join the mobile app waitlist from `/waitlist`.
- Waitlist submissions are saved to Notion.
- API keys and provider secrets are never exposed to the browser.
- All core flows include loading, success, and error states.
- The experience is responsive across common desktop and mobile screen sizes.

## Open Questions

- Which authentication library should the app use?
- Should Ask CLAi require authentication, or should anonymous users receive a limited trial?
- Should Google AI generate images directly, return image search references, or both?
- What exact Notion database schema should be used for waitlist submissions?
- Should waitlist users receive email confirmation after joining?
- Should authenticated users have usage limits for Ask CLAi?
