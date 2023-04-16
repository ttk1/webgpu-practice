export default `
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f
}

@vertex
fn vertex_main(@location(0) position: vec2f,
               @location(1) velocity: vec2f) -> VertexOut
{
  var output : VertexOut;
  output.position = vec4f(position, 0., 1.);
  output.color = vec4f(1., 0., 0., 1.);
  return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
  return fragData.color;
}

struct Particle {
  position : vec2f,
  velocity : vec2f,
}

@binding(0) @group(0)
var<storage, read_write> particles: array<Particle>;

@compute @workgroup_size(64)
fn update(@builtin(global_invocation_id) global_id : vec3u) {
  let g = vec2f(0., 0.);
  let idx = global_id.x;
  let p = particles[idx].position;
  let v = particles[idx].velocity;

  particles[idx].position = p + v * .2;
  particles[idx].velocity = v
    // 重力加速度
    + ((g - p) / pow(distance(g, p) + 1., 2.)) * .05
    // 空気抵抗
    - v * pow(length(v), 2.) * .05;
}
`;
