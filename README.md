# WatchWise - Backend

Welcome to the **WatchWise** backend! This is a robust, scalable server built with **Node.js** and **Express**, serving as the powerhouse for discovering, tracking, and comparing movies and anime.

## 🚀 Technologies Used

This project utilizes a modern backend stack to ensure security, performance, and reliability:

- **Node.js & Express:** The foundation of the server, providing a fast and minimalist web framework.
- **MongoDB & Mongoose:** A NoSQL database used for storing user data, watchlists, reviews, and analytics with an elegant schema-based solution.
- **JSON Web Token (JWT):** For secure, stateless authentication and session management.
- **BcryptJS:** Handles secure password hashing to protect user credentials.
- **Axios:** Used for communicating with external media APIs (TMDB & Jikan) via a proxy architecture.
- **Nodemailer:** Integrated for sending OTPs and password reset emails.
- **Express Rate Limit:** Protects the API from brute-force attacks and abuse.
- **Cookie-Parser:** Manages secure, HttpOnly cookies for session storage.
- **Cors:** Configured to allow secure communication with the frontend application.

---

## 📁 Project Structure

The backend follows a clean, modular structure for better maintainability:

```text
Bk/
├── controllers/      # Business logic for each feature
├── middleware/       # Custom middleware (Auth, Validation)
├── model/           # Mongoose schemas and database models
├── routes/          # Express router definitions
├── utils/           # Utility functions (Email service, helpers)
├── db.js            # MongoDB connection configuration
├── server.js        # Application entry point and middleware setup
└── .env             # Environment variables (Secrets)
```

---

## 🏗️ Architecture & Patterns

### 1. Proxy API Pattern
The backend acts as a specialized proxy for external media services:
- **TMDB (Movies):** Fetches comprehensive movie data, including details, genres, and recommendations.
- **Jikan/MyAnimeList (Anime):** Fetches anime data with strict rate-limiting management to respect external API constraints.
- **Unified Interface:** Provides a consistent API structure for the frontend, regardless of the data source.

### 2. Intelligent Caching & Reliability
To optimize performance and handle external API limits, the server implements:
- **In-Memory Caching:** Frequently accessed data (like genres and top lists) is cached locally to reduce latency and API calls.
- **Request De-duplication:** Prevents multiple identical requests from being sent to external APIs simultaneously.
- **Fallback Mechanisms:** Includes hardcoded fallback data for critical sections (like top anime) to ensure the UI remains functional even during external API downtime.

---

## 🛠️ Key Features & Flow

### 1. Advanced Authentication
- **Secure Signup:** Users register with encrypted passwords and must verify their identity via **OTP** (sent via Email).
- **Session Management:** Uses **JWT** stored in **HttpOnly Cookies**, providing a balance between security and ease of use.
- **Protected Routes:** Middleware ensures that sensitive operations (like updating a watchlist) are only performed by authenticated users.

### 2. Media Management
- **Watchlist & Favorites:** Robust CRUD operations for users to manage their personal media collections.
- **Review System:** Allows users to leave reviews and ratings for their favorite (or least favorite) titles.
- **Comparison Engine:** A sophisticated matching system that calculates compatibility between users based on:
  - **Jaccard Similarity:** Measures the overlap of watchlists and favorites.
  - **Cosine Similarity:** Analyzes genre preferences to find users with similar tastes.
  - **Rating Correlation:** Compares ratings given to shared media.

### 3. Analytics & Insights
- **User Activity:** Tracks user interactions to provide insights into media preferences.
- **Automated Distribution Mapping:** Calculates genre distributions, watch status ratios (Plan to Watch, Watching, Completed), and media type balance (Movie vs Anime).
- **Data Visualization Ready:** Aggregates and formats data specifically for the frontend's Recharts integration.

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local or Atlas instance)

### Installation
1. Clone the repository.
2. Navigate to the backend directory:
   ```bash
   cd Bk
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure Environment:
   Create a `.env` file in the `Bk/` directory:
   ```env
   PORT=6767
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   TMDB_API_KEY=your_tmdb_api_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   ```

### Running the Project
- **Production Mode:**
  ```bash
   npm start
   ```
  The server will run at `http://localhost:6767`.

---

## 🔒 Security & Performance

- **Rate Limiting:** Global rate limiter implemented to prevent API abuse (100 requests per 15 minutes per IP).
- **Strict CORS:** Only allows requests from specified frontend origins.
- **Secure Headers:** Utilizes standard practices for protecting the application from common web vulnerabilities.
- **Retry Logic:** Implemented for external API requests with exponential backoff to handle intermittent network issues.

---

## 🤝 Contributing
Feel free to submit issues or pull requests to improve the platform!

---

## 🗺️ API Reference (Core Endpoints)

### Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/users/register` | Register a new user | No |
| POST | `/users/verify-otp` | Verify account via email OTP | No |
| POST | `/users/login` | Login and receive JWT cookie | No |
| GET | `/users/user/:id` | Get detailed user profile | Yes |

### Media Discovery (Proxy)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/media/trending` | Fetch trending movies & anime | No |
| GET | `/media/search` | Multi-source search (TMDB/Jikan) | No |
| GET | `/media/details/:id` | Get full details for a title | No |

### User Social & Analytics
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/analytics/:userId` | Get activity & preference stats | Yes |
| GET | `/compare/:uId/:tId` | Calculate compatibility between users | Yes |
| POST | `/reviews/add` | Submit a rating and review | Yes |

---

## 📊 Database Schema Overview

The system uses **MongoDB** with the following core entities:
- **User:** Stores credentials, verification status, and genre preferences.
- **Watchlist:** Tracks media state (`Plan to Watch`, `Watching`, `Completed`), custom user ratings, and media metadata.
- **Favorite:** A lightweight collection for high-priority media items.
- **Review:** Stores user-generated text reviews and numerical ratings.
- **PendingUser:** Temporary storage for unverified registrations (pre-OTP).

---

## 🔑 Environment Variables Reference

| Variable | Purpose | Example |
| :--- | :--- | :--- |
| `PORT` | The port the server runs on | `6767` |
| `MONGODB_URI` | Connection string for MongoDB | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing tokens | `secret_key` |
| `TMDB_API_KEY` | API key from The Movie Database | `abc123...` |
| `EMAIL_USER` | Gmail/SMTP address for OTPs | `app@gmail.com` |
| `EMAIL_PASS` | SMTP App Password | `xxxx xxxx xxxx xxxx` |

---

## 🗺️ Future Roadmap
- [ ] **Redis Integration:** Move from in-memory cache to Redis for better persistence and scalability.
- [ ] **WebSockets:** Implement real-time notifications for social interactions.
- [ ] **Log Management:** Integrate a logging service like Winston or Morgan for better production monitoring.
- [ ] **Dockerization:** Add Docker support for easy deployment and environment consistency.
