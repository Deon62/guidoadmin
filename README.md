# Quest Admin UI

A modern admin dashboard interface for Quest trip planning and management app.

## Features

- **Login Page** - Secure admin authentication (with bypass option for development)
- **Dashboard** - Overview statistics and recent activity
- **User Management** - View and manage users
- **Post Management** - Manage feed posts
- **Trip Management** - View user trips
- **Category Management** - Manage post categories
- **Analytics** - Coming soon
- **Settings** - Coming soon

## Color Scheme

- **Primary Brand**: Deep Navy #0A1D37
- **Background**: Soft White #F7F7F7
- **Text Primary**: Chocolate Black #1A1A1A
- **Text Secondary**: Charcoal #3A3A3A
- **Hint/Labels**: Muted Grey #6D6D6D

## Setup

1. Open `index.html` in a web browser or serve it using a local server
2. For development, you can use the "Bypass Login" button
3. The dashboard will connect to the FastAPI backend at `http://localhost:8000`

## File Structure

```
admin-ui/
├── index.html      # Login page
├── dashboard.html  # Main dashboard
├── styles.css      # All styles
├── app.js          # Application logic
└── README.md       # This file
```

## API Integration

The admin UI connects to the Quest API backend:
- Base URL: `http://localhost:8000/api/v1`
- Admin endpoints are used for authentication and data management

## Development

To serve locally with a simple HTTP server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js (if you have http-server installed)
npx http-server -p 8080
```

Then open `http://localhost:8080` in your browser.

