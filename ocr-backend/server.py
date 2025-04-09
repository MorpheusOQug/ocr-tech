from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.transforms as T
from PIL import Image
from torchvision.transforms.functional import InterpolationMode
import uvicorn
import io
import os
import sys
import signal
import warnings

# Suppress timm deprecation warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="timm.models.layers")

# Disable Sliding Window Attention since it's not implemented for eager mode
os.environ["USE_TORCH_COMPILE"] = "False"
os.environ["TORCH_CUDNN_V8_API_ENABLED"] = "0"

# Add root directory to sys.path to import modules from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from load_model import load_ocr_model # Load model from load_model.py

# Initialize FastAPI
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Image preprocessing constants
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)

# Load OCR model **only once** when server starts
print("🔄 Loading OCR model...")
model, tokenizer, device = load_ocr_model()
print("✅ Model loaded successfully!")

# Image preprocessing function
def build_transform(input_size):
    transform = T.Compose([
        T.Lambda(lambda img: img.convert('RGB') if img.mode != 'RGB' else img),
        T.Resize((input_size, input_size), interpolation=InterpolationMode.BICUBIC),
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])
    return transform

# Image processing function
def process_image(image_data, input_size=448):
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    transform = build_transform(input_size=input_size)
    pixel_values = transform(image).unsqueeze(0)
    
    # Convert to appropriate dtype based on device
    if device == "cuda":
        pixel_values = pixel_values.to(torch.bfloat16).to(device)
    else:
        pixel_values = pixel_values.to(torch.float32).to(device)
        
    return pixel_values

# API to receive image and perform OCR
@app.post("/ocr")
async def ocr(
    file: UploadFile = File(...),
    question: str = Form("<image>\nExtract information from the image in markdown format")
):
    image_data = await file.read()
    pixel_values = process_image(image_data)

    # Model configuration
    generation_config = dict(max_new_tokens=512, do_sample=False, num_beams=3, repetition_penalty=3.5)
    
    # Use question from client or default question
    if not question.strip():
        question = "<image>\nExtract information from the image in markdown format"
    
    # Ensure question has <image> prefix
    if not question.startswith("<image>"):
        question = "<image>\n" + question
    
    # Run model for recognition and return result
    try:
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=UserWarning)
            warnings.filterwarnings("ignore", category=FutureWarning)
            response = model.chat(tokenizer, pixel_values, question, generation_config)
    except Exception as e:
        print(f"Error during model inference: {e}")
        return {"error": str(e), "text": "Failed to process image"}

    return {"text": response}

# API to check server status
@app.get("/health")
def health_check():
    return {"status": "online"}

# Handle shutdown signals
def handle_shutdown(signum, frame):
    print("Shutting down Python OCR server...")
    # Free resources
    if 'model' in globals():
        del globals()['model']
    if 'tokenizer' in globals():
        del globals()['tokenizer']
    # Exit program
    sys.exit(0)

# Register signal handlers for shutdown
signal.signal(signal.SIGINT, handle_shutdown)
signal.signal(signal.SIGTERM, handle_shutdown)

# Run server
if __name__ == "__main__":
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except KeyboardInterrupt:
        print("Shutting down Python OCR server...")
        sys.exit(0)
