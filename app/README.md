# bgremover.art - Backend AI Service (FastAPI + rembg)

This is the backend API service for **bgremover.art** powered by Python FastAPI and open-source `rembg` (u2net ONNX model). It runs 100% locally with zero paid API keys or external subscriptions.

## 🚀 Quick Start

### 1. Create a Python Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r app/requirements.txt
```

### 3. Start the FastAPI Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🔒 Security & Performance Features
- **10MB Size Limit Enforcement**: Protects server memory and storage.
- **MIME Validation**: Accepts only verified `.jpg`, `.png`, and `.webp` payloads.
- **Auto 5-Minute Purge**: Background worker automatically deletes temporary files older than 5 minutes for complete privacy.
- **Pre-resize Optimization**: Automatically downscales images over 2048px for sub-second inference times.
