import { mat3, mat4, vec3, vec4 } from "gl-matrix";

export class ShaderW {
  public constructor(
    public shader: WebGLShader,
    private valid: boolean = true
  ) {}

  private ensureValid(): void {
    if (!this.valid) {
      throw new Error("Current shader is no longer valid.");
    }
  }

  public static compile(
    gl: WebGL2RenderingContext,
    source: string,
    type: number
  ): ShaderW {
    const shader: WebGLShader | null = gl.createShader(type);
    if (shader === null) {
      throw new Error("Failed to create shader.");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);

      throw new Error(
        `Failed to compile shader, error: ${gl.getShaderInfoLog(shader)}`
      );
    }

    return new this(shader);
  }

  public destroy(gl: WebGL2RenderingContext): void {
    gl.deleteShader(this.shader);
    this.valid = false;
  }
}

export type ProgramWUniformLocations = {
  [key: string]: WebGLUniformLocation;
};

export type ProgramWAttributeLocations = {
  [key: string]: number;
};

export class ProgramW {
  public constructor(
    public program: WebGLProgram,
    public uniformLocations: ProgramWUniformLocations,
    public attribLocations: ProgramWAttributeLocations,
    private valid: boolean = true
  ) {}

  private ensureValid(): void {
    if (!this.valid) {
      throw new Error("Current program is no longer valid.");
    }
  }

  public getUniformLocation(uniform: string): WebGLUniformLocation {
    const location: WebGLUniformLocation | undefined =
      this.uniformLocations[uniform];
    if (location === undefined) {
      throw new Error(`No such uniform found: ${uniform}`);
    }

    return location;
  }

  public getAttributeLocation(attribute: string): number {
    const location: number | undefined = this.attribLocations[attribute];
    if (location === undefined) {
      throw new Error(`No such attribute found: ${attribute}`);
    }

    return location;
  }

  public setUniformMatrix4fv(
    gl: WebGL2RenderingContext,
    uniform: string,
    matrix: mat4
  ) {
    const location: WebGLUniformLocation = this.getUniformLocation(uniform);
    gl.uniformMatrix4fv(location, false, matrix);
  }

  public use(gl: WebGL2RenderingContext): void {
    this.ensureValid();

    gl.useProgram(this.program);
  }

  public static link(
    gl: WebGL2RenderingContext,
    shaders: ShaderW[],
    uniforms: string[] = [],
    attributes: string[] = []
  ): ProgramW {
    const program: WebGLProgram | null = gl.createProgram();
    if (program === null) {
      throw new Error("Failed to create program.");
    }

    shaders.forEach((shaderW: ShaderW): void => {
      gl.attachShader(program, shaderW.shader);
    });

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);

      throw new Error(
        `Failed to link program, error: ${gl.getProgramInfoLog(program)}`
      );
    }

    let uniformLocations: ProgramWUniformLocations = {};

    uniforms.forEach((uniform: string): void => {
      const uniformLocation: WebGLUniformLocation | null =
        gl.getUniformLocation(program, uniform);
      if (uniformLocation === null) {
        throw new Error(`Could not find uniform location for name: ${uniform}`);
      }

      uniformLocations[uniform] = uniformLocation;
    });

    let attributeLocations: ProgramWAttributeLocations = {};

    attributes.forEach((attribute: string): void => {
      const attributeLocation: number | null = gl.getAttribLocation(
        program,
        attribute
      );
      if (attributeLocation === null) {
        throw new Error(
          `Could not find attribute location for name: ${attribute}`
        );
      }

      attributeLocations[attribute] = attributeLocation;
    });

    return new this(program, uniformLocations, attributeLocations);
  }

  public destroy(gl: WebGL2RenderingContext): void {
    gl.deleteProgram(this.program);
    this.valid = false;
  }
}

export class VAO {
  public constructor(private vao: WebGLVertexArrayObject | null) {}

  public ensureValid(): void {
    if (this.vao === null) {
      throw new Error("VAO is no longer valid.");
    }
  }

  public destroy(gl: WebGL2RenderingContext): void {
    this.ensureValid();

    gl.deleteVertexArray(this.vao);

    this.vao = null;
  }

  public bind(gl: WebGL2RenderingContext): void {
    this.ensureValid();

    gl.bindVertexArray(this.vao);
  }

  public unbind(gl: WebGL2RenderingContext): void {
    this.ensureValid();

    gl.bindVertexArray(null);
  }

  public static create(gl: WebGL2RenderingContext): VAO {
    const vao: WebGLVertexArrayObject | null = gl.createVertexArray();
    if (vao === null) {
      throw new Error("Failed to create VAO.");
    }

    return new this(vao);
  }
}

export class BufferTW {
  public constructor(
    private buffer: WebGLBuffer | null,
    private target: number,
    private usage: number,
  ) {}

  public ensureValid(): void {
    if (this.buffer === null) {
      throw new Error("Buffer not valid anymore.");
    }
  }

  public destroy(gl: WebGL2RenderingContext): void {
    this.ensureValid();

    gl.deleteBuffer(this.buffer);
  }

  public bind(gl: WebGL2RenderingContext): void {
    this.ensureValid();

    gl.bindBuffer(this.target, this.buffer);
  }

  public overwriteFloat32(gl: WebGL2RenderingContext, data: number[]) {
    this.ensureValid();

    gl.bindBuffer(this.target, this.buffer);

    gl.bufferData(this.target, new Float32Array(data), this.usage);
  }

  public static create<T extends new (args: number[]) => any>(
    type: T,
    gl: WebGL2RenderingContext,
    target: number,
    data: number[],
    usage: number
  ): BufferTW {
    const buffer: WebGLBuffer | null = gl.createBuffer();
    if (buffer === null) {
      throw new Error("Failed to create array buffer.");
    }

    gl.bindBuffer(target, buffer);

    gl.bufferData(target, new type(data), usage);

    return new this(buffer, target, usage);
  }

  public static createFloat32(
    gl: WebGL2RenderingContext,
    target: number,
    data: number[],
    usage: number
  ): BufferTW {
    return this.create(Float32Array, gl, target, data, usage);
  }

  public static createUin16(
    gl: WebGL2RenderingContext,
    target: number,
    data: number[],
    usage: number
  ): BufferTW {
    return this.create(Uint16Array, gl, target, data, usage);
  }
}

export type ManagerShaderMap = {
  [key: string]: ShaderW;
};

export type ManagerProgramMap = {
  [key: string]: ProgramW;
};

export type ManagerModelMap = {
  [key: string]: Model;
};

export class Manager {
  public constructor(
    public programs: ManagerProgramMap = {},
    public shaders: ManagerShaderMap = {},
    public models: ManagerModelMap = {}
  ) {}

  public getShader(name: string): ShaderW {
    const shader: ShaderW | undefined = this.shaders[name];

    if (shader === undefined) {
      throw new Error(`Could not find shader with name: "${name}"`);
    }

    return shader;
  }

  public getProgram(name: string): ProgramW {
    const program: ProgramW | undefined = this.programs[name];

    if (program === undefined) {
      throw new Error(`Could not find program with name: "${name}"`);
    }

    return program;
  }

  public makeShader(
    gl: WebGL2RenderingContext,
    name: string,
    source: string,
    type: number
  ) {
    const shader: ShaderW = ShaderW.compile(gl, source, type);

    this.shaders[name] = shader;
  }

  public makeProgram(
    gl: WebGL2RenderingContext,
    name: string,
    shaderNames: string[],
    uniforms: string[],
    attributes: string[]
  ) {
    const shaders: ShaderW[] = shaderNames.map((name: string) =>
      this.getShader(name)
    );

    const program: ProgramW = ProgramW.link(gl, shaders, uniforms, attributes);

    this.programs[name] = program;
  }

  public addModel(name: string, model: Model): void {
    this.models[name] = model;
  }

  public getModel<T>(name: string): T {
    const model: Model | undefined = this.models[name];

    if (model === undefined) {
      throw new Error(`Could not find model with name: "${name}"`);
    }

    return model as T;
  }

  public hasModel(name: string): boolean {
    return !!this.models[name];
  }

  public render(
    gl: WebGL2RenderingContext,
    projectionMatrix: mat4,
    viewMatrix: mat4
  ) {
    Object.values(this.models).forEach((model: Model) => {
      model.render(gl, this, projectionMatrix, viewMatrix);
    });
  }

  public destroy(gl: WebGL2RenderingContext) {
    Object.values(this.programs).forEach((program: ProgramW) =>
      program.destroy(gl)
    );
    Object.values(this.shaders).forEach((shader: ShaderW) =>
      shader.destroy(gl)
    );
    Object.values(this.models).forEach((model: Model) => model.destroy(gl));
  }
}

export class Model {
  public constructor(public matrix: mat4) {}

  public render(
    gl: WebGL2RenderingContext,
    manager: Manager,
    projectionMatrix: mat4,
    viewMatrix: mat4
  ): void {
    throw new Error("Not implemented!");
  }

  public destroy(gl: WebGL2RenderingContext): void {
    throw new Error("Not implemented!");
  }
}

export class LineStrip extends Model {
  public static PROGRAM: string = "simple_program";

  public constructor(
    public size: number,
    public colorBuffer: BufferTW,
    public positionBuffer: BufferTW,
    public vao: VAO,
    public type: number,
  ) {
    super(mat4.create());
  }

  public overwriteVertices(gl: WebGL2RenderingContext, vertices: number[]) {
    this.positionBuffer.bind(gl);
    this.positionBuffer.overwriteFloat32(gl, vertices);
  }

  public static create(
    gl: WebGL2RenderingContext,
    manager: Manager,
    colors: number[],
    vertices: number[],
    type: number,
  ): LineStrip {
    const program: ProgramW = manager.getProgram(LineStrip.PROGRAM);

    const colorBuffer: BufferTW = BufferTW.createFloat32(
      gl,
      gl.ARRAY_BUFFER,
      colors,
      gl.STATIC_DRAW
    );
    const positionBuffer: BufferTW = BufferTW.createFloat32(
      gl,
      gl.ARRAY_BUFFER,
      vertices,
      gl.STATIC_DRAW
    );

    const vao: VAO = VAO.create(gl);

    vao.bind(gl);

    const colorAttributeLocation: number =
      program.getAttributeLocation("aVertexColor");
    const positionAttributeLocation: number =
      program.getAttributeLocation("aVertexPosition");

    gl.enableVertexAttribArray(colorAttributeLocation);
    colorBuffer.bind(gl);
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(positionAttributeLocation);
    positionBuffer.bind(gl);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    vao.unbind(gl);

    return new this(colors.length / 4, colorBuffer, positionBuffer, vao, type);
  }

  public render(
    gl: WebGL2RenderingContext,
    manager: Manager,
    projectionMatrix: mat4,
    viewMatrix: mat4
  ): void {
    const modelViewMatrix: mat4 = mat4.create();
    mat4.multiply(modelViewMatrix, viewMatrix, this.matrix);

    const program: ProgramW = manager.getProgram(LineStrip.PROGRAM);

    this.vao.bind(gl);

    program.use(gl);

    program.setUniformMatrix4fv(gl, "uProjectionMatrix", projectionMatrix);
    program.setUniformMatrix4fv(gl, "uModelViewMatrix", modelViewMatrix);

    gl.drawArrays(this.type, 0, this.size);
  }

  public destroy(gl: WebGL2RenderingContext): void {
    this.vao.destroy(gl);
    this.colorBuffer.destroy(gl);
    this.positionBuffer.destroy(gl);
  }
}

export class Lines extends Model {
  public static PROGRAM: string = "simple_program";

  public constructor(
    public size: number,
    public colorBuffer: BufferTW,
    public positionBuffer: BufferTW,
    public vao: VAO
  ) {
    super(mat4.create());
  }

  public static createAxisLines(
    gl: WebGL2RenderingContext,
    manager: Manager
  ): Lines {
    return this.create(
      gl,
      manager,
      [
        /* X Colors */
        1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0 /* Y Colors */, 0.0, 1.0, 0.0,
        1.0, 0.0, 1.0, 0.0, 1.0 /* Z Colors */, 0.3, 0.3, 1.0, 1.0, 0.3, 0.3,
        1.0, 1.0,
      ],
      [
        /* X Axis */
        0.0, 0.0, 0.0, 1.0, 0.0, 0.0 /* Y Axis */, 0.0, 0.0, 0.0, 0.0, 1.0,
        0.0 /* Z Axis */, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0,
      ]
    );
  }

  public static create(
    gl: WebGL2RenderingContext,
    manager: Manager,
    colors: number[],
    vertices: number[]
  ): Lines {
    const program: ProgramW = manager.getProgram(LineStrip.PROGRAM);

    const colorBuffer: BufferTW = BufferTW.createFloat32(
      gl,
      gl.ARRAY_BUFFER,
      colors,
      gl.STATIC_DRAW
    );
    const positionBuffer: BufferTW = BufferTW.createFloat32(
      gl,
      gl.ARRAY_BUFFER,
      vertices,
      gl.STATIC_DRAW
    );

    const vao: VAO = VAO.create(gl);

    vao.bind(gl);

    const colorAttributeLocation: number =
      program.getAttributeLocation("aVertexColor");
    const positionAttributeLocation: number =
      program.getAttributeLocation("aVertexPosition");

    gl.enableVertexAttribArray(colorAttributeLocation);
    colorBuffer.bind(gl);
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(positionAttributeLocation);
    positionBuffer.bind(gl);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    vao.unbind(gl);

    return new this(colors.length / 4, colorBuffer, positionBuffer, vao);
  }

  public render(
    gl: WebGL2RenderingContext,
    manager: Manager,
    projectionMatrix: mat4,
    viewMatrix: mat4
  ): void {
    const modelViewMatrix: mat4 = mat4.create();
    mat4.multiply(modelViewMatrix, viewMatrix, this.matrix);

    const program: ProgramW = manager.getProgram(Lines.PROGRAM);

    this.vao.bind(gl);

    program.use(gl);

    program.setUniformMatrix4fv(gl, "uProjectionMatrix", projectionMatrix);
    program.setUniformMatrix4fv(gl, "uModelViewMatrix", modelViewMatrix);

    gl.drawArrays(gl.LINES, 0, this.size);
  }

  public destroy(gl: WebGL2RenderingContext): void {
    this.vao.destroy(gl);
    this.colorBuffer.destroy(gl);
    this.positionBuffer.destroy(gl);
  }
}

export class Geometry extends Model {
  public static PROGRAM: string = "simple_program";

  public constructor(
    public vertexCount: number,
    public colorBuffer: BufferTW,
    public positionBuffer: BufferTW,
    public indexBuffer: BufferTW,
    public vao: VAO
  ) {
    super(mat4.create());
  }

  public static create(
    gl: WebGL2RenderingContext,
    manager: Manager,
    colors: number[],
    positions: number[],
    indices: number[]
  ): Geometry {
    const program: ProgramW = manager.getProgram(LineStrip.PROGRAM);

    const colorAttributeLocation: number =
      program.getAttributeLocation("aVertexColor");
    const positionAttributeLocation: number =
      program.getAttributeLocation("aVertexPosition");

    const colorBuffer: BufferTW = BufferTW.createFloat32(
      gl,
      gl.ARRAY_BUFFER,
      colors,
      gl.STATIC_DRAW
    );
    const positionBuffer: BufferTW = BufferTW.createFloat32(
      gl,
      gl.ARRAY_BUFFER,
      positions,
      gl.STATIC_DRAW
    );
    const indexBuffer: BufferTW = BufferTW.createUin16(
      gl,
      gl.ELEMENT_ARRAY_BUFFER,
      indices,
      gl.STATIC_DRAW
    );

    const vao: VAO = VAO.create(gl);

    vao.bind(gl);

    gl.enableVertexAttribArray(colorAttributeLocation);
    colorBuffer.bind(gl);
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(positionAttributeLocation);
    positionBuffer.bind(gl);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    indexBuffer.bind(gl);

    vao.unbind(gl);

    return new this(
      indices.length,
      colorBuffer,
      positionBuffer,
      indexBuffer,
      vao
    );
  }

  public static createCube(
    gl: WebGL2RenderingContext,
    manager: Manager
  ): Geometry {
    return this.create(
      gl,
      manager,
      [
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0,
      ],
      [
        -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0,
        -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0,
        1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
      ],
      [
        0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12,
        14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
      ]
    );
  }

  public render(
    gl: WebGL2RenderingContext,
    manager: Manager,
    projectionMatrix: mat4,
    viewMatrix: mat4
  ): void {
    const modelViewMatrix: mat4 = mat4.create();
    mat4.multiply(modelViewMatrix, viewMatrix, this.matrix);

    const program: ProgramW = manager.getProgram(Lines.PROGRAM);

    this.vao.bind(gl);

    program.use(gl);

    program.setUniformMatrix4fv(gl, "uProjectionMatrix", projectionMatrix);
    program.setUniformMatrix4fv(gl, "uModelViewMatrix", modelViewMatrix);

    gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
  }

  public destroy(gl: WebGL2RenderingContext): void {
    this.vao.destroy(gl);
    this.colorBuffer.destroy(gl);
    this.positionBuffer.destroy(gl);
    this.indexBuffer.destroy(gl);
  }
}
