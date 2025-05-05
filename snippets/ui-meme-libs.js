<!-- ✅ Fingerpose (for more robust gesture recognition) -->
<script src="https://cdn.jsdelivr.net/npm/fingerpose@0.1.0/dist/fingerpose.min.js"></script>

<!-- ✅ Old MediaPipe Hands API (Backwards Compatibility) -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"></script>

<!-- ✅ New MediaPipe Tasks API (Gesture Recognition & AI-Based Detection) -->
<script type="module">
  import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
  window.FilesetResolver = FilesetResolver;
  window.HandLandmarker = HandLandmarker;
</script>
	
<!-- ✅ Import Drawing Utilities for Hand Skeletons -->
<script type="module">
  import { HAND_CONNECTIONS, drawConnectors, drawLandmarks } 
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
  
  window.HAND_CONNECTIONS = HAND_CONNECTIONS;
  window.drawConnectors = drawConnectors;
  window.drawLandmarks = drawLandmarks;
</script>
	
<!-- ✅ Import Gesture Recognition API -->
<script type="module">
  import { FilesetResolver, HandLandmarker, GestureRecognizer } 
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

  window.FilesetResolver = FilesetResolver;
  window.HandLandmarker = HandLandmarker;
  window.GestureRecognizer = GestureRecognizer;
</script>
	
<!-- ✅ Import MediaPipe Face Detector -->
<script type="module">
  import { FilesetResolver, FaceDetector } 
  from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
  
  window.FilesetResolver = FilesetResolver;
  window.FaceDetector = FaceDetector;
</script>

<!-- ✅ WebAssembly Path for MediaPipe Tasks -->
<script>
  window.Module = {
    locateFile: function(file) {
      return "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm/" + file;
    }
  };
</script>

<!-- ✅ Other MediaPipe Features (Face Detection, Avatars, Face Stylizer) -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_stylizer/face_stylizer.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/avatar_render/avatar_render.js">
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite">