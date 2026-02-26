
// app.js — COMPLETE BraceViz Agentic Build (Single File)
// ✅ FIXED: Torso loads MEDIUM size + always centered inside the viewport block
// ✅ FIXED: No more normalizeCenterAndGround / fitCameraToObjects undefined errors
// ✅ Uses: normalizeAndCenterStrict + settleThenNormalize + frameToObjects
// ✅ Keeps your UI wiring (Smart Fit, Rotate, Lock, Reset, Slice, Ortho, Landmarks, Sculpt, Xray, Zones, etc.)

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

window.addEventListener("DOMContentLoaded", () => {
  // =========================
  // Tuning (MEDIUM torso size)
  // =========================
  const TORSO_TARGET_HEIGHT = 1.55;     // ⬅️ medium height (meters-ish)
  const TORSO_FRAME_PADDING = 2.05;     // ⬅️ higher = zoom OUT more (keeps inside block)
  const BOTH_FRAME_PADDING = 2.05;
  const LAYER_TORSO = 0;
  const LAYER_BRACE = 1;
  const MANUAL_HEATMAP_SAMPLE_BUDGET = 500;
  const MAX_PENETRATION_M = 0.1; // 100mm

  // =========================
  // DOM
  // =========================
  const viewport = document.getElementById("viewport");
  const statusEl = document.getElementById("status");
  const fpsEl = document.getElementById("fps");
  const modelsEl = document.getElementById("models");
  const patientEl = document.getElementById("patient");

  const torsoFile = document.getElementById("torsoFile");
  const braceFile = document.getElementById("braceFile");

  const smartFitBtn = document.getElementById("smartFit");
  const autoTightenBtn = document.getElementById("autoTighten");
  const forceFit80Btn = document.getElementById("forceFit80");
  const deepOptimizeBtn = document.getElementById("deepOptimize");
  const demoRecoveryBtn = document.getElementById("demoRecovery");
  const clinicalSnapBtn = document.getElementById("clinicalSnap");
  const demoResetBtn = document.getElementById("demoReset");
  const ceoCinematicBtn = document.getElementById("ceoCinematic");
  const smartStatus = document.getElementById("smartStatus");

  const rotateNextBtn = document.getElementById("rotateNext");
  const rotLabelEl = document.getElementById("rotLabel");

  const lockFitBtn = document.getElementById("lockFit");
  const resetToAIBtn = document.getElementById("resetToAI");

  const screenshotBtn = document.getElementById("screenshot");
  const reportBtn = document.getElementById("report");
  const reportPdfBtn = document.getElementById("reportPdf");
  const dockTorsoBtn = document.getElementById("dockTorso");
  const dockBraceBtn = document.getElementById("dockBrace");
  const dockLandmarksBtn = document.getElementById("dockLandmarks");
  const dockSmartFitBtn = document.getElementById("dockSmartFit");
  const dockReportPdfBtn = document.getElementById("dockReportPdf");
  const navRunDemoBtn = document.getElementById("navRunDemo");
  const navFitTrigger = document.getElementById("navFitTrigger");
  const navAnalysisTrigger = document.getElementById("navAnalysisTrigger");
  const navWorkspaceTrigger = document.getElementById("navWorkspaceTrigger");
  const navAssessmentTrigger = document.getElementById("navAssessmentTrigger");
  const navManualTrigger = document.getElementById("navManualTrigger");
  const fitMenuEl = document.getElementById("fitMenu");
  const analysisMenuEl = document.getElementById("analysisMenu");
  const workspaceMenuEl = document.getElementById("workspaceMenu");
  const assessmentMenuEl = document.getElementById("assessmentMenu");
  const manualMenuEl = document.getElementById("manualMenu");
  const menuSmartFitBtn = document.getElementById("menuSmartFit");
  const menuAutoTightenBtn = document.getElementById("menuAutoTighten");
  const menuClinicalSnapBtn = document.getElementById("menuClinicalSnap");
  const menuForceFitBtn = document.getElementById("menuForceFit");
  const menuLandmarksBtn = document.getElementById("menuLandmarks");
  const menuHighResBtn = document.getElementById("menuHighRes");
  const menuAuditBtn = document.getElementById("menuAudit");
  const menuSnapshotBtn = document.getElementById("menuSnapshot");
  const menuSkinHeatmapBtn = document.getElementById("menuSkinHeatmap");
  const menuXrayBtn = document.getElementById("menuXray");
  const menuSliceBtn = document.getElementById("menuSlice");
  const menuZonesBtn = document.getElementById("menuZones");
  const menuNxmBtn = document.getElementById("menuNxm");
  const menuNxpBtn = document.getElementById("menuNxp");
  const menuNymBtn = document.getElementById("menuNym");
  const menuNypBtn = document.getElementById("menuNyp");
  const menuNzmBtn = document.getElementById("menuNzm");
  const menuNzpBtn = document.getElementById("menuNzp");
  const menuRxmBtn = document.getElementById("menuRxm");
  const menuRxpBtn = document.getElementById("menuRxp");
  const menuRymBtn = document.getElementById("menuRym");
  const menuRypBtn = document.getElementById("menuRyp");
  const menuRzmBtn = document.getElementById("menuRzm");
  const menuRzpBtn = document.getElementById("menuRzp");
  const tightHUDEl = document.getElementById("tightHUD");
  const okHUDEl = document.getElementById("okHUD");
  const looseHUDEl = document.getElementById("looseHUD");
  const assessmentStatusHUDEl = document.getElementById("assessmentStatusHUD");
  const productionSignOffBtn = document.getElementById("productionSignOff");
  const productionSealEl = document.getElementById("productionSeal");
  const minThickHUDEl = document.getElementById("minThickHUD");
  const auditStatusHUDEl = document.getElementById("auditStatusHUD");
  const pulseBarEl = document.getElementById("pulseBar");
  const tensionSlider = document.getElementById("tensionSlider");
  const tensionValEl = document.getElementById("tensionVal");
  const penetrationSlider = document.getElementById("penetrationSlider");
  const penetrationValEl = document.getElementById("penetrationVal");

  const toggleTorsoBtn = document.getElementById("toggleTorso");
  const toggleBraceBtn = document.getElementById("toggleBrace");
  const toggleXrayBtn = document.getElementById("toggleXray");
  const showZonesBtn = document.getElementById("showZones");

  const highResBtn = document.getElementById("highResScan");
  const toggleReliefBtn = document.getElementById("toggleRelief");

  const ceoScoreEl = document.getElementById("ceoScore");
  const ceoMetricsEl = document.getElementById("ceoMetrics");
  const ceoRecEl = document.getElementById("ceoRec");
  const ceoClinicalEl = document.getElementById("ceoClinical");

  const aiExplainEl = document.getElementById("aiExplain");
  const clinicalWarningsEl = document.getElementById("clinicalWarnings");

  const alertBox = document.getElementById("alertBox");
  const alertStatus = document.getElementById("alertStatus");

  const curveTypeEl = document.getElementById("curveType");
  const snapGoalEl = document.getElementById("snapGoal");

  const batchTorsoFilesEl = document.getElementById("batchTorsoFiles");
  const batchRunBtn = document.getElementById("batchRun");

  // Manual controls
  const nxm = document.getElementById("nxm");
  const nxp = document.getElementById("nxp");
  const nym = document.getElementById("nym");
  const nyp = document.getElementById("nyp");
  const nzm = document.getElementById("nzm");
  const nzp = document.getElementById("nzp");

  const rxm = document.getElementById("rxm");
  const rxp = document.getElementById("rxp");
  const rym = document.getElementById("rym");
  const ryp = document.getElementById("ryp");
  const rzm = document.getElementById("rzm");
  const rzp = document.getElementById("rzp");

  const scaleDownBtn = document.getElementById("scaleDown");
  const scaleUpBtn = document.getElementById("scaleUp");

  // Command bar
  const aiChat = document.getElementById("aiChat");
  const aiInput = document.getElementById("aiInput");
  const aiSend = document.getElementById("aiSend");

  // Agentic extras
  const agentLogEl = document.getElementById("agentLog");
  const voiceToggleBtn = document.getElementById("voiceToggle");

  // Section Analysis
  const toggleSliceBtn = document.getElementById("toggleSlice");
  const sliceSlider = document.getElementById("sliceSlider");
  const sliceLabel = document.getElementById("sliceLabel");
  const navProfileSelectEl = document.getElementById("navProfileSelect");
  const fitSensitivityEl = document.getElementById("fitSensitivity");
  const fitSensitivityLabelEl = document.getElementById("fitSensitivityLabel");
  const orthoSyncBtn = document.getElementById("orthoSync");
  const autoLandmarksBtn = document.getElementById("autoLandmarks");
  const landmarkProfileEl = document.getElementById("landmarkProfile");
  const landmarkTableTitleEl = document.getElementById("landmarkTableTitle");
  const landmarkTableBodyEl = document.getElementById("landmarkTableBody");

  // Sculpt UI
  const sculptBtn = document.getElementById("sculptMode");
  const sculptStatus = document.getElementById("sculptStatus");

  // Structural auditor UI (stubs)
  const runNeuralAuditBtn = document.getElementById("runNeuralAudit");
  const safetyBadgeEl = document.getElementById("safetyBadge");
  const minThickEl = document.getElementById("minThick");
  const peakStressEl = document.getElementById("peakStress");
  const runABABtn = document.getElementById("runABA");
  const applyAerationBtn = document.getElementById("applyAeration");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }
  function setSmart(msg) {
    if (smartStatus) smartStatus.textContent = msg;
  }
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function isScaleValid(s) {
    return !!s
      && Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.z)
      && s.x > 0.001 && s.y > 0.001 && s.z > 0.001;
  }
  async function yieldUI() {
    await new Promise((r) => requestAnimationFrame(r));
    if ("requestIdleCallback" in window) {
      await new Promise((r) => requestIdleCallback(r, { timeout: 60 }));
    }
  }
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  function setPulse(active, error = false) {
    if (!pulseBarEl) return;
    pulseBarEl.style.display = active ? "block" : "none";
    pulseBarEl.classList.toggle("pulse-error", !!error);
  }
  function setProductionSeal(visible) {
    if (!productionSealEl) return;
    productionSealEl.style.display = visible ? "flex" : "none";
  }
  function setTensionUIValue(value = 1.0) {
    const clamped = clamp(Number(value) || 1.0, 0.7, 1.12);
    if (tensionSlider) tensionSlider.value = clamped.toFixed(3);
    if (tensionValEl) tensionValEl.textContent = `${Math.round(clamped * 100)}%`;
  }
  function setPenetrationUIValue(value = 0.005) {
    const clamped = clamp(Number(value) || 0, 0, MAX_PENETRATION_M);
    if (penetrationSlider) {
      const sliderMax = Number(penetrationSlider.max);
      const sliderUsesMm = Number.isFinite(sliderMax) && sliderMax > 1;
      penetrationSlider.value = sliderUsesMm ? String(Math.round(clamped * 1000)) : clamped.toFixed(3);
    }
    if (penetrationValEl) penetrationValEl.textContent = `${(clamped * 1000).toFixed(1)}mm`;
  }
  function getPenetrationDepth() {
    if (!penetrationSlider) return 0;
    let raw = Number(penetrationSlider.value);
    if (!Number.isFinite(raw)) raw = 0;

    const sliderMax = Number(penetrationSlider.max);
    const sliderUsesMm = Number.isFinite(sliderMax) && sliderMax > 1;
    if (sliderUsesMm) raw /= 1000;

    return clamp(raw, 0, MAX_PENETRATION_M);
  }
  function ensureTensionBaseScale() {
    if (tensionBaseScale && isScaleValid(tensionBaseScale)) return true;
    if (brace && isScaleValid(brace.scale)) {
      tensionBaseScale = brace.scale.clone();
      return true;
    }
    if (braceOrig?.scale && isScaleValid(braceOrig.scale)) {
      tensionBaseScale = braceOrig.scale.clone();
      return true;
    }
    return false;
  }
  function resetTensionControl() {
    tensionSeq++;
    setTensionUIValue(1.0);
    if (tensionSlider) tensionSlider.style.accentColor = "var(--accent-blue)";
    ensureTensionBaseScale();
  }
  function updateNeuralAuditHUD(minMm, passed = null, label = null) {
    if (minThickHUDEl) {
      minThickHUDEl.textContent = Number.isFinite(minMm) ? `${minMm.toFixed(2)}mm` : "--";
    }
    if (auditStatusHUDEl) {
      auditStatusHUDEl.classList.remove("audit-ok", "audit-bad", "audit-pending");
      if (passed === true) auditStatusHUDEl.classList.add("audit-ok");
      else if (passed === false) auditStatusHUDEl.classList.add("audit-bad");
      else auditStatusHUDEl.classList.add("audit-pending");
      auditStatusHUDEl.textContent =
        label || (passed === true ? "VERIFIED" : passed === false ? "RISK DETECTED" : "Awaiting Scan");
    }
  }
  function toggleMenu(menuEl) {
    if (!menuEl) return;
    const menus = [fitMenuEl, analysisMenuEl, workspaceMenuEl, assessmentMenuEl, manualMenuEl].filter(Boolean);
    for (const m of menus) {
      if (m !== menuEl) m.classList.remove("open");
    }
    menuEl.classList.toggle("open");
  }
  function closeMenus() {
    fitMenuEl?.classList.remove("open");
    analysisMenuEl?.classList.remove("open");
    workspaceMenuEl?.classList.remove("open");
    assessmentMenuEl?.classList.remove("open");
    manualMenuEl?.classList.remove("open");
  }

  // =========================
  // Scene
  // =========================
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f17);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 5000);
  camera.position.set(0, 1.2, 2.8);
  camera.layers.enable(LAYER_TORSO);
  camera.layers.enable(LAYER_BRACE);

  let activeCamera = camera;

  // Orthographic
  let orthoCamera = null;
  let orthoActive = false;
  let orthoViewSize = 1.0;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.autoClear = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;

  if (!viewport) throw new Error("Missing #viewport element in index.html");
  viewport.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = "none";

  const controls = new OrbitControls(activeCamera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.0, 0);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x223355, 1.1);
  hemi.layers.enable(LAYER_TORSO);
  hemi.layers.enable(LAYER_BRACE);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 4, 2);
  key.layers.enable(LAYER_TORSO);
  key.layers.enable(LAYER_BRACE);
  scene.add(key);

  const grid = new THREE.GridHelper(10, 20, 0x1c2a44, 0x132036);
  const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMats.forEach((m) => {
    m.transparent = true;
    m.opacity = 0.35;
  });
  grid.layers.set(LAYER_TORSO);
  scene.add(grid);

  // Raycasters
  const raycaster = new THREE.Raycaster();
  const landmarkRaycaster = new THREE.Raycaster();
  const sculptRaycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  raycaster.layers.enable(LAYER_TORSO);
  landmarkRaycaster.layers.enable(LAYER_TORSO);
  landmarkRaycaster.layers.enable(LAYER_BRACE);
  sculptRaycaster.layers.enable(LAYER_TORSO);
  sculptRaycaster.layers.enable(LAYER_BRACE);

  // =========================
  // Loaders
  // =========================
  const gltfLoader = new GLTFLoader();
  const objLoader = new OBJLoader();
  const stlLoader = new STLLoader();

  // =========================
  // State
  // =========================
  let torso = null;
  let brace = null;
  let torsoLoaded = false;
  let braceLoaded = false;

  let heatmapBusy = false;
  let realtimeRunning = false;
  let lastFit = null;
  let demoRunning = false;

  let orientationLocked = false;

  let torsoVisible = true;
  let braceVisible = true;

  let xrayActive = false;
  let skinHeatmapActive = false;
  let zonesVisible = false;
  let zoneGroup = null;

  let aiFitSnapshot = null;
  let braceOrig = null;

  let reliefActive = true;
  let currentPatientId = "—";
  let currentLandmarks = null;
  let landmarkGroup = null;
  let autoSnapQueued = false;
  let autoSnapCooldownUntil = 0;
  const FIT_SENSITIVITY_PRESETS = [
    { name: "Relaxed", sweetMinMm: 5, sweetMaxMm: 12, tightMm: 3, looseMm: 15, targetMm: 7 },
    { name: "Balanced", sweetMinMm: 4, sweetMaxMm: 10, tightMm: 3, looseMm: 13, targetMm: 6 },
    { name: "Strict", sweetMinMm: 3, sweetMaxMm: 8, tightMm: 2.5, looseMm: 11, targetMm: 5 }
  ];
  const SNAP_GOAL_PRESETS = {
    correction95: {
      key: "correction95",
      label: "Target: 95% (Correction)",
      targetScore: 92,
      targetClearanceMm: 7,
      autoTightenMaxIters: 15,
      aggressive: true
    },
    comfort69: {
      key: "comfort69",
      label: "Target: 69% (Comfort)",
      targetScore: 69,
      targetClearanceMm: 18,
      autoTightenMaxIters: 6,
      aggressive: false
    }
  };
  let fitSensitivityIndex = 0;
  let tensionBaseScale = null;
  let tensionSeq = 0;
  let penetrationSeq = 0;
  let tensionLandmarkTimer = null;
  let torsoHeatmapTimer = null;
  let lastClinicalStatusLogT = 0;
  const interactionLog = [];
  const MAX_INTERACTION_LOG = 300;

  function appendInteraction(event, details = {}) {
    interactionLog.push({
      ts: new Date().toISOString(),
      event,
      details
    });
    if (interactionLog.length > MAX_INTERACTION_LOG) {
      interactionLog.splice(0, interactionLog.length - MAX_INTERACTION_LOG);
    }
  }

  function clearInteractionLog(reason = "session-start") {
    interactionLog.length = 0;
    appendInteraction("session_started", { reason });
  }

  function getFitSensitivityPreset() {
    return FIT_SENSITIVITY_PRESETS[fitSensitivityIndex] || FIT_SENSITIVITY_PRESETS[0];
  }

  function updateFitSensitivityLabel() {
    if (!fitSensitivityLabelEl) return;
    const p = getFitSensitivityPreset();
    fitSensitivityLabelEl.textContent = `Sensitivity: ${p.name} | Sweet Spot ${p.sweetMinMm}-${p.sweetMaxMm}mm`;
  }

  function getSnapGoalPreset() {
    const key = snapGoalEl?.value || "correction95";
    return SNAP_GOAL_PRESETS[key] || SNAP_GOAL_PRESETS.correction95;
  }

  // preserve pose so Smart Fit does NOT move brace after rotation
  let preservePose = false;
  let preservePoseReason = "";
  let poseLocked = false;
  const LOCK_POSE_AFTER_MANUAL = false;
  function markPoseEdited(reason = "manual") {
    preservePose = true;
    preservePoseReason = reason;
    if (LOCK_POSE_AFTER_MANUAL) poseLocked = true;
  }
  function clearPoseEdited(reason = "") {
    preservePose = false;
    preservePoseReason = reason;
    if (reason === "reset" || reason === "refit" || reason === "force-refit") {
      poseLocked = false;
    }
  }
  function unlockPose(reason = "refit") {
    poseLocked = false;
    preservePose = false;
    preservePoseReason = reason;
  }

  // =========================
  // Resize (CRITICAL for “within block”)
  // =========================
  function resize() {
    const w = viewport.clientWidth || 1;
    const h = viewport.clientHeight || 1;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    if (renderer.getPixelRatio() !== pr) renderer.setPixelRatio(pr);
    renderer.setSize(w, h, true);

    if (!orthoActive) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    } else if (orthoCamera) {
      const aspect = w / h;
      orthoCamera.left = (orthoViewSize * aspect) / -2;
      orthoCamera.right = (orthoViewSize * aspect) / 2;
      orthoCamera.top = orthoViewSize / 2;
      orthoCamera.bottom = orthoViewSize / -2;
      orthoCamera.updateProjectionMatrix();
    }
  }
  window.addEventListener("resize", () => {
    resize();
    // Keep framing stable after resizing
    if (torso && !orthoActive) frameToObjects([torso, brace].filter(Boolean), BOTH_FRAME_PADDING);
  });

  // =========================
  // Slice View
  // =========================
  let slicingActive = false;
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.0);

  function setMatClipping(mat) {
    if (!mat) return;
    mat.clippingPlanes = slicingActive ? [clipPlane] : null;
    mat.clipShadows = !!slicingActive;
    mat.needsUpdate = true;
  }
  function applySlicingToObject(obj) {
    if (!obj) return;
    obj.traverse((c) => {
      if (!c.isMesh || !c.material) return;
      if (Array.isArray(c.material)) c.material.forEach(setMatClipping);
      else setMatClipping(c.material);
    });
  }

  function getTorsoBox() {
    if (!torso) return null;
    torso.updateWorldMatrix(true, true);
    return new THREE.Box3().setFromObject(torso);
  }

  function getCutYFromSlider(tBox) {
    const size = tBox.getSize(new THREE.Vector3());
    const v = (sliceSlider?.valueAsNumber ?? Number(sliceSlider?.value ?? 50)) / 100;
    return { sliderVal: v, cutY: tBox.min.y + size.y * v, size };
  }

  function syncOrthoToSlice() {
    if (!torso || !orthoActive) return;

    const tBox = getTorsoBox();
    if (!tBox) return;

    const { cutY, size } = getCutYFromSlider(tBox);
    const center = tBox.getCenter(new THREE.Vector3());
    const aspect = viewport.clientWidth / Math.max(1, viewport.clientHeight);

    const unionBox = new THREE.Box3().copy(tBox);
    if (brace) unionBox.expandByObject(brace);
    const uSize = unionBox.getSize(new THREE.Vector3());
    orthoViewSize = Math.max(uSize.x, uSize.z) * 1.2;

    if (!orthoCamera) {
      orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 5000);
      orthoCamera.layers.enable(LAYER_TORSO);
      orthoCamera.layers.enable(LAYER_BRACE);
    }

    orthoCamera.left = (orthoViewSize * aspect) / -2;
    orthoCamera.right = (orthoViewSize * aspect) / 2;
    orthoCamera.top = orthoViewSize / 2;
    orthoCamera.bottom = orthoViewSize / -2;

    const camHeight = Math.max(2.5, size.y * 2.5);
    orthoCamera.position.set(center.x, cutY + camHeight, center.z);
    orthoCamera.up.set(0, 0, -1);
    orthoCamera.lookAt(center.x, cutY, center.z);

    orthoCamera.near = 0.01;
    orthoCamera.far = camHeight * 10;
    orthoCamera.updateProjectionMatrix();
  }

  function enableOrthographicSync() {
    if (!torso) return setStatus("Load Torso first.");
    orthoActive = true;
    syncOrthoToSlice();

    activeCamera = orthoCamera;
    controls.object = activeCamera;
    controls.enableRotate = false;
    controls.update();

    orthoSyncBtn?.classList.add("active");
    if (orthoSyncBtn) orthoSyncBtn.textContent = "📐 Ortho Sync: ON";
    setStatus("📐 Orthographic Sync ON (top-down clinical view).");
    resize();
  }

  function disableOrthographicSync() {
    orthoActive = false;
    activeCamera = camera;

    controls.object = activeCamera;
    controls.enableRotate = true;
    controls.update();

    orthoSyncBtn?.classList.remove("active");
    if (orthoSyncBtn) orthoSyncBtn.textContent = "📐 Ortho Sync";
    setStatus("📐 Orthographic Sync OFF (back to perspective).");
    resize();
  }

  function toggleOrthographicSync() {
    if (!orthoActive) enableOrthographicSync();
    else disableOrthographicSync();
  }

  orthoSyncBtn?.addEventListener("click", toggleOrthographicSync);

  function updateSlicing() {
    if (!torso) return;

    torso.updateWorldMatrix(true, true);
    const tBox = new THREE.Box3().setFromObject(torso);
    const tSize = tBox.getSize(new THREE.Vector3());

    const sliderVal = (sliceSlider?.valueAsNumber ?? Number(sliceSlider?.value ?? 50)) / 100;
    const cutY = tBox.min.y + tSize.y * sliderVal;

    clipPlane.constant = -cutY;

    applySlicingToObject(torso);
    if (brace) applySlicingToObject(brace);

    if (sliceLabel) sliceLabel.textContent = `Slice Height: ${Math.round(sliderVal * 100)}%`;
    if (orthoActive) syncOrthoToSlice();
  }

  if (sliceSlider) sliceSlider.disabled = true;

  if (toggleSliceBtn && sliceSlider) {
    toggleSliceBtn.addEventListener("click", () => {
      slicingActive = !slicingActive;
      sliceSlider.disabled = !slicingActive;
      toggleSliceBtn.classList.toggle("active", slicingActive);
      toggleSliceBtn.textContent = slicingActive ? "🔪 Slicing: ON" : "🔪 Enable Slicing";
      updateSlicing();
      setStatus(
        slicingActive
          ? "Section Analysis active. Use slider to view internal gaps."
          : "Section Analysis off."
      );
    });

    sliceSlider.addEventListener("input", () => updateSlicing());
  }

  if (fitSensitivityEl) {
    fitSensitivityEl.addEventListener("input", () => {
      const next = clamp(Number(fitSensitivityEl.value) || 0, 0, FIT_SENSITIVITY_PRESETS.length - 1);
      fitSensitivityIndex = Math.round(next);
      fitSensitivityEl.value = String(fitSensitivityIndex);
      updateFitSensitivityLabel();
      appendInteraction("fit_sensitivity_changed", { preset: getFitSensitivityPreset().name });

      // Repaint status colors/table using current thresholds.
      if (currentLandmarks) {
        drawLandmarkMarkers(currentLandmarks);
        renderLandmarkTable(currentLandmarks);
      }
      setStatus(`Sensitivity set: ${getFitSensitivityPreset().name}.`);
    });
  }

  snapGoalEl?.addEventListener("change", () => {
    const goal = getSnapGoalPreset();
    appendInteraction("snap_goal_changed", {
      goal: goal.key,
      targetScore: goal.targetScore,
      targetClearanceMm: goal.targetClearanceMm
    });
    setStatus(`Snap goal set: ${goal.label}.`);
  });

  // =========================
  // Landmark AI
  // =========================
  const LANDMARK_PROFILES = {
    clinical44: {
      id: "clinical44",
      label: "Clinical 44",
      count: 44,
      defaultRibRel: 0.62,
      defaultPelRel: 0.34,
      rings: [
        { yRel: 0.9, count: 4, label: "T2" },
        { yRel: 0.82, count: 6, label: "T4" },
        { yRel: 0.74, count: 6, label: "T6" },
        { yRel: 0.66, count: 6, label: "T8" },
        { yRel: 0.58, count: 6, label: "T10" },
        { yRel: 0.5, count: 6, label: "T12" },
        { yRel: 0.42, count: 4, label: "L2" },
        { yRel: 0.34, count: 4, label: "L4" },
        { yRel: 0.26, count: 2, label: "Pelvis" }
      ]
    },
    smpl72: {
      id: "smpl72",
      label: "SMPL 72",
      count: 72,
      defaultRibRel: 0.62,
      defaultPelRel: 0.34,
      rings: [
        { yRel: 0.92, count: 8, label: "T1" },
        { yRel: 0.86, count: 8, label: "T3" },
        { yRel: 0.8, count: 8, label: "T5" },
        { yRel: 0.74, count: 8, label: "T7" },
        { yRel: 0.68, count: 8, label: "T9" },
        { yRel: 0.62, count: 8, label: "T11" },
        { yRel: 0.56, count: 8, label: "T12" },
        { yRel: 0.5, count: 8, label: "L1" },
        { yRel: 0.42, count: 4, label: "L3" },
        { yRel: 0.34, count: 4, label: "Pelvis" }
      ]
    }
  };

  const LANDMARK_CONFIDENCE_MIN = 0.42;
  const LANDMARK_CONFIDENCE_MED = 0.62;
  const LANDMARK_CONFIDENCE_HIGH = 0.8;

  function getSelectedLandmarkProfile() {
    const id = landmarkProfileEl?.value || "clinical44";
    return LANDMARK_PROFILES[id] || LANDMARK_PROFILES.clinical44;
  }

  function inferLandmarkRegion(label = "") {
    const key = String(label || "").toLowerCase();
    if (key.startsWith("t")) return "thoracic";
    if (key.startsWith("l")) return "lumbar";
    if (key.includes("pelvis")) return "pelvis";
    return "trunk";
  }

  function getMeshList(root) {
    const meshes = [];
    root?.traverse((c) => { if (c.isMesh) meshes.push(c); });
    return meshes;
  }

  function clearLandmarkMarkers() {
    if (!landmarkGroup) return;
    landmarkGroup.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m?.dispose?.());
        else obj.material?.dispose?.();
      } else if (obj.isSprite) {
        obj.material?.map?.dispose?.();
        obj.material?.dispose?.();
      }
    });
    scene.remove(landmarkGroup);
    landmarkGroup = null;
  }

  function clearanceBand(clearance) {
    if (!Number.isFinite(clearance)) return "na";
    const p = getFitSensitivityPreset();
    const tightM = p.tightMm / 1000;
    const looseM = p.looseMm / 1000;
    const sweetMinM = p.sweetMinMm / 1000;
    const sweetMaxM = p.sweetMaxMm / 1000;

    if (clearance < tightM) return "tight";
    if (clearance > looseM) return "loose";
    if (clearance >= sweetMinM && clearance <= sweetMaxM) return "ok";
    return "warn";
  }

  function landmarkColorForClearance(clearance) {
    const band = clearanceBand(clearance);
    if (band === "tight") return 0xef4444;
    if (band === "ok") return 0x22c55e;
    if (band === "loose") return 0x60a5fa;
    if (band === "warn") return 0xf59e0b;
    return 0x64748b;
  }

  function makeLandmarkLabelSprite(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(8,12,20,0.78)";
    ctx.fillRect(0, 6, canvas.width, canvas.height - 12);
    ctx.strokeStyle = "rgba(120,160,255,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 7, canvas.width - 2, canvas.height - 14);
    ctx.font = "700 26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#dbe7ff";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      depthTest: false
    });

    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 1250;
    return sprite;
  }

  function drawLandmarkMarkers(landmarkSet) {
    clearLandmarkMarkers();
    const pts = landmarkSet?.points || [];
    if (!pts.length) return;

    const tBox = getTorsoBox();
    if (!tBox) return;
    const tSize = tBox.getSize(new THREE.Vector3());
    const radius = Math.max(0.003, tSize.y * 0.004);

    const group = new THREE.Group();
    group.name = "landmark-markers";

    for (const p of pts) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) continue;
      const mat = new THREE.MeshBasicMaterial({
        color: landmarkColorForClearance(p.clearance),
        transparent: true,
        opacity: 0.95,
        depthTest: false
      });
      const marker = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), mat);
      marker.position.set(p.x, p.y, p.z);
      marker.renderOrder = 1200;
      group.add(marker);

      if (p.showLabel && p.label) {
        const label = makeLandmarkLabelSprite(p.label);
        if (label) {
          label.position.set(p.x, p.y + radius * 5.5, p.z);
          label.scale.set(radius * 14, radius * 3.8, 1);
          group.add(label);
        }
      }
    }

    if (!group.children.length) return;
    group.visible = torsoVisible;
    setLayerRecursive(group, LAYER_TORSO);
    scene.add(group);
    landmarkGroup = group;
  }

  function estimateLandmarks() {
    if (!torso) return null;

    const tBox = getTorsoBox();
    if (!tBox) return null;

    const minY = tBox.min.y;
    const maxY = tBox.max.y;
    const H = Math.max(1e-6, maxY - minY);

    const BINS = 80;
    const bins = Array.from({ length: BINS }, () => ({
      n: 0, minX: +Infinity, maxX: -Infinity, minZ: +Infinity, maxZ: -Infinity
    }));

    torso.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry || !obj.geometry.attributes?.position) return;

      obj.updateWorldMatrix(true, false);
      const pos = obj.geometry.attributes.position;
      const step = Math.max(1, Math.floor(pos.count / 6000));

      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(obj.matrixWorld);
        const rel = (v.y - minY) / H;
        const bi = Math.max(0, Math.min(BINS - 1, Math.floor(rel * (BINS - 1))));
        const b = bins[bi];
        b.n++;
        b.minX = Math.min(b.minX, v.x);
        b.maxX = Math.max(b.maxX, v.x);
        b.minZ = Math.min(b.minZ, v.z);
        b.maxZ = Math.max(b.maxZ, v.z);
      }
    });

    const area = bins.map((b) => (b.n < 5 ? 0 : Math.max(0, (b.maxX - b.minX) * (b.maxZ - b.minZ))));
    const smooth = area.map((_, i) => {
      let s = 0;
      let c = 0;
      for (let k = -2; k <= 2; k++) {
        const j = i + k;
        if (j >= 0 && j < BINS) { s += area[j]; c++; }
      }
      return c ? s / c : area[i];
    });

    const argMax = (arr, a, b) => {
      let bi = a;
      let bv = -Infinity;
      for (let i = a; i <= b; i++) if (arr[i] > bv) { bv = arr[i]; bi = i; }
      return bi;
    };

    const ribIdx = argMax(smooth, Math.floor(BINS * 0.45), Math.floor(BINS * 0.85));
    const pelIdx = argMax(smooth, Math.floor(BINS * 0.1), Math.floor(BINS * 0.45));

    return { ribRel: ribIdx / (BINS - 1), pelRel: pelIdx / (BINS - 1) };
  }

  function buildNormalizedLandmarkSeeds(profile, tBox) {
    const seeds = [];
    const center = tBox.getCenter(new THREE.Vector3());
    const size = tBox.getSize(new THREE.Vector3());
    const minY = tBox.min.y;

    profile.rings.forEach((ring, ringIdx) => {
      const yRel = clamp(ring.yRel, 0.05, 0.95);
      const y = minY + size.y * yRel;
      const taper = clamp(1 - Math.abs(yRel - 0.56) * 1.15, 0.5, 1.0);
      const rx = Math.max(1e-4, size.x * 0.5 * taper * 0.95);
      const rz = Math.max(1e-4, size.z * 0.5 * taper * 0.95);
      const offset = ringIdx % 2 ? Math.PI / Math.max(1, ring.count) : 0;

      for (let i = 0; i < ring.count; i++) {
        const theta = offset + (i / ring.count) * Math.PI * 2;
        const approx = new THREE.Vector3(
          center.x + Math.cos(theta) * rx,
          y,
          center.z + Math.sin(theta) * rz
        );

        seeds.push({
          id: `${profile.id}-L${ringIdx}-P${i}`,
          yRel,
          approx,
          ringLabel: ring.label || `R${ringIdx}`,
          region: ring.category || inferLandmarkRegion(ring.label || ""),
          pointIndex: i,
          ringCount: ring.count
        });
      }
    });

    return seeds;
  }

  function snapLandmarkToSurface(torsoMeshes, tBox, approxPos) {
    if (!torsoMeshes.length) return null;
    const span = tBox.getSize(new THREE.Vector3()).length();
    const dirs = [
      { v: new THREE.Vector3(0, 0, 1), label: "ray:+z" },
      { v: new THREE.Vector3(0, 0, -1), label: "ray:-z" },
      { v: new THREE.Vector3(1, 0, 0), label: "ray:+x" },
      { v: new THREE.Vector3(-1, 0, 0), label: "ray:-x" },
      { v: new THREE.Vector3(0, 1, 0), label: "ray:+y" },
      { v: new THREE.Vector3(0, -1, 0), label: "ray:-y" }
    ];

    let best = null;
    for (const d of dirs) {
      const dir = d.v;
      const origin = approxPos.clone().addScaledVector(dir, span * 0.8 + 0.05);
      const toward = approxPos.clone().sub(origin);
      const baseLen = toward.length();
      if (baseLen < 1e-6) continue;

      landmarkRaycaster.set(origin, toward.normalize());
      landmarkRaycaster.near = 0;
      landmarkRaycaster.far = baseLen * 2.0;

      const hits = landmarkRaycaster.intersectObjects(torsoMeshes, true);
      if (!hits.length) continue;

      const hit = hits[0];
      const err = hit.point.distanceTo(approxPos);
      let worldNormal = null;
      if (hit.face?.normal) {
        worldNormal = hit.face.normal.clone();
        worldNormal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
      }

      if (!best || err < best.snapError) {
        best = {
          point: hit.point.clone(),
          normal: worldNormal,
          snapError: err,
          rayDistance: hit.distance,
          source: d.label
        };
      }
    }

    return best;
  }

  function computeLandmarkConfidence(snapped, tBox, bodyCenter) {
    const diag = tBox.getSize(new THREE.Vector3()).length();
    const snapNorm = clamp(snapped.snapError / Math.max(diag * 0.15, 1e-6), 0, 1);
    const snapScore = 1 - snapNorm;

    let normalScore = 0.45;
    let normalAlignment = null;
    if (snapped.normal) {
      const radial = snapped.point.clone().sub(bodyCenter);
      if (radial.lengthSq() > 1e-8) {
        radial.normalize();
        normalAlignment = Math.abs(snapped.normal.dot(radial));
        normalScore = clamp(normalAlignment, 0, 1);
      }
    }

    const rayNorm = clamp((snapped.rayDistance || 0) / Math.max(diag * 0.9, 1e-6), 0, 1);
    const rayScore = 1 - rayNorm;

    let confidence = (snapScore * 0.55) + (normalScore * 0.3) + (rayScore * 0.15);
    if (!snapped.normal) confidence *= 0.82;

    return {
      confidence: clamp(confidence, 0, 1),
      normalAlignment
    };
  }

  function getLandmarkRetryOffsets(tBox) {
    const size = tBox.getSize(new THREE.Vector3());
    const step = Math.max(0.004, Math.min(size.x, size.z) * 0.04);
    const yStep = Math.max(0.0025, size.y * 0.015);
    return [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(step, 0, 0),
      new THREE.Vector3(-step, 0, 0),
      new THREE.Vector3(0, 0, step),
      new THREE.Vector3(0, 0, -step),
      new THREE.Vector3(step * 0.6, yStep, 0),
      new THREE.Vector3(-step * 0.6, -yStep, 0),
      new THREE.Vector3(0, yStep, step * 0.6),
      new THREE.Vector3(0, -yStep, -step * 0.6)
    ];
  }

  function findAuthenticatedLandmark(seed, torsoMeshes, braceMeshes, tBox, bodyCenter) {
    const offsets = getLandmarkRetryOffsets(tBox);
    let best = null;

    for (let i = 0; i < offsets.length; i++) {
      const approx = seed.approx.clone().add(offsets[i]);
      const snapped = snapLandmarkToSurface(torsoMeshes, tBox, approx);
      if (!snapped) continue;

      const c = computeLandmarkConfidence(snapped, tBox, bodyCenter);
      const clearance = estimateClearanceToBrace(snapped.point, snapped.normal, bodyCenter, braceMeshes);
      let confidence = c.confidence;
      if (!Number.isFinite(clearance)) confidence *= 0.92;

      const candidate = {
        point: snapped.point,
        normal: snapped.normal,
        snapError: snapped.snapError,
        source: i === 0 ? snapped.source : `${snapped.source}+retry`,
        rayDistance: snapped.rayDistance,
        clearance,
        confidence,
        normalAlignment: c.normalAlignment
      };

      if (!best || candidate.confidence > best.confidence) best = candidate;
    }

    return best;
  }

  function estimateClearanceToBrace(surfacePoint, surfaceNormal, bodyCenter, braceMeshes) {
    if (!braceMeshes.length) return null;

    const outward = (surfaceNormal ? surfaceNormal.clone() : surfacePoint.clone().sub(bodyCenter));
    if (outward.lengthSq() < 1e-8) outward.set(0, 0, 1);
    outward.normalize();

    const maxClear = Math.max(MAX_RAY * 8, 0.35);
    const eps = 0.0015;
    let best = Infinity;
    const dirs = [outward, outward.clone().multiplyScalar(-1)];

    for (const dir of dirs) {
      const origin = surfacePoint.clone().addScaledVector(dir, eps);
      landmarkRaycaster.set(origin, dir);
      landmarkRaycaster.near = 0;
      landmarkRaycaster.far = maxClear;
      const hits = landmarkRaycaster.intersectObjects(braceMeshes, true);
      if (hits.length) best = Math.min(best, hits[0].distance);
    }

    return Number.isFinite(best) ? best : null;
  }

  function identifyLandmarks(profileId = getSelectedLandmarkProfile().id) {
    if (!torso) return null;
    const profile = LANDMARK_PROFILES[profileId] || LANDMARK_PROFILES.clinical44;
    const tBox = getTorsoBox();
    if (!tBox) return null;

    const seeds = buildNormalizedLandmarkSeeds(profile, tBox);
    const torsoMeshes = getMeshList(torso);
    const braceMeshes = brace ? getMeshList(brace) : [];
    const bodyCenter = tBox.getCenter(new THREE.Vector3());

    let rawSnappedCount = 0;
    let snappedCount = 0;
    let rejectedLowConfidence = 0;
    let unsnappedCount = 0;
    let clearanceCount = 0;
    let clearanceSum = 0;
    let clearanceMin = Infinity;
    let clearanceMax = -Infinity;

    const points = [];
    for (const seed of seeds) {
      const snapped = findAuthenticatedLandmark(seed, torsoMeshes, braceMeshes, tBox, bodyCenter);
      if (!snapped) {
        unsnappedCount++;
        continue;
      }
      rawSnappedCount++;

      if (!Number.isFinite(snapped.confidence) || snapped.confidence < LANDMARK_CONFIDENCE_MIN) {
        rejectedLowConfidence++;
        continue;
      }

      snappedCount++;

      const clearance = snapped.clearance;
      if (Number.isFinite(clearance)) {
        clearanceCount++;
        clearanceSum += clearance;
        clearanceMin = Math.min(clearanceMin, clearance);
        clearanceMax = Math.max(clearanceMax, clearance);
      }

      const clearanceOk = Number.isFinite(clearance)
        ? clearance >= TIGHT && clearance <= OK * 1.5
        : false;

      points.push({
        id: seed.id,
        label: `${seed.ringLabel}-${String(seed.pointIndex + 1).padStart(2, "0")}`,
        region: seed.region || inferLandmarkRegion(seed.ringLabel),
        source: snapped.source || "raycast",
        showLabel: profile.id === "clinical44" ? true : (seed.pointIndex % 2 === 0),
        yRel: Number(seed.yRel.toFixed(4)),
        point: {
          x: Number(snapped.point.x.toFixed(5)),
          y: Number(snapped.point.y.toFixed(5)),
          z: Number(snapped.point.z.toFixed(5))
        },
        normal: snapped.normal ? {
          x: Number(snapped.normal.x.toFixed(5)),
          y: Number(snapped.normal.y.toFixed(5)),
          z: Number(snapped.normal.z.toFixed(5))
        } : null,
        confidence: Number(snapped.confidence.toFixed(4)),
        x: Number(snapped.point.x.toFixed(5)),
        y: Number(snapped.point.y.toFixed(5)),
        z: Number(snapped.point.z.toFixed(5)),
        clearance: Number.isFinite(clearance) ? Number(clearance.toFixed(5)) : null,
        clearanceOk,
        snapError: Number(snapped.snapError.toFixed(5)),
        normalAlignment: Number.isFinite(snapped.normalAlignment) ? Number(snapped.normalAlignment.toFixed(4)) : null,
        authenticated: true
      });
    }

    const coarse = estimateLandmarks();
    const ribRel = clamp(coarse?.ribRel ?? profile.defaultRibRel, 0.05, 0.95);
    const pelRel = clamp(coarse?.pelRel ?? profile.defaultPelRel, 0.05, 0.95);

    const clearance = clearanceCount ? {
      avg: Number((clearanceSum / clearanceCount).toFixed(5)),
      min: Number(clearanceMin.toFixed(5)),
      max: Number(clearanceMax.toFixed(5)),
      validCount: clearanceCount
    } : null;

    let confidenceAvg = null;
    let confidenceMin = Infinity;
    let confidenceMax = -Infinity;
    let confidenceHigh = 0;
    let confidenceMedium = 0;
    let confidenceLow = 0;
    let confidenceCount = 0;
    let confidenceSum = 0;
    for (const p of points) {
      if (!Number.isFinite(p.confidence)) continue;
      confidenceCount++;
      confidenceSum += p.confidence;
      confidenceMin = Math.min(confidenceMin, p.confidence);
      confidenceMax = Math.max(confidenceMax, p.confidence);
      if (p.confidence >= LANDMARK_CONFIDENCE_HIGH) confidenceHigh++;
      else if (p.confidence >= LANDMARK_CONFIDENCE_MED) confidenceMedium++;
      else confidenceLow++;
    }
    if (confidenceCount) confidenceAvg = Number((confidenceSum / confidenceCount).toFixed(4));

    const confidence = {
      threshold: LANDMARK_CONFIDENCE_MIN,
      avg: confidenceAvg,
      min: confidenceCount ? Number(confidenceMin.toFixed(4)) : null,
      max: confidenceCount ? Number(confidenceMax.toFixed(4)) : null,
      histogram: {
        high: confidenceHigh,
        medium: confidenceMedium,
        low: confidenceLow
      },
      rejectedLowConfidence,
      unsnapped: unsnappedCount
    };

    return {
      profileId: profile.id,
      profileLabel: profile.label,
      requestedCount: seeds.length,
      rawSnappedCount,
      snappedCount,
      ribRel,
      pelRel,
      ribPct: Math.round(ribRel * 100),
      pelvisPct: Math.round(pelRel * 100),
      clearance,
      confidence,
      points
    };
  }

  function formatMm(value) {
    return Number.isFinite(value) ? `${(value * 1000).toFixed(1)}mm` : "—";
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  function clearanceStatusForTable(clearance) {
    const band = clearanceBand(clearance);
    if (band === "tight") return { text: "High pressure", cls: "status-tight" };
    if (band === "ok") return { text: "Sweet spot", cls: "status-ok" };
    if (band === "loose") return { text: "Too loose", cls: "status-loose" };
    if (band === "warn") return { text: "Borderline", cls: "status-warn" };
    return { text: "N/A", cls: "status-na" };
  }

  function renderLandmarkTable(landmarkSet) {
    if (!landmarkTableTitleEl || !landmarkTableBodyEl) return;

    if (!landmarkSet || !Array.isArray(landmarkSet.points) || !landmarkSet.points.length) {
      landmarkTableTitleEl.textContent = "Landmarks: —";
      landmarkTableBodyEl.innerHTML = `<tr><td colspan="4">Run Auto Landmarks to populate table.</td></tr>`;
      return;
    }

    const p = getFitSensitivityPreset();
    const conf = landmarkSet.confidence;
    const confText = conf
      ? ` | Conf avg ${Number.isFinite(conf.avg) ? conf.avg.toFixed(2) : "—"} ` +
        `(H/M/L ${conf.histogram?.high ?? 0}/${conf.histogram?.medium ?? 0}/${conf.histogram?.low ?? 0})`
      : "";
    landmarkTableTitleEl.textContent =
      `${landmarkSet.profileLabel || "Landmarks"}: ${landmarkSet.snappedCount}/${landmarkSet.requestedCount} snapped ` +
      `| Sweet Spot ${p.sweetMinMm}-${p.sweetMaxMm}mm${confText}`;

    const rows = landmarkSet.points
      .slice()
      .sort((a, b) => (b.yRel ?? 0) - (a.yRel ?? 0))
      .slice(0, 120)
      .map((p) => {
        const yPct = Math.round((p.yRel ?? 0) * 100);
        const clearanceMm = Number.isFinite(p.clearance) ? `${(p.clearance * 1000).toFixed(1)}mm` : "—";
        const status = clearanceStatusForTable(p.clearance);
        return `<tr>
          <td>${escapeHtml(p.label || p.id || "—")}</td>
          <td>${yPct}%</td>
          <td>${clearanceMm}</td>
          <td class="${status.cls}">${status.text}</td>
        </tr>`;
      });

    landmarkTableBodyEl.innerHTML = rows.join("") || `<tr><td colspan="4">No snapped points.</td></tr>`;
  }

  function computeClinicalSnapFactor(clearanceM, targetClearanceM = 0.007) {
    if (!Number.isFinite(clearanceM) || clearanceM <= targetClearanceM) return 1.0;

    if (clearanceM > 0.09) return 0.56;
    if (clearanceM > 0.07) return 0.62;
    if (clearanceM > 0.05) return 0.70;
    if (clearanceM > 0.03) return 0.78;
    if (clearanceM > 0.02) return 0.84;
    if (clearanceM > 0.012) return 0.90;

    const gap = clearanceM - targetClearanceM;
    const fine = 1 - gap * 9.0;
    return clamp(fine, 0.92, 0.98);
  }

  landmarkProfileEl?.addEventListener("change", () => {
    const profile = getSelectedLandmarkProfile();
    if (navProfileSelectEl) navProfileSelectEl.value = profile.id;
    appendInteraction("landmark_profile_changed", { profile: profile.id });
    setStatus(`Landmark profile selected: ${profile.label}. Click Auto Landmarks to run.`);
  });

  navProfileSelectEl?.addEventListener("change", (e) => {
    const value = e?.target?.value;
    if (!value || !landmarkProfileEl) return;
    landmarkProfileEl.value = value;
    landmarkProfileEl.dispatchEvent(new Event("change"));

    if (!torso) return;
    const lm = identifyLandmarks(value);
    if (!lm) return;
    currentLandmarks = lm;
    drawLandmarkMarkers(lm);
    renderLandmarkTable(lm);
    const clearanceText = lm.clearance ? ` | avg ${formatMm(lm.clearance.avg)}` : "";
    const confText = lm.confidence
      ? ` | conf ${Number.isFinite(lm.confidence.avg) ? lm.confidence.avg.toFixed(2) : "—"}`
      : "";
    setStatus(`Dataset verified: ${lm.profileLabel} (${lm.snappedCount} anchors)${clearanceText}${confText}.`);
  });

  autoLandmarksBtn?.addEventListener("click", async () => {
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");
    if (heatmapBusy) return setStatus("Wait for current scan to finish.");

    setStatus("Analyzing anatomical clearance...");
    try {
      const res = await heatmapFast({
        highRes: false,
        analysisOnly: true,
        fast: true,
        sampleBudget: 500
      });
      const score = computeFitScore(res.tightPct, res.loosePct, res.okPct);
      const recommendation = computeRecommendation(res.tightPct, res.loosePct, score, res.okPct);
      lastFit = { ...res, score, recommendation, highRes: false };
      lastFit.clinical = interpretClinical(lastFit);
      updateCEO(lastFit);
    } catch (e) {
      console.warn("Landmark pre-analysis skipped:", e);
    }

    // Keep slicing opt-in; auto-enabling it can make the brace appear "missing" to users.

    const profile = getSelectedLandmarkProfile();
    const lm = identifyLandmarks(profile.id);
    if (!lm) return setStatus("Landmarks failed (torso not ready).");

    currentLandmarks = lm;
    drawLandmarkMarkers(lm);
    renderLandmarkTable(lm);
    appendInteraction("auto_landmarks", {
      profile: lm.profileId,
      requestedCount: lm.requestedCount,
      rawSnappedCount: lm.rawSnappedCount,
      snappedCount: lm.snappedCount,
      ribPct: lm.ribPct,
      pelvisPct: lm.pelvisPct,
      clearanceAvgMm: Number.isFinite(lm.clearance?.avg) ? Number((lm.clearance.avg * 1000).toFixed(2)) : null,
      confidenceAvg: Number.isFinite(lm.confidence?.avg) ? lm.confidence.avg : null,
      confidenceHigh: lm.confidence?.histogram?.high ?? null,
      confidenceMedium: lm.confidence?.histogram?.medium ?? null,
      confidenceLow: lm.confidence?.histogram?.low ?? null,
      rejectedLowConfidence: lm.confidence?.rejectedLowConfidence ?? null
    });

    if (sliceSlider) sliceSlider.value = String(lm.ribPct);
    updateSlicing();

    const clearanceText = lm.clearance
      ? ` | Clearance avg ${formatMm(lm.clearance.avg)}`
      : " | Clearance n/a";
    const confText = lm.confidence
      ? ` | Conf ${Number.isFinite(lm.confidence.avg) ? lm.confidence.avg.toFixed(2) : "—"} ` +
        `(H/M/L ${lm.confidence.histogram?.high ?? 0}/${lm.confidence.histogram?.medium ?? 0}/${lm.confidence.histogram?.low ?? 0})`
      : "";
    setStatus(
      `🧷 ${lm.profileLabel}: Rib≈${lm.ribPct}% | Pelvis≈${lm.pelvisPct}% | Snapped ${lm.snappedCount}/${lm.requestedCount}${clearanceText}${confText}.`
    );
    pushBot(
      `Landmarks ✅ ${lm.profileLabel}: Rib≈${lm.ribPct}% | Pelvis≈${lm.pelvisPct}% | Snapped ${lm.snappedCount}/${lm.requestedCount}${clearanceText}${confText}.`
    );
  });

  // =========================
  // Fit Params
  // =========================
  const FIT = 0.88;
  const TIGHT = 0.005; // 5mm
  const OK = 0.015;    // 15mm
  const MAX_RAY = 0.08;
  const RELIEF_SUGGEST_PCT = 8;
  const PRESERVE_POSITION_ON_ROTATION = true;
  const PRESERVE_POSITION_ON_AUTOFIT = true;
  const AUTO_TIGHTEN_ON_SMART_FIT = false;
  const AUTO_TIGHTEN_CAN_SCALE = true; // allow scaling to improve fit (position preserved)
  const TARGET_SCORE = 90;
  const TARGET_LOOSE_PCT = 25; // clearance target for clinically effective force transfer
  const MAX_TIGHT_PCT = 15;    // cap tight zones for comfort
  const AUTO_SNAP_ON_SEVERE_LOOSE = true;
  const AUTO_SNAP_THRESHOLD_PCT = 80;
  const AUTO_SNAP_DELAY_MS = 500;
  const AUTO_SNAP_COOLDOWN_MS = 12000;

  // =========================
  // Zones
  // =========================
  const ZONES = {
    upperCut: 0.85,
    lowerCut: 0.15,
    thoracicMin: 0.55,
    thoracicMax: 0.8,
    lumbarMin: 0.25,
    lumbarMax: 0.55
  };
  function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }
  function bandOf(relH) {
    if (relH > ZONES.upperCut) return "upperTrim";
    if (relH < ZONES.lowerCut) return "lowerTrim";
    if (relH >= ZONES.thoracicMin && relH < ZONES.thoracicMax) return "thoracic";
    if (relH >= ZONES.lumbarMin && relH < ZONES.lumbarMax) return "lumbar";
    return "mid";
  }

  curveTypeEl?.addEventListener("change", () => {
    const v = curveTypeEl.value || "Neutral";
    appendInteraction("curve_type_changed", { curveType: v });
    setStatus(`Curve Type set: ${v}`);
    pushBot(`Curve Type set to ${v}.`);
  });

  // =========================
  // Rotation Cycle
  // =========================
  const YAWS = Array.from({ length: 12 }, (_, i) => i * 30);
  const PITCHES = [-90, -60, -30, 0, 30, 60, 90];
  const ROLLS = [0, 90, 180, 270];

  let rotIndex = 0;
  const braceUserQuat = new THREE.Quaternion();

  function rotLabelText(yaw, pitch, roll) {
    return `Rotation: Yaw ${yaw}° | Pitch ${pitch}° | Roll ${roll}°`;
  }

  function keepBraceWorldCenter(applyRotation) {
    if (!brace) return;
    brace.updateWorldMatrix(true, true);
    const before = new THREE.Box3().setFromObject(brace).getCenter(new THREE.Vector3());
    applyRotation();
    brace.updateWorldMatrix(true, true);
    const after = new THREE.Box3().setFromObject(brace).getCenter(new THREE.Vector3());
    const delta = before.sub(after);
    if (Number.isFinite(delta.x) && Number.isFinite(delta.y) && Number.isFinite(delta.z)) {
      brace.position.add(delta);
      brace.updateWorldMatrix(true, true);
    }
  }

  function setBraceRotationEuler(yawDeg, pitchDeg, rollDeg) {
    if (!brace) return;
    keepBraceWorldCenter(() => {
      const e = new THREE.Euler(
        THREE.MathUtils.degToRad(pitchDeg),
        THREE.MathUtils.degToRad(yawDeg),
        THREE.MathUtils.degToRad(rollDeg),
        "XYZ"
      );
      braceUserQuat.setFromEuler(e);
      brace.quaternion.copy(braceUserQuat);
    });
  }

  // =========================
  // Helpers
  // =========================
  function updateModelCount() {
    const count = (torso ? 1 : 0) + (brace ? 1 : 0);
    if (modelsEl) modelsEl.textContent = `Models: ${count}/2`;
  }

  function disposeRoot(root) {
    if (!root) return;
    root.traverse((c) => {
      if (c.isMesh) {
        c.geometry?.dispose?.();
        if (Array.isArray(c.material)) c.material.forEach((m) => m?.dispose?.());
        else c.material?.dispose?.();
      }
    });
  }

  function setLayerRecursive(root, layer) {
    if (!root) return;
    root.traverse((c) => c.layers.set(layer));
  }

  function estimateMinEdgeLength(obj, maxTriangles = 20000) {
    if (!obj) return null;
    let min = Infinity;
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();

    obj.traverse((mesh) => {
      if (!mesh.isMesh || !mesh.geometry?.attributes?.position) return;
      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      const idx = geo.index;
      const triCount = idx ? Math.floor(idx.count / 3) : Math.floor(pos.count / 3);
      if (!triCount) return;
      const step = Math.max(1, Math.floor(triCount / maxTriangles));

      for (let t = 0; t < triCount; t += step) {
        const i0 = idx ? idx.getX(t * 3 + 0) : t * 3 + 0;
        const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;

        vA.fromBufferAttribute(pos, i0);
        vB.fromBufferAttribute(pos, i1);
        vC.fromBufferAttribute(pos, i2);

        min = Math.min(min, vA.distanceTo(vB), vB.distanceTo(vC), vC.distanceTo(vA));
      }
    });

    return Number.isFinite(min) && min !== Infinity ? min : null;
  }

  function applyManufacturingCheck(minThicknessMm) {
    if (!safetyBadgeEl) return;
    safetyBadgeEl.classList.remove("ready", "warn", "error");

    if (!Number.isFinite(minThicknessMm)) {
      safetyBadgeEl.textContent = "Audit: —";
      return;
    }

    if (minThicknessMm < 1.0) {
      safetyBadgeEl.textContent = "Audit: THIN (risk)";
      safetyBadgeEl.classList.add("error");
    } else if (minThicknessMm < 2.0) {
      safetyBadgeEl.textContent = "Audit: WARN (thin)";
      safetyBadgeEl.classList.add("warn");
    } else {
      safetyBadgeEl.textContent = "Audit: READY";
      safetyBadgeEl.classList.add("ready");
    }
  }

  // ✅ NEW: normalize + ground + center (no undefined calls)
  function normalizeAndCenterStrict(root, targetHeight = 1.55) {
    if (!root) return;

    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.scale.set(1, 1, 1);
    root.updateWorldMatrix(true, true);

    const box1 = new THREE.Box3().setFromObject(root);
    const size1 = box1.getSize(new THREE.Vector3());
    if (!Number.isFinite(size1.y) || size1.y < 1e-6) return;

    const s = targetHeight / size1.y;
    root.scale.setScalar(s);
    root.updateWorldMatrix(true, true);

    const box2 = new THREE.Box3().setFromObject(root);
    const c2 = box2.getCenter(new THREE.Vector3());
    root.position.x -= c2.x;
    root.position.z -= c2.z;
    root.updateWorldMatrix(true, true);

    const box3 = new THREE.Box3().setFromObject(root);
    root.position.y -= box3.min.y;
    root.updateWorldMatrix(true, true);
  }

  async function settleThenNormalize(root, targetHeight = 1.55) {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    normalizeAndCenterStrict(root, targetHeight);
  }

  // ✅ NEW: camera framing (keeps torso inside viewport block)
  function frameToObjects(objs, padding = 2.05) {
    const list = (objs || []).filter(Boolean);
    if (!list.length) return;

    const union = new THREE.Box3();
    for (const o of list) union.expandByObject(o);
    if (union.isEmpty()) return;

    const size = union.getSize(new THREE.Vector3());
    const center = union.getCenter(new THREE.Vector3());

    const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const halfFovX = Math.atan(Math.tan(halfFovY) * camera.aspect);

    const fitY = (size.y * 0.5) / Math.tan(halfFovY);
    const fitX = (size.x * 0.5) / Math.tan(halfFovX);
    const dist = Math.max(1e-6, Math.max(fitX, fitY)) * padding;

    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
    dir.normalize();

    camera.position.copy(center).addScaledVector(dir, dist);
    camera.position.y += size.y * 0.08;
    camera.near = Math.max(0.01, dist / 200);
    camera.far = dist * 200;
    camera.updateProjectionMatrix();

    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
  }

  function computeFitScore(tightPct, loosePct, okPct = null) {
    const ok = Number.isFinite(okPct) ? okPct : Math.max(0, 100 - tightPct - loosePct);
    // Reward any valid contact while keeping loose and over-tight penalties.
    let score = (ok * 2.5) + (tightPct * 1.0);
    const loosePenalty = Math.max(0, loosePct - 40) * 0.4;
    const tightPenalty = Math.max(0, tightPct - 20) * 1.0;
    return Math.round(clamp(score - loosePenalty - tightPenalty, 0, 100));
  }
  function computeRecommendation(tightPct, loosePct, score = null, okPct = null) {
    // Hard fail / no-contact
    if (loosePct >= 95) return "❌ Clinical failure — No effective contact";
    if (okPct !== null && okPct <= 2 && loosePct >= 85) {
      return "❌ Clinical failure — Insufficient contact";
    }

    const tooLoose = loosePct > 35;
    const tooTight = tightPct > MAX_TIGHT_PCT;
    if (tooLoose && tooTight) {
      return "❌ Not print-ready — Mixed failure: loose fit + pressure hotspots";
    }
    if (tooLoose) {
      return "❌ Not print-ready — Too loose: reduce clearance / resize";
    }
    if (tooTight) {
      return "❌ Not print-ready — Too tight: adjust/relieve";
    }

    // Optional score gate
    if (score !== null && score < 80) {
      return "⚠️ Review required — Borderline contact quality";
    }

    return "✅ Print-ready — Acceptable fit for review";
  }

  function autoScaleFactorForFit(fit) {
    if (fit.tightPct > MAX_TIGHT_PCT) return 1.02; // back off if too tight
    if (fit.loosePct > 85) return 0.92;
    if (fit.loosePct > 75) return 0.94;
    if (fit.loosePct > 60) return 0.96;
    if (fit.loosePct > TARGET_LOOSE_PCT) return 0.98;
    return 1.0;
  }

  function autoScaleFactorAggressive(fit) {
    if (fit.tightPct > 10) return 1.05;            // safety: avoid shrinking into torso
    if (fit.loosePct > 80) return 0.88;            // safer shrink to avoid collapse
    if (fit.loosePct > 35) return 0.92;            // keep shrinking until gap closes
    return 1.0;
  }

  async function refitToTorsoBaseline() {
    if (!torso || !brace) return;
    resetBraceToOriginal();
    await runGeometricPulse();
    scaleBraceToTorsoFootprint();
    autoAlignBraceToTorsoSmart();
    snapshotAIFit();
    clearPoseEdited("auto-refit");
  }

  async function autoTightenToPrintReady(
    baseFit,
    {
      targetScore = TARGET_SCORE,
      preservePosition = PRESERVE_POSITION_ON_AUTOFIT,
      maxIters = 6,
      aggressive = false
    } = {}
  ) {
    if (!brace || !torso) return baseFit;
    if (!AUTO_TIGHTEN_CAN_SCALE) {
      setSmart("Auto-tighten: disabled (preserve size/position).");
      return baseFit;
    }

    let best = baseFit;
    let bestTransform = {
      pos: brace.position.clone(),
      quat: brace.quaternion.clone(),
      scale: brace.scale.clone()
    };
    const MAX_ITERS = Math.max(1, maxIters | 0);

    if (preservePose && baseFit?.loosePct >= 80 && !preservePosition) {
      setSmart("Auto-tighten: re-aligning to torso baseline…");
      await refitToTorsoBaseline();
      await yieldUI();
    }

    for (let i = 0; i < MAX_ITERS; i++) {
      const factor = aggressive ? autoScaleFactorAggressive(best) : autoScaleFactorForFit(best);
      if (factor === 1.0) break;

      keepBraceWorldCenter(() => {
        brace.scale.multiplyScalar(factor);
      });
      if (!preservePosition) autoAlignBraceToTorsoSmart();
      brace.updateWorldMatrix(true, true);
      updateSlicing();

      setSmart(`Auto-tighten: scale ${(factor * 100).toFixed(1)}% (pass ${i + 1}/${MAX_ITERS})…`);
      await yieldUI();

      const res = await heatmapFast({ highRes: false, analysisOnly: true, fast: true });
      const score = computeFitScore(res.tightPct, res.loosePct, res.okPct);
      const recommendation = computeRecommendation(res.tightPct, res.loosePct, score, res.okPct);
      const fit = { ...res, score, recommendation };
      fit.clinical = interpretClinical(fit);

      const isBetter = fit.score > (best?.score ?? -1);
      const catastrophic = fit.loosePct >= 95 && fit.okPct === 0;

      if (isBetter && !catastrophic) {
        best = fit;
        bestTransform = {
          pos: brace.position.clone(),
          quat: brace.quaternion.clone(),
          scale: brace.scale.clone()
        };
      }

      if (catastrophic) {
        break;
      }

      if (fit.score >= targetScore || (fit.loosePct <= TARGET_LOOSE_PCT && fit.tightPct <= MAX_TIGHT_PCT)) {
        best = fit;
        bestTransform = {
          pos: brace.position.clone(),
          quat: brace.quaternion.clone(),
          scale: brace.scale.clone()
        };
        break;
      }
    }

    brace.position.copy(bestTransform.pos);
    brace.quaternion.copy(bestTransform.quat);
    brace.scale.copy(bestTransform.scale);
    brace.updateWorldMatrix(true, true);

    // Final full heatmap for accurate metrics + color
    const resFinal = await heatmapFast({ highRes: false });
    const scoreFinal = computeFitScore(resFinal.tightPct, resFinal.loosePct, resFinal.okPct);
    const recommendationFinal = computeRecommendation(resFinal.tightPct, resFinal.loosePct, scoreFinal, resFinal.okPct);
    const finalFit = { ...resFinal, score: scoreFinal, recommendation: recommendationFinal, highRes: false };
    finalFit.clinical = interpretClinical(finalFit);

    if ((finalFit.score ?? -1) >= (best.score ?? -1) && !(finalFit.loosePct >= 95 && finalFit.okPct === 0)) {
      best = finalFit;
    } else {
      brace.position.copy(bestTransform.pos);
      brace.quaternion.copy(bestTransform.quat);
      brace.scale.copy(bestTransform.scale);
      brace.updateWorldMatrix(true, true);

      const bestResPaint = await heatmapFast({ highRes: false });
      const bestPaintScore = computeFitScore(bestResPaint.tightPct, bestResPaint.loosePct, bestResPaint.okPct);
      best = {
        ...bestResPaint,
        score: bestPaintScore,
        recommendation: computeRecommendation(bestResPaint.tightPct, bestResPaint.loosePct, bestPaintScore, bestResPaint.okPct),
        highRes: false
      };
      best.clinical = interpretClinical(best);
    }

    snapshotAIFit();
    if (!preservePosition) clearPoseEdited("auto-tighten");
    const reached = best.score >= targetScore;
    setSmart(
      reached
        ? `Auto-tighten: done ✅ (Score ${best.score}/100, Loose ${best.loosePct}%).`
        : `Auto-tighten: done ⚠️ (Score ${best.score}/100, target ${targetScore} not reached).`
    );
    return best;
  }

  function downloadText(filename, text, mime = "text/plain") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 800);
  }

  function getLandmarkSnapshot() {
    const lm = currentLandmarks || estimateLandmarks();
    if (!lm) return null;
    const ribRel = Number((lm.ribRel ?? 0).toFixed(4));
    const pelvisRel = Number((lm.pelRel ?? 0).toFixed(4));
    const snapshot = {
      ribPct: Math.round(ribRel * 100),
      pelvisPct: Math.round(pelvisRel * 100),
      ribRel,
      pelvisRel
    };

    if (lm.profileId) {
      snapshot.profileId = lm.profileId;
      snapshot.profileLabel = lm.profileLabel || lm.profileId;
      snapshot.requestedCount = lm.requestedCount ?? null;
      snapshot.snappedCount = lm.snappedCount ?? null;
    }

    if (lm.clearance && Number.isFinite(lm.clearance.avg)) {
      snapshot.clearanceMm = {
        avg: Number((lm.clearance.avg * 1000).toFixed(2)),
        min: Number((lm.clearance.min * 1000).toFixed(2)),
        max: Number((lm.clearance.max * 1000).toFixed(2)),
        validCount: lm.clearance.validCount ?? null
      };
    }

    return snapshot;
  }

  function getLandmarkClinicalSummary() {
    const lm = currentLandmarks;
    const points = lm?.points || [];
    if (!points.length) return null;

    const valid = points.filter((p) => Number.isFinite(p.clearance));
    if (!valid.length) return "Landmark analysis unavailable (no clearance values).";

    const targetM = getFitSensitivityPreset().targetMm / 1000;
    const toFamily = (label) => {
      const base = String(label || "").split("-")[0];
      if (/^T\d+$/i.test(base)) return "thoracic";
      if (/^L\d+$/i.test(base)) return "lumbar";
      if (/^Pelvis$/i.test(base)) return "pelvis";
      return "other";
    };

    const regionStats = {
      thoracic: { points: [], ok: 0, loose: 0, tight: 0, warn: 0 },
      lumbar: { points: [], ok: 0, loose: 0, tight: 0, warn: 0 },
      pelvis: { points: [], ok: 0, loose: 0, tight: 0, warn: 0 },
      other: { points: [], ok: 0, loose: 0, tight: 0, warn: 0 }
    };

    for (const p of valid) {
      const family = toFamily(p.label);
      const band = clearanceBand(p.clearance);
      const region = regionStats[family] || regionStats.other;
      region.points.push(p);
      if (band === "ok") region.ok++;
      else if (band === "loose") region.loose++;
      else if (band === "tight") region.tight++;
      else region.warn++;
    }

    const curveType = curveTypeEl?.value || "Neutral";
    let focusFamily = "thoracic";
    if (/lumbar/i.test(curveType) && !/thor/i.test(curveType)) focusFamily = "lumbar";
    const focus = (regionStats[focusFamily].points.length ? regionStats[focusFamily] : regionStats.lumbar.points.length ? regionStats.lumbar : regionStats.thoracic);

    const anchor = focus.points.reduce((best, p) => {
      if (!best) return p;
      const d = Math.abs(p.clearance - targetM);
      const bestD = Math.abs(best.clearance - targetM);
      return d < bestD ? p : best;
    }, null);

    const okAll = valid.filter((p) => clearanceBand(p.clearance) === "ok").length;
    const okPct = Math.round((okAll / Math.max(1, valid.length)) * 100);
    const anchorName = (anchor?.label || "target zone").split("-")[0];
    const focusCount = focus.points.length || 1;
    const focusOkPct = Math.round((focus.ok / focusCount) * 100);
    const focusLoosePct = Math.round((focus.loose / focusCount) * 100);

    if (focusOkPct >= 50) {
      return `Scoliosis correction optimized near ${anchorName}; sweet-spot coverage ${okPct}% across landmarks.`;
    }
    if (focusLoosePct >= 50) {
      return `Primary correction zone near ${anchorName} remains under-contact; increase contact to improve force transfer.`;
    }
    return `Primary correction zone near ${anchorName} is partially engaged; fine-tune for better correction consistency.`;
  }

  function getLandmarkClinicalSignals() {
    const points = currentLandmarks?.points || [];
    const valid = points.filter((p) => Number.isFinite(p.clearance));
    if (!valid.length) return { warnings: [], notes: [] };

    const p = getFitSensitivityPreset();
    const tightM = p.tightMm / 1000;
    const looseM = p.looseMm / 1000;
    const targetM = p.targetMm / 1000;

    const groups = {
      thoracic: { count: 0, sum: 0 },
      lumbar: { count: 0, sum: 0 },
      pelvis: { count: 0, sum: 0 }
    };

    const toFamily = (label) => {
      const base = String(label || "").split("-")[0];
      if (/^T\d+$/i.test(base)) return "thoracic";
      if (/^L\d+$/i.test(base)) return "lumbar";
      if (/^Pelvis$/i.test(base)) return "pelvis";
      return null;
    };

    let minPoint = null;
    let anchorPoint = null;
    for (const lp of valid) {
      const fam = toFamily(lp.label);
      if (fam) {
        groups[fam].count++;
        groups[fam].sum += lp.clearance;
      }

      if (!minPoint || lp.clearance < minPoint.clearance) minPoint = lp;
      if (!anchorPoint || Math.abs(lp.clearance - targetM) < Math.abs(anchorPoint.clearance - targetM)) {
        anchorPoint = lp;
      }
    }

    const warnings = [];
    const notes = [];
    const addRegionSignal = (key, title) => {
      const g = groups[key];
      if (!g.count) return;
      const avg = g.sum / g.count;
      const avgMm = (avg * 1000).toFixed(1);
      const targetMm = (targetM * 1000).toFixed(1);

      if (avg > looseM * 1.12) {
        warnings.push(`${title} under-contact: avg clearance ${avgMm}mm (target ~${targetMm}mm).`);
      } else if (avg < tightM * 0.85) {
        warnings.push(`${title} over-pressure risk: avg clearance ${avgMm}mm.`);
      } else {
        notes.push(`${title} anchor average ${avgMm}mm within expected range.`);
      }
    };

    addRegionSignal("thoracic", "Thoracic");
    addRegionSignal("lumbar", "Lumbar");
    addRegionSignal("pelvis", "Pelvis");

    if (minPoint && minPoint.clearance < tightM * 0.7) {
      const n = String(minPoint.label || "anchor").split("-")[0];
      warnings.push(`Localized pressure risk near ${n}: clearance ${(minPoint.clearance * 1000).toFixed(1)}mm.`);
    }
    if (anchorPoint) {
      const n = String(anchorPoint.label || "anchor").split("-")[0];
      notes.push(`Best landmark alignment near ${n} at ${(anchorPoint.clearance * 1000).toFixed(1)}mm.`);
    }

    return {
      warnings: [...new Set(warnings)].slice(0, 5),
      notes: [...new Set(notes)].slice(0, 5)
    };
  }

  function summarizeClinicalFit(fit) {
    if (!fit) return "No fit data available.";
    const landmarkSummary = getLandmarkClinicalSummary();
    if (fit.loosePct >= 95) return `CRITICAL: Brace is not in contact with patient. Correction is impossible.${landmarkSummary ? ` ${landmarkSummary}` : ""}`;
    if (fit.score >= 80) return `AI RECOVERY SUCCESSFUL: Brace successfully scaled to match anatomical landmarks.${landmarkSummary ? ` ${landmarkSummary}` : ""}`;
    return `Partial success; further manual adjustment required.${landmarkSummary ? ` ${landmarkSummary}` : ""}`;
  }

  function formalizePatientReport(fit, patientId) {
    const generatedAt = new Date().toISOString();
    const reportType = fit?.highRes ? "final" : "provisional";
    const landmarks = getLandmarkSnapshot();
    const curveType = curveTypeEl?.value || "Neutral";

    return {
      reportType,
      generatedAt,
      patientMetadata: {
        id: patientId || currentPatientId || "Unknown",
        curveType,
        date: generatedAt
      },
      anatomicalLandmarks: landmarks || {
        ribPct: null,
        pelvisPct: null,
        note: "Landmarks unavailable; run Auto Landmarks for anchored reporting."
      },
      fittingKpis: {
        score: fit?.score ?? null,
        overallScore: fit ? `${fit.score}/100` : "—",
        tightPct: fit?.tightPct ?? null,
        okPct: fit?.okPct ?? null,
        loosePct: fit?.loosePct ?? null,
        contactEfficiency: fit ? `Tight: ${fit.tightPct}% | OK: ${fit.okPct}% | Loose: ${fit.loosePct}%` : "—",
        criticalZoneAudit: fit?.zones || {}
      },
      aiAssessment: {
        label: fit?.clinical?.clinicalLabel || "—",
        summary: summarizeClinicalFit(fit),
        landmarkSummary: getLandmarkClinicalSummary(),
        warnings: fit?.clinical?.warnings || [],
        notes: fit?.clinical?.notes || []
      },
      interactionSummary: {
        totalEvents: interactionLog.length,
        lastEventAt: interactionLog.length ? interactionLog[interactionLog.length - 1].ts : null,
        recentEvents: interactionLog.slice(-120)
      },
      manufacturingNote: fit?.highRes
        ? "High-Res Scan validated. Dimensions finalized for additive manufacturing."
        : "Provisional report only. Run High-Res Scan before final manufacturing release.",
      compliance: {
        containsPHI: true,
        handlingGuidance: "Store and transmit in HIPAA/GDPR compliant systems only."
      },
      clinicianSignoff: {
        required: true,
        approved: false,
        clinicianName: "",
        clinicianNotes: ""
      }
    };
  }

  // =========================
  // Multi-format loader
  // =========================
  async function loadAnyModel(file, name) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    if (ext === "glb" || ext === "gltf") {
      const url = URL.createObjectURL(file);
      try {
        const gltf = await gltfLoader.loadAsync(url);
        const wrapper = new THREE.Group();
        wrapper.name = name;
        wrapper.add(gltf.scene);
        return wrapper;
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    if (ext === "obj") {
      const text = await file.text();
      const parsed = objLoader.parse(text);
      parsed.traverse((c) => {
        if (!c.isMesh) return;
        if (c.geometry && !c.geometry.attributes.normal) c.geometry.computeVertexNormals();
      });
      const g = new THREE.Group();
      g.name = name;
      g.add(parsed);
      return g;
    }

    if (ext === "stl") {
      const buf = await file.arrayBuffer();
      const geo = stlLoader.parse(buf);
      if (!geo.attributes.normal) geo.computeVertexNormals();
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: 0xd9d9d9,
          roughness: 0.6,
          metalness: 0.0,
          side: THREE.DoubleSide
        })
      );
      const g = new THREE.Group();
      g.name = name;
      g.add(mesh);
      return g;
    }

    throw new Error(`Unsupported file type: .${ext}`);
  }

  // =========================
  // Materials
  // =========================
  function setTorsoMaterial() {
    if (!torso) return;
    torso.traverse((c) => {
      if (!c.isMesh) return;
      c.material = new THREE.MeshStandardMaterial({
        color: 0xd9d9d9,
        roughness: 0.65,
        metalness: 0.0,
        side: THREE.DoubleSide,
        transparent: !!xrayActive,
        opacity: xrayActive ? 0.35 : 1.0,
        depthWrite: true,
        depthTest: true
      });
      c.renderOrder = 1;
      setMatClipping(c.material);
    });
    updateSlicing();
  }

  function ensureVertexColors(mesh) {
    let geo = mesh.geometry;
    if (!geo || !geo.isBufferGeometry) return;

    if (geo.index) geo = geo.toNonIndexed();
    if (!geo.attributes.normal) geo.computeVertexNormals();
    geo = geo.clone();

    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    mesh.geometry = geo;

    mesh.material = new THREE.MeshStandardMaterial({
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: xrayActive ? 0.5 : 0.9,
      vertexColors: true,
      depthWrite: !xrayActive,
      depthTest: !xrayActive,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      side: THREE.DoubleSide
    });

    setMatClipping(mesh.material);
    mesh.renderOrder = 999;
  }

  function ensureTorsoHeatmapColors(mesh) {
    if (!mesh?.isMesh || !mesh.geometry?.attributes?.position) return false;
    if (mesh.userData.torsoHeatmapReady && mesh.geometry?.attributes?.color) return true;

    let geo = mesh.geometry;
    if (!geo.isBufferGeometry) return false;
    if (geo.index) geo = geo.toNonIndexed();
    if (!geo.attributes.normal) geo.computeVertexNormals();
    geo = geo.clone();

    const count = geo.attributes.position.count;
    if (!geo.attributes.color || geo.attributes.color.count !== count) {
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    }
    mesh.geometry = geo;

    mesh.material = new THREE.MeshStandardMaterial({
      roughness: 0.62,
      metalness: 0.06,
      transparent: !!xrayActive,
      opacity: xrayActive ? 0.45 : 1.0,
      vertexColors: true,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide
    });
    setMatClipping(mesh.material);
    mesh.renderOrder = 2;
    mesh.userData.torsoHeatmapReady = true;
    return true;
  }

  function torsoDistanceToBrace(surfacePoint, surfaceNormal, bodyCenter, braceMeshes) {
    const d = estimateClearanceToBrace(surfacePoint, surfaceNormal, bodyCenter, braceMeshes);
    return Number.isFinite(d) ? d : MAX_RAY;
  }

  function torsoHeatmapColor(clearance) {
    const band = clearanceBand(clearance);
    if (band === "tight") return [0.95, 0.28, 0.28];
    if (band === "ok") return [0.16, 0.82, 0.36];
    if (band === "warn") return [0.96, 0.67, 0.16];
    if (band === "loose") return [0.24, 0.54, 0.98];
    return [0.45, 0.5, 0.58];
  }

  async function updateTorsoHeatmap() {
    if (!torso) return;

    if (!skinHeatmapActive || !brace || !brace.visible) {
      setTorsoMaterial();
      return;
    }

    const braceMeshes = getMeshList(brace);
    const torsoMeshes = getMeshList(torso);
    if (!braceMeshes.length || !torsoMeshes.length) {
      setTorsoMaterial();
      return;
    }

    const tBox = getTorsoBox();
    const bodyCenter = tBox ? tBox.getCenter(new THREE.Vector3()) : new THREE.Vector3();

    const worldPos = new THREE.Vector3();
    const worldN = new THREE.Vector3();
    const nMat = new THREE.Matrix3();

    for (const mesh of torsoMeshes) {
      if (!ensureTorsoHeatmapColors(mesh)) continue;
      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      const nor = geo.attributes.normal;
      const col = geo.attributes.color;
      if (!pos || !nor || !col) continue;

      mesh.updateWorldMatrix(true, false);
      nMat.getNormalMatrix(mesh.matrixWorld);

      const sampleBudget = 4500;
      const step = Math.max(1, Math.floor(pos.count / sampleBudget));
      let processed = 0;

      for (let i = 0; i < pos.count; i += step) {
        worldPos.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
        worldN.fromBufferAttribute(nor, i).applyMatrix3(nMat).normalize();

        const dist = torsoDistanceToBrace(worldPos, worldN, bodyCenter, braceMeshes);
        const [r, g, b] = torsoHeatmapColor(dist);
        col.setXYZ(i, r, g, b);

        processed++;
        if (processed % 1600 === 0) await yieldUI();
      }

      for (let i = 0; i < pos.count; i++) {
        if (i % step === 0) continue;
        const j = Math.floor(i / step) * step;
        col.setXYZ(i, col.getX(j), col.getY(j), col.getZ(j));
      }
      col.needsUpdate = true;
    }

    applyXrayToTorso();
    updateSlicing();
  }

  function scheduleTorsoHeatmapUpdate(delayMs = 140) {
    if (!skinHeatmapActive || !torso || !brace) return;
    clearTimeout(torsoHeatmapTimer);
    torsoHeatmapTimer = setTimeout(() => {
      void updateTorsoHeatmap();
    }, delayMs);
  }

  function setSkinHeatmapActive(on, opts = {}) {
    skinHeatmapActive = !!on;
    menuSkinHeatmapBtn?.classList.toggle("active", skinHeatmapActive);
    if (menuSkinHeatmapBtn) {
      menuSkinHeatmapBtn.textContent = skinHeatmapActive ? "🔥 Skin Heatmap: ON" : "🔥 Skin Heatmap";
    }

    if (!skinHeatmapActive) {
      setTorsoMaterial();
    } else {
      void updateTorsoHeatmap();
    }

    if (!opts.silent) {
      setStatus(skinHeatmapActive ? "🔥 Skin heatmap ON." : "Skin heatmap OFF.");
    }
  }

  // =========================
  // X-ray
  // =========================
  function applyXrayToBrace() {
    if (!brace) return;
    brace.traverse((c) => {
      if (!c.isMesh) return;
      if (!c.material) return;
      c.material.transparent = true;
      c.material.opacity = xrayActive ? 0.5 : c.material.vertexColors ? 0.9 : 1.0;
      c.material.depthWrite = !xrayActive;
      c.material.depthTest = !xrayActive;
      c.material.needsUpdate = true;
    });
  }

  function applyXrayToTorso() {
    if (!torso) return;
    torso.traverse((c) => {
      if (!c.isMesh) return;
      if (!c.material) return;
      c.material.transparent = !!xrayActive;
      c.material.opacity = xrayActive ? 0.35 : 1.0;
      // Keep torso in depth buffer to avoid transparency sorting dropouts.
      c.material.depthWrite = true;
      c.material.depthTest = true;
      c.material.needsUpdate = true;
    });
  }

  function setXray(on) {
    xrayActive = !!on;
    applyXrayToBrace();
    applyXrayToTorso();
    if (toggleXrayBtn) toggleXrayBtn.textContent = xrayActive ? "🩻 Disable X-Ray" : "🩻 Enable X-Ray";
    setStatus(xrayActive ? "X-Ray Mode Active (torso ghosted, brace on top)" : "Opaque Mode Active");
  }

  // =========================
  // Zone markers
  // =========================
  function clearZones() {
    if (zoneGroup) {
      scene.remove(zoneGroup);
      zoneGroup = null;
    }
  }

  function addZoneMarkersForTorso() {
    clearZones();
    if (!torso) return;

    torso.updateWorldMatrix(true, true);
    const tBox = new THREE.Box3().setFromObject(torso);
    const tSize = tBox.getSize(new THREE.Vector3());
    const tCenter = tBox.getCenter(new THREE.Vector3());

    const upperY = tBox.min.y + tSize.y * 0.85;
    const lowerY = tBox.min.y + tSize.y * 0.15;
    const sizeXZ = Math.max(tSize.x, tSize.z) * 1.35;

    zoneGroup = new THREE.Group();

    const createLine = (y, color) => {
      const helper = new THREE.GridHelper(sizeXZ, 12, color, color);
      helper.position.set(tCenter.x, y, tCenter.z);
      helper.material.transparent = true;
      helper.material.opacity = 0.25;
      helper.material.depthTest = false;
      helper.renderOrder = 500;
      return helper;
    };

    zoneGroup.add(createLine(upperY, 0xff3b3b));
    zoneGroup.add(createLine(lowerY, 0x29ff8a));
    scene.add(zoneGroup);
  }

  function setZonesVisible(on) {
    zonesVisible = !!on;
    if (!zonesVisible) clearZones();
    else addZoneMarkersForTorso();
    if (showZonesBtn) showZonesBtn.textContent = zonesVisible ? "📏 Hide Zones" : "📏 Show Zones";
    setStatus(zonesVisible ? "Zone markers ON" : "Zone markers OFF");
  }

  // =========================
  // Pose estimation (Geometric Pulse)
  // =========================
  async function runGeometricPulse() {
    if (!brace) return;

    setStatus("🤖 AI: Geometric Pulse… estimating upright pose");
    document.body.classList.add("ai-active");

    const orientations = [
      new THREE.Quaternion(),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2)
    ];

    const saved = brace.quaternion.clone();
    let bestQ = orientations[0];
    let bestY = -Infinity;

    for (const q of orientations) {
      brace.quaternion.copy(saved).multiply(q);
      brace.updateWorldMatrix(true, true);

      const box = new THREE.Box3().setFromObject(brace);
      const size = box.getSize(new THREE.Vector3());
      if (size.y > bestY) {
        bestY = size.y;
        bestQ = q.clone();
      }
      await yieldUI();
    }

    brace.quaternion.copy(saved).multiply(bestQ);
    brace.updateWorldMatrix(true, true);

    braceUserQuat.copy(brace.quaternion);

    setStatus("✅ AI: Pose estimated (upright).");
    document.body.classList.remove("ai-active");
  }

  // =========================
  // Alignment
  // =========================
  function snapshotOriginalBrace() {
    if (!brace) return;
    braceOrig = { pos: brace.position.clone(), quat: brace.quaternion.clone(), scale: brace.scale.clone() };
  }

  function resetBraceToOriginal() {
    if (!brace || !braceOrig) return;
    brace.position.copy(braceOrig.pos);
    brace.quaternion.copy(braceOrig.quat);
    brace.scale.copy(braceOrig.scale);
    brace.updateWorldMatrix(true, true);
    braceUserQuat.copy(brace.quaternion);
  }

  // =========================================================
  // TOPOLOGICAL SHRINK-WRAP AI ENGINE
  // =========================================================
  async function applyTopologicalShrinkWrap(targetClearance = 0.005) {
    if (!torso || !brace) return;
    setStatus("🤖 AI: Applying Topological Shrink-Wrap (Bending mesh)...");
    await yieldUI(); // Keep the browser from freezing

    const torsoMeshes = getMeshList(torso);
    const braceMeshes = getMeshList(brace);
    if (!torsoMeshes.length || !braceMeshes.length) return;

    // Find the center of the patient's body (the spine)
    const tBox = getTorsoBox();
    if (!tBox) return;
    const bodyCenter = tBox.getCenter(new THREE.Vector3());

    const wrapRaycaster = new THREE.Raycaster();

    for (const mesh of braceMeshes) {
      if (!mesh?.geometry?.attributes?.position) continue;

      // 1. Unlock the rigid geometry so we can physically bend the plastic
      if (mesh.geometry.index) {
        mesh.geometry = mesh.geometry.toNonIndexed();
      }
      const posAttr = mesh.geometry.attributes.position;
      posAttr.setUsage(THREE.DynamicDrawUsage);

      const vWorld = new THREE.Vector3();
      const vLocal = new THREE.Vector3();
      const dir = new THREE.Vector3();
      const invMatrix = new THREE.Matrix4();

      mesh.updateWorldMatrix(true, false);
      invMatrix.copy(mesh.matrixWorld).invert();

      let processed = 0;

      // 2. Loop through every single microscopic point on the brace
      for (let i = 0; i < posAttr.count; i++) {
        vLocal.fromBufferAttribute(posAttr, i);
        vWorld.copy(vLocal).applyMatrix4(mesh.matrixWorld);

        // 3. Aim a digital laser from the outside point INWARD toward the spine
        const spineCenter = new THREE.Vector3(bodyCenter.x, vWorld.y, bodyCenter.z);
        dir.subVectors(spineCenter, vWorld);

        if (dir.lengthSq() < 1e-10) continue;
        dir.normalize();

        // Start the laser slightly outside the brace to ensure we hit the torso
        const rayOrigin = vWorld.clone().addScaledVector(dir, -0.1);
        wrapRaycaster.set(rayOrigin, dir);
        wrapRaycaster.near = 0;
        wrapRaycaster.far = 0.5; // Search half a meter inward

        // 4. Fire the laser!
        const hits = wrapRaycaster.intersectObjects(torsoMeshes, true);

        if (hits.length > 0) {
          const hit = hits[0];

          // 5. If it hits the skin, move this exact piece of plastic to touch the skin,
          // minus the clearance amount (e.g., 5mm gap)
          const newPosWorld = hit.point.clone().add(dir.clone().multiplyScalar(-targetClearance));

          vLocal.copy(newPosWorld).applyMatrix4(invMatrix);
          posAttr.setXYZ(i, vLocal.x, vLocal.y, vLocal.z);
        }

        processed++;
        if (processed % 2000 === 0) {
          setStatus(`🤖 AI Shrink-Wrap: Bending point ${i}/${posAttr.count}...`);
          await yieldUI();
        }
      }

      // 6. Tell Three.js to re-calculate the lighting so the new shape looks smooth
      posAttr.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
    }

    // Lock this tailored shape as the new baseline
    tensionBaseScale = brace.scale.clone();
    setStatus("✅ AI: Brace successfully shrink-wrapped to torso.");
  }


  function sampleSliceStatsForObject(root, yWorld, halfBand, maxSamples = 12000) {
    if (!root || !Number.isFinite(yWorld) || !Number.isFinite(halfBand) || halfBand <= 0) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    let sumX = 0;
    let sumZ = 0;
    let count = 0;

    const v = new THREE.Vector3();

    root.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry?.attributes?.position) return;

      obj.updateWorldMatrix(true, false);
      const pos = obj.geometry.attributes.position;
      const step = Math.max(1, Math.floor(pos.count / Math.max(100, maxSamples)));

      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(obj.matrixWorld);
        if (Math.abs(v.y - yWorld) > halfBand) continue;

        count++;
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minZ = Math.min(minZ, v.z);
        maxZ = Math.max(maxZ, v.z);
        sumX += v.x;
        sumZ += v.z;
      }
    });

    if (count < 16 || !Number.isFinite(minX) || !Number.isFinite(minZ)) return null;

    return {
      count,
      minX,
      maxX,
      minZ,
      maxZ,
      width: Math.max(0, maxX - minX),
      depth: Math.max(0, maxZ - minZ),
      centerX: sumX / count,
      centerZ: sumZ / count
    };
  }

  function penetrationWidthCompression(depthM) {
    const depth = clamp(Number(depthM) || 0, 0, MAX_PENETRATION_M);
    const norm = depth / MAX_PENETRATION_M;
    // Moderate lateral squeeze with depth to reduce side gaps.
    return clamp(1.0 - norm * 0.25, 0.75, 1.0);
  }

  function penetrationDepthCompression(depthM) {
    const depth = clamp(Number(depthM) || 0, 0, MAX_PENETRATION_M);
    const norm = depth / MAX_PENETRATION_M;
    // Strong AP squeeze so front side closes as penetration increases.
    return clamp(1.0 - norm * 0.7, 0.3, 1.0);
  }

  function getEffectivePenetrationInset(depthM) {
    const depth = clamp(Number(depthM) || 0, 0, MAX_PENETRATION_M);
    // Map slider depth to a clinically plausible inset (max ~30mm).
    return clamp(depth * 0.3, 0, 0.03);
  }

  function enforceCrossSectionContact(depthM = 0, tensionFactor = 1.0) {
    if (!torso || !brace) return;
    const tBox = getTorsoBox();
    if (!tBox) return;
    const tSize = tBox.getSize(new THREE.Vector3());
    const lm = currentLandmarks || estimateLandmarks();
    const yRel = Number.isFinite(lm?.pelRel) ? lm.pelRel : 0.34;
    const y = tBox.min.y + tSize.y * yRel;
    const band = Math.max(0.01, tSize.y * 0.03);
    const torsoSlice = sampleSliceStatsForObject(torso, y, band, 12000);
    const braceSlice = sampleSliceStatsForObject(brace, y, band, 12000);
    if (!torsoSlice || !braceSlice) return;

    const eps = 1e-6;
    const widthRatio = braceSlice.width / Math.max(torsoSlice.width, eps);
    const depthRatio = braceSlice.depth / Math.max(torsoSlice.depth, eps);

    const normDepth = clamp(Number(depthM) || 0, 0, MAX_PENETRATION_M) / MAX_PENETRATION_M;
    const tightness = clamp((1.0 - (Number(tensionFactor) || 1.0)) / 0.12, 0, 1);
    // Keep AP span close to torso depth so front wall can engage.
    const desiredWidthRatio = clamp(0.98 - (normDepth * 0.08) - (tightness * 0.06), 0.84, 1.0);
    const desiredDepthRatio = clamp(1.02 - (normDepth * 0.08) - (tightness * 0.05), 0.9, 1.03);

    let sx = 1.0;
    let sz = 1.0;
    if (widthRatio > desiredWidthRatio) sx = desiredWidthRatio / widthRatio;
    if (depthRatio > desiredDepthRatio) sz = desiredDepthRatio / depthRatio;

    sx = clamp(sx, 0.35, 1.15);
    sz = clamp(sz, 0.35, 1.25);
    if (Math.abs(sx - 1.0) > 1e-3 || Math.abs(sz - 1.0) > 1e-3) {
      keepBraceWorldCenter(() => {
        brace.scale.x *= sx;
        brace.scale.z *= sz;
      });
      brace.updateWorldMatrix(true, true);
    }
  }

  function enforceWholeBraceInsideTorso(depthM = 0, tensionFactor = 1.0) {
    if (!torso || !brace) return;
    const tBox = getTorsoBox();
    if (!tBox) return;
    brace.updateWorldMatrix(true, true);
    const bBox = new THREE.Box3().setFromObject(brace);

    const tSize = tBox.getSize(new THREE.Vector3());
    const bSize = bBox.getSize(new THREE.Vector3());
    const inset = getEffectivePenetrationInset(depthM);
    const tightness = clamp((1.0 - (Number(tensionFactor) || 1.0)) / 0.12, 0, 1);

    const targetWidth = Math.max(0.01, (tSize.x - (2 * inset * 0.4)) * (0.97 - tightness * 0.06));
    const targetDepth = Math.max(0.01, (tSize.z - (2 * inset * 0.7)) * (0.97 - tightness * 0.08));
    const ratioX = targetWidth / Math.max(1e-6, bSize.x);
    const ratioZ = targetDepth / Math.max(1e-6, bSize.z);

    const sx = clamp(ratioX, 0.2, 3.0);
    const sz = clamp(ratioZ, 0.2, 3.0);
    keepBraceWorldCenter(() => {
      brace.scale.x *= sx;
      brace.scale.z *= sz;
    });
    brace.updateWorldMatrix(true, true);
  }

  function stabilizeBraceVisibilityAndScale() {
    if (!torso || !brace) return;
    if (!brace.visible) brace.visible = true;

    torso.updateWorldMatrix(true, true);
    brace.updateWorldMatrix(true, true);
    const tBox = new THREE.Box3().setFromObject(torso);
    const bBox = new THREE.Box3().setFromObject(brace);
    const tSize = tBox.getSize(new THREE.Vector3());
    const bSize = bBox.getSize(new THREE.Vector3());
    const tCenter = tBox.getCenter(new THREE.Vector3());
    const bCenter = bBox.getCenter(new THREE.Vector3());

    const tooSmall =
      bSize.x < tSize.x * 0.2 ||
      bSize.y < tSize.y * 0.18 ||
      bSize.z < tSize.z * 0.2;
    const tooLarge =
      bSize.x > tSize.x * 2.0 ||
      bSize.y > tSize.y * 1.6 ||
      bSize.z > tSize.z * 2.0;
    const tooFar = bCenter.distanceTo(tCenter) > Math.max(1.2, tSize.length() * 1.2);

    if (tooSmall || tooLarge || tooFar) {
      if (!braceOrig) snapshotOriginalBrace();
      scaleBraceToTorsoFootprint();
      autoAlignBraceToTorsoSmart();
      resetTensionControl();
      brace.visible = braceVisible;
      brace.updateWorldMatrix(true, true);
    }
  }

  function scaleBraceToTorsoFootprint() {
    if (!torso || !brace) return;
    if (!braceOrig) snapshotOriginalBrace();

    torso.updateWorldMatrix(true, true);
    brace.updateWorldMatrix(true, true);

    const tBox = new THREE.Box3().setFromObject(torso);
    const tSize = tBox.getSize(new THREE.Vector3());

    resetBraceToOriginal();
    brace.updateWorldMatrix(true, true);
    const bBox0 = new THREE.Box3().setFromObject(brace);
    const bSize0 = bBox0.getSize(new THREE.Vector3());

    const eps = 1e-6;
    // Fit against width/depth/height simultaneously to avoid "swallowing" the torso.
    const targetWidth = tSize.x * 0.9;
    const targetDepth = tSize.z * 0.92;
    const targetHeight = tSize.y * 0.86;
    const ratioX = targetWidth / Math.max(bSize0.x, eps);
    const ratioZ = targetDepth / Math.max(bSize0.z, eps);
    const ratioY = targetHeight / Math.max(bSize0.y, eps);
    let uniformScale = Math.min(ratioX, ratioZ, ratioY);
    uniformScale = THREE.MathUtils.clamp(uniformScale, 0.0001, 100.0);

    brace.scale.copy(braceOrig.scale).multiplyScalar(uniformScale);
    // Mild default squeeze so first contact starts closer to torso.
    brace.scale.x *= 0.95;
    brace.updateWorldMatrix(true, true);

    // Safety cap: never allow brace envelope to exceed target torso envelope.
    const bBox1 = new THREE.Box3().setFromObject(brace);
    const bSize1 = bBox1.getSize(new THREE.Vector3());
    const overX = bSize1.x / Math.max(tSize.x * 0.92, eps);
    const overZ = bSize1.z / Math.max(tSize.z * 0.94, eps);
    const overY = bSize1.y / Math.max(tSize.y * 0.9, eps);
    const oversize = Math.max(overX, overZ, overY);
    if (oversize > 1.0) {
      brace.scale.multiplyScalar((1 / oversize) * 0.98);
      brace.updateWorldMatrix(true, true);
    }

    // Lock baseline immediately after stable footprint scale.
    tensionBaseScale = brace.scale.clone();
  }

  function autoAlignBraceToTorsoSmart() {
    if (!torso || !brace) return;

    torso.updateWorldMatrix(true, true);
    brace.updateWorldMatrix(true, true);

    const tBox = new THREE.Box3().setFromObject(torso);
    const tCenter = tBox.getCenter(new THREE.Vector3());
    const tSize = tBox.getSize(new THREE.Vector3());

    const bBox = new THREE.Box3().setFromObject(brace);
    const bCenter = bBox.getCenter(new THREE.Vector3());
    const bSize = bBox.getSize(new THREE.Vector3());

    const lm = currentLandmarks || estimateLandmarks();
    const clinicalYTarget = (lm && Number.isFinite(lm.pelRel))
      ? (tBox.min.y + tSize.y * lm.pelRel)
      : tCenter.y;

    // Anchor lower brace section to pelvis level
    const bAnchorY = bBox.min.y + bSize.y * 0.25;

    // ABSOLUTE CENTER LOCK (X + Z) + pelvic Y anchoring
    brace.position.x += (tCenter.x - bCenter.x);
    brace.position.z += (tCenter.z - bCenter.z);
    brace.position.y += (clinicalYTarget - bAnchorY);

    brace.updateWorldMatrix(true, true);
  }


  function fixBraceAfterRotation(reason = "rotation") {
    if (!torso || !brace) return;
    if (!PRESERVE_POSITION_ON_ROTATION) {
      autoAlignBraceToTorsoSmart();
    }
    brace.updateWorldMatrix(true, true);
    braceUserQuat.copy(brace.quaternion);
    snapshotAIFit();
    markPoseEdited(reason);
    updateSlicing();
    setStatus(
      PRESERVE_POSITION_ON_ROTATION
        ? "✅ Rotation applied (position preserved)."
        : "✅ Rotation applied & brace fixed to torso."
    );
  }

  // =========================
  // Manual controls
  // =========================
  const NUDGE_STEP = 0.01;
  const ROT_FINE_DEG = 2;
  const SCALE_FACTOR = 1.01;

  function nudgeBrace(dx, dy, dz) {
    if (!braceLoaded) return setStatus("Load Brace first.");
    brace.position.add(new THREE.Vector3(dx, dy, dz));
    brace.updateWorldMatrix(true, true);
    markPoseEdited("nudge");
    appendInteraction("manual_nudge", { dx, dy, dz });
    updateSlicing();
    scheduleRealtimeHeatmap({ fast: true });
    setStatus("✅ Manual nudge applied (pose preserved for heatmap).");
  }

  function rotateFine(axis, deg) {
    if (!braceLoaded) return setStatus("Load Brace first.");
    const q = new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(deg));
    keepBraceWorldCenter(() => {
      braceUserQuat.multiply(q);
      brace.quaternion.copy(braceUserQuat);
    });

    if (torso) {
      fixBraceAfterRotation("manual rotate");
    } else {
      markPoseEdited("manual rotate");
      updateSlicing();
      setStatus("✅ Manual fine rotation applied (pose preserved for heatmap).");
    }
    appendInteraction("manual_rotate", { deg });
    scheduleRealtimeHeatmap({ fast: true });
  }

  function tweakScale(mult) {
    if (!braceLoaded) return setStatus("Load Brace first.");
    brace.scale.multiplyScalar(mult);
    brace.updateWorldMatrix(true, true);

    markPoseEdited("manual scale");
    appendInteraction("manual_scale", { scaleMultiplier: Number(mult.toFixed(4)) });
    if (torso && !poseLocked) autoAlignBraceToTorsoSmart();
    updateSlicing();
    scheduleRealtimeHeatmap({ fast: true });
    setStatus("✅ Manual scale tweak applied (pose preserved for heatmap).");
  }

  nxm?.addEventListener("click", () => nudgeBrace(-NUDGE_STEP, 0, 0));
  nxp?.addEventListener("click", () => nudgeBrace(+NUDGE_STEP, 0, 0));
  nym?.addEventListener("click", () => nudgeBrace(0, -NUDGE_STEP, 0));
  nyp?.addEventListener("click", () => nudgeBrace(0, +NUDGE_STEP, 0));
  nzm?.addEventListener("click", () => nudgeBrace(0, 0, -NUDGE_STEP));
  nzp?.addEventListener("click", () => nudgeBrace(0, 0, +NUDGE_STEP));

  rxm?.addEventListener("click", () => rotateFine(new THREE.Vector3(1, 0, 0), -ROT_FINE_DEG));
  rxp?.addEventListener("click", () => rotateFine(new THREE.Vector3(1, 0, 0), +ROT_FINE_DEG));
  rym?.addEventListener("click", () => rotateFine(new THREE.Vector3(0, 1, 0), -ROT_FINE_DEG));
  ryp?.addEventListener("click", () => rotateFine(new THREE.Vector3(0, 1, 0), +ROT_FINE_DEG));
  rzm?.addEventListener("click", () => rotateFine(new THREE.Vector3(0, 0, 1), -ROT_FINE_DEG));
  rzp?.addEventListener("click", () => rotateFine(new THREE.Vector3(0, 0, 1), +ROT_FINE_DEG));

  scaleDownBtn?.addEventListener("click", () => tweakScale(1 / SCALE_FACTOR));
  scaleUpBtn?.addEventListener("click", () => tweakScale(SCALE_FACTOR));

  function scheduleLandmarkRefreshFromTension() {
    if (!torso) return;
    clearTimeout(tensionLandmarkTimer);
    tensionLandmarkTimer = setTimeout(() => {
      if (!torso) return;
      const refreshed = identifyLandmarks(getSelectedLandmarkProfile().id);
      if (!refreshed?.points?.length) return;
      currentLandmarks = refreshed;
      drawLandmarkMarkers(refreshed);
      renderLandmarkTable(refreshed);
      scheduleTorsoHeatmapUpdate(20);
    }, 180);
  }

  function mapTensionFactor(rawFactor) {
    const raw = clamp(Number(rawFactor) || 1.0, 0.88, 1.12);
    // Tightening needs more authority than loosening to reduce large loose gaps.
    if (raw <= 1.0) return clamp(1.0 - (1.0 - raw) * 1.15, 0.85, 1.0);
    return clamp(1.0 + (raw - 1.0) * 0.65, 1.0, 1.08);
  }

  function tensionLabelFromFit(fit) {
    if (!fit) return "Balanced";
    if (fit.tightPct > 12) return "Too Tight";
    if (fit.loosePct > 35) return "Too Loose";
    return "Balanced";
  }

  function summarizeLandmarkContact(lm) {
    const pts = lm?.points || [];
    let tight = 0;
    let ok = 0;
    let loose = 0;
    for (const p of pts) {
      const band = clearanceBand(p.clearance);
      if (band === "tight") tight++;
      else if (band === "ok") ok++;
      else if (band === "loose") loose++;
    }
    return { tight, ok, loose, total: pts.length };
  }

  async function refreshFitAndLandmarksAfterManual(isStale, sampleBudget = 400) {
    const res = await heatmapFast({ highRes: false, analysisOnly: true, fast: true, sampleBudget });
    if (isStale()) return;
    const score = computeFitScore(res.tightPct, res.loosePct, res.okPct);
    const recommendation = computeRecommendation(res.tightPct, res.loosePct, score, res.okPct);
    lastFit = { ...res, score, recommendation, highRes: false };
    lastFit.clinical = interpretClinical(lastFit);
    updateCEO(lastFit);
    if (tensionValEl) tensionValEl.textContent = tensionLabelFromFit(lastFit);

    const refreshed = identifyLandmarks(getSelectedLandmarkProfile().id);
    if (isStale()) return;
    if (refreshed) {
      currentLandmarks = refreshed;
      drawLandmarkMarkers(refreshed);
      renderLandmarkTable(refreshed);
    }
    pushClinicalStatus(lastFit);
    updateSlicing();
    if (skinHeatmapActive) scheduleTorsoHeatmapUpdate(30);
  }

  function applyAbsoluteClothingFit() {
    if (!brace || !torso || !braceLoaded) return false;
    if (!ensureTensionBaseScale()) return false;

    // Tension slider controls overall uniform tightness
    const factor = clamp(Number(tensionSlider?.value) || 1.0, 0.7, 1.12);

    // Penetration slider controls aggressive front/back crushing
    const depthM = getPenetrationDepth();

    torso.updateWorldMatrix(true, true);
    const tBox = new THREE.Box3().setFromObject(torso);
    const tSize = tBox.getSize(new THREE.Vector3());

    // Front/back crush ratio (Z axis)
    const zCrushRatio = clamp(1.0 - (depthM / Math.max(tSize.z, 0.1)), 0.3, 1.0);

    keepBraceWorldCenter(() => {
      brace.scale.x = tensionBaseScale.x * factor;                 // rib squeeze
      brace.scale.z = tensionBaseScale.z * factor * zCrushRatio;   // chest/spine crush
      brace.scale.y = tensionBaseScale.y;                          // keep height
    });

    // Re-lock to torso center immediately (prevents floating/drift)
    autoAlignBraceToTorsoSmart();

    brace.updateWorldMatrix(true, true);
    return true;
  }


  // =========================================================
  // Unified brace pose apply (manual + Smart Fit)
  // =========================================================
  function applyBracePoseFromControls(reason = "manual_adjust") {
    const ok = applyAbsoluteClothingFit();
    if (!ok) return false;
    markPoseEdited(reason);
    poseLocked = true;
    return true;
  }

  function applySmartFitCandidate(tensionFactor, penetrationDepthM) {
    if (!brace || !torso || !braceLoaded) return false;
    if (!ensureTensionBaseScale()) return false;

    const t = clamp(Number(tensionFactor) || 1.0, 0.7, 1.12);
    const p = clamp(Number(penetrationDepthM) || 0, 0, MAX_PENETRATION_M);
    if (tensionSlider) tensionSlider.value = String(t);
    if (penetrationSlider) {
      const sliderMax = Number(penetrationSlider.max);
      const sliderUsesMm = Number.isFinite(sliderMax) && sliderMax > 1;
      penetrationSlider.value = sliderUsesMm ? String(Math.round(p * 1000)) : String(p);
    }
    if (tensionValEl) {
      tensionValEl.textContent = t < 0.97 ? "Tightening..." : t > 1.03 ? "Loosening..." : "Balanced";
    }
    if (penetrationValEl) penetrationValEl.textContent = `${(p * 1000).toFixed(1)}mm`;
    return applyAbsoluteClothingFit();
  }

  tensionSlider?.addEventListener("input", async () => {
    if (!brace || !torso || !braceLoaded) return;

    const seq = ++tensionSeq;
    penetrationSeq++;
    const factor = clamp(Number(tensionSlider.value), 0.7, 1.12);

    if (!ensureTensionBaseScale()) return;

    if (tensionValEl) {
      tensionValEl.textContent = factor < 0.97 ? "Tightening..." : factor > 1.03 ? "Loosening..." : "Balanced";
    }

    if (!applyBracePoseFromControls("clinical tension")) return;
    appendInteraction("tension_adjusted", {
      factor: Number(factor.toFixed(3)),
      axis: "z"
    });

    try {
      await refreshFitAndLandmarksAfterManual(() => seq !== tensionSeq, 300);
    } catch (e) {
      console.error(e);
    }
  });

  penetrationSlider?.addEventListener("input", async () => {
    const depth = getPenetrationDepth();
    if (penetrationValEl) penetrationValEl.textContent = `${(depth * 1000).toFixed(1)}mm`;
    if (!brace || !torso || !braceLoaded) return;
    if (!ensureTensionBaseScale()) {
      console.warn("Penetration slider skipped: tension baseline unavailable");
      return;
    }

    const seq = ++penetrationSeq;
    tensionSeq++;
    if (!applyBracePoseFromControls("manual penetration")) return;
    appendInteraction("penetration_adjusted", {
      depthMm: Number((depth * 1000).toFixed(2)),
      axis: "z"
    });

    try {
      await refreshFitAndLandmarksAfterManual(() => seq !== penetrationSeq, 360);
    } catch (e) {
      console.error(e);
    }
  });

  // =========================
  // Rotation apply
  // =========================
  function applyNextRotation() {
    if (!braceLoaded) return setStatus("Load Brace first.");
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");
    if (orientationLocked) return setStatus("🔒 Orientation locked.");

    const yi = Math.floor(rotIndex / (PITCHES.length * ROLLS.length)) % YAWS.length;
    const pi = Math.floor(rotIndex / ROLLS.length) % PITCHES.length;
    const ri = rotIndex % ROLLS.length;

    const yaw = YAWS[yi];
    const pitch = PITCHES[pi];
    const roll = ROLLS[ri];

    setBraceRotationEuler(yaw, pitch, roll);
    fixBraceAfterRotation("rotation cycle");

    if (rotLabelEl) rotLabelEl.textContent = rotLabelText(yaw, pitch, roll);
    rotIndex = (rotIndex + 1) % (YAWS.length * PITCHES.length * ROLLS.length);
    appendInteraction("rotation_cycle", { yaw, pitch, roll });
    setStatus("✅ Rotation applied & stabilized. Now run Smart Fit for heatmap (pose preserved).");
  }
  rotateNextBtn?.addEventListener("click", applyNextRotation);

  // =========================
  // Reset / Lock
  // =========================
  function snapshotAIFit() {
    if (!brace) return;
    aiFitSnapshot = { pos: brace.position.clone(), quat: brace.quaternion.clone(), scale: brace.scale.clone() };
  }

  function resetToAIFit() {
    if (!braceLoaded || !aiFitSnapshot) return setStatus("Run Smart Fit first (no AI baseline yet).");
    brace.position.copy(aiFitSnapshot.pos);
    brace.quaternion.copy(aiFitSnapshot.quat);
    brace.scale.copy(aiFitSnapshot.scale);
    brace.updateWorldMatrix(true, true);
    braceUserQuat.copy(brace.quaternion);
    resetTensionControl();

    orientationLocked = false;
    unlockPose("reset");
    if (rotateNextBtn) rotateNextBtn.disabled = false;
    if (lockFitBtn) lockFitBtn.disabled = false;
    if (highResBtn) highResBtn.disabled = true;

    preservePose = true;
    preservePoseReason = "reset baseline";
    appendInteraction("reset_to_ai", {});
    updateSlicing();
    setStatus("↩️ Reset to AI Fit ✅ (pose preserved for heatmap)");
  }

  function lockAndFinalizeFit() {
    if (!braceLoaded) return setStatus("Load Brace first.");
    if (!poseLocked) {
      autoAlignBraceToTorsoSmart();
    }

    snapshotAIFit();
    orientationLocked = true;

    if (rotateNextBtn) rotateNextBtn.disabled = true;
    if (lockFitBtn) lockFitBtn.disabled = true;
    if (highResBtn) highResBtn.disabled = false;

    markPoseEdited("locked");
    appendInteraction("lock_fit", {});
    updateSlicing();

    setStatus("🔒 Fit Locked. Orientation finalized for clinical analysis.");
    pushBot("Orientation locked ✅ High-Res Scan is now available.");
  }

  resetToAIBtn?.addEventListener("click", resetToAIFit);
  lockFitBtn?.addEventListener("click", lockAndFinalizeFit);

  // =========================
  // Clinical UI
  // =========================
  function clearClinicalClasses() {
    ceoClinicalEl?.classList.remove("clinical-ok", "clinical-warn", "clinical-bad");
    aiExplainEl?.classList.remove("clinical-ok", "clinical-warn", "clinical-bad");
    if (alertBox) alertBox.className = "alert-neutral";
  }

  function clinicalSeverity(clinical) {
    if (!clinical) return "ok";
    const label = (clinical.clinicalLabel || "").trim();
    const hasTargetMismatch = (clinical.warnings || []).some((w) =>
      String(w).toLowerCase().includes("low pressure in target zone")
    );
    if (hasTargetMismatch) return "bad";
    if (label.startsWith("❌")) return "bad";
    if (label.startsWith("⚠️")) return "warn";
    return "ok";
  }

  function applyClinicalUI(clinical) {
    clearClinicalClasses();

    const sev = clinicalSeverity(clinical);
    const cls = sev === "bad" ? "clinical-bad" : sev === "warn" ? "clinical-warn" : "clinical-ok";

    ceoClinicalEl?.classList.add(cls);
    aiExplainEl?.classList.add(cls);

    if (sev === "bad") {
      alertBox?.classList.add("alert-bad");
      if (alertStatus) alertStatus.textContent = "CRITICAL: Target Zone Mismatch / Weak Fit";
    } else if (sev === "warn") {
      alertBox?.classList.add("alert-warn");
      if (alertStatus) alertStatus.textContent = "WARNING: Review Design Intent";
    } else {
      alertBox?.classList.add("alert-good");
      if (alertStatus) alertStatus.textContent = "SUCCESS: Clinically plausible";
    }

    const warnings = clinical?.warnings || [];
    const notes = clinical?.notes || [];

    let text = "";
    if (warnings.length) text += "Warnings:\n- " + warnings.join("\n- ") + "\n";
    if (notes.length) text += (text ? "\n" : "") + "Notes:\n- " + notes.join("\n- ");
    if (clinicalWarningsEl) clinicalWarningsEl.textContent = text || "";
  }

  function updateLiveDashboard(_fit) {
    // Clinical assessment overlay intentionally removed from viewport UI.
    const dash = document.getElementById("clinicalDashboard");
    if (dash) dash.remove();
  }

  function checkProductionReady(score) {
    if (!productionSignOffBtn) return;
    productionSignOffBtn.style.display = Number.isFinite(score) && score >= 85 ? "block" : "none";
  }

  function updateCEO(m) {
    if (ceoScoreEl) ceoScoreEl.textContent = `${m.score}/100`;
    if (ceoMetricsEl) ceoMetricsEl.textContent = `Tight ${m.tightPct}% | OK ${m.okPct}% | Loose ${m.loosePct}%`;
    if (tightHUDEl) tightHUDEl.textContent = `${m.tightPct}%`;
    if (okHUDEl) okHUDEl.textContent = `${m.okPct}%`;
    if (looseHUDEl) looseHUDEl.textContent = `${m.loosePct}%`;
    if (ceoRecEl) ceoRecEl.textContent = `${m.recommendation}`;
    if (ceoClinicalEl) ceoClinicalEl.textContent = `Clinical: ${m.clinical?.clinicalLabel || "—"}`;
    if (assessmentStatusHUDEl) assessmentStatusHUDEl.textContent = m.clinical?.clinicalLabel || "Awaiting Fit";
    applyClinicalUI(m.clinical);
    updateLiveDashboard(m);
    if (navAssessmentTrigger) navAssessmentTrigger.textContent = `📊 Live Assessment (${m.score}/100)`;

    navAssessmentTrigger?.classList.remove("clinical-alert-active");
    const hasHighPressure = m.tightPct > 10 || (m.clinical?.warnings?.some((w) => String(w).toLowerCase().includes("pressure")));
    if (hasHighPressure) {
      navAssessmentTrigger?.classList.add("clinical-alert-active");
      navAssessmentTrigger && (navAssessmentTrigger.style.color = "#ef4444");
      if (tensionSlider) tensionSlider.style.accentColor = "#ef4444";
      setStatus("⚠️ CRITICAL: High pressure detected. Review Live Assessment.");
      if (typeof voiceOn !== "undefined" && voiceOn) speak("Warning. High pressure zones detected.");
    } else if (navAssessmentTrigger) {
      if (tensionSlider) tensionSlider.style.accentColor = "var(--accent-blue)";
      if (m.score >= 85) navAssessmentTrigger.style.color = "#22c55e";
      else if (m.score >= 70) navAssessmentTrigger.style.color = "#f59e0b";
      else navAssessmentTrigger.style.color = "#ef4444";
    }

    checkProductionReady(m.score);
    scheduleTorsoHeatmapUpdate();
  }

  function resetClinicalReadout() {
    if (ceoScoreEl) ceoScoreEl.textContent = "0/100";
    if (ceoMetricsEl) ceoMetricsEl.textContent = "Tight 0% | OK 0% | Loose 0%";
    if (tightHUDEl) tightHUDEl.textContent = "0%";
    if (okHUDEl) okHUDEl.textContent = "0%";
    if (looseHUDEl) looseHUDEl.textContent = "0%";
    if (ceoRecEl) ceoRecEl.textContent = "Awaiting AI optimization...";
    if (ceoClinicalEl) ceoClinicalEl.textContent = "Clinical: —";
    if (assessmentStatusHUDEl) assessmentStatusHUDEl.textContent = "Awaiting Fit";
    if (aiExplainEl) aiExplainEl.textContent = "AI Explanation: —";
    if (clinicalWarningsEl) clinicalWarningsEl.textContent = "";
    clearClinicalClasses();
    navAssessmentTrigger?.classList.remove("clinical-alert-active");
    if (navAssessmentTrigger) {
      navAssessmentTrigger.style.color = "";
      navAssessmentTrigger.textContent = "📊 Live Assessment";
    }
    if (tensionSlider) tensionSlider.style.accentColor = "var(--accent-blue)";
    checkProductionReady(Number.NaN);
    if (alertStatus) alertStatus.textContent = "Status: Waiting for Fit…";
    updateNeuralAuditHUD(Number.NaN, null, "Awaiting Scan");
    setProductionSeal(false);
    setPulse(false, false);
    updateLiveDashboard(null);
  }

  function makeOfflineAIExplanation(m) {
    const band = m.score >= 85 ? "strong" : m.score >= 65 ? "moderate" : "weak";
    const a = m.tightPct > 8 ? `High pressure zones (tight=${m.tightPct}%).` : `Tight contact controlled (tight=${m.tightPct}%).`;
    const b = m.loosePct > 70 ? `Clearance excessive (loose=${m.loosePct}%) → unstable.` : `Clearance acceptable (loose=${m.loosePct}%).`;

    const action =
      m.recommendation.includes("Too tight") ? "Next: relieve tight zones, re-run Smart Fit."
      : m.recommendation.includes("Too loose") ? "Next: resize/redesign to reduce clearance, re-run Smart Fit."
      : "Next: proceed to manufacturing review.";

    const z = m.zones || {};
    const zoneLines = [
      `Zones: UpperTrim tight ${z.upperTrimTightPct ?? "—"}% | LowerTrim tight ${z.lowerTrimTightPct ?? "—"}%`,
      `Working: Thoracic tight ${z.thoracicTightPct ?? "—"}% | Lumbar tight ${z.lumbarTightPct ?? "—"}%`
    ];

    const reliefMsg =
      (z.upperTrimTightPct >= RELIEF_SUGGEST_PCT || z.lowerTrimTightPct >= RELIEF_SUGGEST_PCT)
        ? "Relief Suggested: Trim zones show high tight %. Magenta highlights indicate suggested relief."
        : "Relief Suggested: —";

    const poseLine = preservePose ? `Pose: Preserved (${preservePoseReason || "user pose"})` : "Pose: AI-aligned";

    return `AI Fit Interpretation (offline)

${poseLine}

Overall fit is ${band} (Score: ${m.score}/100).
${a}
${b}

${zoneLines.join("\n")}
${reliefMsg}

Decision: ${m.recommendation}
${action}`;
  }

  function pushClinicalStatus(fit) {
    if (!fit) return;
    const now = Date.now();
    if (now - lastClinicalStatusLogT < 1200) return;
    lastClinicalStatusLogT = now;

    const status = fit.score >= 85 ? "OPTIMAL" : fit.score >= 70 ? "MODERATE" : "INSUFFICIENT";
    logAgent(
      `Biomechanical Update: ${status} fit | OK ${fit.okPct}% | Tight ${fit.tightPct}% | Loose ${fit.loosePct}%`
    );
    if (fit.tightPct > 12) {
      pushBot("⚠️ Clinical Alert: Localized pressure risk detected.");
    }
  }

  // =========================
  // Heatmap
  // =========================
  function distToColor(d, band, reliefOn) {
    if (reliefOn && (band === "upperTrim" || band === "lowerTrim") && d <= TIGHT) return [1, 0.0, 1];
    if (d <= TIGHT) return [1, 0.1, 0.1];
    if (d <= OK) {
      const t = (d - TIGHT) / Math.max(1e-6, OK - TIGHT);
      return [1 - t, 0.8, 0.2];
    }
    if (d <= 0.025) {
      const t = (d - OK) / Math.max(1e-6, 0.025 - OK);
      return [0.2, 0.9 - 0.3 * t, 0.2 + 0.8 * t];
    }
    return [0.1, 0.4, 1];
  }

  async function heatmapFast(opts = {}) {
    const highRes = !!opts.highRes;
    const analysisOnly = !!opts.analysisOnly;
    const fast = !!opts.fast;
    if (!torso || !brace) throw new Error("heatmapFast requires torso+brace");

    const torsoMeshes = [];
    torso.traverse((c) => c.isMesh && torsoMeshes.push(c));
    const braceMeshes = [];
    brace.traverse((c) => c.isMesh && braceMeshes.push(c));

    const tBox = new THREE.Box3().setFromObject(torso);
    const tSize = tBox.getSize(new THREE.Vector3());

    raycaster.near = 0;
    raycaster.far = MAX_RAY;

    const worldPos = new THREE.Vector3();
    const worldN = new THREE.Vector3();
    const nMat = new THREE.Matrix3();

    let total = 0, tight = 0, ok = 0, loose = 0;

    const zones = {
      upperTrim: { samples: 0, tight: 0, ok: 0, loose: 0 },
      lowerTrim: { samples: 0, tight: 0, ok: 0, loose: 0 },
      thoracic: { samples: 0, tight: 0, ok: 0, loose: 0 },
      lumbar: { samples: 0, tight: 0, ok: 0, loose: 0 },
      mid: { samples: 0, tight: 0, ok: 0, loose: 0 }
    };

    for (const mesh of braceMeshes) {
      if (!analysisOnly) {
        ensureVertexColors(mesh);
      } else if (mesh.geometry && !mesh.geometry.attributes?.normal) {
        mesh.geometry.computeVertexNormals();
      }

      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      const nor = geo.attributes.normal;
      const col = analysisOnly ? null : geo.attributes.color;

      const sampleBudget = typeof opts.sampleBudget === "number"
        ? Math.max(50, opts.sampleBudget | 0)
        : (fast ? MANUAL_HEATMAP_SAMPLE_BUDGET : 5000);
      const step = highRes ? 1 : Math.max(10, Math.floor(pos.count / sampleBudget));
      const YIELD_EVERY = highRes ? 500 : fast ? 1000 : 200;

      mesh.updateWorldMatrix(true, false);
      nMat.getNormalMatrix(mesh.matrixWorld);

      let processed = 0;

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

        const d = Number.isFinite(best) ? best : MAX_RAY;

        total++;
        let cls = "loose";
        if (d <= TIGHT) { tight++; cls = "tight"; }
        else if (d <= OK) { ok++; cls = "ok"; }
        else { loose++; cls = "loose"; }

        const relH = (worldPos.y - tBox.min.y) / Math.max(1e-6, tSize.y);
        const band = bandOf(relH);

        zones[band].samples++;
        zones[band][cls]++;

        if (!analysisOnly && col) {
          const [r, g, b] = distToColor(d, band, reliefActive);
          col.setXYZ(i, r, g, b);
        }

        processed++;
        if (processed % YIELD_EVERY === 0) {
          setStatus(`${highRes ? "High-Res" : "Heatmap"}… ${i}/${pos.count}`);
          await yieldUI();
        }
      }

      if (!analysisOnly && col) {
        for (let i = 0; i < pos.count; i++) {
          if (i % step !== 0) {
            const j = Math.floor(i / step) * step;
            col.setXYZ(i, col.getX(j), col.getY(j), col.getZ(j));
          }
        }

        col.needsUpdate = true;
        updateSlicing();
        await yieldUI();
      }
    }

    const tightPct = total ? Math.round((tight / total) * 100) : 0;
    const okPct = total ? Math.round((ok / total) * 100) : 0;
    const loosePct = total ? Math.round((loose / total) * 100) : 0;

    const zoneSummary = {
      upperTrimTightPct: pct(zones.upperTrim.tight, zones.upperTrim.samples),
      lowerTrimTightPct: pct(zones.lowerTrim.tight, zones.lowerTrim.samples),
      thoracicTightPct: pct(zones.thoracic.tight, zones.thoracic.samples),
      lumbarTightPct: pct(zones.lumbar.tight, zones.lumbar.samples)
    };

    return { total, tightPct, okPct, loosePct, zones: zoneSummary };
  }

  // =========================
  // Clinical interpretation
  // =========================
  function interpretClinical(fit) {
    const z = fit.zones || {};
    const warnings = [];
    const notes = [];
    const curveType = curveTypeEl?.value || "Neutral";

    if (fit.loosePct > 35) {
      warnings.push("Force Transmission Loss: Brace is too loose for effective correction.");
    }
    if (z.upperTrimTightPct > 10) {
      warnings.push("Comfort Risk: High pressure on upper trim line.");
    }
    if (curveType === "Right Thoracic" && (z.thoracicTightPct ?? 0) < 5) {
      warnings.push("❌ Ineffective Pressure Zone: thoracic contact too low for Right Thoracic.");
    }

    const lmSignals = getLandmarkClinicalSignals();
    for (const w of (lmSignals.warnings || [])) {
      if (!warnings.includes(w)) warnings.push(w);
    }
    for (const n of (lmSignals.notes || [])) {
      if (!notes.includes(n)) notes.push(n);
    }

    let clinicalLabel = "⚠️ Design Revision Required";
    if (fit.score >= 80 && warnings.length === 0 && fit.loosePct <= 35 && fit.tightPct <= MAX_TIGHT_PCT) clinicalLabel = "✅ Manufacturing Ready";
    if (fit.score < 70 || fit.loosePct >= 95) clinicalLabel = "❌ Clinical Failure";

    return { clinicalLabel, warnings, notes };
  }

  // =========================
  // Smart Fit
  // =========================
  async function runFullSmartFitSequence(opts = {}) {
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");
    if (heatmapBusy) return;

    const overridePoseLock = !!opts.overridePoseLock;
    const forceRefitRequested = !!opts.forceRefit;
    const hardPoseFreeze = orientationLocked || preservePose || (poseLocked && !overridePoseLock);
    const forceRefit = forceRefitRequested && !orientationLocked;
    const autoTighten =
      typeof opts.autoTighten === "boolean" ? opts.autoTighten : AUTO_TIGHTEN_ON_SMART_FIT;
    const targetScore =
      typeof opts.targetScore === "number" && Number.isFinite(opts.targetScore)
        ? opts.targetScore
        : TARGET_SCORE;
    const preservePosition = hardPoseFreeze
      ? true
      : (typeof opts.preservePosition === "boolean" ? opts.preservePosition : PRESERVE_POSITION_ON_AUTOFIT);
    const autoTightenMaxIters =
      typeof opts.autoTightenMaxIters === "number" && Number.isFinite(opts.autoTightenMaxIters)
        ? opts.autoTightenMaxIters
        : 6;
    const autoTightenAggressive = !!opts.autoTightenAggressive;
    const transformFrozen = hardPoseFreeze && !forceRefitRequested;
    const frozenTransform = transformFrozen && brace
      ? { pos: brace.position.clone(), quat: brace.quaternion.clone() }
      : null;
    const autoTightenEnabled = autoTighten && AUTO_TIGHTEN_CAN_SCALE;

    heatmapBusy = true;
    smartFitBtn && (smartFitBtn.disabled = true);
    autoTightenBtn && (autoTightenBtn.disabled = true);
    forceFit80Btn && (forceFit80Btn.disabled = true);
    deepOptimizeBtn && (deepOptimizeBtn.disabled = true);
    reportBtn && (reportBtn.disabled = true);
    reportPdfBtn && (reportPdfBtn.disabled = true);
    rotateNextBtn && (rotateNextBtn.disabled = true);
    lockFitBtn && (lockFitBtn.disabled = true);
    batchRunBtn && (batchRunBtn.disabled = true);
    highResBtn && (highResBtn.disabled = true);
    demoRecoveryBtn && (demoRecoveryBtn.disabled = true);
    clinicalSnapBtn && (clinicalSnapBtn.disabled = true);
    demoResetBtn && (demoResetBtn.disabled = true);
    ceoCinematicBtn && (ceoCinematicBtn.disabled = true);

    document.body.classList.add("ai-active");
    smartStatus?.classList.add("scanning");

    try {
      appendInteraction("smart_fit_started", {
        autoTighten: !!autoTighten,
        aggressive: !!autoTightenAggressive,
        targetScore,
        preservePosition
      });
      const poseLockActive = poseLocked && !overridePoseLock;
      const doPreserve =
        transformFrozen || preservePosition || (!forceRefit && (preservePose || orientationLocked || poseLockActive));

      if (!doPreserve) {
        setSmart("Smart Fit: Pose Estimation (Geometric Pulse) …");
        await runGeometricPulse();
        await yieldUI();

        setSmart("Smart Fit: Scaling + Clinical Align …");
        scaleBraceToTorsoFootprint();
        autoAlignBraceToTorsoSmart();
        await applyTopologicalShrinkWrap(0.006);
        applySmartFitCandidate(
          Number(tensionSlider?.value) || 1.0,
          getPenetrationDepth()
        );
        await yieldUI();

        snapshotAIFit();
        clearPoseEdited("last AI align");
      } else {
        const lockLabel = poseLockActive ? "locked" : "preserved";
        setSmart(`Smart Fit: Pose ${lockLabel} (${preservePoseReason || "current"}) …`);
        brace.updateWorldMatrix(true, true);
        braceUserQuat.copy(brace.quaternion);
        await yieldUI();
        snapshotAIFit();
      }

      if (zonesVisible) addZoneMarkersForTorso();

      setSmart("Smart Fit: Quick analysis …");
      const res = await heatmapFast({ highRes: false, analysisOnly: true, fast: true });

      const score = computeFitScore(res.tightPct, res.loosePct, res.okPct);
      const recommendation = computeRecommendation(res.tightPct, res.loosePct, score, res.okPct);
      lastFit = { ...res, score, recommendation, highRes: false };
      lastFit.clinical = interpretClinical(lastFit);

      let didFullHeatmap = false;
      if (autoTightenEnabled && lastFit.loosePct > TARGET_LOOSE_PCT) {
        if (poseLockActive || transformFrozen) {
          setSmart("Auto-tighten: pose locked, scaling in place…");
        }
        if (preservePose && lastFit.loosePct >= 80 && !preservePosition) {
          setSmart("Auto-tighten: fit too loose — overriding preserved pose…");
          await refitToTorsoBaseline();
        }
        setSmart(`Auto-tighten: reducing clearance (target ${targetScore}/100)…`);
        lastFit = await autoTightenToPrintReady(lastFit, {
          targetScore,
          preservePosition,
          maxIters: autoTightenMaxIters,
          aggressive: autoTightenAggressive
        });
        didFullHeatmap = true; // autoTightenToPrintReady runs a full heatmap
        if (!didFullHeatmap) {
          setSmart("Smart Fit: Heatmap + Fit Score …");
          const resFull = await heatmapFast({ highRes: false });
          const scoreFull = computeFitScore(resFull.tightPct, resFull.loosePct, resFull.okPct);
          const recommendationFull = computeRecommendation(resFull.tightPct, resFull.loosePct, scoreFull, resFull.okPct);
          lastFit = { ...resFull, score: scoreFull, recommendation: recommendationFull, highRes: false };
          lastFit.clinical = interpretClinical(lastFit);
          didFullHeatmap = true;
        }
      } else {
        setSmart("Smart Fit: Heatmap + Fit Score …");
        const resFull = await heatmapFast({ highRes: false });
        const scoreFull = computeFitScore(resFull.tightPct, resFull.loosePct, resFull.okPct);
        const recommendationFull = computeRecommendation(resFull.tightPct, resFull.loosePct, scoreFull, resFull.okPct);
        lastFit = { ...resFull, score: scoreFull, recommendation: recommendationFull, highRes: false };
        lastFit.clinical = interpretClinical(lastFit);
        didFullHeatmap = true;
      }

      const refreshedLandmarks = identifyLandmarks(getSelectedLandmarkProfile().id);
      if (refreshedLandmarks?.points?.length) {
        currentLandmarks = refreshedLandmarks;
        drawLandmarkMarkers(refreshedLandmarks);
        renderLandmarkTable(refreshedLandmarks);
        lastFit.clinical = interpretClinical(lastFit);
      }

      stabilizeBraceVisibilityAndScale();
      updateCEO(lastFit);
      if (aiExplainEl) aiExplainEl.textContent = makeOfflineAIExplanation(lastFit);
      appendInteraction("smart_fit_completed", {
        score: lastFit.score,
        tightPct: lastFit.tightPct,
        okPct: lastFit.okPct,
        loosePct: lastFit.loosePct,
        highRes: !!lastFit.highRes
      });

      updateSlicing();
      resetTensionControl();

      setSmart("Smart Fit: complete ✅");
      setStatus(doPreserve ? "✅ Heatmap generated on current stable rotation (no auto-move)." : "✅ Smart Fit complete (AI align + heatmap).");
      if (reportBtn) reportBtn.disabled = false;

      if (rotateNextBtn) rotateNextBtn.disabled = orientationLocked;
      if (lockFitBtn) lockFitBtn.disabled = orientationLocked;
    } catch (e) {
      console.error(e);
      setSmart("Smart Fit: failed ❌");
      setStatus("❌ Smart Fit failed (see console).");
    } finally {
      if (frozenTransform && brace) {
        brace.position.copy(frozenTransform.pos);
        brace.quaternion.copy(frozenTransform.quat);
        brace.updateWorldMatrix(true, true);
        braceUserQuat.copy(brace.quaternion);
        updateSlicing();
      }

      heatmapBusy = false;
      if (smartFitBtn) smartFitBtn.disabled = false;
      if (autoTightenBtn) autoTightenBtn.disabled = !braceLoaded;
      if (forceFit80Btn) forceFit80Btn.disabled = !braceLoaded;
      if (deepOptimizeBtn) deepOptimizeBtn.disabled = !braceLoaded;
      if (batchRunBtn) batchRunBtn.disabled = false;
      if (rotateNextBtn) rotateNextBtn.disabled = !braceLoaded || orientationLocked;
      if (lockFitBtn) lockFitBtn.disabled = !braceLoaded || orientationLocked;
      if (demoRecoveryBtn) demoRecoveryBtn.disabled = !braceLoaded;
      if (clinicalSnapBtn) clinicalSnapBtn.disabled = !braceLoaded;
      if (demoResetBtn) demoResetBtn.disabled = !braceLoaded;
      if (ceoCinematicBtn) ceoCinematicBtn.disabled = !braceLoaded;
      if (reportPdfBtn) reportPdfBtn.disabled = !lastFit;

      document.body.classList.remove("ai-active");
      smartStatus?.classList.remove("scanning");

      const shouldAutoSnap =
        AUTO_SNAP_ON_SEVERE_LOOSE &&
        !demoRunning &&
        !heatmapBusy &&
        !!lastFit &&
        Number.isFinite(lastFit.loosePct) &&
        lastFit.loosePct > AUTO_SNAP_THRESHOLD_PCT &&
        Date.now() > autoSnapCooldownUntil &&
        !autoSnapQueued;

      if (shouldAutoSnap) {
        autoSnapQueued = true;
        autoSnapCooldownUntil = Date.now() + AUTO_SNAP_COOLDOWN_MS;
        appendInteraction("auto_snap_queued", {
          loosePct: lastFit.loosePct,
          threshold: AUTO_SNAP_THRESHOLD_PCT
        });
        pushBot("Clinical Failure detected (high clearance). Running Clinical Snap...");
        setTimeout(() => {
          autoSnapQueued = false;
          if (heatmapBusy || demoRunning || !braceLoaded) return;
          void clinicalSnapToLandmarks({ goalKey: "correction95", source: "auto" });
        }, AUTO_SNAP_DELAY_MS);
      }
    }
  }

  smartFitBtn?.addEventListener("click", () => {
    void runDeepOptimizeSequence();
  });
  autoTightenBtn?.addEventListener("click", () =>
    runFullSmartFitSequence({ autoTighten: true, targetScore: TARGET_SCORE, preservePosition: true })
  );
  forceFit80Btn?.addEventListener("click", () =>
    runFullSmartFitSequence({
      autoTighten: true,
      targetScore: TARGET_SCORE,
      preservePosition: true,
      forceRefit: false,
      overridePoseLock: false,
      autoTightenAggressive: true,
      autoTightenMaxIters: 12
    })
  );
  deepOptimizeBtn?.addEventListener("click", () => {
    void runDeepOptimizeSequence();
  });

  async function clinicalSnapToLandmarks(opts = {}) {
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");
    if (heatmapBusy || demoRunning) return;

    const goal = SNAP_GOAL_PRESETS[opts.goalKey] || getSnapGoalPreset();

    demoRunning = true;
    if (demoRecoveryBtn) demoRecoveryBtn.disabled = true;
    if (clinicalSnapBtn) clinicalSnapBtn.disabled = true;
    if (demoResetBtn) demoResetBtn.disabled = true;
    if (ceoCinematicBtn) ceoCinematicBtn.disabled = true;

    try {
      appendInteraction("clinical_snap_started", {
        goal: goal.key,
        source: opts.source || "manual"
      });

      const profile = getSelectedLandmarkProfile();
      let lm = currentLandmarks;
      if (!lm || !Number.isFinite(lm?.clearance?.avg)) {
        setStatus("🧭 AI: Identifying anatomical anchors...");
        lm = identifyLandmarks(profile.id);
        if (!lm) {
          setStatus("❌ Identification Failed: Cannot find skin surface.");
          return;
        }
        currentLandmarks = lm;
        drawLandmarkMarkers(lm);
        renderLandmarkTable(lm);
      }

      let currentClearance = Number(lm.clearance?.avg);
      if (!Number.isFinite(currentClearance)) {
        setStatus("❌ Identification Failed: Landmark clearance unavailable.");
        return;
      }

      setStatus(`🧭 AI: Closing clearance gap (${goal.label})...`);
      const targetClearance = goal.targetClearanceMm / 1000;
      const snapStartClearance = currentClearance;
      const MAX_SNAP_PASSES = 4;

      for (let pass = 0; pass < MAX_SNAP_PASSES; pass++) {
        if (!Number.isFinite(currentClearance)) break;
        if (currentClearance <= targetClearance * 1.25) break;

        const shrinkFactor = computeClinicalSnapFactor(currentClearance, targetClearance);
        if (shrinkFactor >= 0.999) break;

        setStatus(
          `🧭 Clinical Snap: pass ${pass + 1}/${MAX_SNAP_PASSES} | ` +
          `clearance ${formatMm(currentClearance)} -> scale ${(shrinkFactor * 100).toFixed(1)}%...`
        );
        keepBraceWorldCenter(() => {
          brace.scale.multiplyScalar(shrinkFactor);
        });
        brace.updateWorldMatrix(true, true);
        markPoseEdited("clinical snap");
        updateSlicing();
        await yieldUI();

        const refreshedLandmarks = identifyLandmarks(profile.id);
        if (!refreshedLandmarks) break;
        currentLandmarks = refreshedLandmarks;
        drawLandmarkMarkers(refreshedLandmarks);
        renderLandmarkTable(refreshedLandmarks);
        currentClearance = Number(refreshedLandmarks.clearance?.avg);
      }

      setStatus("🤖 AI: Finalizing fit and regenerating heatmap...");
      await runFullSmartFitSequence({
        autoTighten: true,
        targetScore: goal.targetScore,
        preservePosition: false,
        forceRefit: true,
        overridePoseLock: true,
        autoTightenAggressive: goal.aggressive,
        autoTightenMaxIters: goal.autoTightenMaxIters
      });

      const refreshed = identifyLandmarks(getSelectedLandmarkProfile().id);
      if (refreshed) {
        currentLandmarks = refreshed;
        drawLandmarkMarkers(refreshed);
        renderLandmarkTable(refreshed);
      }

      appendInteraction("clinical_snap_completed", {
        goal: goal.key,
        startClearanceMm: Number.isFinite(snapStartClearance) ? Number((snapStartClearance * 1000).toFixed(2)) : null,
        endClearanceMm: Number.isFinite(refreshed?.clearance?.avg) ? Number((refreshed.clearance.avg * 1000).toFixed(2)) : null,
        score: lastFit?.score ?? null,
        loosePct: lastFit?.loosePct ?? null
      });

      const endClearance = refreshed?.clearance?.avg;
      const clearanceMsg = Number.isFinite(endClearance) ? ` | clearance ${formatMm(endClearance)}` : "";
      setStatus(`🧭 Clinical Snap complete (${goal.label})${clearanceMsg}. Score ${lastFit?.score ?? "—"}/100.`);
      pushBot(`Success ✅ Brace rectified. Fit Score: ${lastFit?.score ?? "—"}/100${clearanceMsg}.`);
    } catch (e) {
      console.error(e);
      appendInteraction("clinical_snap_failed", { message: e?.message || "unknown" });
      setStatus("❌ Clinical Snap failed (see console).");
    } finally {
      demoRunning = false;
      if (demoRecoveryBtn) demoRecoveryBtn.disabled = !braceLoaded;
      if (clinicalSnapBtn) clinicalSnapBtn.disabled = !braceLoaded;
      if (demoResetBtn) demoResetBtn.disabled = !braceLoaded;
      if (ceoCinematicBtn) ceoCinematicBtn.disabled = !braceLoaded;
    }
  }

  clinicalSnapBtn?.addEventListener("click", () => {
    void clinicalSnapToLandmarks();
  });

  async function runCEOCinematicDemo() {
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");
    if (heatmapBusy || demoRunning) return;

    demoRunning = true;
    if (ceoCinematicBtn) ceoCinematicBtn.disabled = true;
    if (demoRecoveryBtn) demoRecoveryBtn.disabled = true;
    if (clinicalSnapBtn) clinicalSnapBtn.disabled = true;
    if (demoResetBtn) demoResetBtn.disabled = true;

    try {
      appendInteraction("ceo_cinematic_started", {});
      pushBot("Initializing CEO Presentation Mode...");

      setPulse(true, false);
      setProductionSeal(false);
      controls.autoRotate = true;
      controls.autoRotateSpeed = 4.0;

      setStatus("🎬 CEO Demo: Phase 1/4 Landmark scan...");
      pushBot("Phase 1: Scanning anatomical landmarks...");
      autoLandmarksBtn?.click();
      await sleep(1600);

      setStatus("🎬 CEO Demo: Phase 2/4 Posterior alignment...");
      pushBot("Phase 2: Aligning posterior wall to torso surface...");
      controls.autoRotateSpeed = 1.2;
      autoAlignBraceToTorsoSmart();
      updateSlicing();
      await sleep(900);

      setStatus("🎬 CEO Demo: Phase 3/4 Smart Fit optimization...");
      pushBot("Phase 3: Running Smart Fit optimization...");
      if (assessmentMenuEl && !assessmentMenuEl.classList.contains("open")) {
        toggleMenu(assessmentMenuEl);
      }
      await runFullSmartFitSequence({
        autoTighten: true,
        targetScore: 90,
        preservePosition: true,
        autoTightenAggressive: false,
        autoTightenMaxIters: 6
      });
      await yieldUI();

      setStatus("🎬 CEO Demo: Phase 4/4 Structural audit...");
      pushBot("Phase 4: Running structural integrity audit...");
      const auditPassed = await runNeuralAuditSequence({ fromCinematic: true });

      controls.autoRotate = false;
      const finalScore = Number.isFinite(lastFit?.score) ? lastFit.score : "—";
      setStatus(`🎬 CEO Demo complete. Fit Score ${finalScore}/100.`);
      pushBot(
        auditPassed
          ? `Success: Fit Score ${finalScore}/100. Audit verified for production handover.`
          : `Completed: Fit Score ${finalScore}/100. Audit flagged risk; review required.`
      );
      appendInteraction("ceo_cinematic_completed", {
        score: lastFit?.score ?? null,
        tightPct: lastFit?.tightPct ?? null,
        okPct: lastFit?.okPct ?? null,
        loosePct: lastFit?.loosePct ?? null,
        auditPassed: !!auditPassed
      });
    } catch (e) {
      console.error(e);
      appendInteraction("ceo_cinematic_failed", { message: e?.message || "unknown" });
      setStatus("❌ CEO Demo failed (see console).");
    } finally {
      controls.autoRotate = false;
      setPulse(false, false);
      demoRunning = false;
      if (ceoCinematicBtn) ceoCinematicBtn.disabled = !braceLoaded;
      if (demoRecoveryBtn) demoRecoveryBtn.disabled = !braceLoaded;
      if (clinicalSnapBtn) clinicalSnapBtn.disabled = !braceLoaded;
      if (demoResetBtn) demoResetBtn.disabled = !braceLoaded;
    }
  }

  ceoCinematicBtn?.addEventListener("click", () => {
    void runCEOCinematicDemo();
  });

  async function runClinicalRecoveryDemo() {
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");
    if (heatmapBusy || demoRunning) return;

    demoRunning = true;
    if (demoRecoveryBtn) demoRecoveryBtn.disabled = true;
    if (clinicalSnapBtn) clinicalSnapBtn.disabled = true;
    if (demoResetBtn) demoResetBtn.disabled = true;
    if (ceoCinematicBtn) ceoCinematicBtn.disabled = true;

    try {
      appendInteraction("clinical_recovery_started", {});
      // 1) Respect manual pose if user already rotated/nudged.
      const preserveManualPose = preservePose || poseLocked || orientationLocked;
      setStatus(
        preserveManualPose
          ? "🎬 Demo: Manual pose preserved; running in-place recovery..."
          : "🎬 Demo: Authorizing AI Recovery..."
      );
      if (!preserveManualPose) {
        clearPoseEdited("refit");
        orientationLocked = false;
      }
      await yieldUI();

      // 2) Show baseline clinical failure first.
      setStatus("🎬 Demo: Identifying Clinical Failure...");
      await runFullSmartFitSequence({ forceRefit: !preserveManualPose });
      await yieldUI();

      // 3) Run autonomous recovery aggressively toward clinical target.
      setStatus("🎬 Demo: Triggering Autonomous Recovery...");
      await runFullSmartFitSequence({
        autoTighten: true,
        targetScore: 80,
        preservePosition: true,
        forceRefit: false,
        overridePoseLock: true,
        autoTightenAggressive: false,
        autoTightenMaxIters: 6
      });
      await yieldUI();

      // 4) Auto-audit at rib level in slice view.
      if (!slicingActive) toggleSliceBtn?.click();
      if (sliceSlider) {
        sliceSlider.value = "70";
        updateSlicing();
      }

      const reachedTarget =
        Number.isFinite(lastFit?.score) &&
        lastFit.score >= 80 &&
        String(lastFit?.clinical?.clinicalLabel || "").startsWith("✅");
      setStatus(
        reachedTarget
          ? `🎬 Demo: Recovery complete. Score ${lastFit.score}/100. Gap audited at rib level.`
          : `🎬 Demo: Recovery complete. Score ${lastFit?.score ?? "—"}/100. Gap audited at rib level.`
      );
      pushBot(
        reachedTarget
          ? `Clinical Recovery ✅ Score ${lastFit.score}/100. Design is now print-ready.`
          : `Clinical Recovery ⚠️ Score ${lastFit?.score ?? "—"}/100. Review required before print.`
      );
      appendInteraction("clinical_recovery_completed", {
        score: lastFit?.score ?? null,
        loosePct: lastFit?.loosePct ?? null,
        reachedTarget
      });
    } catch (e) {
      console.error(e);
      appendInteraction("clinical_recovery_failed", { message: e?.message || "unknown" });
      setStatus("❌ Clinical Recovery demo failed.");
    } finally {
      demoRunning = false;
      if (demoRecoveryBtn) demoRecoveryBtn.disabled = !braceLoaded;
      if (clinicalSnapBtn) clinicalSnapBtn.disabled = !braceLoaded;
      if (demoResetBtn) demoResetBtn.disabled = !braceLoaded;
      if (ceoCinematicBtn) ceoCinematicBtn.disabled = !braceLoaded;
    }
  }

  demoRecoveryBtn?.addEventListener("click", () => {
    void runClinicalRecoveryDemo();
  });

  async function runDemoReset() {
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");
    if (heatmapBusy || demoRunning) return;

    demoRunning = true;
    if (demoRecoveryBtn) demoRecoveryBtn.disabled = true;
    if (clinicalSnapBtn) clinicalSnapBtn.disabled = true;
    if (demoResetBtn) demoResetBtn.disabled = true;

    try {
      appendInteraction("demo_reset_started", {});
      setStatus("↺ Demo Reset: Restoring baseline...");
      clearPoseEdited("reset");
      orientationLocked = false;

      resetBraceToOriginal();
      await runGeometricPulse();
      scaleBraceToTorsoFootprint();
      autoAlignBraceToTorsoSmart();
      snapshotOriginalBrace();
      tensionBaseScale = brace.scale.clone();
      snapshotAIFit();
      resetTensionControl();

      rotIndex = 0;
      if (rotLabelEl) rotLabelEl.textContent = rotLabelText(0, 0, 0);
      if (rotateNextBtn) rotateNextBtn.disabled = false;
      if (lockFitBtn) lockFitBtn.disabled = false;
      if (highResBtn) highResBtn.disabled = true;
      if (reportBtn) reportBtn.disabled = true;
      if (reportPdfBtn) reportPdfBtn.disabled = true;
      if (smartStatus) smartStatus.textContent = "Smart Fit: idle";

      lastFit = null;
      currentLandmarks = null;
      autoSnapQueued = false;
      autoSnapCooldownUntil = 0;
      clearLandmarkMarkers();
      renderLandmarkTable(null);
      resetClinicalReadout();
      updateSlicing();
      frameToObjects([torso, brace], BOTH_FRAME_PADDING);
      controls.update();

      setStatus("✅ Demo reset complete. System ready for re-run.");
      pushBot("Demo Reset ✅ Baseline restored.");
      appendInteraction("demo_reset_completed", {});
    } catch (e) {
      console.error(e);
      appendInteraction("demo_reset_failed", { message: e?.message || "unknown" });
      setStatus("❌ Demo reset failed.");
    } finally {
      demoRunning = false;
      if (demoRecoveryBtn) demoRecoveryBtn.disabled = !braceLoaded;
      if (clinicalSnapBtn) clinicalSnapBtn.disabled = !braceLoaded;
      if (demoResetBtn) demoResetBtn.disabled = !braceLoaded;
    }
  }

  demoResetBtn?.addEventListener("click", () => {
    void runDemoReset();
  });

  // High-Res scan
  highResBtn?.addEventListener("click", async () => {
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");
    if (!orientationLocked) {
      setStatus("Locking current fit before High-Res scan…");
      lockAndFinalizeFit();
    }
    if (!orientationLocked) return setStatus("Lock Fit first to run High-Res scan.");
    if (heatmapBusy) return;

    heatmapBusy = true;
    if (smartFitBtn) smartFitBtn.disabled = true;
    if (reportBtn) reportBtn.disabled = true;
    if (reportPdfBtn) reportPdfBtn.disabled = true;
    if (batchRunBtn) batchRunBtn.disabled = true;
    if (rotateNextBtn) rotateNextBtn.disabled = true;
    if (lockFitBtn) lockFitBtn.disabled = true;
    if (highResBtn) highResBtn.disabled = true;

    try {
      appendInteraction("high_res_scan_started", {});
      setSmart("High-Res Scan: full vertex heatmap …");
      const res = await heatmapFast({ highRes: true });

      const score = computeFitScore(res.tightPct, res.loosePct, res.okPct);
      const recommendation = computeRecommendation(res.tightPct, res.loosePct, score, res.okPct);
      lastFit = { ...res, score, recommendation, highRes: true };
      lastFit.clinical = interpretClinical(lastFit);

      const refreshedLandmarks = identifyLandmarks(getSelectedLandmarkProfile().id);
      if (refreshedLandmarks?.points?.length) {
        currentLandmarks = refreshedLandmarks;
        drawLandmarkMarkers(refreshedLandmarks);
        renderLandmarkTable(refreshedLandmarks);
        lastFit.clinical = interpretClinical(lastFit);
      }

      updateCEO(lastFit);
      if (aiExplainEl) aiExplainEl.textContent = makeOfflineAIExplanation(lastFit);
      updateSlicing();

      const minEdge = estimateMinEdgeLength(brace);
      const minMm = Number.isFinite(minEdge) ? minEdge * 1000 : null;
      if (minThickEl) minThickEl.textContent = Number.isFinite(minMm) ? minMm.toFixed(2) : "—";
      applyManufacturingCheck(minMm);

      const scoreOk = Number.isFinite(lastFit?.score) && lastFit.score >= 85;
      const clinicalOk = String(lastFit?.clinical?.clinicalLabel || "").startsWith("✅");
      const thickOk = Number.isFinite(minMm) && minMm >= 2.0;
      const auditedPass = scoreOk && clinicalOk && thickOk;
      updateNeuralAuditHUD(minMm, auditedPass, auditedPass ? "VERIFIED" : "RISK DETECTED");
      setProductionSeal(auditedPass);

      setSmart("High-Res Scan: complete ✅");
      setStatus("✅ High-Res scan complete. Report is now higher confidence.");
      if (reportBtn) reportBtn.disabled = false;
      if (reportPdfBtn) reportPdfBtn.disabled = false;
      appendInteraction("high_res_scan_completed", {
        score: lastFit.score,
        tightPct: lastFit.tightPct,
        okPct: lastFit.okPct,
        loosePct: lastFit.loosePct
      });
    } catch (e) {
      console.error(e);
      appendInteraction("high_res_scan_failed", { message: e?.message || "unknown" });
      setSmart("High-Res Scan: failed ❌");
      setStatus("❌ High-Res scan failed (see console).");
    } finally {
      heatmapBusy = false;
      if (smartFitBtn) smartFitBtn.disabled = false;
      if (batchRunBtn) batchRunBtn.disabled = false;
      if (reportBtn) reportBtn.disabled = !lastFit;
      if (reportPdfBtn) reportPdfBtn.disabled = !lastFit;
      if (rotateNextBtn) rotateNextBtn.disabled = true;
      if (lockFitBtn) lockFitBtn.disabled = true;
      if (highResBtn) highResBtn.disabled = false;
    }
  });

  // Relief toggle
  function setRelief(on) {
    reliefActive = !!on;
    if (toggleReliefBtn) toggleReliefBtn.textContent = reliefActive ? "🟣 Relief: ON" : "🟣 Relief: OFF";
    setStatus(reliefActive ? "Relief highlighting ON (magenta on tight trim zones)" : "Relief highlighting OFF");
  }
  toggleReliefBtn?.addEventListener("click", () => setRelief(!reliefActive));

  // =========================
  // Screenshot + Report
  // =========================
  screenshotBtn?.addEventListener("click", () => {
    const a = document.createElement("a");
    a.download = "brace-visual-inspection.png";
    a.href = renderer.domElement.toDataURL("image/png");
    a.click();
  });

  function buildPrintableReportHtml(reportPayload, screenshotDataUrl = null) {
    const fit = reportPayload?.fittingKpis || {};
    const assess = reportPayload?.aiAssessment || {};
    const landmarks = reportPayload?.anatomicalLandmarks || {};
    const rows = (currentLandmarks?.points || [])
      .slice()
      .sort((a, b) => (b.yRel ?? 0) - (a.yRel ?? 0))
      .slice(0, 160)
      .map((p) => {
        const status = clearanceStatusForTable(p.clearance);
        const yPct = Math.round((p.yRel ?? 0) * 100);
        const clearanceMm = Number.isFinite(p.clearance) ? `${(p.clearance * 1000).toFixed(1)} mm` : "—";
        return `<tr>
          <td>${escapeHtml(p.label || p.id || "—")}</td>
          <td>${yPct}%</td>
          <td>${clearanceMm}</td>
          <td>${escapeHtml(status.text)}</td>
        </tr>`;
      }).join("");

    const warningHtml = (assess.warnings || []).length
      ? `<ul>${assess.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`
      : "<p>None</p>";

    const screenshotHtml = screenshotDataUrl
      ? `<div class="section"><h2>Viewport Snapshot</h2><img src="${screenshotDataUrl}" alt="Snapshot" /></div>`
      : "";

    const tableHtml = rows || `<tr><td colspan="4">Landmark rows unavailable. Run Auto Landmarks.</td></tr>`;

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>BraceViz Clinical Report</title>
  <style>
    body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; color: #0f172a; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    h2 { margin: 0 0 8px; font-size: 16px; }
    .meta { margin-bottom: 14px; color: #334155; font-size: 13px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc; }
    .k { font-size: 12px; color: #475569; margin-bottom: 4px; }
    .v { font-size: 14px; font-weight: 600; color: #0f172a; }
    .section { margin-top: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #e2e8f0; }
    ul { margin: 8px 0 0 18px; }
    img { width: 100%; max-height: 420px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px; background: #0b0f17; }
    @media print {
      body { margin: 10mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>BraceViz Clinical Report</h1>
  <div class="meta">
    Patient: ${escapeHtml(reportPayload?.patientMetadata?.id || "Unknown")} |
    Curve: ${escapeHtml(reportPayload?.patientMetadata?.curveType || "Neutral")} |
    Generated: ${escapeHtml(reportPayload?.generatedAt || new Date().toISOString())} |
    Type: ${escapeHtml(reportPayload?.reportType || "provisional")}
  </div>

  <div class="grid">
    <div class="card"><div class="k">Fit Score</div><div class="v">${fit.overallScore || "—"}</div></div>
    <div class="card"><div class="k">Contact Efficiency</div><div class="v">${escapeHtml(fit.contactEfficiency || "—")}</div></div>
    <div class="card"><div class="k">Clinical Label</div><div class="v">${escapeHtml(assess.label || "—")}</div></div>
    <div class="card"><div class="k">Landmark Anchors</div><div class="v">Rib ${landmarks.ribPct ?? "—"}% | Pelvis ${landmarks.pelvisPct ?? "—"}%</div></div>
  </div>

  <div class="section">
    <h2>Clinical Summary</h2>
    <p>${escapeHtml(assess.summary || "—")}</p>
    ${assess.landmarkSummary ? `<p><strong>Landmark Insight:</strong> ${escapeHtml(assess.landmarkSummary)}</p>` : ""}
  </div>

  <div class="section">
    <h2>Clinical Warnings</h2>
    ${warningHtml}
  </div>

  <div class="section">
    <h2>Landmark Clearance Audit</h2>
    <table>
      <thead>
        <tr><th>Point</th><th>Y%</th><th>Clearance</th><th>Status</th></tr>
      </thead>
      <tbody>${tableHtml}</tbody>
    </table>
  </div>

  ${screenshotHtml}
</body>
</html>`;
  }

  reportBtn?.addEventListener("click", () => {
    if (!lastFit) return setStatus("Run Smart Fit first.");
    const reportPayload = formalizePatientReport(lastFit, currentPatientId);
    const provisional = reportPayload.reportType === "provisional";
    const ts = reportPayload.generatedAt.replaceAll(":", "-");
    const filename = provisional ? `brace-fit-report-provisional-${ts}.json` : `brace-fit-report-final-${ts}.json`;
    downloadText(filename, JSON.stringify(reportPayload, null, 2), "application/json");
    appendInteraction("report_downloaded", {
      filename,
      reportType: reportPayload.reportType,
      score: reportPayload?.fittingKpis?.score ?? null
    });
    setStatus(
      provisional
        ? "⚠️ Provisional report downloaded. Run High-Res Scan for final manufacturing report."
        : "✅ Final report downloaded (JSON)."
    );
  });

  reportPdfBtn?.addEventListener("click", () => {
    if (!lastFit) return setStatus("Run Smart Fit first.");
    const reportPayload = formalizePatientReport(lastFit, currentPatientId);
    const screenshotDataUrl = renderer?.domElement?.toDataURL("image/png") || null;
    const html = buildPrintableReportHtml(reportPayload, screenshotDataUrl);
    const w = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
    if (!w) {
      setStatus("❌ Popup blocked. Allow popups to export PDF.");
      return;
    }

    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    if ("onafterprint" in w) {
      w.onafterprint = () => {
        try { w.close(); } catch {}
      };
    }
    setTimeout(() => {
      try { w.print(); } catch {}
    }, 350);

    appendInteraction("report_pdf_opened", {
      reportType: reportPayload.reportType,
      score: reportPayload?.fittingKpis?.score ?? null
    });
    setStatus("📄 Printable report opened. Use Save as PDF in the print dialog.");
  });

  // =========================
  // UI toggles
  // =========================
  toggleTorsoBtn?.addEventListener("click", () => {
    torsoVisible = !torsoVisible;
    if (torso) torso.visible = torsoVisible;
    if (landmarkGroup) landmarkGroup.visible = torsoVisible;
    toggleTorsoBtn.classList.toggle("active", torsoVisible);
    setStatus(torsoVisible ? "Torso visible" : "Torso hidden");
  });

  toggleBraceBtn?.addEventListener("click", () => {
    braceVisible = !braceVisible;
    if (brace) brace.visible = braceVisible;
    toggleBraceBtn.classList.toggle("active", braceVisible);
    setStatus(braceVisible ? "Brace visible" : "Brace hidden");
  });

  toggleXrayBtn?.addEventListener("click", () => setXray(!xrayActive));
  showZonesBtn?.addEventListener("click", () => setZonesVisible(!zonesVisible));

  // =========================
  // SCULPT MODE
  // =========================
  let sculptActive = false;
  let isPointerDown = false;
  let isShiftPressed = false;

  let sculptRadius = 0.06;
  let sculptStrength = 0.003;
  let lastSculptT = 0;
  let lastSculptLogT = 0;

  let lastNormalUpdateT = 0;
  const NORMAL_UPDATE_MS = 120;

  let realtimeTimer = null;
  let realtimeHeatmapOpts = { fast: true, sampleBudget: MANUAL_HEATMAP_SAMPLE_BUDGET, reason: null };
  let prevControlsEnabled = true;

  function getSculptTarget() {
    if (brace && brace.visible) return { obj: brace, label: "brace" };
    if (torso && torso.visible) return { obj: torso, label: "torso" };
    return null;
  }

  function setSculptUI() {
    if (!sculptBtn || !sculptStatus) return;
    sculptBtn.classList.toggle("active", sculptActive);
    sculptBtn.textContent = sculptActive ? "🧱 Sculpt Mode: ON" : "🧱 Sculpt Mode";
    sculptStatus.textContent = sculptActive ? "Sculpting: ON (Shift to Pull)" : "Sculpting: OFF";
  }

  function toggleSculpt() {
    if (!sculptActive) {
      const t = getSculptTarget();
      if (!t) {
        setStatus("Load Brace or Torso first to sculpt.");
        return;
      }
    }
    sculptActive = !sculptActive;

    if (sculptActive) {
      prevControlsEnabled = controls.enabled;
      controls.enabled = false;
      renderer.domElement.style.cursor = "crosshair";
      const t = getSculptTarget();
      appendInteraction("sculpt_mode", { enabled: true, target: t?.label || "unknown" });
      setStatus(`🧱 Sculpt Mode ON — drag to Push, hold Shift to Pull (${t?.label || "model"}).`);
    } else {
      controls.enabled = prevControlsEnabled;
      renderer.domElement.style.cursor = "default";
      appendInteraction("sculpt_mode", { enabled: false });
      setStatus("🧱 Sculpt Mode OFF.");
    }

    setSculptUI();
  }
  sculptBtn?.addEventListener("click", toggleSculpt);

  function updateMouseFromEvent(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function ensureSculptable(mesh) {
    if (!mesh?.isMesh || !mesh.geometry?.attributes?.position) return false;

    if (mesh.geometry.index) mesh.geometry = mesh.geometry.toNonIndexed();

    const pos = mesh.geometry.attributes.position;
    pos.setUsage(THREE.DynamicDrawUsage);

    if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();
    else mesh.geometry.attributes.normal.setUsage(THREE.DynamicDrawUsage);

    if (!mesh.userData.basePosition) mesh.userData.basePosition = pos.array.slice(0);

    return true;
  }

  function sculptMesh(hit, pushOut = true, nowT = performance.now()) {
    const mesh = hit.object;
    if (!ensureSculptable(mesh)) return;

    const geo = mesh.geometry;
    const posAttr = geo.attributes.position;
    const centerLocal = mesh.worldToLocal(hit.point.clone());

    const nLocal = (hit.face?.normal ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0)).normalize();
    const sign = pushOut ? 1 : -1;

    const dt = lastSculptT ? Math.max(1, nowT - lastSculptT) : 16;
    lastSculptT = nowT;

    const strength = sculptStrength * (dt / 16);
    const r = sculptRadius;
    const r2 = r * r;

    const v = new THREE.Vector3();
    let changed = false;

    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);

      const dx = v.x - centerLocal.x;
      const dy = v.y - centerLocal.y;
      const dz = v.z - centerLocal.z;
      const d2 = dx * dx + dy * dy + dz * dz;

      if (d2 > r2) continue;

      const d = Math.sqrt(d2);
      const t = 1 - d / r;
      const falloff = t * t * (3 - 2 * t);

      v.addScaledVector(nLocal, sign * strength * falloff);
      posAttr.setXYZ(i, v.x, v.y, v.z);
      changed = true;
    }

    if (!changed) return;

    posAttr.needsUpdate = true;
    geo.computeBoundingSphere();
    geo.computeBoundingBox();

    if (nowT - lastNormalUpdateT > NORMAL_UPDATE_MS) {
      geo.computeVertexNormals();
      geo.attributes.normal.needsUpdate = true;
      lastNormalUpdateT = nowT;
    }

    markPoseEdited("sculpt");
    if (!lastSculptLogT || nowT - lastSculptLogT > 400) {
      appendInteraction("sculpt_edit", {
        mode: pushOut ? "push" : "pull",
        radius: Number(sculptRadius.toFixed(3)),
        strength: Number(sculptStrength.toFixed(4))
      });
      lastSculptLogT = nowT;
    }
    updateSlicing();
  }

  function scheduleRealtimeHeatmap(opts = {}) {
    if (!torso || !brace) return;
    if (heatmapBusy) return;
    realtimeHeatmapOpts = { fast: true, sampleBudget: MANUAL_HEATMAP_SAMPLE_BUDGET, reason: null, ...opts };
    clearTimeout(realtimeTimer);
    realtimeTimer = setTimeout(runRealtimeHeatmap, 260);
  }

  async function runRealtimeHeatmap() {
    if (!torso || !brace) return;
    if (heatmapBusy || realtimeRunning) return;

    realtimeRunning = true;
    try {
      const res = await heatmapFast({ highRes: false, ...realtimeHeatmapOpts });
      const score = computeFitScore(res.tightPct, res.loosePct, res.okPct);
      const recommendation = computeRecommendation(res.tightPct, res.loosePct, score, res.okPct);
      lastFit = { ...res, score, recommendation, highRes: false };
      lastFit.clinical = interpretClinical(lastFit);

      updateCEO(lastFit);
      if (aiExplainEl) aiExplainEl.textContent = makeOfflineAIExplanation(lastFit);
      if (realtimeHeatmapOpts?.reason === "clinical_tension") {
        pushClinicalStatus(lastFit);
      }

      if (reportBtn) reportBtn.disabled = false;
      if (reportPdfBtn) reportPdfBtn.disabled = false;
      setStatus("🧱 Sculpt updated heatmap + score ✅");
    } catch (e) {
      console.error(e);
    } finally {
      realtimeRunning = false;
    }
  }

  function handleSculptAction() {
    if (!sculptActive) return;
    const t = getSculptTarget();
    if (!t?.obj) return;
    sculptRaycaster.setFromCamera(mouse, activeCamera);
    const intersects = sculptRaycaster.intersectObject(t.obj, true);

    if (intersects.length > 0) {
      sculptMesh(intersects[0], !isShiftPressed, performance.now());
      scheduleRealtimeHeatmap();
    }
  }

  renderer.domElement.addEventListener("pointerdown", (ev) => {
    if (!sculptActive) return;
    isPointerDown = true;
    updateMouseFromEvent(ev);
    handleSculptAction();
    ev.preventDefault();
  });

  renderer.domElement.addEventListener("pointermove", (ev) => {
    updateMouseFromEvent(ev);
    if (sculptActive && isPointerDown) {
      handleSculptAction();
      ev.preventDefault();
    }
  });

  window.addEventListener("pointerup", () => { isPointerDown = false; });
  window.addEventListener("keydown", (e) => { if (e.key === "Shift") isShiftPressed = true; });
  window.addEventListener("keyup", (e) => { if (e.key === "Shift") isShiftPressed = false; });

  // =========================
  // Chat / Agent Log / Voice
  // =========================
  function pushMsg(text, cls) {
    if (!aiChat) return;
    const div = document.createElement("div");
    div.className = `aiMsg ${cls}`;
    div.textContent = text;
    aiChat.appendChild(div);
    aiChat.scrollTop = aiChat.scrollHeight;
  }
  function pushUser(t) { pushMsg(t, "aiUser"); }
  function pushBot(t)  { pushMsg(t, "aiBot"); }

  function logAgent(line) {
    if (!agentLogEl) return;
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const prev = agentLogEl.textContent || "";
    agentLogEl.textContent = `${prev}\n> ${t} ${line}`.trim();
    agentLogEl.scrollTop = agentLogEl.scrollHeight;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let voiceOn = false;
  let voiceListening = false;
  let voiceRec = null;
  let voiceRestartT = null;

  function speak(text) {
    if (!voiceOn) return;
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function initVoiceInput() {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => { voiceListening = true; };
    rec.onend = () => {
      voiceListening = false;
      if (voiceOn) {
        clearTimeout(voiceRestartT);
        voiceRestartT = setTimeout(() => {
          try { rec.start(); } catch {}
        }, 250);
      }
    };
    rec.onerror = (e) => {
      const msg = e?.error ? `Voice error: ${e.error}` : "Voice error.";
      setStatus(`🎙️ ${msg}`);
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        setVoice(false);
        if (voiceToggleBtn) {
          voiceToggleBtn.disabled = true;
          voiceToggleBtn.textContent = "🎙️ Voice: Blocked";
        }
      }
    };
    rec.onresult = (e) => {
      const last = e.results?.[e.results.length - 1];
      const transcript = last?.[0]?.transcript?.trim?.() || "";
      if (!transcript) return;
      pushUser(`🎙️ ${transcript}`);
      void handleCommand(transcript);
    };
    return rec;
  }

  function startVoiceInput() {
    if (!voiceRec) voiceRec = initVoiceInput();
    if (!voiceRec || voiceListening) return;
    try { voiceRec.start(); } catch {}
  }

  function stopVoiceInput() {
    if (!voiceRec) return;
    try { voiceRec.stop(); } catch {}
  }

  function setVoice(on) {
    voiceOn = !!on;
    clearTimeout(voiceRestartT);
    if (voiceToggleBtn) {
      voiceToggleBtn.classList.toggle("active", voiceOn);
      voiceToggleBtn.textContent = voiceOn ? "🎙️ Voice: ON" : "🎙️ Voice: OFF";
    }
    if (voiceOn) {
      startVoiceInput();
      setStatus("🎙️ Voice input ON (say: smart fit, rotate, lock, reset).");
    } else {
      stopVoiceInput();
      setStatus("🎙️ Voice input OFF.");
    }
  }

  if (!SpeechRecognition && voiceToggleBtn) {
    voiceToggleBtn.disabled = true;
    voiceToggleBtn.textContent = "🎙️ Voice: Unsupported";
  }

  voiceToggleBtn?.addEventListener("click", () => setVoice(!voiceOn));

  // =========================
  // Python Backend Bridge
  // =========================
  const PY_WRAP_ENDPOINT = "http://localhost:8000/api/optimize-wrap";

  function getPrimaryMesh(root) {
    let out = null;
    root?.traverse((c) => {
      if (!out && c.isMesh && c.geometry?.attributes?.position) out = c;
    });
    return out;
  }

  function ensureWritableNonIndexedGeometry(mesh) {
    if (!mesh?.geometry?.attributes?.position) return false;
    let geo = mesh.geometry;
    if (geo.index) geo = geo.toNonIndexed();
    geo = geo.clone();
    mesh.geometry = geo;
    return true;
  }

  function extractWorldVertices(mesh, maxPoints = Infinity) {
    mesh.updateWorldMatrix(true, false);
    const pos = mesh.geometry?.attributes?.position;
    if (!pos) return new Float32Array(0);

    const allowed = Number.isFinite(maxPoints) ? Math.max(1, maxPoints | 0) : pos.count;
    const step = Math.max(1, Math.floor(pos.count / allowed));
    const count = Math.ceil(pos.count / step);

    const out = new Float32Array(count * 3);
    const v = new THREE.Vector3();
    let k = 0;
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      out[k++] = v.x;
      out[k++] = v.y;
      out[k++] = v.z;
    }
    return out;
  }

  function applyWorldVerticesToMesh(mesh, worldVertices) {
    const pos = mesh.geometry?.attributes?.position;
    if (!pos) return false;
    if (!Array.isArray(worldVertices) && !(worldVertices instanceof Float32Array)) return false;
    if (worldVertices.length !== pos.count * 3) return false;

    mesh.updateWorldMatrix(true, false);
    const inv = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
    const w = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      const k = i * 3;
      w.set(worldVertices[k], worldVertices[k + 1], worldVertices[k + 2]).applyMatrix4(inv);
      pos.setXYZ(i, w.x, w.y, w.z);
    }

    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
    return true;
  }

  async function runPythonShrinkWrap() {
    if (!torso || !brace) {
      setStatus("Load Torso + Brace first.");
      return false;
    }
    if (heatmapBusy) {
      setStatus("Wait for current operation to finish.");
      return false;
    }

    const torsoMesh = getPrimaryMesh(torso);
    const braceMesh = getPrimaryMesh(brace);
    if (!torsoMesh || !braceMesh) {
      setStatus("Could not find torso/brace mesh geometry.");
      return false;
    }

    if (!ensureWritableNonIndexedGeometry(braceMesh)) {
      setStatus("Brace geometry is not writable.");
      return false;
    }

    const torsoVertices = extractWorldVertices(torsoMesh, 120000);
    const braceVertices = extractWorldVertices(braceMesh, Infinity);
    if (!torsoVertices.length || !braceVertices.length) {
      setStatus("Mesh extraction failed.");
      return false;
    }

    setStatus("🤖 Python Fit: uploading binary mesh data...");
    document.body.classList.add("ai-active");
    setPulse(true, false);

    try {
      const formData = new FormData();
      formData.append("torso_file", new Blob([torsoVertices]), "torso.bin");
      formData.append("brace_file", new Blob([braceVertices]), "brace.bin");
      formData.append("target_clearance", "0.005");
      formData.append("iterations", "120");
      formData.append("backend", "profile");

      const res = await fetch(PY_WRAP_ENDPOINT, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const optimizedBuffer = await res.arrayBuffer();
      const optimizedBraceVertices = new Float32Array(optimizedBuffer);
      const ok = applyWorldVerticesToMesh(braceMesh, optimizedBraceVertices);
      if (!ok) throw new Error("Invalid optimized vertex payload.");

      brace.updateWorldMatrix(true, true);
      snapshotAIFit();
      resetTensionControl();
      markPoseEdited("python-wrap");
      appendInteraction("python_wrap_completed", {
        endpoint: PY_WRAP_ENDPOINT,
        vertices: braceMesh.geometry.attributes.position.count
      });

      const resFit = await heatmapFast({ highRes: false, analysisOnly: true, fast: true, sampleBudget: 900 });
      const score = computeFitScore(resFit.tightPct, resFit.loosePct, resFit.okPct);
      const recommendation = computeRecommendation(resFit.tightPct, resFit.loosePct, score, resFit.okPct);
      lastFit = { ...resFit, score, recommendation, highRes: false };
      lastFit.clinical = interpretClinical(lastFit);
      updateCEO(lastFit);

      const backendUsed = res.headers.get("X-Backend-Used") || "profile";
      const backendLabel = ` (${backendUsed})`;
      setStatus(`✅ Python Fit complete${backendLabel}. Score ${lastFit.score}/100.`);
      pushBot(`Python Fit${backendLabel} ✅ Score ${lastFit.score}/100`);
      return true;
    } catch (e) {
      console.error(e);
      appendInteraction("python_wrap_failed", { message: e?.message || "unknown" });
      setStatus(`❌ Python Fit failed: ${e?.message || "Unknown error"}`);
      return false;
    } finally {
      setPulse(false, false);
      document.body.classList.remove("ai-active");
    }
  }

  async function runDeepOptimizeSequence() {
    if (!torso || !brace) return setStatus("Load Torso + Brace first.");
    if (heatmapBusy) return setStatus("Wait for current operation to finish.");

    deepOptimizeBtn && (deepOptimizeBtn.disabled = true);
    try {
      setStatus("⚡ Deep Optimize: Python macro-wrap...");
      const macroOk = await runPythonShrinkWrap();
      if (!macroOk) return;

      setStatus("⚡ Deep Optimize: micro-contact wrap...");
      await applyTopologicalShrinkWrap(0.007);

      setStatus("⚡ Deep Optimize: final heatmap + score...");
      const resFull = await heatmapFast({ highRes: false });
      const scoreFull = computeFitScore(resFull.tightPct, resFull.loosePct, resFull.okPct);
      const recommendationFull = computeRecommendation(
        resFull.tightPct,
        resFull.loosePct,
        scoreFull,
        resFull.okPct
      );
      lastFit = { ...resFull, score: scoreFull, recommendation: recommendationFull, highRes: false };
      lastFit.clinical = interpretClinical(lastFit);
      updateCEO(lastFit);
      if (aiExplainEl) aiExplainEl.textContent = makeOfflineAIExplanation(lastFit);

      snapshotAIFit();
      resetTensionControl();
      markPoseEdited("deep-optimize");
      appendInteraction("deep_optimize_completed", {
        score: lastFit.score,
        tightPct: lastFit.tightPct,
        okPct: lastFit.okPct,
        loosePct: lastFit.loosePct
      });

      setStatus(`✅ Deep Optimize complete. Score ${lastFit.score}/100.`);
      pushBot(`Deep Optimize ✅ Score ${lastFit.score}/100`);
    } catch (e) {
      console.error(e);
      appendInteraction("deep_optimize_failed", { message: e?.message || "unknown" });
      setStatus("❌ Deep Optimize failed (see console).");
    } finally {
      if (deepOptimizeBtn) deepOptimizeBtn.disabled = !braceLoaded;
    }
  }

  // Expose backend fit trigger for browser-console testing.
  window.runPythonFit = runPythonShrinkWrap;
  window.runDeepOptimize = runDeepOptimizeSequence;

  async function handleCommand(raw) {
    let cmd = (raw || "").trim().toLowerCase();
    if (!cmd) return;

    const norm = cmd.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    if (norm) {
      if (norm.includes("help")) cmd = "help";
      else if (norm.includes("comfort mode")) cmd = "comfort mode";
      else if (norm.includes("correction mode")) cmd = "correction mode";
      else if (norm.includes("report pdf") || norm.includes("pdf report") || norm.includes("export pdf")) cmd = "report pdf";
      else if (norm.includes("smart fit")) cmd = "smart fit";
      else if (norm.includes("ceo demo") || norm.includes("cinematic demo")) cmd = "ceo demo";
      else if (norm.includes("force snap")) cmd = "force snap";
      else if (norm.includes("clinical snap") || norm.includes("snap fit") || norm.includes("snap to landmarks")) cmd = "clinical snap";
      else if (norm.includes("force fit") || norm.includes("fit 80") || norm.includes("target 80")) cmd = "force fit 80";
      else if (norm.includes("recover fit") || norm.includes("clinical recovery")) cmd = "recover fit";
      else if (norm.includes("auto tighten") || norm.includes("autotighten") || norm.includes("tighten")) cmd = "auto tighten";
      else if (norm.includes("refit") || norm.includes("re fit") || norm.includes("re-fit")) cmd = "refit";
      else if (norm.includes("rotate")) cmd = "rotate";
      else if (norm.includes("lock")) cmd = "lock";
      else if (norm.includes("reset")) cmd = "reset";
      else if (norm.includes("x ray") || norm.includes("xray")) cmd = "xray";
      else if (norm.includes("zone")) cmd = "zones";
      else if (norm.includes("relief")) cmd = "relief";
      else if (norm.includes("high res") || norm.includes("hi res") || norm.includes("hires")) cmd = "hi-res";
      else if (norm.includes("report")) cmd = "report";
      else if (norm.includes("slice")) cmd = "slice";
      else if (norm.includes("ortho")) cmd = "ortho";
      else if (norm.includes("landmark")) cmd = "landmarks";
      else if (norm.includes("sculpt")) cmd = "sculpt";
      else if (norm.includes("deep optimize") || norm.includes("deep fit") || norm.includes("true 100")) cmd = "deep optimize";
      else if (norm.includes("python fit") || norm.includes("backend fit")) cmd = "python fit";
      else if (norm.includes("demo reset") || norm.includes("reset demo")) cmd = "demo reset";
      else if (norm.includes("status")) cmd = "status";
    }

    if (cmd === "help") {
      pushBot(`Commands:
- smart fit  → heatmap + score + clinical
- ceo demo   → cinematic auto-rotate + landmarks + smart fit
- auto tighten → reduce clearance (preserve position)
- clinical snap → snap scale using landmarks, then auto-tighten
- force snap → set Correction mode + run clinical snap immediately
- force fit 80 → re-align + scale to target score
- recover fit → run full clinical recovery workflow
- demo reset → restore baseline for repeating the demo
- refit      → force AI pose+align then heatmap
- rotate     → next rotation + auto align
- lock       → lock orientation
- reset      → reset to last snapshot
- xray       → toggle X-ray
- zones      → toggle zone markers
- relief     → toggle relief highlighting
- hi-res     → run High-Res scan (only after lock)
- report     → download JSON report (after smart fit)
- report pdf → open printable report (Save as PDF)
- comfort mode → set snap goal to 69%
- correction mode → set snap goal to 95%
- slice      → toggle slicing
- ortho      → toggle Orthographic Sync
- landmarks  → auto rib/pelvis slice
- sculpt     → toggle Sculpt Mode
- deep optimize → Python macro-wrap + micro wrap + final heatmap
- python fit → run Python backend shrink-wrap
- status     → current state`);
      return;
    }

    if (cmd === "sculpt") { toggleSculpt(); return; }
    if (cmd === "slice") { toggleSliceBtn?.click(); return; }
    if (cmd === "ortho") { toggleOrthographicSync(); return; }
    if (cmd === "landmarks") { autoLandmarksBtn?.click(); return; }
    if (cmd === "comfort mode") {
      if (snapGoalEl) snapGoalEl.value = "comfort69";
      snapGoalEl?.dispatchEvent(new Event("change"));
      return;
    }
    if (cmd === "correction mode") {
      if (snapGoalEl) snapGoalEl.value = "correction95";
      snapGoalEl?.dispatchEvent(new Event("change"));
      return;
    }

    if (cmd === "status") {
      if (!torsoLoaded && !braceLoaded) return pushBot("No models yet. Load Torso then Brace.");
      if (torsoLoaded && !braceLoaded) return pushBot("Torso loaded ✅ Load Brace.");
      if (torsoLoaded && braceLoaded && !lastFit) return pushBot("Models loaded ✅ Rotate if needed, then run Smart Fit.");
      if (lastFit) return pushBot(`Fit Score ${lastFit.score}/100 | Tight ${lastFit.tightPct}% | Loose ${lastFit.loosePct}%`);
      return pushBot("Ready.");
    }

    if (cmd === "rotate") { applyNextRotation(); return; }
    if (cmd === "ceo demo") { await runCEOCinematicDemo(); return; }
    if (cmd === "force snap") {
      if (snapGoalEl) snapGoalEl.value = "correction95";
      snapGoalEl?.dispatchEvent(new Event("change"));
      await clinicalSnapToLandmarks({ goalKey: "correction95", source: "force-snap-command" });
      return;
    }
    if (cmd === "clinical snap") { await clinicalSnapToLandmarks(); return; }
    if (cmd === "force fit 80") { forceFit80Btn?.click(); return; }
    if (cmd === "recover fit") { await runClinicalRecoveryDemo(); return; }
    if (cmd === "demo reset") { await runDemoReset(); return; }
    if (cmd === "auto tighten" || cmd === "autotighten" || cmd === "tighten") { autoTightenBtn?.click(); return; }
    if (cmd === "lock") { lockAndFinalizeFit(); return; }
    if (cmd === "reset") { resetToAIFit(); return; }
    if (cmd === "xray") { setXray(!xrayActive); return; }
    if (cmd === "zones") { setZonesVisible(!zonesVisible); return; }
    if (cmd === "relief") { setRelief(!reliefActive); return; }
    if (cmd === "deep optimize") { await runDeepOptimizeSequence(); return; }
    if (cmd === "python fit") { await runPythonShrinkWrap(); return; }
    if (cmd === "hi-res") { highResBtn?.click(); return; }
    if (cmd === "report") { reportBtn?.click(); return; }
    if (cmd === "report pdf") { reportPdfBtn?.click(); return; }

    if (cmd === "smart fit") {
      await runFullSmartFitSequence();
      pushBot(lastFit ? `Smart Fit ✅ Score ${lastFit.score}/100\n${lastFit.recommendation}` : "Smart Fit failed ❌");
      if (lastFit) speak(`Smart fit score ${lastFit.score}`);
      return;
    }

    if (cmd === "refit") {
      unlockPose("refit");
      orientationLocked = false;
      await runFullSmartFitSequence({ forceRefit: true, overridePoseLock: true });
      pushBot(lastFit ? `ReFit ✅ Score ${lastFit.score}/100\n${lastFit.recommendation}` : "ReFit failed ❌");
      return;
    }

    pushBot("Unknown command. Type `help`.");
  }

  aiSend?.addEventListener("click", async () => {
    const t = aiInput?.value || "";
    if (!t.trim()) return;
    pushUser(t);
    aiInput.value = "";
    await handleCommand(t);
  });

  aiInput?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      aiSend?.click();
    }
  });

  // =========================
  // Load Torso / Brace (FIXED)
  // =========================
  async function loadTorsoFromFile(file) {
    if (!file) return;

    try {
      setStatus("Loading torso…");
      currentPatientId = file.name || "Unknown";
      currentLandmarks = null;
      autoSnapQueued = false;
      autoSnapCooldownUntil = 0;
      clearLandmarkMarkers();
      renderLandmarkTable(null);
      clearInteractionLog("patient-load");
      appendInteraction("torso_load_started", { file: file.name });

      if (torso) {
        scene.remove(torso);
        disposeRoot(torso);
      }

      torso = await loadAnyModel(file, "Torso");
      scene.add(torso);
      setLayerRecursive(torso, LAYER_TORSO);
      torsoLoaded = true;

      // ✅ critical: canvas must be correctly sized first
      resize();

      // ✅ normalize to MEDIUM height + center + ground
      await settleThenNormalize(torso, TORSO_TARGET_HEIGHT);
      resize();

      setTorsoMaterial();
      torso.visible = torsoVisible;
      if (skinHeatmapActive && brace) void updateTorsoHeatmap();

      updateModelCount();

      // ensure perspective framing
      if (orthoActive) disableOrthographicSync();

      if (brace) {
        if (!braceOrig) snapshotOriginalBrace();
        scaleBraceToTorsoFootprint();
        autoAlignBraceToTorsoSmart();
        stabilizeBraceVisibilityAndScale();
        snapshotOriginalBrace();
        tensionBaseScale = brace.scale.clone();
        resetTensionControl();
        snapshotAIFit();
        clearPoseEdited("torso re-align");
      }

      // ✅ frame fully inside viewport block
      frameToObjects([torso], TORSO_FRAME_PADDING);
      controls.saveState();

      if (patientEl) patientEl.textContent = `Patient: ${file.name}`;
      appendInteraction("torso_loaded", { file: file.name });
      setStatus("✅ Torso centered + medium size + inside viewport.");
    } catch (e) {
      console.error(e);
      appendInteraction("torso_load_failed", { file: file?.name || "unknown", message: e?.message || "unknown" });
      setStatus("❌ Torso load failed (see console).");
    }
  }

  async function loadBraceFromFile(file) {
    if (!file) return;

    try {
      setStatus("Loading brace…");
      currentLandmarks = null;
      autoSnapQueued = false;
      autoSnapCooldownUntil = 0;
      clearLandmarkMarkers();
      renderLandmarkTable(null);
      appendInteraction("brace_load_started", { file: file.name });

      if (brace) {
        scene.remove(brace);
        disposeRoot(brace);
      }

      brace = await loadAnyModel(file, "Brace");
      scene.add(brace);
      setLayerRecursive(brace, LAYER_BRACE);
      braceLoaded = true;

      // brace neutral material
      brace.traverse((c) => {
        if (!c.isMesh) return;
        c.material = new THREE.MeshStandardMaterial({
          color: 0xaab2c0,
          roughness: 0.55,
          metalness: 0.05,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: xrayActive ? 0.5 : 1.0
        });
        setMatClipping(c.material);
        c.renderOrder = 999;
      });

      if (torso) {
        await runGeometricPulse();
        if (!braceOrig) snapshotOriginalBrace();
        scaleBraceToTorsoFootprint();
        autoAlignBraceToTorsoSmart();
        stabilizeBraceVisibilityAndScale();
        snapshotOriginalBrace();
        braceUserQuat.copy(brace.quaternion);
        tensionBaseScale = brace.scale.clone();
        snapshotAIFit();
        clearPoseEdited("fresh load");
      } else {
        snapshotOriginalBrace();
        braceUserQuat.copy(brace.quaternion);
        tensionBaseScale = brace.scale.clone();
      }
      resetTensionControl();

      brace.visible = braceVisible;
      updateModelCount();

      if (orthoActive) disableOrthographicSync();
      resize();

      // ✅ frame both inside viewport block
      frameToObjects([torso, brace], BOTH_FRAME_PADDING);
      controls.update();

      updateSlicing();
      // Re-apply current X-Ray state across both models after load.
      setXray(xrayActive);
      if (skinHeatmapActive) scheduleTorsoHeatmapUpdate(100);

      if (rotateNextBtn) rotateNextBtn.disabled = false;
      if (lockFitBtn) lockFitBtn.disabled = false;
      if (autoTightenBtn) autoTightenBtn.disabled = false;
      if (forceFit80Btn) forceFit80Btn.disabled = false;
      if (deepOptimizeBtn) deepOptimizeBtn.disabled = false;
      if (demoRecoveryBtn) demoRecoveryBtn.disabled = false;
      if (clinicalSnapBtn) clinicalSnapBtn.disabled = false;
      if (demoResetBtn) demoResetBtn.disabled = false;
      if (ceoCinematicBtn) ceoCinematicBtn.disabled = false;
      if (highResBtn) highResBtn.disabled = true;
      if (reportBtn) reportBtn.disabled = true;
      if (reportPdfBtn) reportPdfBtn.disabled = true;

      appendInteraction("brace_loaded", { file: file.name });
      setStatus("✅ Brace loaded.");
    } catch (e) {
      console.error(e);
      appendInteraction("brace_load_failed", { file: file?.name || "unknown", message: e?.message || "unknown" });
      setStatus("❌ Brace load failed (see console).");
    }
  }

  torsoFile?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (f) await loadTorsoFromFile(f);
  });

  braceFile?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (f) await loadBraceFromFile(f);
  });

  dockTorsoBtn?.addEventListener("click", () => torsoFile?.click());
  dockBraceBtn?.addEventListener("click", () => braceFile?.click());
  dockLandmarksBtn?.addEventListener("click", () => autoLandmarksBtn?.click());
  dockSmartFitBtn?.addEventListener("click", () => smartFitBtn?.click());
  dockReportPdfBtn?.addEventListener("click", () => reportPdfBtn?.click());

  navFitTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu(fitMenuEl);
  });
  navAnalysisTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu(analysisMenuEl);
  });
  navWorkspaceTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu(workspaceMenuEl);
  });
  navAssessmentTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu(assessmentMenuEl);
  });
  navManualTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu(manualMenuEl);
  });
  navRunDemoBtn?.addEventListener("click", () => ceoCinematicBtn?.click());

  menuSmartFitBtn?.addEventListener("click", () => { smartFitBtn?.click(); closeMenus(); });
  menuAutoTightenBtn?.addEventListener("click", () => { autoTightenBtn?.click(); closeMenus(); });
  menuClinicalSnapBtn?.addEventListener("click", () => { clinicalSnapBtn?.click(); closeMenus(); });
  menuForceFitBtn?.addEventListener("click", () => { forceFit80Btn?.click(); closeMenus(); });
  menuLandmarksBtn?.addEventListener("click", () => { autoLandmarksBtn?.click(); closeMenus(); });
  menuHighResBtn?.addEventListener("click", () => { highResBtn?.click(); closeMenus(); });
  menuAuditBtn?.addEventListener("click", () => { runNeuralAuditBtn?.click(); closeMenus(); });
  menuSnapshotBtn?.addEventListener("click", () => {
    if (!currentLandmarks?.points?.length) {
      setStatus("Run Auto Landmarks first.");
      return;
    }
    const patientSafe = String(currentPatientId || "patient").replace(/[^\w.-]+/g, "_");
    const payload = {
      timestamp: new Date().toISOString(),
      patientId: currentPatientId || "Unknown",
      profile: currentLandmarks.profileLabel || currentLandmarks.profileId || "Unknown",
      fitScore: Number.isFinite(lastFit?.score) ? lastFit.score : null,
      tensionFactor: Number(tensionSlider?.value || 1.0),
      metrics: lastFit
        ? {
            tightPct: lastFit.tightPct,
            okPct: lastFit.okPct,
            loosePct: lastFit.loosePct,
            recommendation: lastFit.recommendation || "",
            clinicalLabel: lastFit?.clinical?.clinicalLabel || ""
          }
        : null,
      landmarks: currentLandmarks.points.map((p) => ({
        label: p.label || p.id || "—",
        yRel: Number.isFinite(p.yRel) ? p.yRel : null,
        clearanceMm: Number.isFinite(p.clearance) ? Number((p.clearance * 1000).toFixed(2)) : null,
        status: clearanceStatusForTable(p.clearance).text
      }))
    };

    downloadText(
      `BraceViz_Snapshot_${patientSafe}_${new Date().toISOString().replaceAll(":", "-")}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
    appendInteraction("snapshot_exported", {
      profile: payload.profile,
      points: payload.landmarks.length,
      fitScore: payload.fitScore
    });
    pushBot("Clinical data snapshot exported ✅");
    setStatus("✅ Data snapshot exported.");
    closeMenus();
  });
  menuSkinHeatmapBtn?.addEventListener("click", () => { setSkinHeatmapActive(!skinHeatmapActive); closeMenus(); });
  menuXrayBtn?.addEventListener("click", () => { toggleXrayBtn?.click(); closeMenus(); });
  menuSliceBtn?.addEventListener("click", () => { toggleSliceBtn?.click(); closeMenus(); });
  menuZonesBtn?.addEventListener("click", () => { showZonesBtn?.click(); closeMenus(); });
  menuNxmBtn?.addEventListener("click", () => nxm?.click());
  menuNxpBtn?.addEventListener("click", () => nxp?.click());
  menuNymBtn?.addEventListener("click", () => nym?.click());
  menuNypBtn?.addEventListener("click", () => nyp?.click());
  menuNzmBtn?.addEventListener("click", () => nzm?.click());
  menuNzpBtn?.addEventListener("click", () => nzp?.click());
  menuRxmBtn?.addEventListener("click", () => rxm?.click());
  menuRxpBtn?.addEventListener("click", () => rxp?.click());
  menuRymBtn?.addEventListener("click", () => rym?.click());
  menuRypBtn?.addEventListener("click", () => ryp?.click());
  menuRzmBtn?.addEventListener("click", () => rzm?.click());
  menuRzpBtn?.addEventListener("click", () => rzp?.click());

  productionSignOffBtn?.addEventListener("click", () => {
    setProductionSeal(true);
    pushBot("Production order finalized. Manufacturing handoff approved.");
    setStatus("✅ Production sign-off applied.");
  });

  window.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".nav-item")) return;
    closeMenus();
  });

  // Batch run (optional)
  batchRunBtn?.addEventListener("click", async () => {
    const files = Array.from(batchTorsoFilesEl?.files || []);
    if (!files.length) return setStatus("No batch torsos selected.");
    if (!braceLoaded) return setStatus("Load Brace first (batch needs brace).");

    setStatus(`Batch: running ${files.length} torsos…`);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setStatus(`Batch: torso ${i + 1}/${files.length} — ${f.name}`);
      await loadTorsoFromFile(f);

      clearPoseEdited("batch");
      orientationLocked = false;
      await runFullSmartFitSequence({ forceRefit: true });

      results.push({
        torso: f.name,
        score: lastFit?.score ?? null,
        tightPct: lastFit?.tightPct ?? null,
        loosePct: lastFit?.loosePct ?? null,
        recommendation: lastFit?.recommendation ?? null
      });

      await yieldUI();
    }

    downloadText(
      `batch-results-${new Date().toISOString().replaceAll(":", "-")}.json`,
      JSON.stringify({ results, generatedAt: new Date().toISOString() }, null, 2),
      "application/json"
    );
    setStatus("✅ Batch complete. Results downloaded.");
  });

  // =========================
  // Structural auditor
  // =========================
  async function runNeuralAuditSequence({ fromCinematic = false } = {}) {
    if (!torso || !brace) {
      setStatus("Load Torso + Brace first.");
      return false;
    }
    if (heatmapBusy) {
      setStatus("Wait for current operation to finish.");
      return false;
    }

    setPulse(true, false);
    updateNeuralAuditHUD(Number.NaN, null, "Scanning...");
    appendInteraction("neural_audit_started", { fromCinematic: !!fromCinematic });

    try {
      highResBtn?.click();

      const t0 = performance.now();
      const timeoutMs = 45000;
      while (heatmapBusy && performance.now() - t0 < timeoutMs) {
        await sleep(120);
      }
      if (heatmapBusy) {
        updateNeuralAuditHUD(Number.NaN, false, "TIMEOUT");
        setProductionSeal(false);
        setPulse(false, true);
        setStatus("❌ Structural audit timed out.");
        appendInteraction("neural_audit_timeout", {});
        return false;
      }

      const minText = String(minThickEl?.textContent || "");
      const minMm = Number.parseFloat(minText.replace(/[^0-9.]+/g, ""));
      const hasHighResFit = !!lastFit && lastFit.highRes === true;
      const scoreOk = Number.isFinite(lastFit?.score) && lastFit.score >= 85;
      const clinicalOk = String(lastFit?.clinical?.clinicalLabel || "").startsWith("✅");
      const thickOk = Number.isFinite(minMm) && minMm >= 2.0;
      const passed = hasHighResFit && scoreOk && clinicalOk && thickOk;

      updateNeuralAuditHUD(minMm, passed, passed ? "VERIFIED" : "RISK DETECTED");
      setProductionSeal(passed);
      setPulse(false, !passed);

      appendInteraction("neural_audit_completed", {
        fromCinematic: !!fromCinematic,
        minThicknessMm: Number.isFinite(minMm) ? Number(minMm.toFixed(2)) : null,
        score: lastFit?.score ?? null,
        passed
      });

      if (passed) {
        if (!fromCinematic) pushBot("Audit Success: thickness and fit meet production thresholds.");
        setStatus("✅ Structural audit verified.");
      } else {
        if (!fromCinematic) pushBot("Audit Warning: adjust thickness/fit before production sign-off.");
        setStatus("⚠️ Structural audit flagged risk.");
      }
      return passed;
    } catch (e) {
      console.error(e);
      updateNeuralAuditHUD(Number.NaN, false, "FAILED");
      setProductionSeal(false);
      setPulse(false, true);
      appendInteraction("neural_audit_failed", { message: e?.message || "unknown" });
      setStatus("❌ Structural audit failed (see console).");
      return false;
    }
  }

  runNeuralAuditBtn?.addEventListener("click", () => {
    void runNeuralAuditSequence();
  });
  runABABtn?.addEventListener("click", () => setStatus("🧬 ABA Gyroid (stub) — connect your lattice generator here."));
  applyAerationBtn?.addEventListener("click", () => setStatus("🕸️ Aeration (stub) — connect your aeration/wireframe here."));

  // =========================
  // Initial UI states
  // =========================
  if (highResBtn) highResBtn.disabled = true;
  if (reportBtn) reportBtn.disabled = true;
  if (reportPdfBtn) reportPdfBtn.disabled = true;
  if (rotateNextBtn) rotateNextBtn.disabled = true;
  if (lockFitBtn) lockFitBtn.disabled = true;
  if (autoTightenBtn) autoTightenBtn.disabled = true;
  if (forceFit80Btn) forceFit80Btn.disabled = true;
  if (deepOptimizeBtn) deepOptimizeBtn.disabled = true;
  if (demoRecoveryBtn) demoRecoveryBtn.disabled = true;
  if (clinicalSnapBtn) clinicalSnapBtn.disabled = true;
  if (demoResetBtn) demoResetBtn.disabled = true;
  if (ceoCinematicBtn) ceoCinematicBtn.disabled = true;
  if (fitSensitivityEl) fitSensitivityEl.value = String(fitSensitivityIndex);
  if (navProfileSelectEl && landmarkProfileEl) navProfileSelectEl.value = landmarkProfileEl.value || "clinical44";
  resetTensionControl();
  setPenetrationUIValue(0.005);
  setSkinHeatmapActive(false, { silent: true });
  updateFitSensitivityLabel();
  clearInteractionLog("app-init");
  renderLandmarkTable(null);
  updateNeuralAuditHUD(Number.NaN, null, "Awaiting Scan");
  setProductionSeal(false);
  setPulse(false, false);
  updateLiveDashboard(null);

  // =========================
  // Render loop + FPS
  // =========================
  let lastFpsT = performance.now();
  let frames = 0;

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.clear(true, true, true);
    activeCamera.layers.enableAll();
    renderer.render(scene, activeCamera);

    frames++;
    const now = performance.now();
    if (now - lastFpsT > 500) {
      const fps = Math.round((frames * 1000) / (now - lastFpsT));
      if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
      frames = 0;
      lastFpsT = now;
    }
  }

  // First size + start
  resize();
  animate();
});
