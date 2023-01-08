import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { Box } from "@mui/system";
import { vec3 } from "gl-matrix";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Socket } from "socket.io-client";
import { EulerAngles } from "./imu/EulerAgles.component";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export interface ImuEulerAngle {
  pitch: number;
  roll: number;
  yaw: number;
  time: number;
}

export interface EulerAngleMessage {
  time: number;
  euler_angles: [number, number, number];
}

export interface LinearAccelerationMessage {
  time: number;
  linear_acceleration: [number, number, number];
}

export interface GravityMessage {
  time: number;
  gravity: [number, number, number];
}

export const Imu = ({
  socket,
}: {
  socket: Socket;
}): React.ReactElement<any, any> => {
  const theme = useTheme();

  const [currentEulerAngles, setCurrentEulerAngles] = useState<vec3>(
    vec3.create()
  );

  const [eulerAnglesLabels, setEulerAnglesLabels] = useState<string[]>(
    Array.from({ length: 50 }, (_, i) => `-${49 - i}`)
  );
  const [eulerAnglesDatasetX, setEulerAnglesDatasetX] = useState<number[]>(
    Array(50).fill(0.0)
  );
  const [eulerAnglesDatasetY, setEulerAnglesDatasetY] = useState<number[]>(
    Array(50).fill(0.0)
  );
  const [eulerAnglesDatasetZ, setEulerAnglesDatasetZ] = useState<number[]>(
    Array(50).fill(0.0)
  );

  const [linearAccelerationDatasetX, setLinearAccelerationDatasetX] = useState<
    number[]
  >(Array(50).fill(0.0));
  const [linearAccelerationDatasetY, setLinearAccelerationDatasetY] = useState<
    number[]
  >(Array(50).fill(0.0));
  const [linearAccelerationDatasetZ, setLinearAccelerationDatasetZ] = useState<
    number[]
  >(Array(50).fill(0.0));

  const [gravityDatasetX, setGravityDatasetX] = useState<number[]>(
    Array(50).fill(0.0)
  );
  const [gravityDatasetY, setGravityDatasetY] = useState<number[]>(
    Array(50).fill(0.0)
  );
  const [gravityDatasetZ, setGravityDatasetZ] = useState<number[]>(
    Array(50).fill(0.0)
  );

  useEffect(() => {
    let eulerAnglesHandler = (message: EulerAngleMessage) => {
      setCurrentEulerAngles(
        vec3.fromValues(
          message.euler_angles[0],
          message.euler_angles[1],
          message.euler_angles[2]
        )
      );

      setEulerAnglesDatasetX((current) => [
        ...current.slice(1),
        message.euler_angles[0],
      ]);

      setEulerAnglesDatasetY((current) => [
        ...current.slice(1),
        message.euler_angles[1],
      ]);

      setEulerAnglesDatasetZ((current) => [
        ...current.slice(1),
        message.euler_angles[2],
      ]);
    };

    socket.on("sensors.imu.euler_angles", eulerAnglesHandler);

    let linearAccelerationHandler = (message: LinearAccelerationMessage) => {
      setLinearAccelerationDatasetX((current) => [
        ...current.slice(1),
        message.linear_acceleration[0],
      ]);
      setLinearAccelerationDatasetY((current) => [
        ...current.slice(1),
        message.linear_acceleration[1],
      ]);
      setLinearAccelerationDatasetZ((current) => [
        ...current.slice(1),
        message.linear_acceleration[2],
      ]);
    };

    socket.on("sensors.imu.linear_acceleration", linearAccelerationHandler);

    let gravityHandler = (message: GravityMessage) => {
      setGravityDatasetX((current) => [
        ...current.slice(1),
        message.gravity[0],
      ]);
      setGravityDatasetY((current) => [
        ...current.slice(1),
        message.gravity[1],
      ]);
      setGravityDatasetZ((current) => [
        ...current.slice(1),
        message.gravity[2],
      ]);
    };

    socket.on("sensors.imu.gravity", gravityHandler);

    return () => {
      socket.off("sensors.imu.euler_angles", eulerAnglesHandler);
      socket.off("sensors.imu.linear_acceleration", linearAccelerationHandler);
      socket.off("sensors.imu.gravity", gravityHandler);
    };
  }, []);

  return (
    <Grid container spacing={1}>
      <Grid item xs={8}>
        <Paper variant={"outlined"}>
          <Box padding={1}>
            <Typography variant={"caption"} gutterBottom>
              Euler Angles
            </Typography>
            <Box height={200}>
              <Line
                options={{
                  responsive: true,
                  animation: false,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      ticks: {
                        color: theme.palette.text.secondary,
                      },
                    },
                    x: {
                      ticks: {
                        color: theme.palette.text.secondary,
                      },
                    },
                  },
                  elements: {
                    point: {
                      radius: 0,
                    },
                  },
                  plugins: {
                    legend: {
                      position: "top",
                      labels: {
                        color: theme.palette.text.primary,
                      },
                    },
                  },
                }}
                data={{
                  labels: eulerAnglesLabels,
                  datasets: [
                    {
                      label: "Pitch",
                      data: eulerAnglesDatasetX,
                      borderColor: theme.palette.success.main,
                    },
                    {
                      label: "Roll",
                      data: eulerAnglesDatasetY,
                      borderColor: theme.palette.warning.main,
                    },
                    {
                      label: "Yaw",
                      data: eulerAnglesDatasetZ,
                      borderColor: theme.palette.error.main,
                    },
                  ],
                }}
              ></Line>
            </Box>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={4}>
        <EulerAngles eulerAngles={currentEulerAngles} />
      </Grid>
      <Grid item xs={12}>
        <Paper variant={"outlined"}>
          <Box padding={1}>
            <Typography variant={"caption"} gutterBottom>
              Gravity
            </Typography>
            <Box height={200}>
              <Line
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      ticks: {
                        color: theme.palette.text.secondary,
                      },
                    },
                    x: {
                      ticks: {
                        color: theme.palette.text.secondary,
                      },
                    },
                  },
                  maintainAspectRatio: false,
                  animation: false,
                  elements: {
                    point: {
                      radius: 0,
                    },
                  },
                  plugins: {
                    legend: {
                      position: "top",
                      labels: {
                        color: theme.palette.text.primary,
                      },
                    },
                  },
                }}
                data={{
                  labels: eulerAnglesLabels,
                  datasets: [
                    {
                      label: "X",
                      data: gravityDatasetX,
                      borderColor: theme.palette.success.main,
                    },
                    {
                      label: "Y",
                      data: gravityDatasetY,
                      borderColor: theme.palette.warning.main,
                    },
                    {
                      label: "Z",
                      data: gravityDatasetZ,
                      borderColor: theme.palette.error.main,
                    },
                  ],
                }}
              ></Line>
            </Box>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper variant={"outlined"}>
          <Box padding={1}>
            <Typography variant={"caption"} gutterBottom>
              Linear Acceleration
            </Typography>
          </Box>
          <Box height={200}>
            <Line
              options={{
                responsive: true,
                animation: false,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    ticks: {
                      color: theme.palette.text.secondary,
                    },
                  },
                  x: {
                    ticks: {
                      color: theme.palette.text.secondary,
                    },
                  },
                },
                elements: {
                  point: {
                    radius: 0,
                  },
                },
                plugins: {
                  legend: {
                    position: "top",
                    labels: {
                      color: theme.palette.text.primary,
                    },
                  },
                },
              }}
              data={{
                labels: eulerAnglesLabels,
                datasets: [
                  {
                    label: "X",
                    data: linearAccelerationDatasetX,
                    borderColor: theme.palette.success.main,
                  },
                  {
                    label: "Y",
                    data: linearAccelerationDatasetY,
                    borderColor: theme.palette.warning.main,
                  },
                  {
                    label: "Z",
                    data: linearAccelerationDatasetZ,
                    borderColor: theme.palette.error.main,
                  },
                ],
              }}
            ></Line>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};
