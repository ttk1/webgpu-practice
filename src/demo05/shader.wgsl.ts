export const WORKGROUP_COUNT_BITS = 14;
export const WORKGROUP_SIZE_BITS = 6;

export default `
fn F(X: u32, Y: u32, Z: u32) -> u32 {
  return (X & Y) | (~X & Z);
}

fn G(X: u32, Y: u32, Z: u32) -> u32 {
  return (X & Y) | (X & Z) | (Y & Z);
}

fn H(X: u32, Y: u32, Z: u32) -> u32 {
  return X ^ Y ^ Z;
}

fn rotate(a: u32, s: u32) -> u32 {
  return (a << s) | (a >> (32 - s));
}

fn FF(a: ptr<private,u32>, b: u32, c: u32, d: u32, x: u32, s: u32) {
  *a = rotate(*a + F(b, c, d) + x, s);
}

fn GG(a: ptr<private,u32>, b: u32, c: u32, d: u32, x: u32, s: u32) {
  *a = rotate(*a + G(b, c, d) + x + 0x5a827999u, s);
}

fn HH(a: ptr<private,u32>, b: u32, c: u32, d: u32, x: u32, s: u32) {
  *a = rotate(*a + H(b, c, d) + x + 0x6ed9eba1u, s);
}

var<private> A: u32;
var<private> B: u32;
var<private> C: u32;
var<private> D: u32;

fn update(X: array<u32, 16>) {
  let AA = A;
  let BB = B;
  let CC = C;
  let DD = D;

  FF(&A, B, C, D, X[0], 3);
  FF(&D, A, B, C, X[1], 7);
  FF(&C, D, A, B, X[2], 11);
  FF(&B, C, D, A, X[3], 19);
  FF(&A, B, C, D, X[4], 3);
  FF(&D, A, B, C, X[5], 7);
  FF(&C, D, A, B, X[6], 11);
  FF(&B, C, D, A, X[7], 19);
  FF(&A, B, C, D, X[8], 3);
  FF(&D, A, B, C, X[9], 7);
  FF(&C, D, A, B, X[10], 11);
  FF(&B, C, D, A, X[11], 19);
  FF(&A, B, C, D, X[12], 3);
  FF(&D, A, B, C, X[13], 7);
  FF(&C, D, A, B, X[14], 11);
  FF(&B, C, D, A, X[15], 19);

  GG(&A, B, C, D, X[0], 3);
  GG(&D, A, B, C, X[4], 5);
  GG(&C, D, A, B, X[8], 9);
  GG(&B, C, D, A, X[12], 13);
  GG(&A, B, C, D, X[1], 3);
  GG(&D, A, B, C, X[5], 5);
  GG(&C, D, A, B, X[9], 9);
  GG(&B, C, D, A, X[13], 13);
  GG(&A, B, C, D, X[2], 3);
  GG(&D, A, B, C, X[6], 5);
  GG(&C, D, A, B, X[10], 9);
  GG(&B, C, D, A, X[14], 13);
  GG(&A, B, C, D, X[3], 3);
  GG(&D, A, B, C, X[7], 5);
  GG(&C, D, A, B, X[11], 9);
  GG(&B, C, D, A, X[15], 13);

  HH(&A, B, C, D, X[0], 3);
  HH(&D, A, B, C, X[8], 9);
  HH(&C, D, A, B, X[4], 11);
  HH(&B, C, D, A, X[12], 15);
  HH(&A, B, C, D, X[2], 3);
  HH(&D, A, B, C, X[10], 9);
  HH(&C, D, A, B, X[6], 11);
  HH(&B, C, D, A, X[14], 15);
  HH(&A, B, C, D, X[1], 3);
  HH(&D, A, B, C, X[9], 9);
  HH(&C, D, A, B, X[5], 11);
  HH(&B, C, D, A, X[13], 15);
  HH(&A, B, C, D, X[3], 3);
  HH(&D, A, B, C, X[11], 9);
  HH(&C, D, A, B, X[7], 11);
  HH(&B, C, D, A, X[15], 15);

  A += AA;
  B += BB;
  C += CC;
  D += DD;
}

@group(0) @binding(0)
var<storage, read_write> result: array<u32>;

@compute @workgroup_size(1 << ${WORKGROUP_SIZE_BITS})
fn main(@builtin(global_invocation_id) global_id : vec3u) {
  for (var i = 0u; i < 1 << (32 - ${WORKGROUP_COUNT_BITS} - ${WORKGROUP_SIZE_BITS}); i++) {
    A = 0x67452301u;
    B = 0xefcdab89u;
    C = 0x98badcfeu;
    D = 0x10325476u;

    let word = (global_id.x << (32 - ${WORKGROUP_COUNT_BITS} - ${WORKGROUP_SIZE_BITS})) | i;
    update(array<u32, 16>(
      word, 0x80u, 0u, 0u,
      0u, 0u, 0u, 0u,
      0u, 0u, 0u, 0u,
      0u, 0u, 32u, 0u));
    if (A == 0x00000000u) {
      result[global_id.x] = word;
      //break;
    }
    //result[global_id.x] = select(result[global_id.x], word, A == 0x00000000u);
  }
}
`;
