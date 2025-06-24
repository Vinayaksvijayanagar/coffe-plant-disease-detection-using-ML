import os
import json
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

# === Initialize Flask App ===
app = Flask(__name__)
CORS(app)

# === Load CNN Model ===
MODEL_PATH = "coffee_disease_model_fast.h5"
if os.path.exists(MODEL_PATH):
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ CNN Model loaded successfully!")
else:
    raise FileNotFoundError("❌ Error: Model file not found!")

# === Load Translations ===
TRANSLATION_PATH = "translations.json"
if os.path.exists(TRANSLATION_PATH):
    with open(TRANSLATION_PATH, "r", encoding="utf-8") as f:
        TRANSLATIONS = json.load(f)
    print("✅ Translations loaded successfully!")
else:
    TRANSLATIONS = {}
    print("⚠️ Warning: translations.json not found!")

# === Class Labels for CNN Model ===
CLASS_LABELS = [
    "Healthy",
    "Coffee Leaf Rust",
    "Cercospora Leaf Spot",
    "Phoma Leaf Spot",
    "Anthracnose",
    "Algal Leaf Spot",
    "Brown Eye Spot",
    "Fusarium Wilt",
    "Root Rot",
    "Bacterial Blight",
    "Coffee Berry Disease (CBD)",
    "Verticillium Wilt",
    "Black Rot",
    "American Leaf Spot",
    "Pink Disease",
    "Root Knot Nematode",
    "Coffee Berry Borer",
    "Rust - Hemileia vastatrix",
    "Wilt - Fusarium spp.",
    "**New Disease or Unknown**"
]

# === Preprocessing Function ===
def preprocess_image(image_file):
    try:
        img = Image.open(image_file).convert("RGB")  # Ensure 3 channels
        img = img.resize((128, 128))  # Resize to match model input
        img_array = np.array(img) / 255.0  # Normalize pixel values
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        return img_array
    except Exception as e:
        print(f"❌ Error processing image: {str(e)}")
        raise ValueError("Invalid image format or corrupted file.")

# === Prediction Route ===
@app.route("/predict", methods=["POST"])
def predict():
    try:
        print("🔹 Received request at /predict")

        # Check if file exists in the request
        if "file" not in request.files:
            print("❌ No file part in request")
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        if file.filename == "":
            print("❌ Empty filename")
            return jsonify({"error": "No selected file"}), 400

        print(f"✅ File received: {file.filename}")

        # Process the image
        processed_img = preprocess_image(file)

        # Make prediction
        prediction = model.predict(processed_img)
        predicted_index = int(np.argmax(prediction[0]))

        if predicted_index >= len(CLASS_LABELS):
            print("❌ Predicted index out of bounds")
            return jsonify({"error": "Predicted index out of bounds."}), 500

        predicted_class = CLASS_LABELS[predicted_index]
        print(f"✅ Predicted class: {predicted_class}")

        # Fetch translations
        translations = TRANSLATIONS.get(predicted_class, {})
        print(f"✅ Translations fetched: {translations}")

        return jsonify({
            "class": predicted_class,
            "translations": translations
        })

    except Exception as e:
        print("🔥 Error in /predict:", str(e))
        import traceback
        print(traceback.format_exc())  # Print full error traceback
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# === Run Flask App ===
if __name__ == "__main__":
    app.run(debug=True, port=5000)
