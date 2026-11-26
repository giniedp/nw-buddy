# Fixed camera: the character creation camera facing the character, moved up/down, zoomed out, looking from the knees
# to the head, the character centered or right of the center. Casts rays over a widened frame from each sample view and keeps every (node, material) pair that is
# hit; rays pass through alpha / blended surfaces. Writes frame.json and preview renders of the sample views.
# blender -b -P blender_frame.py -- <stage.glb> <frame.json> <preview_prefix>
# blender -b -P blender_frame.py -- <stage.glb> <frame-points.json> points
#   the surface points the rays hit instead (glTF coordinates, on a 0.2 m grid, coarser rays), for the light culling
import sys
import json
import math
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
source, target, prefix = argv[0], argv[1], argv[2]
points_mode = prefix == "points"
GRID = 0.2

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source)
scene = bpy.context.scene
depsgraph = bpy.context.evaluated_depsgraph_get()


def game(x, y, z):
    return Vector((-x, -y, z))


CAMERA = game(-0.4, -18.7, 11.2)
PLAYER = game(-0.7, -21.6, 10.0)
VFOV = math.radians(50)  # vertical field of view, with the margin below
ASPECT = 21 / 9  # wide screens
MARGIN = 1.15  # "near frame": 15% beyond the frame edges
COLS, ROWS = (120, 54) if points_mode else (300, 130)


def is_transparent(mat):
    if not mat or not mat.node_tree:
        return False
    if mat.surface_render_method == "BLENDED":
        return True
    for node in mat.node_tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            alpha = node.inputs["Alpha"]
            return alpha.is_linked or alpha.default_value < 1.0
    return False


transparent = {mat.name: is_transparent(mat) for mat in bpy.data.materials}

axis = (PLAYER - CAMERA)
axis.z = 0
axis.normalize()
# as the game's character screens: the feet out of view, the camera zooms out, the character right of the image
# center (the look target shifts to the camera's left)
left = Vector((0, 0, 1)).cross(axis).normalized()
views = []
for dz in (-0.4, 0.0, 0.5):
    for back in (0.0, 1.0, 2.0):
        for look_z in (0.6, 1.1, 1.7):
            for side in (0.0, 1.0):
                eye = CAMERA + Vector((0, 0, dz)) - axis * back
                views.append((eye, PLAYER + Vector((0, 0, look_z)) + left * side))

hits = {}
points = set()
tan_v = math.tan(VFOV / 2) * MARGIN
tan_h = math.tan(VFOV / 2) * ASPECT * MARGIN
for eye, look in views:
    forward = (look - eye).normalized()
    right = forward.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(forward)
    for j in range(ROWS):
        v = (j + 0.5) / ROWS * 2 - 1
        for i in range(COLS):
            u = (i + 0.5) / COLS * 2 - 1
            direction = (forward + right * (u * tan_h) + up * (v * tan_v)).normalized()
            origin = eye
            for _ in range(8):
                ok, loc, normal, index, obj, matrix = scene.ray_cast(depsgraph, origin, direction)
                if not ok:
                    break
                mesh = obj.data
                mat = None
                if index < len(mesh.polygons) and obj.material_slots:
                    mat = obj.material_slots[mesh.polygons[index].material_index].material
                node_sid = obj.get("sid")
                mat_sid = mat.get("sid") if mat else None
                key = f"{node_sid}:{mat_sid}"
                hits[key] = hits.get(key, 0) + 1
                # glTF coordinates of the hit (Blender imports glTF Y-up as Z-up: x, -z, y)
                cell = (round(loc.x / GRID), round(loc.z / GRID), round(-loc.y / GRID))
                points.add(cell)
                if not (mat and transparent.get(mat.name)):
                    break
                origin = loc + direction * 0.002

if points_mode:
    with open(target, "w") as f:
        json.dump({"grid": GRID, "points": [[c * GRID for c in cell] for cell in sorted(points)]}, f)
    print("points", len(points))
    sys.exit(0)

keep = sorted(key for key, count in hits.items() if count >= 2)
with open(target, "w") as f:
    json.dump({"views": len(views), "keep": keep, "hits": hits}, f, indent=1)
print("views", len(views), "pairs hit", len(hits), "kept", len(keep))

# previews: base view and the extremes
for obj in scene.objects:
    if obj.type == "LIGHT":
        obj.hide_render = True
world = scene.world or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.8, 0.85, 1.0, 1.0)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.5
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1400
scene.render.resolution_y = 600
scene.view_settings.view_transform = "AgX"
cam_data = bpy.data.cameras.new("FrameCam")
cam_data.sensor_fit = "VERTICAL"
cam_data.angle = VFOV
cam_data.clip_start = 0.05
cam = bpy.data.objects.new("FrameCam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
# views index: dz (3) x back (3) x look (3) x side (2)
for name, index in (("base", 1 * 18 + 0 * 6 + 1 * 2 + 1), ("high-far", 2 * 18 + 2 * 6 + 2 * 2 + 1), ("low", 0 * 18 + 0 * 6 + 0 * 2 + 0)):
    eye, look = views[index]
    cam.location = eye
    cam.rotation_euler = (look - eye).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = f"{prefix}-{name}.png"
    bpy.ops.render.render(write_still=True)
