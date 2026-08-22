# Roadlytics — Road Traffic Analysis using YOLOv4 & Deep SORT

Roadlytics is a real-time vehicle detection, tracking, and traffic analysis system. It combines **YOLOv4** for vehicle detection with **Deep SORT** for multi-object tracking to monitor traffic flow from video footage — counting vehicles, tracking individual vehicle IDs across frames, and reporting live statistics such as current/total vehicle count and processing FPS.

The project ships two ways to run the analysis:
- A **Flask web backend + browser frontend** (live video upload, MJPEG stream, live stats)
- A standalone **Tkinter desktop app** for local video analysis

## Features

- Real-time vehicle detection using YOLOv4 (filters for cars, motorcycles, buses, and trucks)
- Robust multi-object tracking with Deep SORT, stable even in dense/fast-moving traffic
- Live vehicle counting: current vehicles in frame, total unique vehicles seen, and peak count
- FPS monitoring overlaid on the video output
- Web UI for uploading a traffic video and watching the annotated live feed with polling stats
- Desktop (Tkinter) alternative for local, file-based analysis

## Project Structure

```
Road Traffic Analysis/
├── Road Traffic Analysis/       # Frontend (HTML/CSS/JS) — "Roadlytics" web UI
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── RoadTrafficAnalysis_be/      # Backend
│   ├── app.py                   # Flask API + MJPEG stream (web UI backend)
│   ├── Main.py                  # Standalone Tkinter desktop app
│   ├── core/                    # YOLOv4 model utilities/config
│   ├── deep_sort/                # Deep SORT tracking implementation
│   ├── tools/                   # Feature encoder / detection generation utilities
│   ├── model_data/              # Deep SORT appearance embedding model
│   ├── yolo/                    # YOLOv4 weights & saved TensorFlow model
│   └── uploads/                 # Uploaded/sample videos
├── Documentation/               # Project & team documentation (PDF)
├── Paper Publishment/           # Published research paper
├── PPT/                         # Project presentation
├── Working Video/               # Demo video of the system in action
└── requirements.txt
```

## Tech Stack

- **Detection:** YOLOv4 (TensorFlow SavedModel)
- **Tracking:** Deep SORT
- **Backend:** Python, Flask, Flask-CORS, OpenCV, TensorFlow
- **Frontend:** HTML, CSS, JavaScript
- **Desktop app:** Tkinter

## Getting Started

### Prerequisites

- Python 3.8
- The YOLOv4 weights/saved model under `RoadTrafficAnalysis_be/yolo/` and the Deep SORT embedding model under `RoadTrafficAnalysis_be/model_data/` (tracked via Git LFS in this repo — run `git lfs pull` after cloning)

### Installation

```bash
git clone https://github.com/svrajesh21/Roadlytics.git
cd Roadlytics
git lfs pull
pip install -r RoadTrafficAnalysis_be/requirement.txt
```

### Running the Web App

1. Start the Flask backend:
   ```bash
   cd RoadTrafficAnalysis_be
   python app.py
   ```
   The API serves on `http://127.0.0.1:5000`.

2. Open `Road Traffic Analysis/index.html` in a browser, upload a traffic video, and start live analysis. The frontend calls:
   - `POST /api/start` — upload a video and begin detection
   - `GET /video_feed` — MJPEG stream of the annotated video
   - `GET /api/stats` — polls current/total vehicle count, FPS, and peak count
   - `POST /api/stop` — stop the running analysis

### Running the Desktop App

```bash
cd RoadTrafficAnalysis_be
python Main.py
```
(or double-click `run.bat`)

Use the "Generate & Load YOLOv4-DeepSort Model" button to load the model, then "Run Traffic Analysis" to select and process a video file.

## Documentation

- `Documentation/` — project and team documentation
- `Paper Publishment/` — the published research paper
- `PPT/` — project presentation slides
- `Working Video/` — a recorded demo of the system running end-to-end
