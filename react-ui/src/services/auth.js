import axios from "axios";
axios.defaults.withCredentials = true;

const API_URL = 'https://diceforall.herokuapp.com';  //'http://localhost:5000';

// set token to the axios
export const setAuthToken = token => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

// verify refresh token to generate new access token if refresh token is present
export const verifyTokenService = async () => {
  try {
    return await axios.post(`${API_URL}/verifyToken`);
  } catch (err) {
    return {
      error: true,
      response: err.response
    };
  }
}

// user signin API to validate the credential
export const userSigninService = async (user, pass) => {
    try {
      return await axios.post(`${API_URL}/signin`, { user, pass });
    } catch (err) {
      return {
        error: true,
        response: err.response
      };
    }
  }

// user login API to validate the credential
export const userLoginService = async (user, pass) => {
  try {
    return await axios.post(`${API_URL}/login`, { user, pass });
  } catch (err) {
    return {
      error: true,
      response: err.response
    };
  }
}

// manage user logout
export const userLogoutService = async () => {
  try {
    return await axios.post(`${API_URL}/logout`);
  } catch (err) {
    return {
      error: true,
      response: err.response
    };
  }
}

// send data of the users
export const sendUserDataService = async (serviceData) => {
  try {
    return await axios.post(`${API_URL}/userdata`, { serviceData });
  } catch (err) {
    return {
      error: true,
      response: err.response
    };
  }
}

// recive data of the users
export const reciveUserDataService = async (serviceData) => {
  try {
    return await axios.get(`${API_URL}/userdata`);
  } catch (err) {
    return {
      error: true,
      response: err.response
    };
  }
}