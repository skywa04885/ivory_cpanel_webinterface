import React from "react";
import { Add, MyLocation, Remove, ThreeSixty } from "@mui/icons-material";
import {
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { socket } from "../states";
import { ChangePawPosition, ChangeTorsoOrientation } from "../messages/Message";

interface ControlSegmentProps {
  title: string;
  children: any;
  adjustable: boolean;
  setAdjustable: React.Dispatch<React.SetStateAction<boolean>>;
}

const ControlSegment = ({
  title,
  children,
  adjustable,
  setAdjustable,
}: ControlSegmentProps): React.ReactElement<any, any> => {
  const onAdjustableChange = (): void => {
    setAdjustable((adjustable) => !adjustable);
  };

  return (
    <Paper variant="elevation" elevation={3}>
      <Box padding={2}>
        <Stack spacing={2}>
          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            <Typography variant={"overline"}>{title}</Typography>
            <ToggleButton
              color="warning"
              size={"small"}
              value="check"
              selected={adjustable}
              onClick={onAdjustableChange}
            >
              Aanpasbaar
            </ToggleButton>
          </Stack>
          {children}
        </Stack>
      </Box>
    </Paper>
  );
};

export interface ControlAngleSliderProps {
  label: string;
  step?: number;
  default_value?: number;
  value: number;
  disabled: boolean;
  setValue: (newValue: number) => void;
}
export const ControlAngleSlider = ({
  label,
  step,
  default_value,
  value,
  setValue,
  disabled,
}: ControlAngleSliderProps): React.ReactElement<any, any> => {
  step ??= 1.0;
  default_value ??= 0.0;

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    let inputValue: number = parseFloat(event.target.value);

    setValue(inputValue);
  };

  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    if (event.target.value.trim().length === 0) {
      setValue(default_value!);
    }
  };

  const addClick = (): void => {
    setValue(value + step!);
  };

  const removeClick = (): void => {
    setValue(value - step!);
  };

  return (
    <Box>
      <Stack direction={"row"} spacing={2} alignItems={"center"}>
        <MyLocation />
        <TextField
          disabled={disabled}
          color={"warning"}
          fullWidth={true}
          onChange={handleInputChange}
          size={"small"}
          value={value}
          label={label}
          onBlur={handleInputBlur}
          inputProps={{
            step: step!,
            type: "number",
          }}
        />
        <ButtonGroup>
          <Button
            disabled={disabled}
            onClick={addClick}
            variant="contained"
            size={"small"}
            color="warning"
          >
            <Add />
          </Button>
          <Button
            disabled={disabled}
            onClick={removeClick}
            size={"small"}
            variant="outlined"
            color="warning"
          >
            <Remove />
          </Button>
        </ButtonGroup>
      </Stack>
    </Box>
  );
};

export interface TorsoAngleSliderProps {
  value: number;
  disabled: boolean;
  setValue: (value: number) => void;
}

export const TorsoAngleSlider = ({
  value,
  setValue,
  disabled,
}: TorsoAngleSliderProps) => {
  const onChange = (
    _event: Event,
    value: number | number[],
    _activeThumb: number
  ): void => {
    setValue(value as number);
  };

  return (
    <Box>
      <Stack direction={"row"} spacing={3} alignItems={"center"}>
        <ThreeSixty />
        <Slider
          disabled={disabled}
          valueLabelDisplay={"auto"}
          color={"warning" as any}
          value={value}
          step={1}
          min={-45}
          max={45}
          onChange={onChange}
        />
      </Stack>
    </Box>
  );
};

export interface PawtranslationMessage {
  leg: number;
  relative: boolean;
  translation: [number, number, number];
}

export const PawControl = (): React.ReactElement<any, any> => {
  const [adjustable, setAdjustable] = React.useState<boolean>(false);
  const [leg, setLeg] = React.useState<string>("backLeft");
  const [x, setX] = React.useState<number>(-29.0);
  const [y, setY] = React.useState<number>(-7.0);
  const [z, setZ] = React.useState<number>(-25.0);

  React.useEffect(() => {
    if (!adjustable) {
      return;
    }

    const message: ChangePawPosition = new ChangePawPosition(
      {
        backLeft: 0,
        backRight: 1,
        frontLeft: 2,
        frontRight: 3,
      }[leg]!,
      false,
      [x, y, z]
    );

    socket.emit(message.routing_key, message.encode());
  }, [x, y, z]);

  const onLegSelectChange = (event: SelectChangeEvent): void => {
    setLeg(event.target.value as string);
  };

  return (
    <ControlSegment
      title="Poot eindpositie"
      adjustable={adjustable}
      setAdjustable={setAdjustable}
    >
      <ControlAngleSlider
        disabled={!adjustable}
        value={x}
        setValue={setX}
        label="X"
      />
      <ControlAngleSlider
        disabled={!adjustable}
        value={y}
        setValue={setY}
        label="Y"
      />
      <ControlAngleSlider
        disabled={!adjustable}
        value={z}
        setValue={setZ}
        label="Z"
      />
      <FormControl color={"error"} variant={"filled"} fullWidth>
        <InputLabel id={"control__leg-select"}>Leg</InputLabel>
        <Select
          onChange={onLegSelectChange}
          value={leg}
          labelId={"control__leg-select"}
          size={"small"}
          label={"Poot"}
        >
          <MenuItem value={"frontLeft"}>Links voor</MenuItem>
          <MenuItem value={"frontRight"}>Rechts voor</MenuItem>
          <MenuItem value={"backLeft"}>Links achter</MenuItem>
          <MenuItem value={"backRight"}>Rechts achter</MenuItem>
        </Select>
      </FormControl>
    </ControlSegment>
  );
};

export const TorsoOrientationControl = (): React.ReactElement<any, any> => {
  const [adjustable, setAdjustable] = React.useState<boolean>(false);
  const [pitch, setPitch] = React.useState<number>(0.0);
  const [roll, setRoll] = React.useState<number>(0.0);
  const [yaw, setYaw] = React.useState<number>(0.0);

  React.useEffect(() => {
    if (!adjustable) {
      return;
    }

    const message: ChangeTorsoOrientation = new ChangeTorsoOrientation(false, [
      (pitch / 180.0) * Math.PI,
      (roll / 180.0) * Math.PI,
      (yaw / 180.0) * Math.PI,
    ]);

    socket.emit(message.routing_key, message.encode());
  }, [pitch, roll, yaw]);

  return (
    <ControlSegment
      title="Torso orientatie"
      adjustable={adjustable}
      setAdjustable={setAdjustable}
    >
      <TorsoAngleSlider
        disabled={!adjustable}
        value={pitch}
        setValue={setPitch}
      />
      <TorsoAngleSlider
        disabled={!adjustable}
        value={roll}
        setValue={setRoll}
      />
      <TorsoAngleSlider disabled={!adjustable} value={yaw} setValue={setYaw} />
    </ControlSegment>
  );
};

export const TorsoPositionControl = (): React.ReactElement<any, any> => {
  const [adjustable, setAdjustable] = React.useState<boolean>(false);
  const [pitch, setPitch] = React.useState<number>(0.0);
  const [roll, setRoll] = React.useState<number>(0.0);
  const [yaw, setYaw] = React.useState<number>(0.0);

  return (
    <ControlSegment
      title="Torso positie"
      adjustable={adjustable}
      setAdjustable={setAdjustable}
    >
      <TorsoAngleSlider
        disabled={!adjustable}
        value={pitch}
        setValue={setPitch}
      />
      <TorsoAngleSlider
        disabled={!adjustable}
        value={roll}
        setValue={setRoll}
      />
      <TorsoAngleSlider disabled={!adjustable} value={yaw} setValue={setYaw} />
    </ControlSegment>
  );
};

export const Control = (): React.ReactElement<any, any> => {
  return (
    <Stack spacing={1}>
      <PawControl />
      <TorsoOrientationControl />
      <TorsoPositionControl />
    </Stack>
  );
};
