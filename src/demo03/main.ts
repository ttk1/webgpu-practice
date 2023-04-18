import shader from './shader.wgsl';
/**
 * Particle
 */
const NUM_PARTICLES = 50_000;

export default async () => {
  console.log('hello, world!');

  const cvs = document.body.appendChild(document.createElement('canvas'));
  cvs.width = 500;
  cvs.height = 500;

  const ctx = cvs.getContext('webgpu');

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const shaderModule = device.createShaderModule({
    code: shader,
  });

  ctx.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied',
  });


  // バッファの初期化

  const particles: number[] = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    // position
    particles.push((Math.random() - 0.5) * 2);
    particles.push((Math.random() - 0.5) * 2);
    // velocity
    particles.push(0.0);
    particles.push(0.0);
  }

  const particleBuffer = device.createBuffer({
    size: Float32Array.BYTES_PER_ELEMENT * NUM_PARTICLES * 4,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
  });
  device.queue.writeBuffer(particleBuffer, 0, new Float32Array(particles), 0, NUM_PARTICLES);


  // render pipeline の設定

  const particleBufferLayout: GPUVertexBufferLayout[] = [
    {
      attributes: [
        {
          // position
          shaderLocation: 0,
          offset: 0,
          format: 'float32x2',
        },
        {
          // velocity
          shaderLocation: 1,
          offset: 8,
          format: 'float32x2',
        }
      ],
      arrayStride: 16,
      stepMode: 'vertex',
    },
  ];

  const pipelineDescriptor: GPURenderPipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'vertex_main',
      buffers: particleBufferLayout,
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragment_main',
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat(),
        },
      ],
    },
    primitive: {
      topology: 'point-list',
    },
    layout: 'auto',
  };

  const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
  const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        clearValue: clearColor,
        loadOp: 'clear',
        storeOp: 'store',
        view: null,
      },
    ],
  };


  // compute pipeline の設定

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
          buffer: particleBuffer,
        },
      },
    ],
  });

  const computePipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    compute: {
      module: shaderModule,
      entryPoint: 'update',
    },
  });

  const step = () => {
    const commandEncoder = device.createCommandEncoder();

    renderPassDescriptor.colorAttachments[0].view = ctx.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, particleBuffer);
    renderPass.draw(NUM_PARTICLES);
    renderPass.end();

    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, bindGroup);
    computePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64));
    computePass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(step);
  };
  step();
};
