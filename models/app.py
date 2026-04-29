from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import shap
import numpy as np

MODEL_PATH = "depression_logreg_pipeline.pkl"

app = Flask(__name__)

CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=False,
    allow_headers=["Content-Type", "ngrok-skip-browser-warning"],
    methods=["GET", "POST", "OPTIONS"],
)

bundle = joblib.load(MODEL_PATH)
pipeline = bundle["model"]
feature_order = bundle["feature_order"]
background = bundle["background"]

preprocessor = pipeline.named_steps["preprocessor"]
classifier = pipeline.named_steps["classifier"]

# correct: use saved background, not the incoming sample
explainer = shap.LinearExplainer(classifier, background)


def normalize_payload(payload):
    df = pd.DataFrame([payload])

    for col in feature_order:
        if col not in df.columns:
            df[col] = None

    return df[feature_order]


@app.get("/health")
def health():
    return jsonify({"ok": True})


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return ("", 204)

    data = request.get_json(force=True)
    sample = normalize_payload(data)

    pred = int(pipeline.predict(sample)[0])
    prob = float(pipeline.predict_proba(sample)[0][1])

    X_transformed = preprocessor.transform(sample)

    if not isinstance(X_transformed, pd.DataFrame):
        try:
            feature_names = preprocessor.get_feature_names_out()
            feature_names = [str(x) for x in feature_names]
        except Exception:
            feature_names = [f"feature_{i}" for i in range(X_transformed.shape[1])]
        X_transformed = pd.DataFrame(X_transformed, columns=feature_names)
    else:
        feature_names = X_transformed.columns.to_list()

    shap_values = explainer.shap_values(X_transformed)

    if isinstance(shap_values, list):
        shap_row = shap_values[1][0]
    else:
        shap_row = shap_values[0]

    expected_value = explainer.expected_value
    if isinstance(expected_value, (list, np.ndarray)):
        expected_value = np.array(expected_value).flatten()[0]

    shap_items = []
    for i, name in enumerate(feature_names):
        shap_items.append(
            {
                "feature": str(name),
                "value": float(X_transformed.iloc[0, i]),
                "shap_value": float(shap_row[i]),
            }
        )

    shap_items.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

    return jsonify(
        {
            "prediction": pred,
            "label": "YES" if pred == 1 else "NO",
            "probability": round(prob, 6),
            "shap_local": {
                "expected_value": float(expected_value),
                "items": shap_items,
            },
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)