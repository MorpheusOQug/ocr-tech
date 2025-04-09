import sys
import os
from PIL import Image
import pytesseract

def process_image(image_path):
    try:
        # Open the image
        img = Image.open(image_path)
        
        # Use pytesseract to do OCR
        text = pytesseract.image_to_string(img)
        
        # Print the text (will be captured by Node.js)
        print(text)
        
        return True
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        if os.path.exists(image_path):
            process_image(image_path)
        else:
            print(f"File not found: {image_path}")
    else:
        print("No image path provided") 