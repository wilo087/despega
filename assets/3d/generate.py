"""Original EnvaPlast art. Run: blender --background --python assets/3d/generate.py
Creates editable envaplast.blend and self-contained GLBs; no downloaded assets.
"""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'apps/web/public/game-assets/envaplast'
OUT.mkdir(parents=True,exist_ok=True)
PLAN=json.loads((ROOT/'packages/simulator/src/factory/geometry.json').read_text())
sys.path.insert(0,str(Path(__file__).resolve().parent))
from character_animation import author_character
bpy.context.scene.render.fps=30
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
# Brand colors are read from their owning palette, rather than redefined in art.
import re
css=(ROOT/'packages/brand/src/palette.css').read_text()
colors=dict(re.findall(r'--despega-([\w-]+):\s*(#[0-9a-fA-F]+)',css))
def material(name,color,metal=0,rough=.65):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 return m
def hexcol(s): return tuple(int(s[i:i+2],16)/255 for i in (1,3,5))
M={n:material(n,hexcol(c)) for n,c in colors.items()}
M.update({n:material(n,c,metal) for n,c,metal in [('steel',(.53,.62,.66),.55),('skin-warm',(.66,.36,.22),0),('skin-medium',(.78,.51,.32),0),('skin-light',(.93,.71,.53),0),('hair',(.085,.055,.045),0),('cardboard',(.64,.43,.23),0),('glass',(.32,.69,.71),.3),('concrete',(.54,.59,.62),0)]})
def empty(name,parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;return o
def box(name,loc,size,mat,parent=None,bevel=.035):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=2
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 o.data.materials.append(M[mat]);o.parent=parent;return o
def sphere(name,loc,scale,mat,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(M[mat]);o.parent=parent
 for p in o.data.polygons:p.use_smooth=True
 return o
def cyl(name,loc,r,depth,mat,parent=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(M[mat]);o.parent=parent;return o
def children(root):return [root]+list(root.children_recursive)
def export(root,name):
 # Combine static geometry by parent/material; keep animated pivots and meshes independent.
 groups={}
 for obj in children(root):
  if obj.type=='MESH' and not obj.animation_data:
   groups.setdefault((obj.parent,obj.active_material,bool(obj.get('occluder'))),[]).append(obj)
 for meshes in groups.values():
  if len(meshes)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for obj in meshes:obj.hide_set(False);obj.select_set(True)
  bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join()
 bpy.ops.object.select_all(action='DESELECT')
 for o in children(root):o.select_set(True)
 bpy.context.view_layer.objects.active=root
 bpy.context.scene.frame_set(0)
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_optimize_animation_keep_anim_object=True,export_materials='EXPORT',export_extras=True)
 for o in children(root):o.hide_set(True)
def animate(obj,clip,axis,amplitude,frames=32):
 obj.animation_data_create();obj.animation_data.action=None
 for frame,amount in [(1,0),(frames//4,amplitude),(frames//2,0),(3*frames//4,-amplitude),(frames,0)]:
  obj.rotation_euler[axis]=amount;obj.keyframe_insert(data_path='rotation_euler',frame=frame)
 action=obj.animation_data.action;action.name=clip+'_'+obj.name
 track=obj.animation_data.nla_tracks.new();track.name=clip
 strip=track.strips.new(clip,1,action);strip.extrapolation='NOTHING'
 obj.animation_data.action=None;obj.rotation_euler[axis]=0
characters=[('alma','green','skin-medium',True,False),('leo','blue','skin-light',False,False),('altagracia','navy','skin-warm',True,True),('wilfredo','amber','skin-medium',False,True),('yuleisy','green-deep','skin-warm',True,False),('kevin','blue-strong','skin-light',False,False),('marcos','navy','skin-medium',False,True),('operator','blue','skin-medium',False,False)]
for name,shirt,skin,longhair,glasses in characters:
 root=empty(name); body=empty('Body',root)
 rig={'Body':body}
 if name=='wilfredo':root.scale=(1.12,1.05,.96)
 if name=='altagracia':root.scale=(1,.98,1.03)
 box('Work jacket',(0,0,1.18),(.49,.3,.57),shirt,body,.085)
 box('Collar',(0,-.16,1.4),(.24,.025,.07),'paper',body)
 box('ID badge',(.12,-.169,1.25),(.105,.015,.14),'paper',body,.008)
 box('Badge stripe',(.12,-.18,1.27),(.07,.01,.025),'green',body,.003)
 head=empty('Head',body);head.location.z=1.62
 rig['Head']=head
 sphere('Face',(0,0,0),(.225,.19,.26),skin,head)
 sphere('Hair cap',(0,.025,.15),(.23,.19,.15),'hair',head)
 if longhair:
  sphere('Hair bun',(0,.19,.08),(.15,.13,.16),'hair',head)
  box('Hair back',(0,.14,-.1),(.34,.13,.28),'hair',head,.06)
 for x in [-.078,.078]:
  eye=empty('EyeL' if x<0 else 'EyeR',head);eye.location=(x,-.174,.025);rig['EyeL' if x<0 else 'EyeR']=eye
  sphere('Eye white',(0,0,0),(.043,.018,.035),'paper',eye)
  sphere('Pupil',(0,-.016,-.001),(.019,.012,.024),'hair',eye)
  box('Eyebrow',(x,-.178,.092),(.075,.018,.015),'hair',head,.006)
  sphere('Ear',(x/abs(x)*.22,.015,-.015),(.045,.043,.066),skin,head)
 sphere('Nose',(0,-.197,-.034),(.035,.035,.044),skin,head)
 mouth=empty('Mouth',head);mouth.location=(0,-.181,-.105);rig['Mouth']=mouth
 box('Smile',(0,0,0),(.082,.018,.015),'hair',mouth,.006)
 if glasses:
  for x in [-.08,.08]:
   for dx in [-.065,.065]:box('Glasses side',(x+dx,-.2,.03),(.012,.018,.1),'steel',head,.004)
   for dz in [-.05,.05]:box('Glasses frame',(x,-.2,.03+dz),(.14,.018,.012),'steel',head,.004)
  box('Bridge',(0,-.21,.03),(.04,.02,.015),'steel',head)
 if name=='wilfredo':box('Moustache',(0,-.194,-.075),(.12,.022,.032),'steel',head,.012)
 if name!='marcos':
  sphere('Hard hat',(0,0,.2),(.26,.22,.14),'sun' if name=='wilfredo' else 'paper',head)
  box('Helmet brim',(0,-.055,.185),(.54,.48,.035),'sun' if name=='wilfredo' else 'paper',head,.03)
 else:box('Tie',(0,-.17,1.2),(.07,.02,.32),'blue',body,.01)
 # Reflective workwear, pockets and belts make silhouettes readable at game scale.
 box('Jacket zipper',(0,-.158,1.17),(.018,.012,.43),'steel',body,.003)
 for x in [-.17,.17]:box('Reflective vest strip',(x,-.16,1.18),(.035,.012,.4),'paper',body,.004)
 box('Belt',(0,0,.91),(.46,.31,.055),'night',body,.012)
 if name=='wilfredo':box('Tool holster',(.24,0,.89),(.1,.16,.24),'cardboard',body,.015)
 for side,x in [('L',-.135),('R',.135)]:
  leg=empty('Leg'+side,root);leg.location=(x,0,.89)
  rig['Leg'+side]=leg
  box('Upper trouser',(0,0,-.16),(.205,.24,.32),'navy',leg,.035)
  knee=empty('Knee'+side,leg);knee.location.z=-.32;rig['Knee'+side]=knee
  box('Lower trouser',(0,0,-.16),(.19,.225,.32),'navy',knee,.035)
  ankle=empty('Ankle'+side,knee);ankle.location.z=-.32;rig['Ankle'+side]=ankle
  box('Safety shoe',(0,-.07,-.12),(.23,.38,.17),'night',ankle,.04)
  arm=empty('Arm'+side,body);arm.location=(x*2.35,0,1.38)
  rig['Arm'+side]=arm
  box('Sleeve',(0,0,-.17),(.17,.23,.33),shirt,arm,.05)
  elbow=empty('Elbow'+side,arm);elbow.location.z=-.32;rig['Elbow'+side]=elbow
  box('Forearm',(0,-.008,-.11),(.135,.18,.22),skin,elbow,.035)
  sphere('Hand',(0,-.01,-.27),(.083,.085,.11),skin,elbow)
  if side=='L' and name in ['altagracia','kevin','marcos']:
   box('Clipboard',(0,-.07,-.3),(.32,.045,.38),'navy',elbow,.02)
   box('Clipboard page',(0,-.098,-.3),(.27,.01,.31),'paper',elbow,.008)
   for z in [-.24,-.3,-.36]:box('Report line',(0,-.107,z),(.18,.005,.012),'blue',elbow,.002)
 author_character(rig,name)
 export(root,name)
 if name in ['alma','leo']:
  # Original 3D portraits, rendered from the same editable characters.
  for obj in bpy.data.objects:obj.hide_render=True
  for obj in children(root):obj.hide_render=False;obj.hide_set(False)
  bpy.ops.object.camera_add(location=(3,-6,2.6));camera=bpy.context.object
  camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler()
  camera.data.type='ORTHO';camera.data.ortho_scale=2.2;bpy.context.scene.camera=camera
  scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.render.resolution_x=256;scene.render.resolution_y=320;scene.render.resolution_percentage=100;scene.render.film_transparent=True
  scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True
  scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/('portrait-'+name+'.png'));bpy.ops.render.render(write_still=True)
  bpy.data.objects.remove(camera,do_unlink=True)
  for obj in children(root):obj.hide_set(True)
# Reusable industrial equipment.
for kind in ['generic','feed','fill','seal','label','pack']:
 root=empty('machine-'+kind)
 box('Machine pedestal',(0,0,.5),(1.9,1.7,1),'navy',root)
 box('Upper body',(0,.25,1.35),(1.8,1.05,.7),'mist',root)
 box('Safety visor',(0,-.3,1.38),(1.35,.06,.38),'glass',root)
 box('Console',(.72,-.62,1.07),(.28,.2,.45),'steel',root)
 for i,mat in enumerate(['green','sun','bad']):sphere('Control button',(.72,-.74,1.17-i*.1),(.045,.025,.045),mat,root)
 box('Belt',(0,-.63,.9),(2.4,.65,.12),'night',root)
 for x in [-.95,-.57,-.19,.19,.57,.95]:
  r=cyl('Roller',(x,-.63,.96),.06,.62,'steel',root);r.rotation_euler.x=math.pi/2
 piston=box('Piston',(0,-.12,1.37),(.3,.3,.43),'steel',root);animate(piston,'Work',0,.17)
 cyl('Signal pole',(.8,.5,1.95),.05,.45,'steel',root)
 for i,mat in enumerate(['green','sun','bad']):cyl('Tower light',(.8,.5,2.05+i*.12),.085,.1,mat,root)
 for z in [.25,.45,.65]:box('Vent',(0,.858,z),(.85,.016,.035),'steel',root,.005)
 if kind=='feed':
  bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=.23,radius2=.47,depth=.44,location=(0,.15,1.92));o=bpy.context.object;o.name='Feed hopper';o.parent=root;o.data.materials.append(M['steel'])
  box('Feed guide',(0,-.54,1.14),(1.2,.1,.13),'sun',root)
 elif kind=='fill':
  box('Nozzle bridge',(0,-.48,1.81),(1.4,.18,.15),'steel',root)
  for x in [-.45,0,.45]:cyl('Fill nozzle',(x,-.55,1.47),.055,.52,'steel',root)
  for x in [-.45,.45]:cyl('Flow valve',(x,-.48,1.95),.11,.11,'blue',root)
 elif kind in ['seal','generic']:
  box('Heated jaw',(0,-.43,1.14),(1.4,.13,.13),'steel',root)
  for x in [-.6,-.3,0,.3,.6]:box('Heat warning',(x,-.5,1.59),(.15,.025,.06),'sun',root,.003)
 elif kind=='label':
  for x in [-.4,.4]:
   roll=cyl('Label roll',(x,.02,1.94),.22,.19,'paper',root);roll.rotation_euler.y=math.pi/2
   cyl('Label spindle',(x,.02,2.06),.04,.06,'blue',root)
  box('Label applicator',(0,-.5,1.26),(.52,.12,.27),'blue',root)
 elif kind=='pack':
  box('Folding head',(0,.05,1.94),(1.25,.48,.3),'cardboard',root)
  for x in [-.55,.55]:box('Packing rail',(x,-.5,1.16),(.07,.53,.26),'steel',root)
 export(root,'machine' if kind=='generic' else 'machine-'+kind)
for capped in [False,True]:
 root=empty('bottle' if capped else 'bottle-open');cyl('Container',(0,0,.24),.17,.48,'glass',root);cyl('Neck',(0,0,.52),.085,.12,'glass',root)
 if capped:
  cyl('Cap',(0,0,.6),.1,.055,'paper',root);box('Label',(0,-.165,.27),(.23,.02,.19),'paper',root,.01)
 export(root,'bottle' if capped else 'bottle-open')
root=empty('box');box('Carton',(0,0,.33),(.65,.48,.65),'cardboard',root);box('Tape',(0,0,.66),(.12,.49,.015),'paper',root);export(root,'box')
root=empty('table');box('Inspection surface',(0,0,.94),(3,1.5,.13),'paper',root)
for x in [-1.25,1.25]:
 for y in [-.55,.55]:box('Leg',(x,y,.45),(.1,.1,.9),'steel',root)
export(root,'table')
root=empty('puddle');sphere('Water',(0,0,.025),(.55,.32,.025),'blue',root);export(root,'puddle')
root=empty('cable');
for i in range(12):cyl('Cable segment',(.09*i,math.sin(i*.5)*.14,.025),.035,.05,'night',root)
export(root,'cable')
root=empty('guard');box('Exposed conveyor',(0,0,.6),(1.9,.7,.2),'steel',root);export(root,'guard')
# Each zone is a separate asset, streamed by proximity in the browser.
for zone in PLAN['zones']:
 name,w,d=zone['id'],zone['w'],zone['d']
 root=empty('zone-'+name)
 box('Floor',(0,0,-.1),(w,d,.2),'mist' if name not in ['line','warehouse'] else 'concrete',root,.04)
 # Low walls retain an unobstructed isometric view.
 door=zone.get('door',0)
 segments=[(0,w)] if not door else [(side*(w+door)/4,(w-door)/2) for side in [-1,1]]
 for center,width in segments:
  box('Back wall',(center,d/2,.9),(width,.18,1.8),'paper',root)['occluder']=True
  box('Wall cap',(center,d/2,1.85),(width,.25,.1),'navy',root)['occluder']=True
 for x in [-w/2+.08,w/2-.08]:box('Wall pillar',(x,d/2,.8),(.25,.3,1.6),'steel',root)['occluder']=True
 # Original raised section signs: text becomes editable mesh geometry in the blend.
 title={'entrance':'ACCESO','office':'OPERACIONES','line':'LINEA 2','warehouse':'BODEGA','quality':'CALIDAD','canteen':'COMEDOR'}[name]
 box('Section plaque',(0,d/2,2.3),(3.7,.1,.65),'navy',root)['occluder']=True
 for x in [-1.4,1.4]:box('Plaque support',(x,d/2,2.02),(.05,.06,.45),'steel',root)['occluder']=True
 bpy.ops.object.text_add(location=(0,d/2+.058,2.18));sign=bpy.context.object;sign.name='Section '+title;sign.data.body=title;sign.data.align_x='CENTER';sign.data.size=.32;sign.data.extrude=.003;sign.data.resolution_u=3;sign.rotation_euler=(math.pi/2,0,0);sign.scale.x=-1;sign.data.materials.append(M['paper']);sign.parent=root;sign['occluder']=True;bpy.ops.object.convert(target='MESH')
 if name=='line':
  for x in [-w/2+.5,w/2-.5]:box('Safety aisle',(x,0,.015),(.08,d-.4,.015),'sun',root,.001)
  for y in [-8,-4,0,4,8]:box('Aisle arrow',(4,-y,.018),(.6,.12,.02),'sun',root,.001)
  for y in [-9,-3,3,9]:
   for x in [-2.8,2.8]:box('Lane dash',(x,y,.018),(.06,.7,.015),'paper',root,.001)
 else:
  for x in [-w/2+.25,w/2-.25]:box('Floor border',(x,0,.012),(.045,d-.4,.012),'green' if name in ['entrance','office','canteen'] else 'blue',root,.001)
 for f in [f for f in PLAN['furniture'] if f['zone']==name]:
  furniture=empty(f['id'],root)
  x,y=-f['x'],-f['z'] # glTF/Babylon conversion: world X/Z -> Blender -X/-Y.
  w2,d2,h=f['w'],f['d'],f['h']
  if f['kind']=='bin':
   for height in [.5,1.5]:box(f['id'],(x,y,height),(w2,d2,.8),'cardboard',furniture)
  elif f['kind']=='safety-cabinet':
   for dx in [-w2/2+.03,w2/2-.03]:box('Locker side',(x+dx,y,h/2),(.06,d2,h),'steel',furniture)
   box('Locker back',(x,y-d2/2+.03,h/2),(w2,.06,h),'navy',furniture)
   for height in [.1,.85,h-.04]:box('Safety shelf',(x,y,height),(w2,d2,.06),'steel',furniture)
   for dx in [-.32,.32]:
    sphere('Spare helmet',(x+dx,y,1.2),(.23,.19,.12),'sun',furniture)
    box('Glasses case',(x+dx,y,.55),(.25,.18,.09),'blue',furniture)
   box('Locker header',(x,y+d2/2-.04,h-.2),(w2-.12,.06,.25),'green',furniture)
  elif f['kind']=='tool-cart':
   for height in [.28,.83]:box('Tool tray',(x,y,height),(w2,d2,.075),'blue',furniture)
   for dx in [-w2*.4,w2*.4]:
    for dy in [-d2*.33,d2*.33]:
     box('Cart upright',(x+dx,y+dy,.57),(.055,.055,.93),'steel',furniture)
     wheel=cyl('Cart wheel',(x+dx,y+dy,.1),.09,.06,'night',furniture);wheel.rotation_euler.x=math.pi/2
   for dx in [-.24,0,.24]:box('Hand tool',(x+dx,y,.89),(.06,.35,.04),'steel',furniture,.009)
   box('Tool case',(x,y,.42),(.48,.35,.22),'night',furniture)
  elif f['kind']=='pallet':
   for dx in [-w2*.35,0,w2*.35]:box('Pallet plank',(x+dx,y,.09),(w2*.27,d2,.12),'cardboard',furniture)
   for dx in [-w2*.24,w2*.24]:
    for height in [.38,.84]:box('Stacked carton',(x+dx,y+.04,height),(w2*.43,d2*.67,.43),'cardboard',furniture)
   box('Pallet handle',(x,y-d2*.4,.73),(.045,.045,1.05),'steel',furniture)
   box('Handle grip',(x,y-d2*.4,1.23),(.36,.06,.055),'night',furniture)
  elif f['kind']=='quality-cart':
   box('Quality worktop',(x,y,.82),(w2,d2,.08),'paper',furniture)
   for dx in [-w2*.38,w2*.38]:box('Quality support',(x+dx,y,.4),(.08,d2*.8,.8),'steel',furniture)
   for dx in [-.24,0,.24]:
    cyl('Sample bottle',(x+dx,y,.99),.07,.25,'glass',furniture)
    cyl('Sample cap',(x+dx,y,1.13),.075,.04,'blue',furniture)
   box('Calibration display',(x,y+d2*.3,1.03),(.42,.09,.3),'navy',furniture)
  elif f['kind']=='water':
   box('Water station',(x,y,.56),(w2*.8,d2*.8,1.1),'paper',furniture)
   cyl('Water bottle',(x,y,1.36),.22,.46,'glass',furniture)
   box('Tap',(x,y-d2*.38,.9),(.13,.08,.05),'blue',furniture)
  elif f['kind']=='plant':
   cyl('Planter',(x,y,.24),.26,.47,'navy',furniture)
   for dx,dy,dz in [(-.16,0,.95),(.15,.06,1.08),(0,-.12,.9)]:sphere('Leaves',(x+dx,y+dy,dz),(.22,.21,.28),'green',furniture)
  elif f['kind']=='bench':
   box(f['id'],(x,y,h-.06),(w2,d2,.12),'green',furniture)
   for dx in [-w2*.35,w2*.35]:box('Bench support',(x+dx,y,(h-.12)/2),(.12,d2,h-.12),'steel',furniture)
  else:
   box(f['id'],(x,y,h-.065),(w2,d2,.13),'cardboard',furniture)
   for dx in [-w2*.4,w2*.4]:box('Table support',(x+dx,y,(h-.13)/2),(.15,d2*.85,h-.13),'navy',furniture)
   if f['kind']=='desk':
    box('Laptop',(x,y+.1,h+.06),(.75,.5,.06),'steel',furniture)
    box('Display',(x,y+.35,h+.345),(.7,.05,.5),'navy',furniture)
    box('Display glass',(x,y+.385,h+.345),(.61,.01,.4),'blue',furniture)
 export(root,'zone-'+name)
# Keep all authored source objects in the .blend, with exported data alongside.
for o in bpy.data.objects:o.hide_set(False);o.hide_render=False
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/3d/envaplast.blend'))
manifest={p.name:{'bytes':p.stat().st_size} for p in OUT.glob('*.glb')}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('ENVAPLAST_ASSETS',json.dumps(manifest))
