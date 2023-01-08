export const sleep = async (time: number): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, time);
  });
};
