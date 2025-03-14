import { Component, OnInit, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private animationFrameId: number | null = null;
  private resizeHandler: () => void = () => {};
  private rendererDom: HTMLElement | null = null;

  ngOnInit(): void {
    this.startAsciiDonut();
  }

  ngOnDestroy(): void {
    // Cancel animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    // Remove resize listener
    window.removeEventListener('resize', this.resizeHandler);
    // Remove the renderer's canvas from the DOM
    if (this.rendererDom && this.rendererDom.parentNode) {
      this.rendererDom.parentNode.removeChild(this.rendererDom);
    }
  }

  startAsciiDonut(): void {
    const container = document.getElementById('ascii-donut');
    if (!container) {
      console.error("Container with id 'ascii-donut' not found.");
      return;
    }
    
    // Use the container's dimensions so the canvas is small.
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    // Orthographic camera remains unchanged (you may tweak further if needed)
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    this.rendererDom = renderer.domElement;

    // Shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(width, height) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        varying vec2 vUv;

        #define MAX_STEPS 50
        #define MAX_DIST 50.0
        #define SURF_DIST 0.001

        float mandelbulb(vec3 pos) {
          vec3 z = pos;
          float dr = 1.0;
          float r = 0.0;
          float power = 8.0 + sin(u_time * 0.2) * 2.0;
          for (int i = 0; i < 4; i++) {
            r = length(z);
            if (r > 2.0) break;
            float theta = acos(z.z / r);
            float phi = atan(z.y, z.x);
            dr = pow(r, power - 1.0) * power * dr + 1.0;
            float zr = pow(r, power);
            theta = theta * power;
            phi = phi * power;
            z = zr * vec3(
              sin(theta) * cos(phi),
              sin(phi) * sin(theta),
              cos(theta)
            );
            z += pos;
          }
          return 0.5 * log(r) * r / dr;
        }

        float rayMarch(vec3 ro, vec3 rd) {
          float dO = 0.0;
          for (int i = 0; i < MAX_STEPS; i++) {
            vec3 p = ro + rd * dO;
            float dS = mandelbulb(p);
            dO += dS;
            if (dO > MAX_DIST || dS < SURF_DIST) break;
          }
          return dO;
        }

        vec3 getNormal(vec3 p) {
          float d = mandelbulb(p);
          vec2 e = vec2(0.001, 0);
          vec3 n = d - vec3(
            mandelbulb(p - e.xyy),
            mandelbulb(p - e.yxy),
            mandelbulb(p - e.yyx)
          );
          return normalize(n);
        }

        void main() {
          vec2 uv = (vUv - 0.5) * u_resolution.xy / u_resolution.y;
          float camTime = u_time * 0.3;
          // Move the camera further back so the fractal appears smaller
          vec3 ro = vec3(
            sin(camTime) * 2.0,
            cos(camTime) * 2.0,
            -2.0
          );
          vec3 lookAt = vec3(0.0);
          vec3 forward = normalize(lookAt - ro);
          vec3 right = normalize(cross(vec3(0, 1, 0), forward));
          vec3 up = cross(forward, right);
          vec3 rd = normalize(forward + uv.x * right + uv.y * up);
          float d = rayMarch(ro, rd);
          vec3 col = vec3(0.0);
          if (d < MAX_DIST) {
            vec3 p = ro + rd * d;
            vec3 n = getNormal(p);
            vec3 lightPos = vec3(sin(u_time), 5.0, cos(u_time));
            vec3 l = normalize(lightPos - p);
            vec3 baseColor = vec3(
              0.25 + 0.25 * sin(p.x + u_time),
              0.25 + 0.25 * sin(p.y + u_time * 0.7),
              0.25 + 0.25 * sin(p.z + u_time * 0.3)
            );
            float dif = clamp(dot(n, l), 0.0, 1.0);
            vec3 diffuse = baseColor * dif * 0.5;
            vec3 r = reflect(-l, n);
            float spec = pow(max(dot(r, -rd), 0.0), 32.0);
            float glow = clamp(1.0 - dot(n, -rd), 0.0, 1.0);
            glow = pow(glow, 2.0) * 0.15;
            vec3 specColor = vec3(0.5, 0.4, 0.3);
            col = diffuse +
                  baseColor * 0.15 +
                  specColor * spec * 0.5 +
                  baseColor * glow;
            float maxComp = max(max(col.r, col.g), col.b);
            if (maxComp > 0.6) {
              col = col * (0.6 / maxComp);
            }
            col = mix(col, vec3(0.1), 0.2);
            col = clamp(col, 0.0, 1.0);
          }
          vec3 bg = vec3(0.0, 0.0, 0.0);
          col = mix(bg, col, smoothstep(MAX_DIST - 1.0, MAX_DIST - 5.0, d));
          col = pow(col, vec3(0.4));
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    // Create plane and add to the scene
    const geometry = new THREE.PlaneGeometry(2, 2);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Post-processing: add render and bloom passes
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.5, // strength
      0.2, // radius (tighter glow)
      0.4  // threshold
    ));

    // Animation loop
    const animate = (time: number): void => {
      material.uniforms['u_time'].value = time * 0.001;
      composer.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };

    // Listen to container resize (if needed)
    this.resizeHandler = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      renderer.setSize(newWidth, newHeight);
      composer.setSize(newWidth, newHeight);
      material.uniforms['u_resolution'].value.set(newWidth, newHeight);
    };
    window.addEventListener('resize', this.resizeHandler);

    animate(0);
  }
}