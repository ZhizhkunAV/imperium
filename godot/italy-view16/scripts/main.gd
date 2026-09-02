extends Node3D

## View 16 — Godot 4: Italy like View 5, provinces, cities, two armies

const BOX := Vector4(6.4, 36.2, 18.9, 47.4)
const CX := 12.48
const CY := 41.89
const SCALE := 33.0
const DEM_OFFSET := 500.0
const COLS := 420
const ROWS := 480
const SEA_M := 8.0
const COAST_Y := 0.05

const TILT_MIN := 12.0
const TILT_MAX := 75.0
const TILT_STEP := 3.0
const YAW_STEP := 6.0
const MIN_ZOOM := 0.22
const MAX_ZOOM := 3.2
const BASE_DIST := 56.0
const ARMY_SPEED := 11.0
const WALK_SEA_MAX := 14.0
const WALK_MTN_MIN := 1450.0
const BORDER_LIFT := 0.06
const BORDER_HALF := 0.38
const BORDER_DUAL_SEP := 0.40
const BORDER_STEP := 0.055 # unused (legacy)

var cam_tilt := 52.0
var cam_zoom := 0.95
var cam_yaw := 0.0
var target := Vector3(0.0, 2.0, 4.0)

var dem_w := 0
var dem_h := 0
var dem_data: PackedFloat32Array = PackedFloat32Array()
var dem_ready := false
var land_albedo: ImageTexture

var camera: Camera3D
var land: MeshInstance3D
var status_label: Label
var hud_zoom: Label
var hud_tilt: Label
var hud_yaw: Label

var dragging := false
var last_mouse := Vector2.ZERO
var allow_pan := true
var city_marks: Array = []

var armies: Array = [] # {id, root, selected, color, visible}
var selected_army_idx := -1

var provinces: Array = []
var roads: Array = []
var factions: Dictionary = {}


var selected_city_idx := -1
var border_root: Node3D
var city_root: Node3D
var army_root: Node3D


func _ready() -> void:
	_build_data()
	_build_ui()
	_load_dem()
	_build_world()
	_setup_js_bridge()
	_update_hud()
	_apply_cam()
	_post_js("window.parent && parent.postMessage({type:'campaign-request-sync'},'*')")


func _build_data() -> void:
	# как View14Provinces / View14Factions / View14Roads
	factions = {
		"spqr": {"banner": Color("6a3d8a"), "border": Color("c42828"), "fill": Color(92 / 255.0, 48 / 255.0, 118 / 255.0)},
		"julii": {"banner": Color("9a3030"), "border": Color("c42828"), "fill": Color(154 / 255.0, 48 / 255.0, 42 / 255.0)},
		"brutii": {"banner": Color("7a2028"), "border": Color("a82028"), "fill": Color(110 / 255.0, 28 / 255.0, 36 / 255.0)},
		"scipii": {"banner": Color("2a6a68"), "border": Color("c42828"), "fill": Color(36 / 255.0, 102 / 255.0, 98 / 255.0)},
		"gaul": {"banner": Color("3a6e38"), "border": Color("3d8c3a"), "fill": Color(58 / 255.0, 110 / 255.0, 52 / 255.0)},
		"rebels": {"banner": Color("6a5a48"), "border": Color("b09870"), "fill": Color(118 / 255.0, 104 / 255.0, 78 / 255.0)},
		"greek": {"banner": Color("b08a38"), "border": Color("d4a830"), "fill": Color(186 / 255.0, 154 / 255.0, 72 / 255.0)},
		"carthage": {"banner": Color("e8e4d8"), "border": Color("f2efe6"), "fill": Color(196 / 255.0, 186 / 255.0, 158 / 255.0)},
	}
	provinces = [
		{"id": "cisalpina", "city": "Mediolanum", "ru": "Медиолан", "lon": 9.19, "lat": 45.46, "faction": "julii", "resources": ["iron"], "capital": false, "hidden": false},
		{"id": "venetia", "city": "Patavium", "ru": "Патавий", "lon": 11.88, "lat": 45.41, "faction": "julii", "resources": ["glass", "textiles"], "capital": false, "hidden": false},
		{"id": "liguria", "city": "Segesta", "ru": "Сегеста", "lon": 8.47, "lat": 44.58, "faction": "julii", "resources": ["pottery", "timber"], "capital": false, "hidden": false},
		{"id": "etruria", "city": "Arretium", "ru": "Арреций", "lon": 11.88, "lat": 43.46, "faction": "julii", "resources": ["iron", "marble"], "capital": false, "hidden": false},
		{"id": "umbria", "city": "Ariminum", "ru": "Аримин", "lon": 12.57, "lat": 44.06, "faction": "julii", "resources": ["pottery"], "capital": false, "hidden": false},
		{"id": "latium", "city": "Rome", "ru": "Рим", "lon": 12.48, "lat": 41.89, "faction": "spqr", "resources": [], "capital": true, "hidden": false},
		{"id": "campania", "city": "Capua", "ru": "Капуя", "lon": 14.22, "lat": 41.10, "faction": "carthage", "resources": ["wine"], "capital": false, "hidden": false},
		{"id": "apulia", "city": "Tarentum", "ru": "Тарент", "lon": 17.24, "lat": 40.47, "faction": "brutii", "resources": ["copper", "timber"], "capital": false, "hidden": false},
		{"id": "bruttium", "city": "Croton", "ru": "Кротон", "lon": 17.12, "lat": 39.08, "faction": "brutii", "resources": ["silver"], "capital": false, "hidden": false},
		{"id": "sic_rom", "city": "Messana", "ru": "Мессана", "lon": 15.55, "lat": 38.19, "faction": "scipii", "resources": [], "capital": false, "hidden": false},
		{"id": "sic_grk", "city": "Syracuse", "ru": "Сиракузы", "lon": 15.29, "lat": 37.08, "faction": "greek", "resources": ["grain", "timber"], "capital": false, "hidden": false},
		{"id": "sic_pun", "city": "Lilybaeum", "ru": "Лилибей", "lon": 12.43, "lat": 37.80, "faction": "carthage", "resources": [], "capital": false, "hidden": false},
		{"id": "sardinia", "city": "Caralis", "ru": "Каралис", "lon": 9.12, "lat": 39.22, "faction": "carthage", "resources": ["wine"], "capital": false, "hidden": false},
		{"id": "corsica", "city": "", "ru": "", "lon": 9.15, "lat": 42.15, "faction": "carthage", "resources": [], "capital": false, "hidden": true},
		{"id": "dalmatia", "city": "Salona", "ru": "Салона", "lon": 16.48, "lat": 43.54, "faction": "rebels", "resources": ["gold", "olive", "timber"], "capital": false, "hidden": false},
	]
	roads = [
		["Mediolanum", "Patavium"], ["Mediolanum", "Segesta"], ["Segesta", "Arretium"],
		["Arretium", "Ariminum"], ["Arretium", "Rome"], ["Ariminum", "Rome"],
		["Rome", "Capua"], ["Capua", "Tarentum"], ["Tarentum", "Croton"],
		["Croton", "Messana"], ["Messana", "Syracuse"], ["Syracuse", "Lilybaeum"],
	]


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var panel := PanelContainer.new()
	panel.position = Vector2(12, 12)
	layer.add_child(panel)
	var vb := VBoxContainer.new()
	panel.add_child(vb)
	var title := Label.new()
	title.text = "Вид 16 · Godot 3D"
	vb.add_child(title)
	status_label = Label.new()
	status_label.text = "Сборка карты…"
	vb.add_child(status_label)
	hud_zoom = Label.new()
	vb.add_child(hud_zoom)
	hud_tilt = Label.new()
	vb.add_child(hud_tilt)
	hud_yaw = Label.new()
	vb.add_child(hud_yaw)
	var hint := Label.new()
	hint.text = "ЛКМ армия/город · ПКМ — ход · Q/E наклон · Z/C поворот"
	hint.add_theme_font_size_override("font_size", 12)
	vb.add_child(hint)

	# экранные кнопки камеры (как на глобальной карте)
	var cam_box := VBoxContainer.new()
	cam_box.position = Vector2(12, 160)
	layer.add_child(cam_box)
	var cam_title := Label.new()
	cam_title.text = "Камера"
	cam_box.add_child(cam_title)
	var row1 := HBoxContainer.new()
	cam_box.add_child(row1)
	_add_cam_btn(row1, "Q", func (): _nudge_tilt(-TILT_STEP))
	_add_cam_btn(row1, "E", func (): _nudge_tilt(TILT_STEP))
	var row2 := HBoxContainer.new()
	cam_box.add_child(row2)
	_add_cam_btn(row2, "Z", func (): _nudge_yaw(-YAW_STEP))
	_add_cam_btn(row2, "C", func (): _nudge_yaw(YAW_STEP))


func _add_cam_btn(parent: HBoxContainer, label: String, fn: Callable) -> void:
	var b := Button.new()
	b.text = label
	b.custom_minimum_size = Vector2(44, 36)
	b.pressed.connect(fn)
	parent.add_child(b)


func _nudge_tilt(delta: float) -> void:
	cam_tilt = clampf(cam_tilt + delta, TILT_MIN, TILT_MAX)
	_apply_cam()


func _nudge_yaw(delta: float) -> void:
	cam_yaw = fposmod(cam_yaw + delta, 360.0)
	_apply_cam()


func _load_dem() -> void:
	var img: Image = null
	var tex := load("res://italy-height.png") as Texture2D
	if tex != null:
		img = tex.get_image()
	if img == null:
		img = Image.new()
		var err := img.load("res://italy-height.png")
		if err != OK:
			status_label.text = "DEM offline — упрощённый контур"
			dem_ready = false
			return
	if img.is_compressed():
		var derr := img.decompress()
		if derr != OK:
			dem_ready = false
			return
	# выше разрешение DEM → менее «квадратные» берега
	if img.get_width() > 960 or img.get_height() > 900:
		img.resize(960, 900, Image.INTERPOLATE_BILINEAR)
	dem_w = img.get_width()
	dem_h = img.get_height()
	dem_data.resize(dem_w * dem_h)
	for y in dem_h:
		for x in dem_w:
			var c := img.get_pixel(x, y)
			var hi := int(round(c.r * 255.0))
			var lo := int(round(c.g * 255.0))
			dem_data[y * dem_w + x] = float(hi * 256 + lo) - DEM_OFFSET
	dem_ready = true


func meters(lon: float, lat: float) -> float:
	if not dem_ready or dem_w <= 0:
		return _fallback_meters(lon, lat)
	var u := (lon - BOX.x) / (BOX.z - BOX.x)
	var v := (BOX.w - lat) / (BOX.w - BOX.y)
	if u < 0.0 or v < 0.0 or u > 1.0 or v > 1.0:
		return 0.0
	var x := u * float(dem_w - 1)
	var y := v * float(dem_h - 1)
	var x0 := int(floor(x))
	var y0 := int(floor(y))
	var x1 := mini(dem_w - 1, x0 + 1)
	var y1 := mini(dem_h - 1, y0 + 1)
	var tx := x - float(x0)
	var ty := y - float(y0)
	var d00 := dem_data[y0 * dem_w + x0]
	var d10 := dem_data[y0 * dem_w + x1]
	var d01 := dem_data[y1 * dem_w + x0]
	var d11 := dem_data[y1 * dem_w + x1]
	return d00 * (1.0 - tx) * (1.0 - ty) + d10 * tx * (1.0 - ty) + d01 * (1.0 - tx) * ty + d11 * tx * ty


func _fallback_meters(lon: float, lat: float) -> float:
	var boot := false
	if lon > 7.4 and lon < 18.6 and lat > 36.5 and lat < 47.2:
		var mid := 11.5 + (42.5 - lat) * 0.35
		var half := 2.2 + maxf(0.0, 42.0 - lat) * 0.12
		if absf(lon - mid) < half:
			boot = true
		if lat > 44.0 and lon > 6.8 and lon < 13.8:
			boot = true
	if lon > 12.2 and lon < 15.7 and lat > 36.6 and lat < 38.4:
		boot = true
	if lon > 8.1 and lon < 9.9 and lat > 38.8 and lat < 41.4:
		boot = true
	if not boot:
		return 0.0
	var m := 80.0
	if lat > 45.0:
		m = 700.0 + (lat - 45.0) * 400.0
	elif lat > 43.5 and lon < 13.0:
		m = 320.0
	elif lat < 40.0 and lon > 14.5:
		m = 280.0
	return m


## Аккуратный 3D-рельеф: равнины низкие, холмы читаются, Альпы без шпилей.
func world_h(lon: float, lat: float) -> float:
	var m := meters(lon, lat)
	if m <= 8.0:
		return 0.04
	# сжатие высоких зон + заметный объём
	var t := minf(1.0, m / 3400.0)
	var y := 0.18 + pow(t, 1.12) * 9.2
	return minf(9.5, y)


func xz(lon: float, lat: float) -> Vector3:
	return Vector3((lon - CX) * SCALE, 0.0, (CY - lat) * SCALE)


func lonlat_from_xz(x: float, z: float) -> Vector2:
	return Vector2(x / SCALE + CX, CY - z / SCALE)


func _terrain_color(m: float) -> Color:
	if m <= 8.0:
		return Color("1a5568")
	if m < 250.0:
		return Color("6a8a48").lerp(Color("8a9a50"), m / 250.0)
	if m < 900.0:
		return Color("8a9a50").lerp(Color("a09060"), (m - 250.0) / 650.0)
	if m < 2000.0:
		return Color("a09060").lerp(Color("c8c0b0"), (m - 900.0) / 1100.0)
	return Color("c8c0b0").lerp(Color("eef0f2"), clampf((m - 2000.0) / 1200.0, 0.0, 1.0))


func _paint_land_albedo(tw: int, th: int) -> ImageTexture:
	var img := Image.create(tw, th, false, Image.FORMAT_RGBA8)
	img.fill(Color("1a5568"))
	var seeds := _province_seeds()
	var dlon := (BOX.z - BOX.x) / float(tw)
	var dlat := (BOX.w - BOX.y) / float(th)
	for y in th:
		var lat := BOX.w - float(y) / float(maxi(1, th - 1)) * (BOX.w - BOX.y)
		for x in tw:
			var lon := BOX.x + float(x) / float(maxi(1, tw - 1)) * (BOX.z - BOX.x)
			var m := meters(lon, lat)
			if m <= 8.0:
				continue
			var m2 := meters(lon + dlon, lat)
			var shade := clampf(1.0 + (m - m2) * 0.0012, 0.75, 1.18)
			var col := _terrain_color(m)
			col = Color(col.r * shade, col.g * shade, col.b * shade, 1.0)
			if m < 1450.0 and seeds.size() > 0:
				var nn := _nearest_two_seeds(lon, lat, seeds)
				if nn.a >= 0:
					var fac_id: String = str(seeds[nn.a]["faction"])
					var fac: Dictionary = factions.get(fac_id, factions["rebels"])
					var fill: Color = fac.get("fill", Color(0.4, 0.4, 0.4))
					var wash := 0.12 if m < 700.0 else 0.06
					col = col.lerp(fill, wash)
					if nn.b >= 0 and m < 1250.0:
						var edge := 1.0 - minf(1.0, absf(nn.db - nn.da) / 0.085)
						if edge > 0.35:
							var k := (edge - 0.35) / 0.65 * 0.14
							col = col.lerp(Color(36 / 255.0, 28 / 255.0, 20 / 255.0), k)
			img.set_pixel(x, y, col)
	return ImageTexture.create_from_image(img)


func _build_world() -> void:
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color("163c4c")
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.48, 0.56, 0.62)
	e.ambient_light_energy = 0.55
	e.fog_enabled = true
	e.fog_light_color = Color("4a7a8a")
	e.fog_density = 0.0009
	env.environment = e
	add_child(env)

	var sun := DirectionalLight3D.new()
	sun.light_energy = 1.35
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 420.0
	sun.rotation_degrees = Vector3(-52, 18, 0) # свет с юга — объём рельефа
	add_child(sun)

	var fill := DirectionalLight3D.new()
	fill.light_energy = 0.22
	fill.shadow_enabled = false
	fill.rotation_degrees = Vector3(-25, -140, 0)
	add_child(fill)

	var sea := MeshInstance3D.new()
	var sea_mesh := PlaneMesh.new()
	sea_mesh.size = Vector2(1400, 1400)
	sea.mesh = sea_mesh
	var sea_mat := StandardMaterial3D.new()
	sea_mat.albedo_color = Color("1a5568")
	sea_mat.roughness = 0.38
	sea_mat.metallic = 0.08
	sea.material_override = sea_mat
	sea.position.y = -0.35
	add_child(sea)

	land_albedo = _paint_land_albedo(960, 840)
	land = MeshInstance3D.new()
	land.mesh = _make_height_mesh()
	var land_mat := StandardMaterial3D.new()
	land_mat.albedo_texture = land_albedo
	land_mat.vertex_color_use_as_albedo = true
	land_mat.vertex_color_is_srgb = true
	land_mat.roughness = 0.86
	land_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	land_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	land.material_override = land_mat
	land.name = "italyLand"
	land.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	add_child(land)

	camera = Camera3D.new()
	camera.fov = 40.0
	camera.near = 0.25
	camera.far = 2200.0
	camera.current = true
	add_child(camera)

	_add_province_borders()
	_add_roads()
	city_root = Node3D.new()
	city_root.name = "cities"
	add_child(city_root)
	_add_cities()
	army_root = Node3D.new()
	army_root.name = "armies"
	add_child(army_root)
	_rebuild_armies([
		{"id": "field_rome_1", "faction": "rome", "lon": 12.35, "lat": 41.78},
		{"id": "field_carthage_1", "faction": "carthage", "lon": 14.08, "lat": 41.18},
	])
	status_label.text = "Вид 16 · Godot 3D · Италия"


## Сетка с интерполяцией берега (без квадратных ступенек по кромке суши).
func _make_height_mesh() -> ArrayMesh:
	var stride := COLS + 1
	var vert_count := stride * (ROWS + 1)
	var pos := PackedVector3Array()
	var uvs := PackedVector2Array()
	var mtrs := PackedFloat32Array()
	pos.resize(vert_count)
	uvs.resize(vert_count)
	mtrs.resize(vert_count)
	for j in range(ROWS + 1):
		var lat := BOX.w - float(j) / float(ROWS) * (BOX.w - BOX.y)
		for i in range(COLS + 1):
			var lon := BOX.x + float(i) / float(COLS) * (BOX.z - BOX.x)
			var idx := j * stride + i
			var m := meters(lon, lat)
			mtrs[idx] = m
			var y := world_h(lon, lat) if m > SEA_M else 0.0
			pos[idx] = Vector3((lon - CX) * SCALE, y, (CY - lat) * SCALE)
			uvs[idx] = Vector2(float(i) / float(COLS), float(j) / float(ROWS))

	for _pass in 1:
		var nxt := pos.duplicate()
		for j in range(1, ROWS):
			for i in range(1, COLS):
				var idx := j * stride + i
				if mtrs[idx] <= SEA_M:
					continue
				var sy := pos[idx].y * 2.0
				var w := 2.0
				for dj in range(-1, 2):
					for di in range(-1, 2):
						if di == 0 and dj == 0:
							continue
						var nidx := (j + dj) * stride + (i + di)
						if mtrs[nidx] <= SEA_M:
							continue
						sy += pos[nidx].y
						w += 1.0
				nxt[idx] = Vector3(pos[idx].x, sy / w, pos[idx].z)
		pos = nxt

	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	# динамические вершины берега: [Vector3, Vector2, float]
	var extras: Array = []

	for j in range(ROWS):
		for i in range(COLS):
			var A := j * stride + i
			var B := A + 1
			var C := A + stride
			var D := C + 1
			var la := mtrs[A] > SEA_M
			var lb := mtrs[B] > SEA_M
			var lc := mtrs[C] > SEA_M
			var ld := mtrs[D] > SEA_M
			var n := (1 if la else 0) + (1 if lb else 0) + (1 if lc else 0) + (1 if ld else 0)
			if n == 0:
				continue
			if n == 4:
				_mesh_emit3(st, pos, uvs, mtrs, extras, vert_count, A, C, B)
				_mesh_emit3(st, pos, uvs, mtrs, extras, vert_count, B, C, D)
				continue
			if n == 2 and la and ld and not lb and not lc:
				_mesh_emit_ring(st, pos, uvs, mtrs, extras, vert_count, [
					A, _mesh_interp(pos, uvs, mtrs, extras, vert_count, A, C),
					_mesh_interp(pos, uvs, mtrs, extras, vert_count, A, B)
				])
				_mesh_emit_ring(st, pos, uvs, mtrs, extras, vert_count, [
					D, _mesh_interp(pos, uvs, mtrs, extras, vert_count, D, B),
					_mesh_interp(pos, uvs, mtrs, extras, vert_count, D, C)
				])
				continue
			if n == 2 and lb and lc and not la and not ld:
				_mesh_emit_ring(st, pos, uvs, mtrs, extras, vert_count, [
					B, _mesh_interp(pos, uvs, mtrs, extras, vert_count, B, A),
					_mesh_interp(pos, uvs, mtrs, extras, vert_count, B, D)
				])
				_mesh_emit_ring(st, pos, uvs, mtrs, extras, vert_count, [
					C, _mesh_interp(pos, uvs, mtrs, extras, vert_count, C, D),
					_mesh_interp(pos, uvs, mtrs, extras, vert_count, C, A)
				])
				continue
			var ring: Array = []
			_mesh_edge(ring, pos, uvs, mtrs, extras, vert_count, A, C)
			_mesh_edge(ring, pos, uvs, mtrs, extras, vert_count, C, D)
			_mesh_edge(ring, pos, uvs, mtrs, extras, vert_count, D, B)
			_mesh_edge(ring, pos, uvs, mtrs, extras, vert_count, B, A)
			_mesh_emit_ring(st, pos, uvs, mtrs, extras, vert_count, ring)

	st.generate_normals()
	return st.commit()


func _mesh_interp(pos: PackedVector3Array, uvs: PackedVector2Array, mtrs: PackedFloat32Array, extras: Array, vert_count: int, ia: int, ib: int) -> int:
	var ma := mtrs[ia]
	var mb := mtrs[ib]
	var denom := mb - ma
	if absf(denom) < 1e-6:
		denom = 1e-6
	var t := clampf((SEA_M - ma) / denom, 0.02, 0.98)
	var pa := pos[ia]
	var pb := pos[ib]
	extras.append({
		"p": Vector3(pa.x + (pb.x - pa.x) * t, COAST_Y, pa.z + (pb.z - pa.z) * t),
		"uv": uvs[ia].lerp(uvs[ib], t),
		"m": SEA_M,
	})
	return vert_count + extras.size() - 1


func _mesh_edge(ring: Array, pos: PackedVector3Array, uvs: PackedVector2Array, mtrs: PackedFloat32Array, extras: Array, vert_count: int, i0: int, i1: int) -> void:
	var l0 := mtrs[i0] > SEA_M
	var l1 := mtrs[i1] > SEA_M
	if l0:
		ring.append(i0)
	if l0 != l1:
		ring.append(_mesh_interp(pos, uvs, mtrs, extras, vert_count, i0, i1))


func _mesh_get_p(pos: PackedVector3Array, extras: Array, vert_count: int, id: int) -> Vector3:
	if id < vert_count:
		return pos[id]
	return extras[id - vert_count]["p"]


func _mesh_get_uv(uvs: PackedVector2Array, extras: Array, vert_count: int, id: int) -> Vector2:
	if id < vert_count:
		return uvs[id]
	return extras[id - vert_count]["uv"]


func _mesh_get_m(mtrs: PackedFloat32Array, extras: Array, vert_count: int, id: int) -> float:
	if id < vert_count:
		return mtrs[id]
	return float(extras[id - vert_count]["m"])


func _mesh_emit3(st: SurfaceTool, pos: PackedVector3Array, uvs: PackedVector2Array, mtrs: PackedFloat32Array, extras: Array, vert_count: int, a: int, b: int, c: int) -> void:
	_add_tri(
		st,
		_mesh_get_p(pos, extras, vert_count, a),
		_mesh_get_p(pos, extras, vert_count, b),
		_mesh_get_p(pos, extras, vert_count, c),
		_mesh_get_m(mtrs, extras, vert_count, a),
		_mesh_get_m(mtrs, extras, vert_count, b),
		_mesh_get_m(mtrs, extras, vert_count, c),
		_mesh_get_uv(uvs, extras, vert_count, a),
		_mesh_get_uv(uvs, extras, vert_count, b),
		_mesh_get_uv(uvs, extras, vert_count, c)
	)


func _mesh_emit_ring(st: SurfaceTool, pos: PackedVector3Array, uvs: PackedVector2Array, mtrs: PackedFloat32Array, extras: Array, vert_count: int, ring: Array) -> void:
	if ring.size() < 3:
		return
	for k in range(1, ring.size() - 1):
		_mesh_emit3(st, pos, uvs, mtrs, extras, vert_count, int(ring[0]), int(ring[k]), int(ring[k + 1]))


func _add_tri(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, ma: float, mb: float, mc: float, uva: Vector2, uvb: Vector2, uvc: Vector2) -> void:
	st.set_color(_terrain_color(ma))
	st.set_uv(uva)
	st.add_vertex(a)
	st.set_color(_terrain_color(mb))
	st.set_uv(uvb)
	st.add_vertex(b)
	st.set_color(_terrain_color(mc))
	st.set_uv(uvc)
	st.add_vertex(c)


func _province_seeds() -> Array:
	var seeds: Array = []
	for p in provinces:
		if p.get("hidden", false):
			continue
		if str(p.get("city", "")) == "":
			continue
		seeds.append(p)
	return seeds


func _nearest_two_seeds(lon: float, lat: float, seeds: Array) -> Dictionary:
	var a := -1
	var b := -1
	var da := 1e9
	var db := 1e9
	for i in seeds.size():
		var p: Dictionary = seeds[i]
		var dlon := (lon - float(p["lon"])) * 0.72
		var dlat := lat - float(p["lat"])
		var d := dlon * dlon + dlat * dlat
		if d < da:
			db = da
			b = a
			da = d
			a = i
		elif d < db:
			db = d
			b = i
	return {"a": a, "b": b, "da": sqrt(da), "db": sqrt(db)}


func _nearest_province(lon: float, lat: float) -> int:
	var seeds := _province_seeds()
	var nn := _nearest_two_seeds(lon, lat, seeds)
	return nn.a


func _is_border_land(lon: float, lat: float) -> bool:
	var m := meters(lon, lat)
	return m > 14.0 and m < 1350.0


func _lonlat_world(lon: float, lat: float, lift: float = 0.18) -> Vector3:
	var p := xz(lon, lat)
	p.y = world_h(lon, lat) + lift
	return p


func _chaikin(pts: Array, iterations: int) -> Array:
	var cur: Array = pts.duplicate()
	for _it in iterations:
		if cur.size() < 2:
			break
		var nxt: Array = [cur[0]]
		for i in range(cur.size() - 1):
			var a: Dictionary = cur[i]
			var b: Dictionary = cur[i + 1]
			nxt.append({
				"lon": float(a["lon"]) * 0.75 + float(b["lon"]) * 0.25,
				"lat": float(a["lat"]) * 0.75 + float(b["lat"]) * 0.25,
			})
			nxt.append({
				"lon": float(a["lon"]) * 0.25 + float(b["lon"]) * 0.75,
				"lat": float(a["lat"]) * 0.25 + float(b["lat"]) * 0.75,
			})
		nxt.append(cur[cur.size() - 1])
		cur = nxt
	return cur


func _sample_bisector_edge(seeds: Array, sa: int, sb: int) -> Array:
	var A: Dictionary = seeds[sa]
	var B: Dictionary = seeds[sb]
	var mid_lon := (float(A["lon"]) + float(B["lon"])) * 0.5
	var mid_lat := (float(A["lat"]) + float(B["lat"])) * 0.5
	var dx := (float(B["lon"]) - float(A["lon"])) * 0.72
	var dy := float(B["lat"]) - float(A["lat"])
	var len := sqrt(dx * dx + dy * dy)
	if len < 1e-6:
		len = 1.0
	var px := (-dy / len) / 0.72
	var py := dx / len
	var max_t := maxf(2.8, len * 3.2)
	var dt := 0.028
	var raw: Array = []
	var t := -max_t
	while t <= max_t:
		var lon := mid_lon + px * t
		var lat := mid_lat + py * t
		t += dt
		if lon < BOX.x - 0.15 or lon > BOX.z + 0.15 or lat < BOX.y - 0.15 or lat > BOX.w + 0.15:
			continue
		if not _is_border_land(lon, lat):
			if raw.size() and raw[raw.size() - 1] != null:
				raw.append(null)
			continue
		var nn := _nearest_two_seeds(lon, lat, seeds)
		if nn.a < 0 or nn.b < 0:
			if raw.size() and raw[raw.size() - 1] != null:
				raw.append(null)
			continue
		var lo := mini(nn.a, nn.b)
		var hi := maxi(nn.a, nn.b)
		if lo != mini(sa, sb) or hi != maxi(sa, sb):
			if raw.size() and raw[raw.size() - 1] != null:
				raw.append(null)
			continue
		# чуть шире полоса вдоль биссектрисы — меньше разрывов
		if absf(nn.db - nn.da) > 0.18:
			if raw.size() and raw[raw.size() - 1] != null:
				raw.append(null)
			continue
		raw.append({"lon": lon, "lat": lat})
	var segs: Array = []
	var cur: Array = []
	for p in raw:
		if p == null:
			if cur.size() >= 5:
				segs.append(cur)
			cur = []
		else:
			cur.append(p)
	if cur.size() >= 5:
		segs.append(cur)
	return segs


func _refine_border_segment(seg: Array) -> Array:
	if seg.size() < 3:
		return []
	var thinned: Array = [seg[0]]
	var prev: Dictionary = seg[0]
	for i in range(1, seg.size()):
		var p: Dictionary = seg[i]
		var dlon := (float(p["lon"]) - float(prev["lon"])) * 0.72
		var dlat := float(p["lat"]) - float(prev["lat"])
		var d := sqrt(dlon * dlon + dlat * dlat)
		if d >= 0.055 or i == seg.size() - 1:
			thinned.append(p)
			prev = p
	if thinned.size() < 3:
		return []
	var smooth := _chaikin(thinned, 5)
	var world: Array = []
	for p in smooth:
		var lon := float(p["lon"])
		var lat := float(p["lat"])
		if not _is_border_land(lon, lat):
			continue
		world.append({"lon": lon, "lat": lat, "v": _lonlat_world(lon, lat, BORDER_LIFT)})
	if world.size() < 3:
		return []
	return _resample_along(world, 0.45)


func _resample_along(world_chain: Array, spacing: float) -> Array:
	var total := 0.0
	var acc: Array = [0.0]
	var seg_len: Array = []
	for i in range(1, world_chain.size()):
		var d: float = world_chain[i]["v"].distance_to(world_chain[i - 1]["v"])
		total += d
		acc.append(total)
		seg_len.append(d)
	if total < spacing * 2.0:
		return world_chain
	var n := maxi(6, int(round(total / spacing)))
	var out: Array = []
	for i in range(n + 1):
		var t := (float(i) / float(n)) * total
		var s := 0
		while s < seg_len.size() - 1 and float(acc[s + 1]) < t:
			s += 1
		var a: Dictionary = world_chain[s]
		var b: Dictionary = world_chain[mini(s + 1, world_chain.size() - 1)]
		var u := 0.0
		if float(seg_len[s]) > 1e-6:
			u = (t - float(acc[s])) / float(seg_len[s])
		var lon_i := float(a["lon"]) + (float(b["lon"]) - float(a["lon"])) * u
		var lat_i := float(a["lat"]) + (float(b["lat"]) - float(a["lat"])) * u
		if not _is_border_land(lon_i, lat_i):
			continue
		out.append({"lon": lon_i, "lat": lat_i, "v": _lonlat_world(lon_i, lat_i, BORDER_LIFT)})
	return out if out.size() >= 3 else world_chain


func _parallel_offsets(world_chain: Array, half_sep: float, side_a_lon: float, side_a_lat: float) -> Dictionary:
	var tangents: Array[Vector2] = []
	for i in world_chain.size():
		var prev: Dictionary = world_chain[maxi(0, i - 1)]
		var next: Dictionary = world_chain[mini(world_chain.size() - 1, i + 1)]
		var va: Vector3 = prev["v"]
		var vb: Vector3 = next["v"]
		var tx: float = vb.x - va.x
		var tz: float = vb.z - va.z
		var len: float = sqrt(tx * tx + tz * tz)
		if len < 1e-6:
			len = 1.0
		tangents.append(Vector2(tx / len, tz / len))
	for i in range(1, tangents.size() - 1):
		var tx2: float = tangents[i - 1].x + tangents[i].x + tangents[i + 1].x
		var tz2: float = tangents[i - 1].y + tangents[i].y + tangents[i + 1].y
		var len2: float = sqrt(tx2 * tx2 + tz2 * tz2)
		if len2 < 1e-6:
			len2 = 1.0
		tangents[i] = Vector2(tx2 / len2, tz2 / len2)
	var left: Array = []
	var right: Array = []
	for i in world_chain.size():
		var mid: Dictionary = world_chain[i]
		var tan: Vector2 = tangents[i]
		var px: float = -tan.y
		var pz: float = tan.x
		var mid_v: Vector3 = mid["v"]
		# пересчитать Y по земле после смещения
		var cx: float = (side_a_lon - CX) * SCALE - mid_v.x
		var cz: float = (CY - side_a_lat) * SCALE - mid_v.z
		var cross: float = cx * px + cz * pz
		var sign: float = 1.0 if cross >= 0.0 else -1.0
		var ox: float = px * half_sep * sign
		var oz: float = pz * half_sep * sign
		var la := lonlat_from_xz(mid_v.x + ox, mid_v.z + oz)
		var lb := lonlat_from_xz(mid_v.x - ox, mid_v.z - oz)
		left.append(Vector3(mid_v.x + ox, world_h(la.x, la.y) + BORDER_LIFT, mid_v.z + oz))
		right.append(Vector3(mid_v.x - ox, world_h(lb.x, lb.y) + BORDER_LIFT, mid_v.z - oz))
	return {"a": left, "b": right}


## Сплошная полоса: сглаженные нормали вдоль всей кривой (без «огрызков»).
func _add_border_ribbon(parent: Node3D, pts: Array, color: Color, half_w: float) -> void:
	if pts.size() < 3:
		return
	var tangents: Array[Vector2] = []
	for i in pts.size():
		var prev: Vector3 = pts[maxi(0, i - 1)]
		var next: Vector3 = pts[mini(pts.size() - 1, i + 1)]
		var tx: float = next.x - prev.x
		var tz: float = next.z - prev.z
		var len: float = sqrt(tx * tx + tz * tz)
		if len < 1e-6:
			len = 1.0
		tangents.append(Vector2(tx / len, tz / len))
	for i in range(1, tangents.size() - 1):
		var sx: float = tangents[i - 1].x + tangents[i].x + tangents[i + 1].x
		var sz: float = tangents[i - 1].y + tangents[i].y + tangents[i + 1].y
		var sl: float = sqrt(sx * sx + sz * sz)
		if sl < 1e-6:
			sl = 1.0
		tangents[i] = Vector2(sx / sl, sz / sl)

	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(pts.size() - 1):
		var p0: Vector3 = pts[i]
		var p1: Vector3 = pts[i + 1]
		var s0 := Vector3(-tangents[i].y, 0.0, tangents[i].x) * half_w
		var s1 := Vector3(-tangents[i + 1].y, 0.0, tangents[i + 1].x) * half_w
		st.add_vertex(p0 - s0)
		st.add_vertex(p0 + s0)
		st.add_vertex(p1 + s1)
		st.add_vertex(p0 - s0)
		st.add_vertex(p1 + s1)
		st.add_vertex(p1 - s1)
	var mesh := st.commit()
	if mesh.get_surface_count() == 0:
		return
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(color.r, color.g, color.b, 0.95)
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.render_priority = 2
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)


## Непрерывные полосы границ (биссектрисы + Chaikin), как View 14.
func _add_province_borders() -> void:
	if border_root:
		border_root.queue_free()
	border_root = Node3D.new()
	border_root.name = "provinceBorders"
	add_child(border_root)
	var seeds := _province_seeds()
	if seeds.size() < 2:
		return
	for i in seeds.size():
		for j in range(i + 1, seeds.size()):
			var segs := _sample_bisector_edge(seeds, i, j)
			if segs.is_empty():
				continue
			var pa: Dictionary = seeds[i]
			var pb: Dictionary = seeds[j]
			var same := str(pa["faction"]) == str(pb["faction"])
			var fac_a: Dictionary = factions.get(str(pa["faction"]), factions["rebels"])
			var fac_b: Dictionary = factions.get(str(pb["faction"]), factions["rebels"])
			var col_a: Color = fac_a.get("border", Color("c42828"))
			var col_b: Color = fac_b.get("border", Color("c42828"))
			for seg in segs:
				var refined := _refine_border_segment(seg)
				if refined.size() < 3:
					continue
				if same:
					var pts: Array = []
					for p in refined:
						pts.append(p["v"])
					_add_border_ribbon(border_root, pts, col_a, BORDER_HALF)
				else:
					var pair := _parallel_offsets(refined, BORDER_DUAL_SEP, float(pa["lon"]), float(pa["lat"]))
					_add_border_ribbon(border_root, pair["a"], col_a, BORDER_HALF * 0.85)
					_add_border_ribbon(border_root, pair["b"], col_b, BORDER_HALF * 0.85)


func _add_roads() -> void:
	var by_city := {}
	for p in provinces:
		if str(p.get("city", "")) != "":
			by_city[p["city"]] = p
	for pair in roads:
		if not by_city.has(pair[0]) or not by_city.has(pair[1]):
			continue
		var a: Dictionary = by_city[pair[0]]
		var b: Dictionary = by_city[pair[1]]
		var pa := xz(a["lon"], a["lat"])
		var pb := xz(b["lon"], b["lat"])
		pa.y = world_h(a["lon"], a["lat"]) + 0.1
		pb.y = world_h(b["lon"], b["lat"]) + 0.1
		var mid := (pa + pb) * 0.5
		mid.y += 0.15
		var im := ImmediateMesh.new()
		im.surface_begin(Mesh.PRIMITIVE_TRIANGLES)
		var dir := (pb - pa).normalized()
		var side := Vector3(-dir.z, 0, dir.x) * 0.16
		var pts := [pa, mid, pb]
		for k in range(pts.size() - 1):
			var p0: Vector3 = pts[k]
			var p1: Vector3 = pts[k + 1]
			im.surface_add_vertex(p0 - side)
			im.surface_add_vertex(p0 + side)
			im.surface_add_vertex(p1 + side)
			im.surface_add_vertex(p0 - side)
			im.surface_add_vertex(p1 + side)
			im.surface_add_vertex(p1 - side)
		im.surface_end()
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color("c4a56a")
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		var mi := MeshInstance3D.new()
		mi.mesh = im
		mi.material_override = mat
		add_child(mi)


func _add_cities() -> void:
	city_marks.clear()
	for child in city_root.get_children():
		child.queue_free()
	for p in provinces:
		if p.get("hidden", false) or str(p.get("city", "")) == "":
			continue
		var pos := xz(p["lon"], p["lat"])
		pos.y = world_h(p["lon"], p["lat"])
		var root := Node3D.new()
		root.position = pos
		city_root.add_child(root)
		var capital := bool(p.get("capital", false))
		var s := 1.35 if capital else 1.0
		var half := 0.85 * s
		var fac: Dictionary = factions.get(p["faction"], {"banner": Color("a03030")})
		var stone := StandardMaterial3D.new()
		stone.albedo_color = Color("d8cbb0")
		var dark := StandardMaterial3D.new()
		dark.albedo_color = Color("8a7a62")
		var roof := StandardMaterial3D.new()
		roof.albedo_color = Color("7a3030")
		# стены
		var wall := MeshInstance3D.new()
		var wall_mesh := BoxMesh.new()
		wall_mesh.size = Vector3(half * 2.0, 0.35 * s, half * 2.0)
		wall.mesh = wall_mesh
		wall.position.y = 0.18 * s
		wall.material_override = stone
		root.add_child(wall)
		# башни по углам
		for corner in [Vector2(-half, -half), Vector2(half, -half), Vector2(-half, half), Vector2(half, half)]:
			var tw := MeshInstance3D.new()
			var tbox := BoxMesh.new()
			tbox.size = Vector3(0.38 * s, 0.95 * s, 0.38 * s)
			tw.mesh = tbox
			tw.position = Vector3(corner.x, 0.48 * s, corner.y)
			tw.material_override = dark
			root.add_child(tw)
			var cap := MeshInstance3D.new()
			var cone := CylinderMesh.new()
			cone.top_radius = 0.01
			cone.bottom_radius = 0.28 * s
			cone.height = 0.32 * s
			cap.mesh = cone
			cap.position = Vector3(corner.x, 0.95 * s + 0.16 * s, corner.y)
			cap.material_override = roof
			root.add_child(cap)
		# дома
		var house := MeshInstance3D.new()
		var hbox := BoxMesh.new()
		hbox.size = Vector3(0.7 * s, 0.42 * s, 0.55 * s)
		house.mesh = hbox
		house.position = Vector3(-0.2 * s, 0.35 * s, -0.1 * s)
		house.material_override = stone
		root.add_child(house)
		# кольцо выбора
		var ring := MeshInstance3D.new()
		var torus := TorusMesh.new()
		torus.inner_radius = half + 0.08 * s
		torus.outer_radius = half + 0.28 * s
		torus.rings = 12
		torus.ring_segments = 24
		ring.mesh = torus
		ring.rotation_degrees.x = 90
		ring.position.y = 0.06
		var rm := StandardMaterial3D.new()
		rm.albedo_color = Color(0.24, 0.81, 0.35, 0.9)
		rm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		rm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		ring.material_override = rm
		ring.visible = false
		root.add_child(ring)
		# флагшток
		var pole := MeshInstance3D.new()
		var cyl := CylinderMesh.new()
		cyl.top_radius = 0.04 * s
		cyl.bottom_radius = 0.05 * s
		cyl.height = (3.6 if capital else 3.0) * s
		pole.mesh = cyl
		pole.position = Vector3(half + 0.28 * s, cyl.height * 0.5, 0)
		var pm := StandardMaterial3D.new()
		pm.albedo_color = Color("c9b070")
		pole.material_override = pm
		root.add_child(pole)
		var flag := MeshInstance3D.new()
		var fb := BoxMesh.new()
		fb.size = Vector3(1.1 * s, 1.4 * s, 0.04 * s)
		flag.mesh = fb
		flag.position = Vector3(half + 0.28 * s + 0.6 * s, cyl.height - 0.75 * s, 0)
		var fm := StandardMaterial3D.new()
		fm.albedo_color = fac["banner"]
		flag.material_override = fm
		root.add_child(flag)
		# подпись
		var label := Label3D.new()
		label.text = str(p["ru"]).to_upper()
		label.font_size = 42 if capital else 34
		label.outline_size = 8
		label.modulate = Color("fff8ec")
		label.outline_modulate = Color(fac["banner"])
		label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		label.position = Vector3(0, (5.8 if capital else 4.4), 0)
		root.add_child(label)
		city_marks.append({
			"pos": pos,
			"name": p["city"],
			"ru": p["ru"],
			"id": p["id"],
			"campaign": _campaign_name(p["city"]),
			"faction": p["faction"],
			"capital": capital,
			"root": root,
			"ring": ring,
			"lon": p["lon"],
			"lat": p["lat"],
		})


func _set_city_selected(idx: int) -> void:
	selected_city_idx = idx
	for i in city_marks.size():
		var m: Dictionary = city_marks[i]
		if m.has("ring") and m["ring"]:
			m["ring"].visible = (i == idx)


func _rebuild_armies(field_armies: Array) -> void:
	for a in armies:
		if a.has("root") and a["root"]:
			a["root"].queue_free()
	armies.clear()
	selected_army_idx = -1
	for fa in field_armies:
		if typeof(fa) != TYPE_DICTIONARY:
			continue
		var id := str(fa.get("id", ""))
		if id == "":
			continue
		var lon := float(fa.get("lon", 12.35))
		var lat := float(fa.get("lat", 41.78))
		var fac := str(fa.get("faction", "rome"))
		var col := Color("8a2a22") if fac == "rome" else (Color("2a4a9a") if fac == "carthage" else Color("b08a38"))
		_add_army(id, lon, lat, col)


func _mat(c: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = 0.75
	return m


func _limb_node(parent: Node3D, x: float, y: float, z: float, sx: float, sy: float, sz: float, mat: Material) -> Node3D:
	var pivot := Node3D.new()
	pivot.position = Vector3(x, y, z)
	parent.add_child(pivot)
	var mesh := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(sx, sy, sz)
	mesh.mesh = box
	mesh.position.y = -sy * 0.5
	mesh.material_override = mat
	pivot.add_child(mesh)
	return pivot


func _add_army(id: String, lon: float, lat: float, color: Color) -> void:
	var root := Node3D.new()
	var start := xz(lon, lat)
	start.y = world_h(lon, lat) + 0.08
	root.position = start
	root.scale = Vector3(2.0, 2.0, 2.0)
	if army_root:
		army_root.add_child(root)
	else:
		add_child(root)

	var bronze := _mat(Color("8a6a38"))
	var cloth := _mat(color)
	var skin := _mat(Color("c4a07a"))
	var leather := _mat(Color("4a3220"))
	var wood := _mat(Color("6a4a28"))
	var metal := _mat(Color("b0b0b8"))

	var hips := Node3D.new()
	hips.position.y = 0.72
	root.add_child(hips)
	var left_leg := _limb_node(hips, -0.11, 0, 0.02, 0.15, 0.4, 0.16, leather)
	var right_leg := _limb_node(hips, 0.11, 0, 0.02, 0.15, 0.4, 0.16, leather)
	var left_shin := _limb_node(left_leg, 0, -0.4, 0, 0.13, 0.36, 0.14, bronze)
	var right_shin := _limb_node(right_leg, 0, -0.4, 0, 0.13, 0.36, 0.14, bronze)

	var torso := MeshInstance3D.new()
	var tbox := BoxMesh.new()
	tbox.size = Vector3(0.42, 0.52, 0.24)
	torso.mesh = tbox
	torso.position.y = 1.08
	torso.material_override = bronze
	root.add_child(torso)
	var skirt := MeshInstance3D.new()
	var sbox := BoxMesh.new()
	sbox.size = Vector3(0.46, 0.18, 0.28)
	skirt.mesh = sbox
	skirt.position.y = 0.78
	skirt.material_override = cloth
	root.add_child(skirt)

	var left_arm := _limb_node(root, -0.28, 1.24, 0, 0.12, 0.42, 0.12, skin)
	left_arm.rotation_degrees.x = -10
	var right_arm := _limb_node(root, 0.28, 1.24, 0, 0.12, 0.42, 0.12, skin)
	right_arm.rotation_degrees.x = -10

	# щит на левой руке
	var shield := MeshInstance3D.new()
	var sh := BoxMesh.new()
	sh.size = Vector3(0.08, 0.42, 0.28)
	shield.mesh = sh
	shield.position = Vector3(-0.12, -0.2, 0.06)
	shield.material_override = wood
	left_arm.add_child(shield)
	var boss := MeshInstance3D.new()
	var boss_m := SphereMesh.new()
	boss_m.radius = 0.04
	boss.mesh = boss_m
	boss.position = Vector3(-0.05, -0.2, 0.06)
	boss.material_override = metal
	left_arm.add_child(boss)

	# меч на правой руке
	var sword := MeshInstance3D.new()
	var blade := BoxMesh.new()
	blade.size = Vector3(0.05, 0.55, 0.02)
	sword.mesh = blade
	sword.position = Vector3(0.02, -0.45, 0.04)
	sword.material_override = metal
	right_arm.add_child(sword)
	var hilt := MeshInstance3D.new()
	var hilt_m := BoxMesh.new()
	hilt_m.size = Vector3(0.12, 0.04, 0.04)
	hilt.mesh = hilt_m
	hilt.position = Vector3(0.02, -0.18, 0.04)
	hilt.material_override = bronze
	right_arm.add_child(hilt)

	var head := MeshInstance3D.new()
	var hs := SphereMesh.new()
	hs.radius = 0.14
	head.mesh = hs
	head.position.y = 1.44
	head.material_override = skin
	root.add_child(head)
	var helm := MeshInstance3D.new()
	var hm := SphereMesh.new()
	hm.radius = 0.155
	hm.height = 0.22
	helm.mesh = hm
	helm.position.y = 1.50
	helm.material_override = bronze
	root.add_child(helm)
	var crest := MeshInstance3D.new()
	var cr := BoxMesh.new()
	cr.size = Vector3(0.06, 0.22, 0.28)
	crest.mesh = cr
	crest.position.y = 1.64
	crest.material_override = cloth
	root.add_child(crest)

	var ring := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 0.38
	torus.outer_radius = 0.52
	ring.mesh = torus
	ring.rotation_degrees.x = 90
	ring.position.y = 0.04
	var rm := StandardMaterial3D.new()
	rm.albedo_color = Color(0.91, 0.78, 0.42, 0.92)
	rm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	rm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	ring.material_override = rm
	ring.visible = false
	root.add_child(ring)

	armies.append({
		"id": id,
		"root": root,
		"ring": ring,
		"left_leg": left_leg,
		"right_leg": right_leg,
		"left_shin": left_shin,
		"right_shin": right_shin,
		"left_arm": left_arm,
		"right_arm": right_arm,
		"selected": false,
		"visible": true,
		"color": color,
		"walking": false,
		"goal": null,
		"walk_t": 0.0,
	})


func _can_walk_ll(lon: float, lat: float) -> String:
	var m := meters(lon, lat)
	if m <= WALK_SEA_MAX:
		return "Сюда нельзя: море"
	if m >= WALK_MTN_MIN:
		return "Сюда нельзя: высокие горы"
	return ""


func _can_walk_xz(x: float, z: float) -> String:
	var ll := lonlat_from_xz(x, z)
	return _can_walk_ll(ll.x, ll.y)


func _set_army_goal(a: Dictionary, goal: Vector3, lon: float, lat: float) -> void:
	a["goal"] = {"pos": goal, "lon": lon, "lat": lat}
	a["walking"] = true
	a["walk_t"] = 0.0
	var root: Node3D = a["root"]
	var dx := goal.x - root.position.x
	var dz := goal.z - root.position.z
	if absf(dx) + absf(dz) > 0.01:
		root.rotation.y = atan2(dx, dz)


func _tick_armies(delta: float) -> void:
	for a in armies:
		if not a.get("visible", true):
			continue
		var root: Node3D = a["root"]
		var walking: bool = a.get("walking", false)
		var left_leg: Node3D = a["left_leg"]
		var right_leg: Node3D = a["right_leg"]
		var left_arm: Node3D = a["left_arm"]
		var right_arm: Node3D = a["right_arm"]
		if walking and a.get("goal") != null:
			var goal: Dictionary = a["goal"]
			var gp: Vector3 = goal["pos"]
			var cur := root.position
			var to := Vector3(gp.x - cur.x, 0.0, gp.z - cur.z)
			var dist := to.length()
			if dist < 0.35:
				var ll := lonlat_from_xz(gp.x, gp.z)
				root.position = Vector3(gp.x, world_h(ll.x, ll.y) + 0.08, gp.z)
				a["walking"] = false
				a["goal"] = null
				a["walk_t"] = 0.0
				left_leg.rotation.x = 0.0
				right_leg.rotation.x = 0.0
				left_arm.rotation.x = deg_to_rad(-10)
				right_arm.rotation.x = deg_to_rad(-10)
				_post_js("""
(function(){
  try {
    var CS = window.parent && window.parent.CampaignState;
    if (CS && CS.updateFieldArmyPosition) CS.updateFieldArmyPosition('%s', %s, %s);
  } catch (e) {}
})();
""" % [a["id"], str(ll.x), str(ll.y)])
				status_label.text = "Армия на месте"
			else:
				var step := minf(ARMY_SPEED * delta, dist)
				var dir := to.normalized()
				var nx := cur.x + dir.x * step
				var nz := cur.z + dir.z * step
				var block := _can_walk_xz(nx, nz)
				if block != "":
					a["walking"] = false
					a["goal"] = null
					a["walk_t"] = 0.0
					left_leg.rotation.x = 0.0
					right_leg.rotation.x = 0.0
					status_label.text = block
				else:
					var ll2 := lonlat_from_xz(nx, nz)
					root.position = Vector3(nx, world_h(ll2.x, ll2.y) + 0.08, nz)
					root.rotation.y = atan2(dir.x, dir.z)
					a["walk_t"] = float(a["walk_t"]) + delta * 8.0
					var swing := sin(float(a["walk_t"])) * deg_to_rad(18.0)
					left_leg.rotation.x = swing
					right_leg.rotation.x = -swing
					left_arm.rotation.x = deg_to_rad(-10) - swing * 0.7
					right_arm.rotation.x = deg_to_rad(-10) + swing * 0.7
		else:
			# лёгкое дыхание в покое
			pass


func _campaign_name(n: String) -> String:
	var alias := {
		"Mediolanum": "Mediolanium", "Segesta": "Genua", "Rome": "Roma",
		"Croton": "Rhegium", "Messana": "Rhegium", "Syracuse": "Syracusae",
		"Lilybaeum": "Syracusae", "Salona": "Patavium",
	}
	return alias.get(n, n)


func _apply_cam() -> void:
	if camera == null:
		return
	var dist := BASE_DIST / cam_zoom
	var a := deg_to_rad(cam_tilt)
	var yaw := deg_to_rad(cam_yaw)
	camera.position = Vector3(
		target.x + sin(yaw) * dist * cos(a),
		target.y + maxf(4.0, dist * sin(a)),
		target.z + cos(yaw) * dist * cos(a)
	)
	camera.look_at(target)
	_update_hud()


func _update_hud() -> void:
	if hud_zoom:
		hud_zoom.text = "Зум %d%%" % int(round(cam_zoom * 100.0))
	if hud_tilt:
		hud_tilt.text = "Наклон %d%%" % int(round(cam_tilt / TILT_MAX * 100.0))
	if hud_yaw:
		hud_yaw.text = "Поворот %d°" % int(round(fposmod(cam_yaw, 360.0)))


func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP and mb.pressed:
			cam_zoom = minf(MAX_ZOOM, cam_zoom * 1.1)
			_apply_cam()
			get_viewport().set_input_as_handled()
		elif mb.button_index == MOUSE_BUTTON_WHEEL_DOWN and mb.pressed:
			cam_zoom = maxf(MIN_ZOOM, cam_zoom / 1.1)
			_apply_cam()
			get_viewport().set_input_as_handled()
		elif mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				# сначала армия (ЛКМ по человечку), потом город
				if _try_select_army(mb.position) or _try_select_city(mb.position):
					dragging = false
				else:
					_set_city_selected(-1)
					_post_message({"type": "city-deselect"})
					if allow_pan:
						dragging = true
						last_mouse = mb.position
			else:
				dragging = false
		elif mb.button_index == MOUSE_BUTTON_RIGHT and mb.pressed:
			_try_move_army(mb.position)
	elif event is InputEventMouseMotion and dragging and allow_pan:
		var mm := event as InputEventMouseMotion
		var dx := mm.relative.x
		var dy := mm.relative.y
		var yaw := deg_to_rad(cam_yaw)
		var k := 0.05 / cam_zoom
		target.x -= (cos(yaw) * dx + sin(yaw) * dy) * k
		target.z -= (-sin(yaw) * dx + cos(yaw) * dy) * k
		_apply_cam()
	elif event is InputEventKey and event.pressed and not event.echo:
		var key := event as InputEventKey
		# physical_keycode — работает при русской раскладке (родитель шлёт e.code)
		var pk := key.physical_keycode
		if pk == KEY_Q or key.keycode == KEY_Q:
			_nudge_tilt(-TILT_STEP)
			get_viewport().set_input_as_handled()
		elif pk == KEY_E or key.keycode == KEY_E:
			_nudge_tilt(TILT_STEP)
			get_viewport().set_input_as_handled()
		elif pk == KEY_Z or key.keycode == KEY_Z:
			_nudge_yaw(-YAW_STEP)
			get_viewport().set_input_as_handled()
		elif pk == KEY_C or key.keycode == KEY_C:
			_nudge_yaw(YAW_STEP)
			get_viewport().set_input_as_handled()


func _pick_ground(screen_pos: Vector2) -> Variant:
	var from := camera.project_ray_origin(screen_pos)
	var dir := camera.project_ray_normal(screen_pos)
	var hit := from
	for _i in 40:
		hit = hit + dir * 2.5
		var ll := lonlat_from_xz(hit.x, hit.z)
		var y := world_h(ll.x, ll.y)
		if hit.y <= y + 0.2:
			return {"pos": Vector3(hit.x, y, hit.z), "lon": ll.x, "lat": ll.y}
		if hit.y < -5.0:
			break
	return null


func _try_select_city(screen_pos: Vector2) -> bool:
	var best = null
	var best_i := -1
	var best_d := 28.0
	for i in city_marks.size():
		var m: Dictionary = city_marks[i]
		var sp := camera.unproject_position(m["pos"] + Vector3(0, 1.2, 0))
		var d := sp.distance_to(screen_pos)
		if d < best_d:
			best_d = d
			best = m
			best_i = i
	if best == null:
		return false
	_set_city_selected(best_i)
	status_label.text = "Город: %s" % best["ru"]
	var fac := "rome" if str(best["faction"]) in ["spqr", "julii", "brutii", "scipii"] else str(best["faction"])
	_post_message({
		"type": "city-select",
		"city": {
			"name": best["campaign"],
			"ru": best["ru"],
			"region": best.get("id", ""),
			"lon": best["lon"],
			"lat": best["lat"],
			"faction": fac,
			"capital": best["capital"],
			"view14Id": best.get("id", ""),
		},
		"tab": "settlement"
	})
	selected_army_idx = -1
	_refresh_army_rings()
	return true


func _refresh_army_rings() -> void:
	for i in armies.size():
		var a: Dictionary = armies[i]
		if a.has("ring") and a["ring"]:
			a["ring"].visible = (i == selected_army_idx)


func _try_select_army(screen_pos: Vector2) -> bool:
	for i in armies.size():
		var a: Dictionary = armies[i]
		if not a["visible"]:
			continue
		var root: Node3D = a["root"]
		var sp := camera.unproject_position(root.position + Vector3(0, 1.2, 0))
		if sp.distance_to(screen_pos) > 36.0:
			continue
		selected_army_idx = i
		_set_city_selected(-1)
		_refresh_army_rings()
		status_label.text = "Армия выбрана · ПКМ — идти"
		_post_message({"type": "army-select", "armyId": a["id"]})
		return true
	return false


func _try_move_army(screen_pos: Vector2) -> void:
	if selected_army_idx < 0 or selected_army_idx >= armies.size():
		return
	var a: Dictionary = armies[selected_army_idx]
	var root: Node3D = a["root"]
	var hit = _pick_ground(screen_pos)
	if hit == null:
		return
	var block := _can_walk_ll(hit["lon"], hit["lat"])
	if block != "":
		status_label.text = block
		return
	for c in city_marks:
		if absf(c["lon"] - hit["lon"]) < 0.22 and absf(c["lat"] - hit["lat"]) < 0.18:
			_post_js("""
(function(){
  try {
    var CS = window.parent && window.parent.CampaignState;
    if (CS && CS.mergeFieldArmyIntoCity) CS.mergeFieldArmyIntoCity('%s', '%s');
  } catch (e) {}
})();
""" % [a["id"], c["campaign"]])
			_post_message({"type": "army-merged", "city": c["campaign"], "cityRu": c["ru"]})
			status_label.text = "Армия входит в %s" % c["ru"]
			a["visible"] = false
			a["walking"] = false
			a["goal"] = null
			root.visible = false
			selected_army_idx = -1
			_refresh_army_rings()
			return
	_set_army_goal(a, hit["pos"] + Vector3(0, 0.08, 0), hit["lon"], hit["lat"])
	status_label.text = "Армия на марше"


func _post_message(data: Dictionary) -> void:
	if not OS.has_feature("web"):
		return
	JavaScriptBridge.eval("window.parent.postMessage(%s, '*');" % JSON.stringify(data))


func _post_js(code: String) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval(code)


func _setup_js_bridge() -> void:
	if not OS.has_feature("web"):
		return
	# Очередь создаётся ещё в map.html; здесь только догоняем слушатель.
	JavaScriptBridge.eval("""
(function(){
  window.__godotMsgQueue = window.__godotMsgQueue || [];
  if (window.__godotView16Bridge) return;
  window.__godotView16Bridge = true;
  window.addEventListener('message', function(e){
    if (!e.data || typeof e.data !== 'object') return;
    var t = e.data.type;
    if (t === 'campaign-sync' || t === 'camera-tilt' || t === 'camera-rotate' || t === 'camera-goto') {
      window.__godotMsgQueue.push(e.data);
    }
  });
})();
""")


func _process(delta: float) -> void:
	_tick_armies(delta)
	if not OS.has_feature("web"):
		return
	var raw = JavaScriptBridge.eval("JSON.stringify((window.__godotMsgQueue||[]).splice(0))")
	if typeof(raw) != TYPE_STRING:
		return
	var s := str(raw)
	if s == "" or s == "[]" or s == "null":
		return
	var parsed = JSON.parse_string(s)
	if typeof(parsed) != TYPE_ARRAY:
		return
	for msg in parsed:
		if typeof(msg) == TYPE_DICTIONARY:
			_handle_parent_msg(msg)


func _handle_parent_msg(msg: Dictionary) -> void:
	var t: String = str(msg.get("type", ""))
	if t == "camera-tilt":
		if msg.has("delta"):
			cam_tilt = clampf(cam_tilt + float(msg["delta"]), TILT_MIN, TILT_MAX)
		elif msg.has("deg"):
			cam_tilt = clampf(float(msg["deg"]), TILT_MIN, TILT_MAX)
		_apply_cam()
	elif t == "camera-rotate":
		if msg.has("delta"):
			cam_yaw = fposmod(cam_yaw + float(msg["delta"]), 360.0)
		elif msg.has("deg"):
			cam_yaw = fposmod(float(msg["deg"]), 360.0)
		_apply_cam()
	elif t == "camera-goto" and msg.has("lon") and msg.has("lat"):
		var p := xz(float(msg["lon"]), float(msg["lat"]))
		target.x = p.x
		target.z = p.z
		target.y = world_h(float(msg["lon"]), float(msg["lat"])) + 1.0
		_apply_cam()
	elif t == "campaign-sync":
		var st = msg.get("state", {})
		if typeof(st) == TYPE_DICTIONARY:
			var fas = st.get("fieldArmies", [])
			if typeof(fas) == TYPE_ARRAY:
				_rebuild_armies(fas)
			status_label.text = "Кампания синхронизирована · городов %d" % city_marks.size()
		else:
			status_label.text = "Синхронизация кампании"
