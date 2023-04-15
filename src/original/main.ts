import shader from './shader.wgsl';

export default async () => {
  console.log('hello, world!');


  // https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#basic_render_pipeline

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

  const vertices = new Float32Array([
    0.0, 0.6, 0, 1, 1, 0, 0, 1, -0.5, -0.6, 0, 1, 0, 1, 0, 1, 0.5, -0.6, 0, 1, 0,
    0, 1, 1,
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength, // make it big enough to store vertices in
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

  const vertexBuffers: GPUVertexBufferLayout[] = [
    {
      attributes: [
        {
          shaderLocation: 0, // position
          offset: 0,
          format: 'float32x4',
        },
        {
          shaderLocation: 1, // color
          offset: 16,
          format: 'float32x4',
        },
      ],
      arrayStride: 32,
      stepMode: 'vertex',
    },
  ];

  const pipelineDescriptor: GPURenderPipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'vertex_main',
      buffers: vertexBuffers,
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
      topology: 'triangle-list',
    },
    layout: 'auto',
  };

  const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

  const commandEncoder = device.createCommandEncoder();

  const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };

  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        clearValue: clearColor,
        loadOp: 'clear',
        storeOp: 'store',
        view: ctx.getCurrentTexture().createView(),
      },
    ],
  };

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

  passEncoder.setPipeline(renderPipeline);
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.draw(3);

  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
};
