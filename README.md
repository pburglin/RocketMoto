# Motorcycle Route Explorer 🏍️

A modern web application for motorcycle enthusiasts to discover, share, and explore scenic routes. Built with React, TypeScript, and Supabase.

## Features

- 🗺️ Interactive route mapping with OpenStreetMap integration
- 📍 Create routes by clicking on the map or entering addresses
- 🏷️ Tag routes with categories (scenic, curves, mountain, etc.)
- 📸 Add photos to document route highlights
- 👍 Rate and comment on routes
- 🌓 Dark/Light theme support
- 📱 Responsive design for all devices
- 🔍 Advanced route search and filtering
- 📏 Support for both kilometers and miles
- 🧭 Direct navigation integration with Google Maps

## Tech Stack

- **Frontend:**
  - React 18
  - TypeScript
  - Tailwind CSS
  - React Router v6
  - Leaflet & Leaflet Routing Machine
  - Lucide React Icons

- **Backend:**
  - Supabase (PostgreSQL + PostGIS)
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Secure authentication

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/motorcycle-route-explorer.git
   cd motorcycle-route-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your Supabase credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following main tables:

- `users` - User profiles and preferences
- `routes` - Route details with PostGIS geometry
- `route_tags` - Tags associated with routes
- `route_photos` - Photos attached to routes
- `route_ratings` - User ratings for routes
- `route_comments` - User comments on routes

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenStreetMap for map data
- Leaflet for map visualization
- Supabase for backend infrastructure
- Unsplash for default route images