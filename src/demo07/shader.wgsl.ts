export default `
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f
}

@vertex
fn vertex_main(@location(0) position: vec4f) -> VertexOut
{
  var output : VertexOut;
  output.position = position;
  output.uv = position.xy * 0.5 + 0.5;
  return output;
}

@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture: texture_2d<f32>;

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
  return textureSample(myTexture, mySampler, fragData.uv);
}
`;
