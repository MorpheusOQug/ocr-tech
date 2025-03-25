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

# Thêm thư mục gốc vào sys.path để có thể import module từ thư mục cha
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from load_model import load_ocr_model #Load model từ file load_model.py

# Khởi tạo FastAPI
app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả các nguồn
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả các phương thức
    allow_headers=["*"],  # Cho phép tất cả các header
)

# Hằng số tiền xử lý ảnh
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)

# Tải mô hình OCR **một lần duy nhất** khi server khởi động
print("🔄 Đang tải mô hình OCR...")
model, tokenizer = load_ocr_model()
print("✅ Mô hình đã tải xong!")

# Hàm tiền xử lý ảnh
def build_transform(input_size):
    transform = T.Compose([
        T.Lambda(lambda img: img.convert('RGB') if img.mode != 'RGB' else img),
        T.Resize((input_size, input_size), interpolation=InterpolationMode.BICUBIC),
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])
    return transform

# Hàm xử lý ảnh
def process_image(image_data, input_size=448):
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    transform = build_transform(input_size=input_size)
    pixel_values = transform(image).unsqueeze(0).to(torch.bfloat16).cuda()
    return pixel_values

# API nhận ảnh và thực hiện OCR
@app.post("/ocr")
async def ocr(
    file: UploadFile = File(...),
    question: str = Form("<image>\nChỉ ghi lại nội dung trong ảnh dưới dạng markdown")
):
    image_data = await file.read()
    pixel_values = process_image(image_data)

    # Cấu hình cho mô hình
    generation_config = dict(max_new_tokens=512, do_sample=False, num_beams=3, repetition_penalty=3.5)
    
    # Sử dụng câu hỏi từ client hoặc câu hỏi mặc định
    if not question.strip():
        question = "<image>\nChỉ ghi lại nội dung trong ảnh dưới dạng markdown"
    
    # Đảm bảo câu hỏi có tiền tố <image>
    if not question.startswith("<image>"):
        question = "<image>\n" + question
    
    # Chạy mô hình để nhận diện và trả về kết quả
    response = model.chat(tokenizer, pixel_values, question, generation_config)

    return {"text": response}

# API kiểm tra trạng thái server
@app.get("/health")
def health_check():
    return {"status": "online"}

# Chạy server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
