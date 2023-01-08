import { Alert, Paper, Slider } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import { Lines, LineStrip, Manager, ProgramW, ShaderW } from "../helpers/webgl";
import * as simpleShader from "../assets/shaders/simple";
import { mat4, vec3 } from "gl-matrix";
import { socket } from "../states";
import { PoseChange } from "../messages/Message";

export interface PreviewRendererProps {
  fieldOfView: number;
  cameraAngle: number;
}

export interface PreviewRendererState {
  pose: number[][] | null;
  cameraPrimaryAngle: number;
  cameraSecondaryAngle: number;
  cameraDistance: number;
}

export class PreviewRenderer extends React.Component<
  PreviewRendererProps,
  PreviewRendererState
> {
  private boxRef: React.RefObject<HTMLDivElement> = React.createRef();
  private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  private manager: Manager = new Manager();
  private mouseDown: boolean = false;
  private mouseDownStartScreenX: number = 0;
  private mouseDownStartScreenY: number = 0;
  private mouseDownStartCameraPrimaryAngle: number = 0;
  private mouseDownStartCameraSecondaryAngle: number = 0;

  public constructor(props: PreviewRendererProps) {
    super(props);

    this.state = {
      pose: null,
      cameraPrimaryAngle: 0.0,
      cameraSecondaryAngle: 0.0,
      cameraDistance: 10.0,
    };
  }

  componentDidUpdate(
    prevProps: Readonly<any>,
    prevState: Readonly<any>,
    snapshot?: any
  ): void {
    this.webglRender();
  }

  onPoseChange = (message: any) => {
    const poseChange = PoseChange.decode(message);
    this.setState({
      pose: poseChange.leg_vertices,
    });
  };

  onkeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>): void => {
    e.preventDefault();

    switch (e.key) {
      case "z":
        this.setState({
          cameraDistance: this.state.cameraDistance - 1.0,
        });
        break;
      case "Z":
        this.setState({
          cameraDistance: this.state.cameraDistance + 1.0,
        });
        break;
      default:
        break;
    }
  };

  onMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>): void => {
    this.mouseDown = true;
    this.mouseDownStartScreenX = e.screenX;
    this.mouseDownStartScreenY = e.screenY;
    this.mouseDownStartCameraPrimaryAngle = this.state.cameraPrimaryAngle;
    this.mouseDownStartCameraSecondaryAngle = this.state.cameraSecondaryAngle;
  };

  onMouseUp = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>): void => {
    this.mouseDown = false;
    this.mouseDownStartScreenX = 0;
    this.mouseDownStartScreenY = 0;
    this.mouseDownStartCameraPrimaryAngle = 0;
    this.mouseDownStartCameraSecondaryAngle = 0;
  };

  onMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>): void => {
    e.preventDefault();

    if (!this.mouseDown) {
      return;
    }

    let deltaScreenX: number = e.screenX - this.mouseDownStartScreenX;
    let deltaScreenY: number = e.screenY - this.mouseDownStartScreenY;

    this.setState({
      cameraPrimaryAngle:
        this.mouseDownStartCameraPrimaryAngle +
        (Math.PI / 1000.0) * deltaScreenX,
      cameraSecondaryAngle:
        this.mouseDownStartCameraSecondaryAngle +
        (Math.PI / 1000.0) * deltaScreenY,
    });
  };

  getWebglRenderingContext = (): WebGL2RenderingContext => {
    const gl: WebGL2RenderingContext | null =
      this.canvasRef.current?.getContext("webgl2") ?? null;

    if (gl === null) {
      throw new Error("Failed to create webgl context.");
    }

    return gl;
  };

  webglRender = (): void => {
    const gl: WebGL2RenderingContext = this.getWebglRenderingContext();

    if (this.state.pose !== null) {
      this.state.pose.forEach((pose: number[], index: number) => {
        let vertices = pose.flat().map((a) => a / 20.0);
        if (!this.manager.hasModel(`pose_${index}`)) {
          console.log(this.props);
          this.manager.addModel(
            `pose_${index}`,
            LineStrip.create(
              gl,
              this.manager,
              [
                1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
                1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
              ],
              vertices,
              gl.LINE_STRIP
            )
          );
        } else {
          this.manager
            .getModel<LineStrip>(`pose_${index}`)
            .overwriteVertices(gl, vertices);
        }
      });
    }

    // Enables the depth in the scene.
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Sets the clear color and clears the buffer.
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Creates the perspective matrix.
    const fieldOfView = this.props.fieldOfView;
    const aspect: number = gl.canvas.width / gl.canvas.height;
    const zNear: number = 0.1;
    const zFar: number = 100.0;
    const projectionMatrix: mat4 = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const viewMatrix: mat4 = mat4.create();
    const eye: vec3 = vec3.fromValues(
      this.state.cameraDistance,
      this.state.cameraDistance,
      this.state.cameraDistance
    );
    vec3.rotateZ(eye, eye, vec3.create(), this.state.cameraSecondaryAngle);
    vec3.rotateY(eye, eye, vec3.create(), this.state.cameraPrimaryAngle);
    mat4.lookAt(viewMatrix, eye, [0, 0, 0], [0, 1, 0]);

    this.manager.render(gl, projectionMatrix, viewMatrix);
  };

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

  componentDidMount = (): void => {
    this.resizeCanvas();

    const gl: WebGL2RenderingContext = this.getWebglRenderingContext();

    socket.on(PoseChange.ROUTING_KEY, this.onPoseChange);

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

    this.manager.addModel(
      "global_origin",
      Lines.createAxisLines(gl, this.manager)
    );

    this.webglRender();
  };

  componentWillUnmount = (): void => {
    const gl: WebGL2RenderingContext = this.getWebglRenderingContext();

    socket.off(PoseChange.ROUTING_KEY, this.onPoseChange);

    this.manager.destroy(gl);
  };

  render = (): React.ReactNode => {
    return (
      <Paper variant="outlined" sx={{ height: "100%" }}>
        <Box ref={this.boxRef} sx={{ height: "100%" }}>
          <canvas
            tabIndex={0}
            onMouseUp={this.onMouseUp}
            onMouseDown={this.onMouseDown}
            onMouseMove={this.onMouseMove}
            onKeyDown={this.onkeyDown}
            style={{
              margin: "0",
              padding: "0",
              display: "block",
            }}
            ref={this.canvasRef}
          ></canvas>
        </Box>
      </Paper>
    );
  };
}

export const Preview = () => {
  const [cameraAngle, setCameraAngle] = React.useState<number>(Math.PI / 2);
  const [fieldOfView, setFieldOfView] = React.useState<number>(Math.PI / 4);
  const [pose, setPose] = React.useState<number[][] | null>(null);

  return (
    <>
      <PreviewRenderer fieldOfView={fieldOfView} cameraAngle={cameraAngle} />
    </>
  );
};
