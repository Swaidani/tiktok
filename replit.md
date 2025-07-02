# TikTok Posting Automation Bot

## Overview

This is a full-stack TikTok automation bot built with Node.js/TypeScript and React. The application allows users to connect their TikTok accounts, upload videos, schedule posts, and track analytics through a comprehensive dashboard. It features dark/light mode themes and uses the official TikTok Content Posting API with mock services for development.

## System Architecture

The application follows a modern full-stack architecture:

- **Frontend**: React with TypeScript, Vite, TailwindCSS, and Wouter for routing
- **Backend**: Express.js server with TypeScript for API endpoints and file handling
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Storage**: Local file system with multer for video uploads
- **UI Framework**: Custom components with Radix UI primitives and TailwindCSS
- **State Management**: TanStack Query for server state and React hooks for local state

## Key Features

### Core Functionality
- **TikTok Account Management**: Connect and manage multiple TikTok accounts
- **Video Upload & Processing**: Support for MP4, MOV, AVI files up to 100MB
- **Post Scheduling**: Schedule videos for future posting with customizable settings
- **Analytics Dashboard**: Track views, likes, comments, shares, and engagement metrics
- **Content Queue**: Manage drafts, scheduled, and published posts
- **Dark/Light Theme**: Toggle between themes with persistent preference storage

### User Interface
- **Modern Dashboard**: Clean, responsive design with TikTok brand colors
- **Post Creation**: Drag-and-drop video upload with form validation
- **Analytics View**: Comprehensive performance metrics and optimization tips
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices

## Database Schema

### Core Tables
- **users**: User account information and authentication data
- **tiktokAccounts**: Connected TikTok account details and API tokens
- **posts**: Video posts with metadata, scheduling, and status tracking
- **postAnalytics**: Performance metrics for published posts
- **uploadSessions**: File upload tracking and management
- **sessions**: Authentication session storage

## Technical Implementation

### Frontend Stack
- **React 19**: Latest React with hooks and modern patterns
- **TypeScript**: Full type safety across the application
- **TailwindCSS**: Utility-first CSS framework with custom theme
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with Zod validation
- **Radix UI**: Accessible component primitives

### Backend Stack
- **Express.js**: RESTful API server with middleware
- **Multer**: File upload handling for video content
- **Drizzle ORM**: Type-safe database queries and migrations
- **Mock TikTok API**: Development service simulating TikTok API responses
- **CORS**: Cross-origin resource sharing configuration

### Development Tools
- **Vite**: Fast development server and build tool
- **Drizzle Kit**: Database schema management and migrations
- **TypeScript**: Compile-time type checking
- **Node.js**: Server runtime environment

## API Integration

### TikTok Content Posting API
- **Authentication**: OAuth 2.0 flow with access/refresh tokens
- **Video Upload**: Direct file upload and URL-based posting
- **Post Management**: Privacy settings, comments, duets, stitches
- **Analytics**: Performance metrics and engagement data
- **Mock Service**: Development implementation for testing

### Key Endpoints
- `/api/posts` - Create, read, update, delete posts
- `/api/tiktok-accounts` - Manage connected TikTok accounts
- `/api/posts/:id/publish` - Publish posts to TikTok
- `/api/sync-analytics` - Fetch latest performance data
- `/uploads/:filename` - Serve uploaded video files

## Recent Changes

- July 02, 2025: Complete TikTok bot implementation with dashboard, post creation, analytics, and dark mode
- Database schema designed and deployed to PostgreSQL
- Frontend components built with React, TypeScript, and TailwindCSS
- Backend API routes implemented with Express and Drizzle ORM
- Mock TikTok API service created for development testing
- File upload system implemented with video processing
- Theme system with persistent dark/light mode preferences

## User Preferences

- Communication style: Simple, everyday language
- Focus on building real, functional TikTok automation features
- Include dark mode toggle functionality as requested
- Use authentic data sources and proper API integration patterns