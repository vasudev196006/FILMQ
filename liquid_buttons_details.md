# Liquid Glass Design System & Redesign Specification

A comprehensive technical and design specification for redesigning any UI component (buttons, navigation bars, cards, modals, media players, floating action buttons) using the **Liquid Glass** WebGL engine.

This document contains the complete physics model, mathematical distance fields, GLSL shaders, JavaScript architecture, CSS foundations, component redesign recipes, and the interactive debug controls system.

---

## 1. How Liquid Glass Works

Liquid Glass is not a simple CSS `backdrop-filter: blur()`. It is a physically-inspired real-time optical simulation rendered via WebGL 2.0 / WebGL 1.0 fragments.

### 1.1 The Optical Pipeline

The visual illusion of real glass requires five layered optical phenomena calculated per fragment:

```
[ Page Snapshot Texture (html2canvas) ]
                   │
                   ▼
  [ 1. Shape-Aware Distance Fields & Normals ]
  (Rounded Rect / Capsule Pill / Circle SDF)
                   │
                   ▼
      [ 2. Vector Refraction Field ]
  - Base Interior Refraction (exponential falloff)
  - Edge Refraction (steep boundary curvature)
  - Rim Lighting & Fresnel Glare
  - Corner Distortion Boost
  - Transverse Ripple Anomalies (micro-imperfections)
                   │
                   ▼
  [ 3. Two-Pass Adaptive Gaussian Blur ]
  (Samples displaced texels using 13x13 or 9x9 kernel)
                   │
                   ▼
  [ 4. Dual-Layer Gradient Tinting & Ambient Absorption ]
  - Static vertical luminance gradient (top highlight, bottom shadow)
  - Live vertically-sampled page background gradient
                   │
                   ▼
       [ 5. Sub-Pixel Anti-Aliased Shape Mask ]
  (smoothstep distance alpha edge clamping)
                   │
                   ▼
           [ Rendered Glass Canvas ]
```

1. **Shape-Aware Coordinate Mapping**: The canvas determines its exact bounding client rect on screen, transforms viewport pixels into page-relative texture coordinates, and samples from a pre-captured page texture.
2. **Multi-Component Refraction**: Rather than uniform distortion, refraction is split into:
   - **Edge curvature**: A sharp exponential falloff near the shape boundary.
   - **Rim intensity**: Outer perimeter lighting that catches ambient light.
   - **Base curvature / Warp**: Gentle parabolic displacement across the interior (optional center warping).
   - **Corner boost**: Amplified distortion around corners where glass thickness geometrically varies.
   - **Transverse ripples**: High-frequency sinusoidal displacement perpendicular to the edge normal, mimicking physical glass molten ripples.
3. **Adaptive Gaussian Blur**: Samples the refracted texture coordinates across a weighted 2D kernel (13×13 for base containers, 9×9 for nested elements) to create realistic depth-of-field glass diffusion.
4. **Dual Gradient Tinting**:
   - Primary vertical gradient: Highlights the top edge (`#FFFFFF`) and darkens the bottom (`#B3B3B3`).
   - Ambient sampled gradient: Samples top, middle, and bottom colors from the background scene and blends them into the glass body based on `tintOpacity`.
5. **Sub-pixel Anti-Aliased Masking**: Uses signed distance field (SDF) functions with `smoothstep(-1.0, 1.0, maskDistance)` for crisp, razor-sharp edges without jagged artifacts.

---

### 1.2 Mathematical Distance Fields & Shape Normals

Liquid Glass mathematically supports three distinct primitive geometries:

#### A. Rounded Rectangle (`rounded`)
Computes distance from the center taking into account the corner radius:

$$\text{toCorner} = |\mathbf{p} - \mathbf{c}| - (\mathbf{c} - r)$$

```glsl
float roundedRectDistance(vec2 coord, vec2 size, float radius) {
  vec2 center = size * 0.5;
  vec2 pixelCoord = coord * size;
  vec2 toCorner = abs(pixelCoord - center) - (center - radius);
  float outsideCorner = length(max(toCorner, 0.0));
  float insideCorner = min(max(toCorner.x, toCorner.y), 0.0);
  return (outsideCorner + insideCorner - radius);
}
```

Normal vector:
$$\mathbf{N} = \text{normalize}(\text{coord} - 0.5)$$

#### B. Perfect Circle (`circle`)
Enforces a 1:1 aspect ratio. Radius is $r = \frac{\min(w, h)}{2}$:

$$d = \|\mathbf{p} - \mathbf{c}\| - r$$

```glsl
float circleDistance(vec2 coord, vec2 size, float radius) {
  vec2 center = vec2(0.5, 0.5);
  vec2 pixelCoord = coord * size;
  vec2 centerPixel = center * size;
  float distFromCenter = length(pixelCoord - centerPixel);
  return distFromCenter - radius;
}
```

Normal vector:
$$\mathbf{N} = \text{normalize}(\text{coord} - 0.5)$$

#### C. Pill / Capsule (`pill`)
Computes the distance from a horizontal line segment between the capsule center caps:

```glsl
float pillDistance(vec2 coord, vec2 size, float radius) {
  vec2 center = size * 0.5;
  vec2 pixelCoord = coord * size;
  vec2 capsuleStart = vec2(radius, center.y);
  vec2 capsuleEnd = vec2(size.x - radius, center.y);
  vec2 capsuleAxis = capsuleEnd - capsuleStart;
  float capsuleLength = length(capsuleAxis);

  if (capsuleLength > 0.0) {
    vec2 toPoint = pixelCoord - capsuleStart;
    float t = clamp(dot(toPoint, capsuleAxis) / dot(capsuleAxis, capsuleAxis), 0.0, 1.0);
    vec2 closestPointOnAxis = capsuleStart + t * capsuleAxis;
    return length(pixelCoord - closestPointOnAxis) - radius;
  } else {
    return length(pixelCoord - center) - radius;
  }
}
```

Capsule Normal Calculation:
```glsl
vec2 pixelCoord = coord * u_resolution;
vec2 capsuleStart = vec2(u_borderRadius, 0.5 * u_resolution.y);
vec2 capsuleEnd = vec2(u_resolution.x - u_borderRadius, 0.5 * u_resolution.y);
vec2 capsuleAxis = capsuleEnd - capsuleStart;
vec2 toPoint = pixelCoord - capsuleStart;
float t = clamp(dot(toPoint, capsuleAxis) / dot(capsuleAxis, capsuleAxis), 0.0, 1.0);
vec2 closestPointOnAxis = capsuleStart + t * capsuleAxis;
vec2 normalDir = pixelCoord - closestPointOnAxis;
vec2 shapeNormal = length(normalDir) > 0.0 ? normalize(normalDir) : vec2(0.0, 1.0);
```

---

### 1.3 Multi-Layer "Nested Glass" Architecture

One of the defining features of Liquid Glass is **nested glass refraction** (e.g., a pill button sitting inside a glass card or navigation bar):

1. **Parent Container**: Samples the DOM page background using `html2canvas`, renders refracted and blurred glass onto its backing canvas.
2. **Child Element (Button)**:
   - Does NOT sample the raw page.
   - Creates a WebGL texture initialized to the parent canvas size.
   - In its frame loop, executes `gl.texSubImage2D(..., parent.canvas)`, reading the live output of the parent glass container.
   - Calculates its exact relative bounding box inside the parent:
     $$\mathbf{P}_{\text{container}} = (\mathbf{P}_{\text{button\_topLeft}} - \mathbf{P}_{\text{container\_topLeft}}) + (\text{coord} \cdot \text{size}_{\text{button}})$$
   - Samples and re-refracts the already-refracted parent glass texture.
   - Applies secondary button-level highlighting (`vec3(1.08)` top tint, `vec3(0.92)` bottom tint) to produce an authentic glass-on-glass double refraction look.

---

## 2. Redesigning Any Component into Liquid Glass

Use the following step-by-step blueprint to redesign standard components into Liquid Glass.

### 2.1 Component Anatomy

Every Liquid Glass component consists of three architectural layers:

```
┌─────────────────────────────────────────────────────────────┐
│  Component Container Element (.glass-container / .glass-btn) │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Canvas Layer (z-index: -1, position: absolute)        │  │
│  │ - WebGL Context                                       │  │
│  │ - Physical Refraction + Gaussian Blur + Tint Shader   │  │
│  │ - Elevation Box Shadow (0 25px 50px rgba(0,0,0,0.25)) │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Content Layer (z-index: 1, pointer-events: auto)      │  │
│  │ - Text, SVGs, Form controls, Badges, Child elements   │  │
│  │ - Typography: System UI / -apple-system               │  │
│  │ - Color: Pure white or elevated contrast              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Sizing & Shape Conversion Rules

| Target Component | Recommended Shape | Radius Formula | Sizing Constraints |
| :--- | :--- | :--- | :--- |
| **Standard Button** | `pill` or `rounded` | `height / 2` (pill) or `fontSize` (rounded) | Width auto-measures text + `fontSize * 2`. Height is `fontSize * 2.2`. |
| **Icon Button / FAB** | `circle` | `width / 2` (50%) | Aspect ratio strictly `1 / 1`. Set `width == height == fontSize * 2.5`. |
| **Navbar / Dock** | `pill` | `height / 2` | Horizontally centered, flex row, 12–20px padding, auto or fixed pill container. |
| **Card / Widget** | `rounded` | `24px` to `36px` | Flexible width and height. Canvas automatically updates via `updateSizeFromDOM()`. |
| **Modal / Dialog** | `rounded` | `32px` to `48px` | Centered layout, `tintOpacity: 0.35` - `0.5` for higher contrast. |
| **Input Field** | `pill` | `height / 2` | Container wrapped around input element. Transparent input background. |
| **Segmented Control**| Parent `pill`, Children `pill` | Parent: `height / 2`, Child: `(height - 8) / 2` | Nested glass buttons inside a parent container. |

---

### 2.3 Component Recipes

#### Recipe 1: Redesigning Buttons
```javascript
// A. Standard Action Pill Button
const primaryButton = new Button({
  text: 'Confirm Order',
  size: 16,               // Font size in px
  type: 'pill',           // Capsule geometry
  tintOpacity: 0.25,      // 0.2 - 0.35 recommended for standard buttons
  warp: false,            // Subtle realistic edge curvature
  onClick: () => console.log('Confirmed!')
});
document.querySelector('#target-slot').appendChild(primaryButton.element);

// B. Floating Circular Icon Button (FAB)
const fabButton = new Button({
  text: '＋',
  size: 32,
  type: 'circle',         // Force 1:1 circle geometry
  tintOpacity: 0.4,       // Slightly more prominence
  warp: true,             // Enable lens distortion for round badges
  onClick: () => openModal()
});
document.body.appendChild(fabButton.element);
```

#### Recipe 2: Redesigning Navigation Bar / Floating Island
```javascript
// Create the parent pill container
const navIsland = new Container({
  type: 'pill',
  tintOpacity: 0.2
});

// Create child nested glass buttons
const navItems = ['Dashboard', 'Analytics', 'Settings'];
navItems.forEach(label => {
  const btn = new Button({
    text: label,
    size: 15,
    type: 'pill',
    tintOpacity: 0.12,
    warp: false,
    onClick: () => switchTab(label)
  });
  // Adding to container automatically sets up nested WebGL sampling
  navIsland.addChild(btn);
});

document.querySelector('#nav-mount').appendChild(navIsland.element);
```

#### Recipe 3: Redesigning Media Player Widget
```javascript
const mediaCard = new Container({
  type: 'rounded',
  borderRadius: 32,
  tintOpacity: 0.3
});

const prevBtn = new Button({ text: '⏮', size: 18, type: 'circle', tintOpacity: 0.2 });
const playBtn = new Button({ text: '▶', size: 26, type: 'circle', tintOpacity: 0.45, warp: true });
const nextBtn = new Button({ text: '⏭', size: 18, type: 'circle', tintOpacity: 0.2 });

mediaCard.addChild(prevBtn);
mediaCard.addChild(playBtn);
mediaCard.addChild(nextBtn);

document.querySelector('#player-mount').appendChild(mediaCard.element);
```

#### Recipe 4: Redesigning Arbitrary HTML Containers (Cards / Modals)
To convert any existing HTML element into a Liquid Glass container:
1. Instantiate `new Container({ type: 'rounded', borderRadius: 28, tintOpacity: 0.25 })`.
2. Append your custom HTML content inside `container.element`.
3. Call `container.updateSizeFromDOM()` so the WebGL viewport and canvas match the content bounding box.

```javascript
function makeLiquidCard(contentHtml) {
  const card = new Container({
    type: 'rounded',
    borderRadius: 28,
    tintOpacity: 0.25
  });

  const contentWrapper = document.createElement('div');
  contentWrapper.style.position = 'relative';
  contentWrapper.style.zIndex = '1';
  contentWrapper.style.padding = '24px';
  contentWrapper.style.color = '#ffffff';
  contentWrapper.innerHTML = contentHtml;

  card.element.appendChild(contentWrapper);
  card.updateSizeFromDOM();
  return card;
}
```

---

## 3. The Complete Liquid Glass Code

### 3.1 Base CSS Specifications (`glass.css`)

```css
/* ==========================================================================
   Liquid Glass Core Styling Foundations
   ========================================================================== */

/* Glass Container Base */
.glass-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 10px;
  box-sizing: border-box;
}

/* Shape Geometry Specifiers */
.glass-container-circle,
.glass-button-circle {
  aspect-ratio: 1 / 1; /* Strictly enforce square aspect ratio */
  flex-shrink: 0;
  flex-grow: 0;
}

.glass-container-pill {
  flex-shrink: 0;
  flex-grow: 0;
}

/* Glass Button Elevation & Interactive State */
.glass-button {
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  pointer-events: auto;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}

.glass-button:hover {
  transform: translateY(-1px);
}

.glass-button:active {
  transform: translateY(1px) scale(0.98);
}

/* Typography Label Inside Glass Buttons */
.glass-button-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
  font-weight: 500;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
  white-space: nowrap;
  letter-spacing: -0.01em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
```

---

### 3.2 GLSL Vertex Shader

Used identically for both Container and nested Button render passes:

```glsl
attribute vec2 a_position;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}
```

Quad geometry buffers:
- **Positions**: `[-1, -1,  1, -1,  -1,  1,  -1,  1,  1, -1,  1,  1]`
- **Texcoords**: `[ 0,  1,  1,  1,   0,  0,   0,  0,  1,  1,  1,  0]`

---

### 3.3 Container GLSL Fragment Shader (Single-Layer Page Refraction)

```glsl
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform vec2 u_textureSize;
uniform float u_scrollY;
uniform float u_pageHeight;
uniform float u_viewportHeight;
uniform float u_blurRadius;
uniform float u_borderRadius;
uniform vec2 u_containerPosition;
uniform float u_warp;
uniform float u_edgeIntensity;
uniform float u_rimIntensity;
uniform float u_baseIntensity;
uniform float u_edgeDistance;
uniform float u_rimDistance;
uniform float u_baseDistance;
uniform float u_cornerBoost;
uniform float u_rippleEffect;
uniform float u_tintOpacity;

varying vec2 v_texcoord;

float roundedRectDistance(vec2 coord, vec2 size, float radius) {
  vec2 center = size * 0.5;
  vec2 pixelCoord = coord * size;
  vec2 toCorner = abs(pixelCoord - center) - (center - radius);
  float outsideCorner = length(max(toCorner, 0.0));
  float insideCorner = min(max(toCorner.x, toCorner.y), 0.0);
  return (outsideCorner + insideCorner - radius);
}

float circleDistance(vec2 coord, vec2 size, float radius) {
  vec2 center = vec2(0.5, 0.5);
  vec2 pixelCoord = coord * size;
  vec2 centerPixel = center * size;
  return length(pixelCoord - centerPixel) - radius;
}

bool isPill(vec2 size, float radius) {
  float heightRatioDiff = abs(radius - size.y * 0.5);
  bool radiusMatchesHeight = heightRatioDiff < 2.0;
  bool isWiderThanTall = size.x > size.y + 4.0;
  return radiusMatchesHeight && isWiderThanTall;
}

bool isCircle(vec2 size, float radius) {
  float minDim = min(size.x, size.y);
  bool radiusMatchesMinDim = abs(radius - minDim * 0.5) < 1.0;
  bool isRoughlySquare = abs(size.x - size.y) < 4.0;
  return radiusMatchesMinDim && isRoughlySquare;
}

float pillDistance(vec2 coord, vec2 size, float radius) {
  vec2 center = size * 0.5;
  vec2 pixelCoord = coord * size;
  vec2 capsuleStart = vec2(radius, center.y);
  vec2 capsuleEnd = vec2(size.x - radius, center.y);
  vec2 capsuleAxis = capsuleEnd - capsuleStart;
  float capsuleLength = length(capsuleAxis);
  
  if (capsuleLength > 0.0) {
    vec2 toPoint = pixelCoord - capsuleStart;
    float t = clamp(dot(toPoint, capsuleAxis) / dot(capsuleAxis, capsuleAxis), 0.0, 1.0);
    vec2 closestPointOnAxis = capsuleStart + t * capsuleAxis;
    return length(pixelCoord - closestPointOnAxis) - radius;
  } else {
    return length(pixelCoord - center) - radius;
  }
}

void main() {
  vec2 coord = v_texcoord;
  float scrollY = u_scrollY;
  vec2 containerSize = u_resolution;
  vec2 textureSize = u_textureSize;

  // Viewport to page texture coordinate projection
  vec2 containerCenter = u_containerPosition + vec2(0.0, scrollY);
  vec2 containerOffset = (coord - 0.5) * containerSize;
  vec2 pagePixel = containerCenter + containerOffset;
  vec2 textureCoord = pagePixel / textureSize;

  // Shape-aware distance and normal
  float distFromEdgeShape;
  vec2 shapeNormal;

  if (isPill(u_resolution, u_borderRadius)) {
    distFromEdgeShape = -pillDistance(coord, u_resolution, u_borderRadius);
    vec2 center = vec2(0.5, 0.5);
    vec2 pixelCoord = coord * u_resolution;
    vec2 capsuleStart = vec2(u_borderRadius, center.y * u_resolution.y);
    vec2 capsuleEnd = vec2(u_resolution.x - u_borderRadius, center.y * u_resolution.y);
    vec2 capsuleAxis = capsuleEnd - capsuleStart;
    float capsuleLength = length(capsuleAxis);
    if (capsuleLength > 0.0) {
      vec2 toPoint = pixelCoord - capsuleStart;
      float t = clamp(dot(toPoint, capsuleAxis) / dot(capsuleAxis, capsuleAxis), 0.0, 1.0);
      vec2 closestPointOnAxis = capsuleStart + t * capsuleAxis;
      vec2 normalDir = pixelCoord - closestPointOnAxis;
      shapeNormal = length(normalDir) > 0.0 ? normalize(normalDir) : vec2(0.0, 1.0);
    } else {
      shapeNormal = normalize(coord - center);
    }
  } else if (isCircle(u_resolution, u_borderRadius)) {
    distFromEdgeShape = -circleDistance(coord, u_resolution, u_borderRadius);
    vec2 center = vec2(0.5, 0.5);
    shapeNormal = normalize(coord - center);
  } else {
    distFromEdgeShape = -roundedRectDistance(coord, u_resolution, u_borderRadius);
    vec2 center = vec2(0.5, 0.5);
    shapeNormal = normalize(coord - center);
  }
  distFromEdgeShape = max(distFromEdgeShape, 0.0);

  float distFromEdge = distFromEdgeShape / min(u_resolution.x, u_resolution.y);
  float normalizedDistance = distFromEdge * min(u_resolution.x, u_resolution.y);

  // Optical field equations
  float baseIntensity = 1.0 - exp(-normalizedDistance * u_baseDistance);
  float edgeIntensity = exp(-normalizedDistance * u_edgeDistance);
  float rimIntensity = exp(-normalizedDistance * u_rimDistance);

  float baseComponent = u_warp > 0.5 ? baseIntensity * u_baseIntensity : 0.0;
  float totalIntensity = baseComponent + edgeIntensity * u_edgeIntensity + rimIntensity * u_rimIntensity;
  vec2 baseRefraction = shapeNormal * totalIntensity;

  // Corner boost
  float cornerProximityX = min(coord.x, 1.0 - coord.x);
  float cornerProximityY = min(coord.y, 1.0 - coord.y);
  float cornerDistance = max(cornerProximityX, cornerProximityY);
  float cornerNormalized = cornerDistance * min(u_resolution.x, u_resolution.y);
  float cornerBoost = exp(-cornerNormalized * 0.3) * u_cornerBoost;
  vec2 cornerRefraction = shapeNormal * cornerBoost;

  // Ripple micro-imperfection
  vec2 perpendicular = vec2(-shapeNormal.y, shapeNormal.x);
  float rippleEffect = sin(distFromEdge * 25.0) * u_rippleEffect * rimIntensity;
  vec2 textureRefraction = perpendicular * rippleEffect;

  vec2 totalRefraction = baseRefraction + cornerRefraction + textureRefraction;
  textureCoord += totalRefraction;

  // 13x13 Gaussian Blur
  vec4 color = vec4(0.0);
  vec2 texelSize = 1.0 / u_textureSize;
  float sigma = u_blurRadius / 2.0;
  vec2 blurStep = texelSize * sigma;
  float totalWeight = 0.0;

  for(float i = -6.0; i <= 6.0; i += 1.0) {
    for(float j = -6.0; j <= 6.0; j += 1.0) {
      float distance = length(vec2(i, j));
      if(distance > 6.0) continue;
      float weight = exp(-(distance * distance) / (2.0 * sigma * sigma));
      vec2 offset = vec2(i, j) * blurStep;
      color += texture2D(u_image, textureCoord + offset) * weight;
      totalWeight += weight;
    }
  }
  color /= totalWeight;

  // Static vertical luminance gradient
  float gradientPosition = coord.y;
  vec3 topTint = vec3(1.0, 1.0, 1.0);
  vec3 bottomTint = vec3(0.7, 0.7, 0.7);
  vec3 gradientTint = mix(topTint, bottomTint, gradientPosition);
  vec3 tintedColor = mix(color.rgb, gradientTint, u_tintOpacity);
  color = vec4(tintedColor, color.a);

  // Live sampled ambient gradient
  vec2 viewportCenter = containerCenter;
  float topY = (viewportCenter.y - containerSize.y * 0.4) / textureSize.y;
  float midY = viewportCenter.y / textureSize.y;
  float bottomY = (viewportCenter.y + containerSize.y * 0.4) / textureSize.y;

  vec3 topColor = vec3(0.0);
  vec3 midColor = vec3(0.0);
  vec3 bottomColor = vec3(0.0);
  float sampleCount = 0.0;

  for(float x = 0.0; x < 1.0; x += 0.05) {
    for(float yOffset = -5.0; yOffset <= 5.0; yOffset += 1.0) {
      topColor += texture2D(u_image, vec2(x, topY + yOffset * texelSize.y)).rgb;
      midColor += texture2D(u_image, vec2(x, midY + yOffset * texelSize.y)).rgb;
      bottomColor += texture2D(u_image, vec2(x, bottomY + yOffset * texelSize.y)).rgb;
      sampleCount += 1.0;
    }
  }
  topColor /= sampleCount;
  midColor /= sampleCount;
  bottomColor /= sampleCount;

  vec3 sampledGradient;
  if (gradientPosition < 0.1) {
    sampledGradient = topColor;
  } else if (gradientPosition > 0.9) {
    sampledGradient = bottomColor;
  } else {
    float transitionPos = (gradientPosition - 0.1) / 0.8;
    if (transitionPos < 0.5) {
      sampledGradient = mix(topColor, midColor, transitionPos * 2.0);
    } else {
      sampledGradient = mix(midColor, bottomColor, (transitionPos - 0.5) * 2.0);
    }
  }

  vec3 finalTinted = mix(color.rgb, sampledGradient, u_tintOpacity * 0.3);

  // Sub-pixel edge anti-aliasing mask
  float maskDistance;
  if (isPill(u_resolution, u_borderRadius)) {
    maskDistance = pillDistance(coord, u_resolution, u_borderRadius);
  } else if (isCircle(u_resolution, u_borderRadius)) {
    maskDistance = circleDistance(coord, u_resolution, u_borderRadius);
  } else {
    maskDistance = roundedRectDistance(coord, u_resolution, u_borderRadius);
  }
  float mask = 1.0 - smoothstep(-1.0, 1.0, maskDistance);

  gl_FragColor = vec4(finalTinted, mask);
}
```

---

### 3.4 Nested Glass Fragment Shader (`button.js`)

Samples the parent container's rendered canvas in real time:

```glsl
precision mediump float;

uniform sampler2D u_image;              // Parent container's canvas texture
uniform vec2 u_resolution;             // Button size in pixels
uniform vec2 u_textureSize;            // Parent container canvas size
uniform float u_blurRadius;
uniform float u_borderRadius;
uniform vec2 u_buttonPosition;         // Screen center of button
uniform vec2 u_containerPosition;      // Screen center of parent container
uniform vec2 u_containerSize;          // Parent container dimensions
uniform float u_warp;
uniform float u_edgeIntensity;
uniform float u_rimIntensity;
uniform float u_baseIntensity;
uniform float u_edgeDistance;
uniform float u_rimDistance;
uniform float u_baseDistance;
uniform float u_cornerBoost;
uniform float u_rippleEffect;
uniform float u_tintOpacity;

varying vec2 v_texcoord;

// [Includes SDF functions: roundedRectDistance, circleDistance, pillDistance, isPill, isCircle]

void main() {
  vec2 coord = v_texcoord;
  vec2 buttonSize = u_resolution;
  vec2 containerSize = u_containerSize;

  // Convert button coordinates to parent container's UV coordinate space
  vec2 containerTopLeft = u_containerPosition - containerSize * 0.5;
  vec2 buttonTopLeft = u_buttonPosition - buttonSize * 0.5;
  vec2 buttonRelativePos = buttonTopLeft - containerTopLeft;
  vec2 buttonPixel = coord * buttonSize;
  vec2 containerPixel = buttonRelativePos + buttonPixel;
  vec2 baseTextureCoord = containerPixel / containerSize;

  // Button Shape Normal & Distance
  float distFromEdgeShape;
  vec2 shapeNormal;

  if (isPill(u_resolution, u_borderRadius)) {
    distFromEdgeShape = -pillDistance(coord, u_resolution, u_borderRadius);
    vec2 center = vec2(0.5, 0.5);
    vec2 pixelCoord = coord * u_resolution;
    vec2 capsuleStart = vec2(u_borderRadius, center.y * u_resolution.y);
    vec2 capsuleEnd = vec2(u_resolution.x - u_borderRadius, center.y * u_resolution.y);
    vec2 capsuleAxis = capsuleEnd - capsuleStart;
    float capsuleLength = length(capsuleAxis);
    if (capsuleLength > 0.0) {
      vec2 toPoint = pixelCoord - capsuleStart;
      float t = clamp(dot(toPoint, capsuleAxis) / dot(capsuleAxis, capsuleAxis), 0.0, 1.0);
      vec2 closestPointOnAxis = capsuleStart + t * capsuleAxis;
      vec2 normalDir = pixelCoord - closestPointOnAxis;
      shapeNormal = length(normalDir) > 0.0 ? normalize(normalDir) : vec2(0.0, 1.0);
    } else {
      shapeNormal = normalize(coord - center);
    }
  } else if (isCircle(u_resolution, u_borderRadius)) {
    distFromEdgeShape = -circleDistance(coord, u_resolution, u_borderRadius);
    vec2 center = vec2(0.5, 0.5);
    shapeNormal = normalize(coord - center);
  } else {
    distFromEdgeShape = -roundedRectDistance(coord, u_resolution, u_borderRadius);
    vec2 center = vec2(0.5, 0.5);
    shapeNormal = normalize(coord - center);
  }
  distFromEdgeShape = max(distFromEdgeShape, 0.0);

  float distFromEdge = distFromEdgeShape / min(u_resolution.x, u_resolution.y);
  float normalizedDistance = distFromEdge * min(u_resolution.x, u_resolution.y);

  float baseIntensity = 1.0 - exp(-normalizedDistance * u_baseDistance);
  float edgeIntensity = exp(-normalizedDistance * u_edgeDistance);
  float rimIntensity = exp(-normalizedDistance * u_rimDistance);

  float baseComponent = u_warp > 0.5 ? baseIntensity * u_baseIntensity : 0.0;
  float totalIntensity = baseComponent + edgeIntensity * u_edgeIntensity + rimIntensity * u_rimIntensity;
  vec2 baseRefraction = shapeNormal * totalIntensity;

  // Corner boost
  float cornerProximityX = min(coord.x, 1.0 - coord.x);
  float cornerProximityY = min(coord.y, 1.0 - coord.y);
  float cornerDistance = max(cornerProximityX, cornerProximityY);
  float cornerNormalized = cornerDistance * min(u_resolution.x, u_resolution.y);
  float cornerBoost = exp(-cornerNormalized * 0.3) * u_cornerBoost;
  vec2 cornerRefraction = shapeNormal * cornerBoost;

  // Button-level ripple
  vec2 perpendicular = vec2(-shapeNormal.y, shapeNormal.x);
  float rippleEffect = sin(distFromEdge * 30.0) * u_rippleEffect * rimIntensity;
  vec2 textureRefraction = perpendicular * rippleEffect;

  vec2 totalRefraction = baseRefraction + cornerRefraction + textureRefraction;
  vec2 textureCoord = baseTextureCoord + totalRefraction;

  // 9x9 Gaussian blur over the parent glass texture
  vec4 color = vec4(0.0);
  vec2 texelSize = 1.0 / containerSize;
  float sigma = u_blurRadius / 3.0;
  vec2 blurStep = texelSize * sigma;
  float totalWeight = 0.0;

  for(float i = -4.0; i <= 4.0; i += 1.0) {
    for(float j = -4.0; j <= 4.0; j += 1.0) {
      float distance = length(vec2(i, j));
      if(distance > 4.0) continue;
      float weight = exp(-(distance * distance) / (2.0 * sigma * sigma));
      vec2 offset = vec2(i, j) * blurStep;
      color += texture2D(u_image, textureCoord + offset) * weight;
      totalWeight += weight;
    }
  }
  color /= totalWeight;

  // Layered button tints
  float gradientPosition = coord.y;
  vec3 topTint = vec3(1.0, 1.0, 1.0);
  vec3 bottomTint = vec3(0.7, 0.7, 0.7);
  vec3 gradientTint = mix(topTint, bottomTint, gradientPosition);
  vec3 tintedColor = mix(color.rgb, gradientTint, u_tintOpacity * 0.7);
  color = vec4(tintedColor, color.a);

  // Sample parent texture ambient gradient
  vec2 viewportCenter = u_buttonPosition;
  float topY = max(0.0, (viewportCenter.y - buttonSize.y * 0.4) / containerSize.y);
  float midY = viewportCenter.y / containerSize.y;
  float bottomY = min(1.0, (viewportCenter.y + buttonSize.y * 0.4) / containerSize.y);

  vec3 topColor = texture2D(u_image, vec2(0.5, topY)).rgb;
  vec3 midColor = texture2D(u_image, vec2(0.5, midY)).rgb;
  vec3 bottomColor = texture2D(u_image, vec2(0.5, bottomY)).rgb;

  vec3 sampledGradient;
  if (gradientPosition < 0.1) {
    sampledGradient = topColor;
  } else if (gradientPosition > 0.9) {
    sampledGradient = bottomColor;
  } else {
    float transitionPos = (gradientPosition - 0.1) / 0.8;
    if (transitionPos < 0.5) {
      sampledGradient = mix(topColor, midColor, transitionPos * 2.0);
    } else {
      sampledGradient = mix(midColor, bottomColor, (transitionPos - 0.5) * 2.0);
    }
  }

  vec3 secondTinted = mix(color.rgb, sampledGradient, u_tintOpacity * 0.4);

  // Button optical specular edge highlight (1.08x top to 0.92x bottom)
  vec3 buttonTopTint = vec3(1.08, 1.08, 1.08);
  vec3 buttonBottomTint = vec3(0.92, 0.92, 0.92);
  vec3 buttonGradient = mix(buttonTopTint, buttonBottomTint, gradientPosition);
  vec3 finalTinted = secondTinted * buttonGradient;

  // Sub-pixel shape mask
  float maskDistance;
  if (isPill(u_resolution, u_borderRadius)) {
    maskDistance = pillDistance(coord, u_resolution, u_borderRadius);
  } else if (isCircle(u_resolution, u_borderRadius)) {
    maskDistance = circleDistance(coord, u_resolution, u_borderRadius);
  } else {
    maskDistance = roundedRectDistance(coord, u_resolution, u_borderRadius);
  }
  float mask = 1.0 - smoothstep(-1.0, 1.0, maskDistance);

  gl_FragColor = vec4(finalTinted, mask);
}
```

---

### 3.5 Core JavaScript Engine

#### The `Container` Class
```javascript
class Container {
  static instances = [];
  static pageSnapshot = null;
  static isCapturing = false;
  static waitingForSnapshot = [];

  constructor(options = {}) {
    this.width = 0;
    this.height = 0;
    this.borderRadius = options.borderRadius || 48;
    this.type = options.type || 'rounded'; // 'rounded' | 'circle' | 'pill'
    this.tintOpacity = options.tintOpacity !== undefined ? options.tintOpacity : 0.2;

    this.canvas = null;
    this.element = null;
    this.gl = null;
    this.gl_refs = {};
    this.webglInitialized = false;
    this.children = [];

    Container.instances.push(this);
    this.init();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'glass-container';
    if (this.type === 'circle') this.element.classList.add('glass-container-circle');
    else if (this.type === 'pill') this.element.classList.add('glass-container-pill');
    this.element.style.borderRadius = this.borderRadius + 'px';

    this.canvas = document.createElement('canvas');
    this.canvas.style.borderRadius = this.borderRadius + 'px';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25)';
    this.canvas.style.zIndex = '-1';

    this.element.appendChild(this.canvas);
  }

  setupCanvas() {
    this.gl = this.canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!this.gl) console.error('WebGL not supported on this device.');
  }

  addChild(child) {
    this.children.push(child);
    child.parent = this;
    if (child.element && this.element) this.element.appendChild(child.element);
    if (child instanceof Button) child.setupAsNestedGlass();
    this.updateSizeFromDOM();
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parent = null;
      if (child.element && this.element.contains(child.element)) {
        this.element.removeChild(child.element);
      }
      this.updateSizeFromDOM();
    }
  }

  getPosition() {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  updateSizeFromDOM() {
    requestAnimationFrame(() => {
      const rect = this.element.getBoundingClientRect();
      let newWidth = Math.ceil(rect.width);
      let newHeight = Math.ceil(rect.height);

      if (this.type === 'circle') {
        const size = Math.max(newWidth, newHeight);
        newWidth = size;
        newHeight = size;
        this.borderRadius = size / 2;
        this.element.style.width = size + 'px';
        this.element.style.height = size + 'px';
        this.element.style.borderRadius = this.borderRadius + 'px';
      } else if (this.type === 'pill') {
        this.borderRadius = newHeight / 2;
        this.element.style.borderRadius = this.borderRadius + 'px';
      }

      if (newWidth !== this.width || newHeight !== this.height) {
        this.width = newWidth;
        this.height = newHeight;

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.canvas.style.width = newWidth + 'px';
        this.canvas.style.height = newHeight + 'px';
        this.canvas.style.borderRadius = this.borderRadius + 'px';

        if (this.gl_refs.gl) {
          this.gl_refs.gl.viewport(0, 0, newWidth, newHeight);
          this.gl_refs.gl.uniform2f(this.gl_refs.resolutionLoc, newWidth, newHeight);
          this.gl_refs.gl.uniform1f(this.gl_refs.borderRadiusLoc, this.borderRadius);
        }

        // Propagate size updates to all nested children
        this.children.forEach(child => {
          if (child instanceof Button && child.isNestedGlass && child.gl_refs.gl) {
            const gl = child.gl_refs.gl;
            gl.bindTexture(gl.TEXTURE_2D, child.gl_refs.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, newWidth, newHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.uniform2f(child.gl_refs.textureSizeLoc, newWidth, newHeight);
            if (child.gl_refs.containerSizeLoc) {
              gl.uniform2f(child.gl_refs.containerSizeLoc, newWidth, newHeight);
            }
          }
        });
      }
    });
  }

  capturePageSnapshot() {
    html2canvas(document.body, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      ignoreElements: element =>
        element.classList.contains('glass-container') ||
        element.classList.contains('glass-button') ||
        element.classList.contains('glass-button-text') ||
        element.classList.contains('glass-controls')
    }).then(snapshot => {
      Container.pageSnapshot = snapshot;
      Container.isCapturing = false;
      const waiting = Container.waitingForSnapshot.slice();
      Container.waitingForSnapshot = [];
      waiting.forEach(c => {
        if (!c.webglInitialized) c.initWebGL();
      });
    }).catch(err => {
      console.error('html2canvas capture error:', err);
      Container.isCapturing = false;
    });
  }

  init() {
    this.createElement();
    this.setupCanvas();
    this.updateSizeFromDOM();

    if (Container.pageSnapshot) {
      this.initWebGL();
    } else if (Container.isCapturing) {
      Container.waitingForSnapshot.push(this);
    } else {
      Container.isCapturing = true;
      Container.waitingForSnapshot.push(this);
      setTimeout(() => this.capturePageSnapshot(), 100);
    }
  }

  initWebGL() {
    if (!Container.pageSnapshot || !this.gl) return;
    const img = new Image();
    img.src = Container.pageSnapshot.toDataURL();
    img.onload = () => {
      this.setupShader(img);
      this.webglInitialized = true;
    };
  }

  setupShader(image) {
    const gl = this.gl;
    // Compile shaders and create program...
    // [See Fragment Shader in Section 3.3]
    this.startRenderLoop();
  }

  startRenderLoop() {
    const render = () => {
      if (!this.gl_refs.gl) return;
      const gl = this.gl_refs.gl;
      gl.clear(gl.COLOR_BUFFER_BIT);

      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      gl.uniform1f(this.gl_refs.scrollYLoc, scrollY);

      const position = this.getPosition();
      gl.uniform2f(this.gl_refs.containerPositionLoc, position.x, position.y);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    render();
    window.addEventListener('scroll', () => render(), { passive: true });
    this.render = render;
  }
}
```

---

#### The `Button` Class
```javascript
class Button extends Container {
  constructor(options = {}) {
    const text = options.text || 'Button';
    const fontSize = parseInt(options.size) || 48;
    const onClick = options.onClick || null;
    const type = options.type || 'rounded';
    const warp = options.warp !== undefined ? options.warp : false;
    const tintOpacity = options.tintOpacity !== undefined ? options.tintOpacity : 0.2;

    super({
      borderRadius: fontSize,
      type: type,
      tintOpacity: tintOpacity
    });

    this.text = text;
    this.fontSize = fontSize;
    this.onClick = onClick;
    this.type = type;
    this.warp = warp;
    this.parent = null;
    this.isNestedGlass = false;

    this.element.classList.add('glass-button');
    if (this.type === 'circle') this.element.classList.add('glass-button-circle');

    this.createTextElement();
    this.setupClickHandler();
    this.setSizeFromText();
  }

  static measureText(text, fontSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
    return ctx.measureText(text);
  }

  createTextElement() {
    this.textElement = document.createElement('span');
    this.textElement.className = 'glass-button-text';
    this.textElement.textContent = this.text;
    this.textElement.style.fontSize = this.fontSize + 'px';
    this.element.appendChild(this.textElement);
  }

  setupClickHandler() {
    this.element.addEventListener('click', e => {
      if (this.onClick) {
        e.stopPropagation();
        this.onClick(this.text);
      }
    });
  }

  setSizeFromText() {
    let width, height;

    if (this.type === 'circle') {
      const circleSize = this.fontSize * 2.5;
      width = circleSize;
      height = circleSize;
      this.borderRadius = circleSize / 2;
      this.element.style.width = width + 'px';
      this.element.style.height = height + 'px';
      this.element.style.minWidth = width + 'px';
      this.element.style.minHeight = height + 'px';
    } else if (this.type === 'pill') {
      const metrics = Button.measureText(this.text, this.fontSize);
      width = Math.ceil(metrics.width + this.fontSize * 2);
      height = Math.ceil(this.fontSize + this.fontSize * 1.2);
      this.borderRadius = height / 2;
      this.element.style.minWidth = width + 'px';
      this.element.style.minHeight = height + 'px';
      this.element.style.width = width + 'px';
      this.element.style.height = height + 'px';
    } else {
      const metrics = Button.measureText(this.text, this.fontSize);
      width = Math.ceil(metrics.width + this.fontSize * 2);
      height = Math.ceil(this.fontSize + this.fontSize * 1.5);
      this.borderRadius = this.fontSize;
      this.element.style.minWidth = width + 'px';
      this.element.style.minHeight = height + 'px';
    }

    this.element.style.borderRadius = this.borderRadius + 'px';
    if (this.canvas) this.canvas.style.borderRadius = this.borderRadius + 'px';

    this.width = width;
    this.height = height;

    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';
      if (this.gl_refs.gl) {
        this.gl_refs.gl.viewport(0, 0, width, height);
        this.gl_refs.gl.uniform2f(this.gl_refs.resolutionLoc, width, height);
        this.gl_refs.gl.uniform1f(this.gl_refs.borderRadiusLoc, this.borderRadius);
      }
    }
  }

  setupAsNestedGlass() {
    if (!this.parent) return;
    this.isNestedGlass = true;
    if (this.parent.webglInitialized) {
      this.initNestedWebGL();
    } else {
      const checkParent = () => {
        if (this.parent.webglInitialized) this.initNestedWebGL();
        else setTimeout(checkParent, 50);
      };
      checkParent();
    }
  }

  initNestedWebGL() {
    if (!this.parent || !this.parent.canvas) return;
    this.setupNestedShader();
  }

  startNestedRenderLoop() {
    const render = () => {
      if (!this.gl_refs.gl || !this.parent) return;
      const gl = this.gl_refs.gl;

      // Real-time dynamic grab of parent's rendered glass pixels
      gl.bindTexture(gl.TEXTURE_2D, this.gl_refs.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.parent.canvas);

      gl.clear(gl.COLOR_BUFFER_BIT);

      const buttonPos = this.getPosition();
      const containerPos = this.parent.getPosition();
      gl.uniform2f(this.gl_refs.buttonPositionLoc, buttonPos.x, buttonPos.y);
      gl.uniform2f(this.gl_refs.containerPositionLoc, containerPos.x, containerPos.y);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const animationLoop = () => {
      render();
      requestAnimationFrame(animationLoop);
    };
    animationLoop();
    this.render = render;
  }
}
```

---

## 4. Debug & Tuning Controls System

To tune, calibrate, and visually debug the glass optics live in the browser, integrate the following debug controls suite.

### 4.1 Debug Parameters Reference

| Control Parameter | Shader Uniform | Default | Range | Step | Optical Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Edge Intensity** | `u_edgeIntensity` | `0.01` | `0.000` - `0.100` | `0.001` | Refraction distortion magnitude directly at the contour border. |
| **Rim Intensity** | `u_rimIntensity` | `0.05` | `0.000` - `0.200` | `0.001` | Edge light reflection / Fresnel highlight brightness. |
| **Base Intensity** | `u_baseIntensity` | `0.01` | `0.000` - `0.050` | `0.001` | Interior glass body distortion magnitude (when Warp is active). |
| **Edge Distance** | `u_edgeDistance` | `0.15` | `0.050` - `0.500` | `0.010` | Falloff curve steepness for the edge refraction zone. |
| **Rim Distance** | `u_rimDistance` | `0.80` | `0.100` - `2.000` | `0.050` | Falloff radius for outer perimeter rim lighting. |
| **Base Distance** | `u_baseDistance` | `0.10` | `0.050` - `0.300` | `0.010` | Interior curvature attenuation factor. |
| **Corner Boost** | `u_cornerBoost` | `0.02` | `0.000` - `0.100` | `0.001` | Extra optical dispersion boost localized at rounded corners. |
| **Ripple Effect** | `u_rippleEffect` | `0.10` | `0.000` - `0.500` | `0.010` | Transverse sinusoidal molten-glass ripple anomalies. |
| **Blur Radius** | `u_blurRadius` | `5.00` | `1.000` - `15.00` | `0.500` | Kernel spread of the 2D Gaussian blur filter. |
| **Tint Opacity** | `u_tintOpacity` | `0.20` | `0.000` - `1.000` | `0.010` | Opacity blend factor for the gradient tint layers. |
| **Center Warp** | `u_warp` | `false` | `boolean` | N/A | Enables/disables interior lens distortion. |
| **Hide Buttons** | UI toggle | `false` | `boolean` | N/A | Toggles visibility of button layers to inspect pure containers. |

---

### 4.2 Debug Control Panel HTML Markup

Add this markup into your HTML document:

```html
<!-- Mobile Floating Toggle Button -->
<button id="mobile-controls-toggle" class="mobile-controls-toggle" aria-label="Toggle Controls Panel">
  <span class="toggle-icon">⚙️</span>
  <span class="toggle-text">Controls</span>
</button>

<!-- Glass Controls Panel -->
<div id="glass-controls-container" class="glass-controls">
  <div id="controls-content" class="controls-content">
    <h3>🍎 Liquid Glass Controls</h3>

    <div class="control-group">
      <label>Edge Intensity <span class="control-value" id="edgeValue">0.01</span></label>
      <input type="range" id="edgeIntensity" min="0" max="0.1" step="0.001" value="0.01" />
    </div>

    <div class="control-group">
      <label>Rim Intensity <span class="control-value" id="rimValue">0.05</span></label>
      <input type="range" id="rimIntensity" min="0" max="0.2" step="0.001" value="0.05" />
    </div>

    <div class="control-group">
      <label>Base Intensity <span class="control-value" id="baseValue">0.01</span></label>
      <input type="range" id="baseIntensity" min="0" max="0.05" step="0.001" value="0.01" />
    </div>

    <div class="control-group">
      <label>Edge Distance <span class="control-value" id="edgeDistValue">0.15</span></label>
      <input type="range" id="edgeDistance" min="0.05" max="0.5" step="0.01" value="0.15" />
    </div>

    <div class="control-group">
      <label>Rim Distance <span class="control-value" id="rimDistValue">0.8</span></label>
      <input type="range" id="rimDistance" min="0.1" max="2.0" step="0.05" value="0.8" />
    </div>

    <div class="control-group">
      <label>Base Distance <span class="control-value" id="baseDistValue">0.1</span></label>
      <input type="range" id="baseDistance" min="0.05" max="0.3" step="0.01" value="0.1" />
    </div>

    <div class="control-group">
      <label>Corner Boost <span class="control-value" id="cornerValue">0.02</span></label>
      <input type="range" id="cornerBoost" min="0" max="0.1" step="0.001" value="0.02" />
    </div>

    <div class="control-group">
      <label>Ripple Effect <span class="control-value" id="rippleValue">0.1</span></label>
      <input type="range" id="rippleEffect" min="0" max="0.5" step="0.01" value="0.1" />
    </div>

    <div class="control-group">
      <label>Blur Radius <span class="control-value" id="blurValue">5.0</span></label>
      <input type="range" id="blurRadius" min="1" max="15" step="0.5" value="5.0" />
    </div>

    <div class="control-group">
      <label>Tint Opacity <span class="control-value" id="tintValue">0.2</span></label>
      <input type="range" id="tintOpacity" min="0" max="1.0" step="0.01" value="0.2" />
    </div>

    <div class="control-group">
      <label><input type="checkbox" id="warpToggle" /> Enable Center Warp</label>
    </div>

    <div class="control-group">
      <label><input type="checkbox" id="hideButtonsToggle" /> Hide All Buttons</label>
    </div>

    <div class="control-group control-group-button">
      <button id="randomizeButton" class="randomize-button">🎲 Randomize Glass Effects</button>
    </div>
  </div>
</div>
```

---

### 4.3 Debug Control Panel CSS (`controls.css`)

```css
/* Glass Controls Panel Styles */
.glass-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  bottom: 20px;
  width: 300px;
  z-index: 10000;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  font-size: 14px;
  color: #333;
}

.controls-content {
  position: absolute;
  inset: 0;
  padding: 20px;
  z-index: 1;
  pointer-events: auto;
  width: 300px;
  box-sizing: border-box;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
}

.glass-controls h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  text-align: center;
}

.control-group {
  margin-bottom: 14px;
}

.control-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333336;
}

.control-value {
  display: inline-block;
  float: right;
  font-size: 12px;
  color: #666;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.control-group input[type='range'] {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
  outline: none;
  -webkit-appearance: none;
}

.control-group input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #007aff;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
}

.control-group input[type='checkbox'] {
  margin-right: 8px;
  transform: scale(1.15);
}

.randomize-button {
  background: rgba(0, 122, 255, 0.1);
  border: 1px solid rgba(0, 122, 255, 0.25);
  border-radius: 12px;
  color: #007aff;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.randomize-button:hover {
  background: rgba(0, 122, 255, 0.2);
}

/* Mobile Toggle */
.mobile-controls-toggle {
  display: none;
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10002;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #007aff;
  cursor: pointer;
}

@media (max-width: 768px) {
  .mobile-controls-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .glass-controls {
    display: none;
    top: 60px;
    right: 12px;
    bottom: 80px;
    left: 12px;
    width: auto;
  }
  .glass-controls.mobile-visible {
    display: block;
  }
  .controls-content {
    width: 100%;
  }
}
```

---

### 4.4 Debug Control Engine Wiring (`controls.js`)

```javascript
// Global Debug State
window.glassControls = {
  edgeIntensity: 0.01,
  rimIntensity: 0.05,
  baseIntensity: 0.01,
  edgeDistance: 0.15,
  rimDistance: 0.8,
  baseDistance: 0.1,
  cornerBoost: 0.02,
  rippleEffect: 0.1,
  blurRadius: 5.0,
  tintOpacity: 0.2,
  warp: false,
  hideButtons: false
};

// Dispatch updated uniforms live to all active Container & Button instances
function updateAllGlassInstances() {
  Container.instances.forEach(instance => {
    if (instance.gl_refs && instance.gl_refs.gl) {
      const gl = instance.gl_refs.gl;
      gl.useProgram(gl.getParameter(gl.CURRENT_PROGRAM));

      if (instance.gl_refs.blurRadiusLoc) {
        gl.uniform1f(instance.gl_refs.blurRadiusLoc, window.glassControls.blurRadius);
      }
      if (instance.gl_refs.edgeIntensityLoc) {
        gl.uniform1f(instance.gl_refs.edgeIntensityLoc, window.glassControls.edgeIntensity);
      }
      if (instance.gl_refs.rimIntensityLoc) {
        gl.uniform1f(instance.gl_refs.rimIntensityLoc, window.glassControls.rimIntensity);
      }
      if (instance.gl_refs.baseIntensityLoc) {
        gl.uniform1f(instance.gl_refs.baseIntensityLoc, window.glassControls.baseIntensity);
      }
      if (instance.gl_refs.edgeDistanceLoc) {
        gl.uniform1f(instance.gl_refs.edgeDistanceLoc, window.glassControls.edgeDistance);
      }
      if (instance.gl_refs.rimDistanceLoc) {
        gl.uniform1f(instance.gl_refs.rimDistanceLoc, window.glassControls.rimDistance);
      }
      if (instance.gl_refs.baseDistanceLoc) {
        gl.uniform1f(instance.gl_refs.baseDistanceLoc, window.glassControls.baseDistance);
      }
      if (instance.gl_refs.cornerBoostLoc) {
        gl.uniform1f(instance.gl_refs.cornerBoostLoc, window.glassControls.cornerBoost);
      }
      if (instance.gl_refs.rippleEffectLoc) {
        gl.uniform1f(instance.gl_refs.rippleEffectLoc, window.glassControls.rippleEffect);
      }
      if (instance.gl_refs.warpLoc) {
        gl.uniform1f(instance.gl_refs.warpLoc, window.glassControls.warp ? 1.0 : 0.0);
      }
      if (instance.gl_refs.tintOpacityLoc) {
        gl.uniform1f(instance.gl_refs.tintOpacityLoc, window.glassControls.tintOpacity);
      }

      if (instance.render) {
        instance.render();
      }
    }
  });
}

// Randomize glass properties for creative exploration
function randomizeGlassEffects() {
  const randomized = {
    edgeIntensity: 0.005 + Math.random() * 0.025,
    rimIntensity: 0.02 + Math.random() * 0.13,
    baseIntensity: 0.005 + Math.random() * 0.025,
    edgeDistance: 0.1 + Math.random() * 0.3,
    rimDistance: 0.3 + Math.random() * 1.2,
    baseDistance: 0.08 + Math.random() * 0.17,
    cornerBoost: 0.01 + Math.random() * 0.05,
    rippleEffect: 0.05 + Math.random() * 0.25,
    blurRadius: 2.0 + Math.random() * 10.0,
    tintOpacity: 0.1 + Math.random() * 0.7,
    warp: Math.random() < 0.3
  };

  Object.assign(window.glassControls, randomized);

  // Sync Slider UI values
  const sliders = [
    { id: 'edgeIntensity', prop: 'edgeIntensity', valueId: 'edgeValue' },
    { id: 'rimIntensity', prop: 'rimIntensity', valueId: 'rimValue' },
    { id: 'baseIntensity', prop: 'baseIntensity', valueId: 'baseValue' },
    { id: 'edgeDistance', prop: 'edgeDistance', valueId: 'edgeDistValue' },
    { id: 'rimDistance', prop: 'rimDistance', valueId: 'rimDistValue' },
    { id: 'baseDistance', prop: 'baseDistance', valueId: 'baseDistValue' },
    { id: 'cornerBoost', prop: 'cornerBoost', valueId: 'cornerValue' },
    { id: 'rippleEffect', prop: 'rippleEffect', valueId: 'rippleValue' },
    { id: 'blurRadius', prop: 'blurRadius', valueId: 'blurValue' },
    { id: 'tintOpacity', prop: 'tintOpacity', valueId: 'tintValue' }
  ];

  sliders.forEach(({ id, prop, valueId }) => {
    const input = document.getElementById(id);
    const label = document.getElementById(valueId);
    if (input && label) {
      input.value = randomized[prop];
      label.textContent = randomized[prop].toFixed(3);
    }
  });

  const warpCheckbox = document.getElementById('warpToggle');
  if (warpCheckbox) warpCheckbox.checked = randomized.warp;

  updateAllGlassInstances();
}

function initGlassControls() {
  const sliderDefs = [
    { id: 'edgeIntensity', prop: 'edgeIntensity', valueId: 'edgeValue' },
    { id: 'rimIntensity', prop: 'rimIntensity', valueId: 'rimValue' },
    { id: 'baseIntensity', prop: 'baseIntensity', valueId: 'baseValue' },
    { id: 'edgeDistance', prop: 'edgeDistance', valueId: 'edgeDistValue' },
    { id: 'rimDistance', prop: 'rimDistance', valueId: 'rimDistValue' },
    { id: 'baseDistance', prop: 'baseDistance', valueId: 'baseDistValue' },
    { id: 'cornerBoost', prop: 'cornerBoost', valueId: 'cornerValue' },
    { id: 'rippleEffect', prop: 'rippleEffect', valueId: 'rippleValue' },
    { id: 'blurRadius', prop: 'blurRadius', valueId: 'blurValue' },
    { id: 'tintOpacity', prop: 'tintOpacity', valueId: 'tintValue' }
  ];

  sliderDefs.forEach(({ id, prop, valueId }) => {
    const slider = document.getElementById(id);
    const display = document.getElementById(valueId);
    if (slider && display) {
      slider.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        window.glassControls[prop] = val;
        display.textContent = val.toFixed(3);
        updateAllGlassInstances();
      });
    }
  });

  document.getElementById('warpToggle')?.addEventListener('change', e => {
    window.glassControls.warp = e.target.checked;
    updateAllGlassInstances();
  });

  document.getElementById('hideButtonsToggle')?.addEventListener('change', e => {
    window.glassControls.hideButtons = e.target.checked;
    document.querySelectorAll('.glass-button').forEach(btn => {
      btn.style.display = e.target.checked ? 'none' : 'flex';
    });
  });

  document.getElementById('randomizeButton')?.addEventListener('click', randomizeGlassEffects);

  // Mobile toggle drawer
  const mobileToggle = document.getElementById('mobile-controls-toggle');
  const panel = document.getElementById('glass-controls-container');
  mobileToggle?.addEventListener('click', () => {
    panel?.classList.toggle('mobile-visible');
  });
}

document.addEventListener('DOMContentLoaded', initGlassControls);
```

---

## 5. Integration Checklist & Performance Best Practices

When applying Liquid Glass to any user interface:

1. **Include html2canvas**: `<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>` is required for the initial background snapshot.
2. **Exclude Glass Elements from Page Capture**: Always ensure glass containers, buttons, and debug panels have classes ignored in the `html2canvas` `ignoreElements` callback to prevent recursive snapshot artifacts.
3. **Handle Window Resize Correctly**: Debounce resize events by at least 250ms before invalidating `Container.pageSnapshot` and recapturing the layout.
4. **Z-Index Discipline**:
   - WebGL Canvas: `z-index: -1`
   - Content / Text / Icons: `z-index: 1`
   - Debug Controls Overlay: `z-index: 10000`
5. **GPU Performance**:
   - Container elements only redraw upon scroll or resize (zero idle GPU cycles).
   - Nested buttons use `requestAnimationFrame` and `gl.texSubImage2D` to sample live parent animations. If your container does not contain animating content, decouple or throttle child frame rendering for extended battery life.
