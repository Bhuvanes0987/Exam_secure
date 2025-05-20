import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1)

model_points = np.array([
    (0.0, 0.0, 0.0),       # Nose tip
    (0.0, -330.0, -65.0),  # Chin
    (-225.0, 170.0, -135.0), # Left eye left corner
    (225.0, 170.0, -135.0),  # Right eye right corner
    (-150.0, -150.0, -125.0), # Left mouth corner
    (150.0, -150.0, -125.0)  # Right mouth corner
])

LANDMARKS = [1, 152, 33, 263, 61, 291]

cap = cv2.VideoCapture(0)

# Counter for consecutive "not facing" frames
not_facing_count = 0
CHEATING_THRESHOLD = 30  # Number of consecutive frames to confirm cheating

while cap.isOpened():
    success, image = cap.read()
    if not success:
        break

    h, w, _ = image.shape
    img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(img_rgb)

    if results.multi_face_landmarks:
        for face in results.multi_face_landmarks:
            image_points = []
            for idx in LANDMARKS:
                pt = face.landmark[idx]
                x, y = int(pt.x * w), int(pt.y * h)
                image_points.append((x, y))
                cv2.circle(image, (x, y), 3, (0, 255, 0), -1)

            image_points = np.array(image_points, dtype="double")

            focal_length = w
            center = (w / 2, h / 2)
            camera_matrix = np.array([
                [focal_length, 0, center[0]],
                [0, focal_length, center[1]],
                [0, 0, 1]
            ], dtype="double")

            dist_coeffs = np.zeros((4, 1))

            success, rotation_vector, translation_vector = cv2.solvePnP(
                model_points, image_points, camera_matrix, dist_coeffs
            )

            rmat, _ = cv2.Rodrigues(rotation_vector)
            angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)

            pitch, yaw, roll = angles

            if pitch > 90:
                pitch = pitch - 180
            elif pitch < -90:
                pitch = pitch + 180

            

            # Check if user is facing screen
            if abs(yaw) > 40 or abs(pitch) > 22:
                not_facing_count += 1
                cv2.putText(image, f"Yaw: {int(yaw)} Pitch: {int(pitch)} Roll: {int(roll)}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                cv2.putText(image, "❌ Not facing screen!", (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 3)
                if not_facing_count >= CHEATING_THRESHOLD:
                    print("cheating")
            else:
                not_facing_count = 0
                cv2.putText(image, f"Yaw: {int(yaw)} Pitch: {int(pitch)} Roll: {int(roll)}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(image, "✅ Facing screen", (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 3)
    else:
        # Reset counter if face not detected
        not_facing_count = 0

    cv2.imshow("Head Pose Detection", image)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
