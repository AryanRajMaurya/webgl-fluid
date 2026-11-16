# WebGL Fluid Simulation — rebuilt

A standalone rebuild of **Pavel Dobryakov's WebGL Fluid Simulation**
([github.com/PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation), MIT).

Stir neon dye with your pointer. Works on mobile.

## Play

- **Drag** — stir the fluid
- **Space** — pause
- **Splash** — a burst of random splats
- **Save** — download a PNG
- **F** fullscreen, **R** reset the look, **H** toggle the panel

## What's new

The original ships dat.GUI. This rebuild keeps Pavel's engine (`script.js`) and
replaces the GUI with a proper panel: dye and simulation resolution, density and
velocity dissipation, pressure, vorticity, splat radius and force, colour speed,
shading, bloom, sunrays, background colour, transparency and pause — every value
the original exposed, plus URL-hash state so a look can be copied and shared.
The promo overlay and analytics are gone.

## Run locally

Open `index.html` in a browser. No build step, no dependencies.

## Credits

WebGL Fluid Simulation was created by **Pavel Dobryakov** and is released under
the MIT license. Rebuilt here as a standalone page; not affiliated with the
author.
