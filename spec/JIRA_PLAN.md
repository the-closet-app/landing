# CLAi Landing Page V1 Jira Ticket Plan

## Epic 1: Landing Page Refresh and Product Positioning

### CLAI-001: Refresh Landing Page to Introduce Ask CLAi

**Type:** Story  
**Priority:** High  
**Estimate:** 5 points  
**Dependencies:** None

**Description**

Update the current CLAi landing page so Ask CLAi is presented as a primary product feature. The page should clearly explain that users can ask CLAi for fashion advice, styling ideas, outfit feedback, and occasion-based recommendations. The page should include clear paths to try Ask CLAi, sign up or log in, and join the mobile app waitlist.

**Implementation Notes**

- Add a prominent Ask CLAi section or entry point on the homepage.
- Add primary and secondary calls to action for Ask CLAi, authentication, and waitlist.
- Keep the page responsive across desktop and mobile.
- Preserve the current brand direction where appropriate.

**Acceptance Criteria**

- The homepage clearly introduces Ask CLAi as an AI fashion advice feature.
- Users can navigate from the homepage to Ask CLAi.
- Users can navigate from the homepage to signup and login.
- Users can navigate from the homepage to the waitlist page.
- The homepage renders correctly on desktop and mobile viewport sizes.
- Loading or interactive states do not cause layout shifts or overlapping content.

### CLAI-002: Add Navigation and CTA Structure for V1 Routes

**Type:** Story  
**Priority:** Medium  
**Estimate:** 3 points  
**Dependencies:** CLAI-001

**Description**

Add route-aware navigation for the V1 landing experience. Users should be able to move between the homepage, Ask CLAi, waitlist, signup, and login flows without confusion.

**Implementation Notes**

- Add links for `/`, `/ask`, `/waitlist`, `/signup`, and `/login`.
- Ensure mobile navigation remains usable.
- Authenticated users should see a logout option when auth state is available.

**Acceptance Criteria**

- Navigation includes links to the homepage, Ask CLAi, waitlist, signup, and login.
- Navigation works on desktop and mobile.
- Active or contextual navigation states are visually clear.
- Authenticated users can access logout from the navigation or account menu.
- Unauthenticated users can access signup and login from the navigation.

## Epic 2: Ask CLAi AI Fashion Advice

### CLAI-003: Build Ask CLAi Page and Typed Prompt UI

**Type:** Story  
**Priority:** High  
**Estimate:** 5 points  
**Dependencies:** CLAI-002

**Description**

Create the Ask CLAi experience where users can type fashion questions and receive AI-powered styling advice. The UI should feel like a real product preview and include clear empty, loading, success, and error states.

**Implementation Notes**

- Create `/ask` route unless Ask CLAi is embedded directly on the homepage.
- Add a prompt input area.
- Add submit behavior.
- Display the user prompt and CLAi response.
- Include example prompts to help users get started.

**Acceptance Criteria**

- Users can enter a fashion prompt in a text input or textarea.
- Users can submit the prompt to Ask CLAi.
- The UI shows a loading state while the response is pending.
- The UI displays the submitted user prompt.
- The UI displays CLAi's text response.
- The UI displays a friendly error when the request fails.
- Empty prompt submissions are blocked with validation feedback.

### CLAI-004: Implement Google AI Server Integration for Ask CLAi

**Type:** Story  
**Priority:** High  
**Estimate:** 8 points  
**Dependencies:** CLAI-003

**Description**

Integrate Google AI through a server-side API route or server action. The integration should accept a fashion prompt, call Google AI securely, and return normalized data to the frontend.

**Implementation Notes**

- Store the Google AI API key in `GOOGLE_AI_API_KEY`.
- Keep all provider calls server-side.
- Validate and sanitize prompt input.
- Shape the system prompt so responses remain focused on fashion advice.
- Normalize responses into the Ask CLAi response format.

**Acceptance Criteria**

- The frontend does not expose the Google AI API key.
- Ask CLAi sends prompts to a server-side handler.
- The server-side handler validates prompt input.
- The server-side handler calls Google AI successfully with a fashion-focused prompt.
- The frontend receives a normalized response with a `text` field.
- Provider errors are handled without leaking internal error details to users.
- Server logs include enough detail to debug failed AI requests.

### CLAI-005: Support Image Responses in Ask CLAi

**Type:** Story  
**Priority:** High  
**Estimate:** 5 points  
**Dependencies:** CLAI-004

**Description**

Extend Ask CLAi so Google AI can return relevant images or image references when visual support would improve the fashion recommendation. The frontend should display returned images alongside text advice.

**Implementation Notes**

- Support an optional `images` array in Ask CLAi responses.
- Include image URL, alt text, and optional source metadata.
- Display one or multiple images gracefully.
- Ensure the text response still works when no images are returned.

**Acceptance Criteria**

- Ask CLAi response payload can include an optional `images` array.
- The frontend displays returned images with alt text.
- The frontend handles multiple images without layout issues.
- The frontend still displays useful text responses when no images are returned.
- Broken image URLs or missing images do not break the full Ask CLAi response.
- Images are only shown when they are relevant to the answer.

### CLAI-006: Add Voice Input for Ask CLAi

**Type:** Story  
**Priority:** High  
**Estimate:** 8 points  
**Dependencies:** CLAI-003

**Description**

Add microphone input to Ask CLAi so users can speak their fashion questions. Spoken input should be transcribed into editable text before or during submission.

**Implementation Notes**

- Add start and stop recording controls.
- Use a browser-supported speech recognition or audio transcription approach.
- Display recording state clearly.
- Handle microphone permission denial.
- Allow users to edit transcribed text before sending when possible.

**Acceptance Criteria**

- Users can start voice input from the Ask CLAi UI.
- Users can stop voice input from the Ask CLAi UI.
- The UI clearly indicates when recording is active.
- Spoken input is converted into text.
- Transcribed text can be submitted to Ask CLAi.
- Users can edit transcribed text before submission when practical.
- Permission denial shows a friendly and recoverable error state.
- Unsupported browsers show a clear fallback message and still allow typed prompts.

### CLAI-007: Add Ask CLAi Loading, Error, and Empty States

**Type:** Task  
**Priority:** Medium  
**Estimate:** 3 points  
**Dependencies:** CLAI-003, CLAI-004, CLAI-006

**Description**

Polish the Ask CLAi experience by implementing complete UI states for empty prompts, pending AI responses, provider errors, microphone errors, and successful responses.

**Implementation Notes**

- Add loading indicators for AI requests.
- Disable duplicate submissions while a request is pending.
- Add validation messages.
- Add retry behavior where appropriate.

**Acceptance Criteria**

- Empty Ask CLAi state helps users understand what they can ask.
- Loading state appears after prompt submission.
- Duplicate submissions are prevented while loading.
- AI failure state provides a friendly message and retry path.
- Microphone failure state provides a friendly message and typed fallback.
- Success state displays prompt, text response, and images when available.

## Epic 3: Authentication

### CLAI-008: Set Up Authentication Foundation

**Type:** Story  
**Priority:** High  
**Estimate:** 8 points  
**Dependencies:** None

**Description**

Add the authentication foundation for the landing app. The system should support session management, protected server-side operations, email auth, Google OAuth, logout, and auth-aware navigation.

**Implementation Notes**

- Choose and configure the authentication library.
- Add required environment variables.
- Configure session management.
- Add auth helper utilities for server and client usage.
- Ensure secrets remain server-side.

**Acceptance Criteria**

- Authentication library is installed and configured.
- Session state can be read by server-side code.
- Session state can be reflected in client UI where needed.
- Logout invalidates the user's session.
- Auth-related secrets are read from environment variables.
- Missing auth configuration fails safely with developer-facing diagnostics.

### CLAI-009: Build Signup and Login Pages

**Type:** Story  
**Priority:** High  
**Estimate:** 5 points  
**Dependencies:** CLAI-008

**Description**

Create dedicated signup and login experiences for email-based authentication and Google authentication.

**Implementation Notes**

- Create `/signup` and `/login` routes.
- Add email signup form.
- Add email login form.
- Add Google auth button.
- Support redirects after successful auth.

**Acceptance Criteria**

- Users can open `/signup`.
- Users can open `/login`.
- Users can sign up with email.
- Users can log in with email.
- Users can sign up with Google.
- Users can log in with Google.
- Form validation catches invalid email and missing required fields.
- Auth failures are displayed in a user-friendly way.
- Successful auth redirects users to the intended destination or homepage.

### CLAI-010: Add Email Verification Flow

**Type:** Story  
**Priority:** High  
**Estimate:** 5 points  
**Dependencies:** CLAI-008, CLAI-009

**Description**

Require users who sign up with email to verify their email address before accessing authenticated-only features. The flow should send verification emails and provide a clear confirmation experience.

**Implementation Notes**

- Create `/verify-email` route.
- Send verification email after email signup.
- Add verification token handling.
- Add resend verification email support.
- Block authenticated-only access for unverified email users when applicable.

**Acceptance Criteria**

- Users who sign up with email receive a verification email.
- Verification emails contain a secure verification link or token.
- Users can verify their email through `/verify-email`.
- Verified users can access authenticated-only features.
- Unverified users are prompted to verify before accessing authenticated-only features.
- Users can request a new verification email.
- Expired or invalid verification links show a friendly error.
- Google signup users do not get forced through duplicate email verification when the provider returns a verified email.

### CLAI-011: Add Forgot Password and Reset Password Flow

**Type:** Story  
**Priority:** High  
**Estimate:** 5 points  
**Dependencies:** CLAI-008, CLAI-009

**Description**

Allow users who signed up with email to recover access by requesting a password reset email and setting a new password through a secure reset link.

**Implementation Notes**

- Create `/forgot-password` route.
- Create `/reset-password` route.
- Send reset password email with a secure, time-limited token.
- Validate reset token before allowing password changes.
- Invalidate reset token after use.

**Acceptance Criteria**

- Users can access forgot password from the login page.
- Users can request a password reset by entering their email.
- A password reset email is sent when the email is eligible.
- The UI does not reveal whether an email address exists in the system.
- Users can open a valid reset link and set a new password.
- Used reset tokens cannot be reused.
- Expired or invalid reset links show a friendly error.
- Users are redirected to login with a success state after password reset.

## Epic 4: Mobile App Waitlist

### CLAI-012: Build Dedicated Waitlist Page

**Type:** Story  
**Priority:** High  
**Estimate:** 5 points  
**Dependencies:** CLAI-002

**Description**

Create a dedicated `/waitlist` page for users who want to join the CLAi mobile app waitlist. The page should collect launch-relevant information and feel lightweight, trustworthy, and mobile-friendly.

**Implementation Notes**

- Create `/waitlist` route.
- Add waitlist form fields for name, email, style interest, platform preference, and optional notes.
- Add client-side validation.
- Add success and error states.

**Acceptance Criteria**

- Users can access `/waitlist`.
- Users can enter name and email.
- Users can optionally enter style interest, platform preference, and notes.
- Invalid email addresses are blocked with validation feedback.
- Required missing fields are blocked with validation feedback.
- Successful submission displays a confirmation state.
- Failed submission displays a friendly error state.
- The waitlist page is responsive on mobile and desktop.

### CLAI-013: Integrate Waitlist Submissions with Notion

**Type:** Story  
**Priority:** High  
**Estimate:** 5 points  
**Dependencies:** CLAI-012

**Description**

Connect the waitlist form to Notion so each valid waitlist submission creates a new row in the configured Notion database.

**Implementation Notes**

- Store Notion credentials in `NOTION_API_KEY`.
- Store target database ID in `NOTION_WAITLIST_DATABASE_ID`.
- Create server-side handler for waitlist submissions.
- Map form fields to Notion database properties.
- Avoid exposing Notion credentials to the browser.

**Acceptance Criteria**

- Waitlist submissions are sent to a server-side handler.
- The server-side handler validates submission data.
- Valid submissions create a row in the configured Notion database.
- Notion credentials are never exposed to the frontend.
- Failed Notion requests return a friendly frontend error.
- Server logs include enough detail to debug failed Notion submissions.

### CLAI-014: Add Waitlist Duplicate Submission Handling

**Type:** Task  
**Priority:** Medium  
**Estimate:** 3 points  
**Dependencies:** CLAI-013

**Description**

Reduce accidental duplicate waitlist entries by checking for existing submissions where feasible and by preventing repeated form submissions from the same page interaction.

**Implementation Notes**

- Disable submit while the request is pending.
- Check Notion for existing email entries if practical.
- If Notion lookup is not practical, document the limitation and rely on UI prevention.

**Acceptance Criteria**

- Users cannot submit the waitlist form multiple times while one submission is pending.
- Duplicate email submissions are handled gracefully when detectable.
- The user receives a clear message if their email is already on the waitlist.
- Duplicate handling does not expose private waitlist data.

## Epic 5: Quality, Security, and Release Readiness

### CLAI-015: Add Environment Configuration Documentation

**Type:** Task  
**Priority:** Medium  
**Estimate:** 2 points  
**Dependencies:** CLAI-004, CLAI-008, CLAI-013

**Description**

Document all required environment variables for local development and deployment. This should include Google AI, Notion, Google OAuth, auth secret, auth URL, and email provider configuration.

**Implementation Notes**

- Update project documentation or add an example env file if the repo pattern supports it.
- Include descriptions for each variable.
- Do not commit real secrets.

**Acceptance Criteria**

- Required environment variables are documented.
- Documentation covers Google AI, Notion, Google OAuth, auth, and email provider settings.
- No real secrets are committed.
- Missing required variables produce understandable developer feedback.

### CLAI-016: Add Accessibility and Responsive QA Pass

**Type:** Task  
**Priority:** Medium  
**Estimate:** 3 points  
**Dependencies:** CLAI-001, CLAI-003, CLAI-009, CLAI-012

**Description**

Perform an accessibility and responsive QA pass for the homepage, Ask CLAi, auth pages, and waitlist page.

**Implementation Notes**

- Verify keyboard access for forms, navigation, Ask CLAi controls, and voice controls.
- Verify labels and error messages.
- Verify mobile and desktop layouts.
- Check image alt text.

**Acceptance Criteria**

- All forms have accessible labels.
- Ask CLAi voice controls are keyboard accessible.
- Error messages are readable by assistive technologies.
- Returned images include alt text.
- Text and controls do not overlap at common mobile and desktop widths.
- Primary text and controls have sufficient color contrast.

### CLAI-017: Add End-to-End Smoke Tests for Core Flows

**Type:** Task  
**Priority:** Medium  
**Estimate:** 5 points  
**Dependencies:** CLAI-004, CLAI-009, CLAI-010, CLAI-011, CLAI-013

**Description**

Add smoke test coverage for the most important V1 user journeys so regressions are caught before release.

**Implementation Notes**

- Test homepage navigation.
- Test Ask CLAi typed prompt flow with a mocked Google AI response.
- Test auth page rendering and validation.
- Test email verification and password reset happy paths where practical.
- Test waitlist submission with a mocked Notion response.

**Acceptance Criteria**

- Smoke tests cover homepage navigation.
- Smoke tests cover typed Ask CLAi submission with mocked AI response.
- Smoke tests cover auth form validation.
- Smoke tests cover waitlist form validation.
- Smoke tests cover successful waitlist submission with mocked Notion response.
- Tests can run locally without real Google AI, Notion, or email provider credentials.

### CLAI-018: Prepare V1 Release Checklist

**Type:** Task  
**Priority:** Low  
**Estimate:** 2 points  
**Dependencies:** CLAI-001, CLAI-004, CLAI-009, CLAI-010, CLAI-011, CLAI-013, CLAI-016, CLAI-017

**Description**

Create a final release checklist for the V1 landing page update, covering configuration, manual QA, smoke tests, and known limitations.

**Implementation Notes**

- Include env variable verification.
- Include manual QA checklist for all pages.
- Include provider integration checks.
- Include rollback notes if relevant to deployment platform.

**Acceptance Criteria**

- Release checklist includes all required routes.
- Release checklist includes all required environment variables.
- Release checklist includes manual QA steps for Ask CLAi, auth, email verification, password reset, and waitlist.
- Release checklist includes provider checks for Google AI, Google OAuth, email delivery, and Notion.
- Known limitations and open questions are documented before release.

## Suggested Implementation Order

1. CLAI-001: Refresh Landing Page to Introduce Ask CLAi
2. CLAI-002: Add Navigation and CTA Structure for V1 Routes
3. CLAI-008: Set Up Authentication Foundation
4. CLAI-009: Build Signup and Login Pages
5. CLAI-010: Add Email Verification Flow
6. CLAI-011: Add Forgot Password and Reset Password Flow
7. CLAI-003: Build Ask CLAi Page and Typed Prompt UI
8. CLAI-004: Implement Google AI Server Integration for Ask CLAi
9. CLAI-005: Support Image Responses in Ask CLAi
10. CLAI-006: Add Voice Input for Ask CLAi
11. CLAI-007: Add Ask CLAi Loading, Error, and Empty States
12. CLAI-012: Build Dedicated Waitlist Page
13. CLAI-013: Integrate Waitlist Submissions with Notion
14. CLAI-014: Add Waitlist Duplicate Submission Handling
15. CLAI-015: Add Environment Configuration Documentation
16. CLAI-016: Add Accessibility and Responsive QA Pass
17. CLAI-017: Add End-to-End Smoke Tests for Core Flows
18. CLAI-018: Prepare V1 Release Checklist

## Cross-Cutting Definition of Done

- Code follows existing landing app patterns.
- New routes are reachable from the UI.
- Secrets are only read server-side.
- User-facing errors are friendly and actionable.
- Loading states are implemented for async flows.
- Empty states are implemented where relevant.
- Mobile and desktop layouts are checked.
- Tests or documented manual QA cover changed behavior.
- No real API keys, OAuth secrets, Notion secrets, or email provider secrets are committed.
