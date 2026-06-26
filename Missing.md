# ChatHub – Remaining Work

## 1. Critical Missing Functionality

- [x] Message History Retrieval
- [x] Read Status / Marking as Read: `last_read_at` column exists but no endpoint to update it — `unreadCount` will never decrease
- [x] conversation request listing
- [ ] Testing Suite: Zero tests (unit, integration, E2E) — crucial for WebSocket events and race conditions

## 2. High-Priority Chat Features

- [ ] Presence (Online/Offline Status): WebSocket connections tracked internally but not broadcasted — users can't see who's online or "Last Seen"
- [ ] Typing Indicators: No "User is typing..." event logic
- [x] Pagination: `conversationListService` fetches all conversations at once
- [ ] User Profile Management: No endpoint to update name or `imageUrl`

## 3. Polish & Advanced Features

- [ ] Media & File Attachments: Messages restricted to plain text
- [ ] Message Reactions & Replies: Data model doesn't support emoji reactions or threading
- [ ] Search: No message search or user discovery
- [ ] Push Notifications: FCM integration(sending notification and firebase integration in backend is pending)
    - [x] Databse migrations to store fcm tokens
    - [x] Create endpoint to store fcm tokens
    - [ ] integrate firebase messaging in backend
    - [ ] create a notification queue in a different process to ensure main application is always available

- [ ] Soft Deletes UI: `isDeleted` exists in schema but no "This message was deleted" placeholder logic in API response

## 4. Technical Debt & Infrastructure

- [ ] API Documentation: No Swagger / OpenAPI spec
- [ ] Rate Limiting: API open to abuse (e.g. spamming `sendMessage`)
- [x] Logout / Session Revocation: JWT logout and refresh token handling

## 5. Flutter (mobile & web)

- [x] Setup routing and api requests
- [x] Setup authentication for the app
- [x] Create Login and registration screen
- [x] setup Firebase messaging and crashlytics
- [x] setup web socket
- [ ] create conversation list screen
- [ ] create message screen
- [ ] create user settings screen
- [ ] create profile screen
- [ ] create conversation details screen
- [ ] create conversation requests screen with approve/reject functionality
