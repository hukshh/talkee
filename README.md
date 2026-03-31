# Real-Time Messaging App Setup Guide

This project is a real-time messaging web application built with Next.js, Clerk, Convex, and Tailwind CSS.

## 1. Prerequisites
- Node.js 18.x or later
- npm installed

## 2. Environment Variables Setup

You will need accounts for both [Clerk](https://clerk.com/) (for authentication) and [Convex](https://convex.dev/) (for real-time database).

Create a `.env.local` file in the root of your project (`messenger-1/.env.local`):

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Convex Database (these will be populated automatically when you run 'npx convex dev')
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

### Getting Clerk Keys
1. Go to your Clerk dashboard and create a new application.
2. Select **Email**, **Password**, and any social providers you prefer.
3. Copy the **Publishable Key** and **Secret Key** into `.env.local`.

### Getting Convex Keys
1. Run `npx convex dev` in your terminal.
2. Follow the prompts to log in via GitHub/browser and create a new project.
3. This command will automatically configure `.env.local` with your Convex Deployment and URL variables, and push your schema to the Convex dashboard.
4. Keep the `npx convex dev` terminal open—it syncs changes in real-time.

## 3. Running the Application

Once your `.env.local` is fully populated:

1. In a new terminal tab, run the Next.js development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. You should see the login screen. Sign up with a new account.
4. Your account will automatically sync into the Convex `users` database.
5. You can open a second Incognito window, create another account, and start chatting between them in real time!

## 4. Key Features Implemented
- **Real-Time Database**: Instant messaging using Convex's WebSocket subscriptions.
- **Authentication**: Clerk handles sessions, passwords, and security smoothly.
- **Presence Tracking**: Green "Online" indicator tracks when a user's tab is active versus hidden.
- **Typing Indicators**: Live "typing..." text appears globally when users are typing in a conversation.
- **Message Badges**: Unread message counts appear in the sidebar and disappear when the chat opens.
- **Auto-scroll**: Smart auto-scroll down to see new messages, with a floating "⬇ Arrow" if you manually scroll up to read history.
- **Soft Delete**: Users can delete their own messages, converting them to generic text without deleting the database record.
