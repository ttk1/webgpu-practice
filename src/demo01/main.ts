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


  // 複数のバッファーを使う版

  // vertices

  const vertices = new Float32Array([
    0.0, 1.0, 0.0, 1.0,
    1.0, -1.0, 0.0, 1.0,
    -1.0, -1.0, 0.0, 1.0,
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength, // make it big enough to store vertices in
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

  // colors

  const colors = new Float32Array([
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
  ]);

  const colorBuffer = device.createBuffer({
    size: colors.byteLength, // make it big enough to store vertices in
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(colorBuffer, 0, colors, 0, colors.length);

  const vertexBuffers: GPUVertexBufferLayout[] = [
    {
      // position
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: 'float32x4',
        },
      ],
      arrayStride: 16,
      stepMode: 'vertex',
    },
    {
      // color
      attributes: [
        {
          shaderLocation: 1, // position
          offset: 0,
          format: 'float32x4',
        }
      ],
      arrayStride: 16,
      stepMode: 'vertex',
    }
  ];

  // ここからパイプラインの設定

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

  // 背景色
  // const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };
  const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };

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
  // slot を分けてバッファを設定する
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.setVertexBuffer(1, colorBuffer);
  passEncoder.draw(3);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
};
