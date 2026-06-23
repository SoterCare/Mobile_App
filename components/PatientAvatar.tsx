import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Asset } from 'expo-asset';
import * as LegacyFS from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

/**
 * Patient activity states the avatar can play. These map to frame ranges inside
 * the single baked animation in patient-avatar.glb (24 fps, 320 frames):
 *   walking      -> 1..86    (steps in place, loops)
 *   standingDown -> 90..121  (lowers into a seated pose, plays once)
 *   standingUp   -> 121..151 (rises back to standing, plays once)
 *   idle         -> 150..156 (standing hold, loops)
 */
export type AvatarActivity = 'walking' | 'standingUp' | 'standingDown' | 'idle';

export const AVATAR_ACTIVITIES: AvatarActivity[] = [
  'walking',
  'standingUp',
  'standingDown',
  'idle',
];

const FPS = 24;
const CLIP_RANGES: Record<
  AvatarActivity,
  { start: number; end: number; loop: boolean; timeScale?: number }
> = {
  walking: { start: 1, end: 86, loop: true },
  standingDown: { start: 90, end: 121, loop: false },
  standingUp: { start: 121, end: 151, loop: false },
  // Gentle, near-seamless standing sway (poses at 146 and 156 nearly match),
  // played slow so the loop reads as a calm idle rather than a fast twitch.
  idle: { start: 146, end: 156, loop: true, timeScale: 0.5 },
};

interface Props {
  /** Current activity to play. Defaults to 'idle'. */
  activity?: AvatarActivity;
  /** Background clear colour (hex). Defaults to the app neumorphic base. */
  backgroundColor?: string;
  style?: ViewStyle;
}

async function loadGlbArrayBuffer(): Promise<ArrayBuffer> {
  // require() is the required way to reference a bundled asset for expo-asset.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const asset = Asset.fromModule(require('@/assets/models/patient-avatar.glb'));
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const base64 = await LegacyFS.readAsStringAsync(uri, {
    encoding: LegacyFS.EncodingType.Base64,
  });
  const bytes = Buffer.from(base64, 'base64');
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

export function PatientAvatar({ activity = 'idle', backgroundColor = '#f2f3f7', style }: Props) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Partial<Record<AvatarActivity, THREE.AnimationAction>>>({});
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);
  const activityRef = useRef<AvatarActivity>(activity);
  const frameRef = useRef<number | null>(null);

  const fadeTo = (next: AvatarActivity) => {
    const action = actionsRef.current[next];
    if (!action) return;
    const previous = activeActionRef.current;
    if (previous === action) return;

    action.reset();
    action.setEffectiveTimeScale(CLIP_RANGES[next].timeScale ?? 1);
    action.setEffectiveWeight(1);
    if (CLIP_RANGES[next].loop) {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
    } else {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    }
    if (previous) previous.fadeOut(0.3);
    action.fadeIn(0.3).play();
    activeActionRef.current = action;
  };

  // React to activity changes after the scene is ready.
  useEffect(() => {
    activityRef.current = activity;
    if (mixerRef.current) fadeTo(activity);
  }, [activity]);

  // Stop the render loop on unmount.
  useEffect(() => {
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      mixerRef.current?.stopAllAction();
    };
  }, []);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(new THREE.Color(backgroundColor), 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    // Lighting (GLB uses a PBR material, so it needs lights).
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb4c0, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await loadGlbArrayBuffer();
    } catch (err) {
      console.warn('[PatientAvatar] Failed to load GLB', err);
      return;
    }

    const loader = new GLTFLoader();
    loader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Clean, consistent material (model ships without textures for RN).
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              const sm = m as THREE.MeshStandardMaterial;
              sm.color = new THREE.Color(0xc2c9d2);
              sm.roughness = 0.9;
              sm.metalness = 0;
              sm.needsUpdate = true;
            });
          }
        });

        // Auto-frame the model regardless of its export scale.
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y);
        const dist = ((maxDim / 2) / Math.tan((camera.fov * Math.PI) / 360)) * 1.45;
        camera.position.set(center.x + dist * 0.3, center.y, center.z + dist);
        camera.near = dist / 100;
        camera.far = dist * 100;
        camera.lookAt(center);
        camera.updateProjectionMatrix();

        // Build per-activity subclips from the single baked animation.
        const fullClip = gltf.animations[0];
        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;
        if (fullClip) {
          (Object.keys(CLIP_RANGES) as AvatarActivity[]).forEach((name) => {
            const { start, end } = CLIP_RANGES[name];
            const sub = THREE.AnimationUtils.subclip(fullClip, name, start, end, FPS);
            actionsRef.current[name] = mixer.clipAction(sub);
          });
        }
        fadeTo(activityRef.current);
      },
      (err) => console.warn('[PatientAvatar] GLTF parse error', err),
    );

    const clock = new THREE.Clock();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixerRef.current?.update(delta);
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  return (
    <View style={[styles.container, style]}>
      <GLView style={styles.gl} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  gl: { flex: 1 },
});
