# Flight Booking System - Frontend

This is the frontend application for the Flight Booking System, built with React, Vite, and Tailwind CSS.

## Features

- User authentication (login/register)
- Flight search with filters
- Flight booking and management
- Responsive design
- Real-time updates
- Interactive UI components

## Tech Stack

- React 18
- Vite
- React Router v6
- Tailwind CSS
- Axios
- React Query
- React Hook Form
- React Toastify
- HeadlessUI
- HeroIcons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running (see flight-api repository)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flight-client.git
cd flight-client
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:8080/api
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## Project Structure

```
flight-client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── context/       # React context providers
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utility functions
│   └── assets/        # Static assets
├── public/            # Public assets
└── ...config files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
