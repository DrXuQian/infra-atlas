# Infra Atlas

A mobile-first visual field guide to GPU hardware, kernels, quantization and inference systems. Featuring [QUactlize](https://github.com/DrXuQian/QUactlize) and [actlizeLA](https://github.com/DrXuQian/actlizeLA).

This first release is a homepage and topic catalogue. Explanations, interactive diagrams and experiments are developed incrementally. A catalogue entry does not imply a completed lesson.

## Build

Node.js 18+, no npm dependencies:

```sh
node build.mjs
```

Edit `curriculum.json` for stable topic IDs. `index.html` contains all topics as static HTML. JavaScript adds search and filters; it is not required to read the content. Relative paths support GitHub Pages project subpaths.

## GitHub Pages

In **Settings → Pages**, select **Deploy from a branch → main → /(root)**. `index.html` and `.nojekyll` are at the root. No credentials, backend, analytics or cookies are required.

## Editorial principles

- One mechanism per explanation; explicit scope and a minimal example.
- Distinguish documented facts, observations, simulator models and teaching assumptions.
- Use exact SVG/HTML for mechanism diagrams and step-by-step interactions.
- Record device, version, workload, correctness and baseline with benchmark results.
- Distinguish implementation, device qualification and future portability work.
- Recheck research topics against primary papers and current source versions.

Modal GPU Glossary informs taxonomy only. Silicon Canvas and Aleksa Gordić's matmul article inform visual organization; no original figures or article text are copied. All homepage diagrams are original SVG.
