import type { RootStateInstance } from '../reducer';
import type { ScheduleInstance } from '../../models/schedule';

export const getSchedule = (state: RootStateInstance): ScheduleInstance => state.schedule.schedule; //todo bi hata
