import torch
from transformers import AutoModel, AutoTokenizer

import torch
print("CUDA available:", torch.cuda.is_available())
print("GPU đang sử dụng:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "Không có GPU")

# Tải mô hình OCR một lần duy nhất và lưu vào RAM GPU
model_name = "5CD-AI/Vintern-1B-v3_5"

def load_ocr_model():
    try:
        # Tải mô hình lên GPU (với flash-attn = False)
        model = AutoModel.from_pretrained(
            model_name,
            torch_dtype=torch.bfloat16,
            low_cpu_mem_usage=True,
            trust_remote_code=True,
            use_flash_attn=False  # Không dùng flash-attn
        ).eval().cuda()
    except Exception as e:
        print(f"Error loading model: {e}")
        model = AutoModel.from_pretrained(
            model_name,
            torch_dtype=torch.bfloat16,
            low_cpu_mem_usage=True,
            trust_remote_code=True
        ).eval().cuda()

    # Tải tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True, use_fast=False)
    
    return model, tokenizer

# Lưu mô hình vào RAM và trả về
if __name__ == "__main__":
    model, tokenizer = load_ocr_model()
    print("✅ Mô hình đã được tải lên bộ nhớ GPU.")
