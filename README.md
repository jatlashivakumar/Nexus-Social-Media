# Nexus

A modern full-stack social media platform built using the MERN stack.

## Features

* User Authentication (JWT)
* Google OAuth Login
* User Profiles
* Create, Edit and Delete Posts
* Like and Save Posts
* Comments and Replies
* Real-Time Chat using Socket.IO
* Notifications System
* Explore Page
* Search Users and Posts
* Dark / Light Theme
* Responsive Design
* Error Boundary Handling
* Protected Routes
* Role-Based Features
* Premium Plan UI
* Cloudinary Media Uploads

## Tech Stack

### Frontend

* React.js
* Redux Toolkit
* React Router
* React Query
* Tailwind CSS
* Framer Motion
* Socket.IO Client

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Passport Google OAuth
* Socket.IO
* Cloudinary

## Installation

### Client

```bash
cd client
npm install
npm run dev
```

### Server

```bash
cd server
npm install
npm run dev
```

## Environment Variables

Create `.env` files for both client and server.

### Client

```env
VITE_API_URL=/api
VITE_SOCKET_URL=
VITE_APP_NAME=Nexus
```

### Server

```env
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```


## Author

Shivakumar Jatla
