import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

export function rainBackground() {
    const container = document.getElementById('weatherRainCanvas');
    if (!container) return;

    container.innerHTML = ''; // Clear any previous rain render

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Create rain particles
    const rainCount = 5000;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
        positions[i] = Math.random() * 400 - 200;
        positions[i + 1] = Math.random() * 500 - 250;
        positions[i + 2] = Math.random() * 400 - 200;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMaterial = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.1,
        transparent: true
    });

    const rain = new THREE.Points(rainGeo, rainMaterial);
    scene.add(rain);

    function animate() {
        requestAnimationFrame(animate);
        const pos = rain.geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i + 1] -= Math.random() * 0.5;
            if (pos[i + 1] < -250) {
                pos[i + 1] = 250;
            }
        }
        rain.geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
}
