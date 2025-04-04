import VestaSubscription from './VestaSubscription';
import VestaRW from './rwAPI';
import VestaLocal from './localAPI';
import { APIConfig, LocalAPIConfig, RWAPIConfig, SubscriptionAPIConfig, VestaboardControlMode, BoardCharArray, Line, VestaboardLayout, VestaboardChar } from './types';
import { createTransitionBoards, characterArrayFromString, convertBoardLayoutToString } from './sharedFunctions';
import { characterCode, characterCodeArray } from './values';
export declare function createVestaboard(mode: VestaboardControlMode, config: APIConfig): VestaSubscription | VestaRW | VestaLocal;
export { VestaSubscription, VestaRW, VestaLocal, VestaboardControlMode, characterCode, characterCodeArray, BoardCharArray, Line, APIConfig, SubscriptionAPIConfig, RWAPIConfig, LocalAPIConfig, VestaboardLayout, VestaboardChar, createTransitionBoards, characterArrayFromString, convertBoardLayoutToString, };
