# 📱 Mobile Access Guide

## Access the App on Your Phone

### Prerequisites
- Your phone must be on the **same WiFi network** as your computer
- The server must be running on your computer

### Step-by-Step Instructions

#### 1. Start the Server (on your computer)
```bash
cd /Users/alexmoran/Documents/programming/ArmyRecruitTool
npm run dev
```

#### 2. Find Your Computer's Local IP Address
```bash
# Run this command to find your IP:
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

Your current IP is: **`10.97.244.81`**

#### 3. Open on Your Phone
1. Open Safari/Chrome on your phone
2. Go to: **`http://10.97.244.81:5001`**
3. **Allow location access** when prompted
4. Navigate to **Prospecting** page

### Features on Mobile

✅ **Geolocation**: Uses your phone's GPS for accurate location  
✅ **Mock Data**: Generates locations within 5km of your position  
✅ **Interactive Map**: Full Leaflet map with touch controls  
✅ **Real-time Search**: Find locations and events near you  

### Troubleshooting

**Can't connect?**
- Verify both devices are on the same WiFi
- Check your computer's firewall settings
- Try refreshing your IP: `ifconfig en0 | grep "inet "`

**Location not working?**
- Enable location services on your phone
- Grant browser permission to access location
- Refresh the page and try again

**Map not loading?**
- Clear browser cache
- Try a different browser (Chrome/Safari)
- Check console for errors (Safari: Settings > Advanced > Web Inspector)

### Demo Tips

When showing to others:
1. ✅ Click "Find Locations Near Me" to see 16 mock recruiting locations
2. ✅ Click "Find Events Near Me" to see 6 mock recruiting events
3. ✅ Show the prospecting scores (70-90) for each location
4. ✅ Tap markers to see detailed popups
5. ✅ Use filters to show only schools, gyms, or events
6. ✅ Show the AI Assistant for prospecting advice

### Network Configuration

The server is configured to listen on:
- **Local**: `http://localhost:5001`
- **Network**: `http://0.0.0.0:5001` (accessible to all devices on network)

Your mobile URL: **`http://10.97.244.81:5001`**

---

**Note**: This IP address may change if you reconnect to WiFi. If the app stops working, run the `ifconfig` command again to get your new IP.

