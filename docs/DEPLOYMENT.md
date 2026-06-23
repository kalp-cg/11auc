# Deployment Guide for AuctionX

Follow this guide to deploy your production-ready AuctionX full-stack application.

---

## 1. Database Setup: MongoDB Atlas
1. Create a free tier cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user (username & password) and set Network Access to allow access from any IP address (`0.0.0.0/0`) since Render IPs change dynamically.
3. Retrieve your connection string URI:
   `mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/auctionx?retryWrites=true&w=majority`

---

## 2. Backend Deployment: Render.com
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables** in Render's dashboard:
   - `PORT`: `10000` (automatically set by Render)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *[Your MongoDB Atlas URI connection string]*
   - `JWT_SECRET`: *[A strong custom secret key]*
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: *[URL of your frontend deployed on Vercel]*
5. Deploy the web service. Note the service URL (e.g. `https://auctionx-server.onrender.com`).

---

## 3. Frontend Deployment: Vercel
1. Install Vercel CLI locally or connect your repo to [Vercel](https://vercel.com).
2. Import the project.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Configure **Environment Variables** in Vercel's dashboard:
   - `VITE_API_URL`: `https://auctionx-server.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://auctionx-server.onrender.com`
5. Click **Deploy**. Note your live frontend URL.
6. Remember to go back to **Render** and update the `CLIENT_URL` env variable with your live Vercel frontend URL to allow cross-origin socket connections (CORS).
