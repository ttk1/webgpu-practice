import shader, { WORKGROUP_COUNT_BITS, WORKGROUP_SIZE_BITS } from './shader.wgsl';
/**
 * MD4 並列実行
 */
const WORKGROUP_COUNT = 1 << WORKGROUP_COUNT_BITS;
const WORKGROUP_SIZE = 1 << WORKGROUP_SIZE_BITS;
// 結果を保存するバッファのサイズ
const BUFFER_SIZE = WORKGROUP_COUNT * WORKGROUP_SIZE * 4;

export default async () => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  // 計算結果の保存先のバッファ
  const resultBuffer = device.createBuffer({
    size: BUFFER_SIZE,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  // 結果取り出し用のステージングバッファ
  const stagingBuffer = device.createBuffer({
    size: BUFFER_SIZE,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const start = performance.now();

  // compute pipeline の実行
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'storage',
        },
      },
    ],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: resultBuffer,
        },
      },
    ],
  });

  const shaderModule = device.createShaderModule({
    code: shader,
  });

  const computePipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });
  const commandEncoder = device.createCommandEncoder();
  const computePass = commandEncoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, bindGroup);
  computePass.dispatchWorkgroups(WORKGROUP_COUNT);
  computePass.end();

  // 結果の取り出し & 表示
  commandEncoder.copyBufferToBuffer(
    resultBuffer,
    0,
    stagingBuffer,
    0,
    BUFFER_SIZE
  );
  device.queue.submit([commandEncoder.finish()]);
  await stagingBuffer.mapAsync(
    GPUMapMode.READ,
    0,
    BUFFER_SIZE
  );
  const copyArrayBuffer = stagingBuffer.getMappedRange(0, BUFFER_SIZE);
  const result = new Uint32Array(copyArrayBuffer.slice(0));
  stagingBuffer.unmap();
  result.forEach(e => {
    if (e != 0) {
      console.log(e);
    }
  });

  // ハッシュレート表示
  const end = performance.now();
  console.log(`duration: ${Math.round(end - start)} ms`);
  console.log(`hash rate: ${Math.round((2 ** 32 * 1000 / (end - start)) / (1024 ** 3))} GH/s`);
};
