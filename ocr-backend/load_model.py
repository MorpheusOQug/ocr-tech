import torch
from transformers import AutoModel, AutoTokenizer
import warnings
import os

# Suppress timm deprecation warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="timm.models.layers")

# Disable Sliding Window Attention since it's not implemented for eager mode
os.environ["USE_TORCH_COMPILE"] = "False"
os.environ["TORCH_CUDNN_V8_API_ENABLED"] = "0"

import torch
print("CUDA available:", torch.cuda.is_available())
print("GPU in use:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No GPU available")

# Load OCR model once and save to GPU RAM
model_name = "5CD-AI/Vintern-1B-v3_5"

def load_ocr_model():
    # Check if CUDA is available
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    try:
        # Load model to GPU or CPU
        model = AutoModel.from_pretrained(
            model_name,
            torch_dtype=torch.bfloat16 if device == "cuda" else torch.float32,
            low_cpu_mem_usage=True,
            trust_remote_code=True,
            use_flash_attn=False,  # Don't use flash-attn
            attn_implementation="eager"  # Force eager implementation to avoid Sliding Window Attention issue
        ).eval()
        
        # Move to appropriate device
        model = model.to(device)
    except Exception as e:
        print(f"Error loading model: {e}")
        model = AutoModel.from_pretrained(
            model_name,
            torch_dtype=torch.float32 if device == "cpu" else torch.bfloat16,
            low_cpu_mem_usage=True,
            trust_remote_code=True,
            attn_implementation="eager"  # Force eager implementation
        ).eval().to(device)

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True, use_fast=False)
    
    return model, tokenizer, device

# Save model to RAM and return
if __name__ == "__main__":
    model, tokenizer, device = load_ocr_model()
    print(f"✅ Model loaded successfully to {device}.")
