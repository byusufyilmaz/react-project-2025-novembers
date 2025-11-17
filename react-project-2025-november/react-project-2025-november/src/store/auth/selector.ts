import type { RootStateInstance } from '../reducer';
import type { UserInstance } from '../../models/user';

export const getAuthUser = (state: RootStateInstance): UserInstance => state.auth.auth;
