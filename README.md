# Calculator Pro 2026

Russian offline PWA with photorealistic WebP operation cards, light/dark themes, speed/feed calculators, history and verified modes stored on the device.

## ShopTurn workflow (0.5.0)

Turning follows the parameter-mask workflow in the Siemens 840D sl / 828D Turning manual (08/2018, chapters 9.2 and 10.3): cylindrical stock, named contour, starting point, separate X/Z/ZX/arc elements, then machining parameters. X is a diameter; Z0 is the front face. The graphical view uses X upwards and Z to the right. The reference help image is from manual page 294 and is labelled as a static reference.

The educational planner supports external monotone profiles, axial roughing with radial entries, and contour following. An unfinished stock length retains its original diameter. Straight segments and minor radius arcs are supported. Undercuts, tool geometry compensation, collisions, finishing allowances, full CYCLE952 behaviour and NC code generation are not implemented. S/V conversion uses the stock diameter; simulation feed is held constant at the calculated value. Rapid motion is estimated at 3000 mm/min.

Inputs start empty. Material selection does not prescribe manufacturer cutting data. A saved verified mode includes the contour and machining parameters.

Run locally: `python3 -m http.server 8080`.

The GitHub Actions workflow deploys main to GitHub Pages. The service worker caches versioned modules and assets for offline use.
