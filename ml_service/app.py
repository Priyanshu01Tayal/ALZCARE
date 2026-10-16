# pyrefly: ignore [missing-import]
from fastapi import FastAPI, File, UploadFile, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
import numpy as np
import io
import os

app = FastAPI(title="Alzheimer's MRI ML Service")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Allow configuring model path through environment variables, fallback to local path if exists
local_model_path = os.path.join(os.path.dirname(__file__), "alzheimer_model_mobilenetv2.h5")
MODEL_PATH = os.getenv("MODEL_PATH", local_model_path if os.path.exists(local_model_path) else r"d:\4thyear\alzheimer_model_mobilenetv2.h5")
print(f"Loading model from: {MODEL_PATH}")

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Critical Error: Failed to load model: {e}")
    model = None

# Alphabetical class names as mapped by Keras dataset generators
CLASS_NAMES = ["MildDemented", "ModerateDemented", "NonDemented", "VeryMildDemented"]

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="ML Model is not initialized.")
    
    # 1. Validate Uploaded File is an Image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupt image file.")

    try:
        # 2. Preprocessing
        # Convert to RGB (required for MobileNetV2 inputs)
        image = image.convert("RGB")
        
        # Resize to 150x150
        image = image.resize((150, 150))
        
        # Convert to numpy array and normalize pixels (image / 255.0)
        img_array = np.array(image, dtype=np.float32) / 255.0
        
        # Expand dimensions to fit shape (1, 150, 150, 3)
        img_array = np.expand_dims(img_array, axis=0)

        # 3. Model Inference
        predictions = model.predict(img_array)
        class_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][class_idx]) * 100
        prediction_class = CLASS_NAMES[class_idx]

        # 4. Return Prediction & Confidence
        return {
            "prediction": prediction_class,
            "confidence": round(confidence, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
