import * as THREE from "./libs/three.module.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";

window.addEventListener("DOMContentLoaded", () => {
  // ------------------------
  // DOM
  // ------------------------
  const viewport = document.getElementById("viewport");
  const statusEl = document.getElementById("status");
  const fpsEl = document.getElementById("fps");
  const modelsEl = document.getElementById("models");

  const torsoFile = document.getElementById("torsoFile");
  const braceFile = document.getElementById("braceFile");

  const toggleTorsoBtn = document.getElementById("toggleTorso");
  const toggleBraceBtn = document.getElementById("toggleBrace");
  const resetViewBtn = document.getElementById("resetView");
  const fitAllBtn = document.getElementById("fitAll");
  const screenshotBtn = document.getElementById("screenshot");

  const braceOpacity = document.getElementById("braceOpacity");
  const opVal = document.getElementById("opVal");

  const autoAlignBtn = document.getElementById("autoAlign");
  const autoScaleBrace = document.getElementById("autoScaleBrace");

  const sliceToggleBtn = document.getElementById("sliceToggle");
  const sliceResetBtn = document.getElementById("sliceReset");
  const sliceAxisSel = document.getElementById("sliceAxis");
  const slicePos = document.getElementById("slicePos");
  const sliceVal = document.getElementById("sliceVal");

  const pickToggleBtn = document.getElementById("pickToggle");
  const fitHeatmapBtn = document.getElementById("fitHeatmap");
  const collisionBtn = document.getElementById("collisionCheck");
  const fitScoreBtn = document.getElementById("fitScoreBtn");
  const fitSummaryEl = document.getElementById("fitSummary");

  // Torso zoom
  const torsoZoom = document.getElementById("torsoZoom");
  const torsoZoomVal = document.getElementById("torsoZoomVal");
  const resetTorsoZoom = document.getElementById("resetTorsoZoom");

  // One-click report
  const reportBtn = document.getElementById("oneClickReport");
  const reportStatusEl = document.getElementById("reportStatus"); // optional

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }
  function setReportStatus(msg) {
    if (reportStatusEl) reportStatusEl.textContent = msg;
  }

  // ------------------------
  // Scene
  // ------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f17);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 5000);
  camera.position.set(0, 1.2, 2.8);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true, // for screenshot/report
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;
  viewport.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x223355, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 4, 2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(-2, 2.5, -2);
  scene.add(rim);

  const grid = new THREE.GridHelper(10, 20, 0x1c2a44, 0x132036);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);

  const loader = new GLTFLoader();

  let torso = null;
  let brace = null;

  // Fit control: <1 tight, >1 loose
  let BRACE_FIT = 0.75;

  // ------------------------
  // Smooth Torso Zoom (maps-like)
  // ------------------------
  let torsoBaseScale = null;
  let torsoZoomTarget = 1.0;
  let torsoZoomCurrent = 1.0;
  let torsoZoomLastSliceUpdate = 0;

  function applyTorsoZoomImmediate(scaleFactor) {
    if (!torso) return;
    if (!torsoBaseScale) torsoBaseScale = torso.scale.clone();
    torso.scale.copy(torsoBaseScale).multiplyScalar(scaleFactor);
    torso.updateWorldMatrix(true, true);
  }

  // ------------------------
  // Picking
  // ------------------------
  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2();

  let pickEnabled = false;
  let pickedMesh = null;
  const originalMaterial = new WeakMap();

  function setPicked(mesh) {
    if (pickedMesh && originalMaterial.has(pickedMesh)) {
      pickedMesh.material = originalMaterial.get(pickedMesh);
    }
    pickedMesh = mesh;
    if (!pickedMesh) return;

    if (!originalMaterial.has(pickedMesh)) {
      originalMaterial.set(pickedMesh, pickedMesh.material);
    }

    pickedMesh.material = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      opacity: Math.max(0.35, parseFloat(braceOpacity?.value || "0.55")),
      depthWrite: false,
      clippingPlanes: sliceEnabled ? [slicePlane] : null,
    });
  }

  function pickAtClientXY(clientX, clientY) {
    if (!brace) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    mouseNDC.set(x, y);

    raycaster.setFromCamera(mouseNDC, camera);

    const meshes = [];
    brace.traverse((c) => c.isMesh && meshes.push(c));

    const hits = raycaster.intersectObjects(meshes, true);
    if (hits.length) {
      setPicked(hits[0].object);
      setStatus(`Picked ✅ ${hits[0].object.name || "brace mesh"}`);
    } else {
      setPicked(null);
      setStatus("Pick enabled: click brace to highlight.");
    }
  }

  function enablePick(on) {
    pickEnabled = on;
    if (pickToggleBtn) pickToggleBtn.textContent = pickEnabled ? "Disable Pick" : "Enable Pick";
    if (!pickEnabled) {
      setPicked(null);
      setStatus("Pick disabled.");
    } else {
      setStatus("Pick enabled ✅ Click brace to highlight a region.");
    }
  }

  // ------------------------
  // Slice View (clipping)
  // ------------------------
  let sliceEnabled = false;
  const slicePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  function setMaterialClipping(root, enabled) {
    if (!root) return;
    root.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        if (!m) continue;
        m.clippingPlanes = enabled ? [slicePlane] : null;
        m.clipIntersection = false;
        m.needsUpdate = true;
      }
    });
  }

  function updateSlicePlane() {
    if (!sliceEnabled) return;
    const objs = [];
    if (torso) objs.push(torso);
    if (brace) objs.push(brace);
    if (!objs.length) return;

    const box = new THREE.Box3();
    objs.forEach((o) => box.expandByObject(o));

    const t = parseFloat(slicePos?.value || "0.5");
    if (sliceVal) sliceVal.textContent = t.toFixed(2);

    const axis = sliceAxisSel?.value || "Y";
    if (axis === "X") {
      const x = THREE.MathUtils.lerp(box.min.x, box.max.x, t);
      slicePlane.normal.set(1, 0, 0);
      slicePlane.constant = -x;
    } else if (axis === "Y") {
      const y = THREE.MathUtils.lerp(box.min.y, box.max.y, t);
      slicePlane.normal.set(0, 1, 0);
      slicePlane.constant = -y;
    } else {
      const z = THREE.MathUtils.lerp(box.min.z, box.max.z, t);
      slicePlane.normal.set(0, 0, 1);
      slicePlane.constant = -z;
    }

    setMaterialClipping(torso, true);
    setMaterialClipping(brace, true);
    if (brace) applyBraceOpacity(parseFloat(braceOpacity?.value || "0.55"));
  }

  function enableSlice(on) {
    sliceEnabled = on;
    if (sliceEnabled) {
      if (!slicePos.value) slicePos.value = "0.5";
      if (sliceVal) sliceVal.textContent = Number(slicePos.value).toFixed(2);

      setMaterialClipping(torso, true);
      setMaterialClipping(brace, true);
      updateSlicePlane();

      setStatus("Slice enabled ✅ Change axis + move slider.");
      if (sliceToggleBtn) sliceToggleBtn.textContent = "Disable Slice";
    } else {
      setMaterialClipping(torso, false);
      setMaterialClipping(brace, false);
      setStatus("Slice disabled.");
      if (sliceToggleBtn) sliceToggleBtn.textContent = "Enable Slice";
    }
  }

  // ------------------------
  // Opacity (brace)
  // ------------------------
  function applyBraceOpacity(val) {
    if (!brace) return;
    brace.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        if (!m) continue;
        m.transparent = true;
        m.opacity = val;
        m.depthWrite = false;
        m.depthTest = true;
        if (sliceEnabled) m.clippingPlanes = [slicePlane];
        m.needsUpdate = true;
      }
    });
  }

  // ------------------------
  // Helpers
  // ------------------------
  function updateModelCount() {
    const count = (torso ? 1 : 0) + (brace ? 1 : 0);
    if (modelsEl) modelsEl.textContent = `Models: ${count}/2`;
  }

  function disposeRoot(root) {
    root.traverse((c) => {
      if (c.isMesh) {
        c.geometry?.dispose?.();
        if (Array.isArray(c.material)) c.material.forEach((m) => m?.dispose?.());
        else c.material?.dispose?.();
      }
    });
  }

  function normalizeToHeight(root, targetHeight = 1.7) {
    if (!root) return;
    root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    if (size.y < 1e-6) return;

    const s = targetHeight / size.y;
    root.scale.multiplyScalar(s);

    root.updateWorldMatrix(true, true);
    const box2 = new THREE.Box3().setFromObject(root);
    const center = box2.getCenter(new THREE.Vector3());

    root.position.sub(center);
    root.position.y -= box2.min.y;

    root.updateWorldMatrix(true, true);
  }

  function fitCameraToObjects(objs, padding = 1.35) {
    const box = new THREE.Box3();
    objs.forEach((o) => box.expandByObject(o));
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let camZ = Math.abs((maxDim / 2) / Math.tan(fov / 2));
    camZ *= padding;

    camera.position.set(center.x, center.y + maxDim * 0.15, center.z + camZ);
    camera.near = Math.max(0.01, camZ / 200);
    camera.far = camZ * 200;
    camera.updateProjectionMatrix();

    controls.target.copy(center);
    controls.update();
  }

  // ------------------------
  // FitDist attribute (for Report)
  // ------------------------
  function ensureFitDistAttribute(mesh) {
    const geo = mesh.geometry;
    if (!geo || !geo.attributes?.position) return;

    if (!geo.attributes.fitDist) {
      const count = geo.attributes.position.count;
      const arr = new Float32Array(count);
      arr.fill(-1);
      geo.setAttribute("fitDist", new THREE.BufferAttribute(arr, 1));
    }
  }

  // ------------------------
  // Auto Align Brace (smart)
  // ------------------------
  function autoAlignBraceToTorsoSmart() {
    if (!torso || !brace) return setStatus("Load both Torso and Brace first.");

    brace.position.set(0, 0, 0);
    brace.rotation.set(0, 0, 0);
    brace.updateWorldMatrix(true, true);
    torso.updateWorldMatrix(true, true);

    const tBox = new THREE.Box3().setFromObject(torso);
    const tSize = tBox.getSize(new THREE.Vector3());
    const tCenter = tBox.getCenter(new THREE.Vector3());

    const rotations = [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(0, Math.PI / 2, 0),
      new THREE.Euler(0, Math.PI, 0),
      new THREE.Euler(0, -Math.PI / 2, 0),
    ];

    let best = { score: Infinity, rot: rotations[0], scale: 1, delta: new THREE.Vector3() };

    for (const rot of rotations) {
      brace.rotation.copy(rot);
      brace.scale.set(1, 1, 1);
      brace.position.set(0, 0, 0);
      brace.updateWorldMatrix(true, true);

      const bBox = new THREE.Box3().setFromObject(brace);
      const bSize = bBox.getSize(new THREE.Vector3());

      const eps = 1e-6;
      const sx = tSize.x / Math.max(bSize.x, eps);
      const sz = tSize.z / Math.max(bSize.z, eps);

      let s = Math.min(sx, sz);
      s = s * BRACE_FIT;
      s = THREE.MathUtils.clamp(s, 0.001, 100);

      brace.scale.setScalar(s);
      brace.updateWorldMatrix(true, true);

      const bBox2 = new THREE.Box3().setFromObject(brace);
      const bCenter2 = bBox2.getCenter(new THREE.Vector3());

      const targetY = tBox.min.y + tSize.y * 0.58;
      const delta = new THREE.Vector3(
        tCenter.x - bCenter2.x,
        targetY - bCenter2.y,
        tCenter.z - bCenter2.z
      );

      const bSize2 = bBox2.getSize(new THREE.Vector3());
      const score = Math.abs(bSize2.x - tSize.x) + Math.abs(bSize2.z - tSize.z);

      if (score < best.score) best = { score, rot: rot.clone(), scale: s, delta: delta.clone() };
    }

    brace.rotation.copy(best.rot);
    brace.scale.setScalar(best.scale);
    brace.position.add(best.delta);
    brace.updateWorldMatrix(true, true);

    fitCameraToObjects([torso, brace]);
    if (sliceEnabled) updateSlicePlane();

    setStatus("✅ Brace Fit Done (X/Z scaled + centered)");
  }

  // ------------------------
  // Heatmap (distance raycast)
  // ------------------------
  const savedGeo = new WeakMap();

  function ensureVertexColors(mesh) {
    const g = mesh.geometry;
    if (!g || !g.isBufferGeometry) return;

    if (!savedGeo.has(mesh)) savedGeo.set(mesh, g);

    let geo = g;
    if (geo.index) geo = geo.toNonIndexed();
    if (!geo.attributes.normal) geo.computeVertexNormals();

    geo = geo.clone();

    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    mesh.geometry = geo;

    mesh.material = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.05,
      transparent: true,
      opacity: parseFloat(braceOpacity?.value || "0.55"),
      vertexColors: true,
      depthWrite: false,
      clippingPlanes: sliceEnabled ? [slicePlane] : null,
    });
  }

  function distToColor(d, tight = 0.003, ok = 0.010, loose = 0.025) {
    if (d <= tight) return [1, 0.1, 0.1]; // red
    if (d <= ok) {
      const t = (d - tight) / Math.max(1e-6, ok - tight);
      return [1 - t, 0.8, 0.2];
    }
    if (d <= loose) {
      const t = (d - ok) / Math.max(1e-6, loose - ok);
      return [0.2, 0.9 - 0.3 * t, 0.2 + 0.8 * t];
    }
    return [0.1, 0.4, 1]; // blue
  }

  function forceHeatmapMaterialOnBrace() {
    if (!brace) return;
    brace.traverse((c) => {
      if (!c.isMesh) return;
      if (!c.geometry?.attributes?.color) return;

      c.material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.45,
        metalness: 0.05,
        transparent: true,
        opacity: parseFloat(braceOpacity?.value || "0.55"),
        depthWrite: false,
        clippingPlanes: sliceEnabled ? [slicePlane] : null,
      });
      c.material.needsUpdate = true;
    });
  }

  let heatmapBusy = false;

  async function colorBraceByFitRaycast({ sampleStep = 6, maxRayDist = 0.08 } = {}) {
    if (!torso || !brace) {
      setStatus("Load Torso + Brace first.");
      return null;
    }

    setStatus("Heatmap running…");

    const torsoMeshes = [];
    torso.traverse((c) => c.isMesh && torsoMeshes.push(c));

    const braceMeshes = [];
    brace.traverse((c) => c.isMesh && braceMeshes.push(c));

    raycaster.far = maxRayDist;
    raycaster.near = 0;

    const worldPos = new THREE.Vector3();
    const worldN = new THREE.Vector3();
    const nMat = new THREE.Matrix3();

    let total = 0,
      tightCount = 0,
      okCount = 0,
      looseCount = 0;

    const yieldToUI = () => new Promise(requestAnimationFrame);

    for (const mesh of braceMeshes) {
      ensureVertexColors(mesh);
      ensureFitDistAttribute(mesh); // ✅ IMPORTANT for report

      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      const nor = geo.attributes.normal;
      const col = geo.attributes.color;
      const fitDist = geo.attributes.fitDist;

      const adaptiveStep = Math.max(sampleStep, Math.floor(pos.count / 8000));
      const step = Math.max(2, adaptiveStep);

      mesh.updateWorldMatrix(true, false);
      nMat.getNormalMatrix(mesh.matrixWorld);

      let processed = 0;
      const YIELD_EVERY = 1200;

      for (let i = 0; i < pos.count; i += step) {
        worldPos.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
        worldN.fromBufferAttribute(nor, i).applyMatrix3(nMat).normalize();

        let best = Infinity;

        raycaster.set(worldPos, worldN);
        let hits = raycaster.intersectObjects(torsoMeshes, true);
        if (hits.length) best = Math.min(best, hits[0].distance);

        raycaster.set(worldPos, worldN.clone().multiplyScalar(-1));
        hits = raycaster.intersectObjects(torsoMeshes, true);
        if (hits.length) best = Math.min(best, hits[0].distance);

        const d = Number.isFinite(best) ? best : maxRayDist;

        // ✅ store distance for report
        fitDist.setX(i, d);

        total++;
        if (d <= 0.003) tightCount++;
        else if (d <= 0.010) okCount++;
        else looseCount++;

        const [r, g, b] = distToColor(d);
        col.setXYZ(i, r, g, b);

        processed++;
        if (processed % YIELD_EVERY === 0) {
          setStatus(`Heatmap running… (${processed}/${pos.count})`);
          await yieldToUI();
        }
      }

      // fill skipped vertices for color + fitDist
      for (let i = 1; i < pos.count; i++) {
        if (i % step !== 0) {
          const j = Math.floor(i / step) * step;
          col.setXYZ(i, col.getX(j), col.getY(j), col.getZ(j));
          fitDist.setX(i, fitDist.getX(j));
        }
      }

      col.needsUpdate = true;
      fitDist.needsUpdate = true;
      await yieldToUI();
    }

    forceHeatmapMaterialOnBrace();

    const tightPct = total ? Math.round((tightCount / total) * 100) : 0;
    const okPct = total ? Math.round((okCount / total) * 100) : 0;
    const loosePct = total ? Math.round((looseCount / total) * 100) : 0;

    setStatus(`✅ Heatmap applied. Tight:${tightPct}% OK:${okPct}% Loose:${loosePct}%`);
    return { total, tightPct, okPct, loosePct };
  }

  function collisionHighlightFromColors() {
    if (!brace) return;

    const braceMeshes = [];
    brace.traverse((c) => c.isMesh && braceMeshes.push(c));

    let collisionVerts = 0;

    for (const mesh of braceMeshes) {
      const col = mesh.geometry?.attributes?.color;
      if (!col) continue;

      for (let i = 0; i < col.count; i++) {
        const r = col.getX(i);
        const b = col.getZ(i);
        if (r > 0.9 && b < 0.35) {
          col.setXYZ(i, 1, 0, 0);
          collisionVerts++;
        }
      }
      col.needsUpdate = true;
    }

    setStatus(`✅ Collision highlight applied (red zones). (${collisionVerts} vertices)`);
  }

  // ------------------------
  // One-click Report
  // ------------------------
  function downloadText(filename, text, mime = "text/plain") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 800);
  }

  function computeFitReport({ tight = 0.003, ok = 0.010 } = {}) {
    if (!brace) return null;

    let total = 0,
      tightN = 0,
      okN = 0,
      looseN = 0;

    let minD = Infinity,
      maxD = -Infinity,
      sumD = 0;

    const worst = [];
    const MAX_WORST = 30;

    const tmpWorld = new THREE.Vector3();

    brace.updateWorldMatrix(true, true);

    brace.traverse((m) => {
      if (!m.isMesh) return;
      const geo = m.geometry;
      const dist = geo?.attributes?.fitDist;
      const pos = geo?.attributes?.position;
      if (!dist || !pos) return;

      m.updateWorldMatrix(true, false);

      for (let i = 0; i < dist.count; i++) {
        const d = dist.getX(i);
        if (!Number.isFinite(d) || d < 0) continue;

        total++;
        sumD += d;
        if (d < minD) minD = d;
        if (d > maxD) maxD = d;

        if (d <= tight) tightN++;
        else if (d <= ok) okN++;
        else looseN++;

        if (worst.length < MAX_WORST || d < worst[worst.length - 1].d) {
          tmpWorld.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
          worst.push({
            d,
            x: tmpWorld.x,
            y: tmpWorld.y,
            z: tmpWorld.z,
            mesh: m.name || "mesh",
          });
          worst.sort((a, b) => a.d - b.d);
          if (worst.length > MAX_WORST) worst.pop();
        }
      }
    });

    if (!total) return null;

    const tightPct = Math.round((tightN / total) * 100);
    const okPct = Math.round((okN / total) * 100);
    const loosePct = Math.round((looseN / total) * 100);

    return {
      totalSamples: total,
      tightPct,
      okPct,
      loosePct,
      minGapMM: minD * 1000,
      avgGapMM: (sumD / total) * 1000,
      maxGapMM: maxD * 1000,
      worstPoints: worst.map((w) => ({
        gapMM: w.d * 1000,
        x: +w.x.toFixed(4),
        y: +w.y.toFixed(4),
        z: +w.z.toFixed(4),
        mesh: w.mesh,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  function exportOneClickReport() {
    const report = computeFitReport();
    if (!report) {
      setStatus("Run Heatmap first (report needs distance data).");
      setReportStatus("Report: run Heatmap first.");
      return;
    }

    const screenshotDataUrl = renderer.domElement.toDataURL("image/png");
    const ts = new Date().toISOString().replaceAll(":", "-");

    const jsonName = `brace-fit-report-${ts}.json`;
    const htmlName = `brace-fit-report-${ts}.html`;

    downloadText(jsonName, JSON.stringify(report, null, 2), "application/json");

    const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Brace Fit Report</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:24px;background:#fff;color:#111;}
  .card{border:1px solid #ddd;border-radius:14px;padding:16px;margin:12px 0;}
  .pill{display:inline-block;background:#f3f3f3;padding:6px 10px;border-radius:999px;margin-right:8px;margin-bottom:8px;}
  img{max-width:100%;border-radius:12px;border:1px solid #ddd;}
  table{border-collapse:collapse;width:100%;}
  td,th{border:1px solid #eee;padding:8px;text-align:left;font-size:14px;}
</style></head>
<body>
<h1>Brace Fit Report</h1>
<div class="card">
  <span class="pill"><b>Tight:</b> ${report.tightPct}%</span>
  <span class="pill"><b>OK:</b> ${report.okPct}%</span>
  <span class="pill"><b>Loose:</b> ${report.loosePct}%</span>
  <span class="pill"><b>Samples:</b> ${report.totalSamples}</span>
</div>

<div class="card">
  <h3>Gap Summary (mm)</h3>
  <ul>
    <li><b>Min gap:</b> ${report.minGapMM.toFixed(2)} mm</li>
    <li><b>Avg gap:</b> ${report.avgGapMM.toFixed(2)} mm</li>
    <li><b>Max gap:</b> ${report.maxGapMM.toFixed(2)} mm</li>
  </ul>
</div>

<div class="card">
  <h3>Top Problem Points (smallest gaps)</h3>
  <table>
    <thead><tr><th>Gap (mm)</th><th>World X</th><th>World Y</th><th>World Z</th><th>Mesh</th></tr></thead>
    <tbody>
      ${report.worstPoints
        .map(
          (p) =>
            `<tr><td>${p.gapMM.toFixed(2)}</td><td>${p.x}</td><td>${p.y}</td><td>${p.z}</td><td>${p.mesh}</td></tr>`
        )
        .join("")}
    </tbody>
  </table>
</div>

<div class="card">
  <h3>Snapshot</h3>
  <img src="${screenshotDataUrl}" alt="snapshot"/>
</div>

<p style="margin-top:18px;color:#666;font-size:13px;">Generated: ${report.generatedAt}</p>
</body></html>`;

    downloadText(htmlName, html, "text/html");

    setStatus("✅ Report generated (downloaded HTML + JSON).");
    setReportStatus(`Report: saved (${ts})`);
  }

  reportBtn?.addEventListener("click", exportOneClickReport);

  // ------------------------
  // Load GLB
  // ------------------------
  async function loadFromFile(file, name) {
    const url = URL.createObjectURL(file);
    try {
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene;
      root.name = name;
      scene.add(root);
      return root;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ------------------------
  // Events: Load torso / brace
  // ------------------------
  torsoFile?.addEventListener("change", async () => {
    const file = torsoFile.files?.[0];
    if (!file) return;

    try {
      setStatus("Loading Torso…");
      if (torso) {
        scene.remove(torso);
        disposeRoot(torso);
        torso = null;
      }

      torso = await loadFromFile(file, "Torso");
      normalizeToHeight(torso, 1.7);

      torsoBaseScale = torso.scale.clone();
      torsoZoomCurrent = torsoZoom ? parseFloat(torsoZoom.value || "1.0") : 1.0;
      torsoZoomTarget = torsoZoomCurrent;
      if (torsoZoomVal) torsoZoomVal.textContent = torsoZoomCurrent.toFixed(2);
      applyTorsoZoomImmediate(torsoZoomCurrent);

      updateModelCount();
      setStatus("Torso loaded. Now load Brace.");
      fitCameraToObjects([torso]);

      if (sliceEnabled) updateSlicePlane();
    } catch (e) {
      console.error(e);
      setStatus("Failed to load Torso. Please select a valid GLB/GLTF.");
    }
  });

  braceFile?.addEventListener("change", async () => {
    const file = braceFile.files?.[0];
    if (!file) return;

    try {
      setStatus("Loading Brace…");
      if (brace) {
        scene.remove(brace);
        disposeRoot(brace);
        brace = null;
      }

      brace = await loadFromFile(file, "Brace");
      applyBraceOpacity(parseFloat(braceOpacity?.value || "0.55"));

      autoAlignBraceToTorsoSmart();

      updateModelCount();
      setStatus("Brace loaded. Use Auto-align and Heatmap.");
      fitCameraToObjects(torso ? [torso, brace] : [brace]);

      if (sliceEnabled) updateSlicePlane();
    } catch (e) {
      console.error(e);
      setStatus("Failed to load Brace. Please select a valid GLB/GLTF.");
    }
  });

  // ------------------------
  // UI buttons
  // ------------------------
  toggleTorsoBtn?.addEventListener("click", () => {
    if (!torso) return setStatus("Load Torso first.");
    torso.visible = !torso.visible;
  });

  toggleBraceBtn?.addEventListener("click", () => {
    if (!brace) return setStatus("Load Brace first.");
    brace.visible = !brace.visible;
  });

  braceOpacity?.addEventListener("input", () => {
    if (opVal) opVal.textContent = Number(braceOpacity.value).toFixed(2);
    applyBraceOpacity(parseFloat(braceOpacity.value));
  });

  resetViewBtn?.addEventListener("click", () => {
    camera.position.set(0, 1.2, 2.8);
    controls.target.set(0, 1.0, 0);
    controls.update();
  });

  fitAllBtn?.addEventListener("click", () => {
    const objs = [];
    if (torso) objs.push(torso);
    if (brace) objs.push(brace);
    if (!objs.length) return setStatus("Load models first.");
    fitCameraToObjects(objs);
  });

  screenshotBtn?.addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = "brace-visual-inspection.png";
    a.href = renderer.domElement.toDataURL("image/png");
    a.click();
  });

  autoAlignBtn?.addEventListener("click", () => autoAlignBraceToTorsoSmart());

  sliceToggleBtn?.addEventListener("click", () => enableSlice(!sliceEnabled));

  sliceResetBtn?.addEventListener("click", () => {
    if (sliceAxisSel) sliceAxisSel.value = "Y";
    if (slicePos) slicePos.value = "0.5";
    if (sliceVal) sliceVal.textContent = "0.50";
    if (sliceEnabled) updateSlicePlane();
  });

  sliceAxisSel?.addEventListener("change", () => sliceEnabled && updateSlicePlane());
  slicePos?.addEventListener("input", () => sliceEnabled && updateSlicePlane());

  pickToggleBtn?.addEventListener("click", () => enablePick(!pickEnabled));

  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (!pickEnabled) return;
    pickAtClientXY(e.clientX, e.clientY);
  });

  // Torso zoom UI
  torsoZoom?.addEventListener("input", () => {
    torsoZoomTarget = parseFloat(torsoZoom.value || "1.0");
    if (torsoZoomVal) torsoZoomVal.textContent = torsoZoomTarget.toFixed(2);
  });

  resetTorsoZoom?.addEventListener("click", () => {
    torsoZoomTarget = 1.0;
    if (torsoZoom) torsoZoom.value = "1.00";
    if (torsoZoomVal) torsoZoomVal.textContent = "1.00";
  });

  renderer.domElement.addEventListener(
    "wheel",
    (e) => {
      if (!torsoZoom) return;
      if (!e.shiftKey) return;
      e.preventDefault();
      const delta = Math.sign(e.deltaY);
      torsoZoomTarget = THREE.MathUtils.clamp(torsoZoomTarget + delta * 0.02, 0.7, 1.5);
      torsoZoom.value = torsoZoomTarget.toFixed(2);
      if (torsoZoomVal) torsoZoomVal.textContent = torsoZoomTarget.toFixed(2);
    },
    { passive: false }
  );

  // Heatmap buttons
  async function runHeatmap() {
    if (heatmapBusy) return;
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");

    heatmapBusy = true;
    if (fitHeatmapBtn) fitHeatmapBtn.disabled = true;
    if (collisionBtn) collisionBtn.disabled = true;

    try {
      autoAlignBraceToTorsoSmart();
      const result = await colorBraceByFitRaycast({ sampleStep: 6, maxRayDist: 0.08 });
      if (fitSummaryEl && result) {
        fitSummaryEl.textContent = `Fit Summary: Tight ${result.tightPct}% | OK ${result.okPct}% | Loose ${result.loosePct}%`;
      }
      setReportStatus("Report: ready (click One-Click Report)");
    } catch (e) {
      console.error(e);
      setStatus("Heatmap failed. Check console errors.");
    } finally {
      heatmapBusy = false;
      if (fitHeatmapBtn) fitHeatmapBtn.disabled = false;
      if (collisionBtn) collisionBtn.disabled = false;
    }
  }

  async function runCollision() {
    if (heatmapBusy) return;
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");

    heatmapBusy = true;
    if (fitHeatmapBtn) fitHeatmapBtn.disabled = true;
    if (collisionBtn) collisionBtn.disabled = true;

    try {
      autoAlignBraceToTorsoSmart();
      const result = await colorBraceByFitRaycast({ sampleStep: 6, maxRayDist: 0.08 });
      collisionHighlightFromColors();
      if (fitSummaryEl && result) {
        fitSummaryEl.textContent = `Fit Summary: Tight ${result.tightPct}% | OK ${result.okPct}% | Loose ${result.loosePct}%`;
      }
      setReportStatus("Report: ready (click One-Click Report)");
    } catch (e) {
      console.error(e);
      setStatus("Collision failed. Check console errors.");
    } finally {
      heatmapBusy = false;
      if (fitHeatmapBtn) fitHeatmapBtn.disabled = false;
      if (collisionBtn) collisionBtn.disabled = false;
    }
  }

  fitHeatmapBtn?.addEventListener("click", runHeatmap);
  collisionBtn?.addEventListener("click", runCollision);

  fitScoreBtn?.addEventListener("click", () => setStatus("Fit Score shown in Fit Summary ✅"));

  // Resize
  function resize() {
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", resize);
  resize();

  // Render loop + FPS + smooth zoom update
  let last = performance.now(),
    frames = 0;

  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (torso && torsoBaseScale) {
      torsoZoomCurrent += (torsoZoomTarget - torsoZoomCurrent) * 0.12;
      if (Math.abs(torsoZoomTarget - torsoZoomCurrent) < 0.0005) {
        torsoZoomCurrent = torsoZoomTarget;
      }
      applyTorsoZoomImmediate(torsoZoomCurrent);

      if (sliceEnabled) {
        const now = performance.now();
        if (now - torsoZoomLastSliceUpdate > 50) {
          updateSlicePlane();
          torsoZoomLastSliceUpdate = now;
        }
      }
    }

    renderer.render(scene, camera);

    frames++;
    const now = performance.now();
    if (now - last > 500) {
      const fps = Math.round((frames * 1000) / (now - last));
      if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
      frames = 0;
      last = now;
    }
  }
  animate();

  updateModelCount();
  setStatus("Offline ready ✅ Select Torso.glb and Brace.glb.");
  setReportStatus("Report: —");
});

