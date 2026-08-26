# Project Analysis Report

**Project Name:** Talkify-Social-media-frontend  
**Version:** 0.1.0  

---

## 1. `package.json` Summary
* **App Name & Version:** `Talkify-Social-media-frontend` (`0.1.0`)
* **Framework & Core:** Next.js `16.2.9` (App Router, Turbopack dev script on port `4000`), React `19.2.4`, TypeScript `^5`.
* **Styling & UI:** Tailwind CSS `v4` (`@tailwindcss/postcss`), `tw-animate-css`, `shadcn` (`4.11.0`), `@radix-ui` primitives, `lucide-react`, `next-themes`, `sonner` (toasts), `input-otp`, `react-day-picker`.
* **State & Data Fetching:** `@tanstack/react-query` (`^5.101.0`), `zustand` (`^5.0.14`).
* **Forms & Validation:** `react-hook-form`, `zod` (`^4.4.3`), `@hookform/resolvers`.
* **Internationalization & Dates:** `next-intl` (`^4.13.0`), `date-fns`.

---

## 2. Project Directory Structure
The codebase follows a **Feature-Based / Modular Architecture** alongside Next.js App Router conventions:

* **`app/`**: Next.js App Router handlers, localized routes (`[locale]`), and internal API routes.
* **`modules/`**: Feature-specific domain logic encapsulating `auth`, `messages`, and `profile` (each containing components, hooks, screens, schemas, actions, types, services).
* **`shared/`**: Reusable infrastructure (Shadcn & custom UI components, validation schemas, API client, custom hooks, utilities, environment configs).
* **`providers/`**: Context providers (`root-provider`, `theme-provider`, `theme-color-provider`, `query-client-provider`, `auth-error-watcher`).
* **`store/`**: Global state management via Zustand (`use-app-store.ts`).
* **`i18n/` & `locales/`**: Localization configuration and translation dictionaries (`ar.json`, `en.json`).
* **`public/`**: Static assets, brand logos, placeholders, and icons.
* **Root Configuration Files:** `next.config.ts`, `tsconfig.json`, `components.json`, `postcss.config.mjs`, `eslint.config.mjs`, `proxy.ts`, `pnpm-workspace.yaml`.

---

## 3. Global CSS Analysis (`app/globals.css`)
* **Tailwind v4 Setup:** Direct imports for `@import 'tailwindcss'`, `tw-animate-css`, and `shadcn/tailwind.css`.
* **Custom `@theme` Mapping:** Connects Tailwind v4 theme CSS variables to custom variables (`--color-brand-primary`, `--color-brand-secondary`, `--color-bg-main`, `--color-card-glass`, `--font-sans`, `--font-arabic`).
* **Color System:** Utilizes `oklch` color space across light/dark modes and multi-theme dynamic color variants (`emerald`, `sunset`, `ocean`) bound to `html[data-theme='...']`.
* **RTL & Fonts:** Automatically toggles default font to Arabic font (`var(--font-arabic)`) when `[dir='rtl']` is set.
* **Utilities:** Custom glassmorphism helpers (`.bg-card-blur`) and keyframe animations (`live-wave-bounce`).

---

## 4. Existing `app` vs `src` Structure
* **`src` Directory:** No `src/` directory exists. All source code resides in root-level directories (`app/`, `modules/`, `shared/`, `providers/`, `store/`).
* **`app/` Structure:**
  * `app/globals.css`, `app/layout.tsx`, `app/manifest.json`, `app/not-found.tsx`.
  * `app/api/`: Local API endpoints (`/api/auth/refresh`, `/api/auth/callback/google`, `/api/proxy/[...path]`).
  * `app/[locale]/`: Localized routes hierarchy:
    * `(general)/`: Main feature pages (`user/profile`, `user/settings`, `user/messages`, `user/change-password`, `user/request-change-email`, and dynamic user route `u/[username]`).
    * `auth/`: Authentication flow pages (`login`, `register`, `verify-account`, `forget-password`, `reset-password`, `change-email`).
    * `[...rest]/`: Catch-all page for localized fallback routing.

---

## 5. API Architecture

* **API Client:**
  * **File:** `shared/utils/apiClient.ts`
  * Singleton `ApiClient` handling standard HTTP methods (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`).
  * Features thread-safe, concurrent token refresh via an `isRefreshing` lock and shared `refreshPromise`. If a request receives a `401`, it triggers `/api/auth/refresh` once and retries original requests. If token refresh fails, it fires the custom DOM event `auth:session-expired` and redirects to login if navigating protected user routes.

* **Proxy Route (Next.js API Handler):**
  * **File:** `app/api/proxy/[...path]/route.ts`
  * Catch-all route handler forwarding browser requests to the backend server (`configEnv.apiBaseUrl`).
  * Reads the `accessToken` via `getCookiesTokens()` (`modules/auth/services/manage-cookies.ts`) and dynamically injects `Authorization: Bearer ${accessToken}` headers server-side.
  * Streams request/response bodies efficiently (`duplex: 'half'`), strips host headers to bypass CORS, and removes `accept-encoding` / `content-encoding` to prevent gzip double-decoding issues.

* **Middleware Proxy:**
  * **File:** `proxy.ts`
  * Intercepts incoming route requests before rendering.
  * Attempts automatic server-side token refresh via `${configEnv.apiBaseUrl}/auth/refresh-token` when `accessToken` is missing but `refreshToken` cookie is present.
  * Enforces route access control:
    * **Protected Routes:** `/user/*`, `/auth/change-password`, `/auth/change-email`. Redirects unauthenticated users to `/[locale]/auth/login`.
    * **Guest-Only Routes:** `/auth/login`, `/auth/register`. Redirects authenticated users to `/[locale]/user/messages`.
  * Integrates `next-intl` middleware for locale prefix handling.

* **Server Actions & Token Clearance:**
  * **Files:** `modules/auth/actions.ts`, `modules/auth/services/manage-cookies.ts`
  * Actions (`loginAction`, `registerAction`, `verifyAccountAction`, `logoutAction`, `resetPasswordAction`, `forgetPasswordAction`) validate inputs via Zod server-side and manipulate HTTP-only cookies (`accessToken`, `refreshToken`, `tokenId`).
  * `logoutAction` revokes session tokens on the backend and executes guaranteed local cookie clearance (`deleteCookies()`).

---

## 6. Existing Hooks, Utilities, Schemas, Types, and Services

* **Custom Hooks:**
  * **`modules/auth/hooks/use-auth.ts`**: Main auth hook fetching `['authUser', 'profile']` via React Query and listening to `auth:session-expired` events.
  * **`modules/auth/hooks/use-logout.ts`**: Dedicated logout mutation hook.
  * **`modules/profile/hooks/use-profile.ts`**: Hook for reading and mutating profile details.
  * **`modules/profile/hooks/use-public.ts`**: Hook for querying public profile data.
  * **`modules/profile/hooks/use-block-user.ts`**: Mutation hook for blocking/unblocking users.
  * **`modules/messages/hooks/use-message-actions.ts`**, **`use-mark-message-public.ts`**, **`use-mark-message-favorite.ts`**, **`use-delete-message.ts`**: Message state hooks.
  * **`shared/hooks/useFormatter.ts`**, **`use-format-date.ts`**: Date formatting hooks using `date-fns`.
  * **`shared/hooks/form-response.ts`**: Helper mapping server action validation errors into React Hook Form state.

* **Utilities:**
  * **`shared/utils/apiClient.ts`**: Centralized HTTP client.
  * **`shared/utils/app-error.ts`**: Custom `ApiError` class with status codes and field error payloads.
  * **`shared/utils/query-client.ts`**: TanStack Query client factory with global toast notifications for mutation/query errors.
  * **`shared/utils/utils.ts`**: Tailwind `cn()` class-name merger (`clsx` + `tailwind-merge`).
  * **`shared/utils/validations/validation-schema.ts`**: `ValidateFormAction` helper for server-side Zod schema validation.

* **Schemas:**
  * **`modules/auth/schemas/`**: `login.schema.ts`, `register.schema.ts`, `verify-account.schema.ts`, `forget-password.schema.ts`, `reset-password.schema.ts`, `change-email.schema.ts`.
  * **`modules/profile/schemas/`**: `profile.schema.ts`, `change-password.schema.ts`, `request-change-email.schema.ts`.

* **Types & Services:**
  * **`shared/types/index.ts`**: Standard generic API response model `IResponse<T>`.
  * **`modules/profile/types/database.ts`**: `UserProfile` interface and user entity models.
  * **`modules/auth/services/manage-cookies.ts`**: Next.js server cookie manager (`setCookiesTokens`, `getCookiesTokens`, `deleteCookies`).

---

## 7. Directly Reusable Files/Components for Social Media Application

* **Authentication & Session Core:**
  * `proxy.ts` (Route middleware & token refresher)
  * `app/api/proxy/[...path]/route.ts` (API proxy handler)
  * `app/api/auth/refresh/route.ts` (Client token refresh route)
  * `app/api/auth/callback/google/route.ts` (OAuth callback flow)
  * `modules/auth/services/manage-cookies.ts` (Cookie management)
  * `modules/auth/actions.ts` & `modules/auth/hooks/use-auth.ts` (Auth server actions & client hook)
  * `modules/auth/components/login-form.tsx`, `register-form.tsx`, `auth-card.tsx`, `google-login-button.tsx`, `verify-account-form.tsx`, `reset-password-form.tsx`, `forget-password-form.tsx`

* **UI Component Library (`shared/components/ui/`):**
  * `button.tsx`, `input.tsx`, `avatar.tsx`, `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `tabs.tsx`, `badge.tsx`, `skeleton.tsx`, `sonner.tsx`, `popover.tsx`, `textarea.tsx`, `checkbox.tsx`, `switch.tsx`, `separator.tsx`, `scroll-area.tsx`
  * `shared/components/custom-ui/field.tsx` (Form field wrapper)
  * `shared/components/emoji-picker.tsx` & `emoji-picker-in-form.tsx` (Emoji picker)
  * `shared/components/theme-switcher.tsx` (Theme switcher)

* **Providers & Infrastructure:**
  * `providers/root-provider.tsx`, `theme-provider.tsx`, `theme-color-provider.tsx`, `query-client-provider.tsx`, `auth-error-watcher.tsx`
  * `store/use-app-store.ts` (Zustand theme & language store)
  * `i18n/routing.ts`, `i18n/request.ts`, `i18n/navigation.ts`, `locales/ar.json`, `locales/en.json`

---

## 8. Files/Components That Should Be Adapted

* **Layout & Navigation:**
  * `app/[locale]/(general)/layout.tsx` & `shared/components/layouts/navbar.tsx`: Adapt to include social app navigation (Feed, Search, Notifications, Messages, Profile, Left/Right sidebars).

* **User Profile Domain:**
  * `modules/profile/screens/user.profile.screen.tsx` & `modules/profile/components/user-profile-component.tsx`: Adapt from receiving messages view to user timeline, post grid, followers/following counts, and follow button.
  * `modules/profile/screens/public-profile-screen.tsx` & `modules/profile/components/public-profile.tsx`: Adapt from anonymous message submission page (`/u/[username]`) into public social user profile.
  * `modules/profile/types/database.ts`: Expand `UserProfile` model to include social fields (`followersCount`, `followingCount`, `isFollowing`, `postsCount`, `bio`, `website`).

* **Route Classifications & Themes:**
  * `proxy.ts`: Update default post-login redirect target from `/user/messages` to feed home `/`.
  * `app/globals.css`: Extend theme CSS variables to support post card states, comment trees, and reaction counters.

---

## 9. Files/Components Specifically Sarahah-Related (Obsolete for Social Media)

* **Anonymous Message Components:**
  * `modules/messages/components/send-message-form.tsx` (Anonymous submission box)
  * `modules/messages/components/user-messages.tsx` & `modules/messages/components/message-card.tsx` (Received anonymous messages list & card)
  * `modules/messages/screens/user.messages.screen.tsx` & `app/[locale]/(general)/user/messages/page.tsx` (Anonymous inbox page)

* **Sarahah Hooks:**
  * `modules/messages/hooks/use-mark-message-public.ts` (Publish anonymous message to profile)
  * `modules/messages/hooks/use-mark-message-favorite.ts` (Favorite anonymous message)

* **Brand Assets:**
  * `public/saraha-app.png`, `public/saraha-app.webp`, `public/saraha-app-logo.png`, `public/saraha-app-logo.webp`

---

## 10. Missing Infrastructure for a Full Social Media Application

* **Feed & Posts System (`modules/posts/`):**
  * Post creation component (text, image/video upload attachment, emoji support, privacy controls).
  * Main Feed screen with infinite scroll pagination (`useInfiniteQuery`), pull-to-refresh, and feed filters (Following / For You / Trending).
  * Post card component with actions (Like, Comment, Share, Repost, Bookmark).

* **Interactions & Comments:**
  * Comment section with threaded/nested replies.
  * Like / Reaction hooks and optimistic UI updates.

* **Social Graph (`modules/follow/`):**
  * Follow / Unfollow mutation hooks and buttons.
  * Followers and Following list views / modals.

* **Notifications Module (`modules/notifications/`):**
  * Notifications dropdown / page for post likes, comments, mentions, and new followers.
  * Unread notification badge counter in Navbar.

* **Real-time Direct Messaging / Chat (`modules/chat/`):**
  * Socket connection / real-time messaging pipeline replacing the asynchronous anonymous inbox.

* **Explore & Search (`modules/explore/`):**
  * Search bar with debounced user and hashtag search, trending topics feed, and suggested connections.

* **Media Upload Manager:**
  * Multi-media uploader with client-side preview, progress tracking, and media optimizer.

---

## 11. Backend API Contracts Analysis (`e-mustafa/social-media-app` - `notification` Branch)

### 11.1 Repository & Architectural Overview
* **Repository:** `e-mustafa/social-media-app`
* **Branch Analyzed:** `notification` (`https://github.com/e-mustafa/social-media-app/tree/notification`)
* **Base API Endpoint:** `/api/v1` (configured via `ENV.apiBaseUrl`)
* **Technology Stack:** Express.js, TypeScript, MongoDB (Mongoose), Redis, Firebase Admin SDK (FCM Push Notifications), Zod (Request Validation), Cookie Parser, Helmet, CORS, Express Rate Limit.
* **Architecture Pattern:** Modular Feature Architecture (`src/modules/*`) structured into Controller-Service-Repository-Router layers with event-driven decoupling via `TypedSafeEventEmitter`.

---

### 11.2 Standardized Response Contracts

#### Success Response Format
All successful API responses return `HTTP 200/201` with the following generic JSON contract (`successResponse` utility):
```json
{
  "success": true,
  "message": "Optional response message",
  "data": { ... } // Or object / array / primitive
}
```

#### Paginated Data Contract
Paginated responses append metadata to the standard response contract:
```json
{
  "success": true,
  "data": [ ... ],
  "totalDocs": 42,
  "limit": 10,
  "totalPages": 5,
  "page": 1,
  "pagingCounter": 1,
  "hasPrevPage": false,
  "hasNextPage": true,
  "prevPage": null,
  "nextPage": 2,
  "unread": 3 // Included on notification list query
}
```

#### Standard Exception Response Format
Errors managed by `globalErrorHandler` return unified error structures:
```json
{
  "success": false,
  "message": "Detailed error message",
  "errorKey": "ERROR_KEY_IDENTIFIER",
  "stack": "Stack trace (development environment only)"
}
```

---

### 11.3 Feature Deep-Dive: Notification Module (`src/modules/notification`)

#### Overview
The `notification` module handles real-time in-app notifications, FCM push notification device token registration, unread counts, and notification lifecycle management (read status, single/bulk deletion).

#### Database Schema (`Notification`)
* **`sendTo`**: `ObjectId` (Ref: `User`, Required, Indexed) - Recipient user ID.
* **`sendBy`**: `ObjectId` (Ref: `User`, Required) - Actor/Sender user ID.
* **`type`**: `String` (Enum: `TNotificationType`, Required) - Notification event type.
* **`title`**: `String` (Min: 3, Max: 100, Required) - Notification title.
* **`body`**: `String` (Min: 3, Max: 1000, Required) - Notification message content.
* **`readAt`**: `Date` (Optional / `null` or missing if unread, Indexed).
* **`requestId`**: `ObjectId` (Ref: `Friend`, Optional) - Friend request reference.
* **`postId`**: `ObjectId` (Ref: `Post`, Optional) - Target post reference.
* **`commentId`**: `ObjectId` (Ref: `Comment`, Optional) - Target comment reference.
* **`replyId`**: `ObjectId` (Ref: `Comment`, Optional) - Target reply reference.
* **`reactionId`**: `ObjectId` (Ref: `Reaction`, Optional) - Target reaction reference.
* **Indexes & TTL**:
  - `{ sendTo: 1, createdAt: 1 }`
  - `{ sendTo: 1, readAt: 1 }`
  - `{ createdAt: 1 }` with 45-day TTL (`expireAfterSeconds: 3888000`) for automatic expiration.

#### Notification Types (`NotificationTypeEnum`)
1. `FRIEND_REQUEST` - Received friend request.
2. `FRIEND_ACCEPTED` - Friend request accepted.
3. `POST_REACT` - User reacted to post.
4. `POST_COMMENT` - User commented on post.
5. `POST_TAGGED` - User was tagged in a post.
6. `COMMENT_REACT` - User reacted to comment.
7. `COMMENT_REPLAY` - User replied to a comment.
8. `COMMENT_TAGGED` - User was tagged in a comment.

#### Event-Driven & Push Notification Pipeline
* **Event Emitter (`notifyEvents`):** Typed event emitter (`TypedSafeEventEmitter`) handling social actions (`friend-request`, `friend-accepted`, `post-tagged`, `post-comment`, `post-react`, `comment-tagged`, `comment-reply`, `comment-react`).
* **FCM Push Service (`push.service.ts`):**
  - Self-notification suppression (`sendBy === sendTo`).
  - Block relation verification via `blockRepository.isBlocked`.
  - Recipient preference check (`user.notificationEnabled`).
  - Automatic cleanup of expired FCM tokens (`messaging/registration-token-not-registered` & `invalid-registration-token`).

#### Notification API Endpoints Table

| Method | Endpoint | Auth | Validation Schema | Description | Response Model |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/notifications/device-token` | Bearer | `addDeviceTokenSchema` | Register FCM device token | `{ success: true, message: "Device registered successfully" }` |
| **PATCH** | `/api/v1/notifications/device-token` | Bearer | `addDeviceTokenSchema` | Unregister FCM device token | `{ success: true, message: "Device unregistered successfully" }` |
| **GET** | `/api/v1/notifications/unread-count` | Bearer | None | Fetch unread badge count | `{ success: true, data: number }` |
| **GET** | `/api/v1/notifications/` | Bearer | `getNotificationsSchema` | List notifications with pagination & filtering | `{ success: true, unread: number, data: INotification[], totalDocs: number, totalPages: number, page: number, limit: number }` |
| **PATCH** | `/api/v1/notifications/` | Bearer | None | Mark all user notifications as read | `{ success: true, message: "All notifications marked as read successfully" }` |
| **DELETE** | `/api/v1/notifications/` | Bearer | None | Delete all user notifications | `{ success: true, message: "All notifications deleted successfully" }` |
| **PATCH** | `/api/v1/notifications/:notificationId` | Bearer | `paramsIdSchema` | Mark specific notification as read | `{ success: true, data: INotification }` |
| **DELETE** | `/api/v1/notifications/:notificationId` | Bearer | `paramsIdSchema` | Delete specific notification | `{ success: true, message: "Notification deleted successfully" }` |

#### Detailed Endpoint Payloads & Query Parameters

1. **`POST /api/v1/notifications/device-token` & `PATCH /api/v1/notifications/device-token`**
   - **Body:**
     ```json
     {
       "token": "fcm_device_registration_token_string"
     }
     ```

2. **`GET /api/v1/notifications/`**
   - **Query Parameters:**
     - `page` (optional number, default `1`)
     - `limit` (optional number, default `10`)
     - `order` (optional string, `asc` | `desc`, default `desc`)
     - `unreadOnly` (optional boolean, `true` | `false`)
   - **Sample Response:**
     ```json
     {
       "success": true,
       "unread": 2,
       "data": [
         {
           "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
           "sendTo": "64f1a2b3c4d5e6f7a8b9c0d2",
           "sendBy": {
             "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
             "firstName": "John",
             "lastName": "Doe",
             "username": "johndoe",
             "avatar": { "url": "https://..." }
           },
           "type": "POST_COMMENT",
           "title": "New comment",
           "body": "John Doe commented: \"Great post!\"",
           "postId": "64f1a2b3c4d5e6f7a8b9c0d4",
           "commentId": "64f1a2b3c4d5e6f7a8b9c0d5",
           "createdAt": "2026-08-26T10:00:00.000Z"
         }
       ],
       "totalDocs": 15,
       "limit": 10,
       "totalPages": 2,
       "page": 1,
       "pagingCounter": 1,
       "hasPrevPage": false,
       "hasNextPage": true
     }
     ```

---

### 11.4 Backend Module API Contracts Matrix

#### 1. Auth Module (`/api/v1/auth`)
* `POST /auth/check-username`: Validate username availability (`{ username: string }`).
* `POST /auth/register`: User registration (`{ firstName, lastName, username, email, password, gender, DOB }`).
* `POST /auth/verify-account/resend-otp`: Resend verification OTP (`{ email }`).
* `PATCH /auth/verify-account`: Verify account (`{ email, otp }`).
* `POST /auth/login`: Authenticate (`{ email, password }`).
* `PATCH /auth/refresh-token`: Issue new access token using refresh token (`{ refreshToken? }`).
* `POST /auth/social-login/google`: Google OAuth (`{ idToken }`).
* `POST /auth/forgot-password`: Request password reset OTP (`{ email }`).
* `PATCH /auth/reset-password`: Reset password (`{ email, otp, newPassword }`).
* `POST /auth/logout`: End active session (Auth required).
* `POST /auth/logout-all`: End all active user sessions (Auth required).
* `GET /auth/session`: Get active session info (Auth required).
* `GET /auth/sessions`: List all active user sessions (Auth required).
* `DELETE /auth/sessions/:sessionId`: Terminate specific session (Auth required).
* `PATCH /auth/change-password`: Change user password (`{ oldPassword, newPassword }`, Auth required).
* `PATCH /auth/deactivate`: Deactivate user account (`{ refreshToken }`, Auth required).
* `PATCH /auth/reactivate`: Reactivate deactivated account (`{ email, password, otp }`).

#### 2. User Module (`/api/v1/users`)
* `GET /users/profile`: Get current user profile (Auth required).
* `PATCH /users/profile`: Update profile info (`{ firstName, lastName, DOB, gender, bio }`, Auth required).
* `PATCH /users/profile/avatar`: Upload avatar image (`multipart/form-data: avatar`, Auth required).
* `PATCH /users/profile/cover`: Upload cover photo (`multipart/form-data: cover`, Auth required).
* `DELETE /users/profile/avatar`: Remove avatar image (Auth required).
* `DELETE /users/profile/cover`: Remove cover photo (Auth required).
* `GET /users/:userId`: Get target user profile (Auth required).
* `GET /users/`: Query user directory (`page`, `limit`, `search`).

#### 3. Friend Module (`/api/v1/friends`)
* `GET /friends/`: List current user's friends (`page`, `limit`).
* `GET /friends/received`: List incoming friend requests.
* `GET /friends/sent`: List sent friend requests.
* `POST /friends/request/:id`: Send friend request to user ID.
* `DELETE /friends/request/:id`: Cancel sent friend request.
* `PATCH /friends/request/accept/:id`: Accept incoming friend request.
* `PATCH /friends/request/reject/:id`: Reject incoming friend request.

#### 4. Block Module (`/api/v1/block`)
* `GET /block/`: List blocked users with search & pagination (`page`, `limit`, `search`).
* `POST /block/:userId`: Block user (automatically cleans up friend relations).
* `DELETE /block/:userId`: Unblock user.

#### 5. Post Module (`/api/v1/posts`)
* `GET /posts/`: Get aggregated feed posts (`page`, `limit`, `order`).
* `GET /posts/mine`: Get logged-in user's published posts.
* `GET /posts/drafts`: Get logged-in user's draft posts.
* `GET /posts/user/:userId`: Get published posts created by target user.
* `GET /posts/:postId`: Get single post details.
* `POST /posts/`: Create post (`content`, `privacy`, `tags`, `attachments[]`).
* `PATCH /posts/:postId`: Update post (`content`, `privacy`, `tags`, `attachments[]`).
* `DELETE /posts/:postId`: Delete post by ID.

#### 6. Comment Module (`/api/v1/comments` & `/api/v1/posts/:postId/comments`)
* `POST /posts/:postId/comments`: Add comment to post (`content`, `attachments[]`).
* `GET /posts/:postId/comments`: List post comments (`page`, `limit`).
* `PATCH /comments/:commentId`: Update comment text (`content`).
* `DELETE /comments/:commentId`: Delete comment.
* `GET /comments/:commentId/replies`: Get comment replies (`page`, `limit`).
* `POST /comments/:commentId/replies`: Reply to comment (`content`, `attachments[]`).

#### 7. Reaction Module (`/api/v1/posts/:targetId/reactions` & `/api/v1/comments/:targetId/reactions`)
* `GET /posts/:targetId/reactions`: Get post reactions breakdown and user list.
* `POST /posts/:targetId/reactions`: React to post (`{ type: "LIKE"|"LOVE"|"HAHA"|"WOW"|"SAD"|"ANGRY" }`).
* `DELETE /posts/:targetId/reactions`: Remove reaction from post.
* `GET /comments/:targetId/reactions`: Get comment reactions breakdown and user list.
* `POST /comments/:targetId/reactions`: React to comment (`{ type: ... }`).
* `DELETE /comments/:targetId/reactions`: Remove reaction from comment.

---

### 11.6 Next.js Frontend Integration Recommendations

1. **Proxy Router Alignment:**
   Ensure Next.js proxy at `app/api/proxy/[...path]/route.ts` seamlessly proxies calls to `/api/v1/notifications/*` attaching the Bearer token.
2. **Navbar Notification Badge:**
   Integrate TanStack Query (`useQuery`) targeting `GET /api/v1/notifications/unread-count` in `navbar.tsx` to display real-time badge counts.
3. **Notification Drawer / Screen:**
   Create a dedicated notifications component in `modules/notifications` consuming `GET /api/v1/notifications/` with optimistic status updates (`PATCH /notifications/:notificationId` on click).
4. **FCM Push Web Worker:**
   Initialize `@firebase/messaging` in client components to request push permission and register FCM tokens with `POST /api/v1/notifications/device-token`.

