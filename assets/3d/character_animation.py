"""Pose clips for the original EnvaPlast transform rig (Blender, Z up)."""
import math
import bpy

CLIPS = {'Idle': 3.2, 'Walk': 1.0, 'Talk': 2.4, 'Listen': 3.1, 'Work': 1.6,
         'Inspect': 2.8, 'Point': 1.4, 'Greet': 1.2, 'React': 1.3, 'Celebrate': 2.0}

def author_character(nodes, identity):
    """Every clip keys the same channels so weighted transitions share full poses."""
    bases = {name: (obj.location.copy(), obj.rotation_euler.copy(), obj.scale.copy())
             for name, obj in nodes.items()}
    phase_samples = sorted(set([i / 16 for i in range(17)] + [.46, .48, .50, .52]))
    holding = identity in ['altagracia', 'kevin', 'marcos']
    expressive = .82 if identity == 'altagracia' else 1.12 if identity == 'kevin' else 1
    for clip, seconds in CLIPS.items():
        tracks = {}
        for name, obj in nodes.items():
            obj.animation_data_create()
            obj.animation_data.action = bpy.data.actions.new(clip + '_' + identity + '_' + name)
            tracks[name] = obj.animation_data.action
        for t in phase_samples:
            p = 2 * math.pi * t
            envelope = math.sin(math.pi * t) ** 2
            r = {n: [0., 0., 0.] for n in nodes}
            loc = {n: [0., 0., 0.] for n in nodes}
            scales = {n: [1., 1., 1.] for n in nodes}
            r['ArmL'][2] = .055
            r['ArmR'][2] = -.055
            if holding:
                r['ArmL'][0] = -.28
                r['ElbowL'][0] = -.8
            loc['Body'][2] = .008 * math.sin(p)
            r['Head'][2] = .018 * math.sin(p)
            blink = 1 - .94 * math.exp(-((t - .48) / .019) ** 2)
            scales['EyeL'][2] = scales['EyeR'][2] = blink
            if clip == 'Walk':
                loc['Body'][2] = .025 * abs(math.sin(p))
                r['Body'][2] = .025 * math.sin(p)
                for side, sign in [('L', 1), ('R', -1)]:
                    stride = math.sin(p) * sign
                    r['Leg' + side][0] = .43 * stride
                    r['Knee' + side][0] = -.5 * max(0, stride)
                    r['Ankle' + side][0] = -.15 * stride
                    if not (holding and side == 'L'):
                        r['Arm' + side][0] = -.32 * stride
                        r['Elbow' + side][0] = -.17 - .1 * max(0, -stride)
                r['Head'][0] = -.015 * math.sin(p * 2)
            elif clip == 'Talk':
                r['ArmR'][0] = (-.35 - .18 * math.sin(p)) * expressive
                r['ArmR'][2] = -.12
                r['ElbowR'][0] = -.55 + .12 * math.sin(p + 1)
                if not holding:
                    r['ArmL'][0] = -.18 - .08 * math.cos(p)
                    r['ElbowL'][0] = -.32
                r['Head'][0] = .035 * math.sin(p * 2)
                r['Head'][2] = .045 * math.sin(p)
                scales['Mouth'][2] = 1 + 1.9 * abs(math.sin(p * 5))
            elif clip == 'Listen':
                r['Head'][0] = .055 * math.sin(p) ** 3
                r['Head'][2] = .03 * math.sin(p / 2)
                r['ElbowR'][0] = -.08
            elif clip == 'Work':
                for side, sign in [('L', 1), ('R', -1)]:
                    r['Arm' + side][0] = -.38 - .045 * math.sin(p) * sign
                    r['Elbow' + side][0] = -.85 + .14 * math.sin(p) * sign
                r['Head'][0] = .12
            elif clip == 'Inspect':
                r['Body'][0] = .04
                r['Head'][0] = .16 + .04 * math.sin(p)
                r['Head'][2] = .07 * math.sin(p)
                r['ArmL'][0] = -.24
                r['ElbowL'][0] = -.9
                r['ArmR'][0] = -.34
                r['ElbowR'][0] = -.8 + .08 * math.sin(p)
            elif clip == 'Point':
                r['ArmR'][0] = -1.05 * envelope
                r['ArmR'][2] = -.16 * envelope
                r['ElbowR'][0] = -.18 * envelope
                r['Head'][2] = -.12 * envelope
            elif clip == 'Greet':
                r['ArmR'][0] = -1.9 * envelope
                r['ArmR'][1] = .2 * math.sin(p * 3) * envelope
                r['ArmR'][2] = -.2 * envelope
                r['ElbowR'][0] = -.4 * envelope
                r['Head'][2] = -.045 * envelope
            elif clip == 'React':
                loc['Body'][2] = -.035 * envelope
                r['Head'][0] = -.14 * envelope
                r['ArmR'][0] = -.3 * envelope
                r['ElbowR'][0] = -.7 * envelope
            elif clip == 'Celebrate':
                loc['Body'][2] = .04 * abs(math.sin(p * 2))
                for side, sign in [('L', 1), ('R', -1)]:
                    r['Arm' + side][0] = -2.35 + .15 * math.sin(p)
                    r['Arm' + side][2] = .3 * sign
                    r['Elbow' + side][0] = -.25
                r['Head'][0] = -.06
            frame = 1 + t * seconds * 30
            for name, obj in nodes.items():
                base_loc, base_rot, base_scale = bases[name]
                obj.location = [base_loc[i] + loc[name][i] for i in range(3)]
                obj.rotation_euler = [base_rot[i] + r[name][i] for i in range(3)]
                obj.scale = [base_scale[i] * scales[name][i] for i in range(3)]
                for channel in ['location', 'rotation_euler', 'scale']:
                    obj.keyframe_insert(data_path=channel, frame=frame)
        for name, obj in nodes.items():
            action = tracks[name]
            track = obj.animation_data.nla_tracks.new()
            track.name = clip
            strip=track.strips.new(clip, 1, action)
            strip.extrapolation='NOTHING'
            obj.animation_data.action = None
            obj.location, obj.rotation_euler, obj.scale = bases[name]
