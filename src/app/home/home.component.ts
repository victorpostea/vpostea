import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private donutInterval: any;

  ngOnInit(): void {
    this.startAsciiDonut();
  }

  ngOnDestroy(): void {
    clearInterval(this.donutInterval); // Clear interval when the component is destroyed
  }

  startAsciiDonut(): void {
    const el = document.getElementById('ascii-donut');
    if (!el) return;

    let A = 1, B = 1;
    const asciiChars = ".,-~:;=!*#$@";  // Full range of ASCII characters for shading

    const renderFrame = () => {
      let b = Array(1760).fill(" "); // Buffer for storing the frame (80x22 = 1760)
      let z = Array(1760).fill(0);   // Z-buffer for depth management
      A += 0.04;
      B += 0.02;
      const cA = Math.cos(A), sA = Math.sin(A),
            cB = Math.cos(B), sB = Math.sin(B);

      for (let j = 0; j < 6.28; j += 0.07) {  // Loop over vertical angle (theta)
        const ct = Math.cos(j), st = Math.sin(j);
        for (let i = 0; i < 6.28; i += 0.02) {  // Loop over horizontal angle (phi)
          const sp = Math.sin(i), cp = Math.cos(i),
                h = ct + 2,                     // Circle's x + radius (2)
                D = 1 / (sp * h * sA + st * cA + 5), // Distance factor
                t = sp * h * cA - st * sA,          // Projection onto 2D plane
                x = Math.floor(40 + 30 * D * (cp * h * cB - t * sB)), // X coordinate
                y = Math.floor(12 + 15 * D * (cp * h * sB + t * cB)), // Y coordinate
                o = x + 80 * y,  // Buffer index (based on 80x22 grid)
                N = Math.floor(8 * ((st * sA - sp * ct * cA) * cB - sp * ct * sB)); // Luminance

          if (y >= 0 && y < 22 && x >= 0 && x < 80 && D > z[o]) {
            z[o] = D;
            b[o] = asciiChars[N > 0 ? N : 0];
          }
        }
      }

      // Join the buffer array and ensure newline every 80 characters for each row
      let output = "";
      for (let k = 0; k < 1760; k++) {
        output += b[k];
        if (k % 80 === 79) output += "\n";  // Add newline after each 80 characters (one row)
      }

      el.innerHTML = output;  // Render the frame with proper line breaks
    };

    this.donutInterval = setInterval(renderFrame, 50);  // Update every 50ms
  }
}

