import React from "react";
import {
  BufferTW,
  Geometry,
  Manager,
  ProgramW,
  ShaderW,
} from "../../helpers/webgl";

import * as simpleShader from "../../assets/shaders/simple";
import { mat4, vec3, vec4 } from "gl-matrix";
import { Box, Paper } from "@mui/material";

export interface IEulerAngles {
  eulerAngles: vec3;
}

export class EulerAngles extends React.Component<IEulerAngles, any> {
  private boxRef: React.RefObject<HTMLDivElement> = React.createRef();
  private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  private manager: Manager = new Manager();

  public constructor(props: IEulerAngles) {
    super(props);
  }

  resizeCanvas = (): void => {
    let box: HTMLDivElement | null = this.boxRef.current ?? null;
    if (box === null) {
      return;
    }

    const canvas: HTMLCanvasElement | null = this.canvasRef.current ?? null;
    if (canvas === null) {
      return;
    }

    const boxWidth: number = box.offsetWidth;
    const boxHeight: number = box.offsetHeight;

    canvas.width = boxWidth;
    canvas.height = boxHeight;
  };

  getWebglRenderingContext = (): WebGL2RenderingContext => {
    const gl: WebGL2RenderingContext | null =
      this.canvasRef.current?.getContext("webgl2") ?? null;

    if (gl === null) {
      throw new Error("Failed to create webgl context.");
    }

    return gl;
  };

  webGlRender = () => {
    const gl: WebGL2RenderingContext = this.getWebglRenderingContext();

    // Enables the depth in the scene.
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Sets the clear color and clears the buffer.
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Creates the perspective matrix.
    const fieldOfView = (45.0 * Math.PI) / 180.0;
    const aspect: number = gl.canvas.width / gl.canvas.height;
    const zNear: number = 0.1;
    const zFar: number = 100.0;
    const projectionMatrix: mat4 = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const viewMatrix: mat4 = mat4.create();
    mat4.lookAt(viewMatrix, vec3.fromValues(5, 5, 5), [0, 0, 0], [0, 1, 0])

    // Renders all the models in the manager.
    this.manager.render(gl, projectionMatrix, viewMatrix);
  };

  componentDidUpdate = (
    prevProps: Readonly<IEulerAngles>,
    prevState: Readonly<any>,
    snapshot?: any
  ) => {
    let cube_model_matrix: mat4 =
      this.manager.getModel<Geometry>("cube").matrix;
    mat4.identity(cube_model_matrix);
    mat4.rotateX(
      cube_model_matrix,
      cube_model_matrix,
      -this.props.eulerAngles[0]
    );
    mat4.rotateY(
      cube_model_matrix,
      cube_model_matrix,
      -this.props.eulerAngles[2]
    );
    mat4.rotateZ(
      cube_model_matrix,
      cube_model_matrix,
      this.props.eulerAngles[1]
    );

    this.webGlRender();
  };

  componentWillUnmount = () => {
    const gl: WebGL2RenderingContext = this.getWebglRenderingContext();

    this.manager.destroy(gl);
  };

  componentDidMount = () => {
    this.resizeCanvas();

    const gl: WebGL2RenderingContext = this.getWebglRenderingContext();

    this.manager.makeShader(
      gl,
      "simple_vertex",
      simpleShader.vertexShaderSource,
      gl.VERTEX_SHADER
    );
    this.manager.makeShader(
      gl,
      "simple_fragment",
      simpleShader.fragmentShaderSource,
      gl.FRAGMENT_SHADER
    );
    this.manager.makeProgram(
      gl,
      "simple_program",
      ["simple_vertex", "simple_fragment"],
      ["uProjectionMatrix", "uModelViewMatrix"],
      ["aVertexPosition", "aVertexColor"]
    );

    this.manager.addModel("cube", Geometry.createCube(gl, this.manager));

    this.webGlRender();
  };

  render(): React.ReactNode {
    return (
      <Paper variant="outlined" sx={{ height: "100%" }}>
        <Box ref={this.boxRef} sx={{ height: "100%" }}>
          <canvas
            style={{ margin: "0", padding: "0", display: "block" }}
            ref={this.canvasRef}
          ></canvas>
        </Box>
      </Paper>
    );
  }
}
