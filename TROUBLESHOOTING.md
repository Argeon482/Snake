# Troubleshooting Guide

## Issues Fixed

### 1. Backend "Cannot GET /" Error
**Problem**: When accessing the backend URL directly, it showed "Cannot GET /"
**Solution**: Added a root route (`/`) to the backend that returns API information

### 2. Frontend Not Connecting to Backend
**Problem**: Clicking "Join Game" didn't work - no connection to backend
**Solutions Implemented**:

1. **Enhanced Error Handling**: Added comprehensive socket connection error handlers
2. **Better Logging**: Added console logs for debugging connection issues
3. **Connection Status Check**: Frontend now verifies socket connection before attempting to join
4. **Flexible CORS Configuration**: Backend now accepts multiple URL patterns for Render deployments

## Deployment Checklist

### 1. Update Frontend Backend URL
The frontend needs to know your actual backend URL. Edit `/frontend/game.js`:

```javascript
// Line ~51 - Replace with your actual backend URL
: 'https://multiplayer-snake-backend.onrender.com';  // Production backend
```

Replace `multiplayer-snake-backend` with your actual Render backend service name.

### 2. Check Render Service Names
Ensure your Render services match the names in `render.yaml`:
- Backend: `multiplayer-snake-backend`
- Frontend: `multiplayer-snake-frontend`

### 3. Environment Variables
The backend automatically gets the frontend URL from Render. Verify in your Render dashboard:
- Backend service should have `FRONTEND_URL` environment variable set

## Debugging Steps

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab for:
- Connection attempts to backend
- Any CORS errors
- Socket.IO connection status

### 2. Check Backend Logs
In Render dashboard, check your backend service logs for:
- Server startup messages
- CORS configuration
- Connection attempts from frontend
- Any error messages

### 3. Test Backend Health
Visit your backend URL with `/health` endpoint:
```
https://your-backend-service.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 4. Test Backend Root
Visit your backend URL directly:
```
https://your-backend-service.onrender.com/
```

Should return:
```json
{
  "message": "Multiplayer Snake Game Backend API",
  "status": "running",
  "environment": "production",
  "endpoints": {
    "health": "/health",
    "websocket": "Connect via Socket.IO"
  }
}
```

## Common Issues

### CORS Errors
If you see CORS errors in the browser console:
1. Check that your frontend URL matches what's configured in the backend
2. The backend now accepts any `multiplayer-snake-frontend-*.onrender.com` URL pattern
3. Check backend logs for "Blocked origin" messages

### Socket.IO Connection Failures
If Socket.IO can't connect:
1. Verify the backend URL in frontend is correct
2. Check for HTTPS/HTTP mismatch (both should use HTTPS in production)
3. Ensure backend is running (check /health endpoint)
4. Look for "Connection error" messages in browser console

### "Not connected to server" Error
This appears when trying to join before Socket.IO connects:
1. Wait a moment after page load
2. Check browser console for connection status
3. Refresh the page if needed

## Next Steps

After deployment:
1. Monitor the logs on both services
2. Test with two browser windows/tabs
3. Check that both players can see each other's movements
4. Verify the game starts when 2 players join the same room

## Support

If issues persist:
1. Check Render service logs
2. Verify all environment variables are set correctly
3. Ensure both services are on the same Render account/team
4. Try redeploying both services