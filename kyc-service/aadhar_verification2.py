import sys
from deepface import DeepFace

# ---------------- CONFIG ----------------
MODEL_NAME = "ArcFace"
DETECTOR = "retinaface"
DISTANCE_METRIC = "cosine"

# ----------------------------------------
def match_faces(aadhar_img_path, selfie_img_path):
    print("🔍 Comparing faces...")

    result = DeepFace.verify(
        img1_path=aadhar_img_path,
        img2_path=selfie_img_path,
        model_name=MODEL_NAME,
        detector_backend=DETECTOR,
        distance_metric=DISTANCE_METRIC,
        enforce_detection=True
    )

    distance = result["distance"]
    threshold = result["threshold"]   # DeepFace's model-specific threshold
    verified = result["verified"]

    print("\n===== RESULT =====")
    print(f"Distance: {distance:.4f}")
    print(f"Threshold: {threshold:.4f}")

    if verified:
        print("✅ MATCHED — Same person")
    else:
        print("❌ NOT MATCHED — Different person")


# --------------- MAIN -------------------
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python aadhar_verification.py <aadhar_image> <selfie_image>")
        sys.exit(1)

    aadhar_path = sys.argv[1]
    selfie_path = sys.argv[2]

    match_faces(aadhar_path, selfie_path)
