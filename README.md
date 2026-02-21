# Projectarium PWA

A Progressive Web App (PWA) for project and task management built with Next.js 14, TypeScript, Tailwind CSS, and next-pwa.

## Features

- 📱 **Progressive Web App** - Install on iOS and Android home screens
- 🎨 **Modern UI** - Built with Tailwind CSS and mobile-first design
- 🌙 **Dark Mode** - Automatic theme detection with manual toggle
- 📊 **Project Management** - Create, view, edit, and delete projects
- ✅ **Task Management** - Manage tasks with priorities and due dates
- 🔌 **REST API Integration** - Connects to external API via environment variables
- ⚡ **Fast & Responsive** - Optimized for performance and all screen sizes
- 🚀 **Vercel Ready** - Configured for easy deployment

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **Icons**: Custom generated icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sean-obeirne/projectarium-pwa.git
cd projectarium-pwa
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Integration

The app connects to a REST API with the following endpoints:

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks?projectId=:id` - Get tasks by project
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Projects list page
│   ├── globals.css        # Global styles
│   ├── projects/
│   │   ├── new/           # New project page
│   │   └── [id]/          # Project detail and edit pages
│   └── tasks/             # Task pages
├── components/            # React components
│   ├── ProjectCard.tsx   # Project card component
│   ├── ProjectForm.tsx   # Project form
│   ├── TaskList.tsx      # Task list component
│   └── TaskForm.tsx      # Task form
├── lib/
│   └── api.ts            # API service layer
└── types/
    └── index.ts          # TypeScript type definitions

public/
├── manifest.json         # PWA manifest
└── icon-*.png           # App icons
```

## PWA Features

The app includes:
- Service worker for offline functionality
- Installable on mobile devices (iOS and Android)
- App icons for home screen
- Optimized for mobile-first experience

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the `NEXT_PUBLIC_API_URL` environment variable
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Base URL for the REST API (required)

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
