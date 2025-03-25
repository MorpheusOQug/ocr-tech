# OCR Tech - Frontend

OCR Tech is a web application for optical character recognition (OCR) powered by AI. This frontend allows users to upload images and extract text using advanced AI models.

## 🌟 Features

- Modern UI with responsive design using Tailwind CSS
- Dark/Light mode toggle
- Image upload and preview
- OCR text extraction with AI prompt customization
- Easily navigable interface with a beautiful navbar

## 🚀 Technology Stack

- React.js
- Tailwind CSS for styling
- Axios for API requests
- React Router for navigation

## 📋 Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```
git clone <repository-url>
cd ocr-frontend
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm start
```

The application will be available at `http://localhost:3000`.

## 🎨 Tailwind CSS

This project uses Tailwind CSS as the primary styling framework. Tailwind provides utility-first CSS classes that help to:

- Maintain consistent design across the application
- Easily implement responsive layouts
- Customize components with minimal custom CSS
- Support dark/light mode theming

### Key Files

- `tailwind.config.js` - Configuration for custom colors and theme extensions
- `src/index.css` - Contains Tailwind directives and base styles

## 📚 Project Structure

```
src/
├── components/         # Reusable UI components
│   └── Navbar.js       # Navigation bar component
├── pages/              # Page components
│   ├── Home.js         # Landing page
│   └── OCRPage.js      # OCR functionality page
├── App.js              # Main application component
└── index.js            # Entry point
```

## 🔌 API Connection

The frontend connects to a backend server running at `http://127.0.0.1:8000`. Make sure the backend server is running when using the OCR functionality.

## 🌙 Dark Mode

The application supports dark mode which can be toggled using the sun/moon icon in the navbar. The theme preference is detected from system settings initially.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
