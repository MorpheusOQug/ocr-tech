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

# Suppress all warnings more aggressively
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message="Sliding Window Attention is enabled but not implemented for `eager`")

# Disable Sliding Window Attention since it's not implemented for eager mode
os.environ["USE_TORCH_COMPILE"] = "False"
os.environ["TORCH_CUDNN_V8_API_ENABLED"] = "0"
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

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
    """Build image transformation pipeline.
    
    The model expects input size to be 448x448.
    """
    transform = T.Compose([
        T.Lambda(lambda img: img.convert('RGB') if img.mode != 'RGB' else img),
        T.Resize((input_size, input_size), interpolation=InterpolationMode.BICUBIC),
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])
    return transform

# Image processing function
def process_image(image_data, input_size=448):  # Use model's default size of 448
    try:
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Print image info for debugging
        print(f"Original image size: {image.size}")
        
        # Ensure image dimensions are multiples of 14 (model requirement)
        width, height = image.size
        target_width = input_size
        target_height = input_size
        
        transform = build_transform(input_size=input_size)
        pixel_values = transform(image).unsqueeze(0)
        
        # Print tensor info
        print(f"Processed tensor shape: {pixel_values.shape}")
    
        # Convert to appropriate dtype based on device
        if device == "cuda":
            pixel_values = pixel_values.to(torch.bfloat16).to(device)
        else:
            pixel_values = pixel_values.to(torch.float32).to(device)
        
        return pixel_values
    except Exception as e:
        print(f"Error in process_image: {e}")
        import traceback
        traceback.print_exc()
        raise

# API to receive image and perform OCR
@app.post("/ocr")
async def ocr(
    file: UploadFile = File(...),
    question: str = Form("<image>\nPlease extract the full and accurate text of the official Vietnamese government document shown in the image, including the title, issuing agency, document number, date, legal references, main content, clauses, and the name of the signatory (if any). Preserve the structure and formatting (e.g., bullet points, line breaks, numbered articles) as much as possible."),
    mode: str = Form("text"),
    isPdf: str = Form(None)
):
    try:
        print(f"Processing OCR request with prompt length: {len(question)} chars, mode: {mode}, isPdf: {isPdf}")
        image_data = await file.read()
        print(f"File received, size: {len(image_data)} bytes")

        # Handle PDF files specially to extract pages
        if isPdf == 'true' or file.content_type == 'application/pdf':
            print("Detected PDF file, processing pages...")
            try:
                return await process_pdf(image_data, question, mode)
            except Exception as pdf_error:
                print(f"Error processing PDF: {pdf_error}")
                import traceback
                traceback.print_exc()
                # Continue with regular image processing as fallback
        
        # Process image
        try:
            pixel_values = process_image(image_data)
            print("Image processed successfully")
        except Exception as e:
            print(f"Error processing image: {e}")
            return {"error": f"Image processing failed: {str(e)}", "text": "Failed to process image"}

        # Model configuration
        generation_config = dict(
            max_new_tokens=1024,  # Increased from 512 to handle longer documents
            do_sample=False,      # Deterministic generation
            num_beams=4,          # Increased from 3 for better search
            repetition_penalty=3.5,
            length_penalty=1.0,   # Encourage slightly longer outputs
            early_stopping=True   # Stop when all beams reach EOS
        )
    
        # Use question from client or default question
        if not question.strip():
            question = "<image>\nPlease extract the full and accurate text of the official Vietnamese government document shown in the image, including the title, issuing agency, document number, date, legal references, main content, clauses, and the name of the signatory (if any). Preserve the structure and formatting (e.g., bullet points, line breaks, numbered articles) as much as possible."
    
        # Ensure question has <image> prefix
        if not question.startswith("<image>"):
            question = "<image>\n" + question
    
        print("Starting model inference...")
        # Run model for recognition and return result
        try:
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=UserWarning)
                warnings.filterwarnings("ignore", category=FutureWarning)
                response = model.chat(tokenizer, pixel_values, question, generation_config)
                print(f"Model inference successful, response length: {len(response)} chars")
        except Exception as e:
            print(f"Error during model inference: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e), "text": "Failed to process image", "details": traceback.format_exc()}

        return {"text": response, "status": "success"}
        
    except Exception as e:
        print(f"Unhandled exception in OCR endpoint: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "text": "Failed to process request", "details": traceback.format_exc()}

# New function to process PDF files and extract pages
async def process_pdf(pdf_data, question, mode):
    try:
        print("Starting PDF processing...")
        import io
        import fitz  # PyMuPDF
        
        # Create a temporary file to handle PDF
        pdf_stream = io.BytesIO(pdf_data)
        
        # Open the PDF file
        try:
            pdf_document = fitz.open(stream=pdf_stream, filetype="pdf")
            print(f"PDF loaded with {pdf_document.page_count} pages")
        except Exception as e:
            print(f"Error opening PDF: {e}")
            raise Exception(f"Could not open PDF file: {e}")
        
        pages_text = []
        full_text = ""
        page_images = []
        
        # Process each page
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            
            # Extract text first
            try:
                page_text = page.get_text()
                pages_text.append(page_text)
                full_text += page_text + "\n\n"
                print(f"Text extracted from page {page_num + 1}, length: {len(page_text)}")
            except Exception as text_error:
                print(f"Error extracting text from page {page_num + 1}: {text_error}")
                pages_text.append("")
            
            # Render page as image for OCR
            try:
                pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))  # 300 DPI
                img_bytes = io.BytesIO()
                pix.pil_save(img_bytes, format="PNG")
                img_bytes.seek(0)
                page_images.append(img_bytes.getvalue())
                print(f"Image rendered for page {page_num + 1}")
            except Exception as img_error:
                print(f"Error rendering page {page_num + 1} as image: {img_error}")
        
        # If text extraction yielded good results, use it
        if len(full_text.strip()) > 100:  # Assume text extraction worked if we got a decent amount
            result = {
                "text": full_text,
                "pages": pages_text,
                "pageCount": pdf_document.page_count,
                "status": "success"
            }
            print(f"Using extracted text from PDF with {pdf_document.page_count} pages")
            return result
        
        # Otherwise try OCR on all page images
        print("Text extraction inadequate, running OCR on page images...")
        all_ocr_text = []
        
        # Process each page image through the model
        for i, img_data in enumerate(page_images):
            try:
                # Process the image for model
                pixel_values = process_image(img_data)
                
                # Model configuration
                generation_config = dict(
                    max_new_tokens=1024,
                    do_sample=False,
                    num_beams=4,
                    repetition_penalty=3.5,
                    length_penalty=1.0,
                    early_stopping=True
                )
                
                # Run model for this page
                page_question = f"<image>\nExtract all text from this document page {i+1} of {len(page_images)}, preserving formatting."
                
                print(f"Running OCR on page {i+1}...")
                with warnings.catch_warnings():
                    warnings.filterwarnings("ignore", category=UserWarning)
                    warnings.filterwarnings("ignore", category=FutureWarning)
                    page_response = model.chat(tokenizer, pixel_values, page_question, generation_config)
                
                all_ocr_text.append(page_response)
                print(f"OCR completed for page {i+1}, got {len(page_response)} chars")
                
            except Exception as page_error:
                print(f"Error processing page {i+1}: {page_error}")
                all_ocr_text.append(f"[Error processing page {i+1}]")
        
        # Combine all OCR results
        combined_text = "\n\n".join(all_ocr_text)
        
        return {
            "text": combined_text,
            "pages": all_ocr_text,
            "pageCount": pdf_document.page_count,
            "status": "success"
        }
        
    except Exception as e:
        print(f"Error in process_pdf: {e}")
        import traceback
        traceback.print_exc()
        raise e

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
