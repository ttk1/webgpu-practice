import { Matrix } from './matrix';
import shader from './shader.wgsl';
/**
 * マルチパス
 */
function fetchImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

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

  // vertices
  const vertices = new Float32Array([
    // 上面
    -0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, -0.5,
    -0.5, 0.5, 0.5,
    0.5, 0.5, -0.5,
    -0.5, 0.5, -0.5,
    // 底面
    -0.5, -0.5, 0.5,
    -0.5, -0.5, -0.5,
    0.5, -0.5, -0.5,
    -0.5, -0.5, 0.5,
    0.5, -0.5, -0.5,
    0.5, -0.5, 0.5,
    // 左面
    -0.5, 0.5, 0.5,
    -0.5, 0.5, -0.5,
    -0.5, -0.5, -0.5,
    -0.5, 0.5, 0.5,
    -0.5, -0.5, -0.5,
    -0.5, -0.5, 0.5,
    // 右面
    0.5, 0.5, 0.5,
    0.5, -0.5, 0.5,
    0.5, -0.5, -0.5,
    0.5, 0.5, 0.5,
    0.5, -0.5, -0.5,
    0.5, 0.5, -0.5,
    // 前面
    -0.5, 0.5, 0.5,
    -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5,
    -0.5, 0.5, 0.5,
    0.5, -0.5, 0.5,
    0.5, 0.5, 0.5,
    // 奥面
    -0.5, 0.5, -0.5,
    0.5, 0.5, -0.5,
    0.5, -0.5, -0.5,
    -0.5, 0.5, -0.5,
    0.5, -0.5, -0.5,
    -0.5, -0.5, -0.5
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

  // uv
  const uv = new Float32Array([
    // 上面
    1 / 4, 1 / 3,
    2 / 4, 1 / 3,
    2 / 4, 0 / 3,
    1 / 4, 1 / 3,
    2 / 4, 0 / 3,
    1 / 4, 0 / 3,
    // 底面
    1 / 4, 2 / 3,
    1 / 4, 3 / 3,
    2 / 4, 3 / 3,
    1 / 4, 2 / 3,
    2 / 4, 3 / 3,
    2 / 4, 2 / 3,
    // 左面
    1 / 4, 1 / 3,
    0 / 4, 1 / 3,
    0 / 4, 2 / 3,
    1 / 4, 1 / 3,
    0 / 4, 2 / 3,
    1 / 4, 2 / 3,
    // 右面
    2 / 4, 1 / 3,
    2 / 4, 2 / 3,
    3 / 4, 2 / 3,
    2 / 4, 1 / 3,
    3 / 4, 2 / 3,
    3 / 4, 1 / 3,
    // 前面
    1 / 4, 1 / 3,
    1 / 4, 2 / 3,
    2 / 4, 2 / 3,
    1 / 4, 1 / 3,
    2 / 4, 2 / 3,
    2 / 4, 1 / 3,
    // 奥面
    4 / 4, 1 / 3,
    3 / 4, 1 / 3,
    3 / 4, 2 / 3,
    4 / 4, 1 / 3,
    3 / 4, 2 / 3,
    4 / 4, 2 / 3
  ]);

  const uvBuffer = device.createBuffer({
    size: uv.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(uvBuffer, 0, uv, 0, uv.length);

  // texture
  const textureImage1 = await fetchImage('./texture/dice.png');
  const textureImage2 = await fetchImage('./texture/dice2.png');

  const textureBuffer = device.createBuffer({
    size: 256 * 192 * 4 * 2,
    usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
    //mappedAtCreation: true,
  });
  // mappedAtCreation: true を使わない場合は mapAsync でデータを送信する
  await textureBuffer.mapAsync(
    GPUMapMode.WRITE,
    0,
    256 * 192 * 4 * 2
  );
  const pixelData = new Uint8Array(textureBuffer.getMappedRange());

  const cvs2 = document.createElement('canvas');
  cvs2.width = 256;
  cvs2.height = 192;
  const ctx2 = cvs2.getContext('2d');

  ctx2.drawImage(textureImage1, 0, 0);
  pixelData.set(ctx2.getImageData(0, 0, 256, 192).data, 0);
  ctx2.drawImage(textureImage2, 0, 0);
  pixelData.set(ctx2.getImageData(0, 0, 256, 192).data, 256 * 192 * 4);

  textureBuffer.unmap();

  const texture = device.createTexture({
    size: [
      256, 192, 2
    ],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  // mvp matrix
  const mvpBuffer = device.createBuffer({
    size: 16 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const mvpBuffer2 = device.createBuffer({
    size: 16 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });


  // texture id
  const textureIdBuffer = device.createBuffer({
    size: 1 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const textureIdBuffer2 = device.createBuffer({
    size: 1 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const vertexBuffers: GPUVertexBufferLayout[] = [
    {
      // vertex
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3',
        },
      ],
      arrayStride: 12,
      stepMode: 'vertex'
    },
    {
      // uv
      attributes: [
        {
          shaderLocation: 1,
          offset: 0,
          format: 'float32x2',
        },
      ],
      arrayStride: 8,
      stepMode: 'vertex'
    }
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
      cullMode: 'back'
    },
    layout: 'auto',
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  };
  const depthTexture = device.createTexture({
    size: [cvs.width, cvs.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
  const bindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: mvpBuffer
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: texture.createView(),
      },
      {
        binding: 3,
        resource: {
          buffer: textureIdBuffer
        },
      }
    ]
  });

  const bindGroup2 = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: mvpBuffer2
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: texture.createView(),
      },
      {
        binding: 3,
        resource: {
          buffer: textureIdBuffer2
        },
      }
    ]
  });

  const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };

  let rotateX = 0;
  let rotateY = 0;
  let rotateX2 = 0;
  let rotateY2 = 0;
  function step() {

    // mvp 行列の作成は一旦ここに置いておく

    const scaleMat = new Matrix(4, 4, [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);

    rotateX += 0.01;
    rotateY += 0.015;
    const rotateXMat = new Matrix(4, 4, [
      1, 0, 0, 0,
      0, Math.cos(rotateX), Math.sin(rotateX), 0,
      0, - Math.sin(rotateX), Math.cos(rotateX), 0,
      0, 0, 0, 1
    ]);
    const rotateYMat = new Matrix(4, 4, [
      Math.cos(rotateY), 0, - Math.sin(rotateY), 0,
      0, 1, 0, 0,
      Math.sin(rotateY), 0, Math.cos(rotateY), 0,
      0, 0, 0, 1
    ]);

    const translateX = -0.25;
    const translateY = 0;
    const translateZ = -2;
    const translateMat = new Matrix(4, 4, [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      translateX, translateY, translateZ, 1
    ]);

    // 透視投影
    const fov = (70 / 180) * Math.PI;
    const aspect = cvs.width / cvs.height;
    const near = 0.5;
    const far = 100;
    const prjMat = new Matrix(4, 4, [
      1 / (aspect * Math.tan(fov / 2)), 0, 0, 0,
      0, 1 / Math.tan(fov / 2), 0, 0,
      0, 0, - (far + near) / (far - near), -1,
      0, 0, - 2 * far * near / (far - near), 0
    ]);
    const mvpMat = new Float32Array(prjMat.mul(translateMat).mul(rotateYMat).mul(rotateXMat).mul(scaleMat).toArray());
    device.queue.writeBuffer(mvpBuffer, 0, mvpMat, 0, mvpMat.length);

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: clearColor,
          loadOp: 'clear',
          storeOp: 'store',
          view: ctx.getCurrentTexture().createView()
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };

    const renderPassDescriptor2: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          loadOp: 'load',
          storeOp: 'store',
          view: ctx.getCurrentTexture().createView()
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthLoadOp: 'load',
        depthStoreOp: 'store',
      },
    };

    const commandEncoder = device.createCommandEncoder();

    commandEncoder.copyBufferToTexture(
      { buffer: textureBuffer, bytesPerRow: 256 * 4, rowsPerImage: 192 },
      { texture: texture },
      { width: 256, height: 192, depthOrArrayLayers: 2 },
    );

    let renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);


    device.queue.writeBuffer(textureIdBuffer, 0, new Uint32Array([0]), 0, 1);

    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setVertexBuffer(1, uvBuffer);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(36);
    renderPass.end();

    renderPass = commandEncoder.beginRenderPass(renderPassDescriptor2);

    rotateX2 += 0.017;
    rotateY2 += 0.011;
    const rotateXMat2 = new Matrix(4, 4, [
      1, 0, 0, 0,
      0, Math.cos(rotateX2), Math.sin(rotateX2), 0,
      0, - Math.sin(rotateX2), Math.cos(rotateX2), 0,
      0, 0, 0, 1
    ]);
    const rotateYMat2 = new Matrix(4, 4, [
      Math.cos(rotateY2), 0, - Math.sin(rotateY2), 0,
      0, 1, 0, 0,
      Math.sin(rotateY2), 0, Math.cos(rotateY2), 0,
      0, 0, 0, 1
    ]);

    const translateX2 = 0.25;
    const translateY2 = 0;
    const translateZ2 = -2;
    const translateMat2 = new Matrix(4, 4, [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      translateX2, translateY2, translateZ2, 1
    ]);
    const mvpMat2 = new Float32Array(prjMat.mul(translateMat2).mul(rotateYMat2).mul(rotateXMat2).mul(scaleMat).toArray());
    device.queue.writeBuffer(mvpBuffer2, 0, mvpMat2, 0, mvpMat2.length);

    device.queue.writeBuffer(textureIdBuffer2, 0, new Uint32Array([1]), 0, 1);

    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setVertexBuffer(1, uvBuffer);
    renderPass.setBindGroup(0, bindGroup2);
    renderPass.draw(36);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
};
