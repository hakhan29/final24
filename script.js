const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const expressionDiv = document.getElementById('expression');

let currentTint = ''; // 현재 적용된 틴트 색상

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

video.addEventListener('play', () => {
    function renderFrame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // 비디오 프레임 그리기

        faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .then(detections => {
                if (detections.length > 0) {
                    const expressions = detections[0].expressions;
                    const highestExpression = Object.keys(expressions).reduce((a, b) =>
                        expressions[a] > expressions[b] ? a : b
                    );

                    const emotionColors = {
                        anger: 'rgba(255, 0, 0, 0.3)',
                        happy: 'rgba(255, 255, 0, 0.3)',
                        sad: 'rgba(0, 0, 255, 0.3)',
                        neutral: 'rgba(128, 128, 128, 0.3)',
                        surprised: 'rgba(255, 165, 0, 0.3)',
                        fear: 'rgba(128, 0, 128, 0.3)',
                    };

                    const newTint = emotionColors[highestExpression] || 'rgba(255, 255, 255, 0)';

                    if (newTint !== currentTint) {
                        currentTint = newTint;
                    }

                    // 색상 틴트 적용
                    ctx.fillStyle = currentTint;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // 텍스트 업데이트
                    if (expressionDiv.textContent !== `Detected Expression: ${highestExpression}`) {
                        expressionDiv.style.opacity = 0;
                        setTimeout(() => {
                            expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
                            expressionDiv.style.opacity = 1;
                        }, 500);
                    }
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height); // 초기화
                    currentTint = ''; // 틴트 초기화
                    if (expressionDiv.textContent !== 'No face detected') {
                        expressionDiv.style.opacity = 0;
                        setTimeout(() => {
                            expressionDiv.textContent = 'No face detected';
                            expressionDiv.style.opacity = 1;
                        }, 500);
                    }
                }
            });

        requestAnimationFrame(renderFrame); // 프레임 갱신
    }

    renderFrame(); // 첫 프레임 호출
});
