export class Message {
  public get routing_key(): string {
    throw new Error("Not implemented");
  }

  public encode(): any {
    throw new Error("Not implemented");
  }

  public static decode(obj: any): any {
    throw new Error("Not implemented");
  }
}

export class ChangePawPosition extends Message {
  public constructor(
    public leg: number,
    public relative: boolean,
    public position: [number, number, number]
  ) {
    super();
  }

  public get routing_key(): string {
    return "kinematics.instructions.change_paw_position";
  }

  public encode(): any {
    return {
      leg: this.leg,
      relative: this.relative,
      position: this.position,
    };
  }
}

export class ChangeTorsoPosition extends Message {
  public constructor(
    public relative: boolean,
    public position: [number, number, number]
  ) {
    super();
  }

  public get routing_key(): string {
    return "kinematics.instructions.change_torso_position";
  }

  public encode(): any {
    return {
      relative: this.relative,
      position: this.position,
    };
  }
}

export class ChangeTorsoOrientation extends Message {
  public constructor(
    public relative: boolean,
    public orientation: [number, number, number]
  ) {
    super();
  }

  public get routing_key(): string {
    return "kinematics.instructions.change_torso_orientation";
  }

  public encode(): any {
    return {
      relative: this.relative,
      orientation: this.orientation,
    };
  }
}

export class PoseChange extends Message {
  public static ROUTING_KEY: string = "cpanel.updates.pose_change";

  public constructor(
    public timestamp: number,
    public leg_vertices: number[][]
  ) {
    super();
  }

  public get routing_key(): string {
    return PoseChange.ROUTING_KEY;
  }

  public static decode(obj: any): PoseChange {
    return new PoseChange(obj.timestamp, obj.leg_vertices);
  }
}