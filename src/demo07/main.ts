import { Matrix } from './matrix';
import shader from './shader.wgsl';
/**
 * Texture
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
  const textureImage = await fetchImage('./texture/dice.png');
  const texture = device.createTexture({
    size: [
      textureImage.width, textureImage.height, 1
    ],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });
  device.queue.copyExternalImageToTexture(
    { source: await createImageBitmap(textureImage) },
    { texture: texture },
    [textureImage.width, textureImage.height]
  );
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  // mvp matrix
  const mvpBuffer = device.createBuffer({
    size: 16 * 4,
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
  };

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
      }
    ]
  });

  const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };

  let rotateX = 0;
  let rotateY = 0;
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

    const translateX = 0;
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
          view: ctx.getCurrentTexture().createView(),
        },
      ],
    };

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setVertexBuffer(1, uvBuffer);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(36);
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
};
