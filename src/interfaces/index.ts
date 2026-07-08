type TMetaData = {
  page: number;
  limit: number;
  total: number;
};

export type TSendData<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: TMetaData;
};
