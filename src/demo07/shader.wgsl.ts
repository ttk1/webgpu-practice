export default `
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f
}

@group(0) @binding(0) var<uniform> mvpMat: mat4x4f;

@vertex
fn vertex_main(@location(0) position: vec3f,
               @location(1) uv: vec2f) -> VertexOut
{
  var output : VertexOut;
  output.position = mvpMat * vec4(position, 1.0);
  output.uv = uv;
  return output;
}

@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_2d<f32>;

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
  return textureSample(myTexture, mySampler, fragData.uv);
}
`;
