import shader from './shader.wgsl';
/**
 * MD4
 */
export default async () => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  // 計算結果の保存先のバッファ
  const resultBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  // 結果取り出し用のステージングバッファ
  const stagingBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });


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
  computePass.dispatchWorkgroups(1);
  computePass.end();


  // 結果の取り出し & 表示
  commandEncoder.copyBufferToBuffer(
    resultBuffer,
    0,
    stagingBuffer,
    0,
    16
  );
  device.queue.submit([commandEncoder.finish()]);
  await stagingBuffer.mapAsync(
    GPUMapMode.READ,
    0,
    16
  );
  const copyArrayBuffer = stagingBuffer.getMappedRange(0, 16);
  const result = new Uint8Array(copyArrayBuffer.slice(0));
  stagingBuffer.unmap();
  let hex = '';
  for (const e of result) {
    hex += e.toString(16);
  }
  console.log(hex);
};
