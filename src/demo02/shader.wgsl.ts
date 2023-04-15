export const BUFFER_SIZE = 1000;

export default `
@group(0) @binding(0)
var<storage, read_write> output: array<f32>;

// バッファを初期化
@compute @workgroup_size(64)
fn init(@builtin(global_invocation_id) global_id : vec3u) {
  output[global_id.x] = f32(global_id.x) * 1000.;
}

// バッファの値を1インクリメント
@compute @workgroup_size(64)
fn increment(@builtin(global_invocation_id) global_id : vec3u) {
  output[global_id.x] += 1.;
}
`;
