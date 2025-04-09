# OCR Backend

This is the backend service for the OCR application that provides both authentication and OCR functionality.

## Architecture

The system consists of two main parts:
1. **Node.js Express Server**: Handles authentication, file uploads, and acts as a bridge to the Python OCR service.
2. **Python FastAPI Server**: Runs the OCR model and processes image recognition.

## Features

- User authentication (register/login) with JWT
- MongoDB integration for user data storage
- OCR processing with a Python deep learning model
- File upload for OCR processing

## Prerequisites

- Node.js (v14+)
- Python (v3.7+)
- MongoDB (local or remote)

## Setup

### Install Node.js dependencies

```bash
npm install
```

### Install Python dependencies

```bash
pip install -r ../requirements.txt
```

### Configure environment variables

Create a `.env` file in the project root with the following:

```
MONGODB_URI=mongodb://localhost:27017/ocr-app
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

## Known Issues and Fixes

The system fixes two common issues:

1. **timm.models.layers Deprecation Warning**: The system automatically suppresses these warnings as the model continues to use deprecated imports. We configure `warnings.filterwarnings()` to ignore these.

2. **Sliding Window Attention in Eager Mode**: The system disables Sliding Window Attention by setting environment variables and forcing the "eager" attention implementation to prevent errors with the OCR model.

## Running the application

### Development mode

To run both Node.js and Python services together:

```bash
npm run dev:all
```

This will start both services with auto-reloading on code changes.

### Run services separately

**Start Node.js server only:**

```bash
npm run dev
```

**Start Python server manually:**

```bash
python server.py
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### OCR

- `POST /api/ocr` - Upload an image for OCR processing
- `GET /health` - Check server status
- `GET /model-progress` - Check OCR model loading progress

## Architecture Notes

The Node.js server spawns and manages the Python process, handling the communication between the frontend and the OCR model. 