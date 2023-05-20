export default `
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f
}

@vertex
fn vertex_main(@location(0) position: vec2f,
               @location(1) offset: vec2f,
               @location(2) color: vec4f) -> VertexOut
{
  var output : VertexOut;
  output.position = vec4((position + offset) * 0.1, 0., 1.);
  output.color = color;
  return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
  return fragData.color;
}
`;
