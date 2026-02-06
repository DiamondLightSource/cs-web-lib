export interface DTime {
  datetime: string;
}

export const newDTime = (datetime: Date): DTime => ({
  datetime: datetime.toISOString()
});
export const dTimeToDate = (dTime: DTime | undefined): Date | undefined =>
  dTime?.datetime ? new Date(dTime.datetime) : undefined;
export const dtimeNow = (): DTime => newDTime(new Date());
