# GrabAndGoModules CJS

A **grab-and-go module library**. Each module lives in its own self-contained folder — just copy the folder into your project and it's ready to use.

---

## What is this?

This is a feature-based "Lego set" of CommonJS (CJS) modules. Instead of building common features from scratch every time, you pick the module you need, drop the folder into your project, and wire it up.

Think of it as a personal toolkit of reusable building blocks.

---

## How to use

1. Browse the `server/` directory and find the module you need.
2. Copy the module's folder into your target project.
3. Require it as you normally would:

```js
const moduleName = require('./moduleName');
```

That's it — no package installation, no setup overhead.

---

## Structure

```
Modules-CJS-/
└── server/
    └── <module-name>/   ← copy this folder into your project
```

Each module folder is standalone and contains everything it needs to function.

---

## Tech

- **JavaScript** (CommonJS / CJS)
- **MDX** (documentation/content modules)
