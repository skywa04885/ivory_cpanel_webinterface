import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect } from "react";
import { socket } from "../states";
import _ from "lodash";
import useSound from "use-sound";
import { DataGrid } from '@mui/x-data-grid';

import logSound from '../assets/sounds/log.mp3';

interface LogRecord {
  group?: string;
  timestamp: number;
  message: string;
}

export const Log = () => {
  const [playLogSound] = useSound(logSound);

  const [messages, setMessages] = React.useState<
    {
      origin: string;
      group?: string;
      timestamp: number;
      message: string;
      id: string;
    }[]
  >([]);

  useEffect(() => {
    const handler = (routingKey: string, logRecord: LogRecord) => {
      const messageId: string = _.uniqueId("m");

      const [_log, origin, level] = routingKey.split('.');

      playLogSound();

      setMessages((messages) => [
        {
          origin: origin,
          group: logRecord.group,
          timestamp: logRecord.timestamp,
          message: logRecord.message,
          id: messageId,
        },
        ...messages.slice(0, messages.length > 100 ? -1 : undefined),
      ]);
    };

    socket.on("log", handler);

    return (): void => {
      socket.off("log", handler);
    };
  }, []);

  return (
    <Paper elevation={3} variant={"elevation"}>
      <Box padding={1} sx={{height: 600}}>
        <DataGrid
          rows={messages}
          rowHeight={30}
          columns={[
            {
              field: 'timestamp',
              headerName: 'Tijd',
              width: 150,
            },
            {
              field: 'origin',
              headerName: 'Afkomst',
              width: 200,
            },
            {
              field: 'group',
              headerName: 'Groep',
              width: 100,
            },
            {
              field: 'message',
              headerName: 'Bericht',
              width: 1000,
            }
          ]}
          pageSize={20}
          rowsPerPageOptions={[20]}
        />
      </Box>
    </Paper>
  );
};
