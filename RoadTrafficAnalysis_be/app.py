import os
import threading
import time

os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import cv2
from tensorflow.python.saved_model import tag_constants
from tensorflow.compat.v1 import ConfigProto, InteractiveSession
from deep_sort import preprocessing, nn_matching
from deep_sort.detection import Detection
from deep_sort.tracker import Tracker
import core.utils as utils
import tools.generate_detections as gdet
import sys
sys.path.insert(0, os.getcwd())

app = Flask(__name__)
CORS(app)

state = {
    "running": False,
    "total_vehicles": 0,
    "current_vehicles": 0,
    "fps": 0.0,
    "track_ids": [],
    "error": None,
}

peak_count = 0

state_lock = threading.Lock()
latest_frame = None
frame_lock = threading.Lock()
detection_thread = None

encoder = None
tracker = None
model = None

INPUT_SIZE = 416
MAX_COSINE_DISTANCE = 0.3
NN_BUDGET = None


def load_models():
    global encoder, tracker, model
    model_filename = os.path.join(os.getcwd(), "model_data", "mars-small128.pb")
    encoder = gdet.create_box_encoder(model_filename, batch_size=1)
    metric = nn_matching.NearestNeighborDistanceMetric("cosine", MAX_COSINE_DISTANCE, NN_BUDGET)
    tracker = Tracker(metric)
    config = ConfigProto()
    config.gpu_options.allow_growth = True
    InteractiveSession(config=config)
    saved_model_loaded = tf.saved_model.load('yolo/yolov4-416', tags=[tag_constants.SERVING])
    model = saved_model_loaded.signatures['serving_default']


def run_detection(video_path):
    global encoder, tracker, latest_frame, peak_count
    seen_ids = set()
    frame_skip = 5
    frame_count = 0
    fps_start = time.time()
    fps_counter = 0

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        with state_lock:
            state["error"] = "Could not open video file"
            state["running"] = False
        return

    with state_lock:
        state["running"] = True
        state["error"] = None
        state["total_vehicles"] = 0
        state["current_vehicles"] = 0
        state["track_ids"] = []
        peak_count = 0

    while True:
        with state_lock:
            if not state["running"]:
                break

        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        frame = cv2.resize(frame, (640, 480))

        if frame_count % frame_skip == 0:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image_data = cv2.resize(frame_rgb, (INPUT_SIZE, INPUT_SIZE)) / 255.
            image_data = image_data[np.newaxis, ...].astype(np.float32)
            pred_bbox = model(tf.constant(image_data))

            for key, value in pred_bbox.items():
                boxes = value[:, :, 0:4]
                pred_conf = value[:, :, 4:]

            boxes, scores, classes, valid_detections = tf.image.combined_non_max_suppression(
                boxes=tf.reshape(boxes, (tf.shape(boxes)[0], -1, 1, 4)),
                scores=tf.reshape(pred_conf, (tf.shape(pred_conf)[0], -1, tf.shape(pred_conf)[-1])),
                max_output_size_per_class=20,
                max_total_size=20,
                iou_threshold=0.45,
                score_threshold=0.55
            )

            num_objects = valid_detections.numpy()[0]
            all_bboxes = boxes.numpy()[0][:int(num_objects)]
            all_scores = scores.numpy()[0][:int(num_objects)]
            all_classes = classes.numpy()[0][:int(num_objects)]

            VEHICLE_CLASSES = {2, 3, 5, 7}
            vehicle_mask = np.array([int(c) in VEHICLE_CLASSES for c in all_classes])

            if vehicle_mask.any():
                bboxes = utils.format_boxes(all_bboxes[vehicle_mask], *frame_rgb.shape[:2])
                scores_np = all_scores[vehicle_mask]
                features = encoder(frame_rgb, bboxes)
                detections = [Detection(b, s, "vehicle", f)
                              for b, s, f in zip(bboxes, scores_np, features)]
            else:
                detections = []

            tracker.predict()
            tracker.update(detections)

            active_ids = []
            for track in tracker.tracks:
                if not track.is_confirmed() or track.time_since_update > 1:
                    continue
                active_ids.append(track.track_id)
                seen_ids.add(track.track_id)
                bbox = track.to_tlbr()
                x1, y1, x2, y2 = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                label = f"ID:{track.track_id}"
                (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                cv2.rectangle(frame, (x1, y1 - th - 6), (x1 + tw + 4, y1), (0, 255, 0), -1)
                cv2.putText(frame, label, (x1 + 2, y1 - 4),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)

            fps_counter += 1
            fps = fps_counter / max(time.time() - fps_start, 0.001)

            cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)
            cv2.putText(frame, f"Vehicles: {len(active_ids)}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)
            cv2.putText(frame, f"Total: {len(seen_ids)}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)

            with state_lock:
                state["current_vehicles"] = len(active_ids)
                state["total_vehicles"] = len(seen_ids)
                state["fps"] = round(fps, 1)
                state["track_ids"] = active_ids

                if state["current_vehicles"] > peak_count:
                    peak_count = state["current_vehicles"]

        _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        with frame_lock:
            latest_frame = jpeg.tobytes()

    cap.release()
    with state_lock:
        state["running"] = False

    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(blank, "Analysis complete", (170, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    _, jpeg = cv2.imencode('.jpg', blank)
    with frame_lock:
        latest_frame = jpeg.tobytes()


def generate_frames():
    while True:
        with frame_lock:
            frame = latest_frame
        if frame is None:
            blank = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(blank, "Waiting for stream...", (150, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (100, 100, 100), 2)
            _, jpeg = cv2.imencode('.jpg', blank)
            frame = jpeg.tobytes()
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.03)


@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/start', methods=['POST'])
def start_detection():
    global detection_thread, peak_count
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    video_file = request.files['video']
    upload_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    video_path = os.path.join(upload_dir, video_file.filename)
    video_file.save(video_path)

    peak_count = 0

    with state_lock:
        state["running"] = False

    if detection_thread and detection_thread.is_alive():
        detection_thread.join(timeout=3)

    detection_thread = threading.Thread(target=run_detection, args=(video_path,), daemon=True)
    detection_thread.start()

    return jsonify({"message": "Detection started"})


@app.route('/api/stop', methods=['POST'])
def stop_detection():
    with state_lock:
        state["running"] = False
    return jsonify({"message": "Detection stopped"})


@app.route('/api/stats', methods=['GET'])
def get_stats():
    with state_lock:
        return jsonify({
            "running": state["running"],
            "current_vehicles": state["current_vehicles"],
            "total_vehicles": state["total_vehicles"],
            "fps": state["fps"],
            "peak": peak_count,
            "error": state["error"],
        })


if __name__ == '__main__':
    print("Loading models, please wait...")
    load_models()
    app.run(debug=False, host='0.0.0.0', port=5000, threaded=True)