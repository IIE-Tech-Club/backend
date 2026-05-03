# ⚙️ CodeCraft Backend Core

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-9.5-47A248?style=for-the-badge&logo=mongodb)
![Mongoose](https://img.shields.io/badge/Mongoose-9.5-880000?style=for-the-badge&logo=mongoose)
![Cloudinary](https://img.shields.io/badge/Cloudinary-2.10-3448C5?style=for-the-badge&logo=cloudinary)

The **CodeCraft Backend Core** provides the central API services for the hackathon platform. It handles data persistence via MongoDB, asset management through Cloudinary, and orchestrates the complex logic required for hackathon phases and registrations.

---

## 🛠️ Tech Stack

- **Framework**: Express 5 (Next-gen web framework)
- **Database**: MongoDB (via Mongoose ODM)
- **Storage**: Cloudinary (Image & Asset hosting)
- **Middleware**: CORS, Dotenv, JSON Parser
- **Runtime**: Node.js (CommonJS)

---

## 📂 Repository Structure

| Path | Purpose |
| :--- | :--- |
| `src/server.js` | Entry point & Server initialization |
| `src/routes/` | API route definitions (Hackathons, Registrations, Users) |
| `src/models/` | Mongoose schemas for data modeling |
| `src/controllers/` | Business logic implementation |
| `src/middleware/` | Custom middleware for Auth, Validation, etc. |
| `src/config/` | Configuration for Cloudinary, MongoDB, and Firebase |

---

## 🔄 Way of Working (Logic Flow)

```mermaid
graph LR
    A[Client Request] --> B[Express Router]
    B --> C[Auth Middleware]
    C --> D[Controllers]
    D --> E{Data Type}
    E -- Document --> F[MongoDB/Mongoose]
    E -- Asset --> G[Cloudinary]
    F --> H[JSON Response]
    G --> H
```

---

## 🚀 Getting Started

1. **Environment Config**:
   Create a `.env` file with:
   - `MONGODB_URI`
   - `CLOUDINARY_URL`
   - `FIREBASE_ADMIN_CONFIG`

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Development Mode**:

   ```bash
   npm run dev
   ```

4. **Production Start**:

   ```bash
   npm start
   ```
