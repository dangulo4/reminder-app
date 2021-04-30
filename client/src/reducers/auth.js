import { REGISTER_SUCCESS, REGISTER_FAIL } from '../actions/types';

// create variable to capture state
const initialState = {
  // return key value of token to local storage
  token: localStorage.getItem('token'),
  isAuhtenticated: null,
  loading: true,
  user: null,
};

export default function (state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case REGISTER_SUCCESS:
      // store token in local storage
      localStorage.setItem('token', payload.token);
      return {
        ...state,
        ...payload,
        isAuhtenticated: true,
        loading: false,
      };
    case REGISTER_FAIL:
      // remove key value from  local storage
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuhtenticated: false,
        loading: false,
      };
    default:
      return state;
  }
}
