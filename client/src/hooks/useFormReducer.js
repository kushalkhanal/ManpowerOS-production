// Form reducer actions
export const FORM_ACTIONS = {
  SET_FIELD: 'SET_FIELD',
  SET_FIELDS: 'SET_FIELDS',
  RESET: 'RESET',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

/**
 * Generic form reducer
 * Handles common form state operations
 */
export const formReducer = (state, action) => {
  switch (action.type) {
    case FORM_ACTIONS.SET_FIELD:
      return {
        ...state,
        data: {
          ...state.data,
          [action.payload.name]: action.payload.value,
        },
      };

    case FORM_ACTIONS.SET_FIELDS:
      return {
        ...state,
        data: {
          ...state.data,
          ...action.payload,
        },
      };

    case FORM_ACTIONS.RESET:
      return {
        ...state,
        data: action.payload || state.initialData,
        error: null,
      };

    case FORM_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case FORM_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    default:
      return state;
  }
};

/**
 * Create initial form state
 */
export const createFormState = (initialData = {}) => ({
  data: initialData,
  initialData,
  loading: false,
  error: null,
});

/**
 * Form action creators
 */
export const formActions = {
  setField: (name, value) => ({
    type: FORM_ACTIONS.SET_FIELD,
    payload: { name, value },
  }),

  setFields: (fields) => ({
    type: FORM_ACTIONS.SET_FIELDS,
    payload: fields,
  }),

  reset: (data) => ({
    type: FORM_ACTIONS.RESET,
    payload: data,
  }),

  setLoading: (loading) => ({
    type: FORM_ACTIONS.SET_LOADING,
    payload: loading,
  }),

  setError: (error) => ({
    type: FORM_ACTIONS.SET_ERROR,
    payload: error,
  }),
};
