# 🚀 CodeCraft Backend

The core API service for the CodeCraft Hackathon Management Platform. Built with Express.js and Mongoose, providing a robust RESTful architecture for user management, hackathon orchestration, and registration workflows.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

---

## 📂 Project Structure

| Path | Description |
| :--- | :--- |
| `src/server.js` | Entry point of the application. |
| `src/config/` | Database and third-party service configurations. |
| `src/controllers/` | Request handlers and business logic. |
| `src/models/` | Mongoose schemas and data models. |
| `src/routes/` | API route definitions. |
| `src/middleware/` | Global and route-specific middlewares (Auth, Error). |

---

## 🛠️ Way of Working (Logic Flow)

```mermaid
graph TD
    A[Client Request] --> B[Middleware: CORS/JSON/Auth]
    B --> C[Routes: /api/...]
    C --> D[Controllers: Business Logic]
    D --> E[Models: Mongoose/MongoDB]
    E --> D
    D --> F[Cloudinary: Asset Storage]
    F --> D
    D --> G[Client Response]
```

---

## ⚡ Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**

   Create a `.env.local` file in the root directory:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   CLOUDINARY_URL=your_cloudinary_url
   ```

3. **Run Development Server**

   ```bash
   npm run dev
   ```

---

## 📡 API Endpoints

- `GET /api/users`: User management.
- `GET /api/hackathons`: Hackathon configuration and lifecycle.
- `GET /api/registrations`: Registration and submission handling.
