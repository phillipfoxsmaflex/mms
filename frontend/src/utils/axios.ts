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
  (error) => {
    // Enhanced error logging
    console.error('Axios Response Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        baseURL: error.config?.baseURL
      }
    });
    return Promise.reject(error);
  }
);

// Mock adapter set to passthrough mode to allow all real requests
export const mock = new AxiosMockAdapter(axiosInt, { delayResponse: 0, onNoMatch: 'passthrough' });

export default axiosInt;
