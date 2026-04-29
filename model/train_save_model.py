import warnings
warnings.filterwarnings("ignore", category=UserWarning)

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.linear_model import LogisticRegression

DATA_PATH = "cleaned_dataset_update.csv"
MODEL_OUT = "depression_logreg_pipeline.pkl"

df = pd.read_csv(DATA_PATH)

one_hot_cols = ["course", "living_arrangement"]

ordinal_cols = [
    "year_level",
    "bmi",
    "sleep_duration",
    "breakfast_habit",
    "exercise_frequency",
    "smoking_status",
    "alcohol_consumption",
    "academic_pressure",
    "academic_dissatisfaction",
    "financial_stress",
    "schoolwork_spent_daily",
    "academic_workload",
    "social_support",
    "romantic_personal_relationship_stress",
]

binary_col_gender = ["gender"]

binary_cols = [
    "working_student",
    "pwd",
    "indigenous_group",
    "bullied",
]

numeric_cols = ["age"]
target = "depression"

ordinal_mappings = [
    ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    ["Underweight", "Normal", "Overweight", "Obese"],
    ["Less than 7 hours", "7 to 9 hours", "More than 9 hours"],
    ["Rarely", "Sometimes", "Regularly"],
    ["Inactive", "Moderate", "Active"],
    ["Non-smoker", "Ex-smoker", "Current smoker"],
    ["Never", "Rarely", "Occasionally", "Daily"],
    ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    ["Less than 2h", "2 to 3h", "More than 3h"],
    ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    ["Never", "Rarely", "Sometimes", "Often", "Always"],
    ["Never", "Rarely", "Sometimes", "Often", "Always"],
]

df["gender"] = df["gender"].map({"Male": 1, "Female": 0}).fillna(0)

for col in binary_cols + [target]:
    df[col] = df[col].map({"Yes": 1, "No": 0}).fillna(0)

df.fillna("Missing", inplace=True)

preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_cols),
        ("onehot", OneHotEncoder(sparse_output=False, handle_unknown="ignore"), one_hot_cols),
        (
            "ordinal",
            OrdinalEncoder(
                categories=ordinal_mappings,
                handle_unknown="use_encoded_value",
                unknown_value=-1,
            ),
            ordinal_cols,
        ),
        ("binary", "passthrough", binary_col_gender + binary_cols),
    ],
    verbose_feature_names_out=False,
)

preprocessor.set_output(transform="pandas")

model = LogisticRegression(max_iter=300, random_state=42)

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("classifier", model),
    ]
)

X = df.drop(columns=[target])
y = df[target]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scoring = {"accuracy": "accuracy", "precision": "precision", "recall": "recall", "f1": "f1"}

cv_results = cross_validate(pipeline, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)

pipeline.fit(X_train, y_train)

# save transformed background for SHAP
background = pipeline.named_steps["preprocessor"].transform(X_train)
background = background.sample(min(100, len(background)), random_state=42)

joblib.dump(
    {
        "model": pipeline,
        "feature_order": list(X.columns),
        "target": target,
        "background": background,
    },
    MODEL_OUT,
)

print("Model saved:", MODEL_OUT)