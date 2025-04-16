from fastapi import FastAPI, File, UploadFile, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
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
import json
import subprocess
from typing import Dict, Any, Optional

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

# Export endpoint
@app.post("/export")
async def export_document(
    data: Dict[str, Any] = Body(...)
):
    try:
        content = data.get("content", "")
        format = data.get("format", "")
        file_name = data.get("fileName", "ocr-result")
        
        print(f"Export request received: format={format}, fileName={file_name}")
        
        # Validate inputs
        if not content:
            return {"error": "Content is required"}
        
        if format not in ["docx", "pdf"]:
            return {"error": f"Invalid format: {format}. Valid formats are 'docx' or 'pdf'"}
            
        # Create a temporary file with the content
        safe_filename = "".join(c if c.isalnum() or c in ['-', '_'] else '_' for c in file_name)
        temp_content_file = f"temp_{safe_filename}.txt"
        output_file = f"{safe_filename}.{format}"
        
        try:
            # Write content to temporary file
            with open(temp_content_file, "w", encoding="utf-8") as f:
                f.write(content)
            
            # Call the document generation script
            import subprocess
            result = subprocess.run(
                ["node", "generate-document.js", temp_content_file, format, safe_filename],
                capture_output=True,
                text=True,
                check=True
            )
            
            print(f"Document generation result: {result.stdout}")
            
            # Check if the file was generated
            if not os.path.exists(output_file):
                print(f"Error: Output file {output_file} was not created")
                if result.stderr:
                    print(f"Error output: {result.stderr}")
                return {"error": "Failed to generate document"}
            
            # Read the generated file
            with open(output_file, "rb") as f:
                file_content = f.read()
            
            # Set the correct content type
            if format == "docx":
                media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            else:  # pdf
                media_type = "application/pdf"
            
            # Clean up temporary files
            try:
                if os.path.exists(temp_content_file):
                    os.remove(temp_content_file)
                if os.path.exists(output_file):
                    os.remove(output_file)
            except Exception as e:
                print(f"Warning: Failed to clean up temporary files: {e}")
            
            # Return the file
            print(f"Returning {format} file with {len(file_content)} bytes")
            return Response(
                content=file_content,
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={safe_filename}.{format}"
                }
            )
            
        except subprocess.CalledProcessError as e:
            print(f"Document generation process failed: {e}")
            print(f"Error output: {e.stderr}")
            return {"error": f"Document generation failed: {e.stderr}"}
            
        except Exception as e:
            print(f"Error during document generation: {e}")
            return {"error": str(e)}
            
    except Exception as e:
        print(f"Error in export endpoint: {e}")
        return {"error": str(e)}

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
