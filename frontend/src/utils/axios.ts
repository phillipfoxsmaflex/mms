import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { apiUrl } from '../config';

const axiosInt = axios.create({
  baseURL: apiUrl
});

// Request interceptor to add Authorization header
axiosInt.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInt.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject(
      (error.response && error.response.data) || 'There is an error!'
    )
);

export const mock = new AxiosMockAdapter(axiosInt, { delayResponse: 0 });

export default axiosInt;
