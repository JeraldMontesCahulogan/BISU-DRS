# BISU-DRS  
### BISU Depression Risk System

BISU-DRS is a web-based expert system designed to assess and explain students’ risk of depression using machine learning and explainable artificial intelligence (XAI). The system analyzes personal, academic, lifestyle, and psychosocial factors to generate prediction results and provide interpretable explanations that support guidance counselors in decision-making.

---

## About the Project

Mental health concerns among college students continue to increase due to academic pressure, personal struggles, and social challenges. Traditional assessment methods are often manual, time-consuming, and difficult to manage for large student populations.

To address this problem, BISU-DRS was developed as a modern web-based depression risk assessment system for Bohol Island State University – Candijay Campus. The platform supports:
- Early identification of students at risk
- Automated survey collection and assessment
- AI-powered depression risk prediction
- SHAP explainable AI interpretation
- Real-time communication between students and guidance counselors
- Secure and structured management of mental health assessment data

The system achieved:
- **90.7% Accuracy**
- **90.7% F1-Score**
using Logistic Regression as the final machine learning model.

---

# Key Features

## Authentication & User Management
- Student registration and login
- Role-based access control
- User approval management
- Profile management
- Secure authentication system

## Survey & Assessment System
- Survey scheduling by department and year level
- Student assessment submission
- Automated response collection
- Real-time survey availability

## Machine Learning Prediction
- AI-powered depression risk prediction
- Logistic Regression model integration
- Real-time prediction processing
- Probability-based prediction results

## Explainable AI (SHAP)
- SHAP explanation generation
- Feature contribution analysis
- Transparent AI decision support
- Explainable prediction outputs

## Communication System
- Real-time messaging between students and counselors
- Guidance support communication
- Counseling coordination support

## Security & Privacy
- Data encryption
- Data masking
- Inactivity controls
- Role-based access
- Secure authentication mechanisms

---

# Technologies Used

## Frontend
- React.js
- Vite
- Tailwind CSS
- Zustand

## Backend
- Flask API
- Python

## Database & Backend Services
- Supabase
- PostgreSQL

## Machine Learning & AI
- Scikit-learn
- SHAP
- Pandas
- NumPy
- Joblib

## Development Tools
- Visual Studio Code
- Git & GitHub

---

# System Architecture

```text
Student Responses
        ↓
React + Tailwind Frontend
        ↓
Flask API
        ↓
Machine Learning Model
(Logistic Regression)
        ↓
SHAP Explainable AI
        ↓
Prediction Results & Explanations
        ↓
Supabase Database
```

The system integrates machine learning, Flask API deployment, SHAP explainability, and modern web technologies to provide efficient and interpretable assessment results.
---

# Machine Learning Model

The BISU-DRS uses a supervised machine learning approach trained using:
- 1,080 student responses
- 22 input variables
- Personal factors
- Academic factors
- Psychosocial factors
- Lifestyle-related factors

Multiple machine learning models were evaluated, and Logistic Regression was selected as the final model because it achieved the best performance with:
- **90.7% Accuracy**
- **90.7% F1-Score**

---

# Explainable AI Integration

The system integrates SHAP (SHapley Additive exPlanations) to improve transparency and interpretability of prediction results.

SHAP helps:
- Explain how predictions are generated
- Identify which factors most influence the prediction
- Improve trust in the AI model
- Support counselor decision-making

This allows guidance counselors to better understand the reasoning behind each depression risk prediction.

---

# Functional Testing Results

The system underwent functional testing and usability evaluation using the ISO/IEC 25010 software quality model.

### Results
- Functional Score: **95.1%**
- Quality Value: **5 (Excellent)**
- Usability Rating: **4.49 (Excellent)**

These results indicate that the system is:
- Reliable
- User-friendly
- Efficient
- Secure
- Effective for mental health assessment support

---

# Purpose of the Project

This project was developed as an undergraduate thesis and capstone project for the Bachelor of Science in Computer Science program at Bohol Island State University – Candijay Campus.

The system serves as a decision-support tool for guidance counselors and is not intended to replace professional mental health diagnosis or clinical evaluation.

---

# Future Improvements

- Improve machine learning model performance
- Add advanced analytics dashboard
- Enhance mobile responsiveness
- Expand real-time notification system
- Add additional explainable AI visualizations
- Improve scalability and optimization

---

# Authors

- Jerald M. Cahulogan - System Developer
- Kimberly B. Ligan
- Jade P. Tagupa
- Ma. Jhimea P. Magbanua

---

# License

This project is intended for educational, research, and academic purposes only.
