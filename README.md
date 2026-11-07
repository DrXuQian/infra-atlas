# Infra Atlas

A mobile-first visual field guide to GPU hardware, kernels, quantization and inference systems. Featuring [QUactlize](https://github.com/DrXuQian/QUactlize) and [actlizeLA](https://github.com/DrXuQian/actlizeLA).

The GPU hardware field guide contains 20 chapters and 168 atomic lessons, with pre-rendered step diagrams, source notes, self-checks and five original teaching models. Other tracks remain topic catalogues. Open `hardware/index.html` for the hardware guide.

## Build

Node.js 18+, no npm dependencies:

```sh
node build.mjs
node verify-hardware.mjs
```

Edit `curriculum.json` for stable topic IDs and `content/hardware/*.json` for chapter content. The build validates full atomic coverage and source references before producing the hardware pages. `index.html` contains all topics as static HTML. JavaScript adds search and filters; it is not required to read the content. Relative paths support GitHub Pages project subpaths.

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

## Validation boundaries

The JavaScript checks validate deterministic teaching-model transitions, dependency readiness, buffer ownership, resource examples and static links. They do not run CUDA kernels, collect Nsight Compute counters or validate a real GPU implementation. Every chapter distinguishes documentation, microbenchmark observations and simulator behavior.
