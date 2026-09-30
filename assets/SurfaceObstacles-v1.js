import { V as Vector3 } from './PaperPass-C93kr3oV-camera75.js';

// Conservative surface footprints: solid props stop movement; launch markings do not.
// Resolve every controller substep so a fast frame cannot jump across a footprint.
export class SurfaceObstacles {
  constructor(config, props) {
    this.radius = config.radius;
    this.bodyRadius = config.prince.collisionRadius ?? 0.16;
    this.props = props;
    this.solids = [...config.props, ...(config.npc ? [config.npc] : [])]
      .filter(p => p.type !== 'launch' && p.type !== 'terraceBand' && p.solid !== false && p.footprintRadius > 0);
    this.before = new Vector3();
    this.facing = new Vector3();
    this.axis = new Vector3();
  }
  move(character, dt, input, forward, seated = false) {
    this.before.copy(character.normal);
    this.facing.copy(character.forward);
    character.update(dt, input, forward);
    if (seated) return;
    for (const spec of this.solids) {
      const anchor = this.props.anchors.get(spec.id);
      if (!anchor?.visible || this.props.pulling.has(spec.id)) continue;
      // Anchors are planet-local, including a dome moved onto the Rose.
      this.axis.copy(anchor.position).normalize();
      const limit = (spec.footprintRadius * anchor.scale.x + this.bodyRadius) / this.radius;
      const nextDot = this.axis.dot(character.normal);
      const oldDot = this.axis.dot(this.before);
      if (nextDot > Math.cos(limit) && nextDot > oldDot + 1e-12) {
        // Permit leaving a seat or an object that moved over the character.
        character.normal.copy(this.before);
        character.forward.copy(this.facing);
        character.velocity.set(0, 0, 0);
        character.syncTransform();
        return;
      }
    }
  }
}
