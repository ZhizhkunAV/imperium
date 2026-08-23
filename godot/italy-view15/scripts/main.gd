extends Node3D

## View 15 — Godot 4 campaign map (cities, roads, resources, armies via JS bridge)

const BOX := Vector4(6.4, 36.2, 18.9, 47.4) # lon0, lat0, lon1, lat1
const CX := 12.48
const CY := 41.89
const SCALE := 33.0
const DEM_OFFSET := 500.0
const COLS := 220
const ROWS := 260

const TILT_MIN := 8.0
const TILT_MAX := 75.0
const TILT_STEP := 3.0
const YAW_STEP := 6.0
const MIN_ZOOM := 0.35
const MAX_ZOOM := 3.2
const BASE_DIST := 52.0

var cam_tilt := 58.0
var cam_zoom := 1.05
var cam_yaw := 0.0
var target := Vector3(0.0, 2.2, 0.0)

var dem_w := 0
var dem_h := 0
var dem_data: PackedFloat32Array = PackedFloat32Array()

var camera: Camera3D
var land: MeshInstance3D
var status_label: Label
var hud_zoom: Label
var hud_tilt: Label
var hud_yaw: Label

var dragging := false
var last_mouse := Vector2.ZERO
var allow_pan := true
var city_marks: Array = [] # {pos, name, ru, campaign, faction, capital, mesh}
var army_root: Node3D
var army_selected := false
var army_id := "field-1"
var field_army_visible := true

var provinces: Array = []
var roads: Array = []
var factions: Dictionary = {}

var _js_cb_sync = null
var _js_cb_tilt = null
var _js_cb_rotate = null


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
	factions = {
		"spqr": {"banner": Color("6a3d8a")},
		"julii": {"banner": Color("9a3030")},
		"brutii": {"banner": Color("7a2028")},
		"scipii": {"banner": Color("2a6a68")},
		"greek": {"banner": Color("b08a38")},
		"carthage": {"banner": Color("e8e4d8")},
		"rebels": {"banner": Color("6a5a48")},
	}
	provinces = [
		{"city": "Mediolanum", "ru": "Медиолан", "lon": 9.19, "lat": 45.46, "faction": "julii", "resources": ["iron"], "capital": false},
		{"city": "Patavium", "ru": "Патавий", "lon": 11.88, "lat": 45.41, "faction": "julii", "resources": ["glass"], "capital": false},
		{"city": "Segesta", "ru": "Сегеста", "lon": 8.47, "lat": 44.58, "faction": "julii", "resources": ["timber"], "capital": false},
		{"city": "Arretium", "ru": "Арреций", "lon": 11.88, "lat": 43.46, "faction": "julii", "resources": ["iron"], "capital": false},
		{"city": "Ariminum", "ru": "Аримин", "lon": 12.57, "lat": 44.06, "faction": "julii", "resources": ["pottery"], "capital": false},
		{"city": "Rome", "ru": "Рим", "lon": 12.48, "lat": 41.89, "faction": "spqr", "resources": [], "capital": true},
		{"city": "Capua", "ru": "Капуя", "lon": 14.22, "lat": 41.10, "faction": "carthage", "resources": ["wine"], "capital": false},
		{"city": "Tarentum", "ru": "Тарент", "lon": 17.24, "lat": 40.47, "faction": "brutii", "resources": ["copper"], "capital": false},
		{"city": "Croton", "ru": "Кротон", "lon": 17.12, "lat": 39.08, "faction": "brutii", "resources": ["silver"], "capital": false},
		{"city": "Messana", "ru": "Мессана", "lon": 15.55, "lat": 38.19, "faction": "scipii", "resources": [], "capital": false},
		{"city": "Syracuse", "ru": "Сиракузы", "lon": 15.29, "lat": 37.08, "faction": "greek", "resources": ["grain"], "capital": false},
		{"city": "Lilybaeum", "ru": "Лилибей", "lon": 12.43, "lat": 37.80, "faction": "carthage", "resources": [], "capital": false},
		{"city": "Caralis", "ru": "Каралис", "lon": 9.12, "lat": 39.22, "faction": "carthage", "resources": ["wine"], "capital": false},
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
	title.text = "Вид 15 · Godot 4"
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
	hint.text = "ЛКМ — пан/город/армия · ПКМ — ход · Q/E наклон · колесо зум"
	hint.add_theme_font_size_override("font_size", 12)
	vb.add_child(hint)


func _load_dem() -> void:
	var img := Image.new()
	var err := img.load("res://italy-height.png")
	if err != OK:
		status_label.text = "DEM не загрузился — упрощённый рельеф"
		return
	dem_w = img.get_width()
	dem_h = img.get_height()
	dem_data.resize(dem_w * dem_h)
	for y in dem_h:
		for x in dem_w:
			var c := img.get_pixel(x, y)
			var hi := int(c.r * 255.0)
			var lo := int(c.g * 255.0)
			dem_data[y * dem_w + x] = float(hi * 256 + lo) - DEM_OFFSET


func meters(lon: float, lat: float) -> float:
	if dem_w <= 0:
		return 120.0
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


func alpine_pass_carve(lon: float, lat: float, m: float) -> float:
	if m <= 200.0 or lat < 44.9:
		return m
	if lat >= 45.45 and lat <= 47.05 and absf(lon - 9.05) < 0.55:
		var t1 := 1.0 - minf(1.0, absf(lon - 9.05) / 0.48)
		t1 *= minf(1.0, (lat - 45.45) / 0.15)
		t1 *= minf(1.0, (47.05 - lat) / 0.35)
		m = minf(m, 180.0 + (1.0 - t1 * t1) * 520.0)
	if lat >= 45.4 and lat <= 47.15 and absf(lon - 11.75) < 0.58:
		var t2 := 1.0 - minf(1.0, absf(lon - 11.75) / 0.5)
		t2 *= minf(1.0, (lat - 45.4) / 0.15)
		t2 *= minf(1.0, (47.15 - lat) / 0.4)
		m = minf(m, 160.0 + (1.0 - t2 * t2) * 480.0)
	if lat > 45.2 and m > 700.0:
		var peak := sin(lon * 3.1) * cos(lat * 2.7) * 0.5 + sin(lon * 7.3 + lat * 5.1) * 0.35
		var keep := clampf(0.35 + peak * 0.65, 0.2, 1.0)
		m = 420.0 + (m - 420.0) * keep
	return m


func world_h(lon: float, lat: float) -> float:
	var m := alpine_pass_carve(lon, lat, meters(lon, lat))
	if m <= 8.0:
		return 0.04
	return 0.18 + m / 3000.0 * 20.0


func xz(lon: float, lat: float) -> Vector3:
	return Vector3((lon - CX) * SCALE, 0.0, (CY - lat) * SCALE)


func lonlat_from_xz(x: float, z: float) -> Vector2:
	return Vector2(x / SCALE + CX, CY - z / SCALE)


func _terrain_color(m: float) -> Color:
	if m <= 8.0:
		return Color("1a4e60")
	if m < 200.0:
		return Color("6a8a48").lerp(Color("8a9a50"), m / 200.0)
	if m < 800.0:
		return Color("8a9a50").lerp(Color("a09060"), (m - 200.0) / 600.0)
	if m < 1800.0:
		return Color("a09060").lerp(Color("c8c0b0"), (m - 800.0) / 1000.0)
	return Color("c8c0b0").lerp(Color("f2f4f6"), clampf((m - 1800.0) / 1400.0, 0.0, 1.0))


func _build_world() -> void:
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color("1a4e60")
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.45, 0.55, 0.6)
	e.ambient_light_energy = 0.55
	e.fog_enabled = true
	e.fog_light_color = Color("5a90a0")
	e.fog_density = 0.0018
	env.environment = e
	add_child(env)

	var sun := DirectionalLight3D.new()
	sun.light_energy = 1.15
	sun.shadow_enabled = true
	sun.rotation_degrees = Vector3(-48, -35, 0)
	add_child(sun)

	var hemi := OmniLight3D.new()
	hemi.light_energy = 0.25
	hemi.omni_range = 400.0
	hemi.position = Vector3(0, 80, 0)
	add_child(hemi)

	# sea plane
	var sea := MeshInstance3D.new()
	var sea_mesh := PlaneMesh.new()
	sea_mesh.size = Vector2(900, 900)
	sea.mesh = sea_mesh
	var sea_mat := StandardMaterial3D.new()
	sea_mat.albedo_color = Color("1a5568")
	sea_mat.roughness = 0.35
	sea.material_override = sea_mat
	sea.position.y = -0.2
	add_child(sea)

	land = MeshInstance3D.new()
	land.mesh = _make_height_mesh()
	var land_mat := StandardMaterial3D.new()
	land_mat.vertex_color_use_as_albedo = true
	land_mat.roughness = 0.92
	land.material_override = land_mat
	land.name = "italyLand"
	add_child(land)

	camera = Camera3D.new()
	camera.fov = 42.0
	camera.near = 0.3
	camera.far = 1600.0
	add_child(camera)

	_add_roads()
	_add_cities()
	_add_resources()
	_add_army()
	status_label.text = "Godot 4 · города · дороги · армии"


func _make_height_mesh() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var heights: PackedFloat32Array = PackedFloat32Array()
	heights.resize((COLS + 1) * (ROWS + 1))
	for j in range(ROWS + 1):
		var lat := BOX.w - float(j) / float(ROWS) * (BOX.w - BOX.y)
		for i in range(COLS + 1):
			var lon := BOX.x + float(i) / float(COLS) * (BOX.z - BOX.x)
			var m := alpine_pass_carve(lon, lat, meters(lon, lat))
			var y := 0.0 if m <= 8.0 else (0.18 + m / 3000.0 * 20.0)
			heights[j * (COLS + 1) + i] = y
	for j in range(ROWS):
		for i in range(COLS):
			var i00 := j * (COLS + 1) + i
			var i10 := i00 + 1
			var i01 := i00 + (COLS + 1)
			var i11 := i01 + 1
			var lon0 := BOX.x + float(i) / float(COLS) * (BOX.z - BOX.x)
			var lon1 := BOX.x + float(i + 1) / float(COLS) * (BOX.z - BOX.x)
			var lat0 := BOX.w - float(j) / float(ROWS) * (BOX.w - BOX.y)
			var lat1 := BOX.w - float(j + 1) / float(ROWS) * (BOX.w - BOX.y)
			var m00 := alpine_pass_carve(lon0, lat0, meters(lon0, lat0))
			var m10 := alpine_pass_carve(lon1, lat0, meters(lon1, lat0))
			var m01 := alpine_pass_carve(lon0, lat1, meters(lon0, lat1))
			var m11 := alpine_pass_carve(lon1, lat1, meters(lon1, lat1))
			# skip pure sea quads
			if m00 <= 8.0 and m10 <= 8.0 and m01 <= 8.0 and m11 <= 8.0:
				continue
			var p00 := Vector3((lon0 - CX) * SCALE, heights[i00], (CY - lat0) * SCALE)
			var p10 := Vector3((lon1 - CX) * SCALE, heights[i10], (CY - lat0) * SCALE)
			var p01 := Vector3((lon0 - CX) * SCALE, heights[i01], (CY - lat1) * SCALE)
			var p11 := Vector3((lon1 - CX) * SCALE, heights[i11], (CY - lat1) * SCALE)
			_add_tri(st, p00, p01, p10, m00, m01, m10)
			_add_tri(st, p10, p01, p11, m10, m01, m11)
	st.generate_normals()
	return st.commit()


func _add_tri(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, ma: float, mb: float, mc: float) -> void:
	st.set_color(_terrain_color(ma))
	st.add_vertex(a)
	st.set_color(_terrain_color(mb))
	st.add_vertex(b)
	st.set_color(_terrain_color(mc))
	st.add_vertex(c)


func _add_roads() -> void:
	var by_city := {}
	for p in provinces:
		by_city[p["city"]] = p
	for pair in roads:
		if not by_city.has(pair[0]) or not by_city.has(pair[1]):
			continue
		var a: Dictionary = by_city[pair[0]]
		var b: Dictionary = by_city[pair[1]]
		var pa := xz(a["lon"], a["lat"])
		var pb := xz(b["lon"], b["lat"])
		pa.y = world_h(a["lon"], a["lat"]) + 0.12
		pb.y = world_h(b["lon"], b["lat"]) + 0.12
		var mid := (pa + pb) * 0.5
		mid.y += 0.2
		var im := ImmediateMesh.new()
		im.surface_begin(Mesh.PRIMITIVE_TRIANGLES)
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color("c4a56a")
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		im.surface_set_material(0, mat)
		# simple ribbon
		var dir := (pb - pa).normalized()
		var side := Vector3(-dir.z, 0, dir.x) * 0.18
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
		var mi := MeshInstance3D.new()
		mi.mesh = im
		add_child(mi)


func _add_cities() -> void:
	for p in provinces:
		var pos := xz(p["lon"], p["lat"])
		pos.y = world_h(p["lon"], p["lat"])
		var root := Node3D.new()
		root.position = pos
		add_child(root)
		var body := MeshInstance3D.new()
		var box := BoxMesh.new()
		var s := 1.35 if p.get("capital", false) else 1.0
		box.size = Vector3(0.9 * s, 0.55 * s, 0.9 * s)
		body.mesh = box
		body.position.y = 0.28 * s
		var bm := StandardMaterial3D.new()
		bm.albedo_color = Color("e8dcc4")
		body.material_override = bm
		root.add_child(body)
		var pole := MeshInstance3D.new()
		var cyl := CylinderMesh.new()
		cyl.top_radius = 0.04 * s
		cyl.bottom_radius = 0.05 * s
		cyl.height = 1.5 * s
		pole.mesh = cyl
		pole.position = Vector3(0.55 * s, 0.85 * s, 0)
		var pm := StandardMaterial3D.new()
		pm.albedo_color = Color("c9b070")
		pole.material_override = pm
		root.add_child(pole)
		var flag := MeshInstance3D.new()
		var fb := BoxMesh.new()
		fb.size = Vector3(0.5 * s, 0.38 * s, 0.04 * s)
		flag.mesh = fb
		flag.position = Vector3(0.82 * s, 1.35 * s, 0)
		var fm := StandardMaterial3D.new()
		var fac: Dictionary = factions.get(p["faction"], {"banner": Color("a03030")})
		fm.albedo_color = fac["banner"]
		flag.material_override = fm
		root.add_child(flag)
		city_marks.append({
			"pos": pos,
			"name": p["city"],
			"ru": p["ru"],
			"campaign": _campaign_name(p["city"]),
			"faction": p["faction"],
			"capital": p.get("capital", false),
			"root": root,
			"lon": p["lon"],
			"lat": p["lat"],
		})


func _add_resources() -> void:
	var colors := {
		"iron": Color("7a7a7a"), "copper": Color("b87333"), "silver": Color("c0c8d0"),
		"gold": Color("d4a820"), "marble": Color("e8e4dc"), "timber": Color("2d5a28"),
		"wine": Color("6a2040"), "grain": Color("c9a84a"), "pottery": Color("a07040"),
		"glass": Color("6ec0d8"), "textiles": Color("8a6aaa"), "olive": Color("6a8a40"),
	}
	for p in provinces:
		var res: Array = p.get("resources", [])
		for ri in res.size():
			var rname: String = res[ri]
			var ang := float(ri) * 1.7
			var lon: float = p["lon"] + cos(ang) * 0.12
			var lat: float = p["lat"] + sin(ang) * 0.1
			var pos := xz(lon, lat)
			pos.y = world_h(lon, lat) + 0.05
			var mound := MeshInstance3D.new()
			var sph := SphereMesh.new()
			sph.radius = 0.35
			sph.height = 0.45
			mound.mesh = sph
			mound.position = pos
			var mm := StandardMaterial3D.new()
			mm.albedo_color = colors.get(rname, Color("888888"))
			mound.material_override = mm
			add_child(mound)


func _add_army() -> void:
	army_root = Node3D.new()
	var start := xz(12.35, 41.78)
	start.y = world_h(12.35, 41.78) + 0.1
	army_root.position = start
	add_child(army_root)
	var body := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(0.7, 1.2, 0.5)
	body.mesh = box
	body.position.y = 0.6
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("8a2a22")
	body.material_override = mat
	army_root.add_child(body)
	var head := MeshInstance3D.new()
	var sph := SphereMesh.new()
	sph.radius = 0.22
	head.mesh = sph
	head.position.y = 1.35
	var hm := StandardMaterial3D.new()
	hm.albedo_color = Color("c4a07a")
	head.material_override = hm
	army_root.add_child(head)


func _campaign_name(n: String) -> String:
	var alias := {
		"Mediolanum": "Mediolanium", "Segesta": "Genua", "Rome": "Roma",
		"Croton": "Rhegium", "Messana": "Rhegium", "Syracuse": "Syracusae",
		"Lilybaeum": "Syracusae",
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
		target.y + maxf(5.0, dist * sin(a)),
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


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP and mb.pressed:
			cam_zoom = minf(MAX_ZOOM, cam_zoom * 1.1)
			_apply_cam()
		elif mb.button_index == MOUSE_BUTTON_WHEEL_DOWN and mb.pressed:
			cam_zoom = maxf(MIN_ZOOM, cam_zoom / 1.1)
			_apply_cam()
		elif mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				if _try_select_city(mb.position) or _try_select_army(mb.position):
					dragging = false
				elif allow_pan:
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
		if key.keycode == KEY_Q:
			cam_tilt = maxf(TILT_MIN, cam_tilt - TILT_STEP)
			_apply_cam()
		elif key.keycode == KEY_E:
			cam_tilt = minf(TILT_MAX, cam_tilt + TILT_STEP)
			_apply_cam()
		elif key.keycode == KEY_Z:
			cam_yaw = fposmod(cam_yaw - YAW_STEP, 360.0)
			_apply_cam()
		elif key.keycode == KEY_C:
			cam_yaw = fposmod(cam_yaw + YAW_STEP, 360.0)
			_apply_cam()


func _pick_ground(screen_pos: Vector2) -> Variant:
	var from := camera.project_ray_origin(screen_pos)
	var dir := camera.project_ray_normal(screen_pos)
	# ray-plane at y≈terrain via iterative sample
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
	var best_d := 28.0
	for m in city_marks:
		var sp := camera.unproject_position(m["pos"] + Vector3(0, 1.2, 0))
		var d := sp.distance_to(screen_pos)
		if d < best_d:
			best_d = d
			best = m
	if best == null:
		return false
	status_label.text = "Город: %s" % best["ru"]
	var fac := "rome" if str(best["faction"]) in ["spqr", "julii", "brutii", "scipii"] else str(best["faction"])
	var city := {
		"name": best["campaign"],
		"ru": best["ru"],
		"region": "",
		"lon": best["lon"],
		"lat": best["lat"],
		"faction": fac,
		"capital": best["capital"],
	}
	_post_message({"type": "city-select", "city": city, "tab": "settlement"})
	army_selected = false
	return true


func _try_select_army(screen_pos: Vector2) -> bool:
	if army_root == null or not field_army_visible:
		return false
	var sp := camera.unproject_position(army_root.position + Vector3(0, 1.0, 0))
	if sp.distance_to(screen_pos) > 26.0:
		return false
	army_selected = true
	status_label.text = "Армия выбрана · ПКМ — ход"
	_post_message({"type": "army-select", "armyId": army_id})
	return true


func _try_move_army(screen_pos: Vector2) -> void:
	if not army_selected or army_root == null:
		return
	var hit = _pick_ground(screen_pos)
	if hit == null:
		return
	var m := alpine_pass_carve(hit["lon"], hit["lat"], meters(hit["lon"], hit["lat"]))
	if m <= 12.0:
		status_label.text = "Сюда нельзя: море"
		return
	if m > 1100.0:
		status_label.text = "Сюда нельзя: высокие горы"
		return
	for c in city_marks:
		var dx := absf(c["lon"] - hit["lon"])
		var dy := absf(c["lat"] - hit["lat"])
		if dx < 0.22 and dy < 0.18:
			_post_js("""
(function(){
  try {
    var CS = window.parent && window.parent.CampaignState;
    if (CS && CS.mergeFieldArmyIntoCity) CS.mergeFieldArmyIntoCity('%s', '%s');
  } catch (e) {}
})();
""" % [army_id, c["campaign"]])
			_post_message({"type": "army-merged", "city": c["campaign"], "cityRu": c["ru"]})
			status_label.text = "Армия входит в %s" % c["ru"]
			field_army_visible = false
			army_root.visible = false
			army_selected = false
			return
	army_root.position = hit["pos"] + Vector3(0, 0.1, 0)
	_post_js("""
(function(){
  try {
    var CS = window.parent && window.parent.CampaignState;
    if (CS && CS.updateFieldArmyPosition) CS.updateFieldArmyPosition('%s', %s, %s);
  } catch (e) {}
})();
""" % [army_id, str(hit["lon"]), str(hit["lat"])])
	status_label.text = "Армия на марше"


func _post_message(data: Dictionary) -> void:
	if not OS.has_feature("web"):
		return
	var json := JSON.stringify(data)
	JavaScriptBridge.eval("window.parent.postMessage(%s, '*');" % json)


func _post_js(code: String) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval(code)


func _setup_js_bridge() -> void:
	if not OS.has_feature("web"):
		return
	# Listen via JS: forward campaign messages into Godot through a global sink
	JavaScriptBridge.eval("""
(function(){
  if (window.__godotView15Bridge) return;
  window.__godotView15Bridge = true;
  window.addEventListener('message', function(e){
    if (!e.data || typeof e.data !== 'object') return;
    var t = e.data.type;
    if (t === 'campaign-sync' || t === 'camera-tilt' || t === 'camera-rotate' || t === 'camera-goto') {
      window.__godotMsgQueue = window.__godotMsgQueue || [];
      window.__godotMsgQueue.push(e.data);
    }
  });
})();
""")


func _process(_delta: float) -> void:
	if not OS.has_feature("web"):
		return
	var raw = JavaScriptBridge.eval("JSON.stringify((window.__godotMsgQueue||[]).splice(0))")
	if typeof(raw) != TYPE_STRING or raw == "" or raw == "[]":
		return
	var parsed = JSON.parse_string(raw)
	if typeof(parsed) != TYPE_ARRAY:
		return
	for msg in parsed:
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
		target.y = world_h(float(msg["lon"]), float(msg["lat"])) + 1.2
		_apply_cam()
	elif t == "campaign-sync":
		# keep army id if provided in nested state
		status_label.text = "Синхронизация кампании"
