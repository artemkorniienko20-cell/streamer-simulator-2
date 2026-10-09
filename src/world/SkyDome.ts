import * as THREE from 'three';

export class SkyDome {
  public mesh: THREE.Group;
  private skyMaterial: THREE.ShaderMaterial;
  private sunSprite: THREE.Sprite;
  public sunDirection: THREE.Vector3;

  constructor() {
    this.mesh = new THREE.Group();
    this.sunDirection = new THREE.Vector3(0.5, 0.7, 0.4).normalize();

    // 1. Procedural GTA 5 / Los Santos Atmospheric Sky Dome
    const skyGeo = new THREE.SphereGeometry(480, 32, 24);
    skyGeo.scale(-1, 1, 1); // Invert normals so we see the inside

    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 sunColor;
      uniform vec3 sunDir;
      uniform float time;
      varying vec3 vWorldPosition;

      // Simple pseudo-noise for atmospheric clouds
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        vec3 dir = normalize(vWorldPosition);
        float h = max(0.0, dir.y);

        // California Los Santos sky gradient: vibrant azure top down to warm golden haze
        vec3 sky = mix(horizonColor, topColor, pow(h, 0.55));

        // Sun disc and golden corona glow
        float sunDot = max(0.0, dot(dir, sunDir));
        float sunDisc = smoothstep(0.998, 0.9995, sunDot);
        float sunHalo = pow(sunDot, 16.0) * 0.65;
        float sunWideGlare = pow(sunDot, 4.0) * 0.25;

        // Subtle drifting clouds in upper atmosphere
        vec2 cloudCoord = dir.xz / (h + 0.18) * 0.0035 + vec2(time * 0.001, 0.0);
        float cloudNoise = noise(cloudCoord * 4.0) * 0.6 + noise(cloudCoord * 8.0) * 0.4;
        float cloudMask = smoothstep(0.48, 0.72, cloudNoise) * smoothstep(0.08, 0.5, h);
        vec3 cloudColor = mix(vec3(1.0, 0.96, 0.9), vec3(1.0, 1.0, 1.0), h);

        vec3 finalColor = sky + (sunDisc * 2.0 + sunHalo + sunWideGlare) * sunColor;
        finalColor = mix(finalColor, cloudColor, cloudMask * 0.35);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    this.skyMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        topColor: { value: new THREE.Color(0x1d6ee8) },     // Azure Los Santos zenith
        horizonColor: { value: new THREE.Color(0xfdd5a0) }, // Golden California haze
        sunColor: { value: new THREE.Color(0xfff1cc) },     // Warm sun glow
        sunDir: { value: this.sunDirection },
        time: { value: 0.0 }
      },
      side: THREE.BackSide,
      depthWrite: false
    });

    const skyMesh = new THREE.Mesh(skyGeo, this.skyMaterial);
    this.mesh.add(skyMesh);

    // 2. High-brightness Sun Sprite with Lens Flare Corona
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 256;
    sunCanvas.height = 256;
    const sCtx = sunCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 245, 200, 0.85)');
    grad.addColorStop(0.5, 'rgba(255, 200, 120, 0.35)');
    grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    const sunTexture = new THREE.CanvasTexture(sunCanvas);
    const sunMat = new THREE.SpriteMaterial({
      map: sunTexture,
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    this.sunSprite = new THREE.Sprite(sunMat);
    this.sunSprite.scale.set(65, 65, 1);
    this.sunSprite.position.copy(this.sunDirection).multiplyScalar(420);
    this.mesh.add(this.sunSprite);
  }

  public update(timeSec: number): void {
    this.skyMaterial.uniforms.time.value = timeSec;
  }
}
