import shader from './shader.wgsl';
/**
 * ジオメトリインスタンシング
 */
export default async () => {
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

  // positions
  const NUM_INSTANCES = 100;
  const positionList: number[] = [];
  for (let i = 0; i < NUM_INSTANCES; i++) {
    positionList.push(
      Math.floor((Math.random() - 0.5) * 20),
      Math.floor((Math.random() - 0.5) * 20)
    );
  }
  const positions = new Float32Array(positionList);

  const positionBuffer = device.createBuffer({
    size: positions.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(positionBuffer, 0, positions, 0, positions.length);

  // offsets
  const offsets = new Float32Array([
    0.0, 1.0,
    1.0, -1.0,
    -1.0, -1.0,
  ]);

  const vertexBuffer = device.createBuffer({
    size: offsets.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, offsets, 0, offsets.length);

  // colors
  const colors = new Float32Array([
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
  ]);


  const colorBuffer = device.createBuffer({
    size: colors.byteLength,
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
          format: 'float32x2',
        }
      ],
      arrayStride: 8,
      stepMode: 'instance',
    },
    {
      // offset
      attributes: [
        {
          shaderLocation: 1,
          offset: 0,
          format: 'float32x2',
        },
      ],
      arrayStride: 8,
      stepMode: 'vertex',
    },
    {
      // color
      attributes: [
        {
          shaderLocation: 2,
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
  passEncoder.setVertexBuffer(0, positionBuffer);
  passEncoder.setVertexBuffer(1, vertexBuffer);
  passEncoder.setVertexBuffer(2, colorBuffer);
  passEncoder.draw(3, NUM_INSTANCES);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);
};
