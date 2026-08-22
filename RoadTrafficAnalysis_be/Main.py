from tkinter import messagebox
from tkinter import *
from tkinter import simpledialog
import tkinter
from tkinter import filedialog
from tkinter.filedialog import askopenfilename
from tkinter import ttk
import numpy as np
import os
 
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"  # Disable GPU
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"  # Disable oneDNN optimizations
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow warnings
 
import time
import tensorflow as tf
 
physical_devices = tf.config.experimental.list_physical_devices('GPU')
if len(physical_devices) > 0:
    tf.config.experimental.set_memory_growth(physical_devices[0], True)
from absl import app, flags, logging
from absl.flags import FLAGS
import core.utils as utils
from core.yolov4 import filter_boxes
from tensorflow.python.saved_model import tag_constants
from core.config import cfg
from PIL import Image
import cv2
import matplotlib.pyplot as plt
from tensorflow.compat.v1 import ConfigProto
from tensorflow.compat.v1 import InteractiveSession
# deep sort imports
from deep_sort import preprocessing, nn_matching
from deep_sort.detection import Detection
from deep_sort.tracker import Tracker
import sys
sys.path.insert(0, os.getcwd())
import tools.generate_detections as gdet
from tqdm import tqdm
from collections import deque
 
pts = [deque(maxlen=30) for _ in range(9999)]
 
main = tkinter.Tk()
main.title("Road Traffic Analysis using YOLO-V4 & Deep Sort")
main.geometry("1300x1200")
from PIL import Image, ImageTk
 
bg_image = Image.open("traffic.jpg")
bg_image = bg_image.resize((900, 400))
bg_photo = ImageTk.PhotoImage(bg_image)
 
bg_label = Label(main, image=bg_photo)
bg_label.place(x=0, y=0, relwidth=1, relheight=1)
 
 
global filename
global model, encoder, tracker, config
max_cosine_distance = 0.4
nn_budget = None
nms_max_overlap = 1.0
global accuracy, precision
 
 
def loadModel():
    global encoder, tracker, config
 
    model_filename = os.path.join(os.getcwd(), "model_data", "mars-small128.pb")
 
    if not os.path.exists(model_filename):
        messagebox.showerror("Error", "DeepSORT model not found:\n" + model_filename)
        return
 
    encoder = gdet.create_box_encoder(model_filename, batch_size=1)
 
    metric = nn_matching.NearestNeighborDistanceMetric(
        "cosine", max_cosine_distance, nn_budget
    )
 
    tracker = Tracker(metric)
 
    config = ConfigProto()
    config.gpu_options.allow_growth = True
    session = InteractiveSession(config=config)
 
    pathlabel.config(text="YOLOv4 DeepSort Model Loaded")
 
    text.delete('1.0', END)
    text.insert(END, "YOLOv4 + DeepSORT Model Loaded Successfully\n\n")
 
 
def vehicleDetection():
    global encoder
 
    if 'encoder' not in globals():
        messagebox.showerror("Error", "Please load the model first by clicking 'Generate & Load YOLOv4-DeepSort Model'")
        return
 
    global model, encoder, tracker
 
    filename = filedialog.askopenfilename(
        initialdir=os.path.join(os.getcwd(), "data", "video"),
        title="Select Traffic Video",
        filetypes=(("MP4 files", "*.mp4"), ("All files", "*.*"))
    )
 
    if filename == "":
        messagebox.showwarning("Warning", "No video selected")
        return
 
    pathlabel.config(text=filename)
 
    text.delete('1.0', END)
    text.insert(END, filename + " loaded\n\n")
 
    # Load YOLO model
    saved_model_loaded = tf.saved_model.load(
        'yolo/yolov4-416', tags=[tag_constants.SERVING]
    )
    model = saved_model_loaded.signatures['serving_default']
 
    cap = cv2.VideoCapture(filename)
 
    if not cap.isOpened():
        messagebox.showerror("Error", "Could not open video")
        return
 
    # OPT 1: Increase frame skip to reduce processing load
    frame_skip = 5
    frame_count = 0
 
    # Input size must match the saved model (yolov4-416 expects 416x416)
    INPUT_SIZE = 416
 
    # OPT 3: Track FPS for monitoring
    fps_start = time.time()
    fps_counter = 0
 
    while True:
        ret, frame = cap.read()
 
        if not ret:
            print("Video ended or frame not received")
            break
 
        frame_count += 1
        if frame_count % frame_skip != 0:
            continue
 
        # OPT 4: Resize early to reduce memory load throughout the pipeline
        frame = cv2.resize(frame, (640, 480))
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
 
        image_data = cv2.resize(frame, (INPUT_SIZE, INPUT_SIZE))
        image_data = image_data / 255.
        image_data = image_data[np.newaxis, ...].astype(np.float32)
 
        batch_data = tf.constant(image_data)
        pred_bbox = model(batch_data)
 
        for key, value in pred_bbox.items():
            boxes = value[:, :, 0:4]
            pred_conf = value[:, :, 4:]
 
        # OPT 5: Reduce max detections from 50 to 30 for faster NMS
        boxes, scores, classes, valid_detections = tf.image.combined_non_max_suppression(
            boxes=tf.reshape(boxes, (tf.shape(boxes)[0], -1, 1, 4)),
            scores=tf.reshape(pred_conf, (tf.shape(pred_conf)[0], -1, tf.shape(pred_conf)[-1])),
            max_output_size_per_class=30,
            max_total_size=30,
            iou_threshold=0.45,
            score_threshold=0.50
        )
 
        num_objects = valid_detections.numpy()[0]
 
        bboxes = boxes.numpy()[0][:int(num_objects)]
        scores_np = scores.numpy()[0][:int(num_objects)]
        classes_np = classes.numpy()[0][:int(num_objects)]
 
        original_h, original_w, _ = frame.shape
        bboxes = utils.format_boxes(bboxes, original_h, original_w)
 
        features = encoder(frame, bboxes)
 
        detections = [
            Detection(bbox, score, "vehicle", feature)
            for bbox, score, feature in zip(bboxes, scores_np, features)
        ]
 
        tracker.predict()
        tracker.update(detections)
 
        for track in tracker.tracks:
            if not track.is_confirmed() or track.time_since_update > 1:
                continue
 
            bbox = track.to_tlbr()
 
            cv2.rectangle(
                frame,
                (int(bbox[0]), int(bbox[1])),
                (int(bbox[2]), int(bbox[3])),
                (0, 255, 0),
                2
            )
 
            # OPT 6: Show track ID on each vehicle
            cv2.putText(
                frame,
                f"ID: {track.track_id}",
                (int(bbox[0]), int(bbox[1]) - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )
 
        # OPT 7: Display live FPS on frame
        fps_counter += 1
        elapsed = time.time() - fps_start
        if elapsed > 0:
            fps = fps_counter / elapsed
            cv2.putText(
                frame,
                f"FPS: {fps:.1f}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2
            )
 
        cv2.imshow("Traffic Detection", cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
 
        # OPT 8: waitKey(1) keeps display responsive without blocking
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
 
    cap.release()
    cv2.destroyAllWindows()
 
 
def close():
    main.destroy()
 
 
font = ('times', 20, 'bold')
title = Label(main, text='Road Traffic Analysis using YOLO-V4 & Deep Sort', bg='#fdae61', fg='black', font=('Times New Roman', 30, 'bold'))
title.place(relx=0.5, y=10, anchor='n')
 
font1 = ('times', 14, 'bold')
font2 = ('times', 12, 'bold')
 
 
def display_content(content):
    text_box.delete('1.0', END)
    text_box.insert(END, content)
 
 
def show_default_message():
    display_content(why_choose_us_content)
 
 
about_content = """About This Project
Our Road Traffic Analysis System leverages advanced AI technologies like YOLOv4 and Deep SORT to provide accurate and efficient traffic monitoring solutions. This system is designed to enhance road safety, reduce congestion, and improve urban planning.
 
Key Features of the Project:
✅ Real-time Detection: Detects and tracks vehicles in real-time using high-performance object detection models.
✅ Vehicle Classification: Identifies different types of vehicles such as cars, trucks, buses, and bikes for detailed analysis.
✅ Traffic Flow Analysis: Monitors vehicle movement patterns to predict congestion zones.
✅ Accurate Counting: Tracks vehicle counts in designated areas to support data-driven decision-making.
✅ Robust Tracking with Deep SORT: Ensures stable tracking even in crowded or fast-moving traffic conditions.
✅ Scalable Solution: Suitable for small streets, major highways, and complex intersections.
 
This project is ideal for city planners, law enforcement agencies, and researchers looking for data-driven insights to improve transportation systems.
"""
 
how_to_use_content = """How to Use
Follow these steps to efficiently use the Road Traffic Analysis System:
 
1️⃣ Step 1: Click on 'Generate & Load YOLOv4-DeepSort Model' to initialize the AI model. This prepares the system to identify and track vehicles.
2️⃣ Step 2: Click on 'Run Traffic Analysis' to start real-time analysis. The system will analyze live video feeds or pre-recorded footage.
3️⃣ Step 3: Results will include:
    🔹 Vehicle count and classification
    🔹 Speed tracking and movement patterns
    🔹 Congestion detection alerts
 
🔹 Best Practices for Maximum Accuracy:
✅ Ensure the camera is positioned at an elevated angle to maximize road coverage.
✅ Avoid unstable mounts or shaky positions, as this may affect tracking performance.
✅ Clean the camera lens regularly to prevent blurry footage.
✅ Ensure good lighting conditions to enhance vehicle recognition accuracy.
✅ Use a stable internet connection for smooth performance during live monitoring.
 
Following these steps ensures optimal performance for accurate traffic analysis.
"""
 
advantages_content = """Advantages:
Our Road Traffic Analysis System stands out due to its powerful features and benefits:
 
🚦 Advanced AI Integration: Combines the strengths of YOLOv4 and Deep SORT for precise vehicle tracking and detection.
📊 Real-Time Insights: Provides instant data on traffic patterns, allowing authorities to make proactive decisions.
🚘 Flexible Monitoring: Supports both live camera feeds and recorded video footage.
🧠 Intelligent Tracking: Deep SORT ensures continuous tracking of each vehicle, even in dense traffic.
📍 Congestion Prediction: Predicts possible congestion points based on vehicle movement patterns.
🔎 Accurate Vehicle Identification: Detects multiple vehicle types such as sedans, trucks, buses, and motorcycles.
📈 Data-Driven Decisions: Generates detailed reports to assist city planners in optimizing traffic flow.
🔒 Enhanced Safety Measures: Identifies high-risk areas where accidents are more likely to occur.
🧩 Seamless Integration: Can be integrated with smart traffic management systems for automated control.
⚡ Optimized Performance: The combination of YOLOv4 and Deep SORT ensures fast and accurate results, even on standard hardware.
"""
 
why_choose_us_content = """Why Choose Us?
Choosing our Road Traffic Analysis System ensures you gain a comprehensive, efficient, and user-friendly solution for traffic management.
 
✅ Proven AI Technology: Utilizes the power of YOLOv4 and Deep SORT — trusted models known for speed and accuracy.
✅ User-Centric Design: An intuitive interface makes the system easy to use, even for non-technical users.
✅ Detailed Insights: Provides in-depth data visualization, ensuring clear insights into road conditions.
✅ Customizable Solution: The system can be adapted for various environments such as parking lots, toll plazas, and busy intersections.
✅ Scalability: Capable of handling small urban roads as well as multi-lane highways.
✅ Enhanced Security: Detects unusual driving patterns, improving surveillance capabilities.
✅ Performance Optimization: Achieves fast detection rates with minimal resource consumption.
✅ Real-Time Reporting: Generates reports with actionable insights for better decision-making.
✅ Reliable Support: Our team offers guidance for implementation, maintenance, and performance optimization.
✅ Cost-Effective: Provides high-end performance at a fraction of traditional traffic monitoring system costs.
 
With this solution, you can efficiently manage traffic flow, reduce congestion, and enhance road safety.
"""
 
about_btn = Button(main, text="About", command=lambda: display_content(about_content))
about_btn.place(x=100, y=130)
about_btn.config(font=font1, bg='peach puff', fg='black')
 
how_to_use_btn = Button(main, text="How to Use", command=lambda: display_content(how_to_use_content))
how_to_use_btn.place(x=180, y=130)
how_to_use_btn.config(font=font1, bg='peach puff', fg='black')
 
advantages_btn = Button(main, text="Advantages", command=lambda: display_content(advantages_content))
advantages_btn.place(x=310, y=130)
advantages_btn.config(font=font1, bg='peach puff', fg='black')
 
text_box = Text(main, height=20, width=64)
text_box.place(x=100, y=200)
text_box.config(font=font2, bg='white', fg='black', bd=0, relief='flat')
 
main.bind("<Button-1>", lambda event: show_default_message() if event.widget not in [about_btn, how_to_use_btn, advantages_btn] else None)
show_default_message()
 
font1 = ('times', 14, 'bold')
upload = Button(main, text="Generate & Load YOLOv4-DeepSort Model", command=loadModel)
upload.place(x=700, y=130)
upload.config(font=font1, bg='peach puff', fg='black')
 
pathlabel = Label(main)
pathlabel.config(bg='yellow4', fg='white')
pathlabel.config(font=font1)
pathlabel.place(x=700, y=180)
 
markovButton = Button(main, text="Run Traffic Analysis", command=vehicleDetection)
markovButton.place(x=700, y=230)
markovButton.config(font=font1, bg='peach puff', fg='black')
 
predictButton = Button(main, text="Exit", command=close)
predictButton.place(x=700, y=580)
predictButton.config(font=font1, bg='peach puff', fg='black')
 
font1 = ('times', 12, 'bold')
text = Text(main, height=15, width=61)
scroll = Scrollbar(text)
text.configure(yscrollcommand=scroll.set)
text.place(x=700, y=280)
text.config(font=font1, bg='white', fg='black')
 
main.mainloop()
