UnfoldAI

AI-Powered Multimodal Learning Platform for Dyslexic Learners

UnfoldAI is an AI-powered multimodal learning platform designed to support dyslexic learners through personalized, accessible, and interactive learning experiences.

The platform combines interactive learning activities, AI-powered evaluation, personalized feedback, student learning memory, progress analysis, speech processing, audio analysis, and accessibility-focused features.

Features

Student Learning

Personalized student learning experience

Interactive lessons and lesson player

Multiple-choice exercises

Audio-based exercises

Emotional exercises

Situational exercises

AI-powered evaluation of student submissions

Immediate personalized feedback

Student learning memory

Lesson completion tracking

AI-generated lesson plans

Progress reports

AI-powered lesson chatbot

Multimodal Learning

Audio recording

Camera and audio recording

Speech-to-text processing

Voice Activity Detection

Audio analysis

Noise reduction

Speech-based learning activities

Multimodal exercise support

Accessibility

Accessibility toolbar

Reading ruler

Speech and audio support

Audio-based interactions

Accessibility-focused learning interface

Admin Portal

Admin dashboard

Course curation

Lesson management

Exercise management

Student diagnostics

AI-Powered Learning

UnfoldAI uses LangGraph-based AI agents to create structured learning workflows.

Exercise Agent

The Exercise Agent evaluates student submissions and adapts the learning experience based on student performance.

Student Submission
        ↓
Evaluate Submission
        ↓
Generate Feedback
        ↓
Update Student Memory
        ↓
Check Lesson Completion
        ↓
Generate Lesson Plan

Report Agent

The Report Agent analyzes student learning data and generates structured progress reports.

Student Data
     ↓
Gather Data
     ↓
Analyze Progress
     ↓
Compose Report
     ↓
Progress Report

Multimodal & Audio Processing

UnfoldAI includes a dedicated audio-analysis component for speech-based learning activities.

Audio Input
     ↓
Audio Processing
     ↓
Noise Reduction
     ↓
Voice Activity Detection
     ↓
Speech Processing
     ↓
Faster-Whisper
     ↓
Transcription / Analysis

System Architecture

                         ┌──────────────────────┐
                         │    React Frontend    │
                         │ TypeScript + Vite    │
                         │    Tailwind CSS      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    FastAPI Backend   │
                         │       REST API       │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
       │   MongoDB    │      │ AI Agents    │      │    Audio     │
       │   Database   │      │  LangGraph   │      │   Analysis   │
       └──────────────┘      └───────┬──────┘      └──────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │   Groq LLM  │
                              └─────────────┘

Technology Stack

Category

Technologies

Frontend

React, TypeScript, Vite, Tailwind CSS

Backend

Python, FastAPI, Uvicorn, Pydantic

AI Orchestration

LangGraph

LLM Framework

LangChain Core, LangChain Groq

LLM

Groq / Llama 3.3 70B Versatile

Speech Recognition

Faster-Whisper

Voice Detection

Silero VAD

Audio Processing

Librosa, SciPy, SoundFile, NoiseReduce

Machine Learning

PyTorch, Torchaudio

Database

MongoDB, Motor, PyMongo

Data Processing

Pandas

Project Structure

UnfoldAI/
│
├── app/
│   ├── agents/
│   │   ├── nodes/
│   │   ├── prompts/
│   │   ├── graph.py
│   │   ├── state.py
│   │   └── utils.py
│   │
│   ├── agents_report/
│   │   ├── nodes/
│   │   ├── graph.py
│   │   └── state.py
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       └── router.py
│   │
│   ├── core/
│   ├── exceptions/
│   ├── middleware/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── stubs/
│   └── main.py
│
├── audio_analysis/
├── data/
├── frontend/
├── frontend-app/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── AdminPortal.tsx
│   │   │   ├── GatewayPage.tsx
│   │   │   └── StudentPortal.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── scratch/
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md

Application Portals

Student Portal

The Student Portal provides the core learning experience, including lessons, exercises, AI feedback, chatbot functionality, progress reporting, and accessibility features.

Admin Portal

The Admin Portal provides management functionality for courses, lessons, exercises, and student diagnostics.

Gateway

The Gateway provides the main entry point and navigation into the platform.

Backend API

The backend is built with FastAPI and organized around versioned REST APIs.

/api/v1

The API includes functionality for:

Students

Courses

Lessons

Exercises

Reports

Chat

Administration

Health Check

GET /health

Example response:

{
  "status": "healthy",
  "app": "Unfold"
}

FastAPI interactive documentation is available at:

/docs

Learning Workflow

Student
   ↓
Select Lesson
   ↓
Complete Exercise
   ↓
Submit Response
   ↓
AI Evaluation
   ↓
Personalized Feedback
   ↓
Learning Memory Updated
   ↓
Lesson Completion Check
   ↓
Personalized Next Learning Action

Progress Reporting Workflow

Student Information
        ↓
Gather Data
        ↓
Analyze Progress
        ↓
Compose Report
        ↓
Student Progress Report

Installation

Prerequisites

Python 3.10+

Node.js

npm

Git

MongoDB

Groq API key

Clone the Repository

git clone https://github.com/KISHORE-310/UnfoldAI.git
cd UnfoldAI

Backend Setup

Windows

python -m venv venv
venv\Scripts\activate

macOS / Linux

python3 -m venv venv
source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Environment Configuration

Create a .env file using .env.example as a reference.

Configure the required MongoDB and Groq settings:

APP_NAME=Unfold
DEBUG=true
API_V1_PREFIX=/api/v1

MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=unfold_db

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL_NAME=llama-3.3-70b-versatile

LOG_LEVEL=INFO

Never commit API keys, passwords, database credentials, or other secrets to the repository.

Run the Backend

From the project root:

uvicorn app.main:app --reload

Frontend Setup

Open another terminal:

cd frontend-app

Install dependencies:

npm install

Start the development server:

npm run dev

Build the frontend:

npm run build

Security

Sensitive configuration is managed through environment variables.

Before production deployment, review:

Authentication and authorization

API access controls

CORS configuration

Database security

Secret management

Logging and monitoring

Production environment configuration

Project Status

UnfoldAI is an actively developed MVP focused on building an accessible and personalized learning platform for dyslexic learners.

The repository contains the core frontend, FastAPI backend, AI agent workflows, audio-analysis components, database integration, student learning flows, administrative functionality, and progress-reporting architecture.

Future Scope

Advanced adaptive learning

More personalized AI recommendations

Expanded learning analytics

Additional multimodal exercises

Enhanced accessibility features

Improved progress visualization

Advanced speech and audio analysis

Production-grade authentication and authorization

Scalable deployment infrastructure

Expanded dyslexia-focused learning activities

