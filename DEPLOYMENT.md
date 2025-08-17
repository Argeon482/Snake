# Deployment Guide

This guide helps you deploy the Multiplayer Snake Game with separate frontend and backend services on Render.

## Quick Deployment Steps

### 1. Deploy to Render

1. **Fork this repository** to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **"New"** → **"Blueprint"**
4. Connect your GitHub repository
5. Select your forked repository
6. Click **"Deploy"**

Render will automatically create two services:
- `multiplayer-snake-backend` (API server)
- `multiplayer-snake-frontend` (web client)

### 2. Update Frontend Configuration

After deployment, you need to update the frontend to connect to your backend:

1. **Get your backend URL** from the Render dashboard (something like `https://multiplayer-snake-backend-abc123.onrender.com`)

2. **Update frontend/game.js**:
   ```javascript
   // Find this line in frontend/game.js:
   : 'https://your-backend-app.onrender.com';  // Production backend
   
   // Replace with your actual backend URL:
   : 'https://multiplayer-snake-backend-abc123.onrender.com';
   ```

3. **Commit and push the change** - Render will automatically redeploy

### 3. Test Your Deployment

1. Open your frontend URL (e.g., `https://multiplayer-snake-frontend-xyz789.onrender.com`)
2. Create a game room
3. Open the same URL in another browser/tab
4. Join the same room
5. Start playing!

## Service Configuration

### Backend Service
- **Name**: `multiplayer-snake-backend`
- **Type**: Web Service
- **Runtime**: Node.js
- **Build**: `npm install`
- **Start**: `node server.js`
- **Port**: Auto-assigned by Render

### Frontend Service
- **Name**: `multiplayer-snake-frontend`
- **Type**: Web Service  
- **Runtime**: Node.js
- **Build**: `npm install`
- **Start**: `node server.js`
- **Port**: Auto-assigned by Render

## Environment Variables

The backend automatically receives the frontend URL through Render's service linking. No manual environment variable configuration is needed.

## Troubleshooting

### Connection Issues
- Ensure the backend URL in `frontend/game.js` matches your actual backend service URL
- Check that both services are deployed and healthy in the Render dashboard
- Verify CORS is properly configured (it should be automatic)

### Deployment Issues
- Make sure both `backend/package.json` and `frontend/package.json` exist
- Verify the `render.yaml` file is in the root directory
- Check the build logs in Render dashboard for any errors

### Game Issues
- If players can't connect, check the browser console for Socket.io errors
- Ensure both services are running (green status in Render dashboard)
- Try refreshing the page or clearing browser cache

## Local Development

For local development with the separated architecture:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm start
```

Then open `http://localhost:8080` in your browser.

## Cost Optimization

Both services are configured for the free tier. For production use:

1. **Upgrade to paid plans** for better performance and uptime
2. **Enable persistent storage** if you plan to add user accounts
3. **Configure custom domains** for better branding

## Support

If you encounter issues:

1. Check the [Render documentation](https://render.com/docs)
2. Review the service logs in your Render dashboard
3. Ensure your repository structure matches this guide
4. Verify all files are committed and pushed to GitHub