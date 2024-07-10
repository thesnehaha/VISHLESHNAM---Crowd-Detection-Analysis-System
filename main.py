import cv2
import pandas as pd
from ultralytics import YOLO
from tracker import Tracker
import csv
from datetime import datetime

# Load YOLO model
model = YOLO('yolov8s.pt')

# Read class list
with open("coco.txt", "r") as f:
    class_list = f.read().split("\n")

# Initialize video capture
cap = cv2.VideoCapture('v2.mp4')

# Initialize Tracker
tracker = Tracker()

# Load age and gender models
age_net = cv2.dnn.readNetFromCaffe('age_deploy.prototxt', 'age_net.caffemodel')
gender_net = cv2.dnn.readNetFromCaffe('gender_deploy.prototxt', 'gender_net.caffemodel')

# Mean values for age and gender models
MODEL_MEAN_VALUES = (78.4263377603, 87.7689143744, 114.895847746)

# Age and gender lists
AGE_LIST = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(25-32)', '(38-43)', '(48-53)', '(60-100)']
GENDER_LIST = ['Male', 'Female']

# Prepare CSV file for writing using a context manager
with open('output.csv', mode='w', newline='') as csv_file:
    csv_writer = csv.writer(csv_file)
    csv_writer.writerow(["Frame", "X", "Y", "W", "H", "Class", "Age", "Gender"])

    # Initialize frame count
    frame_count = 0

    # Initialize time for tracking per second logging
    last_logged_time = datetime.now()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        current_time = datetime.now()
        
        # Check if one second has passed since the last log
        if (current_time - last_logged_time).total_seconds() < 1:
            continue

        # Update last logged time
        last_logged_time = current_time

        # Increment frame count
        frame_count += 1
        
        frame = cv2.resize(frame, (1020, 500))

        # Perform YOLO detection
        results = model.predict(frame)
        detections = results[0].boxes.data
        px = pd.DataFrame(detections).astype("float")

        # List to store detected persons
        person_bboxes = []
        for index, row in px.iterrows():
            x1, y1, x2, y2 = int(row[0]), int(row[1]), int(row[2]), int(row[3])
            class_id = int(row[5])
            class_name = class_list[class_id]
            if 'person' in class_name:
                person_bboxes.append([x1, y1, x2, y2])

        # Update tracker with current frame's detections
        bbox_id = tracker.update(person_bboxes)

        for bbox in bbox_id:
            x3, y3, x4, y4, id = bbox

            # Calculate center coordinates, width, and height of the bounding box
            center_x = (x3 + x4) // 2
            center_y = (y3 + y4) // 2
            w = x4 - x3
            h = y4 - y3

            # Extract the face region
            face = frame[y3:y4, x3:x4]

            # Prepare the face for age and gender detection
            blob = cv2.dnn.blobFromImage(face, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False)

            # Predict gender
            gender_net.setInput(blob)
            gender_preds = gender_net.forward()
            gender = GENDER_LIST[gender_preds[0].argmax()]

            # Predict age
            age_net.setInput(blob)
            age_preds = age_net.forward()
            age = AGE_LIST[age_preds[0].argmax()]

            # Draw bounding boxes and IDs on the frame
            cv2.rectangle(frame, (x3, y3), (x4, y4), (0, 255, 0), 2)  # Green bounding box with thickness 2
            cv2.putText(frame, f"ID: {id}", (x3, y3 - 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)  # Yellow text
            cv2.putText(frame, f"Age: {age}", (x3, y3 - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 1, cv2.LINE_AA)  # Magenta text
            cv2.putText(frame, f"Gender: {gender}", (x3, y3 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1, cv2.LINE_AA)  # Cyan text

            # Write data to CSV
            csv_writer.writerow([frame_count, center_x, center_y, w, h, 'person', age, gender])

        # Display the frame
        cv2.imshow("RGB", frame)
        if cv2.waitKey(1) & 0xFF == 27:  # Press 'Esc' to exit
            break

# Release video capture and close all windows
cap.release()
cv2.destroyAllWindows()