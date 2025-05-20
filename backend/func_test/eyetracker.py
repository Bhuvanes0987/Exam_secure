import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils

# Iris landmark indices for left and right eye (from MediaPipe docs)
LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]

cap = cv2.VideoCapture(0)
with mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True) as face_mesh:
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        h, w = frame.shape[:2]
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(frame_rgb)

        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            
            # Get iris landmarks for left eye
            left_iris_points = np.array([(landmarks[i].x * w, landmarks[i].y * h) for i in LEFT_IRIS])
            left_iris_center = np.mean(left_iris_points, axis=0)
            
            # Get eye landmarks for left eye (e.g., upper and lower eyelid)
            left_eye_top = np.array([landmarks[159].x * w, landmarks[159].y * h])
            left_eye_bottom = np.array([landmarks[145].x * w, landmarks[145].y * h])
            left_eye_left = np.array([landmarks[33].x * w, landmarks[33].y * h])
            left_eye_right = np.array([landmarks[133].x * w, landmarks[133].y * h])
            
            # Calculate normalized iris position inside eye bounding box
            eye_width = left_eye_right[0] - left_eye_left[0]
            eye_height = left_eye_bottom[1] - left_eye_top[1]

            #print("Eye width:", eye_width)
            #print("Eye height:", eye_height)

            # Avoid division by zero or negative values
            if eye_width <= 0 or eye_height <= 0:
                continue

            norm_x = (left_iris_center[0] - left_eye_left[0]) / eye_width
            norm_y = (left_iris_center[1] - left_eye_top[1]) / eye_height

            
            # norm_x and norm_y ~0 to 1 indicate iris position inside eye horizontally and vertically
            
            # Display values (for debugging)
            cv2.putText(frame, f'Iris X: {norm_x:.2f}', (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,0,0), 2)
            cv2.putText(frame, f'Iris Y: {norm_y:.2f}', (30, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,0,0), 2)
            
            # Draw iris center
            cv2.circle(frame, tuple(left_iris_center.astype(int)), 3, (0,255,0), -1)

        cv2.imshow('Eye Tracking', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
