import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class PostProcessingManager {
  public composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private gtaShaderPass: ShaderPass;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer);

    // 1. Scene Render Pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // 2. GTA 5 Unreal Bloom Pass (Glowing neon, car headlights, taillights, streetlights)
    const res = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.bloomPass = new UnrealBloomPass(res, 0.45, 0.4, 0.82);
    this.composer.addPass(this.bloomPass);

    // 3. GTA 5 Cinematic Color Grading, Vignette & Speed Blur Shader Pass
    const gtaShader = {
      uniforms: {
        tDiffuse: { value: null },
        speedBlur: { value: 0.0 }, // 0.0 to 1.0 based on vehicle speed
        saturation: { value: 1.18 }, // +18% saturation (vivid Los Santos sunshine)
        contrast: { value: 1.10 },   // +10% contrast (deep crisp shadows)
        vignetteStrength: { value: 0.28 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float speedBlur;
        uniform float saturation;
        uniform float contrast;
        uniform float vignetteStrength;
        varying vec2 vUv;

        void main() {
          vec2 center = vec2(0.5, 0.5);
          vec2 uv = vUv;
          vec4 color = vec4(0.0);

          // Speed Radial Motion Blur (GTA 5 high-speed rush)
          if (speedBlur > 0.01) {
            float samples = 6.0;
            vec2 dir = (uv - center) * (speedBlur * 0.035);
            for (float i = 0.0; i < 6.0; i++) {
              color += texture2D(tDiffuse, uv - dir * (i / samples));
            }
            color /= samples;
          } else {
            color = texture2D(tDiffuse, uv);
          }

          // 1. Contrast Adjustment
          vec3 rgb = (color.rgb - 0.5) * contrast + 0.5;

          // 2. Saturation Boost (Vibrant Sunny California look)
          float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
          rgb = mix(vec3(luma), rgb, saturation);

          // 3. GTA 5 Warm Golden Sunlight Tint (Warm highlights)
          rgb = mix(rgb, rgb * vec3(1.05, 1.02, 0.96), 0.5);

          // 4. Vignette (Darkening at corners)
          float dist = distance(uv, center);
          float vignette = smoothstep(0.8, 0.25, dist * (1.0 + vignetteStrength));
          rgb *= mix(1.0, vignette, vignetteStrength);

          gl_FragColor = vec4(rgb, color.a);
        }
      `
    };

    this.gtaShaderPass = new ShaderPass(gtaShader);
    this.composer.addPass(this.gtaShaderPass);

    // 4. Accurate Color Tone & Output Pass
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  public setSpeedBlur(blurAmount: number): void {
    this.gtaShaderPass.uniforms.speedBlur.value = THREE.MathUtils.clamp(blurAmount, 0.0, 1.0);
  }

  public setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }

  public render(): void {
    this.composer.render();
  }
}
