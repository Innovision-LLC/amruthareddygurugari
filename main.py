
from __future__ import annotations

from typing import List, Optional, Tuple

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

try:
    import torch
    import torch.optim as optim
    from pytorch3d.loss import chamfer_distance, mesh_edge_loss
    from pytorch3d.structures import Meshes, Pointclouds

    HAS_TORCH3D = True
except Exception:
    HAS_TORCH3D = False


app = FastAPI(title="BraceViz Python Wrap Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _bytes_to_vertices(raw: bytes, name: str) -> np.ndarray:
    arr = np.frombuffer(raw, dtype=np.float32)
    if arr.ndim != 1 or arr.size == 0 or arr.size % 3 != 0:
        raise HTTPException(status_code=400, detail=f"{name} must be raw float32 [x,y,z,...] bytes.")
    # .copy() detaches from request buffer so downstream ops are safe.
    return arr.reshape(-1, 3).copy()


def _to_faces(flat: Optional[List[int]], vertex_count: int) -> np.ndarray:
    if not flat:
        tri = vertex_count // 3
        return np.arange(tri * 3, dtype=np.int64).reshape(-1, 3)

    arr = np.asarray(flat, dtype=np.int64)
    if arr.ndim != 1 or arr.size % 3 != 0:
        raise HTTPException(status_code=400, detail="brace_faces must be flat [i,j,k,...] triangles.")
    faces = arr.reshape(-1, 3)
    valid = (
        (faces[:, 0] >= 0)
        & (faces[:, 1] >= 0)
        & (faces[:, 2] >= 0)
        & (faces[:, 0] < vertex_count)
        & (faces[:, 1] < vertex_count)
        & (faces[:, 2] < vertex_count)
    )
    faces = faces[valid]
    if faces.shape[0] == 0:
        tri = vertex_count // 3
        faces = np.arange(tri * 3, dtype=np.int64).reshape(-1, 3)
    return faces


def _compute_slice_profile(points: np.ndarray, union_min_y: float, span_y: float, slices: int) -> Tuple[np.ndarray, ...]:
    t = np.clip((points[:, 1] - union_min_y) / span_y, 0.0, 1.0)
    idx = np.minimum((t * slices).astype(np.int32), slices - 1)

    min_x = np.full(slices, np.inf, dtype=np.float32)
    max_x = np.full(slices, -np.inf, dtype=np.float32)
    min_z = np.full(slices, np.inf, dtype=np.float32)
    max_z = np.full(slices, -np.inf, dtype=np.float32)
    cnt = np.zeros(slices, dtype=np.int32)

    for i in range(points.shape[0]):
        k = idx[i]
        x, z = points[i, 0], points[i, 2]
        if x < min_x[k]:
            min_x[k] = x
        if x > max_x[k]:
            max_x[k] = x
        if z < min_z[k]:
            min_z[k] = z
        if z > max_z[k]:
            max_z[k] = z
        cnt[k] += 1

    return min_x, max_x, min_z, max_z, cnt


def _compute_slice_profile_robust(
    points: np.ndarray,
    union_min_y: float,
    span_y: float,
    slices: int,
    q_low: float,
    q_high: float,
) -> Tuple[np.ndarray, ...]:
    t = np.clip((points[:, 1] - union_min_y) / span_y, 0.0, 1.0)
    idx = np.minimum((t * slices).astype(np.int32), slices - 1)

    x_bins = [[] for _ in range(slices)]
    z_bins = [[] for _ in range(slices)]
    for i in range(points.shape[0]):
        k = idx[i]
        x_bins[k].append(float(points[i, 0]))
        z_bins[k].append(float(points[i, 2]))

    min_x = np.full(slices, np.inf, dtype=np.float32)
    max_x = np.full(slices, -np.inf, dtype=np.float32)
    min_z = np.full(slices, np.inf, dtype=np.float32)
    max_z = np.full(slices, -np.inf, dtype=np.float32)
    cnt = np.zeros(slices, dtype=np.int32)

    for i in range(slices):
        if not x_bins[i]:
            continue
        xb = np.asarray(x_bins[i], dtype=np.float32)
        zb = np.asarray(z_bins[i], dtype=np.float32)
        min_x[i] = np.percentile(xb, q_low)
        max_x[i] = np.percentile(xb, q_high)
        min_z[i] = np.percentile(zb, q_low)
        max_z[i] = np.percentile(zb, q_high)
        cnt[i] = xb.shape[0]

    return min_x, max_x, min_z, max_z, cnt


def _fill_and_smooth_bounds(
    lo: np.ndarray,
    hi: np.ndarray,
    cnt: np.ndarray,
    fallback_lo: float,
    fallback_hi: float,
    passes: int = 2,
) -> Tuple[np.ndarray, np.ndarray]:
    n = lo.shape[0]
    idx = np.arange(n, dtype=np.float32)
    valid = np.where(cnt > 0)[0]

    if valid.size == 0:
        lo_f = np.full(n, fallback_lo, dtype=np.float32)
        hi_f = np.full(n, fallback_hi, dtype=np.float32)
    else:
        lo_f = np.interp(idx, valid.astype(np.float32), lo[valid]).astype(np.float32)
        hi_f = np.interp(idx, valid.astype(np.float32), hi[valid]).astype(np.float32)

    kernel = np.array([1.0, 2.0, 3.0, 2.0, 1.0], dtype=np.float32)
    kernel /= kernel.sum()
    for _ in range(max(0, passes)):
        lo_f = np.convolve(lo_f, kernel, mode="same").astype(np.float32)
        hi_f = np.convolve(hi_f, kernel, mode="same").astype(np.float32)

    # keep non-zero span
    span = hi_f - lo_f
    small = span < 1e-4
    if np.any(small):
        mid = (hi_f[small] + lo_f[small]) * 0.5
        lo_f[small] = mid - 5e-5
        hi_f[small] = mid + 5e-5

    return lo_f, hi_f


def _profile_wrap_numpy(
    torso: np.ndarray,
    brace: np.ndarray,
    clearance: float,
    slices: int = 60,
) -> np.ndarray:
    # Restrict torso profiling to brace-height band so legs/arms don't dominate.
    b_min_y = float(brace[:, 1].min())
    b_max_y = float(brace[:, 1].max())
    b_span_y = max(1e-6, b_max_y - b_min_y)
    y_margin = max(0.02, b_span_y * 0.12)
    torso_band = torso[(torso[:, 1] >= (b_min_y - y_margin)) & (torso[:, 1] <= (b_max_y + y_margin))]

    # Arm exclusion: keep torso core near the spine center so A-pose arms do not inflate width.
    if torso_band.shape[0] >= 200:
        center_x = float(np.median(torso_band[:, 0]))
        core_mask = np.abs(torso_band[:, 0] - center_x) < 0.22
        torso_used = torso_band[core_mask]
        # Fallback if crop removes too much geometry.
        if torso_used.shape[0] < 200:
            torso_used = torso_band
    else:
        torso_used = torso

    union_min = np.minimum(torso_used.min(axis=0), brace.min(axis=0))
    union_max = np.maximum(torso_used.max(axis=0), brace.max(axis=0))
    span_y = float(max(1e-6, union_max[1] - union_min[1]))

    # Torso uses robust percentile bounds to ignore outliers.
    t_min_x, t_max_x, t_min_z, t_max_z, t_cnt = _compute_slice_profile_robust(
        torso_used, union_min[1], span_y, slices, q_low=12.0, q_high=88.0
    )
    # Brace profile can be closer to full extent, but still robust.
    b_min_x, b_max_x, b_min_z, b_max_z, b_cnt = _compute_slice_profile_robust(
        brace, union_min[1], span_y, slices, q_low=5.0, q_high=95.0
    )

    # Fill empty bins from whole-object bounds.
    torso_min_x, torso_max_x = float(torso_used[:, 0].min()), float(torso_used[:, 0].max())
    torso_min_z, torso_max_z = float(torso_used[:, 2].min()), float(torso_used[:, 2].max())
    brace_min_x, brace_max_x = float(brace[:, 0].min()), float(brace[:, 0].max())
    brace_min_z, brace_max_z = float(brace[:, 2].min()), float(brace[:, 2].max())

    t_min_x, t_max_x = _fill_and_smooth_bounds(t_min_x, t_max_x, t_cnt, torso_min_x, torso_max_x, passes=2)
    t_min_z, t_max_z = _fill_and_smooth_bounds(t_min_z, t_max_z, t_cnt, torso_min_z, torso_max_z, passes=2)
    b_min_x, b_max_x = _fill_and_smooth_bounds(b_min_x, b_max_x, b_cnt, brace_min_x, brace_max_x, passes=1)
    b_min_z, b_max_z = _fill_and_smooth_bounds(b_min_z, b_max_z, b_cnt, brace_min_z, brace_max_z, passes=1)

    # Convert bounds to per-slice centers/spans and avoid per-slice stair-step artifacts.
    t_center_x = (t_min_x + t_max_x) * 0.5
    t_center_z = (t_min_z + t_max_z) * 0.5
    t_width = np.maximum(1e-6, t_max_x - t_min_x)
    t_depth = np.maximum(1e-6, t_max_z - t_min_z)

    b_center_x = (b_min_x + b_max_x) * 0.5
    b_center_z = (b_min_z + b_max_z) * 0.5
    b_width = np.maximum(1e-6, b_max_x - b_min_x)
    b_depth = np.maximum(1e-6, b_max_z - b_min_z)

    # Smoothly interpolate slice parameters instead of snapping each vertex to a hard bin.
    y_norm = np.clip((brace[:, 1] - union_min[1]) / span_y, 0.0, 1.0)
    f = y_norm * float(max(1, slices - 1))
    i0 = np.floor(f).astype(np.int32)
    i1 = np.minimum(i0 + 1, slices - 1)
    a = (f - i0).astype(np.float32)

    def _lerp(arr: np.ndarray) -> np.ndarray:
        return arr[i0] * (1.0 - a) + arr[i1] * a

    tcx = _lerp(t_center_x)
    tcz = _lerp(t_center_z)
    tw = _lerp(t_width)
    td = _lerp(t_depth)
    bcx = _lerp(b_center_x)
    bcz = _lerp(b_center_z)
    bw = _lerp(b_width)
    bd = _lerp(b_depth)

    # Scale factors are clamped to prevent catastrophic expansion/collapse.
    sx = (tw + (2.0 * clearance)) / np.maximum(1e-6, bw)
    sz = (td + (2.0 * clearance)) / np.maximum(1e-6, bd)
    sx = np.clip(sx, 0.72, 1.42)
    sz = np.clip(sz, 0.72, 1.42)

    target_x = tcx + (brace[:, 0] - bcx) * sx
    target_z = tcz + (brace[:, 2] - bcz) * sz

    # Guardrail: cap per-vertex movement so one bad slice cannot explode the mesh.
    brace_span_x = float(max(1e-6, brace[:, 0].max() - brace[:, 0].min()))
    brace_span_z = float(max(1e-6, brace[:, 2].max() - brace[:, 2].min()))
    max_dx = max(0.03, brace_span_x * 0.35)
    max_dz = max(0.03, brace_span_z * 0.35)
    dx = np.clip(target_x - brace[:, 0], -max_dx, max_dx)
    dz = np.clip(target_z - brace[:, 2], -max_dz, max_dz)

    blend = 0.74
    out = brace.copy()
    out[:, 0] = brace[:, 0] + (dx * blend)
    out[:, 2] = brace[:, 2] + (dz * blend)
    # Keep Y unchanged to preserve original brace height profile.
    out[:, 1] = brace[:, 1]

    return out


def _optimize_with_torch3d(
    torso: np.ndarray,
    brace: np.ndarray,
    faces: np.ndarray,
    iterations: int,
) -> np.ndarray:
    if not HAS_TORCH3D:
        raise RuntimeError("PyTorch3D is not available.")

    # Keep torch path bounded for interactive use.
    if brace.shape[0] > 160_000:
        raise RuntimeError("Brace mesh too dense for torch optimizer path.")

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    torso_t = torch.tensor(torso, dtype=torch.float32, device=device)
    brace_t = torch.tensor(brace, dtype=torch.float32, device=device)
    faces_t = torch.tensor(faces, dtype=torch.int64, device=device)

    # Downsample torso point cloud for speed while keeping full brace parameterization.
    max_torso_points = 80_000
    if torso_t.shape[0] > max_torso_points:
        sel = torch.randperm(torso_t.shape[0], device=device)[:max_torso_points]
        torso_t = torso_t.index_select(0, sel)

    deform = torch.nn.Parameter(brace_t.clone())
    optimizer = optim.Adam([deform], lr=0.01)

    torso_pc = Pointclouds(points=[torso_t])
    iters = int(max(40, min(iterations, 220)))

    for _ in range(iters):
        optimizer.zero_grad()
        mesh = Meshes(verts=[deform], faces=[faces_t])
        brace_pc = Pointclouds(points=[deform])
        loss_chamfer, _ = chamfer_distance(brace_pc, torso_pc)
        loss_edge = mesh_edge_loss(mesh)
        loss = loss_chamfer + 0.08 * loss_edge
        loss.backward()
        optimizer.step()

    return deform.detach().cpu().numpy()


@app.get("/health")
async def health():
    return {"ok": True, "torch3d": HAS_TORCH3D}


@app.post("/api/optimize-wrap")
async def optimize_wrap(
    torso_file: UploadFile = File(...),
    brace_file: UploadFile = File(...),
    target_clearance: float = Form(0.005),
    iterations: int = Form(120),
    backend: str = Form("auto"),
):
    torso_raw = await torso_file.read()
    brace_raw = await brace_file.read()

    torso = _bytes_to_vertices(torso_raw, "torso_file")
    brace = _bytes_to_vertices(brace_raw, "brace_file")
    faces = _to_faces(None, brace.shape[0])
    clearance = float(np.clip(target_clearance, 0.0, 0.03))
    iters = int(max(40, min(iterations, 220)))

    backend_req = (backend or "auto").strip().lower()
    if backend_req not in {"auto", "torch", "profile"}:
        raise HTTPException(status_code=400, detail="backend must be one of: auto, torch, profile")

    used_backend = "profile"
    try:
        if backend_req in {"auto", "torch"} and HAS_TORCH3D:
            optimized = _optimize_with_torch3d(torso, brace, faces, iters)
            used_backend = "torch3d"
        elif backend_req == "torch" and not HAS_TORCH3D:
            raise RuntimeError("Requested torch backend, but PyTorch3D is not installed.")
        else:
            optimized = _profile_wrap_numpy(torso, brace, clearance=clearance, slices=60)
            used_backend = "profile"
    except Exception:
        if backend_req == "torch":
            raise
        optimized = _profile_wrap_numpy(torso, brace, clearance=clearance, slices=60)
        used_backend = "profile"

    optimized_f32 = optimized.astype(np.float32, copy=False)
    return Response(
        content=optimized_f32.tobytes(),
        media_type="application/octet-stream",
        headers={
            "X-Backend-Used": used_backend,
            "X-Vertex-Count": str(int(optimized_f32.shape[0])),
        },
    )

