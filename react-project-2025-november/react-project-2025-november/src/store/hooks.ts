import type { TypedUseSelectorHook } from 'react-redux';

import { useDispatch, useSelector } from 'react-redux';

import type { RootStateInstance } from './reducer';

export const useAppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootStateInstance> = useSelector;
